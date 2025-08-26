import { INR_BALANCES, ORDERBOOK, STOCK_BALANCES } from "../config/globals";
import { ORDERDATA, priceRange } from "../interfaces/globals";
import { publishOrderbook } from "../services/redis";
import { v4 as uuidv4 } from "uuid";

/**
 * Create a Sell order (Either exit or buy(pseudo sell))
 * @param stockSymbol - The stock symbol
 * @param stockType - The stock type
 * @param price - The price
 * @param quantity - The quantity
 */
export const initiateSellOrder = (
  stockSymbol: string,
  stockType: "yes" | "no",
  price: priceRange,
  quantity: number,
  userId: string,
  orderType: "buy" | "exit"
) => {
  let newPrice: priceRange =
    orderType == "buy" ? ((10 - price) as priceRange) : price;
  let newType: "yes" | "no" =
    orderType == "buy" ? (stockType == "yes" ? "no" : "yes") : stockType;

  // pseudo order -> Lock inr balance of the user (in paise)
  if (orderType == "buy") {
    INR_BALANCES[userId].balance -= quantity * price * 100;
    INR_BALANCES[userId].locked += quantity * price * 100;
  }

  // actual sell order -> Lock stock balance of user
  if (orderType == "exit") {
    STOCK_BALANCES[userId][stockSymbol][newType]!.quantity -= quantity;
    STOCK_BALANCES[userId][stockSymbol][newType]!.locked += quantity;
  }

  const sellOrderArray = ORDERBOOK[stockSymbol][newType];
  const sellOrder = sellOrderArray.get(newPrice);

  // Add order to orderbook
  if (sellOrder) {
    sellOrder.total += quantity;
    sellOrder.orders.push({ userId, id: uuidv4(), quantity, type: orderType });
  } else {
    sellOrderArray.set(newPrice, {
      total: quantity,
      orders: [{ userId, id: uuidv4(), quantity, type: orderType }],
    });
  }
  publishOrderbook(stockSymbol);
};

/**
 * Match Two orders Completely or partially
 * @param stockSymbol - The stock symbol
 * @param stockType - The stock type
 * @param orderPrice - The price
 * @param requiredQuantity - The required quantity
 * @param orderObject - The order object
 * @param takerId - The taker id
 * @param takerType - The taker type
 */
export const matchOrder = (
  stockSymbol: string,
  stockType: "yes" | "no",
  orderPrice: priceRange,
  requiredQuantity: number,
  orderObject: ORDERDATA,
  takerId: string,
  takerType: "buy" | "sell"
) => {
  const allOrders = orderObject.orders;
  let remainingQuantity = requiredQuantity;

  // Pseudo Order details
  let pseudoType: "yes" | "no" = "yes";
  let pseudoPrice: priceRange = Number(10 - orderPrice) as priceRange;
  if (stockType == "yes") {
    pseudoType = "no";
  }

  // loop over all orders -> one at a time
  for (const order in allOrders) {
    if (allOrders[order].quantity > remainingQuantity) {
      // Update quantity in order book

      allOrders[order].quantity -= remainingQuantity;
      orderObject.total -= remainingQuantity; // For maintaining available balance in buy order function

      // Deduct order from the orderbook depending on taker type
      if (takerType == "sell") {
        ORDERBOOK[stockSymbol][pseudoType].get(orderPrice)!.total -=
          remainingQuantity;
      } else {
        ORDERBOOK[stockSymbol][stockType].get(orderPrice)!.total -=
          remainingQuantity;
      }

      // update Stocks and INR balances
      updateBalances(
        stockSymbol,
        stockType,
        orderPrice,
        remainingQuantity,
        takerId,
        takerType,
        allOrders[order].userId,
        allOrders[order].type
      );

      // Order completely filled
      remainingQuantity = 0;

      return remainingQuantity;
    } else {
      remainingQuantity -= allOrders[order].quantity;
      orderObject.total -= allOrders[order].quantity;
      ORDERBOOK[stockSymbol][stockType].get(orderPrice)!.total -=
        allOrders[order].quantity;

      // update Stocks and INR balances
      updateBalances(
        stockSymbol,
        stockType,
        orderPrice,
        allOrders[order].quantity,
        takerId,
        takerType,
        allOrders[order].userId,
        allOrders[order].type
      );

      // Order partially filled
      allOrders[order].quantity = 0;

      // Delete order of this user from the orderbook
      ORDERBOOK[stockSymbol][stockType].get(orderPrice)?.orders.shift();
    }
  }
  return remainingQuantity;
};

/**
 * Update INR and stock balances after order matched
 * @param stockSymbol - The stock symbol
 * @param stockType - The stock type
 * @param price - The price
 * @param quantity - The quantity
 * @param takerId - The taker id
 * @param takerType - The taker type
 * @param makerId - The maker id
 * @param makerType - The maker type
 */
export const updateBalances = (
  stockSymbol: string,
  stockType: "yes" | "no",
  price: priceRange,
  quantity: number,
  takerId: string,
  takerType: "buy" | "sell",
  makerId: string,
  makerType: "buy" | "exit"
) => {
  const pseudoPrice = 10 - price;
  // Maker balance and stocks update
  if (makerType == "buy") {
    INR_BALANCES[makerId].locked -= quantity * pseudoPrice * 100;

    let makerStockType: "yes" | "no" =
      takerType == "buy" ? (stockType == "yes" ? "no" : "yes") : stockType;

    if (STOCK_BALANCES[makerId][stockSymbol]) {
      if (STOCK_BALANCES[makerId][stockSymbol][makerStockType]) {
        STOCK_BALANCES[makerId][stockSymbol][makerStockType].quantity +=
          quantity;
      } else {
        STOCK_BALANCES[makerId][stockSymbol][makerStockType] = {
          quantity: quantity,
          locked: 0,
        };
      }
    } else {
      STOCK_BALANCES[makerId][stockSymbol] = {
        [makerStockType]: { quantity: quantity, locked: 0 },
      };
    }
  } else {
    INR_BALANCES[makerId].balance += quantity * price * 100;
    STOCK_BALANCES[makerId][stockSymbol][stockType]!.locked -= quantity;
  }

  // Taker balance and stock update
  if (takerType == "buy") {
    INR_BALANCES[takerId].balance -= quantity * price * 100;

    if (STOCK_BALANCES[takerId][stockSymbol]) {
      if (STOCK_BALANCES[takerId][stockSymbol][stockType]) {
        STOCK_BALANCES[takerId][stockSymbol][stockType].quantity += quantity;
      } else {
        STOCK_BALANCES[takerId][stockSymbol][stockType] = {
          quantity,
          locked: 0,
        };
      }
    } else {
      STOCK_BALANCES[takerId][stockSymbol] = {
        [stockType]: { quantity, locked: 0 },
      };
    }
  } else {
    INR_BALANCES[takerId].balance += quantity * price * 100;
    STOCK_BALANCES[takerId][stockSymbol][stockType]!.quantity -= quantity;
  }
};
