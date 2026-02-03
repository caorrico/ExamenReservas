/**
 * Jest Setup File
 * Configuración global para todos los tests
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing_only_12345678901234567890';

// Antes de todos los tests
beforeAll(async () => {
  // Crear servidor MongoDB en memoria
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Conectar mongoose
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('MongoDB Memory Server started');
});

// Después de cada test
afterEach(async () => {
  // Limpiar todas las colecciones
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Después de todos los tests
afterAll(async () => {
  // Desconectar mongoose
  await mongoose.disconnect();

  // Detener servidor MongoDB
  if (mongoServer) {
    await mongoServer.stop();
  }

  console.log('MongoDB Memory Server stopped');
});

// Extender timeout para tests de integración
jest.setTimeout(30000);

// Silenciar console.log en tests (opcional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Helper global para crear usuarios de prueba
global.createTestUser = async (User, bcrypt, email = 'test@test.com', password = 'Password123!') => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    password: hashedPassword,
  });
  return { user, email, password };
};

// Helper global para generar token
global.generateTestToken = (jwt, userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};
