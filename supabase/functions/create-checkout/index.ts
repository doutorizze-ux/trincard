import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { planId, userId, price, title, userEmail, name, cpfCnpj, frontendUrl } = await req.json()

        // 1. Configuração do ASAAS via Variáveis de Ambiente (Configurar no Painel do Supabase)
        const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
        const ASAAS_URL = Deno.env.get("ASAAS_URL") || 'https://www.asaas.com/api/v3';

        if (!ASAAS_API_KEY) {
            console.error("ERRO: ASAAS_API_KEY não configurada no Supabase.");
            return new Response(JSON.stringify({ error: "Erro de configuração no servidor." }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const headers = {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY
        };

        // 2. Buscar ou Criar Cliente no Asaas
        let customerId = '';

        // Tenta buscar por email
        const customerSearch = await fetch(`${ASAAS_URL}/customers?email=${userEmail}`, { headers });
        const customerData = await customerSearch.json();

        if (customerData.data && customerData.data.length > 0) {
            customerId = customerData.data[0].id;
        } else {
            // Cria novo cliente
            // Limpa CPF (apenas numeros)
            const cleanCpf = cpfCnpj ? cpfCnpj.replace(/\D/g, '') : '';

            const newCustomerRes = await fetch(`${ASAAS_URL}/customers`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name: name || 'Cliente Trincard',
                    email: userEmail,
                    cpfCnpj: cleanCpf,
                    notificationDisabled: false
                })
            });
            const newCustomer = await newCustomerRes.json();

            if (newCustomer.errors) {
                throw new Error(`Erro criando cliente Asaas: ${JSON.stringify(newCustomer.errors)}`);
            }
            customerId = newCustomer.id;
        }

        // 3. Criar Cobrança (Assinatura no Asaas cria cobranças automáticas)
        // Usamos externalReference para levar a chave "userId:planId"
        const subscriptionPayload = {
            customer: customerId,
            billingType: "UNDEFINED",
            value: Number(price),
            nextDueDate: new Date().toISOString().split('T')[0],
            cycle: "MONTHLY",
            description: title,
            externalReference: `${userId}:${planId}` // FORMATO CRÍTICO PARA O WEBHOOK
        };

        const subRes = await fetch(`${ASAAS_URL}/subscriptions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(subscriptionPayload)
        });

        const subData = await subRes.json();

        if (subData.errors) {
            throw new Error(`Erro criando assinatura Asaas: ${JSON.stringify(subData.errors)}`);
        }

        // 4. Buscar o Link de Pagamento da primeira cobrança dessa assinatura
        // A assinatura em si não tem "invoiceUrl", as "cobranças" dela tem.
        const paymentsRes = await fetch(`${ASAAS_URL}/subscriptions/${subData.id}/payments`, { headers });
        const paymentsData = await paymentsRes.json();

        let paymentUrl = '';
        if (paymentsData.data && paymentsData.data.length > 0) {
            // Pega o invoiceUrl da primeira cobrança pendente
            paymentUrl = paymentsData.data[0].invoiceUrl;
        } else {
            // Fallback: Talvez demore uns ms para criar a cobrança?
            // Se falhar, retornamos o ID e o front tenta lidar, mas ideal é o link.
            throw new Error("Assinatura criada, mas cobrança não encontrada imediatamente.");
        }

        // Sucesso! Retorna o link para o frontend redirecionar
        const responseData = {
            init_point: paymentUrl, // Mantendo a estrutura 'init_point' para não quebrar o frontend q ja espera isso
            subscription_id: subData.id
        };

        return new Response(JSON.stringify(responseData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
