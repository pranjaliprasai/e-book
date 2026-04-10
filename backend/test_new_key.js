import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ override: true });

async function testNewKey() {
    const secretKey = (process.env.KHALTI_SECRET_KEY || "").trim();
    const url = "https://a.khalti.com/api/v2/epayment/initiate";

    console.log("Testing NEW Khalti API key from .env:");
    console.log("Key:", `Key ${secretKey.substring(0, 30)}...`);
    console.log("Length:", secretKey.length);

    try {
        const res = await axios.post(url, {
            return_url: "https://khalti.com",
            website_url: "https://khalti.com",
            amount: 1000,
            purchase_order_id: "test_" + Date.now(),
            purchase_order_name: "test_product"
        }, {
            headers: {
                Authorization: `Key ${secretKey}`,
                "Content-Type": "application/json",
            }
        });
        console.log("✅ SUCCESS!", res.data);
    } catch (err) {
        console.error("❌ FAILED!");
        console.error("Status:", err.response?.status);
        console.error("Data:", JSON.stringify(err.response?.data, null, 2));
    }
}

testNewKey();
