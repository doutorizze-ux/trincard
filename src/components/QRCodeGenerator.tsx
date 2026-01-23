import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Calendar, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeGeneratorProps {
  userProfile: any;
  subscription: any;
}

interface QRCodeData {
  userId: string;
  subscriptionId: string;
  planName: string;
  expirationDate: string;
  generatedAt: string;
  barcode: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ userProfile, subscription }) => {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [expirationHours, setExpirationHours] = useState(24);
  const [isGenerating, setIsGenerating] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const generateQRCode = () => {
    if (!userProfile || !subscription) {
      toast.error('Dados de usuário ou assinatura não encontrados');
      return;
    }

    setIsGenerating(true);

    try {
      const now = new Date();
      const expirationDate = new Date(now.getTime() + (expirationHours * 60 * 60 * 1000));
      
      const qrCodeData: QRCodeData = {
        userId: userProfile.id,
        subscriptionId: subscription.id,
        planName: subscription.plan?.name || 'TrinCard',
        expirationDate: expirationDate.toISOString(),
        generatedAt: now.toISOString(),
        barcode: subscription.barcode
      };

      setQrData(qrCodeData);
      toast.success('QR Code gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrData || !qrRef.current) return;

    try {
      const svg = qrRef.current.querySelector('svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = 512;
      canvas.height = 512;

      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const link = document.createElement('a');
          link.download = `trincard-qr-${Date.now()}.png`;
          link.href = canvas.toDataURL();
          link.click();
          
          toast.success('QR Code baixado com sucesso!');
        }
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } catch (error) {
      console.error('Erro ao baixar QR Code:', error);
      toast.error('Erro ao baixar QR Code');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expirationDate: string) => {
    return new Date() > new Date(expirationDate);
  };

  const getTimeRemaining = (expirationDate: string) => {
    const now = new Date();
    const expiry = new Date(expirationDate);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m restantes`;
    }
    return `${minutes}m restantes`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Gerador de QR Code</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Válido por tempo limitado</span>
        </div>
      </div>

      {/* Configurações de Expiração */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tempo de validade do QR Code
        </label>
        <div className="flex items-center space-x-4">
          <select
            value={expirationHours}
            onChange={(e) => setExpirationHours(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1}>1 hora</option>
            <option value={2}>2 horas</option>
            <option value={6}>6 horas</option>
            <option value={12}>12 horas</option>
            <option value={24}>24 horas</option>
            <option value={48}>48 horas</option>
            <option value={72}>72 horas</option>
          </select>
          
          <button
            onClick={generateQRCode}
            disabled={isGenerating || !subscription}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>{isGenerating ? 'Gerando...' : 'Gerar QR Code'}</span>
          </button>
        </div>
      </div>

      {/* QR Code Display */}
      {qrData && (
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
            {/* QR Code */}
            <div className="flex-shrink-0">
              <div 
                ref={qrRef}
                className={`p-4 bg-white rounded-lg border-2 ${
                  isExpired(qrData.expirationDate) 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-200'
                }`}
              >
                <QRCodeSVG
                  value={JSON.stringify(qrData)}
                  size={200}
                  level="M"
                  includeMargin={true}
                  className={isExpired(qrData.expirationDate) ? 'opacity-50' : ''}
                />
              </div>
              
              <div className="mt-4 flex justify-center">
                <button
                  onClick={downloadQRCode}
                  disabled={isExpired(qrData.expirationDate)}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar QR Code</span>
                </button>
              </div>
            </div>

            {/* QR Code Info */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plano</label>
                  <p className="text-gray-900 font-semibold">{qrData.planName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Código de Barras</label>
                  <p className="text-gray-900 font-mono text-sm">{qrData.barcode}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gerado em</label>
                  <p className="text-gray-900">{formatDate(qrData.generatedAt)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expira em</label>
                  <p className={`font-semibold ${
                    isExpired(qrData.expirationDate) 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {formatDate(qrData.expirationDate)}
                  </p>
                </div>
              </div>
              
              {/* Status */}
              <div className="mt-4">
                <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                  isExpired(qrData.expirationDate)
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">
                    {isExpired(qrData.expirationDate) 
                      ? 'QR Code Expirado' 
                      : getTimeRemaining(qrData.expirationDate)
                    }
                  </span>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Como usar:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Apresente este QR Code no estabelecimento parceiro</li>
                  <li>• O parceiro irá escanear o código para validar sua assinatura</li>
                  <li>• O QR Code expira automaticamente após o tempo selecionado</li>
                  <li>• Gere um novo código quando necessário</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!qrData && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum QR Code gerado</h3>
          <p className="text-gray-600 mb-4">
            Clique em "Gerar QR Code" para criar um código temporário
          </p>
          {!subscription && (
            <p className="text-sm text-red-600">
              Você precisa ter uma assinatura ativa para gerar QR Codes
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
