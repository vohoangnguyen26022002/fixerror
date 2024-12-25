const admin = require("firebase-admin");
const db = admin.firestore();
const { format } = require("date-fns-tz");
const firebaseDb = admin.database();
const nodemailer = require("nodemailer");
require("dotenv").config({ path: "./.env" });
const fs = require("fs");
const path = require("path");

const adminController = {
  //Hàm lấy danh sách users
  getAllUsers: async (req, res) => {
    try {
      const userId = req.user.uid;

      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data();
      if (!userData.admin) {
        return res.status(403).json({ error: "Access denied" });
      }
      const usersSnapshot = await db.collection("users").get();
      const users = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Hàm lấy danh sách lịch sử mở khóa
  getUnlockHistory: async (req, res) => {
    try {
      const userId = req.user.uid;
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }
      const userData = userDoc.data();
      if (!userData.admin) {
        return res.status(403).json({ error: "Access denied: Admins only" });
      }

      const timeZone = "Asia/Ho_Chi_Minh";
      const historySnapshot = await db.collection("History").get();

      const historyList = await Promise.all(
        historySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const vnTimestamp = format(
            new Date(data.timestamp),
            "yyyy-MM-dd HH:mm:ss",
            { timeZone }
          );

          const userRef = await db.collection("users").doc(data.uid).get();
          const username = userRef.exists
            ? userRef.data().username
            : "Unknown User";

          return {
            id: doc.id,
            uid: data.uid,
            username: data.username,
            timestamp: vnTimestamp,
            action: data.action,
          };
        })
      );

      res.status(200).json(historyList);
    } catch (error) {
      console.error("Error fetching unlock history:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  /// Hàm update admin và can_open ở backe
  updateUsers: async (req, res) => {
    try {
      const userId = req.user.uid;
      console.log(userId);
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data();
      if (!userData.admin) {
        return res.status(403).json({ error: "Access denied: Admins only" });
      }

      const { userId: targetUserId, admin, can_open, idfinger } = req.body;

      console.log("Target User ID:", targetUserId);

      if (!targetUserId) {
        return res.status(400).json({ error: "User ID is required." });
      }

      const targetUserRef = db.collection("users").doc(targetUserId);
      const targetUserDoc = await targetUserRef.get();
      if (!targetUserDoc.exists) {
        return res.status(404).json({ error: "Target user not found" });
      }

      await targetUserRef.update({ admin, can_open, idfinger });

      console.log("User privileges updated for user:", targetUserId);

      res
        .status(200)
        .json({ message: "User privileges updated successfully." });
    } catch (error) {
      console.error("Error updating user privileges:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  //Hàm xóa user
  deleteUser: async (req, res) => {
    try {
      const userId = req.user.uid;
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data();
      if (!userData.admin) {
        return res.status(403).json({ error: "Access denied: Admins only" });
      }
      console.log(req.body);
      const { userId: targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: "Target user ID is required." });
      }

      const targetUserRef = db.collection("users").doc(targetUserId);
      const targetUserDoc = await targetUserRef.get();

      if (!targetUserDoc.exists) {
        return res.status(404).json({ error: "Target user not found" });
      }
      await targetUserRef.delete();

      await admin.auth().deleteUser(targetUserId);
      console.log("User deleted from Firebase Authentication");

      res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  //Hàm lấy ảnh cảnh báo
  getFailedAttemptsImages: async (req, res) => {
    try {
      const userId = req.user.uid;

      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }
      const userData = userDoc.data();
      if (!userData.admin) {
        return res.status(403).json({ error: "Access denied: Admins only" });
      }

      const failedAttemptsSnapshot = await admin
        .database()
        .ref("failedAttempts")
        .once("value");

      if (!failedAttemptsSnapshot.exists()) {
        return res.status(404).json({ error: "No failed attempts found" });
      }

      const failedAttemptsImages = [];
      failedAttemptsSnapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();

        if (data) {
          failedAttemptsImages.push({
            id: childSnapshot.key,
            failedAttemptsImage: data,
          });
        }
      });

      res.status(200).json(failedAttemptsImages);
    } catch (error) {
      console.error("Error fetching failed attempts images:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  //Hàm lấy lịch sử đóng cửa
  getCloseHistory: async (req, res) => {
    try {
      const userId = req.user.uid;

      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }
      const userData = userDoc.data();
      if (!userData.admin) {
        return res.status(403).json({ error: "Access denied: Admins only" });
      }

      const timeZone = "Asia/Ho_Chi_Minh";

      const historySnapshot = await db
        .collection("History")
        .where("closetime", "!=", null)
        .get();

      const historyList = await Promise.all(
        historySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const vnTimestamp = format(
            new Date(data.closetime),
            "yyyy-MM-dd HH:mm:ss",
            { timeZone }
          );

          const userRef = await db.collection("users").doc(data.uid).get();
          const username = userRef.exists
            ? userRef.data().username
            : "Unknown User";

          return {
            id: doc.id,
            uid: data.uid,
            username: data.username,
            closetime: vnTimestamp,
          };
        })
      );

      res.status(200).json(historyList);
    } catch (error) {
      console.error("Error fetching close history:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  //Hàm lấy tất cả bản ghi lịch sử
  getAllHistory: async (req, res) => {
    try {
      const historySnapshot = await db
        .collection("History")
        .orderBy("timestamp", "desc")
        .get();

      if (historySnapshot.empty) {
        return res.status(404).json({ message: "No unlock history found" });
      }

      const historyList = historySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json(historyList);
    } catch (error) {
      console.error("Error fetching unlock history:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  //Hàm lắng nghe trường 'id_mo_cua'
  listenIdMoKhoaChanges: async (req, res) => {
    try {
      const idMoKhoaRef = admin.database().ref("id_mo_cua");
      let timeout = null;
      let cuaListener = null;
      let previousDoorStatus = null;

      const resetListeners = () => {
        if (timeout) clearTimeout(timeout);
        if (cuaListener) {
          const cuaRef = firebaseDb.ref("cua");
          cuaRef.off("value", cuaListener);
        }
      };

      idMoKhoaRef.on("value", async (snapshot) => {
        const idMoKhoa = snapshot.val();
        console.log(`ID mở khóa: ${idMoKhoa}`);

        if (!idMoKhoa) return;

        const usersCollection = db.collection("users");
        const userQuery = usersCollection.where("idfinger", "==", idMoKhoa);
        const querySnapshot = await userQuery.get();

        if (querySnapshot.empty) {
          console.log("Không tìm thấy người dùng với ID vân tay này.");
          resetListeners();
          return;
        }

        const userData = querySnapshot.docs[0].data();
        const userName = userData.userName || "Unknown User";
        const userEmail = userData.email || "No Email";

        console.log(`Người mở khóa: ${userName}`);

        const cuaRef = firebaseDb.ref("cua");
        resetListeners();

        cuaListener = async (snap) => {
          const doorStatus = snap.val();

          if (doorStatus === previousDoorStatus) {
            return;
          }

          if (doorStatus === false && previousDoorStatus === true) {
            clearTimeout(timeout);

            const FingerHistory = {
              userName: userName,
              email: userEmail,
              openTime: new Date().toISOString(),
              closeTime: null,
              timestamp: new Date().toISOString(),
              status: "Đã mở",
            };

            const historyCollection = db.collection("FingerHistory");
            const historyDocRef = await historyCollection.add(FingerHistory);
            console.log("Bản ghi mở khóa đã được tạo:", FingerHistory);

            resetListeners();
          }

          previousDoorStatus = doorStatus;
        };

        cuaRef.on("value", cuaListener);

        timeout = setTimeout(() => {
          console.log(
            "Không có thay đổi trạng thái cửa trong 5 giây, khởi động lại lắng nghe."
          );
          resetListeners();
        }, 12000);
      });
    } catch (error) {
      console.error("Lỗi khi xử lý lắng nghe ID mở khóa: ", error);
      res.status(500).send("Lỗi server.");
    }
  },

  //Hàm lấy lịch sử vân tay
  getFingerHistory: async (req, res) => {
    try {
      const historyCollection = db.collection("FingerHistory");
      const querySnapshot = await historyCollection
        .orderBy("openTime", "desc")
        .get();

      const fingerHistory = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json(fingerHistory);
    } catch (error) {
      console.error("Error fetching finger history:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  //Hàm lắng nghe cảnh báo
  listenImages: async (req, res) => {
    const warningRef = admin.database().ref("canh_bao");

    warningRef.on("value", (snapshot) => {
      const value = snapshot.val();

      if (value === true) {
        console.log("Cảnh báo: Truy cập trái phép hoặc có vấn đề!");

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.MAIL_FORM_ADDRESS,
            pass: process.env.MAIL_PASSWORD,
          },
        });

        const mailOptions = {
          from: process.env.MAIL_FORM_ADDRESS,
          to: process.env.NHAN_MAIL,
          subject: "Thông báo: Truy cập trái phép",
          text: "Hệ thống ghi nhận một lần truy cập bất thường.",
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Lỗi khi gửi email:", error);
          } else {
            console.log("Email đã được gửi:", info.response);
          }
        });
      } else {
        console.log("Không có cảnh báo mới.");
      }
    });
  },

  //Hàm cập nhật thời gian đóng cửa
  listenUpdateClosetime: async (req, res) => {
    firebaseDb.ref("cua").on("value", async (snapshot) => {
      const value = snapshot.val();

      if (value === true) {
        const closeTime = new Date().toISOString();

        const historyQuery = db
          .collection("FingerHistory")
          .where("closeTime", "==", null)
          .orderBy("timestamp", "desc")
          .limit(1);

        const historySnapshot = await historyQuery.get();
        if (!historySnapshot.empty) {
          const historyDoc = historySnapshot.docs[0];
          const historyId = historyDoc.id;

          await db.collection("FingerHistory").doc(historyId).update({
            closeTime: closeTime,
          });
          console.log("Closetime updated:", closeTime);
        } else {
        }
      }
    });
  },

  //Hàm gởi mail
  listenCuaSendMail: async (req, res) => {
    const cuaRef = admin.database().ref("cua");
    let timer = null;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_FORM_ADDRESS,
        pass: process.env.MAIL_PASSWORD,
      },
    });
    function sendEmail() {
      const mailOptions = {
        from: process.env.MAIL_FORM_ADDRESS,
        to: process.env.NHAN_MAIL,
        subject: "Vui Lòng Đóng Cửa !!!",
        text: "Cửa đã mở 30p",
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Lỗi khi gửi email:", error);
        } else {
          console.log("Email đã được gửi:", info.response);
        }
      });
    }

    cuaRef.on("value", (snap) => {
      const doorStatus = snap.val();

      if (doorStatus === false) {
        if (timer === null) {
          timer = setTimeout(() => {
            sendEmail();
          }, 30000);
        }
      } else {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
      }
    });
  },
};

module.exports = adminController;
