import { Router } from "express";
import {
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
} from "../controllers/currencyController";

const router = Router();

// Routes mapping for Currencies resource
router.get("/", getCurrencies);
router.post("/", createCurrency);
router.patch("/:id", updateCurrency);
router.delete("/:id", deleteCurrency);

export default router;
