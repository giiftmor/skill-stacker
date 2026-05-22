// app/lib/storage.ts - File Storage Module
import fs from "fs";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads";

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function uploadFile(file: File, cvId: number): Promise<{
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
}> {
  ensureUploadDir();
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const timestamp = Date.now();
  const ext = path.extname(file.name);
  const filename = `${cvId}_${timestamp}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  
  fs.writeFileSync(filepath, buffer);
  
  return {
    filename,
    original_name: file.name,
    mime_type: file.type,
    size: buffer.length,
    url: `/api/photo/${cvId}`,
  };
}

export function getFilePath(filename: string): string {
  return path.join(UPLOAD_DIR, filename);
}

export function fileExists(filename: string): boolean {
  return fs.existsSync(getFilePath(filename));
}

export function deleteFile(filename: string): boolean {
  const filepath = getFilePath(filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    return true;
  }
  return false;
}

export function getFileMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

export function cleanupCVFiles(cvId: number): void {
  if (!fs.existsSync(UPLOAD_DIR)) return;
  
  const files = fs.readdirSync(UPLOAD_DIR);
  for (const file of files) {
    if (file.startsWith(`${cvId}_`)) {
      fs.unlinkSync(path.join(UPLOAD_DIR, file));
    }
  }
}