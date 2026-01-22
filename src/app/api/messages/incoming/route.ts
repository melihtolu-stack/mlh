import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Expected webhook payload from N8N:
    // {
    //   phone: "+1234567890",
    //   name: "John Doe",
    //   email: "john@example.com",
    //   content: "Message text",
    //   channel: "whatsapp" (optional, defaults to "whatsapp"),
    //   profile_photo: "https://..." (optional),
    //   country: "Turkey" (optional),
    //   language: "Turkish" (optional),
    //   address: "Istanbul, Turkey" (optional)
    // }
    
    const { 
      phone, 
      name, 
      email, 
      content, 
      channel = 'whatsapp',
      profile_photo = null,
      country = null,
      language = null,
      address = null
    } = body

    if (!phone || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: phone and content' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Find or create customer
    let { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .single()

    if (customerError && customerError.code === 'PGRST116') {
      // Customer doesn't exist, create one
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          phone,
          name: name || 'Unknown',
          email: email || null,
          profile_photo: profile_photo || null
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating customer:', createError)
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: 500 }
        )
      }
      customer = newCustomer
    } else if (customerError) {
      console.error('Error finding customer:', customerError)
      return NextResponse.json(
        { error: 'Failed to find customer' },
        { status: 500 }
      )
    }

    // Update customer if additional info provided and customer already exists
    if (customer && (profile_photo || country || language || address)) {
      const updateData: any = {}
      if (profile_photo && !customer.profile_photo) updateData.profile_photo = profile_photo
      // Note: country, language, address fields don't exist in schema yet
      // These would need to be added to customers table first
      
      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('customers')
          .update(updateData)
          .eq('id', customer.id)
      }
    }

    // Find or create conversation
    let { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('channel', channel)
      .single()

    if (convError && convError.code === 'PGRST116') {
      // Conversation doesn't exist, create one
      const { data: newConversation, error: createConvError } = await supabase
        .from('conversations')
        .insert({
          customer_id: customer.id,
          channel,
          last_message: content.substring(0, 200), // Limit preview length
          is_read: false,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createConvError) {
        console.error('Error creating conversation:', createConvError)
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        )
      }
      conversation = newConversation
    } else if (convError) {
      console.error('Error finding conversation:', convError)
      return NextResponse.json(
        { error: 'Failed to find conversation' },
        { status: 500 }
      )
    } else {
      // Update existing conversation with new message
      await supabase
        .from('conversations')
        .update({
          last_message: content.substring(0, 200),
          last_message_at: new Date().toISOString(),
          is_read: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id)
    }

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender: 'customer',
        content: content.trim(),
        is_read: false,
        sent_at: new Date().toISOString()
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error inserting message:', messageError)
      return NextResponse.json(
        { error: 'Failed to insert message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message,
      conversation,
      customer 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
