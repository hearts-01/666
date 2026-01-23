import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, WorkerOptions } from 'bullmq';
import { SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

type OcrResponse = {
  text: string;
  confidence?: number;
};

class OcrError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

@Processor('grading')
export class GradingProcessor extends WorkerHost {
  private readonly logger = new Logger(GradingProcessor.name);
  private readonly concurrency = Number(process.env.WORKER_CONCURRENCY || '5');
  private readonly ocrServiceUrl: string;
  private readonly ocrTimeoutMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    configService: ConfigService,
  ) {
    super();
    this.ocrServiceUrl = configService.get<string>('OCR_SERVICE_URL') || 'http://localhost:8000';
    this.ocrTimeoutMs = Number(configService.get<string>('OCR_TIMEOUT_MS') || '10000');
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

      const submission = await this.prisma.submission.findUnique({
        where: { id: submissionId },
        include: { images: { orderBy: { createdAt: 'asc' } } },
      });

      if (!submission) {
        throw new OcrError('SUBMISSION_NOT_FOUND', 'Submission not found');
      }

      const texts: string[] = [];

      for (const image of submission.images) {
        const imageBuffer = await this.storage.getObject(image.objectKey);
        const base64 = imageBuffer.toString('base64');
        const ocrResult = await this.callOcrWithRetry({
          image_base64: base64,
          preprocess: false,
        });
        if (ocrResult.text?.trim()) {
          texts.push(ocrResult.text.trim());
        }
      }

      const mergedText = texts.join('\n\n').trim();
      if (!mergedText) {
        throw new OcrError('OCR_EMPTY', 'OCR returned empty text');
      }

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
          ocrText: mergedText,
          gradingJson: mockResult,
          totalScore: mockResult.totalScore,
        },
      });

      const duration = Date.now() - startedAt;
      this.logger.log(`Grading job ${job.id} done in ${duration}ms`);
      return { durationMs: duration };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code =
        error instanceof OcrError ? error.code : error instanceof Error ? 'OCR_ERROR' : 'UNKNOWN';
      try {
        await this.prisma.submission.update({
          where: { id: submissionId },
          data: {
            status: SubmissionStatus.FAILED,
            errorCode: code,
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

  private async callOcrWithRetry(payload: {
    image_base64: string;
    preprocess?: boolean;
  }): Promise<OcrResponse> {
    try {
      return await this.callOcr(payload);
    } catch (error) {
      if (error instanceof OcrError && error.code === 'OCR_TIMEOUT') {
        this.logger.warn('OCR timeout, retrying once...');
        return this.callOcr(payload);
      }
      throw error;
    }
  }

  private async callOcr(payload: {
    image_base64: string;
    preprocess?: boolean;
  }): Promise<OcrResponse> {
    const response = await this.fetchWithTimeout(
      `${this.ocrServiceUrl}/ocr`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      this.ocrTimeoutMs,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new OcrError('OCR_ERROR', `OCR service error: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as OcrResponse;
    if (!data.text || !data.text.trim()) {
      throw new OcrError('OCR_EMPTY', 'OCR returned empty text');
    }

    return data;
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new OcrError('OCR_TIMEOUT', 'OCR request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
