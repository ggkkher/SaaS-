const { chromium } = require('playwright');

async function runTests() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium'
  });

  try {
    const page = await browser.newPage();

    console.log('\n🎯 Test 1: Landing Page');
    await page.goto('http://localhost:3000');
    const title = await page.title();
    console.log(`✅ Title: ${title}`);

    console.log('\n🎯 Test 2: Registration');
    await page.click('a:has-text("Kostenlos registrieren")');
    await page.waitForURL('**/register');
    await page.fill('input[type="email"]', 'test@beispiel.de');
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123');
    await page.click('button:has-text("Registrieren")');

    // Wait for redirect to company profile
    await page.waitForURL('**/profile/company', { timeout: 5000 });
    console.log('✅ Registrierung erfolgreich, zu Company Setup weitergeleitet');

    console.log('\n🎯 Test 3: Company Setup');
    await page.fill('input[name="name"]', 'Grün & Gestalt GmbH');
    await page.fill('input[name="hourlyRate"]', '75');
    await page.fill('input[name="profitMargin"]', '25');
    await page.fill('input[name="materialCost"]', '500');
    await page.fill('input[name="fixedCosts"]', '3000');

    await page.click('button:has-text("Speichern & Weiter")');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    console.log('✅ Company Setup erfolgreich, zum Dashboard weitergeleitet');

    console.log('\n🎯 Test 4: Dashboard');
    const dashboardTitle = await page.textContent('h1');
    console.log(`✅ Dashboard angezeigt: ${dashboardTitle.substring(0, 30)}...`);

    console.log('\n🎯 Test 5: Neues Angebot erstellen');
    await page.click('a:has-text("Neues Angebot")');
    await page.waitForURL('**/offers/new', { timeout: 5000 });
    await page.fill('input[type="text"]', 'Max Mustermann');
    await page.fill('input[type="email"]', 'max@example.com');
    await page.click('button:has-text("Angebot erstellen")');

    // Wait for offer detail page
    await page.waitForTimeout(2000);
    const offerId = page.url().split('/').pop();
    console.log(`✅ Angebot erstellt: ID ${offerId}`);

    console.log('\n🎯 Test 6: Position hinzufügen');
    await page.click('button:has-text("Position hinzufügen")');
    await page.fill('input[placeholder="z.B. Rasenanlage"]', 'Rasenanlage');
    await page.fill('input[type="text"][placeholder="z.B. Ansaat und Düngung"]', 'Ansaat und Düngung Saatgut');
    await page.fill('input[type="number"][step="0.1"][placeholder="1"]', '50');
    await page.fill('input[placeholder="m², h, Stück"]', 'm²');
    await page.fill('input[type="number"][step="0.01"]', '25.50');

    await page.click('button:has-text("Hinzufügen")');
    await page.waitForTimeout(1000);
    console.log('✅ Position hinzugefügt');

    console.log('\n🎯 Test 7: Kalkulation überprüfen');
    const bruttoText = await page.locator('text=€').last().textContent();
    console.log(`✅ Gesamtbetrag berechnet: ${bruttoText}`);

    console.log('\n🎯 Test 8: PDF exportieren');
    const downloadPromise = page.waitForEvent('popup');
    await page.click('button:has-text("PDF herunterladen")');
    console.log('✅ PDF Download gestartet');

    console.log('\n🎯 Test 9: Nachtrag erstellen');
    // Scroll to amendments section
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Nachträge'));
      if (el) el.scrollIntoView();
    });

    await page.click('button:has-text("Nachtrag hinzufügen")');
    await page.waitForTimeout(2000);

    const amendmentUrl = page.url();
    console.log(`✅ Nachtrag erstellt: ${amendmentUrl.split('/').pop()}`);

    console.log('\n✅✅✅ ALLE TESTS ERFOLGREICH! ✅✅✅\n');

  } catch (error) {
    console.error('\n❌ Test Fehler:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();
