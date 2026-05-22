"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDirectEmail = sendDirectEmail;
exports.sendTemplatedEmail = sendTemplatedEmail;
const resend_1 = require("resend");
const EmailTemplate_1 = require("../models/EmailTemplate");
const User_1 = require("../models/User");
const emailLayout_1 = require("./emailLayout");
const notifications_1 = require("./notifications");
/**
 * Sends an email directly to any address without requiring a registered user lookup.
 * Used for contact form inquiries and other outbound emails to arbitrary recipients.
 */
async function sendDirectEmail(params) {
    if (!process.env.RESEND_API_KEY) {
        console.error("[Email] RESEND_API_KEY not configured — skipping direct email.");
        return;
    }
    const { to, subject, greeting, content } = params;
    const fromName = process.env.EMAIL_FROM_NAME || "Capricorn Energy";
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || "noreply@capricornenergyltd.online";
    const html = (0, emailLayout_1.buildEmailHtml)({ title: subject, greeting, content });
    const resend = getResend();
    const { error } = await resend.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to,
        subject,
        html,
    });
    if (error) {
        console.error(`[Email] Resend rejected direct email to "${to}":`, error);
        throw new Error(error.message);
    }
    console.log(`[Email] Direct email sent to ${to} — subject: "${subject}"`);
}
let _resend = null;
function getResend() {
    if (_resend)
        return _resend;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey)
        throw new Error("RESEND_API_KEY is not set");
    _resend = new resend_1.Resend(apiKey);
    return _resend;
}
async function sendTemplatedEmail(params) {
    const { username, templateName, variables, fallbackSubject, fallbackGreeting, fallbackContent } = params;
    if (!process.env.RESEND_API_KEY) {
        console.error(`[Email] RESEND_API_KEY not configured — skipping "${templateName}" for "${username}"`);
        return;
    }
    try {
        const user = await User_1.User.findOne({ username: { $regex: new RegExp("^" + username.trim() + "$", "i") } });
        if (!user?.email) {
            console.warn(`[Email] No email found for username "${username}" — skipping ${templateName}`);
            return;
        }
        const allVars = { username, ...variables };
        let subject = (0, notifications_1.compileTemplate)(fallbackSubject, allVars);
        let greeting = (0, notifications_1.compileTemplate)(fallbackGreeting, allVars);
        let content = (0, notifications_1.compileTemplate)(fallbackContent, allVars);
        let bannerUrl;
        const template = await EmailTemplate_1.EmailTemplate.findOne({ name: templateName });
        if (template) {
            subject = (0, notifications_1.compileTemplate)(template.title, allVars);
            greeting = (0, notifications_1.compileTemplate)(template.greeting, allVars);
            content = (0, notifications_1.compileTemplate)(template.content, allVars);
            bannerUrl = template.banner || undefined;
        }
        const html = (0, emailLayout_1.buildEmailHtml)({ title: subject, greeting, content, bannerUrl });
        const fromName = process.env.EMAIL_FROM_NAME || "Capricorn Energy";
        const fromAddress = process.env.EMAIL_FROM_ADDRESS || "noreply@capricornenergyltd.online";
        const resend = getResend();
        const { error } = await resend.emails.send({
            from: `${fromName} <${fromAddress}>`,
            to: user.email,
            subject,
            html,
        });
        if (error) {
            console.error(`[Email] Resend rejected "${templateName}" for "${username}":`, error);
            return;
        }
        console.log(`[Email] "${templateName}" sent to ${user.email}`);
    }
    catch (err) {
        console.error(`[Email] Failed to send "${templateName}" for user "${username}":`, err);
    }
}
