import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * NDI Webhook Handler
 * Based on Bhutan NDI Technical Documentation v1.2
 * 
 * This endpoint receives callbacks from NDI when a user completes
 * the verification process in their wallet.
 */

interface WebhookPayload {
  presentationRequestId: string;
  state: 'verified' | 'rejected' | 'expired';
  verifiedData?: any;
  timestamp: string;
  signature?: string;
}

/**
 * Verify webhook signature for security
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-ndi-signature') || '';
    const webhookSecret = process.env.WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const webhookData: WebhookPayload = JSON.parse(rawBody);

    console.log('NDI Webhook received:', {
      presentationRequestId: webhookData.presentationRequestId,
      state: webhookData.state,
      timestamp: webhookData.timestamp,
    });

    // Process based on verification state
    switch (webhookData.state) {
      case 'verified':
        console.log('Verification successful:', webhookData.presentationRequestId);
        
        // Here you can:
        // 1. Store verified data in database
        // 2. Send notification to user
        // 3. Update application status
        // 4. Trigger any business logic
        
        // Example: Store in session or database
        if (webhookData.verifiedData) {
          // Process and store the verified credentials
          console.log('Verified credentials:', webhookData.verifiedData);
        }
        break;

      case 'rejected':
        console.log('Verification rejected:', webhookData.presentationRequestId);
        // Handle rejection - maybe notify user or log the event
        break;

      case 'expired':
        console.log('Verification expired:', webhookData.presentationRequestId);
        // Handle expiration - cleanup or notify
        break;

      default:
        console.warn('Unknown webhook state:', webhookData.state);
    }

    // Return success response to NDI
    return NextResponse.json({
      success: true,
      received: true,
      presentationRequestId: webhookData.presentationRequestId,
    });

  } catch (error) {
    console.error('Error processing NDI webhook:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests (for webhook verification during setup)
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const challenge = searchParams.get('challenge');

  // If NDI sends a challenge for webhook verification, echo it back
  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({
    status: 'active',
    endpoint: '/api/ndi/webhook',
    message: 'NDI Webhook endpoint is active',
  });
}
