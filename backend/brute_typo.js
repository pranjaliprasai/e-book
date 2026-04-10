import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const originalKey = "test_secret_key_8787d339e5a54b82b1dce950666ede331";
const hexPart = "8787d339e5a54b82b1dce950666ede331";
const url = "https://a.khalti.com/api/v2/epayment/initiate";

async function bruteForceTypo() {
    console.log(`Original Length: ${hexPart.length}`);
    
    // Try all possible single-character deletions to get to 32 chars
    for (let i = 0; i < hexPart.length; i++) {
        const candidateHex = hexPart.slice(0, i) + hexPart.slice(i + 1);
        const candidateKey = `test_secret_key_${candidateHex}`;
        
        console.log(`Testing deletion at index ${i}: ...${candidateHex.substring(Math.max(0, i-5), i+5)}...`);
        
        try {
            const res = await axios.post(url, {
                return_url: "https://khalti.com",
                website_url: "https://khalti.com",
                amount: 1000,
                purchase_order_id: "test_" + Date.now(),
                purchase_order_name: "test_product"
            }, {
                headers: {
                    Authorization: `Key ${candidateKey}`,
                    "Content-Type": "application/json",
                },
                timeout: 5000
            });
            
            console.log("\n✅ FOUND IT!");
            console.log("Correct key:", candidateKey);
            console.log("Deleted character was:", hexPart[i], "at index", i);
            return;
        } catch (err) {
            // Only stop if it's NOT a 401. If it's a 401, keep trying.
            if (err.response?.status !== 401) {
                console.log(`Unexpected error: ${err.response?.status} ${JSON.stringify(err.response?.data)}`);
            }
        }
    }
    console.log("\n❌ All 33 deletions failed with 401.");
}

bruteForceTypo();
