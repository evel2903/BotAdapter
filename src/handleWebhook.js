import Binance from 'node-binance-api';
import { sendTelegramMessage } from './telegram.js'
import 'dotenv/config'

const binance = new Binance();
binance.options({
    APIKEY: process.env.BINANCE_API_KEY,
    APISECRET: process.env.BINANCE_SECRET_KEY
});

/**
 * Closes all open orders and positions for a given symbol in the futures market.
 *
 * @param {string} symbol - The symbol of the position to close.
 * @return {Promise<void>} - A promise that resolves when the position is closed.
 */
async function closePosition(symbol) {
    try {
        // Đóng tất cả các lệnh mở với symbol này
        const openOrders = await binance.futuresOpenOrders(symbol);
        if (openOrders.length > 0) {
            await binance.futuresCancelAll(symbol);
            console.log(`Cancelled all open orders for ${symbol}`);
        }
        // Kiểm tra vị thế hiện tại
        const positionRisk = await binance.futuresPositionRisk();
        const position = positionRisk.find(x => x.symbol === symbol);
        const positionAmt = parseFloat(position.positionAmt);
        const side = positionAmt > 0 ? 'SELL' : 'BUY';

        if (position && Number(position.positionAmt) !== 0) {
            // Xử lý đóng vị thế


            const quantity = Math.abs(positionAmt);
            const order = side == 'BUY' ? await binance.futuresMarketBuy(symbol, quantity) : await binance.futuresMarketSell(symbol, quantity)
        } else {
            console.log(`No position to close for ${symbol}`);
        }
        await sendTelegramMessage(`Đóng vị thế [${(positionAmt > 0 ? 'LONG' : 'SHORT')}] ${symbol}`);
    } catch (error) {
        console.error(`Error in closePositionBySymbol: ${error}`);
    }
}

/**
 * Opens a position in the futures market.
 *
 * @param {Object} request - The request object containing the following properties:
 *   - order_action: The order action, either 'buy' or 'sell'.
 *   - symbol: The symbol of the position.
 *   - price: The price of the position.
 *   - sizePricePrecision: The precision of the size price.
 *   - callbackRate: The callback rate.
 *   - position_size_usdt: The size of the position in USDT.
 *   - leverage: The leverage.
 * @return {Promise<void>} A promise that resolves when the position is opened.
 */
async function openPosition(request) {
    const order_action = request.order_action
    const symbol = request.symbol
    const price = Number(`${request.price}`.substring(0, Number(request.sizePricePrecision)))
    const callbackRate = Number(request.callbackRate)
    const position_size_usdt = request.position_size_usdt
    const leverage = request.leverage
    const order_contracts = Math.floor((position_size_usdt * leverage) / price)
    try {
        await closePosition(symbol)
        if (order_action == 'buy') {
            await binance.futuresBuy(symbol, order_contracts, price, { timeInForce: 'GTC', type: 'LIMIT' })
            await binance.futuresSell(symbol, order_contracts, price, { timeInForce: 'GTC', type: 'TRAILING_STOP_MARKET', callbackRate: callbackRate })
        }
        else {
            await binance.futuresSell(symbol, order_contracts, price, { timeInForce: 'GTC', type: 'LIMIT' })
            await binance.futuresBuy(symbol, order_contracts, price, { timeInForce: 'GTC', type: 'TRAILING_STOP_MARKET', callbackRate: callbackRate })
        }
        await sendTelegramMessage(`Mở vị thế [${(order_action == 'buy' ? 'LONG' : 'SHORT')}] ${symbol}`);
    } catch (error) {
        console.error(`openOrderPosition$: ${error}`);
    }
}

export const handleWebhook = async (req, res) => {
    try {
        const alert = req.body
        await openPosition(alert)

    }
    catch (error) {
        console.error(`handleWebhook$: ${error}`);
        await sendTelegramMessage(`handleWebhook$: ${error}`)
    }
    return res.json({ message: "ok" });
};
