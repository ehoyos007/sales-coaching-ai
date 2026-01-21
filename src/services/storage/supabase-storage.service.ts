/**
 * Supabase Storage Service
 * Handles file uploads to Supabase Storage for sales scripts
 */

import { getSupabaseClient } from '../../config/database.js';
import { MAX_FILE_SIZE_BYTES, SUPPORTED_FILE_TYPES, ScriptFileType } from '../../types/scripts.types.js';

const BUCKET_NAME = 'sales-scripts';

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
  fileSize: number;
  fileType: ScriptFileType;
}

export interface StorageError {
  code: string;
  message: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  fileBuffer: Buffer,
  originalFileName: string,
  mimeType: string
): Promise<UploadResult> {
  const db = getSupabaseClient();

  // Validate file size
  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`);
  }

  // Validate file type
  const extension = getFileExtension(originalFileName);
  const expectedMimeType = SUPPORTED_FILE_TYPES[extension];
  if (!expectedMimeType) {
    throw new Error(`Unsupported file type: ${extension}. Supported: ${Object.keys(SUPPORTED_FILE_TYPES).join(', ')}`);
  }

  // Generate unique file path
  const timestamp = Date.now();
  const sanitizedName = sanitizeFileName(originalFileName);
  const filePath = `${timestamp}-${sanitizedName}`;

  // Upload to Supabase Storage
  const { data, error } = await db.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error('[Storage] Upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = db.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    fileName: originalFileName,
    fileSize: fileBuffer.length,
    fileType: expectedMimeType,
  };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  const db = getSupabaseClient();

  const { error } = await db.storage.from(BUCKET_NAME).remove([filePath]);

  if (error) {
    console.error('[Storage] Delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Download a file from Supabase Storage
 */
export async function downloadFile(filePath: string): Promise<Buffer> {
  const db = getSupabaseClient();

  const { data, error } = await db.storage.from(BUCKET_NAME).download(filePath);

  if (error) {
    console.error('[Storage] Download error:', error);
    throw new Error(`Failed to download file: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Check if storage bucket exists, create if not
 */
export async function ensureBucketExists(): Promise<boolean> {
  const db = getSupabaseClient();

  const { data: buckets, error: listError } = await db.storage.listBuckets();

  if (listError) {
    console.error('[Storage] Error listing buckets:', listError);
    return false;
  }

  const bucketExists = buckets.some(b => b.name === BUCKET_NAME);

  if (!bucketExists) {
    const { error: createError } = await db.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE_BYTES,
      allowedMimeTypes: Object.values(SUPPORTED_FILE_TYPES),
    });

    if (createError) {
      console.error('[Storage] Error creating bucket:', createError);
      return false;
    }

    console.log(`[Storage] Created bucket: ${BUCKET_NAME}`);
  }

  return true;
}

/**
 * Get signed URL for private file access
 */
export async function getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
  const db = getSupabaseClient();

  const { data, error } = await db.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error('[Storage] Signed URL error:', error);
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Sanitize file name to remove special characters
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 100);
}

/**
 * Get file extension from file name
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.slice(lastDot).toLowerCase();
}

export const storageService = {
  uploadFile,
  deleteFile,
  downloadFile,
  ensureBucketExists,
  getSignedUrl,
};
