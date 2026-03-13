import { useState } from "react";
import ThreeBackground from "../components/ThreeBackground";
import { loginUser } from "../services/authService";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await loginUser(username, password);

      localStorage.setItem("token", res.access_token);
      localStorage.setItem("role", res.role);

      if (res.role === "Admin") window.location.href = "/admin-dashboard";

      if (res.role === "Agent") window.location.href = "/agent-dashboard";

      if (res.role === "TeamLeader") window.location.href = "/team-dashboard";
    } catch {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-teal-900">
      <ThreeBackground />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-[400px] p-10 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl"
      >
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          DAS Healthcare
        </h1>

        <p className="text-gray-300 text-center mb-8">Secure Medical Portal</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Username"
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg text-black font-semibold"
          >
            Login
          </motion.button>
        </form>

        <p className="text-gray-400 text-xs text-center mt-6">
          © 2026 DAS Healthcare Systems
        </p>
      </motion.div>
    </div>
  );
}
