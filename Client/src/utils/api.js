// src/api/axios.js
import axios from "axios";

const api = axios.create({
    
  baseURL: import.meta.env.VBASE_URL || "http://localhost:2500/api",
  // You can add other default configs here (headers, timeout, etc.)

});

export default api;


