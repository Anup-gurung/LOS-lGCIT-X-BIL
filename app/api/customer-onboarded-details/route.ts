import { NextRequest, NextResponse } from 'next/server';

const API_CONFIG = {
  CDMS_BASE_URL: ' https://eservices-uat.bil.bt/api/cdms',
  ACCESS_TOKEN: 'rEwOrW10rgTC75dqY5zfQO0SGgJUcPQU8Ue6x7XuXftaE0V5DgVE8NVe4BFq',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.type || !body.identity_no) {
      return NextResponse.json(
        { error: 'Missing required fields: type and identity_no' },
        { status: 400 }
      );
    }

    // Step 1: Fetch CSRF token from backend
    let csrfToken = '';
    try {
      const tokenResponse = await fetch(`${API_CONFIG.CDMS_BASE_URL}/csrf-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.ACCESS_TOKEN}`,
          'Accept': 'application/json',
        },
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        csrfToken = tokenData.token || tokenData.csrf_token || tokenData.csrfToken || tokenData.data?.token || '';
        console.log('CSRF token fetched:', csrfToken ? 'Yes' : 'No');
      }
    } catch (e) {
      console.error('Failed to fetch CSRF token:', e);
    }

    // Step 2: Make the actual API call with CSRF token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_CONFIG.ACCESS_TOKEN}`,
      'Accept': 'application/json',
    };

    if (csrfToken) {
      headers['X-CSRF-TOKEN'] = csrfToken;
    }

    const response = await fetch(
      `${API_CONFIG.CDMS_BASE_URL}/customer-onboarded-details`,
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      }
    );

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('API Error:', response.status, responseText);
      
      try {
        const errorData = JSON.parse(responseText);
        return NextResponse.json(
          { error: errorData.message || 'Failed to fetch customer details' },
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          { error: 'Failed to fetch customer details' },
          { status: response.status }
        );
      }
    }

    const data = JSON.parse(responseText);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in customer-onboarded-details proxy:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
