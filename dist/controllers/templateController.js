"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationTemplate = createNotificationTemplate;
exports.getNotificationTemplates = getNotificationTemplates;
exports.updateNotificationTemplate = updateNotificationTemplate;
exports.deleteNotificationTemplate = deleteNotificationTemplate;
exports.createEmailTemplate = createEmailTemplate;
exports.getEmailTemplates = getEmailTemplates;
exports.updateEmailTemplate = updateEmailTemplate;
exports.deleteEmailTemplate = deleteEmailTemplate;
const NotificationTemplate_1 = require("../models/NotificationTemplate");
const EmailTemplate_1 = require("../models/EmailTemplate");
// ==========================================
// Notification Templates CRUD
// ==========================================
async function createNotificationTemplate(req, res) {
    try {
        const { name, title, content } = req.body;
        if (!name || !title || !content) {
            return res.status(400).json({ error: "Missing required fields (name, title, content)." });
        }
        const template = await NotificationTemplate_1.NotificationTemplate.create({
            name: name.trim(),
            title: title.trim(),
            content: content.trim(),
        });
        return res.status(201).json({ success: true, template });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "A template with this name already exists." });
        }
        console.error("✗ Error creating notification template:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}
async function getNotificationTemplates(req, res) {
    try {
        const templates = await NotificationTemplate_1.NotificationTemplate.find({}).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, templates });
    }
    catch (error) {
        console.error("✗ Error fetching notification templates:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}
async function updateNotificationTemplate(req, res) {
    try {
        const { id } = req.params;
        const { name, title, content } = req.body;
        const template = await NotificationTemplate_1.NotificationTemplate.findById(id);
        if (!template) {
            return res.status(404).json({ error: "Notification template not found." });
        }
        if (name !== undefined)
            template.name = name.trim();
        if (title !== undefined)
            template.title = title.trim();
        if (content !== undefined)
            template.content = content.trim();
        await template.save();
        return res.status(200).json({ success: true, template });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "A template with this name already exists." });
        }
        console.error("✗ Error updating notification template:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}
async function deleteNotificationTemplate(req, res) {
    try {
        const { id } = req.params;
        const template = await NotificationTemplate_1.NotificationTemplate.findByIdAndDelete(id);
        if (!template) {
            return res.status(404).json({ error: "Notification template not found." });
        }
        return res.status(200).json({ success: true, message: "Template deleted successfully." });
    }
    catch (error) {
        console.error("✗ Error deleting notification template:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}
// ==========================================
// Email Templates CRUD
// ==========================================
async function createEmailTemplate(req, res) {
    try {
        const { name, title, greeting, content, banner } = req.body;
        if (!name || !title || !content) {
            return res.status(400).json({ error: "Missing required fields (name, title, content)." });
        }
        const template = await EmailTemplate_1.EmailTemplate.create({
            name: name.trim(),
            title: title.trim(),
            greeting: (greeting || "Hi {{username}},").trim(),
            content: content.trim(),
            banner: (banner || "").trim(),
        });
        return res.status(201).json({ success: true, template });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "A template with this name already exists." });
        }
        console.error("✗ Error creating email template:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}
async function getEmailTemplates(req, res) {
    try {
        const templates = await EmailTemplate_1.EmailTemplate.find({}).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, templates });
    }
    catch (error) {
        console.error("✗ Error fetching email templates:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}
async function updateEmailTemplate(req, res) {
    try {
        const { id } = req.params;
        const { name, title, greeting, content, banner } = req.body;
        const template = await EmailTemplate_1.EmailTemplate.findById(id);
        if (!template) {
            return res.status(404).json({ error: "Email template not found." });
        }
        if (name !== undefined)
            template.name = name.trim();
        if (title !== undefined)
            template.title = title.trim();
        if (greeting !== undefined)
            template.greeting = greeting.trim();
        if (content !== undefined)
            template.content = content.trim();
        if (banner !== undefined)
            template.banner = (banner || "").trim();
        await template.save();
        return res.status(200).json({ success: true, template });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "A template with this name already exists." });
        }
        console.error("✗ Error updating email template:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}
async function deleteEmailTemplate(req, res) {
    try {
        const { id } = req.params;
        const template = await EmailTemplate_1.EmailTemplate.findByIdAndDelete(id);
        if (!template) {
            return res.status(404).json({ error: "Email template not found." });
        }
        return res.status(200).json({ success: true, message: "Template deleted successfully." });
    }
    catch (error) {
        console.error("✗ Error deleting email template:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}
