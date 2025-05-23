import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ContainerController } from './interfaces/http/container.controller';

import { SaveEventUseCase } from './application/use-cases/save-event.usecase';
import { DetermineStatusUseCase } from './application/use-cases/determine-status.usecase';
import { GetVerifiedContainersUseCase } from './application/use-cases/get-verified-containers.usecase';

import { MongoContainerRepository } from './infrastructure/mongodb/container.repository.impl';

import { ContainerEventSchema } from './infrastructure/mongodb/schemas/container-event.schema';

import { SnsAlertPublisher } from './infrastructure/sns/sns-alert.publisher';
import { CustomLoggerService } from './infrastructure/logging/logger.service';

import * as Joi from 'joi';
import { CONTAINER_REPOSITORY } from './domain/ports/container.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      //envFilePath: `.env.${process.env.NODE_ENV ?? 'dev'}`,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'prd', 'test').default('development'),
        MONGO_URI: Joi.string().required(),
        PORT: Joi.number().default(3000),
        SNS_ALERT_TOPIC_ARN: Joi.string().required(),
        ERROR_LOG_BUCKET: Joi.string().required(),
      }),
      validationOptions: {
        abortEarly: true,
      },
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        connectionFactory: (connection) => {
          connection.on('connected', () => {
            console.log('MongoDB connected');
          });
          connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
          });
          return connection;
        },
      }),
    }),

    MongooseModule.forFeature([
      { name: 'ContainerEvent', schema: ContainerEventSchema },
    ]),
  ],
  controllers: [ContainerController],
  providers: [
    // Use cases
    SaveEventUseCase,
    DetermineStatusUseCase,
    GetVerifiedContainersUseCase,

    // Infraestructura
    SnsAlertPublisher,
    CustomLoggerService,

    // Repositorio
    {
      provide: CONTAINER_REPOSITORY,
      useClass: MongoContainerRepository,
    },
  ],
})
export class AppModule {}
