import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { cors } from 'hono/cors'
import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'

type Env = {
  DB: D1Database
  JWT_SECRET: string
}

type AppContext = {
  Bindings: Env
  Variables: {
    userId: number
  }
}

type JwtPayload = {
  sub: string
  email: string
  exp: number
  iat: number
}

type UserRecord = {
  id: number
  email: string
  password_hash: string
}

type TransactionType = 'expense' | 'income'

type TransactionRecord = {
  id: string
  user_id: number
  amount: number
  category: string
  date_ts: number
  description: string | null
  type: TransactionType
  created_at: string
  updated_at: string
}

type CategoryStatRow = {
  category: string
  type: TransactionType
  total: number
}

type BalanceRow = {
  total_income: number | null
  total_expense: number | null
}

type TransactionPayload = {
  amount?: number
  category?: string
  date?: string
  description?: string | null
  type?: TransactionType
}

type RecurringTemplateRecord = {
  id: number
  user_id: number
  name: string
  amount: number
  category: string
  description: string | null
  type: TransactionType
  day_of_month: number
  is_active: number
  created_at: string
}

type RecurringTemplatePayload = {
  name?: string
  amount?: number
  category?: string
  description?: string | null
  type?: TransactionType
  dayOfMonth?: number
  isActive?: boolean
}

const ACCESS_TOKEN_COOKIE = 'fm_access_token'
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7
const PBKDF2_ITERATIONS = 10_000
const PBKDF2_KEY_BITS = 256

const app = new Hono<AppContext>()

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return ''
      if (
        origin === 'http://localhost:5173' ||
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.workers.dev')
      ) {
        return origin
      }
      return ''
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
)

const textEncoder = new TextEncoder()

const toBase64Url = (input: ArrayBuffer | Uint8Array): string => {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const fromBase64Url = (input: string): ArrayBuffer => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false
  }
  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

const signJwt = async (payload: JwtPayload, secret: string): Promise<string> => {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = toBase64Url(textEncoder.encode(JSON.stringify(header)))
  const encodedPayload = toBase64Url(textEncoder.encode(JSON.stringify(payload)))
  const unsignedToken = `${encodedHeader}.${encodedPayload}`

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, textEncoder.encode(unsignedToken))
  const encodedSignature = toBase64Url(signature)
  return `${unsignedToken}.${encodedSignature}`
}

const verifyJwt = async (token: string, secret: string): Promise<JwtPayload | null> => {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }
  const [headerPart, payloadPart, signaturePart] = parts
  const unsignedToken = `${headerPart}.${payloadPart}`

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const expectedSignatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    textEncoder.encode(unsignedToken),
  )
  const expectedSignature = toBase64Url(expectedSignatureBuffer)
  if (!timingSafeEqual(expectedSignature, signaturePart)) {
    return null
  }

  let payload: JwtPayload
  try {
    payload = JSON.parse(new TextDecoder().decode(new Uint8Array(fromBase64Url(payloadPart)))) as JwtPayload
  } catch {
    return null
  }

  if (!payload?.sub || !payload?.email || typeof payload.exp !== 'number') {
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp <= now) {
    return null
  }

  return payload
}

