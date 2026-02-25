"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { de } from "date-fns/locale";

/* ----------------------- Types ----------------------- */

interface ConfirmationProps {
  onNext: (data: any) => void;
  onBack: () => void;
  formData: any;
}

/* ---------------- Reusable Components ---------------- */

function AccordionSection({
  title,
  children,
  defaultOpen = false,
  headerClassName = "",
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  headerClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{ backgroundColor: open ? '#e68900' : '#ff9800' }}
        className={`w-full flex justify-between items-center px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-bold transition-colors text-white
          ${headerClassName}`}
      >
        {title}
        <span className="text-xl sm:text-2xl font-bold">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}
interface FieldProps {
  label: string;
  value?: any;
  capitalizeFirst?: boolean; // add this
}

function Field({ label, value, capitalizeFirst }: FieldProps) {
  const displayValue = value
    ? capitalizeFirst
      ? String(value).charAt(0).toUpperCase() + String(value).slice(1)
      : value
    : "";
  return (
    <div className="space-y-1.5 sm:space-y-2.5">
      <Label className="text-xs sm:text-sm font-semibold text-gray-800">
        {label}
      </Label>
      <input
        disabled
        value={displayValue}
        className="w-full h-10 sm:h-12 rounded-lg border border-gray-300 px-3 sm:px-4 bg-gray-50 text-sm sm:text-base text-gray-700"
      />
    </div>
  );
}

/* -------------------- Main Page ---------------------- */

