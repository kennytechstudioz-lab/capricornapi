"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTemplatedEmail = sendTemplatedEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const promises_1 = require("dns/promises");
const EmailTemplate_1 = require("../models/EmailTemplate");
const User_1 = require("../models/User");
const emailLayout_1 = require("./emailLayout");
const notifications_1 = require("./notifications");
// Lazily created and cached — resolved at first send so env vars and IPv4 DNS are ready
let _transporter = null;
async function getTransporter() {
    if (_transporter)
        return _transporter;
    const rawHost = process.env.EMAIL_HOST || "smtp.hostinger.com";
    const port = parseInt(process.env.EMAIL_PORT || "465");
    const secure = port === 465;
    // resolve4() queries A records directly — cannot return IPv6, Railway-safe
    let host = rawHost;
    try {
        const addresses = await (0, promises_1.resolve4)(rawHost);
        host = addresses[0];
        console.log(`[Email] Resolved ${rawHost} → ${host} (IPv4)`);
    }
    catch (err) {
        console.warn(`[Email] resolve4 failed for ${rawHost}, falling back to hostname:`, err);
    }
    _transporter = nodemailer_1.default.createTransport({
        host,
        port,
        secure,
        auth: {
            user: process.env.EMAIL_USER || process.env.EMAIL_FROM_ADDRESS,
            pass: process.env.EMAIL_PASS,
        },
    });
    return _transporter;
}
/**
 * Looks up a user's email by username, fetches the named email template,
 * compiles {{variables}}, builds the branded HTML layout, and sends the email.
 * Failures are caught and logged so they never break the calling request.
 */
async function sendTemplatedEmail(params) {
    const { username, templateName, variables, fallbackSubject, fallbackGreeting, fallbackContent } = params;
    if (!process.env.EMAIL_PASS || !process.env.EMAIL_FROM_ADDRESS) {
        console.error(`[Email] SMTP credentials not configured — skipping "${templateName}" for "${username}"`);
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
        const transporter = await getTransporter();
        await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || "Capricorn Energy"}" <${process.env.EMAIL_FROM_ADDRESS}>`,
            to: user.email,
            subject,
            html,
        });
        console.log(`[Email] "${templateName}" sent to ${user.email}`);
    }
    catch (err) {
        console.error(`[Email] Failed to send "${templateName}" for user "${username}":`, err);
    }
}
