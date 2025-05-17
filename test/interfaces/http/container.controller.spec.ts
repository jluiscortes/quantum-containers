import { Test, TestingModule } from '@nestjs/testing';
import { ContainerController } from '../../../src/interfaces/http/container.controller';
import { SaveEventUseCase } from '../../../src/application/use-cases/save-event.usecase';
import { DetermineStatusUseCase } from '../../../src/application/use-cases/determine-status.usecase';
import { GetVerifiedContainersUseCase } from '../../../src/application/use-cases/get-verified-containers.usecase';
import { CreateEventDto } from '../../../src/application/dtos/create-event.dto';
import { ContainerEvent } from '../../../src/domain/entities/container.entity';

describe('ContainerController', () => {
  let controller: ContainerController;
  let mockSaveUseCase: jest.Mocked<SaveEventUseCase>;
  let mockDetermineUseCase: jest.Mocked<DetermineStatusUseCase>;
  let mockVerifiedUseCase: jest.Mocked<GetVerifiedContainersUseCase>;

  beforeEach(async () => {
    // Create mock implementations
    mockSaveUseCase = {
      execute: jest.fn(),
    } as any;
    
    mockDetermineUseCase = {
      execute: jest.fn(),
    } as any;
    
    mockVerifiedUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContainerController],
      providers: [
        { provide: SaveEventUseCase, useValue: mockSaveUseCase },
        { provide: DetermineStatusUseCase, useValue: mockDetermineUseCase },
        { provide: GetVerifiedContainersUseCase, useValue: mockVerifiedUseCase },
      ],
    }).compile();

    controller = module.get<ContainerController>(ContainerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createEvent', () => {
    it('should create a new container event', async () => {
      // Arrange
      const dto: CreateEventDto = {
        containerId: 'c123456',
        state: 'operational',
        timestamp: '2023-08-15T14:30:00Z',
        source: 'SCANNER'
      };
      
      mockSaveUseCase.execute.mockResolvedValue(undefined);
      
      // Act
      const result = await controller.createEvent(dto);
      
      // Assert
      expect(result).toEqual({ message: 'Evento registrado correctamente' });
      expect(mockSaveUseCase.execute).toHaveBeenCalledWith(
        expect.any(ContainerEvent)
      );
      
      // Verify the ContainerEvent was created with the correct properties
      const eventArg = mockSaveUseCase.execute.mock.calls[0][0];
      expect(eventArg.containerId).toBe(dto.containerId);
      expect(eventArg.state).toBe(dto.state);
      expect(eventArg.timestamp).toEqual(new Date(dto.timestamp));
      expect(eventArg.source).toBe(dto.source);
    });

    it('should propagate errors from the use case', async () => {
      // Arrange
      const dto: CreateEventDto = {
        containerId: 'c123456',
        state: 'operational',
        timestamp: '2023-08-15T14:30:00Z',
        source: 'SCANNER'
      };
      
      const error = new Error('Database error');
      mockSaveUseCase.execute.mockRejectedValue(error);
      
      // Act & Assert
      await expect(controller.createEvent(dto)).rejects.toThrow('Database error');
    });
  });

  describe('getStatus', () => {
    it('should return container status', async () => {
      // Arrange
      const containerId = 'c123456';
      const status = 'VERIFIED';
      
      mockDetermineUseCase.execute.mockResolvedValue(status);
      
      // Act
      const result = await controller.getStatus(containerId);
      
      // Assert
      expect(result).toEqual({ id: containerId, estado: status });
      expect(mockDetermineUseCase.execute).toHaveBeenCalledWith(containerId);
    });

    it('should propagate errors from the use case', async () => {
      // Arrange
      const containerId = 'c123456';
      const error = new Error('Container not found');
      
      mockDetermineUseCase.execute.mockRejectedValue(error);
      
      // Act & Assert
      await expect(controller.getStatus(containerId)).rejects.toThrow('Container not found');
    });
  });

  describe('getVerified', () => {
    it('should return list of verified containers', async () => {
      // Arrange
      const verifiedContainers = [
        { id: 'c123456', state: 'operational' },
        { id: 'c789012', state: 'operational' }
      ];
      
      mockVerifiedUseCase.execute.mockResolvedValue(verifiedContainers);
      
      // Act
      const result = await controller.getVerified();
      
      // Assert
      expect(result).toEqual(verifiedContainers);
      expect(mockVerifiedUseCase.execute).toHaveBeenCalled();
    });

    it('should return empty array when no verified containers exist', async () => {
      // Arrange
      mockVerifiedUseCase.execute.mockResolvedValue([]);
      
      // Act
      const result = await controller.getVerified();
      
      // Assert
      expect(result).toEqual([]);
    });

    it('should propagate errors from the use case', async () => {
      // Arrange
      const error = new Error('Database error');
      mockVerifiedUseCase.execute.mockRejectedValue(error);
      
      // Act & Assert
      await expect(controller.getVerified()).rejects.toThrow('Database error');
    });
  });
});