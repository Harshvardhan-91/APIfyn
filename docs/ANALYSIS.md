# APIfyn Analysis

## Existing System Preserved

- Frontend auth was Firebase Google sign-in.
- Backend auth verifies Firebase ID tokens and creates users in Postgres.
- Workflows are stored as JSON definitions in Prisma.
- GitHub and Slack OAuth are implemented.
- GitHub webhooks can execute workflows and send Slack messages.

## Known Gaps

- Subscription frontend exists, but the backend subscription routes are placeholders and are not mounted.
- Settings UI existed, but `/api/user/settings` did not exist.
- Generic webhook URLs in the old UI used `/api/webhook`, while the backend uses `/api/webhooks`.
- Only GitHub to Slack execution is implemented end-to-end.

## Migration Notes

- The new frontend uses Next.js App Router with root-level `app/`, `components/`, `features/`, `hooks/`, and `lib/`.
- The previous Vite source is preserved in `legacy/vite-src`.
- The Express backend is now in `packages/api`.
- Prisma schema and migrations are now in `packages/database`.
