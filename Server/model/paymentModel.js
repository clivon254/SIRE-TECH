import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },

        amount: { type: Number, required: true },

        method: { type: String, enum: ["Cash", "Mpesa", "Card"], required: true },

        reference: { type: String, required: true },

        date: { type: Date, required: true, default: Date.now },

        status: { type: String, enum: ["Pending", "Confirmed", "Failed"], required: true }

    }, { timestamps: true });


const Payment = mongoose.model("Payment", paymentSchema);


export default Payment;

export const mpesaCallback = async (req, res, next) => {
    try {
        const callbackData = req.body;

        // Log the complete callback data for debugging
        console.log("M-Pesa Callback received:", JSON.stringify(callbackData, null, 2));

        const stkCallback = callbackData.Body?.stkCallback;
        if (!stkCallback) {
            console.log("Invalid callback data - no stkCallback found");
            return res.status(400).json({ success: false, message: "Invalid callback data" });
        }

        const resultCode = stkCallback.ResultCode;
        const resultDesc = stkCallback.ResultDesc;
        const checkoutRequestId = stkCallback.CheckoutRequestID;
        const mpesaReceiptNumber = stkCallback.CallbackMetadata?.Item?.find(item => item.Name === "MpesaReceiptNumber")?.Value;
        const amount = stkCallback.CallbackMetadata?.Item?.find(item => item.Name === "Amount")?.Value;
        const phoneNumber = stkCallback.CallbackMetadata?.Item?.find(item => item.Name === "PhoneNumber")?.Value;

        // Log all extracted data
        console.log("Extracted callback data:", {
            resultCode,
            resultDesc,
            checkoutRequestId,
            mpesaReceiptNumber,
            amount,
            phoneNumber
        });

        // Determine transaction status and message
        let transactionStatus, message;

        if (resultCode === 0) {
            transactionStatus = "Success";
            message = "M-Pesa payment was successful.";
            
            // Log successful payment details
            console.log("✅ M-Pesa payment SUCCESSFUL:", { 
                mpesaReceiptNumber, 
                amount, 
                phoneNumber,
                checkoutRequestId,
                resultDesc 
            });

        } else {
            transactionStatus = "Failed";
            message = `M-Pesa payment failed. Reason: ${resultDesc} (Code: ${resultCode})`;
            
            // Log failed payment details
            console.log("❌ M-Pesa payment FAILED:", { 
                resultCode, 
                resultDesc,
                checkoutRequestId,
                phoneNumber,
                amount 
            });
        }

        // Get io instance and socket connections for real-time frontend updates
        const io = req.app.get('io');
        const socketConnections = req.app.get('socketConnections');

        // Emit to frontend if socket exists for this checkoutRequestId
        if (checkoutRequestId && socketConnections && socketConnections.has(checkoutRequestId)) {
            const socketId = socketConnections.get(checkoutRequestId);
            io.to(socketId).emit('payment-status', {
                success: true,
                transactionStatus,
                message,
                data: {
                    resultCode,
                    resultDesc,
                    mpesaReceiptNumber,
                    amount,
                    phoneNumber,
                    checkoutRequestId
                }
            });
            
            console.log(`📡 Real-time update sent to frontend for checkoutRequestId: ${checkoutRequestId}`);
            
            // Remove the connection after emitting
            socketConnections.delete(checkoutRequestId);
        } else {
            console.log(`⚠️ No frontend connection found for checkoutRequestId: ${checkoutRequestId}`);
        }

        // Log the final response being sent to Safaricom
        console.log("📤 Responding to Safaricom with 200 OK");

        // Always respond with 200 OK to Safaricom
        res.status(200).json({ success: true, message: "Callback received" });

    } catch (error) {
        console.error("❌ Error in mpesaCallback:", error);
        next(error);
    }
};
