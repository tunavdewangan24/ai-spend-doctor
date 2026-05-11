\# Architecture



AI Spend Doctor is built with Next.js and TypeScript. The frontend contains the landing page, audit form, and results section. The audit logic is separated inside the lib folder so it can be tested independently.



\## Flow



User opens the site, enters AI tool spending details, and the app calculates possible savings using the audit engine. Lead data can be stored using Supabase.



\## Main parts



\- Next.js App Router for pages and API routes

\- Tailwind CSS for UI

\- Supabase for lead capture

\- Vitest for testing

\- GitHub Actions for CI

\- Vercel for deployment

