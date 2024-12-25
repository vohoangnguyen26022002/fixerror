import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styles from "./Homepage.module.css";

const HomePage = () => {
  const user = useSelector((state) => state.auth.login?.currentUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return null;
    if (!user.active) navigate("/");
    if (user.admin === true) navigate("/adminPage");
    else navigate("/clientPage");
  }, []);

  return (
    <main className={styles.homeContainer}>
      <div className={styles.homeTitle}>HOME PAGE</div>
      <div className={styles.homeUserlist}>
        <div className={styles.imageContainer}>
          <img
            src="https://www.senviet.art/wp-content/uploads/edd/2021/12/dai-hoc-su-pham-tphcm.jpg"
            alt="Trường DHSPKT"
            className={styles.image}
          />
        </div>
        <div>
          <h3>Welcome!</h3>
          <p>If you already have an account, please log in to use.</p>
          <p>
            If you are a new member and do not have an account, please register
            to use
          </p>
        </div>
      </div>
    </main>
  );
};

export default HomePage;
