import { NextResponse } from 'next/server'

/**
 * Send message endpoint
 * Forwards request to backend API which handles translation automatically
 * Agent writes in Turkish, backend translates to customer's language and sends email
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { conversation_id, content, media } = body

    const hasMedia = Array.isArray(media) && media.length > 0
    if (!conversation_id || (!content && !hasMedia)) {
      return NextResponse.json(
        { error: 'Missing conversation_id or content' },
        { status: 400 }
      )
    }

    const trimmedContent = content ? content.trim() : ""
    const fallbackContent = trimmedContent || (hasMedia ? "Medya" : "")

    // Get backend URL from environment
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    
    // Forward to backend API for translation and email sending
    const response = await fetch(`${backendUrl}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id,
        content: trimmedContent,
        media: hasMedia ? media : []
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }))
      return NextResponse.json(
        { error: errorData.error || 'Failed to send message' },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    // Fetch the created message from Supabase to return full message object
    // (Backend returns only message_id, we need full message for frontend)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (supabaseUrl && supabaseKey && result.message_id) {
      const messageResponse = await fetch(
        `${supabaseUrl}/rest/v1/messages?id=eq.${result.message_id}&select=*`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      )
      
      if (messageResponse.ok) {
        const messages = await messageResponse.json()
        if (messages && messages.length > 0) {
          // Add email_sent status from backend response to the message
          const message = messages[0]
          return NextResponse.json({
            ...message,
            email_sent: result.email_sent || false
          })
        }
      }
    }

    // Fallback: return success response with email_sent from backend
    return NextResponse.json({ 
      id: result.message_id,
      conversation_id,
      sender: 'agent',
      content: fallbackContent,
      media: hasMedia ? media : [],
      is_read: true,
      sent_at: new Date().toISOString(),
      email_sent: result.email_sent || false
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
