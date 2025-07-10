
import express from "express"
import { forgotPassword, login, register, resetPassword } from "../controller/authController.js"

const authRoute = express.Router()



authRoute.post('/register', register)

authRoute.post('/login', login)

authRoute.post('/forgot-password', forgotPassword)

authRoute.post('/reset-password/:token', resetPassword)



export default authRoute