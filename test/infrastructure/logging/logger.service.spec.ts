import { Test, TestingModule } from '@nestjs/testing';
import { CustomLoggerService } from '../../../src/infrastructure/logging/logger.service';
import * as AWS from 'aws-sdk';

// Create mock functions that we'll use
const mockLogFn = jest.fn();
const mockWarnFn = jest.fn();
const mockErrorFn = jest.fn();
const mockS3PutObjectFn = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue({})
});

// Mock AWS S3
jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    putObject: mockS3PutObjectFn
  }))
}));

// Mock console.Console
jest.mock('console', () => ({
  Console: jest.fn().mockImplementation(() => ({
    log: mockLogFn,
    warn: mockWarnFn,
    error: mockErrorFn
  }))
}));

describe('CustomLoggerService', () => {
  let service: CustomLoggerService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Store original environment variables
    originalEnv = process.env;
    process.env = { ...originalEnv };
    process.env.ERROR_LOG_BUCKET = 'test-error-bucket';
    
    // Create module
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomLoggerService],
    }).compile();

    service = module.get<CustomLoggerService>(CustomLoggerService);
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('persistToS3', () => {
    it('should call S3 putObject with correct parameters', async () => {
      // Arrange
      const message = 'Test message for S3';
      const mockDate = 1234567890;
      jest.spyOn(Date, 'now').mockReturnValue(mockDate);
      
      // Act
      service.error(message);
      
      // Assert
      expect(mockS3PutObjectFn).toHaveBeenCalledWith({
        Bucket: 'test-error-bucket',
        Key: `logs/error-${mockDate}.log`,
        Body: `[ERROR] ${message}\n`,
        ContentType: 'text/plain',
      });
    });
  });
});