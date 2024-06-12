import 'dotenv/config'
import axios from 'axios';
import { formatVNDateTime } from './common.js';

// Function to send a message to a Telegram channel
export const sendTelegramMessage = async (message) => {
    try {
        const token = process.env.TELEGRAM_TOKEN;
        const channel = process.env.TELEGRAM_CHANNEL;
        message = `[${formatVNDateTime(new Date())}]: ${message}`;
        // Construct the Telegram API endpoint for sending a message
        const url = `https://api.telegram.org/${token}/sendMessage`;
        
        // Use axios to send the GET request
        const response = await axios.get(url, {
            params: {
                chat_id: channel,
                text: message
            }
        });
        // Return the response data
        return response.data;
    } catch (error) {
        // Handle errors by logging them to the console
        console.error('Error:', error);
    }
}