const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: PBKDF2_ITERATIONS,
    },
    passwordKey,
    PBKDF2_KEY_BITS,
  )
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(derivedBits)}`
}

const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const [scheme, iterationsText, saltEncoded, hashEncoded] = storedHash.split('$')
  if (scheme !== 'pbkdf2' || !iterationsText || !saltEncoded || !hashEncoded) {
    return false
  }
  const iterations = Number(iterationsText)
  if (!Number.isFinite(iterations) || iterations < 10_000) {
    return false
  }

  const salt = fromBase64Url(saltEncoded)
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    passwordKey,
    PBKDF2_KEY_BITS,
  )
  const derivedHashEncoded = toBase64Url(derivedBits)
  return timingSafeEqual(derivedHashEncoded, hashEncoded)
}

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255

const parseIsoDateToUnixSeconds = (isoDate: string): number | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return null
  }
  const [yearText, monthText, dayText] = isoDate.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null
  }
  const timestamp = Date.UTC(year, month - 1, day, 0, 0, 0, 0)
  const parsed = new Date(timestamp)
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }
  return Math.floor(timestamp / 1000)
}

const parseMonthToRange = (month: string): { startTs: number; endTs: number } | null => {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return null
  }
  const [yearText, monthText] = month.split('-')
  const year = Number(yearText)
  const monthIndex = Number(monthText) - 1
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return null
  }

  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0))
  if (start.getUTCFullYear() !== year || start.getUTCMonth() !== monthIndex) {
    return null
  }
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0))
  return {
    startTs: Math.floor(start.getTime() / 1000),
    endTs: Math.floor(end.getTime() / 1000),
  }
}

const serializeTransaction = (tx: TransactionRecord) => ({
  id: tx.id,
  userId: tx.user_id,
  amount: tx.amount,
  category: tx.category,
  dateTs: tx.date_ts,
  description: tx.description,
  type: tx.type,
  createdAt: tx.created_at,
  updatedAt: tx.updated_at,
})

const parseAndValidateTransactionPayload = (
  body: TransactionPayload | null,
): { data: { amount: number; category: string; dateTs: number; description: string | null; type: TransactionType } } | { error: string } => {
  const amount = body?.amount
  const category = body?.category?.trim()
  const date = body?.date?.trim()
  const type = body?.type
  const descriptionRaw = typeof body?.description === 'string' ? body.description.trim() : null
  const description = descriptionRaw ? descriptionRaw.slice(0, 500) : null

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return { error: 'Invalid payload. "amount" must be a positive number.' }
  }
  if (!category || category.length > 100) {
    return { error: 'Invalid payload. "category" is required and must be <= 100 chars.' }
  }
  if (type !== 'expense' && type !== 'income') {
    return { error: 'Invalid payload. "type" must be either "expense" or "income".' }
  }
  if (!date) {
    return { error: 'Invalid payload. "date" is required in YYYY-MM-DD format.' }
  }
  const dateTs = parseIsoDateToUnixSeconds(date)
  if (dateTs === null) {
    return { error: 'Invalid payload. "date" must be a valid YYYY-MM-DD string.' }
  }

  return {
    data: {
      amount,
      category,
      dateTs,
      description,
      type,
    },
  }
}

const parseAndValidateRecurringTemplatePayload = (
  body: RecurringTemplatePayload | null,
): {
  data: {
    name: string
    amount: number
    category: string
    description: string | null
    type: TransactionType
    dayOfMonth: number
    isActive: boolean
  }
} | { error: string } => {
  const name = body?.name?.trim()
  const amount = body?.amount
  const category = body?.category?.trim()
  const type = body?.type
  const dayOfMonth = body?.dayOfMonth
  const isActive = body?.isActive ?? true
  const descriptionRaw = typeof body?.description === 'string' ? body.description.trim() : null
  const description = descriptionRaw ? descriptionRaw.slice(0, 500) : null

  if (!name || name.length > 100) {
    return { error: 'Invalid payload. "name" is required and must be <= 100 chars.' }
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return { error: 'Invalid payload. "amount" must be a positive number.' }
  }
  if (!category || category.length > 100) {
    return { error: 'Invalid payload. "category" is required and must be <= 100 chars.' }
  }
  if (type !== 'expense' && type !== 'income') {
    return { error: 'Invalid payload. "type" must be either "expense" or "income".' }
  }
  if (typeof dayOfMonth !== 'number' || !Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    return { error: 'Invalid payload. "dayOfMonth" must be an integer between 1 and 31.' }
  }
  if (typeof isActive !== 'boolean') {
    return { error: 'Invalid payload. "isActive" must be a boolean.' }
  }

  return {
    data: {
      name,
      amount,
      category,
      description,
      type,
      dayOfMonth,
      isActive,
    },
  }
}

const serializeTemplate = (template: RecurringTemplateRecord) => ({
  id: template.id,
  userId: template.user_id,
  name: template.name,
  amount: template.amount,
  category: template.category,
  description: template.description,
  type: template.type,
  dayOfMonth: template.day_of_month,
  isActive: template.is_active === 1,
  createdAt: template.created_at,
})

const escapeCsvField = (value: string | number | null): string => {
  if (value === null) {
    return ''
  }
  const stringValue = String(value)
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

const readAuthToken = (c: Parameters<MiddlewareHandler<AppContext>>[0]): string | null => {
  const authorization = c.req.header('Authorization')
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice('Bearer '.length).trim()
    if (token) return token
  }

  const fromCookie = getCookie(c, ACCESS_TOKEN_COOKIE)
  if (fromCookie && fromCookie.trim().length > 0) {
    return fromCookie
  }

  return null
}

const authMiddleware: MiddlewareHandler<AppContext> = async (c, next) => {
  const token = readAuthToken(c)
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const payload = await verifyJwt(token, c.env.JWT_SECRET)
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const userId = Number(payload.sub)
  if (!Number.isInteger(userId) || userId <= 0) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('userId', userId)
  await next()
}

app.use('/transactions/*', authMiddleware)
app.use('/transactions', authMiddleware)
app.use('/stats/*', authMiddleware)
app.use('/stats', authMiddleware)
app.use('/templates/*', authMiddleware)
app.use('/templates', authMiddleware)
app.use('/export/*', authMiddleware)
app.use('/export', authMiddleware)

app.get('/health', (c) => c.json({ ok: true }))

app.get('/', (c) =>
  c.json({
    service: 'finance-manager-api',
    status: 'ready',
    version: 'mvp-bootstrap',
  }),
)

app.post('/auth/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>().catch(() => null)
  const email = body?.email?.trim().toLowerCase()
  const password = body?.password

  if (!email || !password) {
    return c.json({ error: 'Email and password are required.' }, 400)
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1',
  )
    .bind(email)
    .first<UserRecord>()

  if (!user) {
    return c.json({ error: 'Invalid credentials.' }, 401)
  }

  const isValidPassword = await verifyPassword(password, user.password_hash)
  if (!isValidPassword) {
    return c.json({ error: 'Invalid credentials.' }, 401)
  }

  const now = Math.floor(Date.now() / 1000)
  const token = await signJwt(
    {
      sub: String(user.id),
      email: user.email,
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_SECONDS,
    },
    c.env.JWT_SECRET,
  )

  const isSecure = c.req.url.startsWith('https://')

  setCookie(c, ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax',
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  })

  return c.json({ user: { id: user.id, email: user.email }, token })
})

app.post('/auth/logout', (c) => {
  deleteCookie(c, ACCESS_TOKEN_COOKIE, {
    path: '/',
  })
  return c.json({ ok: true })
})

app.get('/auth/me', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const user = await c.env.DB.prepare('SELECT id, email, created_at FROM users WHERE id = ? LIMIT 1')
    .bind(userId)
    .first<{ id: number; email: string; created_at: string }>()

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
    },
  })
})

app.get('/transactions', async (c) => {
  const userId = c.get('userId')
  const month = c.req.query('month')
  if (!month) {
    return c.json({ error: 'Query param "month" is required (YYYY-MM).' }, 400)
  }

  const range = parseMonthToRange(month)
  if (!range) {
    return c.json({ error: 'Invalid "month" format. Use YYYY-MM.' }, 400)
  }

  const rows = await c.env.DB.prepare(
    `
      SELECT id, user_id, amount, category, date_ts, description, type, created_at, updated_at
      FROM transactions
      WHERE user_id = ? AND date_ts >= ? AND date_ts < ?
      ORDER BY date_ts ASC, created_at ASC
    `,
  )
    .bind(userId, range.startTs, range.endTs)
    .all<TransactionRecord>()

  return c.json({
    transactions: (rows.results ?? []).map(serializeTransaction),
  })
})

app.get('/transactions/day', async (c) => {
  const userId = c.get('userId')
  const date = c.req.query('date')
  if (!date) {
    return c.json({ error: 'Query param "date" is required (YYYY-MM-DD).' }, 400)
  }

  const startTs = parseIsoDateToUnixSeconds(date)
  if (startTs === null) {
    return c.json({ error: 'Invalid "date" format. Use YYYY-MM-DD.' }, 400)
  }
  const endTs = startTs + 24 * 60 * 60

  const rows = await c.env.DB.prepare(
    `
      SELECT id, user_id, amount, category, date_ts, description, type, created_at, updated_at
      FROM transactions
      WHERE user_id = ? AND date_ts >= ? AND date_ts < ?
      ORDER BY created_at ASC
    `,
  )
    .bind(userId, startTs, endTs)
    .all<TransactionRecord>()

  return c.json({
    transactions: (rows.results ?? []).map(serializeTransaction),
  })
})

app.post('/transactions', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<TransactionPayload>().catch(() => null)
  const parsed = parseAndValidateTransactionPayload(body)
  if ('error' in parsed) {
    return c.json({ error: parsed.error }, 400)
  }

  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    `
      INSERT INTO transactions (id, user_id, amount, category, date_ts, description, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(
      id,
      userId,
      parsed.data.amount,
      parsed.data.category,
      parsed.data.dateTs,
      parsed.data.description,
      parsed.data.type,
    )
    .run()

  const created = await c.env.DB.prepare(
    `
      SELECT id, user_id, amount, category, date_ts, description, type, created_at, updated_at
      FROM transactions
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
  )
    .bind(id, userId)
    .first<TransactionRecord>()

  return c.json({ transaction: created ? serializeTransaction(created) : null }, 201)
})

app.put('/transactions/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  if (!id) {
    return c.json({ error: 'Transaction id is required.' }, 400)
  }

  const body = await c.req.json<TransactionPayload>().catch(() => null)
  const parsed = parseAndValidateTransactionPayload(body)
  if ('error' in parsed) {
    return c.json({ error: parsed.error }, 400)
  }

  const existing = await c.env.DB.prepare('SELECT id FROM transactions WHERE id = ? AND user_id = ? LIMIT 1')
    .bind(id, userId)
    .first<{ id: string }>()
  if (!existing) {
    return c.json({ error: 'Transaction not found.' }, 404)
  }

  await c.env.DB.prepare(
    `
      UPDATE transactions
      SET amount = ?, category = ?, date_ts = ?, description = ?, type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `,
  )
    .bind(
      parsed.data.amount,
      parsed.data.category,
      parsed.data.dateTs,
      parsed.data.description,
      parsed.data.type,
      id,
      userId,
    )
    .run()

  const updated = await c.env.DB.prepare(
    `
      SELECT id, user_id, amount, category, date_ts, description, type, created_at, updated_at
      FROM transactions
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
  )
    .bind(id, userId)
    .first<TransactionRecord>()

  return c.json({ transaction: updated ? serializeTransaction(updated) : null })
})

