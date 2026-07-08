import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUpload() {
  const formData = new FormData();

  const reqContent = readFileSync(join(import.meta.dirname, 'sample/requirements.md'), 'utf-8');
  const testContent = readFileSync(join(import.meta.dirname, 'sample/test_cases.md'), 'utf-8');

  formData.append('files', new Blob([reqContent], { type: 'text/markdown' }), 'requirements.md');
  formData.append('files', new Blob([testContent], { type: 'text/markdown' }), 'test_cases.md');

  console.log('=== Testing File Upload ===\n');

  const res = await fetch('http://localhost:3001/api/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (data.runId) {
    const docs = await prisma.document.findMany({
      where: { runId: data.runId },
    });
    console.log('\nDocuments in DB:', docs.length);
    docs.forEach(d => console.log(`  - ${d.filename} (${d.content.length} chars)`));
  }
}

testUpload().catch(console.error);
