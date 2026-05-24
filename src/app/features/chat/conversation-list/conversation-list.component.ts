import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

import { Conversation } from '../../../shared/models';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatRippleModule, TimeAgoPipe],
  templateUrl: './conversation-list.component.html',
  styleUrl: './conversation-list.component.scss'
})
export class ConversationListComponent {
  @Input() conversations: Conversation[] = [];
  @Input() activeId: string | null = null;
  @Input() loading = false;

  @Output() newChat = new EventEmitter<void>();
  @Output() selectConversation = new EventEmitter<string>();
  @Output() deleteConversation = new EventEmitter<string>();

  readonly skeletonItems = Array.from({ length: 5 });

  onSelect(id: string): void {
    this.selectConversation.emit(id);
  }

  onDelete(event: Event, id: string): void {
    event.stopPropagation();
    this.deleteConversation.emit(id);
  }

  trackById(_index: number, item: Conversation): string {
    return item.id;
  }
}
