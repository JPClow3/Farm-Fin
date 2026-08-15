import { z } from 'zod';

export const calculateDRESchema = z.object({
  seasonId: z.string().min(1, 'ID da safra é obrigatório.'),
});

export const generateLCDPRSchema = z.object({
  year: z.number().int().min(2000, 'Ano inválido.').max(2100, 'Ano inválido.'),
  farmId: z.string().min(1, 'ID da fazenda é obrigatório.'),
});

export const validateLCDPRSchema = z.object({
  year: z.number().int().min(2000, 'Ano inválido.').max(2100, 'Ano inválido.'),
  farmId: z.string().min(1, 'ID da fazenda é obrigatório.'),
});

export const uploadOFXSchema = z.object({
  fileContent: z.string().min(10, 'Conteúdo do arquivo OFX inválido ou vazio.'),
});

export const storageUrlSchema = z.object({
  filename: z.string().min(1, 'Nome do arquivo é obrigatório.'),
  contentType: z.string().min(1, 'Tipo de conteúdo MIME é obrigatório.'),
});

export const storageDownloadUrlSchema = z.object({
  filename: z.string().min(1, 'Nome do arquivo é obrigatório.'),
});

export type CalculateDREInput = z.infer<typeof calculateDRESchema>;
export type GenerateLCDPRInput = z.infer<typeof generateLCDPRSchema>;
export type ValidateLCDPRInput = z.infer<typeof validateLCDPRSchema>;
export type UploadOFXInput = z.infer<typeof uploadOFXSchema>;
export type StorageUrlInput = z.infer<typeof storageUrlSchema>;
export type StorageDownloadUrlInput = z.infer<typeof storageDownloadUrlSchema>;
