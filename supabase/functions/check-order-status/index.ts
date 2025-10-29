import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');

    console.log('Order status check requested for:', orderId);

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch order' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!order) {
      console.log('Order not found:', orderId);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Order found:', {
      orderId: order.order_id,
      status: order.status,
      createdAt: order.created_at,
      paidAt: order.paid_at
    });

    let positions = [];
    if (order.status === 'completed') {
      const { data: entries, error: entriesError } = await supabase
        .from('sticker_entries')
        .select('position_number')
        .eq('order_id', orderId)
        .order('position_number', { ascending: true });

      if (entriesError) {
        console.error('Error fetching entries:', entriesError);
      } else if (!entries || entries.length === 0) {
        console.error('Order marked completed but no entries found:', orderId);
      } else {
        positions = entries.map(e => e.position_number);
        console.log('Found positions for completed order:', {
          orderId,
          count: positions.length
        });
      }
    }

    return new Response(
      JSON.stringify({
        order: {
          orderId: order.order_id,
          status: order.status,
          firstName: order.first_name,
          lastName: order.last_name,
          email: order.email,
          packageName: order.package_name,
          packagePrice: order.package_price,
          stickerCount: order.sticker_count,
          transactionNumber: order.invoice_id,
          createdAt: order.created_at,
          paidAt: order.paid_at
        },
        positions: positions
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