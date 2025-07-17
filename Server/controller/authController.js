import validator from "validator"
import User from "../model/userModel.js"
import {errorHandler} from "../utils/error.js"
import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"
import transporter from "../utils/nodemailer.js"
import { auth } from '../utils/firebase.js';
import { signInWithCredential, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';


// In-memory OTP store: { [email]: { otp, expires } }
const otpStore = {};


export const register = async (req, res, next) => {
    // Only admin can register new users
    if (!req.user?.isAdmin) {
        return next(errorHandler(403, "Only admin can onboard new users"));
    }

    const { email, username, phone } = req.body;

    if (!username || !email || !phone) {
        return next(errorHandler(400, "All fields are required"));
    }

    if (!validator.isEmail(email)) {
        return next(errorHandler(401, "Email is not valid"));
    }

    try {
        // Use phone as initial password
        const password = phone.toString();
        const hashedPassword = bcryptjs.hashSync(password, 10);

        // Set isActive to false
        const newUser = new User({
            phone,
            email,
            username,
            password: hashedPassword,
            isActive: false,
        });

        await newUser.save();

        // Generate OTP and expiry (6 hours)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 6 * 60 * 60 * 1000; // 6 hours in ms

        // Store OTP in memory
        otpStore[email] = { otp, expires: otpExpires };

        // Send OTP to email
        var mailOptions = {
            from: "SIRE TECH SUPPORT",
            to: email,
            subject: "Activate your account - OTP",
            text: `Your OTP code is: ${otp}. It expires in 6 hours.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log("OTP Email sent: " + info.response);
            }
        });

        res.status(200).json({ success: true, message: "User registered. OTP sent to email." });
    } catch (error) {
        next(error);
    }
};

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

export const verifyOtp = async (req, res, next) => {

    const { email, otp } = req.body;

    if (!email || !otp) 
    {
        return next(errorHandler(400, "Email and OTP are required"));
    }

    const record = otpStore[email];

    if (!record) 
    {
        return next(errorHandler(400, "No OTP found for this email"));
    }

    if (record.otp !== otp) 
    {
        return next(errorHandler(400, "Invalid OTP"));
    }

    if (Date.now() > record.expires) 
    {
        delete otpStore[email];
        return next(errorHandler(400, "OTP expired"));
    }

    try 
    {
        const user = await User.findOne({ email });

        if (!user) return next(errorHandler(404, "User not found"));

        user.isActive = true;

        await user.save();

        delete otpStore[email];

        res.status(200).json({ success: true, message: "Account activated. Please set a new password." });

    } catch (error) {
        next(error);
    }
};

export const resendOtp = async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(errorHandler(400, "Email is required"));
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return next(errorHandler(404, "User not found"));
        }

        if (user.isActive) {
            return next(errorHandler(400, "Account is already active"));
        }

        // Generate new OTP and expiry (6 hours)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 6 * 60 * 60 * 1000; // 6 hours

        // Store OTP in memory
        otpStore[email] = { otp, expires: otpExpires };

        // Send OTP to email
        var mailOptions = {
            from: "SIRE TECH SUPPORT",
            to: email,
            subject: "Resend OTP - Activate your account",
            text: `Your new OTP code is: ${otp}. It expires in 6 hours.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log("Resent OTP Email sent: " + info.response);
            }
        });

        res.status(200).json({ success: true, message: "OTP resent to email." });
    } catch (error) {
        next(error);
    }
};


