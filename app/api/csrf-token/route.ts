import { NextRequest, NextResponse } from 'next/server';

const API_CONFIG = {
  CDMS_BASE_URL: ' https://eservices-uat.bil.bt/api/cdms',
  ACCESS_TOKEN: 'rEwOrW10rgTC75dqY5zfQO0SGgJUcPQU8Ue6x7XuXftaE0V5DgVE8NVe4BFq',
};

export async function GET() {
  try {
    const response = await fetch(`${API_CONFIG.CDMS_BASE_URL}/csrf-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.ACCESS_TOKEN}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch CSRF token' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching CSRF token:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
