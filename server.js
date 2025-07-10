require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const bodyParser = require("body-parser");
const app = express();

//================= DB CONNECTION =================
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("🟢 Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error en la conexión:", err));

//================= MIDDLEWARE ====================
app.use(cors());
app.use("/public", express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

//================= SCHEMA ========================
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const Url = mongoose.model("Url", urlSchema);

//================= ROUTES ========================
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

let counter = 1;

// POST - create short URL
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  // Validar formato
  if (!/^https?:\/\/.+/i.test(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  const hostname = originalUrl.replace(/^https?:\/\//i, "").split("/")[0];

  dns.lookup(hostname, async (err) => {
    if (err) return res.json({ error: "invalid url" });

    // Verifica si ya existe
    const existing = await Url.findOne({ original_url: originalUrl });
    if (existing) {
      return res.json({
        original_url: existing.original_url,
        short_url: existing.short_url,
      });
    }

    // Crea uno nuevo
    const count = await Url.countDocuments();
    const newUrl = new Url({
      original_url: originalUrl,
      short_url: count + 1,
    });

    await newUrl.save();
    res.json({
      original_url: newUrl.original_url,
      short_url: newUrl.short_url,
    });
  });
});

// GET - redirect to original
app.get("/api/shorturl/:short_url", async (req, res) => {
  const id = parseInt(req.params.short_url);

  if (isNaN(id)) return res.json({ error: "invalid url" });

  const result = await Url.findOne({ short_url: id });
  if (result) {
    res.redirect(result.original_url);
  } else {
    res.json({ error: "No short URL found for given input" });
  }
});

//================= SERVER ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Servidor corriendo en el puerto:", PORT);
});
