import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
  signal
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { ChatStore } from '../store/chat.store';
import { Message } from '../../../shared/models';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { MessageInputComponent } from '../message-input/message-input.component';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MessageBubbleComponent,
    MessageInputComponent
  ],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss'
})
export class ChatWindowComponent implements AfterViewChecked {
  readonly store = inject(ChatStore);

  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;

  private readonly shouldScroll = signal(true);
  private lastMessageCount = 0;
  private lastStreamingLength = 0;
  private userPinnedToBottom = true;

  readonly streamingMessage = signal<Message>({
    id: 'streaming',
    conversationId: '',
    role: 'assistant',
    content: '',
    createdAt: new Date().toISOString()
  });

  readonly skeletonItems = Array.from({ length: 3 });

  constructor() {
    effect(
      () => {
        const messages = this.store.sortedMessages();
        const streamLen = this.store.streamingContent().length;
        const sizeChanged =
          messages.length !== this.lastMessageCount || streamLen !== this.lastStreamingLength;
        this.lastMessageCount = messages.length;
        this.lastStreamingLength = streamLen;
        if (sizeChanged && this.userPinnedToBottom) this.shouldScroll.set(true);

        this.streamingMessage.update((m) => ({
          ...m,
          content: this.store.streamingContent(),
          conversationId: this.store.activeConversationId() ?? ''
        }));
      },
      { allowSignalWrites: true }
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll() && this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll.set(false);
    }
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLDivElement;
    this.userPinnedToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (!this.userPinnedToBottom) this.shouldScroll.set(false);
  }

  send(text: string): void {
    this.userPinnedToBottom = true;
    this.shouldScroll.set(true);
    this.store.sendMessage(text);
  }

  trackById(_index: number, item: Message): string {
    return item.id;
  }

  async startNewChat(): Promise<void> {
    await this.store.createConversation();
  }
}
