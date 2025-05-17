import { Controller, Post, Get, Body, Param, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateEventDto } from '../../application/dtos/create-event.dto';
import { SaveEventUseCase } from '../../application/use-cases/save-event.usecase';
import { DetermineStatusUseCase } from '../../application/use-cases/determine-status.usecase';
import { GetVerifiedContainersUseCase } from '../../application/use-cases/get-verified-containers.usecase';
import { ContainerEvent } from '../../domain/entities/container.entity';

@ApiTags('containers')
@Controller('containers')
export class ContainerController {
  constructor(
    private readonly saveUseCase: SaveEventUseCase,
    private readonly determineUseCase: DetermineStatusUseCase,
    private readonly verifiedUseCase: GetVerifiedContainersUseCase
  ) {}

  @Post('events')
  @ApiOperation({ summary: 'Register a new container event' })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Event successfully registered',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Evento registrado correctamente' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid event data' })
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
  @ApiOperation({ summary: 'Get container status by ID' })
  @ApiParam({ name: 'id', description: 'Container ID', example: 'c123456' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Container status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'c123456' },
        estado: { type: 'string', example: 'damaged' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Container not found' })
  async getStatus(@Param('id') id: string) {
    const estado = await this.determineUseCase.execute(id);
    return { id, estado };
  }

  @Get()
  @ApiOperation({ summary: 'Get all verified containers' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'List of all verified containers',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'c123456' },
          currentState: { type: 'string', example: 'damaged' },
          isVerified: { type: 'boolean', example: true },
          lastUpdated: { type: 'string', format: 'date-time', example: '2023-08-15T14:30:00Z' }
        }
      }
    }
  })
  async getVerified() {
    return await this.verifiedUseCase.execute();
  }
}