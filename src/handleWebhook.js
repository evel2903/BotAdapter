import Binance from 'node-binance-api';
import { sendTelegramMessage } from './telegram.js'
import 'dotenv/config'

const binance = new Binance();
binance.options({
    APIKEY: process.env.BINANCE_API_KEY,
    APISECRET: process.env.BINANCE_SECRET_KEY
});

/**
 * Change leverage for a symbol in the futures market.
 *
 * @param {string} symbol - The symbol for which to change the leverage.
 * @param {number} leverage - The leverage value to set.
 */
async function changeLeverage(symbol, leverage) {
    try {
        await binance.futuresLeverage(symbol, leverage).then(async res => {
            let message = ''
            if (res.code == undefined) {
                message = `Đòn bẩy cặp giao dịch ${symbol} được thay đổi thành x${leverage}`
            }
            else {
                message = `Đòn bẩy cặp giao dịch ${symbol} đổi thành x${leverage} thất bại`
            }
            await sendTelegramMessage(message)
            console.log('CHANGE LEVERAGE SUSSCES', { REQUEST: { symbol: symbol, leverage: leverage }, RESPONSE: res })
        }).catch(err => console.log('CHANGE LEVERAGE ERROR', { REQUEST: { symbol: symbol, leverage: leverage }, ERROR: err }))
    } catch (error) {
        console.error(`Error setting leverage for ${symbol}: ${error}`)
    }
}

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
    const order_action = request.order_action;
    const symbol = request.symbol;
    const price = Number(`${request.price}`.substring(0, Number(request.sizePricePrecision)));
    const callbackRate = Number(request.callbackRate);
    const position_size_usdt = request.position_size_usdt;
    const leverage = request.leverage;
    const order_contracts = Math.floor((position_size_usdt * leverage) / price);
    const activationPrice = (price + (order_action == 'buy' ? (price * callbackRate) / 100 : -(price * callbackRate) / 100))
        .toString()
        .substring(0, Number(request.sizePricePrecision));

    const stopLossPrice = (order_action == 'buy'
        ? price - (2 * price * callbackRate) / 100
        : price + (2 * price * callbackRate) / 100)
        .toString()
        .substring(0, Number(request.sizePricePrecision));
    console.log(`Price: ${price}`);
    console.log(`Activation Price: ${activationPrice}`);
    console.log(`Stop Loss Price: ${stopLossPrice}`);

    try {
        await changeLeverage(symbol, leverage);
        await closePosition(symbol);

        if (order_action == 'buy') {
            // await binance.futuresBuy(symbol, order_contracts, price, { timeInForce: 'GTC', type: 'LIMIT' })
            //     .then(res => console.log('ORDER SUCCESS', { REQUEST: request, RESPONSE: res }))
            //     .catch(err => console.log('ORDER ERROR', { REQUEST: request, ERROR: err }));

            await binance.futuresMarketBuy(symbol, order_contracts)
                .then(res => console.log('ORDER SUCCESS', { REQUEST: request, RESPONSE: res }))
                .catch(err => console.log('ORDER ERROR', { REQUEST: request, ERROR: err }));
 
            await binance.futuresSell(symbol, order_contracts, price, { timeInForce: 'GTC', type: 'TRAILING_STOP_MARKET', callbackRate: callbackRate, activationPrice: activationPrice })
                .then(res => console.log('TRAILING STOP SUCCESS', { REQUEST: request, RESPONSE: res }))
                .catch(err => console.log('TRAILING STOP ERROR', { REQUEST: request, ERROR: err }));

            await binance.futuresSell(symbol, order_contracts, stopLossPrice, {
                timeInForce: 'GTC',
                stopPrice: stopLossPrice,
                type: 'STOP_MARKET'
            })
                .then(res => console.log('STOP LOSS SUCCESS', { REQUEST: request, RESPONSE: res }))
                .catch(err => console.log('STOP LOSS ERROR', { REQUEST: request, ERROR: err }));
        }
        else {
            // await binance.futuresSell(symbol, order_contracts, price, { timeInForce: 'GTC', type: 'LIMIT' })
            //     .then(res => console.log('ORDER SUCCESS', { REQUEST: request, RESPONSE: res }))
            //     .catch(err => console.log('ORDER ERROR', { REQUEST: request, ERROR: err }));

            await binance.futuresMarketSell(symbol, order_contracts)
                .then(res => console.log('ORDER SUCCESS', { REQUEST: request, RESPONSE: res }))
                .catch(err => console.log('ORDER ERROR', { REQUEST: request, ERROR: err }));

            await binance.futuresBuy(symbol, order_contracts, price, { timeInForce: 'GTC', type: 'TRAILING_STOP_MARKET', callbackRate: callbackRate, activationPrice: activationPrice })
                .then(res => console.log('TRAILING STOP SUCCESS', { REQUEST: request, RESPONSE: res }))
                .catch(err => console.log('TRAILING STOP ERROR', { REQUEST: request, ERROR: err }));


            await binance.futuresBuy(symbol, order_contracts, stopLossPrice, {
                timeInForce: 'GTC',
                stopPrice: stopLossPrice,
                type: 'STOP_MARKET'
            })
                .then(res => console.log('STOP LOSS SUCCESS', { REQUEST: request, RESPONSE: res }))
                .catch(err => console.log('STOP LOSS ERROR', { REQUEST: request, ERROR: err }));
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
