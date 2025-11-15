# Derek - Node.js Project with React & ElasticSearch

A full-stack TypeScript application with React frontend (using Webpack), Express backend, and ElasticSearch integration.

## Prerequisites

- Node.js 20 or higher
- npm
- Docker and Docker Compose (for ElasticSearch)

## Project Structure

```
derek/
├── client/          # React frontend with Webpack
├── server/          # Express backend with ElasticSearch
├── docker-compose.yml
├── Dockerfile
└── package.json     # Root package with workspaces
```

## Getting Started

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Start ElasticSearch (Docker)

```bash
npm run docker:up
```

This will start ElasticSearch on port 9200.

### 3. Run Development Servers

```bash
npm run dev
```

This will start:
- React client on http://localhost:3002
- Express server on http://localhost:3002

### 4. Build for Production

```bash
npm run build
```

### 5. Start Production Server

```bash
npm start
```

## Docker Deployment

To run the entire stack with Docker:

```bash
docker-compose up -d
```

This will start:
- ElasticSearch container
- Application container (client + server)

To stop:

```bash
npm run docker:down
```

## API Endpoints

- `GET /api/health` - Health check and ElasticSearch status
- `GET /api/search?query=<term>` - Search endpoint

## Technologies

- **Frontend**: React 18, TypeScript, Webpack (fast bundler)
- **Backend**: Express, TypeScript, Node.js 20
- **Database**: ElasticSearch 8.11
- **Build Tools**: Webpack, npm workspaces
- **DevOps**: Docker, Docker Compose

## ElasticSearch Client

The project uses `@elastic/elasticsearch` (NEST equivalent for Node.js) to interact with ElasticSearch.

## Development

- Client files are in `client/src/`
- Server files are in `server/src/`
- Both use TypeScript with hot-reload in development mode
