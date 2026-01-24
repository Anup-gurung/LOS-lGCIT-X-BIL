import { NextRequest, NextResponse } from 'next/server';
import { storeOtp } from '@/lib/otpCache';
import { sendOTPEmail } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, otp } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Phone number or email is required' },
        { status: 400 }
      );
    }

    // Check if this is for email (has @ symbol) or phone
    const isEmail = to.includes('@');

    // For email, send OTP via email
    if (isEmail) {
      if (!otp) {
        return NextResponse.json(
          { error: 'OTP is required for email' },
          { status: 400 }
        );
      }
      
      try {
        // Send email with OTP
        await sendOTPEmail(to, String(otp));
        
        // Also store in cache for verification
        storeOtp(to, String(otp));
        
        // Clear console display of OTP
        console.log('\n'.repeat(2));
        console.log('╔═══════════════════════════════════════╗');
        console.log('║       📧 EMAIL OTP SENT               ║');
        console.log('╠═══════════════════════════════════════╣');
        console.log(`║  Email: ${to.padEnd(28)} ║`);
        console.log(`║  OTP:   ${String(otp).padEnd(28)} ║`);
        console.log('║  Valid: 5 minutes                     ║');
        console.log('╚═══════════════════════════════════════╝');
        console.log('\n');
        
        return NextResponse.json({ 
          success: true, 
          message: 'OTP sent to email successfully',
          otp: otp
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        return NextResponse.json(
          { error: 'Failed to send OTP email', details: emailError instanceof Error ? emailError.message : 'Unknown error' },
          { status: 500 }
        );
      }
    }

    // For phone, call the SMS API

    // SMS API configuration
    const smsApiUrl = 'http://119.2.100.178/api/send-sms';
    const smsApiToken = 'rEwOrW10rgTC75dqY5zfQO0SGgJUcPQU8Ue6x7XuXftaE0V5DgVE8NVe4BFq';

    console.log(`Attempting to send SMS OTP to ${to}`);
    console.log(`SMS API URL: ${smsApiUrl}`);

    // Call the SMS API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const smsResponse = await fetch(smsApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${smsApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile_no: to
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!smsResponse.ok) {
        const errorText = await smsResponse.text();
        console.error('SMS API Error Response:', errorText);
        return NextResponse.json(
          { error: 'Failed to send SMS', details: errorText },
          { status: 500 }
        );
      }

      const result = await smsResponse.json().catch(() => ({ success: true }));

      console.log('');
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║           📡 SMS API FULL RESPONSE                    ║');
      console.log('╠═══════════════════════════════════════════════════════╣');
      console.log(JSON.stringify(result, null, 2));
      console.log('╚═══════════════════════════════════════════════════════╝');
      console.log('');

      // Extract OTP from the SMS API response
      // The API should return the OTP it sent - check common response formats
      let sentOtp = null;
      if (result.otp) {
        sentOtp = result.otp;
        console.log('✓ OTP found at: result.otp');
      } else if (result.data?.otp) {
        sentOtp = result.data.otp;
        console.log('✓ OTP found at: result.data.otp');
      } else if (result.code) {
        sentOtp = result.code;
        console.log('✓ OTP found at: result.code');
      } else if (result.data?.code) {
        sentOtp = result.data.code;
        console.log('✓ OTP found at: result.data.code');
      } else if (result.data?.message) {
        // Try to extract OTP from message if it contains numbers
        const otpMatch = String(result.data.message).match(/\b\d{4,6}\b/);
        if (otpMatch) {
          sentOtp = otpMatch[0];
          console.log('✓ OTP extracted from: result.data.message');
        }
      } else if (result.message) {
        // Try to extract OTP from message if it contains numbers
        const otpMatch = String(result.message).match(/\b\d{4,6}\b/);
        if (otpMatch) {
          sentOtp = otpMatch[0];
          console.log('✓ OTP extracted from: result.message');
        }
      }
      
      // If SMS API didn't return OTP, generate one for testing
      if (!sentOtp) {
        console.log('⚠️  SMS API did not return OTP - generating fallback OTP for testing');
        sentOtp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('⚠️  Note: In production, the SMS should contain this OTP');
      }

      if (sentOtp) {
        // Ensure OTP is 6 digits by padding with leading zeros if needed
        const formattedOtp = String(sentOtp).padStart(6, '0');
        
        // Store the OTP that was actually sent by the SMS API
        storeOtp(to, formattedOtp);
        
        // Clear console display of OTP
        console.log('\n'.repeat(2));
        console.log('╔═══════════════════════════════════════╗');
        console.log('║       📱 SMS OTP SENT                 ║');
        console.log('╠═══════════════════════════════════════╣');
        console.log(`║  Phone: ${to.padEnd(28)} ║`);
        console.log(`║  OTP:   ${formattedOtp.padEnd(28)} ║`);
        console.log('║  Valid: 2 minutes                     ║');
        console.log('╚═══════════════════════════════════════╝');
        console.log('\n');
        
        sentOtp = formattedOtp; // Return formatted OTP
      } else {
        console.warn('⚠️ SMS API did not return OTP in response');
        console.log('Full Response:', JSON.stringify(result, null, 2));
      }

      return NextResponse.json({ 
        success: true, 
        message: 'OTP sent successfully',
        otp: sentOtp, // Return the OTP for testing/display purposes
        data: result 
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('SMS API request timed out');
        return NextResponse.json(
          { error: 'SMS API request timed out. Please check if the SMS service is running.' },
          { status: 504 }
        );
      }
      
      console.error('SMS API fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Could not connect to SMS service', details: fetchError.message },
        { status: 503 }
      );
    }

  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS', details: error.message },
      { status: 500 }
    );
  }
}
