const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('WhatsApp Bot active!');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "Tumi ekta friendly AI assistant. Sobar sathe Banglish-e kotha bolbe."
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Nicher QR Code-ti scan koro:');
});

client.on('ready', () => {
    console.log('WhatsApp Bot successfully ready!');
});

client.on('message', async (message) => {
    try {
        if (!message.from.endsWith('@g.us')) {
            const chat = await message.getChat();
            await chat.sendStateTyping();

            const result = await model.generateContent(message.body);
            const responseText = result.response.text();

            await message.reply(responseText);
        }
    } catch (error) {
        console.error("AI Error:", error);
    }
});

client.initialize();