app.delete('/transactions/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  if (!id) {
    return c.json({ error: 'Transaction id is required.' }, 400)
  }

  const result = await c.env.DB.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run()
  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: 'Transaction not found.' }, 404)
  }

  return c.json({ ok: true })
})

app.get('/stats/month', async (c) => {
  const userId = c.get('userId')
  const month = c.req.query('month')
  if (!month) {
    return c.json({ error: 'Query param "month" is required (YYYY-MM).' }, 400)
  }

  const range = parseMonthToRange(month)
  if (!range) {
    return c.json({ error: 'Invalid "month" format. Use YYYY-MM.' }, 400)
  }

  const categoryRows = await c.env.DB.prepare(
    `
      SELECT category, type, SUM(amount) AS total
      FROM transactions
      WHERE user_id = ? AND date_ts >= ? AND date_ts < ?
      GROUP BY category, type
      ORDER BY total DESC, category ASC
    `,
  )
    .bind(userId, range.startTs, range.endTs)
    .all<CategoryStatRow>()

  const summary = await c.env.DB.prepare(
    `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
      FROM transactions
      WHERE user_id = ? AND date_ts >= ? AND date_ts < ?
    `,
  )
    .bind(userId, range.startTs, range.endTs)
    .first<BalanceRow>()

  const totalIncome = summary?.total_income ?? 0
  const totalExpense = summary?.total_expense ?? 0

  return c.json({
    month,
    totals: {
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense,
    },
    categories: (categoryRows.results ?? []).map((row) => ({
      category: row.category,
      type: row.type,
      total: row.total ?? 0,
    })),
  })
})

