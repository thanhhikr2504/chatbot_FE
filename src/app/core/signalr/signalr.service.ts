import { Injectable, inject } from '@angular/core';
import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  IRetryPolicy,
  LogLevel,
  RetryContext
} from '@microsoft/signalr';
import { Observable, Subject, firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { Message } from '../../shared/models';

class ExponentialRetryPolicy implements IRetryPolicy {
  nextRetryDelayInMilliseconds(retryContext: RetryContext): number | null {
    const attempt = retryContext.previousRetryCount;
    if (attempt >= 10) return null;
    const base = Math.min(30000, 1000 * 2 ** attempt);
    const jitter = Math.floor(Math.random() * 500);
    return base + jitter;
  }
}

export interface StreamTokenEvent {
  conversationId: string;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private readonly auth = inject(AuthService);
  private connection: HubConnection | null = null;

  private readonly tokenStream$ = new Subject<StreamTokenEvent>();
  private readonly messageComplete$ = new Subject<Message>();
  private readonly error$ = new Subject<string>();
  private readonly connectionState$ = new Subject<HubConnectionState>();

  onTokenReceived(): Observable<StreamTokenEvent> {
    return this.tokenStream$.asObservable();
  }

  onMessageComplete(): Observable<Message> {
    return this.messageComplete$.asObservable();
  }

  onError(): Observable<string> {
    return this.error$.asObservable();
  }

  onConnectionStateChange(): Observable<HubConnectionState> {
    return this.connectionState$.asObservable();
  }

  get state(): HubConnectionState {
    return this.connection?.state ?? HubConnectionState.Disconnected;
  }

  async connect(): Promise<void> {
    if (this.connection && this.connection.state !== HubConnectionState.Disconnected) {
      return;
    }

    this.connection = new HubConnectionBuilder()
      .withUrl(environment.signalRUrl, {
        accessTokenFactory: () => this.auth.getToken() ?? '',
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling
      })
      .withAutomaticReconnect(new ExponentialRetryPolicy())
      .configureLogging(environment.production ? LogLevel.Warning : LogLevel.Information)
      .build();

    this.registerHandlers(this.connection);

    try {
      await this.connection.start();
      this.connectionState$.next(this.connection.state);
    } catch (err) {
      this.error$.next(err instanceof Error ? err.message : 'Không thể kết nối SignalR');
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connection) return;
    try {
      await this.connection.stop();
    } finally {
      this.connectionState$.next(HubConnectionState.Disconnected);
      this.connection = null;
    }
  }

  async sendMessage(conversationId: string, content: string): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke('SendMessage', { conversationId, content });
  }

  async joinConversation(conversationId: string): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke('JoinConversation', conversationId);
  }

  async leaveConversation(conversationId: string): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) return;
    await this.connection.invoke('LeaveConversation', conversationId);
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connection) {
      await this.connect();
      return;
    }
    if (this.connection.state === HubConnectionState.Connected) return;
    if (this.connection.state === HubConnectionState.Connecting) {
      await firstValueFrom(this.connectionState$);
      return;
    }
    await this.connect();
  }

  private registerHandlers(conn: HubConnection): void {
    conn.on('ReceiveToken', (payload: StreamTokenEvent | string, conversationId?: string) => {
      if (typeof payload === 'string') {
        this.tokenStream$.next({ token: payload, conversationId: conversationId ?? '' });
      } else if (payload) {
        this.tokenStream$.next(payload);
      }
    });

    conn.on('MessageComplete', (msg: Message) => this.messageComplete$.next(msg));
    conn.on('ReceiveMessage', (msg: Message) => this.messageComplete$.next(msg));
    conn.on('Error', (message: string) => this.error$.next(message));

    conn.onreconnecting(() => this.connectionState$.next(HubConnectionState.Reconnecting));
    conn.onreconnected(() => this.connectionState$.next(HubConnectionState.Connected));
    conn.onclose((err) => {
      this.connectionState$.next(HubConnectionState.Disconnected);
      if (err) this.error$.next(err.message);
    });
  }
}
