import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IContainerRepository } from '../../domain/ports/container.repository';
import { ContainerEvent } from '../../domain/entities/container.entity';
import { ContainerEventDocument } from './types';

@Injectable()
export class MongoContainerRepository implements IContainerRepository, OnModuleInit {
  constructor(
    @InjectModel('ContainerEvent')
    private readonly containerEventModel: Model<ContainerEventDocument>
  ) {}

  async onModuleInit() {
    await this.createIndexes();
  }

  private async createIndexes() {
    // único para evitar duplicados de eventos por containerId y timestamp
    await this.containerEventModel.collection.createIndex({ containerId: 1 });

    // compuesto para consultas que filtran por containerId y state
    await this.containerEventModel.collection.createIndex({ containerId: 1, state: 1 });

    // for la agregación (si hay muchas consultas de contenedores verificados)
    await this.containerEventModel.collection.createIndex({ containerId: 1, state: 1, source: 1 });

    // for ordenar eventos por fecha
    await this.containerEventModel.collection.createIndex({ containerId: 1, timestamp: -1 });
  }

  async saveEvent(event: ContainerEvent): Promise<void> {
    await new this.containerEventModel(event).save();
  }

  async getEventsByContainer(containerId: string): Promise<ContainerEvent[]> {
    return this.containerEventModel.find({ containerId }).exec();
  }

  async getVerifiedContainers(): Promise<{ id: string; state: string }[]> {
    return await this.containerEventModel.aggregate([
      {
        $group: {
          _id: '$containerId',
          estado: { $first: '$state' },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gte: 3 } } },
      { $project: { _id: 0, id: '$_id', state: '$estado' } },
    ]).exec();
  }
}