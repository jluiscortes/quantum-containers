import { ContainerEvent, ContainerState } from '../../../src/domain/entities/container.entity';

describe('ContainerEvent', () => {
  it('should create a valid container event', () => {
    // Arrange
    const containerId = 'c123456';
    const state = 'operational' as ContainerState;
    const timestamp = new Date();
    const source = 'SCANNER';

    // Act
    const event = new ContainerEvent(containerId, state, timestamp, source);

    // Assert
    expect(event.containerId).toBe(containerId);
    expect(event.state).toBe(state);
    expect(event.timestamp).toBe(timestamp);
    expect(event.source).toBe(source);
  });
});