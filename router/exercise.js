const express = require('express');
const router = express.Router();
const User = require('../model/user');
const Exercise = require('../model/exercise');

// Añadir ejercicio
router.post('/:id/exercises', async (req, res) => {
  const { id } = req.params;
  let { description, duration, date } = req.body;

  try {
    // Validar usuario
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Procesar fecha
    if (!date) date = new Date();
    else date = new Date(date);

    // Crear ejercicio
    const exercise = new Exercise({
      userId: id,
      description,
      duration: parseInt(duration),
      date
    });

    const savedExercise = await exercise.save();

    // Formatear respuesta
    res.json({
      _id: user._id,
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date.toDateString()
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener registro de ejercicios
router.get('/:id/logs', async (req, res) => {
  const { id } = req.params;
  const { from, to, limit } = req.query;

  try {
    // Validar usuario
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Construir query
    let query = { userId: id };
    let dateFilter = {};

    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    if (from || to) query.date = dateFilter;

    // Obtener ejercicios
    let exercisesQuery = Exercise.find(query, 'description duration date -_id')
      .sort({ date: 'asc' });

    if (limit) exercisesQuery = exercisesQuery.limit(parseInt(limit));

    const exercises = await exercisesQuery.exec();

    // Formatear respuesta
    const log = exercises.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString()
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;