import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const testEmail = async () => {
  try {
    console.log('Creating email transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD?.replace(/"/g, ''), // Remove quotes if present
      },
    });

    console.log('Sending test email...');
    console.log('From:', process.env.EMAIL_USER);
    console.log('To: derekbateman81@gmail.com');

    const htmlEmail = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Inter', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #000;
              color: #fff;
              padding: 30px 20px;
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 300;
              letter-spacing: 2px;
            }
            .content {
              background: #f8f8f8;
              padding: 30px;
              border-radius: 4px;
            }
            .field {
              margin-bottom: 20px;
            }
            .label {
              font-weight: 600;
              text-transform: uppercase;
              font-size: 12px;
              letter-spacing: 1px;
              color: #666;
              margin-bottom: 5px;
            }
            .value {
              font-size: 16px;
              color: #000;
              padding: 10px 0;
            }
            .message-box {
              background: #fff;
              padding: 20px;
              border-left: 3px solid #000;
              margin-top: 10px;
              white-space: pre-wrap;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #999;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Test Email - Contact Form</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">From</div>
              <div class="value">Test User</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:test@example.com">test@example.com</a></div>
            </div>
            <div class="field">
              <div class="label">Message</div>
              <div class="message-box">This is a test message from the contact form system. If you're seeing this, the email configuration is working correctly!</div>
            </div>
            <div class="field">
              <div class="label">Submitted</div>
              <div class="value">${new Date().toLocaleString('en-US', { 
                dateStyle: 'full', 
                timeStyle: 'long' 
              })}</div>
            </div>
            <div class="field">
              <div class="label">IP Address</div>
              <div class="value">127.0.0.1 (Test)</div>
            </div>
          </div>
          <div class="footer">
            This is a test message from derekbateman.com contact form
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'derekbateman81@gmail.com',
      replyTo: 'test@example.com',
      subject: 'Test: Contact Form Configuration',
      html: htmlEmail,
      text: 'This is a test message to verify email configuration is working correctly.',
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error(error);
  }
};

testEmail();
