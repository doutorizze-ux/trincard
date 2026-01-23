import React, { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Edit, Trash2, Loader2 } from 'lucide-react'

// Memoized Partner Card
export const PartnerCard = memo(({ 
  partner, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  isDeleting, 
  isLoading 
}: {
  partner: any
  onEdit: (partner: any) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
  isDeleting: boolean
  isLoading: boolean
}) => {
  return (
    <Card key={partner.id}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{partner.name}</CardTitle>
          <Badge 
            variant={partner.status === 'active' ? 'default' : 'secondary'}
          >
            {partner.status === 'active' ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
        <CardDescription>{partner.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <strong>Categoria:</strong> {partner.category}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Localização:</strong> {partner.location}
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(partner)}
              disabled={isLoading}
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              variant={partner.status === 'active' ? 'secondary' : 'default'}
              size="sm"
              onClick={() => onStatusChange(partner.id, partner.status === 'active' ? 'inactive' : 'active')}
              disabled={isLoading}
            >
              {partner.status === 'active' ? 'Desativar' : 'Ativar'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(partner.id)}
              disabled={isDeleting || isLoading}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

PartnerCard.displayName = 'PartnerCard'

// Memoized User Card
export const UserCard = memo(({ user }: { user: any }) => {
  return (
    <Card key={user.id}>
      <CardHeader>
        <CardTitle className="text-lg">{user.full_name || 'Nome não informado'}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <strong>Criado em:</strong> {new Date(user.created_at).toLocaleDateString('pt-BR')}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Último acesso:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR') : 'Nunca'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
})

UserCard.displayName = 'UserCard'

// Memoized Subscription Card
export const SubscriptionCard = memo(({ subscription }: { subscription: any }) => {
  return (
    <Card key={subscription.id}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {subscription.users?.full_name || subscription.users?.email || 'Usuário não encontrado'}
          </CardTitle>
          <Badge 
            variant={subscription.status === 'active' ? 'default' : 'secondary'}
          >
            {subscription.status === 'active' ? 'Ativa' : subscription.status}
          </Badge>
        </div>
        <CardDescription>
          {subscription.plans?.name || 'Plano não encontrado'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <strong>Preço:</strong> R$ {subscription.plans?.price || 0}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Criada em:</strong> {new Date(subscription.created_at).toLocaleDateString('pt-BR')}
          </p>
          {subscription.expires_at && (
            <p className="text-sm text-gray-600">
              <strong>Expira em:</strong> {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

SubscriptionCard.displayName = 'SubscriptionCard'

// Memoized Stats Card
export const StatsCard = memo(({ 
  title, 
  value, 
  description, 
  icon: Icon,
  bgColor = 'bg-gray-100',
  iconColor = 'text-gray-600'
}: { 
  title: string
  value: string | number
  description: string
  icon: any
  bgColor?: string
  iconColor?: string
}) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center space-x-3">
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  )
})

StatsCard.displayName = 'StatsCard'
