
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

export const getUsers = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return next(errorHandler(401, "You are not allowed to access all the users"));
  }

  // Get page and limit from query params, default to page=1, limit=10
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const total = await User.countDocuments();
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const usersWithOutPassword = users.map((user) => {
      const { password, ...rest } = user._doc;
      return rest;
    });

    res.status(200).json({
      success: true,
      usersWithOutPassword,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const updatetUser = async (req, res, next) => {

    if (!req.user.isAdmin && !req.user.id) 
    {
    return next(errorHandler(403, "You are not allowed to update the user"));
    }

    const { userId } = req.params;

  try 
  {

    const user = await User.findById(userId);

    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    if (req.body.password) 
    {
      req.body.password = bcryptjs.hashSync(req.body.password);
    }

    let avatarUrl = user.avatar; // Default to existing avatar

    // If a new file is uploaded, upload to Cloudinary
    if (req.file) 
    {
      // req.file.path is the local path, but with CloudinaryStorage, req.file.path is the Cloudinary URL
      avatarUrl = req.file.path; // multer-storage-cloudinary sets this to the Cloudinary URL
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          username: req.body.username,
          email: req.body.email,
          avatar: avatarUrl,
        },
      },
      { new: true }
    );

    const { password, ...rest } = updatedUser._doc;

    res.status(200).json({ success: true, rest });

  } 
   catch (error) 
  {
    next(error);
  }
  
};

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

