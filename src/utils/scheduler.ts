import { ActiveDeposit } from "../models/ActiveDeposit";
import { Wallet } from "../models/Wallet";
import { Earning } from "../models/Earning";
import { Currency } from "../models/Currency";
import { sendTemplatedNotification } from "./notifications";
import { sendTemplatedEmail } from "./email";

/**
 * Robust helper to locate a user's wallet record.
 * Tries direct ID first, then falls back to case-insensitive username + currency matching,
 * and auto-provisions the wallet if missing so the investor's balance is never lost.
 */
async function findUserWallet(deposit: any): Promise<any> {
  let wallet = null;

  if (deposit.walletId) {
    wallet = await Wallet.findById(deposit.walletId);
  }

  // Fallback 1: match by case-insensitive username and currencySymbol / currencyId / currencyName
  if (!wallet && deposit.username) {
    const cleanUsername = String(deposit.username).trim();
    wallet = await Wallet.findOne({
      username: { $regex: new RegExp("^" + cleanUsername + "$", "i") },
      $or: [
        ...(deposit.currencySymbol ? [{ currencySymbol: deposit.currencySymbol }] : []),
        ...(deposit.currencyId ? [{ currencyId: deposit.currencyId }] : []),
        ...(deposit.currencyName ? [{ currencyName: deposit.currencyName }] : []),
      ],
    });

    if (wallet) {
      deposit.walletId = wallet._id;
    }
  }

  // Fallback 2: if wallet still does not exist, auto-create it from system currency
  if (!wallet && deposit.username) {
    try {
      const cleanUsername = String(deposit.username).trim();
      let currency = null;
      if (deposit.currencyId) {
        currency = await Currency.findById(deposit.currencyId);
      }
      if (!currency && deposit.currencySymbol) {
        currency = await Currency.findOne({ symbol: deposit.currencySymbol });
      }

      if (currency) {
        wallet = await Wallet.create({
          currencyId: currency._id,
          currencyName: currency.name,
          currencySymbol: currency.symbol,
          currencyLogo: currency.image || deposit.currencyLogo || "",
          username: cleanUsername,
          address: "",
          balance: 0.0,
          totalDeposit: 0.0,
          totalWithdrawal: 0.0,
          activeDeposit: 0.0,
        });
        deposit.walletId = wallet._id;
        console.log(`[Scheduler] Auto-provisioned missing wallet for user "${cleanUsername}" (${currency.symbol})`);
      }
    } catch (createErr) {
      console.error(`[Scheduler] Failed to auto-provision wallet for ${deposit.username}:`, createErr);
    }
  }

  return wallet;
}

/**
 * Dispatches completion notifications and emails safely in the background.
 * Completely fire-and-forget; never interrupts or throws into financial crediting logic.
 */
function sendCompletionAlerts(deposit: any) {
  try {
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

    // Real-time user + admin notification (in-app socket and DB)
    sendTemplatedNotification({
      username: deposit.username,
      templateName: "investment_complete",
      variables: vars,
      fallbackTitle: `Investment Completed — ${deposit.planName}`,
      fallbackContent: `Your ${deposit.planName} investment of ${deposit.amount} ${deposit.currencySymbol} has completed. Your principal has been returned to your wallet. Total earnings: +${totalEarned} ${deposit.currencySymbol}.`,
      notifyAdmin: true,
      adminTitle: `Investment Completed — ${deposit.username} / ${deposit.planName}`,
      adminContent: `${deposit.username}'s ${deposit.planName} investment of ${deposit.amount} ${deposit.currencySymbol} has completed its ${deposit.planDuration}-day cycle. Principal returned. Total earnings generated: +${totalEarned} ${deposit.currencySymbol}.`,
    }).catch((err) => console.error(`[Scheduler] Failed to send completion notification for ${deposit.username}:`, err));

    // Email dispatch (bypassed if SUPPRESS_EMAIL=true, otherwise safe with timeouts)
    sendTemplatedEmail({
      username: deposit.username,
      templateName: "investment_complete",
      variables: vars,
      fallbackSubject: `Investment Plan Completed — ${deposit.planName}`,
      fallbackGreeting: `Hi ${deposit.username},`,
      fallbackContent: `Your ${deposit.planName} investment of ${deposit.amount} ${deposit.currencySymbol} has completed. Your principal has been returned to your wallet balance.`,
    }).catch((err) => console.error(`[Scheduler] Failed to send completion email for ${deposit.username}:`, err));
  } catch (alertErr) {
    console.error(`[Scheduler] Completion alert dispatch error for ${deposit.username}:`, alertErr);
  }
}

