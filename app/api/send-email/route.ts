import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendOTPEmail } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, text, html, type } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email address is required' },
        { status: 400 }
      );
    }

    // If type is 'otp', use the OTP template
    if (type === 'otp') {
      const { otp } = body;
      if (!otp) {
        return NextResponse.json(
          { error: 'OTP is required for OTP email type' },
          { status: 400 }
        );
      }

      const result = await sendOTPEmail(to, otp);
      return NextResponse.json({
        success: true,
        message: 'OTP email sent successfully',
        messageId: result.messageId,
      });
    }

    // For custom emails
    if (!subject || (!text && !html)) {
      return NextResponse.json(
        { error: 'Subject and either text or html content are required' },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to,
      subject,
      text,
      html,
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('Error in send-email API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
