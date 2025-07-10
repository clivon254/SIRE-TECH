
import User from "../model/userModel.js"
import { errorHandler } from "../utils/error.js"
import bcryptjs from "bcryptjs"



export const getUser = async (req,res,next) => {

    const {userId} = req.params

    try
    {

        const user = await User.findById(userId)

        if(!user)
        {
            return next(errorHandler(404,"User not found"))
        }

        const {password, ...rest} = user._doc 

        res.status(200).json({success:true , rest})

    }
    catch(error)
    {
        next(error)
    }

}

export const getUsers = async (req,res,next) => {

    if(!req.user.isAdmin)
    {
        return next(errorHandler(401,"You are not allowed to acces all the users"))
    }

    try
    {
        const users = await User.find()

        const usersWithOutPassword = users.map((user) => {

            const {password , ...rest} = user._doc

            return rest

        })

        res.status(200).json({success:true , usersWithOutPassword})

    }
    catch(error)
    {
        next(error)
    }

}

export const updatetUser = async (req,res,next) => {

    if(!req.user.isAdmin && !req.user.id)
    {
        return next(errorHandler(403,"You are not allowed to update the user"))
    }

    const {userId} = req.params

    try
    {
        const user = await User.findById(userId)

        if(!user)
        {
            return next(errorHandler(404,"User not found"))
        }

        if(req.body.password)
        {
            req.body.password = bcryptjs.hashSync(req.body.password)
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set:{
                    username:req.body.username,
                    email:req.body.email,
                    avatar:req.body.avatar
                }
            },
            {new:true}
        )

        const {password , ...rest} = updatedUser._doc

        res.status(200).json({success:true , rest})

    }
    catch(error)
    {
        next(error)
    }

}

export const deleteUser = async (req,res,next) => {

    if(!req.user.isAdmin && !req.user.id)
    {
        return next(errorHandler(403,"You are not allowed to delete the user"))
    }

    const {userId} = req.params

    try
    {
        const user = await User.findById(userId)

        if(!user)
        {
            return next(errorHandler(404,"User not found"))
        }

        
        await User.findByIdAndDelete(userId)
        
        res.status(200).json({success:true , message:`${user.username} deleted successfully`})

    }
    catch(error)
    {
        next(error)
    }

}

