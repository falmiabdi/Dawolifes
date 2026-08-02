# DawoLife

Real-estate / vehicle listing platform.

## Layout

| Path | What it is |
| --- | --- |
| `server/` | Express API (PostgreSQL + Sequelize). Deploy independently. |
| `web/` | Next.js website. Deploy independently. |
| `mobile-app` branch | The Capacitor mobile app (Android/iOS). |

## Getting started

Install dependencies per project and run:

```bash
cd server && pnpm install && pnpm dev
cd web && pnpm install && pnpm dev
```

See `build.sh` / `dev.sh` at the repo root for build and run commands.
