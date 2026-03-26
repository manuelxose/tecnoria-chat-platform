# AGENTS.md - Swarm Definitions for Taskaris Rebuild

This document defines the specialized swarms managed by Ruflo.

## [ARCHITECTURE SWARM]
- **Leader**: Claude (Strategist)
- **Executor**: Codex
- **Auditor**: Gemini
- **Mission**: Define the new core structure, interfaces, and cross-cutting concerns.
- **Priority**: High

## [BACKEND SWARM]
- **Mission**: Refactor `chat-api` and `ingest-worker` into a modular architecture.
- **Capabilities**: Database schema adjustment, service layer extraction, multi-tenant middleware.
- **Priority**: High

## [FRONTEND SWARM]
- **Mission**: Rebuild `portal` and `widget` with a shared UI package and state management.
- **Capabilities**: React/Next.js, Tailwind (if requested), Component-driven design.
- **Priority**: Medium

## [TESTING/QA SWARM]
- **Mission**: End-to-end testing, unit test coverage, and security hardening.
- **Leader**: Gemini
- **Priority**: Continuous

## agent Registry
- **Orchestrator-01**: Claude-3.7-Sonnet
- **Executor-01**: Codex-v2
- **Auditor-01**: Gemini-2.0-Flash-Thinking

## Resilience & Efficiency Policy
- **Fallback Rule**: If any primary model (Claude/Codex/Gemini) is unavailable, Ruflo will automatically route the task to the next available model.
- **Adaptive Effort**: effort must be proportional to capacity; simpler models focus on high-speed tasks.
- **Token Saving**: Prioritize short prompts and concise responses. Use "Summarize" tools to minimize context overhead.
- **Budgeting**: All tasks must respect the `RUFLO_MAX_TOKENS_LIMIT`.

