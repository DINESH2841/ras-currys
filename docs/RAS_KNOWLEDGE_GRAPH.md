# RasCurrys knowledge graph

Last reviewed: 2026-11-04. This graph describes repository-verified behavior;
external provider configuration must be verified in its own dashboard.

```text
Browser (Vite/React on Vercel)
  ├─ VITE_API_BASE_URL ──> Express API (Render)
  ├─ public catalog ──> /api/products
  ├─ authenticated account, orders, tickets ──> bearer JWT API routes
  └─ AI chat/admin descriptions ──> /api/ai ──> Groq

Express API (Render)
  ├─ MONGODB_URI ──> MongoDB
  │   ├─ User ──> OTP state, verification-reminder timestamp
  │   ├─ Product ──> catalog and authoritative checkout pricing
  │   ├─ Order ──> user-owned orders and payment state
  │   └─ Ticket ──> user-owned support tickets
  ├─ SMTP_USER / SMTP_PASS ──> ras.currys@gmail.com
  │   └─ registration OTP, password reset, welcome, verification reminders
  ├─ RESEND_API_KEY ──> Resend
  │   └─ noreply@rascurrys.store ──> order and payment-status notices
  └─ GROQ_API_KEY ──> Groq chat completion API
```

## Access boundaries

| Resource | Public access | Authenticated user | Administrator |
|---|---|---|---|
| Products | Read | Read | Create, update, delete |
| Users | None | Own profile only | User lookup where permitted |
| Orders | None | Own orders only | All orders and status updates |
| Tickets | None | Own tickets only | All tickets |
| AI support chat | Rate-limited | Rate-limited | Product-description generation |

Server authorization is authoritative. Browser route guards are convenience UI
only and must not be considered an access-control boundary.

## Scheduled verification reminders

When `ENABLE_VERIFICATION_REMINDER_SWEEP=true`, the backend looks for accounts
unverified for at least 24 hours and sends at most
`VERIFICATION_REMINDER_DAILY_LIMIT` reminders in a UTC day. The implementation
hard-caps this value at 50 and stores daily usage in MongoDB.

## Deployment configuration

| Service | Required public configuration | Private configuration |
|---|---|---|
| Vercel | `VITE_API_BASE_URL=https://api.rascurrys.store/api` | None in `VITE_*` |
| Render | `FRONTEND_URLS` | MongoDB, JWT, SMTP, Resend, Groq, OTP secrets |

No private secret belongs in Git, browser code, Vercel `VITE_*`, or client-side
storage. `backend/.env` is intentionally ignored by Git.
