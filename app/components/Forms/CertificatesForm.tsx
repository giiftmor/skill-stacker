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
    <label className="block text-sm font-medium text-[#e8e6e3]">
      Certificates & Licenses
    </label>
    {certificate.map((cert) => (
      <div
        key={cert.id}
        className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4"
      >
        <input
          placeholder="Certificate Name"
          className="px-3 py-2.5 bg-[#242424] border border-[#333] rounded-lg w-full text-[#e8e6e3] placeholder:text-[#666] text-sm focus:outline-none focus:border-[#d4a853] focus:ring-2 focus:ring-[#d4a85315] transition-all duration-200"
          value={cert.name}
          onChange={(e) => updateCertificate(cert.id, "name", e.target.value)}
        />

        <input
          placeholder="Date"
          className="mt-2 px-3 py-2.5 bg-[#242424] border border-[#333] rounded-lg w-full text-[#e8e6e3] placeholder:text-[#666] text-sm focus:outline-none focus:border-[#d4a853] focus:ring-2 focus:ring-[#d4a85315] transition-all duration-200"
          value={cert.date}
          onChange={(e) => updateCertificate(cert.id, "date", e.target.value)}
        />
        <div className="mt-2">
          <button
            className="px-3 py-1.5 bg-[#dc444415] text-[#dc4444] hover:bg-[#dc444425] border border-[#dc444440] rounded-lg transition-all duration-200"
            onClick={() => removeCertificate(cert.id)}
          >
            Remove
          </button>
        </div>
      </div>
    ))}
    <button
      className="px-4 py-2 bg-[#d4a85315] text-[#d4a853] hover:bg-[#d4a85325] border border-[#d4a85340] rounded-lg transition-all duration-200"
      onClick={addCertificate}
    >
      Add Certificate
    </button>
  </div>
);
export default CertificatesForm;
