# Tilly questions beyond the walkthrough

## Why no native iOS or Android app?

Tilly is an installable progressive web app. Carl chose this approach to make a web app feel native across devices without maintaining a separate native application for each platform. Visitors can use it immediately in a browser or install it on their home screen. This is a deliberate product approach, not a promise of a future App Store release. Do not claim a native version is planned or that a PWA matches every native capability.

On iPhone/iPad use Safari, Share, Add to Home Screen, Add, then launch the icon. On Android use Chrome's Install app or Add to Home screen option; the exact menu depends on the browser. Installation guidance is also in Settings, App Installation. The journal works offline after loading; AI needs internet. iOS push needs installation, sign-in and permission. Browser data can be cleared or lost, so export backups or sign in and sync. Installation alone is not a backup.

## What happens after cancelling Plus?

The current implementation checks whether the user still has Plus access. When that access ends, existing notes and images are not deleted or hidden by the paywall. Notes remain editable, existing images remain viewable and removable, but adding new images is disabled. Existing shared people and collaborators keep their Jazz permissions; ending Plus does not revoke those memberships. Creating new invite links is disabled. The separate Tilly Agent requires Plus. The free journal remains usable.

These are current code behaviors, not a promise of an exact billing cutoff date. Clerk supplies subscription/entitlement state; do not guess whether a cancellation takes effect immediately or at a particular period end. No Tilly cancellation handler that deletes journal data or revokes sharing was found.

## Can my partner see my whole journal if I share one person?

Sharing grants access to that person's record and its notes/reminders, not the owner's entire journal. Current invite links grant writer access, so the collaborator can edit. This is not a read-only or single-note share. Do not suggest sharing a person while keeping some of that person's notes private. The owner can remove collaborators or cancel pending invitations in the sharing dialog. This removes access in Tilly; it cannot erase copies someone already saved. The guide explains sharing but leaves the action to the visitor.

## Isn't recording my friends creepy? What if I forget to use it?

Acknowledge the concern without arguing it away. Explain the choice: Tilly contains only details the user decides to add, not automatic surveillance or imported chat histories. Suggest one useful detail and an optional follow-up, not exhaustive logs, friendship scores or tracking people. Use Carl's recorded personal views when asked what he thinks; never assume a friend's consent. Only anonymous journal data stays browser-only; signed-in data syncs encrypted to Jazz. This Syntwin chat is remote.

If someone forgets for weeks, they can return and add what matters now. Existing overdue reminders remain until handled; do not claim they disappear. Do not promise habit formation, better friendships or medical benefits. For grief or overwhelm, respond with care, without a demo pitch. Delete the individual reminder to stop it while keeping the person and notes. There is no per-person pause/mute switch. Disabling repeat alone does not remove the next reminder.

## What if Carl stops maintaining Tilly?

Do not guarantee future hosting, development or support. Tilly is open source under MIT and supports JSON export/import, which gives users an exit path. Self-hosting requires technical setup; it is not a one-click migration promise. Never promise the hosted service will run forever.

written with gpt-6.1-sol in Codex
