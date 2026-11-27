<img src="./public/app/icons/icon-96x96.png" alt="Tilly" width="96" height="96" align="center">

# Tilly

Tilly is an open-source relationship journal that helps you stay connected with the people who matter most. Built as a React PWA with client-side sync, offline-first design, realtime collaboration, and optional agentic (and actually useful) AI assistance.

**Try it live:** [tilly.social](https://tilly.social)

<div align="center">
  <table>
    <tr>
      <td width="50%">
        <img src="./public/images/screenshots/en-chat.webp" alt="Tilly Chat demo showing conversation turning into organized memories" style="max-height: 400px; width: 100%; object-fit: contain;">
        <p><em>Tilly Chat: Turn conversations into organized memories and reminders</em></p>
      </td>
      <td width="50%">
        <img src="./public/images/screenshots/en-people.webp" alt="People list view" style="max-height: 400px; width: 100%; object-fit: contain;">
        <p><em>Your people, organized and accessible</em></p>
      </td>
    </tr>
  </table>
</div>

## What Problem Does This Solve?

Your friend mentions their job interview. You care deeply. But weeks pass, and you realize you never asked how it went. Tilly gives relationships their own space - not buried in contacts, todos, or notes - so you remember what matters and reach out at the right time.

There are other apps already. Tilly is my take on simplicity and joy of use. And the AI assistant makes it easy to keep going.

## Quick Start

```bash
git clone https://github.com/ccssmnn/tilly.git
cd tilly
bun install
bunx jazz-run sync              # start local sync server (keep running)
bun scripts/setup.ts            # interactive setup (in another terminal)
bun dev
```

## Setup

The setup script (`bun scripts/setup.ts`) auto-generates most credentials and prompts for external services:

**Auto-generated:**

- VAPID keys (push notifications)
- CRON_SECRET
- Jazz worker account (against local sync server)

**You need to provide:**

- **Clerk keys** - Authentication (create free account at clerk.com)
- **Google Gemini API key** - For Tilly Chat assistant (get from aistudio.google.com)

## Architecture

Tilly is a **React PWA** built with:

- **App**: React + TanStack Router + Shadcn/ui + Tailwind CSS
- **API Endpoints**: Astro serving marketing pages + Hono API routes
- **Database**: [Jazz](https://jazz.tools) - Client-side encrypted, distributed, offline-first, collaborative (keys managed via Clerk for multi-device use)
- **Auth**: Clerk
- **AI**: AI SDK with Google
- **Deployment**: Vercel

**Key Design**: Single Astro dev server hosts marketing site, PWA, and API routes together.

## Data & Privacy

**Encryption**: Data is encrypted in the browser before syncing to Jazz. Encryption keys are generated at signup and stored with Clerk so you can sign in from new devices. The Tilly server uses those keys only to deliver push notifications and power Tilly Assistant. Jazz never sees plaintext data and Clerk only stores the keys alongside your account metadata.

**Offline-First**: All data syncs through Jazz and works offline. AI assistant is the only feature requiring an active internet connection and shares the conversation you send with the AI provider.

**Data Control**: Full JSON export/import. No vendor lock-in. Move from or to your own hosted version anytime.

## Development

```bash
bunx jazz-run sync   # Start local sync server (keep running)
bun dev              # Start dev server (in another terminal)
bun build            # Build for production
bun check            # TypeScript compilation check
```

## Self-Hosting

Deploy to Vercel with your own:

- Clerk account (authentication)
- Jazz sync server (database)
- Google Gemini API key (assistant)
- VAPID keys (push notifications)

## Contributing

Feel free to file Issues to suggest features or report bugs. PR's are welcome!

## Security

Report suspected vulnerabilities privately by emailing [assmann@hey.com](mailto:assmann@hey.com) or DM to @ccssmnn on X; please avoid filing public issues until I respond.

## Cloudflare hosting

`bun run build:cloudflare` selects the Cloudflare adapter; other builds retain
the existing Vercel or Node adapter. `bun run deploy:cloudflare` deploys staging:
https://tilly-migration.assmann-568.workers.dev.

The Worker preserves app deep links and the Plausible proxy. Jazz workers belong
to one request and stay open until streaming chat ends or is cancelled. Server
credentials stay in Worker secrets; public build settings come from the existing
production environment. Do not commit environment files.

The scheduled handler invokes the existing authenticated notification route.
Staging deliberately has no cron trigger: Vercel still runs the hourly job.
Production uses `wrangler.production.jsonc` on the same Worker after staging
verification. It attaches only the apex and `www` routes. The apex redirects to
`www` with HTTP 307, preserving paths and queries. Keep the wildcard and Clerk
DNS records unchanged.

GitHub `main` builds automatically in Cloudflare. Set the deploy command to
`bunx wrangler deploy --config wrangler.production.jsonc` after verifying sign-in
and chat. The default command continues to deploy staging until then.

Disable the Vercel cron before adding `0 * * * *` to the production Wrangler
configuration. Keep Vercel available for rollback. Never enable both schedulers
together.

written with gpt-6.1-sol in Codex (T3 Code)

## License

MIT License - See LICENSE file for details.

## Status

Actively maintained and used daily by the creator. Available as a hosted service at [tilly.social](https://tilly.social) (30 day free trial + $6/month for Plus features) to make development sustainable and cover token costs.
