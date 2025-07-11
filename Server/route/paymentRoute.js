
import express from "express"
import { generateMpesaToken } from "../utils/verify.js"
import { initiateMpesaStkPush, mpesaCallback, confirmTransaction } from "../controller/paymentController.js"


const paymentRouter = express.Router()

paymentRouter.post('/stk-push', generateMpesaToken, initiateMpesaStkPush)


// Add this route for the M-Pesa callback
paymentRouter.post('/mpesa-callback', mpesaCallback)


paymentRouter.post('/confirmation', generateMpesaToken, confirmTransaction)


export default paymentRouter