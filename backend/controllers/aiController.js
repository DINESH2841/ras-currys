const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('AI service is not configured');

  const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  if (!response.ok) throw new Error('AI service request failed');
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('AI service returned no response');
  return text;
};

export const chat = async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > 1000) {
      return res.status(400).json({ success: false, error: 'INVALID_MESSAGE' });
    }
    const text = await callGemini(`You are a concise RAS Currys customer-support assistant. Answer safely and accurately. Customer message: ${message}`);
    res.json({ success: true, text });
  } catch (error) {
    const status = error.message === 'AI service is not configured' ? 503 : 502;
    res.status(status).json({ success: false, error: 'AI_UNAVAILABLE' });
  }
};

export const productDescription = async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 120) return res.status(400).json({ success: false, error: 'INVALID_PRODUCT_NAME' });
    const text = await callGemini(`Write one 18-30 word appetizing product description for the Indian curry "${name}". Do not use emojis.`);
    res.json({ success: true, text });
  } catch (error) {
    const status = error.message === 'AI service is not configured' ? 503 : 502;
    res.status(status).json({ success: false, error: 'AI_UNAVAILABLE' });
  }
};
