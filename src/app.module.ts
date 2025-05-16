import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ContainerController } from './interfaces/http/container.controller';
import { SaveEventUseCase } from './application/use-cases/save-event.usecase';
import { DetermineStatusUseCase } from './application/use-cases/determine-status.usecase';
import { GetVerifiedContainersUseCase } from './application/use-cases/get-verified-containers.usecase';
import { MongoContainerRepository } from './infrastructure/mongodb/container.repository.impl';
import { IContainerRepositoryToken } from './domain/tokens';
import { ContainerEventSchema } from './infrastructure/mongodb/schemas/container-event.schema';
import * as Joi from 'joi'; // For validation (install with npm install joi)

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make config available throughout the application
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
      // Validate environment variables
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        MONGO_URI: Joi.string().required(),
        PORT: Joi.number().default(3000),
      }),
      validationOptions: {
        abortEarly: true, // Stop validation on first error
      },
    }),
    
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        // Add additional mongoose options if needed
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
    SaveEventUseCase,
    DetermineStatusUseCase,
    GetVerifiedContainersUseCase,
    {
      provide: IContainerRepositoryToken,
      useClass: MongoContainerRepository,
    },
  ],
})
export class AppModule {}