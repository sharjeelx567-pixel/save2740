/**
 * Quote of the Day API
 * GET /api/quote-of-day - Get today's quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTodaysQuote, getQuoteStats } from '@/lib/services/quote-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('stats') === 'true';

    const quote = await getTodaysQuote();

    const response: any = {
      success: true,
      data: {
        quote: {
          text: quote.text,
          author: quote.author,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        },
      },
    };

    if (includeStats) {
      const stats = await getQuoteStats();
      response.data.stats = stats;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching quote of the day:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}
