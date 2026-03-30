exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const useSearch = body.useSearch || false;

    const payload = {
      model: 'claude-sonnet-4-5',
      max_tokens: body.max_tokens || 2000,
      messages: body.messages,
    };

    if (body.system) payload.system = body.system;

    // Add web search tool if requested
    if (useSearch) {
      payload.tools = [
        {
          type: 'web_search_20250305',
          name: 'web_search',
        }
      ];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Extract text from all content blocks including tool results
    let fullText = '';
    if (data.content && Array.isArray(data.content)) {
      data.content.forEach(block => {
        if (block.type === 'text') fullText += block.text;
      });
      if (fullText) data.extractedText = fullText;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
