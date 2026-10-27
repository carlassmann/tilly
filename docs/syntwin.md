# Carl's Tilly guide

The website and app load Carl's live Syntwin through `src/shared/ui/syntwin-embed.astro`. The script stays outside the React router, so app navigation preserves the conversation. Syntwin restores the conversation across full page loads on the same origin.

The website shows the room's launcher. The app keeps an open conversation from the website, but shows no floating launcher when the guide is closed. Open it through **Settings → Help → Talk to Carl's AI twin**. The app uses `data-launcher="none"` and Syntwin's `data-syntwin-open-state` to show only the open conversation. The Settings button uses the embed's `data-syntwin-open` trigger.

- Public room: https://my.syntwin.ai/app/d/j97dc3ekdfj0hffadfwwqb19w98h3q3m
- Room settings: https://my.syntwin.ai/app/deploy/j97dc3ekdfj0hffadfwwqb19w98h3q3m?settings=omny
- Script: https://my.syntwin.ai/omny.js

`PUBLIC_SYNTWIN_ROOM_ID` defaults to this room. Set it to another room for your own deployment, or an empty string to disable the guide. No Syntwin secret belongs in Tilly. Launcher appearance, channels and page permissions come from the room's Omny settings.

## Room setup

The room uses Carl's existing portrait, voice and video replica, supports English and German in chat/audio/video, allows anonymous visitors, and does not collect email addresses. The embed starts in the website's language and retains the conversation language across navigation. Visitors switch with the conversation's language selector; Syntwin intentionally does not switch response language from message text alone. German answers and a switch to English were verified in session `jx79wpb5hqcsw727qjpm36zh898h30m4`. Only the Tilly background, hands-on guide, FAQ, reminder and personal-view sources are available; unrelated workspace sources are blocked.

Behavioral instructions are kept in [syntwin-room-instructions.md](syntwin-room-instructions.md). The uploaded walkthrough source is [syntwin-guide.md](syntwin-guide.md), source ID `k57a7qe7py57m0bcad2g064gm58h36cn`. Update the existing source when the product changes, preserving its identity.

The broader product FAQ is [syntwin-faq.md](syntwin-faq.md), source ID `k57efskj572rjxpsd6tykr3ag58h283p`. A focused reminder source is [syntwin-reminders.md](syntwin-reminders.md), source ID `k57dyvmepf5xsmh0bbwzb82bxd8h33mp` (external identity `docs/syntwin-faq.md#reminder-controls`). Carl's own views are [syntwin-personal-views.md](syntwin-personal-views.md), source ID `k5773yp233krrgdta67ndymbax8h23n1`, approved in conversation on 27 October 2026. These cover daily use, remembering friends, keeping notes and avoiding too many reminders. Do not infer additional roadmap promises or opinions. All five sources use searchable `mention` access. Supplying FAQ/guide as context and skipping lookups regressed factual answers in roleplay; require a fresh, silent search for each new product topic. Keep each source below 4,000 characters because observed knowledge-tool results truncate longer hits.

The Syntwin connector can edit room instructions and source access. Omny page access and launcher settings currently require the owner UI. Use **Click and type** for the hands-on walkthrough. Visitors still choose whether to allow page access.

Room email notifications are enabled for ended conversations. Visitors may leave feedback in chat, email assmann@hey.com, or create a public GitHub issue. The room has a GitHub issue CTA; email uses a Markdown mailto link because configured Syntwin CTAs accept only HTTP(S). Settings Help also has both links. Notification delivery and response times must not be promised.

Under **General → Edit**, set the room's privacy notice URL to https://tilly.social/en/privacy. This field is also unavailable through the connector.

## Local trial

Run `work up`, then `work urls`. Open the local web URL. The embed loads production Syntwin, including its real billing and conversation storage. Use fictional journal details for tests.

Try asking what Tilly does, then request a person, note and reminder. Check that navigation into `/app` stays on the local origin and keeps the conversation. Verify the saved results, declined and revoked page access, German pages, and a phone viewport.

