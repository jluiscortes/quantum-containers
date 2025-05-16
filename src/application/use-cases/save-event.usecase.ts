import { Inject, Injectable, Logger } from '@nestjs/common';
import { IContainerRepository } from '../../domain/ports/container.repository';
import { IContainerRepositoryToken } from '../../domain/tokens';
import { ContainerEvent } from '../../domain/entities/container.entity';
import { SnsAlertPublisher } from '../../infrastructure/sns/sns-alert.publisher';
import { CustomLoggerService } from '../../infrastructure/logging/logger.service';

@Injectable()
export class SaveEventUseCase {
  private readonly logger = new Logger(SaveEventUseCase.name);
  constructor(
    @Inject(IContainerRepositoryToken)
    private readonly repo: IContainerRepository,
    private readonly sns: SnsAlertPublisher,
    private readonly logService: CustomLoggerService
  ) {}

  async execute(event: ContainerEvent): Promise<void> {
    await this.repo.saveEvent(event);
      // Simulación de detección de corrupción
    if (event.state === 'damaged') {
      this.logger.warn(`Evento corrupto detectado en contenedor ${event.containerId}`);

      // Publicar en SNS y guardar log en S3
      await this.sns.publishCorruptEvent(event.containerId, event.state);
      this.logService.error(`Evento corrupto detectado`, JSON.stringify(event))
    }
  }
}
