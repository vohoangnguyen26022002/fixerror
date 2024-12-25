const admin = require("firebase-admin");
const crypto = require("node:crypto");

const middlewareController = {
  verifyToken: async (req, res, next) => {
    const token = req.headers.authorization;
    if (token) {
      const accessToken = token.split(" ")[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(accessToken);
        req.user = decodedToken;
        next();
      } catch (error) {
        return res.status(403).json("Token is not valid");
      }
    } else {
      return res.status(401).json("You're not authenticated");
    }
  },

  verifyTokenAndAdminAuth: async (req, res, next) => {
    try {
      await middlewareController.verifyToken(req, res, async () => {
        const userDoc = await admin
          .firestore()
          .collection("users")
          .doc(req.user.uid)
          .get();

        if (!userDoc.exists) {
          return res.status(404).json({ error: "User not found" });
        }

        const userData = userDoc.data();

        if (req.user.uid === req.params.uid || userData.admin) {
          return next();
        } else {
          return res
            .status(403)
            .json("You're not allowed to delete others' resources");
        }
      });
    } catch (error) {
      console.error("Error verifying token or admin access:", error);
      return res.status(401).json({ error: "Unauthorized" });
    }
  },

  refreshAccessToken: async (req, res) => {
    const cookies = req.cookies;

    if (!cookies || !cookies.refreshToken) {
      return res.status(401).json({ error: "Refresh token not provided" });
    }

    const refreshToken = cookies.refreshToken;

    try {
      const decodedToken = await admin.auth().verifyIdToken(refreshToken, true);
      const userId = decodedToken.uid;

      const accessToken = await admin.auth().createCustomToken(userId);

      return res.status(200).json({ accessToken });
    } catch (error) {
      console.error("Error refreshing access token:", error);
      return res.status(403).json({ error: "Invalid refresh token" });
    }
  },

  createPasswordChangedToken: function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.password;
  },
};

module.exports = middlewareController;
