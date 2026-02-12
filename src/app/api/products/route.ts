import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
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
          media_url,
          media_type,
          media_category,
          display_order,
          created_at
        )
      `)
      .order('created_at', { ascending: false })
      .order('display_order', {
        foreignTable: 'product_media',
        ascending: true
      })
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
  const supabase = createServerClient();

  try {
    const body = await request.json();

    // 🔥 CamelCase → snake_case dönüşümü
    const toSnakeCase = (obj: any) => {
      const newObj: any = {};
      for (const key in obj) {
        const snakeKey = key
          .replace(/([A-Z])/g, "_$1")
          .toLowerCase();
        newObj[snakeKey] = obj[key];
      }
      return newObj;
    };

    const formattedBody = toSnakeCase(body);

    const { data, error } = await supabase
      .from('products')
      .insert(formattedBody)
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
