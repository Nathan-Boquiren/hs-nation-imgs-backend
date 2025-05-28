// generateImagesJson.js
const fs = require("fs");
const { google } = require("googleapis");

// 👇 replace with your Drive folder’s ID
const FOLDER_ID = "1ZPREpiTanEQz6ZRcmT9NCWhhw6eo2Huv";

const CREDENTIALS_PATH = "credentials.json";
const OUTPUT_FILE = "images.json";

async function generateImageMetadata() {
  // 1. auth
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  const drive = google.drive({ version: "v3", auth });

  // 2. list image files
  const res = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: "files(id, name)",
    pageSize: 1000,
  });
  const files = res.data.files || [];

  // 3. parse filename → { id: Number, name: String, fileId: String }
  const metadata = files
    .map((file) => {
      const base = file.name.replace(/\.[^/.]+$/, ""); // strip extension
      const parts = base.split(" - ");
      if (parts.length < 2) {
        console.warn(`Skipping unexpected filename: ${file.name}`);
        return null;
      }
      const id = parseInt(parts[0], 10);
      const name = parts.slice(1).join(" - ").trim();
      if (isNaN(id) || !name) {
        console.warn(`Skipping bad data in filename: ${file.name}`);
        return null;
      }
      return { id, name, fileId: file.id };
    })
    .filter((x) => x);

  // 4. write images.json
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(metadata, null, 2), "utf8");
  console.log(`✅ Wrote ${metadata.length} entries to ${OUTPUT_FILE}`);
}

// when run via `node generateImagesJson.js`
if (require.main === module) {
  generateImageMetadata().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
}

// also export for use in index.js
module.exports = generateImageMetadata;
