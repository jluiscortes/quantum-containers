import { Test, TestingModule } from '@nestjs/testing';
import { SaveEventUseCase } from '../../../src/application/use-cases/save-event.usecase';
import { ContainerEvent } from '../../../src/domain/entities/container.entity';
import { CONTAINER_REPOSITORY } from '../../../src/domain/ports/container.repository';
import { SnsAlertPublisher } from '../../../src/infrastructure/sns/sns-alert.publisher';
import { CustomLoggerService } from '../../../src/infrastructure/logging/logger.service';

describe('SaveEventUseCase', () => {
  let useCase: SaveEventUseCase;
  let mockRepository: any;
  let mockSnsPublisher: any;
  let mockLoggerService: any;

  beforeEach(async () => {
    // Create mock implementations
    mockRepository = {
      saveEvent: jest.fn(),
    };

    mockSnsPublisher = {
      publishCorruptEvent: jest.fn(),
    };

    mockLoggerService = {
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveEventUseCase,
        { provide: CONTAINER_REPOSITORY, useValue: mockRepository },
        { provide: SnsAlertPublisher, useValue: mockSnsPublisher },
        { provide: CustomLoggerService, useValue: mockLoggerService },
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

    useCase = module.get<SaveEventUseCase>(SaveEventUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should save event to repository', async () => {
    // Arrange
    const event = new ContainerEvent(
      'c123456',
      'operational',
      new Date(),
      'SCANNER'
    );
    
    // Act
    await useCase.execute(event);
    
    // Assert
    expect(mockRepository.saveEvent).toHaveBeenCalledWith(event);
  });

  it('should not publish to SNS or log error for operational events', async () => {
    // Arrange
    const event = new ContainerEvent(
      'c123456',
      'operational',
      new Date(),
      'SCANNER'
    );
    
    // Act
    await useCase.execute(event);
    
    // Assert
    expect(mockSnsPublisher.publishCorruptEvent).not.toHaveBeenCalled();
    expect(mockLoggerService.error).not.toHaveBeenCalled();
  });

  it('should publish to SNS and log error for damaged events', async () => {
    // Arrange
    const event = new ContainerEvent(
      'c123456',
      'damaged',
      new Date(),
      'SCANNER'
    );
    
    // Act
    await useCase.execute(event);
    
    // Assert
    expect(mockRepository.saveEvent).toHaveBeenCalledWith(event);
    expect(mockSnsPublisher.publishCorruptEvent).toHaveBeenCalledWith(
      event.containerId, 
      event.state
    );
    expect(mockLoggerService.error).toHaveBeenCalledWith(
      'Evento corrupto detectado',
      JSON.stringify(event)
    );
  });

  it('should handle repository errors', async () => {
    // Arrange
    const event = new ContainerEvent(
      'c123456',
      'operational',
      new Date(),
      'SCANNER'
    );
    
    const error = new Error('Database error');
    mockRepository.saveEvent.mockRejectedValue(error);
    
    // Act & Assert
    await expect(useCase.execute(event)).rejects.toThrow('Database error');
  });

  it('should propagate SNS publish errors', async () => {
    // Arrange
    const event = new ContainerEvent(
      'c123456',
      'damaged',
      new Date(),
      'SCANNER'
    );
    
    mockSnsPublisher.publishCorruptEvent.mockRejectedValue(new Error('SNS publish error'));
    
    // Act & Assert
    await expect(useCase.execute(event)).rejects.toThrow('SNS publish error');
    
    // Still should save the event before the error
    expect(mockRepository.saveEvent).toHaveBeenCalledWith(event);
  });

  it('should handle unknown state events', async () => {
    // Arrange
    const event = new ContainerEvent(
      'c123456',
      'unknown',
      new Date(),
      'SCANNER'
    );
    
    // Act
    await useCase.execute(event);
    
    // Assert
    expect(mockRepository.saveEvent).toHaveBeenCalledWith(event);
    expect(mockSnsPublisher.publishCorruptEvent).not.toHaveBeenCalled();
    expect(mockLoggerService.error).not.toHaveBeenCalled();
  });
});