Account controls are hidden with `data-syntwin-hidden`. Sign-in and bulk data controls use `data-syntwin-readonly`. `data-syntwin-avoid="0px"` on the hero actions folds the launcher while those actions are visible on phones. Its value must be an IntersectionObserver margin, not a React boolean attribute.

## Verified locally, 27 October 2026

- Two anonymous walkthroughs created and verified a person, note and dated reminder through the production twin's page tools.
- The website-to-app handoff kept the same Syntwin session, transcript and permission.
- Fresh app visits had no launcher. Settings opened the guide; closing and reopening kept the conversation, including on a phone viewport.
- English and German chat worked. Declined access gave manual guidance; revocation cleared the grant. Offline mode disabled Settings help.
- Audio and video calls connected. A typed question received a spoken answer; video delivered a live 1280×720 stream. Microphone input was blocked in the automated browser, so spoken input was not verified. All test calls were ended.
- `bun check`, `bun run build` and the existing internationalization tests passed.

The production twin still narrates individual page actions despite the room's shorter instructions. Syntwin's visitor page-tool prompt requests a short spoken line before acting. A local Syntwin change now separates silent chat actions from short spoken cues in calls; it has not been deployed.

## Roleplay QA, 27 October 2026

Tested a curious visitor, a privacy-conscious anonymous user, and an iPhone user in German, then retested knowledge and feedback after updating this room.

- The requested fictional Robin Ellis workflow saved one person, one note and the correct 15 November reminder. Website-to-app continuity and Settings reopening retained the session. It took about 214 seconds, with 51 assistant text messages and 53 tool calls across the conversation. Repeated clicks, retries, misleading failure indicators and unsolicited continuation made the walkthrough tiring.
- Privacy answers correctly distinguished local journal data from remote Syntwin processing. Manual guidance respected the request to keep page access off. Calendar roadmap and post-cancellation answers did not invent promises.
- The guide initially searched Syntwin product documentation for Tilly questions. Explicit knowledge-tool routing fixed the observed retest. Sources lacked iPhone installation, yearly reminders, anonymous data-loss/backup steps, and support contacts; these were added. The older overview's paid-feature claim conflicted with the website, so the current guide now takes precedence.
- The knowledge tool returned only the first 4,000 characters of this source in the observed retest. The guide was compacted below that limit. A further retest correctly named Export Data, Import Data and JSON, though it guessed the German translation and still offered an unnecessary demo.
- A fresh feedback conversation correctly explained owner notifications, rendered a working mailto link, and offered the GitHub issue CTA. Email delivery itself was not verified.
- The production embed's built-in Syntwin privacy link resolves to `/legal/privacy` on the host origin, which shows Tilly's Page Not Found screen. The local Syntwin fix resolves it against the script's Syntwin origin. The separate room operator privacy-notice URL is still unset.
- Cancellation was resolved from code, not an owner policy question: `images-field.tsx` gates new uploads but leaves existing images viewable/removable; note editing is ungated. `invite-link-section.tsx` gates new links; existing Jazz memberships and writer permissions survive loss of Plus. The Tilly Agent requires Plus. No cancellation deletion/revocation handler was found. Exact Clerk entitlement cutoff was not established, and billing cancellation itself was not exercised.

### Questions beyond a feature tour

Roleplayed these concerns in real remote conversations embedded in local Tilly:

- **“Is recording my friends creepy?” / “Does talking to you expose my journal to Carl?”** The first answer falsely claimed notes were not on a server and invented Carl's personal reflection. Updated knowledge and instructions distinguish anonymous browser data, encrypted signed-in sync and remote guide processing. A fresh retest made those distinctions and explained that Carl can review this chat.
- **“My dad died. Can I stop his birthday reminder without erasing my notes?”** The initial empathetic answer suggested a nonexistent reminder-off control. A fresh retest after correction correctly said to delete the individual reminder, preserve the person/notes, and not confuse disabling repeat with cancelling its next occurrence. It respected the request for no tour.
- **“I'll abandon this for weeks. Will I come back to homework?”** The first answer falsely claimed there was no overdue list. Code keeps active past-due reminders. The final retest correctly acknowledged the backlog instead of promising it disappears.
- **“If I cancel Plus, are my photos and shared people held hostage?”** A fresh test retrieved the FAQ and correctly explained existing access, editing and the restrictions on new uploads/invites. It did not invent the billing cutoff.
- **“Can my sister see my whole journal? Can I hide one embarrassing note about Mum?”** An earlier conversation reused unrelated privacy evidence and could not answer. After updated knowledge, another conversation correctly explained person-scoped sharing, all notes/reminders visible within it, writer access and the limits of revocation.
- **“Why no real iPhone/Android app? Will notes vanish or reminders fail?”** The answer grounded the cross-device PWA choice in Carl's approved background, explained installation, anonymous backup risk and iOS push requirements. It was too long and offered an unnecessary demo.
- **“What if Carl loses interest and shuts this down?”** The answer acknowledged uncertain future hosting/support and technical self-hosting, explained JSON export/import and private backups, and did not promise continued service.

