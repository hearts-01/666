import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';

@Injectable()
export class HomeworksService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureClassAccess(classId: string, user: AuthUser) {
    if (user.role === Role.ADMIN) {
      const klass = await this.prisma.class.findUnique({ where: { id: classId } });
      if (!klass) {
        throw new NotFoundException('Class not found');
      }
      return klass;
    }

    if (user.role === Role.TEACHER) {
      const klass = await this.prisma.class.findFirst({
        where: { id: classId, teachers: { some: { id: user.id } } },
      });
      if (!klass) {
        throw new ForbiddenException('No access to this class');
      }
      return klass;
    }

    throw new ForbiddenException('Only teacher or admin can access homework');
  }

  async createHomework(dto: CreateHomeworkDto, user: AuthUser) {
    await this.ensureClassAccess(dto.classId, user);
    const dueAt = dto.dueAt ? new Date(dto.dueAt) : undefined;

    return this.prisma.homework.create({
      data: {
        classId: dto.classId,
        title: dto.title,
        desc: dto.desc,
        dueAt,
      },
    });
  }

  async listByClass(classId: string, user: AuthUser) {
    await this.ensureClassAccess(classId, user);
    return this.prisma.homework.findMany({
      where: { classId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForStudent(user: AuthUser) {
    return this.prisma.homework.findMany({
      where: {
        class: {
          enrolls: { some: { studentId: user.id } },
        },
      },
      include: {
        class: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}