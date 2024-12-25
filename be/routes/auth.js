// routes/auth.js
const express = require("express");
const {
  signup,
  login,
  logout,
  changePassword,
  getKhoaStatus,
  updateKhoaStatus,
  logUnlockHistory,
  getCuaStatus,
  updateCuaStatus,
  logCloseHistory,
  resetPassword,
  sendPasswordResetEmail,
} = require("../Controller/auth");
const router = express.Router();
const middlewareController = require("../Controller/middleWare");
const { sendEmailVerification } = require("firebase/auth");

router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", middlewareController.verifyToken, logout);

router.post(
  "/changepassword",
  middlewareController.verifyToken,
  changePassword
);

router.post("/resetpassword", sendPasswordResetEmail);

router.get("/khoa", middlewareController.verifyToken, getKhoaStatus);

router.post("/khoa", middlewareController.verifyToken, updateKhoaStatus);

router.post("/khoahistory", middlewareController.verifyToken, logUnlockHistory);

router.get("/cua", middlewareController.verifyToken, getCuaStatus);

module.exports = router;
