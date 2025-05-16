import { ContainerEvent } from '../entities/container.entity';

export interface IContainerRepository {
  saveEvent(event: ContainerEvent): Promise<void>;
  getEventsByContainer(containerId: string): Promise<ContainerEvent[]>;
  getVerifiedContainers(): Promise<{ id: string; state: string }[]>;
}
