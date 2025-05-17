import { Inject, Injectable } from '@nestjs/common';
import { IContainerRepository, CONTAINER_REPOSITORY } from '../../domain/ports/container.repository';

@Injectable()
export class GetVerifiedContainersUseCase {
  constructor(
    @Inject(CONTAINER_REPOSITORY)
    private readonly repo: IContainerRepository
  ) {}

  async execute(): Promise<{ id: string; state: string }[]> {
    return await this.repo.getVerifiedContainers();
  }
}
