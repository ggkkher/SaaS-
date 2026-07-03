import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOfferEmail(
  clientEmail: string,
  clientName: string,
  offerNumber: string,
  companyName: string,
  totalGross: number,
  signatureUrl: string,
  pdfUrl: string,
  portalUrl?: string
) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('test')) {
    console.log('Email would be sent to:', clientEmail);
    return { success: true, message: 'Demo mode - email not sent' };
  }

  try {
    const result = await resend.emails.send({
      from: `${companyName} <offers@resend.dev>`,
      to: clientEmail,
      subject: `Ihr Angebot #${offerNumber} von ${companyName}`,
      html: generateOfferEmailHTML(
        clientName,
        offerNumber,
        companyName,
        totalGross,
        signatureUrl,
        pdfUrl,
        portalUrl
      ),
    });

    return result;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

export async function sendSignatureConfirmationEmail(
  clientEmail: string,
  clientName: string,
  offerNumber: string,
  companyName: string
) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('test')) {
    console.log('Confirmation email would be sent to:', clientEmail);
    return { success: true, message: 'Demo mode - email not sent' };
  }

  try {
    const result = await resend.emails.send({
      from: `${companyName} <offers@resend.dev>`,
      to: clientEmail,
      subject: `Angebot #${offerNumber} unterzeichnet`,
      html: generateSignatureConfirmationEmailHTML(
        clientName,
        offerNumber,
        companyName
      ),
    });

    return result;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

function generateOfferEmailHTML(
  clientName: string,
  offerNumber: string,
  companyName: string,
  totalGross: number,
  signatureUrl: string,
  pdfUrl: string,
  portalUrl?: string
): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ihr Angebot</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f9fafb;
        }
        .email-content {
            background: white;
            border-radius: 8px;
            padding: 30px;
        }
        .header {
            border-bottom: 3px solid #2E7D32;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1b5e20;
            margin-bottom: 10px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #333;
        }
        .offer-details {
            background: #f0f7f0;
            border-left: 4px solid #2E7D32;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .offer-number {
            font-weight: bold;
            color: #1b5e20;
            font-size: 16px;
            margin-bottom: 5px;
        }
        .offer-total {
            font-size: 20px;
            font-weight: bold;
            color: #2E7D32;
            margin-top: 10px;
        }
        .action-buttons {
            margin: 30px 0;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            text-align: center;
        }
        .btn-primary {
            background: #2E7D32;
            color: white;
            flex: 1;
            min-width: 200px;
        }
        .btn-primary:hover {
            background: #1b5e20;
        }
        .btn-secondary {
            background: #f0f0f0;
            color: #333;
            flex: 1;
            min-width: 200px;
            border: 2px solid #ddd;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-content">
            <div class="header">
                <div class="company-name">🌿 ${companyName}</div>
            </div>

            <div class="greeting">
                Lieber ${clientName},
            </div>

            <p>
                vielen Dank für Ihre Anfrage! Anbei erhalten Sie Ihr Angebot mit allen Details und Positionen.
            </p>

            <div class="offer-details">
                <div class="offer-number">Angebot #${offerNumber}</div>
                <p style="margin: 10px 0; color: #666;">
                    Gültig für die nächsten 30 Tage
                </p>
                <div class="offer-total">
                    Gesamtbetrag: € ${totalGross.toFixed(2)}
                </div>
            </div>

            ${portalUrl ? `
            <table cellpadding="0" cellspacing="0" style="width:100%; margin: 30px 0;">
              <tr>
                <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 24px; border-radius: 8px; text-align: center;">
                  <h2 style="color: white; margin: 0 0 12px 0; font-size: 20px;">
                    🖊️ Online unterschreiben
                  </h2>
                  <p style="color: rgba(255,255,255,0.9); margin: 0 0 16px 0; font-size: 14px;">
                    Schnell & einfach: Angebot online ansehen und unterschreiben
                  </p>
                  <a href="${portalUrl}" style="display: inline-block; background: white; color: #059669; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">
                    Jetzt unterschreiben →
                  </a>
                  <p style="color: rgba(255,255,255,0.8); margin: 16px 0 0 0; font-size: 12px;">
                    Mit dem Handy scannen:
                  </p>
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(portalUrl)}" style="width: 120px; height: 120px; margin-top: 12px;">
                </td>
              </tr>
            </table>
            ` : ''}

            <p style="margin: 20px 0;">
                Sie können das Angebot jederzeit online unterzeichnen:
            </p>

            <div class="action-buttons">
                <a href="${signatureUrl}" class="btn btn-primary">Angebot unterschreiben</a>
                <a href="${pdfUrl}" class="btn btn-secondary">PDF herunterladen</a>
            </div>

            <p style="margin: 20px 0; color: #666; font-size: 14px;">
                Bei Fragen kontaktieren Sie uns gerne. Wir freuen uns auf Ihre Rückmeldung!
            </p>

            <div class="footer">
                <p>© ${new Date().getFullYear()} ${companyName}. Alle Rechte vorbehalten.</p>
                <p>Diese E-Mail wurde automatisch generiert und erfordert keine Antwort.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

function generateSignatureConfirmationEmailHTML(
  clientName: string,
  offerNumber: string,
  companyName: string
): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Angebot unterzeichnet</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f9fafb;
        }
        .email-content {
            background: white;
            border-radius: 8px;
            padding: 30px;
        }
        .success-badge {
            background: #d4edda;
            border: 2px solid #28a745;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .success-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .success-message {
            color: #155724;
            font-weight: bold;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-content">
            <h2 style="color: #1b5e20; margin-bottom: 30px;">Danke für Ihre Unterzeichnung!</h2>

            <div class="success-badge">
                <div class="success-icon">✅</div>
                <div class="success-message">
                    Angebot #${offerNumber} wurde erfolgreich unterzeichnet
                </div>
            </div>

            <p style="margin: 20px 0;">
                Lieber ${clientName},
            </p>

            <p style="margin: 20px 0;">
                Ihr unterzeichnetes Angebot wurde bestätigt. ${companyName} hat eine Kopie Ihrer Unterschrift erhalten.
            </p>

            <p style="margin: 20px 0; color: #666; font-size: 14px;">
                Die nächsten Schritte werden bald per E-Mail mitgeteilt.
            </p>

            <div style="background: #f0f7f0; border-left: 4px solid #2E7D32; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1b5e20; font-weight: bold;">
                    Angebot: #${offerNumber}
                </p>
            </div>

            <p style="margin: 20px 0; color: #666; font-size: 12px;">
                © ${new Date().getFullYear()} ${companyName}. Alle Rechte vorbehalten.
            </p>
        </div>
    </div>
</body>
</html>
  `;
}
