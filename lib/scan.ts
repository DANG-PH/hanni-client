"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";
import type { ScanResult, ScanUsage } from "./types";

export function useScanUsage(enabled: boolean) {
  return useSWR<ScanUsage>(enabled ? "/scan/usage" : null, (p: string) => apiFetch<ScanUsage>(p));
}

export function scanImage(image: Blob) {
  const form = new FormData();
  form.append("image", image, "scan.jpg");
  return api.upload<ScanResult>("/scan", form);
}

/** Thu ảnh về cạnh dài ≤ 1600px JPEG trước khi gửi: ảnh điện thoại 4–12MB
 * còn vài trăm KB, gửi nhanh trên 4G mà chữ vẫn đủ nét để đọc. Trình duyệt
 * không giải mã được (vd HEIC trên Chrome) thì gửi nguyên ảnh. */
export async function prepareImage(file: File): Promise<Blob> {
  const MAX = 1600;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}
