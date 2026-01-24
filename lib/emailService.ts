import nodemailer from 'nodemailer';

// Create reusable transporter using Gmail SMTP
export const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Bhutan Insurance" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
      },
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

// Function to send OTP via email
export async function sendOTPEmail(to: string, otp: string) {
  const subject = 'Your OTP Code - Bhutan Insurance';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 10px;
          }
          .header {
            text-align: center;
            padding: 20px 0;
            background-color: #4CAF50;
            color: white;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .otp-box {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f0f0f0;
            border-radius: 5px;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #4CAF50;
            letter-spacing: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bhutan Insurance Loan Application</h1>
          </div>
          <div class="content">
            <h2>Your One-Time Password (OTP)</h2>
            <p>You have requested an OTP to continue with your loan application. Please use the code below:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p><strong>This OTP is valid for 5 minutes.</strong></p>
            <p>If you did not request this OTP, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Bhutan Insurance. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Your OTP code is: ${otp}\n\nThis OTP is valid for 5 minutes.\n\nIf you did not request this OTP, please ignore this email.`;

  return sendEmail({
    to,
    subject,
    text,
    html,
  });
}
