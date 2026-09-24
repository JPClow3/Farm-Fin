/**
 * Which login methods are available, based on server configuration.
 * Server-only: reads secrets from the environment. The login page receives
 * only the resulting booleans.
 */

export interface EnabledAuthMethods {
  /** Magic Link por e-mail (requires RESEND_API_KEY + AUTH_EMAIL_FROM) */
  magicLink: boolean;
  google: boolean;
  microsoft: boolean;
}

export function getEnabledAuthMethods(): EnabledAuthMethods {
  return {
    magicLink: Boolean(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM),
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    microsoft: Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
  };
}

/** Sends the Magic Link e-mail through the Resend REST API. */
export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error('Envio de e-mail não configurado (RESEND_API_KEY / AUTH_EMAIL_FROM).');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Seu link de acesso ao Farm-Fin',
      text: `Olá!\n\nUse o link abaixo para entrar no Farm-Fin. Ele vale por 5 minutos e só pode ser usado uma vez:\n\n${url}\n\nSe você não pediu este acesso, ignore este e-mail.`,
      html: `<p>Olá!</p><p>Use o botão abaixo para entrar no Farm-Fin. O link vale por 5 minutos e só pode ser usado uma vez.</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#5f7d52;color:#ffffff;border-radius:12px;text-decoration:none;font-weight:600">Entrar no Farm-Fin</a></p><p style="color:#786a5c;font-size:13px">Se você não pediu este acesso, ignore este e-mail.</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao enviar o e-mail de acesso (Resend ${response.status}).`);
  }
}
