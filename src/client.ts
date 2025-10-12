import type { CreateSubmission, Questionnaire, ResidentWrite } from "./types";
import { HttpClient } from "./http";

export class OnFlowClient {
  private readonly http: HttpClient;
  constructor(http: HttpClient) {
    this.http = http;
  }

  // Questionnaires
  async getQuestionnaireById(moduleVersionId: string): Promise<Questionnaire> {
    return this.http.get(
      `/public/v1/module-versions/${moduleVersionId}/questionnaire`
    );
  }

  // Residents
  async createResident(input: ResidentWrite): Promise<{ id: string }> {
    return this.http.post(`/public/v1/residents`, input);
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
    status: "pending" | "uploaded" | "failed"
  ): Promise<{ id: string; status: string }> {
    return this.http.put(`/public/v1/files/${fileId}/status`, { status });
  }

  // Submissions
  async submitQuestionnaire(
    moduleVersionId: string,
    input: CreateSubmission
  ): Promise<{ id: string }> {
    return this.http.post(`/public/v1/submissions/${moduleVersionId}`, input);
  }
}
