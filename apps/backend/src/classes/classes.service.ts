import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/auth.types';
import { CreateClassDto } from './dto/create-class.dto';
import { ImportStudentsDto, StudentInputDto } from './dto/import-students.dto';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async createClass(dto: CreateClassDto, user: AuthUser) {
    let teacherRelation: { connect: { id: string } } | undefined;

    if (user.role === Role.TEACHER) {
      teacherRelation = { connect: { id: user.id } };
    } else if (dto.teacherId) {
      teacherRelation = { connect: { id: dto.teacherId } };
    }

    return this.prisma.class.create({
      data: {
        name: dto.name,
        grade: dto.grade,
        ...(teacherRelation ? { teachers: teacherRelation } : {}),
      },
    });
  }

  async listClasses(user: AuthUser) {
    if (user.role === Role.ADMIN) {
      return this.prisma.class.findMany({
        include: { teachers: { select: { id: true, name: true, account: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === Role.TEACHER) {
      return this.prisma.class.findMany({
        where: { teachers: { some: { id: user.id } } },
        include: { teachers: { select: { id: true, name: true, account: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    throw new ForbiddenException('Only teacher or admin can list classes');
  }

  async updateTeachers(classId: string, teacherIds: string[], user: AuthUser) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can update teachers');
    }

    const klass = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!klass) {
      throw new NotFoundException('Class not found');
    }

    const uniqueIds = Array.from(new Set(teacherIds || []));
    if (uniqueIds.length) {
      const teachers = await this.prisma.user.findMany({
        where: { id: { in: uniqueIds }, role: Role.TEACHER },
        select: { id: true },
      });
      if (teachers.length !== uniqueIds.length) {
        throw new BadRequestException('Invalid teacher selection');
      }
    }

    return this.prisma.class.update({
      where: { id: classId },
      data: {
        teachers: {
          set: uniqueIds.map((id) => ({ id })),
        },
      },
      include: { teachers: { select: { id: true, name: true, account: true } } },
    });
  }

  private parseStudentText(text: string): StudentInputDto[] {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const result: StudentInputDto[] = [];

    for (const line of lines) {
      const parts = line.split(/[\t,，\s]+/).filter(Boolean);
      if (parts.length === 0) continue;

      let account: string | undefined;
      let name: string | undefined;

      if (parts.length === 1) {
        name = parts[0];
        account = this.generateAccountFromName(name);
      } else if (parts.length === 2) {
        const [part1, part2] = parts;
        if (this.looksLikeAccount(part1) && !this.looksLikeAccount(part2)) {
          account = part1;
          name = part2;
        } else if (!this.looksLikeAccount(part1) && this.looksLikeAccount(part2)) {
          name = part1;
          account = part2;
        } else {
          account = part1;
          name = part2;
        }
      } else {
        account = parts[0];
        name = parts.slice(1).join(' ');
      }

      if (account && name) {
        result.push({ account: account.trim(), name: name.trim() });
      }
    }

    return result;
  }

  private generateAccountFromName(name: string): string {
    const pinyin = require('pinyin');
    const nameWithoutSpaces = name.replace(/\s+/g, '');
    const pinyinArray = pinyin(nameWithoutSpaces, { style: 'normal' });
    return pinyinArray.map((item: string[]) => item[0]).join('');
  }

  private looksLikeAccount(str: string): boolean {
    return /^[a-zA-Z0-9_]+$/.test(str);
  }

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

    throw new ForbiddenException('Only teacher or admin can access class');
  }

  async importStudents(classId: string, dto: ImportStudentsDto, user: AuthUser) {
    await this.ensureClassAccess(classId, user);

    const students = [
      ...(dto.students || []),
      ...(dto.text ? this.parseStudentText(dto.text) : []),
    ];

    if (students.length === 0) {
      throw new BadRequestException('No students provided');
    }

    const defaultPassword = dto.defaultPassword || '123456';

    const studentIds: string[] = [];
    const result = {
      total: students.length,
      created: [] as Array<{ account: string; name: string }>,
      existing: [] as Array<{ account: string; name: string }>,
      failed: [] as Array<{ account: string; name: string; error: string }>,
      enrolled: 0,
    };

    for (const student of students) {
      try {
        const existing = await this.prisma.user.findUnique({
          where: { account: student.account },
        });

        if (existing) {
          studentIds.push(existing.id);
          result.existing.push({ account: student.account, name: student.name });
          continue;
        }

        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        const created = await this.prisma.user.create({
          data: {
            account: student.account,
            name: student.name,
            role: Role.STUDENT,
            passwordHash,
          },
        });
        studentIds.push(created.id);
        result.created.push({ account: student.account, name: student.name });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.failed.push({ account: student.account, name: student.name, error: errorMessage });
      }
    }

    const enrollmentData = studentIds.map((studentId) => ({
      classId,
      studentId,
    }));

    const enrollments = await this.prisma.enrollment.createMany({
      data: enrollmentData,
      skipDuplicates: true,
    });

    result.enrolled = enrollments.count;

    return result;
  }

  async listStudents(classId: string, user: AuthUser) {
    await this.ensureClassAccess(classId, user);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { classId },
      include: { student: true },
    });

    return enrollments.map((enrollment) => ({
      id: enrollment.student.id,
      account: enrollment.student.account,
      name: enrollment.student.name,
    }));
  }

  async removeStudent(classId: string, studentId: string, user: AuthUser) {
    await this.ensureClassAccess(classId, user);
    const result = await this.prisma.enrollment.deleteMany({
      where: { classId, studentId },
    });
    return { removed: result.count };
  }
}
