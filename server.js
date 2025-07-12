require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  // Respuesta con metadatos (Prueba 4)
  res.json({
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size
  });
});

// Conexión a MongoDB
/*mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("🟢 Conectado a MongoDB"))
.catch((err) => console.error("❌ Error en MongoDB:", err));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Modelo de URL
const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, unique: true },
});

const UrlModel = mongoose.model("Url", urlSchema);

// Ruta POST: crear nueva URL acortada
app.post("/api/shorturl", async (req, res) => {
  const { url } = req.body;
  
  try {
    // Validación más estricta de URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return res.json({ error: 'invalid url' });
    }

    // Verificar si la URL ya existe
    const existingUrl = await UrlModel.findOne({ original_url: url });
    if (existingUrl) {
      return res.json({
        original_url: existingUrl.original_url,
        short_url: existingUrl.short_url
      });
    }

    // Crear nueva URL acortada
    const count = await UrlModel.countDocuments();
    const newUrl = new UrlModel({
      original_url: url,
      short_url: count + 1
    });

    await newUrl.save();

    // Respuesta en formato EXACTO que espera la prueba
    res.json({
      original_url: newUrl.original_url,
      short_url: newUrl.short_url
    });

  } catch (err) {
    // Cualquier error se considera URL inválida
    res.json({ error: 'invalid url' });
  }
});
// Ruta GET: redirigir por short_url
app.get("/api/shorturl/:short_url", async (req, res) => {
  try {
    const shortUrl = parseInt(req.params.short_url);
    
    if (isNaN(shortUrl)) {
      return res.json({ error: 'invalid url' });
    }

    const urlDoc = await UrlModel.findOne({ short_url: shortUrl });
    
    if (!urlDoc) {
      return res.json({ error: 'No short URL found for the given input' });
    }

    // Redirección permanente (301) o temporal (302)
    res.redirect(302, urlDoc.original_url);
    
  } catch (err) {
    res.json({ error: 'invalid url' });
  }
});

const userRoutes = require('./router/user');
const exerciseRoutes = require('./router/exercise');
app.use('/api/users', userRoutes);
app.use('/api/users', exerciseRoutes);*/


// Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});