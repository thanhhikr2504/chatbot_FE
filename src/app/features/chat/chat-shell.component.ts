import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../core/auth/auth.service';
import { SignalRService } from '../../core/signalr/signalr.service';
import { ChatStore } from './store/chat.store';
import { ConversationListComponent } from './conversation-list/conversation-list.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';

@Component({
  selector: 'app-chat-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    ConversationListComponent,
    ChatWindowComponent
  ],
  templateUrl: './chat-shell.component.html',
  styleUrl: './chat-shell.component.scss'
})
export class ChatShellComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav?: MatSidenav;

  readonly store = inject(ChatStore);
  private readonly auth = inject(AuthService);
  private readonly signalr = inject(SignalRService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);

  readonly isMobile = signal(false);
  readonly currentUser = this.auth.currentUser;

  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.Small])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.isMobile.set(result.matches));

    this.store.loadConversations();
  }

  ngOnDestroy(): void {
    this.signalr.disconnect().catch(() => undefined);
  }

  async newConversation(): Promise<void> {
    await this.store.createConversation();
    if (this.isMobile()) this.sidenav?.close();
  }

  async onSelectConversation(id: string): Promise<void> {
    await this.store.selectConversation(id);
    if (this.isMobile()) this.sidenav?.close();
  }

  onDeleteConversation(id: string): void {
    this.store.deleteConversation(id);
  }

  logout(): void {
    this.signalr.disconnect().catch(() => undefined);
    this.store.reset();
    this.auth.logout();
  }

  toggleSidenav(): void {
    this.sidenav?.toggle();
  }
}
