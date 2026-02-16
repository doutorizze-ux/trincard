import { type Request, type Response } from 'express';

// @ts-ignore
import pool from '../config/db.js';

export const createCheckout = async (req: Request, res: Response) => {
    try {
        const { planId, userId, price, title, userEmail, name, cpfCnpj } = req.body;

        const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
        const ASAAS_URL = process.env.ASAAS_URL || process.env.ASAAS_API_URI || 'https://www.asaas.com/api/v3';

        // Determinar ambiente para log
        const isSandbox = ASAAS_URL.includes('sandbox');
        console.log(`[Checkout] Iniciando transação no ambiente: ${isSandbox ? 'SANDBOX (Teste)' : 'PRODUÇÃO'}`);

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
        if (!cpfCnpj) {
            return res.status(400).json({ error: "CPF/CNPJ é obrigatório para processar o pagamento." });
        }

        const cleanCpf = cpfCnpj.replace(/\D/g, '');

        // 1. Buscar ou Criar Cliente no Asaas
        let customerId = '';
        const customerSearch = await fetch(`${ASAAS_URL}/customers?email=${userEmail}`, { headers });
        const customerData: any = await customerSearch.json();

        if (customerData.data && customerData.data.length > 0) {
            customerId = customerData.data[0].id;

            // Verifica se o cliente existente já tem CPF, se não, atualiza
            if (!customerData.data[0].cpfCnpj && cleanCpf) {
                console.log(`Atualizando CPF do cliente ${customerId}...`);
                await fetch(`${ASAAS_URL}/customers/${customerId}`, {
                    method: 'POST', // Asaas usa POST para update em alguns endpoints, mas doc diz PUT ou POST
                    headers,
                    body: JSON.stringify({ cpfCnpj: cleanCpf })
                });
            }
        } else {
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
        const billingType = req.body.billingType || "UNDEFINED";
        const cardData = req.body.cardData;

        // MANUAL DATE FORMATTING (Safety) - Usa fuso de Brasília para o vencimento inicial no Asaas
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

        const subPayload: any = {
            customer: customerId,
            billingType: billingType,
            value: Number(price),
            nextDueDate: todayStr, // Força a data de hoje formatada manualmente
            cycle: "MONTHLY",
            description: title,
            externalReference: `${userId}:${planId}`
        };

        // Se for cartão, adicionamos os detalhes técnicos
        if (billingType === 'CREDIT_CARD' && cardData) {
            // Buscar dados de endereço do usuário no banco (address é JSONB)
            const userDataResult = await pool.query(
                'SELECT address, phone FROM users WHERE id = $1',
                [userId]
            );
            const userData = userDataResult.rows[0] || {};
            const userAddress = userData.address || {};

            subPayload.creditCard = {
                holderName: cardData.holderName,
                number: cardData.number,
                expiryMonth: cardData.expiryMonth,
                expiryYear: cardData.expiryYear,
                ccv: cardData.cvv
            };
            subPayload.creditCardHolderInfo = {
                name: cardData.holderName,
                email: userEmail,
                cpfCnpj: cpfCnpj ? cpfCnpj.replace(/\D/g, '') : '',
                postalCode: userAddress.postalCode || userAddress.postal_code || '01310100',
                addressNumber: userAddress.number || '100',
                addressComplement: 'Assinatura Trincard',
                phone: userData.phone || '62999999999'
            };
        }

        const subRes = await fetch(`${ASAAS_URL}/subscriptions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(subPayload)
        });

        const subData: any = await subRes.json();

        if (subData.errors) {
            console.error('Erro Asaas create subscription:', subData.errors);
            return res.status(400).json({ error: `Erro ao criar assinatura: ${subData.errors[0].description}` });
        }

        // 3. Buscar o Link de Pagamento e checar data de vencimento
        const paymentsRes = await fetch(`${ASAAS_URL}/subscriptions/${subData.id}/payments`, { headers });
        const paymentsData: any = await paymentsRes.json();

        let initialStatus = 'pending';
        let firstPayment = null;

        if (paymentsData.data && paymentsData.data.length > 0) {
            firstPayment = paymentsData.data[0];

            // SAFETY CHECK: Se a data de vencimento ficou para o mês que vem, force para hoje
            if (firstPayment.dueDate !== todayStr) {
                console.log(`[Checkout Alert] Pagamento ${firstPayment.id} gerado com vencimento em ${firstPayment.dueDate}. Forçando para hoje (${todayStr})...`);

                try {
                    await fetch(`${ASAAS_URL}/payments/${firstPayment.id}`, {
                        method: 'POST', // Update no Asaas é POST
                        headers,
                        body: JSON.stringify({ dueDate: todayStr })
                    });

                    // Re-busca os dados atualizados
                    const updatedPaymentRes = await fetch(`${ASAAS_URL}/payments/${firstPayment.id}`, { headers });
                    firstPayment = await updatedPaymentRes.json();
                    console.log(`[Checkout Fix] Vencimento atualizado para ${firstPayment.dueDate}. Status: ${firstPayment.status}`);
                } catch (updateErr) {
                    console.error('[Checkout Fix Error] Falha ao atualizar vencimento:', updateErr);
                }
            }

            const confirmedStatus = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
            if (confirmedStatus.includes(firstPayment.status)) {
                initialStatus = 'active';
            }
        }

        // SALVAR ASSINATURA NO BANCO
        try {
            const tempBarcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();

            // Datas para o registro local
            const startDate = new Date();

            // Determinar duração para o registro inicial (evita mostrar 30 dias para plano anual)
            let durationDays = 30;
            const planTitleLower = title?.toLowerCase() || '';
            if (planTitleLower.includes('anual')) {
                durationDays = 365;
            } else if (planTitleLower.includes('semestral')) {
                durationDays = 180;
            } else if (planTitleLower.includes('trimestral')) {
                durationDays = 90;
            }

            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + durationDays);

            const subResult = await pool.query(`
                INSERT INTO subscriptions (
                    user_id, plan_id, gateway_id, status, barcode, due_date, start_date, end_date, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                RETURNING id
            `, [
                userId,
                planId,
                subData.id,
                initialStatus,
                tempBarcode,
                endDate.toISOString(), // Ajustado: due_date local representa o fim do período (renovação)
                startDate.toISOString(),
                endDate.toISOString()
            ]);

            if (initialStatus === 'active' && firstPayment) {
                console.log(`[Checkout] Ativação imediata para user ${userId} (Cartão confirmado)`);
                await pool.query(`
                    INSERT INTO payments (subscription_id, user_id, amount, payment_method, status, transaction_id, paid_at, created_at)
                    VALUES ($1, $2, $3, $4, 'completed', $5, NOW(), NOW())
                `, [
                    subResult.rows[0].id,
                    userId,
                    firstPayment.value,
                    'credit_card',
                    firstPayment.id
                ]);
            }
        } catch (dbError) {
            console.error('Erro ao salvar assinatura no banco:', dbError);
        }

        if (firstPayment) {
            // 4. Buscar QR Code se for PIX
            let pixData = null;
            if (billingType === 'PIX') {
                try {
                    const pixRes = await fetch(`${ASAAS_URL}/payments/${firstPayment.id}/pixQrCode`, { headers });
                    pixData = await pixRes.json();
                } catch (pError) {
                    console.error('Erro ao buscar QR Code Pix:', pError);
                }
            }

            res.json({
                init_point: firstPayment.invoiceUrl,
                payment_id: firstPayment.id,
                subscription_id: subData.id,
                status: initialStatus,
                value: firstPayment.value,
                pix: pixData?.encodedImage ? {
                    qrCode: pixData.encodedImage,
                    copyAndPaste: pixData.payload
                } : null
            });
        } else {
            res.status(400).json({ error: "Assinatura criada, mas cobrança não encontrada imediatamente." });
        }

    } catch (error: any) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: error.message || 'Erro interno no processo de checkout' });
    }
};
