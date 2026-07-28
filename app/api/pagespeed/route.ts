import { NextResponse } from 'next/server';
import { fetchPageSpeedMetrics } from '@/lib/pagespeed';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const data = await fetchPageSpeedMetrics(url);
    if (!data) {
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[PageSpeed API Route] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
