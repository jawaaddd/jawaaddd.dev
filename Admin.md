# Admin guide

How to run, configure and deploy jawaaddd.dev. Items marked **(phase 8–9)** don't exist
yet; this file gets updated as those phases land.

## Environment variables

Set these in Railway (service → Variables). For local runs, put them in `.env.local` at the
repo root (git-ignored; Next.js loads it automatically in `npm run dev`).

| Variable              | Needed for    | Value                                                                                                                                         |
| --------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATA_DIR`            | Everything    | Folder holding `site.db` and `uploads/`. On Railway: the volume's mount path, e.g. `/data`. Defaults to `./data` locally.                     |
| `HOSTNAME`            | Railway       | `0.0.0.0`. The standalone server binds to `HOSTNAME`, and containers set it to their own name, which can make the app unreachable.            |
| `PORT`                | Railway       | Set by Railway automatically; don't override. Defaults to 3000 locally.                                                                       |
| `RESEND_API_KEY`      | Contact form  | API key from resend.com → API Keys. Without it, messages are logged to the server output instead of sent.                                     |
| `CONTACT_FROM_EMAIL`  | Contact form  | Sender shown on the email, on a domain verified in Resend, e.g. `jawaaddd.dev <contact@jawaaddd.dev>`. Required once `RESEND_API_KEY` is set. |
| `CONTACT_TO_EMAIL`    | Contact form  | Where messages are delivered. Optional; defaults to `tanvirja@buffalo.edu`.                                                                   |
| `ADMIN_PASSWORD_HASH` | Admin sign-in | A hash of your admin password (never the password itself). Generate it with `npm run hash-password` (see below).                              |
| `SESSION_SECRET`      | Admin sign-in | A random string of at least 32 characters that signs the session cookie. Generate with `openssl rand -base64 48`. Changing it signs you out.  |

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
- **Posts:** through the admin panel at `/admin`. Never run `npm run seed` in production:
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
4. Add the contact and admin variables above.
5. Add the custom domain `jawaaddd.dev` in Railway and create the DNS records it shows you at
   your registrar.

Things to know:

- A service with a volume runs as **one instance**. Each deploy has a few seconds of downtime
  while the volume moves to the new instance. That's expected.
- Only the volume persists. Anything written elsewhere on the server is lost on the next
  deploy, so all posts and uploads must live under `DATA_DIR`.
- The database is only read at request time, so builds don't need the volume.

## The admin panel

### Setting it up

1. Run `npm run hash-password`, type your password twice (at least 12 characters; nothing is
   shown as you type), and copy the `ADMIN_PASSWORD_HASH=…` line it prints.
2. Run `openssl rand -base64 48` and use the output as `SESSION_SECRET`.
3. Put both in `.env.local` for local runs, and in Railway's variables for the live site. The
   hash contains no `$`, so it can be pasted as is.

Until both are set, signing in fails with a message naming the one that's missing.

To change the password, generate a new hash and replace `ADMIN_PASSWORD_HASH`. That also
signs out every browser that was signed in.

### Using it

- Sign in at `/admin` (e.g. `https://jawaaddd.dev/admin`). You stay signed in for 30 days on
  that browser, or until you sign out. After 5 sign-in attempts in 15 minutes, further
  attempts are refused until the 15 minutes are up (successful ones count too).
- **Posts** lists every post, drafts included, with a search box, and Edit and Delete for each.
  Deleting also removes the post's images.
- **New post:** pick a type. The preview on the right shows the tile and the opened post as
  you go.
  - **Blogpost / Project:** drop the `.md` file. The title and link name are filled in from
    its first `#` heading. Then drop the images it uses: a reference like
    `![](images/grid.png)` matches an uploaded file named `grid.png`, and the form lists any
    referenced image that hasn't been uploaded yet. A project can also have a tile image,
    shown on its tile and at the top of the post.
  - **Note:** pick TIL, Thought or Idea; up to 280 characters.
  - **Photo:** one image and an optional caption.
  - The date defaults to today. **Publish** puts the post on the site; **Save draft** keeps it
    hidden.
- **Editing** works the same way, plus an **Excerpt** field for blogposts and projects (left
  empty, the tile uses the first paragraph). A blogpost can become a project and back; other
  type changes aren't possible, so make a new post instead. On a published post the buttons
  are **Save changes** and **Unpublish**. Changing a published post's link name breaks links
  already shared.

Images can be JPEG, PNG, WebP, GIF or AVIF, up to 15 MB each and about 48 MB per save. They're
checked and re-encoded on upload, which removes camera metadata such as GPS location.

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
- **Signing in says "Sign-in isn't set up":** `ADMIN_PASSWORD_HASH` or `SESSION_SECRET`
  is missing or malformed. See "The admin panel" above, then restart the server.
- **`npm run hash-password` says "Run this in a terminal":** run it directly in a terminal, not
  through a pipe or an editor's command runner.
- **`/post/…` links to a post redirect home with "Sorry, that post doesn't exist":** the slug is
  wrong or the post is still a draft.
