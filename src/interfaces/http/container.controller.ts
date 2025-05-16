import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CreateEventDto } from '../../application/dtos/create-event.dto';
import { SaveEventUseCase } from '../../application/use-cases/save-event.usecase';
import { DetermineStatusUseCase } from '../../application/use-cases/determine-status.usecase';
import { GetVerifiedContainersUseCase } from '../../application/use-cases/get-verified-containers.usecase';
import { ContainerEvent } from '../../domain/entities/container.entity';

@Controller('containers')
export class ContainerController {
  constructor(
    private readonly saveUseCase: SaveEventUseCase,
    private readonly determineUseCase: DetermineStatusUseCase,
    private readonly verifiedUseCase: GetVerifiedContainersUseCase
  ) {}

  @Post('events')
  async createEvent(@Body() dto: CreateEventDto) {
    const event = new ContainerEvent(
      dto.containerId,
      dto.state,
      new Date(dto.timestamp),
      dto.source
    );
    await this.saveUseCase.execute(event);
    return { message: 'Evento registrado correctamente' };
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    const estado = await this.determineUseCase.execute(id);
    return { id, estado };
  }

  @Get()
  async getVerified() {
    return await this.verifiedUseCase.execute();
  }
}
