
import axios from "axios";
import Invoice from "../model/invoiceModel.js";
import Client from "../model/clientModel.js";
import { errorHandler } from "../utils/error.js";


export const initiateMpesaStkPush = async (req, res, next) => {
    
    try 
    {
        const { clientId, invoiceId, phone, amount } = req.body;

        if (!clientId || !invoiceId || !phone || !amount) 
        {
            return next(errorHandler(400, "Missing required fields"));
        }

        // Validate and format phone number to 2547XXXXXXXX
        let formattedPhone = phone.toString().trim();

        // Remove any leading '+' or '0'
        if (formattedPhone.startsWith("+")) 
        {
            formattedPhone = formattedPhone.substring(1);
        }

        if (formattedPhone.startsWith("0"))
        {
            formattedPhone = "254" + formattedPhone.substring(1);
        }

        // Ensure it starts with '2547' or '2541' and is 12 digits
        if (!/^254(7|1)\d{8}$/.test(formattedPhone))
        {
            return next(errorHandler(400, "Phone number must be in the format 2547XXXXXXXX or 2541XXXXXXXX"));
        }

        // Optionally, validate client and invoice exist
        const client = await Client.findById(clientId);

        if (!client) return next(errorHandler(404, "Client not found"));

        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) return next(errorHandler(404, "Invoice not found"));

        // Prepare STK Push parameters
        const shortCode = process.env.SHORTCODE; // e.g. 174379 for sandbox

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
            "PartyA": formattedPhone, // Customer's phone number (format: 2547XXXXXXXX)
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

        // Return Safaricom response
        res.status(200).json({
            success: true,
            message: "STK Push initiated",
            data: response.data
        });


    } 
    catch (error) 
    {
        // If Safaricom returns an error, it will be in error.response.data
        if (error.response && error.response.data) {
            return next(errorHandler(500, error.response.data.errorMessage || "M-Pesa STK Push failed"));
        }
        next(error);
    }
};

export const mpesaCallback = async (req, res, next) => {

    try
     {
        const callbackData = req.body;

        console.log("M-Pesa Callback received:", JSON.stringify(callbackData, null, 2));

        const stkCallback = callbackData.Body?.stkCallback;

        if (!stkCallback) {
            return res.status(400).json({ success: false, message: "Invalid callback data" });
        }

        const resultCode = stkCallback.ResultCode;
        const resultDesc = stkCallback.ResultDesc;
        const mpesaReceiptNumber = stkCallback.CallbackMetadata?.Item?.find(item => item.Name === "MpesaReceiptNumber")?.Value;
        const amount = stkCallback.CallbackMetadata?.Item?.find(item => item.Name === "Amount")?.Value;
        const phoneNumber = stkCallback.CallbackMetadata?.Item?.find(item => item.Name === "PhoneNumber")?.Value;

        // Determine transaction status and message
        let transactionStatus, message;

        if (resultCode === 0) 
        {
            transactionStatus = "Success";

            message = "M-Pesa payment was successful.";

            // TODO: Update your database to mark payment as successful
            console.log("M-Pesa payment SUCCESSFUL:", { mpesaReceiptNumber, amount, phoneNumber });

        } 
        else 
        {
            transactionStatus = "Failed";

            message = `M-Pesa payment failed. Reason: ${resultDesc} (Code: ${resultCode})`;

            // TODO: Update your database to mark payment as failed
            console.log("M-Pesa payment FAILED:", { resultCode, resultDesc });

        }

        // Respond with transaction status and reason if failed
        res.status(200).json({
            success: true,
            transactionStatus,
            message,
            data: {
                resultCode,
                resultDesc,
                mpesaReceiptNumber,
                amount,
                phoneNumber
            }
        });

    } 
    catch (error)
     {
        next(error);
    }
};

export const confirmTransaction = async (req, res, next) => {
    
    try {
        const { checkoutRequestId } = req.query;

        if (!checkoutRequestId) {
            return next(errorHandler(400, "CheckoutRequestID is required"));
        }

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

        const resultCode = response.data.ResultCode;
        const resultDesc = response.data.ResultDesc;

        // Determine transaction status
        let transactionStatus, message;

        if (resultCode === 0) 
        {
            transactionStatus = "Success";
            message = "Transaction completed successfully";
        } 
        else if (resultCode === 1) 
        {
            transactionStatus = "Pending";
            message = "Transaction is being processed";
        } 
        else
       {
            transactionStatus = "Failed";
            message = `Transaction failed: ${resultDesc}`;
        }

        // Return transaction status
        res.status(200).json({
            success: true,
            transactionStatus,
            message,
            data: {
                resultCode,
                resultDesc,
                checkoutRequestId,
                ...response.data
            }
        });

    } 
    catch (error)
    {
        if (error.response && error.response.data) {
            return next(errorHandler(500, error.response.data.errorMessage || "Transaction query failed"));
        }
        next(error);
    }

};




