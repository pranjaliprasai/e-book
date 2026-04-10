import axios from "axios";
import userModel from "../model/user.model.js";
import { AppError } from "../utils/error.js";
import successResponse from "../utils/success.response.js";

export const initiateKhaltiPayment = async (req, res, next) => {
    try {
        const { amount, purchase_order_id, purchase_order_name } = req.body;
        const userId = req.user.userId;

        const website_url = process.env.KHALTI_WEBSITE_URL || `${req.protocol}://${req.get('host')}`;
        const return_url = `${website_url}/api/khalti/verify?userId=${userId}`;

        const payload = {
            return_url: return_url,
            website_url: website_url,
            amount: Math.round(amount * 100),
            purchase_order_id: purchase_order_id || `order_${userId}_${Date.now()}`,
            purchase_order_name: purchase_order_name || "Premium Subscription",
        };

        const secretKey = (process.env.KHALTI_SECRET_KEY || "").trim();
        const authHeader = `Key ${secretKey}`;

        console.log("--- Khalti Initiate Request ---");
        console.log("URL:", process.env.KHALTI_GATEWAY_URL);
        console.log("Payload:", JSON.stringify(payload, null, 2));
        console.log("Auth Header (Masked):", `Key ${secretKey.substring(0, 15)}...`);

        const response = await axios.post(
            process.env.KHALTI_GATEWAY_URL,
            payload,
            {
                headers: {
                    Authorization: authHeader,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Khalti Success Response:", response.data);

        if (response.data && response.data.payment_url) {
            successResponse(response.data, res);
        } else {
            throw new AppError("Failed to initiate Khalti payment", 400);
        }
    } catch (error) {
        if (error.response) {
            console.error("--- Khalti Error Response ---");
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
            console.error("Headers:", JSON.stringify(error.response.headers, null, 2));
        } else {
            console.error("Khalti Connection Error:", error.message);
        }
        next(new AppError(error.response?.data?.detail || "Payment failed", 400));
    }
};

export const verifyKhaltiPayment = async (req, res, next) => {
    try {
        const { pidx, userId } = req.query;
        const secretKey = (process.env.KHALTI_SECRET_KEY || "").trim();

        if (!pidx) return next(new AppError("Missing pidx", 400));

        const response = await axios.post(
            process.env.KHALTI_VERIFY_URL,
            { pidx },
            {
                headers: {
                    Authorization: `Key ${secretKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.data && (response.data.status === "Completed" || response.data.status === "Success")) {
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);

            await userModel.findByIdAndUpdate(userId, {
                isSubscribed: true,
                subscriptionExpiry: expiryDate
            });

            res.send(`
                <html>
                    <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; text-align:center;">
                        <h2 style="color:#6B8E23;">Payment Successful!</h2>
                        <p>Your subscription is now active.</p>
                        <script>
                            setTimeout(() => { window.location.href = "smartshelf://payment-success"; }, 2000);
                        </script>
                    </body>
                </html>
            `);
        } else {
            res.send("<h1>Payment Verification Failed</h1>");
        }
    } catch (error) {
        console.error("Verify Error:", error.response?.data || error.message);
        res.status(400).send("Verification Error");
    }
};
