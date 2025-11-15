import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client } from '@elastic/elasticsearch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

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
