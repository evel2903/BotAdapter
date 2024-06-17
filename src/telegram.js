import 'dotenv/config'
import axios from 'axios';
import { formatVNDateTime } from './common.js';
import dbContext from "./Database/dbContext.js";


const instance = axios.create({
    timeout: 30000, // 30 giây
});

export const sendTelegramMessage = async (message) => {
    try {
        await dbContext.GetTelegramSetting().then(async setting => {
            const token = setting.telegramToken
            const channel = setting.telegramChannel;
            message = `[${formatVNDateTime(new Date())}]: ${message}`;
            const url = `https://api.telegram.org/${token}/sendMessage`;
    
            const response = await instance.get(url, {
                params: {
                    chat_id: channel,
                    text: message
                }
            });
            return response.data;
        })
    } catch (error) {
        console.error('Error:', error);
    }
};
