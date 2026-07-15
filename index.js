const { Client, LocalAuth } = require('whatsapp-web.js');

// 📞 এখানে তোমার হোয়াটসঅ্যাপ নম্বরটি দাও (অবশ্যই কান্ট্রি কোড সহ, কোনো '+' বা স্পেস থাকবে না)
// উদাহরণ: '8801843926888' (যদি নম্বরটি এটিই হয়ে থাকে)
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
            '--single-process',          // রেন্ডার সার্ভারের র‍্যাম বাঁচানোর জন্য সবচেয়ে গুরুত্বপূর্ণ
            '--disable-gpu',
            '--disable-canvas-aa',
            '--disable-2d-matrix',
            '--disable-accelerated-2d-canvas',
            '--disable-gl-drawing-for-tests'
        ]
    }
});

// 🔑 পেয়ারিং কোড জেনারেট করার আসল ফাংশন
client.on('qr', async (qr) => {
    try {
        console.log('⏳ পেয়ারিং কোড রিকোয়েস্ট করা হচ্ছে...');
        // তোমার দেওয়া নম্বরের জন্য হোয়াটসঅ্যাপ সার্ভার থেকে কোড নিয়ে আসবে
        const pairingCode = await client.requestPairingCode(PAIRED_PHONE_NUMBER);
        console.log('====================================');
        console.log(`YOUR WHATSAPP PAIRING CODE: ${pairingCode}`);
        console.log('====================================');
    } catch (error) {
        console.error('কোড তৈরি করতে সমস্যা হয়েছে:', error.message);
    }
});

// 🚫 ফালতু মিডিয়া ফাইল ব্লক করে র‍্যাম বাঁচানোর অংশ
client.on('ready', async () => {
    console.log('🤖 WhatsApp Bot successfully ready!');
    
    const page = client.pupPage;
    if (page) {
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (['image', 'media', 'font', 'stylesheet'].includes(request.resourceType())) {
                request.abort();
            } else {
                request.continue();
            }
        });
    }
});

// 🧹 প্রতি ৩০ মিনিট পর পর সার্ভারের জমানো ক্যাশ ক্লিয়ার করা
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
        console.log("ক্যাশ ক্লিয়ার করতে সামান্য সমস্যা হয়েছে, তবে বট সচল আছে:", error.message);
    }
}, 30 * 60 * 1000);

// তোমার বাকি মেসেজ রিসিভ এবং জেমিনি এআই রিপ্লাইয়ের কোড নিচে আগের মতোই থাকবে...
client.on('message', async (msg) => {
    if (msg.fromMe) return;
    // জেমিনি এআই কোড এখানে থাকবে...
});

client.initialize();
