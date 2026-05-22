"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tickActiveDeposits = tickActiveDeposits;
exports.startActiveDepositScheduler = startActiveDepositScheduler;
const ActiveDeposit_1 = require("../models/ActiveDeposit");
const Wallet_1 = require("../models/Wallet");
const Earning_1 = require("../models/Earning");
const notifications_1 = require("./notifications");
const email_1 = require("./email");
/**
 * Sweeps active deposits, calculates days elapsed since the last decrement event,
 * and handles catching up if the server was restarted or offline.
 */
async function tickActiveDeposits() {
    try {
        const now = new Date();
        console.log(`[Scheduler] Sweep initiated at ${now.toLocaleString()}...`);
        // Find all active deposits that still have investment days remaining
        const activeDeposits = await ActiveDeposit_1.ActiveDeposit.find({ daysRemaining: { $gt: 0 } });
        let tickedCount = 0;
        for (const deposit of activeDeposits) {
            const lastTickTime = new Date(deposit.lastDecrementedAt).getTime();
            const elapsedMs = Date.now() - lastTickTime;
            const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
            if (elapsedDays >= 1) {
                const oldDays = deposit.daysRemaining;
                const actualTicks = Math.min(deposit.daysRemaining, elapsedDays);
                deposit.daysRemaining = Math.max(0, deposit.daysRemaining - actualTicks);
                // Calculate daily earning based on daily percentage rate (e.g. 3% return on $100 = $3 per day)
                const dailyEarning = deposit.amount * (deposit.planPercentage / 100);
                const totalEarning = dailyEarning * actualTicks;
                // 1. Create Earning logs for each of the completed days
                for (let i = 0; i < actualTicks; i++) {
                    await Earning_1.Earning.create({
                        username: deposit.username,
                        currencyLogo: deposit.currencyLogo,
                        currencyName: deposit.currencyName,
                        currencySymbol: deposit.currencySymbol,
                        walletId: deposit.walletId,
                        planName: deposit.planName,
                        planPercent: deposit.planPercentage,
                        earning: dailyEarning,
                        activeDepositId: deposit._id,
                    });
                }
                // 2. Credit the calculated earnings to the corresponding user wallet balance
                const wallet = await Wallet_1.Wallet.findById(deposit.walletId);
                if (wallet) {
                    wallet.balance += totalEarning;
                    if (deposit.daysRemaining === 0) {
                        wallet.balance += deposit.amount;
                        wallet.activeDeposit = Math.max(0, wallet.activeDeposit - deposit.amount);
                        console.log(`[Scheduler] Tranche completed! Returned principal of $${deposit.amount} back to wallet ${wallet.currencySymbol} balance.`);
                        // Total earnings over the full plan duration
                        const totalEarned = (deposit.amount * (deposit.planPercentage / 100) * deposit.planDuration).toFixed(2);
                        const dashboardUrl = `${process.env.NEXT_PUBLIC_URL || "https://capricornenergyltd.online"}/dashboard`;
                        const vars = {
                            username: deposit.username,
                            planName: deposit.planName,
                            planPercentage: deposit.planPercentage,
                            planDuration: deposit.planDuration,
                            amount: deposit.amount,
                            currencySymbol: deposit.currencySymbol,
                            currencyName: deposit.currencyName,
                            totalEarned,
                            dashboardUrl,
                        };
                        // Notify user + admin in real time
                        (0, notifications_1.sendTemplatedNotification)({
                            username: deposit.username,
                            templateName: "investment_complete",
                            variables: vars,
                            fallbackTitle: `Investment Completed — ${deposit.planName}`,
                            fallbackContent: `Your ${deposit.planName} investment of ${deposit.amount} ${deposit.currencySymbol} has completed. Your principal has been returned to your wallet. Total earnings: +${totalEarned} ${deposit.currencySymbol}.`,
                            notifyAdmin: true,
                            adminTitle: `Investment Completed — ${deposit.username} / ${deposit.planName}`,
                            adminContent: `${deposit.username}'s ${deposit.planName} investment of ${deposit.amount} ${deposit.currencySymbol} has completed its ${deposit.planDuration}-day cycle. Principal returned. Total earnings generated: +${totalEarned} ${deposit.currencySymbol}.`,
                        }).catch((err) => console.error(`[Scheduler] Failed to send completion notification for ${deposit.username}:`, err));
                        // Send completion email to user
                        (0, email_1.sendTemplatedEmail)({
                            username: deposit.username,
                            templateName: "investment_complete",
                            variables: vars,
                            fallbackSubject: `Investment Plan Completed — ${deposit.planName}`,
                            fallbackGreeting: `Hi ${deposit.username},`,
                            fallbackContent: `Your ${deposit.planName} investment of ${deposit.amount} ${deposit.currencySymbol} has completed. Your principal has been returned to your wallet balance.`,
                        }).catch((err) => console.error(`[Scheduler] Failed to send completion email for ${deposit.username}:`, err));
                    }
                    await wallet.save();
                    console.log(`[Scheduler] Credited wallet ${wallet.currencySymbol} balance by $${totalEarning} from ${actualTicks} day(s) return.`);
                }
                else {
                    console.warn(`[Scheduler] Warning: Wallet ID ${deposit.walletId} not found for active deposit ${deposit._id}. Earning credited only in logs.`);
                }
                // Advance lastDecrementedAt exactly by the processed days to preserve 24-hour alignment
                deposit.lastDecrementedAt = new Date(lastTickTime + elapsedDays * 24 * 60 * 60 * 1000);
                await deposit.save();
                console.log(`✓ Ticked active deposit for "${deposit.username}" (${deposit.currencySymbol}): ` +
                    `daysRemaining ${oldDays} -> ${deposit.daysRemaining} (caught up by ${elapsedDays} day(s), earning: +$${totalEarning})`);
                tickedCount++;
            }
        }
        console.log(`[Scheduler] Sweep complete. Processed ${tickedCount} ticked deposits.\n`);
    }
    catch (error) {
        console.error("✗ Error in active deposit scheduler sweep:", error);
    }
}
/**
 * Initializes the persistent hourly scheduler loop and runs a sweep immediately on boot.
 */
function startActiveDepositScheduler() {
    console.log("======================================================");
    console.log(" CAPRICORN - Active Deposits Cron Scheduler Started  ");
    console.log("======================================================");
    // 1. Run catch-up immediately on boot
    tickActiveDeposits();
    // 2. Set interval to run once every hour (3600000 ms) to keep cycles current
    setInterval(tickActiveDeposits, 60 * 60 * 1000);
}
