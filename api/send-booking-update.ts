import type { VercelRequest, VercelResponse } from '@vercel/node';

interface BookingUpdateEmailData {
  customerName: string;
  customerEmail: string;
  vehicleRegistration: string;
  vehicleMakeModel: string;
  date: string;
  timeSlot: string;
  status: 'Completed' | 'Cancelled';
}

function buildCompletedHtml(data: BookingUpdateEmailData): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0e0e;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#10b981;border-radius:12px 12px 0 0;padding:20px;text-align:center;">
      <img src="https://www.arshtyres.com/assets/logo.jpg" alt="Arsh Autos" style="width:64px;height:64px;border-radius:10px;margin:0 auto 8px;display:block;" />
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">Arsh Autos</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:2px;">Booking Completed</p>
    </div>

    <div style="background:#1a1c1c;border-radius:0 0 12px 12px;padding:28px;border:1px solid #2a2c2c;border-top:none;">
      <h2 style="color:#fff;margin:0 0 8px;font-size:18px;">Hi ${data.customerName},</h2>
      <p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Your tyre fitting has been completed. We hope you're happy with the service!
      </p>

      <div style="background:#0d0e0e;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #2a2c2c;">
        <p style="color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;font-weight:bold;">Booking Details</p>
        <p style="color:#fff;font-size:15px;margin:0 0 4px;"><strong>${data.vehicleMakeModel}</strong></p>
        <p style="color:#aaa;font-size:14px;margin:0 0 8px;">Reg: ${data.vehicleRegistration}</p>
        <p style="color:#aaa;font-size:14px;margin:0;">Date: ${data.date} at ${data.timeSlot}</p>
      </div>

      <div style="background:#0d0e0e;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #2a2c2c;">
        <p style="color:#10b981;font-size:14px;margin:0;font-weight:bold;">✓ Your booking is now marked as completed.</p>
      </div>

      <div style="background:#0d0e0e;border-radius:10px;padding:16px;border:1px solid #2a2c2c;">
        <p style="color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-weight:bold;">Any questions?</p>
        <p style="color:#ccc;font-size:14px;margin:0 0 4px;">Call us: <a href="tel:02084271234" style="color:#ef1219;text-decoration:none;font-weight:bold;">020 8427 1234</a></p>
        <p style="color:#ccc;font-size:14px;margin:0;">5 Rowan Rd, London, SW16 5JF</p>
      </div>

      <p style="color:#666;font-size:12px;text-align:center;margin:24px 0 0;">
        Thank you for choosing Arsh Autos — Professional fitting & alignment guaranteed.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildCancelledHtml(data: BookingUpdateEmailData): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0e0e;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#ef1219;border-radius:12px 12px 0 0;padding:20px;text-align:center;">
      <img src="https://www.arshtyres.com/assets/logo.jpg" alt="Arsh Autos" style="width:64px;height:64px;border-radius:10px;margin:0 auto 8px;display:block;" />
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">Arsh Autos</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:2px;">Booking Cancelled</p>
    </div>

    <div style="background:#1a1c1c;border-radius:0 0 12px 12px;padding:28px;border:1px solid #2a2c2c;border-top:none;">
      <h2 style="color:#fff;margin:0 0 8px;font-size:18px;">Hi ${data.customerName},</h2>
      <p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Your tyre fitting booking has been cancelled. If you believe this is an error, please contact us.
      </p>

      <div style="background:#0d0e0e;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #2a2c2c;">
        <p style="color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;font-weight:bold;">Booking Details</p>
        <p style="color:#fff;font-size:15px;margin:0 0 4px;"><strong>${data.vehicleMakeModel}</strong></p>
        <p style="color:#aaa;font-size:14px;margin:0 0 8px;">Reg: ${data.vehicleRegistration}</p>
        <p style="color:#aaa;font-size:14px;margin:0;">Date: ${data.date} at ${data.timeSlot}</p>
      </div>

      <div style="background:#0d0e0e;border-radius:10px;padding:16px;border:1px solid #2a2c2c;">
        <p style="color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-weight:bold;">Need to rebook?</p>
        <p style="color:#ccc;font-size:14px;margin:0 0 4px;">Call us: <a href="tel:02084271234" style="color:#ef1219;text-decoration:none;font-weight:bold;">020 8427 1234</a></p>
        <p style="color:#ccc;font-size:14px;margin:0;">5 Rowan Rd, London, SW16 5JF</p>
      </div>

      <p style="color:#666;font-size:12px;text-align:center;margin:24px 0 0;">
        Arsh Autos Auto Tyre Shop — Professional fitting & alignment guaranteed.
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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'RESEND_API_KEY not configured' });
    return;
  }

  try {
    const data: BookingUpdateEmailData = req.body;

    const subject = data.status === 'Completed'
      ? 'Booking Completed — Arsh Autos Tyre Fitting'
      : 'Booking Cancelled — Arsh Autos Tyre Fitting';

    const html = data.status === 'Completed'
      ? buildCompletedHtml(data)
      : buildCancelledHtml(data);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Arsh Autos <bookings@arshtyres.com>',
        to: [data.customerEmail],
        subject,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      console.error('Resend API error:', errText);
      res.status(500).json({ error: 'Failed to send email', detail: errText });
      return;
    }

    const result = await emailResponse.json();
    res.status(200).json({ success: true, id: result.id });
  } catch (err: any) {
    console.error('Send booking update error:', err);
    res.status(500).json({ error: err.message || 'Failed to send booking update email' });
  }
}
