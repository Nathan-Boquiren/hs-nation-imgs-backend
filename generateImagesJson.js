// generateImagesJson.js
const fs = require("fs");
const { google } = require("googleapis");
require("dotenv").config();

const FOLDER_ID =
  process.env.DRIVE_FOLDER_ID || "1ZPREpiTanEQz6ZRcmT9NCWhhw6eo2Huv";
const OUTPUT_FILE = "images.json";

async function generateImageMetadata() {
  // 1. Parse credentials from the env var
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error("Missing GOOGLE_CREDENTIALS environment variable");
  }
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

  // 2. Authenticate
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  const drive = google.drive({ version: "v3", auth });

  // 3. List image files in the folder
  const res = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: "files(id, name)",
    pageSize: 1000,
  });
  const files = res.data.files || [];

  // 4. Parse filenames → { id, name, fileId }
  const metadata = files
    .map((file) => {
      const base = file.name.replace(/\.[^/.]+$/, ""); // strip extension
      const parts = base.split(" - ");
      if (parts.length < 2) {
        console.warn(`Skipping unexpected filename: ${file.name}`);
        return null;
      }
      const id = Number(parts[0]);
      const name = parts.slice(1).join(" - ").trim();
      if (isNaN(id) || !name) {
        console.warn(`Skipping bad data in filename: ${file.name}`);
        return null;
      }
      return { id, name, fileId: file.id };
    })
    .filter(Boolean);

  metadata.sort((a, b) => a.id - b.id);

  // 5. Write images.json
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(metadata, null, 2), "utf8");
  console.log(`✅ Wrote ${metadata.length} entries to ${OUTPUT_FILE}`);
}

// Allow both CLI and require():
if (require.main === module) {
  generateImageMetadata().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
}

module.exports = generateImageMetadata;
