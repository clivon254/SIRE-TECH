import mongoose from "mongoose"


const projectSchema = new mongoose.Schema({

    title:{type:String , required:true} , 

    description:{type:String , required:true} , 

    startDate:{type:Date , required:true} , 

    endDate:{type:Date , required:true} , 

    status:{type:String , enum:["onHold", "active", "completed", "cancelled"], default:"onHold"} , 

    url:{type:String , default:"http://"} , 

    client:{type:mongoose.Schema.Types.ObjectId , ref:"Client"},

    team:[{type:mongoose.Schema.Types.ObjectId , ref:"User"}]
 },
    {timestamps:true})


const Project = mongoose.model("Project",projectSchema)


export default Project