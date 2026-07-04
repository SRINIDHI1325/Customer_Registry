import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { useToast } from "../context/ToastContext";
import {
  Plus,
  Pencil,
  Trash2,
  Inbox,
  MessageSquare,
  Star,
  Search,
  Filter,
  AlertCircle,
  Clock,
  BookOpen,
  User,
  RefreshCw,
  X,
  Send,
  Eye,
  CheckCircle,
  HelpCircle,
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

const Customer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "overview";

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "product",
    priority: "medium",
  });
  const [editingId, setEditingId] = useState(null);

  // Filters state
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

  // Rating form state
  const [ratingVal, setRatingVal] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

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
      if (Array.isArray(data)) setComplaints(data);
      else if (Array.isArray(data.complaints)) setComplaints(data.complaints);
      else setComplaints([]);
    } catch (err) {
      console.error(err);
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

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!activeComplaint) return;

    setSubmittingFeedback(true);
    try {
      const { data } = await API.put(
        `/complaints/${activeComplaint._id}/feedback`,
        {
          rating: ratingVal,
          feedback: feedbackText,
        },
      );

      if (data.success) {
        showToast("Feedback submitted successfully. Thank you!", "success");
        // Update local status
        setActiveComplaint(data.complaint);
        setComplaints((prev) =>
          prev.map((c) => (c._id === data.complaint._id ? data.complaint : c)),
        );
        setFeedbackText("");
      }
    } catch (err) {
      showToast("Failed to submit feedback", "error");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.description) {
      return showToast("Title and Description are required", "warning");
    }

    try {
      if (editingId) {
        await API.put(`/complaints/${editingId}`, form);
        showToast("Complaint updated successfully", "success");
      } else {
        await API.post("/complaints", form);
        showToast("Complaint submitted successfully", "success");
      }

      setForm({
        title: "",
        description: "",
        category: "product",
        priority: "medium",
      });
      setEditingId(null);
      fetchComplaints();
      setSearchParams({ view: "my-complaints" }); // redirect to my complaints list
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint?"))
      return;

    try {
      await API.delete(`/complaints/${id}`);
      showToast("Complaint deleted successfully", "info");
      fetchComplaints();
    } catch (err) {
      showToast("Failed to delete complaint", "error");
    }
  };

  const handleEdit = (c) => {
    setForm({
      title: c.title,
      description: c.description,
      category: c.category || "product",
      priority: c.priority || "medium",
    });
    setEditingId(c._id);
    setSearchParams({ view: "raise-complaint" });
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

  // Stats calculators
  const totalCount = complaints.length;
  const openCount = complaints.filter((c) => c.status === "open").length;
  const inProgressCount = complaints.filter(
    (c) => c.status === "in-progress",
  ).length;
  const escalatedCount = complaints.filter(
    (c) => c.status === "escalated",
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === "resolved" || c.status === "closed",
  ).length;

  // Filter complaints list
  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory
      ? c.category === filterCategory
      : true;
    const matchesPriority = filterPriority
      ? c.priority === filterPriority
      : true;
    const matchesStatus = filterStatus ? c.status === filterStatus : true;

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── TOP HEADER ── */}
      <div className="bg-gradient-to-r from-indigo-800 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-600/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-indigo-200 text-xs font-semibold uppercase tracking-wider bg-indigo-900/40 px-3 py-1 rounded-full border border-indigo-500/20">
              Customer Center
            </span>
            <h1 className="text-2xl md:text-3xl font-bold mt-2.5">
              How can we help you today?
            </h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-xl">
              File a complaint, communicate in real-time with support
              specialists, and track resolutions.
            </p>
          </div>
          <button
            onClick={() => setSearchParams({ view: "raise-complaint" })}
            className="self-start md:self-auto bg-white text-indigo-700 hover:bg-indigo-50 hover:shadow-lg hover:scale-102 font-semibold text-sm px-5 py-3 rounded-2xl flex items-center gap-2 transition-all"
          >
            <Plus className="h-4.5 w-4.5" />
            Raise New Complaint
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
                label: "Total Claims",
                count: totalCount,
                color: "text-slate-700 bg-white",
              },
              {
                label: "Open",
                count: openCount,
                color: "text-rose-600 bg-white",
              },
              {
                label: "In Progress",
                count: inProgressCount,
                color: "text-amber-600 bg-white",
              },
              {
                label: "Escalated",
                count: escalatedCount,
                color: "text-red-600 bg-white",
              },
              {
                label: "Resolved",
                count: resolvedCount,
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
            {/* Quick Actions & FAQ */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-slate-800 font-semibold text-base border-b pb-3">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  <h3>Support Guide</h3>
                </div>
                <div className="space-y-3.5 text-sm text-slate-600">
                  <div className="flex gap-3">
                    <span className="h-5 w-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </span>
                    <p>
                      Describe your issue clearly. Select the correct category
                      and urgency level.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="h-5 w-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      Track progress from the "My Complaints" tab. Look out for
                      the status changing to "In Progress".
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="h-5 w-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      3
                    </span>
                    <p>
                      Use the Chat Drawer to correspond with your assigned
                      support specialist.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center gap-3 text-slate-800 font-semibold text-base border-b pb-3">
                  <HelpCircle className="h-5 w-5 text-indigo-600" />
                  <h3>Working Hours</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Our specialists are active{" "}
                  <strong>Monday - Friday, 9:00 AM to 6:00 PM</strong>.
                  Urgent/escalated tickets will be addressed outside standard
                  hours.
                </p>
              </div>
            </div>

            {/* Recent Complaints */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-slate-800 font-bold text-lg">
                  Recent Complaints
                </h2>
                <button
                  onClick={() => setSearchParams({ view: "my-complaints" })}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold flex items-center gap-1"
                >
                  View All ({totalCount})
                </button>
              </div>

              {loading ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="h-8 w-8 text-slate-400 animate-spin" />
                  <p className="text-sm text-slate-500">
                    Loading your complaints...
                  </p>
                </div>
              ) : complaints.length > 0 ? (
                <div className="space-y-4">
                  {complaints.slice(0, 3).map((c) => (
                    <div
                      key={c._id}
                      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${PRIORITY_STYLES[c.priority || "medium"].split(" ")[0]} ${PRIORITY_STYLES[c.priority || "medium"].split(" ")[1]}`}
                          >
                            {c.priority || "medium"}
                          </span>
                          <h3 className="font-bold text-slate-800 text-base mt-2">
                            {c.title}
                          </h3>
                          <span className="text-xs text-slate-400 block mt-1">
                            Category:{" "}
                            {CATEGORY_LABELS[c.category] ||
                              c.category ||
                              "General"}
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
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                        <button
                          onClick={() => openDrawer(c)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline font-semibold flex items-center gap-1.5"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Chat & Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center flex flex-col items-center justify-center gap-3">
                  <Inbox
                    className="h-10 w-10 text-slate-300"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm font-semibold text-slate-700">
                    No complaints registered yet
                  </p>
                  <p className="text-xs text-slate-500 max-w-[240px] mx-auto">
                    Click "Raise New Complaint" above to submit your first
                    service ticket.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentView === "my-complaints" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search complaints by title, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm outline-none transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 shrink-0">
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

          {/* List layout */}
          {loading ? (
            <div className="bg-white p-24 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">
                Fetching complaints list...
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
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2">
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

                    {/* Agent Status Block */}
                    {c.assignedAgent && (
                      <div className="mt-4 flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/50 p-2.5 rounded-xl">
                        <User className="h-4 w-4 text-indigo-600 shrink-0" />
                        <span className="text-xs text-indigo-800 font-semibold tracking-wide">
                          SPECIALIST: {c.assignedAgent.name.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_STYLES[c.status || "open"]}`}
                      >
                        {c.status}
                      </span>
                      {c.rating && (
                        <div className="flex items-center gap-0.5 bg-yellow-50 border border-yellow-100 px-2 py-0.5 rounded-full text-yellow-700 text-xs font-medium">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {c.rating} Star
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {c.status === "open" && (
                        <>
                          <button
                            onClick={() => handleEdit(c)}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-100 transition-colors flex items-center gap-1"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c._id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-2 rounded-xl text-xs font-semibold border border-rose-100 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => openDrawer(c)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Open Chat & Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-24 text-center flex flex-col items-center justify-center gap-3">
              <Inbox className="h-12 w-12 text-slate-300" strokeWidth={1.5} />
              <p className="text-base font-bold text-slate-700">
                No matching complaints found
              </p>
              <p className="text-xs text-slate-500 max-w-[280px] mx-auto mt-1">
                Try loosening your filters or search term to discover your
                tickets, or raise a new complaint.
              </p>
            </div>
          )}
        </div>
      )}

      {currentView === "raise-complaint" && (
        <div className="max-w-xl mx-auto bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-md">
          <div className="border-b pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              {editingId
                ? "Edit Complaint Details"
                : "Register a Support Complaint"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Provide necessary details and our customer care team will start
              analyzing it immediately.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Complaint Title
              </label>
              <input
                className="border border-slate-200 p-3 w-full rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="Brief summary of the issue (e.g. Billing error in invoice #301)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="border border-slate-200 p-3 w-full rounded-xl text-sm text-slate-800 outline-none bg-white transition-all focus:border-indigo-400"
                >
                  <option value="product">Product Issue</option>
                  <option value="service">Service Inquiry</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="technical">Technical Support</option>
                  <option value="other">General Enquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Priority Urgency
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                  className="border border-slate-200 p-3 w-full rounded-xl text-sm text-slate-800 outline-none bg-white transition-all focus:border-indigo-400"
                >
                  <option value="low">Low (General question)</option>
                  <option value="medium">Medium (Standard request)</option>
                  <option value="high">High (Service blocking issue)</option>
                  <option value="urgent">
                    Urgent (Immediate action needed)
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Detailed Description
              </label>
              <textarea
                rows={5}
                className="border border-slate-200 p-3 w-full rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                placeholder="Describe your concern. Include as much contextual information, error messages, and timelines as possible to help us solve it quickly."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3 pt-3">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      title: "",
                      description: "",
                      category: "product",
                      priority: "medium",
                    });
                    setSearchParams({ view: "my-complaints" });
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {editingId ? "Update Complaint" : "Submit Complaint"}
              </button>
            </div>
          </form>
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
                          Complaint Profile
                        </h3>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[activeComplaint.status]}`}
                        >
                          {activeComplaint.status}
                        </span>
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
                            ASSIGNED SPECIALIST
                          </p>
                          <p className="font-bold text-slate-700 mt-1">
                            {activeComplaint.assignedAgent?.name
                              ? activeComplaint.assignedAgent.name.toUpperCase()
                              : "ASSIGNING..."}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-400">
                            SUBMITTED ON
                          </p>
                          <p className="font-bold text-slate-700 mt-1 font-mono">
                            {activeComplaint.createdAt
                              ? new Date(
                                  activeComplaint.createdAt,
                                ).toLocaleString()
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase">
                          Description
                        </p>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-slate-150 shadow-inner-sm">
                          {activeComplaint.description}
                        </p>
                      </div>
                    </div>

                    {/* Feedback Rating Block (if resolved/closed) */}
                    {(activeComplaint.status === "resolved" ||
                      activeComplaint.status === "closed") && (
                      <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 space-y-4">
                        <div className="flex items-center gap-2 text-emerald-800">
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                          <h3 className="font-bold text-sm">
                            Complaint Resolution Feedback
                          </h3>
                        </div>

                        {activeComplaint.rating ? (
                          <div className="bg-white p-4 rounded-xl border border-emerald-100/50 text-slate-700 space-y-2 text-sm shadow-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-500">
                                Your Rating:
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[...Array(activeComplaint.rating)].map(
                                  (_, i) => (
                                    <Star
                                      key={i}
                                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                    />
                                  ),
                                )}
                              </div>
                            </div>
                            {activeComplaint.feedback && (
                              <p className="text-slate-600 mt-1 italic">
                                "{activeComplaint.feedback}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <form
                            onSubmit={handleFeedbackSubmit}
                            className="space-y-4"
                          >
                            <p className="text-xs text-emerald-700">
                              This complaint is resolved. Please take a second
                              to rate your experience with our specialist.
                            </p>

                            <div>
                              <label className="block text-xs font-semibold text-emerald-800 mb-1.5">
                                Star Rating
                              </label>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    type="button"
                                    key={star}
                                    onClick={() => setRatingVal(star)}
                                    className="p-1 hover:scale-110 transition-transform"
                                  >
                                    <Star
                                      className={`h-6 w-6 ${
                                        star <= ratingVal
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-slate-300"
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-emerald-800 mb-1.5">
                                Additional Comments
                              </label>
                              <textarea
                                rows={2}
                                value={feedbackText}
                                onChange={(e) =>
                                  setFeedbackText(e.target.value)
                                }
                                placeholder="How did we do? Any comments on our service..."
                                className="w-full text-sm p-3 border border-emerald-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-100 bg-white"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={submittingFeedback}
                              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20"
                            >
                              {submittingFeedback
                                ? "Submitting..."
                                : "Submit Review"}
                            </button>
                          </form>
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
                            const isMe = m.senderRole === "customer";
                            const roleLabel =
                              m.senderRole === "admin"
                                ? "Admin"
                                : m.senderRole === "agent"
                                  ? "Specialist"
                                  : "You";
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
                            : "Write a message to support..."
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

export default Customer;