app.get('/stats/balance', async (c) => {
  const userId = c.get('userId')

  const summary = await c.env.DB.prepare(
    `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
      FROM transactions
      WHERE user_id = ?
    `,
  )
    .bind(userId)
    .first<BalanceRow>()

  const totalIncome = summary?.total_income ?? 0
  const totalExpense = summary?.total_expense ?? 0

  return c.json({
    totals: {
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense,
    },
  })
})

app.get('/export/csv', async (c) => {
  const userId = c.get('userId')
  const from = c.req.query('from')
  const to = c.req.query('to')
  if (!from || !to) {
    return c.json({ error: 'Query params "from" and "to" are required (YYYY-MM-DD).' }, 400)
  }

  const fromTs = parseIsoDateToUnixSeconds(from)
  const toTs = parseIsoDateToUnixSeconds(to)
  if (fromTs === null || toTs === null) {
    return c.json({ error: 'Invalid date format. Use YYYY-MM-DD for both "from" and "to".' }, 400)
  }
  if (fromTs > toTs) {
    return c.json({ error: '"from" must be earlier than or equal to "to".' }, 400)
  }

  const rows = await c.env.DB.prepare(
    `
      SELECT id, amount, category, date_ts, description, type, created_at, updated_at
      FROM transactions
      WHERE user_id = ? AND date_ts >= ? AND date_ts < ?
      ORDER BY date_ts ASC, created_at ASC
    `,
  )
    .bind(userId, fromTs, toTs + 24 * 60 * 60)
    .all<Pick<TransactionRecord, 'id' | 'amount' | 'category' | 'date_ts' | 'description' | 'type' | 'created_at' | 'updated_at'>>()

  const header = ['id', 'amount', 'category', 'date', 'description', 'type', 'created_at', 'updated_at']
  const lines = [header.join(',')]

  for (const tx of rows.results ?? []) {
    const date = new Date(tx.date_ts * 1000).toISOString().slice(0, 10)
    lines.push(
      [
        escapeCsvField(tx.id),
        escapeCsvField(tx.amount),
        escapeCsvField(tx.category),
        escapeCsvField(date),
        escapeCsvField(tx.description),
        escapeCsvField(tx.type),
        escapeCsvField(tx.created_at),
        escapeCsvField(tx.updated_at),
      ].join(','),
    )
  }

  const csv = `${lines.join('\n')}\n`
  const fileName = `transactions-${from}-to-${to}.csv`
  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', `attachment; filename="${fileName}"`)
  return c.body(csv)
})

