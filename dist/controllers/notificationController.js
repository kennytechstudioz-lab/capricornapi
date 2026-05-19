"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
const Notification_1 = require("../models/Notification");
/**
 * Retrieves all notifications for a specific user or system admin.
 * Ordered by newest first.
 */
async function getNotifications(req, res) {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ error: "Missing required username parameter." });
        }
        const lowerUsername = String(username).toLowerCase().trim();
        // Query notifications matching the specific username, sorting newest first
        const list = await Notification_1.Notification.find({ username: lowerUsername }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            notifications: list,
        });
    }
    catch (error) {
        console.error("✗ Error in getNotifications controller:", error);
        return res.status(500).json({ error: "Internal server error querying notifications catalog." });
    }
}
/**
 * Marks a single notification as read.
 * Checks whether it's an admin reading or a standard user to set the appropriate read flag.
 */
async function markAsRead(req, res) {
    try {
        const { id } = req.params;
        const { username } = req.body;
        if (!id || !username) {
            return res.status(400).json({ error: "Missing required notification ID or username parameter." });
        }
        const lowerUsername = String(username).toLowerCase().trim();
        const notification = await Notification_1.Notification.findById(id);
        if (!notification) {
            return res.status(404).json({ error: "Target notification not found." });
        }
        if (lowerUsername === "admin") {
            notification.isAdminRead = true;
        }
        else {
            notification.isRead = true;
        }
        await notification.save();
        return res.status(200).json({
            success: true,
            notification,
        });
    }
    catch (error) {
        console.error("✗ Error in markAsRead controller:", error);
        return res.status(500).json({ error: "Internal server error updating notification read status." });
    }
}
/**
 * Bulk updates all unread notifications to read state for a specific user or admin.
 */
async function markAllAsRead(req, res) {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: "Missing required username parameter." });
        }
        const lowerUsername = String(username).toLowerCase().trim();
        if (lowerUsername === "admin") {
            // Bulk update administrative flags
            await Notification_1.Notification.updateMany({ username: "admin", isAdminRead: false }, { isAdminRead: true });
        }
        else {
            // Bulk update standard user flags
            await Notification_1.Notification.updateMany({ username: lowerUsername, isRead: false }, { isRead: true });
        }
        return res.status(200).json({
            success: true,
            message: "All notifications updated to read state successfully.",
        });
    }
    catch (error) {
        console.error("✗ Error in markAllAsRead controller:", error);
        return res.status(500).json({ error: "Internal server error performing bulk read update." });
    }
}
