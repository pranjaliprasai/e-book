import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ override: true });

async function testWithLhrUrl() {
    const secretKey = (process.env.KHALTI_SECRET_KEY || "").trim();
    const lhr_url = "https://ebb73d0f500fca.lhr.life";
    const url = "https://a.khalti.com/api/v2/epayment/initiate";

    console.log("Testing with lhr.life URL:");
    console.log("Key:", `Key ${secretKey.substring(0, 20)}...`);
    console.log("URL:", lhr_url);

    try {
        const res = await axios.post(url, {
            return_url: `${lhr_url}/api/khalti/verify`,
            website_url: lhr_url,
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

testWithLhrUrl();
