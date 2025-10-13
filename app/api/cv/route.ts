import { NextRequest, NextResponse } from 'next/server';
import { saveCV, getAllCVs, initDb } from '@/app/lib/db';

// POST - Save new CV
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('POST /api/cv request body:', data);
    
    const result = await saveCV(data);
    console.log('POST /api/cv result:', result);
    
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

// GET - Get all CVs
export async function GET() {
  try {
    initDb;

    const cvs = await getAllCVs();
    console.log('GET /api/cv result:', cvs);
    
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

