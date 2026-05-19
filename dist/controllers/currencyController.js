"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrencies = getCurrencies;
exports.createCurrency = createCurrency;
exports.updateCurrency = updateCurrency;
exports.deleteCurrency = deleteCurrency;
const Currency_1 = require("../models/Currency");
// Action: Retrieve all active currencies
async function getCurrencies(req, res) {
    try {
        const currencies = await Currency_1.Currency.find({}).sort({ createdAt: 1 });
        return res.status(200).json({
            success: true,
            currencies,
        });
    }
    catch (error) {
        console.error("✗ Error in getCurrencies controller:", error);
        return res.status(500).json({
            error: "Internal server error retrieving currencies.",
        });
    }
}
// Action: Create a new currency
async function createCurrency(req, res) {
    try {
        const { name, symbol, image, address, balance } = req.body;
        if (!name || !symbol || !address) {
            return res.status(400).json({
                error: "Name, symbol, and wallet address are required parameters.",
            });
        }
        // Check name uniqueness to prevent collisions
        const existingName = await Currency_1.Currency.findOne({ name: name.trim() });
        if (existingName) {
            return res.status(400).json({
                error: "A currency with this name already exists.",
            });
        }
        const currency = new Currency_1.Currency({
            name: name.trim(),
            symbol: symbol.trim().toUpperCase(),
            image: image ? image.trim() : "",
            address: address.trim(),
            balance: balance ? Number(balance) : 0,
        });
        await currency.save();
        return res.status(201).json({
            success: true,
            currency,
        });
    }
    catch (error) {
        console.error("✗ Error in createCurrency controller:", error);
        return res.status(500).json({
            error: "Internal server error creating currency.",
        });
    }
}
// Action: Update an existing currency
async function updateCurrency(req, res) {
    try {
        const { id } = req.params;
        const { name, symbol, image, address, balance } = req.body;
        const currency = await Currency_1.Currency.findById(id);
        if (!currency) {
            return res.status(404).json({
                error: "Currency not found.",
            });
        }
        // Check uniqueness if name is changed
        if (name && name.trim() !== currency.name) {
            const existingName = await Currency_1.Currency.findOne({ name: name.trim() });
            if (existingName) {
                return res.status(400).json({
                    error: "A currency with this name already exists.",
                });
            }
            currency.name = name.trim();
        }
        if (symbol) {
            currency.symbol = symbol.trim().toUpperCase();
        }
        if (image !== undefined) {
            currency.image = image ? image.trim() : "";
        }
        if (address) {
            currency.address = address.trim();
        }
        if (balance !== undefined) {
            currency.balance = Number(balance);
        }
        await currency.save();
        return res.status(200).json({
            success: true,
            currency,
        });
    }
    catch (error) {
        console.error("✗ Error in updateCurrency controller:", error);
        return res.status(500).json({
            error: "Internal server error updating currency.",
        });
    }
}
// Action: Delete a currency
async function deleteCurrency(req, res) {
    try {
        const { id } = req.params;
        const currency = await Currency_1.Currency.findById(id);
        if (!currency) {
            return res.status(404).json({
                error: "Currency not found.",
            });
        }
        await currency.deleteOne();
        return res.status(200).json({
            success: true,
            message: "Currency successfully removed from system.",
        });
    }
    catch (error) {
        console.error("✗ Error in deleteCurrency controller:", error);
        return res.status(500).json({
            error: "Internal server error deleting currency.",
        });
    }
}
