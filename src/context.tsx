import React, { createContext, useContext, useMemo } from "react";
import type { SdkConfig } from "./types";
import { HttpClient } from "./http";
import {OnFlowClient} from "./client";

export type SdkContextValue = {
  client: OnFlowClient;
};

const SdkContext = createContext<SdkContextValue | null>(null);

export function OnFlowProvider({ children, config }: { children: React.ReactNode; config: SdkConfig }) {
  const client = useMemo(() => new OnFlowClient(new HttpClient(config)), [config.baseUrl, config.tenantId, config.apiKey, config.apiSecret, config.accessToken]);
  const value = useMemo(() => ({ client }), [client]);
  return <SdkContext.Provider value={value}>{children}</SdkContext.Provider>;
}

export function useOnFlow() {
  const ctx = useContext(SdkContext);
  if (!ctx) {
    throw new Error("useOnFlow must be used within OnFlowProvider");
  }
  return ctx;
}
