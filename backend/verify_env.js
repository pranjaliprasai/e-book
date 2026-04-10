import dotenv from 'dotenv';
dotenv.config({ override: true });

console.log("--- Khalti Environment Check ---");
console.log("GATEWAY_URL:", process.env.KHALTI_GATEWAY_URL);
console.log("VERIFY_URL:", process.env.KHALTI_VERIFY_URL);

const secretKey = process.env.KHALTI_SECRET_KEY || "";
const publicKey = process.env.KHALTI_PUBLIC_KEY || "";

console.log("SECRET_KEY (First 10):", secretKey.substring(0, 10) + "...");
console.log("SECRET_KEY Length:", secretKey.length);
console.log("SECRET_KEY Prefix Check:", secretKey.startsWith("test_") || secretKey.startsWith("live_"));

console.log("PUBLIC_KEY (First 10):", publicKey.substring(0, 10) + "...");
console.log("--------------------------------");

if (!secretKey || secretKey.includes("your_hex_here")) {
    console.error("ERROR: KHALTI_SECRET_KEY is missing or contains placeholder!");
} else {
    console.log("Configuration looks loaded. Please RESTART your server now.");
}
