import React, { useState, useEffect, useCallback } from "react";
import { useOnFlow } from "../context";
import { useQuestionnaireForm } from "../hooks/useQuestionnaireForm";
import {
  shouldShowGroup,
  shouldShowField,
  flattenFormValues,
} from "../utils/conditions";
import { convertFormDataToSubmission } from "../helpers";
import type { Questionnaire, ResidentWrite } from "../types";
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
  moduleVersionId: string;
  onSuccess?: (data: { residentId: string; submissionId: string }) => void;
  onError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
  // When false, hides address inputs (address lines, city, post code)
  showResidentAddressFields?: boolean;
  // If provided, renders this component after successful submit
  renderSuccess?: (
    data: { residentId: string; submissionId: string }
  ) => React.ReactNode;
};

export function Questionnaire({
  moduleVersionId,
  onSuccess,
  onError,
  className = "",
  disabled = false,
  showResidentAddressFields = true,
  renderSuccess,
}: QuestionnaireProps) {
  const { client } = useOnFlow();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(
    null
  );
  const [residentData, setResidentData] = useState<Partial<ResidentWrite>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<
    { residentId: string; submissionId: string } | null
  >(null);

  const form = useQuestionnaireForm(questionnaire || { fieldGroups: [] });

  // Fetch questionnaire structure
  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await client.getQuestionnaireById(moduleVersionId);
        setQuestionnaire(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load questionnaire";
        setError(errorMessage);
        onError?.(new Error(errorMessage));
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaire();
  }, [moduleVersionId, client, onError]);

  // Render field based on type
  const renderField = useCallback(
    (field: any, groupId: string, rowIndex: number, fieldError?: string) => {
      const value = form.getValue(groupId, rowIndex, field.id);
      const isTouched = form.isFieldTouched(groupId, rowIndex, field.id);
      const showError = isTouched && fieldError || undefined;

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
    [form, disabled, submitting]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!questionnaire) return;

      // Validate resident data
      const residentErrors: string[] = [];
      if (!residentData.firstName?.trim())
        residentErrors.push("First name is required");
      if (!residentData.lastName?.trim())
        residentErrors.push("Last name is required");
      if (!residentData.email?.trim()) residentErrors.push("Email is required");

      if (residentErrors.length > 0) {
        setError(residentErrors.join(", "));
        return;
      }

      // Validate questionnaire fields
      if (!form.validateAll()) {
        setError("Please fix the errors below");
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        // Step 1: Create resident
        const residentResponse = await client.createResident({
          firstName: residentData.firstName!,
          lastName: residentData.lastName!,
          email: residentData.email!,
          phone: residentData.phone,
          addressLine1: residentData.addressLine1,
          addressLine2: residentData.addressLine2,
          city: residentData.city,
          postCode: residentData.postCode,
        });

        // Step 2: Create submission
        const submissionData = convertFormDataToSubmission(
          form.values,
          questionnaire
        );
        const submissionResponse = await client.submitQuestionnaire(
          moduleVersionId,
          {
            residentId: residentResponse.id,
            fieldAnswers: submissionData.fieldAnswers,
          }
        );

        const success = {
          residentId: residentResponse.id,
          submissionId: submissionResponse.id,
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
      residentData,
      form,
      client,
      moduleVersionId,
      onSuccess,
      onError,
    ]
  );

  // Update resident data
  const updateResidentData = useCallback(
    (key: keyof ResidentWrite, value: string) => {
      setResidentData((prev) => ({ ...prev, [key]: value }));
    },
    []
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
    <div className={`onflow-questionnaire ${className}`}>
      <form onSubmit={handleSubmit} className="onflow-questionnaire-form">
        {/* Resident Information Section */}
        <div className="onflow-resident-section">
          <h2 className="onflow-section-title">Your Information</h2>
          <div className="onflow-resident-fields">
            <div className="onflow-field">
              <label className="onflow-field-label">
                First Name <span className="onflow-field-required">*</span>
              </label>
              <input
                type="text"
                className="onflow-field-input"
                value={residentData.firstName || ""}
                onChange={(e) =>
                  updateResidentData("firstName", e.target.value)
                }
                disabled={disabled || submitting}
                required
              />
            </div>

            <div className="onflow-field">
              <label className="onflow-field-label">
                Last Name <span className="onflow-field-required">*</span>
              </label>
              <input
                type="text"
                className="onflow-field-input"
                value={residentData.lastName || ""}
                onChange={(e) => updateResidentData("lastName", e.target.value)}
                disabled={disabled || submitting}
                required
              />
            </div>

            <div className="onflow-field">
              <label className="onflow-field-label">
                Email <span className="onflow-field-required">*</span>
              </label>
              <input
                type="email"
                className="onflow-field-input"
                value={residentData.email || ""}
                onChange={(e) => updateResidentData("email", e.target.value)}
                disabled={disabled || submitting}
                required
              />
            </div>

            <div className="onflow-field">
              <label className="onflow-field-label">Phone</label>
              <input
                type="tel"
                className="onflow-field-input"
                value={residentData.phone || ""}
                onChange={(e) => updateResidentData("phone", e.target.value)}
                disabled={disabled || submitting}
              />
            </div>

            {showResidentAddressFields && (
              <>
                <div className="onflow-field">
                  <label className="onflow-field-label">Address Line 1</label>
                  <input
                    type="text"
                    className="onflow-field-input"
                    value={residentData.addressLine1 || ""}
                    onChange={(e) =>
                      updateResidentData("addressLine1", e.target.value)
                    }
                    disabled={disabled || submitting}
                  />
                </div>

                <div className="onflow-field">
                  <label className="onflow-field-label">Address Line 2</label>
                  <input
                    type="text"
                    className="onflow-field-input"
                    value={residentData.addressLine2 || ""}
                    onChange={(e) =>
                      updateResidentData("addressLine2", e.target.value)
                    }
                    disabled={disabled || submitting}
                  />
                </div>

                <div className="onflow-field">
                  <label className="onflow-field-label">City</label>
                  <input
                    type="text"
                    className="onflow-field-input"
                    value={residentData.city || ""}
                    onChange={(e) => updateResidentData("city", e.target.value)}
                    disabled={disabled || submitting}
                  />
                </div>

                <div className="onflow-field">
                  <label className="onflow-field-label">Post Code</label>
                  <input
                    type="text"
                    className="onflow-field-input"
                    value={residentData.postCode || ""}
                    onChange={(e) =>
                      updateResidentData("postCode", e.target.value)
                    }
                    disabled={disabled || submitting}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Questionnaire Fields */}
        <div className="onflow-questionnaire-fields">
          {questionnaire.fieldGroups.map((group) => {
            const shouldShow = shouldShowGroup(
              group.condition,
              flattenedValues
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
                                  flattenedValues
                                );
                                if (!shouldShow) return null;

                                const fieldError = form.getFieldError(
                                  group.id,
                                  rowIndex,
                                  field.id
                                );
                                return (
                                  <div key={field.id}>
                                    {renderField(
                                      field,
                                      group.id,
                                      rowIndex,
                                      fieldError
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
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
                        flattenedValues
                      );
                      if (!shouldShow) return null;

                      const fieldError = form.getFieldError(
                        group.id,
                        0,
                        field.id
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
      </form>
    </div>
  );
}
