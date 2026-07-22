"use client";

/**
 * Shared helpers for PDF tool components.
 *
 * These components all follow the same upload → options → convert → download
 * pattern, so we extract the common bits here to keep each tool component
 * focused on its specific options and API call.
 */

import { useCallback, useRef, useState, type DragEvent } from "react";
import { Upload, X, FileText } from "lucide-react";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function stripExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

export type UploadStatus = "idle" | "loaded" | "processing" | "done" | "error";

export interface UploadedFile {
  file: File;
  size: number;
  name: string;
}

export interface ConvertResult {
  blob: Blob;
  fileName: string;
  size: number;
  contentType: string;
}

interface UseFileUploadOptions {
  accept: string;
  multiple?: boolean;
  maxSizeBytes?: number;
  maxFiles?: number;
  onError?: (msg: string) => void;
  validate?: (file: File) => string | null; // returns error message or null
}

export function useFileUpload(opts: UseFileUploadOptions) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming);
      const maxFiles = opts.maxFiles ?? 1;
      const maxSize = opts.maxSizeBytes ?? Infinity;
      const accepted: UploadedFile[] = [];

      for (const f of arr) {
        if (opts.validate) {
          const err = opts.validate(f);
          if (err) {
            opts.onError?.(err);
            continue;
          }
        }
        if (f.size > maxSize) {
          opts.onError?.(
            `File "${f.name}" is too large. Max ${formatBytes(maxSize)}.`,
          );
          continue;
        }
        accepted.push({ file: f, size: f.size, name: f.name });
        if (accepted.length >= maxFiles) break;
      }

      if (accepted.length === 0) return;

      if (opts.multiple) {
        setFiles((prev) => [...prev, ...accepted].slice(0, maxFiles));
      } else {
        setFiles(accepted.slice(0, 1));
      }
    },
    [opts],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) acceptFiles(e.dataTransfer.files);
    },
    [acceptFiles],
  );

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) acceptFiles(e.target.files);
      e.target.value = "";
    },
    [acceptFiles],
  );

  const removeAt = useCallback((idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    setFiles((prev) => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const clear = useCallback(() => setFiles([]), []);

  return {
    files,
    dragOver,
    inputRef,
    onDrop,
    onDragOver,
    onDragLeave,
    onInputChange,
    removeAt,
    reorder,
    clear,
    openPicker: () => inputRef.current?.click(),
  };
}

export function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a short delay so the download has time to start
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface DropZoneProps {
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onClick?: () => void;
  openPicker?: () => void;
  dragOver: boolean;
  accept: string;
  multiple?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  title: string;
  subtitle: string;
}

export function DropZone({
  onDrop,
  onDragOver,
  onDragLeave,
  onClick,
  openPicker,
  dragOver,
  accept,
  multiple,
  inputRef,
  onInputChange,
  title,
  subtitle,
}: DropZoneProps) {
  const handleClick = onClick ?? openPicker;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick?.();
      }}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`
        flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed
        p-10 text-center transition-colors cursor-pointer
        ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        }
      `}
    >
      <Upload className="h-10 w-10 text-muted-foreground" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}

interface FileChipProps {
  file: UploadedFile;
  onRemove?: () => void;
  disabled?: boolean;
}

export function FileChip({ file, onRemove, disabled }: FileChipProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="h-8 w-8 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="font-medium truncate">{file.name}</p>
          <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
        </div>
      </div>
      {onRemove && !disabled && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove file"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
