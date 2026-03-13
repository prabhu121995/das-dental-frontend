import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://192.168.1.3:8000")
  .toString()
  .replace(/\/+$/, "");

export const loginUser = async (username, password) => {
  const loginPath = (import.meta.env.VITE_LOGIN_PATH ?? "/auth/login").toString();
  const useForm = `${import.meta.env.VITE_LOGIN_AS_FORM ?? ""}`.toLowerCase() === "true";

  const url = `${API_BASE_URL}${loginPath.startsWith("/") ? "" : "/"}${loginPath}`;

  const res = await axios.post(
    url,
    useForm ? new URLSearchParams({ username, password }) : { username, password },
    useForm
      ? { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      : { headers: { "Content-Type": "application/json" } },
  );

  return res.data;
};
