import { api } from './api';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Faz upload de um arquivo para o backend próprio (substituindo Supabase)
 * @param file - Arquivo a ser enviado
 * @param bucket - Ignorado na implementação atual (legado)
 * @param folder - Ignorado na implementação atual (legado)
 * @returns Promise com resultado do upload
 */
export async function uploadFile(
  file: File,
  bucket: string = 'contracts',
  folder: string = 'partners'
): Promise<UploadResult> {
  try {
    // Validar tipo de arquivo
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    // Usar o endpoint de upload recém-criado
    // O fetch não adiciona automaticamente o header Content-Type para FormData se setarmos manualmente 'application/json'
    // Então usaremos fetch direto, ou precisamos ajustar a lib api.ts para lidar com FormData

    // Vamos usar fetch direto para simplificar o FormData handling
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Nota: NÃO setar 'Content-Type': 'multipart/form-data', o browser faz isso com o boundary correto.

    const apiUrl = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${apiUrl}/api/upload`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status} ao enviar arquivo`);
    }

    const data = await response.json();

    return {
      success: true,
      url: data.url
    };

  } catch (error: any) {
    console.error('Erro inesperado no upload:', error);

    let errorMessage = error.message || 'Erro inesperado durante o upload.';

    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      errorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
    } else if (errorMessage.includes('API not found') || errorMessage.includes('404')) {
      errorMessage = 'Endpoint de upload não encontrado (404). Verifique a URL da API.';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Remove um arquivo (Placeholder para compatibilidade)
 */
export async function deleteFile(
  url: string,
  bucket: string = 'contracts'
): Promise<{ success: boolean; error?: string }> {
  // Implementação futura: chamar endpoint DELETE /api/upload?url=...
  console.log('Delete file not implemented yet on server', url);
  return { success: true };
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
    'image/jpg',
    'image/webp'
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