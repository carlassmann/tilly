# Syntwin integration

The website loads Carl's Syntwin through `src/shared/ui/syntwin-embed.astro`. The app loads it through `src/app/components/syntwin-guide.tsx` once the account locale is known. The script stays outside the React router. Syntwin restores the conversation across full page loads on the same origin.

Both scripts set `data-context` to identify website exploration or in-app help. The attribute contains no account or journal data. Syntwin manages the greeting and conversation behavior.

The website has a CTA below the hero and a floating launcher. Fresh app visits open the guide through Settings → Help → Talk to Carl's AI twin. The app uses `data-launcher="none"`; Syntwin keeps a launcher for an ongoing conversation carried from the website. The Settings button uses `data-syntwin-open`.

## Configuration

- Public room: https://my.syntwin.ai/app/d/j97dc3ekdfj0hffadfwwqb19w98h3q3m
- Room settings: https://my.syntwin.ai/app/deploy/j97dc3ekdfj0hffadfwwqb19w98h3q3m?settings=room
- Embed script: https://my.syntwin.ai/omny.js

Room instructions, knowledge sources, source access, notifications and test mode are managed in Syntwin. Edit them there. This repository documents the integration and Tilly's product behavior.

`PUBLIC_SYNTWIN_ROOM_ID` defaults to Carl's Tilly room. Set it to another room for your own deployment. Set `PUBLIC_SYNTWIN_ENABLED=false` to disable the script, website CTA and Settings Help section. An empty room ID is not an off switch: Astro treats empty environment variables as unset and restores the default. No Syntwin secret belongs in Tilly.

Launcher appearance, interaction modes and page permissions come from the room's Omny settings. The embed starts in the page's language and retains the conversation language across navigation. The room's operator privacy notice points to https://tilly.social/en/privacy.

Account controls are hidden with `data-syntwin-hidden`. Sign-in and bulk data controls use `data-syntwin-readonly`. `data-syntwin-avoid="0px"` on the hero actions folds the launcher while those actions are visible on phones. Its value is an IntersectionObserver margin.

## Local verification

In a fresh worktree, run `work setup` before `work up`. Use `work urls` to find the local website. The embed connects to production Syntwin. Use a separate test room and fictional journal details for automated or exploratory conversations.

Check a fresh website conversation and a fresh app conversation from Settings Help. Verify that website-to-app navigation keeps the session and sends the app context. Check an ongoing minimized call, English and German, declined and revoked page access, and phone layouts. Do not clear site data to restart a conversation, because that can erase anonymous journal entries.

written with gpt-6.1-sol in Codex
