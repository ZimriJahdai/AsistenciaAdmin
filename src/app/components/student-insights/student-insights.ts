import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { AttendanceRecord } from '../../models/attendance.model';

type StudentInsight = {
  id: string;
  fullName: string;
  classNames: string[];
  leaderNames: string[];
  phone: string;
  attendanceCount: number;
  missedCount: number;
  lastAttendance: string;
  comments: AttendanceRecord[];
};

type StudentAccumulator = {
  fullName: string;
  classNames: Set<string>;
  leaderNames: Set<string>;
  phone: string;
  records: AttendanceRecord[];
  attendedDates: Set<string>;
};

@Component({
  imports: [DatePipe, MatIconModule, HlmBadgeImports],
  selector: 'app-student-insights',
  styleUrl: './student-insights.css',
  templateUrl: './student-insights.html',
})
export class StudentInsights {
  @Input({ required: true }) records: AttendanceRecord[] = [];

  protected get insights(): StudentInsight[] {
    const classDates = new Map<string, Set<string>>();
    const students = new Map<string, StudentAccumulator>();

    for (const record of this.records) {
      const date = this.formatDateInputValue(record.createdAt);
      const classKey = this.normalize(record.className);
      const studentKey = this.getStudentKey(record);

      if (!classDates.has(classKey)) {
        classDates.set(classKey, new Set<string>());
      }

      classDates.get(classKey)?.add(date);

      if (!students.has(studentKey)) {
        students.set(studentKey, {
          attendedDates: new Set<string>(),
          classNames: new Set<string>(),
          fullName: record.fullName,
          leaderNames: new Set<string>(),
          phone: record.phone,
          records: [],
        });
      }

      const student = students.get(studentKey);

      if (!student) {
        continue;
      }

      student.records.push(record);
      student.attendedDates.add(date);
      student.classNames.add(record.className || 'Sin grupo');
      student.leaderNames.add(record.leaderName || 'Sin lider');
    }

    return Array.from(students.entries())
      .map(([id, student]) => {
        const expectedDates = new Set<string>();

        for (const className of student.classNames) {
          const dates = classDates.get(this.normalize(className));

          dates?.forEach((date) => expectedDates.add(date));
        }

        const missedCount = Array.from(expectedDates).filter((date) => !student.attendedDates.has(date)).length;
        const sortedRecords = [...student.records].sort(
          (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
        );

        return {
          id,
          attendanceCount: student.records.length,
          classNames: Array.from(student.classNames),
          comments: sortedRecords.filter((record) => Boolean(record.comment?.trim())),
          fullName: student.fullName,
          lastAttendance: sortedRecords[0]?.createdAt ?? '',
          leaderNames: Array.from(student.leaderNames),
          missedCount,
          phone: student.phone,
        };
      })
      .sort((first, second) => {
        if (second.attendanceCount !== first.attendanceCount) {
          return second.attendanceCount - first.attendanceCount;
        }

        return first.fullName.localeCompare(second.fullName, 'es');
      });
  }

  protected trackByStudent(_: number, insight: StudentInsight): string {
    return insight.id;
  }

  protected trackByRecord(_: number, record: AttendanceRecord): string {
    return record._id;
  }

  private getStudentKey(record: AttendanceRecord): string {
    return `${this.normalize(record.fullName)}|${this.normalize(record.phone)}`;
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private formatDateInputValue(value: string): string {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
