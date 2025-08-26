import express from "express";

import forwardRequest from "../controllers";

const router = express.Router();

// Orders
router.post("/buy", async (req, res) => {
  await forwardRequest(req, res, "/order/buy");
});
router.post("/sell", async (req, res) => {
  await forwardRequest(req, res, "/order/sell");
});
router.post("/cancel", async (req, res) => {
  await forwardRequest(req, res, "/order/cancel");
});

export default router;
