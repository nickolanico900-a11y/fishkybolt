import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

async function generateHmacMd5Signature(message: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const msgData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: 'MD5' } },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
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
    const merchantAccount = Deno.env.get('WAYFORPAY_MERCHANT_ACCOUNT')!;
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

    const signatureString = `${webhookData.merchantAccount};${webhookData.orderReference};${webhookData.amount};${webhookData.currency};${webhookData.authCode || ''};${webhookData.cardPan || ''};${webhookData.transactionStatus};${webhookData.reasonCode}`;

    const expectedSignature = generateSignature(signatureString, secretKey);

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
        const responseSignatureString = `${orderReference};accept;${responseTime}`;
        const responseSignature = await generateSignature(responseSignatureString, secretKey);

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
      for (let i = 0; i < order.sticker_count; i++) {
        entries.push({
          first_name: order.first_name,
          last_name: order.last_name,
          phone: order.phone,
          email: order.email,
          package_name: order.package_name,
          package_price: order.package_price,
          order_id: orderReference,
          payment_status: 'completed',
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
          paid_at: new Date().toISOString()
        })
        .eq('order_id', orderReference);

      if (updateOrderError) {
        console.error('Error updating order status:', updateOrderError);
      }

      const positions = insertedEntries.map(entry => entry.position_number);

      try {
        const emailResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-confirmation-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              to: order.email,
              firstName: order.first_name,
              lastName: order.last_name,
              packageName: order.package_name,
              packagePrice: order.package_price,
              positions: positions.sort((a, b) => a - b),
              orderId: orderReference,
              transactionNumber: webhookData.transactionId || orderReference,
              siteUrl: 'https://avtodom-promo.com'
            })
          }
        );

        if (!emailResponse.ok) {
          console.error('Failed to send confirmation email');
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }

      console.log('Payment processed successfully:', {
        orderId: orderReference,
        transactionId: webhookData.transactionId,
        entriesCreated: insertedEntries.length,
        positions: positions.sort((a, b) => a - b)
      });

      const responseTime = Math.floor(Date.now() / 1000);
      const responseSignatureString = `${orderReference};accept;${responseTime}`;
      const responseSignature = await generateSignature(responseSignatureString, secretKey);

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
          error_message: webhookData.reason || 'Payment declined or expired'
        })
        .eq('order_id', orderReference);

      console.log(`Order ${orderReference} marked as ${webhookData.transactionStatus}`);

      const responseTime = Math.floor(Date.now() / 1000);
      const responseSignatureString = `${orderReference};accept;${responseTime}`;
      const responseSignature = await generateSignature(responseSignatureString, secretKey);

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
    const responseSignatureString = `${orderReference};accept;${responseTime}`;
    const responseSignature = await generateSignature(responseSignatureString, secretKey);

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
