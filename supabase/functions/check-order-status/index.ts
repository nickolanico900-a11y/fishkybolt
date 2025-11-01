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

    const { data: entries, error: entriesError } = await supabase
      .from('sticker_entries')
      .select('*')
      .eq('order_id', orderId)
      .order('position_number', { ascending: true });

    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch entries' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!entries || entries.length === 0) {
      console.log('No entries found in sticker_entries, checking pending_orders...');

      const { data: pendingOrder, error: pendingError } = await supabase
        .from('pending_orders')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (pendingError) {
        console.error('Error checking pending_orders:', pendingError);
      }

      if (pendingOrder) {
        console.log('Order still pending in pending_orders:', orderId);
        return new Response(
          JSON.stringify({ error: 'Order not found or pending' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log('Order not in sticker_entries or pending_orders - assuming non-raffle product paid successfully:', orderId);
      return new Response(
        JSON.stringify({
          order: {
            orderId: orderId,
            status: 'completed',
            stickerCount: 0,
            message: 'Payment successful for non-raffle product'
          },
          positions: []
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const firstEntry = entries[0];
    const positions = entries.map(e => e.position_number);

    console.log('Entries found:', {
      orderId,
      status: firstEntry.payment_status,
      count: entries.length,
      positions
    });

    return new Response(
      JSON.stringify({
        order: {
          orderId: orderId,
          status: firstEntry.payment_status,
          firstName: firstEntry.first_name,
          lastName: firstEntry.last_name,
          email: firstEntry.email,
          packageName: firstEntry.package_name,
          packagePrice: firstEntry.package_price,
          stickerCount: entries.length,
          transactionNumber: firstEntry.transaction_number,
          createdAt: firstEntry.created_at,
          paidAt: firstEntry.created_at
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