const express = require("express");
const cors = require("cors");
const dns = require("dns");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use("/public", express.static(__dirname + "/public"));

// Conexión MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("🟢 Conectado a MongoDB"))
  .catch(err => console.error("❌ Error Mongo:", err));

// Modelo
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

const UrlModel = mongoose.model("Url", urlSchema);

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

let counter = 1; // Esto se reinicia al reiniciar el servidor (ver nota abajo)

// POST: acorta la URL
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  // Validación básica del formato
  if (!/^https?:\/\//.test(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  const hostname = originalUrl.replace(/^https?:\/\//, "").split("/")[0];

  // Validar que exista el hostname
  dns.lookup(hostname, async (err) => {
    if (err) return res.json({ error: "invalid url" });

    // Ver si ya existe en la base
    const found = await UrlModel.findOne({ original_url: originalUrl });

    if (found) {
      return res.json({
        original_url: found.original_url,
        short_url: found.short_url,
      });
    }

    // Crear nueva
    const newEntry = new UrlModel({
      original_url: originalUrl,
      short_url: counter++
    });

    await newEntry.save();

    res.json({
      original_url: newEntry.original_url,
      short_url: newEntry.short_url
    });
  });
});

// GET: redirige
app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  const found = await UrlModel.findOne({ short_url: shortUrl });

  if (found) {
    res.redirect(found.original_url);
  } else {
    res.json({ error: "No short URL found for given input" });
  }
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en el puerto:", PORT);
});
