import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../src/models/User";
import { Wallet } from "../src/models/Wallet";
import { Plan } from "../src/models/Plan";
import { Currency } from "../src/models/Currency";
import { Transaction } from "../src/models/Transaction";
import { ActiveDeposit } from "../src/models/ActiveDeposit";
import { Earning } from "../src/models/Earning";
import { tickActiveDeposits } from "../src/utils/scheduler";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/oeelco";

async function runTests() {
  console.log("======================================================");
  console.log(" CAPRICORN INTEGRATION TEST: ACTIVE DEPOSITS & EARNINGS");
  console.log("======================================================");

  try {
    // 1. Database Connection
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB database successfully.");

    const username = "testinvestor_" + Math.random().toString(36).substring(2, 7);

    // 2. Setup Seed Data (Mock Plan & Mock Currency/Wallet)
    let plan = await Plan.findOne({ name: "ccus_fund" });
    if (!plan) {
      plan = await Plan.create({
        name: "ccus_fund",
        duration: 30,
        percent: 3.0, // 3% Daily Daily yield
        referralPercent: 5,
        min: 100,
        max: 50000,
        description: "Carbon Capture, Utilization, and Storage Technology Fund",
      });
    }
    console.log(`✓ Seeded Investment Plan: ${plan.name} (Duration: ${plan.duration} days / Percent: ${plan.percent}%)`);

    let currency = await Currency.findOne({ symbol: "USDT" });
    if (!currency) {
      currency = await Currency.create({
        name: "Tether",
        symbol: "USDT",
        image: "https://cryptologos.cc/logos/tether-usdt-logo.png",
        address: "TMockAddress123456789",
      });
    }
    console.log(`✓ Seeded Currency: ${currency.name} (${currency.symbol})`);

    // Create user wallet with $2000 initial balance
    const wallet = await Wallet.create({
      currencyId: currency._id,
      currencyName: currency.name,
      currencySymbol: currency.symbol,
      currencyLogo: currency.image,
      username: username,
      address: "TUserPayoutAddress99999",
      balance: 2000.0,
      activeDeposit: 0.0,
      totalDeposit: 0.0,
    });
    console.log(`✓ Seeded User Wallet: Balance = $${wallet.balance}, ActiveDeposit = $${wallet.activeDeposit}`);

    // ==========================================================
    // TEST CASE 1: BALANCE DEPOSIT (AUTO-ALLOCATE ACTIVE DEPOSIT)
    // ==========================================================
    console.log("\n--- TEST CASE 1: Balance Deposit (Auto-Allocate Active Deposit) ---");
    const amount1 = 500.0;
    
    // Simulate balance charge
    wallet.balance -= amount1;
    wallet.activeDeposit += amount1;
    wallet.totalDeposit += amount1;
    await wallet.save();

    const tx1 = await Transaction.create({
      currencyId: wallet.currencyId,
      currencyLogo: wallet.currencyLogo,
      currencyName: wallet.currencyName,
      currencySymbol: wallet.currencySymbol,
      walletId: wallet._id,
      username: username,
      planDuration: plan.duration,
      planPercentage: plan.percent,
      planReferralPercent: plan.referralPercent,
      amount: amount1,
      transactionType: "deposit",
      method: "balance",
      status: "completed",
    });

    // Spawn ActiveDeposit directly like in controller for completed transaction
    const activeDeposit1 = await ActiveDeposit.create({
      currencyId: wallet.currencyId,
      currencyLogo: wallet.currencyLogo,
      currencyName: wallet.currencyName,
      currencySymbol: wallet.currencySymbol,
      walletId: wallet._id,
      username: username,
      amount: amount1,
      planDuration: plan.duration,
      planName: plan.name,
      planPercentage: plan.percent,
      planReferralPercent: plan.referralPercent,
      daysRemaining: plan.duration,
      transactionId: tx1._id,
      lastDecrementedAt: new Date(),
    });

    console.log(`✓ Spawned transaction: ${tx1.method} / Status: ${tx1.status} / Amount: $${tx1.amount}`);
    console.log(`✓ Wallet updated: New Balance = $${wallet.balance}, ActiveDeposit = $${wallet.activeDeposit}`);
    console.log(
      `✓ Spawned ActiveDeposit: ID = ${activeDeposit1._id}, ` +
      `planName = ${activeDeposit1.planName}, ` +
      `daysRemaining = ${activeDeposit1.daysRemaining}, ` +
      `lastTick = ${activeDeposit1.lastDecrementedAt.toISOString()}`
    );

    // ==========================================================
    // TEST CASE 2: PENDING DIRECT DEPOSIT -> APPROVAL BY ADMIN
    // ==========================================================
    console.log("\n--- TEST CASE 2: Pending Direct Deposit -> Admin Approval ---");
    const amount2 = 1000.0;

    // Direct deposit starts as pending. Balances NOT updated yet.
    const tx2 = await Transaction.create({
      currencyId: wallet.currencyId,
      currencyLogo: wallet.currencyLogo,
      currencyName: wallet.currencyName,
      currencySymbol: wallet.currencySymbol,
      walletId: wallet._id,
      username: username,
      planDuration: plan.duration,
      planPercentage: plan.percent,
      planReferralPercent: plan.referralPercent,
      amount: amount2,
      transactionType: "deposit",
      method: "direct",
      status: "pending",
    });
    console.log(`✓ Created Pending Direct Deposit: Method = ${tx2.method}, Status = ${tx2.status}, Amount = $${tx2.amount}`);

    // Mock Admin Approval Logic
    tx2.status = "completed";
    await tx2.save();

    // Direct deposit completes -> wallet balances are credited on approval
    wallet.activeDeposit += tx2.amount;
    wallet.totalDeposit += tx2.amount;
    await wallet.save();

    // Spawn ActiveDeposit tranche
    const activeDeposit2 = await ActiveDeposit.create({
      currencyId: tx2.currencyId,
      currencyLogo: tx2.currencyLogo,
      currencyName: tx2.currencyName,
      currencySymbol: tx2.currencySymbol,
      walletId: tx2.walletId,
      username: tx2.username,
      amount: tx2.amount,
      planDuration: tx2.planDuration,
      planName: plan.name,
      planPercentage: tx2.planPercentage,
      planReferralPercent: tx2.planReferralPercent,
      daysRemaining: tx2.planDuration,
      transactionId: tx2._id,
      lastDecrementedAt: new Date(),
    });

    console.log(`✓ Admin Action: Transaction Status updated to -> ${tx2.status}`);
    console.log(`✓ Wallet updated on Approval: New Balance = $${wallet.balance}, ActiveDeposit = $${wallet.activeDeposit}`);
    console.log(
      `✓ Spawned ActiveDeposit: ID = ${activeDeposit2._id}, ` +
      `planName = ${activeDeposit2.planName}, ` +
      `daysRemaining = ${activeDeposit2.daysRemaining}, ` +
      `lastTick = ${activeDeposit2.lastDecrementedAt.toISOString()}`
    );

    // ==========================================================
    // TEST CASE 3: CATCH-UP SCHEDULER TICK & DAILY EARNINGS
    // ==========================================================
    console.log("\n--- TEST CASE 3: Hourly/Startup Catchup Scheduler Tick & Daily Earnings ---");
    
    // Check initial wallet balance before tick (should be $1500)
    const walletBeforeTick = await Wallet.findById(wallet._id);
    if (!walletBeforeTick) throw new Error("Wallet not found.");
    const balanceBefore = walletBeforeTick.balance;

    // Artificially backdate the lastDecrementedAt timestamp of activeDeposit2 by exactly 2 days (48 hours ago)
    const backdatedTime = new Date(Date.now() - 48.5 * 60 * 60 * 1000); // 48.5 hours ago
    activeDeposit2.lastDecrementedAt = backdatedTime;
    await activeDeposit2.save();
    console.log(`✓ Artificially backdated ActiveDeposit lastTick to: ${backdatedTime.toISOString()}`);

    // Execute catch-up scheduler sweep
    console.log("[Scheduler] Triggering tickActiveDeposits() catch-up sweep...");
    await tickActiveDeposits();

    // Fetch the updated active deposit
    const updatedDeposit2 = await ActiveDeposit.findById(activeDeposit2._id);
    if (!updatedDeposit2) throw new Error("Failed to load updated deposit.");

    const expectedDays = plan.duration - 2;
    console.log(`✓ Fetched ticked ActiveDeposit daysRemaining: ${updatedDeposit2.daysRemaining} (Expected: ${expectedDays})`);
    
    // Check Earning documents created for activeDeposit2
    const earnings = await Earning.find({ activeDepositId: activeDeposit2._id });
    console.log(`✓ Spawned Earnings records: ${earnings.length} (Expected: 2)`);
    
    for (const earn of earnings) {
      console.log(
        `  - Earning Log: User = ${earn.username}, Plan = ${earn.planName}, ` +
        `Rate = ${earn.planPercent}%, Earning Amount = $${earn.earning}`
      );
    }

    // Verify wallet balance has been credited appropriately
    // Yield rate is activeDeposit2.planPercentage Daily. For 2 days caught up, total = daily * 2.
    const walletAfterTick = await Wallet.findById(wallet._id);
    if (!walletAfterTick) throw new Error("Wallet not found.");
    const dailyEarningVal = activeDeposit2.amount * (activeDeposit2.planPercentage / 100);
    const expectedBalance = balanceBefore + (dailyEarningVal * 2);
    
    console.log(`✓ Wallet Balance Before Tick: $${balanceBefore}`);
    console.log(`✓ Wallet Balance After Tick: $${walletAfterTick.balance} (Expected: $${expectedBalance})`);

    if (updatedDeposit2.daysRemaining === expectedDays && earnings.length === 2 && walletAfterTick.balance === expectedBalance) {
      console.log("\n🎉 TEST SUCCESS: Earnings successfully logged, daily percentage calculated perfectly, and Wallet balance credited!");
    } else {
      throw new Error(`Test failed. Days remaining: ${updatedDeposit2.daysRemaining}, earnings: ${earnings.length}, balance: ${walletAfterTick.balance}`);
    }

    // Clean up mock user database elements
    await User.deleteMany({ username: username });
    await Wallet.deleteMany({ username: username });
    await Transaction.deleteMany({ username: username });
    await ActiveDeposit.deleteMany({ username: username });
    await Earning.deleteMany({ username: username });
    console.log("✓ Cleaned up integration test seed database elements.");

  } catch (error) {
    console.error("✗ Integration test failed with error:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n======================================================");
    console.log(" INTEGRATION TESTING SESSION COMPLETED SUCCESSFULLY   ");
    console.log("======================================================");
    process.exit(0);
  }
}

runTests();
