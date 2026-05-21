"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTemplatedEmail = sendTemplatedEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const EmailTemplate_1 = require("../models/EmailTemplate");
const User_1 = require("../models/User");
const emailLayout_1 = require("./emailLayout");
const notifications_1 = require("./notifications");
const transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST || "smtp.hostinger.com",
    port: parseInt(process.env.EMAIL_PORT || "465"),
    secure: parseInt(process.env.EMAIL_PORT || "465") === 465,
    auth: {
        user: process.env.EMAIL_FROM_ADDRESS,
        pass: process.env.EMAIL_PASS,
    },
});
/**
 * Looks up a user's email by username, fetches the named email template,
 * compiles {{variables}}, builds the branded HTML layout, and sends the email.
 * Failures are caught and logged so they never break the calling request.
 */
async function sendTemplatedEmail(params) {
    const { username, templateName, variables, fallbackSubject, fallbackGreeting, fallbackContent } = params;
    try {
        // Resolve recipient email from username
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
        // Override with DB template if it exists
        const template = await EmailTemplate_1.EmailTemplate.findOne({ name: templateName });
        if (template) {
            subject = (0, notifications_1.compileTemplate)(template.title, allVars);
            greeting = (0, notifications_1.compileTemplate)(template.greeting, allVars);
            content = (0, notifications_1.compileTemplate)(template.content, allVars);
            bannerUrl = template.banner || undefined;
        }
        const html = (0, emailLayout_1.buildEmailHtml)({ title: subject, greeting, content, bannerUrl });
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
