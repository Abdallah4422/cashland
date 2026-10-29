// Cashland Phase 2 — Real OTP delivery via Termii
// Falls back to devCode (console log) when TERMII_API_KEY is not set.
// Set env vars to enable live SMS:
//   TERMII_API_KEY=your_key
//   TERMII_SENDER_ID=Cashland   (optional, defaults to N-Alert)

const TERMII_BASE = 'https://v3.api.termii.com';

interface TermiiSendResponse {
  message_id?: string;
  message?: string;
  balance?: number;
  user?: string;
  code?: number;
}

export async function sendSms(params: {
  phone: string;
  message: string;
}): Promise<{ sent: boolean; provider: 'termii' | 'dev'; messageId?: string }> {
  const apiKey = process.env.TERMII_API_KEY;

  if (!apiKey) {
    // Dev mode: log the OTP to the console, return it in devCode
    console.log(`[sms:dev] SMS to ${params.phone}: ${params.message}`);
    return { sent: true, provider: 'dev' };
  }

  // Normalise Nigerian phone number to international format
  const phone = normaliseNgPhone(params.phone);

  try {
    const res = await fetch(`${TERMII_BASE}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phone,
        from: process.env.TERMII_SENDER_ID ?? 'N-Alert',
        sms: params.message,
        type: 'plain',
        channel: 'generic',
        api_key: apiKey,
      }),
    });

    if (!res.ok) {
      console.error('[sms:termii] HTTP error:', res.status, await res.text());
      return { sent: false, provider: 'termii' };
    }

    const data = (await res.json()) as TermiiSendResponse;
    const messageId = data.message_id;
    console.log(`[sms:termii] Sent to ${phone}, id=${messageId}`);
    return { sent: true, provider: 'termii', messageId };
  } catch (e) {
    console.error('[sms:termii] Error:', e);
    return { sent: false, provider: 'termii' };
  }
}

function normaliseNgPhone(phone: string): string {
  // Strip spaces, dashes, brackets
  const cleaned = phone.replace(/[\s\-().]/g, '');
  // 0803... → 234803...
  if (cleaned.startsWith('0')) return '234' + cleaned.slice(1);
  // Already international
  if (cleaned.startsWith('234') || cleaned.startsWith('+234')) return cleaned.replace(/^\+/, '');
  return cleaned;
}
