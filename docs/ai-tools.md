# AI Tools

- Tool functions in `tools.ts` use operations internally
- Return sanitized data (exclude `_ref` properties)
- No file upload support in AI tools

## Person summaries

The shared field guidance lives in `src/shared/tools/person-summary-guidance.ts`. The in-app system prompt and create/update person tools use it directly. Keep the same paragraph in `docs/syntwin-room-instructions.md` when updating the live Syntwin room.

A summary is a compact bio: "How would you introduce them to your friends?" Temporary events belong in notes. Leave summary empty when there is no known biographical context. The in-app assistant can update an outdated bio from journal evidence; the website guide preserves existing summaries unless asked to change them.

written with gpt-6.1-sol in Codex
