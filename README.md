# OnFlow React SDK

A comprehensive React SDK for building dynamic questionnaires with conditional fields, file uploads, and form validation.

## Installation

```bash
npm install @onflow/react-sdk
```

### Peer Dependencies

The SDK requires React 17+ and optionally Google Maps API for geo-location fields:

```bash
npm install @react-google-maps/api
```

## Quick Start

```tsx
import React from "react";
import { OnFlowProvider, Questionnaire } from "@onflow/react-sdk";
import "@onflow/react-sdk/dist/questionnaire.css";

function App() {
  const config = {
    baseUrl: "https://api.yourtenant.com",
    tenantId: "your-tenant-id",
    apiKey: "your-api-key",
    apiSecret: "your-api-secret",
  };

  return (
    <OnFlowProvider config={config}>
      <Questionnaire
        moduleVersionId="your-module-version-id"
        onSuccess={(data) => {
          console.log("Submission successful:", data);
          // data.residentId and data.submissionId
        }}
        onError={(error) => {
          console.error("Submission failed:", error);
        }}
      />
    </OnFlowProvider>
  );
}
```

## API Reference

### OnFlowProvider

The provider component that wraps your application and provides API configuration.

#### Props

- `config: SdkConfig` - SDK configuration object
- `children: React.ReactNode` - Child components

#### SdkConfig

```typescript
type SdkConfig = {
  baseUrl: string; // API base URL (e.g., https://api.example.com)
  tenantId: string; // Your tenant ID
  apiKey: string; // Your API key
  apiSecret: string; // Your API secret
  accessToken?: string; // Optional bearer token for OIDC
};
```

### Questionnaire

The main component that renders the questionnaire form.

#### Props

- `moduleVersionId: string` - The questionnaire/module version ID
- `onSuccess?: (data: { residentId: string; submissionId: string }) => void` - Success callback
- `onError?: (error: Error) => void` - Error callback
- `className?: string` - Additional CSS classes
- `disabled?: boolean` - Disable the entire form

#### Example

```tsx
<Questionnaire
  moduleVersionId="123e4567-e89b-12d3-a456-426614174000"
  onSuccess={(data) => {
    // Handle successful submission
    console.log("Resident ID:", data.residentId);
    console.log("Submission ID:", data.submissionId);
  }}
  onError={(error) => {
    // Handle submission error
    console.error("Error:", error.message);
  }}
  className="my-custom-class"
  disabled={false}
/>
```

## Field Types

The SDK supports the following field types:

### Text Field

Single-line text input with validation.

### Long Text Field

Multi-line textarea for longer content.

### Number Field

Numeric input with min/max validation.

### Yes/No Field

Checkbox for boolean values.

### Dropdown Field

Select dropdown with predefined options.

### Checkboxes Field

Multiple checkboxes for selecting multiple options.

### Date Field

Date picker input.

### File Field

File upload with progress tracking and validation.

### Geo Location Field

Latitude/longitude inputs (map component not included).

## Styling

### Default Styles

Import the default stylesheet for basic styling:

```tsx
import "@onflow/react-sdk/dist/questionnaire.css";
```

### Custom Styling

The SDK uses CSS classes that you can override:

```css
/* Main container */
.onflow-questionnaire {
}

/* Resident information section */
.onflow-resident-section {
}

/* Field groups */
.onflow-field-group {
}

/* Individual fields */
.onflow-field {
}

/* Field labels */
.onflow-field-label {
}

/* Input elements */
.onflow-field-input {
}

/* Error messages */
.onflow-field-error {
}

/* Submit button */
.onflow-submit-button {
}

/* Multiple row containers */
.onflow-multiple-row {
}
```

### Responsive Design

The default styles are responsive and work on mobile devices. Key breakpoints:

- **768px and below**: Single column layout
- **480px and below**: Full-width submit button

## File Uploads

File uploads are handled automatically with a 3-step process:

1. Request signed upload URL from API
2. Upload file directly to S3
3. Update file status to "uploaded"

### File Validation

Files are validated against field constraints:

- **File size**: Maximum size in MB
- **File types**: Allowed MIME types or extensions
- **Multiple files**: Support for single or multiple file uploads

