const express = require('express');
const router = express.Router();
const User = require('../model/user');

// Crear nuevo usuario - Versión corregida
router.post('/', async (req, res) => {
  const { username } = req.body;

  try {
    // Validación básica
    if (!username) {
      return res.status(400).json({ error: 'Username es requerido' });
    }

    // Crear y guardar usuario
    const newUser = new User({ username });
    const savedUser = await newUser.save();
    
    // Respuesta CORRECTA con ambos campos
    res.json({
      username: savedUser.username, // Asegúrate de incluir esto
      _id: savedUser._id
    });

  } catch (err) {
    // Manejo de errores mejorado
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username ya existe' });
    }
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/*router.delete('/clean', async (req, res) => {
  try {
    const result = await User.deleteMany({
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: "" }
      ]
    });
    res.json({
      message: `Eliminados ${result.deletedCount} usuarios sin nombre`,
      success: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});*/

// Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id'); // Asegura que trae ambos campos
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;