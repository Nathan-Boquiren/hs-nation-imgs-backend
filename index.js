require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const generateImageMetadata = require("./generateImagesJson");

const app = express();
app.use(cors());

app.use((req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  next();
});

const PORT = process.env.PORT || 3000;
const JSON_PATH = path.join(__dirname, "images.json");

app.get("/images", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
    const withUrls = data.map((item) => ({
      id: item.id,
      name: item.name,
      fileId: item.fileId,
      imageUrl: `https://drive.google.com/uc?export=view&id=${item.fileId}`,
    }));
    res.json(withUrls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load images.json" });
  }
});

app.get("/refresh", async (req, res) => {
  try {
    await generateImageMetadata();
    res.json({ message: "images.json regenerated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to regenerate images.json" });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
