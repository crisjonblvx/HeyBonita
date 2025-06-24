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

interface GNewsResponse {
  totalArticles: number;
  articles: Array<{
    title: string;
    description: string;
    content: string;
    url: string;
    image: string;
    publishedAt: string;
    source: {
      name: string;
      url: string;
    };
  }>;
}

async function searchWithGNews(query: string): Promise<string> {
  const apiKey = process.env.GNEWS_API_KEY;
  
  if (!apiKey) {
    return '';
  }

  try {
    const searchQuery = encodeURIComponent(query);
    const response = await fetch(`https://gnews.io/api/v4/search?q=${searchQuery}&lang=en&country=us&max=3&apikey=${apiKey}`);

    if (!response.ok) {
      console.error('GNews API error:', response.status, response.statusText);
      return '';
    }

    const data = await response.json() as GNewsResponse;
    
    if (data.articles && data.articles.length > 0) {
      const newsItems = data.articles.slice(0, 3).map(article => 
        `${article.title} - ${article.description} (Source: ${article.source.name})`
      ).join('\n\n');
      
      return `Latest news about "${query}":\n\n${newsItems}`;
    }
    
    return '';
  } catch (error) {
    console.error('Error fetching GNews:', error);
    return '';
  }
}

async function searchWithPerplexity(query: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
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

export async function searchCurrentInfo(query: string): Promise<string> {
  // Try both news sources and combine results
  const [gnewsResult, perplexityResult] = await Promise.all([
    searchWithGNews(query),
    searchWithPerplexity(query)
  ]);

  // Combine results for comprehensive information
  const results = [];
  if (gnewsResult) results.push(gnewsResult);
  if (perplexityResult) results.push(`Analysis: ${perplexityResult}`);

  return results.join('\n\n---\n\n');
}

export function needsCurrentInfo(message: string): boolean {
  const currentInfoKeywords = [
    'president', 'biden', 'trump', 'election', 'current', 'now', 'today',
    'latest', 'recent', 'news', 'who is', 'what happened', 'update',
    'current events', 'politics', 'government', 'leader', 'prime minister',
    'breaking', 'just happened', 'this week', 'this month', 'this year',
    'weather', 'stock market', 'economy', 'war', 'conflict', 'celebrity',
    'sports', 'technology', 'ai news', 'social media', 'trending'
  ];
  
  return currentInfoKeywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );
}