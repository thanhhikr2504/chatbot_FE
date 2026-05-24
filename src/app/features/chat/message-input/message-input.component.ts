import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { LoadingDotsComponent } from '../../../shared/components/loading-dots/loading-dots.component';

const MAX_LENGTH = 4000;
const MAX_ROWS = 6;
const LINE_HEIGHT_PX = 22;

@Component({
  selector: 'app-message-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, LoadingDotsComponent],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.scss'
})
export class MessageInputComponent {
  @Input() streaming = false;
  @Output() send = new EventEmitter<string>();

  @ViewChild('textarea') textarea?: ElementRef<HTMLTextAreaElement>;

  readonly value = signal('');
  readonly maxLength = MAX_LENGTH;

  get charCount(): number {
    return this.value().length;
  }

  get canSend(): boolean {
    return !this.streaming && this.value().trim().length > 0;
  }

  onInput(text: string): void {
    this.value.set(text);
    this.autoResize();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      this.submit();
    }
  }

  submit(): void {
    if (!this.canSend) return;
    const text = this.value().trim();
    this.send.emit(text);
    this.value.set('');
    queueMicrotask(() => this.autoResize());
  }

  private autoResize(): void {
    const el = this.textarea?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = MAX_ROWS * LINE_HEIGHT_PX + 16;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }
}
