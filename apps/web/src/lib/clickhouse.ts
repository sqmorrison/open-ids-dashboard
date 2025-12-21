import { createClient, ClickHouseClient } from '@clickhouse/client';

/**
 * Shared ClickHouse client instance
 * Reuses connections across requests for better performance
 */
let client: ClickHouseClient | null = null;

/**
 * Get or create the ClickHouse client instance
 * Validates environment variables and throws clear errors if missing
 */
export function getClickHouseClient(): ClickHouseClient {
  // Validate environment variables
  const host = process.env.CLICKHOUSE_HOST;
  const username = process.env.CLICKHOUSE_USER;
  const password = process.env.CLICKHOUSE_PASSWORD;

  if (!host || !username || !password) {
    throw new Error(
      'Missing ClickHouse configuration. Please set CLICKHOUSE_HOST, CLICKHOUSE_USER, and CLICKHOUSE_PASSWORD environment variables.'
    );
  }

  // Reuse existing client if available
  if (!client) {
    client = createClient({
      host,
      username,
      password,
    });
  }

  return client;
}

