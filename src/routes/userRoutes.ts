import { Router } from "express";
import {
  registerUser,
  loginUser,
  getAllUsers,
  updateUserByAdmin,
  deleteUser,
  bulkUpdateUsers,
  getUserWallets,
  getUserProfile,
  updateUserProfile,
  allocateUserDeposit,
  getUserTransactions,
  updateUserWalletAddress,
  changeUserPassword,
  toggleUser2FA,
  getAllTransactionsForAdmin,
  deleteUserTransaction,
} from "../controllers/userController";

const router = Router();

// Route: GET /api/users/wallets (Retrieve current user's wallets)
router.get("/wallets", getUserWallets);

// Route: PUT /api/users/wallets/address (Update wallet payout address)
router.put("/wallets/address", updateUserWalletAddress);

// Route: PUT /api/users/password (Change user password)
router.put("/password", changeUserPassword);

// Route: PUT /api/users/2fa (Toggle 2FA)
router.put("/2fa", toggleUser2FA);

// Route: POST /api/users/deposit (Allocate or deposit clean energy capital)
router.post("/deposit", allocateUserDeposit);

// Route: GET /api/users/profile (Retrieve user's verification details & profilePicture)
router.get("/profile", getUserProfile);

// Route: GET /api/users/transactions/all (Retrieve all transactions in system for admin)
router.get("/transactions/all", getAllTransactionsForAdmin);

// Route: GET /api/users/transactions (Retrieve user's transactions)
router.get("/transactions", getUserTransactions);

// Route: DELETE /api/users/transactions/:id (Delete a transaction by ID)
router.delete("/transactions/:id", deleteUserTransaction);

// Route: PUT /api/users/profile (Update user's verification details & profilePicture)
router.put("/profile", updateUserProfile);

// Route: POST /api/users/register
router.post("/register", registerUser);

// Route: POST /api/users/login
router.post("/login", loginUser);

// Route: GET /api/users (Retrieve all users)
router.get("/", getAllUsers);

// Route: PATCH /api/users/bulk (Bulk update selected users)
router.patch("/bulk", bulkUpdateUsers);

// Route: PATCH /api/users/:id (Update user role/status by admin)
router.patch("/:id", updateUserByAdmin);

// Route: DELETE /api/users/:id (Delete user account by admin)
router.delete("/:id", deleteUser);

export default router;
