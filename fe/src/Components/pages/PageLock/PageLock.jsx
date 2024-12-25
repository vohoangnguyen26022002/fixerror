import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getKhoa,
  PostUnlockHistory,
  updateKhoa,
} from "../../../redux/apiRequest";
import { realtimeDb } from "../../../redux/firebaseapp";
import { onValue, ref } from "firebase/database";
import styles from "./PageLock.module.css";

const PageLock = () => {
  const [isUnLocked, setIsUnLocked] = useState(false);
  const [isCua, setIsCua] = useState(true);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isListeningCua, setIsListeningCua] = useState(false);
  const user = useSelector((state) => state.auth.login?.currentUser);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchInitialKhoaStatus = async () => {
      try {
        const initialStatus = await getKhoa(dispatch);
        setIsUnLocked(initialStatus === true);
      } catch (error) {
        console.error("Failed to fetch initial khoa status:", error);
      }
    };

    fetchInitialKhoaStatus();

    const refKhoa = ref(realtimeDb, "khoa");
    const refCua = ref(realtimeDb, "cua");

    const unsubscribeKhoa = onValue(
      refKhoa,
      (snapshot) => {
        if (snapshot.exists()) {
          const status = snapshot.val();
          setIsUnLocked(status === true);
        } else {
          console.log("No data available for khoa");
        }
      },
      (error) => {
        console.error("Error fetching khoa status:", error);
      }
    );

    const unsubscribeCua = onValue(
      refCua,
      (snapshot) => {
        if (snapshot.exists()) {
          const status = snapshot.val();
          setIsCua(status === true);
        } else {
          console.log("No data available for cua");
        }
      },
      (error) => {
        console.error("Error fetching cua status:", error);
      }
    );

    return () => {
      unsubscribeKhoa();
      unsubscribeCua();
    };
  }, [dispatch]);

  const handleToggleLock = async () => {
    if (isButtonDisabled || !isCua) return;

    if (user?.can_open) {
      const newStatus = !isUnLocked;

      try {
        await updateKhoa(newStatus);
        setIsUnLocked(newStatus);

        setIsButtonDisabled(true);
        setTimeout(() => setIsButtonDisabled(false), 10000);

        if (newStatus) {
          setTimeout(() => {
            setIsUnLocked(false);
            updateKhoa(false);
          }, 7000);

          if (!isListeningCua) {
            setIsListeningCua(true);
            const refCua = ref(realtimeDb, "cua");
            const unsubscribeCua = onValue(
              refCua,
              (snapshot) => {
                if (snapshot.exists()) {
                  const status = snapshot.val();
                  if (status === false && isCua === true) {
                    const unlockTime = new Date().toISOString();
                    console.log("Using token:", user?.token);
                    PostUnlockHistory(
                      user?.token,
                      dispatch,
                      unlockTime,
                      user.email
                    );
                  }
                }
              },
              (error) => {
                console.error("Error fetching cua status:", error);
              }
            );

            const timeoutId = setTimeout(() => {
              unsubscribeCua();
              setIsListeningCua(false);
            }, 12000);

            return () => {
              clearTimeout(timeoutId);
              unsubscribeCua();
            };
          }
        }
      } catch (error) {
        console.error("Failed to update khoa status:", error);
      }
    } else {
      console.log("User does not have permission to unlock.");
    }
  };

  return (
    <div className={styles["lock-container"]}>
      <div className={styles["lock-icon"]}>{isUnLocked ? "🔓" : "🔒"}</div>
      <h2 className={styles["lock-status"]}>
        {isUnLocked ? "UnLocked" : "Locked"}
      </h2>
      <button className={styles["unlock-button"]} onClick={handleToggleLock}>
        {isUnLocked ? "Unlock" : "Lock"}
      </button>
      {!user?.can_open && (
        <p className={styles["permission-message"]}>
          You do not have permission to unlock.
        </p>
      )}
      {!isCua && (
        <p className={styles["permission-message"]}>
          The door is open, you dont't need unlock.
        </p>
      )}
    </div>
  );
};

export default PageLock;
