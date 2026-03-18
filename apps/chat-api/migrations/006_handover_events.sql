-- V1.5 final: handover events (human escalation requests from widget)

CREATE TABLE IF NOT EXISTS handover_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_handover_events_project ON handover_events(project_id);
CREATE INDEX IF NOT EXISTS idx_handover_events_conv ON handover_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_handover_events_status ON handover_events(status) WHERE status = 'pending';
