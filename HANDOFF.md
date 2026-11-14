# jawaaddd.dev — build handoff

Handoff for building Jawad's personal website. Part 1 is how to build it. Part 2 is the design spec, copied from the design doc on Nov 13th 2026. Where the two disagree, the design spec and the Figma file win.

Items marked **(proposed)** are suggestions from the design phase that Jawad has not confirmed. Confirm them with him before building on them. Items marked **(assumed)** in Part 2 are design choices he has seen but not explicitly approved.

## Part 1. Build guide

### 1. What this is

A personal site that reads like a digital journal: one feed mixing blogposts, project write-ups, short notes (TIL, thought, idea) and photos. Clicking any tile opens the post in a modal with its own shareable address. There are About and Contact pages, a Resume link that opens a PDF, and a private admin panel for posting.

Single author, low traffic. Keep it simple; do not add infrastructure the spec does not ask for.

### 2. Decisions already made

| Area | Decision |
| --- | --- |
| Framework | Next.js (React), plain CSS (no Tailwind, no CSS-in-JS) |
| Hosting | Railway, Hobby plan, one service running as a regular Node server |
| Domain | jawaaddd.dev (HTTPS only, as all .dev domains are) |
| Database | SQLite, one file on a Railway volume |
| Uploads | Images stored on the same volume |
| Post source | Blogposts and projects are uploaded Markdown files; notes are typed; photos are uploaded |
| Contact form | Sends an email to Jawad's inbox; nothing is stored |
| Theme | Light only. No dark mode |
| Feed paging | "Older posts" loads more tiles below the current ones |
| Search | Admin post list only; the public feed has none |
| Fonts | Geist (Regular, Medium, SemiBold) and Geist Mono for code |

### 3. Design source

- Figma file: https://www.figma.com/design/MC11Ndb8FPMk7wJprj6xfs/Portfolio-Redo (page "Prototype"). Use the Figma MCP tools to read frames, variables and components.
- Every color, spacing value, font size and line height in the file is a Figma variable. Mirror them one to one as CSS custom properties (section 4) and do not hard-code values in component CSS.

Frames on the page, by name:

| Frame | Shows |
| --- | --- |
| Home / Desktop 1440, Home / Mobile 390 | The feed |
| Home / Desktop 1440 / Filtered: Blogposts | Filter on, non-matching tiles faded in place |
| Home / Desktop 1440 / Modal open (long post, max height) | Long post, pinned header and Share footer, body scrolls |
| Home / Desktop 1440 / Modal open (short post) | Short note, modal sized to content |
| Home / Desktop 1440 / Post not found | Redirect to home with the "doesn't exist" popup |
| Modal / Project, Modal / Photo | Standalone desktop modals |
| Home / Mobile 390 / Post open (long post), (short post) | Mobile bottom sheets |
| Home / Mobile 390 / Menu open | Mobile menu sheet |
| Markdown rendering / Example project post | How each Markdown element renders (content is invented) |
| About / Desktop 1440, About / Mobile 390 | About page |
| Contact / Desktop 1440, Contact / Mobile 390 | Contact form |
| Contact / Desktop 1440 / Validation errors, / Message sent | Form states |
| Admin / Sign in, Admin / Posts | Admin sign-in and post list with search |
| Admin / New post / Project (Markdown), / Note, / Photo | Composers with live preview |
| Admin / Mobile 390 / New post / Note | Mobile composer |
| Components (prototype), Input | Component sets: tiles, Nav link, Filter button, Input, Toast |

All copy in the frames is placeholder except the home intro sentence, the "My Feed" heading and the navbar labels. Do not ship placeholder post content.

### 4. Tokens

Put these in one `tokens.css` loaded at the root. Names match the Figma variables.

