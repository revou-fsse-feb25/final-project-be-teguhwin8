import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import * as path from 'path';
/**
 * Cek apakah nilai dianggap "kosong" untuk kebutuhan filter/query.
 * Kosong = undefined, null, atau string: "", "any", "null", "undefined" (case-insensitive).
 */
export function isBlankish(v: any): boolean {
  return (
    v === undefined ||
    v === null ||
    (typeof v === 'string' &&
      ['', 'any', 'null', 'undefined'].includes(v.trim().toLowerCase()))
  );
}

export const isProvided = (v: any) => v !== undefined && v !== '';

export const toBool = (v: any) =>
  typeof v === 'string' ? v.toLowerCase() === 'true' : !!v;

export const normalizeDate = (v: any, fieldName = 'date') => {
  if (v === undefined) return undefined;
  const dt = v instanceof Date ? v : new Date(String(v));
  if (isNaN(dt.getTime())) {
    throw new BadRequestException(
      `${fieldName} is invalid (expected ISO date)`,
    );
  }
  return dt;
};

export const getExt = (file: Express.Multer.File): string => {
  const byName = (path.extname(file.originalname || '') || '').replace('.', '');
  if (byName) return byName.toLowerCase();
  const byMime = (file.mimetype?.split('/')?.[1] || 'bin').toLowerCase();
  return byMime.replace(/[^a-z0-9]/gi, '');
};

/**
 * Ambil S3 object key (filename) dari nilai yang tersimpan.
 * - Jika URL: ambil pathname, buang querystring, lalu kembalikan basename (segmen terakhir).
 * - Jika bukan URL: buang querystring lalu kembalikan basename dari path yang diberikan.
 * Hasil AKHIR: "abc123.jpg"
 */
export const extractS3Key = (stored: string): string => {
  if (!stored) return '';
  try {
    const u = new URL(stored);
    const cleanPath = u.pathname.split('?')[0];
    const parts = cleanPath.split('/').filter(Boolean);
    return parts.pop() || '';
  } catch {
    const clean = stored.split('?')[0];
    const parts = clean.split('/').filter(Boolean);
    return parts.pop() || clean;
  }
};

export const multerImageOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
      return cb(new BadRequestException('Only image files are allowed'), false);
    }
    cb(null, true);
  },
};
