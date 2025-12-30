import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [pendingRequests, setPendingRequests] = useState(0);

    // Show loading
    const showLoading = () => {
        setPendingRequests(prev => prev + 1);
    };

    // Hide loading
    const hideLoading = () => {
        setPendingRequests(prev => Math.max(0, prev - 1));
    };

    // Update isLoading based on pendingRequests
    useEffect(() => {
        setIsLoading(pendingRequests > 0);
    }, [pendingRequests]);

    // Setup Axios interceptors
    useEffect(() => {
        const requestInterceptor = api.interceptors.request.use(
            (config) => {
                showLoading();
                return config;
            },
            (error) => {
                hideLoading();
                return Promise.reject(error);
            }
        );

        const responseInterceptor = api.interceptors.response.use(
            (response) => {
                hideLoading();
                return response;
            },
            (error) => {
                hideLoading();
                return Promise.reject(error);
            }
        );

        // Cleanup interceptors on unmount
        return () => {
            api.interceptors.request.eject(requestInterceptor);
            api.interceptors.response.eject(responseInterceptor);
        };
    }, []);

    return (
        <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};
