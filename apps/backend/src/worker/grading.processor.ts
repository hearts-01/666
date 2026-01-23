import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, WorkerOptions } from 'bullmq';
import { SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Processor('grading')
export class GradingProcessor extends WorkerHost {
  private readonly logger = new Logger(GradingProcessor.name);
  private readonly concurrency = Number(process.env.WORKER_CONCURRENCY || '5');

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected getWorkerOptions(): WorkerOptions {
    return { concurrency: this.concurrency };
  }

  async process(job: Job<{ submissionId?: string; message?: string; requestedAt?: string }>) {
    if (job.name === 'demo') {
      return this.handleDemo(job);
    }

    if (job.name === 'grading' && job.data.submissionId) {
      return this.handleGrading(job as Job<{ submissionId: string }>);
    }

    this.logger.warn(`Unhandled job ${job.id} (${job.name})`);
    return null;
  }

  private async handleDemo(job: Job<{ message?: string; requestedAt?: string }>) {
    const startedAt = Date.now();
    this.logger.log(`Processing demo job ${job.id} message=${job.data.message || ''}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
    const duration = Date.now() - startedAt;
    this.logger.log(`Completed demo job ${job.id} in ${duration}ms`);
    return { durationMs: duration };
  }

  private async handleGrading(job: Job<{ submissionId: string }>) {
    const startedAt = Date.now();
    const { submissionId } = job.data;

    try {
      await this.prisma.submission.update({
        where: { id: submissionId },
        data: { status: SubmissionStatus.PROCESSING },
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockResult = {
        totalScore: 85,
        dimensionScores: {
          grammar: 17,
          vocabulary: 17,
          structure: 17,
          content: 17,
          coherence: 17,
        },
        errors: [],
        suggestions: {
          low: ['Check subject-verb agreement', 'Avoid repeated words'],
          mid: ['Add more supporting examples'],
          high: ['Improve paragraph transitions'],
        },
        summary: 'Mock grading summary.',
        nextSteps: ['Rewrite introduction', 'Add one more example'],
      };

      await this.prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.DONE,
          ocrText: 'Mock OCR text',
          gradingJson: mockResult,
          totalScore: mockResult.totalScore,
        },
      });

      const duration = Date.now() - startedAt;
      this.logger.log(`Grading job ${job.id} done in ${duration}ms`);
      return { durationMs: duration };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      try {
        await this.prisma.submission.update({
          where: { id: submissionId },
          data: {
            status: SubmissionStatus.FAILED,
            errorCode: 'PROCESSING_ERROR',
            errorMsg: message,
          },
        });
      } catch (updateError) {
        const updateMessage =
          updateError instanceof Error ? updateError.message : 'Unknown update error';
        this.logger.error(`Failed to update submission ${submissionId}: ${updateMessage}`);
      }
      this.logger.error(`Grading job ${job.id} failed: ${message}`);
      throw error;
    }
  }
}
