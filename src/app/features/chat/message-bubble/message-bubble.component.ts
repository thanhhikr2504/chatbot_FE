import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Message } from '../../../shared/models';
import { MarkdownRendererComponent } from '../../../shared/components/markdown-renderer/markdown-renderer.component';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MarkdownRendererComponent
  ],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.scss'
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: Message;
  @Input() streaming = false;

  readonly copied = signal(false);

  get isUser(): boolean {
    return this.message.role === 'user';
  }

  copy(): void {
    navigator.clipboard
      .writeText(this.message.content)
      .then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 1500);
      })
      .catch(() => undefined);
  }
}
