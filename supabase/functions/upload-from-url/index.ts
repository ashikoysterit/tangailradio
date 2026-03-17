import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, bucketName = 'tangail_radio_audio' } = await req.json()

    if (!url) {
      throw new Error('URL is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch remote URL
    const response = await fetch(url)
    const contentType = response.headers.get('content-type')

    // Basic validation
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }

    // Determine file extension
    let extension = 'mp3'
    if (contentType?.includes('audio/wav')) extension = 'wav'
    if (contentType?.includes('audio/ogg')) extension = 'ogg'
    if (contentType?.includes('image/')) extension = 'jpg' // Fallback for images if used

    const filePath = `${crypto.randomUUID()}.${extension}`
    
    // Upload to storage
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, response.body!, {
        contentType: contentType || 'application/octet-stream',
        duplex: 'half'
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return new Response(
      JSON.stringify({ publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
