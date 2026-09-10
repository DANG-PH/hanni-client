/**
 * Thu nhỏ + nén ảnh phía client trước khi upload (avatar).
 * Cắt vuông theo tâm, cạnh tối đa `max` px, xuất WEBP ~0.85.
 * Lỗi thì trả lại file gốc.
 */
export async function resizeImage(file: File, max = 512): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const target = Math.min(side, max);
    const canvas = document.createElement("canvas");
    canvas.width = target;
    canvas.height = target;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      target,
      target,
    );
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}
