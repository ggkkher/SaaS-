import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

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
}

export async function generateOfferPDF(offer: OfferData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      // Header mit Logo
      let y = 50;

      if (offer.companyLogo) {
        try {
          doc.image(offer.companyLogo, 50, y, { width: 80, height: 80 });
          y += 100;
        } catch (err) {
          console.log('Logo could not be loaded');
        }
      }

      // Firmenname und Angebots-Info
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(offer.companyName, 50, y);

      y += 25;
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Angebot #${offer.id.substring(0, 8).toUpperCase()}`, 50, y);

      y += 5;
      doc.fontSize(9).fillColor('#666666');
      doc.text(
        `Erstellt: ${new Date(offer.createdAt).toLocaleDateString('de-DE')}`,
        50,
        y
      );

      y += 5;
      doc.text(
        `Gültig bis: ${new Date(offer.validUntil).toLocaleDateString('de-DE')}`,
        50,
        y
      );

      // Kundendaten
      y += 30;
      doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold');
      doc.text('Kunde:', 50, y);

      y += 15;
      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      doc.text(offer.clientName, 50, y);

      if (offer.clientEmail) {
        y += 12;
        doc.text(offer.clientEmail, 50, y);
      }

      // Positions Table
      y += 30;
      const tableTop = y;
      const col1 = 50;
      const col2 = 320;
      const col3 = 410;
      const col4 = 480;

      // Header
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#2E7D32')
        .text('Position', col1, y);
      doc.text('Menge', col2, y);
      doc.text('Einheitspreis', col3, y);
      doc.text('Gesamt', col4, y);

      y += 15;
      doc.moveTo(50, y).lineTo(550, y).stroke('#cccccc');

      y += 10;

      // Positions
      doc.font('Helvetica').fontSize(9).fillColor('#000000');

      offer.positions.forEach((position, index) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc.text(position.name, col1, y, { width: 250 });

        if (position.description) {
          const descY = y + 12;
          doc.fontSize(8).fillColor('#666666');
          doc.text(position.description, col1, descY, {
            width: 250,
          });
          doc.fontSize(9).fillColor('#000000');
          y = descY + 15;
        } else {
          y += 15;
        }

        doc.text(
          `${position.quantity} ${position.unit}`,
          col2,
          y - 15
        );
        doc.text(
          `€ ${position.unitPrice.toFixed(2)}`,
          col3,
          y - 15
        );
        doc.text(
          `€ ${position.totalNet.toFixed(2)}`,
          col4,
          y - 15,
          { align: 'right' }
        );
      });

      // Zusammenfassung
      y += 20;
      doc.moveTo(50, y).lineTo(550, y).stroke('#cccccc');

      y += 15;
      const summaryCol = 380;

      doc.fontSize(10).font('Helvetica');
      doc.text('Netto:', summaryCol, y);
      doc.text(`€ ${offer.subtotalNet.toFixed(2)}`, 480, y, {
        align: 'right',
      });

      y += 12;
      doc.text('MwSt (19%):', summaryCol, y);
      doc.text(`€ ${offer.taxAmount.toFixed(2)}`, 480, y, {
        align: 'right',
      });

      y += 15;
      doc.moveTo(380, y).lineTo(550, y).stroke('#2E7D32');

      y += 5;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#2E7D32');
      doc.text('Brutto:', summaryCol, y);
      doc.text(`€ ${offer.totalGross.toFixed(2)}`, 480, y, {
        align: 'right',
      });

      // Unterschriftszeile
      y += 50;
      doc.fillColor('#000000').fontSize(10).font('Helvetica');
      doc.text('Kundensignatur: _________________________', 50, y);

      y += 30;
      doc.fontSize(8).fillColor('#666666');
      doc.text('Hiermit akzeptiere ich das obige Angebot.', 50, y);

      // QR Code für Signatur-Verifizierung
      const qrCodeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/offers/${offer.id}/sign`;

      try {
        const qrDataUrl = await QRCode.toDataURL(qrCodeUrl, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 100,
        });

        doc.image(qrDataUrl, 50, 700, { width: 60, height: 60 });
        doc.fontSize(8).text('QR-Code zum Unterschreiben scannen', 50, 765);
      } catch (qrErr) {
        console.log('QR code generation skipped');
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
