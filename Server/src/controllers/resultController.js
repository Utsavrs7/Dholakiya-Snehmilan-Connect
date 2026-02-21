const Result = require("../models/Result");
const path = require("path");
const { createWorker } = require('tesseract.js');

const normalizeGujaratiSurname = (value = "") =>
  String(value).replaceAll("ધોળકયા", "ધોળકિયા");
 
// Normalize status to lowercase and validate
const normalizeStatus = (status) => {
  const val = String(status || "").toLowerCase();
  const allowed = ["pending", "reviewed", "accepted", "rejected"];
  return allowed.includes(val) ? val : null;
};

const TRACK_STEPS = ["submitted", "pending", "reviewed", "accepted", "rejected"];

const buildResultTimeline = (resultDoc) => {
  const result = resultDoc?.toObject ? resultDoc.toObject() : resultDoc;
  const history = Array.isArray(result?.status_history) ? result.status_history : [];
  const stepMap = {};
  history.forEach((entry) => {
    const key = String(entry?.status || "").toLowerCase();
    if (!TRACK_STEPS.includes(key) || stepMap[key]) return;
    stepMap[key] = {
      changedAt: entry.changedAt || null,
      note: entry.note || "",
    };
  });

  const currentStatus = String(result?.status || "pending").toLowerCase();
  const visibleSteps = currentStatus === "rejected"
    ? ["submitted", "pending", "reviewed", "rejected"]
    : ["submitted", "pending", "reviewed", "accepted"];
  const currentStep = currentStatus === "rejected" ? "rejected" : currentStatus;
  const activeIndex = Math.max(0, visibleSteps.indexOf(currentStep));

  return {
    resultId: result?._id,
    full_name: result?.full_name || "",
    standard: result?.standard || "",
    status: currentStatus,
    reject_note: result?.reject_note || "",
    submitted_by_role: result?.submitted_by_role || "user",
    submitted_by_name: result?.submitted_by_name || "",
    createdAt: result?.createdAt || null,
    updatedAt: result?.updatedAt || null,
    steps: visibleSteps.map((step, index) => ({
      status: step,
      completed: index <= activeIndex,
      active: index === activeIndex,
      changedAt: stepMap[step]?.changedAt || (step === "submitted" ? result?.createdAt : null),
      note: step === "rejected" ? (result?.reject_note || stepMap[step]?.note || "") : (stepMap[step]?.note || ""),
    })),
  };
};

// Extract data from photo using OCR
const extractDataFromPhoto = async (req, res, next) => {
  try {
    const photo = req.file;
    if (!photo) return res.status(400).json({ message: "Photo required" });

    const photoPath = path.join(__dirname, "../../uploads", photo.filename);
    const worker = createWorker();
    await worker.load();
    await worker.loadLanguage('eng');
    const { data: { text } } = await worker.recognize(photoPath);
    await worker.terminate();

    // Simple regex to extract name, standard, percentage/grade
    const nameMatch = text.match(/Name[:\s]*([A-Za-z\s]+)/i);
    const stdMatch = text.match(/Standard[:\s]*([A-Za-z0-9\s]+)/i);
    const percMatch = text.match(/Percentage[:\s]*(\d+\.?\d*)/i);
    const gradeMatch = text.match(/Grade[:\s]*([A-F][+-]?)/i);

    const extracted = {
      name: nameMatch ? nameMatch[1].trim() : null,
      standard: stdMatch ? stdMatch[1].trim() : null,
      percentage: percMatch ? parseFloat(percMatch[1]) : null,
      grade: gradeMatch ? gradeMatch[1].trim() : null,
    };

    res.json(extracted);
  } catch (err) {
    next(err);
  }
};

// Helper function to extract percentage from image using OCR
const extractPercentageFromImage = async (imagePath) => {
  try {
    const worker = createWorker();
    await worker.load();
    await worker.loadLanguage('eng');
    const { data: { text } } = await worker.recognize(imagePath);
    await worker.terminate();

    // Extract the first number that looks like a percentage (e.g., 87.5 or 88)
    const match = text.match(/\b\d{1,3}(\.\d{1,2})?\b/);
    return match ? parseFloat(match[0]) : null;
  } catch (error) {
    console.error('OCR Error:', error);
    return null;
  }
};

