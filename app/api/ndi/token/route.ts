import { NextRequest, NextResponse } from 'next/server';

/**
 * NDI Token Generation API
 * Based on Bhutan NDI Technical Documentation v1.2
 * 
 * This endpoint generates an access token for NDI API authentication
 * using client credentials flow.
 * 
 * NOTE: NDI API expects credentials in the request BODY, not in Authorization header
 */

export async function POST(req: NextRequest) {
  try {
    const clientId = process.env.NDI_CLIENT_ID;
    const clientSecret = process.env.NDI_CLIENT_SECRET;
    const authUrl = process.env.NDI_AUTH_URL;

    if (!clientId || !clientSecret || !authUrl) {
      return NextResponse.json(
        { error: 'NDI configuration is missing' },
        { status: 500 }
      );
    }

    // Prepare request body with credentials (NDI expects credentials in body, not header)
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', clientId);
    formData.append('client_secret', clientSecret);
    
    console.log('NDI Token Request:', {
      url: authUrl,
      clientId: clientId.substring(0, 10) + '...',
      hasSecret: !!clientSecret,
    });

    // Request access token from NDI
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      console.error('NDI Token Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return NextResponse.json(
        { 
          error: 'Failed to obtain NDI access token', 
          details: errorData,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const tokenData = await response.json();
    console.log('NDI Token Success:', {
      hasToken: !!tokenData.access_token,
      expiresIn: tokenData.expires_in,
    });

    return NextResponse.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
    });

  } catch (error) {
    console.error('Error generating NDI token:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
