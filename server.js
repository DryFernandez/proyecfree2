const express = require("express");
const cors = require("cors");
const dns = require("dns");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("🟢 Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error en la conexión:", err));

// Middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// Esquema y modelo
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

const url = mongoose.model("url", urlSchema);

// POST /api/shorturl - Crear URL corta
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  // Validar que comience con http o https
  if (!/^https?:\/\/.+/.test(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  // Extraer el hostname
  const hostname = originalUrl.replace(/^https?:\/\//, "").split("/")[0];

  dns.lookup(hostname, async (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    try {
      let found = await url.findOne({ original_url: originalUrl });

      if (found) {
        // Ya existe, devolverlo
        return res.json({
          original_url: found.original_url,
          short_url: found.short_url
        });
      }

      // Nuevo, contar y guardar
      const count = await url.countDocuments();
      const newEntry = new url({
        original_url: originalUrl,
        short_url: count + 1
      });

      await newEntry.save();

      res.json({
        original_url: newEntry.original_url,
        short_url: newEntry.short_url
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });
});

// GET /api/shorturl/:short_url - Redirige a URL original
app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  if (isNaN(shortUrl)) {
    return res.json({ error: "Wrong format" });
  }
  const found = await url.findOne({ short_url: shortUrl });
  if (found) {
    res.redirect(found.original_url);
  } else {
    res.json({ error: "No short URL found for the given input" });
  }
});

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
