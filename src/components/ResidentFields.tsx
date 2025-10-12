import React from "react";
import type { ResidentWrite } from "../types";

export type ResidentFieldsProps = {
  value: Partial<ResidentWrite>;
  onChange: (value: Partial<ResidentWrite>) => void;
};

export function ResidentFields({ value, onChange }: ResidentFieldsProps) {
  const update = (k: keyof ResidentWrite, v: string) => onChange({ ...value, [k]: v });
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label>
        <div>First name</div>
        <input value={value.firstName || ""} onChange={(e) => update("firstName", e.target.value)} />
      </label>
      <label>
        <div>Last name</div>
        <input value={value.lastName || ""} onChange={(e) => update("lastName", e.target.value)} />
      </label>
      <label>
        <div>Email</div>
        <input type="email" value={value.email || ""} onChange={(e) => update("email", e.target.value)} />
      </label>
      <label>
        <div>Phone</div>
        <input value={value.phone || ""} onChange={(e) => update("phone", e.target.value)} />
      </label>
      <label>
        <div>Address line 1</div>
        <input value={value.addressLine1 || ""} onChange={(e) => update("addressLine1", e.target.value)} />
      </label>
      <label>
        <div>Address line 2</div>
        <input value={value.addressLine2 || ""} onChange={(e) => update("addressLine2", e.target.value)} />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label>
          <div>City</div>
          <input value={value.city || ""} onChange={(e) => update("city", e.target.value)} />
        </label>
        <label>
          <div>Post code</div>
          <input value={value.postCode || ""} onChange={(e) => update("postCode", e.target.value)} />
        </label>
      </div>
    </div>
  );
}
