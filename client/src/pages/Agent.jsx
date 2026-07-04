import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { useToast } from "../context/ToastContext";
import {
  Inbox,
  Search,
  Filter,
  Clock,
  Star,
  MessageSquare,
  RefreshCw,
  X,
  Send,
  User,
  CheckCircle,
  AlertTriangle,
  Award,
  TrendingUp,
  Activity,
} from "lucide-react";

const STATUS_STYLES = {
  open: "text-rose-600 bg-rose-50 border-rose-200",
  "in-progress": "text-amber-600 bg-amber-50 border-amber-200",
  escalated: "text-red-600 bg-red-50 border-red-200",
  resolved: "text-emerald-600 bg-emerald-50 border-emerald-200",
  closed: "text-slate-600 bg-slate-100 border-slate-200",
};

const PRIORITY_STYLES = {
  low: "text-blue-600 bg-blue-50 border-blue-100",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-100",
  high: "text-orange-600 bg-orange-50 border-orange-100",
  urgent: "text-rose-600 bg-rose-50 border-rose-100",
};

const CATEGORY_LABELS = {
  product: "Product Issue",
  service: "Service Inquiry",
  billing: "Billing & Payments",
  technical: "Technical Support",
  other: "General Enquiry",
};

const Agent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "overview";

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Drawer / Chat state
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const { showToast } = useToast();
  const chatEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const fetchComplaints = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Build query string with filters
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filterCategory) params.append("category", filterCategory);
      if (filterPriority) params.append("priority", filterPriority);
      if (filterStatus) params.append("status", filterStatus);
      if (filterDateFrom) params.append("dateFrom", filterDateFrom);
      if (filterDateTo) params.append("dateTo", filterDateTo);

      const { data } = await API.get(`/complaints?${params.toString()}`);
      setComplaints(data.complaints || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load complaints", "error");
      setComplaints([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [
    searchQuery,
    filterCategory,
    filterPriority,
    filterStatus,
    filterDateFrom,
    filterDateTo,
  ]);

  // Poll for messages when drawer is open
  useEffect(() => {
    if (drawerOpen && activeComplaint) {
      fetchMessages(true);
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(true);
      }, 4000); // Poll every 4 seconds
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [drawerOpen, activeComplaint]);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async (silent = false) => {
    if (!activeComplaint) return;
    if (!silent) setMessagesLoading(true);
    try {
      const { data } = await API.get(`/messages/${activeComplaint._id}`);
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeComplaint) return;

    setSendingMessage(true);
    try {
      const { data } = await API.post(`/messages/${activeComplaint._id}`, {
        content: newMessage.trim(),
      });
      if (data.success) {
        setNewMessage("");
        fetchMessages(true);
      }
    } catch (err) {
      showToast("Failed to send message", "error");
    } finally {
      setSendingMessage(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await API.put(`/complaints/${id}/status`, { status });
      if (data.success) {
        showToast("Status updated successfully", "success");

        // Update local complaint details if in drawer
        if (activeComplaint && activeComplaint._id === id) {
          setActiveComplaint((prev) => ({ ...prev, status }));
        }

        // Update list
        setComplaints((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status } : c)),
        );
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update status",
        "error",
      );
    }
  };

  const openDrawer = (c) => {
    setActiveComplaint(c);
    setMessages([]);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setActiveComplaint(null);
  };

  // Stats
  const totalAssigned = complaints.length;
  const activeCases = complaints.filter((c) =>
    ["open", "in-progress", "escalated"].includes(c.status),
  ).length;
  const inProgressCases = complaints.filter(
    (c) => c.status === "in-progress",
  ).length;
  const escalatedCases = complaints.filter(
    (c) => c.status === "escalated",
  ).length;
  const resolvedCases = complaints.filter(
    (c) => c.status === "resolved",
  ).length;
  const closedCases = complaints.filter((c) => c.status === "closed").length;

  // Performance Rating calculations
  const ratedComplaints = complaints.filter((c) => c.rating !== null);
  const averageRating =
    ratedComplaints.length > 0
      ? (
          ratedComplaints.reduce((acc, curr) => acc + curr.rating, 0) /
          ratedComplaints.length
        ).toFixed(1)
      : "N/A";

  // Filter complaints based on view & parameters
  const getFilteredComplaints = () => {
    let list = complaints;

    if (currentView === "resolved-archives") {
      list = complaints.filter((c) =>
        ["resolved", "closed"].includes(c.status),
      );
    } else if (currentView === "assigned-complaints") {
      list = complaints.filter((c) =>
        ["open", "in-progress", "escalated"].includes(c.status),
      );
    }

    return list;
  };

  const displayedComplaints = getFilteredComplaints();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── TOP HEADER ── */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-slate-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-indigo-300 text-xs font-semibold uppercase tracking-wider bg-indigo-900/40 px-3 py-1 rounded-full border border-indigo-500/20">
              Support Desk
            </span>
            <h1 className="text-2xl md:text-3xl font-bold mt-2.5">
              Welcome back to your workspace
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Manage assigned user complaints, answer customers in real-time,
              and drive high customer satisfaction metrics.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3.5 rounded-2xl shrink-0">
            <div className="text-center px-2">
              <span className="text-xs text-slate-400 block uppercase">
                CSAT Score
              </span>
              <span className="text-xl font-bold font-mono text-yellow-400 mt-1 flex items-center justify-center gap-1">
                <Star className="h-4.5 w-4.5 fill-yellow-400 text-yellow-400" />
                {averageRating}
              </span>
            </div>
            <div className="h-8 border-l border-white/10" />
            <div className="text-center px-2">
              <span className="text-xs text-slate-400 block uppercase">
                Active Cases
              </span>
              <span className="text-xl font-bold font-mono text-indigo-300 mt-1 block">
                {activeCases}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      {currentView === "overview" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              {
                label: "Assigned Claims",
                count: totalAssigned,
                color: "text-slate-700 bg-white",
              },
              {
                label: "In Progress",
                count: inProgressCases,
                color: "text-amber-600 bg-white",
              },
              {
                label: "Escalated",
                count: escalatedCases,
                color: "text-red-600 bg-white",
              },
              {
                label: "Resolved",
                count: resolvedCases,
                color: "text-emerald-600 bg-white",
              },
              {
                label: "Closed Archive",
                count: closedCases,
                color: "text-slate-600 bg-white",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <h3
                  className={`text-3xl font-bold mt-2 font-mono ${stat.color.split(" ")[0]}`}
                >
                  {stat.count}
                </h3>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column: Workload & Rating Metrics */}
            <div className="md:col-span-1 space-y-6">
              {/* Workload Index */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-slate-800 font-semibold text-base border-b pb-3">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  <h3>Workload Allocation</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
                      <span>Active Workload Capacity</span>
                      <span className="font-bold">
                        {activeCases} / 15 Cases
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-500"
                        style={{
                          width: `${Math.min((activeCases / 15) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Optimal workload allocation targets keeping active tickets
                    under 10. If capacity exceeds 15, please request assistance
                    from the supervisor.
                  </p>
                </div>
              </div>

              {/* Performance Indicator */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center gap-3 text-slate-800 font-semibold text-base border-b pb-3">
                  <Award className="h-5 w-5 text-indigo-600" />
                  <h3>Customer Reviews Summary</h3>
                </div>
                <div className="flex items-center gap-4 py-2">
                  <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-amber-500 shrink-0 shadow-sm">
                    <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Average Rating: {averageRating} / 5.0
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Based on {ratedComplaints.length} customer ratings.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Reviews are gathered from resolved tickets. Maintain quality
                  responses to maintain score above 4.5!
                </p>
              </div>
            </div>

            {/* Right Column: Urgent Action Items */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-slate-800 font-bold text-lg">
                  Action Items Needed
                </h2>
                <button
                  onClick={() =>
                    setSearchParams({ view: "assigned-complaints" })
                  }
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold flex items-center gap-1"
                >
                  View All Active ({activeCases})
                </button>
              </div>

              {loading ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="h-8 w-8 text-slate-400 animate-spin" />
                  <p className="text-sm text-slate-500">
                    Loading assigned cases...
                  </p>
                </div>
              ) : complaints.filter((c) =>
                  ["open", "in-progress", "escalated"].includes(c.status),
                ).length > 0 ? (
                <div className="space-y-4">
                  {complaints
                    .filter((c) =>
                      ["open", "in-progress", "escalated"].includes(c.status),
                    )
                    .slice(0, 3)
                    .map((c) => (
                      <div
                        key={c._id}
                        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex gap-2">
                              <span
                                className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${PRIORITY_STYLES[c.priority || "medium"].split(" ")[0]} ${PRIORITY_STYLES[c.priority || "medium"].split(" ")[1]}`}
                              >
                                {c.priority || "medium"}
                              </span>
                              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border text-slate-500 bg-slate-50 border-slate-100">
                                {CATEGORY_LABELS[c.category] ||
                                  c.category ||
                                  "General"}
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-800 text-base mt-2.5">
                              {c.title}
                            </h3>
                            <span className="text-xs text-slate-500 block mt-1 font-semibold tracking-wide">
                              CUSTOMER:{" "}
                              {c.customer?.name
                                ? c.customer.name.toUpperCase()
                                : "UNKNOWN"}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_STYLES[c.status || "open"]}`}
                          >
                            {c.status}
                          </span>
                        </div>

                        <p className="text-sm text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>

                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            Assigned on:{" "}
                            {c.createdAt
                              ? new Date(c.createdAt).toLocaleDateString()
                              : ""}
                          </span>
                          <button
                            onClick={() => openDrawer(c)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline font-semibold flex items-center gap-1.5"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Open Chat & Details
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center flex flex-col items-center justify-center gap-3">
                  <CheckCircle
                    className="h-10 w-10 text-emerald-500"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm font-semibold text-slate-700">
                    All caught up! No active cases
                  </p>
                  <p className="text-xs text-slate-500 max-w-[240px] mx-auto">
                    Excellent! Any new claims assigned by the administrator will
                    appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(currentView === "assigned-complaints" ||
        currentView === "resolved-archives") && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer name, email, title, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm outline-none transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 shrink-0">
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full border border-slate-200 px-3 py-3 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-400 bg-white"
                >
                  <option value="">All Categories</option>
                  <option value="product">Product Issue</option>
                  <option value="service">Service Inquiry</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="technical">Technical Support</option>
                  <option value="other">General Enquiry</option>
                </select>
              </div>

              <div>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full border border-slate-200 px-3 py-3 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-400 bg-white"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Priority</option>
                </select>
              </div>

              {currentView === "assigned-complaints" ? (
                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-slate-200 px-3 py-3 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-400 bg-white"
                  >
                    <option value="">All Active Statuses</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="escalated">Escalated</option>
                  </select>
                </div>
              ) : (
                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-slate-200 px-3 py-3 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-400 bg-white"
                  >
                    <option value="">All Archives Statuses</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              )}
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full border border-slate-200 px-3 py-3 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-400 bg-white"
              />
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full border border-slate-200 px-3 py-3 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-400 bg-white"
              />
            </div>

            {/* Clear Filters Button */}
            {(searchQuery ||
              filterCategory ||
              filterPriority ||
              filterStatus ||
              filterDateFrom ||
              filterDateTo) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterCategory("");
                  setFilterPriority("");
                  setFilterStatus("");
                  setFilterDateFrom("");
                  setFilterDateTo("");
                }}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors shrink-0"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* List display */}
          {loading ? (
            <div className="bg-white p-24 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">
                Fetching complaints...
              </p>
            </div>
          ) : displayedComplaints.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {displayedComplaints.map((c) => (
                <div
                  key={c._id}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${PRIORITY_STYLES[c.priority || "medium"].split(" ")[0]} ${PRIORITY_STYLES[c.priority || "medium"].split(" ")[1]}`}
                      >
                        {c.priority || "medium"}
                      </span>
                      <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border text-slate-600 bg-slate-50 border-slate-100">
                        {CATEGORY_LABELS[c.category] || c.category || "General"}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-lg mt-3">
                      {c.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2.5 leading-relaxed line-clamp-3">
                      {c.description}
                    </p>

                    {/* Customer Profile Block */}
                    <div className="mt-4 flex items-center gap-2 bg-slate-50 border border-slate-150 p-2.5 rounded-xl">
                      <User className="h-4 w-4 text-slate-500 shrink-0" />
                      <div className="text-xs text-slate-700">
                        <span className="font-bold">
                          {c.customer?.name
                            ? c.customer.name.toUpperCase()
                            : "UNKNOWN"}
                        </span>
                        <span className="mx-1">•</span>
                        <span className="font-mono text-slate-500">
                          {c.customer?.email || "No email"}
                        </span>
                      </div>
                    </div>

                    {/* Feedback displays (for resolved archives) */}
                    {c.rating !== null && (
                      <div className="mt-4 bg-yellow-50/50 border border-yellow-100 p-3 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-yellow-700 text-xs font-bold">
                          <div className="flex items-center gap-0.5">
                            {[...Array(c.rating)].map((_, i) => (
                              <Star
                                key={i}
                                className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                          <span>Rating Review</span>
                        </div>
                        {c.feedback && (
                          <p className="text-xs text-slate-600 italic">
                            "{c.feedback}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${STATUS_STYLES[c.status || "open"].split(" ")[0]} ${STATUS_STYLES[c.status || "open"].split(" ")[1]}`}
                      >
                        {c.status}
                      </span>

                      {/* Only allow changing status for active tickets */}
                      {["open", "in-progress", "escalated"].includes(
                        c.status,
                      ) && (
                        <select
                          value={c.status}
                          onChange={(e) => updateStatus(c._id, e.target.value)}
                          className="border border-slate-200 text-xs p-1.5 rounded-lg outline-none bg-white font-medium"
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="escalated">Escalated</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      )}
                    </div>

                    <button
                      onClick={() => openDrawer(c)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Chat & Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-24 text-center flex flex-col items-center justify-center gap-3">
              <Inbox className="h-12 w-12 text-slate-300" strokeWidth={1.5} />
              <p className="text-base font-bold text-slate-700">
                No complaints registered in this view
              </p>
              <p className="text-xs text-slate-500 max-w-[280px] mx-auto mt-1">
                Any tickets meeting search and filters criteria will list here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── DETAILS & CHAT DRAWER (SLIDE-OVER) ── */}
      {drawerOpen && activeComplaint && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-2xl transform transition-transform duration-300 ease-in-out">
                <div className="flex h-full flex-col bg-white shadow-2xl border-l border-slate-100">
                  {/* Drawer Header */}
                  <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-600/30 p-2 rounded-xl border border-indigo-500/20">
                        <MessageSquare className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white max-w-[400px] truncate">
                          {activeComplaint.title}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ID: {activeComplaint._id}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={closeDrawer}
                      className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-slate-800 transition-colors"
                      aria-label="Close panel"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Drawer Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Complaint Overview Section */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                          Ticket Overview
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[activeComplaint.status]}`}
                          >
                            {activeComplaint.status}
                          </span>

                          {/* Inline Status Changer in Drawer */}
                          {["open", "in-progress", "escalated"].includes(
                            activeComplaint.status,
                          ) && (
                            <select
                              value={activeComplaint.status}
                              onChange={(e) =>
                                updateStatus(
                                  activeComplaint._id,
                                  e.target.value,
                                )
                              }
                              className="border border-slate-200 text-xs p-1.5 rounded-lg outline-none bg-white font-medium"
                            >
                              <option value="open">Open</option>
                              <option value="in-progress">In Progress</option>
                              <option value="escalated">Escalated</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-semibold text-slate-400">
                            CATEGORY
                          </p>
                          <p className="font-bold text-slate-700 mt-1">
                            {CATEGORY_LABELS[activeComplaint.category] ||
                              activeComplaint.category ||
                              "General"}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-400">
                            PRIORITY
                          </p>
                          <p className="font-bold text-slate-700 mt-1 capitalize">
                            {activeComplaint.priority || "medium"}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-400">
                            CUSTOMER NAME
                          </p>
                          <p className="font-bold text-slate-700 mt-1">
                            {activeComplaint.customer?.name
                              ? activeComplaint.customer.name.toUpperCase()
                              : "UNKNOWN"}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-400">
                            CUSTOMER EMAIL
                          </p>
                          <p className="font-bold text-slate-700 mt-1 font-mono">
                            {activeComplaint.customer?.email || "No email"}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase">
                          Customer Description
                        </p>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-slate-150 shadow-inner-sm">
                          {activeComplaint.description}
                        </p>
                      </div>
                    </div>

                    {/* Customer Rating Review Block */}
                    {activeComplaint.rating !== null && (
                      <div className="bg-yellow-50 border border-yellow-150 p-5 rounded-2xl space-y-2">
                        <div className="flex items-center gap-1.5 text-yellow-800 text-sm font-bold">
                          <div className="flex items-center gap-0.5">
                            {[...Array(activeComplaint.rating)].map((_, i) => (
                              <Star
                                key={i}
                                className="h-4.5 w-4.5 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                          <span>CSAT Rating Submitted</span>
                        </div>
                        {activeComplaint.feedback && (
                          <p className="text-sm text-slate-600 italic">
                            "{activeComplaint.feedback}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Chat Messages Log */}
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4 text-indigo-500" />
                          Discussion Thread
                        </h3>
                        <button
                          onClick={() => fetchMessages()}
                          className="p-1 text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 text-[10px] font-semibold"
                          title="Refresh messages"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Refresh
                        </button>
                      </div>

                      {messagesLoading ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="h-6 w-6 text-slate-300 animate-spin" />
                          <p className="text-xs text-slate-400">
                            Loading conversation history...
                          </p>
                        </div>
                      ) : messages.length > 0 ? (
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                          {messages.map((m) => {
                            const isMe = m.senderRole === "agent";
                            const roleLabel =
                              m.senderRole === "admin"
                                ? "Admin"
                                : m.senderRole === "customer"
                                  ? "Customer"
                                  : "You (Specialist)";
                            return (
                              <div
                                key={m._id}
                                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                              >
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 px-2">
                                  <span className="font-semibold text-slate-500">
                                    {roleLabel}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {new Date(m.createdAt).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" },
                                    )}
                                  </span>
                                </div>
                                <div
                                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                    isMe
                                      ? "bg-indigo-600 text-white rounded-tr-none"
                                      : m.senderRole === "admin"
                                        ? "bg-purple-50 text-purple-900 border border-purple-100 rounded-tl-none font-medium"
                                        : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50"
                                  }`}
                                >
                                  {m.content}
                                </div>
                              </div>
                            );
                          })}
                          <div ref={chatEndRef} />
                        </div>
                      ) : (
                        <div className="py-12 border border-dashed border-slate-100 rounded-2xl text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                          <MessageSquare className="h-8 w-8 text-slate-200" />
                          <p className="text-xs">
                            No messages yet. Send a note below to start
                            discussing.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drawer Footer / Chat Input */}
                  <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 shrink-0">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        disabled={activeComplaint.status === "closed"}
                        placeholder={
                          activeComplaint.status === "closed"
                            ? "This complaint is closed"
                            : "Reply to customer..."
                        }
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <button
                        type="submit"
                        disabled={
                          sendingMessage ||
                          !newMessage.trim() ||
                          activeComplaint.status === "closed"
                        }
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl disabled:opacity-60 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 shrink-0 flex items-center justify-center transition-all disabled:scale-100 hover:scale-105 active:scale-95"
                      >
                        <Send className="h-4.5 w-4.5" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agent;
