import { NextResponse } from 'next/server'

/** Health check – Coolify vb. için. Cache kullanma. */
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const urlSet = !!(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())
    const anonKeySet = !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim())
    const serviceRoleSet = !!(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
    const ok = urlSet && anonKeySet && serviceRoleSet

    const missing: string[] = []
    if (!urlSet) missing.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!anonKeySet) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    if (!serviceRoleSet) missing.push('SUPABASE_SERVICE_ROLE_KEY')

    const health = {
      build: 'v2',
      status: ok ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        NEXT_PUBLIC_SUPABASE_URL: urlSet,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKeySet,
        SUPABASE_SERVICE_ROLE_KEY: serviceRoleSet
      },
      ...(missing.length ? { eksik: missing, hint: `Coolify Frontend env: ${missing.join(', ')} ekleyin.` } : {})
    }

    return NextResponse.json(health, { status: ok ? 200 : 503 })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}