app.get('/templates', async (c) => {
  const userId = c.get('userId')
  const rows = await c.env.DB.prepare(
    `
      SELECT id, user_id, name, amount, category, description, type, day_of_month, is_active, created_at
      FROM recurring_templates
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
    `,
  )
    .bind(userId)
    .all<RecurringTemplateRecord>()

  return c.json({
    templates: (rows.results ?? []).map(serializeTemplate),
  })
})

app.post('/templates', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<RecurringTemplatePayload>().catch(() => null)
  const parsed = parseAndValidateRecurringTemplatePayload(body)
  if ('error' in parsed) {
    return c.json({ error: parsed.error }, 400)
  }

  const result = await c.env.DB.prepare(
    `
      INSERT INTO recurring_templates (user_id, name, amount, category, description, type, day_of_month, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(
      userId,
      parsed.data.name,
      parsed.data.amount,
      parsed.data.category,
      parsed.data.description,
      parsed.data.type,
      parsed.data.dayOfMonth,
      parsed.data.isActive ? 1 : 0,
    )
    .run()

  const createdId = Number(result.meta.last_row_id)
  const created = await c.env.DB.prepare(
    `
      SELECT id, user_id, name, amount, category, description, type, day_of_month, is_active, created_at
      FROM recurring_templates
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
  )
    .bind(createdId, userId)
    .first<RecurringTemplateRecord>()

  return c.json({ template: created ? serializeTemplate(created) : null }, 201)
})

