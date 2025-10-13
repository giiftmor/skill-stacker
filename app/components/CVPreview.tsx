import type {
  ReactElement,
  JSXElementConstructor,
  ReactNode,
  ReactPortal,
  Key,
} from "react";

import type { CVPreviewProps } from "../types/global";

// CV Preview Component
const CVPreview = ({
  personal,
  profile,
  skills,
  experiences,
  education,
  references,
  previewRef,
}: CVPreviewProps) => (
  <div
    className="lg:col-span-2 bg-white p-8 rounded-lg shadow hidden"
    ref={previewRef}
  >
    <div className="max-w-3xl mx-auto">
      <header className="border-b-2 border-gray-200 pb-4 mb-6 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {personal.fullName || "Your Name"}
        </h1>
        <p className="text-lg text-gray-600 mt-1">
          {personal.title || "Your Professional Title"}
        </p>
        <div className="text-sm text-gray-700 mt-2 space-x-2">
          {personal.phone && <span>{personal.phone}</span>}
          {personal.phone && personal.email && <span>|</span>}
          {personal.email && <span>{personal.email}</span>}
          {(personal.phone || personal.email) && personal.location && (
            <span>|</span>
          )}
          {personal.location && <span>{personal.location}</span>}
        </div>
      </header>

      {profile && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-1 mb-2">
            Profile
          </h2>
          <p className="text-gray-700 leading-relaxed">{profile}</p>
        </section>
      )}

      {skills.filter(Boolean).length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-1 mb-2">
            Key Skills
          </h2>
          <ul className="list-disc pl-6 text-gray-700">
            {skills
              .filter(Boolean)
              .map(
                (
                  skill:
                    | string
                    | number
                    | bigint
                    | boolean
                    | ReactElement<unknown, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | ReactPortal
                    | Promise<
                        | string
                        | number
                        | bigint
                        | boolean
                        | ReactPortal
                        | ReactElement<
                            unknown,
                            string | JSXElementConstructor<any>
                          >
                        | Iterable<ReactNode>
                        | null
                        | undefined
                      >
                    | null
                    | undefined,
                  idx: Key | null | undefined
                ) => (
                  <li key={idx} className="mb-1">
                    {skill}
                  </li>
                )
              )}
          </ul>
        </section>
      )}

      {experiences.some(
        (exp: { company: any; role: any }) => exp.company || exp.role
      ) && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-1 mb-3">
            Career History
          </h2>
          {experiences.map(
            (exp: {
              id: Key | null | undefined;
              company: any;
              role: any;
              period:
                | string
                | number
                | bigint
                | boolean
                | ReactElement<unknown, string | JSXElementConstructor<any>>
                | Iterable<ReactNode>
                | ReactPortal
                | Promise<
                    | string
                    | number
                    | bigint
                    | boolean
                    | ReactPortal
                    | ReactElement<unknown, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | null
                    | undefined
                  >
                | null
                | undefined;
              details:
                | string
                | number
                | bigint
                | boolean
                | ReactElement<unknown, string | JSXElementConstructor<any>>
                | Iterable<ReactNode>
                | ReactPortal
                | Promise<
                    | string
                    | number
                    | bigint
                    | boolean
                    | ReactPortal
                    | ReactElement<unknown, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | null
                    | undefined
                  >
                | null
                | undefined;
            }) => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {exp.company || "Company Name"} —{" "}
                      {exp.role || "Position Title"}
                    </h3>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {exp.period}
                  </span>
                </div>
                {exp.details && (
                  <p className="text-gray-700 mt-1 leading-relaxed">
                    {exp.details}
                  </p>
                )}
              </div>
            )
          )}
        </section>
      )}

      {education.some(
        (ed: { institution: any; qualification: any }) =>
          ed.institution || ed.qualification
      ) && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-1 mb-3">
            Education & Qualifications
          </h2>
          {education.map(
            (ed: {
              id: Key | null | undefined;
              institution: any;
              qualification: any;
              period:
                | string
                | number
                | bigint
                | boolean
                | ReactElement<unknown, string | JSXElementConstructor<any>>
                | Iterable<ReactNode>
                | ReactPortal
                | Promise<
                    | string
                    | number
                    | bigint
                    | boolean
                    | ReactPortal
                    | ReactElement<unknown, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | null
                    | undefined
                  >
                | null
                | undefined;
            }) => (
              <div key={ed.id} className="mb-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900">
                    {ed.institution || "Institution"} —{" "}
                    {ed.qualification || "Qualification"}
                  </h3>
                  <span className="text-sm text-gray-600 font-medium">
                    {ed.period}
                  </span>
                </div>
              </div>
            )
          )}
        </section>
      )}

      {references.filter(Boolean).length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-1 mb-2">
            References
          </h2>
          {references
            .filter(Boolean)
            .map(
              (
                ref:
                  | string
                  | number
                  | bigint
                  | boolean
                  | ReactElement<unknown, string | JSXElementConstructor<any>>
                  | Iterable<ReactNode>
                  | ReactPortal
                  | Promise<
                      | string
                      | number
                      | bigint
                      | boolean
                      | ReactPortal
                      | ReactElement<
                          unknown,
                          string | JSXElementConstructor<any>
                        >
                      | Iterable<ReactNode>
                      | null
                      | undefined
                    >
                  | null
                  | undefined,
                idx: Key | null | undefined
              ) => (
                <div key={idx} className="mb-2 text-gray-700">
                  {ref}
                </div>
              )
            )}
        </section>
      )}
    </div>
  </div>
);

export default CVPreview;
