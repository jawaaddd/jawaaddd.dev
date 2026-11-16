# TODO

Planned work that isn't scheduled yet. For how backups work today, see "Backups" in Admin.md.

## Backups

### Automatic Google Drive backups

Send backups somewhere off the server, so losing the Railway volume doesn't lose them.

- Upload automatically on the same schedule as the on-volume copies (daily before the first
  change, monthly), plus images. The simplest form uploads the "everything" zip below.
- `src/lib/backup.ts` makes each copy in one place (`snapshot`), so the upload slots in after it.
- Needs a Google Cloud service account (or OAuth) with access to one Drive folder, its
  credentials as environment variables, and a note in Admin.md on setting it up.

### Keep images that backups still use

Today, deleting a post or replacing an image erases the old files at once. Restoring a database
copy then brings the post back with broken images; only Railway's volume backups have them.

- Stop erasing image files in `savePost` and `removePost` (`src/components/Admin/postActions.ts`).
- When the daily backup runs, delete only the files in `uploads/` that neither the live
  database nor any kept backup refers to (`posts.image_path` and `post_images.path` in each).
- Cost: removed images stay on disk until the last backup using them is pruned, up to about
  6 months because of the monthly copies.
- Tests: an image from a deleted post survives while a backup refers to it, and is removed
  once none do.

### "Download everything" (.zip)

A button on the admin's Backups page that downloads one zip with a fresh database copy and
the whole `uploads/` folder.

- Stream the zip as it's built so a large `uploads/` never has to fit in memory. Node has no
  zip writer, so this needs a small dependency (e.g. `archiver`).
- Restoring it means unzipping it into the data folder; document that in Admin.md.
- One "everything" download, not a zip per daily/monthly copy, which would duplicate the
  images. With "Keep images that backups still use" done, this one zip covers the images of
  every kept backup.
