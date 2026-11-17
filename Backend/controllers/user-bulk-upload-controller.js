const bcrypt = require("bcryptjs");
const User = require("../models").User;
const Role = require("../models").Role;
const { errorHandler } = require("../helpers/error-handler");
const logger = require("../utils/logger");
const Op = require("sequelize").Op;
const multer = require("multer");
const XLSX = require("xlsx");

// ── Multer config (memory storage — we parse in memory, no disk write) ────────
const upload = multer({ storage: multer.memoryStorage() });

// Known legacy department values (same list used by the single-add form)
const KNOWN_DEPTS = ["CSD", "Calibration", "Accounts", "Client", "Manager", "admin"];

// Derive legacy department from role name — mirrors handleRoleChange in UserForm.jsx
const deriveDepartment = (roleName) => {
  if (KNOWN_DEPTS.includes(roleName)) return roleName;
  if (roleName.toLowerCase().includes("admin") || roleName.toLowerCase().includes("root")) return "Manager";
  return roleName; // use custom role name as department (same as the single-add form)
};

/**
 * POST /api/users/bulk-upload
 * Body (multipart): file (xlsx/xls), labId
 * Expects columns: Name, Email, Password, Department, Title, Role Name
 *  - Department must be one of the VALID_DEPARTMENTS
 *  - Role Name must match an existing role for the lab
 * Returns: { created: [], failed: [] }
 */
const bulkUploadUsers = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const path = "/api/users/bulk-upload";
  const userId = req.userId;

  if (!req.file) {
    return res.status(400).json({ status: "FAILURE", code: 400, message: "No file uploaded." });
  }

  const labId = parseInt(req.body.labId, 10);
  if (!labId) {
    return res.status(400).json({ status: "FAILURE", code: 400, message: "labId is required." });
  }

  // ── Parse workbook ───────────────────────────────────────────────────────────
  let rows;
  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch (err) {
    return res.status(400).json({ status: "FAILURE", code: 400, message: "Invalid Excel file." });
  }

  if (!rows || rows.length === 0) {
    return res.status(400).json({ status: "FAILURE", code: 400, message: "Excel file is empty." });
  }

  // ── Fetch all roles for this lab (for lookup) ────────────────────────────────
  let rolesMap = {};
  try {
    const roles = await Role.findAll({ where: { lab_id: labId } });
    roles.forEach((r) => {
      rolesMap[r.name.trim().toLowerCase()] = r.id;
    });
  } catch (err) {
    return res.status(500).json({ status: "FAILURE", code: 500, message: "Failed to fetch roles." });
  }

  const created = [];
  const failed = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Row 1 is header

    const name = (row["Name"] || "").toString().trim();
    const email = (row["Email"] || "").toString().trim().toLowerCase();
    const password = (row["Password"] || "").toString().trim();
    const rbacRole = (row["RBAC Role"] || "").toString().trim();
    const title = (row["Title"] || "").toString().trim();

    // ── Per-row validation ───────────────────────────────────────────────────
    const rowErrors = [];

    if (!name) rowErrors.push("Name is required");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) rowErrors.push("Valid Email is required");
    if (!password || password.length < 6) rowErrors.push("Password must be at least 6 characters");
    if (!title) rowErrors.push("Title is required");
    if (!rbacRole) rowErrors.push("RBAC Role is required");

    const roleId = rolesMap[rbacRole.toLowerCase()];
    if (rbacRole && !roleId) {
      rowErrors.push(`Role "${rbacRole}" not found for this lab`);
    }

    if (rowErrors.length > 0) {
      failed.push({ row: rowNum, email: email || "(empty)", errors: rowErrors });
      continue;
    }

    // ── Check duplicate email ───────────────────────────────────────────────
    try {
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        failed.push({ row: rowNum, email, errors: ["Email already exists"] });
        continue;
      }
    } catch (err) {
      failed.push({ row: rowNum, email, errors: ["DB error checking duplicate email"] });
      continue;
    }

    // ── Hash password & create user ─────────────────────────────────────────
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const calibmaster_client_id = new Date().getTime() + i;
      const department = deriveDepartment(rbacRole);

      await User.create({
        name,
        email,
        password: hashedPassword,
        department,
        title,
        roleId,
        labId,
        rstatus: 1,
        calibmaster_client_id,
      });

      created.push({ row: rowNum, email, name });
    } catch (err) {
      console.error("[bulkUpload] create error:", err);
      failed.push({ row: rowNum, email, errors: ["Failed to create user: " + err.message] });
    }
  }

  logger.info(`${ip} ${userId} - Bulk upload: ${created.length} created, ${failed.length} failed`);

  return res.status(200).json({
    status: "SUCCESS",
    code: 200,
    data: { created, failed },
    message: `Bulk upload complete. ${created.length} created, ${failed.length} failed.`,
  });
};

module.exports = { bulkUploadUsers, upload };
