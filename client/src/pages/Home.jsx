import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Counter for newly generated cases in client memory
let caseCounter = 2382;

// ==========================================
// 1. Toast Notification Component
// ==========================================
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-8 right-8 z-[1100] flex flex-col gap-3 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let bgStyle = "bg-slate-900 text-white";
        let icon = (
          <svg
            className="w-[18px] h-[18px] text-indigo-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          </svg>
        );

        if (toast.type === "success") {
          bgStyle = "bg-slate-900 text-white border-l-4 border-emerald-500";
          icon = (
            <svg
              className="w-[18px] h-[18px] text-emerald-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          );
        } else if (toast.type === "error") {
          bgStyle = "bg-slate-900 text-white border-l-4 border-red-500";
          icon = (
            <svg
              className="w-[18px] h-[18px] text-red-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          );
        } else if (toast.type === "info") {
          bgStyle = "bg-slate-900 text-white border-l-4 border-indigo-500";
          icon = (
            <svg
              className="w-[18px] h-[18px] text-indigo-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          );
        }

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl pointer-events-auto transition-all duration-300 transform translate-y-0 opacity-100 ${bgStyle} animate-slideIn`}
          >
            {icon}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 2. Navigation Bar Component
// ==========================================
function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const handleScroll = (e, id) => {
    e.preventDefault();
    setIsOpen(false);
    const targetElement = document.querySelector(id);
    if (targetElement) {
      const headerElement = document.querySelector("header");
      const headerHeight = headerElement ? headerElement.offsetHeight : 80;
      const targetPosition =
        targetElement.getBoundingClientRect().top +
        window.pageYOffset -
        headerHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <a href="#" className="flex items-center gap-2 group">
          <svg
            className="w-7 h-7 text-indigo-600 transition-transform group-hover:rotate-[-10deg] group-hover:scale-105"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 11l2 2 4-4" strokeWidth="3" />
          </svg>
          <span className="font-display text-xl font-extrabold tracking-tight text-slate-900">
            Customer Registry
          </span>
        </a>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            onClick={(e) => handleScroll(e, "#features")}
            className="text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 px-3 py-2 rounded-md transition-all"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => handleScroll(e, "#how-it-works")}
            className="text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 px-3 py-2 rounded-md transition-all"
          >
            How it works
          </a>
          <a
            href="#roles"
            onClick={(e) => handleScroll(e, "#roles")}
            className="text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 px-3 py-2 rounded-md transition-all"
          >
            About / Roles
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center font-bold px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95 rounded-xl transition-all"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-indigo-600 focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isOpen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-6 py-4 flex flex-col gap-4">
          <a
            href="#features"
            onClick={(e) => handleScroll(e, "#features")}
            className="text-base font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => handleScroll(e, "#how-it-works")}
            className="text-base font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            How it works
          </a>
          <a
            href="#roles"
            onClick={(e) => handleScroll(e, "#roles")}
            className="text-base font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            About / Roles
          </a>
          <div className="w-full border-t border-slate-100 my-1"></div>
          <Link
            to="/login"
            className="text-base font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="w-full text-center font-bold px-4 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}

// ==========================================
// 3. Case Queue Component
// ==========================================
function CaseQueue({ cases, onInspect }) {
  const activeCount = cases.filter((c) => c.status !== "Resolved").length;

  return (
    <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center relative">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></span>
        </div>
        <div className="mx-auto bg-white border border-slate-200 rounded px-10 py-0.5 text-[11px] text-slate-400 font-mono">
          case-registry/queue
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-extrabold text-slate-900">
            Active Cases
          </h3>
          <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-100/50">
            {activeCount} active case{activeCount !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {cases.map((c) => {
            let statusStyle = "bg-red-50 text-red-500 border-red-200";
            if (c.status === "In progress") {
              statusStyle = "bg-amber-50 text-amber-600 border-amber-200";
            } else if (c.status === "Resolved") {
              statusStyle = "bg-emerald-50 text-emerald-500 border-emerald-200";
            }

            return (
              <div
                key={c.id}
                onClick={() => onInspect(c.id)}
                className="grid grid-cols-[75px_1fr_auto] items-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer hover:bg-white hover:border-indigo-600 hover:translate-x-1 hover:shadow-sm transition-all duration-200"
              >
                <span className="text-slate-400 font-bold">{c.id}</span>
                <span className="text-slate-900 font-semibold truncate pr-2">
                  {c.desc}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full border font-bold text-[10px] text-center ${statusStyle}`}
                >
                  {c.status}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="text-slate-500">Avg. Resolution:</span>
            <span className="text-slate-900 font-extrabold">6h 12m</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. Hero Section Component
// ==========================================
function Hero({ cases, onInspect }) {
  return (
    <section id="hero" className="py-8 md:py-10">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.7)] md:p-8 lg:p-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200 backdrop-blur">
              <span className="relative inline-block h-2.5 w-2.5 rounded-full bg-emerald-400">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
              </span>
              Trusted by support & operations teams
            </div>

            <h1 className="mb-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              Modern complaint management <br />
              <span className="bg-gradient-to-r from-indigo-300 via-indigo-200 to-slate-100 bg-clip-text text-transparent">
                for customer-first organizations
              </span>
            </h1>

            <p className="mb-8 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Give your team a single, secure workspace to receive complaints,
              assign ownership, and resolve issues with clarity and speed.
            </p>

            <div className="mb-10 flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-base font-bold text-slate-900 transition-all hover:bg-slate-100 hover:shadow-lg hover:shadow-indigo-900/20 active:scale-95"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-base font-bold text-white transition-all hover:bg-white/15 active:scale-95"
              >
                Login
              </Link>
            </div>

            <div className="flex w-full flex-wrap justify-center gap-3 border-t border-white/10 pt-7 lg:justify-start">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-200 backdrop-blur">
                Real-time visibility
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-200 backdrop-blur">
                Role-based access
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-200 backdrop-blur">
                Secure audit trail
              </div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <CaseQueue cases={cases} onInspect={onInspect} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 5. How It Works Component
// ==========================================
function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h3 className="font-display text-xs font-extrabold uppercase tracking-widest text-indigo-600 mb-2">
            How it works
          </h3>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            A clear path from intake to resolution
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
            Every complaint follows a consistent workflow designed for
            visibility, accountability, and faster response times.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              01
            </div>
            <h4 className="mb-2 text-lg font-extrabold text-slate-900">
              Customer submits a case
            </h4>
            <p className="text-sm leading-relaxed text-slate-600">
              Issues are captured with the context and detail needed for a
              confident handoff.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              02
            </div>
            <h4 className="mb-2 text-lg font-extrabold text-slate-900">
              Admin routes and assigns
            </h4>
            <p className="text-sm leading-relaxed text-slate-600">
              The right team member is assigned quickly based on priority,
              workload, and expertise.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              03
            </div>
            <h4 className="mb-2 text-lg font-extrabold text-slate-900">
              Agent resolves with full context
            </h4>
            <p className="text-sm leading-relaxed text-slate-600">
              Updates, notes, and outcomes stay connected so the record remains
              clear and actionable.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 6. Features Component
// ==========================================
const featureItems = [
  {
    title: "Role-based access control",
    text: "Admins, agents, and customers each see exactly what they need — nothing more, nothing less.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
  },
  {
    title: "Real-time complaint tracking",
    text: "Every update, comment, and status change syncs instantly across the team.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
      </svg>
    ),
  },
  {
    title: "Agent assignment system",
    text: "Route cases automatically or manually based on agent workload and expertise.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <line x1="19" y1="8" x2="19" y2="14"></line>
        <line x1="22" y1="11" x2="16" y2="11"></line>
      </svg>
    ),
  },
  {
    title: "Status workflow",
    text: "Open, in progress, resolved — a clear path every case follows, with full audit history.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
        <polyline points="16 7 22 7 22 13"></polyline>
      </svg>
    ),
  },
  {
    title: "Secure authentication",
    text: "JWT-based sessions keep every account and customer record protected by default.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    ),
  },
  {
    title: "Admin dashboard control",
    text: "One view of volume, response times, and individual agent performance — no spreadsheets.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="3" width="7" height="9"></rect>
        <rect x="14" y="3" width="7" height="5"></rect>
        <rect x="14" y="12" width="7" height="9"></rect>
        <rect x="3" y="16" width="7" height="5"></rect>
      </svg>
    ),
  },
];

