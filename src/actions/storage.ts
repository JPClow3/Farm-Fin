'use server';

import { storageUrlSchema, storageDownloadUrlSchema } from '@/lib/validations';
import { ActionResult } from '@/lib/action-result';

/**
 * Server Actions for interacting with Cloudflare R2 Storage.
 */

/**
 * Generates a presigned URL for uploading a document to R2.
 */
export async function getUploadUrl(
  filename: string,
  contentType: string
): Promise<ActionResult<{ url: string; filename: string }>> {
  try {
    const parsed = storageUrlSchema.safeParse({ filename, contentType });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Parâmetros de arquivo inválidos',
      };
    }

    // Mock/R2 Presigned Upload URL generator
    const url = `https://mock-r2-url.com/upload/${encodeURIComponent(parsed.data.filename)}`;
    return {
      success: true,
      data: {
        url,
        filename: parsed.data.filename,
      },
      message: 'Upload URL gerada com sucesso.',
    };
  } catch (error) {
    console.error('[getUploadUrl] Error generating presigned URL:', error);
    return {
      success: false,
      error: 'Erro ao gerar URL de upload.',
    };
  }
}

/**
 * Generates a presigned URL for downloading a document from R2.
 */
export async function getDownloadUrl(filename: string): Promise<ActionResult<{ url: string }>> {
  try {
    const parsed = storageDownloadUrlSchema.safeParse({ filename });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Nome do arquivo inválido',
      };
    }

    const url = `https://mock-r2-url.com/download/${encodeURIComponent(parsed.data.filename)}`;
    return {
      success: true,
      data: { url },
    };
  } catch (error) {
    console.error('[getDownloadUrl] Error generating download URL:', error);
    return {
      success: false,
      error: 'Erro ao gerar URL de download.',
    };
  }
}
