const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface SearchFilters {
  origin?: string;
  destination?: string;
  weight?: number;
  date?: string;
}

export const parseNaturalLanguageSearch = async (query: string): Promise<SearchFilters> => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const today = new Date().toISOString().split('T')[0];
  const prompt = `
    Extract logistics search filters from this query: "${query}"
    
    Rules:
    1. Return ONLY a JSON object with these keys: origin, destination, weight (number in tonnes), date (YYYY-MM-DD).
    2. If the user says "now", "today", or "immediately", use "${today}" as the date.
    3. If a value is missing, omit the key.
    4. Clean city names (e.g., "delhi" -> "Delhi").
    
    Example: "I want to send 2 tonnes from Delhi to Mumbai now"
    Output: {"origin": "Delhi", "destination": "Mumbai", "weight": 2, "date": "${today}"}
    
    Current date is ${today}.
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) throw new Error('Gemini API error');

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    // Remove markdown code blocks if present
    const jsonString = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing AI search:', error);
    throw error;
  }
};