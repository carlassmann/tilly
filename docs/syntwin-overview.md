# Tilly

Website: https://tilly.social
Source code: https://github.com/carlassmann/tilly
Creator: Carl Assmann
Project type: Carl's side project

## What it is

Tilly is Carl's open-source personal relationship journal: a private place to remember what matters about people and follow up when it matters. People are the central entity. Carl can keep notes, photos, meaningful moments, birthdays, interests, and reminders for each person. Hashtags create lists. People can be shared with collaborators. Tilly works across devices and offline.

The optional Tilly Agent is an AI relationship assistant. Carl can tell it life updates in natural language; it can identify the people involved, organize notes, suggest or set reminders, catch Carl up before meeting someone, and help him draft a message.

## Why Carl built it

The trigger was a friend telling Carl in April that he would soon submit his doctoral thesis. When Carl next saw him in September, he realized he had missed the chance to wish him luck and ask how it went. Contacts store phone numbers, todos and notes feel like work, chat histories are hard to search, and social media is noisy. Carl wanted friendships to have a dedicated, simple, joyful space.

Tilly exists to help Carl show up for people: log something once, remember the context later, and receive a gentle reminder to follow up. Carl's framing is: “I needed this. So I built it.” The AI is there for convenience so maintaining the journal is easy enough that he actually uses it—not as a gimmick.

Tilly also reflects Carl's product values: ship a useful end-to-end product, keep ownership of user data, work offline, avoid lock-in, and make sophisticated behavior feel simple.

Carl also built Tilly to demonstrate how a web app can feel like a native app. He wanted a polished experience across devices without maintaining a separate native application for each platform.

## Side-project and commercial model

Tilly is Carl's side project, not his primary company.

Carl initially built it for himself. He made the hosted product partly commercial because AI inference creates real usage costs and he did not want to personally pay for other people's token usage. The core relationship-journal product remains free. Plus adds the Tilly Agent, images in notes and shared people.

This is pragmatic cost recovery, not evidence that Carl set out to turn Tilly into a conventional growth startup. Free includes unlimited people, text notes, reminders, JSON import/export and signed-in sync and push notifications. Plus is also needed for new image uploads and new sharing invite links. After Plus ends, existing images remain viewable and removable, and existing shares retain their permissions. The website currently lists Plus at $6/month with a 30-day trial, checked on 30 October 2026. Use the current visible website terms if these change.

## Technical design and stack

- React 19 PWA, hosted by Astro 5
- TypeScript
- TanStack Router
- Tailwind CSS and shadcn/ui / Base UI
- Jazz as the local-first, encrypted, realtime collaborative data layer
- Clerk for authentication and key management
- Vercel AI SDK with Google Gemini for the Tilly Agent
- Hono for API routes
- Workbox / vite-plugin-pwa for installation and offline behavior
- Vercel hosting

Data is encrypted in the browser before Jazz syncs it. The core experience is offline-first. Tilly supports complete JSON export/import and is MIT licensed.

Background approved by Carl on 29 September 2026. Paid-feature correction approved on 30 October 2026.

written with gpt-6.1-sol in Codex
