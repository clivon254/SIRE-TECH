
import Project from "../model/projectModel.js"
import {errorHandler} from "../utils/error.js"


export const addProject = async (req,res,next) => {

    if(!req.user.isAdmin)
    {
        return next(errorHandler(403,"You are not allowed to Add project"))
    }

    const {title,description,url,startDate,endDate,team,client} = req.body 

    try
    {
        const project = new Project({
            title,description,url,startDate,endDate,team,client
        })

        await project.save()

        res.status(200).json({success:true , message:`Project:${project.title} is created successfully` ,project })

    }
    catch(error)
    {
        next(error)
    }

}

export const getProject = async (req,res,next) => {

    const {projectId} = req.params

    try
    {
        const project = await Project.findById(projectId)

        if(!project)
        {
            return next(errorHandler(404,"Project not found"))
        }

        res.status(200).json({success:true , project})
    }
    catch(error)
    {
        next(error)
    }

}

export const getProjects = async (req,res,next) => {

    
    try
    {
        const projects = await Project.find()

        res.status(200).json({success:true , projects})

    }
    catch(error)
    {
        next(error)
    }

}

export const updateProject = async (req,res,next) => {

    if(!req.user.isAdmin)
    {
        return next(errorHandler(403,"You are not allowed to Add project"))
    }

    const {projectId} = req.params

    try
    {
        const project = await Project.findById(projectId)

        if(!project)
        {
            return next(errorHandler(404,"Project not found"))
        }

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            {
                $set:{
                    title:req.body.title,
                    description:req.body.description,
                    startDate:req.body.startDate,
                    endDate:req.body.endDate,
                    client:req.body.client,
                    url:req.body.url,
                    team:req.body.team,
                    status:req.body.status,
                }
            },
            {new:true}
        )

        res.status(200).json({success:true , updatedProject})

    }
    catch(error)
    {
        next(error)
    }

}

export const deleteProject = async (req,res,next) => {
   
    if(!req.user.isAdmin)
    {
        return next(errorHandler(403,"You are not allowed to Add project"))
    }

    const {projectId} = req.params

    try
    {
        const project = await Project.findById(projectId)

        if(!project)
        {
            return next(errorHandler(404,"Project not found"))
        }

        await Project.findByIdAndDelete(projectId)

        res.status(200).json({success:true , message:`${project.title} deleted successfully`})

    }
    catch(error)
    {
        next(error)
    }

}

