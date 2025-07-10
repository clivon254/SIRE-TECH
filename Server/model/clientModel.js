

import mongoose from "mongoose"


const clientSchema = new mongoose.Schema({

    name:{type:String , required:true},

    email:{type:String , required:true ,unique:true},

    phone:{type:String , required:true},

    whatsAppp:{type:String },

    address:{type:String ,required:true},

    isActive:{type:Boolean , default:false},

    avatar:{type:String , default:""}

},
{timestamps:true})


const Client = mongoose.model("Client" , clientSchema)


export default Client