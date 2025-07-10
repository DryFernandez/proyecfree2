const express = require("express");
const cors = require("cors");
const dns = require("dns");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema and model
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const Url = mongoose.model("Url", urlSchema);

// Counter
let counter = 1;

// POST route
app.post("/api/shorturl", (req, res) => {
  const inputUrl = req.body.url;

  // Validate protocol
  if (!/^https?:\/\/.+\..+/.test(inputUrl)) {
    return res.json({ error: "invalid url" });
  }

  const hostname = inputUrl.replace(/^https?:\/\//, "").split("/")[0];

  dns.lookup(hostname, async (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    try {
      let existing = await Url.findOne({ original_url: inputUrl });
      if (existing) {
        return res.json({
          original_url: existing.original_url,
          short_url: existing.short_url,
        });
      }

      const count = await Url.countDocuments({});
      const newUrl = new Url({
        original_url: inputUrl,
        short_url: count + 1,
      });

      await newUrl.save();

      res.json({
        original_url: newUrl.original_url,
        short_url: newUrl.short_url,
      });
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });
});

// GET route
app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortId = parseInt(req.params.short_url);

  if (!shortId) {
    return res.json({ error: "Wrong format" });
  }

  try {
    const found = await Url.findOne({ short_url: shortId });
    if (found) {
      res.redirect(found.original_url);
    } else {
      res.json({ error: "No short URL found for given input" });
    }
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Servidor corriendo en puerto", PORT);
});
