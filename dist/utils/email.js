"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmailSuppressed = isEmailSuppressed;
exports.sendDirectEmail = sendDirectEmail;
exports.sendTemplatedEmail = sendTemplatedEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const EmailTemplate_1 = require("../models/EmailTemplate");
const User_1 = require("../models/User");
const Setting_1 = __importDefault(require("../models/Setting"));
const emailLayout_1 = require("./emailLayout");
const notifications_1 = require("./notifications");
/**
 * Creates a Nodemailer transporter using Hostinger SMTP credentials from .env
 */
function createTransporter() {
    return nodemailer_1.default.createTransport({
        host: process.env.EMAIL_HOST || "smtp.hostinger.com",
        port: Number(process.env.EMAIL_PORT) || 465,
        secure: true, // Port 465 always uses SSL
        auth: {
            user: process.env.EMAIL_FROM_ADDRESS,
            pass: process.env.EMAIL_PASSWORD,
        },
        // Set fail-fast network timeouts so expired/unreachable mailboxes never hang the API
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000,
    });
}
/**
 * Fetches the company name from the admin Settings document.
 * Falls back to EMAIL_FROM_NAME env var or "Capricorn Energy".
 */
async function getCompanyName() {
    try {
        const setting = await Setting_1.default.findOne({});
        if (setting?.companyName)
            return setting.companyName;
    }
    catch (_) { }
    return process.env.EMAIL_FROM_NAME || "Capricorn Energy";
}
/**
 * Returns true if email sending should be suppressed.
 * Suppressed when:
 *   - SUPPRESS_EMAIL=true or BYPASS_EMAIL=true is set in .env
 *   - EMAIL_PASSWORD or EMAIL_FROM_ADDRESS is missing
 */
function isEmailSuppressed(label) {
    if (process.env.SUPPRESS_EMAIL === "true" || process.env.BYPASS_EMAIL === "true") {
        console.log(`[Email:SUPPRESSED] "${label}" (SUPPRESS_EMAIL=true)`);
        return true;
    }
    if (!process.env.EMAIL_PASSWORD || !process.env.EMAIL_FROM_ADDRESS) {
        console.warn(`[Email] Email credentials not configured — skipping "${label}"`);
        return true;
    }
    return false;
}
/**
 * Sends an email directly to any address without requiring a registered user lookup.
 * Used for contact form inquiries and other outbound emails to arbitrary recipients.
 * Bypasses cleanly without throwing errors if email services are down.
 */
async function sendDirectEmail(params) {
    const { to, subject, greeting, content } = params;
    if (isEmailSuppressed(`direct → ${to}`))
        return;
    try {
        const companyName = await getCompanyName();
        const fromName = process.env.EMAIL_FROM_NAME || companyName;
        const fromAddress = process.env.EMAIL_FROM_ADDRESS || "";
        // Replace {{companyName}} in subject, greeting, and content
        const vars = { companyName };
        const compiledSubject = (0, notifications_1.compileTemplate)(subject, vars);
        const compiledGreeting = (0, notifications_1.compileTemplate)(greeting, vars);
        const compiledContent = (0, notifications_1.compileTemplate)(content, vars);
        const html = (0, emailLayout_1.buildEmailHtml)({
            title: compiledSubject,
            greeting: compiledGreeting,
            content: compiledContent,
            companyName,
        });
        const transporter = createTransporter();
        await transporter.sendMail({
            from: `"${fromName}" <${fromAddress}>`,
            to,
            subject: compiledSubject,
            html,
        });
        console.log(`[Email] ✓ Direct email sent to ${to} — subject: "${compiledSubject}"`);
    }
    catch (err) {
        console.error(`[Email] ✗ Failed to send direct email to "${to}":`, err?.message || err);
        // Suppress error so caller process (like user actions or schedulers) is never blocked
    }
}
async function sendTemplatedEmail(params) {
    const { username, templateName, variables, fallbackSubject, fallbackGreeting, fallbackContent } = params;
    if (isEmailSuppressed(`${templateName} → ${username}`))
        return;
    try {
        const user = await User_1.User.findOne({ username: { $regex: new RegExp("^" + username.trim() + "$", "i") } });
        if (!user?.email) {
            console.warn(`[Email] No email found for username "${username}" — skipping ${templateName}`);
            return;
        }
        const companyName = await getCompanyName();
        const allVars = { username, companyName, ...variables };
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
        const html = (0, emailLayout_1.buildEmailHtml)({ title: subject, greeting, content, bannerUrl, companyName });
        const fromName = process.env.EMAIL_FROM_NAME || companyName;
        const fromAddress = process.env.EMAIL_FROM_ADDRESS || "";
        const transporter = createTransporter();
        await transporter.sendMail({
            from: `"${fromName}" <${fromAddress}>`,
            to: user.email,
            subject,
            html,
        });
        console.log(`[Email] ✓ "${templateName}" sent to ${user.email}`);
    }
    catch (err) {
        console.error(`[Email] ✗ Failed to send "${templateName}" for user "${username}":`, err?.message || err);
        // Never rethrow - email failures must never block wallet or deposit operations
    }
}
