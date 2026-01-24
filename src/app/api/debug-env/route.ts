import { NextResponse } from 'next/server'

/** Container runtime’da env’lerin gorunup gorunmedigini kontrol et. Deger gonderme. */
export const dynamic = 'force-dynamic'

export async function GET() {
  const url = !!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const service = !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  return NextResponse.json({
    build: 'v2',
    runtime: {
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
      SUPABASE_SERVICE_ROLE_KEY: service
    },
    ok: url && anon && service,
    note: 'Hepsi true degilse Coolify -> Frontend -> Environment (Runtime) eksik.'
  })
}
