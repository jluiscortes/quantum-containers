import { Inject, Injectable, Logger } from '@nestjs/common';
import { IContainerRepository } from '../../domain/ports/container.repository';
import { IContainerRepositoryToken } from '../../domain/tokens';
import { ContainerEvent } from '../../domain/entities/container.entity';
import { ContainerNotFoundException } from '../../domain/errors/container-not-found.exception';

@Injectable()
export class DetermineStatusUseCase {
  private readonly logger = new Logger(DetermineStatusUseCase.name);

  constructor(
    @Inject(IContainerRepositoryToken)
    private readonly repo: IContainerRepository
  ) {}

  async execute(containerId: string): Promise<string> {
    this.logger.log(`Obteniendo eventos del contenedor: ${containerId}`);

    const events: ContainerEvent[] = await this.repo.getEventsByContainer(containerId);

    if (events.length === 0) {
      this.logger.warn(`No se encontraron eventos para el contenedor ${containerId}`);
      throw new ContainerNotFoundException(containerId);
    }

    const stateCount: Record<string, number> = {};

    for (const event of events) {
      stateCount[event.state] = (stateCount[event.state] || 0) + 1;
    }

    for (const state of Object.keys(stateCount)) {
      if (stateCount[state] >= 3) {
        this.logger.log(`Contenedor ${containerId} tiene quorum para estado: ${state}`);
        return state;
      }
    }

    this.logger.warn(`Contenedor ${containerId} no alcanzó quorum para ningún estado`);
    return 'unknown';
  }
}
