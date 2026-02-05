// Este arquivo agora contém apenas tipos/interfaces para o sistema.
// O Supabase foi descontinuado em favor da API própria no Coolify.

export interface User {
  id: string
  email: string
  full_name: string
  cpf: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zip_code: string
  }
  // Campos individuais para compatibilidade com formulários
  city?: string
  state?: string
  zip_code?: string
  profile_photo_url?: string
  card_type: 'digital' | 'physical'
  role?: string
  is_active: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
  subscriptions?: Subscription[]
}

export interface Plan {
  id: string
  name: string
  price: number
  description: string
  features: string[] | {
    max_benefits?: number
    physical_card?: boolean
    priority_support?: boolean
    [key: string]: any
  }
  is_active: boolean
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'inactive' | 'suspended' | 'cancelled'
  barcode: string
  start_date: string
  due_date: string
  end_date?: string
  created_at: string
  updated_at: string
  plans?: Plan
  users?: User
}

export interface Partner {
  id: string
  company_name: string
  name?: string // Alias para company_name
  category?: string
  description?: string
  logo_url?: string
  percentage: number
  contract_url?: string
  document_status: 'uploaded' | 'missing' | 'pending'
  contact_email?: string
  contact_phone?: string
  notes?: string
  created_by?: string
  address?: {
    street: string
    city: string
    state: string
    zip_code: string
  }
  // Campos individuais para compatibilidade
  city?: string
  phone?: string
  email?: string
  website?: string
  status?: string
  contact_info?: {
    phone: string
    email: string
  }
  approval_status: 'approved' | 'pending' | 'rejected' | 'pending_documentation'
  approval_date?: string
  created_at: string
  updated_at: string
  benefits?: Benefit[]
}

export interface Benefit {
  id: string
  partner_id: string
  title?: string
  description: string
  benefit_type: 'percentage' | 'fixed_amount' | 'free_service'
  value?: number
  discount_percentage?: number
  is_active: boolean
  created_at: string
  partners?: Partner
  benefit_usage?: BenefitUsage[]
}

export interface BenefitUsage {
  id: string
  user_id: string
  benefit_id: string
  used_at: string
  discount_applied: number
  location: string
  users?: User
  benefits?: Benefit
}

export interface Payment {
  id: string
  user_id: string
  subscription_id: string
  amount: number
  payment_method: 'credit_card' | 'debit_card' | 'pix' | 'boleto'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  transaction_id?: string
  paid_at?: string
  created_at: string
  updated_at: string
  users?: User
  subscriptions?: Subscription
}