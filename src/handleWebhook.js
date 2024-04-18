import Binance from 'node-binance-api';
import { sendTelegramMessage } from './telegram.js'
import 'dotenv/config'

const binance = new Binance();
binance.options({
	APIKEY: process.env.BINANCE_API_KEY,
	APISECRET: process.env.BINANCE_SECRET_KEY
});

let ORDERED_LIST = []
function addOrdered(apiRes){
    let newOrdered = {
        orderId: apiRes.orderId,
		symbol: apiRes.symbol,
		origQty: Number(apiRes.origQty),
		side: apiRes.side,
        price: apiRes.price
	}
	ORDERED_LIST.push(newOrdered)
}
function findOrderedBySymbol(symbol) {
	return ORDERED_LIST.find(item => item.symbol == symbol) || null;
}
function removeOrderedBySymbol(symbol) {
	let index = ORDERED_LIST.findIndex(item => item.symbol == symbol);
	if (index !== -1) {
		ORDERED_LIST.splice(index, 1);
	}
}
async function getUSDTBalance(){
    try {
        const resApi =  await binance.futuresBalance();
        return resApi.find(item => item.asset == 'USDT').balance
        
    } catch (error) {
        console.error(`getUSDTBalance$: ${error}`);
        return 0
    }
}
async function getUSDTPnl(){
    try {
        const resApi =  await binance.futuresBalance();
        return resApi.find(item => item.asset == 'USDT').crossUnPnl
    } catch (error) {
        console.error(`getUSDTBalance$: ${error}`);
        return 0
    }
}
async function openOrderPosition(request){
    const order_action = request.strategy.order_action
    const symbol = request.symbol
    const order_price = Number(`${request.strategy.order_price}`.substring(0, 5))
    const order_contracts = order_price < 10 ? Number(request.strategy.order_contracts).toFixed(0) : Number(request.strategy.order_contracts).toFixed(1)
    console.log('order_price', order_price)
    try {
        let telegramMessage = ''
        const closeFlag = await closeOrderPosition(symbol)
		if(closeFlag == false) return
		removeOrderedBySymbol(symbol)
        if(order_action == 'buy'){
            const resApi = await binance.futuresBuy(symbol, order_contracts, order_price, {timeInForce: 'GTC', type: 'LIMIT'})
            console.log(resApi);
            if(resApi.code != undefined){
                //Todo: Gửi lệnh thất bại
                telegramMessage = `Lệnh: ORDER [${order_action}] [${symbol}] với số lượng [${order_contracts} ${symbol.slice(0, -4)}] tại giá ${order_price} được mở **THẤT BẠI** Lỗi [${resApi.msg}]`
                console.error(`Lỗi: ${resApi.msg}`)
            }
            else{
                //Todo: Gửi lệnh thành công
                addOrdered(resApi)
                telegramMessage = `Lệnh: ORDER [${order_action}] [${symbol}] với số lượng [${order_contracts} ${symbol.slice(0, -4)}] tại giá ${order_price} được mở **THÀNH CÔNG**`
            }
        }
        else{
            const resApi = await binance.futuresSell(symbol, order_contracts, order_price, {timeInForce: 'GTC', type: 'LIMIT'})
            console.log(resApi);
            if(resApi.code != undefined){
                //Todo: Gửi lệnh thất bại
                telegramMessage = `Lệnh: ORDER [${order_action}] [${symbol}] với số lượng [${order_contracts} ${symbol.slice(0, -4)}] tại giá ${order_price} được mở **THẤT BẠI** Lỗi [${resApi.msg}]`
                console.error(`Lỗi: ${resApi.msg}`)
            }
            else{
                //Todo: Gửi lệnh thành công
                addOrdered(resApi)
                telegramMessage = `Lệnh: ORDER [${order_action}] [${symbol}] với số lượng [${order_contracts} ${symbol.slice(0, -4)}] tại giá ${order_price} được mở **THÀNH CÔNG**`
            }
        }
        await sendTelegramMessage(telegramMessage)
    } catch (error) {
        console.error(`openOrderPosition$: ${error}`);
        sendTelegramMessage(`openOrderPosition$: ${error}`)
    }
}
async function closeOrderPosition(symbol){
    try {
		let rst = false
        let telegramMessage = ''
        const ordered = findOrderedBySymbol(symbol)
        if (ordered == null) {
            //Todo: Bỏ qua nếu symbol chưa được Order
            rst = true
        }
        else{
            //Todo: Xử lý nếu symbol đã được Order
            const resApi = await binance.futuresCancel( symbol, {orderId: ordered.orderId})
            console.log('closeOrderPosition resApi',resApi)
            if(resApi.code != undefined){
                //Todo: Gửi lệnh hủy thất bại ** Lệnh này đã dính Entry
                const resApi2 = ordered.side == 'SELL' ? await binance.futuresMarketBuy(symbol, ordered.origQty) : await binance.futuresMarketSell(symbol, ordered.origQty)
                console.log('closeOrderPosition resApi2', resApi2);
                if(resApi2.code != undefined){
                    telegramMessage = `Lệnh: ĐÓNG VỊ THẾ [${ordered.side}] [${symbol}] với số lượng [${ordered.origQty} ${symbol.slice(0, -4)}] tại giá ${ordered.price} **THẤT BẠI** Lỗi [${resApi2.msg}]`
					rst =  false
                }
                else{
                    telegramMessage = `Lệnh: ĐÓNG VỊ THẾ [${ordered.side}] [${symbol}] với số lượng [${ordered.origQty} ${symbol.slice(0, -4)}] tại giá ${ordered.price} **THÀNH CÔNG**`
					rst =  true
                } 
            }
            else{
                telegramMessage = `Lệnh: ORDER [${ordered.side}] [${symbol}] với số lượng [${ordered.origQty} ${symbol.slice(0, -4)}] tại giá ${ordered.price} được hủy **THÀNH CÔNG**`
				rst =  true
            }
        }
        sendTelegramMessage(telegramMessage)
		return rst
    } catch (error) {
        console.error(`closeOrderPosition$: ${error}`);
        sendTelegramMessage(`closeOrderPosition$: ${error}`)
		return false
    }

}

export const handleWebhook = async (req, res) => {
	try {
		const alert = req.body
		openOrderPosition(alert)

	}
	catch (error) {
		console.error(`handleWebhook$: ${error}`);
        sendTelegramMessage(`handleWebhook$: ${error}`)
	}
	return res.json({ message: "ok" });
};


