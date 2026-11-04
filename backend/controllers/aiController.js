const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const callAi = async (prompt) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('AI service is not configured');

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 300
    })
  });
  if (!response.ok) throw new Error('AI service request failed');
  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content;
  if (!text) throw new Error('AI service returned no response');
  return text;
};

export const chat = async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > 1000) {
      return res.status(400).json({ success: false, error: 'INVALID_MESSAGE' });
    }
    const text = await callAi(`You are a concise RAS Currys customer-support assistant. Answer safely and accurately. Customer message: ${message}`);
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
    const text = await callAi(`Write one 18-30 word appetizing product description for the Indian curry "${name}". Do not use emojis.`);
    res.json({ success: true, text });
  } catch (error) {
    const status = error.message === 'AI service is not configured' ? 503 : 502;
    res.status(status).json({ success: false, error: 'AI_UNAVAILABLE' });
  }
};
