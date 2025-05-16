import { Document } from 'mongoose';
import { ContainerEvent } from '../../domain/entities/container.entity';

export type ContainerEventDocument = ContainerEvent & Document;
