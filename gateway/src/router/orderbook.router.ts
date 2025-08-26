import express from "express";
import forwardRequest from "../controllers";

const router = express.Router();

// Orderbook
router.get("/", async (req, res) => {
  await forwardRequest(req, res, "/orderbook");
});
router.get("/:stockSymbol", async (req, res) => {
  await forwardRequest(req, res, "/orderbook/:stockSymbol");
});

export default router;
