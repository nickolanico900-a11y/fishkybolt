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
        customer_email: body.customerEmail,
        customer_phone: body.customerPhone,
        package_name: body.packageName,
        package_quantity: body.stickerCount,
        amount: body.amount / 100,
        currency: 'UAH',
        status: 'pending',
        payment_method: 'wayforpay',
        product_to_count: body.productToCount
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

    console.log('Order created successfully:', body.orderReference);

    const orderDate = Math.floor(Date.now() / 1000);
    const amountInGrn = body.amount / 100;

    const merchantDomainName = new URL(body.redirectUrl).hostname;
    const signatureString = `${merchantAccount};${merchantDomainName};${body.orderReference};${orderDate};${amountInGrn};UAH;${body.packageName};1;${amountInGrn}`;

    console.log('Generating signature for WayForPay');

    const signature = generateHmacMd5Signature(signatureString, secretKey);

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

    console.log('Sending request to WayForPay API');

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
          error_message: `WayForPay API error: ${wayforpayResponse.status} - ${errorText}`,
          updated_at: new Date().toISOString()
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
    console.log('WayForPay invoice created:', {
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
          error_message: `WayForPay error: ${invoiceData.reason}`,
          updated_at: new Date().toISOString()
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
          error_message: 'WayForPay не повернув посилання для оплати',
          updated_at: new Date().toISOString()
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
      .update({
        status: 'awaiting_payment',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', body.orderReference);

    console.log('Returning payment URL to client');

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
