const mongoose = require('mongoose');

// Esquema mejorado y seguro para las reservas de salas
const reservaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido'],
    index: true
  },
  fecha: {
    type: Date,
    required: [true, 'La fecha es requerida'],
    validate: {
      validator: function(value) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return value >= hoy;
      },
      message: 'La fecha no puede ser en el pasado'
    }
  },
  hora: {
    type: String,
    required: [true, 'La hora es requerida'],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'El formato de hora es inválido (usar HH:MM)'],
    validate: {
      validator: function(value) {
        const [hora] = value.split(':').map(Number);
        return hora >= 8 && hora < 20; // Horario de oficina
      },
      message: 'La hora debe estar entre 08:00 y 19:59'
    }
  },
  sala: {
    type: String,
    required: [true, 'La sala es requerida'],
    trim: true,
    enum: {
      values: ['Sala A', 'Sala B', 'Sala C', 'Sala D'],
      message: '{VALUE} no es una sala válida'
    }
  }
}, {
  timestamps: true, // Agrega createdAt y updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índice compuesto único para prevenir reservas duplicadas
// Una sala no puede estar reservada dos veces en la misma fecha y hora
reservaSchema.index({ fecha: 1, hora: 1, sala: 1 }, { unique: true });

// Índice para consultas frecuentes por usuario y fecha
reservaSchema.index({ userId: 1, fecha: 1 });

// Índice para consultas por sala
reservaSchema.index({ sala: 1, fecha: 1 });

// Virtual para obtener fecha formateada
reservaSchema.virtual('fechaFormateada').get(function() {
  return this.fecha.toISOString().split('T')[0];
});

// Virtual para verificar si la reserva es próxima (dentro de las próximas 24 horas)
reservaSchema.virtual('esProxima').get(function() {
  const now = new Date();
  const reservaDateTime = new Date(this.fecha);
  const [hora, minuto] = this.hora.split(':').map(Number);
  reservaDateTime.setHours(hora, minuto, 0, 0);

  const diffMs = reservaDateTime - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours > 0 && diffHours <= 24;
});

// Middleware pre-save para logging
reservaSchema.pre('save', function(next) {
  if (this.isNew) {
    console.log(`📅 Nueva reserva creada - Sala: ${this.sala}, Fecha: ${this.fechaFormateada}, Hora: ${this.hora}`);
  }
  next();
});

// Método estático para buscar conflictos
reservaSchema.statics.findConflict = function(fecha, hora, sala) {
  return this.findOne({ fecha, hora, sala });
};

// Método estático para obtener reservas de un usuario
reservaSchema.statics.findByUser = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ fecha: 1, hora: 1 })
    .limit(limit)
    .populate('userId', 'email');
};

// Exporta el modelo Reserva
module.exports = mongoose.model('Reserva', reservaSchema);