app.put('/templates/:id', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'Template id must be a positive integer.' }, 400)
  }

  const body = await c.req.json<RecurringTemplatePayload>().catch(() => null)
  const parsed = parseAndValidateRecurringTemplatePayload(body)
  if ('error' in parsed) {
    return c.json({ error: parsed.error }, 400)
  }

  const existing = await c.env.DB.prepare(
    'SELECT id FROM recurring_templates WHERE id = ? AND user_id = ? LIMIT 1',
  )
    .bind(id, userId)
    .first<{ id: number }>()
  if (!existing) {
    return c.json({ error: 'Template not found.' }, 404)
  }

  await c.env.DB.prepare(
    `
      UPDATE recurring_templates
      SET name = ?, amount = ?, category = ?, description = ?, type = ?, day_of_month = ?, is_active = ?
      WHERE id = ? AND user_id = ?
    `,
  )
    .bind(
      parsed.data.name,
      parsed.data.amount,
      parsed.data.category,
      parsed.data.description,
      parsed.data.type,
      parsed.data.dayOfMonth,
      parsed.data.isActive ? 1 : 0,
      id,
      userId,
    )
    .run()

  const updated = await c.env.DB.prepare(
    `
      SELECT id, user_id, name, amount, category, description, type, day_of_month, is_active, created_at
      FROM recurring_templates
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
  )
    .bind(id, userId)
    .first<RecurringTemplateRecord>()

  return c.json({ template: updated ? serializeTemplate(updated) : null })
})

app.delete('/templates/:id', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'Template id must be a positive integer.' }, 400)
  }

  const result = await c.env.DB.prepare('DELETE FROM recurring_templates WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run()
  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: 'Template not found.' }, 404)
  }

  return c.json({ ok: true })
})

app.post('/templates/:id/create-transaction', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'Template id must be a positive integer.' }, 400)
  }

  const template = await c.env.DB.prepare(
    `
      SELECT id, user_id, name, amount, category, description, type, day_of_month, is_active, created_at
      FROM recurring_templates
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
  )
    .bind(id, userId)
    .first<RecurringTemplateRecord>()

  if (!template) {
    return c.json({ error: 'Template not found.' }, 404)
  }
  if (template.is_active !== 1) {
    return c.json({ error: 'Template is inactive.' }, 400)
  }

  const body = await c.req.json<{ date?: string }>().catch(() => null)
  const requestedDate = body?.date?.trim()
  const generatedDate = requestedDate ?? new Date().toISOString().slice(0, 10)
  const dateTs = parseIsoDateToUnixSeconds(generatedDate)
  if (dateTs === null) {
    return c.json({ error: 'Invalid payload. "date" must be a valid YYYY-MM-DD string.' }, 400)
  }

  const txId = crypto.randomUUID()
  await c.env.DB.prepare(
    `
      INSERT INTO transactions (id, user_id, amount, category, date_ts, description, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(
      txId,
      userId,
      template.amount,
      template.category,
      dateTs,
      template.description,
      template.type,
    )
    .run()

  const created = await c.env.DB.prepare(
    `
      SELECT id, user_id, amount, category, date_ts, description, type, created_at, updated_at
      FROM transactions
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
  )
    .bind(txId, userId)
    .first<TransactionRecord>()

  return c.json({ transaction: created ? serializeTransaction(created) : null }, 201)
})

export default app
