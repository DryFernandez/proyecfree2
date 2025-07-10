const express = require("express");
const cors = require("cors");
const dns = require("dns");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("🟢 Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error en la conexión:", err));

// Middlewares
app.use(cors({ optionsSuccessStatus: 200 }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use("/public", express.static(__dirname + "/public"));

// Página principal
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Esquema y modelo
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const Murl = mongoose.model("Murl", urlSchema);

// Ruta POST para acortar URL
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  // Validar que la URL comience con http:// o https://
  if (!/^https?:\/\//.test(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  // Extraer hostname para validar con dns.lookup
  const hostname = originalUrl.replace(/^https?:\/\//, "").split("/")[0];

  dns.lookup(hostname, async (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    try {
      let found = await Murl.findOne({ original_url: originalUrl });
      if (!found) {
        const count = await Murl.countDocuments();
        found = new Murl({ original_url: originalUrl, short_url: count + 1 });
        await found.save();
      }

      return res.json({
        original_url: found.original_url,
        short_url: found.short_url,
      });
    } catch (e) {
      return res.status(500).json({ error: "Error saving or retrieving URL" });
    }
  });
});

// GET que devuelve todas las URLs acortadas en JSON
app.get("/api/shorturl", async (req, res) => {
  try {
    const urls = await Murl.find({}, { _id: 0, __v: 0 });
    res.json(urls);
  } catch (err) {
    res.status(500).json({ error: "Error retrieving URLs" });
  }
});

// Ruta GET para redirigir usando short_url
app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  if (isNaN(shortUrl)) {
    return res.json({ error: "invalid url" });
  }

  try {
    const found = await Murl.findOne({ short_url: shortUrl });

    if (found) {
      return res.redirect(found.original_url);
    } else {
      return res.json({ error: "No short URL found for given input" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
