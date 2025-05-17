import { IsString, IsIn, IsISO8601, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContainerState } from '../../domain/entities/container.entity';

export class CreateEventDto {
  @ApiProperty({
    description: 'Container unique identifier',
    example: 'c123456',
    required: true
  })
  @IsString()
  containerId: string;

  @ApiProperty({
    description: 'State of the container',
    example: 'operational',
    enum: ['operational', 'damaged', 'unknown'],
    required: true
  })
  @IsIn(['operational', 'damaged', 'unknown'])
  state: ContainerState;

  @ApiProperty({
    description: 'Timestamp of the event in ISO 8601 format',
    example: '2023-08-15T14:30:00Z',
    required: true
  })
  @IsISO8601()
  timestamp: string;

  @ApiProperty({
    description: 'Source of the event (e.g., SCANNER, MANUAL, API)',
    example: 'SCANNER',
    required: true
  })
  @IsString()
  @IsOptional()
  source: string;
}