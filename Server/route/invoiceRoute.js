
import express from "express"
import { createInvoice, getInvoice, getInvoices, updateInvoice, deleteInvoice, sendInvoiceEmail } from "../controller/invoiceController.js"
import { verifyToken } from "../utils/verify.js"

const invoiceRoute = express.Router()

invoiceRoute.post('/create-invoice', verifyToken, createInvoice)

invoiceRoute.get('/get-invoice/:invoiceId', getInvoice)

invoiceRoute.get('/get-invoices', getInvoices)

invoiceRoute.put('/update-invoice/:invoiceId', verifyToken, updateInvoice)

invoiceRoute.delete('/delete-invoice/:invoiceId', verifyToken, deleteInvoice)

invoiceRoute.post("/send-invoice-email/:invoiceId", verifyToken, sendInvoiceEmail);

export default invoiceRoute 