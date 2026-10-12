# Lakho School: website and portal

Next.js (App Router) + TypeScript + Tailwind, PostgreSQL via Prisma, Auth.js logins with roles.
Test hosting: Netlify (app) + Neon (database). Both have free tiers.

## Status

**Step 1: foundation**
- Public homepage (`/`) and login (`/login`)
- Role-based portal (`/portal`) for Admin, Principal, Teacher, Accountant, Student, Parent
- Prisma schema and seed script with demo users (demo data only)

**Phase 1: core school data** (Admin and Principal can manage; Teachers and Accountants can view)
- Users: create, enable/disable, reset password (`/portal/admin/users`)
- Teachers: add and list (`/portal/teachers`)
- Classes: create with a class teacher, class roster (`/portal/classes`)
- Students: admission form with parent linking, list with class filter, profile (`/portal/students`).
  A student can open their own profile and a parent their child's.

## First-time setup (any device)

1. Install Node.js 22 and Git, then clone this repo and run `npm install`
   (this also runs `prisma generate`).
2. Create a Neon project. Copy the **pooled** and **direct** connection strings.
3. `cp .env.example .env` and fill in `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`
   (generate with `npx auth secret` or `openssl rand -base64 32`).
4. Tables: the initial migration is in `prisma/migrations`. The test Neon database already has it applied
   and holds demo data. For a fresh database run `npm run db:deploy`, then `npm run db:seed`.
   When you change `prisma/schema.prisma`, run `npm run db:migrate -- --name what_changed` and commit the new folder.
5. `npm run dev`, then open http://localhost:3000

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
