const { Client, LocalAuth } = require('whatsapp-web.js');
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

// Gemini AI Config
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "Tumi ekta friendly AI assistant. Sobar sathe Bangla ba Banglish-e kotha bolbe."
});

// WhatsApp Client Config
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

// Pairing Code Logic (No QR needed)
let pairingCodeRequested = false;
client.on('qr', async (qr) => {
    if (!pairingCodeRequested) {
        try {
            // 🔽 Tomar WhatsApp number-ti ekhane add kora hoyeche
            const phoneNumber = '8801843926888'; 
            
            console.log(`[!] Requesting pairing code for: ${phoneNumber}`);
            const code = await client.requestPairingCode(phoneNumber);
            
            console.log(`\n====================================`);
            console.log(`YOUR WHATSAPP PAIRING CODE: ${code}`);
            console.log(`====================================\n`);
            
            pairingCodeRequested = true;
        } catch (err) {
            console.error('Error requesting pairing code:', err);
        }
    }
});

client.on('ready', () => {
    console.log('WhatsApp Bot successfully ready!');
});

// AI Chat Reply Logic
client.on('message', async (msg) => {
    if (msg.fromMe) return; // Nijer message-e reply korbe na
    
    try {
        const response = await model.generateContent(msg.body);
        await msg.reply(response.response.text());
    } catch (error) {
        console.error('Gemini Error:', error);
    }
});

client.initialize();
