import { type Request, type Response } from 'express';

// @ts-ignore
export const createCheckout = async (req: Request, res: Response) => {
    try {
        const { planId, userId, price, title, userEmail, name, cpfCnpj } = req.body;

        const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
        const ASAAS_URL = process.env.ASAAS_API_URI || process.env.ASAAS_URL || 'https://www.asaas.com/api/v3';

        // Debug: Listar chaves ASAAS disponíveis
        const availableKeys = Object.keys(process.env).filter(k => k.startsWith('ASAAS'));
        console.log('Chaves ASAAS detectadas no ambiente:', availableKeys);

        if (!ASAAS_API_KEY) {
            console.error("ERRO: ASAAS_API_KEY não encontrada nas variáveis de ambiente. Chaves disponíveis:", availableKeys);
            return res.status(500).json({ error: "Erro de configuração no servidor de pagamentos. Verifique as variáveis no Coolify." });
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY
        };

        // 1. Buscar ou Criar Cliente no Asaas
        let customerId = '';
        const customerSearch = await fetch(`${ASAAS_URL}/customers?email=${userEmail}`, { headers });
        const customerData: any = await customerSearch.json();

        if (customerData.data && customerData.data.length > 0) {
            customerId = customerData.data[0].id;
        } else {
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
            const newCustomer: any = await newCustomerRes.json();

            if (newCustomer.errors) {
                console.error('Erro Asaas create customer:', newCustomer.errors);
                return res.status(400).json({ error: `Erro ao criar cliente no gateway: ${newCustomer.errors[0].description}` });
            }
            customerId = newCustomer.id;
        }

        // 2. Criar Assinatura no Asaas
        const subscriptionPayload = {
            customer: customerId,
            billingType: "UNDEFINED",
            value: Number(price),
            nextDueDate: new Date().toISOString().split('T')[0],
            cycle: "MONTHLY",
            description: title,
            externalReference: `${userId}:${planId}`
        };

        const subRes = await fetch(`${ASAAS_URL}/subscriptions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(subscriptionPayload)
        });

        const subData: any = await subRes.json();

        if (subData.errors) {
            console.error('Erro Asaas create subscription:', subData.errors);
            return res.status(400).json({ error: `Erro ao criar assinatura: ${subData.errors[0].description}` });
        }

        // 3. Buscar o Link de Pagamento da primeira cobrança
        const paymentsRes = await fetch(`${ASAAS_URL}/subscriptions/${subData.id}/payments`, { headers });
        const paymentsData: any = await paymentsRes.json();

        if (paymentsData.data && paymentsData.data.length > 0) {
            res.json({
                init_point: paymentsData.data[0].invoiceUrl,
                subscription_id: subData.id
            });
        } else {
            res.status(400).json({ error: "Assinatura criada, mas cobrança não encontrada imediatamente." });
        }

    } catch (error: any) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: error.message || 'Erro interno no processo de checkout' });
    }
};
