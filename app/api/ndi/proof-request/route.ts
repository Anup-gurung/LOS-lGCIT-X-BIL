import { NextRequest, NextResponse } from 'next/server';
import { getVerificationStatus, setVerificationStatus } from '@/lib/verificationStore';

/**
 * NDI Proof Request API
 * Based on Bhutan NDI Technical Documentation v1.2
 * 
 * This endpoint creates a verifiable presentation request for NDI wallet users
 * to share their credentials (CID, name, DOB, etc.)
 * 
 * NOTE: The exact verifier endpoint URL needs to be confirmed with NDI support.
 * Contact: ndifeedback@dhi.bt or call 1199
 */

interface ProofRequestBody {
  requestedAttributes?: string[];
  webhookUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ProofRequestBody = await req.json().catch(() => ({}));
    
    console.log('Creating NDI Proof Request...');
    
    // Get NDI access token first
    const tokenResponse = await fetch(`${req.nextUrl.origin}/api/ndi/token`, {
      method: 'POST',
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.json();
      console.error('Token generation failed:', tokenError);
      return NextResponse.json(
        { error: 'Failed to obtain NDI access token', details: tokenError },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('✅ Token obtained successfully');

    // Get configuration - use the correct demo verifier URL
    const verifierUrl = process.env.NDI_VERIFIER_URL || 'https://demo-client.bhutanndi.com/verifier/v1';
    const webhookUrl = body.webhookUrl || process.env.NDI_WEBHOOK_URL;
    
    console.log('📍 Webhook URL configured:', webhookUrl);

    // Schema URLs
    const FOUNDATIONAL_ID_SCHEMA = 'https://dev-schema.ngotag.com/schemas/c7952a0a-e9b5-4a4b-a714-1e5d0a1ae076';
    const PERMANENT_ADDRESS_SCHEMA = 'https://dev-schema.ngotag.com/schemas/e3b606d0-e477-4fc2-b5ab-0adc4bd75c54';

    // Define attributes with their respective schemas
    // These are the exact attribute names from NDI documentation
    const proofAttributes = [
      // From Foundational ID schema
      { name: 'Full Name', schema: FOUNDATIONAL_ID_SCHEMA },
      { name: 'Gender', schema: FOUNDATIONAL_ID_SCHEMA },
      { name: 'Date of Birth', schema: FOUNDATIONAL_ID_SCHEMA },
      { name: 'ID Type', schema: FOUNDATIONAL_ID_SCHEMA },
      { name: 'ID Number', schema: FOUNDATIONAL_ID_SCHEMA },
      { name: 'Citizenship', schema: FOUNDATIONAL_ID_SCHEMA },
      // From Permanent Address schema
      { name: 'House Number', schema: PERMANENT_ADDRESS_SCHEMA },
      { name: 'Village', schema: PERMANENT_ADDRESS_SCHEMA },
      { name: 'Gewog', schema: PERMANENT_ADDRESS_SCHEMA },
      { name: 'Dzongkhag', schema: PERMANENT_ADDRESS_SCHEMA },
    ];

    // Construct the proof request payload in the format NDI expects
    const proofRequestPayload: any = {
      proofName: 'Bhutan Insurance Loan Application Verification',
      proofAttributes: proofAttributes.map(attr => ({
        name: attr.name,
        restrictions: [
          {
            schema_name: attr.schema,
          },
        ],
      })),
    };

    // Add webhook URL to receive verification callback
    if (webhookUrl) {
      proofRequestPayload.webhookUrl = webhookUrl;
      console.log('✅ Webhook URL included in request');
    } else {
      console.warn('⚠️ No webhook URL configured! Verification data will not be received.');
      console.warn('   Set NDI_WEBHOOK_URL in .env.local to a public URL (use ngrok for local testing)');
    }

    console.log('Proof request payload:', JSON.stringify(proofRequestPayload, null, 2));

    console.log('Calling NDI verifier:', `${verifierUrl}/proof-request`);

    try {
      // Call the actual NDI verifier endpoint
      const proofResponse = await fetch(`${verifierUrl}/proof-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(proofRequestPayload),
      });

      console.log('NDI Verifier Response Status:', proofResponse.status);

      if (!proofResponse.ok) {
        const errorText = await proofResponse.text();
        console.error('NDI Verifier Error:', errorText);
        
        return NextResponse.json({
          error: 'Failed to create proof request with NDI verifier',
          status: proofResponse.status,
          details: errorText,
        }, { status: proofResponse.status });
      }

      const proofData = await proofResponse.json();
      console.log('✅ Proof request created successfully');
      console.log('Full NDI response:', JSON.stringify(proofData, null, 2));

      // Extract the data from the NDI response
      const responseData = proofData.data || proofData;
      const invitationUrl = responseData.proofRequestURL || responseData.deepLinkURL;
      const threadId = responseData.proofRequestThreadId;

      console.log('Extracted data:', {
        threadId,
        invitationUrl,
        deepLinkURL: responseData.deepLinkURL,
      });

      // Return the response from NDI
      return NextResponse.json({
        success: true,
        presentationRequestId: threadId,
        invitationUrl: invitationUrl,
        qrCodeData: invitationUrl,
        deepLinkURL: responseData.deepLinkURL,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        proofRequestName: responseData.proofRequestName,
      });

    } catch (error) {
      console.error('Error calling NDI verifier:', error);
      return NextResponse.json({
        error: 'Failed to connect to NDI verifier',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating NDI proof request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check the status of a proof request
 * Queries the actual NDI verifier API for the current status
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const presentationRequestId = searchParams.get('presentationRequestId');

    if (!presentationRequestId) {
      return NextResponse.json(
        { error: 'presentationRequestId is required' },
        { status: 400 }
      );
    }

    // Check in-memory store (populated by webhook or simulate endpoint)
    const storedResult = getVerificationStatus(presentationRequestId);
    
    if (storedResult) {
      console.log('✅ Verification found:', storedResult.status);
      return NextResponse.json(storedResult);
    }
    
    // No result yet - return pending (silent, no logs)
    return NextResponse.json({
      presentationRequestId: presentationRequestId,
      status: 'pending',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error checking proof request status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
