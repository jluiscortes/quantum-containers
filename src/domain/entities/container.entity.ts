export type ContainerState = 'operational' | 'damaged' | 'unknown';

export class ContainerEvent {
  constructor(
    public readonly containerId: string,
    public readonly state: ContainerState,
    public readonly timestamp: Date,
    public readonly source: string
  ) {}
}
