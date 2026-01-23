import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { AuthModule } from './auth/auth.module';
import { ClassesModule } from './classes/classes.module';
import { HomeworksModule } from './homeworks/homeworks.module';
import { SubmissionsModule } from './submissions/submissions.module';

const buildRedisConnection = (redisUrl: string) => {
  try {
    const url = new URL(redisUrl);
    const port = url.port ? parseInt(url.port, 10) : 6379;
    return {
      host: url.hostname,
      port,
      username: url.username || undefined,
      password: url.password || undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
};

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        connection: {
          ...buildRedisConnection(config.get<string>('REDIS_URL') || 'redis://localhost:6379'),
        },
      }),
    }),
    AuthModule,
    HealthModule,
    ClassesModule,
    HomeworksModule,
    SubmissionsModule,
    QueueModule,
  ],
})
export class AppModule {}
