import type { SdkConfig } from "./types";

export class HttpClient {
  private readonly baseUrl: string;
  private readonly tenantId: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly accessToken?: string;

  constructor(config: SdkConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.tenantId = config.tenantId;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.accessToken = config.accessToken;
  }

  private headers(): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Tenant-ID": this.tenantId,
      "X-API-Key": this.apiKey,
      "X-API-Secret": this.apiSecret,
    };
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: this.headers(),
    });
    if (!res.ok) {
      throw await this.toError(res);
    }
    return (await res.json()) as T;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) {
      throw await this.toError(res);
    }
    return (await res.json()) as T;
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) {
      throw await this.toError(res);
    }
    return (await res.json()) as T;
  }

  private async toError(res: Response): Promise<Error> {
    try {
      const data = await res.json();
      const message = data?.errors?.[0]?.message || data?.message || res.statusText;
      return new Error(message);
    } catch {
      return new Error(res.statusText);
    }
  }
}
