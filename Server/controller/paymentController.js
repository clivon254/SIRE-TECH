
import axios from "axios";
import Invoice from "../model/invoiceModel.js";
import Client from "../model/clientModel.js";
import { errorHandler } from "../utils/error.js";
import Payment from "../model/paymentModel.js";


//MPESA 

export const initiateMpesaStkPush = async (req, res, next) => {
    try {
        const { clientId, invoiceId, phone, amount } = req.body;

        if (!clientId || !invoiceId || !phone || !amount) {
            return next(errorHandler(400, "Missing required fields"));
        }

        // Validate and format phone number to 2547XXXXXXXX
        let formattedPhone = phone.toString().trim();

        // Remove any leading '+' or '0'
        if (formattedPhone.startsWith("+")) {
            formattedPhone = formattedPhone.substring(1);
        }

        if (formattedPhone.startsWith("0")) {
            formattedPhone = "254" + formattedPhone.substring(1);
        }

        // Ensure it starts with '2547' or '2541' and is 12 digits
        if (!/^254(7|1)\d{8}$/.test(formattedPhone)) {
            return next(errorHandler(400, "Phone number must be in the format 2547XXXXXXXX or 2541XXXXXXXX"));
        }

        // Optionally, validate client and invoice exist
        const client = await Client.findById(clientId);
        if (!client) return next(errorHandler(404, "Client not found"));

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return next(errorHandler(404, "Invoice not found"));

        // Prepare STK Push parameters
        const shortCode = process.env.SHORTCODE;
        const passkey = process.env.PASS_KEY;
        const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
        const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

        const callbackURL = "https://2225d3e17c89.ngrok-free.app/api/payment/mpesa-callback";

        const payload = {
            "BusinessShortCode": shortCode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": formattedPhone,
            "PartyB": shortCode,
            "PhoneNumber": formattedPhone,
            "CallBackURL": callbackURL,
            "AccountReference": invoice.invoiceNo || "InvoicePayment",
            "TransactionDesc": `Payment for invoice ${invoice.invoiceNo || invoiceId}`
        };

        // Send STK Push request
        const response = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            payload,
            {
                headers: {
                    Authorization: `Bearer ${req.mpesaToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        // Create a pending payment record
        const payment = new Payment({
            invoiceId: invoiceId,
            amount: amount,
            method: "Mpesa", // Set method to Mpesa
            reference: response.data.CheckoutRequestID || `MPESA_${Date.now()}`,
            date: new Date(),
            status: "Pending"
        });

        await payment.save();

        console.log(`💾 Created pending M-Pesa payment record: ${payment._id}`);

        // Store the checkoutRequestId in the invoice
        if (response.data.CheckoutRequestID) {
            invoice.checkoutRequestId = response.data.CheckoutRequestID;
            await invoice.save();
            
            console.log(`💾 Stored checkoutRequestId ${response.data.CheckoutRequestID} for invoice ${invoice._id}`);
        }

        // Return Safaricom response
        res.status(200).json({
            success: true,
            message: "STK Push initiated",
            data: response.data
        });

    } catch (error) {
        if (error.response && error.response.data) {
            return next(errorHandler(500, error.response.data.errorMessage || "M-Pesa STK Push failed"));
        }
        next(error);
    }
};

// Helper function to update invoice status based on payment amount
const updateInvoiceStatus = async (amountPaid, checkoutRequestId) => {
    try {
        // First, find the invoice associated with this checkoutRequestId
        // You might need to store this mapping when initiating the payment
        const invoice = await Invoice.findOne({ 
            checkoutRequestId: checkoutRequestId 
        });

        if (!invoice) {
            console.log(`⚠️ No invoice found for checkoutRequestId: ${checkoutRequestId}`);
            return;
        }

        // Calculate total invoice amount (items + VAT)
        const totalItems = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const vatAmount = totalItems * (invoice.vatRate || 0.16); // Default 16% VAT
        const totalInvoiceAmount = totalItems + vatAmount;

        console.log("Invoice calculation:", {
            invoiceId: invoice._id,
            totalItems,
            vatAmount,
            totalInvoiceAmount,
            amountPaid,
            currentBalance: invoice.balance || 0
        });

        // Update invoice based on payment amount
        if (amountPaid >= totalInvoiceAmount) {
            // Full payment - mark as paid
            invoice.status = "Paid";
            invoice.balance = 0;
            invoice.paidAmount = totalInvoiceAmount;
            invoice.paymentDate = new Date();
            
            console.log(`✅ Invoice ${invoice._id} marked as PAID`);
            
        } else {
            // Partial payment - mark as partially paid
            invoice.status = "PartiallyPaid";
            invoice.balance = totalInvoiceAmount - amountPaid;
            invoice.paidAmount = (invoice.paidAmount || 0) + amountPaid;
            invoice.paymentDate = new Date();
            
            console.log(`💰 Invoice ${invoice._id} marked as PARTIALLY PAID. Balance: ${invoice.balance}`);
        }

        // Save the updated invoice
        await invoice.save();
        
        console.log(`📝 Invoice ${invoice._id} updated successfully. Status: ${invoice.status}`);

    } catch (error) {
        console.error("❌ Error updating invoice status:", error);
    }
};

// Helper function to update payment status
const updatePaymentStatus = async (checkoutRequestId, status, mpesaReceiptNumber = null) => {
    try {
        // Find the payment record by reference (checkoutRequestId)
        const payment = await Payment.findOne({ reference: checkoutRequestId });

        if (!payment) {
            console.log(`⚠️ No payment record found for checkoutRequestId: ${checkoutRequestId}`);
            return;
        }

        // Update payment status
        payment.status = status;
        
        // If successful and we have a receipt number, update the reference
        if (status === "Confirmed" && mpesaReceiptNumber) {
            payment.reference = mpesaReceiptNumber; // Update to M-Pesa receipt number
        }

        await payment.save();
        
        console.log(`📝 Payment ${payment._id} status updated to: ${status}`);
        if (mpesaReceiptNumber) {
            console.log(`📄 M-Pesa receipt number: ${mpesaReceiptNumber}`);
        }

    } catch (error) {
        console.error("❌ Error updating payment status:", error);
    }
};


export const mpesaCallback = async (req, res, next) => {
    try {
        const callbackData = req.body;

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

        // ALWAYS determine transaction status and message
        let transactionStatus, message;

        if (resultCode === 0) {
            transactionStatus = "Success";
            message = "M-Pesa payment was successful.";
            
            console.log("✅ M-Pesa payment SUCCESSFUL:", { 
                mpesaReceiptNumber, 
                amount, 
                phoneNumber,
                checkoutRequestId,
                resultDesc 
            });

            // Update payment record status
            await updatePaymentStatus(checkoutRequestId, "Confirmed", mpesaReceiptNumber);

            // Update invoice status based on payment amount
            await updateInvoiceStatus(amount, checkoutRequestId);

        } else {
            transactionStatus = "Failed";
            
            // Handle different failure scenarios with specific messages
            switch (resultCode) {
                case 1:
                    message = "Insufficient funds in your M-Pesa account";
                    break;
                case 1032:
                    message = "Transaction was cancelled by user";
                    break;
                case 1037:
                    message = "Timeout - transaction expired";
                    break;
                case 2001:
                    message = "Incorrect M-Pesa PIN";
                    break;
                case 2002:
                    message = "M-Pesa PIN expired";
                    break;
                case 2003:
                    message = "M-Pesa PIN blocked";
                    break;
                default:
                    message = `Transaction failed: ${resultDesc} (Code: ${resultCode})`;
            }
            
            console.log("❌ M-Pesa payment FAILED:", { 
                resultCode, 
                resultDesc,
                checkoutRequestId,
                phoneNumber,
                amount,
                failureReason: message
            });

            // Update payment record status to failed
            await updatePaymentStatus(checkoutRequestId, "Failed");
        }

        // ALWAYS log the final transaction condition
        console.log(`🎯 FINAL TRANSACTION CONDITION: ${transactionStatus} - ${message}`);

        // Get io instance and socket connections for real-time frontend updates
        const io = req.app.get('io');
        const socketConnections = req.app.get('socketConnections');

        // ALWAYS emit to frontend if socket exists for this checkoutRequestId
        if (checkoutRequestId && socketConnections && socketConnections.has(checkoutRequestId)) {
            const socketId = socketConnections.get(checkoutRequestId);
            
            // ALWAYS send the transaction status to frontend
            const frontendData = {
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
            };
            
            io.to(socketId).emit('payment-status', frontendData);
            
            console.log(`📡 Real-time update sent to frontend for checkoutRequestId: ${checkoutRequestId}`);
            console.log(`📋 Frontend data sent:`, JSON.stringify(frontendData, null, 2));
            
            // Remove the connection after emitting
            socketConnections.delete(checkoutRequestId);
        } else {
            console.log(`⚠️ No frontend connection found for checkoutRequestId: ${checkoutRequestId}`);
            console.log(`📋 Available connections:`, Array.from(socketConnections.keys()));
        }

        // ALWAYS respond to Safaricom with 200 OK
        console.log("📤 Responding to Safaricom with 200 OK");
        res.status(200).json({ 
            success: true, 
            message: "Callback received",
            transactionStatus,
            message 
        });

    } catch (error) {
        console.error("❌ Error in mpesaCallback:", error);
        
        // Even if there's an error, try to notify frontend
        try {
            const io = req.app.get('io');
            const socketConnections = req.app.get('socketConnections');
            
            if (checkoutRequestId && socketConnections && socketConnections.has(checkoutRequestId)) {
                const socketId = socketConnections.get(checkoutRequestId);
                io.to(socketId).emit('payment-status', {
                    success: false,
                    transactionStatus: "Error",
                    message: "An error occurred while processing the payment",
                    error: error.message
                });
                socketConnections.delete(checkoutRequestId);
            }
        } catch (frontendError) {
            console.error("❌ Failed to notify frontend of error:", frontendError);
        }
        
        next(error);
    }
};


export const confirmTransaction = async (req, res, next) => {
    try {
        const { checkoutRequestId } = req.query;

        if (!checkoutRequestId) {
            return next(errorHandler(400, "CheckoutRequestID is required"));
        }

        console.log(`🔍 Querying transaction status for: ${checkoutRequestId}`);

        // Prepare query parameters
        const shortCode = process.env.SHORTCODE;
        const passkey = process.env.PASS_KEY;
        const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
        const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

        const payload = {
            "BusinessShortCode": shortCode,
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkoutRequestId
        };

        // Query transaction status
        const response = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
            payload,
            {
                headers: {
                    Authorization: `Bearer ${req.mpesaToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("Safaricom query response:", JSON.stringify(response.data, null, 2));

        const resultCode = response.data.ResultCode;
        const resultDesc = response.data.ResultDesc;
        const amount = response.data.Amount; // Amount from query response

        // Determine transaction status with detailed error messages
        let transactionStatus, message;

        if (resultCode === 0) {
            transactionStatus = "Success";
            message = "Transaction completed successfully";
            
            // Update invoice status based on payment amount
            await updateInvoiceStatus(amount, checkoutRequestId);
            
        } else if (resultCode === 1) {
            transactionStatus = "Pending";
            message = "Transaction is being processed";
        } else {
            transactionStatus = "Failed";
            
            // Handle different failure scenarios
            switch (resultCode) {
                case 1:
                    message = "Insufficient funds in your M-Pesa account";
                    break;
                case 1032:
                    message = "Transaction was cancelled by user";
                    break;
                case 1037:
                    message = "Timeout - transaction expired";
                    break;
                case 2001:
                    message = "Incorrect M-Pesa PIN";
                    break;
                case 2002:
                    message = "M-Pesa PIN expired";
                    break;
                case 2003:
                    message = "M-Pesa PIN blocked";
                    break;
                default:
                    message = `Transaction failed: ${resultDesc}`;
            }
        }

        console.log(`📊 Transaction status: ${transactionStatus} - ${message}`);

        // Return transaction status
        res.status(200).json({
            success: true,
            transactionStatus,
            message,
            data: {
                resultCode,
                resultDesc,
                checkoutRequestId,
                amount,
                ...response.data
            }
        });

    } catch (error) {
        console.error("❌ Error in confirmTransaction:", error);
        if (error.response && error.response.data) {
            return next(errorHandler(500, error.response.data.errorMessage || "Transaction query failed"));
        }
        next(error);
    }
};

//CASH

// Helper function to update invoice status for cash payments
const updateInvoiceStatusForCash = async (amountPaid, invoiceId) => {
    try {
        // Find the invoice
        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) {
            console.log(`⚠️ No invoice found for invoiceId: ${invoiceId}`);
            return;
        }

        // Calculate total invoice amount (items + VAT)
        const totalItems = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const vatAmount = totalItems * (invoice.vatRate || 0.16); // Default 16% VAT
        const totalInvoiceAmount = totalItems + vatAmount;

        console.log("Cash payment invoice calculation:", {
            invoiceId: invoice._id,
            totalItems,
            vatAmount,
            totalInvoiceAmount,
            amountPaid,
            currentBalance: invoice.balance || 0
        });

        // Update invoice based on payment amount
        if (amountPaid >= totalInvoiceAmount) {
            // Full payment - mark as paid
            invoice.status = "Paid";
            invoice.balance = 0;
            invoice.paidAmount = totalInvoiceAmount;
            invoice.paymentDate = new Date();
            
            console.log(`✅ Invoice ${invoice._id} marked as PAID (Cash payment)`);
            
        } else {
            // Partial payment - mark as partially paid
            invoice.status = "PartiallyPaid";
            invoice.balance = totalInvoiceAmount - amountPaid;
            invoice.paidAmount = (invoice.paidAmount || 0) + amountPaid;
            invoice.paymentDate = new Date();
            
            console.log(`💰 Invoice ${invoice._id} marked as PARTIALLY PAID (Cash payment). Balance: ${invoice.balance}`);
        }

        // Save the updated invoice
        await invoice.save();
        
        console.log(`📝 Invoice ${invoice._id} updated successfully. Status: ${invoice.status}`);

    } catch (error) {
        console.error("❌ Error updating invoice status for cash payment:", error);
    }
};


export const collectCashPayment = async (req, res, next) => {
    try {
        const { clientId, invoiceId, amount } = req.body;

        if (!clientId || !invoiceId || !amount || !receivedBy) {
            return next(errorHandler(400, "Missing required fields: clientId, invoiceId, amount, receivedBy"));
        }

        // Validate client and invoice exist
        const client = await Client.findById(clientId);
        if (!client) return next(errorHandler(404, "Client not found"));

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return next(errorHandler(404, "Invoice not found"));

        // Generate a unique reference for cash payment
        const cashReference = `CASH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create a confirmed cash payment record (since money is collected immediately)
        const payment = new Payment({
            invoiceId: invoiceId,
            amount: amount,
            method: "Cash",
            reference: cashReference,
            date: new Date(),
            status: "Confirmed", // Directly confirmed since money is collected
        });

        await payment.save();

        console.log(`💾 Created confirmed Cash payment record: ${payment._id}`);

        // Update invoice status based on payment amount
        await updateInvoiceStatusForCash(amount, invoiceId);

        // Return success response
        res.status(200).json({
            success: true,
            transactionStatus: "Success",
            message: "Cash payment collected successfully",
            data: {
                paymentId: payment._id,
                reference: cashReference,
                amount: amount,
                method: "Cash",
                receivedBy: receivedBy,
                confirmedAt: payment.confirmedAt
            }
        });

    } catch (error) {
        console.error("❌ Error in collectCashPayment:", error);
        next(error);
    }
};









