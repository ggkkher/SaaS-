interface Position {
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalNet: number;
}

interface OfferData {
  id: string;
  clientName: string;
  clientEmail?: string;
  positions: Position[];
  subtotalNet: number;
  taxAmount: number;
  totalGross: number;
  validUntil: string;
  companyName: string;
  companyLogo?: string;
  createdAt: string;
  amendmentNumber?: number;
  parentOfferId?: string;
}

export function generateOfferHTML(offer: OfferData): string {
  const validUntilDate = new Date(offer.validUntil).toLocaleDateString('de-DE');
  const createdAtDate = new Date(offer.createdAt).toLocaleDateString('de-DE');

  return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Angebot ${offer.id.substring(0, 8).toUpperCase()}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            color: #000;
            line-height: 1.6;
            padding: 40px;
            background: #fff;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 3px solid #2E7D32;
            padding-bottom: 20px;
        }
        .company-info {
            flex: 1;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1b5e20;
            margin-bottom: 10px;
        }
        .logo {
            max-width: 100px;
            height: auto;
            margin-bottom: 20px;
        }
        .offer-details {
            text-align: right;
        }
        .offer-title {
            font-size: 16px;
            font-weight: bold;
            color: #1b5e20;
            margin-bottom: 10px;
        }
        .amendment-badge {
            display: inline-block;
            background: #2E7D32;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            margin-bottom: 10px;
        }
        .detail-row {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        .customer-section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1b5e20;
            margin-bottom: 10px;
        }
        .customer-name {
            font-size: 13px;
            margin-bottom: 5px;
        }
        .customer-email {
            font-size: 12px;
            color: #666;
        }
        .positions-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .positions-table thead {
            background: #f5f5f5;
            border-top: 2px solid #2E7D32;
            border-bottom: 2px solid #2E7D32;
        }
        .positions-table th {
            padding: 12px;
            text-align: left;
            font-weight: bold;
            font-size: 12px;
            color: #2E7D32;
        }
        .positions-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            font-size: 12px;
        }
        .position-name {
            font-weight: bold;
            margin-bottom: 4px;
        }
        .position-description {
            font-size: 11px;
            color: #666;
        }
        .text-right {
            text-align: right;
        }
        .summary-section {
            margin: 30px 0;
            border-top: 2px solid #eee;
            padding-top: 15px;
        }
        .summary-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
            font-size: 13px;
        }
        .summary-label {
            width: 150px;
            text-align: right;
            padding-right: 20px;
        }
        .summary-value {
            width: 100px;
            text-align: right;
            font-weight: bold;
        }
        .summary-row.total {
            border-top: 2px solid #2E7D32;
            border-bottom: 2px solid #2E7D32;
            padding: 10px 0;
            font-size: 16px;
            color: #2E7D32;
        }
        .signature-section {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #ddd;
        }
        .signature-line {
            width: 250px;
            border-bottom: 1px solid #000;
            margin-bottom: 5px;
        }
        .signature-label {
            font-size: 12px;
            color: #666;
        }
        .signature-note {
            font-size: 11px;
            color: #666;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .signature-url {
            font-size: 11px;
            color: #2E7D32;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                ${
                  offer.companyLogo
                    ? `<img src="${offer.companyLogo}" alt="Logo" class="logo">`
                    : ''
                }
                <div class="company-name">${offer.companyName}</div>
            </div>
            <div class="offer-details">
                <div class="offer-title">Angebot #${offer.id
                  .substring(0, 8)
                  .toUpperCase()}</div>
                ${
                  offer.amendmentNumber && offer.parentOfferId
                    ? `
                    <div class="amendment-badge">
                        📋 ${offer.amendmentNumber}. Nachtrag zu #${offer.parentOfferId
                        .substring(0, 8)
                        .toUpperCase()}
                    </div>
                `
                    : ''
                }
                <div class="detail-row">Erstellt: ${createdAtDate}</div>
                <div class="detail-row">Gültig bis: ${validUntilDate}</div>
            </div>
        </div>

        <!-- Customer -->
        <div class="customer-section">
            <div class="section-title">Kunde:</div>
            <div class="customer-name">${offer.clientName}</div>
            ${offer.clientEmail ? `<div class="customer-email">${offer.clientEmail}</div>` : ''}
        </div>

        <!-- Positions Table -->
        <table class="positions-table">
            <thead>
                <tr>
                    <th>Position</th>
                    <th>Menge</th>
                    <th style="text-align: right;">Einheitspreis</th>
                    <th style="text-align: right;">Gesamt</th>
                </tr>
            </thead>
            <tbody>
                ${offer.positions
                  .map(
                    (position) => `
                    <tr>
                        <td>
                            <div class="position-name">${position.name}</div>
                            ${
                              position.description
                                ? `<div class="position-description">${position.description}</div>`
                                : ''
                            }
                        </td>
                        <td>${position.quantity} ${position.unit}</td>
                        <td class="text-right">€ ${position.unitPrice.toFixed(2)}</td>
                        <td class="text-right">€ ${position.totalNet.toFixed(2)}</td>
                    </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>

        <!-- Summary -->
        <div class="summary-section">
            <div class="summary-row">
                <div class="summary-label">Netto:</div>
                <div class="summary-value">€ ${offer.subtotalNet.toFixed(2)}</div>
            </div>
            <div class="summary-row">
                <div class="summary-label">MwSt (19%):</div>
                <div class="summary-value">€ ${offer.taxAmount.toFixed(2)}</div>
            </div>
            <div class="summary-row total">
                <div class="summary-label">Brutto:</div>
                <div class="summary-value">€ ${offer.totalGross.toFixed(2)}</div>
            </div>
        </div>

        <!-- Signature -->
        <div class="signature-section">
            <div style="margin-bottom: 30px;">
                <div class="signature-line"></div>
                <div class="signature-label">Kundensignatur</div>
            </div>

            <div class="signature-note">
                ✓ Hiermit akzeptiere ich das obige Angebot.
            </div>

            <div style="margin-bottom: 5px;">
                <strong>📱 Zum Unterschreiben online:</strong>
            </div>
            <div class="signature-url">
                ${process.env.NEXT_PUBLIC_APP_URL}/offers/${offer.id}/sign
            </div>
        </div>
    </div>
</body>
</html>
  `;
}
