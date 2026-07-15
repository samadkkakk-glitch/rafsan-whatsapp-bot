const { Client, LocalAuth } = require('whatsapp-web.js');
const http = require('http'); // 👈 রেন্ডারের পোর্ট এরর ঠিক করার জন্য

// 🌐 ১. Render এর Port Binding এরর দূর করার জন্য একটি মিনি সার্ভার
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsApp Bot is running perfectly!\n');
}).listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// 📞 তোমার হোয়াটসঅ্যাপ নম্বর (কান্ট্রি কোডসহ, কোনো '+' বা স্পেস ছাড়া)
const PAIRED_PHONE_NUMBER = '8801843926888'; 

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
            '--disable-gpu'
        ]
    }
});

// 🔑 পেয়ারিং কোড জেনারেট করার ফাংশন
client.on('qr', async (qr) => {
    try {
        console.log('⏳ পেয়ারিং কোড রিকোয়েস্ট করা হচ্ছে...');
        const pairingCode = await client.requestPairingCode(PAIRED_PHONE_NUMBER);
        console.log('====================================');
        console.log(`YOUR WHATSAPP PAIRING CODE: ${pairingCode}`);
        console.log('====================================');
    } catch (error) {
        console.error('কোড তৈরি করতে সমস্যা হয়েছে:', error.message);
    }
});

// 🚫 সেফ মেমোরি সেভার (শুধু ইমেজ আর মিডিয়া ব্লক করবে, স্টাইলশিট নয়)
client.on('ready', async () => {
    console.log('🤖 WhatsApp Bot successfully ready!');
    
    const page = client.pupPage;
    if (page) {
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            // শুধু ভারী ছবি আর ভিডিও ব্লক করা হলো, যাতে হোয়াটসঅ্যাপ স্ক্রিপ্ট ভেঙে না যায়
            if (['image', 'media'].includes(request.resourceType())) {
                request.abort();
            } else {
                request.continue();
            }
        });
    }
});

// 🧹 প্রতি ৩০ মিনিট পর পর জমানো ক্যাশ মেমোরি ক্লিয়ার করার অটো-ক্লিনার
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

// 💬 জেমিনি এআই মেসেজিং পার্ট (নিচে তোমার আসল এআই কোডটি থাকবে)
client.on('message', async (msg) => {
    if (msg.fromMe) return;
    // তোমার জেমিনি এআই রিপ্লাইয়ের কোড এখানে আগের মতোই রেখে দাও...
});

client.initialize();
