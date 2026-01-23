import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HomeworksController } from './homeworks.controller';
import { HomeworksService } from './homeworks.service';

@Module({
  imports: [PrismaModule],
  controllers: [HomeworksController],
  providers: [HomeworksService],
})
export class HomeworksModule {}
