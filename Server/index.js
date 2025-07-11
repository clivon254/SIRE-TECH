import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import "dotenv/config"
import path from "path"
import authRoute from "./route/authRoute.js"
import userRoute from "./route/userRoute.js"
import clientRoute from "./route/clientRoute.js"
import projectRoute from "./route/projectRoute.js"
import quatationRoute from "./route/quatationRoute.js"
import invoiceRoute from "./route/invoiceRoute.js"
import paymentRouter from "./route/paymentRoute.js"
import { createServer } from 'http';
import { Server } from 'socket.io';


const app = express()

const PORT = process.env.PORT

app.use(cors({}))

app.use(express.json())

//DB CONNECTION
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("DB CONNECTED"))
.catch((err) => console.log(err))

// ROUTES
app.use("/api/auth" , authRoute)

app.use("/api/user" , userRoute)

app.use("/api/client", clientRoute)

app.use("/api/project", projectRoute)

app.use('/quotations', express.static(path.join(process.cwd(), 'public', 'quotations')))

app.use('/api/quatation' ,quatationRoute)

app.use('/invoices', express.static(path.join(process.cwd(), 'public', 'invoices')))

app.use('/api/invoice', invoiceRoute)

app.use('/api/payment', paymentRouter)

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Your frontend URL
    methods: ["GET", "POST"]
  }
});

// Store socket connections with checkoutRequestId
const socketConnections = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Listen for checkout request ID from frontend
  socket.on('subscribe-to-payment', (checkoutRequestId) => {
    socketConnections.set(checkoutRequestId, socket.id);
    console.log(`Client ${socket.id} subscribed to payment: ${checkoutRequestId}`);
  });
  
  socket.on('disconnect', () => {
    // Remove from connections
    for (const [key, value] of socketConnections.entries()) {
      if (value === socket.id) {
        socketConnections.delete(key);
        break;
      }
    }
  });
});

// Make io available to your controllers
app.set('io', io);

app.set('socketConnections', socketConnections);


//API
app.get('/',(req,res) => {
    res.send('HELLO SIRE TECH')
})

//LISTEN
app.listen(PORT ,(err) => {
    if(!err)
    {
        console.log(`server running on ${PORT}`)
    }
})

app.use((err,req,res,next) => {
    const statusCode = err.statusCode  || 500 ;
    const message = err.message || "Internal Server Error"
    res.status(statusCode).json({success:false , message})
})


