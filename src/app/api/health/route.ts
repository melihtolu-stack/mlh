import { NextResponse } from 'next/server'

/**
 * Health check endpoint for deployment monitoring
 * Used by Coolify and other deployment platforms to check if the app is running
 */
export async function GET() {
  try {
    // Check if required environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        supabase: {
          configured: !!(supabaseUrl && supabaseAnonKey),
          url: supabaseUrl ? 'configured' : 'missing'
        }
      }
    }

    // Return 200 if healthy, 503 if critical services are missing
    const statusCode = health.checks.supabase.configured ? 200 : 503
    
    return NextResponse.json(health, { status: statusCode })
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
