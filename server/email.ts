import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || "EDURATE <noreply@edurate.app>";
const APP_URL = process.env.APP_URL || "http://localhost:5000";

const isConfigured = !!(SMTP_USER && SMTP_PASS);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

async function sendEmail(to: string, subject: string, html: string) {
  if (!transporter) {
    console.log(`\n[EMAIL] (SMTP not configured — logging to console)`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html.replace(/<[^>]*>/g, "")}`);
    console.log();
    return;
  }
  await transporter.sendMail({ from: EMAIL_FROM, to, subject, html });
}

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const link = `${APP_URL}/verify-email/${token}`;
  await sendEmail(
    email,
    "Verify your EDURATE email",
    `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Welcome to EDURATE, ${name}!</h2>
        <p>Thanks for signing up. Please verify your email address by clicking the button below.</p>
        <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
          Verify Email
        </a>
        <p style="color:#888;font-size:13px;">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
        <p style="color:#888;font-size:12px;">Or copy this link: ${link}</p>
      </div>
    `
  );
}

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  const link = `${APP_URL}/reset-password/${token}`;
  await sendEmail(
    email,
    "Reset your EDURATE password",
    `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Password Reset Request</h2>
        <p>Hi ${name}, we received a request to reset your password.</p>
        <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
        <p style="color:#888;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email — your password won't change.</p>
        <p style="color:#888;font-size:12px;">Or copy this link: ${link}</p>
      </div>
    `
  );
}
