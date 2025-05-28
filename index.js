const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const generateImageMetadata = require("./generateImagesJson");

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;
const JSON_PATH = path.join(__dirname, "images.json");

app.get("/images", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
    // add a direct-drive URL for each image
    const withUrls = data.map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: `https://drive.google.com/thumbnail?id=${item.fileId}`,
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
