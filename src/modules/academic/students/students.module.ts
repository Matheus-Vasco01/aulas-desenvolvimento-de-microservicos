import { StudentService } from "@academic/students/application/services/student.service";
import { STUDENT_REPOSITORY } from "@academic/students/domain/repositories/student-repository.interface";
import { StudentsController } from "@academic/students/infra/controllers/students.controller";
import { DrizzleStudentRepository } from "@academic/students/infra/repositories/drizzle-student.repository";
import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { MessagingModule } from "@messaging/messaging.module";

@Module({
  imports: [SharedModule, MessagingModule],
  controllers: [StudentsController],
  providers: [
    StudentService,
    DrizzleStudentRepository,
    {
      provide: STUDENT_REPOSITORY,
      useExisting: DrizzleStudentRepository,
    },
  ],
})
export class StudentsModule {}
