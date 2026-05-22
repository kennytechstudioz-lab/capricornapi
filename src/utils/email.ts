import { Resend } from "resend";
import { EmailTemplate } from "../models/EmailTemplate";
import { User } from "../models/User";
import { buildEmailHtml } from "./emailLayout";
import { compileTemplate } from "./notifications";

/**
 * Sends an email directly to any address without requiring a registered user lookup.
 * Used for contact form inquiries and other outbound emails to arbitrary recipients.
 */
export async function sendDirectEmail(params: {
  to: string;
  subject: string;
  greeting: string;
  content: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error("[Email] RESEND_API_KEY not configured — skipping direct email.");
    return;
  }

  const { to, subject, greeting, content } = params;
  const fromName = process.env.EMAIL_FROM_NAME || "Capricorn Energy";
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || "noreply@capricornenergyltd.online";

  const html = buildEmailHtml({ title: subject, greeting, content });
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

let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  _resend = new Resend(apiKey);
  return _resend;
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

  if (!process.env.RESEND_API_KEY) {
    console.error(`[Email] RESEND_API_KEY not configured — skipping "${templateName}" for "${username}"`);
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
  } catch (err) {
    console.error(`[Email] Failed to send "${templateName}" for user "${username}":`, err);
  }
}
