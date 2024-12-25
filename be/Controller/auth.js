// auth.js
const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAcount.json");
const firebaseclient = require("../config/firebaseclient.json");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { initializeApp } = require("firebase/app");
const nodemailer = require("nodemailer");
require("dotenv").config({ path: "./.env" });

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://testlocal-6f7bf-default-rtdb.asia-southeast1.firebasedatabase.app/",
});
const firebaseDb = admin.database();
const db = admin.firestore();
const firebaseApp = initializeApp(firebaseclient);

const auth = getAuth(firebaseApp);

// Hàm đăng ký
const signup = async (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
    userName: req.body.username,
  };

  try {
    const userResponse = await admin.auth().createUser({
      email: user.email,
      password: user.password,
      emailVerified: false,
      disabled: false,
    });

    await db.collection("users").doc(userResponse.uid).set({
      email: user.email,
      userName: user.userName,
      admin: false,
      can_open: false,
      idfinger: "",
      createdAt: new Date().toISOString(),
    });

    res.json(userResponse);
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(400).json({ error: error.message });
  }
};

// Hàm đăng nhập
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userRecord = userCredential.user;

    const idToken = await userRecord.getIdToken();

    const userDoc = await db.collection("users").doc(userRecord.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    res.json({
      message: "Login successful",
      uid: userRecord.uid,
      email: userData.email,
      userName: userData.userName,
      admin: userData.admin,
      can_open: userData.can_open,
      idToken: idToken,
      idfinger: userData.idfinger,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(400).json({ error: error.message });
  }
};

// Hàm đăng xuất
const logout = async (req, res) => {
  try {
    const auth = getAuth();
    await signOut(auth);
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(400).json({ error: error.message });
  }
};

// Hàm thay đổi mật khẩu
const changePassword = async (req, res) => {
  const { newPassword } = req.body;
  const uid = req.user.uid;

  try {
    await admin.auth().updateUser(uid, {
      password: newPassword,
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error during password change:", error);
    res.status(400).json({ error: error.message });
  }
};
const sendPasswordResetEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(email);

    const resetLink = await admin.auth().generatePasswordResetLink(email);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      service: "gmail",
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
    console.log("Mail Name:", process.env.MAIL_USERNAME);

    const mailOptions = {
      from: process.env.MAIL_USERNAME,
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Please click the link below to reset your password:\n\n${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("Error sending password reset email:", error.message);
    return res
      .status(500)
      .json({ error: "Failed to send password reset email" });
  }
};

//Hàm tạo bản ghi lịch sử
const logUnlockHistory = async (req, res) => {
  const uid = req.user?.uid;
  const timestamp = new Date().toISOString();

  if (!uid) {
    return res.status(403).json({ error: "User not authenticated" });
  }

  try {
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const username = userDoc.data().userName || "Unknown User";

    const historyRef = await db.collection("History").add({
      uid: uid,
      username: username,
      timestamp: timestamp,
      action: "Unlocked",
      closetime: null,
    });

    res.status(200).json({
      message: "Unlock history logged successfully!",
      historyId: historyRef.id,
    });
  } catch (error) {
    console.error("Error logging unlock history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Hàm lấy trạng thái khóa
const getKhoaStatus = async (req, res) => {
  try {
    const ref = firebaseDb.ref("khoa");
    const snapshot = await ref.once("value");
    const value = snapshot.val();

    res.status(200).json({ khoa: value });
  } catch (error) {
    console.error("Error fetching khoa status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Hàm update trạng thái khóa
const updateKhoaStatus = async (req, res) => {
  try {
    const { value } = req.body;
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(403).json({ error: "User not authenticated" });
    }

    const ref = firebaseDb.ref("khoa");
    await ref.set(value);

    await logUnlockHistory(req, res);

    res.status(200).json({ message: "Khoa status updated successfully!" });
  } catch (error) {
    console.error("Error updating khoa status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Hàm ghi lại lịch sử đóng cửa
const logCloseHistory = async (historyId, closeTime) => {
  try {
    const unlockHistoryDoc = await db
      .collection("History")
      .doc(historyId)
      .get();
    console.log(unlockHistoryDoc);
    if (!unlockHistoryDoc.exists) {
      throw new Error("Unlock history record not found");
    }

    await db.collection("History").doc(historyId).update({
      closetime: closeTime,
    });
    console.log(
      `Close time for history ID ${historyId} updated to: ${closeTime}`
    );

    const updatedDoc = await db.collection("History").doc(historyId).get();
    console.log("Updated document:", updatedDoc.data());
  } catch (error) {
    console.error("Error logging close history:", error);
    throw error;
  }
};

// Hàm lấy trạng thái cửa
const getCuaStatus = async (req, res) => {
  try {
    const ref = firebaseDb.ref("cua");
    const snapshot = await ref.once("value");
    const value = snapshot.val();

    res.status(200).json({ cua: value });
  } catch (error) {
    console.error("Error fetching cua status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

firebaseDb.ref("cua").on("value", async (snapshot) => {
  const value = snapshot.val();

  if (value === true) {
    const closeTime = new Date().toISOString();

    const historyQuery = db
      .collection("History")
      .where("closetime", "==", null)
      .orderBy("timestamp", "desc")
      .limit(1);

    const historySnapshot = await historyQuery.get();
    if (!historySnapshot.empty) {
      const historyDoc = historySnapshot.docs[0];
      const historyId = historyDoc.id;

      // Update Close
      await db.collection("History").doc(historyId).update({
        closetime: closeTime,
      });
      console.log("Closetime updated:", closeTime);
    } else {
    }
  }
});

module.exports = {
  signup,
  login,
  logout,
  changePassword,
  getKhoaStatus,
  updateKhoaStatus,
  logUnlockHistory,
  // updateCuaStatus,
  getCuaStatus,
  logCloseHistory,
  sendPasswordResetEmail,
};
