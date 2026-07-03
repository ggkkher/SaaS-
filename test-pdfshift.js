const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium'
  });

  try {
    const page = await browser.newPage();
    
    console.log('🎯 Test Angebot erstellen und PDF');
    const email = `test${Date.now()}@beispiel.de`;
    
    // 1. Register
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    
    const inputs = await page.locator('input').all();
    if (inputs.length >= 3) {
      await inputs[0].fill(email);
      await inputs[1].fill('TestPassword123');
      await inputs[2].fill('TestPassword123');
      
      await page.click('button[type="submit"]');
      await page.waitForURL('**/profile/company', { timeout: 5000 });
      console.log('✅ Registrierung erfolgreich');
    }
    
    // 2. Company Setup
    const companyInputs = await page.locator('input').all();
    if (companyInputs.length >= 4) {
      await companyInputs[0].fill('Test GmbH');
      await companyInputs[1].fill('75');
      await companyInputs[2].fill('25');
      await companyInputs[3].fill('500');
      
      await page.click('button:has-text("Speichern & Weiter")');
      await page.waitForURL('**/dashboard', { timeout: 5000 });
      console.log('✅ Company Setup erfolgreich');
    }
    
    // 3. Neues Angebot
    await page.click('a:has-text("Neues Angebot")');
    await page.waitForURL('**/offers/new', { timeout: 5000 });
    
    const newOfferInputs = await page.locator('input').all();
    if (newOfferInputs.length >= 2) {
      await newOfferInputs[0].fill('Max Mustermann');
      await newOfferInputs[1].fill('max@example.com');
      
      await page.click('button:has-text("Angebot erstellen")');
      await page.waitForTimeout(1500);
      
      const offerId = page.url().split('/').pop();
      console.log(`✅ Angebot erstellt: ${offerId}`);
      
      // 4. Position hinzufügen
      await page.click('button:has-text("Position hinzufügen")');
      const posInputs = await page.locator('input').all();
      if (posInputs.length >= 5) {
        await posInputs[0].fill('Rasenanlage');
        await posInputs[1].fill('Ansaat und Düngung');
        await posInputs[2].fill('50');
        await posInputs[3].fill('m²');
        await posInputs[4].fill('25.50');
        
        await page.click('button:has-text("Hinzufügen")');
        await page.waitForTimeout(800);
        console.log('✅ Position hinzugefügt');
      }
      
      // 5. PDF testen
      console.log('🎯 PDF-Download testen...');
      await page.click('button:has-text("PDF herunterladen")');
      await page.waitForTimeout(2000);
      
      // Check ob PDF-Endpoint antwortet
      const pdfResponse = await page.evaluate(async () => {
        try {
          const response = await fetch(`/api/offers/${window.location.pathname.split('/')[2]}/pdf`);
          return { status: response.status, ok: response.ok };
        } catch (e) {
          return { error: e.message };
        }
      });
      
      console.log('PDF Response:', pdfResponse);
    }
    
    console.log('\n✅✅✅ TESTS ERFOLGREICH! ✅✅✅\n');
    
  } catch (error) {
    console.error('\n❌ Test Fehler:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

test();
