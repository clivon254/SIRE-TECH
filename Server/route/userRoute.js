

import express from "express"
import { deleteUser, getUser, getUsers, updatetUser } from "../controller/userController.js"
import {verifyToken} from "../utils/verify.js"
import upload from '../utils/multer.js';


const userRoute = express.Router()


userRoute.get('/get-user/:userId', getUser)


userRoute.get('/get-users',verifyToken , getUsers)


userRoute.put('/update-user/:userId', upload.single('avatar'), updatetUser);


userRoute.delete('/delete-user/:userId',verifyToken, deleteUser)


export default userRoute