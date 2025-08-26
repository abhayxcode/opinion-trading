import { WebSocket, WebSocketServer } from "ws";
import { EVENTS, CLIENTS_LIST } from "./config/Globals";
import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const port = Number(process.env.PORT) || 8080;
const wss = new WebSocketServer({ port });
const subscriber = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

/**
 * Function to connect to redis client
 */
const connectToRedis = async () => {
  try {
    await subscriber.connect();
    console.log("Connected to Redis");
  } catch (error) {
    console.error("Failed to connect to Redis");
  }
};

/**
 * Connect to redis client
 */
connectToRedis();

/**
 * Web socket connection
 */
wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  /**
   * Open connection
   */
  ws.on("open", () => {
    console.log("OPEN");
  });

  /**
   * Message received
   */
  ws.on("message", async (data) => {
    const { type, orderbookId } = JSON.parse(data.toString());

    if (type && orderbookId) {
      /**
       * Subscribe to the event
       */
      if (type == "SUBSCRIBE") {
        const socketIsSubscribed = EVENTS.has(orderbookId);

        // New Event
        if (!socketIsSubscribed) {
          // Add the event to the events list
          EVENTS.add(orderbookId);

          // Add the client to the clients list
          CLIENTS_LIST.set(orderbookId, new Set([ws]));

          // Subscribe to the event
          await subscriber.subscribe(orderbookId, (message) => {
            const orderbook = message.toString();

            CLIENTS_LIST.get(orderbookId)?.forEach((client) => {
              client.send(orderbook);
            });
          });
        } else {
          CLIENTS_LIST.get(orderbookId)?.add(ws);
        }
      }

      /**
       * Unsubscribe from the event
       */
      if (type == "UNSUBSCRIBE") {
        // Check if the client is subscribed to the event
        const socketIsSubscribed = EVENTS.has(orderbookId);

        if (!socketIsSubscribed || !CLIENTS_LIST.get(orderbookId)) {
          console.log("Client is not subscribed to the event");
          return;
        }

        CLIENTS_LIST.get(orderbookId)?.delete(ws);

        // Unsubscribe from the event(channel) with zero clients
        if (CLIENTS_LIST.get(orderbookId)?.size === 0) {
          await subscriber.unsubscribe(orderbookId);
          CLIENTS_LIST.delete(orderbookId);

          // Remove the event from the events list
          EVENTS.delete(orderbookId);
        }
      }
    }
  });

  /**
   * Error
   */
  ws.on("error", (err) => {
    console.log(err);
  });

  /**
   * Close connection
   */
  ws.on("close", () => {
    // Remove client from subscribers list
    for (let orderbookId of Array.from(EVENTS)) {
      CLIENTS_LIST.get(orderbookId)?.delete(ws);

      // If no clients are connected to the event, unsubscribe and remove the event
      if (CLIENTS_LIST.get(orderbookId)?.size === 0) {
        subscriber.unsubscribe(orderbookId);
        CLIENTS_LIST.delete(orderbookId);
        EVENTS.delete(orderbookId);
      }
    }
    console.log("Client disconnected");
  });
});
