import type { VercelRequest, VercelResponse } from '@vercel/node';

function generatePassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 10; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

function buildWelcomeHtml(email: string, password: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0e0e;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#ef1219;border-radius:12px 12px 0 0;padding:20px;text-align:center;">
      <img src="https://www.arshtyres.com/assets/logo.jpg" alt="Arsh Autos" style="width:64px;height:64px;border-radius:10px;margin:0 auto 8px;display:block;" />
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">Arsh Autos</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:2px;">Your Account Is Ready</p>
    </div>

    <div style="background:#1a1c1c;border-radius:0 0 12px 12px;padding:28px;border:1px solid #2a2c2c;border-top:none;">
      <h2 style="color:#fff;margin:0 0 8px;font-size:18px;">Welcome to Arsh Autos!</h2>
      <p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 24px;">
        An account has been created for you so you can track your orders and bookings online.
      </p>

      <div style="background:#0d0e0e;border-radius:10px;padding:20px;margin-bottom:20px;border:1px solid #2a2c2c;">
        <p style="color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;font-weight:bold;">Your Login Details</p>
        <p style="color:#fff;font-size:15px;margin:0 0 8px;"><strong>Email:</strong> ${email}</p>
        <p style="color:#fff;font-size:15px;margin:0 0 16px;"><strong>Password:</strong> ${password}</p>
        <a href="https://www.arshtyres.com/" style="display:inline-block;background:#ef1219;color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:8px;">Go to My Account</a>
      </div>

      <div style="background:#0d0e0e;border-radius:10px;padding:16px;border:1px solid #2a2c2c;">
        <p style="color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-weight:bold;">Tip</p>
        <p style="color:#ccc;font-size:14px;margin:0;">You can change your password anytime from the Account tab after signing in.</p>
      </div>

      <p style="color:#666;font-size:12px;text-align:center;margin:24px 0 0;">
        Arsh Autos Auto Tyre Shop — 48 Harrow Road, London, HA1 2YF — 020 8427 1234
      </p>
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }

  const { email } = req.body as { email: string };

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const password = generatePassword();

  try {
    // Create user with service role key — no confirmation email sent by Supabase
    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
      }),
    });

    // If user already exists, that's fine — just send the email with a note
    if (!createRes.ok) {
      const errBody = await createRes.text();
      const alreadyExists = errBody.includes('already') || errBody.includes('registered') || createRes.status === 422;

      if (!alreadyExists) {
        console.error('Supabase admin create user error:', errBody);
        res.status(500).json({ error: 'Failed to create account' });
        return;
      }
    }

    // Send our own welcome email via Resend
    if (resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Arsh Autos <noreply@arshtyres.com>',
          to: [email],
          subject: 'Your Arsh Autos Account is Ready',
          html: buildWelcomeHtml(email, password),
        }),
      });
    }

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Create customer account error:', err);
    res.status(500).json({ error: err.message || 'Failed to create account' });
  }
}
