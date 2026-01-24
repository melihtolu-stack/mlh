import { NextResponse } from 'next/server'

/** Health check – Coolify vb. için. Cache kullanma. */
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        supabase: {
          configured: !!(supabaseUrl && supabaseAnonKey),
          url: supabaseUrl ? 'configured' : 'missing',
          serviceRole: !!serviceRoleKey
        }
      }
    }

    const ok = health.checks.supabase.configured && health.checks.supabase.serviceRole
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
