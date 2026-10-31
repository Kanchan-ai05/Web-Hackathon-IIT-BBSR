"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AiSettingsContextType {
  apiKey: string;
  provider: "gemini" | "openai";
  isConnected: boolean;
  modelName: string;
  testLoading: boolean;
  saveSettings: (key: string, provider: "gemini" | "openai") => void;
  testConnection: (key?: string, provider?: "gemini" | "openai") => Promise<{ valid: boolean; message: string }>;
  clearSettings: () => void;
  getHeaders: () => Record<string, string>;
}

const AiContext = createContext<AiSettingsContextType | undefined>(undefined);

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string>("");
  const [provider, setProvider] = useState<"gemini" | "openai">("gemini");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [modelName, setModelName] = useState<string>("Offline Fallback");
  const [testLoading, setTestLoading] = useState<boolean>(false);

  useEffect(() => {
    const savedKey = typeof window !== "undefined" ? localStorage.getItem("cit_ai_key") || "" : "";
    const savedProvider = (typeof window !== "undefined" ? localStorage.getItem("cit_ai_provider") as "gemini" | "openai" : "gemini") || "gemini";
    setApiKey(savedKey);
    setProvider(savedProvider);
    if (savedKey) {
      setIsConnected(true);
      setModelName(savedProvider === "gemini" ? "Gemini 1.5 Flash" : "GPT-4o-mini");
    }
  }, []);

  const saveSettings = (key: string, prov: "gemini" | "openai") => {
    setApiKey(key);
    setProvider(prov);
    if (key.trim()) {
      localStorage.setItem("cit_ai_key", key.trim());
      localStorage.setItem("cit_ai_provider", prov);
      setIsConnected(true);
      setModelName(prov === "gemini" ? "Gemini 1.5 Flash" : "GPT-4o-mini");
    } else {
      clearSettings();
    }
  };

  const clearSettings = () => {
    localStorage.removeItem("cit_ai_key");
    localStorage.removeItem("cit_ai_provider");
    setApiKey("");
    setIsConnected(false);
    setModelName("Offline Fallback");
  };

  const testConnection = async (keyToTest?: string, provToTest?: "gemini" | "openai") => {
    const key = keyToTest !== undefined ? keyToTest : apiKey;
    const prov = provToTest !== undefined ? provToTest : provider;
    if (!key.trim()) {
      return { valid: false, message: "Please enter an API key." };
    }

    setTestLoading(true);
    try {
      const apiUrl = (typeof window !== "undefined" && localStorage.getItem("cit_api_url")) 
        || process.env.NEXT_PUBLIC_API_URL 
        || ((typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") ? "https://cit-scheduling-api.onrender.com" : "http://localhost:8000");
      const res = await fetch(`${apiUrl}/api/ai/test-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cit_token") || ""}`,
        },
        body: JSON.stringify({ api_key: key, provider: prov }),
      });
      const data = await res.json();
      if (data.valid) {
        setIsConnected(true);
        setModelName(data.model || (prov === "gemini" ? "Gemini 1.5 Flash" : "GPT-4o-mini"));
        return { valid: true, message: data.message };
      } else {
        setIsConnected(false);
        return { valid: false, message: data.message || "Connection failed. Please check key." };
      }
    } catch (e: any) {
      return { valid: false, message: e.message || "Failed to reach backend." };
    } finally {
      setTestLoading(false);
    }
  };

  const getHeaders = () => {
    const headers: Record<string, string> = {};
    if (apiKey.trim()) {
      if (provider === "gemini") {
        headers["X-Gemini-Key"] = apiKey.trim();
      } else {
        headers["X-OpenAI-Key"] = apiKey.trim();
      }
    }
    return headers;
  };

  return (
    <AiContext.Provider
      value={{
        apiKey,
        provider,
        isConnected,
        modelName,
        testLoading,
        saveSettings,
        testConnection,
        clearSettings,
        getHeaders,
      }}
    >
      {children}
    </AiContext.Provider>
  );
}

export function useAiSettings() {
  const context = useContext(AiContext);
  if (!context) {
    throw new Error("useAiSettings must be used within an AiProvider");
  }
  return context;
}
