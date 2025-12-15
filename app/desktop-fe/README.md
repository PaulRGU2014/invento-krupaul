This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Internationalization (i18n)

The app supports English and Thai with locale detection and a language switcher.

- Message catalogs: `src/i18n/en.json` (source), `src/i18n/generated/th.json` (auto), `src/i18n/overrides/th.json` (manual fixes).
- Provider: `src/lib/i18n.tsx` merges Thai generated + overrides.
- Switcher: `src/components/language-switcher.tsx` sets `locale` cookie and updates UI.
- Middleware: `middleware.ts` detects from `Accept-Language` and persists cookie.

### Generate Thai translations

Requires Google Cloud Translate credentials.

1. Set environment variables:

```bash
export GOOGLE_PROJECT_ID=your-gcp-project-id
export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

2. Install dependencies and run the translator:

```bash
npm install
npm run i18n:translate:th
```

3. Start the app:

```bash
npm run dev
```

### Manual Thai corrections

Edit `src/i18n/overrides/th.json`. Overrides always win over generated entries.

### Adding new strings

- Add English keys in `src/i18n/en.json`.
- Run `npm run i18n:translate:th` to fill missing Thai keys.
- Verify pages and adjust overrides if needed.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
