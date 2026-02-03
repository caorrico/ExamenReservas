const Reserva = require('../models/Reserva');

/**
 * Crear nueva reserva con validación completa
 */
exports.crearReserva = async (req, res) => {
  try {
    // Extraer SOLO los campos permitidos (prevenir mass assignment)
    const { fecha, hora, sala } = req.body;

    // Validación adicional de campos requeridos
    if (!fecha || !hora || !sala) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Todos los campos son requeridos: fecha, hora, sala'
      });
    }

    // Convertir fecha a objeto Date
    const fechaReserva = new Date(fecha);

    // Verificar conflictos (misma sala, misma fecha, misma hora)
    const conflicto = await Reserva.findConflict(fechaReserva, hora, sala);

    if (conflicto) {
      console.log(`⚠️  Intento de reserva con conflicto - Sala: ${sala}, Fecha: ${fecha}, Hora: ${hora}`);
      return res.status(409).json({
        error: 'Conflicto de reserva',
        message: 'La sala ya está reservada en ese horario',
        conflicto: {
          fecha: conflicto.fechaFormateada,
          hora: conflicto.hora,
          sala: conflicto.sala
        }
      });
    }

    // Crear reserva - userId viene del token JWT autenticado, NO del body
    const reserva = new Reserva({
      fecha: fechaReserva,
      hora,
      sala,
      userId: req.user.id // IMPORTANTE: Solo del token, no del req.body
    });

    await reserva.save();

    // Logging de creación exitosa
    console.log(`✅ Reserva creada - Usuario: ${req.user.id}, Sala: ${sala}, Fecha: ${fecha}, Hora: ${hora}`);

    // Respuesta exitosa con datos de la reserva (sin información sensible)
    res.status(201).json({
      message: 'Reserva creada exitosamente',
      reserva: {
        id: reserva._id,
        fecha: reserva.fechaFormateada,
        hora: reserva.hora,
        sala: reserva.sala,
        createdAt: reserva.createdAt
      }
    });

  } catch (err) {
    // Manejo específico de errores de validación de Mongoose
    if (err.name === 'ValidationError') {
      console.log('⚠️  Error de validación en reserva:', err.message);
      return res.status(400).json({
        error: 'Datos inválidos',
        message: Object.values(err.errors).map(e => e.message).join(', ')
      });
    }

    // Manejo de error de índice único (por si el middleware de conflicto falla)
    if (err.code === 11000) {
      console.log('⚠️  Violación de índice único en reserva');
      return res.status(409).json({
        error: 'Conflicto de reserva',
        message: 'La sala ya está reservada en ese horario'
      });
    }

    // Error genérico
    console.error('❌ Error al crear reserva:', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: 'Error al procesar la solicitud',
      message: 'No se pudo crear la reserva. Intente nuevamente.'
    });
  }
};

/**
 * Obtener todas las reservas del usuario autenticado
 */
exports.obtenerMisReservas = async (req, res) => {
  try {
    const reservas = await Reserva.find({ userId: req.user.id })
      .sort({ fecha: 1, hora: 1 }) // Ordenar por fecha y hora
      .select('-__v');

    res.json({
      message: 'Reservas obtenidas exitosamente',
      count: reservas.length,
      reservas: reservas.map(r => ({
        id: r._id,
        fecha: r.fechaFormateada,
        hora: r.hora,
        sala: r.sala,
        esProxima: r.esProxima,
        createdAt: r.createdAt
      }))
    });

  } catch (err) {
    console.error('❌ Error al obtener reservas:', err);
    res.status(500).json({
      error: 'Error al obtener reservas'
    });
  }
};

/**
 * Obtener una reserva específica por ID
 */
exports.obtenerReserva = async (req, res) => {
  try {
    const { id } = req.params;

    const reserva = await Reserva.findById(id);

    if (!reserva) {
      return res.status(404).json({
        error: 'Reserva no encontrada'
      });
    }

    // Verificar que la reserva pertenece al usuario autenticado
    if (reserva.userId.toString() !== req.user.id) {
      console.log(`⚠️  Intento de acceso no autorizado a reserva ${id} por usuario ${req.user.id}`);
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tiene permiso para ver esta reserva'
      });
    }

    res.json({
      reserva: {
        id: reserva._id,
        fecha: reserva.fechaFormateada,
        hora: reserva.hora,
        sala: reserva.sala,
        esProxima: reserva.esProxima,
        createdAt: reserva.createdAt
      }
    });

  } catch (err) {
    console.error('❌ Error al obtener reserva:', err);
    res.status(500).json({
      error: 'Error al obtener la reserva'
    });
  }
};

/**
 * Eliminar una reserva
 */
exports.eliminarReserva = async (req, res) => {
  try {
    const { id } = req.params;

    const reserva = await Reserva.findById(id);

    if (!reserva) {
      return res.status(404).json({
        error: 'Reserva no encontrada'
      });
    }

    // Verificar que la reserva pertenece al usuario autenticado
    if (reserva.userId.toString() !== req.user.id) {
      console.log(`⚠️  Intento de eliminación no autorizada de reserva ${id} por usuario ${req.user.id}`);
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tiene permiso para eliminar esta reserva'
      });
    }

    await Reserva.findByIdAndDelete(id);

    console.log(`✅ Reserva eliminada - ID: ${id}, Usuario: ${req.user.id}`);

    res.json({
      message: 'Reserva eliminada exitosamente'
    });

  } catch (err) {
    console.error('❌ Error al eliminar reserva:', err);
    res.status(500).json({
      error: 'Error al eliminar la reserva'
    });
  }
};
