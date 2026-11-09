import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

/** Doit correspondre au script d'index.html qui applique le thème avant le démarrage d'Angular. */
const STORAGE_KEY = 'wjdr-theme';

/** Couleur de la barre du navigateur mobile pour chaque thème. */
const THEME_COLORS: Record<Theme, string> = { light: '#ffffff', dark: '#09090b' };

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
    this.apply(this.theme());
  }

  /**
   * Bascule le thème. Avec l'API View Transitions, le nouveau thème se révèle en cercle
   * depuis le point cliqué (voir styles.css) ; sinon, il s'applique directement.
   */
  toggle(origin?: { x: number; y: number }): void {
    const next: Theme = this.isDark() ? 'light' : 'dark';
    const root = this.document.documentElement;
    const view = this.document.defaultView;
    const reduceMotion = view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (!this.document.startViewTransition || reduceMotion || !view) {
      this.apply(next);
      return;
    }

    const x = origin?.x ?? view.innerWidth / 2;
    const y = origin?.y ?? 0;
    const radius = Math.hypot(Math.max(x, view.innerWidth - x), Math.max(y, view.innerHeight - y));
    root.style.setProperty('--theme-x', `${x}px`);
    root.style.setProperty('--theme-y', `${y}px`);
    root.style.setProperty('--theme-r', `${radius}px`);
    root.dataset['themeTransition'] = '';

    const transition = this.document.startViewTransition(() => this.apply(next));
    transition.finished.finally(() => delete root.dataset['themeTransition']);
  }

  private apply(theme: Theme): void {
    this.theme.set(theme);
    this.document.documentElement.classList.toggle('dark', theme === 'dark');
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
    storage()?.setItem(STORAGE_KEY, theme);
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
