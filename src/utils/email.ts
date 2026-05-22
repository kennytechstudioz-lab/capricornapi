import nodemailer from "nodemailer";
import { resolve4 } from "dns/promises";
import { EmailTemplate } from "../models/EmailTemplate";
import { User } from "../models/User";
import { buildEmailHtml } from "./emailLayout";
import { compileTemplate } from "./notifications";

// Lazily created and cached — resolved at first send so env vars and IPv4 DNS are ready
let _transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (_transporter) return _transporter;

  const rawHost = process.env.EMAIL_HOST || "smtp.hostinger.com";
  const port = parseInt(process.env.EMAIL_PORT || "465");
  const secure = port === 465;

  // resolve4() queries A records directly — cannot return IPv6, Railway-safe
  let host = rawHost;
  try {
    const addresses = await resolve4(rawHost);
    host = addresses[0];
    console.log(`[Email] Resolved ${rawHost} → ${host} (IPv4)`);
  } catch (err) {
    console.warn(`[Email] resolve4 failed for ${rawHost}, falling back to hostname:`, err);
  }

  _transporter = nodemailer.createTransport({
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
export async function sendTemplatedEmail(params: {
  username: string;
  templateName: string;
  variables: Record<string, any>;
  fallbackSubject: string;
  fallbackGreeting: string;
  fallbackContent: string;
}) {
  const { username, templateName, variables, fallbackSubject, fallbackGreeting, fallbackContent } = params;

  if (!process.env.EMAIL_PASS || !process.env.EMAIL_FROM_ADDRESS) {
    console.error(`[Email] SMTP credentials not configured — skipping "${templateName}" for "${username}"`);
    return;
  }

  try {
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

    const template = await EmailTemplate.findOne({ name: templateName });
    if (template) {
      subject = compileTemplate(template.title, allVars);
      greeting = compileTemplate(template.greeting, allVars);
      content = compileTemplate(template.content, allVars);
      bannerUrl = template.banner || undefined;
    }

    const html = buildEmailHtml({ title: subject, greeting, content, bannerUrl });
    const transporter = await getTransporter();

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
