const express     = require('express');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ── POST /api/plan — AI планировщик через Google Gemini ──
router.post('/', async (req, res) => {
  const { destination, origin, interests, pace } = req.body;

  if (!destination) {
    return res.status(400).json({ error: 'Укажите город' });
  }

  if (!process.env.GEMINI_KEY) {
    return res.status(503).json({ error: 'AI модуль не настроен. Добавьте GEMINI_KEY в переменные окружения.' });
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

  const prompt = `You are a knowledgeable travel guide. Create a detailed one-day itinerary for ${destination}.

${startingPoint}
Traveller interests: ${interestList}.
Pace: ${paceNote}.

Return ONLY valid JSON (no markdown, no extra text) in this exact format:
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
- Return raw JSON only, no code fences`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        }),
        signal: AbortSignal.timeout(30000)
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText.slice(0, 300));
      if (geminiRes.status === 403) {
        return res.status(502).json({ error: 'Неверный GEMINI_KEY. Проверьте ключ в переменных окружения.' });
      }
      return res.status(502).json({ error: 'AI сервис временно недоступен, попробуйте позже' });
    }

    const geminiData = await geminiRes.json();

    // Extract text from Gemini response structure
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawText) {
      console.error('Empty Gemini response:', JSON.stringify(geminiData).slice(0, 300));
      return res.status(502).json({ error: 'AI вернул пустой ответ. Попробуйте ещё раз.' });
    }

    // Extract JSON from response (strip possible markdown code fences)
    const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON in Gemini response:', rawText.slice(0, 300));
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
