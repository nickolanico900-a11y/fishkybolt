import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const ADMIN_PASSWORD = 'avtodom2025';

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

    if (req.method === 'DELETE') {
      const { password } = await req.json();

      if (password !== ADMIN_PASSWORD) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      let totalEntriesDeleted = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: batchEntries, error: fetchError } = await supabase
          .from('sticker_entries')
          .select('id')
          .limit(500);

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          return new Response(
            JSON.stringify({ error: fetchError.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if (!batchEntries || batchEntries.length === 0) {
          hasMore = false;
          break;
        }

        const { error: deleteError } = await supabase
          .from('sticker_entries')
          .delete()
          .in('id', batchEntries.map(e => e.id));

        if (deleteError) {
          console.error('Delete error:', deleteError);
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        totalEntriesDeleted += batchEntries.length;

        if (batchEntries.length < 500) {
          hasMore = false;
        }
      }

      console.log('About to reset sequence...');
      const { error: resetError } = await supabase.rpc('reset_position_sequence');

      if (resetError) {
        console.error('Could not reset sequence:', resetError);
        return new Response(
          JSON.stringify({
            error: 'Failed to reset position sequence: ' + resetError.message,
            entriesDeleted: totalEntriesDeleted
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log('Sequence reset successfully!');

      return new Response(
        JSON.stringify({
          success: true,
          entriesDeleted: totalEntriesDeleted,
          sequenceReset: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const allEntries = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('sticker_entries')
        .select('*')
        .order('position_number', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('Query error:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (data && data.length > 0) {
        allEntries.push(...data);
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    return new Response(
      JSON.stringify({ entries: allEntries }),
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