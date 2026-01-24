import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = createServerClient()
    
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          profile_photo
        )
      `)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversations', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(conversations || [])
  } catch (error: any) {
    console.error('Unexpected error:', error)
    // Return empty array if Supabase is not configured yet
    if (error.message?.includes('Missing')) {
      return NextResponse.json(
        { error: 'Supabase not configured. Please add credentials to .env.local' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