### Example File Field Configuration

```typescript
{
  type: "file",
  label: "Upload Document",
  config: {
    fileTypes: ["pdf", "doc", "docx"],
    maxSize: 10, // 10MB
    multiple: false,
    isSensitive: true
  }
}
```

## Conditional Fields

Fields and groups can be conditionally shown based on other field values.

### Supported Operators

- `equals` - Field value equals specified value
- `not_equals` - Field value does not equal specified value
- `gt` - Field value is greater than specified value
- `gte` - Field value is greater than or equal to specified value
- `lt` - Field value is less than specified value
- `lte` - Field value is less than or equal to specified value
- `is_true` - Field value is true
- `is_false` - Field value is false
- `contains` - Field value contains specified value
- `not_contains` - Field value does not contain specified value

### Example Conditional Field

```typescript
{
  id: "follow_up_question",
  label: "Follow-up Question",
  type: "text",
  condition: {
    and: [{
      fieldId: "main_question",
      operator: "equals",
      value: "yes"
    }]
  }
}
```

## Error Handling

The SDK provides comprehensive error handling:

### Validation Errors

- Required field validation
- Type-specific validation (email, number ranges)
- File upload validation
- Custom validation rules

### API Errors

- Network errors
- Authentication errors
- Server errors
- File upload errors

### Error Display

Errors are displayed inline with fields and at the form level:

```tsx
<Questionnaire
  onError={(error) => {
    // Log error for debugging
    console.error("Form error:", error);

    // Show user-friendly message
    showNotification("Submission failed. Please try again.");
  }}
/>
```

## TypeScript Support

The SDK is fully typed with TypeScript definitions included.

### Key Types

```typescript
import type {
  SdkConfig,
  QuestionnaireFormState,
  ValidationErrors,
  FileUploadProgress,
} from "@onflow/react-sdk";

// Form state structure
type QuestionnaireFormState = {
  [groupId: string]: {
    [rowIndex: number]: {
      [fieldId: string]: unknown;
    };
  };
};

// Validation errors
type ValidationErrors = {
  [groupId: string]: {
    [rowIndex: number]: {
      [fieldId: string]: string;
    };
  };
};
```

## Advanced Usage

### Custom Field Components

You can extend the SDK by creating custom field components:

```tsx
import { FieldComponentProps } from "@onflow/react-sdk";

function CustomField({ field, value, onChange, error }: FieldComponentProps) {
  return (
    <div className="onflow-field">
      <label className="onflow-field-label">
        {field.label}
        {field.isRequired && <span className="onflow-field-required">*</span>}
      </label>
      {/* Your custom input */}
      {error && <div className="onflow-field-error">{error}</div>}
    </div>
  );
}
```

### Form State Management

Access form state using the `useQuestionnaireForm` hook:

```tsx
import { useQuestionnaireForm } from "@onflow/react-sdk";

function CustomForm({ questionnaire }) {
  const form = useQuestionnaireForm(questionnaire);

  // Access form state
  const values = form.values;
  const errors = form.errors;
  const hasErrors = form.hasErrors;

  // Form actions
  form.setValue(groupId, rowIndex, fieldId, value);
  form.validateAll();
  form.reset();
}
```

## Troubleshooting

### Common Issues

1. **File uploads failing**: Check API credentials and file size limits
2. **Conditional fields not showing**: Verify condition syntax and field IDs
3. **Styling issues**: Ensure CSS is imported and not overridden
4. **TypeScript errors**: Update to latest SDK version

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
REACT_APP_ONFLOW_DEBUG=true
```

## Migration Guide

### From v0.1.0 to v0.2.0

The SDK has been completely rewritten with a new API:

**Before:**

```tsx
import { QuestionnaireFields, ResidentFields } from "@onflow/react-sdk";
```

**After:**

```tsx
import { Questionnaire } from "@onflow/react-sdk";
```

The new `Questionnaire` component handles both resident fields and questionnaire fields automatically.

## Support

For support and questions:

- Check the [documentation](https://docs.onflow.com)
- Open an issue on [GitHub](https://github.com/onflow/react-sdk)
- Contact support at support@onflow.com

## License

MIT License - see LICENSE file for details.
