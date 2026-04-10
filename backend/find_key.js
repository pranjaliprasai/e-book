import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const keysToTry = [
    "test_secret_key_8787d339e5a54b82b1dce95066ede331", // Current 32-char one
    "test_secret_key_8787d339e5a54b82b1dce950666ede33", // Original minus 1
    "test_secret_key_6769137be2eb4331be49d40db8e9937e", // Public key as secret key
];

async function runTests() {
    for (const key of keysToTry) {
        console.log(`\nTesting Key: Key ${key.substring(0, 20)}... (Length: ${key.length})`);
        try {
            const res = await axios.post("https://a.khalti.com/api/v2/epayment/initiate", {
                return_url: "https://khalti.com",
                website_url: "https://khalti.com",
                amount: 1000,
                purchase_order_id: "test_" + Date.now(),
                purchase_order_name: "test_product"
            }, {
                headers: {
                    Authorization: `Key ${key}`,
                    "Content-Type": "application/json",
                }
            });
            console.log("✅ SUCCESS with this key!");
            console.log("Key was actually:", key);
            return;
        } catch (err) {
            console.log("❌ FAILED:", err.response?.status, err.response?.data?.detail || err.message);
        }
    }
}

runTests();
