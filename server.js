const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dns = require("dns");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(__dirname + "/public"));

// Página principal
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("🟢 Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error en la conexión:", err));

// Esquema de Mongoose
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});
const Url = mongoose.model("Url", urlSchema);

// Contador (incremental)
let counter = 1;

// POST para acortar URL
app.post("/api/shorturl", (req, res) => {
  const inputUrl = req.body.url;

  // Verificar formato http o https
  if (!/^https?:\/\/.+\..+/.test(inputUrl)) {
    return res.json({ error: "invalid url" });
  }

  const hostname = inputUrl.replace(/^https?:\/\//, "").split("/")[0];

  dns.lookup(hostname, async (err) => {
    if (err) return res.json({ error: "invalid url" });

    try {
      let found = await Url.findOne({ original_url: inputUrl });
      if (found) {
        return res.json({
          original_url: found.original_url,
          short_url: found.short_url,
        });
      }

      const count = await Url.countDocuments({});
      const newUrl = new Url({
        original_url: inputUrl,
        short_url: count + 1,
      });

      await newUrl.save();
      return res.json({
        original_url: newUrl.original_url,
        short_url: newUrl.short_url,
      });
    } catch (err) {
      res.json({ error: "Database error" });
    }
  });
});

// GET para redireccionar
app.get("/api/shorturl/:short_url", async (req, res) => {
  const short = parseInt(req.params.short_url);

  try {
    const doc = await Url.findOne({ short_url: short });
    if (doc) {
      return res.redirect(doc.original_url);
    } else {
      return res.json({ error: "No short URL found for given input" });
    }
  } catch (err) {
    res.json({ error: "Database error" });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
