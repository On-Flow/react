import type { HttpClient } from "../http";

export type FileUploadProgress = {
  fileId: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
};

export type UploadResponse = {
  id: string;
  uploadUrl: string;
  key: string;
  publicUrl?: string | null;
};

export type FileUploadOptions = {
  name: string;
  size: number;
  mimeType: string;
  isSensitive?: boolean;
};

/**
 * Uploads a file using the 3-step process:
 * 1. Request signed upload URL from API
 * 2. Upload file to S3 via signed URL
 * 3. Update file status to "uploaded"
 */
export async function uploadFile(
  file: File,
  httpClient: HttpClient,
  options: FileUploadOptions,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Step 1: Create signed upload URL
    const createResponse = await httpClient.post<UploadResponse>(
      "/public/v1/files/signed-upload",
      {
        name: options.name,
        size: options.size,
        mimeType: options.mimeType,
        isSensitive: options.isSensitive ?? true,
      }
    );

    const { id, uploadUrl } = createResponse;

    // Step 2: Upload file to signed URL
    onProgress?.(50);

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
    }

    onProgress?.(90);

    // Step 3: Update file status to 'uploaded'
    await httpClient.put(`/public/v1/files/${id}/status`, {
      status: "uploaded",
    });

    onProgress?.(100);
    return id;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "File upload failed"
    );
  }
}

/**
 * Uploads multiple files in parallel
 */
export async function uploadFiles(
  files: File[],
  httpClient: HttpClient,
  options: Partial<FileUploadOptions> = {},
  onProgress?: (fileId: string, progress: number) => void
): Promise<string[]> {
  const uploadPromises = files.map(async (file) => {
    const fileOptions: FileUploadOptions = {
      name: file.name,
      size: file.size,
      mimeType: file.type,
      isSensitive: options.isSensitive ?? true,
      ...options,
    };

    return uploadFile(file, httpClient, fileOptions, (progress) =>
      onProgress?.(file.name, progress)
    );
  });

  return Promise.all(uploadPromises);
}

/**
 * Validates file against field constraints
 */
export function validateFile(
  file: File,
  field: { fileTypes?: string[]; maxSize?: number; multiple?: boolean }
): string | undefined {
  // Check file size
  if (field.maxSize && file.size > field.maxSize * 1024 * 1024) {
    return `File size must be less than ${field.maxSize}MB`;
  }

  // Check file type
  if (field.fileTypes && field.fileTypes.length > 0) {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const mimeType = file.type;

    const isValidType = field.fileTypes.some((type) => {
      if (type.includes("/")) {
        // MIME type
        return mimeType === type;
      } else {
        // File extension
        return fileExtension === type.toLowerCase();
      }
    });

    if (!isValidType) {
      return `File type must be one of: ${field.fileTypes.join(", ")}`;
    }
  }

  return undefined;
}
