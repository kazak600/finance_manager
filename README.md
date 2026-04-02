# Finance Manager

Monorepo для MVP Finance Manager:
- `frontend` - React + Vite + Tailwind
- `backend` - Cloudflare Worker API (Hono + D1)

## Передумови

- Node.js 20+ (рекомендовано LTS)
- npm 10+
- Cloudflare акаунт
- Wrangler CLI (встановлюється з devDependencies)

## 1) Встановлення залежностей

З кореня проєкту:

```bash
npm install
```

## 2) Налаштування Cloudflare D1

1. Увійди в Cloudflare:

```bash
npx wrangler login
```

2. Створи D1 базу:

```bash
npx wrangler d1 create finance-manager-db
```

3. Скопіюй `database_id` з відповіді команди і встав у `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "finance-manager-db"
database_id = "YOUR_DATABASE_ID"
```

4. За потреби онови секрет для JWT у `wrangler.toml`:

```toml
[vars]
JWT_SECRET = "your-local-dev-secret"
```

## 3) Застосування міграцій

Локально:

```bash
npx wrangler d1 migrations apply finance-manager-db --local --config wrangler.toml
```

Для remote БД:

```bash
npx wrangler d1 migrations apply finance-manager-db --remote --config wrangler.toml
```

## 4) Запуск проєкту локально

Запусти API (Worker):

```bash
npm run dev:backend
```

В окремому терміналі запусти frontend:

```bash
npm run dev:frontend
```

Після запуску:
- Frontend: `http://localhost:5173`
- Backend: Wrangler покаже локальний URL у консолі (зазвичай `http://localhost:8787`)

## Корисні команди

```bash
# збірка frontend
npm run build

# перевірка типів backend
npm run typecheck
```

## API: Stats

Усі endpoint-и нижче потребують авторизації (cookie `fm_access_token` або `Authorization: Bearer <token>`).

### `GET /stats/month?month=YYYY-MM`

Повертає місячну зведену статистику:
- сума доходів
- сума витрат
- баланс за місяць
- суми по категоріях (окремо для `income`/`expense`)

Приклад відповіді:

```json
{
  "month": "2026-04",
  "totals": {
    "income": 2450,
    "expense": 1280.5,
    "balance": 1169.5
  },
  "categories": [
    { "category": "Salary", "type": "income", "total": 2200 },
    { "category": "Food", "type": "expense", "total": 420.5 }
  ]
}
```

### `GET /stats/balance`

Повертає загальний баланс користувача за всі транзакції.

Приклад відповіді:

```json
{
  "totals": {
    "income": 8120,
    "expense": 5340.2,
    "balance": 2779.8
  }
}
```
