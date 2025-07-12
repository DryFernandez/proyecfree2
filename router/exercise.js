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
router.get('/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  let { from, to, limit } = req.query;

  try {
    // Validar que el usuario exista
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Construir el objeto de consulta
    const query = { userId: _id };
    const dateFilter = {};

    // Procesar parámetros 'from' y 'to'
    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return res.status(400).json({ error: 'Formato de fecha "from" inválido. Use yyyy-mm-dd' });
      }
      dateFilter.$gte = fromDate;
    }

    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        return res.status(400).json({ error: 'Formato de fecha "to" inválido. Use yyyy-mm-dd' });
      }
      dateFilter.$lte = toDate;
    }

    // Aplicar filtro de fechas si existe
    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter;
    }

    // Procesar el límite
    let limitNumber;
    if (limit) {
      limitNumber = parseInt(limit);
      if (isNaN(limitNumber)) {
        return res.status(400).json({ error: 'El parámetro "limit" debe ser un número' });
      }
    }

    // Obtener los ejercicios con los filtros aplicados
    let exercisesQuery = Exercise.find(query)
      .select('description duration date -_id')
      .sort({ date: 'asc' });

    if (limitNumber) {
      exercisesQuery = exercisesQuery.limit(limitNumber);
    }

    const exercises = await exercisesQuery.exec();

    // Formatear la respuesta según los requisitos
    const log = exercises.map(exercise => ({
      description: String(exercise.description), // Aseguramos que sea string (Prueba 13)
      duration: Number(exercise.duration), // Aseguramos que sea número (Prueba 14)
      date: exercise.date.toDateString() // Formateamos fecha (Prueba 15)
    }));

    // Respuesta final
    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log
    });

  } catch (err) {
    console.error('Error en /api/users/:_id/logs:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;