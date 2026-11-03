import { TestBed } from '@angular/core/testing';
import characters from '../../core/data/mock/characters.json';
import { Character } from '../../core/models/character.model';
import { CharacterEditorComponent } from './character-editor.component';

describe('CharacterEditorComponent', () => {
  async function setup() {
    const fixture = TestBed.createComponent(CharacterEditorComponent);
    const original = structuredClone(characters[0]) as Character;
    fixture.componentRef.setInput('character', original);
    await fixture.whenStable();
    let saved: Character | undefined;
    fixture.componentInstance.save.subscribe((c) => (saved = c));
    const el = fixture.nativeElement as HTMLElement;
    const button = (label: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent?.includes(label))!;
    return { fixture, el, original, button, saved: () => saved };
  }

  it('émet la fiche modifiée sans toucher à l\'originale', async () => {
    const { fixture, el, original, button, saved } = await setup();
    const name = el.querySelector<HTMLInputElement>('input')!;
    name.value = 'Johann le Brave';
    name.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    button('Enregistrer').click();
    expect(saved()?.name).toBe('Johann le Brave');
    expect(original.name).toBe('Johann Weber');
  });

  it('ignore les lignes ajoutées laissées vides', async () => {
    const { fixture, button, original, saved } = await setup();
    button('Ajouter une compétence').click();
    await fixture.whenStable();
    button('Enregistrer').click();
    expect(saved()?.skills).toHaveLength(original.skills.length);
  });
});
