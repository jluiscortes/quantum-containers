import { Test } from '@nestjs/testing';
import { DetermineStatusUseCase } from '../../../src/application/use-cases/determine-status.usecase';
import { ContainerEvent } from '../../../src/domain/entities/container.entity';
import { CONTAINER_REPOSITORY } from '../../../src/domain/ports/container.repository';
import { ContainerNotFoundException } from '../../../src/domain/errors/container-not-found.exception';

describe('DetermineStatusUseCase', () => {
  let useCase: DetermineStatusUseCase;
  let mockRepository: any;

  beforeEach(async () => {
    // Create mock repository
    mockRepository = {
      getEventsByContainer: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DetermineStatusUseCase,
        { provide: CONTAINER_REPOSITORY, useValue: mockRepository },
      ],
    })
    .setLogger({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn()
    } as any)
    .compile();

    useCase = moduleRef.get<DetermineStatusUseCase>(DetermineStatusUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should throw ContainerNotFoundException when no events found', async () => {
    // Arrange
    const containerId = 'c123456';
    mockRepository.getEventsByContainer.mockResolvedValue([]);
    
    // Act & Assert
    await expect(useCase.execute(containerId)).rejects.toThrow(
      ContainerNotFoundException
    );
    expect(mockRepository.getEventsByContainer).toHaveBeenCalledWith(containerId);
  });

  it('should return state that reaches quorum (at least 3 events with same state)', async () => {
    // Arrange
    const containerId = 'c123456';
    const mockEvents = [
      new ContainerEvent(containerId, 'operational', new Date(), 'SCANNER'),
      new ContainerEvent(containerId, 'operational', new Date(), 'SCANNER'),
      new ContainerEvent(containerId, 'operational', new Date(), 'MANUAL'),
      new ContainerEvent(containerId, 'damaged', new Date(), 'SCANNER'),
    ];
    
    mockRepository.getEventsByContainer.mockResolvedValue(mockEvents);
    
    // Act
    const result = await useCase.execute(containerId);
    
    // Assert
    expect(result).toBe('operational');
    expect(mockRepository.getEventsByContainer).toHaveBeenCalledWith(containerId);
  });

  it('should return "unknown" when no state reaches quorum', async () => {
    // Arrange
    const containerId = 'c123456';
    const mockEvents = [
      new ContainerEvent(containerId, 'operational', new Date(), 'SCANNER'),
      new ContainerEvent(containerId, 'operational', new Date(), 'MANUAL'),
      new ContainerEvent(containerId, 'damaged', new Date(), 'SCANNER'),
      new ContainerEvent(containerId, 'damaged', new Date(), 'MANUAL'),
    ];
    
    mockRepository.getEventsByContainer.mockResolvedValue(mockEvents);
    
    // Act
    const result = await useCase.execute(containerId);
    
    // Assert
    expect(result).toBe('unknown');
  });

  it('should handle multiple states with the first one reaching quorum', async () => {
    // Arrange
    const containerId = 'c123456';
    const mockEvents = [
      new ContainerEvent(containerId, 'damaged', new Date(), 'SCANNER'),
      new ContainerEvent(containerId, 'damaged', new Date(), 'SCANNER'),
      new ContainerEvent(containerId, 'damaged', new Date(), 'MANUAL'),
      new ContainerEvent(containerId, 'operational', new Date(), 'SCANNER'),
      new ContainerEvent(containerId, 'operational', new Date(), 'MANUAL'),
    ];
    
    mockRepository.getEventsByContainer.mockResolvedValue(mockEvents);
    
    // Act
    const result = await useCase.execute(containerId);
    
    // Assert
    expect(result).toBe('damaged');
  });

  it('should handle exactly 3 events of the same state', async () => {
    // Arrange
    const containerId = 'c123456';
    const mockEvents = [
      new ContainerEvent(containerId, 'operational', new Date(), 'SCANNER'),
      new ContainerEvent(containerId, 'operational', new Date(), 'SCANNER'),
      new ContainerEvent(containerId, 'operational', new Date(), 'MANUAL'),
    ];
    
    mockRepository.getEventsByContainer.mockResolvedValue(mockEvents);
    
    // Act
    const result = await useCase.execute(containerId);
    
    // Assert
    expect(result).toBe('operational');
  });

  it('should handle repository errors', async () => {
    // Arrange
    const containerId = 'c123456';
    const error = new Error('Database error');
    mockRepository.getEventsByContainer.mockRejectedValue(error);
    
    // Act & Assert
    await expect(useCase.execute(containerId)).rejects.toThrow('Database error');
    expect(mockRepository.getEventsByContainer).toHaveBeenCalledWith(containerId);
  });

  it('should handle a single event', async () => {
    // Arrange
    const containerId = 'c123456';
    const mockEvents = [
      new ContainerEvent(containerId, 'operational', new Date(), 'SCANNER'),
    ];
    
    mockRepository.getEventsByContainer.mockResolvedValue(mockEvents);
    
    // Act
    const result = await useCase.execute(containerId);
    
    // Assert
    expect(result).toBe('unknown');
  });

  it('should handle multiple states none reaching quorum', async () => {
    // Arrange
    const containerId = 'c123456';
    const mockEvents = [
      new ContainerEvent(containerId, 'operational', new Date(), 'SCANNER'),
      new ContainerEvent(containerId, 'damaged', new Date(), 'SCANNER'),
      new ContainerEvent(containerId, 'unknown', new Date(), 'MANUAL'),
    ];
    
    mockRepository.getEventsByContainer.mockResolvedValue(mockEvents);
    
    // Act
    const result = await useCase.execute(containerId);
    
    // Assert
    expect(result).toBe('unknown');
  });
});