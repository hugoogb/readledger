import { OTP_TTL_MS } from "@/lib/auth/otp";
import { logger } from "@/lib/logger";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

function otpEmail(code: string) {
  const minutes = OTP_TTL_MS / 60_000;
  // Code first in the subject so it is readable from the phone notification.
  const subject = `${code} is your ReadLedger code`;
  const text = [
    `Your ReadLedger sign-in code is: ${code}`,
    "",
    `It expires in ${minutes} minutes.`,
    "",
    "If you didn't request this, you can safely ignore this email.",
  ].join("\n");
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
      <tr><td>
        <p style="margin:0 0 8px;font-size:18px;font-weight:600">Sign in to ReadLedger</p>
        <p style="margin:0 0 24px;font-size:14px;color:#52525b">Enter this code to continue:</p>
        <p style="margin:0 0 24px;font-size:32px;font-weight:700;letter-spacing:8px;font-family:ui-monospace,Menlo,monospace">${code}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#71717a">It expires in ${minutes} minutes.</p>
        <p style="margin:0;font-size:13px;color:#71717a">If you didn't request this, you can safely ignore this email.</p>
      </td></tr>
    </table>
  </body>
</html>`;
  return { subject, text, html };
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      // Local development without an email provider: surface the code in logs.
      logger.info("OTP email (dev, not sent)", { to, code });
      return;
    }
    throw new Error("BREVO_API_KEY is not set");
  }

  const { subject, text, html } = otpEmail(code);
  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: process.env.EMAIL_FROM_NAME || "ReadLedger",
        email: process.env.EMAIL_FROM,
      },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Brevo responded ${response.status}: ${body.slice(0, 300)}`);
  }

  // The message ID is what Brevo's logs are searchable by; without this a
  // successful send leaves no trace on our side.
  const { messageId } = (await response.json().catch(() => ({}))) as {
    messageId?: string;
  };
  logger.info("OTP email accepted by Brevo", { messageId });
}
