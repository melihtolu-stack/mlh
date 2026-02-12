import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase'; // ✅ createClient değil!

export async function GET(request: NextRequest) {
  const supabase = createServerClient(); // ✅ createClient değil!
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        product_media (
          id,
          file_url,
          file_name,
          media_type,
          is_primary,
          sort_order
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Products fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient(); // ✅ createClient değil!
  
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('products')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Product creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}