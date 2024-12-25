import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteUser,
  fetchAllUsers,
  updateUser,
} from "../../../../redux/apiRequest";
import { updateUsersList } from "../../../../redux/userSlice";
import styles from "./css/UserList.module.css";

const UserList = () => {
  const user = useSelector((state) => state.auth.login?.currentUser);
  const usersList = useSelector((state) => state.users.users?.allUsers);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user?.token) {
      fetchAllUsers(dispatch, user?.token);
    }
  }, [dispatch, user]);

  const handleTogglePrivilege = (
    userId,
    adminStatus,
    canOpenStatus,
    idfinger
  ) => {
    const updatedUsersList = usersList.map((user) =>
      user.id === userId
        ? {
            ...user,
            admin: adminStatus,
            can_open: canOpenStatus,
            idfinger: idfinger,
          }
        : user
    );

    dispatch(updateUsersList(updatedUsersList));
    updateUser(
      userId,
      adminStatus,
      canOpenStatus,
      idfinger,
      user?.token,
      dispatch
    );
  };

  const handleConfirmTogglePrivilege = (
    userId,
    adminStatus,
    canOpenStatus,
    idfinger
  ) => {
    const confirmed = window.confirm("Are you sure about this change?");
    if (confirmed) {
      handleTogglePrivilege(userId, adminStatus, canOpenStatus, idfinger);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirmed) return;

    try {
      await deleteUser(userId, user?.token, dispatch);
      const updatedUsersList = usersList.filter((user) => user.id !== userId);
      dispatch(updateUsersList(updatedUsersList));
    } catch (error) {
      console.error("Error in deleteUser:", error);
    }
  };

  const sortedUsersList = usersList
    ? [...usersList].sort((a, b) => {
        console.log("Comparing:", a.idfinger, b.idfinger);
        if (a.idfinger === null && b.idfinger === null) return 0;
        if (a.idfinger === null) return 1;
        if (b.idfinger === null) return -1;
        return a.idfinger.localeCompare(b.idfinger, undefined, {
          numeric: true,
        });
      })
    : [];

  return (
    <div className={styles.userTableContainer}>
      <h2>User List</h2>
      <table className={styles.userTable}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Can Open</th>
            <th>Admin</th>
            <th>Id Finger</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsersList && sortedUsersList.length > 0 ? (
            sortedUsersList.map((user) => (
              <tr key={user.id}>
                <td>{user.userName}</td>
                <td>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={user.can_open}
                      onChange={() =>
                        handleConfirmTogglePrivilege(
                          user.id,
                          user.admin,
                          !user.can_open,
                          user.idfinger
                        )
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
                </td>
                <td>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={user.admin}
                      onChange={() =>
                        handleConfirmTogglePrivilege(
                          user.id,
                          !user.admin,
                          user.can_open,
                          user.idfinger
                        )
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
                </td>
                <td>
                  <div className={styles.idfingerInputRow}>
                    <input
                      type="text"
                      value={user.idfinger || ""}
                      onChange={(e) =>
                        handleTogglePrivilege(
                          user.id,
                          user.admin,
                          user.can_open,
                          e.target.value
                        )
                      }
                      className={styles.idfingerInput}
                      placeholder="ID_Finger"
                    />
                  </div>
                </td>
                <td>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
