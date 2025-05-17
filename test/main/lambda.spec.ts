import { handler } from '../../src/main/lambda';
import { createServer, proxy } from 'aws-serverless-express';
import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';

// Mock dependencies
jest.mock('aws-serverless-express', () => ({
  createServer: jest.fn().mockReturnValue('mockServer'),
  proxy: jest.fn().mockReturnValue({
    promise: 'mockResponse'
  })
}));

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        use: jest.fn(),
        useGlobalInterceptors: jest.fn(),
        useGlobalFilters: jest.fn(),
        init: jest.fn().mockResolvedValue(undefined)
      });
    })
  }
}));

// Required to mock express
jest.mock('express', () => {
  return jest.fn().mockImplementation(() => ({
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn()
  }));
});

describe('Lambda Handler', () => {
  let mockEvent: any;
  let mockContext: Context;

  beforeEach(() => {
    // Reset module cache between tests
    jest.clearAllMocks();
    
    mockEvent = { httpMethod: 'GET', path: '/containers' };
    mockContext = { 
      callbackWaitsForEmptyEventLoop: true,
      functionName: 'testFunction',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:testFunction',
      memoryLimitInMB: '128',
      awsRequestId: '123456',
      logGroupName: '/aws/lambda/testFunction',
      logStreamName: '2023/08/15/[$LATEST]123456',
      getRemainingTimeInMillis: jest.fn().mockReturnValue(5000),
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn() 
    } as unknown as Context;
  });

  it('should create a server on first invocation', async () => {
    // Act
    const response = await handler(mockEvent, mockContext, () => {});

    // Assert
    expect(NestFactory.create).toHaveBeenCalled();
    expect(createServer).toHaveBeenCalled();
    expect(proxy).toHaveBeenCalledWith('mockServer', mockEvent, mockContext, 'PROMISE');
    expect(response).toBe('mockResponse');
  });

  it('should reuse cached server on subsequent invocations', async () => {
    // Act - First invocation
    await handler(mockEvent, mockContext, () => {});
    
    // Reset counters but keep cache
    jest.clearAllMocks();
    
    // Act - Second invocation
    const response = await handler(mockEvent, mockContext, () => {});

    // Assert
    expect(NestFactory.create).not.toHaveBeenCalled(); // Should not create a new server
    expect(createServer).not.toHaveBeenCalled(); // Should not create a new server
    expect(proxy).toHaveBeenCalledWith('mockServer', mockEvent, mockContext, 'PROMISE');
    expect(response).toBe('mockResponse');
  });

  it('should proxy the event to the server', async () => {
    // Arrange
    const customEvent = { 
      httpMethod: 'POST', 
      path: '/containers/events',
      body: JSON.stringify({ containerId: 'c123456' })
    };
    
    // Act
    await handler(customEvent, mockContext, () => {});

    // Assert
    expect(proxy).toHaveBeenCalledWith('mockServer', customEvent, mockContext, 'PROMISE');
  });
});