"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitContactForm = submitContactForm;
const email_1 = require("../utils/email");
const notifications_1 = require("../utils/notifications");
const Setting_1 = __importDefault(require("../models/Setting"));
async function submitContactForm(req, res) {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: "All fields (name, email, subject, message) are required." });
        }
        // Get company email from settings; fall back to env
        const setting = await Setting_1.default.findOne({});
        const companyEmail = setting?.email || process.env.EMAIL_FROM_ADDRESS || "";
        // 1. Email the company with the inquiry
        if (companyEmail) {
            const emailContent = `
        <p style="margin-bottom:12px;"><strong>Name:</strong> ${name}</p>
        <p style="margin-bottom:12px;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p style="margin-bottom:12px;"><strong>Subject:</strong> ${subject}</p>
        <hr style="border:none;border-top:1px solid #e8e8e8;margin:20px 0;" />
        <p style="margin-bottom:8px;"><strong>Message:</strong></p>
        <p style="white-space:pre-wrap;color:#3a3a3a;line-height:1.75;">${message}</p>
      `;
            await (0, email_1.sendDirectEmail)({
                to: companyEmail,
                subject: `New Contact Inquiry: ${subject}`,
                greeting: `You have received a new contact form inquiry from ${name}.`,
                content: emailContent,
            }).catch((err) => console.error("[Contact] Failed to send company email:", err));
        }
        // 2. Send real-time notification to admin dashboard
        await (0, notifications_1.sendNotification)({
            username: "admin",
            notificationName: "contact_inquiry",
            notificationTitle: `New Contact Inquiry from ${name}`,
            content: `${name} (${email}) submitted a contact form inquiry.\n\nSubject: ${subject}\n\nMessage: ${message}`,
            notifyAdmin: false, // username IS already "admin", no second copy needed
        });
        return res.status(200).json({
            success: true,
            message: "Your inquiry has been received. We will get back to you shortly.",
        });
    }
    catch (err) {
        console.error("[Contact] Error processing contact form:", err);
        return res.status(500).json({ error: "Failed to send your inquiry. Please try again." });
    }
}
