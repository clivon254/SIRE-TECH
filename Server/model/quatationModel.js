import mongoose from "mongoose"


const quatationSchema = new mongoose.Schema({

    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },

    clientId:{type:mongoose.Schema.Types.ObjectId , ref:"Client" , required:true},

    items: [
        {
            desc: { type: String, required: true },
            qty: { type: Number, required: true },
            rate: { type: Number, required: true }
        }
    ],

    description:{type:String , required:true},

    status: { type: String, enum: ["Draft", "Sent", "Approved", "Expired",], default: "Draft" },

    url:{type:String}

},{timestamps:true})

const Quatation = mongoose.model("Quatation",quatationSchema)


export default Quatation