import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface InvoiceRequest {
  amount: number;
  orderReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageName: string;
  redirectUrl: string;
  webHookUrl: string;
  firstName: string;
  lastName: string;
  packagePrice: number;
  stickerCount: number;
  productToCount: boolean;
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: InvoiceRequest = await req.json();

    console.log('🧪 TEST MODE: Auto-completing payment without Monobank redirect');

    const testInvoiceId = `TEST-${Date.now()}`;

    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        order_id: body.orderReference,
        first_name: body.firstName,
        last_name: body.lastName,
        customer_email: body.customerEmail,
        customer_phone: body.customerPhone,
        package_name: body.packageName,
        package_quantity: body.stickerCount,
        amount: body.amount / 100,
        currency: 'UAH',
        status: 'completed',
        payment_method: 'monobank',
        product_to_count: body.productToCount,
        paid_at: new Date().toISOString(),
        invoice_id: testInvoiceId
      });

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order', details: orderError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Order created with completed status:', body.orderReference);

    if (body.productToCount) {
      console.log('Creating raffle entries...');

      const entries = [];
      for (let i = 0; i < body.stickerCount; i++) {
        entries.push({
          first_name: body.firstName || 'N/A',
          last_name: body.lastName || 'N/A',
          phone: body.customerPhone,
          email: body.customerEmail,
          package_name: body.packageName,
          package_price: body.amount / 100,
          order_id: body.orderReference,
          payment_status: 'completed',
          transaction_number: testInvoiceId
        });
      }

      const { data: entriesData, error: entriesError } = await supabase
        .from('sticker_entries')
        .insert(entries)
        .select('position_number');

      if (entriesError) {
        console.error('Error creating sticker entries:', entriesError);
      } else {
        console.log(`Created ${entriesData?.length || 0} raffle entries`);

        console.log('Waiting 2 seconds for database triggers...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
          const { data: entriesFromDb, error: entriesQueryError } = await supabase
            .from('sticker_entries')
            .select('*')
            .eq('order_id', body.orderReference)
            .order('position_number', { ascending: true });

          if (entriesQueryError) {
            console.error('Error fetching entries:', entriesQueryError);
          } else if (entriesFromDb && entriesFromDb.length > 0) {
            const positions = entriesFromDb.map(e => e.position_number);
            const firstEntry = entriesFromDb[0];

            console.log('Sending confirmation email...');

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
                  positions: positions,
                  orderId: body.orderReference,
                  transactionNumber: testInvoiceId,
                  siteUrl: 'https://avtodom-promo.com'
                })
              }
            );

            if (!emailResponse.ok) {
              console.error('Failed to send email:', await emailResponse.text());
            } else {
              console.log('Confirmation email sent');
            }
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
        }
      }
    }

    console.log('✅ Test payment completed successfully');

    return new Response(
      JSON.stringify({
        pageUrl: body.redirectUrl,
        invoiceId: testInvoiceId,
        testMode: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});