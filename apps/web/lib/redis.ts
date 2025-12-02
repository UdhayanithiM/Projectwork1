import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is not set.");
}

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  await redisClient.connect();
})();

// Helper functions for JSON serialization
export const getSession = async (key: string) => {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setSession = (key: string, value: any, expirationInSeconds = 3600) => {
  return redisClient.set(key, JSON.stringify(value), {
    EX: expirationInSeconds, // Expire sessions after 1 hour of inactivity
  });
};



