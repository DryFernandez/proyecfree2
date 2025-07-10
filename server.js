var express = require("express");
var app = express();
var cors = require("cors");
const dns = require("dns");
const bodyParser = require("body-parser");
const { default: mongoose } = require("mongoose");
const { url } = require("inspector");
require ('dotenv').config()
//========================================================================

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('🟢 Conectado a MongoDB'))
  .catch(err => console.error('❌ Error en la conexión:', err));

//========================================================================

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//========================================================================

const urlshema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const Murl = mongoose.model("Murl", urlshema);

//========================================================================

/*app.get("/", (req, res) => {
  res.send("Timestamp Microservice is running");
});

// ✅ Ruta sin parámetro: devuelve hora actual
app.get("/api", (req, res) => {
  const date = new Date();
  res.json({
    unix: date.getTime(),
    utc: date.toUTCString(),
  });
});

// ✅ Ruta con parámetro
app.get("/api/:date", (req, res) => {
  const dateInput = req.params.date;
  let date;

  // Si es un número (timestamp), conviértelo a int y pásalo al constructor
  if (!isNaN(dateInput) && /^\d+$/.test(dateInput)) {
    date = new Date(parseInt(dateInput));
  } else {
    date = new Date(dateInput);
  }

  // Verifica si es una fecha válida
  if (date.toString() === "Invalid Date") {
    return res.json({ error: "Invalid Date" });
  }

  res.json({
    unix: date.getTime(),
    utc: date.toUTCString(),
  });
});*/
/*app.get("/", (req, res) => {
  res.send("Header parser microservice");
});

app.get("/api/whoami", (req, res) => {
  res.json({
    ipaddress: req.ip,
    language: req.headers["accept-language"],
    software:
      req.headers[
        "user-agent"
      ],
  });
});*/

let counter = 1;

app.post("/api/shorturl", (req, res) => {
  const originalurl = req.body.url;

  if (!/^https?:\/\//.test(originalurl)) {
    return res.json({ error: "invalid url" });
  }

  const hostname = originalurl.replace(/^https?:\/\//, "").split("/")[0];

  dns.lookup(hostname, async (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    } else {
      const found = await Murl.findOne({ original_url: originalurl });
      if (found) {
        return res.json({
          original_url: found.original_url,
          short_url: found.short_url,
        });
      } else {
        const newUrl = new Murl({
          original_url: originalurl,
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

app.get("/api/shorturl/:short_url", async (req, res) => {
  const shorturl = Number(req.params.short_url);

  const ulDoc = await Murl.findOne({ short_url: shorturl });
  if (ulDoc) {
    res.redirect(ulDoc.original_url);
  } else {
    res.json({ error: "No short URL found for given input" });
  }
});

//========================================================================

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log("Servidor corriendo en el puerto:", PORT);
});

server.on("error", (err) => {
  console.error("❌ Error al iniciar el servidor:", err);
});
