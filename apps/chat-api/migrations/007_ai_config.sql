-- V2: Per-project LLM configuration

ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_config JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN projects.ai_config IS 'LLM config: {provider, model, temperature, maxTokens, systemPromptAdditions}';
