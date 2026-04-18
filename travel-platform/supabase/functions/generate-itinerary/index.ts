import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { destination, pace, interests, days = 3 } = await req.json()
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    const prompt = `You are a thoughtful travel planner helping a conscious traveler.
Create a ${days}-day itinerary for ${destination}.
Travel pace: ${pace} (slow=contemplative, moderate=balanced, fast=active).
Interests: ${interests.join(', ')}.

Return JSON array of days: [{ "day": 1, "title": "...", "description": "...", "activities": ["...", "...", "..."] }]
Focus on authentic experiences, local rhythm, and meaningful moments. Not tourist checklists.
Reply in Russian.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    })

    const data = await response.json()
    const itinerary = JSON.parse(data.choices[0].message.content)

    return new Response(JSON.stringify(itinerary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
