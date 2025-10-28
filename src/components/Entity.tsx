import React, { useState, useEffect, useCallback } from "react";
import { useOnFlow } from "../context";
import { useQuestionnaireForm } from "../hooks/useQuestionnaireForm";
import {
  shouldShowGroup,
  shouldShowField,
  flattenFormValues,
} from "../utils/conditions";
import type { EntityDetails, WithFieldAnswers } from "../types";
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

export type EntityProps = {
  entityTypeKey: string;
  className?: string;
  disabled?: boolean;
  onChange?: (data: WithFieldAnswers<{}>) => void;
  onError?: (error: Error) => void;
};

import type { Questionnaire } from "../types";
import { convertFormDataToSubmission } from "../helpers";

type EntityTypeFields = Questionnaire;

export function Entity({
  entityTypeKey,
  className = "",
  disabled = false,
  onChange,
  onError,
}: EntityProps) {
  const { client } = useOnFlow();
  const [entityTypeFields, setEntityTypeFields] =
    useState<EntityTypeFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useQuestionnaireForm(entityTypeFields || { fieldGroups: [] });

  // Fetch entity type fields
  useEffect(() => {
    const fetchEntityFields = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await client.getEntityTypeFields(entityTypeKey);
        setEntityTypeFields(data as EntityTypeFields);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load entity fields";
        setError(errorMessage);
        onError?.(new Error(errorMessage));
      } finally {
        setLoading(false);
      }
    };

    fetchEntityFields();
  }, [entityTypeKey, client, onError]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange(
        convertFormDataToSubmission(
          form.values,
          entityTypeFields as Questionnaire,
        ),
      );
    }
  }, [form.values, onChange]);

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
        disabled: disabled,
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
    [form, disabled],
  );

  if (loading) {
    return (
      <div className={`onflow-entity onflow-entity-loading ${className}`}>
        <div className="onflow-loading">Loading entity fields...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`onflow-entity onflow-entity-error ${className}`}>
        <div className="onflow-error">Error: {error}</div>
      </div>
    );
  }

  if (!entityTypeFields) {
    return null;
  }

  // Flatten form values for condition evaluation
  const flattenedValues = flattenFormValues(form.values);

  return (
    <div className={`onflow-entity ${className}`}>
      {entityTypeFields.fieldGroups.map((group) => {
        const shouldShow = shouldShowGroup(group.condition, flattenedValues);
        if (!shouldShow) return null;

        return (
          <div key={group.id} className="onflow-field-group">
            <h3 className="onflow-group-title">{group.title}</h3>

            {group.isMultiple ? (
              // Multiple rows
              <div className="onflow-multiple-rows">
                {Object.keys(form.values[group.id] || {}).map((rowIndexStr) => {
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
                          onClick={() => form.removeRow(group.id, rowIndex)}
                          disabled={disabled}
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
                })}

                <button
                  type="button"
                  className="onflow-row-add"
                  onClick={() => form.addRow(group.id)}
                  disabled={disabled}
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

                  const fieldError = form.getFieldError(group.id, 0, field.id);
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
  );
}
