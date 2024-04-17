import Binance from 'node-binance-api';
import { sendTelegramMessage } from './telegram.js'
import 'dotenv/config'

const client = new Binance();
client.options({
	APIKEY: process.env.BINANCE_API_KEY,
	APISECRET: process.env.BINANCE_SECRET_KEY
});
//Danh sách đã được order
let ORDERED_LIST = []
function addOrdered(apiResponse) {
	let newOrdered = {
		symbol: apiResponse.symbol,
		origQty: Number(apiResponse.origQty),
		side: apiResponse.side
	}
	ORDERED_LIST.push(newOrdered)
}
function findOrderedExistInOrderedList(symbol) {
	return ORDERED_LIST.find(item => item.symbol == symbol) || null;
}
function removeOrderedBySymbol(symbol) {
	const index = ORDERED_LIST.findIndex(item => item.symbol === symbol);
	if (index !== -1) {
		ORDERED_LIST.splice(index, 1);
	}
}
async function HandleOrdered(symbol) {
	const ordered = findOrderedExistInOrderedList(symbol)
	if (ordered == null) return
	const result = ordered.side == 'BUY' ? await client.futuresMarketSell(symbol, ordered.origQty) : await client.futuresMarketBuy(symbol, ordered.origQty)
	let orderSusscesMessage = `Lệnh [${ordered.side}] ${ordered.origQty} ${ordered.symbol} *Đóng thành công*.`
	await sendTelegramMessage(orderSusscesMessage)
	removeOrderedBySymbol(symbol)
	return result
}
//Xử lý khi nhận được lệnh Order
async function HandleOrderRequest(alert) {
	let symbol = alert?.symbol
	let quantity = parseFloat(alert.strategy.order_price) < 10 ? (parseFloat(alert.strategy.order_contracts) || 0).toFixed(0) : (parseFloat(alert.strategy.order_contracts) || 0);
	let side = alert.strategy.order_action.toUpperCase();

	await HandleOrdered(symbol)
	return side == 'BUY' ? await client.futuresMarketBuy(symbol, quantity) : await client.futuresMarketSell(symbol, quantity)
}

export const handleWebhook = async (req, res) => {
	try {
		const alert = req.body;

		if (!alert?.symbol) {
			return res.json({ message: "Error: Symbol Không tồn tại" });
		}

		let requestMessage = `Yêu cầu mở lệnh [${alert.strategy.order_action.toUpperCase()}] ${alert?.symbol} với số lượng ${alert.strategy.order_contracts} ${alert?.symbol.slice(0, -4)}.`
		await sendTelegramMessage(requestMessage)

		//Xử lý khi nhận được lệnh Order	
		await HandleOrderRequest(alert).then(async (response) => {
			let orderSusscesMessage = `Lệnh [${response.side}] ${response.origQty} ${response.symbol} *Thành công*.`
			await sendTelegramMessage(orderSusscesMessage)
			addOrdered(response)
		})
			.catch(async (error) => {
				let orderSusscesMessage = `${requestMessage} *Thất bại*. Lỗi${error}.`
				await sendTelegramMessage(orderSusscesMessage)
			})
	}
	catch (error) {

	}
	return res.json({ message: "ok" });
};


