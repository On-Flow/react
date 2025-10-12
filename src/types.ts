export type SdkConfig = {
  baseUrl: string; // e.g. https://api.example.com
  tenantId: string;
  apiKey: string;
  apiSecret: string;
  accessToken?: string; // Optional bearer if using OIDC
};

export type Pagination<T> = {
  count: number;
  results: T[];
};

export type ModuleVersion = {
  id: string;
  version: number;
};

export type Module = {
  id: string;
  name: string;
  title: string;
  description?: string;
  versions: ModuleVersion[];
};

export type FieldConditionOperator =
  | "equals"
  | "not_equals"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "is_true"
  | "is_false"
  | "contains"
  | "not_contains";

export type FieldConditionGroup = {
  and: Array<{
    fieldId: string;
    operator: FieldConditionOperator;
    value?: string | number | boolean | null;
  }>;
};

export type Field = {
  id: string;
  label: string;
  type:
    | "text"
    | "long-text"
    | "number"
    | "yes-no"
    | "dropdown-select"
    | "checkboxes"
    | "geo-location"
    | "date"
    | "file";
  isRequired: boolean;
  config: {
    placeholder?: string;
    options?: string[];
    minValue?: number;
    maxValue?: number;
    multiple?: boolean;
    fileTypes?: string[];
    maxSize?: number; // in MB
    isSensitive?: boolean;
  };
  sortOrder: number;
  condition?: null | FieldConditionGroup;
};

export type FieldGroup = {
  id: string;
  title: string;
  isMultiple: boolean;
  sortOrder: number;
  fields: Field[];
  condition?: null | FieldConditionGroup;
};

export type Questionnaire = {
  fieldGroups: FieldGroup[];
};

export type ResidentWrite = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postCode?: string;
};

export type SubmissionFieldAnswer = {
  moduleFieldId: string;
  rowIndex: number;
  numberValue?: number;
  boolValue?: boolean;
  textValue?: string;
  listValue?: unknown[];
  objectValue?: Record<string, unknown>;
  fileValue?: string; // uuid
};

export type CreateSubmission = {
  residentId: string; // uuid
  fieldAnswers: SubmissionFieldAnswer[];
};

// Form state types
export type QuestionnaireFormState = {
  [groupId: string]: {
    [rowIndex: number]: {
      [fieldId: string]: unknown;
    };
  };
};

export type ValidationErrors = {
  [groupId: string]: {
    [rowIndex: number]: {
      [fieldId: string]: string;
    };
  };
};

export type FileUploadProgress = {
  fileId: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
};
