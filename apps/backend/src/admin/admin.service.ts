import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SystemConfigService } from '../system-config/system-config.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { AdminUsageQueryDto } from './dto/admin-usage-query.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

type LlmConfig = {
  providerName?: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  cheaperModel?: string;
  qualityModel?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
};

type OcrConfig = {
  baseUrl?: string;
  timeoutMs?: number;
};

type BudgetConfig = {
  enabled?: boolean;
  dailyCallLimit?: number;
  mode?: 'soft' | 'hard';
};

type HealthStatus = {
  ok: boolean;
  checkedAt: string;
  status?: number;
  latencyMs?: number;
  reason?: string;
  model?: string;
};

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  async getMetrics() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      usersTotal,
      usersStudents,
      usersTeachers,
      usersAdmins,
      classesTotal,
      enrollmentsTotal,
      homeworksTotal,
      submissionsTotal,
      submissionsToday,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({ where: { role: Role.TEACHER } }),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
      this.prisma.class.count(),
      this.prisma.enrollment.count(),
      this.prisma.homework.count(),
      this.prisma.submission.count(),
      this.prisma.submission.count({ where: { createdAt: { gte: startOfDay } } }),
    ]);

    return {
      users: {
        total: usersTotal,
        students: usersStudents,
        teachers: usersTeachers,
        admins: usersAdmins,
      },
      classes: { total: classesTotal },
      enrollments: { total: enrollmentsTotal },
      homeworks: { total: homeworksTotal },
      submissions: { total: submissionsTotal, today: submissionsToday },
      updatedAt: new Date().toISOString(),
    };
  }

  async getUsage(query: AdminUsageQueryDto) {
    const days = query.days ?? 7;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const submissions = await this.prisma.submission.findMany({
      where: { createdAt: { gte: start } },
      select: { status: true, errorCode: true, createdAt: true },
    });

    const dailyMap = new Map<
      string,
      { date: string; total: number; done: number; failed: number; queued: number; processing: number }
    >();
    for (let i = 0; i < days; i += 1) {
      const date = new Date(start.getTime());
      date.setDate(start.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      dailyMap.set(key, {
        date: key,
        total: 0,
        done: 0,
        failed: 0,
        queued: 0,
        processing: 0,
      });
    }

    const errorCounts = new Map<string, number>();
    const summary = { total: 0, done: 0, failed: 0, queued: 0, processing: 0 };

    for (const submission of submissions) {
      const key = submission.createdAt.toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) {
        entry.total += 1;
        if (submission.status === 'DONE') {
          entry.done += 1;
        } else if (submission.status === 'FAILED') {
          entry.failed += 1;
        } else if (submission.status === 'PROCESSING') {
          entry.processing += 1;
        } else if (submission.status === 'QUEUED') {
          entry.queued += 1;
        }
      }

      summary.total += 1;
      if (submission.status === 'DONE') {
        summary.done += 1;
      } else if (submission.status === 'FAILED') {
        summary.failed += 1;
      } else if (submission.status === 'PROCESSING') {
        summary.processing += 1;
      } else if (submission.status === 'QUEUED') {
        summary.queued += 1;
      }

      if (submission.errorCode) {
        errorCounts.set(submission.errorCode, (errorCounts.get(submission.errorCode) || 0) + 1);
      }
    }

    const daily = Array.from(dailyMap.values());
    const errors = Array.from(errorCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { days, summary, daily, errors, updatedAt: new Date().toISOString() };
  }

  async listUsers(query: ListUsersQueryDto) {
    const keyword = query.keyword?.trim();
    const where: {
      role?: Role;
      isActive?: boolean;
      OR?: Array<{ name?: { contains: string }; account?: { contains: string } }>;
    } = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { account: { contains: keyword } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        account: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async createUser(dto: CreateAdminUserDto) {
    const account = dto.account.trim();
    const name = dto.name.trim();

    if (!account || !name) {
      throw new BadRequestException('Account and name are required');
    }

    const existing = await this.prisma.user.findUnique({ where: { account } });
    if (existing) {
      throw new BadRequestException('Account already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        account,
        name,
        role: dto.role ?? Role.STUDENT,
        passwordHash,
        isActive: true,
      },
    });

    return {
      id: user.id,
      account: user.account,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async updateUser(id: string, dto: UpdateAdminUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const name = dto.name?.trim();
    if (dto.name !== undefined && !name) {
      throw new BadRequestException('Name is required');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name } : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    return {
      id: user.id,
      account: user.account,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async resetUserPassword(id: string, dto: ResetUserPasswordDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { id, ok: true };
  }

  async listClassSummaries() {
    const classes = await this.prisma.class.findMany({
      include: {
        teachers: { select: { id: true, name: true, account: true } },
        _count: { select: { enrolls: true, homeworks: true, teachers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return classes.map((klass) => ({
      id: klass.id,
      name: klass.name,
      grade: klass.grade,
      teachers: klass.teachers,
      studentCount: klass._count.enrolls,
      teacherCount: klass._count.teachers,
      homeworkCount: klass._count.homeworks,
      createdAt: klass.createdAt,
    }));
  }

  async getSystemConfig() {
    const [llmConfig, ocrConfig, budgetConfig, llmHealth, ocrHealth] = await Promise.all([
      this.systemConfigService.getValue<LlmConfig>('llm'),
      this.systemConfigService.getValue<OcrConfig>('ocr'),
      this.systemConfigService.getValue<BudgetConfig>('budget'),
      this.systemConfigService.getValue<HealthStatus>('health:llm'),
      this.systemConfigService.getValue<HealthStatus>('health:ocr'),
    ]);

    const resolvedLlm = this.buildLlmConfig(llmConfig);
    const resolvedOcr = this.buildOcrConfig(ocrConfig);
    const resolvedBudget = this.buildBudgetConfig(budgetConfig);

    return {
      llm: resolvedLlm,
      ocr: resolvedOcr,
      budget: resolvedBudget,
      health: {
        llm: llmHealth ?? null,
        ocr: ocrHealth ?? null,
      },
    };
  }

  async updateSystemConfig(dto: UpdateSystemConfigDto) {
    if (dto.llm) {
      const existing = (await this.systemConfigService.getValue<LlmConfig>('llm')) || {};
      const next: LlmConfig = { ...existing, ...dto.llm };

      this.applyTextUpdate(next, 'providerName', dto.llm.providerName);
      this.applyTextUpdate(next, 'baseUrl', dto.llm.baseUrl);
      this.applyTextUpdate(next, 'model', dto.llm.model);
      this.applyTextUpdate(next, 'cheaperModel', dto.llm.cheaperModel);
      this.applyTextUpdate(next, 'qualityModel', dto.llm.qualityModel);

      if (dto.llm.apiKey !== undefined) {
        const trimmed = dto.llm.apiKey.trim();
        if (trimmed) {
          next.apiKey = trimmed;
        } else {
          delete next.apiKey;
        }
      }

      if (dto.llm.maxTokens !== undefined) {
        next.maxTokens = dto.llm.maxTokens;
      }
      if (dto.llm.temperature !== undefined) {
        next.temperature = dto.llm.temperature;
      }
      if (dto.llm.timeoutMs !== undefined) {
        next.timeoutMs = dto.llm.timeoutMs;
      }

      await this.systemConfigService.setValue('llm', this.stripUndefined(next));
    }

    if (dto.ocr) {
      const existing = (await this.systemConfigService.getValue<OcrConfig>('ocr')) || {};
      const next: OcrConfig = { ...existing, ...dto.ocr };
      this.applyTextUpdate(next, 'baseUrl', dto.ocr.baseUrl);
      if (dto.ocr.timeoutMs !== undefined) {
        next.timeoutMs = dto.ocr.timeoutMs;
      }
      await this.systemConfigService.setValue('ocr', this.stripUndefined(next));
    }

    if (dto.budget) {
      const existing = (await this.systemConfigService.getValue<BudgetConfig>('budget')) || {};
      const next: BudgetConfig = { ...existing, ...dto.budget };
      if (dto.budget.enabled !== undefined) {
        next.enabled = dto.budget.enabled;
      }
      if (dto.budget.dailyCallLimit !== undefined) {
        next.dailyCallLimit = dto.budget.dailyCallLimit;
      }
      if (dto.budget.mode !== undefined) {
        next.mode = dto.budget.mode;
      }
      await this.systemConfigService.setValue('budget', this.stripUndefined(next));
    }

    return this.getSystemConfig();
  }

  async testLlmConnection() {
    const checkedAt = new Date().toISOString();
    const config = await this.resolveLlmRuntimeConfig();
    if (!config.baseUrl) {
      const result = { ok: false, reason: 'LLM_BASE_URL is not configured' };
      await this.storeHealthStatus('llm', { ...result, checkedAt });
      return result;
    }
    if (!config.model) {
      const result = { ok: false, reason: 'LLM_MODEL is not configured' };
      await this.storeHealthStatus('llm', { ...result, checkedAt });
      return result;
    }

    const payload: Record<string, unknown> = {
      model: config.model,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 8,
      temperature: 0,
    };

    const startedAt = Date.now();
    const response = await this.fetchWithTimeout(this.resolveChatUrl(config.baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
    }, config.timeoutMs ?? 12000);

    const latencyMs = Date.now() - startedAt;
    if (!response.ok) {
      const result = { ok: false, status: response.status, latencyMs, reason: response.errorText };
      await this.storeHealthStatus('llm', { ...result, checkedAt, model: config.model });
      return result;
    }

    const result = { ok: true, status: response.status, latencyMs, model: config.model };
    await this.storeHealthStatus('llm', { ...result, checkedAt });
    return result;
  }

  async testOcrConnection() {
    const checkedAt = new Date().toISOString();
    const ocrConfig = await this.systemConfigService.getValue<OcrConfig>('ocr');
    const baseUrl = this.normalizeText(ocrConfig?.baseUrl) ||
      this.configService.get<string>('OCR_BASE_URL') ||
      'http://localhost:8000';
    const timeoutMs = ocrConfig?.timeoutMs ??
      Number(this.configService.get<string>('OCR_TIMEOUT_MS') || '10000');
    const startedAt = Date.now();
    const response = await this.fetchWithTimeout(`${baseUrl.replace(/\/$/, '')}/health`, {
      method: 'GET',
    }, timeoutMs);
    const latencyMs = Date.now() - startedAt;
    if (!response.ok) {
      const result = { ok: false, status: response.status, latencyMs, reason: response.errorText };
      await this.storeHealthStatus('ocr', { ...result, checkedAt });
      return result;
    }
    const result = { ok: true, status: response.status, latencyMs };
    await this.storeHealthStatus('ocr', { ...result, checkedAt });
    return result;
  }

  private buildLlmConfig(overrides: LlmConfig | null) {
    const envBaseUrl = this.configService.get<string>('LLM_BASE_URL') || '';
    const envApiKey = this.configService.get<string>('LLM_API_KEY') || '';
    const envModel = this.configService.get<string>('LLM_MODEL') || '';
    const envCheaperModel = this.configService.get<string>('LLM_MODEL_CHEAPER') || '';
    const envQualityModel = this.configService.get<string>('LLM_MODEL_QUALITY') || '';
    const envProviderName =
      this.configService.get<string>('LLM_PROVIDER_NAME') ||
      this.configService.get<string>('LLM_PROVIDER') ||
      'llm';
    const envMaxTokens = Number(this.configService.get<string>('LLM_MAX_TOKENS') || '800');
    const envTemperature = Number(this.configService.get<string>('LLM_TEMPERATURE') || '0.2');
    const envTimeout = Number(this.configService.get<string>('LLM_TIMEOUT_MS') || '20000');

    const providerName = this.normalizeText(overrides?.providerName) || envProviderName;
    const baseUrl = this.normalizeText(overrides?.baseUrl) || envBaseUrl;
    const model = this.normalizeText(overrides?.model) || envModel;
    const cheaperModel = this.normalizeText(overrides?.cheaperModel) || envCheaperModel || undefined;
    const qualityModel = this.normalizeText(overrides?.qualityModel) || envQualityModel || undefined;
    const maxTokens = overrides?.maxTokens ?? envMaxTokens;
    const temperature = overrides?.temperature ?? envTemperature;
    const timeoutMs = overrides?.timeoutMs ?? envTimeout;
    const apiKeyValue = this.normalizeText(overrides?.apiKey) || envApiKey;

    return {
      providerName,
      baseUrl,
      apiKeySet: Boolean(apiKeyValue),
      model,
      cheaperModel,
      qualityModel,
      maxTokens,
      temperature,
      timeoutMs,
    };
  }

  private buildOcrConfig(overrides: OcrConfig | null) {
    const envBaseUrl = this.configService.get<string>('OCR_BASE_URL') || 'http://localhost:8000';
    const envTimeout = Number(this.configService.get<string>('OCR_TIMEOUT_MS') || '10000');

    const baseUrl = this.normalizeText(overrides?.baseUrl) || envBaseUrl;
    const timeoutMs = overrides?.timeoutMs ?? envTimeout;

    return { baseUrl, timeoutMs };
  }

  private buildBudgetConfig(overrides: BudgetConfig | null) {
    const envLimit = Number(this.configService.get<string>('LLM_DAILY_CALL_LIMIT') || '400');
    const envModeRaw = (this.configService.get<string>('BUDGET_MODE') || 'soft').toLowerCase();
    const envMode = envModeRaw === 'hard' ? 'hard' : 'soft';
    const defaultEnabled = Number.isFinite(envLimit) ? envLimit > 0 : false;

    return {
      enabled: overrides?.enabled ?? defaultEnabled,
      dailyCallLimit: overrides?.dailyCallLimit ?? envLimit,
      mode: overrides?.mode ?? envMode,
    };
  }

  private async resolveLlmRuntimeConfig(): Promise<{
    baseUrl: string;
    apiKey?: string;
    model: string;
    timeoutMs?: number;
  }> {
    const overrides = (await this.systemConfigService.getValue<LlmConfig>('llm')) || {};
    const envBaseUrl = this.configService.get<string>('LLM_BASE_URL') || '';
    const envApiKey = this.configService.get<string>('LLM_API_KEY') || '';
    const envModel = this.configService.get<string>('LLM_MODEL') || '';
    const envTimeout = Number(this.configService.get<string>('LLM_TIMEOUT_MS') || '20000');

    const baseUrl = this.normalizeText(overrides.baseUrl) || envBaseUrl;
    const model = this.normalizeText(overrides.model) || envModel;
    const apiKey = this.normalizeText(overrides.apiKey) || envApiKey || undefined;
    const timeoutMs = overrides.timeoutMs ?? envTimeout;

    return { baseUrl, apiKey, model, timeoutMs };
  }

  private resolveChatUrl(baseUrl: string): string {
    const base = baseUrl.replace(/\/$/, '');
    if (base.endsWith('/chat/completions') || base.endsWith('/v1/chat/completions')) {
      return base;
    }
    return `${base}/v1/chat/completions`;
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number,
  ): Promise<{ ok: boolean; status: number; errorText: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) {
        const errorText = await response.text();
        return { ok: false, status: response.status, errorText };
      }
      return { ok: true, status: response.status, errorText: '' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { ok: false, status: 0, errorText: message };
    } finally {
      clearTimeout(timeout);
    }
  }

  private applyTextUpdate<T extends Record<string, unknown>>(
    target: T,
    key: keyof T,
    value?: string,
  ) {
    if (value === undefined) {
      return;
    }
    const trimmed = value.trim();
    if (trimmed) {
      target[key] = trimmed as T[keyof T];
    } else {
      delete target[key];
    }
  }

  private stripUndefined<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
  }

  private normalizeText(value?: string) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : '';
  }

  private async storeHealthStatus(target: 'llm' | 'ocr', status: HealthStatus) {
    try {
      await this.systemConfigService.setValue(`health:${target}`, status);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to store ${target} health status: ${message}`);
    }
  }
}
