import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { RetentionController } from './retention.controller';
import { RetentionService } from './retention.service';

@Module({
  imports: [ConfigModule, PrismaModule, StorageModule],
  controllers: [RetentionController],
  providers: [RetentionService],
  exports: [RetentionService],
})
export class RetentionModule {}
