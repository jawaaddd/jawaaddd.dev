# jawaaddd.dev

Personal site for Tanvir Jawad. Next.js (App Router, Cache Components) with plain CSS.
See `HANDOFF.md` for the design spec and architecture decisions.

```sh
npm install
npm run seed       # dev only: fill ./data with sample posts
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm test
npm run build      # standalone server in .next/standalone
npm start          # runs the standalone build
```

Design tokens live in `src/styles/tokens.css` and mirror the Figma variables one to one.

Posts and uploads live in `DATA_DIR` (default `./data`, git-ignored). In production it's the
Railway volume. When running the standalone build locally, set `DATA_DIR=$PWD/data`.
