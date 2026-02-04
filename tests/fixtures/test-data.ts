/**
 * Test data fixtures for E2E tests
 */

export const TEST_CREDENTIALS = {
  admin: {
    email: 'admin123@plniconplus.com',
    password: 'admin123',
  },
};

export const TEST_PROJECT = {
  name: 'E2E Test Project',
  description: 'Created by automated E2E test',
};

export const TEST_PAGE = {
  name: 'E2E Test Page',
  description: 'Test page for workflows',
};

export const TEST_WORKFLOW = {
  activity: 'E2E Test Workflow',
  pic: 'Test PIC',
  status: 'On Progress',
};

export const TEST_DAILY_PROGRESS = {
  description: 'E2E test progress entry',
  percentage: 50,
};

export const TEST_PKR_OPEX = {
  nomorKontrak: 'E2E-TEST-001',
  perihal: 'E2E Test Contract',
  nilaiKontrak: 1000000,
};

/**
 * Create test file buffer for upload testing
 */
export function createTestImage(): Buffer {
  // Create a simple PNG image (1x1 pixel, red)
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
    0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d,
    0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
    0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  return png;
}

/**
 * Create test PDF buffer
 */
export function createTestPDF(): Buffer {
  // Minimal valid PDF
  const pdf = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n218\n%%EOF'
  );
  return pdf;
}
