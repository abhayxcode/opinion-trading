import { ORDERBOOK_TYPE } from "../interface";
import { WebSocket } from "ws";

export const EVENTS: Set<string> = new Set();

export const CLIENTS_LIST: Map<string, Set<WebSocket>> = new Map();

export const ORDERBOOK: ORDERBOOK_TYPE = {
  Eth: {
    yes: [
      { price: 10, quantity: 100 },
      { price: 10, quantity: 100 },
    ],
    no: [{ price: 10, quantity: 100 }],
  },
  Bit: {
    yes: [
      { price: 10, quantity: 100 },
      { price: 10, quantity: 100 },
    ],
    no: [{ price: 10, quantity: 100 }],
  },
  Hello: {
    yes: [
      { price: 10, quantity: 100 },
      { price: 10, quantity: 100 },
    ],
    no: [{ price: 10, quantity: 100 }],
  },
};