/**
 * Sweeps active deposits, calculates days elapsed since the last decrement event,
 * returns principals and final earnings upon completion, and reconciles any
 * previously uncredited/stuck completed investments.
 */
export async function tickActiveDeposits() {
  try {
    const now = new Date();
    console.log(`[Scheduler] Sweep initiated at ${now.toLocaleString()}...`);

    let tickedCount = 0;
    let completedCount = 0;
    let reconciledCount = 0;

    // =========================================================================
    // PHASE 1: RECONCILIATION FOR COMPLETED INVESTMENTS NOT CREDITED
    // Covers any deposit that reached daysRemaining <= 0 but whose principal
    // was not marked returned (e.g. from server restart, unhandled error, or email failure)
    // =========================================================================
    const uncreditedCompleted = await ActiveDeposit.find({
      daysRemaining: { $lte: 0 },
      principalReturned: { $ne: true },
    });

    if (uncreditedCompleted.length > 0) {
      console.log(`[Scheduler] Found ${uncreditedCompleted.length} completed deposit(s) needing principal reconciliation.`);

      for (const deposit of uncreditedCompleted) {
        try {
          const wallet = await findUserWallet(deposit);

          if (wallet) {
            // Check if principal is still locked in wallet.activeDeposit
            const activeDepBal = wallet.activeDeposit || 0;
            if (activeDepBal >= deposit.amount) {
              wallet.balance = (wallet.balance || 0) + deposit.amount;
              wallet.activeDeposit = Math.max(0, activeDepBal - deposit.amount);
              console.log(
                `[Scheduler] Reconciled: Returned principal $${deposit.amount} to wallet ${wallet.currencySymbol} balance for "${deposit.username}".`
              );
            } else if (activeDepBal > 0) {
              wallet.balance = (wallet.balance || 0) + deposit.amount;
              wallet.activeDeposit = 0;
              console.log(
                `[Scheduler] Reconciled: Cleared remaining activeDeposit ($${activeDepBal}) and returned $${deposit.amount} to wallet ${wallet.currencySymbol} balance for "${deposit.username}".`
              );
            } else {
              console.log(
                `[Scheduler] Note: Principal for deposit ${deposit._id} (${deposit.username}) already decremented from activeDeposit.`
              );
            }

            // Check if any daily earnings were missed
            const existingEarningsCount = await Earning.countDocuments({ activeDepositId: deposit._id });
            const missingDays = Math.max(0, deposit.planDuration - existingEarningsCount);
            if (missingDays > 0) {
              const dailyEarning = deposit.amount * (deposit.planPercentage / 100);
              const missingTotal = dailyEarning * missingDays;
              for (let i = 0; i < missingDays; i++) {
                await Earning.create({
                  username: deposit.username,
                  currencyLogo: deposit.currencyLogo,
                  currencyName: deposit.currencyName,
                  currencySymbol: deposit.currencySymbol,
                  walletId: wallet._id,
                  planName: deposit.planName,
                  planPercent: deposit.planPercentage,
                  earning: dailyEarning,
                  activeDepositId: deposit._id,
                });
              }
              wallet.balance = (wallet.balance || 0) + missingTotal;
              console.log(
                `[Scheduler] Reconciled: Credited ${missingDays} missed earning day(s) (+$${missingTotal}) to wallet for "${deposit.username}".`
              );
            }

            await wallet.save();
          } else {
            console.warn(`[Scheduler] Reconciliation Warning: Could not locate or create wallet for deposit ${deposit._id} (${deposit.username}).`);
          }

          deposit.principalReturned = true;
          deposit.status = "completed";
          await deposit.save();
          reconciledCount++;
        } catch (reconcileErr) {
          console.error(`[Scheduler] Error reconciling completed deposit ${deposit._id}:`, reconcileErr);
        }
      }
    }

    // =========================================================================
    // PHASE 2: DAILY TICK SWEEP FOR RUNNING DEPOSITS (daysRemaining > 0)
    // =========================================================================
    const activeDeposits = await ActiveDeposit.find({ daysRemaining: { $gt: 0 } });

    for (const deposit of activeDeposits) {
      try {
        const lastTickTime = new Date(deposit.lastDecrementedAt).getTime();
        const elapsedMs = Date.now() - lastTickTime;
        const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));

        if (elapsedDays >= 1) {
          const oldDays = deposit.daysRemaining;
          const actualTicks = Math.min(deposit.daysRemaining, elapsedDays);
          deposit.daysRemaining = Math.max(0, deposit.daysRemaining - actualTicks);

          const dailyEarning = deposit.amount * (deposit.planPercentage / 100);
          const totalEarning = dailyEarning * actualTicks;

          const wallet = await findUserWallet(deposit);

          // 1. Create Earning logs for each of the completed days
          for (let i = 0; i < actualTicks; i++) {
            try {
              await Earning.create({
                username: deposit.username,
                currencyLogo: deposit.currencyLogo,
                currencyName: deposit.currencyName,
                currencySymbol: deposit.currencySymbol,
                walletId: wallet ? wallet._id : deposit.walletId,
                planName: deposit.planName,
                planPercent: deposit.planPercentage,
                earning: dailyEarning,
                activeDepositId: deposit._id,
              });
            } catch (earnErr) {
              console.error(`[Scheduler] Failed to create Earning record for deposit ${deposit._id}:`, earnErr);
            }
          }

          // 2. Credit the calculated earnings and return principal if deposit reached completion
          if (wallet) {
            wallet.balance = (wallet.balance || 0) + totalEarning;

            if (deposit.daysRemaining === 0) {
              wallet.balance = (wallet.balance || 0) + deposit.amount;
              wallet.activeDeposit = Math.max(0, (wallet.activeDeposit || 0) - deposit.amount);
              deposit.principalReturned = true;
              deposit.status = "completed";
              console.log(
                `[Scheduler] Tranche completed! Returned principal of $${deposit.amount} back to wallet ${wallet.currencySymbol} balance for "${deposit.username}".`
              );
            }

            await wallet.save();
            console.log(
              `[Scheduler] Credited wallet ${wallet.currencySymbol} balance by $${totalEarning} from ${actualTicks} day(s) return for "${deposit.username}".`
            );
          } else {
            console.warn(
              `[Scheduler] Warning: Wallet ID ${deposit.walletId} not found for active deposit ${deposit._id}. Earning credited only in logs.`
            );
            if (deposit.daysRemaining === 0) {
              deposit.status = "completed";
            }
          }

          // 3. Advance lastDecrementedAt exactly by the processed days to preserve 24-hour alignment
          deposit.lastDecrementedAt = new Date(lastTickTime + elapsedDays * 24 * 60 * 60 * 1000);
          await deposit.save();

          console.log(
            `✓ Ticked active deposit for "${deposit.username}" (${deposit.currencySymbol}): ` +
            `daysRemaining ${oldDays} -> ${deposit.daysRemaining} (caught up by ${elapsedDays} day(s), earning: +$${totalEarning})`
          );

          // 4. Dispatch real-time user notification and email (bypassed if SUPPRESS_EMAIL=true)
          if (deposit.daysRemaining === 0) {
            sendCompletionAlerts(deposit);
            completedCount++;
          }

          tickedCount++;
        }
      } catch (depositErr) {
        console.error(`[Scheduler] Error processing active deposit ${deposit._id}:`, depositErr);
      }
    }

    console.log(
      `[Scheduler] Sweep complete. Processed ${tickedCount} ticked deposit(s), ${completedCount} completed, ${reconciledCount} reconciled.\n`
    );
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

  // 1. Run catch-up & reconciliation immediately on boot
  tickActiveDeposits();

  // 2. Set interval to run once every hour (3600000 ms) to keep cycles current
  setInterval(tickActiveDeposits, 60 * 60 * 1000);
}
