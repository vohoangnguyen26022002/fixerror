const express = require("express");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/admin");
const cors = require("cors");
const cron = require("node-cron");
const admin = require("firebase-admin");
const { deleteUserCronjob } = require("./Controller/auth");
const db = admin.firestore();
const cookieParser = require("cookie-parser");
const {
  listenIdMoKhoaChanges,
  listenImages,
  listenUpdateClosetime,
  listenCuaSendMail,
} = require("./Controller/admin");

const app = express();
app.use(cors());

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

cron.schedule("*/5 * * * *", async () => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const usersToDelete = await db
      .collection("users")
      .where("can_open", "==", false)
      .where("createdAt", "<=", fiveMinutesAgo.toISOString())
      .get();
    usersToDelete.forEach(async (userDoc) => {
      const userId = userDoc.id;
      try {
        await admin.auth().deleteUser(userId);
        await db.collection("users").doc(userId).delete();
        console.log(`Deleted user with UID: ${userId} due to inactivity`);
      } catch (error) {
        console.error(`Failed to delete user with UID: ${userId}`, error);
      }
    });
  } catch (error) {
    console.error("Error running deletion cron job:", error);
  }
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);

listenIdMoKhoaChanges();
listenImages();
listenUpdateClosetime();
listenCuaSendMail();

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log("Server running on port 8000");
});