// Submit result (user must be logged in)
const submitResult = async (req, res, next) => {
  try {
    const submitterRole = String(req.user?.role || "user").toLowerCase();
    const isAdminSubmitter = submitterRole === "super_admin" || submitterRole === "village_admin";

    if (!isAdminSubmitter && req.user?.accountStatus !== "active") {
      return res.status(403).json({
        message:
          req.user?.accountStatus === "rejected"
            ? "Your account request was rejected. Contact admin."
            : "Your account is pending admin approval. Result submission is disabled.",
      });
    }

    let {
      full_name,
      mobile,
      email,
      standard,
      semester,
      percentage,
      medium,
      village,
      result_details,
    } = req.body;

    if (submitterRole === "village_admin" && req.user?.village) {
      village = req.user.village;
    }

    // Photo file comes from multer and is stored in uploads
    const photo = req.file ? `/uploads/${req.file.filename}` : "";

    if (!full_name || !mobile || !email || !standard || !percentage || !medium || !village || !photo) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const created = await Result.create({
      full_name: normalizeGujaratiSurname(full_name),
      mobile,
      email,
      standard,
      semester: semester || "",
      percentage,
      medium,
      village,
      result_details: result_details || "",
      photo,
      status: "pending",
      status_history: [
        { status: "submitted", changedAt: new Date(), note: "" },
        { status: "pending", changedAt: new Date(), note: "" },
      ],
      submittedBy: req.user?.id,
      submitted_by_role: submitterRole,
      submitted_by_name: req.user?.name || "",
    });

    res.status(201).json({ message: "Result submitted", resultId: created._id });
  } catch (err) {
    next(err);
  }
};
// Get my submitted results (optional helper)
const getMyResults = async (req, res, next) => {
  try {
    const data = await Result.find({ submittedBy: req.user.id }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const getMyResultTracking = async (req, res, next) => {
  try {
    const result = await Result.findOne({
      _id: req.params.id,
      submittedBy: req.user.id,
    });
    if (!result) return res.status(404).json({ message: "Result not found" });
    return res.json(buildResultTimeline(result));
  } catch (err) {
    next(err);
  }
};

// Admin: get results based on role (super_admin sees all, village_admin sees own village)
const getAdminResults = async (req, res, next) => {
  try {
    const isSuper = req.user?.role === "super_admin";
    // Village admin must have a village assigned
    if (!isSuper && !req.user?.village) {
      return res.status(403).json({ message: "Village not assigned" });
    }
    const filter = isSuper ? {} : { village: req.user?.village };
    const data = await Result.find(filter).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Super admin summary: counts per village
const getAdminSummary = async (req, res, next) => {
  try {
    const summary = await Result.aggregate([
      {
        $group: {
          _id: { village: "$village", status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]);

    const byVillage = {};
    summary.forEach((row) => {
      const village = row._id.village || "Unknown";
      const status = row._id.status || "pending";
      if (!byVillage[village]) {
        byVillage[village] = { village, total: 0, pending: 0, accepted: 0, rejected: 0 };
      }
      byVillage[village][status] = row.count;
      byVillage[village].total += row.count;
    });

    res.json(Object.values(byVillage));
  } catch (err) {
    next(err);
  }
};

// Admin: get a single result with village guard
const getAdminResultById = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ message: "Result not found" });

    const isSuper = req.user?.role === "super_admin";
    // Village admin must have a village assigned
    if (!isSuper && !req.user?.village) {
      return res.status(403).json({ message: "Village not assigned" });
    }
    if (!isSuper && result.village !== req.user?.village) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Admin: update result (status + basic fields) with village guard
const updateAdminResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ message: "Result not found" });

    const isSuper = req.user?.role === "super_admin";
    // Village admin must have a village assigned
    if (!isSuper && !req.user?.village) {
      return res.status(403).json({ message: "Village not assigned" });
    }
    if (!isSuper && result.village !== req.user?.village) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Only allow safe fields to be updated
    const allowedFields = [
      "full_name",
      "mobile",
      "email",
      "standard",
      "semester",
      "percentage",
      "medium",
      "result_details",
      "status",
      "reject_note",
    ];

    // Super admin can also change village if needed
    if (isSuper) allowedFields.push("village");

    const previousStatus = String(result.status || "pending").toLowerCase();
    let nextStatus = previousStatus;
    let payloadRejectNote;
    if (req.body.reject_note !== undefined) {
      payloadRejectNote = String(req.body.reject_note || "").trim();
    }

    // Apply updates
    for (const key of allowedFields) {
      if (key === "status" && req.body.status !== undefined) {
        const normalized = normalizeStatus(req.body.status);
        if (!normalized) return res.status(400).json({ message: "Invalid status" });
        result.status = normalized;
        nextStatus = normalized;
        if (normalized !== "rejected" && req.body.reject_note === undefined) {
          result.reject_note = "";
        }
        continue;
      }
      if (req.body[key] !== undefined) {
        result[key] = key === "full_name"
          ? normalizeGujaratiSurname(req.body[key])
          : key === "reject_note"
          ? String(req.body[key] || "").trim()
          : req.body[key];
      }
    }

    if (nextStatus !== previousStatus) {
      if (!Array.isArray(result.status_history)) result.status_history = [];
      result.status_history.push({
        status: nextStatus,
        changedAt: new Date(),
        note: nextStatus === "rejected" ? String(result.reject_note || "") : "",
      });
    } else if (
      nextStatus === "rejected" &&
      payloadRejectNote !== undefined &&
      Array.isArray(result.status_history)
    ) {
      for (let i = result.status_history.length - 1; i >= 0; i -= 1) {
        if (result.status_history[i].status === "rejected") {
          result.status_history[i].note = payloadRejectNote;
          break;
        }
      }
    }

    const saved = await result.save();
    res.json(saved);
  } catch (err) {
    next(err);
  }
};

// Super admin: list results by village with filters and pagination
const getAdminResultsList = async (req, res, next) => {
  try {
    const {
      village,
      status,
      search,
      standard,
      medium,
      page = 1,
      limit = 10,
    } = req.query;

    // Build filters
    const filter = {};
    if (village) filter.village = village;
    if (status && status !== "all") filter.status = status;
    if (standard) filter.standard = new RegExp(standard, "i");
    if (medium) filter.medium = new RegExp(medium, "i");
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { full_name: regex },
        { mobile: regex },
        { email: regex },
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Result.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Result.countDocuments(filter),
    ]);

    res.json({ data, total, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitResult,
  getMyResults,
  getMyResultTracking,
  getAdminResults,
  getAdminResultById,
  updateAdminResult,
  getAdminSummary,
  getAdminResultsList,
  extractDataFromPhoto,
};
