
import {errorHandler} from "./error.js"
import jwt from "jsonwebtoken"
import axios from "axios";


export const verifyToken = (req,res,next) => {

    const {token} = req.headers

    if(!token)
    {
        return next(errorHandler(403,"There is not token"))
    }

    jwt.verify(token , process.env.JWT_SECRET ,(err,user) => {

        if(err)
        {
            return next(errorHandler(401,"unauthorized ,the token dont match"))
        }
        
        req.user = user

        next()
        
    } )

}

export const generateMpesaToken = async (req, res, next) => {

    const consumerKey = process.env.CONSUMER_KEY;

    const consumerSecret = process.env.CONSUMER_SECRET

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    try {
        const response = await axios.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            }
        );
        // Attach the token to the request object
        req.mpesaToken = response.data.access_token;

        next();

    } 
    catch (error) 
    {
        console.error("Failed to generate M-Pesa token:", error.response ? error.response.data : error.message);

        return next(errorHandler(500, "Failed to generate M-Pesa token"));

    }
};

