import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

/**
 * Client for pushing to the queue
 */
export const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

/**
 * Subscriber for subscribing to the queue
 */
export const subscriber = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

/**
 * Connect To redis
 */
export const connectToRedis = async () => {
  try {
    await client.connect();
    await subscriber.connect();
    console.log("Connected to Redis");
  } catch (error) {
    console.error("Failed to connect to Redis");
  }
};

/**
 * Push to queue function
 * @param queueName - The name of the queue
 * @param data - The data to push to the queue
 */
export const pushToQueue = async (queueName: string, data: string) => {
  try {
    await client.lPush(queueName, data);
  } catch (error) {
    console.error(error);
  }
};
