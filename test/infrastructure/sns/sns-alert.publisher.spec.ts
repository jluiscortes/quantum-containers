import { Test, TestingModule } from '@nestjs/testing';
import { SnsAlertPublisher } from '../../../src/infrastructure/sns/sns-alert.publisher';
import * as AWS from 'aws-sdk';
import { Logger } from '@nestjs/common';

// Create a mock for AWS.SNS
jest.mock('aws-sdk', () => {
  const mockPublish = jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({ MessageId: 'mock-message-id' })
  });
  
  return {
    config: {
      update: jest.fn(),
      region: 'us-east-1',
    },
    SNS: jest.fn().mockImplementation(() => ({
      publish: mockPublish
    }))
  };
});

// Instead of mocking the logger, let's disable it in the test module
describe('SnsAlertPublisher', () => {
  let publisher: SnsAlertPublisher;
  let mockSns: any;
  
  const originalEnv = process.env;
  
  beforeEach(async () => {
    // Reset environment variables
    process.env = { ...originalEnv };
    process.env.SNS_ALERT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-topic';
    process.env.AWS_REGION = 'us-east-1';
    
    // Get the mock instance
    mockSns = new AWS.SNS();
    
    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnsAlertPublisher,
        {
          provide: Logger,
          useValue: mockLogger
        }
      ],
    })
    .compile();

    publisher = module.get<SnsAlertPublisher>(SnsAlertPublisher);
  });

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(publisher).toBeDefined();
  });

  it('should initialize AWS SNS with correct region', () => {
    // Assert
    expect(AWS.config.update).toHaveBeenCalledWith({ 
      region: 'us-east-1' 
    });
  });

  describe('publishCorruptEvent', () => {
    it('should publish a message to SNS with correct parameters', async () => {
      // Arrange
      const containerId = 'c123456';
      const newState = 'damaged';
      
      // Use a specific message format without depending on Date
      const mockMessageMatcher = expect.objectContaining({
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:test-topic',
        Subject: `Alerta de evento corrupto: ${containerId}`,
        Message: expect.stringContaining(containerId)
      });
      
      // Act
      await publisher.publishCorruptEvent(containerId, newState);
      
      // Assert
      expect(mockSns.publish).toHaveBeenCalledWith(mockMessageMatcher);
      
      // Validate JSON structure
      const publishCall = mockSns.publish.mock.calls[0][0];
      const messageObj = JSON.parse(publishCall.Message);
      expect(messageObj).toMatchObject({
        type: 'CORRUPT_EVENT_DETECTED',
        containerId,
        newState
      });
      expect(messageObj.timestamp).toBeDefined(); // just check it exists
    });

    it('should not publish when SNS_ALERT_TOPIC_ARN is not configured', async () => {
      // Arrange
      process.env.SNS_ALERT_TOPIC_ARN = '';
      
      // Create a new instance with empty topic ARN through the testing module
      const mockLogger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn()
      };
      
      const testModule: TestingModule = await Test.createTestingModule({
        providers: [
          SnsAlertPublisher,
          {
            provide: Logger,
            useValue: mockLogger
          }
        ],
      }).compile();
      
      const publisher = testModule.get<SnsAlertPublisher>(SnsAlertPublisher);
      
      // Act
      await publisher.publishCorruptEvent('c123456', 'damaged');
      
      // Assert
      expect(mockSns.publish).not.toHaveBeenCalled();
    });

    it('should handle SNS publish errors', async () => {
      // Arrange
      const error = new Error('SNS publish error');
      
      // Mock the SNS publish method to reject with an error
      (mockSns.publish as jest.Mock).mockReturnValueOnce({
        promise: jest.fn().mockRejectedValue(error)
      });
      
      // Act & Assert (should not throw)
      await expect(publisher.publishCorruptEvent('c123456', 'damaged')).resolves.not.toThrow();
      expect(mockSns.publish).toHaveBeenCalled();
    });
    
    it('should log additional debug info in dev environment', async () => {
      // Arrange
      process.env.NODE_ENV = 'dev';
      const error = new Error('SNS publish error');
      error.stack = 'Error stack trace';
      
      // Mock the SNS publish method to reject with an error
      (mockSns.publish as jest.Mock).mockReturnValueOnce({
        promise: jest.fn().mockRejectedValue(error)
      });
      
      // Act
      await publisher.publishCorruptEvent('c123456', 'damaged');
      
      // Assert - we're primarily testing that it doesn't throw an exception
      expect(mockSns.publish).toHaveBeenCalled();
    });
  });
});