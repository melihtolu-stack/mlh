import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()
    
    // First delete all messages in the conversation
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', id)

    if (messagesError) {
      console.error('Error deleting messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to delete messages' },
        { status: 500 }
      )
    }

    // Then delete the conversation
    const { error: convError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (convError) {
      console.error('Error deleting conversation:', convError)
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
