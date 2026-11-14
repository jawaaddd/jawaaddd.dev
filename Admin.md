# Admin guide

How to run, configure and deploy jawaaddd.dev. Items marked **(phase 7–9)** don't exist
yet; this file gets updated as those phases land.

## Environment variables

Set these in Railway (service → Variables). For local runs, put them in `.env.local` at the
repo root (git-ignored; Next.js loads it automatically in `npm run dev`).

| Variable              | Needed for                  | Value                                                                                                                                         |
| --------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATA_DIR`            | Everything                  | Folder holding `site.db` and `uploads/`. On Railway: the volume's mount path, e.g. `/data`. Defaults to `./data` locally.                     |
| `HOSTNAME`            | Railway                     | `0.0.0.0`. The standalone server binds to `HOSTNAME`, and containers set it to their own name, which can make the app unreachable.            |
| `PORT`                | Railway                     | Set by Railway automatically; don't override. Defaults to 3000 locally.                                                                       |
| `RESEND_API_KEY`      | Contact form                | API key from resend.com → API Keys. Without it, messages are logged to the server output instead of sent.                                     |
| `CONTACT_FROM_EMAIL`  | Contact form                | Sender shown on the email, on a domain verified in Resend, e.g. `jawaaddd.dev <contact@jawaaddd.dev>`. Required once `RESEND_API_KEY` is set. |
| `CONTACT_TO_EMAIL`    | Contact form                | Where messages are delivered. Optional; defaults to `tanvirja@buffalo.edu`.                                                                   |
| `ADMIN_PASSWORD_HASH` | Admin sign-in **(phase 7)** | A hash of your admin password (never the password itself). How to generate it will be added here.                                             |
| `SESSION_SECRET`      | Admin sign-in **(phase 7)** | A long random string that signs the session cookie. Generate with `openssl rand -base64 48`. Changing it signs you out everywhere.            |

Never commit any of these values.

## Before launch: content to fill in

- **About text and portrait:** `src/content/about.ts`. The text is Markdown and still holds the
  Figma placeholder copy. To add a portrait, drop the photo in `public/` (e.g.
  `public/portrait.jpg`) and set `portrait` to `{ src: "/portrait.jpg", alt: "…" }`. Any aspect
  ratio works; it's cropped to a square.
- **Resume:** save it as `public/resume.pdf`. The navbar and About page link to it.
- **Favicon:** none yet (browsers log a 404 for `/favicon.ico`). Add `src/app/icon.png` (or
  `icon.svg`) and Next.js serves it automatically.
- **Home intro:** the sentence above the feed is `site.description` in `src/lib/site.ts`.
- **Posts:** through the admin panel **(phase 7)**. Never run `npm run seed` in production:
  it replaces every post (it refuses to run when `NODE_ENV=production`).

## Running locally

Needs Node 24 or newer.

```sh
npm install
npm run seed     # optional: sample posts and images in ./data (wipes existing posts there)
npm run dev      # http://localhost:3000
```

To run the production build locally:

```sh
npm run build
DATA_DIR=$PWD/data PORT=3100 npm start    # http://localhost:3100
```

`npm start` runs the standalone server from `.next/standalone`, which doesn't see `./data`
unless `DATA_DIR` points at it.

Checks before deploying:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## Deploying to Railway

Full steps land in phase 9; the shape is:

1. Create a service from the GitHub repo.
2. Add a **volume** and mount it at `/data`. Set `DATA_DIR=/data` and `HOSTNAME=0.0.0.0`.
3. Build command `npm run build`, start command `npm start` (both already in `package.json`).
4. Add the contact variables above, then the admin ones once phase 7 is in.
5. Add the custom domain `jawaaddd.dev` in Railway and create the DNS records it shows you at
   your registrar.

Things to know:

- A service with a volume runs as **one instance**. Each deploy has a few seconds of downtime
  while the volume moves to the new instance. That's expected.
- Only the volume persists. Anything written elsewhere on the server is lost on the next
  deploy, so all posts and uploads must live under `DATA_DIR`.
- The database is only read at request time, so builds don't need the volume.

## Setting up Resend (contact form)

1. Create an account at resend.com and add `jawaaddd.dev` under **Domains**.
2. Add the DNS records Resend shows (SPF/DKIM) at your registrar and wait for it to verify.
3. Create an API key with "Sending access" and set `RESEND_API_KEY`.
4. Set `CONTACT_FROM_EMAIL` to an address on the verified domain.

Until the domain is verified, Resend only delivers to the email address on your Resend
account. Replies to a contact email go to the visitor (it's sent with their address as
Reply-To).

Spam protection is built in: a hidden honeypot field and a limit of 5 messages per visitor
per hour (it resets on each deploy).

## Data and backups

- `DATA_DIR/site.db` is the SQLite database (all posts). `DATA_DIR/uploads/` holds images.
- Backups **(phase 8)**: the database will be copied safely on every publish and monthly,
  with the latest few kept on the volume and a download button in the admin panel. Images
  are covered by Railway's volume backups; turn those on in the volume's settings.
- Don't copy `site.db` with plain file tools while the site is running. Use the backup
  download once phase 8 is in.

## Troubleshooting

- **`npm run lint` crashes with ENOENT on a `.#Something.tsx` file:** that's an Emacs lock
  file for a buffer you have open. Close the buffer, or run
  `npx eslint src --ignore-pattern '**/.#*'`.
- **Build fails with a Turbopack panic ("…was canceled"):** delete the build cache with
  `rm -rf .next` and build again.
- **Contact form says it sent, but nothing arrived:** check the server logs. Without
  `RESEND_API_KEY` the message is only logged; with it, a Resend error is logged as
  `[contact] sending failed`.
- **`/post/…` links to a post redirect home with "Sorry, that post doesn't exist":** the slug is
  wrong or the post is still a draft.
