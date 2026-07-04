import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { useToast } from "../context/ToastContext";
import {
  Inbox,
  UserPlus,
  X,
  Search,
  Filter,
  Clock,
  Star,
  MessageSquare,
  RefreshCw,
  Send,
  User,
  CheckCircle,
  AlertTriangle,
  Users,
  Plus,
  Trash2,
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

const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "overview";

  const [complaints, setComplaints] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Agent Modal state
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agentForm, setAgentForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [creatingAgent, setCreatingAgent] = useState(false);

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

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Build query string with filters
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filterCategory) params.append("category", filterCategory);
      if (filterPriority) params.append("priority", filterPriority);
      if (filterStatus) params.append("status", filterStatus);
      if (filterAgent && filterAgent !== "unassigned")
        params.append("agent", filterAgent);
      if (filterDateFrom) params.append("dateFrom", filterDateFrom);
      if (filterDateTo) params.append("dateTo", filterDateTo);

      const { data: cData } = await API.get(`/complaints?${params.toString()}`);
      const { data: uData } = await API.get("/users?role=agent");

      setComplaints(cData.complaints || cData || []);
      setAgents(uData.users || uData || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load data", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    searchQuery,
    filterCategory,
    filterPriority,
    filterStatus,
    filterAgent,
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

  const handleAssign = async (complaintId, agentId) => {
    try {
      const { data } = await API.put(`/complaints/${complaintId}/assign`, {
        agentId,
      });

      if (data.success) {
        showToast("Agent assigned successfully", "success");

        // Update local complaint details if in drawer
        if (activeComplaint && activeComplaint._id === complaintId) {
          setActiveComplaint(data.complaint);
        }

        // Update list
        setComplaints((prev) =>
          prev.map((c) => (c._id === complaintId ? data.complaint : c)),
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Assignment failed", "error");
    }
  };

  const updateStatus = async (complaintId, status) => {
    try {
      const { data } = await API.put(`/complaints/${complaintId}/status`, {
        status,
      });
      if (data.success) {
        showToast("Status updated", "success");

        if (activeComplaint && activeComplaint._id === complaintId) {
          setActiveComplaint((prev) => ({ ...prev, status }));
        }

        setComplaints((prev) =>
          prev.map((c) => (c._id === complaintId ? { ...c, status } : c)),
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Status update failed", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this complaint permanently?")) return;

    try {
      await API.delete(`/complaints/${id}`);
      showToast("Complaint deleted successfully", "info");

      if (activeComplaint && activeComplaint._id === id) {
        closeDrawer();
      }
      fetchData();
    } catch (err) {
      showToast("Failed to delete complaint", "error");
    }
  };

  const handleDeleteAgent = async (agentId, agentName) => {
    if (
      !window.confirm(
        `Are you sure you want to remove agent "${agentName.toUpperCase()}"? Any active tickets assigned to this agent will be unassigned.`,
      )
    )
      return;

    try {
      const { data } = await API.delete(`/users/${agentId}`);
      if (data.success) {
        showToast(
          `Agent "${agentName.toUpperCase()}" removed successfully`,
          "success",
        );
        fetchData();
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to remove agent",
        "error",
      );
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();

    if (!agentForm.name || !agentForm.email || !agentForm.password) {
      return showToast("All fields are required", "warning");
    }

    setCreatingAgent(true);

    try {
      await API.post("/users/agent", agentForm);
      showToast("Agent account created successfully", "success");
      setShowAgentModal(false);
      setAgentForm({ name: "", email: "", password: "" });
      fetchData();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to create agent",
        "error",
      );
    } finally {
      setCreatingAgent(false);
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

  // Aggregated Analytics
  const totalClaims = complaints.length;
  const unassignedClaims = complaints.filter((c) => !c.assignedAgent).length;
  const escalatedClaims = complaints.filter(
    (c) => c.status === "escalated",
  ).length;
  const openClaims = complaints.filter((c) => c.status === "open").length;
  const inProgressClaims = complaints.filter(
    (c) => c.status === "in-progress",
  ).length;
  const resolvedClaims = complaints.filter(
    (c) => c.status === "resolved" || c.status === "closed",
  ).length;

  // Breakdown percentages helper
  const getPercentage = (count) => {
    if (totalClaims === 0) return 0;
    return Math.round((count / totalClaims) * 100);
  };

  const priorityCounts = {
    low: complaints.filter((c) => c.priority === "low").length,
    medium: complaints.filter((c) => c.priority === "medium").length,
    high: complaints.filter((c) => c.priority === "high").length,
    urgent: complaints.filter((c) => c.priority === "urgent").length,
  };

  // Agent metrics compiler (for manage agents tab)
  const agentWorkloadCompiled = agents.map((agent) => {
    const agentTickets = complaints.filter(
      (c) => c.assignedAgent && c.assignedAgent._id === agent._id,
    );
    const active = agentTickets.filter((c) =>
      ["open", "in-progress", "escalated"].includes(c.status),
    ).length;
    const completed = agentTickets.filter((c) =>
      ["resolved", "closed"].includes(c.status),
    ).length;
    const rated = agentTickets.filter((c) => c.rating !== null);
    const ratingSum = rated.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating =
      rated.length > 0 ? (ratingSum / rated.length).toFixed(1) : "N/A";

    return {
      ...agent,
      activeCount: active,
      completedCount: completed,
      avgRating: averageRating,
    };
  });

  // Filter complaints list
  const filteredComplaints =
    filterAgent === "unassigned"
      ? complaints.filter((c) => !c.assignedAgent)
      : complaints;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── TOP HEADER ── */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-indigo-300 text-xs font-semibold uppercase tracking-wider bg-indigo-900/40 px-3 py-1 rounded-full border border-indigo-500/20">
              Admin Portal
            </span>
            <h1 className="text-2xl md:text-3xl font-bold mt-2.5">
              Customer Registry Control Center
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Monitor customer claims, manage agent staff workloads, reassign
              cases, and oversee CSAT ratings.
            </p>
          </div>
          <button
            onClick={() => setShowAgentModal(true)}
            className="self-start md:self-auto bg-white text-indigo-900 hover:bg-slate-50 hover:shadow-lg font-semibold text-sm px-5 py-3 rounded-2xl flex items-center gap-2 transition-all"
          >
            <UserPlus className="h-4.5 w-4.5" />
            Add Support Agent
          </button>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      {currentView === "overview" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              {
                label: "Global Claims",
                count: totalClaims,
                color: "text-slate-700 bg-white",
              },
              {
                label: "Unassigned",
                count: unassignedClaims,
                color: "text-rose-600 bg-white",
              },
              {
                label: "Escalated",
                count: escalatedClaims,
                color: "text-red-600 bg-white border border-red-100",
              },
              {
                label: "In Progress",
                count: inProgressClaims,
                color: "text-amber-600 bg-white",
              },
              {
                label: "Resolved Total",
                count: resolvedClaims,
                color: "text-emerald-600 bg-white",
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
            {/* Priority & Status Distributions */}
            <div className="md:col-span-1 space-y-6">
              {/* Priority Bar Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-3">
                  Priority Distribution
                </h3>
                <div className="space-y-3.5">
                  {[
                    {
                      label: "Urgent",
                      count: priorityCounts.urgent,
                      barColor: "bg-rose-500",
                    },
                    {
                      label: "High",
                      count: priorityCounts.high,
                      barColor: "bg-orange-500",
                    },
                    {
                      label: "Medium",
                      count: priorityCounts.medium,
                      barColor: "bg-yellow-500",
                    },
                    {
                      label: "Low",
                      count: priorityCounts.low,
                      barColor: "bg-blue-500",
                    },
                  ].map((p, idx) => {
                    const pct = getPercentage(p.count);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span className="font-semibold">{p.label}</span>
                          <span>
                            {p.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${p.barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Bar Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-3">
                  Status Breakdown
                </h3>
                <div className="space-y-3.5">
                  {[
                    {
                      label: "Open / Unassigned",
                      count: openClaims,
                      barColor: "bg-rose-500",
                    },
                    {
                      label: "In Progress",
                      count: inProgressClaims,
                      barColor: "bg-amber-500",
                    },
                    {
                      label: "Escalated",
                      count: escalatedClaims,
                      barColor: "bg-red-500",
                    },
                    {
                      label: "Resolved / Closed",
                      count: resolvedClaims,
                      barColor: "bg-emerald-500",
                    },
                  ].map((s, idx) => {
                    const pct = getPercentage(s.count);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span className="font-semibold">{s.label}</span>
                          <span>
                            {s.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${s.barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Support Workload Distribution */}
            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Agent Workloads Overview
                </h3>
                <button
                  onClick={() => setSearchParams({ view: "manage-agents" })}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Manage Agents ({agents.length})
                </button>
              </div>

              {agentWorkloadCompiled.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {agentWorkloadCompiled.map((agent) => (
                    <div
                      key={agent._id}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-750 text-sm">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-850 tracking-wide">
                            {agent.name.toUpperCase()}
                          </h4>
                          <span className="text-xs text-slate-400 font-mono">
                            {agent.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            Active Cases
                          </span>
                          <span className="text-sm font-bold text-slate-700">
                            {agent.activeCount} active
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            CS Rating
                          </span>
                          <span className="text-sm font-bold text-slate-700 flex items-center justify-end gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            {agent.avgRating}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Users className="h-10 w-10 text-slate-200" />
                  <p className="text-xs">
                    No support agents registered. Create an account to begin
                    distributing cases.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentView === "all-complaints" && (
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

            <div className="grid grid-cols-4 gap-2 shrink-0">
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

              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-slate-200 px-3 py-3 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-400 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <select
                  value={filterAgent}
                  onChange={(e) => setFilterAgent(e.target.value)}
                  className="w-full border border-slate-200 px-3 py-3 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-400 bg-white"
                >
                  <option value="">All Agents</option>
                  <option value="unassigned">Unassigned Only</option>
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full border border-slate-200 px-3 py-3 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-400 bg-white"
                placeholder="From date"
              />
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full border border-slate-200 px-3 py-3 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-400 bg-white"
                placeholder="To date"
              />
            </div>

            {/* Clear Filters Button */}
            {(searchQuery ||
              filterCategory ||
              filterPriority ||
              filterStatus ||
              filterAgent ||
              filterDateFrom ||
              filterDateTo) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterCategory("");
                  setFilterPriority("");
                  setFilterStatus("");
                  setFilterAgent("");
                  setFilterDateFrom("");
                  setFilterDateTo("");
                }}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors shrink-0"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* List layout */}
          {loading ? (
            <div className="bg-white p-24 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">
                Fetching registry...
              </p>
            </div>
          ) : filteredComplaints.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {filteredComplaints.map((c) => (
                <div
                  key={c._id}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${PRIORITY_STYLES[c.priority || "medium"].split(" ")[0]} ${PRIORITY_STYLES[c.priority || "medium"].split(" ")[1]}`}
                        >
                          {c.priority || "medium"}
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border text-slate-600 bg-slate-50 border-slate-100">
                          {CATEGORY_LABELS[c.category] ||
                            c.category ||
                            "General"}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDelete(c._id)}
                        className="p-1 hover:bg-rose-50 rounded text-rose-500 transition-colors"
                        title="Delete complaint"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <h3 className="font-bold text-slate-800 text-lg mt-2.5">
                      {c.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2.5 leading-relaxed line-clamp-2">
                      {c.description}
                    </p>

                    {/* Customer Profile Block */}
                    <div className="mt-4 text-xs space-y-1">
                      <div className="text-slate-400">CUSTOMER:</div>
                      <div className="font-bold text-slate-700">
                        {c.customer?.name
                          ? c.customer.name.toUpperCase()
                          : "UNKNOWN"}{" "}
                        <span className="font-normal font-mono text-slate-500">
                          ({c.customer?.email || "No email"})
                        </span>
                      </div>
                    </div>

                    {/* Assign section */}
                    <div className="mt-4 pt-3 border-t border-slate-50">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">
                        Support Specialist
                      </div>
                      <select
                        onChange={(e) => handleAssign(c._id, e.target.value)}
                        className="w-full border border-slate-200 p-2.5 rounded-xl text-xs text-slate-700 outline-none transition-colors focus:border-indigo-400 bg-slate-50"
                        value={c.assignedAgent?._id || ""}
                      >
                        <option value="" disabled={!!c.assignedAgent}>
                          {c.assignedAgent
                            ? "Reassign Specialist"
                            : "Unassigned - Click to allocate"}
                        </option>
                        {agents.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.name.toUpperCase()} (
                            {c.assignedAgent?._id === a._id
                              ? "Current"
                              : "Assign"}
                            )
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_STYLES[c.status || "open"]}`}
                    >
                      {c.status}
                    </span>

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
                No registry matches found
              </p>
              <p className="text-xs text-slate-500 max-w-[280px] mx-auto mt-1">
                Expand or relax search criteria to locate matching ticket files.
              </p>
            </div>
          )}
        </div>
      )}

      {currentView === "manage-agents" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Support Desk Staff
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Workloads, customer service performance ratings, and accounts
                registry.
              </p>
            </div>
            <button
              onClick={() => setShowAgentModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              Register Agent
            </button>
          </div>

          {agentWorkloadCompiled.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6 text-center">Active Cases</th>
                    <th className="py-4 px-6 text-center">Resolved Cases</th>
                    <th className="py-4 px-6 text-center">CSAT Average</th>
                    <th className="py-4 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {agentWorkloadCompiled.map((agent) => (
                    <tr
                      key={agent._id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-slate-800 tracking-wide">
                        {agent.name.toUpperCase()}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">
                        {agent.email}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-indigo-600">
                        {agent.activeCount}
                      </td>
                      <td className="py-4 px-6 text-center text-slate-500">
                        {agent.completedCount}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full text-xs mx-auto">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {agent.avgRating}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() =>
                            handleDeleteAgent(agent._id, agent.name)
                          }
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors inline-flex items-center justify-center"
                          title="Remove support agent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
              <Users className="h-12 w-12 text-slate-200" />
              <p className="text-sm font-semibold text-slate-700">
                No support agents configured
              </p>
              <button
                onClick={() => setShowAgentModal(true)}
                className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline font-semibold"
              >
                Click here to add your first support specialist
              </button>
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
                        <h2 className="text-base font-bold text-white max-w-[400px] truncate font-sans">
                          {activeComplaint.title}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
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
                          Registry Metadata
                        </h3>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[activeComplaint.status]}`}
                          >
                            {activeComplaint.status}
                          </span>

                          {/* Admin Status Changer */}
                          <select
                            value={activeComplaint.status}
                            onChange={(e) =>
                              updateStatus(activeComplaint._id, e.target.value)
                            }
                            className="border border-slate-200 text-xs p-1.5 rounded-lg outline-none bg-white font-medium"
                          >
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="escalated">Escalated</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
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
                          <p className="font-bold text-slate-700 mt-1">
                            {activeComplaint.customer?.name
                              ? activeComplaint.customer.name.toUpperCase()
                              : "UNKNOWN"}{" "}
                            ({activeComplaint.customer?.email})
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-400">
                            ALLOCATED SPECIALIST
                          </p>
                          <select
                            onChange={(e) =>
                              handleAssign(activeComplaint._id, e.target.value)
                            }
                            className="border border-slate-200 mt-1 p-1 w-full rounded outline-none text-xs bg-white font-semibold"
                            value={activeComplaint.assignedAgent?._id || ""}
                          >
                            <option value="" disabled>
                              Assign agent
                            </option>
                            {agents.map((a) => (
                              <option key={a._id} value={a._id}>
                                {a.name.toUpperCase()}
                              </option>
                            ))}
                          </select>
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
                          <span>CSAT Feedback Score</span>
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
                          Discussion Thread (Supervisor Mode)
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
                            const isMe = m.senderRole === "admin";
                            const roleLabel =
                              m.senderRole === "customer"
                                ? "Customer"
                                : m.senderRole === "agent"
                                  ? "Specialist"
                                  : "You (Admin)";
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
                                      : m.senderRole === "agent"
                                        ? "bg-amber-50 text-amber-900 border border-amber-100 rounded-tl-none font-medium"
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
                            No messages yet. Send a note below to join the
                            discussion.
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
                            : "Message thread as Administrator..."
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

      {/* Add Agent Modal */}
      {showAgentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
          onClick={() => setShowAgentModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white border border-slate-100 shadow-2xl p-6 md:p-8"
          >
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-800">
                Register Support Agent
              </h2>
              <button
                onClick={() => setShowAgentModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Create login credentials for a new support specialist. They will
              immediately appear in allocation lists.
            </p>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  className="border border-slate-200 p-3 w-full rounded-xl text-sm text-slate-850 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Agent's full name"
                  value={agentForm.name}
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  className="border border-slate-200 p-3 w-full rounded-xl text-sm text-slate-850 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="agent@company.com"
                  value={agentForm.email}
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Login Password
                </label>
                <input
                  type="text"
                  className="border border-slate-200 p-3 w-full rounded-xl text-sm text-slate-850 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 font-mono text-xs"
                  placeholder="Enter temporary password for the agent"
                  value={agentForm.password}
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, password: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAgentModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-750 text-sm font-semibold px-4 py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAgent}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-md transition-all flex items-center justify-center"
                >
                  {creatingAgent ? "Registering..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
