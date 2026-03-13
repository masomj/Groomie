# Pampered Pooch Porthcawl

Professional dog grooming web application built with Nuxt 3, Prisma, and PostgreSQL.

## Tech Stack

- **Nuxt 3** (TypeScript, full-stack)
- **Tailwind CSS** for styling
- **Prisma ORM** with PostgreSQL
- **Docker** (planned for later phases)

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL (local or Docker)

## Setup

```bash
# Install dependencies
npm install

# Copy environment file and configure DATABASE_URL
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations (requires running PostgreSQL)
npx prisma migrate dev

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

## Project Structure

```
├── components/       # Reusable Vue components
├── layouts/          # Page layouts (navbar, footer)
├── pages/            # File-based routing
│   ├── index.vue     # Home page
│   ├── services.vue  # Services detail
│   ├── pricing.vue   # Pricing guide
│   ├── about.vue     # About page
│   ├── contact.vue   # Contact form (placeholder)
│   └── privacy.vue   # Privacy policy placeholder
├── prisma/
│   └── schema.prisma # Database schema
├── server/
│   └── utils/        # Server utilities (Prisma client)
└── assets/css/       # Global styles
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma migrate dev` | Run pending migrations |

## Assumptions (Phase 1)

- Pricing is placeholder and approximate; exact pricing will come from the database in Phase 2.
- Contact form is a visual placeholder; server-side handling comes in a later phase.
- No authentication or admin features yet.
- Dog image from the original site is not included; a placeholder reference is used.
