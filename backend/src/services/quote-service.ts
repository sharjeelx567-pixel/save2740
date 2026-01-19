/**
 * Quote of the Day Service
 * Handles daily quote rotation and retrieval
 */

import { Quote, DailyQuote } from '@/lib/models/quote-of-day';
import { connectDB } from '@/lib/db';

// Default quotes if none in database
const DEFAULT_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is not final, failure is not fatal.", author: "Winston Churchill" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Great things never came from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Dream bigger. Do bigger.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "Little things make big days.", author: "Unknown" },
  { text: "It's going to be hard, but hard does not mean impossible.", author: "Unknown" },
  { text: "Don't wait for opportunity. Create it.", author: "Unknown" },
  { text: "Sometimes we're tested not to show our weaknesses, but to discover our strengths.", author: "Unknown" },
  { text: "The key to success is to focus on goals, not obstacles.", author: "Unknown" },
];

/**
 * Normalize date to start of day (UTC)
 */
function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Get today's quote
 * Returns the quote assigned for today, or creates one if none exists
 */
export async function getTodaysQuote(): Promise<{ text: string; author: string }> {
  await connectDB();

  const today = normalizeDate(new Date());

  // Check if quote already assigned for today
  let dailyQuote = await DailyQuote.findOne({ date: today }).populate('quoteId');

  if (dailyQuote && dailyQuote.quote) {
    // Update display count
    dailyQuote.displayCount += 1;
    await dailyQuote.save();

    return {
      text: (dailyQuote.quote as any).text,
      author: (dailyQuote.quote as any).author,
    };
  }

  // Get all active quotes from database
  const activeQuotes = await Quote.find({ isActive: true }).sort({ displayOrder: 1 });

  let quotesToUse = activeQuotes.length > 0 
    ? activeQuotes.map(q => ({ text: q.text, author: q.author }))
    : DEFAULT_QUOTES;

  // If no quotes in DB, seed them
  if (activeQuotes.length === 0) {
    await seedDefaultQuotes();
    quotesToUse = DEFAULT_QUOTES;
  }

  // Select quote based on day of year (consistent selection)
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000)
  );
  const selectedQuote = quotesToUse[dayOfYear % quotesToUse.length];

  // Find or create quote in database
  let quote = await Quote.findOne({ text: selectedQuote.text, author: selectedQuote.author });

  if (!quote) {
    quote = await Quote.create({
      text: selectedQuote.text,
      author: selectedQuote.author,
      isActive: true,
    });
  }

  // Create daily quote record
  dailyQuote = await DailyQuote.create({
    date: today,
    quoteId: quote._id,
    displayCount: 1,
  });

  return {
    text: selectedQuote.text,
    author: selectedQuote.author,
  };
}

/**
 * Seed default quotes into database
 */
async function seedDefaultQuotes() {
  await connectDB();

  for (const quoteData of DEFAULT_QUOTES) {
    const exists = await Quote.findOne({ text: quoteData.text, author: quoteData.author });
    if (!exists) {
      await Quote.create({
        ...quoteData,
        isActive: true,
      });
    }
  }
}

/**
 * Add a new quote
 */
export async function addQuote(text: string, author: string, category?: string) {
  await connectDB();

  const quote = await Quote.create({
    text,
    author,
    category,
    isActive: true,
  });

  return quote;
}

/**
 * Get quote statistics
 */
export async function getQuoteStats() {
  await connectDB();

  const totalQuotes = await Quote.countDocuments({ isActive: true });
  const totalDailyQuotes = await DailyQuote.countDocuments();
  const todayQuote = await DailyQuote.findOne({ date: normalizeDate(new Date()) });

  return {
    totalQuotes,
    totalDailyQuotes,
    todayQuote: todayQuote
      ? {
          text: (todayQuote.quoteId as any)?.text || 'N/A',
          author: (todayQuote.quoteId as any)?.author || 'N/A',
          displayCount: todayQuote.displayCount,
        }
      : null,
  };
}
