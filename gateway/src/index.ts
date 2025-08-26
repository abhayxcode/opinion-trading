import express from "express";
import dotenv from "dotenv";
import { connectToRedis } from "./services/redis";
import router from "./router/app.router";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to redis client
connectToRedis();

// Middlewares
app.use(express.json());

// Routes
app.use("/api/v1", router);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

export default app;
