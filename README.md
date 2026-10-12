# Lakho School: website and portal

Next.js (App Router) + TypeScript + Tailwind, PostgreSQL via Prisma, Auth.js logins with roles.
Test hosting: Netlify (app) + Neon (database). Both have free tiers.

## Status (Step 1: foundation)

- Public homepage (`/`) and login (`/login`)
- Role-based portal (`/portal`) for Admin, Principal, Teacher, Accountant, Student, Parent
- Admin/Principal user list (`/portal/admin/users`)
- Prisma schema: users, teachers, guardians, students, classes, announcements
- Seed script with demo users (demo data only)

## First-time setup (any device)

1. Install Node.js 22 and Git, then clone this repo and run `npm install`
   (this also runs `prisma generate`).
2. Create a Neon project. Copy the **pooled** and **direct** connection strings.
3. `cp .env.example .env` and fill in `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`
   (generate with `npx auth secret` or `openssl rand -base64 32`).
4. Create the tables: `npm run db:migrate -- --name init` (creates `prisma/migrations`, commit that folder).
5. Load demo users: `npm run db:seed`
6. `npm run dev`, then open http://localhost:3000

Demo logins (password is `SEED_PASSWORD`, default `ChangeMe123!`):
`admin@school.test`, `principal@school.test`, `teacher@school.test`,
`accountant@school.test`, `parent@school.test`, `student@school.test`

## Netlify

Netlify detects Next.js automatically. In Site configuration > Environment variables add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct connection string |
| `AUTH_SECRET` | the random secret |
| `AUTH_URL` | your `https://<site>.netlify.app` URL |

Every push to `main` deploys. Run `npm run db:deploy` from your computer to apply new migrations
to the Neon database (it is not run during the Netlify build).

## Security notes

- Never commit `.env`. Secrets live only in `.env` locally and in Netlify's settings.
- Passwords are hashed with bcrypt. Roles are enforced on the server (`requireRole`), not only in the UI.
- Use demo data only on the test site. Change `SEED_PASSWORD` and delete demo users before real use.

## Roadmap

1. Foundation (this step)
2. Classes, students, teachers, timetable
3. Attendance, announcements, exams and report cards
4. Fees and receipts
5. Full public website and online admissions
