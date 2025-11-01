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
      const { data: existingEntries, error: checkError } = await supabase
        .from('sticker_entries')
        .select('id')
        .eq('order_id', orderReference)
        .limit(1);

      if (checkError) {
        console.error('Error checking existing entries:', checkError);
      }

      if (existingEntries && existingEntries.length > 0) {
        console.log('Entries already created (idempotency check):', orderReference);
        return new Response(
          JSON.stringify({ success: true, message: 'Order already processed' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: pendingOrder, error: pendingOrderError } = await supabase
        .from('pending_orders')
        .select('*')
        .eq('order_id', orderReference)
        .maybeSingle();

      if (pendingOrderError) {
        console.error('Error fetching pending order:', pendingOrderError);
      }

      if (!pendingOrder) {
        console.log('Pending order not found (may be already processed or expired):', orderReference);
        return new Response(
          JSON.stringify({ success: true, message: 'Payment received but order data not found' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      let insertedEntries = [];
      let positions = [];

      if (pendingOrder.product_to_count) {
        console.log('Product counts towards raffle, creating entries...');

        const entries = [];
        for (let i = 0; i < pendingOrder.package_quantity; i++) {
          entries.push({
            first_name: pendingOrder.first_name,
            last_name: pendingOrder.last_name,
            phone: pendingOrder.customer_phone,
            email: pendingOrder.customer_email,
            package_name: pendingOrder.package_name,
            package_price: pendingOrder.amount,
            order_id: orderReference,
            payment_status: 'completed',
            transaction_number: invoiceId
          });
        }

        const { data: entries_data, error: entriesError } = await supabase
          .from('sticker_entries')
          .insert(entries)
          .select('position_number');

        if (entriesError) {
          console.error('Error creating sticker entries:', entriesError);
        } else {
          insertedEntries = entries_data || [];
          positions = insertedEntries.map(entry => entry.position_number);

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
            } else if (!entriesFromDb || entriesFromDb.length === 0) {
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
                    transactionNumber: invoiceId,
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
      } else {
        console.log('Product does not count towards raffle, no entries created');
      }

      await supabase
        .from('pending_orders')
        .delete()
        .eq('order_id', orderReference);

      console.log('Payment processed successfully:', {
        orderId: orderReference,
        invoiceId: invoiceId,
        productToCount: pendingOrder.product_to_count,
        entriesCreated: insertedEntries.length,
        positions: positions.length > 0 ? positions.sort((a, b) => a - b) : []
      });
    } else if (webhookData.status === 'failure' || webhookData.status === 'cancelled') {
      console.log(`Payment ${orderReference} marked as ${webhookData.status}`);
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