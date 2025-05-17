import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MongoContainerRepository } from '../../../src/infrastructure/mongodb/container.repository.impl';
import { ContainerEvent } from '../../../src/domain/entities/container.entity';

describe('MongoContainerRepository', () => {
  let repository: MongoContainerRepository;
  let mockModel: any;

  beforeEach(async () => {
    // Create a mock for the Mongoose model
    const mockModelFactory = () => ({
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      create: jest.fn(),
      save: jest.fn(),
      exec: jest.fn(),
      aggregate: jest.fn().mockReturnThis(),
    });

    // Create a mock for document instance save method
    const mockDocumentInstance = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    // Create a constructor for the model that returns a mock document
    mockModel = jest.fn().mockImplementation(() => mockDocumentInstance);
    
    // Add static methods to the model
    mockModel.find = jest.fn().mockReturnThis();
    mockModel.findOne = jest.fn().mockReturnThis();
    mockModel.exec = jest.fn();
    mockModel.create = jest.fn();
    mockModel.insertMany = jest.fn();
    mockModel.aggregate = jest.fn().mockReturnThis();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoContainerRepository,
        {
          provide: getModelToken('ContainerEvent'),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<MongoContainerRepository>(MongoContainerRepository);
  });

  describe('saveEvent', () => {
    it('should save a container event to the database', async () => {
      // Arrange
      const event = new ContainerEvent(
        'c123456',
        'operational',
        new Date(),
        'SCANNER'
      );

      // Act
      await repository.saveEvent(event);

      // Assert
      expect(mockModel).toHaveBeenCalledWith(event);
      expect(mockModel.mock.results[0].value.save).toHaveBeenCalled();
    });

    it('should throw an error if saving fails', async () => {
      // Arrange
      const event = new ContainerEvent(
        'c123456',
        'operational',
        new Date(),
        'SCANNER'
      );
      
      // Mock a database error
      mockModel.mockImplementationOnce(() => ({
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      }));

      // Act & Assert
      await expect(repository.saveEvent(event)).rejects.toThrow('Database error');
    });
  });

  describe('getEventsByContainer', () => {
    it('should return events for a specific container', async () => {
      // Arrange
      const containerId = 'c123456';
      const mockEvents = [
        {
          containerId: 'c123456',
          state: 'operational',
          timestamp: new Date(),
          source: 'SCANNER',
        },
        {
          containerId: 'c123456',
          state: 'damaged',
          timestamp: new Date(),
          source: 'MANUAL',
        },
      ];
      
      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvents),
      });

      // Act
      const result = await repository.getEventsByContainer(containerId);

      // Assert
      expect(mockModel.find).toHaveBeenCalledWith({ containerId });
      expect(result).toEqual(mockEvents);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no events exist for a container', async () => {
      // Arrange
      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      // Act
      const result = await repository.getEventsByContainer('nonexistent');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getVerifiedContainers', () => {
    it('should return containers with at least 3 events', async () => {
      // Arrange
      const mockVerifiedContainers = [
        { id: 'c123456', state: 'operational' },
        { id: 'c345678', state: 'damaged' },
      ];
      
      mockModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockVerifiedContainers),
      });

      // Act
      const result = await repository.getVerifiedContainers();

      // Assert
      expect(mockModel.aggregate).toHaveBeenCalled();
      expect(result).toEqual(mockVerifiedContainers);
      expect(result).toHaveLength(2);
      
      // Verify the expected aggregation pipeline format
      const aggregationCall = mockModel.aggregate.mock.calls[0][0];
      expect(aggregationCall).toHaveLength(3);
      
      // Check grouping by containerId
      expect(aggregationCall[0].$group).toBeDefined();
      expect(aggregationCall[0].$group._id).toBe('$containerId');
      
      // Check filtering for 3 or more events
      expect(aggregationCall[1].$match).toBeDefined();
      expect(aggregationCall[1].$match.count.$gte).toBe(3);
      
      // Check projection to the expected format
      expect(aggregationCall[2].$project).toBeDefined();
      expect(aggregationCall[2].$project.id).toBe('$_id');
    });

    it('should return empty array when no containers are verified', async () => {
      // Arrange
      mockModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      // Act
      const result = await repository.getVerifiedContainers();

      // Assert
      expect(result).toEqual([]);
    });
  });
});