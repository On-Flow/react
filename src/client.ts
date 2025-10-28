import type {
  CreateSubmission,
  Questionnaire,
  EntityWrite,
  EntityDetails,
} from "./types";
import { HttpClient } from "./http";

export class OnFlowClient {
  public readonly http: HttpClient;
  constructor(http: HttpClient) {
    this.http = http;
  }

  async getQuestionnaireByKey(moduleKey: string): Promise<Questionnaire> {
    return this.http.get(`/v1/modules/${moduleKey}/questionnaire`);
  }

  async getEntityTypeFields(entityTypeKey: string): Promise<{
    id: string;
    key: string;
    label: string;
    fieldGroups: Array<{
      id: string;
      title: string;
      isMultiple: boolean;
      sortOrder: number;
      condition?: any;
      fields: Array<{
        id: string;
        label: string;
        type: string;
        isRequired: boolean;
        config: any;
        sortOrder: number;
        condition?: any;
      }>;
    }>;
  }> {
    return this.http.get(`/v1/entity-types/key/${entityTypeKey}`);
  }

  // Files
  async createSignedUpload(input: {
    name: string;
    size: number;
    mimeType: string;
    isSensitive?: boolean;
  }): Promise<{
    id: string;
    uploadUrl: string;
    key: string;
    publicUrl?: string | null;
  }> {
    return this.http.post(`/public/v1/files/signed-upload`, input);
  }

  async updateFileStatus(
    fileId: string,
    status: "pending" | "uploaded" | "failed",
  ): Promise<{ id: string; status: string }> {
    return this.http.put(`/public/v1/files/${fileId}/status`, { status });
  }

  async submitQuestionnaireByKey(
    moduleKey: string,
    input: CreateSubmission,
  ): Promise<{ id: string; entityId?: string }> {
    return this.http.post(`/v1/modules/key/${moduleKey}/submissions`, input);
  }
}
