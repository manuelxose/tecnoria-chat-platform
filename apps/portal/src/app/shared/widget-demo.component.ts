import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import { Component, Inject, Input, OnChanges, PLATFORM_ID, SimpleChanges } from "@angular/core";

type WidgetConfigWindow = Window & typeof globalThis & {
  TalkarisWidgetConfig?: {
    siteKey: string;
    apiBase: string;
    widgetBaseUrl: string;
  };
};

@Component({
  selector: "app-widget-demo",
  standalone: true,
  template: "",
})
export class WidgetDemoComponent implements OnChanges {
  @Input({ required: true }) siteKey = "";
  @Input({ required: true }) apiBase = "";
  @Input({ required: true }) widgetBaseUrl = "";

  private readonly scriptId = "chat-portal-demo-widget-loader";

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    if (!isPlatformBrowser(this.platformId) || !this.siteKey || !this.apiBase || !this.widgetBaseUrl) {
      return;
    }

    this.mountScript();
  }

  private mountScript(): void {
    const win = this.document.defaultView as WidgetConfigWindow | null;
    if (win) {
      win.TalkarisWidgetConfig = {
        siteKey: this.siteKey,
        apiBase: this.apiBase,
        widgetBaseUrl: this.ensureTrailingSlash(this.widgetBaseUrl),
      };
    }

    const existing = this.document.getElementById(this.scriptId);
    if (existing) {
      existing.remove();
    }

    const script = this.document.createElement("script");
    script.id = this.scriptId;
    script.async = true;
    script.src = new URL("embed.js", this.ensureTrailingSlash(this.widgetBaseUrl)).toString();
    script.dataset["siteKey"] = this.siteKey;
    script.dataset["apiBase"] = this.apiBase;
    script.dataset["widgetBaseUrl"] = this.ensureTrailingSlash(this.widgetBaseUrl);
    this.document.body.appendChild(script);
  }

  private ensureTrailingSlash(value: string): string {
    return value.endsWith("/") ? value : `${value}/`;
  }
}
