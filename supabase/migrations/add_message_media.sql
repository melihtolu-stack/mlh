-- Migration: Add media support to messages
-- Adds media JSONB column for attachments

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS media JSONB;

COMMENT ON COLUMN messages.media IS 'List of media attachments for the message';
