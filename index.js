const { Client, LocalAuth } = require('whatsapp-web.js');
const http = require('http');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // 👈 জেমিনি এপিআই প্যাকেজ

// 🌐 ১. Render এর Port Binding এরর দূর করার জন্য মিনি সার্ভার
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsApp Bot is running perfectly!\n');
}).listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// 📞 ২. তোমার কাতারের মোবাইল নাম্বার (যেটা অলরেডি লিঙ্কড)
const PAIRED_PHONE_NUMBER = '97470639538'; 

// 🔑 ৩. জেমিনি এআই কনফিগারেশন (রেন্ডারের Environment Variable থেকে কি নেবে)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const client = new Client({
    authStrategy: new LocalAuth(), 
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-zygote',
            '--single-process',          // র‍্যাম বাঁচানোর জন্য
            '--disable-gpu',
            // 👇 হোয়াটসঅ্যাপকে ফাঁকি দেওয়ার জন্য আসল কম্পিউটারের ইউজার এজেন্ট
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        ]
    }
});

// 🔑 ৪. পেয়ারিং কোড জেনারেট করার ফাংশন (৫ সেকেন্ডের সেফ ডিলে সহ)
client.on('qr', async (qr) => {
    try {
        console.log('⏳ একটু অপেক্ষা করো, পেয়ারিং কোডের জন্য পেজ রেডি হচ্ছে...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('⏳ এবার পেয়ারিং কোড রিকোয়েস্ট করা হচ্ছে...');
        const pairingCode = await client.requestPairingCode(PAIRED_PHONE_NUMBER);
        console.log('====================================');
        console.log(`YOUR WHATSAPP PAIRING CODE: ${pairingCode}`);
        console.log('====================================');
    } catch (error) {
        console.error('কোড তৈরি করতে সমস্যা হয়েছে:', error.message || error);
    }
});

// 🚫 ৫. সেফ মেমোরি সেভার (শুধু ইমেজ আর মিডিয়া ব্লক করবে, যাতে ক্র্যাশ না হয়)
client.on('ready', async () => {
    console.log('🤖 WhatsApp Bot successfully ready!');
    
    const page = client.pupPage;
    if (page) {
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (['image', 'media'].includes(request.resourceType())) {
                request.abort();
            } else {
                request.continue();
            }
        });
    }
});

// 🧹 ৬. প্রতি ৩০ মিনিট পর পর জমানো ক্যাশ মেমোরি ক্লিয়ার করার অটো-ক্লিনার
setInterval(async () => {
    try {
        console.log("🧹 ৩০ মিনিট হয়ে গেছে! সার্ভারের জমানো ক্যাশ ডেটা ক্লিয়ার করা হচ্ছে...");
        if (client.pupPage) {
            const clientContext = await client.pupPage.context();
            await clientContext.clearPermissionOverrides();
        }
        if (global.gc) {
            global.gc(); 
        }
    } catch (error) {
        console.log("ক্যাশ ক্লিয়ার প্রবলেম:", error.message);
    }
}, 30 * 60 * 1000);

// 💬 ৭. জেমিনি এআই মেসেজিং পার্ট (আসল রিপ্লাই ইঞ্জিন)
client.on('message', async (msg) => {
    if (msg.fromMe) return; // নিজের পাঠানো মেসেজে বট রিপ্লাই দেবে না

    try {
        console.log(`📩 নতুন মেসেজ এসেছে: ${msg.body}`);
        
        // জেমিনি এআই এর কাছ থেকে রেসপন্স জেনারেট করা
        const result = await model.generateContent(msg.body);
        const responseText = result.response.text();
        
        // হোয়াটসঅ্যাপে অটো-রিপ্লাই পাঠানো
        await msg.reply(responseText);
        console.log(`📤 বটের রিপ্লাই পাঠানো হয়েছে!`);
        
    } catch (error) {
        console.error("জেমিনি এআই রিপ্লাই দিতে পারেনি কারণ:", error.message);
    }
});

client.initialize();
