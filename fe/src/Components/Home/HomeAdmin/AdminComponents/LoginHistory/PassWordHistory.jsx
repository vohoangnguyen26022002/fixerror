import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUnlockHistory } from "../../../../../redux/apiRequest";
import styles from "../LoginHistory/PassWordHistory.module.css";

const PassWordHistory = () => {
  const user = useSelector((state) => state.auth.login?.currentUser);

  const PassWordList = useSelector(
    (state) => state.users.passWordHistories?.allPassWord
  );
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user?.token) {
      fetchUnlockHistory(user?.token, dispatch);
    }
  }, [user, dispatch]);

  const paginate = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const sortedPassWordList = Array.isArray(PassWordList)
    ? [...PassWordList].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      )
    : [];

  const paginatedEntries = paginate(sortedPassWordList);

  const totalPages = Math.ceil(sortedPassWordList.length / itemsPerPage);

  return (
    <div className={styles["login-history"]}>
      <h2>Web Unlock History</h2>
      <table className={styles["login-history-table"]}>
        <thead>
          <tr>
            <th>User</th>
            <th>Open Time</th>
            <th>Close Time</th>
          </tr>
        </thead>
        <tbody>
          {paginatedEntries.length > 0 ? (
            paginatedEntries.map((entry, index) => (
              <tr key={entry.unlockTime + index}>
                <td>{entry.username || undefined}</td>
                <td>{new Date(entry.timestamp).toLocaleString()}</td>
                <td>
                  {entry.closetime
                    ? new Date(entry.closetime).toLocaleString()
                    : "Chưa đóng"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2">No login history available.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className={styles.pagination}>
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PassWordHistory;
