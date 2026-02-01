import { NextRequest, NextResponse } from 'next/server';
import { setVerificationStatus } from '@/lib/verificationStore';

/**
 * Simulate NDI Verification (For Testing Only)
 * This endpoint simulates receiving verified credentials from NDI
 * Use this when testing locally without actual NDI webhook access
 */
export async function POST(req: NextRequest) {
  try {
    const { presentationRequestId } = await req.json();

    if (!presentationRequestId) {
      return NextResponse.json(
        { error: 'presentationRequestId is required' },
        { status: 400 }
      );
    }

    console.log('🧪 SIMULATING VERIFICATION for:', presentationRequestId);

    // Mock verified credentials data
    const mockVerifiedData = {
      'Full Name': 'Tshering Dorji',
      'Gender': 'Male',
      'Date of Birth': '15/06/1990',
      'ID Type': 'CID',
      'ID Number': '11234567890',
      'Citizenship': 'Bhutanese',
      'House Number': '123',
      'Village': 'Kawang',
      'Gewog': 'Kawang',
      'Dzongkhag': 'Thimphu',
    };

    // Store in verification store
    setVerificationStatus(presentationRequestId, 'verified', mockVerifiedData);

    console.log('✅ Simulated verification stored successfully');
    console.log('📋 Mock Data:', mockVerifiedData);

    return NextResponse.json({
      success: true,
      message: 'Verification simulated successfully',
      presentationRequestId,
      verifiedData: mockVerifiedData,
    });
  } catch (error) {
    console.error('❌ Error simulating verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
