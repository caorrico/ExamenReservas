const mongoose = require('mongoose');

// Definición del esquema del usuario con validaciones robustas
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [100, 'El email es demasiado largo'],
    match: [/^\S+@\S+\.\S+$/, 'El formato del email es inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres']
  }
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índice para optimizar búsquedas por email
userSchema.index({ email: 1 });

// Método para ocultar el password en respuestas JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Virtual para verificar si el usuario fue creado recientemente
userSchema.virtual('isNew').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffMs = now - created;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays < 7; // Nuevo si fue creado hace menos de 7 días
});

// Middleware pre-save para logging (sin modificar password que ya viene hasheado)
userSchema.pre('save', function(next) {
  if (this.isNew) {
    console.log(`📝 Nuevo usuario siendo creado: ${this.email}`);
  }
  next();
});

// Exportación del modelo User
module.exports = mongoose.model('User', userSchema);
