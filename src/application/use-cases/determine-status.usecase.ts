import { Inject, Injectable } from '@nestjs/common';
import { IContainerRepository } from '../../domain/ports/container.repository';
import { IContainerRepositoryToken } from '../../domain/tokens';
import { ContainerEvent } from '../../domain/entities/container.entity';

@Injectable()
export class DetermineStatusUseCase {
  constructor(
    @Inject(IContainerRepositoryToken)
    private readonly repo: IContainerRepository
  ) {}

  async execute(containerId: string): Promise<string> {
    const events: ContainerEvent[] = await this.repo.getEventsByContainer(containerId);

    const stateCount = events.reduce((acc, event) => {
      acc[event.state] = (acc[event.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [state, count] of Object.entries(stateCount)) {
      if (count >= 3) return state;
    }

    return 'unknown';
  }
}
