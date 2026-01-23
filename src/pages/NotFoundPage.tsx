import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  Home, 
  ArrowLeft, 
  Search, 
  MapPin, 
  AlertTriangle
} from 'lucide-react';

export default function NotFoundPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="relative">
              <div className="text-9xl font-bold text-gray-200 select-none">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Página não encontrada
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Ops! A página que você está procurando não existe.
            </p>
            <p className="text-sm text-gray-500">
              Ela pode ter sido movida, excluída ou você digitou o endereço incorretamente.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              to="/"
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center space-x-2"
            >
              <Home className="h-5 w-5" />
              <span>Voltar ao Início</span>
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-semibold flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Página Anterior</span>
            </button>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Talvez você esteja procurando por:
            </h2>
            
            <div className="grid grid-cols-1 gap-3">
              <Link
                to="/parceiros"
                className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Parceiros</p>
                  <p className="text-sm text-gray-600">Encontre estabelecimentos parceiros</p>
                </div>
              </Link>
              
              <Link
                to="/login"
                className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Search className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Fazer Login</p>
                  <p className="text-sm text-gray-600">Acesse sua conta </p>
                </div>
              </Link>
              
              <Link
                to="/cadastro"
                className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Home className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Criar Conta</p>
                  <p className="text-sm text-gray-600">Cadastre-se no </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Precisa de ajuda?</strong>
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Entre em contato com nosso suporte em{' '}
              <a 
                href="mailto:suporte@.com" 
                className="font-medium underline hover:no-underline"
              >
                suporte@.com
              </a>
            </p>
          </div>

          {/* Fun Fact */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              💡 Você sabia? O erro 404 significa "Not Found" e é um dos códigos de status HTTP mais conhecidos!
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
