import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const secretKey = (process.env.KHALTI_SECRET_KEY || "").trim();
const url = "https://a.khalti.com/api/v2/epayment/initiate";

const authFormats = [
    `Key ${secretKey}`,
    `${secretKey}`,
    `Bearer ${secretKey}`
];

async function runTests() {
    for (const auth of authFormats) {
        console.log(`\nTesting Auth Format: "${auth.substring(0, 20)}..."`);
        try {
            const res = await axios.post(url, {
                return_url: "https://khalti.com",
                website_url: "https://khalti.com",
                amount: 1000,
                purchase_order_id: "test_" + Date.now(),
                purchase_order_name: "test_product"
            }, {
                headers: {
                    Authorization: auth,
                    "Content-Type": "application/json",
                }
            });
            console.log("✅ SUCCESS with format:", auth.split(' ')[0] || auth);
            return;
        } catch (err) {
            console.log("❌ FAILED:", err.response?.status, err.response?.data?.detail || err.message);
        }
    }
}

runTests();
