import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useOnFlow } from "../context";
import { useQuestionnaireForm } from "../hooks/useQuestionnaireForm";
import {
  shouldShowGroup,
  shouldShowField,
  flattenFormValues,
} from "../utils/conditions";
import { convertFormDataToSubmission } from "../helpers";
import { Questionnaire } from "../types";
import {
  TextField,
  LongTextField,
  NumberField,
  YesNoField,
  DropdownField,
  CheckboxesField,
  DateField,
  FileField,
  GeoLocationField,
} from "./fields";

export type QuestionnaireProps = {
  moduleKey: string;
  entityTypeKey?: string;
  onSuccess?: (data: { entityId: string; submissionId: string }) => void;
  onError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
  // If provided, renders this component after successful submit
  renderSuccess?: (data: {
    entityId: string;
    submissionId: string;
  }) => React.ReactNode;
};

export function Questionnaire({
  moduleKey,
  entityTypeKey,
  onSuccess,
  onError,
  className = "",
  disabled = false,
  renderSuccess,
}: QuestionnaireProps) {
  const { client } = useOnFlow();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(
    null,
  );
  const [entityTypeFields, setEntityTypeFields] =
    useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    entityId: string;
    submissionId: string;
  } | null>(null);

  // Combine entity type fields and questionnaire fields
  const combinedFieldGroups = useMemo(() => {
    const groups: Questionnaire["fieldGroups"] = [];
    if (entityTypeFields) {
      groups.push(...entityTypeFields.fieldGroups);
    }
    if (questionnaire) {
      groups.push(...questionnaire.fieldGroups);
    }
    return groups;
  }, [entityTypeFields, questionnaire]);

  const combinedQuestionnaire: Questionnaire = useMemo(
    () => ({ fieldGroups: combinedFieldGroups }),
    [combinedFieldGroups],
  );

  const form = useQuestionnaireForm(combinedQuestionnaire);

  // Fetch questionnaire structure and entity type fields
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const promises: Promise<Questionnaire>[] = [];

        // Fetch questionnaire
        if (moduleKey) {
          promises.push(client.getQuestionnaireByKey(moduleKey));
        } else {
          throw new Error("moduleKey must be provided");
        }

        // Fetch entity type fields if provided
        if (entityTypeKey) {
          promises.push(
            client.getEntityTypeFields(entityTypeKey) as Promise<Questionnaire>,
          );
        }

        const results = await Promise.all(promises);

        if (moduleKey) {
          setQuestionnaire(results[0]);
        }

        if (entityTypeKey) {
          setEntityTypeFields(results[moduleKey ? 1 : 0] as Questionnaire);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load data";
        setError(errorMessage);
        onError?.(new Error(errorMessage));
      } finally {
        setLoading(false);
      }
    };

    if (moduleKey) {
      fetchData();
    }
  }, [moduleKey, entityTypeKey, client, onError]);

  // Render field based on type
  const renderField = useCallback(
    (field: any, groupId: string, rowIndex: number, fieldError?: string) => {
      const value = form.getValue(groupId, rowIndex, field.id);
      const isTouched = form.isFieldTouched(groupId, rowIndex, field.id);
      const showError = (isTouched && fieldError) || undefined;

      const fieldProps = {
        field,
        value,
        onChange: (newValue: unknown) =>
          form.setValue(groupId, rowIndex, field.id, newValue),
        error: showError,
        disabled: disabled || submitting,
      };

      switch (field.type) {
        case "text":
          return <TextField {...fieldProps} />;
        case "long-text":
          return <LongTextField {...fieldProps} />;
        case "number":
          return <NumberField {...fieldProps} />;
        case "yes-no":
          return <YesNoField {...fieldProps} />;
        case "dropdown-select":
          return <DropdownField {...fieldProps} />;
        case "checkboxes":
          return <CheckboxesField {...fieldProps} />;
        case "date":
          return <DateField {...fieldProps} />;
        case "file":
          return <FileField {...fieldProps} />;
        case "geo-location":
          return <GeoLocationField {...fieldProps} />;
        default:
          return <TextField {...fieldProps} />;
      }
    },
    [form, disabled, submitting],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!questionnaire || !moduleKey) return;

      // Validate all fields
      if (!form.validateAll()) {
        setError("Please fix the errors below");
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        // Extract entity field groups IDs
        const entityGroupIds =
          entityTypeFields?.fieldGroups.map((g) => g.id) || [];

        // Separate entity fields from questionnaire fields
        const entityValues: typeof form.values = {};
        const questionnaireValues: typeof form.values = {};

        Object.entries(form.values).forEach(([groupId, groupData]) => {
          if (entityGroupIds.includes(groupId)) {
            entityValues[groupId] = groupData;
          } else {
            questionnaireValues[groupId] = groupData;
          }
        });

        // Convert to submission format
        const entityData = entityTypeFields
          ? convertFormDataToSubmission(entityValues, entityTypeFields)
          : undefined;
        const submissionData = convertFormDataToSubmission(
          questionnaireValues,
          questionnaire,
        );

        let response: { id: string; entityId?: string };

        if (moduleKey) {
          // Use new entity-based submission
          response = await client.submitQuestionnaireByKey(moduleKey, {
            entity:
              entityTypeKey && entityData
                ? {
                    entityTypeKey,
                    fieldAnswers: entityData.fieldAnswers,
                  }
                : undefined,
            fieldAnswers: submissionData.fieldAnswers,
          });
        } else {
          throw new Error("moduleKey must be provided");
        }

        const success = {
          entityId: response.entityId || "",
          submissionId: response.id,
        };
        setSuccessData(success);
        onSuccess?.(success);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Submission failed";
        setError(errorMessage);
        onError?.(new Error(errorMessage));
      } finally {
        setSubmitting(false);
      }
    },
    [
      questionnaire,
      entityTypeFields,
      form,
      client,
      moduleKey,
      entityTypeKey,
      onSuccess,
      onError,
    ],
  );

  if (loading) {
    return (
      <div
        className={`onflow-questionnaire onflow-questionnaire-loading ${className}`}
      >
        <div className="onflow-loading">Loading questionnaire...</div>
      </div>
    );
  }

  if (error && !questionnaire) {
    return (
      <div
        className={`onflow-questionnaire onflow-questionnaire-error ${className}`}
      >
        <div className="onflow-error">Error: {error}</div>
      </div>
    );
  }

  if (!questionnaire) {
    return null;
  }

  // Flatten form values for condition evaluation
  const flattenedValues = flattenFormValues(form.values);

  // If a custom success renderer is provided and we have success data, render it
  if (successData && renderSuccess) {
    return (
      <div className={`onflow-questionnaire ${className}`}>
        {renderSuccess(successData)}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="onflow-questionnaire-form">
      <div className={`onflow-questionnaire ${className}`}>
        {/* All Fields (Entity + Questionnaire) */}
        <div className="onflow-questionnaire-fields">
          {combinedFieldGroups.map((group) => {
            const shouldShow = shouldShowGroup(
              group.condition,
              flattenedValues,
            );
            if (!shouldShow) return null;

            return (
              <div key={group.id} className="onflow-field-group">
                <h3 className="onflow-group-title">{group.title}</h3>

                {group.isMultiple ? (
                  // Multiple rows
                  <div className="onflow-multiple-rows">
                    {Object.keys(form.values[group.id] || {}).map(
                      (rowIndexStr) => {
                        const rowIndex = parseInt(rowIndexStr);
                        return (
                          <div key={rowIndex} className="onflow-multiple-row">
                            <div className="onflow-row-header">
                              <h4 className="onflow-row-title">
                                {group.title} {rowIndex + 1}
                              </h4>
                              <button
                                type="button"
                                className="onflow-row-remove"
                                onClick={() =>
                                  form.removeRow(group.id, rowIndex)
                                }
                                disabled={disabled || submitting}
                              >
                                Remove
                              </button>
                            </div>

                            <div className="onflow-row-fields">
                              {group.fields.map((field) => {
                                const shouldShow = shouldShowField(
                                  field.condition,
                                  flattenedValues,
                                );
                                if (!shouldShow) return null;

                                const fieldError = form.getFieldError(
                                  group.id,
                                  rowIndex,
                                  field.id,
                                );
                                return (
                                  <div key={field.id}>
                                    {renderField(
                                      field,
                                      group.id,
                                      rowIndex,
                                      fieldError,
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      },
                    )}

                    <button
                      type="button"
                      className="onflow-row-add"
                      onClick={() => form.addRow(group.id)}
                      disabled={disabled || submitting}
                    >
                      Add {group.title}
                    </button>
                  </div>
                ) : (
                  // Single row
                  <div className="onflow-single-row">
                    {group.fields.map((field) => {
                      const shouldShow = shouldShowField(
                        field.condition,
                        flattenedValues,
                      );
                      if (!shouldShow) return null;

                      const fieldError = form.getFieldError(
                        group.id,
                        0,
                        field.id,
                      );
                      return (
                        <div key={field.id}>
                          {renderField(field, group.id, 0, fieldError)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Error Display */}
        {error && (
          <div className="onflow-form-error" role="alert">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="onflow-submit-section">
          <button
            type="submit"
            className="onflow-submit-button"
            disabled={disabled || submitting || !questionnaire}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </form>
  );
}
