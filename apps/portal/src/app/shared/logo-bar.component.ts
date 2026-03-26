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
  `})
export class LogoBarComponent {}
