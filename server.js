const express = require("express");
const cors = require("cors");
const dns = require("dns");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URL);

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});
const Url = mongoose.model("Url", urlSchema);

app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  // Validar protocolo http/https
  if (!/^https?:\/\//.test(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  // Extraer hostname para DNS lookup
  const hostname = originalUrl.replace(/^https?:\/\//, "").split("/")[0];

  dns.lookup(hostname, async (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    } else {
      try {
        // Buscar URL en BD
        const found = await Url.findOne({ original_url: originalUrl });
        if (found) {
          return res.json({
            original_url: found.original_url,
            short_url: found.short_url,
          });
        } else {
          // Generar short_url incremental
          const count = await Url.countDocuments();
          const newUrl = new Url({
            original_url: originalUrl,
            short_url: count + 1,
          });
          await newUrl.save();
          return res.json({
            original_url: newUrl.original_url,
            short_url: newUrl.short_url,
          });
        }
      } catch (e) {
        return res.json({ error: "Server error" });
      }
    }
  });
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = Number(req.params.short_url);
  try {
    const found = await Url.findOne({ short_url: shortUrl });
    if (found) {
      return res.redirect(found.original_url);
    } else {
      return res.json({ error: "No short URL found for given input" });
    }
  } catch {
    return res.json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
