export const runtime = "nodejs";
import { NextResponse } from "next/server";

// ---- Rate limiting (module scope) ----
const RATE_LIMIT_WINDOW_MS = (Number(process.env.RATE_LIMIT_WINDOW_SECONDS) || 60) * 1000; // default 60s
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 5; // default 5 reqs per window
const rateMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = rateMap.get(ip) || [];
  const recent = arr.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateMap.set(ip, recent);
    return true;
  }
  recent.push(now);
  rateMap.set(ip, recent);
  return false;
}

type Attachment = { filename: string; content: string } | null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, comments, attachment, recaptchaToken } = body as {
      name?: string;
      email?: string;
      comments?: string;
      attachment?: Attachment;
      recaptchaToken?: string;
    };

    if (!email || !comments) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    // Rate limit per IP before any external calls
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "").split(",")[0].trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ success: false, error: "rate_limit" }, { status: 429 });
    }

    const to = "paul@krupaul.com";

    // Verify reCAPTCHA if configured
    const recaptchaSecret = process.env.RECAPTCHA_SECRET;
    if (recaptchaSecret) {
      const valid = await verifyRecaptcha(recaptchaSecret, recaptchaToken);
      if (!valid) {
        return NextResponse.json({ success: false, error: "recaptcha" }, { status: 400 });
      }
    }

    const sent = await sendEmail({
      to,
      subject: `[Feedback] ${name || "Anonymous"}`,
      html: renderHtml({ name, email, comments }),
      attachments: attachment ? [attachment] : [],
    });

    if (!sent) {
      return NextResponse.json({ success: false, error: "Email service not configured" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Unexpected error" }, { status: 500 });
  }
}

function renderHtml({ name, email, comments }: { name?: string; email?: string; comments?: string }) {
  return `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif;">
      <h2 style="margin:0 0 8px;">New Feedback</h2>
      <p style="margin:0 0 8px;">From: <strong>${name || "Anonymous"}</strong> (${email || "no email provided"})</p>
      <div style="white-space: pre-wrap; border: 1px solid #e5e7eb; padding: 10px; border-radius: 8px;">${escapeHtml(comments || "")}</div>
    </div>
  `;
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments: Array<{ filename: string; content: string }>;
}): Promise<boolean> {
  // Prefer Resend if configured
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "no-reply@krupaul.com";
  if (resendKey) {
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to, from, subject, html, attachments }),
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  // Fallback to SMTP via Nodemailer if available
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && port && user && pass) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      await transporter.sendMail({
        to,
        from,
        subject,
        html,
        attachments: attachments.map(a => ({ filename: a.filename, content: Buffer.from(a.content, "base64") })),
      });
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

async function verifyRecaptcha(secret: string, token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);
    const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    if (!resp.ok) return false;
    const data = await resp.json();
    return !!data.success;
  } catch {
    return false;
  }
}