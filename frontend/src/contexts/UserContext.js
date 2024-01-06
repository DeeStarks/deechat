import React from "react";

export const UserContext = React.createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = React.useState(null);

    const login = (e) => {
        e.preventDefault();
        const input = e.target.querySelector("input");
        const value = input.value;
        input.value = "";
        if (value) {
            setUser(value);
        }
    };

    const logout = () => {
        setUser(null);
        window.location.href = "/";
    };

    return (
        <UserContext.Provider value={{ user, login, logout }}>
            {children}
        </UserContext.Provider>
    );
}
