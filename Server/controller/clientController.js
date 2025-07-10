
import Client from "../model/clientModel.js"
import {errorHandler} from "../utils/error.js"
import validator from "validator"

export const onboardClient = async (req,res,next) => {

    if(!req.user.isAdmin)
    {
        return next(errorHandler(403,"You are not allowed to onboartd a client"))
    }

    const {name,email,phone,address} = req.body

    if (!name || !email || !phone || !address)
    {
        return next(errorHandler(400, "All fields are required"))
    }

    try
    {
        
        if(!validator.isEmail(email))
        {
            return next(errorHandler(401,"Email is not valid"))
        }

        const client = new Client({
            name,email,phone,address
        })

        if(req.body.whatsApp)
        {
            client.whatsApp = req.body.whatsApp
        }
        

        await client.save()

        res.status(200).json({success:true ,message:"client onBoarded successfully" ,client})
        
    }
    catch(error)
    {
        next(error)
    }

}

export const getClient = async (req,res,next) => {

    const {clientId} = req.params

    try
    {
        const client = await Client.findById(clientId)

        if(!client)
        {
            return next(errorHandler(404,"client not found"))
        }

        res.status(200).json({success:true , client})
    }
    catch(error)
    {
        next(error)
    }

}

export const getClients = async (req,res,next) => {
    
    try
    {
        const clients = await Client.find()

        res.status(200).json({success:true ,clients})

    }
    catch(error)
    {
        next(error)
    }

}

export const updateClient = async (req,res,next) => {

    if(!req.user.isAdmin)
    {
        return next(errorHandler(403,"You are not allowed to update the client"))
    }

    const {clientId} = req.params 

    try
    {
        const client = await Client.findById(clientId)

        if(!client)
        {
            return next(errorHandler(404,"Client not found "))
        }

        const updatedClient = await Client.findByIdAndUpdate(
            clientId,
            {
                $set:{
                    name:req.body.name,
                    phone:req.body.phone,
                    address:req.body.address,
                    whatsApp:req.body.whatsApp,
                    email:req.body.email,
                    email:req.body.email,
                }
            },
            {new:true}
        )

        res.status(200).json({success:true , updatedClient})

    }
    catch(error)
    {
        next(error)
    }

}

export const deleteClient = async (req,res,next) => {

    if(!req.user.isAdmin)
    {
        return next(errorHandler(403,"You are not allowed to delete the client"))
    }
    
    const {clientId} = req.params 

    try
    {
        const client = await Client.findById(clientId)

        if(!client)
        {
            return next(errorHandler(404,"Client not found "))
        }

        await Client.findByIdAndDelete(clientId)

        res.status(200).json({success:true , message:`${client.name} deleted successfully`})

    }
    catch(error)
    {
        next(error)
    }

}

