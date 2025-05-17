import { ContainerEvent } from '../entities/container.entity';

export const CONTAINER_REPOSITORY = 'CONTAINER_REPOSITORY';

export interface IContainerRepository {
  saveEvent(event: ContainerEvent): Promise<void>;
  getEventsByContainer(containerId: string): Promise<ContainerEvent[]>;
  getVerifiedContainers(): Promise<{ id: string; state: string }[]>;
}