```css
:root {
  /* color */
  --color-accent: #6b7b2c;
  --color-text: #18181b;
  --color-text-secondary: #52525b;
  --color-border: #e4e4e7;
  --color-border-input: #71717a;
  --color-placeholder: #e4e4e7;
  --color-surface: #f4f4f5;
  --color-bg: #ffffff;
  --color-error: #b91c1c;

  /* spacing */
  --space-1: 0.25rem;  /* 4 */
  --space-2: 0.5rem;   /* 8 */
  --space-3: 0.75rem;  /* 12 */
  --space-4: 1rem;     /* 16 */
  --space-6: 1.5rem;   /* 24 */
  --space-8: 2rem;     /* 32 */
  --space-12: 3rem;    /* 48 */
  --space-16: 4rem;    /* 64 */
  --space-24: 6rem;    /* 96 */

  /* type: size / line height */
  --text-4xl: 3rem;      --line-height-display: 3.5rem;  /* Display 48/56 */
  --text-3xl: 2.5rem;    --line-height-h1: 3rem;         /* H1 40/48 */
  --text-2xl: 2rem;      --line-height-h2: 2.5rem;       /* H2 32/40 */
  --text-xl: 1.5rem;     --line-height-h3: 2rem;         /* H3 24/32 */
  --text-lg: 1.25rem;    --line-height-h4: 1.75rem;      /* H4 20/28 */
  --text-base: 1rem;     --line-height-body: 1.5rem;     /* Body 16/24 */
  --text-sm: 0.875rem;   --line-height-small: 1.25rem;   /* Small 14/20 */
  --text-xs: 0.75rem;    --line-height-tiny: 1rem;       /* Tiny 12/16 */

  --font-sans: "Geist", system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
}
```

Border radius is 0 everywhere. There are no shadows.

### 5. Routes

