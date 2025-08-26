import express from "express";
import forwardRequest from "../controllers";

const router = express.Router();

router.get("/inr", async (req, res) => {
  await forwardRequest(req, res, "/balances/inr");
});
router.get("/inr/:userId", async (req, res) => {
  await forwardRequest(req, res, "/balances/inr/:uderId");
});
router.get("/stock", async (req, res) => {
  await forwardRequest(req, res, "/balances/stock");
});
router.get("/stock/:userId", async (req, res) => {
  await forwardRequest(req, res, "/balances/stock/:userId");
});

export default router;
