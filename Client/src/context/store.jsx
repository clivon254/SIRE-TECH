import React, { createContext, useState, useEffect } from 'react'

export const StoreContext = createContext(null)

export default function StoreContextProvider(props) {
    const [token, setToken] = useState("")

    const [sidebarOpen, setSidebarOpen] = useState(false)

    // On mount, check for token in localStorage/sessionStorage
    useEffect(() => {
        const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (storedToken) {
            setToken(storedToken);
        }
    }, []);

    const contextValue = {
        token, setToken,
        sidebarOpen, setSidebarOpen
    } 

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}
