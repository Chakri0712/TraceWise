import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function generate() {
  const puppeteer = await import('puppeteer');
  const htmlPath = join(__dirname, 'templates', 'problem-statement.html');
  const html = readFileSync(htmlPath, 'utf-8');

  const outputPath = join(__dirname, '..', 'problem_statement.pdf');

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    printBackground: true,
  });
  await browser.close();
  console.log(`Problem statement PDF saved to ${outputPath}`);
}

generate().catch(err => {
  console.error('Failed to generate problem statement PDF:', err);
  process.exit(1);
});
