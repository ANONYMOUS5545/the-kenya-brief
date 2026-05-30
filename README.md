# The Kenya Brief — Professional News Platform

A full-stack, production-ready news platform built with Next.js 16, TypeScript, Prisma, PostgreSQL, and Tailwind CSS v4.

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and NEXTAUTH_SECRET
```

### 3. Set up database
```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to DB
npm run db:seed       # Seed demo data
```

### 4. Start development server
```bash
npm run dev
```

Open http://localhost:3000

## Demo Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kenyabrief.co.ke | Admin@1234 |
| Senior Editor | senior@kenyabrief.co.ke | Editor@1234 |
| Junior Editor | junior@kenyabrief.co.ke | Junior@1234 |

## Key URLs

- `/` — Homepage
- `/admin/dashboard` — Admin panel
- `/editor/dashboard` — Editor portal
- `/login` — Sign in

## Deploy to Vercel

1. Push to GitHub
2. Import on vercel.com
3. Add environment variables (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET)
4. Deploy

Full documentation: see README.md in project root.
