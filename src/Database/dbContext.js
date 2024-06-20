import { JsonDB, Config } from 'node-json-db';

const db = new JsonDB(new Config("./db", true, false, '/'));


// -- Account
const insertAccount = async (accout) =>{
    await db.push("/Account[]", accout, true);
} 
const getAccount = async () => {
    try{
        return await db.getData("/Account");
    }
    catch{
        return []
    }
}
const deleteAccount = async (id) => {
    let index = await db.getIndex("/Account", id, "accountId");
    await db.delete(`/Account[${index}]`);
}

const getAccountByAccountId = async (id) =>{
    let index = await db.getIndex("/Account", id, "accountId");
    return await db.getData(`/Account[${index}]`);
}

// -- Telegram
const updateTelegramSetting = async (teleSetting) => {
    await db.push('/TelegramSetting', teleSetting)
}

const getTelegramSetting = async () => {
    try{
        return await db.getData("/TelegramSetting");
    }
    catch{
        return {
            "telegramToken":"",
            "telegramChannel":""
         }
    }
}

// -- Setting
const updateSetting = async (setting) => {
    await db.push('/Setting', setting)
}
const getSetting = async () => {
    try{
        return await db.getData("/Setting");
    }
    catch{
        return {
            "typeOrder":"LIMIT"
         }
    }
}

export default{
    GetAccount: getAccount,
    GetAccountByAccountId: getAccountByAccountId,
    InsertAccount: insertAccount,
    DeleteAccount: deleteAccount,

    GetTelegramSetting: getTelegramSetting,
    UpdateTelegramSetting: updateTelegramSetting,

    GetSetting: getSetting,
    UpdateSetting: updateSetting,
}