import express from "express"
import { verifyToken } from "../utils/verify.js"
import { createQuotation, deleteQuatation, getQuatation, getQuatations, updateQuatation } from "../controller/quatationController.js"


const quatationRoute = express.Router()


quatationRoute.post('/create-quatation' , verifyToken ,createQuotation)

quatationRoute.get('/get-quatation/:quatationId', getQuatation)

quatationRoute.get('/get-quatations', getQuatations)

quatationRoute.put('/update-quatation/:quatationId', verifyToken, updateQuatation)

quatationRoute.delete('/delete-quatation/:quatationId',verifyToken, deleteQuatation)



export default quatationRoute
