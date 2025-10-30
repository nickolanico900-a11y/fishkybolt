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

      if (order.product_to_count) {
        const entries = [];
        for (let i = 0; i < order.package_quantity; i++) {
          entries.push({
            first_name: order.first_name || 'N/A',
            last_name: order.last_name || 'N/A',
            phone: order.customer_phone,
            email: order.customer_email,
            package_name: order.package_name,
            package_price: Number(order.amount),
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

        const positions = insertedEntries.map(entry => entry.position_number);

        console.log('Payment processed successfully:', {
          orderId: orderReference,
          transactionId: webhookData.transactionId,
          entriesCreated: insertedEntries.length,
          positions: positions.sort((a, b) => a - b)
        });
      }

      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderReference);

      if (updateOrderError) {
        console.error('Error updating order status:', updateOrderError);
      }

      if (order.product_to_count) {
        console.log('Waiting 3 seconds for database triggers to complete...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
          const { data: entriesFromDb, error: entriesQueryError } = await supabase
            .from('sticker_entries')
            .select('*')
            .eq('order_id', orderReference)
            .order('position_number', { ascending: true });

          if (entriesQueryError) {
            console.error('Error fetching entries from database:', entriesQueryError);
            throw entriesQueryError;
          }

          if (!entriesFromDb || entriesFromDb.length === 0) {
            console.error('No entries found in database after payment for order:', orderReference);
          } else {
            console.log(`Found ${entriesFromDb.length} entries in database for order ${orderReference}`);

            const positionsFromDb = entriesFromDb.map(e => e.position_number);
            const firstEntry = entriesFromDb[0];

            const emailResponse = await fetch(
              `${supabaseUrl}/functions/v1/send-confirmation-email`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`
                },
                body: JSON.stringify({
                  to: firstEntry.email,
                  firstName: firstEntry.first_name,
                  lastName: firstEntry.last_name,
                  packageName: firstEntry.package_name,
                  packagePrice: firstEntry.package_price,
                  positions: positionsFromDb,
                  orderId: orderReference,
                  transactionNumber: webhookData.transactionId || orderReference,
                  siteUrl: 'https://avtodom-promo.com'
                })
              }
            );

            if (!emailResponse.ok) {
              const errorText = await emailResponse.text();
              console.error('Failed to send confirmation email:', errorText);
            } else {
              console.log('Confirmation email sent successfully for order:', orderReference);
            }
          }
        } catch (emailError) {
          console.error('Error in email sending process:', emailError);
        }
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
