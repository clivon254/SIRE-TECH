

import express from "express"
import { verifyToken } from "../utils/verify.js"
import { addProject, deleteProject, getProject, getProjects, updateProject } from "../controller/projetController.js"



const projectRoute = express.Router()

projectRoute.post('add-project' , verifyToken, addProject)

projectRoute.get('get-project/:projectId' , getProject)

projectRoute.get('get-projects' , verifyToken, getProjects)

projectRoute.put('update-project/:projectId' , verifyToken, updateProject)

projectRoute.delete('delete-project/:projectId' , verifyToken, deleteProject)



export default projectRoute