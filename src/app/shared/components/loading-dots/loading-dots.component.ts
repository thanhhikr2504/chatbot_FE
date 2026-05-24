import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-dots',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-1.5" [attr.aria-label]="label">
      <span
        class="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-bounce-dot"
        style="animation-delay: -0.32s"
      ></span>
      <span
        class="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-bounce-dot"
        style="animation-delay: -0.16s"
      ></span>
      <span
        class="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-bounce-dot"
      ></span>
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
      }
    `
  ]
})
export class LoadingDotsComponent {
  @Input() label = 'Đang tải';
}
