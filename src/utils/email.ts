import nodemailer from "nodemailer";
import { EmailTemplate } from "../models/EmailTemplate";
import { User } from "../models/User";
import Setting from "../models/Setting";
import { buildEmailHtml } from "./emailLayout";
import { compileTemplate } from "./notifications";
import { safeCaseInsensitiveRegex } from "./regex";

/**
 * Creates a Nodemailer transporter using Hostinger SMTP credentials from .env
 */
function createTransporter() {
  return nodemailer.createTransport({
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
async function getCompanyName(): Promise<string> {
  try {
    const setting = await Setting.findOne({});
    if (setting?.companyName) return setting.companyName;
  } catch (_) {}
  return process.env.EMAIL_FROM_NAME || "Capricorn Energy";
}

/**
 * Returns true if email sending should be suppressed.
 * Suppressed when:
 *   - SUPPRESS_EMAIL=true or BYPASS_EMAIL=true is set in .env
 *   - EMAIL_PASSWORD or EMAIL_FROM_ADDRESS is missing
 */
export function isEmailSuppressed(label: string): boolean {
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
export async function sendDirectEmail(params: {
  to: string;
  subject: string;
  greeting: string;
  content: string;
}) {
  const { to, subject, greeting, content } = params;

  if (isEmailSuppressed(`direct → ${to}`)) return;

  try {
    const companyName = await getCompanyName();
    const fromName = process.env.EMAIL_FROM_NAME || companyName;
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || "";

    // Replace {{companyName}} in subject, greeting, and content
    const vars = { companyName };
    const compiledSubject = compileTemplate(subject, vars);
    const compiledGreeting = compileTemplate(greeting, vars);
    const compiledContent = compileTemplate(content, vars);

    const html = buildEmailHtml({
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
  } catch (err: any) {
    console.error(`[Email] ✗ Failed to send direct email to "${to}":`, err?.message || err);
    // Suppress error so caller process (like user actions or schedulers) is never blocked
  }
}

export async function sendTemplatedEmail(params: {
  username: string;
  templateName: string;
  variables: Record<string, any>;
  fallbackSubject: string;
  fallbackGreeting: string;
  fallbackContent: string;
}) {
  const { username, templateName, variables, fallbackSubject, fallbackGreeting, fallbackContent } = params;

  if (isEmailSuppressed(`${templateName} → ${username}`)) return;

  try {
    const user = await User.findOne({
      $or: [
        { username: username.trim() },
        { username: { $regex: safeCaseInsensitiveRegex(username) } },
      ],
    });
    if (!user?.email) {
      console.warn(`[Email] No email found for username "${username}" — skipping ${templateName}`);
      return;
    }

    const companyName = await getCompanyName();
    const allVars = { username, companyName, ...variables };

    let subject = compileTemplate(fallbackSubject, allVars);
    let greeting = compileTemplate(fallbackGreeting, allVars);
    let content = compileTemplate(fallbackContent, allVars);
    let bannerUrl: string | undefined;

    const template = await EmailTemplate.findOne({ name: templateName });
    if (template) {
      subject = compileTemplate(template.title, allVars);
      greeting = compileTemplate(template.greeting, allVars);
      content = compileTemplate(template.content, allVars);
      bannerUrl = template.banner || undefined;
    }

    const html = buildEmailHtml({ title: subject, greeting, content, bannerUrl, companyName });
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
  } catch (err: any) {
    console.error(`[Email] ✗ Failed to send "${templateName}" for user "${username}":`, err?.message || err);
    // Never rethrow - email failures must never block wallet or deposit operations
  }
}
