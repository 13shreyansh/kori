export default function handler(_req, res) {
  res.status(200).json({ gemini: !!process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || 'gemini-flash-latest' });
}
