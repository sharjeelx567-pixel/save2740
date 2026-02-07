/**
 * Server Time & Timezone Diagnostic Tool
 * Run: npm run ts-node scripts/check-server-time.ts
 */

console.log('\n🕐 SERVER TIME DIAGNOSTIC\n');
console.log('═'.repeat(60));

const now = new Date();

console.log('\n📅 Current Times:');
console.log('─'.repeat(60));
console.log('Server Local Time:', now.toString());
console.log('UTC Time:         ', now.toUTCString());
console.log('ISO Time:         ', now.toISOString());

console.log('\n🌍 Timezone Information:');
console.log('─'.repeat(60));
console.log('Server Timezone Offset:', now.getTimezoneOffset() / -60, 'hours from UTC');
console.log('Server Locale Time:    ', now.toLocaleString());

console.log('\n🇺🇸 America/New_York (EST/EDT) Time:');
console.log('─'.repeat(60));
const estTime = now.toLocaleString('en-US', { 
    timeZone: 'America/New_York',
    dateStyle: 'full',
    timeStyle: 'long'
});
console.log(estTime);

console.log('\n🇵🇰 Asia/Karachi (PKT) Time:');
console.log('─'.repeat(60));
const pktTime = now.toLocaleString('en-US', { 
    timeZone: 'Asia/Karachi',
    dateStyle: 'full',
    timeStyle: 'long'
});
console.log(pktTime);

console.log('\n⏰ Cron Job Execution Times (if timezone = America/New_York):');
console.log('─'.repeat(60));
console.log('Daily Savings (00:00 EST)     → Runs at midnight New York time');
console.log('Withdrawal Processing (02:00 EST) → Runs at 2 AM New York time');
console.log('Low Balance Alerts (10:00 EST)    → Runs at 10 AM New York time');
console.log('Monthly Reports (09:00 EST)       → Runs at 9 AM on 1st of month');
console.log('Weekly Reminders (09:00 EST Mon)  → Runs at 9 AM every Monday');
console.log('Streak Reminders (20:00 EST)      → Runs at 8 PM New York time');
console.log('Referral Bonus (03:00 EST)        → Runs at 3 AM New York time');
console.log('Session Cleanup (04:00 EST)       → Runs at 4 AM New York time');
console.log('Transaction Sync (Every 15 min)   → Runs every 15 minutes');

console.log('\n⏰ What Time Would That Be For You?');
console.log('─'.repeat(60));

// Calculate local equivalent of EST midnight
const estMidnight = new Date();
estMidnight.setHours(0, 0, 0, 0);
const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
});

console.log('Example: If Daily Savings runs at 00:00 EST (midnight New York)');
console.log('Current server time:', now.toLocaleTimeString());
console.log('Current EST time:   ', formatter.format(now));

console.log('\n💡 How to Check When Jobs Will Run:');
console.log('─'.repeat(60));
console.log('1. Note your current server time above');
console.log('2. Note the EST time above');
console.log('3. Calculate the difference');
console.log('4. Apply that difference to all scheduled times');
console.log('\nExample: If server time is 10:00 and EST is 00:00,');
console.log('         then jobs run 10 hours ahead of EST time');

console.log('\n✅ To change timezone, edit: backend/src/utils/cron-scheduler.ts');
console.log('   Change "timezone: \'America/New_York\'" to your timezone');
console.log('\n📍 Common timezones:');
console.log('   - America/New_York (EST/EDT)');
console.log('   - Asia/Karachi (PKT)');
console.log('   - Europe/London (GMT/BST)');
console.log('   - Asia/Dubai (GST)');
console.log('   - UTC (Universal)');

console.log('\n' + '═'.repeat(60) + '\n');
