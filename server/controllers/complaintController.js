const Complaint = require("../models/Complaint");
const User = require("../models/User");

// ================= CREATE =================
const createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const complaint = await Complaint.create({
      customer: req.user._id,
      title,
      description,
      category,
      priority,
    });

    res.status(201).json({
      success: true,
      message: "Complaint submitted",
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET ALL =================
const getComplaints = async (req, res, next) => {
  try {
    let filter = {};

    // Role-based filtering
    if (req.user.role === "customer") {
      filter.customer = req.user._id;
    } else if (req.user.role === "agent") {
      filter.assignedAgent = req.user._id;
    }

    // Search by title or description (works for all roles)
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Filter by status (works for all roles)
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filter by category (works for all roles)
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Filter by priority (works for all roles)
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    // Filter by agent (admin only)
    if (req.query.agent && req.user.role === "admin") {
      filter.assignedAgent = req.query.agent;
    }

    // Date range filtering (works for all roles)
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) {
        filter.createdAt.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        // Add 1 day to include the entire end date
        const endDate = new Date(req.query.dateTo);
        endDate.setDate(endDate.getDate() + 1);
        filter.createdAt.$lt = endDate;
      }
    }

    const complaints = await Complaint.find(filter)
      .populate("customer", "name email")
      .populate("assignedAgent", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET ONE =================
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("assignedAgent", "name email");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const isOwner =
      complaint.customer._id.toString() === req.user._id.toString();
    const isAgent =
      complaint.assignedAgent &&
      complaint.assignedAgent._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAgent && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// ================= UPDATE =================
const updateComplaint = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (complaint.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (complaint.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit after processing started",
      });
    }

    complaint.title = title || complaint.title;
    complaint.description = description || complaint.description;

    await complaint.save();

    res.status(200).json({
      success: true,
      message: "Complaint updated",
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// ================= ASSIGN =================
const assignComplaint = async (req, res, next) => {
  try {
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: "agentId is required",
      });
    }

    // Validate that the target user exists and is actually an agent.
    // Without this check, a bad/mistyped ID saves silently and the
    // agent's getComplaints filter returns nothing — the complaint
    // disappears from all views.
    const agent = await User.findById(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (agent.role !== "agent") {
      return res.status(400).json({
        success: false,
        message: "Target user is not an agent",
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    complaint.assignedAgent = agent._id;
    complaint.status = "in-progress";

    await complaint.save();

    const populated = await complaint.populate("assignedAgent", "name email");

    res.status(200).json({
      success: true,
      message: "Assigned successfully",
      complaint: populated,
    });
  } catch (err) {
    next(err);
  }
};

// ================= STATUS =================
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const allowed = ["open", "in-progress", "escalated", "resolved", "closed"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const updateData = { status };
    if (status === "resolved") updateData.resolvedAt = new Date();

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated",
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// ================= FEEDBACK =================
const submitFeedback = async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (complaint.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    complaint.rating = rating;
    complaint.feedback = feedback;

    await complaint.save();

    res.status(200).json({
      success: true,
      message: "Feedback submitted",
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// ================= DELETE =================
const deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const isOwner =
      complaint.customer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    await complaint.deleteOne();

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  assignComplaint,
  updateComplaintStatus,
  submitFeedback,
  deleteComplaint,
};