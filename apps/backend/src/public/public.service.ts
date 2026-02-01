import { Injectable } from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicOverviewQueryDto } from './dto/public-overview-query.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(query: PublicOverviewQueryDto) {
    const days = query.days ?? 7;
    const cutoff = new Date(Date.now() - days * DAY_MS);

    const [homeworks, submissions, completed] = await this.prisma.$transaction([
      this.prisma.homework.count(),
      this.prisma.submission.count({ where: { createdAt: { gte: cutoff } } }),
      this.prisma.submission.count({
        where: { createdAt: { gte: cutoff }, status: SubmissionStatus.DONE },
      }),
    ]);

    const completionRate = submissions ? completed / submissions : 0;

    return {
      days,
      homeworks,
      submissions,
      completionRate,
      updatedAt: new Date().toISOString(),
    };
  }
}