export function Confirmation({ onNext, onBack, formData }: ConfirmationProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Retrieve data from sessionStorage
  const [sessionData, setSessionData] = useState<any>(null);
  
  useEffect(() => {
    const storedData = sessionStorage.getItem('loanApplicationData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setSessionData(parsed);
        console.log('Retrieved from sessionStorage:', parsed);
      } catch (e) {
        console.error('Failed to parse sessionStorage data:', e);
      }
    }
  }, []);
  
  // Use sessionStorage data if available, otherwise fallback to formData
  const allData = sessionData || formData || {};
  
  // Loan details are stored at root level
  const loanData = {
    loanType: allData?.loanType,
    loanSector: allData?.loanSector,
    loanSubSector: allData?.loanSubSector,
    loanSubSectorCategory: allData?.loanSubSectorCategory,
    loanAmount: allData?.loanAmount,
    loanPurpose: allData?.loanPurpose,
    tenure: allData?.tenure,
    interestRate: allData?.interestRate,
  };
  
  const personalData = allData?.personalDetails || {};
  const coBorrowerData = allData?.coBorrowers || [];
  const securityData = allData?.securityDetails?.[0] || allData?.securityDetails || {};
  const repaymentData = allData?.repaymentSource || {};
  
  console.log('Confirmation page data:', {
    loanData,
    personalData,
    coBorrowerData,
    securityData,
    repaymentData,
  });

  /* ---------------- Payload Builder ---------------- */

  const buildBilPayload = () => ({
    loanData: {
      loanType: loanData.loanType,
      loanSector: loanData.loanSector,
      loanSubSector: loanData.loanSubSector,
      loanSubSectorCategory: loanData.loanSubSectorCategory,
      loanAmount: loanData.loanAmount,
      loanPurpose: loanData.loanPurpose,
      tenure: loanData.tenure,
      interestRate: loanData.interestRate,
    },
    personalData: {
      salutation: personalData.salutation,
      applicantName: personalData.applicantName,
      nationality: personalData.nationality,
      cid: personalData.identificationNo,
      issueDate: personalData.identificationIssueDate,
      expiryDate: personalData.identificationExpiryDate,
      gender: personalData.gender,
      dob: personalData.dateOfBirth,
      maritalStatus: personalData.maritalStatus,
      tpn: personalData.tpn,
      spouseName: personalData.spouseName,
      spouseCid: personalData.spouseCid,
      spouseContact: personalData.spouseContact,
      familyTreeDocs: personalData.familyTree,
      bankName: personalData.bankName,
      bankAccount: personalData.bankAccount,
      passportPhoto: personalData.passportPhoto,
      contact: personalData.currContact,
      alternatePhone: personalData.alternatePhone,
      email: personalData.currEmail,
      permCountry: personalData.permCountry,
      permDzongkhag: personalData.permDzongkhag,
      permanentGewog: personalData.permanentGewog,
      permVillage: personalData.permVillage,
      permThram: personalData.permThram,
      permHouse: personalData.permHouse,
      currCountry: personalData.currCountry,
      currDzongkhag: personalData.currDzongkhag,
      currGewog: personalData.currGewog,
      currVillage: personalData.currVillage,
      currFlat: personalData.currFlat,
      pep: personalData.pepPerson,
      proofDoc: personalData.identificationProof,
      pepSubCategory: personalData.pepSubCategory,
      pepRelated: personalData.pepRelated,
      pepRelationship: personalData.pepRelationship,
      // pepRelatedPepCategroy:personalData.
      pepIdentificationNo: personalData.pepIdentificationNo,
      pepCategory: personalData.pepCategory,
      pepSubCat2: personalData.pepSubCat2,

      relatedToBil: personalData.relatedToBil,
      empolymentStatus: personalData.employmentStatus,
      occupation: personalData.occupation,
      organizationName: personalData.organizationName,
      employerType: personalData.employerType,
      orgLocation: personalData.orgLocation,
      employeeId: personalData.employeeId,
      joiningDate: personalData.joiningDate,
      designation: personalData.designation,
      grade: personalData.grade,
      employeeType: personalData.employeeType,
      grossIncome: personalData.annualIncome,
    },

    coBorrowerData: {
      salutation: coBorrowerData.salutation,
      name: coBorrowerData.name,
      nationality: coBorrowerData.nationality,
      identificationType: coBorrowerData.identificationType,
      cid: coBorrowerData.cid,
      pep: coBorrowerData.pep,
      pep_related: coBorrowerData.pepRelated,
      identification_proof: coBorrowerData.identificationProof,
      relationship: coBorrowerData.relationship,
      contact: coBorrowerData.alternateContactNo,
      alternatePhone: coBorrowerData.alternatePhone,
    },

    securityData: {
      securityType: securityData.securityType,
      propertyLocation: securityData.propertyLocation,
      estimatedValue: securityData.estimatedValue,
    },

    repaymentData: {
      source: repaymentData.source,
      monthlyIncome: repaymentData.monthlyIncome,
    },
  });

  /* ---------------- Submit Handler ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const bilPayload = buildBilPayload();
      const fd = new FormData();

      /* 🔹 Append structured data */
      Object.entries(bilPayload).forEach(([section, data]) => {
        if (typeof data === "object" && data !== null) {
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              fd.append(`${section}[${key}]`, String(value));
            }
          });
        }
      });

      /* 🔹 Append files */
      if (personalData.passportPhotoFile instanceof File) {
        fd.append("passportPhoto", personalData.passportPhotoFile);
      }

      if (personalData.currAddressProofFile instanceof File) {
        fd.append("currentAddressProof", personalData.currAddressProofFile);
      }

      if (personalData.permAddressProofFile instanceof File) {
        fd.append("permanentAddressProof", personalData.permAddressProofFile);
      }

      /* 🔍 DEBUG */
      console.log("---- FORM DATA DEBUG ----");
      for (const [k, v] of fd.entries()) {
        console.log(k, v);
      }

      /* 🔹 API Call */
      const res = await fetch(
        "http://119.2.100.178/api/cdms/onboard-customer",
        {
          method: "POST",
          body: fd,
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "BIL submission failed");
      }

      const response = await res.json();
      console.log("BIL SUCCESS:", response);

      onNext({ confirmation: true });

      router.push("/billing");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- UI ----------------------- */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 sm:space-y-8 md:space-y-10 pt-4 sm:pt-6 md:pt-8 pb-6 sm:pb-8 md:pb-12"
    >
      <AccordionSection title="Loan Details" defaultOpen={true}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Field
            label="Loan Type"
            value={loanData.loanType}
            capitalizeFirst={true}
          />
          <Field
            label="Loan Sector"
            value={loanData.loanSector}
            capitalizeFirst={true}
          />
          <Field
            label="Loan Sub-Sector"
            value={loanData.loanSubSector}
            capitalizeFirst={true}
          />
          <Field
            label="Loan Sub-Sector Category"
            value={loanData.loanSubSectorCategory}
            capitalizeFirst={true}
          />
          <Field label="Loan Amount" value={loanData.loanAmount} />
          <Field label="Loan Purpose" value={loanData.loanPurpose} />
          <Field label="Tenure (Months)" value={loanData.tenure} />
          <Field label="Interest Rate (%)" value={loanData.interestRate} />
        </div>
      </AccordionSection>

      <AccordionSection title="Personal Details" defaultOpen>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
            Applicant Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <Field
              label="Salutation"
              value={personalData.salutation}
              capitalizeFirst={true}
            />
            <Field
              label="Applicant Name"
              value={personalData.applicantName}
              capitalizeFirst={true}
            />
            <Field
              label="Nationality"
              value={personalData.nationality}
              capitalizeFirst={true}
            />
            <Field
              label="Identification Type"
              value={personalData.identificationType}
              capitalizeFirst={true}
            />

            <Field
              label="Identification No"
              value={personalData.identificationNo}
            />
            <Field
              label="Identification Issue Date"
              value={personalData.identificationIssueDate}
            />
            <Field
              label="Identification Expiry Date"
              value={personalData.identificationExpiryDate}
            />
            <Field label="TPN" value={personalData.tpn} />
            <Field label="Date of Birth" value={personalData.dateOfBirth} />
            <Field
              label="Gender"
              value={personalData.gender}
              capitalizeFirst={true}
            />
            <Field
              label="Marital Status"
              value={personalData.maritalStatus}
              capitalizeFirst={true}
            />
          </div>
          {personalData.maritalStatus === "married" && (
            <>
              <div className="mt-6 sm:mt-8">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                  Marital Status Details
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <Field
                  label="Marital Status"
                  value={personalData.maritalStatus}
                  capitalizeFirst={true}
                />
                <Field
                  label="Spouse Name"
                  value={personalData.spouseName}
                  capitalizeFirst={true}
                />
                <Field label="Spouse CID" value={personalData.spouseCid} />
                <Field
                  label="Spouse Contact"
                  value={personalData.spouseContact}
                />
              </div>
            </>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {/* <Field
              label="Family Tree Documents"
              value={
                personalData.familyTree
                  ? personalData.familyTree.name
                  : ""
              }
            /> */}

            <Field
            label="Family Tree Documents"
            value={
              personalData.familyTree
                ? typeof personalData.familyTree === 'string' ? personalData.familyTree : personalData.familyTree.name
                : ""
            }
          />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <Field
              label="Bank Name"
              value={personalData.bankName}
              capitalizeFirst={true}
            />
            <Field label="Bank Account" value={personalData.bankAccount} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {/* <Field
              label="Passport Photo"
              value={
                personalData.passportPhotoFile
                  ? personalData.passportPhotoFile.name
                  : ""
              }
            /> */}

          <Field
            label="Passport Photo"
            value={
              personalData.passportPhoto
                ? typeof personalData.passportPhoto === 'string' ? personalData.passportPhoto : personalData.passportPhoto.name
                : ""
            }
          />
            
          </div>
          <div>
            <div>
              <h3 className="py-4 px-6 text-sm font-bold pt-15">
                Contact Details
              </h3>
              <hr />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <Field label="Contact" value={personalData.currContact} />
                <Field
                  label="Alternate Contact"
                  value={personalData.alternatePhone}
                />
                <Field label="Email" value={personalData.currEmail} />
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-8">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
              Permanent Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <Field
                label="Country"
                value={personalData.permanentCountry}
                capitalizeFirst={true}
              />
              <Field
                label="Dzongkhag/State"
                value={personalData.permanentDzongkhag}
                capitalizeFirst={true}
              />
              <Field
                label="Gewog/Province"
                value={personalData.permanentGewog}
                capitalizeFirst={true}
              />
              <Field
                label="Village/Street"
                value={personalData.permVillage}
                capitalizeFirst={true}
              />
              <Field label="Thram No." value={personalData.permThram} />
              <Field label="House No." value={personalData.permHouse} />
            </div>
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <Field
                label="Permanent Address Proof"
                value={
                  personalData.permAddressProofFile
                    ? personalData.permAddressProofFile.name
                    : ""
                }
              />
            </div> */}
          </div>

          <div className="mt-6 sm:mt-8">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
              Current Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <Field
                label="Country of Residence"
                value={personalData.currentCountry}
                capitalizeFirst={true}
              />
              <Field
                label="Dzongkhag/State"
                value={personalData.currentDzongkhag}
                capitalizeFirst={true}
              />
              <Field
                label="Gewog/Province"
                value={personalData.currentGewog}
                capitalizeFirst={true}
              />
              <Field
                label="Village/Street"
                value={personalData.currVillage}
                capitalizeFirst={true}
              />
              <Field label="Flat/House No." value={personalData.currFlat} />
            </div>
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <Field
                label="Current Address Proof"
                value={
                  personalData.currAddressProofFile
                    ? personalData.currAddressProofFile.name
                    : ""
                }
              />
            </div> */}
          </div>

          <div>
            <h3 className="py-4 px-6 text-sm font-bold pt-15">
              PEP Declarations
            </h3>
            <hr />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {/* Always show the main PEP field */}
              <Field
                label="Politically Exposed Person"
                value={personalData.pepPerson}
                capitalizeFirst={true}
              />

              {
                personalData.pepPerson ? (
                  personalData.pepPerson === "Yes" ? (
                    // If PEP = Yes, show PEP Sub-Category and file
                    <>
                      <Field
                        label="PEP Sub-Category"
                        value={personalData.pepSubCategory || "No value"}
                        capitalizeFirst={true}
                      />
                      {/* <Field
                  label="PEP Sub-Category File"
                  value={personalData.pepSubCategoryFile?.name || "No file uploaded"}
                /> */}
                    </>
                  ) : (
                    // If PEP = No, show all other fields
                    <>
                      <Field
                        label="PEP Related"
                        value={personalData.pepRelated || "No value"}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="PEP Relationship"
                        value={personalData.pepRelationship || "No value"}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="PEP Identification No"
                        value={personalData.pepIdentificationNo || "No value"}
                      />
                      <Field
                        label="PEP related PEP Category"
                        value={personalData.pepRelatedPepCategroy || "No value"}
                      />
                      <Field
                        label="PEP related PEP Subcategory"
                        value={personalData.pep_category || "No value"}
                      />
                    </>
                  )
                ) : null /* If no value, show only the main field */
              }
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <Field
                label="PEP Sub-Category File"
                value={
                  personalData.pepSubCategoryFile?.name || "No file uploaded"
                }
              />
            </div>
          </div>
          <div>
            <h3 className="py-4 px-6 text-sm font-bold pt-15">BIL Related</h3>
            <hr />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <Field
                label="BIL Related"
                value={personalData.relatedToBil}
                capitalizeFirst={true}
              />
            </div>
          </div>

          <div>
            <h3 className="py-4 px-6 text-sm font-bold pt-15">
              Employment Details
            </h3>
            <hr />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {/* Always show Employment Status */}
              <Field
                label="Employment Status"
                value={personalData.employmentStatus || ""}
                capitalizeFirst={true}
              />
            </div>

            {personalData.employmentStatus === "employed" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <Field
                    label="Employee ID"
                    value={personalData.employeeId || "No value"}
                  />
                  <Field
                    label="Occupation"
                    value={personalData.occupation || "No value"}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Employer Type"
                    value={personalData.employerType || "No value"}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Designation"
                    value={personalData.designation || "No value"}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Grade"
                    value={personalData.grade || "No value"}
                  />

                  <Field
                    label="Organization Name"
                    value={personalData.organizationName || "No value"}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Organization Location"
                    value={personalData.orgLocation || "No value"}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Service Joining Date"
                    value={personalData.joiningDate || "No value"}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <Field
                    label="Nature of Service"
                    value={personalData.serviceNature || "No value"}
                    capitalizeFirst={true}
                  />

                  {personalData.serviceNature?.toLowerCase() === "contract" && (
                    <Field
                      label="Contract End Date"
                      value={personalData.contractEndDate || "No value"}
                    />
                  )}

                  <Field
                    label="Gross Income"
                    value={personalData.annualIncome || "No value"}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="Co-Borrower Details" defaultOpen>
        {!coBorrowerData || (Array.isArray(coBorrowerData) && coBorrowerData.length === 0) ? (
          <div className="text-center py-8 text-gray-500">
            No Co-Borrower Details Available
          </div>
        ) : (
          (() => {
            const coBorrowers = Array.isArray(coBorrowerData) ? coBorrowerData : [coBorrowerData];
            return coBorrowers.map((coBorrower: any, index: number) => (
              <div key={index} className="mb-8 last:mb-0">
                {coBorrowers.length > 1 && (
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                    Co-Borrower {index + 1}
                  </h3>
                )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Field
            label="Salutation"
            value={coBorrower.salutation}
            capitalizeFirst={true}
          />
          <Field
            label="Name"
            value={coBorrower.name}
            capitalizeFirst={true}
          />
          <Field
            label="Nationality"
            value={coBorrower.nationality}
            capitalizeFirst={true}
          />
          <Field
            label="Identification Type"
            value={coBorrower.identificationType}
            capitalizeFirst={true}
          />

          <Field
            label="Identification No"
            value={coBorrower.identificationNo}
          />
          <Field
            label="Identification Issue Date"
            value={coBorrower.identificationIssueDate}
          />
          <Field
            label="Identification Expiry Date"
            value={coBorrower.identificationExpiryDate}
          />
          <Field label="TPN" value={coBorrower.tpn} />
          <Field label="Date of Birth" value={coBorrower.dateOfBirth} />
          <Field
            label="Gender"
            value={coBorrower.gender}
            capitalizeFirst={true}
          />
          <Field
            label="Marital Status"
            value={coBorrower.maritalStatus}
            capitalizeFirst={true}
          />
          <Field
            label="Relationship to Borrower"
            value={coBorrower.relationship}
            capitalizeFirst={true}
          />
        </div>
        {coBorrower.maritalStatus === "married" && (
          <>
            <div className="mt-6 sm:mt-8">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                Marital Status Details
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <Field
                label="Spouse Name"
                value={coBorrower.spouseName}
                capitalizeFirst={true}
              />
              <Field label="Spouse CID" value={coBorrower.spouseIdentificationNo} />
              <Field
                label="Spouse Contact"
                value={coBorrower.spouseContact}
              />
            </div>
          </>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <Field
            label="Family Tree Documents"
            value={
              coBorrower.familyTree
                ? typeof coBorrower.familyTree === 'string' ? coBorrower.familyTree : coBorrower.familyTree.name
                : ""
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <Field
            label="Bank Name"
            value={coBorrower.bankName}
            capitalizeFirst={true}
          />
          <Field label="Bank Account" value={coBorrower.bankAccount} />
          <Field
            label="Passport Photo"
            value={
              coBorrower.passportPhoto
                ? typeof coBorrower.passportPhoto === 'string' ? coBorrower.passportPhoto : coBorrower.passportPhoto.name
                : ""
            }
          />
        </div>

        <div>
          <h3 className="py-4 px-6 text-sm font-bold pt-15">Contact Details</h3>
          <hr />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <Field label="Contact" value={coBorrower.alternateContactNo} />
            <Field
              label="Alternate Contact"
              value={coBorrower.alternatePhone}
            />
            <Field label="Email" value={coBorrower.currEmail} />
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
            Permanent Address
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <Field
              label="Country"
              value={coBorrower.permCountry}
              capitalizeFirst={true}
            />
            <Field
              label="Dzongkhag/State"
              value={coBorrower.permDzongkhag}
              capitalizeFirst={true}
            />
            <Field
              label="Gewog/Province"
              value={coBorrower.permGewog}
              capitalizeFirst={true}
            />
            <Field
              label="Village/Street"
              value={coBorrower.permVillage}
              capitalizeFirst={true}
            />
            <Field label="Thram No." value={coBorrower.permThram} />
            <Field label="House No." value={coBorrower.permHouse} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <Field
              label="Permanent Address Proof"
              value={
                coBorrower.permAddressProof
                  ? typeof coBorrower.permAddressProof === 'string' ? coBorrower.permAddressProof : coBorrower.permAddressProof.name
                  : ""
              }
            />
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
            Current Address
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <Field
              label="Country of Residence"
              value={coBorrower.currCountry}
              capitalizeFirst={true}
            />
            <Field
              label="Dzongkhag/State"
              value={coBorrower.currDzongkhag}
              capitalizeFirst={true}
            />
            <Field
              label="Gewog/Province"
              value={coBorrower.currGewog}
              capitalizeFirst={true}
            />
            <Field
              label="Village/Street"
              value={coBorrower.currVillage}
              capitalizeFirst={true}
            />
            <Field label="Flat/House No." value={coBorrower.currFlat} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <Field
              label="Current Address Proof"
              value={
                coBorrower.currAddressProof
                  ? typeof coBorrower.currAddressProof === 'string' ? coBorrower.currAddressProof : coBorrower.currAddressProof.name
                  : ""
              }
            />
          </div>
        </div>

        <div>
          <h3 className="py-4 px-6 text-sm font-bold pt-15">BIL Related</h3>
          <hr />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <Field
              label="BIL Related"
              value={coBorrower.relatedToBil}
              capitalizeFirst={true}
            />
          </div>
        </div>
        <div>
          <h3 className="py-4 px-6 text-sm font-bold pt-15">
            PEP Declarations
          </h3>
          <hr />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <Field
              label="Politically Exposed Person"
              value={coBorrower.pepPerson}
              capitalizeFirst={true}
            />

            {
              coBorrower.pepPerson ? (
                coBorrower.pepPerson === "Yes" ? (
                  <>
                    <Field
                      label="PEP Category"
                      value={coBorrower.pepCategory || "No value"}
                      capitalizeFirst={true}
                    />
                    <Field
                      label="PEP Sub-Category"
                      value={coBorrower.pepSubCategory || "No value"}
                      capitalizeFirst={true}
                    />
                  </>
                ) : (
                  <>
                    <Field
                      label="PEP Related"
                      value={coBorrower.pepRelated || "No value"}
                      capitalizeFirst={true}
                    />
                  </>
                )
              ) : null
            }
          </div>
        </div>
        <div>
          <h3 className="py-4 px-6 text-sm font-bold pt-15">
            Employment Details
          </h3>
          <hr />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <Field
              label="Employment Status"
              value={coBorrower.employmentStatus || ""}
              capitalizeFirst={true}
            />
          </div>

          {coBorrower.employmentStatus === "employed" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <Field
                  label="Employee ID"
                  value={coBorrower.employeeId || "No value"}
                />
                <Field
                  label="Occupation"
                  value={coBorrower.occupation || "No value"}
                  capitalizeFirst={true}
                />
                <Field
                  label="Employer Type"
                  value={coBorrower.employerType || "No value"}
                  capitalizeFirst={true}
                />
                <Field
                  label="Designation"
                  value={coBorrower.designation || "No value"}
                  capitalizeFirst={true}
                />
                <Field
                  label="Grade"
                  value={coBorrower.grade || "No value"}
                />

                <Field
                  label="Organization Name"
                  value={coBorrower.organizationName || "No value"}
                  capitalizeFirst={true}
                />
                <Field
                  label="Organization Location"
                  value={coBorrower.orgLocation || "No value"}
                  capitalizeFirst={true}
                />
                <Field
                  label="Service Joining Date"
                  value={coBorrower.joiningDate || "No value"}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <Field
                  label="Nature of Service"
                  value={coBorrower.serviceNature || "No value"}
                  capitalizeFirst={true}
                />

                {coBorrower.serviceNature?.toLowerCase() === "contract" && (
                  <Field
                    label="Contract End Date"
                    value={coBorrower.contractEndDate || "No value"}
                  />
                )}

                <Field
                  label="Annual Salary"
                  value={coBorrower.annualSalary || "No value"}
                />
              </div>
            </>
          )}
        </div>
              </div>
            ));
          })()
        )}
      </AccordionSection>

      <AccordionSection title="Security Details" defaultOpen>
        {securityData.securityType?.toLowerCase() !== "not applicable" && (
          <>
            {/* COMMON HEADER */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pb-6">
              <Field
                label="Security Type"
                value={securityData.securityType || "N/A"}
                capitalizeFirst
              />
              <Field
                label="Security Ownership"
                value={securityData.ownershipType || "N/A"}
                capitalizeFirst
              />
            </div> */}

            {/* ================= LAND ================= */}
            {securityData.securityType?.toLowerCase() === "land" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pb-1">
                  <Field
                    label="Security Type"
                    value={securityData.securityType}
                    capitalizeFirst
                  />
                  <Field
                    label="Security Ownership"
                    value={securityData.ownershipType}
                    capitalizeFirst
                  />
                </div>
                <div className="pb-10">
                  <h3 className="py-4 px-6 font-bold">Land Details</h3>
                  <hr />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Field label="Thram No." value={securityData.thramNo} />
                    <Field label="Plot No." value={securityData.plotNo} />
                    <Field label="Area (Sq.Ft)" value={securityData.area} />
                    <Field label="Land Use Type" value={securityData.landUse} />
                    <Field label="Dzongkhag" value={securityData.dzongkhag} />
                    <Field label="Gewog" value={securityData.gewog} />
                    <Field
                      label="Village/Street"
                      value={securityData.village}
                    />
                    <Field label="House No." value={securityData.houseNo} />
                    <Field
                      label="Security Proof Document"
                      value={securityData.securityProof}
                    />
                  </div>

                  {/* SHOW GUARANTORS IF THIRD PARTY OWNERSHIP */}
                  {securityData.ownershipType?.toLowerCase() ===
                    "third party" && (
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                        Security Guarantor Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        <Field
                          label="Salutation"
                          value={securityData.gaurantorSalutation}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Applicant Name"
                          value={securityData.guarantorName}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Nationality"
                          value={securityData.guarantorNationality}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Identification Type"
                          value={securityData.guarantorIdentificationType}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Identification No"
                          value={securityData.guarantorIdentificationNo}
                        />
                        <Field
                          label="Identification Issue Date"
                          value={securityData.guarantorIdentificationIssueDate}
                        />
                        <Field
                          label="Identification Expiry Date"
                          value={securityData.guarantorIdentificationExpiryDate}
                        />
                        <Field label="TPN" value={securityData.guarantortpn} />
                        <Field
                          label="Date of Birth"
                          value={securityData.guarantorDateOfBirth}
                        />
                        <Field
                          label="Gender"
                          value={securityData.guarantorGender}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Marital Status"
                          value={securityData.guarantorMaritalStatus}
                          capitalizeFirst={true}
                        />
                      </div>

                      {securityData.guarantorMaritalStatus === "married" && (
                        <>
                          <div className="mt-6 sm:mt-8">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                              Marital Status Details
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                            <Field
                              label="Marital Status"
                              value={securityData.guarantorMaritalStatus}
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Spouse Name"
                              value={securityData.guarantorSpouseName}
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Spouse CID"
                              value={securityData.guarantorSpouseCid}
                            />
                            <Field
                              label="Spouse Contact"
                              value={securityData.guarantorSpouseContact}
                            />
                          </div>
                        </>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="Family Tree Documents"
                          value={
                            securityData.guarantorFamilyTreeDocs
                              ? securityData.guarantorFamilyTreeDocs.name
                              : ""
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="Bank Name"
                          value={securityData.guarantorBankName}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Bank Account"
                          value={securityData.guarantorBankAccount}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="Passport Photo"
                          value={
                            securityData.guarantorPassportPhotoFile
                              ? securityData.guarantorPassportPhotoFile.name
                              : ""
                          }
                        />
                      </div>

                      <div>
                        <h3 className="py-4 px-6 text-sm font-bold pt-15">
                          Contact Details
                        </h3>
                        <hr />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                          <Field
                            label="Contact"
                            value={securityData.guarantorCurrContact}
                          />
                          <Field
                            label="Alternate Contact"
                            value={securityData.guarantorAlternateContact}
                          />
                          <Field
                            label="Email"
                            value={securityData.guarantorCurrEmail}
                          />
                        </div>
                      </div>

                      <div className="mt-6 sm:mt-8">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                          Permanent Address
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                          <Field
                            label="Country"
                            value={securityData.guarantorPermCountry}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Dzongkhag/State"
                            value={securityData.guarantorPermDzongkhag}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Gewog/Province"
                            value={securityData.guarantorPermGewog}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Village/Street"
                            value={securityData.guarantorPermVillage}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Thram No."
                            value={securityData.guarantorPermThram}
                          />
                          <Field
                            label="House No."
                            value={securityData.guarantorPermHouse}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                          <Field
                            label="Permanent Address Proof"
                            value={
                              securityData.guarantorPermAddressProofFile
                                ? securityData.guarantorPermAddressProofFile
                                    .name
                                : ""
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-6 sm:mt-8">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                          Current Address
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                          <Field
                            label="Country of Residence"
                            value={securityData.guarantorCurrCountry}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Dzongkhag/State"
                            value={securityData.guarantorCurrDzongkhag}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Gewog/Province"
                            value={securityData.guarantorCurrGewog}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Village/Street"
                            value={securityData.guarantorCurrVillage}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Flat/House No."
                            value={securityData.guarantorCurrFlat}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                          <Field
                            label="Current Address Proof"
                            value={
                              securityData.guarantorCurrAddressProofFile
                                ? securityData.guarantorCurrAddressProofFile
                                    .name
                                : ""
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <h3 className="py-4 px-6 text-sm font-bold pt-15">
                          PEP Declarations
                        </h3>
                        <hr />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                          <Field
                            label="Politically Exposed Person"
                            value={securityData.guarantorPepPerson}
                            capitalizeFirst={true}
                          />

                          {securityData.guarantorPepPerson ? (
                            securityData.guarantorPepPerson === "Yes" ? (
                              <>
                                <Field
                                  label="PEP Sub-Category"
                                  value={
                                    securityData.guarantorPepSubCategory ||
                                    "No value"
                                  }
                                  capitalizeFirst={true}
                                />
                              </>
                            ) : (
                              <>
                                <Field
                                  label="PEP Related"
                                  value={
                                    securityData.guarantorPepRelated ||
                                    "No value"
                                  }
                                  capitalizeFirst={true}
                                />
                                <Field
                                  label="PEP Relationship"
                                  value={
                                    securityData.guarantorPepRelationship ||
                                    "No value"
                                  }
                                  capitalizeFirst={true}
                                />
                                <Field
                                  label="PEP Identification No"
                                  value={
                                    securityData.guarantorPepIdentificationNo ||
                                    "No value"
                                  }
                                />
                                <Field
                                  label="PEP related PEP Category"
                                  value={
                                    securityData.guarantorPepRelatedPepCategroy ||
                                    "No value"
                                  }
                                />
                                <Field
                                  label="PEP related PEP Subcategory"
                                  value={
                                    securityData.guarantorPep_category ||
                                    "No value"
                                  }
                                />
                              </>
                            )
                          ) : null}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                          <Field
                            label="PEP Sub-Category File"
                            value={
                              securityData.guarantorPepSubCategoryFile?.name ||
                              "No file uploaded"
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <h3 className="py-4 px-6 text-sm font-bold pt-15">
                          BIL Related
                        </h3>
                        <hr />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                          <Field
                            label="BIL Related"
                            value={securityData.guarantorBilRelated}
                            capitalizeFirst={true}
                          />
                        </div>
                      </div>

                      <div>
                        <h3 className="py-4 px-6 text-sm font-bold pt-15">
                          Employment Details
                        </h3>
                        <hr />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                          <Field
                            label="Employment Status"
                            value={securityData.guarantorEmploymentStatus || ""}
                            capitalizeFirst={true}
                          />
                        </div>

                        {securityData.guarantorEmploymentStatus ===
                          "employed" && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                              <Field
                                label="Employee ID"
                                value={
                                  securityData.guarantorEmployeeId || "No value"
                                }
                              />
                              <Field
                                label="Occupation"
                                value={
                                  securityData.guarantorOccupation || "No value"
                                }
                                capitalizeFirst={true}
                              />
                              <Field
                                label="Employer Type"
                                value={
                                  securityData.guarantorEmployerType ||
                                  "No value"
                                }
                                capitalizeFirst={true}
                              />
                              <Field
                                label="Designation"
                                value={
                                  securityData.guarantorDesignation ||
                                  "No value"
                                }
                                capitalizeFirst={true}
                              />
                              <Field
                                label="Grade"
                                value={
                                  securityData.guarantorGrade || "No value"
                                }
                              />
                              <Field
                                label="Organization Name"
                                value={
                                  securityData.guarantorOrganizationName ||
                                  "No value"
                                }
                                capitalizeFirst={true}
                              />
                              <Field
                                label="Organization Location"
                                value={
                                  securityData.guarantorOrgLocation ||
                                  "No value"
                                }
                                capitalizeFirst={true}
                              />
                              <Field
                                label="Service Joining Date"
                                value={
                                  securityData.guarantorJoiningDate ||
                                  "No value"
                                }
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                              <Field
                                label="Nature of Service"
                                value={
                                  securityData.guarantorServiceNature ||
                                  "No value"
                                }
                                capitalizeFirst={true}
                              />
                              {securityData.guarantorServiceNature?.toLowerCase() ===
                                "contract" && (
                                <Field
                                  label="Contract End Date"
                                  value={
                                    securityData.guarantorContractEndDate ||
                                    "No value"
                                  }
                                />
                              )}
                              <Field
                                label="Gross Income"
                                value={
                                  securityData.guarantorGrossIncome ||
                                  "No value"
                                }
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ================= VEHICLE ================= */}
            {securityData.securityType?.toLowerCase() === "vehicle" && (
              <div className="pb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pb-1">
                  <Field
                    label="Security Type"
                    value={securityData.securityType}
                    capitalizeFirst
                  />
                  <Field
                    label="Security Ownership"
                    value={securityData.ownershipType}
                    capitalizeFirst
                  />
                </div>
                <h3 className="py-4 px-6 font-bold">Vehicle Details</h3>
                <hr />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <Field
                    label="Vehicle Type"
                    value={securityData.vehicleType}
                  />
                  <Field label="Make/Brand" value={securityData.Brand} />
                  <Field label="Model" value={securityData.Model} />
                  <Field
                    label="Year of Manufacture"
                    value={securityData.Manufacture}
                  />
                  <Field
                    label="Registration No."
                    value={securityData.registrationNo}
                  />
                  <Field label="Chassis No." value={securityData.chassisNo} />
                  <Field label="Engine No." value={securityData.engineNo} />
                  <Field
                    label="Security Proof Document"
                    value={securityData.proofDoc}
                  />
                </div>

                {securityData.ownershipType?.toLowerCase() ===
                  "third party" && (
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                      Security Guarantor Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                      <Field
                        label="Salutation"
                        value={securityData.gaurantorSalutation}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Applicant Name"
                        value={securityData.guarantorName}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Nationality"
                        value={securityData.guarantorNationality}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Identification Type"
                        value={securityData.guarantorIdentificationType}
                        capitalizeFirst={true}
                      />

                      <Field
                        label="Identification No"
                        value={securityData.guarantorIdentificationNo}
                      />
                      <Field
                        label="Identification Issue Date"
                        value={securityData.guarantorIdentificationIssueDate}
                      />
                      <Field
                        label="Identification Expiry Date"
                        value={securityData.guarantorIdentificationExpiryDate}
                      />
                      <Field label="TPN" value={securityData.guarantortpn} />
                      <Field
                        label="Date of Birth"
                        value={securityData.guarantorDateOfBirth}
                      />
                      <Field
                        label="Gender"
                        value={securityData.guarantorGender}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Marital Status"
                        value={securityData.guarantorMaritalStatus}
                        capitalizeFirst={true}
                      />
                    </div>
                    {securityData.guarantorMaritalStatus === "married" && (
                      <>
                        <div className="mt-6 sm:mt-8">
                          <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                            Marital Status Details
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                          <Field
                            label="Marital Status"
                            value={securityData.guarantorMaritalStatus}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Spouse Name"
                            value={securityData.guarantorSpouseName}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Spouse CID"
                            value={securityData.guarantorSpouseCid}
                          />
                          <Field
                            label="Spouse Contact"
                            value={securityData.guarantorSspouseContact}
                          />
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                      <Field
                        label="Family Tree Documents"
                        value={
                          securityData.guarantorFamilyTreeDocs
                            ? securityData.guarantor.familyTreeDocs.name
                            : ""
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                      <Field
                        label="Bank Name"
                        value={securityData.guarantorBankName}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Bank Account"
                        value={securityData.guarantorBankAccount}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                      <Field
                        label="Passport Photo"
                        value={
                          securityData.guarantorPassportPhotoFile
                            ? securityData.guarantor.passportPhotoFile.name
                            : ""
                        }
                      />
                    </div>
                    <div>
                      <div>
                        <h3 className="py-4 px-6 text-sm font-bold pt-15">
                          Contact Details
                        </h3>
                        <hr />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                          <Field
                            label="Contact"
                            value={securityData.guarantorCurrContact}
                          />
                          <Field
                            label="Alternate Contact"
                            value={securityData.guarantorAlternateContact}
                          />
                          <Field
                            label="Email"
                            value={securityData.guarantorCurrEmail}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 sm:mt-8">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                        Permanent Address
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        <Field
                          label="Country"
                          value={securityData.guarantorPermCountry}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Dzongkhag/State"
                          value={securityData.guarantorPermDzongkhag}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Gewog/Province"
                          value={securityData.guarantorPermGewog}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Village/Street"
                          value={securityData.guarantorPermVillage}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Thram No."
                          value={securityData.guarantorPermThram}
                        />
                        <Field
                          label="House No."
                          value={securityData.guarantorPermHouse}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="Permanent Address Proof"
                          value={
                            securityData.guarantorPermAddressProofFile
                              ? securityData.guarantorPermAddressProofFile.name
                              : ""
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-6 sm:mt-8">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                        Current Address
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        <Field
                          label="Country of Residence"
                          value={securityData.guarantorCurrCountry}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Dzongkhag/State"
                          value={securityData.guarantorCurrDzongkhag}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Gewog/Province"
                          value={securityData.guarantorCurrGewog}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Village/Street"
                          value={securityData.guarantorCurrVillage}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Flat/House No."
                          value={securityData.guarantorCurrFlat}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="Current Address Proof"
                          value={
                            securityData.guarantorCurrAddressProofFile
                              ? securityData.guarantorCurrAddressProofFile.name
                              : ""
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="py-4 px-6 text-sm font-bold pt-15">
                        PEP Declarations
                      </h3>
                      <hr />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        {/* Always show the main PEP field */}
                        <Field
                          label="Politically Exposed Person"
                          value={securityData.guarantorPepPerson}
                          capitalizeFirst={true}
                        />

                        {
                          securityData.guarantorPepPerson ? (
                            securityData.guarantorPepPerson === "Yes" ? (
                              // If PEP = Yes, show PEP Sub-Category and file
                              <>
                                <Field
                                  label="PEP Sub-Category"
                                  value={
                                    securityData.guarantorPepSubCategory ||
                                    "No value"
                                  }
                                  capitalizeFirst={true}
                                />
                                {/* <Field
                  label="PEP Sub-Category File"
                  value={securityData.guarantor.pepSubCategoryFile?.name || "No file uploaded"}
                /> */}
                              </>
                            ) : (
                              // If PEP = No, show all other fields
                              <>
                                <Field
                                  label="PEP Related"
                                  value={
                                    securityData.guarantorPepRelated ||
                                    "No value"
                                  }
                                  capitalizeFirst={true}
                                />
                                <Field
                                  label="PEP Relationship"
                                  value={
                                    securityData.guarantorPepRelationship ||
                                    "No value"
                                  }
                                  capitalizeFirst={true}
                                />
                                <Field
                                  label="PEP Identification No"
                                  value={
                                    securityData.guarantorPepIdentificationNo ||
                                    "No value"
                                  }
                                />
                                <Field
                                  label="PEP related PEP Category"
                                  value={
                                    securityData.guarantorPepRelatedPepCategroy ||
                                    "No value"
                                  }
                                />
                                <Field
                                  label="PEP related PEP Subcategory"
                                  value={
                                    securityData.guarantorPep_category ||
                                    "No value"
                                  }
                                />
                              </>
                            )
                          ) : null /* If no value, show only the main field */
                        }
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="PEP Sub-Category File"
                          value={
                            securityData.guarantorPepSubCategoryFile?.name ||
                            "No file uploaded"
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="py-4 px-6 text-sm font-bold pt-15">
                        BIL Related
                      </h3>
                      <hr />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="BIL Related"
                          value={securityData.guarantorBilRelated}
                          capitalizeFirst={true}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="py-4 px-6 text-sm font-bold pt-15">
                        Employment Details
                      </h3>
                      <hr />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        {/* Always show Employment Status */}
                        <Field
                          label="Employment Status"
                          value={securityData.guarantorEmploymentStatus || ""}
                          capitalizeFirst={true}
                        />
                      </div>

                      {securityData.guarantorEmploymentStatus ===
                        "employed" && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                            <Field
                              label="Employee ID"
                              value={
                                securityData.guarantorEmployeeId || "No value"
                              }
                            />
                            <Field
                              label="Occupation"
                              value={
                                securityData.guarantorOccupation || "No value"
                              }
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Employer Type"
                              value={
                                securityData.guarantorEmployerType || "No value"
                              }
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Designation"
                              value={
                                securityData.guarantorDesignation || "No value"
                              }
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Grade"
                              value={securityData.guarantorGrade || "No value"}
                            />

                            <Field
                              label="Organization Name"
                              value={
                                securityData.guarantorOrganizationName ||
                                "No value"
                              }
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Organization Location"
                              value={
                                securityData.guarantorOrgLocation || "No value"
                              }
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Service Joining Date"
                              value={
                                securityData.guarantorJoiningDate || "No value"
                              }
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                            <Field
                              label="Nature of Service"
                              value={
                                securityData.guarantorServiceNature ||
                                "No value"
                              }
                            />

                            {securityData.guarantorServiceNature?.toLowerCase() ===
                              "contract" && (
                              <Field
                                label="Contract End Date"
                                value={
                                  securityData.guarantorContractEndDate ||
                                  "No value"
                                }
                              />
                            )}

                            <Field
                              label="Gross Income"
                              value={
                                securityData.guarantorGrossIncome || "No value"
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= INSURANCE ================= */}
            {securityData.securityType?.toLowerCase() === "insurance" && (
              <div className="pb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pb-1">
                  <Field
                    label="Security Type"
                    value={securityData.securityType}
                    capitalizeFirst
                  />
                  <Field
                    label="Security Ownership"
                    value={securityData.ownershipType}
                    capitalizeFirst
                  />
                </div>
                <h3 className="py-4 px-6 font-bold">Insurance Details</h3>
                <hr />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <Field
                    label="Insurance Company"
                    value={securityData.insuranceCompany}
                  />
                  <Field label="Policy No." value={securityData.policyNo} />
                  <Field
                    label="Insurance Value"
                    value={securityData.insuranceValue}
                  />
                  <Field
                    label="Start Date"
                    value={securityData.insuranceStartDate}
                  />
                  <Field
                    label="Expiry Date"
                    value={securityData.insuranceExpiryDate}
                  />
                  <Field
                    label="Security Proof Document"
                    value={securityData.proofDoc}
                  />
                </div>

                {securityData.ownershipType?.toLowerCase() ===
                  "third party" && (
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                      Security Guarantor Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                      <Field
                        label="Salutation"
                        value={securityData.gaurantorSalutation}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Applicant Name"
                        value={securityData.guarantorName}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Nationality"
                        value={securityData.guarantorNationality}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Identification Type"
                        value={securityData.guarantorIdentificationType}
                        capitalizeFirst={true}
                      />

                      <Field
                        label="Identification No"
                        value={securityData.guarantorIdentificationNo}
                      />
                      <Field
                        label="Identification Issue Date"
                        value={securityData.guarantorIdentificationIssueDate}
                      />
                      <Field
                        label="Identification Expiry Date"
                        value={securityData.guarantorIdentificationExpiryDate}
                      />
                      <Field label="TPN" value={securityData.guarantortpn} />
                      <Field
                        label="Date of Birth"
                        value={securityData.guarantorDateOfBirth}
                      />
                      <Field
                        label="Gender"
                        value={securityData.guarantorGender}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Marital Status"
                        value={securityData.guarantorMaritalStatus}
                        capitalizeFirst={true}
                      />
                    </div>
                    {securityData.guarantorMaritalStatus === "married" && (
                      <>
                        <div className="mt-6 sm:mt-8">
                          <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                            Marital Status Details
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                          <Field
                            label="Marital Status"
                            value={securityData.guarantorMaritalStatus}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Spouse Name"
                            value={securityData.guarantorSpouseName}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Spouse CID"
                            value={securityData.guarantorSpouseCid}
                          />
                          <Field
                            label="Spouse Contact"
                            value={securityData.guarantorSspouseContact}
                          />
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                      <Field
                        label="Family Tree Documents"
                        value={
                          securityData.guarantorFamilyTreeDocs
                            ? securityData.guarantor.familyTreeDocs.name
                            : ""
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                      <Field
                        label="Bank Name"
                        value={securityData.guarantorBankName}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Bank Account"
                        value={securityData.guarantorBankAccount}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                      <Field
                        label="Passport Photo"
                        value={
                          securityData.guarantorPassportPhotoFile
                            ? securityData.guarantor.passportPhotoFile.name
                            : ""
                        }
                      />
                    </div>
                    <div>
                      <div>
                        <h3 className="py-4 px-6 text-sm font-bold pt-15">
                          Contact Details
                        </h3>
                        <hr />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                          <Field
                            label="Contact"
                            value={securityData.guarantorCurrContact}
                          />
                          <Field
                            label="Alternate Contact"
                            value={securityData.guarantorAlternateContact}
                          />
                          <Field
                            label="Email"
                            value={securityData.guarantorCurrEmail}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 sm:mt-8">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                        Permanent Address
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        <Field
                          label="Country"
                          value={securityData.guarantorPermCountry}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Dzongkhag/State"
                          value={securityData.guarantorPermDzongkhag}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Gewog/Province"
                          value={securityData.guarantorPermGewog}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Village/Street"
                          value={securityData.guarantorPermVillage}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Thram No."
                          value={securityData.guarantorPermThram}
                        />
                        <Field
                          label="House No."
                          value={securityData.guarantorPermHouse}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="Permanent Address Proof"
                          value={
                            securityData.guarantorPermAddressProofFile
                              ? securityData.guarantorPermAddressProofFile.name
                              : ""
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-6 sm:mt-8">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                        Current Address
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        <Field
                          label="Country of Residence"
                          value={securityData.guarantorCurrCountry}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Dzongkhag/State"
                          value={securityData.guarantorCurrDzongkhag}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Gewog/Province"
                          value={securityData.guarantorCurrGewog}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Village/Street"
                          value={securityData.guarantorCurrVillage}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Flat/House No."
                          value={securityData.guarantorCurrFlat}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="Current Address Proof"
                          value={
                            securityData.guarantorCurrAddressProofFile
                              ? securityData.guarantorCurrAddressProofFile.name
                              : ""
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="py-4 px-6 text-sm font-bold pt-15">
                        PEP Declarations
                      </h3>
                      <hr />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        {/* Always show the main PEP field */}
                        <Field
                          label="Politically Exposed Person"
                          value={securityData.guarantorPepPerson}
                          capitalizeFirst={true}
                        />

                        {
                          securityData.guarantorPepPerson ? (
                            securityData.guarantorPepPerson === "Yes" ? (
                              // If PEP = Yes, show PEP Sub-Category and file
                              <>
                                <Field
                                  label="PEP Sub-Category"
                                  value={
                                    securityData.guarantorPepSubCategory ||
                                    "No value"
                                  }
                                  capitalizeFirst={true}
                                />
                                {/* <Field
                  label="PEP Sub-Category File"
                  value={securityData.guarantor.pepSubCategoryFile?.name || "No file uploaded"}
                /> */}
                              </>
                            ) : (
                              // If PEP = No, show all other fields
                              <>
                                <Field
                                  label="PEP Related"
                                  value={
                                    securityData.guarantorPepRelated ||
                                    "No value"
                                  }
                                  capitalizeFirst={true}
                                />
                                <Field
                                  label="PEP Relationship"
                                  value={
                                    securityData.guarantorPepRelationship ||
                                    "No value"
                                  }
                                  capitalizeFirst={true}
                                />
                                <Field
                                  label="PEP Identification No"
                                  value={
                                    securityData.guarantorPepIdentificationNo ||
                                    "No value"
                                  }
                                />
                                <Field
                                  label="PEP related PEP Category"
                                  value={
                                    securityData.guarantorPepRelatedPepCategroy ||
                                    "No value"
                                  }
                                />
                                <Field
                                  label="PEP related PEP Subcategory"
                                  value={
                                    securityData.guarantorPep_category ||
                                    "No value"
                                  }
                                />
                              </>
                            )
                          ) : null /* If no value, show only the main field */
                        }
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="PEP Sub-Category File"
                          value={
                            securityData.guarantorPepSubCategoryFile?.name ||
                            "No file uploaded"
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="py-4 px-6 text-sm font-bold pt-15">
                        BIL Related
                      </h3>
                      <hr />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="BIL Related"
                          value={securityData.guarantorBilRelated}
                          capitalizeFirst={true}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="py-4 px-6 text-sm font-bold pt-15">
                        Employment Details
                      </h3>
                      <hr />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        {/* Always show Employment Status */}
                        <Field
                          label="Employment Status"
                          value={securityData.guarantorEmploymentStatus || ""}
                          capitalizeFirst={true}
                        />
                      </div>

                      {securityData.guarantorEmploymentStatus ===
                        "employed" && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                            <Field
                              label="Employee ID"
                              value={
                                securityData.guarantorEmployeeId || "No value"
                              }
                            />
                            <Field
                              label="Occupation"
                              value={
                                securityData.guarantorOccupation || "No value"
                              }
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Employer Type"
                              value={
                                securityData.guarantorEmployerType || "No value"
                              }
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Designation"
                              value={
                                securityData.guarantorDesignation || "No value"
                              }
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Grade"
                              value={securityData.guarantorGrade || "No value"}
                            />

                            <Field
                              label="Organization Name"
                              value={
                                securityData.guarantorOrganizationName ||
                                "No value"
                              }
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Organization Location"
                              value={
                                securityData.guarantorOrgLocation || "No value"
                              }
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Service Joining Date"
                              value={
                                securityData.guarantorJoiningDate || "No value"
                              }
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                            <Field
                              label="Nature of Service"
                              value={
                                securityData.guarantorServiceNature ||
                                "No value"
                              }
                            />

                            {securityData.guarantorServiceNature?.toLowerCase() ===
                              "contract" && (
                              <Field
                                label="Contract End Date"
                                value={
                                  securityData.guarantorContractEndDate ||
                                  "No value"
                                }
                              />
                            )}

                            <Field
                              label="Gross Income"
                              value={
                                securityData.guarantorGrossIncome || "No value"
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= PENSION / PROVIDENT ================= */}
            {securityData.securityType?.toLowerCase() === "pension" && (
              <div className="pb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pb-1">
                  <Field
                    label="Security Type"
                    value={securityData.securityType}
                    capitalizeFirst
                  />
                  <Field
                    label="Security Ownership"
                    value={securityData.ownershipType}
                    capitalizeFirst
                  />
                </div>
                <h3 className="py-4 px-6 font-bold">
                  Pension & Provident Fund Details
                </h3>
                <hr />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <Field
                    label="Institution Name"
                    value={securityData.Institution}
                  />
                  <Field
                    label="Provident Fund"
                    value={securityData.Provident}
                  />
                  <Field label="Account No." value={securityData.account} />
                  <Field label="Fund Value (Nu.)" value={securityData.fund} />
                  <Field
                    label="Security Proof Document"
                    value={securityData.proofDoc}
                  />
                </div>

                {securityData.ownershipType?.toLowerCase() ===
                  "third party" && (
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                      Security Guarantor Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                      <Field
                        label="Salutation"
                        value={securityData.gaurantorSalutation}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Applicant Name"
                        value={securityData.guarantorName}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Nationality"
                        value={securityData.guarantorNationality}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Identification Type"
                        value={securityData.guarantorIdentificationType}
                        capitalizeFirst={true}
                      />

                      <Field
                        label="Identification No"
                        value={securityData.guarantorIdentificationNo}
                      />
                      <Field
                        label="Identification Issue Date"
                        value={securityData.guarantorIdentificationIssueDate}
                      />
                      <Field
                        label="Identification Expiry Date"
                        value={securityData.guarantorIdentificationExpiryDate}
                      />
                      <Field label="TPN" value={securityData.guarantortpn} />
                      <Field
                        label="Date of Birth"
                        value={securityData.guarantorDateOfBirth}
                      />
                      <Field
                        label="Gender"
                        value={securityData.guarantorGender}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Marital Status"
                        value={securityData.guarantorMaritalStatus}
                        capitalizeFirst={true}
                      />
                    </div>
                    {securityData.guarantorMaritalStatus === "married" && (
                      <>
                        <div className="mt-6 sm:mt-8">
                          <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                            Marital Status Details
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                          <Field
                            label="Marital Status"
                            value={securityData.guarantorMaritalStatus}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Spouse Name"
                            value={securityData.guarantorSpouseName}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Spouse CID"
                            value={securityData.guarantorSpouseCid}
                          />
                          <Field
                            label="Spouse Contact"
                            value={securityData.guarantorSspouseContact}
                          />
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                      <Field
                        label="Family Tree Documents"
                        value={
                          securityData.guarantorFamilyTreeDocs
                            ? securityData.guarantor.familyTreeDocs.name
                            : ""
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                      <Field
                        label="Bank Name"
                        value={securityData.guarantorBankName}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Bank Account"
                        value={securityData.guarantorBankAccount}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                      <Field
                        label="Passport Photo"
                        value={
                          securityData.guarantorPassportPhotoFile
                            ? securityData.guarantor.passportPhotoFile.name
                            : ""
                        }
                      />
                    </div>
                    <div>
                      <div>
                        <h3 className="py-4 px-6 text-sm font-bold pt-15">
                          Contact Details
                        </h3>
                        <hr />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                          <Field
                            label="Contact"
                            value={securityData.guarantorCurrContact}
                          />
                          <Field
                            label="Alternate Contact"
                            value={securityData.guarantorAlternateContact}
                          />
                          <Field
                            label="Email"
                            value={securityData.guarantorCurrEmail}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 sm:mt-8">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                        Permanent Address
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        <Field
                          label="Country"
                          value={securityData.guarantorPermCountry}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Dzongkhag/State"
                          value={securityData.guarantorPermDzongkhag}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Gewog/Province"
                          value={securityData.guarantorPermGewog}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Village/Street"
                          value={securityData.guarantorPermVillage}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Thram No."
                          value={securityData.guarantorPermThram}
                        />
                        <Field
                          label="House No."
                          value={securityData.guarantorPermHouse}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="Permanent Address Proof"
                          value={
                            securityData.guarantorPermAddressProofFile
                              ? securityData.guarantorPermAddressProofFile.name
                              : ""
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-6 sm:mt-8">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                        Current Address
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        <Field
                          label="Country of Residence"
                          value={securityData.guarantorCurrCountry}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Dzongkhag/State"
                          value={securityData.guarantorCurrDzongkhag}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Gewog/Province"
                          value={securityData.guarantorCurrGewog}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Village/Street"
                          value={securityData.guarantorCurrVillage}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Flat/House No."
                          value={securityData.guarantorCurrFlat}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="Current Address Proof"
                          value={
                            securityData.guarantorCurrAddressProofFile
                              ? securityData.guarantorCurrAddressProofFile.name
                              : ""
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="py-4 px-6 text-sm font-bold pt-15">
                        PEP Declarations
                      </h3>
                      <hr />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        {/* Always show the main PEP field */}
                        <Field
                          label="Politically Exposed Person"
                          value={securityData.guarantorPepPerson}
                          capitalizeFirst={true}
                        />

                        {
                          securityData.guarantorPepPerson ? (
                            securityData.guarantorPepPerson === "Yes" ? (
                              // If PEP = Yes, show PEP Sub-Category and file
                              <>
                                <Field
                                  label="PEP Sub-Category"
                                  value={
                                    securityData.guarantorPepSubCategory ||
                                    "No value"
                                  }
                                  capitalizeFirst={true}
                                />
                                {/* <Field
                  label="PEP Sub-Category File"
                  value={securityData.guarantor.pepSubCategoryFile?.name || "No file uploaded"}
                /> */}
                              </>
                            ) : (
                              // If PEP = No, show all other fields
                              <>
                                <Field
                                  label="PEP Related"
                                  value={
                                    securityData.guarantorPepRelated ||
                                    "No value"
                                  }
                                  capitalizeFirst={true}
                                />
                                <Field
                                  label="PEP Relationship"
                                  value={
                                    securityData.guarantorPepRelationship ||
                                    "No value"
                                  }
                                  capitalizeFirst={true}
                                />
                                <Field
                                  label="PEP Identification No"
                                  value={
                                    securityData.guarantorPepIdentificationNo ||
                                    "No value"
                                  }
                                />
                                <Field
                                  label="PEP related PEP Category"
                                  value={
                                    securityData.guarantorPepRelatedPepCategroy ||
                                    "No value"
                                  }
                                />
                                <Field
                                  label="PEP related PEP Subcategory"
                                  value={
                                    securityData.guarantorPep_category ||
                                    "No value"
                                  }
                                />
                              </>
                            )
                          ) : null /* If no value, show only the main field */
                        }
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="PEP Sub-Category File"
                          value={
                            securityData.guarantorPepSubCategoryFile?.name ||
                            "No file uploaded"
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="py-4 px-6 text-sm font-bold pt-15">
                        BIL Related
                      </h3>
                      <hr />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="BIL Related"
                          value={securityData.guarantorBilRelated}
                          capitalizeFirst={true}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="py-4 px-6 text-sm font-bold pt-15">
                        Employment Details
                      </h3>
                      <hr />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        {/* Always show Employment Status */}
                        <Field
                          label="Employment Status"
                          value={securityData.guarantorEmploymentStatus || ""}
                          capitalizeFirst={true}
                        />
                      </div>

                      {securityData.guarantorEmploymentStatus ===
                        "employed" && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                            <Field
                              label="Employee ID"
                              value={
                                securityData.guarantorEmployeeId || "No value"
                              }
                            />
                            <Field
                              label="Occupation"
                              value={
                                securityData.guarantorOccupation || "No value"
                              }
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Employer Type"
                              value={
                                securityData.guarantorEmployerType || "No value"
                              }
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Designation"
                              value={
                                securityData.guarantorDesignation || "No value"
                              }
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Grade"
                              value={securityData.guarantorGrade || "No value"}
                            />

                            <Field
                              label="Organization Name"
                              value={
                                securityData.guarantorOrganizationName ||
                                "No value"
                              }
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Organization Location"
                              value={
                                securityData.guarantorOrgLocation || "No value"
                              }
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Service Joining Date"
                              value={
                                securityData.guarantorJoiningDate || "No value"
                              }
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                            <Field
                              label="Nature of Service"
                              value={
                                securityData.guarantorServiceNature ||
                                "No value"
                              }
                              capitalizeFirst={true}

                              />
                            {securityData.guarantorServiceNature?.toLowerCase() ===
                              "contract" && (
                              <Field
                                label="Contract End Date"
                                value={
                                  securityData.guarantorContractEndDate ||
                                  "No value"
                                }
                              />
                            )}

                            <Field
                              label="Gross Income"
                              value={
                                securityData.guarantorGrossIncome || "No value"
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </AccordionSection>

      <AccordionSection title="Repayment Source" defaultOpen>
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Field label="Source" value={repaymentData.source} capitalizeFirst={true} />
          <Field label="Monthly Income" value={repaymentData.monthlyIncome} />
        </div> */}

        <div>
          <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
            INCOME DETAILS
          </h2>

          {(() => {
            const incomeItems = [
              {
                key: "enableMonthlySalary",
                label: "Monthly Salary",
                valueKey: "monthlySalary",
                proofKey: "monthlySalaryProof",
              },
              {
                key: "enableRentalIncome",
                label: "Rental Income",
                valueKey: "rentalIncome",
                proofKey: "rentalIncomeProof",
              },
              {
                key: "enableBusinessIncome",
                label: "Business Income",
                valueKey: "businessIncome",
                proofKey: "businessIncomeProof",
              },
              {
                key: "enableVehicleHiring",
                label: "Vehicle Hiring Income",
                valueKey: "vehicleHiringIncome",
                proofKey: "vehicleHiringIncomeProof",
              },
              {
                key: "enableDividendIncome",
                label: "Dividend Income",
                valueKey: "dividendIncome",
                proofKey: "dividendIncomeProof",
              },
              {
                key: "enableAgricultureIncome",
                label: "Agriculture Income",
                valueKey: "agricultureIncome",
                proofKey: "agricultureIncomeProof",
              },
              {
                key: "enableTruckTaxiIncome",
                label: "Truck/Taxi Income",
                valueKey: "truckTaxiIncome",
                proofKey: "truckTaxiIncomeProof",
              },
            ];

            // Filter only selected sources
            const selectedIncome = incomeItems.filter(
              (item) => repaymentData?.incomeData?.[item.key] || repaymentData?.[item.key],
            );

            // If none selected, show default N/A row
            if (selectedIncome.length === 0) {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  <Field label="Source" value="N/A" capitalizeFirst={true} />
                  <Field label="Monthly Income" value="N/A" />
                  <Field label="Repayment Proof" value="N/A" />
                </div>
              );
            }

            // Display all selected sources
            return selectedIncome.map((item) => (
              <div
                key={item.key}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
              >
                <Field
                  label="Source"
                  value={item.label}
                  capitalizeFirst={true}
                />
                <Field
                  label="Monthly Income"
                  value={repaymentData?.incomeData?.[item.valueKey] || repaymentData?.[item.valueKey] || "N/A"}
                />
                <Field
                  label="Repayment Proof"
                  value={
                    (repaymentData?.incomeData?.[item.proofKey]?.name || 
                    repaymentData?.[item.proofKey]?.name || 
                    (typeof (repaymentData?.incomeData?.[item.proofKey] || repaymentData?.[item.proofKey]) === 'string' 
                      ? (repaymentData?.incomeData?.[item.proofKey] || repaymentData?.[item.proofKey])
                      : "No file uploaded"))
                  }
                />
              </div>
            ));
          })()}
          <h2 className="text-md font-bold border-b border-gray-200 pb-4 pt-15">
            Repayment Guarantor Details
          </h2>

          {/* Show if yes/no selection exists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pt-5">
            <Field
              label="Is Repayment Guarantor Applicable?"
              value={repaymentData.repaymentGuarantor}
              capitalizeFirst={true}
            />
          </div>

          {/* Only show details if yes */}
          {repaymentData?.incomeData?.repaymentGuarantor?.toLowerCase() ===
            "yes" && (
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                Repayment Guarantor Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <Field
                  label="Salutation"
                  value={repaymentData.gaurantorSalutation}
                  capitalizeFirst={true}
                />
                <Field
                  label="Applicant Name"
                  value={repaymentData.guarantorName}
                  capitalizeFirst={true}
                />
                <Field
                  label="Nationality"
                  value={repaymentData.guarantorNationality}
                  capitalizeFirst={true}
                />
                <Field
                  label="Identification Type"
                  value={repaymentData.guarantorIdentificationType}
                  capitalizeFirst={true}
                />

                <Field
                  label="Identification No"
                  value={repaymentData.guarantorIdentificationNo}
                />
                <Field
                  label="Identification Issue Date"
                  value={repaymentData.guarantorIdentificationIssueDate}
                />
                <Field
                  label="Identification Expiry Date"
                  value={repaymentData.guarantorIdentificationExpiryDate}
                />
                <Field label="TPN" value={repaymentData.guarantortpn} />
                <Field
                  label="Date of Birth"
                  value={repaymentData.guarantorDateOfBirth}
                />
                <Field
                  label="Gender"
                  value={repaymentData.guarantorGender}
                  capitalizeFirst={true}
                />
                <Field
                  label="Marital Status"
                  value={repaymentData.guarantorMaritalStatus}
                  capitalizeFirst={true}
                />
              </div>
              {repaymentData.guarantorMaritalStatus === "married" && (
                <>
                  <div className="mt-6 sm:mt-8">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                      Marital Status Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    <Field
                      label="Marital Status"
                      value={repaymentData.guarantorMaritalStatus}
                      capitalizeFirst={true}
                    />
                    <Field
                      label="Spouse Name"
                      value={repaymentData.guarantorSpouseName}
                      capitalizeFirst={true}
                    />
                    <Field
                      label="Spouse CID"
                      value={repaymentData.guarantorSpouseCid}
                    />
                    <Field
                      label="Spouse Contact"
                      value={repaymentData.guarantorSspouseContact}
                    />
                  </div>
                </>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <Field
                  label="Family Tree Documents"
                  value={
                    repaymentData.guarantorFamilyTreeDocs
                      ? repaymentData.guarantor.familyTreeDocs.name
                      : ""
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <Field
                  label="Bank Name"
                  value={repaymentData.guarantorBankName}
                  capitalizeFirst={true}
                />
                <Field
                  label="Bank Account"
                  value={repaymentData.guarantorBankAccount}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <Field
                  label="Passport Photo"
                  value={
                    repaymentData.guarantorPassportPhotoFile
                      ? repaymentData.guarantor.passportPhotoFile.name
                      : ""
                  }
                />
              </div>
              <div>
                <div>
                  <h3 className="py-4 px-6 text-sm font-bold pt-15">
                    Contact Details
                  </h3>
                  <hr />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Field
                      label="Contact"
                      value={repaymentData.guarantorCurrContact}
                    />
                    <Field
                      label="Alternate Contact"
                      value={repaymentData.guarantorAlternateContact}
                    />
                    <Field
                      label="Email"
                      value={repaymentData.guarantorCurrEmail}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 sm:mt-8">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                  Permanent Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  <Field
                    label="Country"
                    value={repaymentData.guarantorPermCountry}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Dzongkhag/State"
                    value={repaymentData.guarantorPermDzongkhag}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Gewog/Province"
                    value={repaymentData.guarantorPermGewog}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Village/Street"
                    value={repaymentData.guarantorPermVillage}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Thram No."
                    value={repaymentData.guarantorPermThram}
                  />
                  <Field
                    label="House No."
                    value={repaymentData.guarantorPermHouse}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <Field
                    label="Permanent Address Proof"
                    value={
                      repaymentData.guarantorPermAddressProofFile
                        ? repaymentData.guarantorPermAddressProofFile.name
                        : ""
                    }
                  />
                </div>
              </div>

              <div className="mt-6 sm:mt-8">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                  Current Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  <Field
                    label="Country of Residence"
                    value={repaymentData.guarantorCurrCountry}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Dzongkhag/State"
                    value={repaymentData.guarantorCurrDzongkhag}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Gewog/Province"
                    value={repaymentData.guarantorCurrGewog}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Village/Street"
                    value={repaymentData.guarantorCurrVillage}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Flat/House No."
                    value={repaymentData.guarantorCurrFlat}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <Field
                    label="Current Address Proof"
                    value={
                      repaymentData.guarantorCurrAddressProofFile
                        ? repaymentData.guarantorCurrAddressProofFile.name
                        : ""
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="py-4 px-6 text-sm font-bold pt-15">
                  PEP Declarations
                </h3>
                <hr />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {/* Always show the main PEP field */}
                  <Field
                    label="Politically Exposed Person"
                    value={repaymentData.guarantorPepPerson}
                    capitalizeFirst={true}
                  />

                  {
                    repaymentData.guarantorPepPerson ? (
                      repaymentData.guarantorPepPerson === "Yes" ? (
                        // If PEP = Yes, show PEP Sub-Category and file
                        <>
                          <Field
                            label="PEP Sub-Category"
                            value={
                              repaymentData.guarantorPepSubCategory ||
                              "No value"
                            }
                            capitalizeFirst={true}
                          />
                          {/* <Field
                  label="PEP Sub-Category File"
                  value={repaymentData.guarantor.pepSubCategoryFile?.name || "No file uploaded"}
                /> */}
                        </>
                      ) : (
                        // If PEP = No, show all other fields
                        <>
                          <Field
                            label="PEP Related"
                            value={
                              repaymentData.guarantorPepRelated || "No value"
                            }
                            capitalizeFirst={true}
                          />
                          <Field
                            label="PEP Relationship"
                            value={
                              repaymentData.guarantorPepRelationship ||
                              "No value"
                            }
                            capitalizeFirst={true}
                          />
                          <Field
                            label="PEP Identification No"
                            value={
                              repaymentData.guarantorPepIdentificationNo ||
                              "No value"
                            }
                          />
                          <Field
                            label="PEP related PEP Category"
                            value={
                              repaymentData.guarantorPepRelatedPepCategroy ||
                              "No value"
                            }
                          />
                          <Field
                            label="PEP related PEP Subcategory"
                            value={
                              repaymentData.guarantorPep_category || "No value"
                            }
                          />
                        </>
                      )
                    ) : null /* If no value, show only the main field */
                  }
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <Field
                    label="PEP Sub-Category File"
                    value={
                      repaymentData.guarantorPepSubCategoryFile?.name ||
                      "No file uploaded"
                    }
                  />
                </div>
              </div>
              <div>
                <h3 className="py-4 px-6 text-sm font-bold pt-15">
                  BIL Related
                </h3>
                <hr />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <Field
                    label="BIL Related"
                    value={repaymentData.guarantorBilRelated}
                    capitalizeFirst={true}
                  />
                </div>
              </div>

              <div>
                <h3 className="py-4 px-6 text-sm font-bold pt-15">
                  Employment Details
                </h3>
                <hr />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {/* Always show Employment Status */}
                  <Field
                    label="Employment Status"
                    value={repaymentData.guarantorEmploymentStatus || ""}
                    capitalizeFirst={true}
                  />
                </div>

                {repaymentData.guarantorEmploymentStatus === "employed" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                      <Field
                        label="Employee ID"
                        value={repaymentData.guarantorEmployeeId || "No value"}
                      />
                      <Field
                        label="Occupation"
                        value={repaymentData.guarantorOccupation || "No value"}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Employer Type"
                        value={
                          repaymentData.guarantorEmployerType || "No value"
                        }
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Designation"
                        value={repaymentData.guarantorDesignation || "No value"}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Grade"
                        value={repaymentData.guarantorGrade || "No value"}
                      />

                      <Field
                        label="Organization Name"
                        value={
                          repaymentData.guarantorOrganizationName || "No value"
                        }
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Organization Location"
                        value={repaymentData.guarantorOrgLocation || "No value"}
                        capitalizeFirst={true}
                      />
                      <Field
                        label="Service Joining Date"
                        value={repaymentData.guarantorJoiningDate || "No value"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                      <Field
                        label="Nature of Service"
                        value={repaymentData.guarantorServiceNature || "No value"}
                        capitalizeFirst={true}
                      />

                      {repaymentData.guarantorServiceNature?.toLowerCase() ===
                        "contract" && (
                        <Field
                          label="Contract End Date"
                          value={
                            repaymentData.guarantorContractEndDate || "No value"
                          }
                        />
                      )}

                      <Field
                        label="Gross Income"
                        value={repaymentData.guarantorGrossIncome || "No value"}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </AccordionSection>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 font-medium">
          ❌ {error}
        </div>
      )}

      {/* <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>

        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Confirm & Submit"}
        </Button>
      </div> */}

      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 pt-6 sm:pt-8">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          size="lg"
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="bg-[#003DA5] hover:bg-[#002D7A] text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Confirm & Submit"}
        </Button>
      </div>
    </form>
  );
}