The initial broader QA still found long replies, unwanted follow-ups and repetitive page actions. The subsequent improvement pass below retested these problems.

### Improvement pass, 27 October 2026

- Replaced the live room's instructions with direct answers, no habitual demo offers, explicit respect for no-tour requests, and a fresh lookup for each new product topic. A native-app answer was 65 words with no follow-up. A sharing follow-up correctly explained whole-person access and writer permissions.
- A complex grief/backlog lookup returned no evidence despite the FAQ being indexed. Added the focused reminder source; the next fresh conversation answered both questions correctly, preserved notes and offered no tour. This passed example does not guarantee every retrieval query.
- Fixed nested button/anchor controls in Hero and Navbar so the entire app entry is clickable. Marked the app's loading screens busy so Syntwin waits for hydration instead of repeatedly reading the splash screen.
- A fresh Alex Morgan walkthrough saved one person, one note and the correct 15 November 2026 reminder. It used 19 tool calls (including two page reads), with no tool errors, versus 53 in the earlier Robin test. It still emitted 20 assistant text messages; the remote prompt still overrides the request for silent actions. These were separate runs, not a controlled performance benchmark.
- Closing the guide, opening Settings and reopening Help preserved the same session and completed-example transcript. The guide stayed hidden while closed.
- In `../syntwin-mono`, prepared chat-specific silent action instructions, reuse of snapshots returned by actions, and absolute embedded privacy links. English/German link tests cover separate operator and Syntwin origins; the dock test checks origin propagation. These Syntwin changes remain local and require deployment before the remote embed benefits.
- Tilly `bun check` and `bun run build` passed. Syntwin format/check and all 5,303 tests passed. Syntwin E2E built its preview but stopped in authentication setup on an Error screen; no affected-flow E2E result is available.

Improvement sessions: `jx756acn3cz0px5h9vjdv2xa258h2dh9` (complete workflow and Settings continuity), `jx726rw40crns5r8krhzebbnj58h2tv0` (grief/backlog), `jx72bdqg6ym35jppk0esnbf1858h3rd3` (native apps and sharing).

After adding Carl's personal views, fresh English and German conversations correctly described daily use, enjoying the notes list, writing to remember, reminders as a request from one's past self, avoiding too many reminders, and Carl still reaching out himself. Neither offered a tour. Both still announced their lookup. Sessions: `jx73syz7dhdvs8mn013afd7k4s8h3pch` (English), `jx76s39729wsq1e29vzrj7rrj58h2whm` (German).

QA sessions: `jx7857njh6yfsk44j7z3ata3018h26n3` (walkthrough), `jx72vby2n378ntsvn7kc939bzx8h258z` (privacy/support), `jx7ddbtdtqmq6zj4y4ysvgc7hn8h3b5x` (German), `jx73dzfqjzmw2rzdy07rht76mx8h3zkq` (knowledge retest), `jx70scp13cx1zd0gmsqs2g8r7n8h2eht` (feedback retest).

Broader QA: `jx7frqx66passt2a0bsq1ex9bd8h2150` (privacy/sharing gap), `jx7e6dspskfc7dn85zp5cpxb358h3wnk` (cancellation/sharing pass), `jx7251n41pdc5t1fv6hev5edtn8h3cnz` (maintenance/exit).

written with gpt-6.1-sol in Codex
