import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IContainerRepository } from '../../domain/ports/container.repository';
import { ContainerEvent } from '../../domain/entities/container.entity';
import { ContainerEventDocument } from './types';

@Injectable()
export class MongoContainerRepository implements IContainerRepository {
  constructor(
    @InjectModel('ContainerEvent')
    private readonly containerEventModel: Model<ContainerEventDocument>
  ) {}

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
