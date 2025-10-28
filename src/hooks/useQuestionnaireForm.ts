import { useState, useCallback, useMemo } from "react";
import type { Field, FieldGroup, Questionnaire } from "../types";

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

export type UseQuestionnaireFormReturn = {
  // State
  values: QuestionnaireFormState;
  errors: ValidationErrors;
  touched: QuestionnaireFormState;
  isSubmitting: boolean;

  // Actions
  setValue: (
    groupId: string,
    rowIndex: number,
    fieldId: string,
    value: unknown
  ) => void;
  getValue: (groupId: string, rowIndex: number, fieldId: string) => unknown;
  setTouched: (groupId: string, rowIndex: number, fieldId: string) => void;
  setError: (
    groupId: string,
    rowIndex: number,
    fieldId: string,
    error: string
  ) => void;
  clearError: (groupId: string, rowIndex: number, fieldId: string) => void;
  validateAll: () => boolean;
  reset: () => void;
  addRow: (groupId: string) => void;
  removeRow: (groupId: string, rowIndex: number) => void;

  // Helpers
  getFieldError: (
    groupId: string,
    rowIndex: number,
    fieldId: string
  ) => string | undefined;
  isFieldTouched: (
    groupId: string,
    rowIndex: number,
    fieldId: string
  ) => boolean;
  hasErrors: boolean;
};

export function useQuestionnaireForm(
  questionnaire: Questionnaire
): UseQuestionnaireFormReturn {
  const [values, setValues] = useState<QuestionnaireFormState>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<QuestionnaireFormState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form state for all groups
  const initializeGroup = useCallback(
    (groupId: string, isMultiple: boolean) => {
      setValues((prev) => {
        if (!prev[groupId]) {
          return {
            ...prev,
            [groupId]: isMultiple ? {} : { 0: {} },
          };
        }
        return prev;
      });
    },
    []
  );

  // Initialize all groups on mount
  useMemo(() => {
    questionnaire.fieldGroups.forEach((group) => {
      initializeGroup(group.id, group.isMultiple);
    });
  }, [questionnaire.fieldGroups, initializeGroup]);

  const setValue = useCallback(
    (groupId: string, rowIndex: number, fieldId: string, value: unknown) => {
      setValues((prev) => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          [rowIndex]: {
            ...prev[groupId]?.[rowIndex],
            [fieldId]: value,
          },
        },
      }));

      // Clear error when user starts typing
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors[groupId]?.[rowIndex]?.[fieldId]) {
          delete newErrors[groupId][rowIndex][fieldId];
          if (Object.keys(newErrors[groupId][rowIndex]).length === 0) {
            delete newErrors[groupId][rowIndex];
          }
          if (Object.keys(newErrors[groupId]).length === 0) {
            delete newErrors[groupId];
          }
        }
        return newErrors;
      });
    },
    []
  );

  const getValue = useCallback(
    (groupId: string, rowIndex: number, fieldId: string): unknown => {
      return values[groupId]?.[rowIndex]?.[fieldId];
    },
    [values]
  );

  const setTouchedField = useCallback(
    (groupId: string, rowIndex: number, fieldId: string) => {
      setTouched((prev) => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          [rowIndex]: {
            ...prev[groupId]?.[rowIndex],
            [fieldId]: true,
          },
        },
      }));
    },
    []
  );

  const setError = useCallback(
    (groupId: string, rowIndex: number, fieldId: string, error: string) => {
      setErrors((prev) => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          [rowIndex]: {
            ...prev[groupId]?.[rowIndex],
            [fieldId]: error,
          },
        },
      }));
    },
    []
  );

  const clearError = useCallback(
    (groupId: string, rowIndex: number, fieldId: string) => {
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors[groupId]?.[rowIndex]?.[fieldId]) {
          delete newErrors[groupId][rowIndex][fieldId];
          if (Object.keys(newErrors[groupId][rowIndex]).length === 0) {
            delete newErrors[groupId][rowIndex];
          }
          if (Object.keys(newErrors[groupId]).length === 0) {
            delete newErrors[groupId];
          }
        }
        return newErrors;
      });
    },
    []
  );

  const validateField = useCallback(
    (field: Field, value: unknown): string | undefined => {
      if (field.isRequired) {
        if (value === undefined || value === null || value === "") {
          return `${field.label} is required`;
        }

        // Special validation for arrays (checkboxes)
        if (Array.isArray(value) && value.length === 0) {
          return `${field.label} is required`;
        }
      }

      // Type-specific validation
      if (
        field.type === "number" &&
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return `${field.label} must be a valid number`;
        }
        if (
          field.config.minValue !== undefined &&
          numValue < field.config.minValue
        ) {
          return `${field.label} must be at least ${field.config.minValue}`;
        }
        if (
          field.config.maxValue !== undefined &&
          numValue > field.config.maxValue
        ) {
          return `${field.label} must be at most ${field.config.maxValue}`;
        }
      }

      return undefined;
    },
    []
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let hasErrors = false;

    questionnaire.fieldGroups.forEach((group) => {
      const groupValues = values[group.id] || {};

      Object.entries(groupValues).forEach(([rowIndexStr, rowValues]) => {
        const rowIndex = parseInt(rowIndexStr);

        group.fields.forEach((field) => {
          const value = rowValues[field.id];
          const error = validateField(field, value);

          if (error) {
            hasErrors = true;
            if (!newErrors[group.id]) {
              newErrors[group.id] = {};
            }
            if (!newErrors[group.id][rowIndex]) {
              newErrors[group.id][rowIndex] = {};
            }
            newErrors[group.id][rowIndex][field.id] = error;
          }
        });
      });
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [questionnaire.fieldGroups, values, validateField]);

  const reset = useCallback(() => {
    setValues({});
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, []);

  const addRow = useCallback((groupId: string) => {
    setValues((prev) => {
      const groupValues = prev[groupId] || {};
      const maxRowIndex = Math.max(...Object.keys(groupValues).map(Number), -1);
      const newRowIndex = maxRowIndex + 1;

      return {
        ...prev,
        [groupId]: {
          ...groupValues,
          [newRowIndex]: {},
        },
      };
    });
  }, []);

  const removeRow = useCallback((groupId: string, rowIndex: number) => {
    setValues((prev) => {
      const groupValues = { ...prev[groupId] };
      delete groupValues[rowIndex];
      return {
        ...prev,
        [groupId]: groupValues,
      };
    });

    // Also remove errors for this row
    setErrors((prev) => {
      const groupErrors = { ...prev[groupId] };
      delete groupErrors[rowIndex];
      return {
        ...prev,
        [groupId]: groupErrors,
      };
    });
  }, []);

  const getFieldError = useCallback(
    (
      groupId: string,
      rowIndex: number,
      fieldId: string
    ): string | undefined => {
      return errors[groupId]?.[rowIndex]?.[fieldId];
    },
    [errors]
  );

  const isFieldTouched = useCallback(
    (groupId: string, rowIndex: number, fieldId: string): boolean => {
      return touched[groupId]?.[rowIndex]?.[fieldId] === true;
    },
    [touched]
  );

  const hasErrors = useMemo(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    getValue,
    setTouched: setTouchedField,
    setError,
    clearError,
    validateAll,
    reset,
    addRow,
    removeRow,
    getFieldError,
    isFieldTouched,
    hasErrors,
  };
}
