import { NextResponse } from 'next/server'

/**
 * Email Incoming Webhook
 * Receives emails sent to info@heni.com.tr (or EMAIL_INBOX) and forwards to backend.
 * Supports:
 * - Our JSON format: { from_email, from_name, subject, body, html_body? }
 * - Mailgun Inbound Parse: form-urlencoded (sender, recipient, subject, body-plain, body-html, ...)
 */

const EMAIL_INBOX = process.env.EMAIL_INBOX || 'info@heni.com.tr'
const BACKEND_URL = process.env.BACKEND_URL || ''

type IncomingPayload = {
  from_email: string
  from_name?: string
  subject: string
  body: string
  html_body?: string | null
  headers?: Record<string, unknown>
}

function parseSender(sender: string): { email: string; name?: string } {
  const match = sender.match(/^(.+?)\s*<([^>]+)>$/)
  if (match) {
    return { name: match[1].trim().replace(/^["']|["']$/g, ''), email: match[2].trim() }
  }
  const email = sender.trim()
  return { email: email.includes('@') ? email : '', name: email.includes('@') ? undefined : email }
}

function normalizeMailgunForm(form: Record<string, string>): IncomingPayload | null {
  const sender = form['sender'] ?? form['From']
  const recipient = form['recipient'] ?? form['To']
  const subject = form['subject'] ?? form['Subject'] ?? ''
  const bodyPlain = form['body-plain'] ?? form['stripped-text'] ?? form['body'] ?? ''
  const bodyHtml = form['body-html'] ?? form['stripped-html'] ?? form['html_body'] ?? ''

  if (!sender || !subject) return null

  const { email, name } = parseSender(sender)
  if (!email) return null

  const body = (bodyPlain || bodyHtml || '').trim()
  if (!body && !bodyHtml) return null

  return {
    from_email: email,
    from_name: name || undefined,
    subject,
    body: body || '[HTML-only email]',
    html_body: bodyHtml || undefined,
  }
}

function validateOurFormat(body: unknown): IncomingPayload | null {
  if (!body || typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  const from = typeof o.from_email === 'string' ? o.from_email : ''
  const subject = typeof o.subject === 'string' ? o.subject : ''
  const b = typeof o.body === 'string' ? o.body : ''
  if (!from || !subject || !b) return null
  return {
    from_email: from,
    from_name: typeof o.from_name === 'string' ? o.from_name : undefined,
    subject,
    body: b,
    html_body: typeof o.html_body === 'string' ? o.html_body : undefined,
    headers: typeof o.headers === 'object' && o.headers ? (o.headers as Record<string, unknown>) : undefined,
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? ''
    let payload: IncomingPayload | null = null
    let recipient: string | null = null
    let rawBody: unknown = null

    if (contentType.includes('application/json')) {
      rawBody = await request.json()
      
      // Handle N8N array format: [{...}] -> {...}
      let body = rawBody
      if (Array.isArray(rawBody) && rawBody.length > 0) {
        body = rawBody[0]
        console.log('N8N array format detected, using first element')
      }
      
      payload = validateOurFormat(body)
      recipient = (body && typeof body === 'object' && typeof (body as Record<string, unknown>).recipient === 'string')
        ? (body as Record<string, unknown>).recipient as string
        : null
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text()
      const params = new URLSearchParams(text)
      const form: Record<string, string> = {}
      params.forEach((v, k) => { form[k] = v })
      recipient = form['recipient'] ?? form['To'] ?? null
      payload = normalizeMailgunForm(form)
    } else {
      console.error('Unsupported Content-Type:', contentType)
      return NextResponse.json(
        { error: 'Unsupported Content-Type. Use application/json or application/x-www-form-urlencoded.' },
        { status: 400 }
      )
    }

    if (!payload) {
      console.error('Invalid payload received:', JSON.stringify(rawBody).substring(0, 500))
      return NextResponse.json(
        { error: 'Invalid payload. Required: from_email, subject, body (or Mailgun sender, subject, body-plain/body-html).' },
        { status: 400 }
      )
    }

    if (EMAIL_INBOX && recipient) {
      const norm = (s: string) => s.trim().toLowerCase()
      if (norm(recipient) !== norm(EMAIL_INBOX)) {
        return NextResponse.json(
          { error: `Recipient ${recipient} does not match EMAIL_INBOX (${EMAIL_INBOX}). Ignored.` },
          { status: 200 }
        )
      }
    }

    if (!BACKEND_URL) {
      console.error('BACKEND_URL is not configured')
      return NextResponse.json(
        { error: 'BACKEND_URL is not configured. Email webhook requires backend.' },
        { status: 503 }
      )
    }

    const backendPayload = {
      from_email: payload.from_email,
      from_name: payload.from_name ?? null,
      subject: payload.subject,
      body: payload.body,
      html_body: payload.html_body ?? null,
      headers: payload.headers ?? {},
    }

    console.log('Forwarding to backend:', BACKEND_URL, 'Payload:', JSON.stringify(backendPayload).substring(0, 200))

    const backendRes = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/emails/incoming`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendPayload),
    })

    const responseText = await backendRes.text()
    let data: unknown = {}
    try {
      data = JSON.parse(responseText)
    } catch {
      console.error('Backend returned non-JSON response:', responseText.substring(0, 500))
      return NextResponse.json(
        { error: `Backend returned invalid response: ${responseText.substring(0, 100)}` },
        { status: 500 }
      )
    }

    if (!backendRes.ok) {
      console.error('Backend error:', backendRes.status, data)
      return NextResponse.json(
        { error: (data as { detail?: string; error?: string }).detail ?? (data as { error?: string }).error ?? 'Backend failed to process email' },
        { status: backendRes.status }
      )
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error('Email incoming webhook error:', e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}
