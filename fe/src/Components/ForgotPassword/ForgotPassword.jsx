import { useState } from "react";
import axios from "axios";
import styles from "./ForgotPassword.module.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post("/auth/resetpassword", { email });

      setMessage("Password reset link sent! Please check your email.");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      setMessage("Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.passwordResetForm}>
      <h2>Reset Your Password</h2>
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.inputField}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
      {message && (
        <p
          className={`${styles.message} ${
            message.includes("Failed")
              ? styles.messageError
              : styles.messageSuccess
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default ForgotPassword;
