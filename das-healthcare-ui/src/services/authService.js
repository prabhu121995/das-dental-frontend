import axios from "axios";

const API = "http://192.168.1.3:8000/";

export const loginUser = async (username, password) => {
  const res = await axios.post(`${API}/login`, {
    username,
    password,
  });

  return res.data;
};
