import { IsString } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  homeworkId: string;
}
