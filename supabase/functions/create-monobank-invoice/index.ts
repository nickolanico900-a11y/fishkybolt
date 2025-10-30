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
    const monobankToken = Deno.env.get('MONOBANK_TOKEN')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: InvoiceRequest = await req.json();

    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        order_id: body.orderReference,
        customer_email: body.customerEmail,
        customer_phone: body.customerPhone,
        package_name: body.packageName,
        package_quantity: body.stickerCount,
        amount: body.amount / 100,
        currency: 'UAH',
        status: 'pending',
        payment_method: 'monobank'
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

    const monoRequest = {
      amount: body.amount,
      ccy: 980,
      merchantPaymInfo: {
        reference: body.orderReference,
        destination: `Оплата за ${body.packageName}`,
        comment: `Замовлення від ${body.customerName}`,
        customerEmails: [body.customerEmail],
        basketOrder: [
          {
            name: body.packageName,
            qty: 1,
            sum: body.amount,
            icon: 'string',
            unit: 'шт',
          }
        ]
      },
      redirectUrl: body.redirectUrl,
      webHookUrl: body.webHookUrl,
      validity: 3600,
      paymentType: 'debit',
    };

    console.log('Attempting to create Monobank invoice for order:', body.orderReference);
    console.log('Monobank request data:', JSON.stringify({ ...monoRequest, webHookUrl: '[REDACTED]' }));

    const monoResponse = await fetch('https://api.monobank.ua/api/merchant/invoice/create', {
      method: 'POST',
      headers: {
        'X-Token': monobankToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(monoRequest),
    });

    console.log('Monobank response status:', monoResponse.status);

    if (!monoResponse.ok) {
      const errorText = await monoResponse.text();
      console.error('Monobank API error:', {
        status: monoResponse.status,
        statusText: monoResponse.statusText,
        body: errorText,
        orderId: body.orderReference
      });

      await supabase
        .from('orders')
        .update({
          status: 'failed',
          error_message: `Monobank API error: ${monoResponse.status} - ${errorText}`,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', body.orderReference);

      return new Response(
        JSON.stringify({
          error: 'Не вдалося створити рахунок для оплати. Перевірте правильність налаштувань Monobank або спробуйте пізніше.',
          details: errorText,
          code: 'MONOBANK_API_ERROR'
        }),
        {
          status: monoResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const invoiceData = await monoResponse.json();
    console.log('Monobank invoice created successfully:', {
      invoiceId: invoiceData.invoiceId,
      orderId: body.orderReference,
      hasPageUrl: !!invoiceData.pageUrl
    });

    if (!invoiceData.pageUrl) {
      console.error('Monobank response missing pageUrl:', invoiceData);

      await supabase
        .from('orders')
        .update({
          status: 'failed',
          error_message: 'Monobank не повернув посилання для оплати',
          updated_at: new Date().toISOString()
        })
        .eq('order_id', body.orderReference);

      return new Response(
        JSON.stringify({
          error: 'Monobank не повернув посилання для оплати',
          code: 'MISSING_PAYMENT_URL'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await supabase
      .from('orders')
      .update({
        status: 'awaiting_payment',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', body.orderReference);

    console.log('Returning payment URL to client for order:', body.orderReference);

    return new Response(
      JSON.stringify({
        pageUrl: invoiceData.pageUrl,
        invoiceId: invoiceData.invoiceId
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