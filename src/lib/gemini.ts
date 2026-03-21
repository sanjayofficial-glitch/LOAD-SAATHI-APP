const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface SearchFilters {
  origin?: string;
  destination?: string;
  weight?: number;
  date?: string;
}

export const parseNaturalLanguageSearch = async (query: string): Promise<SearchFilters> => {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key missing. AI search disabled.');
    return {};
  }

  const prompt = `
    Extract logistics search filters from this query: "${query}"
    Return ONLY a JSON object with these keys: origin, destination, weight (number in tonnes), date (YYYY-MM-DD).
    If a value is missing, omit the key.
    Example: "I want to send 2 tonnes from Delhi to Mumbai next Friday"
    Output: {"origin": "Delhi", "destination": "Mumbai", "weight": 2, "date": "2024-05-24"}
    Current date is ${new Date().toISOString().split('T')[0]}.
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text.trim());
  } catch (error) {
    console.error('Error parsing AI search:', error);
    return {};
  }
};