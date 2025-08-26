export interface ORDERBOOK_TYPE {
  [event: string]: {
    yes: { price: number; quantity: number }[];
    no: { price: number; quantity: number }[];
  };
}
