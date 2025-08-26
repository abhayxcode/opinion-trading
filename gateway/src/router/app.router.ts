import express, { Response } from "express";
import balanceRouter from "./balance.router";
import orderbookRouter from "./orderbook.router";
import ordersRouter from "./orders.router";

import forwardRequest from "../controllers";

const router = express.Router();

// Create user
router.post("/user/create/:userId", async (req, res) => {
  await forwardRequest(req, res, "/user/create/:userId");
});

// Create Symbol
router.post("/symbol/create/:stockSymbol", async (req, res) => {
  await forwardRequest(req, res, "/symbol/create/:stockSymbol");
});

// Onramp Money
router.post("/onramp/inr", async (req, res) => {
  await forwardRequest(req, res, "/onramp/inr");
});

// Mint tokens
router.post("/trade/mint", async (req, res) => {
  await forwardRequest(req, res, "/trade/mint");
});

// Reset database
router.post("/reset", async (req, res) => {
  await forwardRequest(req, res, "/reset");
});

// Balances (INR and Stock)
router.use("/balances", balanceRouter);

// Orderbook (View Orderbook)
router.use("/orderbook", orderbookRouter);

// Orders (Buy, Sell, Cancel)
router.use("/order", ordersRouter);

export default router;
