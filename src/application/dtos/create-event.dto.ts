import { IsString, IsIn, IsISO8601 } from 'class-validator';
import { ContainerState } from '../../domain/entities/container.entity';

export class CreateEventDto {
  @IsString()
  containerId: string;

  @IsIn(['operational', 'damaged', 'unknown'])
  state: ContainerState;

  @IsISO8601()
  timestamp: string;

  @IsString()
  source: string;
}
