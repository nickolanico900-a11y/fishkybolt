import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

async function generateSignature(signatureString: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);
  const keyData = encoder.encode(secretKey);

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

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return signatureHex;
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
    const body: InvoiceRequest = await req.json();

    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        order_id: body.orderReference,
        first_name: body.firstName,
        last_name: body.lastName,
        phone: body.customerPhone,
        email: body.customerEmail,
        package_name: body.packageName,
        package_price: body.packagePrice,
        sticker_count: body.stickerCount,
        amount: body.amount,
        status: 'awaiting_payment'
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

    console.log('Attempting to create WayForPay invoice for order:', body.orderReference);

    const orderDate = Math.floor(Date.now() / 1000);
    const amountInGrn = body.amount / 100;

    const merchantDomainName = new URL(body.redirectUrl).hostname;
    const signatureString = `${merchantAccount};${merchantDomainName};${body.orderReference};${orderDate};${amountInGrn};UAH;${body.packageName};1;${amountInGrn}`;

    console.log('Signature string (without secret):', signatureString);

    const signature = await generateSignature(signatureString, secretKey);
    console.log('Generated signature length:', signature.length);

    const wayforpayRequest = {
      transactionType: 'CREATE_INVOICE',
      merchantAccount: merchantAccount,
      merchantDomainName: merchantDomainName,
      orderReference: body.orderReference,
      orderDate: orderDate,
      amount: amountInGrn,
      currency: 'UAH',
      productName: [body.packageName],
      productCount: [1],
      productPrice: [amountInGrn],
      clientAccountId: body.customerEmail,
      clientEmail: body.customerEmail,
      clientPhone: body.customerPhone,
      clientFirstName: body.firstName,
      clientLastName: body.lastName,
      serviceUrl: body.webHookUrl,
      returnUrl: body.redirectUrl,
      merchantSignature: signature,
      apiVersion: 1
    };

    console.log('WayForPay request:', JSON.stringify({ ...wayforpayRequest, merchantSignature: '[REDACTED]' }));

    const wayforpayResponse = await fetch('https://api.wayforpay.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wayforpayRequest),
    });

    console.log('WayForPay response status:', wayforpayResponse.status);

    if (!wayforpayResponse.ok) {
      const errorText = await wayforpayResponse.text();
      console.error('WayForPay API error:', {
        status: wayforpayResponse.status,
        statusText: wayforpayResponse.statusText,
        body: errorText,
        orderId: body.orderReference
      });

      await supabase
        .from('orders')
        .update({
          status: 'failed',
          error_message: `WayForPay API error: ${wayforpayResponse.status} - ${errorText}`
        })
        .eq('order_id', body.orderReference);

      return new Response(
        JSON.stringify({
          error: 'Не вдалося створити рахунок для оплати. Перевірте правильність налаштувань WayForPay або спробуйте пізніше.',
          details: errorText,
          code: 'WAYFORPAY_API_ERROR'
        }),
        {
          status: wayforpayResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const invoiceData = await wayforpayResponse.json();
    console.log('WayForPay invoice created successfully:', {
      orderReference: body.orderReference,
      reason: invoiceData.reason,
      reasonCode: invoiceData.reasonCode,
      hasInvoiceUrl: !!invoiceData.invoiceUrl
    });

    if (invoiceData.reasonCode !== 1100) {
      console.error('WayForPay returned error:', invoiceData);

      await supabase
        .from('orders')
        .update({
          status: 'failed',
          error_message: `WayForPay error: ${invoiceData.reason}`
        })
        .eq('order_id', body.orderReference);

      return new Response(
        JSON.stringify({
          error: invoiceData.reason || 'Помилка створення рахунку',
          code: 'WAYFORPAY_ERROR',
          reasonCode: invoiceData.reasonCode
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!invoiceData.invoiceUrl) {
      console.error('WayForPay response missing invoiceUrl:', invoiceData);

      await supabase
        .from('orders')
        .update({
          status: 'failed',
          error_message: 'WayForPay не повернув посилання для оплати'
        })
        .eq('order_id', body.orderReference);

      return new Response(
        JSON.stringify({
          error: 'WayForPay не повернув посилання для оплати',
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
      .update({ invoice_id: body.orderReference })
      .eq('order_id', body.orderReference);

    console.log('Returning payment URL to client for order:', body.orderReference);

    return new Response(
      JSON.stringify({
        pageUrl: invoiceData.invoiceUrl,
        invoiceId: body.orderReference
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
