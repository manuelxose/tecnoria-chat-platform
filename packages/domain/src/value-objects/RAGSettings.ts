export interface PromptPolicy {
  tone: string;
  outOfScopeMessage: string;
  guardrails: string[];
  disallowPricing: boolean;
}

export interface CTAConfig {
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel: string;
  secondaryUrl: string;
  salesKeywords: string[];
}

export interface WidgetTheme {
  presetKey?: "indigo" | "violet" | "midnight" | "aurora";
  accentColor: string;
  surfaceColor: string;
  textColor: string;
  launcherLabel: string;
}

export interface LeadSinkConfig {
  mode: "webhook" | "email";
  webhookUrl: string;
  secretHeaderName?: string;
}
