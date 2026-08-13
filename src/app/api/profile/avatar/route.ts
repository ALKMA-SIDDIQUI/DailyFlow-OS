import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbUpdateUser } from '@/lib/db-adapter';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No avatar file provided' }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds maximum limit of 5MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let avatarUrl = '';

    // Attempt upload to Supabase Storage bucket 'avatars' if Supabase credentials are live
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseServerClient();
        const fileName = `avatar_${user.id}_${Date.now()}.${file.type.split('/')[1] || 'png'}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadErr && uploadData) {
          const { data: pubUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          if (pubUrlData?.publicUrl) {
            avatarUrl = pubUrlData.publicUrl;
          }
        }
      } catch (storageErr) {
        // Fall through to persistent Data URL
      }
    }

    // Persistent serverless fallback: Store as base64 Data URL
    if (!avatarUrl) {
      const base64 = buffer.toString('base64');
      avatarUrl = `data:${file.type};base64,${base64}`;
    }

    const updatedUser = await dbUpdateUser(user.id, { avatar_url: avatarUrl });
    if (!updatedUser) {
      throw new Error('Failed to update avatar in database');
    }

    return NextResponse.json({ avatar_url: avatarUrl, message: 'Avatar uploaded successfully!' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Avatar upload failed';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
