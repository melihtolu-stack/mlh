import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const conversationId = formData.get('conversation_id')
    const files = formData.getAll('files')

    if (!conversationId || files.length === 0) {
      return NextResponse.json({ error: 'Missing conversation_id or files' }, { status: 400 })
    }

    const supabase = createServerClient()
    const bucket = process.env.SUPABASE_MEDIA_BUCKET || 'message-media'

    const uploads = []
    for (const file of files) {
      if (!(file instanceof File)) continue

      const buffer = Buffer.from(await file.arrayBuffer())
      const safeName = file.name.replace(/[^\w.\-]+/g, '_') || `file-${Date.now()}`
      const path = `conversations/${conversationId}/${Date.now()}-${safeName}`

      const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      })

      if (error) {
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      uploads.push({
        url: data.publicUrl,
        name: file.name,
        type: file.type,
        size: file.size,
        path
      })
    }

    return NextResponse.json({ files: uploads })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
