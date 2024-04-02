const express = require("express");
const router = express.Router();
const path = require("path");
const { deleteToken } = require("./delete_token");
const { checkExp } = require("./check_exp");
const { checkRole } = require("./check_role");

// Route for deleting a token
router.post("/delete_token", deleteToken);

// Route for checking a token
router.post("/check_exp", checkExp);

// Route for checking a role
router.post("/check_role", checkRole);

// Route for serving store_result.html
router.get("/store_result.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "store_result.html"));
});

// Route for serving admin_store_result.html
router.get("/admin_store_result.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin_store_result.html"));
});

module.exports = router;
