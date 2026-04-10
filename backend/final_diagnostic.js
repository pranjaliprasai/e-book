import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ override: true });

async function finalDiagnostic() {
    const secretKey = (process.env.KHALTI_SECRET_KEY || "").trim();
    const sandboxUrl = "https://a.khalti.com/api/v2/epayment/initiate";
    const liveUrl = "https://khalti.com/api/v2/epayment/initiate";

    const testCases = [
        { name: "Sandbox URL", url: sandboxUrl, orderId: "short_id" },
        { name: "Sandbox URL (Long ID)", url: sandboxUrl, orderId: "order_693e4141b44e74045128c753_1775300476919" },
        { name: "Live URL", url: liveUrl, orderId: "short_id" }
    ];

    for (const test of testCases) {
        console.log(`\n--- Testing: ${test.name} ---`);
        try {
            const res = await axios.post(test.url, {
                return_url: "https://khalti.com",
                website_url: "https://khalti.com",
                amount: 1000,
                purchase_order_id: test.orderId,
                purchase_order_name: "test_product"
            }, {
                headers: {
                    Authorization: `Key ${secretKey}`,
                    "Content-Type": "application/json",
                },
                timeout: 5000
            });
            console.log("✅ SUCCESS!", res.data);
            return;
        } catch (err) {
            console.log("❌ FAILED:", err.response?.status, JSON.stringify(err.response?.data));
        }
    }
}

finalDiagnostic();
