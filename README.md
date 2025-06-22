# Heinicus Mobile Mechanic App

Welcome to the Heinicus Mobile Mechanic platform â€“ a full-stack, AI-enhanced mobile repair service app built with Next.js, tRPC, Prisma, Zustand, and Stripe. This README walks you through how to set up, run, and deploy the full application.

---

## ðŸš€ Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/GrizzlyRooster34/mobile-mechanic-app.git
cd mobile-mechanic-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create a `.env.local` file and add:
```
JWT_SECRET=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
DATABASE_URL=
NEXT_PUBLIC_CHATBASE_BOT_ID=
CHATBASE_API_KEY=
CHATBASE_WEBHOOK_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
```

### 4. Setup the database
```bash
npx prisma generate
npx prisma db push
```

### 5. Run the development server
```bash
npm run dev
```

---

## ðŸ§  Key Features

- Real-time job tracking with start/pause/stop
- Signature capture on job completion
- AI-enhanced customer support via Chatbase
- VIN-based service assistant
- Full Stripe integration for parts and job payments

---

## ðŸ“¦ Folder Structure

- `components/` â€“ UI elements
- `pages/` â€“ Next.js page routes
- `server/` â€“ tRPC backend logic
- `store/` â€“ Zustand state management
- `prisma/` â€“ Database schema
- `types/` â€“ TypeScript types
- `utils/` â€“ Helper functions
- `styles/` â€“ TailwindCSS and global styles

---

## ðŸ“± Deployment

- Test locally: `http://localhost:3000`
- Deploy with Rork or Vercel
- Optional: Setup as PWA for offline mobile use

---

## ðŸ¤– AI & Webhooks

Ensure Chatbase keys are live. Responses are context-aware with quick actions and job handoff suggestions.

---

## âš™ï¸ Commands

```bash
npm run dev          # Start local dev server
npm run build        # Build for production
npm run start        # Start production server
npx prisma studio    # View DB in browser
```

---

## ðŸ™Œ Credits

Built with grit by Cody & ChatGPT.
