"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// Route: GET /api/users/wallets (Retrieve current user's wallets)
router.get("/wallets", userController_1.getUserWallets);
// Route: PUT /api/users/wallets/address (Update wallet payout address)
router.put("/wallets/address", userController_1.updateUserWalletAddress);
// Route: PUT /api/users/password (Change user password)
router.put("/password", userController_1.changeUserPassword);
// Route: PUT /api/users/2fa (Toggle 2FA)
router.put("/2fa", userController_1.toggleUser2FA);
// Route: POST /api/users/deposit (Allocate or deposit clean energy capital)
router.post("/deposit", userController_1.allocateUserDeposit);
// Route: POST /api/users/withdrawal (User requests a withdrawal)
router.post("/withdrawal", userController_1.requestUserWithdrawal);
// Route: POST /api/users/capital-access (User requests capital access)
router.post("/capital-access", userController_1.requestCapitalAccess);
// Route: GET /api/users/profile (Retrieve user's verification details & profilePicture)
router.get("/profile", userController_1.getUserProfile);
// Route: GET /api/users/transactions/all (Retrieve all transactions in system for admin)
router.get("/transactions/all", userController_1.getAllTransactionsForAdmin);
// Route: GET /api/users/transactions (Retrieve user's transactions)
router.get("/transactions", userController_1.getUserTransactions);
// Route: DELETE /api/users/transactions/:id (Delete a transaction by ID)
router.delete("/transactions/:id", userController_1.deleteUserTransaction);
// Route: PATCH /api/users/transactions/:id/status (Update transaction status by admin)
router.patch("/transactions/:id/status", userController_1.updateTransactionStatusByAdmin);
// Route: GET /api/users/active-deposits (Retrieve user's active deposits)
router.get("/active-deposits", userController_1.getActiveDeposits);
// Route: GET /api/users/active-deposits/all (Retrieve all active deposits system-wide for admin)
router.get("/active-deposits/all", userController_1.getAllActiveDepositsForAdmin);
// Route: DELETE /api/users/active-deposits/:id (Delete an active deposit tranche by admin)
router.delete("/active-deposits/:id", userController_1.deleteActiveDeposit);
// Route: GET /api/users/earnings (Retrieve current user's compounding payouts)
router.get("/earnings", userController_1.getUserEarnings);
// Route: GET /api/users/earnings/all (Retrieve all platform-wide earnings for admin auditing)
router.get("/earnings/all", userController_1.getAllEarningsForAdmin);
// Route: DELETE /api/users/earnings/:id (Delete earning document)
router.delete("/earnings/:id", userController_1.deleteEarning);
// Route: PUT /api/users/profile (Update user's verification details & profilePicture)
router.put("/profile", userController_1.updateUserProfile);
// Route: GET /api/users/referrals/all (Retrieve all referrals system-wide for admin)
router.get("/referrals/all", userController_1.getAllReferralsForAdmin);
// Route: GET /api/users/referrals (Retrieve user referrals list)
router.get("/referrals", userController_1.getUserReferrals);
// Route: POST /api/users/bulk-notify (Admin sends in-app notification to selected users)
router.post("/bulk-notify", userController_1.adminBulkNotify);
// Route: POST /api/users/bulk-email (Admin sends templated email to selected users)
router.post("/bulk-email", userController_1.adminBulkEmail);
// Route: POST /api/users/transactions/admin (Admin creates a transaction for a user)
router.post("/transactions/admin", userController_1.adminCreateTransaction);
// Route: POST /api/users/verification/approve (Admin approves user KYC)
router.post("/verification/approve", userController_1.approveVerification);
// Route: POST /api/users/verification/reject (Admin rejects user KYC with reason)
router.post("/verification/reject", userController_1.rejectVerification);
// Route: POST /api/users/forgot-password (Step 1: send OTP to email)
router.post("/forgot-password", userController_1.forgotPassword);
// Route: POST /api/users/forgot-password/verify-otp (Step 2: verify OTP)
router.post("/forgot-password/verify-otp", userController_1.verifyResetOtp);
// Route: POST /api/users/forgot-password/reset (Step 3: set new password)
router.post("/forgot-password/reset", userController_1.resetPassword);
// Route: POST /api/users/2fa/verify (Verify 2FA OTP after login)
router.post("/2fa/verify", userController_1.verifyTwoFactorOtp);
// Route: POST /api/users/register
router.post("/register", userController_1.registerUser);
// Route: POST /api/users/login
router.post("/login", userController_1.loginUser);
// Route: GET /api/users (Retrieve all users)
router.get("/", userController_1.getAllUsers);
// Route: PATCH /api/users/bulk (Bulk update selected users)
router.patch("/bulk", userController_1.bulkUpdateUsers);
// Route: PATCH /api/users/:id (Update user role/status by admin)
router.patch("/:id", userController_1.updateUserByAdmin);
// Route: DELETE /api/users/:id (Delete user account by admin)
router.delete("/:id", userController_1.deleteUser);
exports.default = router;
