const express = require("express");
const cors = require("cors");
const dns = require("dns");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

//========================================================================
// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("🟢 Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error en la conexión:", err));

//========================================================================
// Middlewares
app.use(cors({ optionsSuccessStatus: 200 }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//========================================================================
// Esquema y modelo
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const Murl = mongoose.model("Murl", urlSchema);

//========================================================================
// GET opcional para evitar "Cannot GET"


//========================================================================
// Ruta POST para acortar URLs
let counter = 1;

app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  if (!/^https?:\/\//.test(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  const hostname = originalUrl.replace(/^https?:\/\//, "").split("/")[0];

  dns.lookup(hostname, async (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    } else {
      const found = await Murl.findOne({ original_url: originalUrl });

      if (found) {
        return res.json({
          original_url: found.original_url,
          short_url: found.short_url,
        });
      } else {
        const newUrl = new Murl({
          original_url: originalUrl,
          short_url: counter++,
        });

        await newUrl.save();

        res.json({
          original_url: newUrl.original_url,
          short_url: newUrl.short_url,
        });
      }
    }
  });
});

//========================================================================
// Ruta GET para redirigir a la URL original
app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = Number(req.params.short_url);

  const found = await Murl.findOne({ short_url: shortUrl });

  if (found) {
    res.redirect(found.original_url);
  } else {
    res.json({ error: "No short URL found for given input" });
  }
});

// GET para listar todas las URLs acortadas
app.get("/api/shorturl", async (req, res) => {
  try {
    const urls = await Murl.find({}, { _id: 0, __v: 0 }); // excluye _id y __v
    res.json(urls);
  } catch (err) {
    res.status(500).json({ error: "Error retrieving URLs from database" });
  }
});


//========================================================================
// Servidor
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log("Servidor corriendo en el puerto:", PORT);
});

server.on("error", (err) => {
  console.error("❌ Error al iniciar el servidor:", err);
});
