import React, { useState, useRef } from "react";
import type { Field } from "../../types";
import { uploadFile, validateFile } from "../../utils/fileUpload";
import { useOnFlow } from "../../context";

export type FieldComponentProps = {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
};

export function TextField({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}: FieldComponentProps) {
  return (
    <div className={`onflow-field ${className || ""}`}>
      <label className="onflow-field-label">
        {field.label}
        {field.isRequired && <span className="onflow-field-required">*</span>}
      </label>
      <input
        type="text"
        className={`onflow-field-input ${error ? "onflow-field-input-error" : ""}`}
        value={String(value || "")}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={
          field.config.placeholder || `Enter ${field.label.toLowerCase()}`
        }
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${field.id}-error` : undefined}
      />
      {error && (
        <div
          id={`${field.id}-error`}
          className="onflow-field-error"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}

export function LongTextField({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}: FieldComponentProps) {
  return (
    <div className={`onflow-field ${className || ""}`}>
      <label className="onflow-field-label">
        {field.label}
        {field.isRequired && <span className="onflow-field-required">*</span>}
      </label>
      <textarea
        className={`onflow-field-input onflow-field-textarea ${error ? "onflow-field-input-error" : ""}`}
        value={String(value || "")}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={
          field.config.placeholder || `Enter ${field.label.toLowerCase()}`
        }
        rows={4}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${field.id}-error` : undefined}
      />
      {error && (
        <div
          id={`${field.id}-error`}
          className="onflow-field-error"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}

export function NumberField({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}: FieldComponentProps) {
  return (
    <div className={`onflow-field ${className || ""}`}>
      <label className="onflow-field-label">
        {field.label}
        {field.isRequired && <span className="onflow-field-required">*</span>}
      </label>
      <input
        type="number"
        className={`onflow-field-input ${error ? "onflow-field-input-error" : ""}`}
        value={value ? String(value) : ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : undefined)
        }
        onBlur={onBlur}
        disabled={disabled}
        min={field.config.minValue}
        max={field.config.maxValue}
        placeholder={
          field.config.placeholder || `Enter ${field.label.toLowerCase()}`
        }
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${field.id}-error` : undefined}
      />
      {error && (
        <div
          id={`${field.id}-error`}
          className="onflow-field-error"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}

export function YesNoField({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}: FieldComponentProps) {
  return (
    <div className={`onflow-field onflow-field-yesno ${className || ""}`}>
      <label className="onflow-field-label">
        <input
          type="checkbox"
          className="onflow-field-checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${field.id}-error` : undefined}
        />
        {field.label}
        {field.isRequired && <span className="onflow-field-required">*</span>}
      </label>
      {error && (
        <div
          id={`${field.id}-error`}
          className="onflow-field-error"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}

export function DropdownField({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}: FieldComponentProps) {
  return (
    <div className={`onflow-field ${className || ""}`}>
      <label className="onflow-field-label">
        {field.label}
        {field.isRequired && <span className="onflow-field-required">*</span>}
      </label>
      <select
        className={`onflow-field-input onflow-field-select ${error ? "onflow-field-input-error" : ""}`}
        value={String(value || "")}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${field.id}-error` : undefined}
      >
        <option value="">Select {field.label.toLowerCase()}</option>
        {field.config.options?.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && (
        <div
          id={`${field.id}-error`}
          className="onflow-field-error"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}

export function CheckboxesField({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}: FieldComponentProps) {
  const selectedValues = Array.isArray(value) ? value : [];

  const handleChange = (option: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, option]);
    } else {
      onChange(selectedValues.filter((v: string) => v !== option));
    }
  };

  return (
    <div className={`onflow-field ${className || ""}`}>
      <fieldset className="onflow-field-fieldset">
        <legend className="onflow-field-label">
          {field.label}
          {field.isRequired && <span className="onflow-field-required">*</span>}
        </legend>
        <div className="onflow-field-checkboxes">
          {field.config.options?.map((option, index) => (
            <label key={index} className="onflow-field-checkbox-label">
              <input
                type="checkbox"
                className="onflow-field-checkbox"
                checked={selectedValues.includes(option)}
                onChange={(e) => handleChange(option, e.target.checked)}
                onBlur={onBlur}
                disabled={disabled}
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? `${field.id}-error` : undefined}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <div
          id={`${field.id}-error`}
          className="onflow-field-error"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}

export function DateField({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}: FieldComponentProps) {
  return (
    <div className={`onflow-field ${className || ""}`}>
      <label className="onflow-field-label">
        {field.label}
        {field.isRequired && <span className="onflow-field-required">*</span>}
      </label>
      <input
        type="date"
        className={`onflow-field-input ${error ? "onflow-field-input-error" : ""}`}
        value={String(value || "")}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${field.id}-error` : undefined}
      />
      {error && (
        <div
          id={`${field.id}-error`}
          className="onflow-field-error"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}

export function FileField({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}: FieldComponentProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { client } = useOnFlow();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file
    const validationError = validateFile(file, field);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const fileId = await uploadFile(file, client.http, {
        name: file.name,
        size: file.size,
        mimeType: file.type,
        isSensitive: field.config.isSensitive ?? true,
      });

      onChange(fileId);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`onflow-field ${className || ""}`}>
      <label className="onflow-field-label">
        {field.label}
        {field.isRequired && <span className="onflow-field-required">*</span>}
      </label>

      <div className="onflow-field-file">
        <input
          ref={fileInputRef}
          type="file"
          className="onflow-field-file-input"
          onChange={handleFileChange}
          onBlur={onBlur}
          disabled={disabled || uploading}
          accept={field.config.fileTypes?.join(",")}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${field.id}-error` : undefined}
        />

        {value ? (
          <div className="onflow-field-file-info">
            <span className="onflow-field-file-name">File uploaded</span>
            <button
              type="button"
              className="onflow-field-file-remove"
              onClick={handleRemoveFile}
              disabled={disabled || uploading}
            >
              Remove
            </button>
          </div>
        ) : null}

        {uploading && (
          <div className="onflow-field-file-uploading">Uploading...</div>
        )}
      </div>

      {(error || uploadError) && (
        <div
          id={`${field.id}-error`}
          className="onflow-field-error"
          role="alert"
        >
          {error || uploadError}
        </div>
      )}
    </div>
  );
}

export function GeoLocationField({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}: FieldComponentProps) {
  const geoValue =
    value && typeof value === "object"
      ? (value as { latitude?: number; longitude?: number })
      : {};

  const updateCoordinate = (coord: "latitude" | "longitude", val: string) => {
    const numValue = val ? Number(val) : undefined;
    onChange({
      ...geoValue,
      [coord]: numValue,
    });
  };

  return (
    <div className={`onflow-field ${className || ""}`}>
      <label className="onflow-field-label">
        {field.label}
        {field.isRequired && <span className="onflow-field-required">*</span>}
      </label>

      <div className="onflow-field-geo">
        <div className="onflow-field-geo-inputs">
          <input
            type="number"
            step="any"
            className={`onflow-field-input onflow-field-geo-lat ${error ? "onflow-field-input-error" : ""}`}
            placeholder="Latitude"
            value={geoValue.latitude ? String(geoValue.latitude) : ""}
            onChange={(e) => updateCoordinate("latitude", e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            aria-label="Latitude"
          />
          <input
            type="number"
            step="any"
            className={`onflow-field-input onflow-field-geo-lng ${error ? "onflow-field-input-error" : ""}`}
            placeholder="Longitude"
            value={geoValue.longitude ? String(geoValue.longitude) : ""}
            onChange={(e) => updateCoordinate("longitude", e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            aria-label="Longitude"
          />
        </div>

        <div className="onflow-field-geo-note">
          Enter coordinates manually or implement a map picker component
        </div>
      </div>

      {error && (
        <div
          id={`${field.id}-error`}
          className="onflow-field-error"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}
