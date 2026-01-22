import { supabase } from './supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Faz upload de um arquivo para o Supabase Storage
 * @param file - Arquivo a ser enviado
 * @param bucket - Nome do bucket (ex: 'contracts')
 * @param folder - Pasta dentro do bucket (ex: 'partners')
 * @returns Promise com resultado do upload
 */
export async function uploadFile(
  file: File,
  bucket: string = 'contracts',
  folder: string = 'partners'
): Promise<UploadResult> {
  try {
    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Tipo de arquivo não permitido. Use PDF, DOC, DOCX, JPG ou PNG.'
      };
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Arquivo muito grande. Tamanho máximo: 10MB.'
      };
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}_${randomString}.${fileExtension}`;

    // Fazer upload
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erro no upload:', error);
      return {
        success: false,
        error: `Erro no upload: ${error.message}`
      };
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl
    };

  } catch (error) {
    console.error('Erro inesperado no upload:', error);
    return {
      success: false,
      error: 'Erro inesperado durante o upload.'
    };
  }
}

/**
 * Remove um arquivo do Supabase Storage
 * @param url - URL do arquivo a ser removido
 * @param bucket - Nome do bucket
 * @returns Promise com resultado da remoção
 */
export async function deleteFile(
  url: string,
  bucket: string = 'contracts'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extrair o caminho do arquivo da URL
    const urlParts = url.split('/');
    const fileName = urlParts.slice(-2).join('/'); // pasta/arquivo.ext

    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      console.error('Erro ao remover arquivo:', error);
      return {
        success: false,
        error: `Erro ao remover arquivo: ${error.message}`
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Erro inesperado ao remover arquivo:', error);
    return {
      success: false,
      error: 'Erro inesperado ao remover arquivo.'
    };
  }
}

/**
 * Valida se um arquivo é válido para upload
 * @param file - Arquivo a ser validado
 * @returns Objeto com resultado da validação
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não permitido. Use PDF, DOC, DOCX, JPG ou PNG.'
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Arquivo muito grande. Tamanho máximo: 10MB.'
    };
  }

  return { valid: true };
}