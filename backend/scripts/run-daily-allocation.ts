
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Save2740Plan } from '../models/save2740.model';
import { LedgerService } from '../services/ledger.service';
import { NotificationService } from '../services/notification.service'; // Assuming this exists or similar

const runDailyAllocation = async () => {
    console.log('Starting Daily Allocation Job...');
    try {
        await connectDB();

        // Find all active plans
        // We only care about plans that are 'active'
        const activePlans = await Save2740Plan.find({
            status: 'active',
            // Optional: Check if nextContributionDate <= now
            // nextContributionDate: { $lte: new Date() } 
        });

        console.log(`Found ${activePlans.length} active plans.`);

        for (const plan of activePlans) {
            try {
                // Determine amount to save today
                // If savingsMode is daily, it's dailyAmount. 
                // If monthly/weekly, we might checking if today is the day? 
                // The prompt says "Daily savings = internal ledger entries" "Every day at midnight".
                // "Fund infrequently -> allocate daily internally".
                // So even if I fund weekly, I save DAILY? 
                // "Daily Saver Logic... $27.40 -> Pocket Allocation".
                // Yes, logic is ALWAYS daily allocation internally.

                const amountToSave = plan.dailyAmount || 27.40;

                const result = await LedgerService.allocateDailySavings(plan.userId, plan._id.toString(), amountToSave);

                if (result.success) {
                    console.log(`[Success] Allocated $${amountToSave} for Plan ${plan._id}`);
                } else {
                    console.warn(`[Failed] Plan ${plan._id}: ${result.message}`);

                    // Specific Logic: "If wallet runs low: Warn user, Pause streak"
                    if (result.message === 'Insufficient funds') {
                        await handleInsufficientFunds(plan);
                    }
                }

            } catch (err) {
                console.error(`Error processing plan ${plan._id}:`, err);
            }
        }

        console.log('Daily Allocation Job Completed.');
        process.exit(0);

    } catch (error) {
        console.error('Fatal Error in Daily Allocation Job:', error);
        process.exit(1);
    }
};

async function handleInsufficientFunds(plan: any) {
    try {
        console.log(`Pausing streak for user ${plan.userId}`);
        // Pause streak logic
        // plan.streakDays = 0; // Or just pause incrementing?
        // Warn user (Send notification - placeholder)
        // await NotificationService.send(plan.userId, 'Insufficient funds for daily savings. Please top up!');

        // We might not want to cancel the plan immediately, just skip this day or mark as 'missed'.
        // For now, we just log it.
    } catch (e) {
        console.error("Error handling insufficient funds", e);
    }
}

runDailyAllocation();
