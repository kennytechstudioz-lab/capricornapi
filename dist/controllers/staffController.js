"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStaff = getAllStaff;
exports.createStaff = createStaff;
exports.updateStaff = updateStaff;
exports.deleteStaff = deleteStaff;
const Staff_1 = require("../models/Staff");
async function getAllStaff(req, res) {
    const staff = await Staff_1.Staff.find().sort({ createdAt: -1 });
    return res.json({ success: true, staff });
}
async function createStaff(req, res) {
    const { name, position, description, picture } = req.body;
    if (!name || !position || !description) {
        return res.status(400).json({ error: "Name, position, and description are required." });
    }
    const staff = await Staff_1.Staff.create({ name, position, description, picture: picture || "" });
    return res.status(201).json({ success: true, staff });
}
async function updateStaff(req, res) {
    const { id } = req.params;
    const { name, position, description, picture } = req.body;
    const staff = await Staff_1.Staff.findById(id);
    if (!staff)
        return res.status(404).json({ error: "Staff member not found." });
    if (name !== undefined)
        staff.name = String(name).trim();
    if (position !== undefined)
        staff.position = String(position).trim();
    if (description !== undefined)
        staff.description = String(description).trim();
    if (picture !== undefined)
        staff.picture = String(picture);
    await staff.save();
    return res.json({ success: true, staff });
}
async function deleteStaff(req, res) {
    const { id } = req.params;
    const staff = await Staff_1.Staff.findByIdAndDelete(id);
    if (!staff)
        return res.status(404).json({ error: "Staff member not found." });
    return res.json({ success: true, message: "Staff member deleted." });
}
