import React, { createContext, useContext, useState } from "react";

const UserContext = createContext({
  userId: null,
  userName: null,
  setUser: () => {},
});

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);

  const setUser = (id, nom) => {
    setUserId(id);
    setUserName(nom);
  };

  return (
    <UserContext.Provider value={{ userId, userName, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
