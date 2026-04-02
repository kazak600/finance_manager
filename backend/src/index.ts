import { Hono } from 'hono'

type Env = {
  DB: D1Database
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Env }>()

app.get('/health', (c) => c.json({ ok: true }))

app.get('/', (c) =>
  c.json({
    service: 'finance-manager-api',
    status: 'ready',
    version: 'mvp-bootstrap',
  }),
)

export default app
