import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Rate limiting store (IP -> timestamp)
const rateLimitStore = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD?.replace(/"/g, ''), // Remove quotes if present
  },
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://derekbateman.com', 'https://www.derekbateman.com']
    : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Get client IP address
const getClientIP = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
};

// Rate limiting middleware
const rateLimiter = (req: Request, res: Response, next: Function) => {
  const clientIP = getClientIP(req);
  const now = Date.now();
  const lastSubmission = rateLimitStore.get(clientIP);

  if (lastSubmission && now - lastSubmission < RATE_LIMIT_WINDOW) {
    const timeLeft = Math.ceil((RATE_LIMIT_WINDOW - (now - lastSubmission)) / 1000);
    return res.status(429).json({
      error: `Too many requests. Please wait ${timeLeft} seconds before submitting again.`,
    });
  }

  next();
};

// Contact form endpoint
app.post('/api/contact', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid field types' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Update rate limit
    const clientIP = getClientIP(req);
    rateLimitStore.set(clientIP, Date.now());

    // Clean up old entries (older than 2 minutes)
    const cutoff = Date.now() - (RATE_LIMIT_WINDOW * 2);
    for (const [ip, timestamp] of rateLimitStore.entries()) {
      if (timestamp < cutoff) {
        rateLimitStore.delete(ip);
      }
    }

    // Create HTML email
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
            <h1>New Contact Form Submission</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">From</div>
              <div class="value">${name}</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:${email}">${email}</a></div>
            </div>
            <div class="field">
              <div class="label">Message</div>
              <div class="message-box">${message}</div>
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
              <div class="value">${clientIP}</div>
            </div>
          </div>
          <div class="footer">
            This message was sent from derekbateman.com contact form
          </div>
        </body>
      </html>
    `;

    // Send email
    const mailOptions = {
      from: '"Derek Bateman Contact Form" <' + process.env.EMAIL_USER + '>',
      to: 'derekbateman81@gmail.com',
      replyTo: email,
      subject: `Contact Form: Message from ${name}`,
      html: htmlEmail,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\nSubmitted: ${new Date().toLocaleString()}\nIP: ${clientIP}`,
    };

    await transporter.sendMail(mailOptions);

    // Log the submission
    console.log('Contact form submission sent via email:', {
      name,
      email,
      ip: clientIP,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      error: 'Failed to send your message. Please try again later.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  // In Docker: /app/client/dist
  // In development: ../../client/dist
  const clientPath = path.resolve(__dirname, '../../client/dist');
  console.log('Serving static files from:', clientPath);
  app.use(express.static(clientPath));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req: Request, res: Response) => {
    const indexPath = path.join(clientPath, 'index.html');
    console.log('Serving index.html from:', indexPath);
    res.sendFile(indexPath);
  });
}

const HOST = '0.0.0.0'; // Listen on all interfaces

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
