import mongoose from 'mongoose';
import { ContainerEventSchema } from '../../../../src/infrastructure/mongodb/schemas/container-event.schema';

describe('ContainerEventSchema', () => {
  let ContainerEventModel: mongoose.Model<any>;

  beforeAll(() => {
    // Create a model with the schema
    ContainerEventModel = mongoose.model('ContainerEventTest', ContainerEventSchema);
  });

  beforeEach(() => {
    // Clear mongoose models between tests to avoid conflicts
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Clean up after tests
    Object.keys(mongoose.models).forEach(modelName => {
      if (mongoose.modelNames().includes(modelName)) {
        mongoose.deleteModel(modelName);
      }
    });
  });

  it('should validate valid container event', () => {
    // Arrange
    const validEvent = {
      containerId: 'c123456',
      state: 'operational',
      timestamp: new Date(),
      source: 'SCANNER'
    };

    // Act
    const model = new ContainerEventModel(validEvent);
    const error = model.validateSync();

    // Assert
    expect(error).toBeUndefined();
  });

  it('should require containerId field', () => {
    // Arrange
    const invalidEvent = {
      // containerId is missing
      state: 'operational',
      timestamp: new Date(),
      source: 'SCANNER'
    };

    // Act
    const model = new ContainerEventModel(invalidEvent);
    const error = model.validateSync();

    // Assert
    expect(error).toBeDefined();
    expect(error.errors.containerId).toBeDefined();
    expect(error.errors.containerId.kind).toBe('required');
  });

  it('should require state field', () => {
    // Arrange
    const invalidEvent = {
      containerId: 'c123456',
      // state is missing
      timestamp: new Date(),
      source: 'SCANNER'
    };

    // Act
    const model = new ContainerEventModel(invalidEvent);
    const error = model.validateSync();

    // Assert
    expect(error).toBeDefined();
    expect(error.errors.state).toBeDefined();
    expect(error.errors.state.kind).toBe('required');
  });

  it('should require timestamp field', () => {
    // Arrange
    const invalidEvent = {
      containerId: 'c123456',
      state: 'operational',
      // timestamp is missing
      source: 'SCANNER'
    };

    // Act
    const model = new ContainerEventModel(invalidEvent);
    const error = model.validateSync();

    // Assert
    expect(error).toBeDefined();
    expect(error.errors.timestamp).toBeDefined();
    expect(error.errors.timestamp.kind).toBe('required');
  });

  it('should require source field', () => {
    // Arrange
    const invalidEvent = {
      containerId: 'c123456',
      state: 'operational',
      timestamp: new Date(),
      // source is missing
    };

    // Act
    const model = new ContainerEventModel(invalidEvent);
    const error = model.validateSync();

    // Assert
    expect(error).toBeDefined();
    expect(error.errors.source).toBeDefined();
    expect(error.errors.source.kind).toBe('required');
  });

  it('should validate state is one of the allowed values', () => {
    // Arrange
    const invalidEvent = {
      containerId: 'c123456',
      state: 'invalid-state', // not in the enum
      timestamp: new Date(),
      source: 'SCANNER'
    };

    // Act
    const model = new ContainerEventModel(invalidEvent);
    const error = model.validateSync();

    // Assert
    expect(error).toBeDefined();
    expect(error.errors.state).toBeDefined();
    expect(error.errors.state.kind).toBe('enum');
  });

  it('should accept all valid state values', () => {
    // Test each valid state
    const validStates = ['operational', 'damaged', 'unknown'];
    
    for (const state of validStates) {
      // Arrange
      const validEvent = {
        containerId: 'c123456',
        state,
        timestamp: new Date(),
        source: 'SCANNER'
      };

      // Act
      const model = new ContainerEventModel(validEvent);
      const error = model.validateSync();

      // Assert
      expect(error).toBeUndefined();
    }
  });

  it('should validate timestamp is a valid date', () => {
    // Arrange
    const invalidEvent = {
      containerId: 'c123456',
      state: 'operational',
      timestamp: 'not-a-date', // invalid date
      source: 'SCANNER'
    };

    // Act
    const model = new ContainerEventModel(invalidEvent);
    const error = model.validateSync();

    // Assert
    expect(error).toBeDefined();
    expect(error.errors.timestamp).toBeDefined();
    expect(error.errors.timestamp.name).toBe('CastError');
  });

  it('should correctly cast string date to Date object', () => {
    // Arrange
    const validEvent = {
      containerId: 'c123456',
      state: 'operational',
      timestamp: '2023-08-15T12:30:45.000Z', // ISO string date
      source: 'SCANNER'
    };

    // Act
    const model = new ContainerEventModel(validEvent);
    const error = model.validateSync();

    // Assert
    expect(error).toBeUndefined();
    expect(model.timestamp).toBeInstanceOf(Date);
  });
});