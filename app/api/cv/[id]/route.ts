import { NextRequest, NextResponse } from 'next/server';
import { getCV, updateCV, deleteCV } from '@/app/lib/db';

// GET /api/cv/123 - Get CV with ID 123
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cvId = parseInt(params.id); // Convert "123" to 123
    
    if (isNaN(cvId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid CV ID'
      }, { status: 400 });
    }

    const cv = await getCV(cvId);
    
    if (!cv) {
      return NextResponse.json({
        success: false,
        message: 'CV not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      cv
    }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/cv/[id]:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch CV',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/cv/123 - Update CV with ID 123
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cvId = parseInt(params.id);
    
    if (isNaN(cvId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid CV ID'
      }, { status: 400 });
    }

    const data = await request.json();
    const result = await updateCV(cvId, data);

    return NextResponse.json({
      success: true,
      message: 'CV updated successfully',
      cvId: result.cvId
    }, { status: 200 });
  } catch (error) {
    console.error('Error in PUT /api/cv/[id]:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update CV',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/cv/123 - Delete CV with ID 123
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cvId = parseInt(params.id);
    
    if (isNaN(cvId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid CV ID'
      }, { status: 400 });
    }

    await deleteCV(cvId);

    return NextResponse.json({
      success: true,
      message: 'CV deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/cv/[id]:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete CV',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}