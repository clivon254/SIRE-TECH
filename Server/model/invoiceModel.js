
import mongoose from "mongoose"

const invoiceSchema = new mongoose.Schema({

  invoiceNo: { type: String, unique: true},

  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },

  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },

  items: [
    {
      desc: { type: String, required: true },
      qty: { type: Number, required: true },
      rate: { type: Number, required: true }
    }
  ],

  description: { type: String, required: true },

  balance: { type: Number, required: true },

  status: { 
    type: String, 
    enum: ["Unpaid", "PartiallyPaid", "Paid", "Void"], 
    default: "Unpaid",
    required: true
  },

  url:{type:String}

},{timestamps:true})

const Invoice = mongoose.model("Invoice", invoiceSchema)

export default Invoice