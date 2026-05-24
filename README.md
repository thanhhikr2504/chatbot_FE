# Chatbot Frontend

Production-ready chatbot frontend built with **Angular 18** (standalone + signals), **Angular Material**, **Tailwind CSS**, **NgRx Signals Store**, **SignalR**, and **JWT auth**.

## Features

- 🔐 JWT authentication (login, register) with HTTP interceptor and route guards
- 💬 Real-time message streaming via SignalR (token-by-token rendering with animated cursor)
- 📋 Conversation list with relative timestamps, skeleton loaders, hover-delete
- 🎨 Dark themed UI (`#0f1117` base, purple accent `#7f77dd`) — Inter font
- 📝 Markdown rendering with `marked` + `highlight.js` syntax highlighting and per-block copy
- 📱 Responsive — sidebar collapses to drawer below 768px
- 🚦 OnPush change detection everywhere, `takeUntilDestroyed` for subscriptions
- ⚙️ NgRx Signal Store for chat state (conversations, messages, streaming, errors)
- 🔁 SignalR auto-reconnect with exponential backoff + jitter

## Stack

| Layer          | Tech                                                       |
| -------------- | ---------------------------------------------------------- |
| Framework      | Angular 18 standalone components, signals                  |
| UI             | Angular Material + Tailwind CSS                            |
| State          | `@ngrx/signals` (Signal Store)                             |
| Realtime       | `@microsoft/signalr`                                       |
| HTTP           | `HttpClient` + Bearer interceptor                          |
| Markdown       | `marked` + `highlight.js`                                  |
| Forms          | Reactive Forms with sync + async validators                |
| Routing        | Lazy-loaded feature routes + canActivate guards            |
| Lint / Format  | ESLint + Prettier                                          |

## Project Structure

```
src/app/
├── core/                        # Singleton services, guards, interceptors
│   ├── auth/  (auth.service, auth.guard, auth.interceptor)
│   ├── signalr/  (signalr.service)
│   └── api/  (api.service)
├── shared/
│   ├── components/  (markdown-renderer, loading-dots)
│   ├── pipes/  (time-ago.pipe)
│   └── models/  (User, AuthResponse, Conversation, Message…)
├── features/
│   ├── auth/  (login, register)
│   └── chat/  (chat-shell, conversation-list, chat-window, message-bubble, message-input, store/chat.store)
├── app.routes.ts
├── app.config.ts
└── app.component.ts
```

## Setup

```bash
# install deps
npm install

# dev server (http://localhost:4200)
npm start

# production build
npm run build

# unit tests
npm test

# lint + format
npm run lint
npm run format
```

## Environment

Edit `src/environments/environment.ts` (dev) and `src/environments/environment.prod.ts` (prod):

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  signalRUrl: 'http://localhost:5000/hubs/chat'
};
```

## Backend API contract

The frontend expects this HTTP API:

| Method | Path                                         | Body                          | Returns         |
| ------ | -------------------------------------------- | ----------------------------- | --------------- |
| POST   | `/api/auth/login`                            | `{ email, password }`         | `AuthResponse`  |
| POST   | `/api/auth/register`                         | `{ email, password }`         | `AuthResponse`  |
| GET    | `/api/conversations`                         | —                             | `Conversation[]`|
| POST   | `/api/conversations`                         | `{ title? }`                  | `Conversation`  |
| DELETE | `/api/conversations/:id`                     | —                             | 204             |
| GET    | `/api/conversations/:id/messages`            | —                             | `Message[]`     |

`AuthResponse = { token: string; user: User }` where `token` is a JWT.

### SignalR hub (`/hubs/chat`)

Client invokes:

- `SendMessage({ conversationId, content })`
- `JoinConversation(conversationId)`
- `LeaveConversation(conversationId)`

Server pushes:

- `ReceiveToken({ conversationId, token })` — partial token (streamed)
- `MessageComplete(message)` — finalised assistant message
- `Error(message)` — server-side error string

The SignalR access token is read from `localStorage` via `accessTokenFactory`.

## State management — `ChatStore`

```ts
state {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Message[]
  isLoadingConversations / isLoadingMessages / isSending / isStreaming: boolean
  streamingContent: string          // accumulates SignalR tokens live
  error: string | null
}
```

Methods: `loadConversations`, `createConversation`, `selectConversation`, `loadMessages`, `sendMessage`, `appendStreamToken`, `finalizeStreamedMessage`, `cancelStream`, `deleteConversation`, `reset`.

Computed: `activeConversation`, `sortedMessages`, `hasConversations`.

SignalR side-effects are wired up in `withHooks.onInit` and torn down in `onDestroy`.

## Authentication flow

1. User submits login/register form → `AuthService.login()` posts to `/api/auth/...`.
2. Response token is decoded (`atob` JWT payload) and stored in `localStorage` under `chatbot.token`.
3. `AuthInterceptor` attaches `Authorization: Bearer <token>` to every request.
4. On `401`, interceptor logs out and redirects to `/login?returnUrl=...`.
5. `authGuard` blocks `/chat` for anonymous users; `guestGuard` blocks `/login` and `/register` for logged-in users.
6. `AuthService.isAuthenticated()` is a `Signal<boolean>` that also checks JWT `exp`.

## Styling

- **Tailwind** (`tailwind.config.js`) extends the design tokens (`background`, `surface`, `accent`, etc.) so utility classes match Material overrides.
- **Material** custom theme defined in `src/styles/styles.scss` via `mat.theme(...)` with a purple primary palette and dark `theme-type`.
- Inter font is preloaded from Google Fonts in `index.html`.

## Mobile responsiveness

- `BreakpointObserver` watches `Breakpoints.Handset` / `Breakpoints.Small`; below 768px the sidenav switches to `mode="over"` and the toolbar exposes a hamburger toggle.

## Production checklist

- [x] OnPush change detection on every component
- [x] Lazy-loaded routes for `/login`, `/register`, `/chat`
- [x] Global `ErrorHandler` surfaces errors via MatSnackBar
- [x] `takeUntilDestroyed` for all subscriptions
- [x] DomSanitizer used for rendered Markdown
- [x] Skeleton loaders for conversation list + message list

## License

MIT
