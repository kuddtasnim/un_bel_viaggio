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
    const { answers } = await req.json()
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    const answersText = Object.entries(answers as Record<string, string>)
      .map(([q, a]) => `${q}: ${a}`)
      .join('\n')

    const prompt = `На основе ответов путешественника о его поездке, создай тёплое и глубокое резюме поездки (3-5 предложений).
Пиши от второго лица (ты/тебе). Отрази самое важное из ответов. Тон: поддерживающий, как близкий друг.

Ответы путешественника:
${answersText}

Резюме:`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const summary = data.choices[0].message.content

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
