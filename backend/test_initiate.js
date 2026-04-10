import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ override: true });

async function test() {
    const secretKey = (process.env.KHALTI_SECRET_KEY || "").trim();
    const url = "https://a.khalti.com/api/v2/epayment/initiate";

    console.log("Testing Khalti API with:");
    console.log("URL:", url);
    console.log("Key:", `Key ${secretKey.substring(0, 20)}...`);

    const payload = {
        return_url: "https://khalti.com",
        website_url: "https://khalti.com",
        amount: 1000,
        purchase_order_id: "test_" + Date.now(),
        purchase_order_name: "test_product"
    };

    try {
        const res = await axios.post(url, payload, {
            headers: {
                Authorization: `Key ${secretKey}`,
                "Content-Type": "application/json",
            }
        });
        console.log("SUCCESS!", res.data);
    } catch (err) {
        console.error("FAILED!");
        console.error("Status:", err.response?.status);
        console.error("Data:", JSON.stringify(err.response?.data, null, 2));
    }
}

test();
