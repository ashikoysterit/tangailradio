import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('INTEGRATIONS_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first (update every 10 minutes)
    const { data: cached } = await supabase
      .from('weather_cache')
      .select('*')
      .eq('id', 1)
      .single();

    const now = new Date();
    const cacheAge = cached?.updated_at ? (now.getTime() - new Date(cached.updated_at).getTime()) / 1000 : Infinity;

    if (cached && cacheAge < 600) {
      // Cache is fresh (< 10 minutes)
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch fresh weather data for Tangail, Bangladesh
    const weatherUrl = 'https://app-aafzg65ml6v5-api-wL1zlmgJGAlY.gateway.appmedo.com/data/3.0/onecall?lat=24.25&lon=89.92&units=metric&exclude=minutely,hourly,daily,alerts';
    
    const weatherResponse = await fetch(weatherUrl, {
      headers: {
        'X-Gateway-Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      throw new Error(`Weather API error: ${weatherResponse.status} - ${errorText}`);
    }

    const weatherData = await weatherResponse.json();

    // Extract only current weather
    const simplifiedData = {
      temp: weatherData.current.temp,
      feels_like: weatherData.current.feels_like,
      humidity: weatherData.current.humidity,
      weather: weatherData.current.weather,
      updated_at: new Date().toISOString(),
    };

    // Update cache
    await supabase
      .from('weather_cache')
      .update({ data: simplifiedData, updated_at: new Date().toISOString() })
      .eq('id', 1);

    return new Response(JSON.stringify(simplifiedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Weather fetch error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
