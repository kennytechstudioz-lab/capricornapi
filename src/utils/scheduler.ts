import { ActiveDeposit } from "../models/ActiveDeposit";

/**
 * Sweeps active deposits, calculates days elapsed since the last decrement event,
 * and handles catching up if the server was restarted or offline.
 */
export async function tickActiveDeposits() {
  try {
    const now = new Date();
    console.log(`[Scheduler] Sweep initiated at ${now.toLocaleString()}...`);

    // Find all active deposits that still have investment days remaining
    const activeDeposits = await ActiveDeposit.find({ daysRemaining: { $gt: 0 } });

    let tickedCount = 0;

    for (const deposit of activeDeposits) {
      const lastTickTime = new Date(deposit.lastDecrementedAt).getTime();
      const elapsedMs = Date.now() - lastTickTime;
      const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));

      if (elapsedDays >= 1) {
        const oldDays = deposit.daysRemaining;
        deposit.daysRemaining = Math.max(0, deposit.daysRemaining - elapsedDays);
        
        // Advance lastDecrementedAt exactly by the processed days to preserve 24-hour alignment
        deposit.lastDecrementedAt = new Date(lastTickTime + elapsedDays * 24 * 60 * 60 * 1000);
        await deposit.save();
        
        console.log(
          `✓ Ticked active deposit for "${deposit.username}" (${deposit.currencySymbol}): ` +
          `daysRemaining ${oldDays} -> ${deposit.daysRemaining} (caught up by ${elapsedDays} day(s))`
        );
        tickedCount++;
      }
    }

    console.log(`[Scheduler] Sweep complete. Processed ${tickedCount} ticked deposits.\n`);
  } catch (error) {
    console.error("✗ Error in active deposit scheduler sweep:", error);
  }
}

/**
 * Initializes the persistent hourly scheduler loop and runs a sweep immediately on boot.
 */
export function startActiveDepositScheduler() {
  console.log("======================================================");
  console.log(" CAPRICORN - Active Deposits Cron Scheduler Started  ");
  console.log("======================================================");

  // 1. Run catch-up immediately on boot
  tickActiveDeposits();

  // 2. Set interval to run once every hour (3600000 ms) to keep cycles current
  setInterval(tickActiveDeposits, 60 * 60 * 1000);
}
