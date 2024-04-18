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
    const order_contracts = request.strategy.order_contracts
    const order_price = request.strategy.order_price
    try {
        let telegramMessage = ''
        await closeOrderPosition(symbol)
        if(order_action == 'buy'){
            const resApi = await binance.futuresBuy(symbol, order_contracts, order_price)
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
            const resApi = await binance.futuresSell(symbol, order_contracts, order_price)
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
        sendTelegramMessage(telegramMessage)
    } catch (error) {
        console.error(`openOrderPosition$: ${error}`);
        sendTelegramMessage(`openOrderPosition$: ${error}`)
    }
}
async function closeOrderPosition(symbol){
    try {
        let telegramMessage = ''
        const ordered = findOrderedBySymbol(symbol)
        if (ordered == null) {
            //Todo: Bỏ qua nếu symbol chưa được Order
            return
        }
        else{
            //Todo: Xử lý nếu symbol đã được Order
            const resApi = await binance.futuresCancel( symbol, {orderId: ordered.orderId})
            console.log(resApi)
            if(resApi.code != undefined){
                //Todo: Gửi lệnh hủy thất bại ** Lệnh này đã dính Entry
                const resApi2 = ordered.side == 'SELL' ? await binance.futuresMarketBuy(symbol) : await binance.futuresMarketSell(symbol)
                if(resApi2.code != undefined){
                    telegramMessage = `Lệnh: ĐÓNG VỊ THẾ [${ordered.side}] [${symbol}] với số lượng [${ordered.origQty} ${symbol.slice(0, -4)}] tại giá ${ordered.price} **THẤT BẠI** Lỗi [${resApi2.msg}]`
                }
                else{
                    telegramMessage = `Lệnh: ĐÓNG VỊ THẾ [${ordered.side}] [${symbol}] với số lượng [${ordered.origQty} ${symbol.slice(0, -4)}] tại giá ${ordered.price} **THÀNH CÔNG**`
                } 
            }
            else{
                telegramMessage = `Lệnh: ORDER [${ordered.side}] [${symbol}] với số lượng [${ordered.origQty} ${symbol.slice(0, -4)}] tại giá ${ordered.price} được hủy **THÀNH CÔNG**`
            }
        }
        sendTelegramMessage(telegramMessage)
    } catch (error) {
        console.error(`closeOrderPosition$: ${error}`);
        sendTelegramMessage(`closeOrderPosition$: ${error}`)
    }

}