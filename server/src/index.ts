import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client } from '@elastic/elasticsearch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Rate limiting store (IP -> timestamp)
const rateLimitStore = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

// Middleware
app.use(cors());
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

    // Log the submission (in production, you'd save to database or send email)
    console.log('Contact form submission:', {
      name,
      email,
      message,
      ip: clientIP,
      timestamp: new Date().toISOString(),
    });

    // TODO: Save to database or send email notification
    // For now, just return success
    res.json({
      success: true,
      message: 'Message received successfully',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      error: 'Failed to process your message. Please try again later.',
    });
  }
});

// ElasticSearch client (NEST equivalent for Node.js)
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const health = await esClient.cluster.health();
    res.json({
      status: 'ok',
      elasticsearch: health,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'ElasticSearch connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Example search endpoint
app.get('/api/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const result = await esClient.search({
      index: 'your-index-name',
      query: {
        match: {
          field: query as string,
        },
      },
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../client/dist'));
  
  app.get('*', (req: Request, res: Response) => {
    res.sendFile('index.html', { root: '../client/dist' });
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`ElasticSearch URL: ${process.env.ELASTICSEARCH_URL || 'http://localhost:9200'}`);
});
