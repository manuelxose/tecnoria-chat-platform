import { Component } from "@angular/core";

@Component({
  selector: "app-logo-bar",
  standalone: true,
  template: `
    <div class="logo-bar" aria-hidden="true">
      <div class="logo-bar__track">
        <span class="logo-bar__item">OpenAI</span>
        <span class="logo-bar__item">Anthropic</span>
        <span class="logo-bar__item">Google</span>
        <span class="logo-bar__item">Telegram</span>
        <span class="logo-bar__item">Notion</span>
        <span class="logo-bar__item">YouTube</span>
        <span class="logo-bar__item">HubSpot</span>
        <span class="logo-bar__item">Zendesk</span>
        <span class="logo-bar__item">DeepSeek</span>
      </div>
    </div>
  `,
  styles: [`
    .logo-bar {
      overflow: hidden;
      padding: 1.5rem 0;
      background: transparent;
      border-top: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
      border-bottom: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
    }
    .logo-bar__track {
      display: flex;
      gap: 3rem;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
    }
    .logo-bar__item {
      font-size: 0.9rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      opacity: 0.35;
      transition: opacity 0.2s, transform 0.2s;
      cursor: default;
      text-transform: uppercase;
    }
    .logo-bar__item:hover {
      opacity: 0.7;
      transform: scale(1.05);
    }
  `],
})
export class LogoBarComponent {}
