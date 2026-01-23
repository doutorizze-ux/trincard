import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { uploadFile, validateFile, UploadResult } from '../lib/fileUpload';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadError: (error: string) => void;
  currentFile?: string;
  onRemoveFile?: () => void;
  accept?: string;
  maxSize?: number;
  bucket?: string;
  folder?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export default function FileUpload({
  onUploadComplete,
  onUploadError,
  currentFile,
  onRemoveFile,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  bucket = 'contracts',
  folder = 'partners',
  disabled = false,
  label = 'Upload de Arquivo',
  description = 'Selecione um arquivo PDF, DOC, DOCX, JPG ou PNG (máx. 10MB)'
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validar arquivo
    const validation = validateFile(file);
    if (!validation.valid) {
      onUploadError(validation.error || 'Arquivo inválido');
      return;
    }

    setUploading(true);

    try {
      const result: UploadResult = await uploadFile(file, bucket, folder);
      
      if (result.success && result.url) {
        onUploadComplete(result.url);
      } else {
        onUploadError(result.error || 'Erro no upload');
      }
    } catch (error) {
      onUploadError('Erro inesperado durante o upload');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <p className="text-sm text-gray-500 mb-3">{description}</p>
      </div>

      {currentFile ? (
        // Arquivo já carregado
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Arquivo carregado
                </p>
                <p className="text-xs text-green-600">
                  {getFileName(currentFile)}
                </p>
              </div>
            </div>
            {onRemoveFile && (
              <button
                type="button"
                onClick={onRemoveFile}
                disabled={disabled}
                className="text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="mt-3 flex space-x-2">
            <a
              href={currentFile}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Visualizar arquivo
            </a>
            {!disabled && (
              <button
                type="button"
                onClick={openFileDialog}
                className="text-xs text-gray-600 hover:text-gray-800 underline"
              >
                Substituir arquivo
              </button>
            )}
          </div>
        </div>
      ) : (
        // Área de upload
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!disabled ? openFileDialog : undefined}
        >
          {uploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Enviando arquivo...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600">Clique para enviar</span>
                  {' '}ou arraste e solte
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, DOCX, JPG, PNG até 10MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || uploading}
        className="hidden"
      />
    </div>
  );
}
