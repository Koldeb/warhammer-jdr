import { Directive, ElementRef, inject } from '@angular/core';

/** Halo qui suit le pointeur sur une carte (.card-link) : met à jour --spot-x / --spot-y. */
@Directive({
  selector: '[appSpotlight]',
  host: { '(pointermove)': 'move($event)' },
})
export class SpotlightDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected move(event: PointerEvent): void {
    const rect = this.el.getBoundingClientRect();
    this.el.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    this.el.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  }
}
