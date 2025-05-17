import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateEventDto } from '../../../src/application/dtos/create-event.dto';

describe('CreateEventDto', () => {
  it('should validate a valid DTO', async () => {
    // Arrange
    const dto = plainToInstance(CreateEventDto, {
      containerId: 'c123456',
      state: 'operational',
      timestamp: '2023-08-15T14:30:00Z',
      source: 'SCANNER'
    });

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate required fields', async () => {
    // Arrange
    const dto = plainToInstance(CreateEventDto, {});

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);

    // Get all error property names
    const errorProperties = errors.map(err => err.property);
    
    // Check required fields
    expect(errorProperties).toContain('containerId');
    expect(errorProperties).toContain('state');
  });

  it('should validate containerId is a string', async () => {
    // Arrange
    const dto = plainToInstance(CreateEventDto, {
      containerId: 12345, // Invalid: number instead of string
      state: 'operational',
      timestamp: '2023-08-15T14:30:00Z',
      source: 'SCANNER'
    });

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const containerIdErrors = errors.find(err => err.property === 'containerId');
    expect(containerIdErrors).toBeDefined();
  });

  it('should validate state is one of the allowed values', async () => {
    // Arrange
    const dto = plainToInstance(CreateEventDto, {
      containerId: 'c123456',
      state: 'invalid-state', // Invalid: not in allowed values
      timestamp: '2023-08-15T14:30:00Z',
      source: 'SCANNER'
    });

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const stateErrors = errors.find(err => err.property === 'state');
    expect(stateErrors).toBeDefined();
  });

  it('should validate timestamp is a valid ISO date', async () => {
    // Arrange
    const dto = plainToInstance(CreateEventDto, {
      containerId: 'c123456',
      state: 'operational',
      timestamp: 'not-a-date', // Invalid: not an ISO date
      source: 'SCANNER'
    });

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const timestampErrors = errors.find(err => err.property === 'timestamp');
    expect(timestampErrors).toBeDefined();
  });

  it('should validate with optional source', async () => {
    // Arrange
    const dto = plainToInstance(CreateEventDto, {
      containerId: 'c123456',
      state: 'operational',
      timestamp: '2023-08-15T14:30:00Z',
      // source is omitted
    });

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate source is a string when provided', async () => {
    // Arrange
    const dto = plainToInstance(CreateEventDto, {
      containerId: 'c123456',
      state: 'operational',
      timestamp: '2023-08-15T14:30:00Z',
      source: 12345 // Invalid: number instead of string
    });

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const sourceErrors = errors.find(err => err.property === 'source');
    expect(sourceErrors).toBeDefined();
  });

  it('should accept all valid states', async () => {
    // Test each valid state
    const validStates = ['operational', 'damaged', 'unknown'];
    
    for (const state of validStates) {
      // Arrange
      const dto = plainToInstance(CreateEventDto, {
        containerId: 'c123456',
        state,
        timestamp: '2023-08-15T14:30:00Z',
        source: 'SCANNER'
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    }
  });
});