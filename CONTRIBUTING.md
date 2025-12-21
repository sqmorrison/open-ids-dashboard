# Contributing to Open IDS Dashboard

First off, thanks for taking the time to contribute! 🎉

## Development Setup

1. **Fork and Clone** the repo.
2. **Install Dependencies:**
```bash
cd apps/web
npm install
 ```
3. **Start the Database Stack**: you need docker running to spin up ClickHouse and Vector 
```bash
#From root directory
docker-compose up -d
```
4. **Environment Variables**: Copy .env.example to .env and fill in the values

## Architecture Guidelines
- Frontend: We use Next.js App Router. Please keep logic inside lib/ or API routes, not inside UI components.

- Database: We use ClickHouse. All aggregations should happen via SQL in the API route, not in JavaScript on the client.

- Styling: We use Tailwind CSS. Avoid custom CSS files unless absolutely necessary.

## Submitting a Pull Request
1. Create a new branch: 
```bash
git checkout -b feature/amazing-feature
```
2. Commit your changes
3. Push to the branch
4. Open a Pull Request!
