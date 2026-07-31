import type { VercelRequest, VercelResponse } from '@vercel/node';

interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleRegistration: string;
  vehicleMakeModel: string;
  fittingType: string;
  date: string;
  timeSlot: string;
  totalPrice: number;
  cartItems: { tyre: { brand: string; model: string; width: number; profile: number; rim: number }; quantity: number; unitPrice: number }[];
}

function buildEmailHtml(data: BookingEmailData): string {
  const tyreRows = data.cartItems.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #333;">
        ${item.tyre.brand} ${item.tyre.model}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;color:#aaa;">
        ${item.tyre.width}/${item.tyre.profile} R${item.tyre.rim}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;text-align:center;">
        ${item.quantity}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;text-align:right;">
        £${(item.unitPrice * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const fittingInfo = data.fittingType === 'collection'
    ? '<p style="color:#aaa;font-size:14px;">Collection from our shop — we\'ll call you when your tyres are ready.</p>'
    : `<p style="color:#aaa;font-size:14px;">
         <strong>Date:</strong> ${data.date}<br/>
         <strong>Time slot:</strong> ${data.timeSlot}
       </p>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0e0e;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <!-- Logo header -->
    <div style="background:#ef1219;border-radius:12px 12px 0 0;padding:20px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">Arsh Autos</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:2px;">Booking Confirmed</p>
    </div>

    <!-- Body -->
    <div style="background:#1a1c1c;border-radius:0 0 12px 12px;padding:28px;border:1px solid #2a2c2c;border-top:none;">
      <h2 style="color:#fff;margin:0 0 8px;font-size:18px;">Hi ${data.customerName},</h2>
      <p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Your tyre fitting booking is confirmed. Here are your details:
      </p>

      <!-- Booking details -->
      <div style="background:#0d0e0e;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #2a2c2c;">
        <p style="color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;font-weight:bold;">Vehicle</p>
        <p style="color:#fff;font-size:15px;margin:0 0 4px;"><strong>${data.vehicleMakeModel}</strong></p>
        <p style="color:#aaa;font-size:14px;margin:0;">Reg: ${data.vehicleRegistration}</p>
      </div>

      <div style="background:#0d0e0e;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #2a2c2c;">
        <p style="color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;font-weight:bold;">Fitting</p>
        ${fittingInfo}
      </div>

      <!-- Tyre table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;">
        <thead>
          <tr style="border-bottom:2px solid #333;">
            <th style="padding:8px 12px;text-align:left;color:#aaa;font-size:12px;text-transform:uppercase;">Tyre</th>
            <th style="padding:8px 12px;text-align:left;color:#aaa;font-size:12px;text-transform:uppercase;">Size</th>
            <th style="padding:8px 12px;text-align:center;color:#aaa;font-size:12px;text-transform:uppercase;">Qty</th>
            <th style="padding:8px 12px;text-align:right;color:#aaa;font-size:12px;text-transform:uppercase;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${tyreRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:12px;text-align:right;color:#fff;font-weight:bold;font-size:16px;">Total</td>
            <td style="padding:12px;text-align:right;color:#ef1219;font-weight:bold;font-size:18px;">£${data.totalPrice.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Contact -->
      <div style="background:#0d0e0e;border-radius:10px;padding:16px;border:1px solid #2a2c2c;">
        <p style="color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-weight:bold;">Need to change anything?</p>
        <p style="color:#ccc;font-size:14px;margin:0 0 4px;">Call us: <a href="tel:02084271234" style="color:#ef1219;text-decoration:none;font-weight:bold;">020 8427 1234</a></p>
        <p style="color:#ccc;font-size:14px;margin:0;">48 Harrow Road, London, HA1 2YF</p>
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
    const data: BookingEmailData = req.body;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Arsh Autos <noreply@arshautos.co.uk>',
        to: [data.customerEmail],
        subject: 'Booking Confirmed — Arsh Autos Tyre Fitting',
        html: buildEmailHtml(data),
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      console.error('Resend API error:', errText);
      res.status(500).json({ error: 'Failed to send email' });
      return;
    }

    const result = await emailResponse.json();
    res.status(200).json({ success: true, id: result.id });
  } catch (err: any) {
    console.error('Send confirmation error:', err);
    res.status(500).json({ error: err.message || 'Failed to send confirmation email' });
  }
}
