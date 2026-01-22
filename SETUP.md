# WhatsApp-Style CRM Setup Guide

This guide will help you set up the WhatsApp-style CRM with Next.js and Supabase.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (sign up at https://supabase.com)

## Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details:
   - Name: `mlh-crm` (or any name you prefer)
   - Database Password: Choose a strong password (save it!)
   - Region: Choose the closest region
4. Wait for the project to be created (takes ~2 minutes)

## Step 2: Set Up Database Schema

1. In your Supabase project, go to the **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click "Run" to execute the SQL
5. Verify the tables were created by going to **Table Editor** - you should see:
   - `customers`
   - `conversations`
   - `messages`

## Step 3: Enable Realtime

1. In Supabase dashboard, go to **Database** → **Replication**
2. Enable replication for:
   - `conversations` table
   - `messages` table
3. This allows real-time updates in your frontend

## Step 4: Get API Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")
   - **service_role key** (under "Project API keys" - keep this secret!)

## Step 5: Configure Environment Variables

1. Create a `.env.local` file in the project root (if it doesn't exist)
2. Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Replace the placeholder values with your actual Supabase credentials.

## Step 6: Install Dependencies

```bash
npm install
```

## Step 7: Run the Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Step 8: Test the Setup

### Test Incoming Messages (N8N Webhook)

You can test the incoming webhook endpoint using curl or Postman:

```bash
curl -X POST http://localhost:3000/api/messages/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "name": "Test Customer",
    "email": "test@example.com",
    "content": "Hello, this is a test message",
    "channel": "whatsapp"
  }'
```

This will:
- Create a customer if they don't exist
- Create a conversation if it doesn't exist
- Add the message to the conversation
- The conversation should appear in the sidebar in real-time

### Test Sending Messages

1. Click on a conversation in the sidebar
2. Type a message and click "Gönder" (Send)
3. The message should appear immediately

## API Endpoints

### POST `/api/messages/incoming`
Accepts incoming messages from N8N webhook.

**Request Body:**
```json
{
  "phone": "+1234567890",
  "name": "Customer Name",
  "email": "customer@example.com",
  "content": "Message text",
  "channel": "whatsapp"
}
```

### GET `/api/conversations`
Returns all conversations with customer details, ordered by last message time.

### GET `/api/conversations/[id]/messages`
Returns all messages for a specific conversation and marks them as read.

### POST `/api/messages/send`
Sends a message as an agent.

**Request Body:**
```json
{
  "conversation_id": "uuid",
  "content": "Message text"
}
```

## Database Schema

### customers
- `id` (UUID, Primary Key)
- `name` (TEXT)
- `email` (TEXT, nullable)
- `phone` (TEXT)
- `profile_photo` (TEXT, nullable)
- `created_at`, `updated_at` (Timestamps)

### conversations
- `id` (UUID, Primary Key)
- `customer_id` (UUID, Foreign Key → customers)
- `channel` (TEXT, default: 'whatsapp')
- `last_message` (TEXT, nullable)
- `is_read` (BOOLEAN, default: false)
- `last_message_at` (Timestamp, nullable)
- `created_at`, `updated_at` (Timestamps)

### messages
- `id` (UUID, Primary Key)
- `conversation_id` (UUID, Foreign Key → conversations)
- `sender` (TEXT: 'customer' or 'agent')
- `content` (TEXT)
- `is_read` (BOOLEAN, default: false)
- `sent_at` (Timestamp)
- `created_at` (Timestamp)

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env.local` exists and has all three required variables
- Restart the dev server after adding environment variables

### Realtime not working
- Check that Realtime is enabled in Supabase dashboard (Database → Replication)
- Verify the tables are added to the replication list
- Check browser console for any errors

### Messages not appearing
- Check the browser console for errors
- Verify the API routes are working (check Network tab)
- Ensure the database schema was created correctly

## Next Steps

- Set up authentication if needed (Supabase Auth)
- Customize the UI styling
- Add more features (file attachments, typing indicators, etc.)
- Set up N8N workflow to connect to your WhatsApp Business API
