import React, { createContext, useContext, useState } from "react";

const NavbarContext = createContext({
    lastIndex: 0,
    setLastIndex: () => { },
});

export const NavbarProvider = ({ children }) => {
    const [lastIndex, setLastIndex] = useState(0);

    return (
        <NavbarContext.Provider value={{ lastIndex, setLastIndex }}>
            {children}
        </NavbarContext.Provider>
    );
};

export const useNavbarContext = () => useContext(NavbarContext);
