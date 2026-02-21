import React, { createContext, useContext, useState } from "react";

const NavbarContext = createContext({
    lastIndex: 0,
    setLastIndex: () => { },
    orgLastIndex: 0,
    setOrgLastIndex: () => { },
});

export const NavbarProvider = ({ children }) => {
    const [lastIndex, setLastIndex] = useState(0);
    const [orgLastIndex, setOrgLastIndex] = useState(0);

    return (
        <NavbarContext.Provider value={{ lastIndex, setLastIndex, orgLastIndex, setOrgLastIndex }}>
            {children}
        </NavbarContext.Provider>
    );
};

export const useNavbarContext = () => useContext(NavbarContext);
