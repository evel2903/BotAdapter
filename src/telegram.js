import 'dotenv/config'

// Function to send a message to a Telegram channel
export const sendTelegramMessage =  async (message) => {
    try {
        const token = process.env.TELEGRAM_TOKEN
        const channel = process.env.TELEGRAM_CHANNEL
        // Construct the Telegram API endpoint for sending a message
        const request = await fetch(`https://api.telegram.org/${token}/sendMessage?chat_id=${channel}&text=${message}`, {
            method: 'GET',
            redirect: 'follow'
        });
        // Parse the JSON response from the Telegram API
        const response = await request.json();
        // Return the response object
        return response;
    } catch (error) {
        // Handle errors by logging them to the console
        console.error('Error:', error);
    }
}