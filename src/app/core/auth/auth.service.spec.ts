import { TestBed } from '@angular/core/testing';
import { safeRedirect } from '../../features/login/login.page';
import { AuthService } from './auth.service';

describe('AuthService — démo', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    auth = TestBed.inject(AuthService);
  });

  it('accepte admin / démo et connecte en tant que MJ', () => {
    expect(auth.signInDemo('admin', 'démo')).toBe(true);
    expect(auth.isDemo()).toBe(true);
    expect(auth.isGm()).toBe(true);
  });

  it('tolère la casse, les accents et les espaces', () => {
    expect(auth.signInDemo(' Admin ', 'DEMO')).toBe(true);
  });

  it('refuse de mauvais identifiants', () => {
    expect(auth.signInDemo('admin', 'secret')).toBe(false);
    expect(auth.signInDemo('paul', 'démo')).toBe(false);
    expect(auth.user()).toBeNull();
  });

  it('permet de voir la démo en tant que joueur, puis de la quitter', async () => {
    auth.signInDemo('admin', 'démo');
    auth.impersonate('julie');
    expect(auth.user()?.id).toBe('julie');
    expect(auth.isGm()).toBe(false);

    await auth.signOut();
    expect(auth.user()).toBeNull();
    expect(auth.mode()).toBeNull();
    expect(localStorage.getItem('wjdr-demo-profile')).toBeNull();
  });

  it('restaure la session de démo au rechargement', async () => {
    auth.impersonate('marc');
    TestBed.resetTestingModule();
    const restored = TestBed.inject(AuthService);
    await restored.ready;
    expect(restored.user()?.id).toBe('marc');
  });

  it("signale que Supabase n'est pas configuré tant que environment.ts contient les valeurs d'exemple", async () => {
    expect(auth.supabaseConfigured).toBe(false);
    await expect(auth.signIn('a@b.fr', 'x')).rejects.toThrow();
  });
});

describe('safeRedirect', () => {
  it('garde les chemins internes', () => {
    expect(safeRedirect('/personnages/thorek-gromsson')).toBe('/personnages/thorek-gromsson');
  });

  it('refuse les adresses externes', () => {
    expect(safeRedirect('https://exemple.com')).toBe('/');
    expect(safeRedirect('//exemple.com')).toBe('/');
    expect(safeRedirect(undefined)).toBe('/');
  });
});
