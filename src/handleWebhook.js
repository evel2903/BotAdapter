import Binance from "binance-api-node";
import { sendTelegramMessage } from './telegram.js'
import 'dotenv/config'

const client = Binance.default({
	apiKey: process.env.BINANCE_API_KEY,
	apiSecret: process.env.BINANCE_SECRET_KEY
});

export const handleWebhook = async (req, res) => {
	const alert = req.body;

	if (!alert?.symbol) {
		return res.json({ message: "Error: Symbol Không tồn tại" });
	}

	let telegramMessage = `[${formatVNDateTime(alert?.time)}]: Yêu cầu mở lệnh [${alert.strategy.order_action.toUpperCase()}] ${alert?.symbol} với số lượng ${alert.strategy.order_contracts} ${alert?.symbol.slice(0, -4)} `
	await sendTelegramMessage(telegramMessage)

	// try {
	//   //Ignore TP/ SL orders
	//   //Trading view is sending a TP/SL order
	//   //We ignore this alert because TP/SL is set at position entry
	//   if (
	//     alert.strategy.order_id.includes("TP") ||
	//     alert.strategy.order_id.includes("SL")
	//   ) {
	//     console.log("---TP/SL order ignore---");
	//     return res.json({ message: "ok" });
	//   }

	//   //When Tradingview sends alert, we will get the order contracts sent from Tradingview
	//   //We use this quanity to open position in Binance
	//   //we also need to change the contract precision because the one got from TV is different for Binnace

	//   let quantity = parseFloat(alert.strategy.order_price) < 10 ? (parseFloat(alert.strategy.order_contracts) || 0).toFixed(0) : (parseFloat(alert.strategy.order_contracts) || 0)  ;
	//   //  Number(
	//   //   Number(alert.strategy.order_contracts).toFixed(
	//   //     contractPrecision[alert?.symbol]
	//   //   )
	//   // );

	//   //Get the take profit price from Tradingview order
	//   const take_profit_price = Number(
	//     Number(alert.strategy.meta_data?.tp_price || 0).toFixed(
	//       pricePrecision[alert?.symbol]
	//     )
	//   );

	//   //Get the stop loss price from Tradingview order
	//   const stop_loss_price = Number(
	//     Number(alert.strategy.meta_data?.sl_price || 0).toFixed(
	//       pricePrecision[alert?.symbol]
	//     )
	//   );

	//   //Get order action from Tradingview. Either 'BUY' or 'SELL'
	//   const side = alert.strategy.order_action.toUpperCase();
	//   //Entry the position with MARKET PRICE
	//   if (alert.strategy.strategy_action === "entry") {
	//     let options = {
	//       symbol: alert?.symbol,
	//       side: side,
	//       positionSide: 'BOTH',
	//       type: "MARKET",
	//       quantity: quantity,
	//     };
	//     console.log("---ENTRY Order Starting---");
	//     console.log("options", options);
	//     let result = await client.futuresOrder(options);

	//     console.log("---ENTRY Order successful---");
	//     console.log("---ENTRY Order Result---", result);

	//     //Set a TP order when entrying a position
	//     if (take_profit_price) {
	//       const tp_side = side === "BUY" ? "SELL" : "BUY";

	//       let tp_options = {};

	//       //Here we can use either LIMIT order or TAKE PROFIT MARKET order
	//       //I would recommend TAKE PROFIT MARKET order to prevent unexpected behavior
	//       if (alert?.strategy?.use_limit_tp_sl === "true") {
	//         tp_options = {
	//           symbol: alert.symbol,
	//           side: tp_side,
	//           stopPrice: take_profit_price,
	//           type: "TAKE_PROFIT",
	//           quantity: quantity,
	//           reduceOnly: true,
	//           price: take_profit_price,
	//           timeInForce: "GTE_GTC",
	//         };
	//       } else {
	//         tp_options = {
	//           symbol: alert.symbol,
	//           side: tp_side,
	//           stopPrice: take_profit_price,
	//           type: "TAKE_PROFIT_MARKET",
	//           closePosition: true,
	//           timeInForce: "GTE_GTC",
	//         };
	//       }

	//       console.log("---TP Order Starting---");
	//       console.log("options", tp_options);
	//       let tp_result = await client.futuresOrder(tp_options);
	//       console.log("---TP Order successful---");
	//       console.log("---TP Order Result---", tp_result);
	//     }

	//     //Set a SL order when entrying a position
	//     if (stop_loss_price) {
	//       const sl_side = side === "BUY" ? "SELL" : "BUY";

	//       let sl_options = {};

	//       //Here we can use either LIMIT order or TAKE PROFIT MARKET order
	//       //I would recommend TAKE PROFIT MARKET order to prevent unexpected behavior
	//       if (alert?.strategy?.use_limit_tp_sl === "true") {
	//         sl_options = {
	//           symbol: alert.symbol,
	//           side: sl_side,
	//           stopPrice: stop_loss_price,
	//           type: "STOP",
	//           quantity: quantity,
	//           reduceOnly: true,
	//           price: stop_loss_price,
	//           priceProtect: true,
	//           timeInForce: "GTE_GTC",
	//         };
	//       } else {
	//         sl_options = {
	//           symbol: alert.symbol,
	//           side: sl_side,
	//           stopPrice: stop_loss_price,
	//           type: "STOP_MARKET",
	//           closePosition: true,
	//           priceProtect: true,
	//           timeInForce: "GTE_GTC",
	//         };
	//       }

	//       console.log("---SL Order starting---");
	//       console.log("options", sl_options);

	//       let sl_result = await client.futuresOrder(sl_options);

	//       console.log("---SL Order successful---");
	//       console.log("---SL Order result---", sl_result);
	//     }
	//   }

	//   //Handle close the position
	//   if (alert.strategy.strategy_action == "Close entry(s) order Short" 
	// || alert.strategy.strategy_action == "Close entry(s) order Long") {
	//     let options = {
	//       symbol: alert?.symbol,
	//       side: side,
	//       type: "MARKET",
	//       positionSide: "LONG",
	//       quantity: quantity
	//     };
	//     console.log("---CLOSE Order starting---");
	//     console.log("options", options);

	//     let result = await client.futuresOrder(options);
	//     console.log("---CLOSE Order successful---");
	//     console.log("---CLOSE Order result---", result);
	//   }

	//   //Handle reduce the position
	//   if (alert.strategy.strategy_action === "reduce") {
	//     let options = {
	//       symbol: alert?.symbol,
	//       side: side,
	//       type: "MARKET",
	//       quantity: quantity,
	//     };
	//     console.log("---REDUCE Order starting---");
	//     console.log("options", options);

	//     let result = await client.futuresOrder(options);
	//     console.log("---REDUCE Order successful---");
	//     console.log("---REDUCE Order---", result);
	//   }
	// } catch (error) {
	//   console.log("---Order error---");
	//   console.log(error);
	// }

	return res.json({ message: "ok" });
};


function formatVNDateTime(isoDate) {
	const dateObj = new Date(isoDate);

	const day = dateObj.getDate().toString().padStart(2, '0');
	const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
	const year = dateObj.getFullYear();
	const hours = dateObj.getHours().toString().padStart(2, '0');
	const minutes = dateObj.getMinutes().toString().padStart(2, '0');
	const seconds = dateObj.getSeconds().toString().padStart(2, '0');

	const formattedDate = `Ngày ${day}/${month}/${year} Lúc ${hours}:${minutes}:${seconds}`;
	return formattedDate;
}