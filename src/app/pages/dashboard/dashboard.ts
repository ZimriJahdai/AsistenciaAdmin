import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { StudentInsights } from '../../components/student-insights/student-insights';
import { AttendanceRecord } from '../../models/attendance.model';
import { AuthService } from '../../services/auth';
import { AttendanceService } from '../../services/attendance';

@Component({
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule,
    HlmBadgeImports,
    HlmButtonImports,
    HlmInputImports,
    StudentInsights,
  ],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  protected readonly displayedColumns = ['select', 'student', 'className', 'leaderName', 'phone', 'date', 'location'];
  protected readonly loading = signal(true);
  protected readonly deleting = signal(false);
  protected readonly error = signal('');
  protected readonly query = signal('');
  protected readonly selectedDate = signal('');
  protected readonly selectedIds = signal<Set<string>>(new Set<string>());
  protected readonly records = signal<AttendanceRecord[]>([]);

  protected readonly filteredRecords = computed(() => {
    const search = this.query().trim().toLowerCase();
    const date = this.selectedDate();

    return this.records().filter((record) => {
      const matchesSearch = !search || [
        record.fullName,
        record.className,
        record.leaderName,
        record.phone,
        record.comment,
      ]
        .join(' ')
        .toLowerCase()
        .includes(search);

      const matchesDate = !date || this.formatDateInputValue(record.createdAt) === date;

      return matchesSearch && matchesDate;
    });
  });

  protected readonly totalToday = computed(() => {
    const today = new Date().toDateString();
    return this.records().filter((record) => new Date(record.createdAt).toDateString() === today).length;
  });

  protected readonly totalGroups = computed(() => new Set(this.records().map((record) => record.className)).size);

  protected readonly allFilteredSelected = computed(() => {
    const filteredRecords = this.filteredRecords();

    return Boolean(filteredRecords.length) && filteredRecords.every((record) => this.selectedIds().has(record._id));
  });

  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  protected loadRecords(): void {
    this.loading.set(true);
    this.error.set('');

    this.attendanceService.getRecords().subscribe({
      next: (records) => {
        this.records.set(records);
        this.loading.set(false);
      },
      error: (error) => {
        if (error?.status === 401) {
          this.error.set('Tu sesión no es válida. Cierra sesión e ingresa de nuevo.');
        } else {
          this.error.set('No se pudieron cargar las asistencias. Intenta de nuevo.');
        }

        this.loading.set(false);
      },
    });
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected updateSearch(value: string): void {
    this.query.set(value);
  }

  protected updateDate(value: string): void {
    this.selectedDate.set(value);
  }

  protected clearFilters(): void {
    this.query.set('');
    this.selectedDate.set('');
  }

  protected toggleRecord(record: AttendanceRecord, checked: boolean): void {
    const selectedIds = new Set(this.selectedIds());

    if (checked) {
      selectedIds.add(record._id);
    } else {
      selectedIds.delete(record._id);
    }

    this.selectedIds.set(selectedIds);
  }

  protected toggleFilteredRecords(checked: boolean): void {
    const selectedIds = new Set(this.selectedIds());

    for (const record of this.filteredRecords()) {
      if (checked) {
        selectedIds.add(record._id);
      } else {
        selectedIds.delete(record._id);
      }
    }

    this.selectedIds.set(selectedIds);
  }

  protected deleteSelectedRecords(): void {
    const ids = Array.from(this.selectedIds());

    if (!ids.length || this.deleting()) {
      return;
    }

    const confirmed = window.confirm(`Se eliminarán ${ids.length} registro(s). Esta acción no se puede deshacer.`);

    if (!confirmed) {
      return;
    }

    this.deleting.set(true);
    this.error.set('');

    this.attendanceService.deleteRecords(ids).subscribe({
      next: () => {
        const selectedIds = new Set(ids);

        this.records.update((records) => records.filter((record) => !selectedIds.has(record._id)));
        this.selectedIds.set(new Set<string>());
        this.deleting.set(false);
      },
      error: (error) => {
        if (error?.status === 401) {
          this.error.set('Tu sesión no es válida. Cierra sesión e ingresa de nuevo.');
        } else {
          this.error.set('No se pudieron eliminar los registros seleccionados. Intenta de nuevo.');
        }

        this.deleting.set(false);
      },
    });
  }

  protected exportCsv(): void {
    const records = this.filteredRecords();

    if (!records.length) {
      return;
    }

    const headers = [
      'Nombre completo',
      'Clase o grupo',
      'Lider o encargado',
      'Telefono',
      'Comentario',
      'Fecha',
      'Latitud',
      'Longitud',
      'Precision',
      'Google Maps',
    ];

    const rows = records.map((record) => [
      record.fullName,
      record.className,
      record.leaderName,
      record.phone,
      record.comment,
      new Date(record.createdAt).toLocaleString('es-GT'),
      record.location.latitude,
      record.location.longitude,
      record.location.accuracy ?? '',
      `https://www.google.com/maps?q=${record.location.latitude},${record.location.longitude}`,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => this.escapeCsvCell(String(cell))).join(','))
      .join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const suffix = this.selectedDate() || new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `asistencias-${suffix}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected openMaps(record: AttendanceRecord): void {
    const { latitude, longitude } = record.location;
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank', 'noopener,noreferrer');
  }

  private formatDateInputValue(value: string): string {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private escapeCsvCell(value: string): string {
    return `"${value.replaceAll('"', '""')}"`;
  }
}
