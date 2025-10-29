import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function generateHmacMd5Signature(message: string, secretKey: string): string {
  const hmac = createHmac('md5', secretKey);
  hmac.update(message);
  return hmac.digest('hex');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const secretKey = Deno.env.get('WAYFORPAY_SECRET_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const webhookData = await req.json();

    console.log('WayForPay webhook received:', JSON.stringify({
      orderReference: webhookData.orderReference,
      transactionStatus: webhookData.transactionStatus,
      reasonCode: webhookData.reasonCode,
      amount: webhookData.amount,
      timestamp: new Date().toISOString()
    }));

    const orderReference = webhookData.orderReference;

    if (!orderReference) {
      console.error('Missing order reference in webhook');
      return new Response(
        JSON.stringify({ error: 'Missing order reference' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const signatureParts = [
      webhookData.merchantAccount,
      webhookData.orderReference,
      webhookData.amount,
      webhookData.currency,
      webhookData.authCode || '',
      webhookData.cardPan || '',
      webhookData.transactionStatus,
      webhookData.reasonCode
    ];
    const signatureString = signatureParts.join(';');

    const expectedSignature = generateHmacMd5Signature(signatureString, secretKey);

    if (webhookData.merchantSignature !== expectedSignature) {
      console.error('Invalid webhook signature:', {
        received: webhookData.merchantSignature,
        expected: expectedSignature
      });
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (webhookData.transactionStatus === 'Approved') {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', orderReference)
        .maybeSingle();

      if (orderError || !order) {
        console.error('Error fetching order:', orderError);
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (order.status === 'completed') {
        console.log('Order already completed (idempotency check):', orderReference);

        const responseTime = Math.floor(Date.now() / 1000);
        const responseSignatureString = orderReference + ';accept;' + responseTime;
        const responseSignature = generateHmacMd5Signature(responseSignatureString, secretKey);

        return new Response(
          JSON.stringify({
            orderReference: orderReference,
            status: 'accept',
            time: responseTime,
            signature: responseSignature
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const entries = [];
      for (let i = 0; i < order.package_quantity; i++) {
        entries.push({
          first_name: order.customer_email.split('@')[0],
          last_name: order.customer_phone || 'N/A',
          phone: order.customer_phone,
          email: order.customer_email,
          package_name: order.package_name,
          package_price: Number(order.amount),
          order_id: orderReference,
          payment_status: 'paid',
          transaction_number: webhookData.transactionId || orderReference
        });
      }

      const { data: insertedEntries, error: entriesError } = await supabase
        .from('sticker_entries')
        .insert(entries)
        .select('position_number');

      if (entriesError) {
        console.error('Error creating sticker entries:', entriesError);
        return new Response(
          JSON.stringify({ error: 'Failed to create entries' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderReference);

      if (updateOrderError) {
        console.error('Error updating order status:', updateOrderError);
      }

      const positions = insertedEntries.map(entry => entry.position_number);

      console.log('Payment processed successfully:', {
        orderId: orderReference,
        transactionId: webhookData.transactionId,
        entriesCreated: insertedEntries.length,
        positions: positions.sort((a, b) => a - b)
      });

      const responseTime = Math.floor(Date.now() / 1000);
      const responseSignatureString = orderReference + ';accept;' + responseTime;
      const responseSignature = generateHmacMd5Signature(responseSignatureString, secretKey);

      return new Response(
        JSON.stringify({
          orderReference: orderReference,
          status: 'accept',
          time: responseTime,
          signature: responseSignature
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (webhookData.transactionStatus === 'Declined' || webhookData.transactionStatus === 'Expired') {
      await supabase
        .from('orders')
        .update({
          status: webhookData.transactionStatus.toLowerCase(),
          error_message: webhookData.reason || 'Payment declined or expired',
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderReference);

      console.log('Order marked as ' + webhookData.transactionStatus + ': ' + orderReference);

      const responseTime = Math.floor(Date.now() / 1000);
      const responseSignatureString = orderReference + ';accept;' + responseTime;
      const responseSignature = generateHmacMd5Signature(responseSignatureString, secretKey);

      return new Response(
        JSON.stringify({
          orderReference: orderReference,
          status: 'accept',
          time: responseTime,
          signature: responseSignature
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const responseTime = Math.floor(Date.now() / 1000);
    const responseSignatureString = orderReference + ';accept;' + responseTime;
    const responseSignature = generateHmacMd5Signature(responseSignatureString, secretKey);

    return new Response(
      JSON.stringify({
        orderReference: orderReference,
        status: 'accept',
        time: responseTime,
        signature: responseSignature
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
