import nodemailer from "nodemailer";
import { EmailTemplate } from "../models/EmailTemplate";
import { User } from "../models/User";
import { buildEmailHtml } from "./emailLayout";
import { compileTemplate } from "./notifications";

import SMTPTransport from "nodemailer/lib/smtp-transport";

const transportOptions: SMTPTransport.Options = {
  host: process.env.EMAIL_HOST || "smtp.hostinger.com",
  port: parseInt(process.env.EMAIL_PORT || "465"),
  secure: parseInt(process.env.EMAIL_PORT || "465") === 465,
  auth: {
    user: process.env.EMAIL_FROM_ADDRESS,
    pass: process.env.EMAIL_PASS,
  },
};

const transporter = nodemailer.createTransport(transportOptions);

/**
 * Looks up a user's email by username, fetches the named email template,
 * compiles {{variables}}, builds the branded HTML layout, and sends the email.
 * Failures are caught and logged so they never break the calling request.
 */
export async function sendTemplatedEmail(params: {
  username: string;
  templateName: string;
  variables: Record<string, any>;
  fallbackSubject: string;
  fallbackGreeting: string;
  fallbackContent: string;
}) {
  const { username, templateName, variables, fallbackSubject, fallbackGreeting, fallbackContent } = params;

  if (!process.env.EMAIL_FROM_ADDRESS || !process.env.EMAIL_PASS) {
    console.error(`[Email] SMTP credentials not configured (EMAIL_FROM_ADDRESS / EMAIL_PASS missing) — skipping "${templateName}" for "${username}"`);
    return;
  }

  try {
    // Resolve recipient email from username
    const user = await User.findOne({ username: { $regex: new RegExp("^" + username.trim() + "$", "i") } });
    if (!user?.email) {
      console.warn(`[Email] No email found for username "${username}" — skipping ${templateName}`);
      return;
    }

    const allVars = { username, ...variables };

    let subject = compileTemplate(fallbackSubject, allVars);
    let greeting = compileTemplate(fallbackGreeting, allVars);
    let content = compileTemplate(fallbackContent, allVars);
    let bannerUrl: string | undefined;

    // Override with DB template if it exists
    const template = await EmailTemplate.findOne({ name: templateName });
    if (template) {
      subject = compileTemplate(template.title, allVars);
      greeting = compileTemplate(template.greeting, allVars);
      content = compileTemplate(template.content, allVars);
      bannerUrl = template.banner || undefined;
    }

    const html = buildEmailHtml({ title: subject, greeting, content, bannerUrl });

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "Capricorn Energy"}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: user.email,
      subject,
      html,
    });

    console.log(`[Email] "${templateName}" sent to ${user.email}`);
  } catch (err) {
    console.error(`[Email] Failed to send "${templateName}" for user "${username}":`, err);
  }
}
