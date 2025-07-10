require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

// ——————————————————————
// ▪️ Conexión a MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('🟢 Conectado a MongoDB'))
  .catch(err => console.error('❌ Error de conexión:', err.message));

// ——————————————————————
// Middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use('/public', express.static(__dirname + '/public'));

// ——————————————————————
// Página principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// ——————————————————————
// Modelo Mongoose
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});
const Url = mongoose.model('Url', urlSchema);

// ——————————————————————
// Endpoint POST /api/shorturl
app.post('/api/shorturl', (req, res) => {
  const { url: originalUrl } = req.body;

  // Validación básica del formato
  if (!/^https?:\/\//i.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  // Extraer dominio para DNS lookup
  const hostname = originalUrl.replace(/^https?:\/\//, '').split('/')[0];

  dns.lookup(hostname, async (err) => {
    if (err) return res.json({ error: 'invalid url' });

    // Verificar si ya existe en DB
    const found = await Url.findOne({ original_url: originalUrl });
    if (found) {
      return res.json({ original_url: found.original_url, short_url: found.short_url });
    }

    // Nuevo documento con short_url = count + 1
    const count = await Url.countDocuments();
    const newUrl = new Url({ original_url: originalUrl, short_url: count + 1 });
    await newUrl.save();

    res.json({ original_url: newUrl.original_url, short_url: newUrl.short_url });
  });
});

// ——————————————————————
// Endpoint GET /api/shorturl/:short_url
app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = Number(req.params.short_url);
  if (isNaN(shortUrl)) return res.json({ error: 'Invalid short_url' });

  const found = await Url.findOne({ short_url: shortUrl });
  if (found) {
    return res.redirect(found.original_url);
  } else {
    return res.json({ error: 'No short URL found for given input' });
  }
});

// ——————————————————————
// Levantar servidor
const PORT = process.env.PORT || 3000;
const listener = app.listen(PORT, () => {
  console.log('🚀 Servidor corriendo en el puerto:', PORT);
});