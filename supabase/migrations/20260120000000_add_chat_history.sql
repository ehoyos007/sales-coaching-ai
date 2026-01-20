-- Migration: Add chat history tables for conversation persistence
-- Created: 2026-01-20

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  intent TEXT,
  data JSONB,
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_activity ON chat_sessions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_active ON chat_sessions(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(session_id, created_at DESC);

-- Trigger to update updated_at and last_activity_at on chat_sessions
CREATE OR REPLACE FUNCTION update_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_timestamp();

-- Trigger to increment message_count and update last_activity when messages are added
CREATE OR REPLACE FUNCTION update_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET
    message_count = message_count + 1,
    last_activity_at = NOW()
  WHERE session_id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chat_messages_insert ON chat_messages;
CREATE TRIGGER chat_messages_insert
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_on_message();

-- Comment for documentation
COMMENT ON TABLE chat_sessions IS 'Stores chat session metadata for conversation history';
COMMENT ON TABLE chat_messages IS 'Stores individual chat messages for each session';
COMMENT ON COLUMN chat_sessions.session_id IS 'Frontend-generated unique session identifier';
COMMENT ON COLUMN chat_sessions.context IS 'Session context (agent_user_id, call_id, department)';
COMMENT ON COLUMN chat_messages.intent IS 'Classified intent for assistant messages';
COMMENT ON COLUMN chat_messages.data IS 'Structured response data for assistant messages';
COMMENT ON COLUMN chat_messages.token_count IS 'Estimated token count for the message';
