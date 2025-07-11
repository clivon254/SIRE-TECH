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
