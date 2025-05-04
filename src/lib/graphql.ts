const TIMEOUT = 5000; // 5 seconds timeout

export async function fetchGraphQL(query: string, variables = {}, operationName?: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN!,
      },
      body: JSON.stringify({
        query,
        variables,
        operationName,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
} 