function Features() {
  return (
    <section id="features" className="py-20 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h3 className="font-display text-xs font-extrabold uppercase tracking-widest text-indigo-600 mb-2">
            Features
          </h3>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything the case lifecycle needs
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-4 max-w-xl mx-auto">
            From intake to resolution, each piece is built so admins, agents,
            and customers stay in sync without extra tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-8 hover:-translate-y-1 hover:shadow-2xl hover:border-indigo-600 group transition-all duration-300 shadow-sm"
            >
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 border border-indigo-100/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                {item.icon}
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-3">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 7. Roles & Preview Buttons Component
// ==========================================
const roleItems = [
  {
    role: "admin",
    title: "Admin Dashboard",
    desc: "Oversee every case, manage agents, and monitor team performance from a single control center.",
    features: ["Team & permissions", "Case volume analytics", "SLA monitoring"],
  },
  {
    role: "agent",
    title: "Agent Dashboard",
    desc: "A focused queue of assigned cases, with everything needed to respond and resolve quickly.",
    features: ["Assigned case queue", "Internal notes", "Status updates"],
  },
  {
    role: "customer",
    title: "Customer Portal",
    desc: "A simple place for customers to file complaints and track resolution status in real time.",
    features: ["Submit a complaint", "Track case status", "Message history"],
  },
];

function Roles({ onPreview }) {
  return (
    <section id="roles" className="py-20 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h3 className="font-display text-xs font-extrabold uppercase tracking-widest text-indigo-600 mb-2">
            Built for every role
          </h3>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            A dedicated view for everyone in the loop
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {roleItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-10 flex flex-col hover:-translate-y-1 hover:shadow-2xl hover:border-slate-300 transition-all duration-300 shadow-md"
            >
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600 mb-7 leading-relaxed min-h-[4.5rem]">
                {item.desc}
              </p>

              <ul className="flex flex-col gap-3 mb-9 flex-grow">
                {item.features.map((feat, fIdx) => (
                  <li
                    key={fIdx}
                    className="flex items-center gap-2.5 text-sm font-semibold text-slate-900"
                  >
                    <svg
                      className="w-[18px] h-[18px] text-emerald-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onPreview(item.role)}
                className="w-full inline-flex items-center justify-center gap-1.5 font-bold px-4 py-3 text-sm text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] rounded-xl transition-all shadow-sm group"
              >
                Preview {item.role} view
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 8. Preview Modal Overlay Component
// ==========================================
function PreviewModal({
  isOpen,
  role,
  caseId,
  cases,
  onClose,
  onUpdateCaseStatus,
  onAddCase,
  onAddToast,
}) {
  const [activeCase, setActiveCase] = useState(null);

  // Note inputs
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState([
    { author: "System", text: "Created case session." },
  ]);

  // Customer Form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Refunds");
  const [priority, setPriority] = useState("Medium");
  const [desc, setDesc] = useState("");

  // Handle setting active case details when caseId or cases change
  useEffect(() => {
    if (caseId && cases) {
      const found = cases.find((c) => c.id === caseId);
      if (found) {
        setActiveCase(found);
      }
    } else if (cases && cases.length > 0) {
      setActiveCase(cases[0]);
    }
  }, [caseId, cases, isOpen]);

  // Clean states on open/role change
  useEffect(() => {
    if (isOpen) {
      setNotes([{ author: "System", text: "Created case session." }]);
      setNoteText("");
      setSubject("");
      setCategory("Refunds");
      setPriority("Medium");
      setDesc("");
    }
  }, [isOpen, role]);

  if (!isOpen) return null;

  const handleSaveNote = () => {
    if (!noteText.trim()) {
      onAddToast("Please enter a note", "error");
      return;
    }
    setNotes([...notes, { author: "Agent", text: noteText.trim() }]);
    setNoteText("");
    onAddToast("Internal audit note added!", "success");
  };

  const handleStatusUpdate = (newStatus) => {
    if (activeCase) {
      onUpdateCaseStatus(activeCase.id, newStatus);
      onAddToast(`Case ${activeCase.id} updated to ${newStatus}`, "success");
      onClose();
    }
  };

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !desc.trim()) {
      onAddToast("Please fill in all required fields", "error");
      return;
    }
    onAddCase({
      desc: subject.trim(),
      details: desc.trim(),
      category,
      priority,
      status: "Open",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-md px-4">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 animate-scaleUp">
        <div className="bg-slate-100 border-b border-slate-200 px-8 py-5 flex justify-between items-center">
          <h3 className="font-display text-lg font-extrabold text-slate-900">
            {role === "admin" && "Admin Dashboard - Interactive Preview"}
            {role === "agent" && "Agent Dashboard - Interactive Preview"}
            {role === "customer" && "Customer Portal - File a Complaint"}
          </h3>
          <button
            onClick={onClose}
            className="text-2xl text-slate-400 hover:text-slate-900 focus:outline-none transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="p-8 max-h-[75vh] overflow-y-auto">
          {/* ADMIN VIEW */}
          {role === "admin" && (
            <div>
              <div className="grid grid-cols-3 gap-5 mb-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
                  <div className="font-display text-3xl font-extrabold text-indigo-600 leading-none">
                    {cases.length + 42}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                    Total Volume
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
                  <div className="font-display text-3xl font-extrabold text-indigo-600 leading-none">
                    {cases.filter((c) => c.status !== "Resolved").length}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                    Active Cases
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
                  <div className="font-display text-3xl font-extrabold text-indigo-600 leading-none">
                    98.2%
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                    SLA Compliance
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
                <h4 className="text-sm font-bold text-slate-950 mb-4">
                  Inbound Volume (Last 5 Days)
                </h4>
                <div className="flex items-end justify-between h-[120px] border-b border-slate-200 pb-1">
                  <div className="flex flex-col items-center flex-grow">
                    <div
                      className="w-6 bg-indigo-600 hover:bg-indigo-700 rounded-t-sm transition-colors duration-200"
                      style={{ height: "45px" }}
                    ></div>
                    <span className="text-[10px] font-bold text-slate-400 mt-2">
                      Mon
                    </span>
                  </div>
                  <div className="flex flex-col items-center flex-grow">
                    <div
                      className="w-6 bg-indigo-600 hover:bg-indigo-700 rounded-t-sm transition-colors duration-200"
                      style={{ height: "65px" }}
                    ></div>
                    <span className="text-[10px] font-bold text-slate-400 mt-2">
                      Tue
                    </span>
                  </div>
                  <div className="flex flex-col items-center flex-grow">
                    <div
                      className="w-6 bg-indigo-600 hover:bg-indigo-700 rounded-t-sm transition-colors duration-200"
                      style={{ height: "85px" }}
                    ></div>
                    <span className="text-[10px] font-bold text-slate-400 mt-2">
                      Wed
                    </span>
                  </div>
                  <div className="flex flex-col items-center flex-grow">
                    <div
                      className="w-6 bg-indigo-600 hover:bg-indigo-700 rounded-t-sm transition-colors duration-200"
                      style={{ height: "55px" }}
                    ></div>
                    <span className="text-[10px] font-bold text-slate-400 mt-2">
                      Thu
                    </span>
                  </div>
                  <div className="flex flex-col items-center flex-grow">
                    <div
                      className="w-6 bg-indigo-600 hover:bg-indigo-700 rounded-t-sm transition-colors duration-200"
                      style={{ height: "95px" }}
                    ></div>
                    <span className="text-[10px] font-bold text-slate-400 mt-2">
                      Fri
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-3">
                  Agent Availability
                </h5>
                <div className="flex flex-col gap-2 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                      Sarah Jenkins (Senior Agent)
                    </span>
                    <span className="text-slate-500 font-medium">
                      2 active cases
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                      David Miller (Agent)
                    </span>
                    <span className="text-slate-500 font-medium">
                      3 active cases
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                      Elena Rostova (Away)
                    </span>
                    <span className="text-slate-500 font-medium">
                      0 active cases
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AGENT VIEW */}
          {role === "agent" && activeCase && (
            <div className="grid grid-cols-1 md:grid-cols-[1.3fr_0.7fr] gap-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="border-b border-slate-200 pb-4 mb-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold mb-1">
                    <span className="text-indigo-600">{activeCase.id}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">
                      {activeCase.category}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {activeCase.desc}
                  </h4>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  {activeCase.details}
                </p>

                <div>
                  <h5 className="text-xs font-bold text-slate-950 mb-2">
                    Internal Audit Notes
                  </h5>
                  <div className="mb-3 text-[11px] flex flex-col gap-2 max-h-[100px] overflow-y-auto pr-1">
                    {notes.map((note, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 p-2 rounded-lg"
                      >
                        <span
                          className={`font-bold ${note.author === "Agent" ? "text-indigo-600" : "text-slate-900"}`}
                        >
                          {note.author}:{" "}
                        </span>
                        <span className="text-slate-600 font-medium">
                          {note.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full h-20 border border-slate-200 rounded-xl p-3 text-xs bg-white text-slate-900 focus:outline-none focus:border-indigo-600 resize-none mb-3"
                    placeholder="Type an internal note only agents can see..."
                  />
                  <button
                    onClick={handleSaveNote}
                    className="inline-flex items-center justify-center font-bold px-3 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    Save Note
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">
                    Status Routing
                  </h5>
                  <select
                    id="modal-status-select"
                    defaultValue={activeCase.status}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 text-slate-900 mb-3 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Open">Open</option>
                    <option value="In progress">In progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                  <button
                    onClick={() => {
                      const sel = document.getElementById(
                        "modal-status-select",
                      );
                      if (sel) handleStatusUpdate(sel.value);
                    }}
                    className="w-full inline-flex items-center justify-center font-bold px-3 py-2 text-xs text-slate-700 hover:text-slate-900 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    Update Status
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 text-xs font-semibold shadow-sm">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">
                    Ticket Info
                  </h5>
                  <div className="mb-2">
                    <span className="text-slate-500 font-medium">
                      Priority:
                    </span>{" "}
                    <span className="text-slate-900 font-extrabold">
                      {activeCase.priority}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Owner:</span>{" "}
                    <span className="text-slate-900 font-extrabold">
                      Sarah Jenkins
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOMER VIEW */}
          {role === "customer" && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <form onSubmit={handleCustomerSubmit}>
                <div className="mb-4">
                  <label
                    className="block text-xs font-bold text-slate-950 mb-2"
                    htmlFor="sub"
                  >
                    Subject / Issue Summary*
                  </label>
                  <input
                    type="text"
                    id="sub"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:border-indigo-600"
                    placeholder="e.g. Can't download billing invoice"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      className="block text-xs font-bold text-slate-950 mb-2"
                      htmlFor="cat"
                    >
                      Category
                    </label>
                    <select
                      id="cat"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:border-indigo-600"
                    >
                      <option value="Refunds">Refunds</option>
                      <option value="Account Access">Account Access</option>
                      <option value="Delivery Issues">Delivery Issues</option>
                      <option value="Billing">Billing</option>
                      <option value="Technical Support">
                        Technical Support
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-xs font-bold text-slate-950 mb-2"
                      htmlFor="pri"
                    >
                      Urgency
                    </label>
                    <select
                      id="pri"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:border-indigo-600"
                    >
                      <option value="Low">Low (No rush)</option>
                      <option value="Medium">Medium (Standard)</option>
                      <option value="High">High (Urgent)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label
                    className="block text-xs font-bold text-slate-950 mb-2"
                    htmlFor="details"
                  >
                    Provide Details / Context*
                  </label>
                  <textarea
                    id="details"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full h-24 border border-slate-200 rounded-xl p-4 text-xs bg-white text-slate-900 focus:outline-none focus:border-indigo-600 resize-none"
                    placeholder="Explain what happened, including order numbers, error codes or logs..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center font-bold px-4 py-3 text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl transition-all"
                >
                  Submit Complaint
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 9. Footer Component
// ==========================================
function Footer() {
  const handleScroll = (e, id) => {
    e.preventDefault();
    const targetElement = document.querySelector(id);
    if (targetElement) {
      const headerElement = document.querySelector("header");
      const headerHeight = headerElement ? headerElement.offsetHeight : 80;
      const targetPosition =
        targetElement.getBoundingClientRect().top +
        window.pageYOffset -
        headerHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <footer className="bg-white border-t border-slate-200 py-16 mt-16">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-12 md:gap-16 mb-16">
        <div className="flex flex-col">
          <a href="#" className="flex items-center gap-2 mb-5">
            <svg
              className="w-6 h-6 text-indigo-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 11l2 2 4-4" strokeWidth="3" />
            </svg>
            <span className="font-display text-lg font-extrabold tracking-tight text-slate-900">
              Customer Registry
            </span>
          </a>
          <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
            Simplifying operations and case routing for customer-centric
            engineering and support teams.
          </p>
        </div>

        <div className="flex flex-col">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-5">
            Navigation
          </h4>
          <ul className="flex flex-col gap-3 font-semibold text-sm text-slate-600">
            <li>
              <a
                href="#features"
                onClick={(e) => handleScroll(e, "#features")}
                className="hover:text-indigo-600 transition-colors"
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#how-it-works"
                onClick={(e) => handleScroll(e, "#how-it-works")}
                className="hover:text-indigo-600 transition-colors"
              >
                How it works
              </a>
            </li>
            <li>
              <a
                href="#roles"
                onClick={(e) => handleScroll(e, "#roles")}
                className="hover:text-indigo-600 transition-colors"
              >
                About / Roles
              </a>
            </li>
          </ul>
        </div>

        <div className="flex flex-col">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-5">
            Authentication
          </h4>
          <ul className="flex flex-col gap-3 font-semibold text-sm text-slate-600">
            <li>
              <Link
                to="/login"
                className="hover:text-indigo-600 transition-colors"
              >
                Login Portal
              </Link>
            </li>
            <li>
              <Link
                to="/register"
                className="hover:text-indigo-600 transition-colors"
              >
                Create Account
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-xs font-medium text-slate-400 gap-4 text-center">
        <p>&copy; 2026 Customer Registry Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}

// ==========================================
// 10. Main Home Component (Consolidated)
// ==========================================
export default function Home() {
  const [cases, setCases] = useState([
    {
      id: "CR-2381",
      desc: "Delayed refund on order",
      status: "Open",
      details:
        "Customer has not received their refund after 5 business days. Order ID: #10827, Refund amount: $129.99.",
      priority: "High",
      category: "Refunds",
    },
    {
      id: "CR-2380",
      desc: "Login access issue",
      status: "In progress",
      details:
        "User gets 500 error when clicking password reset link. Browser: Chrome, OS: macOS.",
      priority: "Medium",
      category: "Account Access",
    },
    {
      id: "CR-2376",
      desc: "Damaged item received",
      status: "In progress",
      details:
        "Parcel arrived with crushed corners. Customer uploaded photos of damaged keyboard chassis.",
      priority: "High",
      category: "Delivery Issues",
    },
    {
      id: "CR-2371",
      desc: "Billing discrepancy",
      status: "Resolved",
      details:
        "Double charge on subscription fee. Refunded the duplicate transaction via Stripe portal.",
      priority: "Low",
      category: "Billing",
    },
  ]);

  const [toasts, setToasts] = useState([]);
  const [modalState, setModalState] = useState({
    isOpen: false,
    role: "admin",
    caseId: null,
  });

  const addToast = (message, type = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const updateCaseStatus = (id, status) => {
    setCases((prevCases) =>
      prevCases.map((c) => (c.id === id ? { ...c, status } : c)),
    );
  };

  const addCase = (newCaseData) => {
    const newId = `CR-${caseCounter++}`;
    const newCase = {
      id: newId,
      ...newCaseData,
    };
    setCases((prevCases) => [newCase, ...prevCases]);
    addToast(
      `Success! Created Case ${newId}. It is now in the active queue.`,
      "success",
    );
  };

  const handleInspectCase = (caseId) => {
    setModalState({
      isOpen: true,
      role: "agent",
      caseId,
    });
  };

  const handlePreviewRole = (role) => {
    setModalState({
      isOpen: true,
      role,
      caseId: null,
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Welcome Toast on Mount
  useEffect(() => {
    addToast(
      "Welcome to Customer Registry Demo! Try clicking on cases in the queue or the preview buttons below.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.16),_transparent_35%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header / Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-16">
        {/* Hero Section */}
        <Hero cases={cases} onInspect={handleInspectCase} />

        {/* How It Works Section */}
        <HowItWorks />

        {/* Features Section */}
        <Features />

        {/* Roles / Portals Section */}
        <Roles onPreview={handlePreviewRole} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Preview Modals */}
      <PreviewModal
        isOpen={modalState.isOpen}
        role={modalState.role}
        caseId={modalState.caseId}
        cases={cases}
        onClose={handleCloseModal}
        onUpdateCaseStatus={updateCaseStatus}
        onAddCase={addCase}
        onAddToast={addToast}
      />

      {/* Toast Alert System */}
      <Toast toasts={toasts} />
    </div>
  );
}
