# Save2740 Frontend (Next.js)

Frontend application for Save2740 savings platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
Copy `.env.local.example` to `.env.local` and update:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Start development server:
```bash
npm run dev
```

The application will run on http://localhost:3000

## Backend Connection

The frontend connects to the backend API at the URL specified in `NEXT_PUBLIC_API_URL`.

- Development: `http://localhost:5000`
- Production: Set to your deployed backend URL

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Radix UI Components
- React Hook Form
- Zod Validation

## Project Structure

```
frontend/
├── app/              # Next.js app directory (pages & routing)
├── components/       # Reusable UI components
├── lib/              # Utilities and helpers
├── hooks/            # Custom React hooks
├── context/          # React context providers
├── public/           # Static assets
└── styles/           # Global styles
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run lint` - Run ESLint

## Deployment

Recommended: Deploy to Vercel

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

Make sure to set `NEXT_PUBLIC_API_URL` to your production backend URL.
