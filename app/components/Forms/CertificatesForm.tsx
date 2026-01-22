// certificates Component
import React from "react";
import type { CertificatesFormProps } from "../../types/global";
const CertificatesForm = ({
  certificate,
  updateCertificate,
  addCertificate,
  removeCertificate,
}: CertificatesFormProps) => (
  <div className="space-y-3 mt-2">
    <label className="block text-sm font-medium text-gray-700">
      Certificates & Licenses
    </label>
    {certificate.map((cert) => (
      <div
        key={cert.id}
        className="border border-gray-200 p-3 rounded-md bg-gray-50"
      >
        <input
          placeholder="Certificate Name"
          className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={cert.name}
          onChange={(e) => updateCertificate(cert.id, "name", e.target.value)}
        />

        <input
          placeholder="YYYY"
          type="text"
          className="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={cert.date}
          onChange={(e) => updateCertificate(cert.id, "date", e.target.value)}
        />
        <div className="mt-2">
          <button
            className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            onClick={() => removeCertificate(cert.id)}
          >
            Remove
          </button>
        </div>
      </div>
    ))}
    <button
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      onClick={addCertificate}
    >
      Add Certificate
    </button>
  </div>
);
export default CertificatesForm;
