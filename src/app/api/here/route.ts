import { NextResponse } from 'next/server';

const HERE_API_KEY = process.env.NEXT_PUBLIC_HERE_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const lat = searchParams.get('lat') || '10.7966';
  const lng = searchParams.get('lng') || '106.6751';
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  if (!HERE_API_KEY) {
    return NextResponse.json({ error: 'HERE API key is not configured' }, { status: 500 });
  }

  try {
    const url = new URL('https://autosuggest.search.hereapi.com/v1/autosuggest');
    url.searchParams.append('q', query);
    url.searchParams.append('apiKey', HERE_API_KEY);
    url.searchParams.append('in', 'countryCode:VNM');
    url.searchParams.append('resultType', 'address');
    url.searchParams.append('limit', '5');
    url.searchParams.append('lang', 'vi');
    url.searchParams.append('at', `${lat},${lng}`);
    url.searchParams.append('radius', '10000');

    const response = await fetch(url.toString());
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from HERE API:', error);
    return NextResponse.json({ error: 'Failed to fetch from HERE API' }, { status: 500 });
  }
} 