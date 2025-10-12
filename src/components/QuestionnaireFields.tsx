import React from "react";
import type { Questionnaire } from "../types";

export type QuestionnaireFieldsProps = {
  questionnaire: Questionnaire;
  renderField: (args: { groupId: string; fieldId: string; label: string; type: string; required: boolean }) => React.ReactNode;
};

export function QuestionnaireFields({ questionnaire, renderField }: QuestionnaireFieldsProps) {
  return (
    <div>
      {questionnaire.fieldGroups.map((group) => (
        <fieldset key={group.id} style={{ marginBottom: 16 }}>
          <legend>{group.title}</legend>
          {group.fields.map((field) => (
            <div key={field.id} style={{ marginBottom: 12 }}>
              {renderField({
                groupId: group.id,
                fieldId: field.id,
                label: field.label,
                type: field.type,
                required: field.isRequired,
              })}
            </div>
          ))}
        </fieldset>
      ))}
    </div>
  );
}
