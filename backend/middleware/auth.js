const jwt = require("jsonwebtoken");

const authRequired = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || "dev_secret",
    );
    req.user = payload; // { sub, role, isVendorApproved, name }
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };

const requireApprovedVendor = (req, res, next) => {
  if (req.user.role !== "vendor")
    return res.status(403).json({ error: "Forbidden" });
  if (!req.user.isVendorApproved)
    return res.status(403).json({ error: "Vendor not approved yet" });
  next();
};

module.exports = { authRequired, requireRole, requireApprovedVendor };
