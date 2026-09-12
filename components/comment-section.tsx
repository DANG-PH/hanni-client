"use client";

import { useState } from "react";
import { Avatar } from "./avatar";
import { Icon } from "./icon";
import { Button, ErrorNote } from "./ui";
import { useAuth } from "@/lib/auth";
import { deleteComment, postComment, useComments } from "@/lib/hooks";
import { timeAgo } from "@/lib/time";
import type { VideoComment } from "@/lib/types";

function CommentForm({
  placeholder,
  submitLabel,
  autoFocus,
  onSubmit,
  onCancel,
}: {
  placeholder: string;
  submitLabel: string;
  autoFocus?: boolean;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const content = value.trim();
    if (!content || busy) return;
    setBusy(true);
    try {
      await onSubmit(content);
      setValue("");
      onCancel?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={2}
        maxLength={2000}
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Huỷ
          </Button>
        )}
        <Button onClick={() => void submit()} disabled={busy || !value.trim()}>
          {busy ? "Đang gửi…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  isReply,
  canDelete,
  onReply,
  onDelete,
}: {
  comment: VideoComment;
  isReply?: boolean;
  canDelete: boolean;
  onReply?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`flex gap-3 ${isReply ? "mt-3" : ""}`}>
      <Avatar user={comment.user} size={isReply ? 28 : 36} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-semibold">{comment.user.displayName}</span>
          <span className="text-xs text-muted">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-6">
          {comment.content}
        </p>
        <div className="mt-1 flex gap-3 text-xs font-medium text-muted">
          {onReply && (
            <button
              type="button"
              onClick={onReply}
              className="flex items-center gap-1 hover:text-primary"
            >
              <Icon name="reply" size={14} />
              Trả lời
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1 hover:text-danger"
            >
              <Icon name="trash" size={14} />
              Xoá
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentSection({ videoId }: { videoId: string }) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, mutate } = useComments(videoId, page);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  async function submitTop(content: string) {
    await postComment(videoId, content);
    setPage(1);
    await mutate();
  }

  async function submitReply(rootId: string, content: string) {
    await postComment(videoId, content, rootId);
    await mutate();
  }

  async function remove(commentId: string) {
    if (!confirm("Xoá bình luận này?")) return;
    await deleteComment(videoId, commentId);
    await mutate();
  }

  return (
    <div className="panel space-y-4 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Icon name="message" size={18} className="text-muted" />
        <h2 className="text-sm font-bold tracking-wide">
          BÌNH LUẬN{data ? ` (${data.total})` : ""}
        </h2>
      </div>

      {user && (
        <CommentForm
          placeholder="Viết bình luận của bạn…"
          submitLabel="Gửi"
          onSubmit={submitTop}
        />
      )}

      {error && <ErrorNote>Không tải được bình luận.</ErrorNote>}
      {isLoading && <p className="text-sm text-muted">Đang tải bình luận…</p>}
      {data && data.items.length === 0 && (
        <p className="py-4 text-center text-sm text-muted">
          Chưa có bình luận nào — hãy là người đầu tiên!
        </p>
      )}

      <div className="space-y-5">
        {data?.items.map((c) => (
          <div key={c.id}>
            <CommentRow
              comment={c}
              canDelete={Boolean(user && (user.id === c.user.id || user.role === "admin"))}
              onReply={user ? () => setReplyTo(replyTo === c.id ? null : c.id) : undefined}
              onDelete={() => void remove(c.id)}
            />
            {c.replies.length > 0 && (
              <div className="ml-11 border-l border-border pl-3">
                {c.replies.map((r) => (
                  <CommentRow
                    key={r.id}
                    comment={r}
                    isReply
                    canDelete={Boolean(
                      user && (user.id === r.user.id || user.role === "admin"),
                    )}
                    onDelete={() => void remove(r.id)}
                  />
                ))}
              </div>
            )}
            {replyTo === c.id && (
              <div className="ml-11 mt-2 pl-3">
                <CommentForm
                  placeholder={`Trả lời ${c.user.displayName}…`}
                  submitLabel="Trả lời"
                  autoFocus
                  onSubmit={(content) => submitReply(c.id, content)}
                  onCancel={() => setReplyTo(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 border-t border-border pt-4">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </Button>
          <span className="text-sm text-muted">
            {page} / {data.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
