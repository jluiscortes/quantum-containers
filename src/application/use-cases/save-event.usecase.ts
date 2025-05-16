import { Inject, Injectable } from '@nestjs/common';
import { IContainerRepository } from '../../domain/ports/container.repository';
import { IContainerRepositoryToken } from '../../domain/tokens';
import { ContainerEvent } from '../../domain/entities/container.entity';

@Injectable()
export class SaveEventUseCase {
  constructor(
    @Inject(IContainerRepositoryToken)
    private readonly repo: IContainerRepository
  ) {}

  async execute(event: ContainerEvent): Promise<void> {
    await this.repo.saveEvent(event);
  }
}
