import validator from "validator"
import User from "../model/userModel.js"
import {errorHandler} from "../utils/error.js"
import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"
import transporter from "../utils/nodemailer.js"
import { auth } from '../utils/firebase.js';
import { signInWithCredential, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';


export const register = async (req,res,next) => {

    const {email,password,username} = req.body

    if(!username || !email || !password || username === "" || email === "" || password === "")
    {
        return next(errorHandler(400,"All feilds are required"))
    }

    if(!validator.isEmail(email))
    {
        return next(errorHandler(401,"Email is not valid"))
    }

    try
    {
        const hashedPassword = bcryptjs.hashSync(password ,10)

        const newUser = new User({
            email,
            username,
            password:hashedPassword
        })

        await newUser.save()

        res.status(200).json({success:true , message:"signed up successfully"})

    }
    catch(error)
    {
        next(error)
    }

}

export const login = async (req,res,next) => {

    const {email,password} = req.body

    if(!email || !password || email === "" || password === "")
    {
        return next(errorHandler(400,"All the fields are required"))
    }

    if(!validator.isEmail(email))
    {
        return next(errorHandler(401,"Email is not valid"))
    }

    try
    {
        const user = await User.findOne({email})

        if(!user)
        {
            return next(errorHandler(404,"User not found"))
        }

        const validPassword = bcryptjs.compareSync(password ,user.password)

        if(!validPassword)
        {
            return next(errorHandler(400,"Invalid password"))
        }

        const token = jwt.sign(
            {
             id:user._id,
             isAdmin:user.isAdmin
            },
            process.env.JWT_SECRET
        )

        const {password:pass , ...rest} = user._doc

        res.status(200).json({success:true , rest ,token})

    }
    catch(error)
    {
        next(error)
    }

}

export const forgotPassword = async (req,res,next) => {

    const {email} = req.body

    if(!email || email === "")
    {
        return next(errorHandler(400,"All the fields are required"))
    }

    if(!validator.isEmail(email))
    {
        return next(errorHandler(401,"Email is not valid"))
    }
    
    try
    {
        const user = await User.findOne({email})

        if(!user)
        {
            return next(errorHandler(404,"user not found"))
        }

        const token = jwt.sign(
            {id:user._id},
            process.env.JWT_SECRET,
            {expiresIn:'1h'}
        )

        const FRONTEND_URL = process.env.FRONTEND_URL

        var mailOptions = {
            from:"SIRE TECH SUPPORT",
            to:user.email,
            subject:"Reset Password",
            text:`Click on this link to reset your password: ${FRONTEND_URL}/reset-password/${token}`
        }

        transporter.sendMail(mailOptions ,(error,info) => {

            if(error)
            {
                console.log(error)
            }
            else
            {
                console.log("Email sent" + info.response)
            }

        })

        res.status(200).json({success:true , message:"Link sent the email successfully "})

    }
    catch(error)
    {
        next(error)
    }

}

export const resetPassword = async (req,res,next) => {

    const {token} = req.params

    const {password ,confirmPassword} = req.body

    if(password !== confirmPassword)
    {
        return next(errorHandler(400,"The passwords dont match"))
    }

    try
    {
        const decodedToken = jwt.verify(token , process.env.JWT_SECRET)

        const user = await User.findById(decodedToken.id)

        if(!user)
        {
            return next(errorHandler())
        }

        const hashedPassword = bcryptjs.hashSync(password ,10)

        user.password = hashedPassword

        await user.save()

        res.status(200).json({success:true ,message:"Password successfully reset"})

    }
    catch(error)
    {
        next(error)
    }

}

