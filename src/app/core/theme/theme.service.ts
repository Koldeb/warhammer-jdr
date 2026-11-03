import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

/** Doit correspondre au script d'index.html qui applique le thème avant le démarrage d'Angular. */
const STORAGE_KEY = 'wjdr-theme';

/** Couleur de la barre du navigateur mobile pour chaque thème. */
const THEME_COLORS: Record<Theme, string> = { light: '#ffffff', dark: '#0a0a0a' };

/**
 * Thème clair (blanc / bleu) ou sombre (noir / jaune).
 * Applique la classe .dark sur <html>, mémorise le choix et suit par défaut la préférence système.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly theme = signal<Theme>(this.initialTheme());
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => {
      const theme = this.theme();
      this.document.documentElement.classList.toggle('dark', theme === 'dark');
      this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
      storage()?.setItem(STORAGE_KEY, theme);
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private initialTheme(): Theme {
    const stored = storage()?.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    const prefersDark = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
}

function storage(): Storage | undefined {
  return typeof localStorage === 'undefined' ? undefined : localStorage;
}
