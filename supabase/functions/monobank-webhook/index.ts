import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const webhookData = await req.json();

    console.log('Monobank webhook received:', JSON.stringify({
      reference: webhookData.reference,
      invoiceId: webhookData.invoiceId,
      status: webhookData.status,
      amount: webhookData.amount,
      timestamp: new Date().toISOString()
    }));

    const orderReference = webhookData.reference;
    const invoiceId = webhookData.invoiceId;

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

    if (webhookData.status === 'success') {
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
        return new Response(
          JSON.stringify({ success: true, message: 'Order already processed' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (order.invoice_id && order.invoice_id !== invoiceId) {
        console.warn('Invoice ID mismatch:', {
          expected: order.invoice_id,
          received: invoiceId,
          orderId: orderReference
        });
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
          transaction_number: invoiceId
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
              transactionNumber: invoiceId,
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
        invoiceId: invoiceId,
        entriesCreated: insertedEntries.length,
        positions: positions.sort((a, b) => a - b)
      });
    } else if (webhookData.status === 'failure' || webhookData.status === 'cancelled') {
      await supabase
        .from('orders')
        .update({ status: webhookData.status })
        .eq('order_id', orderReference);

      console.log(`Order ${orderReference} marked as ${webhookData.status}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
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