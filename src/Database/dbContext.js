import { JsonDB, Config } from 'node-json-db';

const db = new JsonDB(new Config("./db", true, false, '/'));


// -- Account
const insertAccount = async (accout) =>{
    await db.push("/Account[]", accout, true);
} 
const getAccount = async () => {
    return await db.getData("/Account");
}
const deleteAccount = async (id) => {
    let index = await db.getIndex("/Account", id, "accountId");
    await db.delete(`/Account[${index}]`);
}

const getAccountByAccountId = async (id) =>{
    let index = await db.getIndex("/Account", id, "accountId");
    return await db.getData(`/Account[${index}]`);
}

const updateTelegramSetting = async (setting) => {
    await db.push('/TelegramSetting', setting)
}

const getTelegramSetting = async () => {
    return await db.getData("/TelegramSetting");
}


export default{
    GetAccount: getAccount,
    GetAccountByAccountId: getAccountByAccountId,
    InsertAccount: insertAccount,
    DeleteAccount: deleteAccount,

    GetTelegramSetting: getTelegramSetting,
    UpdateTelegramSetting: updateTelegramSetting,
}