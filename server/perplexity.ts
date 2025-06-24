import fetch from 'node-fetch';

interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
}

export async function searchCurrentInfo(query: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.warn('Perplexity API key not found, using static knowledge');
    return '';
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides current, factual information. Be concise and accurate.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 300,
        temperature: 0.2,
        top_p: 0.9,
        return_related_questions: false,
        search_recency_filter: 'month',
        stream: false
      })
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status, response.statusText);
      return '';
    }

    const data = await response.json() as PerplexityResponse;
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error fetching current info:', error);
    return '';
  }
}

export function needsCurrentInfo(message: string): boolean {
  const currentInfoKeywords = [
    'president', 'biden', 'trump', 'election', 'current', 'now', 'today',
    'latest', 'recent', 'news', 'who is', 'what happened', 'update',
    'current events', 'politics', 'government', 'leader', 'prime minister'
  ];
  
  return currentInfoKeywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );
}