| Route | Purpose |
| --- | --- |
| `/` | Feed |
| `/post/[slug]` | Feed with that post's modal open. Loading it directly renders the feed plus the modal. Unknown slug redirects to `/` and shows the "Sorry, that post doesn't exist :(" popup |
| `/about`, `/contact` | Static pages |
| `/resume.pdf` | Static file; the Resume link opens it in a new tab |
| `/admin` | Sign in |
| `/admin/posts`, `/admin/posts/new`, `/admin/posts/[id]/edit` | Admin panel |

Notes:

- Post links use the path form, `/post/slug`. Jawad confirmed this on Nov 13th 2026. The admin paths are proposed.
- Next.js intercepting and parallel routes fit the "modal over the feed with its own address" pattern. Opening a tile should change the address without losing the feed's scroll position; Back and Escape close the modal and restore the home address.
- Render post pages on the server with per-post title and description meta tags, so a shared link shows a proper preview.

### 6. Data model (confirmed by Jawad, Nov 13th 2026)

SQLite. One table covers every post type.

```sql
CREATE TABLE posts (
  id            INTEGER PRIMARY KEY,
  type          TEXT NOT NULL CHECK (type IN ('blogpost','project','til','thought','idea','photo')),
  slug          TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  title         TEXT,            -- blogpost, project
  body_md       TEXT,            -- blogpost, project: the uploaded Markdown; notes: the typed text
  excerpt       TEXT,            -- blogpost, project: shown on the tile
  image_path    TEXT,            -- photo: the image; project: optional tile image
  caption       TEXT,            -- photo
  published_at  TEXT,            -- ISO 8601; drives feed order and the displayed date
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE post_images (
  id        INTEGER PRIMARY KEY,
  post_id   INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  filename  TEXT NOT NULL,       -- name as referenced inside the Markdown file
  path      TEXT NOT NULL        -- location on the volume
);
```

- Tile labels: `blogpost` shows "Blogpost", `project` shows "Project", `til` "TIL", `thought` "Thought", `idea` "Idea", `photo` "Photo".
- The "Projects" filter matches `project`; "Blogposts" matches `blogpost`.
- Notes and photos need a slug too, since every post has a shareable address. Generate one (for example from the date and id).
- Keep data access behind a small module so SQLite can be swapped for Postgres later.

### 7. Storage, uploads and backups

- Mount the Railway volume at one path (for example `/data`) and read it from an environment variable. The database file and an `uploads/` folder both live there. Nothing else on the server's disk persists across deploys.
- A Railway service can have one volume and cannot run replicas with it. Each deploy has a brief gap while the volume moves to the new instance. This is accepted.
- Serve uploaded images through a route that reads from the volume. Rewrite image references in rendered Markdown to that route using `post_images`.
- Backups: copy the database file with SQLite's backup mechanism (not a plain file copy of a live database) whenever a post is published, and once a month. The destination is Google Drive, which Jawad will connect later. Until then (confirmed): keep the latest few copies on the volume and offer a download button in the admin panel. Images are covered by Railway's volume backups.

### 8. Admin and security

- Single user. Sign in with one password; store only a hash of it in an environment variable. Use a signed, httpOnly, secure session cookie. Rate-limit sign-in attempts.
- Every `/admin` page and every write endpoint must check the session on the server.
- Sanitize rendered Markdown (no raw script execution). Validate uploads by type and size; never trust the client's filename as a path.
- Drafts must never appear in the public feed or resolve at `/post/[slug]`.
- Contact form: validate on the server, add basic spam protection (for example a honeypot field and a rate limit), send through an email service. The service is not chosen yet.

Environment variables **(proposed)**: `DATA_DIR`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `EMAIL_API_KEY`, `CONTACT_TO_EMAIL`.

### 9. Behavior that is easy to get wrong

- **Grid:** CSS grid, 4 columns on desktop, 3 on tablet, 2 on phone; wide tiles span 2 columns. Breakpoints (confirmed): 2 columns below 640px, 3 from 640px, 4 from 1024px; container max width 1120px. Feed order is by date; if dense packing is used to avoid holes, keep the document order by date.
- **Filtering:** non-matching tiles stay in place and fade to about 12% opacity over about 200ms. While faded they must not be clickable or focusable. Projects and Blogposts can both be on; None turns both off and is the default.
- **Modal:** header and Share footer never scroll; only the body does. Height follows content up to the viewport height minus 96px, centered. Trap focus inside while open, close on Escape and on a click on the dimmed area, and return focus to the tile that opened it. Lock the page scroll behind it.
- **Mobile:** modal and menu are sheets anchored to the bottom. Close and menu rows need tap targets of at least 44px even where the text is small.
- **Pinned bars:** navbar fixed to the top and footer to the bottom on every page; pad the page content so neither covers it.
- **Accent:** green only on interactive things (link text, hover and focus borders, navbar hover underline) and as the fill of the one primary button on a page. Never on static labels.
- **Focus:** every interactive element needs a visible focus state. Respect `prefers-reduced-motion` for the fade and any sheet animation.
- **Dates:** display as "Nov 26th 2026".

### 10. Suggested build order

1. Project scaffold, fonts, `tokens.css`, page shell with pinned navbar and footer.
2. Feed grid and the three tile components, from seed data.
3. Post modal, `/post/[slug]` routing, share button, not-found redirect and popup.
4. Filter buttons with the fade behavior; "Older posts" loading.
5. Markdown rendering to the rules in Part 2.
6. About and Contact pages; contact email sending, validation and the sent popup.
7. SQLite layer, admin sign-in, post list with search, composers with live preview, uploads.
8. Backups.
9. Deploy to Railway with the volume, then point jawaaddd.dev at it.

Checkpoint (confirmed): after step 3, show Jawad the running site before continuing.

### 11. Open questions for Jawad

- What Share does: copy the link, or open the device's share menu where available.
- Email service for the contact form.
- Whether code blocks get syntax coloring.
- The 280-character limit on notes (assumed).
- Mobile sheets for photos and projects, the edit-post form and the delete confirmation are not drawn. Follow the existing patterns and show him.

## Part 2. Design spec

Status: prototype in Figma (Portfolio Redo, page "Prototype"). Anything marked (assumed) was chosen by Claude and is open to change.


### Concept

A personal website that reads like a digital journal, not a developer portfolio. Visitors already know who I am, so the home page is mostly posts. A short intro sits above the feed and the full biography lives on the About page.


### Home page

- Structure: navbar, short intro, feed heading "My Feed" with the filter beside it, post grid, an Older posts control that loads more tiles below the ones already shown, footer. No call-to-action buttons.
- Navbar: name on the left; Feed, Resume, About, Contact on the right. Resume opens a PDF in a new tab. On mobile the links collapse into a Menu control, which opens a sheet from the bottom of the screen listing the four links as large rows, with a Close control.
- Intro: one or two sentences with a link to the About page. It has no heading of its own.
- The grid mixes every post type in date order: blogposts, project write-ups, TILs and short thoughts, photos. Dates show the day, as in Nov 26th 2026.
- Feed filter: to the right of the feed heading, the text "Filter by:" followed by three buttons: Projects, Blogposts and None. Projects and Blogposts can both be on at once. None turns both off and is the selected button by default. No dropdown, and no filters for notes or photos. On mobile the filter sits under the heading. A selected button is filled dark with white text (assumed).
- Filtering keeps the grid layout. Tiles that do not match stay in their positions and fade to near white (12% opacity in the prototype) with a short fade transition, about 200ms (assumed). Faded tiles should not be clickable or reachable by keyboard while the filter is on.
- Pinned bars, on every page: the navbar stays at the top of the screen and the footer at the bottom while the page scrolls. Both have a white background. The footer is a single compact row so it takes little height (53px).

### Post modal

- Opening: clicking any tile opens its content in a modal over the feed, not on a new page. The feed is dimmed behind it (black at 40%) and keeps its scroll position. Close with the Close control, the Escape key or a click on the dimmed area.
- Layout: a header pinned at the top (type label, date, Close, and the title for blogposts and projects), the content in a scrolling middle area, and a Share button pinned at the bottom.
- Height: the modal is as tall as its content up to a maximum of the screen height minus 96px, and is centered so the margin above equals the margin below (48px each at the maximum). Past that height only the middle area scrolls.
- Share button: shares or copies the post's own address. Right-aligned on desktop, full width on mobile. Gray border at rest, accent border on hover (assumed).
- Desktop widths by post type: blogpost and project 739px (title, optional image, full text); note 548px (the text at 20px); photo 928px (the enlarged image with caption).
- Mobile: the modal is a sheet anchored to the bottom of the screen, full width, with the same pinned header and Share button. Long posts stop 48px below the top of the screen so the dimmed feed stays visible above; short posts are only as tall as their content.
- Shareable links: opening a post changes the URL to that post's own address, in the form /post/my-post-slug. Loading that address directly shows the feed with the modal already open. Closing the modal returns the URL to the home address, and the browser back button closes the modal. A link to a post that does not exist redirects to the home page and shows the message "Sorry, that post doesn't exist :(" in a small dark popup at the bottom of the screen.

### About page

- Same navbar and footer. A square portrait (357px on desktop, full width on mobile) beside a 643px text column: heading, a few paragraphs, and links to Resume and Contact. The links sit directly below the text. On mobile the portrait sits above the text.

### Contact page

- Same navbar and footer. A single 548px column: heading, one line of intro, then Name, Email and Message fields with labels above, and a Send message button. Below the form, a direct email link as a fallback. Submissions are sent straight to my email inbox and are not stored on the site.
- Form styling: square inputs with a 1px #71717a border (4.83:1 on white, above the 3:1 minimum for input borders). The focused input gets a 2px accent border. The Send button is filled with the accent and has white text; filled accent is reserved for the one primary action on a page (Send on Contact; Sign in, New post and Publish in the admin panel).
- Validation: a field with a problem gets a 1px red border and a message below it in red (Small 14/20) saying what to fix. Color is never the only signal.
- After sending: a small dark popup at the bottom of the screen reads "Message sent. Thanks for reaching out."

### Markdown rendering

- Blogposts and project posts are written in Markdown and rendered inside the modal's scrolling area, in a column up to 643px wide on desktop.
- Paragraph: Body 16/24. 16px between blocks.
- Headings: ## renders at 24/32 SemiBold with 32px above and 16px below; ### renders at 20/28 SemiBold with 24px above and 16px below. The post title is the only top-level heading, so a # in the body renders like ## (assumed).
- Links: accent color, underlined.
- Lists: Body 16/24, bullets or numbers in the left indent, 8px between items.
- Code block: Geist Mono 14/20 on the surface gray with a 1px border and 16px padding. Long lines scroll sideways and do not wrap (assumed). Inline code: Geist Mono at the surrounding text size.
- Quote: 2px rule on the left in the text color, 16px padding, secondary text color.
- Image: full column width, with an optional caption below in Small 14/20, secondary color, 8px gap.
- Divider (---): a 1px line in the border color with 32px above and below.
- Example in Figma: the frame "Markdown rendering / Example project post". Its content is invented.

### Post grid

- Desktop (1440px): 4 columns inside a 1120px container, 24px gutter. One grid unit is 262 x 262px. In Figma the grid is a wrapping auto layout.
- Mobile (390px): 2 columns, 16px gutter and page margin. One grid unit is 171 x 171px.
- Tablet: 3 columns. Not drawn.
- Breakpoints: 2 columns below 640px, 3 columns from 640px, 4 columns from 1024px. The container is never wider than 1120px.
- 1x1 note tile: TIL, thought or backlog idea. Type label, the full text (one or two sentences), date.
- 1x1 photo tile: full-bleed image, type label, short caption.
- 2x1 blogpost tile: type label, title, two-line excerpt, date. Two columns wide and one row tall, 548 x 262px on desktop.
- 2x1 project tile: a blogpost tile with an image on the right (assumed). Opens the project's blogpost.
- On mobile, 2x1 tiles span the full width (358 x 171px) and drop the excerpt and image, and note text steps down to 14px.

### Type

- Typeface: Geist (sans). Weights: Regular, Medium, SemiBold.
- Sizes (Types variables): Display 48, H1 40, H2 32, H3 24, H4 20, Body 16, Small 14, Tiny 12. Line heights are variables as well: line-height/Display 56, H1 48, H2 40, H3 32, H4 28, Body 24, Small 20, Tiny 16. Code uses Geist Mono.
- In use, as size/line height: feed heading H2 32/40 (H3 on mobile), intro H4 20/28, tile titles H3 24/32, notes and excerpts Body 16/24, dates and nav Small 14/20, type labels Tiny 12/16 in uppercase, modal titles H2 32/40 (H3 on mobile), modal note text H4 20/28, About and Contact headings H2 (H3 on mobile).

### Spacing

- Scale (Spacing variables): 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Tile padding 24 (photo tiles 16). Label to text 8. Grid gutter 24 on desktop, 16 on mobile. Nav padding 24. Intro padding 64 above and 48 below on desktop, 48 and 32 on mobile. Feed heading to grid 32 on desktop, 24 on mobile. Grid to footer 64 on desktop, 48 on mobile. Footer padding 16.

### Shape and color

- Corners: square everywhere (radius 0).
- Light theme only. There is no dark mode.
- Separation: 1px borders on tiles, buttons, form inputs and modals, and on the inner edges of the navbar and footer. No shadows.
- Accent: green #6b7b2c, stored as the Color variable "accent". Reserved for things that can be interacted with: link text; the border of a tile, filter button or Share button on hover, focus or tap; the underline of a navbar link on hover, focus or tap; the border of a focused form input; and the fill of a page's one primary button. Not used on labels or other static text. Contrast is 4.67:1 on white, which passes AA for body text and for borders; on the gray photo placeholder it is 3.68:1, enough for a border but not for small text.
- Neutrals, each a Color variable: text #18181b (text), secondary text #52525b (text-secondary), borders #e4e4e7 (border), image placeholders #e4e4e7 (placeholder), form input borders #71717a (border-input), code block background #f4f4f5 (surface), white background (bg). Error red #b91c1c (error) is used only for form validation.

### Components

- Tile / Wide (2x1), Tile / Note (1x1), Tile / Photo (1x1), Nav link, Filter button. Each has a Default and a Hover variant, and Filter button also has Selected. Input has Default, Focus and Error. Toast is the small dark popup. Modals and mobile sheets are plain frames, not components yet: Modal / Blogpost, Project, Note and Photo; Sheet / Blogpost and Note. The Send and Share buttons are also plain frames. Every tile on the home frames and every desktop navbar link is an instance.

### Admin panel

- A private part of the site for creating and managing posts. Sign in with a password; only I can post. Same type, spacing, colors and components as the public site.
- Admin navbar: name with an Admin label on the left; Posts, New post, View site, Sign out on the right.
- Posts: a list of every post with its type, title or text, date and status (Published or Draft), with Edit and Delete on each row and a New post button. A search box above the list filters posts by title or text. The public feed has no search.
- New post: choose a type first (Blogpost, Project, Note, Photo). The form on the left changes with the type; the preview on the right stays.
- Blogpost and Project (the same form for both): upload a Markdown file, plus the images the file refers to. Title is filled in from the first heading in the file. Link name (used in the shareable address) and date can be edited.
- Note: pick a kind (TIL, Thought, Idea) and type the text into a box, with a character count (280 limit assumed). Date defaults to today.
- Photo: upload an image, add a caption. Date defaults to today.
- Preview: every post type shows two live previews before anything is public, the tile as it will appear in the feed and the opened post. They update as I type or upload.
- Actions: Publish (filled accent, the primary action) and Save draft. Drafts appear only in the admin list.
- Mobile: the composer stacks into one column with the preview below the form. Only the Note composer is drawn for mobile.

### Hosting

- Host: Railway, Hobby plan ($5 per month with $5 of usage included, volumes up to 5 GB, 2 custom domains, as listed on Railway's pricing page on Nov 13th 2026).
- Domain: jawaaddd.dev. A .dev address only loads over HTTPS.
- Stack: Next.js (React) with plain CSS, running as a regular Node server. Deploys from the Git repository.
- Storage: posts live in a SQLite database file on a Railway volume, and uploaded images sit on the same volume. This can move to a server database later if the site outgrows it.
- Backups: a copy of the database file is saved automatically whenever a post is published, and once a month. Railway also supports manual and automated backups of the whole volume, which covers the images.
- To do: connect Google Drive as the destination for the automatic backup copies. Until then, recent copies stay on the volume and can be downloaded from the admin panel.

### Not yet specified

- The 280-character limit on notes (assumed).
- Editing an existing post and confirming a delete in the admin panel (not drawn).
- The email-sending service for the contact form.
- Mobile sheets for photos and projects (blogpost and note are drawn), and what Share does exactly (copy link or the device share menu).
- Whether code blocks get syntax coloring.
