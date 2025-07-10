
import express from "express"
import { deleteClient, getClient, getClients, onboardClient, updateClient } from "../controller/clientController.js"
import {verifyToken} from "../utils/verify.js"


const clientRoute = express.Router()


clientRoute.post('/onboard-client',verifyToken , onboardClient)


clientRoute.get('/get-client/:clientId' , getClient)


clientRoute.get('/get-clients', getClients)


clientRoute.put('/update-client/:clientId', verifyToken, updateClient)


clientRoute.delete('/delete-client/:clientId',verifyToken , deleteClient)



export default clientRoute