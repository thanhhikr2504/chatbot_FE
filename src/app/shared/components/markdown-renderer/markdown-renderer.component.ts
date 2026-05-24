import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
  inject
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Marked } from 'marked';
import hljs from 'highlight.js';

const marked = new Marked({
  gfm: true,
  breaks: true
});

@Component({
  selector: 'app-markdown-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #host
      class="markdown-body text-text-primary leading-relaxed"
      [innerHTML]="rendered"
      (click)="onClick($event)"
    ></div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .markdown-body {
        font-size: 0.95rem;
        word-break: break-word;
      }

      .markdown-body :is(h1, h2, h3, h4, h5, h6) {
        font-weight: 600;
        margin: 1em 0 0.5em;
        color: #f1f5f9;
      }
      .markdown-body h1 { font-size: 1.5rem; }
      .markdown-body h2 { font-size: 1.3rem; }
      .markdown-body h3 { font-size: 1.1rem; }

      .markdown-body p { margin: 0.5em 0; }

      .markdown-body a {
        color: #9089e8;
        text-decoration: underline;
      }

      .markdown-body ul,
      .markdown-body ol {
        margin: 0.5em 0;
        padding-left: 1.5em;
      }

      .markdown-body code {
        background: #1e2130;
        padding: 0.15em 0.4em;
        border-radius: 4px;
        font-size: 0.875em;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
      }

      .markdown-body pre {
        position: relative;
        background: #0c0e14;
        border: 1px solid #1e2130;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        margin: 0.75rem 0;
        overflow-x: auto;
        font-size: 0.85rem;
      }

      .markdown-body pre code {
        background: transparent;
        padding: 0;
        border-radius: 0;
        font-size: inherit;
      }

      .markdown-body pre .copy-code-btn {
        position: absolute;
        top: 6px;
        right: 6px;
        background: #1e2130;
        border: 1px solid #2a2e44;
        color: #cbd5e1;
        font-size: 0.7rem;
        padding: 2px 8px;
        border-radius: 4px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.15s ease, background 0.15s ease;
      }
      .markdown-body pre:hover .copy-code-btn { opacity: 1; }
      .markdown-body pre .copy-code-btn:hover { background: #2a2e44; }
      .markdown-body pre .copy-code-btn.copied { color: #7f77dd; }

      .markdown-body blockquote {
        border-left: 3px solid #7f77dd;
        padding-left: 0.75rem;
        margin: 0.5rem 0;
        color: #8892a4;
      }

      .markdown-body table {
        border-collapse: collapse;
        margin: 0.75rem 0;
        width: 100%;
      }
      .markdown-body th,
      .markdown-body td {
        border: 1px solid #1e2130;
        padding: 0.4rem 0.6rem;
        text-align: left;
      }
      .markdown-body th { background: #181b27; }

      .markdown-body img { max-width: 100%; border-radius: 6px; }
    `
  ]
})
export class MarkdownRendererComponent implements OnChanges, AfterViewInit {
  @Input({ required: true }) content = '';
  @ViewChild('host') host?: ElementRef<HTMLDivElement>;

  private readonly sanitizer = inject(DomSanitizer);
  rendered: SafeHtml = '';

  ngOnChanges(): void {
    this.render();
  }

  ngAfterViewInit(): void {
    this.highlightAll();
  }

  private render(): void {
    const html = marked.parse(this.content ?? '', { async: false }) as string;
    const withButtons = this.injectCopyButtons(html);
    this.rendered = this.sanitizer.bypassSecurityTrustHtml(withButtons);
    queueMicrotask(() => this.highlightAll());
  }

  private injectCopyButtons(html: string): string {
    return html.replace(
      /<pre><code(.*?)>/g,
      '<pre><button type="button" class="copy-code-btn" data-action="copy">Copy</button><code$1>'
    );
  }

  private highlightAll(): void {
    const el = this.host?.nativeElement;
    if (!el) return;
    el.querySelectorAll('pre code').forEach((node) => {
      const code = node as HTMLElement;
      if (code.dataset['highlighted']) return;
      try {
        hljs.highlightElement(code);
        code.dataset['highlighted'] = 'yes';
      } catch {
        /* ignore */
      }
    });
  }

  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target || target.dataset['action'] !== 'copy') return;
    const pre = target.closest('pre');
    const code = pre?.querySelector('code');
    if (!code) return;
    navigator.clipboard
      .writeText(code.textContent ?? '')
      .then(() => {
        const original = target.textContent;
        target.textContent = 'Copied';
        target.classList.add('copied');
        setTimeout(() => {
          target.textContent = original;
          target.classList.remove('copied');
        }, 1500);
      })
      .catch(() => undefined);
  }
}
