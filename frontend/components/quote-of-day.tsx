"use client"

import { Lightbulb } from "lucide-react"

const QUOTES = [
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain"
  },
  {
    text: "A journey of a thousand miles begins with a single step.",
    author: "Lao Tzu"
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb"
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Success is not final, failure is not fatal.",
    author: "Winston Churchill"
  },
  {
    text: "Your limitation—it's only your imagination.",
    author: "Unknown"
  },
  {
    text: "Great things never came from comfort zones.",
    author: "Unknown"
  },
  {
    text: "Dream it. Wish it. Do it.",
    author: "Unknown"
  },
  {
    text: "Success doesn't just find you. You have to go out and get it.",
    author: "Unknown"
  },
  {
    text: "The harder you work for something, the greater you'll feel when you achieve it.",
    author: "Unknown"
  },
  {
    text: "Dream bigger. Do bigger.",
    author: "Unknown"
  },
  {
    text: "Don't stop when you're tired. Stop when you're done.",
    author: "Unknown"
  },
  {
    text: "Wake up with determination. Go to bed with satisfaction.",
    author: "Unknown"
  },
  {
    text: "Do something today that your future self will thank you for.",
    author: "Sean Patrick Flanery"
  },
  {
    text: "Little things make big days.",
    author: "Unknown"
  },
  {
    text: "It's going to be hard, but hard does not mean impossible.",
    author: "Unknown"
  },
  {
    text: "Don't wait for opportunity. Create it.",
    author: "Unknown"
  },
  {
    text: "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
    author: "Unknown"
  },
  {
    text: "The key to success is to focus on goals, not obstacles.",
    author: "Unknown"
  },
]

function getDailyQuote(): typeof QUOTES[0] {
  // Use date to consistently return same quote for the day
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
    (24 * 60 * 60 * 1000)
  )
  return QUOTES[dayOfYear % QUOTES.length]
}

export function QuoteOfDay() {
  const quote = getDailyQuote()

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 border border-emerald-100">
      <div className="flex gap-3 sm:gap-4">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-brand-green/20">
            <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-brand-green" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm md:text-base font-medium text-slate-700 mb-1 sm:mb-2">
            Quote of the Day
          </p>
          <p className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 mb-2 leading-relaxed">
            "{quote.text}"
          </p>
          <p className="text-xs sm:text-sm text-slate-600 italic">
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  )
}




