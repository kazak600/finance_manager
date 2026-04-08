import crypto from 'node:crypto';

const PBKDF2_ITERATIONS = 10_000;
const PBKDF2_KEY_BITS = 256;

const toBase64Url = (buf) => {
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derivedBits = crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEY_BITS / 8,
    'sha256'
  );
  
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(derivedBits)}`;
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/add-user.js <email> <password>');
  process.exit(1);
}

const [email, password] = args;

(async () => {
  const hash = await hashPassword(password);
  const sql = `INSERT INTO users (email, password_hash) VALUES ("${email.toLowerCase()}", "${hash}");`;
  
  console.log('\n--- ГЕНЕРОВАНИЙ SQL ЗАПИТ ---');
  console.log(sql);
  console.log('\n--- ЯК ВИКОНАТИ ЛОКАЛЬНО ---');
  console.log(`npx wrangler d1 execute finance-manager-db --local --command='${sql}'`);
  console.log('\n--- ЯК ВИКОНАТИ ДЛЯ REMOTE БАЗИ ---');
  console.log(`npx wrangler d1 execute finance-manager-db --remote --command='${sql}'`);
})();
