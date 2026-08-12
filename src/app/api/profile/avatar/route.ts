import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import path from 'path';
import fs from 'fs';

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
    
    // Determine extension safely
    let ext = '.png';
    if (file.type.includes('jpeg') || file.type.includes('jpg')) ext = '.jpg';
    else if (file.type.includes('webp')) ext = '.webp';
    else if (file.type.includes('gif')) ext = '.gif';

    const fileName = `avatar_${user.id}_${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${fileName}`;

    const db = getDb();
    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, user.id);

    return NextResponse.json({ avatar_url: avatarUrl, message: 'Avatar uploaded successfully!' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Avatar upload failed';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
