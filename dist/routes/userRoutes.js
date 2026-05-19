"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// Route: GET /api/users/wallets (Retrieve current user's wallets)
router.get("/wallets", userController_1.getUserWallets);
// Route: POST /api/users/deposit (Allocate or deposit clean energy capital)
router.post("/deposit", userController_1.allocateUserDeposit);
// Route: GET /api/users/profile (Retrieve user's verification details & profilePicture)
router.get("/profile", userController_1.getUserProfile);
// Route: PUT /api/users/profile (Update user's verification details & profilePicture)
router.put("/profile", userController_1.updateUserProfile);
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
