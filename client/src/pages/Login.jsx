import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

function Login() {
  const [form, setForm] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const { data } = await API.post("/auth/login", form);

      login(data);

      const role = data.user.role;

      if (role === "admin") navigate("/admin");
      else if (role === "agent") navigate("/agent");
      else navigate("/customer");
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.16),_transparent_35%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_90px_-35px_rgba(15,23,42,0.55)]">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white lg:flex lg:w-[46%]">
          <div>
            <span className="mb-6 inline-flex rounded-full border border-indigo-400/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-200">
              Secure portal
            </span>
            <h2 className="text-3xl font-bold leading-tight">
              Access your Customer Registry workspace
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Sign in to manage complaints, assign support agents, and keep
              every case moving forward in one place.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 11l2 2 4-4" strokeWidth="3" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Protected by role-based access
                </p>
                <p className="text-xs text-slate-300">
                  Admins, agents, and customers each get the right view.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full p-8 sm:p-10 lg:w-[54%] lg:p-10">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">
              Welcome back
            </p>
            <h3 className="mt-2 text-3xl font-bold text-slate-900">
              Sign in to continue
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Enter your credentials to access your account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-700 hover:to-indigo-600"
            >
              Login
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
