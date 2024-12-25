// routes/auth.js
const express = require("express");
const router = express.Router();
const middlewareController = require("../Controller/middleWare");
const adminController = require("../Controller/admin");

router.get(
  "/allusers",
  middlewareController.verifyTokenAndAdminAuth,
  adminController.getAllUsers
);

router.get(
  "/getunlockhistory",
  middlewareController.verifyTokenAndAdminAuth,
  adminController.getUnlockHistory
);

router.put(
  "/updateusers",
  middlewareController.verifyTokenAndAdminAuth,
  adminController.updateUsers
);

router.delete(
  "/deleteUser",
  middlewareController.verifyTokenAndAdminAuth,
  adminController.deleteUser
);

router.get(
  "/image",
  middlewareController.verifyTokenAndAdminAuth,
  adminController.getFailedAttemptsImages
);

router.get(
  "/closetime",
  middlewareController.verifyTokenAndAdminAuth,
  adminController.getCloseHistory
);

router.get(
  "/allhistory",
  middlewareController.verifyTokenAndAdminAuth,
  adminController.getAllHistory
);

router.post(
  "/postfingerhistory",
  middlewareController.verifyTokenAndAdminAuth,
  adminController.listenIdMoKhoaChanges
);

router.get(
  "/fingerhistory",
  middlewareController.verifyTokenAndAdminAuth,
  adminController.getFingerHistory
);

router.post(
  "/imagewarning",
  middlewareController.verifyTokenAndAdminAuth,
  adminController.listenImages
);

router.post(
  "/updateClosetime",
  middlewareController.verifyTokenAndAdminAuth,
  adminController.listenUpdateClosetime
);

router.post(
  "/sendmailcua",
  middlewareController.verifyTokenAndAdminAuth,
  adminController.listenCuaSendMail
);

module.exports = router;
