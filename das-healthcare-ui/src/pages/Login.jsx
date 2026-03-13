import { useState } from "react";
import { motion } from "framer-motion";
import ThreeBackground from "../components/ThreeBackground";
import { loginUser } from "../services/authService";
import dasLogo from "../assets/das-logo.svg";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.55, ease: "easeOut" },
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await loginUser(username, password);

      localStorage.setItem("token", res.access_token);
      localStorage.setItem("role", res.role);
      window.location.href = "/app";
    } catch {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 bg-gradient-to-br from-primary via-slate-950 to-primary">
      <ThreeBackground />

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative w-full max-w-[980px]"
      >
        {/* soft glows */}
        <div className="pointer-events-none absolute -top-12 -left-10 h-40 w-40 rounded-full bg-medical/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-8 h-44 w-44 rounded-full bg-healthcare/20 blur-3xl" />

        <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl md:grid-cols-2">
          {/* Brand panel */}
          <div className="relative p-8 md:p-10">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="flex h-full flex-col"
            >
              <motion.div variants={item} className="flex items-center gap-4">
                <motion.img
                  src={dasLogo}
                  alt="DAS Healthcare"
                  className="h-14 w-14 select-none"
                  draggable="false"
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <div className="text-left">
                  <div className="text-sm font-semibold tracking-widest text-slate-200/90">
                    DAS
                  </div>
                  <div className="text-2xl font-bold text-white">
                    Healthcare Portal
                  </div>
                </div>
              </motion.div>

              <motion.p
                variants={item}
                className="mt-6 text-left text-slate-200/70"
              >
                Secure, compliant access for healthcare operations.
              </motion.p>

              <motion.div
                variants={item}
                className="mt-7 grid gap-3 text-left text-sm text-slate-200/70"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-medical" />
                  Enterprise-grade authentication
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-healthcare" />
                  Role-based access control
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-300/70" />
                  Protected medical workflows
                </div>
              </motion.div>

              <motion.div variants={item} className="mt-auto pt-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-medical" />
                  Trusted access layer
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Form panel */}
          <div className="relative border-t border-white/10 p-8 md:border-t-0 md:border-l md:p-10">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="text-left"
            >
              <motion.div variants={item}>
                <div className="text-sm font-semibold tracking-wide text-slate-200/75">
                  Welcome back
                </div>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  Sign in to continue
                </h2>
              </motion.div>

              <motion.form
                variants={item}
                onSubmit={handleSubmit}
                className="mt-7 space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wide text-slate-200/70">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    autoComplete="username"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-200/40 outline-none ring-0 transition focus:border-healthcare/50 focus:ring-2 focus:ring-healthcare/30"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wide text-slate-200/70">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-200/40 outline-none ring-0 transition focus:border-medical/50 focus:ring-2 focus:ring-medical/30"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-300/90">{error}</p>
                )}

                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  className="group relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-r from-medical to-healthcare px-4 py-3 text-sm font-semibold text-primary shadow-lg shadow-healthcare/20 focus:outline-none focus:ring-2 focus:ring-healthcare/40"
                  type="submit"
                >
                  <span className="relative z-10">Login</span>
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 opacity-0 transition group-hover:opacity-100"
                    animate={{ x: ["-30%", "130%"] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
                    }}
                  />
                </motion.button>
              </motion.form>

              <motion.div variants={item} className="mt-6">
                <p className="text-xs text-slate-200/55">
                  © 2026 DAS Healthcare Systems
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
