import type {
  Questionnaire,
  CreateSubmission,
  SubmissionFieldAnswer,
} from "./types";

export type DynamicFormData = Record<
  string,
  Record<number, Record<string, unknown>>
>;

export function convertFormDataToSubmission(
  data: DynamicFormData,
  questionnaire: Questionnaire
): Pick<CreateSubmission, "fieldAnswers"> {
  const fieldAnswers: CreateSubmission["fieldAnswers"] = [];

  questionnaire.fieldGroups.forEach((group) => {
    const groupData = data[group.id];
    if (!groupData) return;

    // Handle both single and multiple row groups
    Object.entries(groupData).forEach(([rowIndexStr, rowData]) => {
      const rowIndex = parseInt(rowIndexStr);

      Object.entries(rowData).forEach(([fieldId, value]) => {
        if (fieldId === "dimension") return;
        const field = group.fields.find((f) => f.id === fieldId);
        if (!field) return;
        if (value === undefined || value === null || value === "") return;

        const answer: SubmissionFieldAnswer = {
          moduleFieldId: fieldId,
          rowIndex,
        };
        switch (field.type) {
          case "number":
            answer.numberValue = Number(value);
            break;
          case "yes-no":
            answer.boolValue = Boolean(value);
            break;
          case "checkboxes":
            answer.listValue = Array.isArray(value) ? value : [value];
            break;
          case "geo-location":
            answer.objectValue = value as Record<string, unknown>;
            break;
          case "file":
            answer.fileValue = String(value);
            break;
          default:
            answer.textValue = String(value);
        }
        fieldAnswers.push(answer);
      });
    });
  });

  return { fieldAnswers };
}
