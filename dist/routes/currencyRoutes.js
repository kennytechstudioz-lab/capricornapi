"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const currencyController_1 = require("../controllers/currencyController");
const router = (0, express_1.Router)();
// Routes mapping for Currencies resource
router.get("/", currencyController_1.getCurrencies);
router.post("/", currencyController_1.createCurrency);
router.patch("/:id", currencyController_1.updateCurrency);
router.delete("/:id", currencyController_1.deleteCurrency);
exports.default = router;
