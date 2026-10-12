import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly themeKey = 'attendance_admin_theme';
  readonly darkMode = signal(true);

  constructor() {
    localStorage.setItem(this.themeKey, 'dark');
    this.applyTheme(true);
  }

  toggleTheme(): void {
    this.darkMode.set(true);
    localStorage.setItem(this.themeKey, 'dark');
    this.applyTheme(true);
  }

  private applyTheme(enabled: boolean): void {
    document.documentElement.classList.toggle('dark', enabled);
  }
}
