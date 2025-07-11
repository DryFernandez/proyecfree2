require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

// — Conexión a MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("🟢 Conectado a MongoDB"))
  .catch(err => console.error("❌ Error en la conexión:", err));

// — Middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

// — Modelo de datos
const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url:     { type: Number, required: true, unique: true }
});
const Url = mongoose.model("Url", urlSchema);

// — POST para acortar URL (test 2)
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;
  
  // Validación de protocolo
  if (!/^https?:\/\//i.test(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  // Validación de dominio
  const hostname = originalUrl.replace(/^https?:\/\//i, "").split("/")[0];
  dns.lookup(hostname, async err => {
    if (err) return res.json({ error: "invalid url" });

    try {
      // Si ya existe, devolverla
      let found = await Url.findOne({ original_url: originalUrl });
      if (found) {
        return res.json({
          original_url: found.original_url,
          short_url: found.short_url
        });
      }
      // Si no, crear nuevo documento
      const count = await Url.countDocuments();
      const newUrl = new Url({
        original_url: originalUrl,
        short_url: count + 1
      });
      await newUrl.save();

      return res.json({
        original_url: newUrl.original_url,
        short_url: newUrl.short_url
      });
    } catch {
      return res.json({ error: "Server error" });
    }
  });
});

// — GET redirección (test 3)
app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = parseInt(req.params.short_url);
  if (isNaN(shortUrl)) {
    return res.json({ error: "invalid url" });
  }

  try {
    const found = await Url.findOne({ short_url: shortUrl });
    if (!found) return res.json({ error: "No short URL found for given input" });
    return res.redirect(found.original_url);
  } catch {
    return res.json({ error: "Server error" });
  }
});

// — Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor en puerto ${PORT}`));
