import dbContext from "./Database/dbContext.js";
import Binance from 'node-binance-api';
const alert = {
    "symbol": "TAOUSDT",
    "order_action": "buy",
    "sizePricePrecision": "7",
    "price": "0.2222",
    "position_size_usdt": "2",
    "leverage": "5",
    "callbackRate": "3",
    "accountId": "main"
}
const accountId = alert.accountId

await dbContext.GetAccountByAccountId(accountId).then(async account => {
    const binance = new Binance();
    binance.options({
        APIKEY: account.accountAPIKey,
        APISECRET: account.accountSecretKey
    });
    const positionRisk = await binance.futuresPositionRisk();
    const position = positionRisk.find(x => x.symbol === alert.symbol);
    const openOrders = await binance.futuresOpenOrders(alert.symbol);
    const order = openOrders.find(x => x.type === "LIMIT")
    if (position.positionAmt == 0 && (order == undefined || order == null)) {
        console.log(`Không có lệnh order,  không có vị thế của ${alert.symbol}, cần đóng lệnh`);
    }
    else{
        console.log(`Còn vị thế, hoặc lệnh Limit của ${alert.symbol}, bỏ qua`);
    }
})