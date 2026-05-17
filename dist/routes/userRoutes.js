"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// Route: POST /api/users/register
router.post("/register", userController_1.registerUser);
exports.default = router;
