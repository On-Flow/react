import type { FieldConditionOperator, FieldConditionGroup } from "../types";

export type Condition = {
  fieldId: string;
  operator: FieldConditionOperator;
  value?: string | number | boolean | null;
};

export type ConditionGroup = {
  and: Condition[];
};

/**
 * Evaluates a single condition against a value
 */
export const evaluateSingleCondition = (
  condition: Condition,
  currentValue: unknown
): boolean => {
  switch (condition.operator) {
    case "equals":
      return currentValue === condition.value;
    case "not_equals":
      return currentValue !== condition.value;
    case "gt":
      return Number(currentValue) > Number(condition.value);
    case "gte":
      return Number(currentValue) >= Number(condition.value);
    case "lt":
      return Number(currentValue) < Number(condition.value);
    case "lte":
      return Number(currentValue) <= Number(condition.value);
    case "is_true":
      return Boolean(currentValue) === true;
    case "is_false":
      return Boolean(currentValue) === false;
    case "contains":
      if (Array.isArray(currentValue)) {
        return currentValue.includes(condition.value as never);
      }
      return String(currentValue || "").includes(String(condition.value ?? ""));
    case "not_contains":
      if (Array.isArray(currentValue)) {
        return !currentValue.includes(condition.value as never);
      }
      return !String(currentValue || "").includes(
        String(condition.value ?? "")
      );
    default:
      return true;
  }
};

/**
 * Evaluates a condition group against a values object
 * For now, evaluates only the first condition in the and array
 * TODO: Implement full AND logic for multiple conditions
 */
export const evaluateConditionGroup = (
  condition: ConditionGroup | null,
  values: Record<string, unknown>
): boolean => {
  if (!condition) return true;

  const firstCondition = condition.and[0];
  if (!firstCondition) return true;

  const currentValue = values[firstCondition.fieldId];
  if (typeof currentValue === "undefined") {
    return false;
  }

  return evaluateSingleCondition(firstCondition, currentValue);
};

/**
 * Evaluates a single condition against a values object
 */
export const evaluateCondition = (
  condition: Condition | undefined,
  values: Record<string, unknown>
): boolean => {
  if (!condition) return true;
  const currentValue = values[condition.fieldId];
  return evaluateSingleCondition(condition, currentValue);
};

/**
 * Determines if a field should be visible based on its condition
 */
export const shouldShowField = (
  condition: FieldConditionGroup | null | undefined,
  values: Record<string, unknown>
): boolean => {
  if (!condition) return true;
  return evaluateConditionGroup(condition, values);
};

/**
 * Determines if a group should be visible based on its condition
 */
export const shouldShowGroup = (
  condition: FieldConditionGroup | null | undefined,
  values: Record<string, unknown>
): boolean => {
  if (!condition) return true;
  return evaluateConditionGroup(condition, values);
};

/**
 * Flattens nested form values to a flat object for condition evaluation
 * Handles both single and multiple row groups
 */
export const flattenFormValues = (
  values: Record<string, Record<number, Record<string, unknown>>>
): Record<string, unknown> => {
  const flattened: Record<string, unknown> = {};

  Object.entries(values).forEach(([groupId, groupValues]) => {
    Object.entries(groupValues).forEach(([rowIndexStr, rowValues]) => {
      Object.entries(rowValues).forEach(([fieldId, value]) => {
        // For multiple row groups, we need to handle the field values differently
        // For now, we'll use the first non-empty value for condition evaluation
        const key = `${groupId}.${fieldId}`;
        if (
          flattened[key] === undefined ||
          flattened[key] === null ||
          flattened[key] === ""
        ) {
          flattened[key] = value;
        }
      });
    });
  });

  return flattened;
};
