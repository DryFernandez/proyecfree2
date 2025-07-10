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

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("🟢 Conectado a MongoDB"))
  .catch(err => console.error("❌ Error en conexión:", err));

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true }
});

const Url = mongoose.model("Url", urlSchema);

// Contador para short_url (mejor usar un contador persistente, esto es simple)
let counter = 1;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  // Validar formato URL (debe iniciar con http:// o https://)
  if (!/^https?:\/\/.+/.test(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  // Extraer hostname para dns.lookup
  const hostname = originalUrl.replace(/^https?:\/\//, "").split("/")[0];

  dns.lookup(hostname, async (err) => {
    if (err) {
      // Host no válido
      return res.json({ error: "invalid url" });
    } else {
      try {
        // Revisar si la URL ya existe
        let foundUrl = await Url.findOne({ original_url: originalUrl });

        if (foundUrl) {
          // Ya existe: devolver
          return res.json({
            original_url: foundUrl.original_url,
            short_url: foundUrl.short_url
          });
        } else {
          // No existe: crear nuevo
          // Para que no se reinicie counter en cada ejecución, podrías contar los docs, pero para pruebas es suficiente
          let newUrl = new Url({
            original_url: originalUrl,
            short_url: counter++
          });
          await newUrl.save();

          return res.json({
            original_url: newUrl.original_url,
            short_url: newUrl.short_url
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
    const foundUrl = await Url.findOne({ short_url: shortUrl });

    if (foundUrl) {
      return res.redirect(foundUrl.original_url);
    } else {
      return res.json({ error: "No short URL found for given input" });
    }
  } catch (e) {
    return res.json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto:", PORT);
});
