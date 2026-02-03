/**
 * Tests Unitarios - Módulo de Autenticación
 * Sistema de Reservas Backend
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock de modelos
jest.mock('../../../src/models/User');
const User = require('../../../src/models/User');

// Importar controlador
const authController = require('../../../src/controllers/authController');

describe('Auth Controller - Unit Tests', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request y response
    mockReq = {
      body: {},
      user: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // ==========================================
  // TESTS DE REGISTRO
  // ==========================================
  describe('register()', () => {
    it('debería crear un nuevo usuario exitosamente', async () => {
      // Arrange
      mockReq.body = {
        email: 'nuevo@test.com',
        password: 'Password123!',
      };

      User.findOne.mockResolvedValue(null); // Usuario no existe
      User.prototype.save = jest.fn().mockResolvedValue({
        _id: 'user123',
        email: 'nuevo@test.com',
      });

      // Act
      await authController.register(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('exitosamente'),
        })
      );
    });

    it('debería rechazar si el email ya existe', async () => {
      // Arrange
      mockReq.body = {
        email: 'existente@test.com',
        password: 'Password123!',
      };

      User.findOne.mockResolvedValue({ email: 'existente@test.com' }); // Usuario existe

      // Act
      await authController.register(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    it('debería manejar errores de base de datos', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@test.com',
        password: 'Password123!',
      };

      User.findOne.mockRejectedValue(new Error('DB Error'));

      // Act
      await authController.register(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ==========================================
  // TESTS DE LOGIN
  // ==========================================
  describe('login()', () => {
    it('debería autenticar un usuario válido y retornar token', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      mockReq.body = {
        email: 'test@test.com',
        password: 'Password123!',
      };

      User.findOne.mockResolvedValue({
        _id: 'user123',
        email: 'test@test.com',
        password: hashedPassword,
      });

      // Act
      await authController.login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
        })
      );
    });

    it('debería rechazar credenciales inválidas - usuario no existe', async () => {
      // Arrange
      mockReq.body = {
        email: 'noexiste@test.com',
        password: 'Password123!',
      };

      User.findOne.mockResolvedValue(null);

      // Act
      await authController.login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Credenciales inválidas',
        })
      );
    });

    it('debería rechazar credenciales inválidas - contraseña incorrecta', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      mockReq.body = {
        email: 'test@test.com',
        password: 'WrongPassword!',
      };

      User.findOne.mockResolvedValue({
        _id: 'user123',
        email: 'test@test.com',
        password: hashedPassword,
      });

      // Act
      await authController.login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Credenciales inválidas',
        })
      );
    });
  });

  // ==========================================
  // TESTS DE PERFIL
  // ==========================================
  describe('getProfile()', () => {
    it('debería retornar el perfil del usuario autenticado', async () => {
      // Arrange
      mockReq.user = { id: 'user123' };

      User.findById.mockResolvedValue({
        _id: 'user123',
        email: 'test@test.com',
        toJSON: function() {
          return { _id: this._id, email: this.email };
        },
      });

      // Act
      await authController.getProfile(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            email: 'test@test.com',
          }),
        })
      );
    });

    it('debería retornar 404 si el usuario no existe', async () => {
      // Arrange
      mockReq.user = { id: 'noexiste' };

      User.findById.mockResolvedValue(null);

      // Act
      await authController.getProfile(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});

// ==========================================
// TESTS DE FUNCIONES AUXILIARES
// ==========================================
describe('Auth Helper Functions', () => {
  describe('JWT Token Generation', () => {
    it('debería generar un token JWT válido', () => {
      // Arrange
      const userId = 'user123';
      const secret = process.env.JWT_SECRET;

      // Act
      const token = jwt.sign({ id: userId }, secret, { expiresIn: '1h' });
      const decoded = jwt.verify(token, secret);

      // Assert
      expect(decoded.id).toBe(userId);
      expect(decoded.exp).toBeDefined();
    });

    it('debería rechazar un token con secret incorrecto', () => {
      // Arrange
      const token = jwt.sign({ id: 'user123' }, 'wrong_secret');

      // Act & Assert
      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('debería hashear la contraseña correctamente', async () => {
      // Arrange
      const password = 'Password123!';

      // Act
      const hash = await bcrypt.hash(password, 12);

      // Assert
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('debería verificar contraseña correctamente', async () => {
      // Arrange
      const password = 'Password123!';
      const hash = await bcrypt.hash(password, 12);

      // Act
      const isValid = await bcrypt.compare(password, hash);
      const isInvalid = await bcrypt.compare('wrong', hash);

      // Assert
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });
});
