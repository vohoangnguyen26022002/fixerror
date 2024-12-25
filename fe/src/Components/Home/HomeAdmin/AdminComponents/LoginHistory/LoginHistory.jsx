import { useState } from "react";
import PassWordHistory from "./PassWordHistory";
import FingerHistory from "./FingerHistory";
import styles from "../LoginHistory/LoginHistory.module.css";

const LoginHistory = () => {
  const [activeTab, setActiveTab] = useState("password");

  const renderContent = () => {
    switch (activeTab) {
      case "password":
        return (
          <div className={styles["page-password"]}>
            <PassWordHistory />
          </div>
        );
      case "finger":
        return (
          <div className={styles["page-finger"]}>
            <FingerHistory />
          </div>
        );
      default:
        return <PassWordHistory />;
    }
  };

  return (
    <div className={styles["admin-container"]}>
      <header className={styles["admin-header"]}>
        <nav>
          <button
            onClick={() => setActiveTab("password")}
            className={activeTab === "password" ? styles.active : ""}
          >
            Web
          </button>
          <button
            onClick={() => setActiveTab("finger")}
            className={activeTab === "finger" ? styles.active : ""}
          >
            Vân tay
          </button>
        </nav>
      </header>
      <main className={styles["admin-content"]}>{renderContent()}</main>
    </div>
  );
};

export default LoginHistory;
