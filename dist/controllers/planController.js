"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlan = createPlan;
exports.getPlans = getPlans;
exports.updatePlan = updatePlan;
exports.deletePlan = deletePlan;
const Plan_1 = require("../models/Plan");
// Controller: Create a new investment plan
async function createPlan(req, res) {
    try {
        const { name, percent, duration, min, max, referralPercent, picture, benefits, description, } = req.body;
        // Validate parameters
        if (!name ||
            percent === undefined ||
            duration === undefined ||
            min === undefined ||
            max === undefined ||
            referralPercent === undefined ||
            !description) {
            return res.status(400).json({
                error: "Please fill out all required fields.",
            });
        }
        // Check duplicate name
        const existingPlan = await Plan_1.Plan.findOne({ name: name.trim() });
        if (existingPlan) {
            return res.status(400).json({
                error: "An investment plan with this name already exists. Please choose a unique name.",
            });
        }
        // Save plan
        const newPlan = await Plan_1.Plan.create({
            name: name.trim(),
            percent: Number(percent),
            duration: Number(duration),
            min: Number(min),
            max: Number(max),
            referralPercent: Number(referralPercent),
            picture: picture || "",
            benefits: Array.isArray(benefits) ? benefits : [],
            description: description.trim(),
        });
        return res.status(201).json({
            success: true,
            message: "Investment plan created successfully!",
            plan: newPlan,
        });
    }
    catch (error) {
        console.error("✗ Error in createPlan controller:", error);
        return res.status(500).json({
            error: "Internal server error during plan creation.",
        });
    }
}
// Controller: Retrieve all active investment plans
async function getPlans(req, res) {
    try {
        const plans = await Plan_1.Plan.find({}).sort({ min: 1 });
        return res.status(200).json({
            success: true,
            plans,
        });
    }
    catch (error) {
        console.error("✗ Error in getPlans controller:", error);
        return res.status(500).json({
            error: "Internal server error retrieving plans list.",
        });
    }
}
// Controller: Update an existing investment plan
async function updatePlan(req, res) {
    try {
        const { id } = req.params;
        const { name, percent, duration, min, max, referralPercent, picture, benefits, description, } = req.body;
        const plan = await Plan_1.Plan.findById(id);
        if (!plan) {
            return res.status(404).json({
                error: "Investment plan not found.",
            });
        }
        // Check duplicate name if name is changed
        if (name && name.trim().toLowerCase() !== plan.name.toLowerCase()) {
            const duplicate = await Plan_1.Plan.findOne({ name: name.trim() });
            if (duplicate) {
                return res.status(400).json({
                    error: "An investment plan with this name already exists. Please choose a unique name.",
                });
            }
        }
        // Update fields
        if (name)
            plan.name = name.trim();
        if (percent !== undefined)
            plan.percent = Number(percent);
        if (duration !== undefined)
            plan.duration = Number(duration);
        if (min !== undefined)
            plan.min = Number(min);
        if (max !== undefined)
            plan.max = Number(max);
        if (referralPercent !== undefined)
            plan.referralPercent = Number(referralPercent);
        if (picture !== undefined)
            plan.picture = picture;
        if (benefits !== undefined)
            plan.benefits = Array.isArray(benefits) ? benefits : [];
        if (description)
            plan.description = description.trim();
        await plan.save();
        return res.status(200).json({
            success: true,
            message: "Investment plan updated successfully!",
            plan,
        });
    }
    catch (error) {
        console.error("✗ Error in updatePlan controller:", error);
        return res.status(500).json({
            error: "Internal server error during plan update.",
        });
    }
}
// Controller: Delete an existing investment plan
async function deletePlan(req, res) {
    try {
        const { id } = req.params;
        const plan = await Plan_1.Plan.findByIdAndDelete(id);
        if (!plan) {
            return res.status(404).json({
                error: "Investment plan not found.",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Investment plan deleted successfully!",
        });
    }
    catch (error) {
        console.error("✗ Error in deletePlan controller:", error);
        return res.status(500).json({
            error: "Internal server error during plan deletion.",
        });
    }
}
