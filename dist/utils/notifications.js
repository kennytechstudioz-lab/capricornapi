"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
exports.compileTemplate = compileTemplate;
exports.sendTemplatedNotification = sendTemplatedNotification;
const Notification_1 = require("../models/Notification");
const NotificationTemplate_1 = require("../models/NotificationTemplate");
const socket_1 = require("./socket");
/**
 * Reusable utility to dispatch and persist notifications for both users and system administrators.
 * Saves directly to the MongoDB Notifications collection.
 *
 * @param params Notification attributes and target controls
 * @returns Promise resolving to the created user notification document
 */
async function sendNotification(params) {
    const { username, notificationName, notificationTitle, content, notifyAdmin = false, adminTitle, adminContent, } = params;
    // 1. Create and save the main user notification
    const userNotification = await Notification_1.Notification.create({
        username: username.toLowerCase().trim(),
        notificationName: notificationName.trim(),
        notificationTitle: notificationTitle.trim(),
        content: content.trim(),
        isRead: false,
        isAdminRead: false,
    });
    // Emit in real-time through sockets to user
    (0, socket_1.emitNotification)(username, userNotification);
    console.log(`[Notification System] Dispatched user alert for "${username}": ${notificationTitle}`);
    // 2. If requested, also create a notification for the admin panel
    if (notifyAdmin) {
        const finalAdminTitle = adminTitle || `[User: ${username}] ${notificationTitle}`;
        const finalAdminContent = adminContent || content;
        const adminNotification = await Notification_1.Notification.create({
            username: "admin", // Universal keyword/index for system administrator logs
            notificationName: `admin_${notificationName.trim()}`,
            notificationTitle: finalAdminTitle.trim(),
            content: finalAdminContent.trim(),
            isRead: false,
            isAdminRead: false,
        });
        // Emit in real-time through sockets to admin
        (0, socket_1.emitNotification)("admin", adminNotification);
        console.log(`[Notification System] Dispatched admin alert: ${finalAdminTitle}`);
    }
    return userNotification;
}
/**
 * Safely compiles dynamic variables into a template text containing {{variable}} placeholders.
 * Checks if variables are passed before replacing to prevent errors.
 *
 * @param text Raw template string (e.g. "Hello {{username}}")
 * @param variables Object containing the parameter mappings
 */
function compileTemplate(text, variables) {
    let compiled = text;
    if (!compiled)
        return "";
    // Regex to extract placeholders like {{username}}, {{amount}}, etc.
    const matches = compiled.match(/\{\{\s*(\w+)\s*\}\}/g);
    if (matches) {
        for (const match of matches) {
            // Extract clean key name
            const key = match.replace(/\{\{\s*|\s*\}\}/g, "");
            // Prevent errors: check if the parameter was explicitly passed and is defined
            if (variables && key in variables && variables[key] !== undefined && variables[key] !== null) {
                compiled = compiled.replace(match, String(variables[key]));
            }
        }
    }
    return compiled;
}
/**
 * Fetches template from database, replaces parameters safely, and dispatches notification.
 * If template does not exist, it auto-seeds it in the database and falls back gracefully.
 */
async function sendTemplatedNotification(params) {
    const { username, templateName, variables, notifyAdmin = false, adminTitle, adminContent, fallbackTitle, fallbackContent, } = params;
    // 1. Try to find the template in database
    let template = await NotificationTemplate_1.NotificationTemplate.findOne({ name: templateName });
    // Auto-seed template if it doesn't exist
    if (!template) {
        try {
            template = await NotificationTemplate_1.NotificationTemplate.create({
                name: templateName,
                title: fallbackTitle,
                content: fallbackContent,
            });
            console.log(`[Notification System] Auto-seeded notification template "${templateName}" in database.`);
        }
        catch (err) {
            console.error(`[Notification System] Failed to auto-seed template "${templateName}":`, err);
        }
    }
    const rawTitle = template ? template.title : fallbackTitle;
    const rawContent = template ? template.content : fallbackContent;
    // 2. Safely compile title and content
    const compiledTitle = compileTemplate(rawTitle, variables);
    const compiledContent = compileTemplate(rawContent, variables);
    // 3. Safely compile custom admin templates if provided
    const compiledAdminTitle = adminTitle ? compileTemplate(adminTitle, variables) : undefined;
    const compiledAdminContent = adminContent ? compileTemplate(adminContent, variables) : undefined;
    // 4. Save and dispatch using our standard sendNotification helper
    return sendNotification({
        username,
        notificationName: templateName,
        notificationTitle: compiledTitle,
        content: compiledContent,
        notifyAdmin,
        adminTitle: compiledAdminTitle,
        adminContent: compiledAdminContent,
    });
}
