# StorTrack

A comprehensive, web-based retail management and point-of-sale (POS) application. Built with React + Vite and powered by Supabase.

## Features

- **Sales & POS** — Create sales with line items, track partial payments, manage delivery status, and view customer history.
- **Inventory Management** — Track products and variants (sizes/colors), monitor stock levels, and receive automatic adjustments on sales and vendor purchases.
- **Vendor Management** — Manage suppliers, log purchase orders, and track outstanding payables.
- **Financial Reporting** — Monthly P&L statements, expense tracking, salesperson performance, and commission calculator.
- **Audit Logs** — Every data change is logged with a reason and before/after snapshot.
- **CSV Export** — Export sales, expenses, and P&L data to CSV.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email/Password) |
| Hosting | Vercel / Netlify |

## Getting Started

### 1. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Navigate to **SQL Editor** and run the full contents of [`supabase-schema.sql`](./supabase-schema.sql).
3. Navigate to **Authentication → Users** and create your first user account.

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in your values in `.env.local`:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Both values are found in your Supabase project under **Settings → API**.

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with the user you created in Supabase.

## Deployment

### Vercel (Recommended)

1. Push this repository to GitHub.
2. Import the project in [vercel.com](https://vercel.com).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Environment Variables in the Vercel project settings.
4. Deploy.

### Netlify

The `netlify.toml` file is already configured. Add the same environment variables in your Netlify site settings.

## Security Notes

- The Supabase anonymous key is intentionally exposed in the frontend bundle — this is standard practice. Your data is protected by **Row Level Security (RLS)** policies that restrict all access to authenticated users only.
- Never share your Supabase **service_role** key; it bypasses RLS and should only be used in trusted server-side environments.
