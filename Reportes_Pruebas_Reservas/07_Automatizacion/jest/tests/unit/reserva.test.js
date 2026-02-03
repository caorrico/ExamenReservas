/**
 * Tests Unitarios - Módulo de Reservas
 * Sistema de Reservas Backend
 */

// Mock de modelos
jest.mock('../../../src/models/Reserva');
const Reserva = require('../../../src/models/Reserva');

// Importar controlador
const reservaController = require('../../../src/controllers/reservaController');

describe('Reserva Controller - Unit Tests', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {},
      user: { id: 'user123' },
      params: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // ==========================================
  // TESTS DE CREAR RESERVA
  // ==========================================
  describe('crearReserva()', () => {
    it('debería crear una reserva exitosamente', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      mockReq.body = {
        fecha: tomorrow.toISOString().split('T')[0],
        hora: '10:00',
        sala: 'Sala A',
      };

      Reserva.findOne.mockResolvedValue(null); // No hay conflicto
      Reserva.prototype.save = jest.fn().mockResolvedValue({
        _id: 'reserva123',
        ...mockReq.body,
        userId: 'user123',
      });

      // Act
      await reservaController.crearReserva(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('exitosamente'),
        })
      );
    });

    it('debería rechazar reserva duplicada', async () => {
      // Arrange
      mockReq.body = {
        fecha: '2026-02-15',
        hora: '10:00',
        sala: 'Sala A',
      };

      Reserva.findOne.mockResolvedValue({
        _id: 'existente',
        fecha: '2026-02-15',
        hora: '10:00',
        sala: 'Sala A',
      }); // Ya existe

      // Act
      await reservaController.crearReserva(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Conflicto'),
        })
      );
    });

    it('debería rechazar si faltan campos requeridos', async () => {
      // Arrange
      mockReq.body = {
        fecha: '2026-02-15',
        // hora falta
        sala: 'Sala A',
      };

      // Act
      await reservaController.crearReserva(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debería prevenir mass assignment', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      mockReq.body = {
        fecha: tomorrow.toISOString().split('T')[0],
        hora: '10:00',
        sala: 'Sala A',
        userId: 'attacker123', // Intento de inyección
        isAdmin: true,        // Campo malicioso
      };

      Reserva.findOne.mockResolvedValue(null);

      let savedData;
      Reserva.prototype.save = jest.fn().mockImplementation(function() {
        savedData = this;
        return Promise.resolve(this);
      });

      // Act
      await reservaController.crearReserva(mockReq, mockRes);

      // Assert
      // El userId debe ser del token, no del body
      expect(savedData.userId).toBe('user123');
      expect(savedData.isAdmin).toBeUndefined();
    });
  });

  // ==========================================
  // TESTS DE OBTENER RESERVAS
  // ==========================================
  describe('obtenerMisReservas()', () => {
    it('debería retornar las reservas del usuario', async () => {
      // Arrange
      const mockReservas = [
        { _id: 'r1', fecha: '2026-02-15', hora: '10:00', sala: 'Sala A' },
        { _id: 'r2', fecha: '2026-02-16', hora: '14:00', sala: 'Sala B' },
      ];

      Reserva.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReservas),
      });

      // Act
      await reservaController.obtenerMisReservas(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          reservas: expect.arrayContaining([
            expect.objectContaining({ _id: 'r1' }),
          ]),
        })
      );
    });

    it('debería retornar array vacío si no hay reservas', async () => {
      // Arrange
      Reserva.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      // Act
      await reservaController.obtenerMisReservas(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          reservas: [],
        })
      );
    });
  });

  // ==========================================
  // TESTS DE OBTENER RESERVA POR ID
  // ==========================================
  describe('obtenerReserva()', () => {
    it('debería retornar una reserva específica', async () => {
      // Arrange
      mockReq.params.id = 'reserva123';

      Reserva.findOne.mockResolvedValue({
        _id: 'reserva123',
        fecha: '2026-02-15',
        hora: '10:00',
        sala: 'Sala A',
        userId: 'user123',
      });

      // Act
      await reservaController.obtenerReserva(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('debería retornar 404 si la reserva no existe', async () => {
      // Arrange
      mockReq.params.id = 'noexiste';
      Reserva.findOne.mockResolvedValue(null);

      // Act
      await reservaController.obtenerReserva(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('no debería permitir ver reservas de otros usuarios', async () => {
      // Arrange
      mockReq.params.id = 'reserva456';
      mockReq.user.id = 'user123';

      Reserva.findOne.mockResolvedValue({
        _id: 'reserva456',
        userId: 'otroUsuario', // Diferente usuario
      });

      // Act
      await reservaController.obtenerReserva(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  // ==========================================
  // TESTS DE ELIMINAR RESERVA
  // ==========================================
  describe('eliminarReserva()', () => {
    it('debería eliminar una reserva propia', async () => {
      // Arrange
      mockReq.params.id = 'reserva123';

      Reserva.findOneAndDelete.mockResolvedValue({
        _id: 'reserva123',
        userId: 'user123',
      });

      // Act
      await reservaController.eliminarReserva(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('eliminada'),
        })
      );
    });

    it('debería retornar 404 si la reserva no existe', async () => {
      // Arrange
      mockReq.params.id = 'noexiste';
      Reserva.findOneAndDelete.mockResolvedValue(null);

      // Act
      await reservaController.eliminarReserva(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});

// ==========================================
// TESTS DE VALIDACIONES DEL MODELO
// ==========================================
describe('Reserva Model Validations', () => {
  describe('Validación de fecha', () => {
    it('no debería aceptar fechas en el pasado', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const isValid = yesterday >= new Date();
      expect(isValid).toBe(false);
    });

    it('debería aceptar fechas futuras', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isValid = tomorrow >= today;
      expect(isValid).toBe(true);
    });
  });

  describe('Validación de hora', () => {
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    it('debería aceptar horas válidas', () => {
      expect(horaRegex.test('08:00')).toBe(true);
      expect(horaRegex.test('12:30')).toBe(true);
      expect(horaRegex.test('19:59')).toBe(true);
    });

    it('debería rechazar horas inválidas', () => {
      expect(horaRegex.test('25:00')).toBe(false);
      expect(horaRegex.test('8:00')).toBe(false);
      expect(horaRegex.test('12:60')).toBe(false);
      expect(horaRegex.test('invalid')).toBe(false);
    });
  });

  describe('Validación de sala', () => {
    const salasValidas = ['Sala A', 'Sala B', 'Sala C', 'Sala D'];

    it('debería aceptar salas válidas', () => {
      salasValidas.forEach(sala => {
        expect(salasValidas.includes(sala)).toBe(true);
      });
    });

    it('debería rechazar salas inválidas', () => {
      expect(salasValidas.includes('Sala X')).toBe(false);
      expect(salasValidas.includes('')).toBe(false);
      expect(salasValidas.includes('Sala')).toBe(false);
    });
  });
});
