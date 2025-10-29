import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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

    const { action, password, ...params } = await req.json();

    // Verify admin password
    if (password !== ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get current settings
    const { data: settings, error: fetchError } = await supabase
      .from('timer_settings')
      .select('*')
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!settings && action !== 'start_timer') {
      return new Response(
        JSON.stringify({ error: 'Settings not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: 'admin',
    };

    switch (action) {
      case 'add_time': {
        const { days, hours } = params;
        const currentEndDate = new Date(settings.end_date);
        const totalHoursToAdd = (days || 0) * 24 + (hours || 0);
        const newEndDate = new Date(currentEndDate.getTime() + totalHoursToAdd * 60 * 60 * 1000);
        updateData.end_date = newEndDate.toISOString();
        break;
      }

      case 'start_timer': {
        const { days } = params;
        const newEndDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        if (!settings) {
          const { data: newSettings, error: insertError } = await supabase
            .from('timer_settings')
            .insert({
              is_active: true,
              end_date: newEndDate.toISOString(),
              updated_at: new Date().toISOString(),
              updated_by: 'admin',
            })
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          return new Response(
            JSON.stringify({ success: true, data: newSettings }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        updateData.is_active = true;
        updateData.end_date = newEndDate.toISOString();
        break;
      }

      case 'pause_timer': {
        updateData.is_active = false;
        break;
      }

      case 'resume_timer': {
        updateData.is_active = true;
        break;
      }

      case 'reset_timer': {
        const newEndDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
        updateData.is_active = true;
        updateData.end_date = newEndDate.toISOString();
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }

    const { data, error } = await supabase
      .from('timer_settings')
      .update(updateData)
      .eq('id', settings.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, data }),
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
