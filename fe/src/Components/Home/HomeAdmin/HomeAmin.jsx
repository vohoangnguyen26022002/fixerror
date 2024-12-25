import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import UserList from "./AdminComponents/UserList";
import WarningImage from "./AdminComponents/WarningImage";
import PageLock from "../../pages/PageLock/PageLock";
import LoginHistory from "./AdminComponents/LoginHistory/LoginHistory";
import styles from "./AdminComponents/HomeAdmin.module.css";

const HomeAdmin = () => {
  const user = useSelector((state) => state.auth.login?.currentUser);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("homePage");

  useEffect(() => {
    if (!user) {
      navigate("/");
    } else if (user.admin) {
      navigate("/adminPage");
    } else {
      navigate("/clientPage");
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "homePage":
        return (
          <div className={styles["page-lock-container"]}>
            <PageLock />
          </div>
        );
      case "users":
        return (
          <div className={styles["page-userlist-container"]}>
            {" "}
            <UserList />{" "}
          </div>
        );
      case "loginHistory":
        return (
          <div className={styles["page-userlist-container"]}>
            {" "}
            <LoginHistory />{" "}
          </div>
        );
      case "image":
        return <WarningImage />;
      default:
        return <UserList />;
    }
  };

  return (
    <div className={styles["admin-container"]}>
      <header className={styles["admin-header"]}>
        <nav>
          <button
            onClick={() => setActiveTab("homePage")}
            className={activeTab === "homePage" ? styles.active : ""}
          >
            Lock
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={activeTab === "users" ? styles.active : ""}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("loginHistory")}
            className={activeTab === "loginHistory" ? styles.active : ""}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab("image")}
            className={activeTab === "image" ? styles.active : ""}
          >
            Warning Images
          </button>
        </nav>
      </header>
      <main className={styles["admin-content"]}>{renderContent()}</main>
    </div>
  );
};
export default HomeAdmin;
