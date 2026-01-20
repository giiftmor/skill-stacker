import type { ReactNode, Key } from "react";
import type { CVPreviewProps } from "../types/global";

// CV Preview Component
const CVPreview = ({
  personal,
  profile,
  skill,
  experiences,
  education,
  certificate,
  reference,
  additionalInfo,
  previewRef,
}: CVPreviewProps) => (
  <div
    className="lg:col-span-2 bg-white py-15 rounded-lg shadow"
    ref={previewRef}
  >
    <div className="max-w-3xl mx-auto font-family-{century-gothic} px-6 ">
      <header className=" pb-4 my-6 flex flex-col items-center">
        <h1 className="user-name">{personal.fullName || "Your Name"}</h1>
        <p className="professional-title">
          {personal.title || "Your Professional Title"}
        </p>
        <div className="normal-text space-x-4">
          {personal.phone && <span>{personal.phone}</span>}
          {personal.phone && personal.email && <span>|</span>}
          {personal.email && <span>{personal.email}</span>}
          {(personal.phone || personal.email) && personal.location && (
            <span>|</span>
          )}
          {personal.location && <span>{personal.location}</span>}
        </div>
        <p className="text-sm text-gray-700 mt-2 space-x-2">
          {personal.linkedin}
        </p>
      </header>

      {profile && (
        <section className="mb-6">
          {/* <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-1 mb-2">
            Profile
          </h2> */}
          <p className="text-gray-700 text-sm leading-relaxed">{profile}</p>
        </section>
      )}

      {skill.filter(Boolean).length > 0 && (
        <section className="mb-6">
          <h2 className="heading_1">Key Skills</h2>
          {/* Multi-column layout: Each column shows up to 5 skills */}
          {(() => {
            const validSkills = skill.filter(Boolean);
            const numColumns = Math.ceil(validSkills.length / 5);

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {Array.from({ length: numColumns }, (_, colIdx) => (
                  <div key={colIdx}>
                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      {validSkills
                        .slice(colIdx * 5, colIdx * 5 + 5)
                        .map((skill, idx) => (
                          <li className="normal-text" key={`${skill}-${idx}`}>
                            {skill}
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>
      )}

      {experiences.some(
        (exp: { company: any; role: any }) => exp.company || exp.role,
      ) && (
        <section className="mb-6">
          <h2 className="heading_1">Career History</h2>
          {experiences.map(
            (exp: {
              id: Key | null | undefined;
              company: any;
              role: any;
              period: ReactNode;
              details: ReactNode;
            }) => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="institution-name">
                      {exp.company || "Company Name"}
                    </h3>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {exp.period}
                  </span>
                </div>
                <h4 className=" text-gray-800 mb-3">
                  {exp.role || "Job Title"}
                </h4>
                {exp.details && <p className="normal-text">{exp.details}</p>}
              </div>
            ),
          )}
        </section>
      )}

      {education.some(
        (ed: { institution: any; qualification: any }) =>
          ed.institution || ed.qualification,
      ) && (
        <section className="mb-6 ">
          <h2 className="heading_1 text-2xl">Education & Qualifications</h2>
          {education.map(
            (ed: {
              id: Key | null | undefined;
              institution: any;
              qualification: any;
              period: ReactNode;
            }) => (
              <div key={ed.id} className="mb-3">
                <div className="flex justify-between items-start">
                  <h3 className="institution-name">
                    {ed.institution || "Institution"}
                  </h3>
                  <span className="text-sm text-gray-600 font-medium">
                    {ed.period}
                  </span>
                </div>
                <h4 className=" text-gray-800 mb-1 ">
                  {ed.qualification || "Qualification"}
                </h4>
              </div>
            ),
          )}
        </section>
      )}

      {certificate.some(
        (cert: { name: any; date: any }) => cert.name || cert.date,
      ) && (
        <section className="mb-6">
          <h2 className="heading_1">Certificates</h2>
          {certificate.map(
            (cert: {
              id: Key | null | undefined;
              name: any;
              date: ReactNode;
            }) => (
              <div key={cert.id} className="mb-3">
                <div className="flex  items-start">
                  <h3 className="font-semibold text-gray-900 uppercase">
                    {cert.name || "Institution"}
                  </h3>
                  <span className="text-sm text-gray-600 font-medium">
                    {cert.date}
                  </span>
                </div>
              </div>
            ),
          )}
        </section>
      )}

      {reference.some(
        (ref: { name: any; company: any }) => ref.name || ref.company,
      ) && (
        <section className="mb-6">
          <h2 className="heading_1">References</h2>
          {reference.map(
            (ref: {
              id: Key | null | undefined;
              name: any;
              company: any;
              role: any;
              email: any;
              phone: ReactNode;
            }) => (
              <div key={ref.id} className="mb-3">
                <div className="flex flex-col">
                  <h3 className="font-semibold text-gray-900">
                    {ref.name || "Reference available upon request"}
                  </h3>

                  <span>{ref.role || ""}</span>
                  <span className="text-sm text-gray-600 font-medium">
                    {ref.company || ""}
                  </span>

                  <a href="mailto://"></a>

                  <span>{ref.email || ""}</span>
                  <span>{ref.phone || ""}</span>
                </div>
              </div>
            ),
          )}
        </section>
      )}

      {additionalInfo.filter(Boolean).length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-1 mb-2">
            Additional Information
          </h2>
          {additionalInfo
            .filter(Boolean)
            .map((ref: ReactNode, idx: Key | null | undefined) => (
              <div key={idx} className="mb-2 text-gray-700">
                {ref}
              </div>
            ))}
        </section>
      )}

      {/* {references.filter(Boolean).length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-1 mb-2">
            References
          </h2>
          {references
            .filter(Boolean)
            .map((ref: ReactNode, idx: Key | null | undefined) => (
              <div key={idx} className="mb-2 text-gray-700">
                {ref}
              </div>
            ))}
        </section>
      )} */}
    </div>
  </div>
);

export default CVPreview;
