import { useId, useRef, useState } from "react";
import form from "@/components/Form/Form.module.css";
import styles from "./Composer.module.css";

type Props = {
  /** Given to the "choose a file" button, so an error can move focus to it. */
  id: string;
  label: string;
  prompt: string;
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  /** What's attached, e.g. "feed-grid.md · 4 KB". */
  attached?: string | null;
  onRemove?: () => void;
  hint?: React.ReactNode;
  error?: string;
};

/** A file field: drop files on the dashed box, or choose them with the button. */
export function DropZone({
  id,
  label,
  prompt,
  accept,
  multiple = false,
  onFiles,
  attached,
  onRemove,
  hint,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const labelId = useId();
  const errorId = `${id}-error`;

  const take = (list: FileList | null) => {
    const files = list ? [...list] : [];
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div className={form.field} role="group" aria-labelledby={labelId}>
      <span id={labelId} className={form.label}>
        {label}
      </span>
      <div
        className={styles.dropZone}
        data-dragging={dragging || undefined}
        data-invalid={error ? true : undefined}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          take(event.dataTransfer.files);
        }}
      >
        <p>{prompt}</p>
        <button
          id={id}
          type="button"
          className={styles.choose}
          aria-describedby={error ? errorId : undefined}
          onClick={() => inputRef.current?.click()}
        >
          or choose {multiple ? "files" : "a file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          hidden
          onChange={(event) => {
            take(event.target.files);
            // Choosing the same file again should still count as a change.
            event.target.value = "";
          }}
        />
      </div>

      {attached && (
        <div className={styles.attached}>
          <span className={styles.attachedName}>{attached}</span>
          {onRemove && (
            <button type="button" className={styles.remove} onClick={onRemove}>
              Remove<span className="visually-hidden"> {attached}</span>
            </button>
          )}
        </div>
      )}
      {hint}
      {error && (
        <p id={errorId} className={form.error}>
          {error}
        </p>
      )}
    </div>
  );
}
