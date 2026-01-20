import { NextRequest, NextResponse } from 'next/server';
import { saveCV, getAllCVs, initDb } from '@/app/lib/db';

// GET - Get all CVs
export async function GET() {
  console.log('🟢🟢🟢 API ROUTE /api/cv GET WAS CALLED! 🟢🟢🟢');
  
  try {
    console.log('🟡 About to call initDb()...');
    await initDb();
    console.log('🟡 initDb() finished!');
    
    const cvs = await getAllCVs();
    
    return NextResponse.json({
      success: true,
      cvs
    }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/cv:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch CVs',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Save new CV
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await saveCV(data);
    
    return NextResponse.json({
      success: true,
      message: 'CV saved successfully',
      cvId: result.cvId
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/cv:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to save CV',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}