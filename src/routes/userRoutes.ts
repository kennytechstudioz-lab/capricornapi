import { Router } from "express";
import { registerUser } from "../controllers/userController";

const router = Router();

// Route: POST /api/users/register
router.post("/register", registerUser);

export default router;
