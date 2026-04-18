const express     = require('express');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ── POST /api/plan — AI планировщик через Hugging Face ──
router.post('/', async (req, res) => {
  const { destination, origin, interests, pace } = req.body;

  if (!destination) {
    return res.status(400).json({ error: 'Укажите город' });
  }

  const interestList = Array.isArray(interests) && interests.length > 0
    ? interests.join(', ')
    : 'general sightseeing';

  const paceNote = pace === 'slow'
    ? '4-6 places, relaxed walking, plenty of rest'
    : pace === 'balanced'
    ? '8-10 places, moderate walking'
    : '12-15 places, active day';

  const startingPoint = origin ? `Starting from: ${origin}.` : '';

  const prompt = `<s>[INST] You are a knowledgeable travel guide. Create a detailed one-day itinerary for ${destination}.

${startingPoint}
Traveller interests: ${interestList}.
Pace: ${paceNote}.

Return ONLY valid JSON (no extra text) in this exact format:
{
  "city": "${destination}",
  "places": [
    {
      "name": "Place Name",
      "address": "Street address or neighbourhood",
      "category": "coffee|food|art|history|books|nature|architecture|music|viewpoints|quiet",
      "walk": 10,
      "price": "€€",
      "note": "One sentence about why this place is special.",
      "icon": "☕"
    }
  ]
}

Rules:
- walk = estimated walking minutes from previous place (or starting point)
- price: € (free/cheap), €€ (moderate), €€€ (expensive)
- Include only places that actually exist
- Sort places in logical walking order
[/INST]`;

  try {
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 1500,
            temperature: 0.7,
            return_full_text: false
          }
        }),
        signal: AbortSignal.timeout(30000)
      }
    );

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      console.error('HF API error:', errText);
      return res.status(502).json({ error: 'AI сервис временно недоступен, попробуйте позже' });
    }

    const hfData = await hfResponse.json();

    // Hugging Face возвращает массив с generated_text
    let rawText = '';
    if (Array.isArray(hfData) && hfData[0]?.generated_text) {
      rawText = hfData[0].generated_text;
    } else if (typeof hfData === 'string') {
      rawText = hfData;
    } else {
      rawText = JSON.stringify(hfData);
    }

    // Извлекаем JSON из ответа
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON in HF response:', rawText.slice(0, 300));
      return res.status(502).json({ error: 'Не удалось разобрать ответ AI. Попробуйте ещё раз.' });
    }

    const plan = JSON.parse(jsonMatch[0]);
    res.json(plan);

  } catch (err) {
    console.error('Plan route error:', err.message);
    res.status(500).json({ error: 'Ошибка сервера при обращении к AI' });
  }
});

module.exports = router;
