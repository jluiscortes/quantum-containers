import { Inject, Injectable } from '@nestjs/common';
import { IContainerRepository } from '../../domain/ports/container.repository';
import { IContainerRepositoryToken } from '../../domain/tokens';

@Injectable()
export class GetVerifiedContainersUseCase {
  constructor(
    @Inject(IContainerRepositoryToken)
    private readonly repo: IContainerRepository
  ) {}

  async execute(): Promise<{ id: string; state: string }[]> {
    return await this.repo.getVerifiedContainers();
  }
}
