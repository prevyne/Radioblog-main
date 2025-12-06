import axios from "axios";
import { API_URI } from "./index";

const api = axios.create({
  baseURL: API_URI,
  withCredentials: true,
});

export const getAdminStats = async (token) => {
  try {
    let authToken = token;

    if (!authToken) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        authToken = parsed?.token;
      }
    }


    const config = authToken 
      ? { headers: { Authorization: `Bearer ${authToken}` } } 
      : {};
    
  
    const { data } = await api.get("/admin/analytics", config);
    return data;

  } catch (error) {
    console.error("API Error:", error?.response?.data || error.message);
    throw error;
  }
};

export default api;