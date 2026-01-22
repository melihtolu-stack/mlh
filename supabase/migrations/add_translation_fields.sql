-- Migration: Add translation fields to messages table
-- This migration adds fields for storing original content, language detection, and translations

-- Add new columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS original_content TEXT,
ADD COLUMN IF NOT EXISTS original_language TEXT,
ADD COLUMN IF NOT EXISTS translated_content TEXT;

-- Add index for language queries
CREATE INDEX IF NOT EXISTS idx_messages_original_language ON messages(original_language);

-- Update the trigger function to handle translated content
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = COALESCE(NEW.translated_content, NEW.content),
    last_message_at = NEW.sent_at,
    is_read = CASE WHEN NEW.sender = 'agent' THEN true ELSE false END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON COLUMN messages.original_content IS 'Original message content before translation';
COMMENT ON COLUMN messages.original_language IS 'ISO 639-1 language code of the original message (e.g., en, tr, de)';
COMMENT ON COLUMN messages.translated_content IS 'Translated content in Turkish';
