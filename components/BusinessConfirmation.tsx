"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  UserPlus,
  Users,
  UserCheck,
} from "lucide-react";
import {
  fetchCountry,
  fetchDzongkhag,
  fetchGewogsByDzongkhag,
  fetchIdentificationType,
  fetchMaritalStatus,
  fetchBanks,
  fetchNationality,
  fetchOccupations,
  fetchLegalConstitution,
  fetchPepCategory,
  fetchPepSubCategoryByCategory,
  // No loan‑related fetches here – they are passed as props
} from "@/services/api";

/* ----------------------- Types ----------------------- */

interface ConfirmationProps {
  onNext: (data: any) => void;
  onBack: () => void;
  formData: any; // full session data

  // Loan options passed from parent (optional, but recommended)
  loanTypeOptions?: any[];
  loanSectorOptions?: any[];
  loanSubSectorOptions?: any[];
  loanSubSectorCategoryOptions?: any[];
}

// --- Constants for Uniform Styling ---
const uniformStyle =
  "h-11 w-full bg-white border border-gray-300 focus-visible:ring-1 focus-visible:ring-[#003DA5] focus-visible:border-[#003DA5] rounded-lg text-sm placeholder:text-gray-400";

const fileUploadStyle =
  "h-11 w-full bg-white border border-gray-300 rounded-lg flex items-center px-3 justify-between cursor-pointer hover:bg-gray-50 transition-colors text-sm";

// --- Helper Functions ---
const formatDateForInput = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toISOString().split("T")[0];
  } catch (e) {
    return "";
  }
};

/**
 * Extracts the numeric ID from a value that may be stored as "id-index" or just "id".
 * Example: "1-0" → "1", "2" → "2"
 */
const extractId = (value: any): string => {
  if (!value) return "";
  const str = String(value);
  const parts = str.split("-");
  return parts[0]; // take the first part before any hyphen
};

/**
 * Finds the label for a given value from an options array.
 * @param options Array of option objects
 * @param value The stored value (may contain "-index")
 * @param valueKey The key in the option object that holds the ID (e.g. "pk_id", "loan_sector_id")
 * @param labelKey The key in the option object that holds the display label (e.g. "loan_type", "loan_sector")
 */
const getOptionLabel = (
  options: any[],
  value: any,
  valueKey = "id",
  labelKey = "name",
) => {
  if (!value || !options || options.length === 0) return value || "";
  const id = extractId(value);
  const option = options.find((opt) => String(opt[valueKey]) === String(id));
  return option ? option[labelKey] : value;
};

/* -------------------- Main Page ---------------------- */

export function BusinessConfirmation({
  onNext,
  onBack,
  formData,
  loanTypeOptions = [],
  loanSectorOptions = [],
  loanSubSectorOptions = [],
  loanSubSectorCategoryOptions = [],
}: ConfirmationProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- Extract all data from the session (the provided structure) ----------
  const session = formData || {};

  // Loan details
  const loanData = {
    loanType: session.loanType || "",
    loanSector: session.loanSector || "",
    loanSubSector: session.loanSubSector || "",
    loanSubSectorCategory: session.loanSubSectorCategory || "",
    loanAmount: session.loanAmount || "",
    loanPurpose: session.loanPurpose || "",
    interestRate: session.interestRate || "",
    tenure: session.tenure || "",
  };

  // Business details (top-level fields)
  const businessData = {
    businessName: session.businessName || "",
    establishmentDate: session.establishmentDate || "",
    industryClassification: session.industryClassification || "",
    // Business identification (not present in session – leave empty or map from elsewhere if needed)
    identificationType: "",
    identificationNumber: "",
    identificationIssueDate: "",
    identificationExpiryDate: "",
    identificationProofFileName: "",
    taxIdentifierType: session.taxIdentifierType || "",
    taxIdentifierNumber: session.taxIdentifierNumber || "",
    bankCurrentAccountNumber: session.bankCurrentAccountNumber || "",
    bankSavingAccountNumber: session.bankSavingAccountNumber || "",
    nameOfBank: session.nameOfBank || "",
    grossAnnualIncome: session.grossAnnualIncome || "",
    businessType: session.businessType || "",
  };

  // Business address
  const businessAddress = session.businessAddress || {
    country: "",
    dzongkhag: "",
    gewog: "",
    villageStreet: "",
    specificLocation: "",
    contactNumber: "",
    alternateContactNumber: "",
    email: "",
  };

  // Attachments (if any)
  const attachments = session.attachments || {
    familyTree: null,
    familyTreeName: "",
    supportingDoc: null,
    supportingDocName: "",
    declarationConsent: false,
  };

  // Ownership / management data (directly from session)
  const ownerData = session.ownerData || {};
  const partners = session.partners || [];
  const ceo = session.ceo || {};
  const boardMembers = session.boardMembers || [];
  const shareholders = session.shareholders || [];
  const trustees = session.trustees || [];
  const president = session.president || {};
  const headOfAgency = session.headOfAgency || {};
  const headOfNGO = session.headOfNGO || {};

  // Co‑borrowers (if needed – not displayed yet, but we keep them)
  const coBorrowers = session.coBorrowers || [];

  // Security details – take the first item (the UI currently shows only one)
  const securityData = session.securityDetails?.[0] || {};

  // Repayment source
  const repaymentData = {
    repaymentSourceType: session.businessIncome?.repaymentSourceType || "",
    monthlyIncome: session.businessIncome?.amount || "",
    proofFileName: session.businessIncome?.proofFileName || "",
  };

  // Guarantors (repayment guarantors)
  const guarantorsData = session.guarantors || [];

  // Additional guarantors (security guarantors) – not shown separately, but we keep them
  const additionalGuarantors = session.additionalGuarantors || [];

  // ---------- Fetch other dropdown options (country, banks, etc.) ----------
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([]);
  const [gewogOptions, setGewogOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<
    any[]
  >([]);
  const [banksOptions, setBanksOptions] = useState<any[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([]);
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [occupationOptions, setOccupationOptions] = useState<any[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<any[]>([]);
  const [pepCategoryOptions, setPepCategoryOptions] = useState<any[]>([]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [
          country,
          dzongkhag,
          identificationType,
          banks,
          marital,
          national,
          occ,
          org,
          pepCat,
        ] = await Promise.all([
          fetchCountry().catch(() => []),
          fetchDzongkhag().catch(() => []),
          fetchIdentificationType().catch(() => []),
          fetchBanks().catch(() => []),
          fetchMaritalStatus().catch(() => []),
          fetchNationality().catch(() => []),
          fetchOccupations().catch(() => []),
          fetchLegalConstitution().catch(() => []),
          fetchPepCategory().catch(() => []),
        ]);
        setCountryOptions(country?.data?.data || country || []);
        setDzongkhagOptions(dzongkhag?.data?.data || dzongkhag || []);
        setIdentificationTypeOptions(
          identificationType?.data?.data || identificationType || [],
        );
        setBanksOptions(banks?.data?.data || banks || []);
        setMaritalStatusOptions(marital?.data?.data || marital || []);
        setNationalityOptions(national?.data?.data || national || []);
        setOccupationOptions(occ?.data?.data || occ || []);
        setOrganizationOptions(org?.data?.data || org || []);
        setPepCategoryOptions(pepCat?.data?.data || pepCat || []);
      } catch (error) {
        console.error("Error loading form data:", error);
      }
    };
    loadAllData();
  }, []);

  const isBusinessBhutan = useMemo(() => {
    if (!businessAddress.country || countryOptions.length === 0) return false;
    const selected = countryOptions.find(
      (c: any) =>
        String(c.id || c.country_id || c.country_pk_code) ===
        String(businessAddress.country),
    );
    return (selected?.country_name || selected?.country || "")
      .toLowerCase()
      .includes("bhutan");
  }, [businessAddress.country, countryOptions]);

  useEffect(() => {
    if (isBusinessBhutan && businessAddress.dzongkhag) {
      fetchGewogsByDzongkhag(businessAddress.dzongkhag)
        .then((res) => setGewogOptions(res?.data?.data || res || []))
        .catch(() => setGewogOptions([]));
    } else {
      setGewogOptions([]);
    }
  }, [businessAddress.dzongkhag, isBusinessBhutan]);

  /* ---------------- Payload Builder (unchanged) ---------------- */
  const buildBilPayload = () => ({
    loanData: {
      loanType: loanData.loanType,
      loanSector: loanData.loanSector,
      loanSubSector: loanData.loanSubSector,
      loanSubSectorCategory: loanData.loanSubSectorCategory,
      loanAmount: loanData.loanAmount,
      loanPurpose: loanData.loanPurpose,
    },
    personalData: {
      salutation: ownerData.salutation,
      applicantName: ownerData.applicantName,
      nationality: ownerData.nationality,
      cid: ownerData.identificationNo,
      issueDate: ownerData.identificationIssueDate,
      expiryDate: ownerData.identificationExpiryDate,
      gender: ownerData.gender,
      dob: ownerData.dateOfBirth,
      maritalStatus: ownerData.maritalStatus,
      tpn: ownerData.tpn,
      spouseName: ownerData.spouseName,
      spouseCid: ownerData.spouseIdentificationNo,
      spouseContact: ownerData.spouseContact,
      familyTreeDocs: ownerData.familyTree,
      bankName: ownerData.bankName,
      bankAccount: ownerData.bankAccount,
      contact: ownerData.currContact,
      alternateContact: ownerData.currAlternateContact,
      email: ownerData.currEmail,
      permCountry: ownerData.permCountry,
      permDzongkhag: ownerData.permDzongkhag,
      permGewog: ownerData.permGewog,
      permVillage: ownerData.permVillage,
      permThram: ownerData.permThram,
      permHouse: ownerData.permHouse,
      currCountry: ownerData.currCountry,
      currDzongkhag: ownerData.currDzongkhag,
      currGewog: ownerData.currGewog,
      currVillage: ownerData.currVillage,
      currFlat: ownerData.currFlat,
      pep: ownerData.pepPerson,
      proofDoc: ownerData.identificationProof,
      pepSubCategory: ownerData.pepSubCategory,
      pepRelated: ownerData.pepRelated,
      pepRelationship: ownerData.pepRelationship,
      pepIdentificationNo: ownerData.pepIdentificationNo,
      pepCategory: ownerData.pepCategory,
      pepSubCat2: ownerData.pepSubCat2,
      bilRelated: ownerData.bilRelated,
      empolymentStatus: ownerData.employmentStatus,
      occupation: ownerData.occupation,
      organizationName: ownerData.organizationName,
      employerType: ownerData.employerType,
      orgLocation: ownerData.orgLocation,
      employeeId: ownerData.employeeId,
      joiningDate: ownerData.joiningDate,
      designation: ownerData.designation,
      grade: ownerData.grade,
      employeeType: ownerData.employeeType,
      grossIncome: ownerData.annualIncome,
    },
    coBorrowerData: coBorrowers[0] || {},
    securityData: {
      securityType: securityData.securityType,
      propertyLocation: securityData.propertyLocation,
      estimatedValue: securityData.estimatedValue,
    },
    repaymentData: {
      source: repaymentData.repaymentSourceType,
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

      Object.entries(bilPayload).forEach(([section, data]) => {
        if (typeof data === "object" && data !== null) {
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              fd.append(`${section}[${key}]`, String(value));
            }
          });
        }
      });

      // Append files if they exist (adjust paths as needed)
      if (ownerData.passportPhoto instanceof File) {
        fd.append("passportPhoto", ownerData.passportPhoto);
      }
      if (ownerData.currAddressProof instanceof File) {
        fd.append("currentAddressProof", ownerData.currAddressProof);
      }
      if (ownerData.permAddressProof instanceof File) {
        fd.append("permanentAddressProof", ownerData.permAddressProof);
      }

      const res = await fetch("https://bil.example.com/api/loan-applications", {
        method: "POST",
        body: fd,
      });

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
          className={`w-full flex justify-between items-center px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-bold transition-colors
            ${headerClassName || "bg-[#e68900] text-white hover:bg-[#e68900]"}`}
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
    capitalizeFirst?: boolean;
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

  /* -------------------- UI ----------------------- */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 sm:space-y-8 md:space-y-10 pt-4 sm:pt-6 md:pt-8 pb-6 sm:pb-8 md:pb-12"
    >
      {/* LOAN DETAILS */}
      <AccordionSection title="Loan Details" defaultOpen={true}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Field
            label="Loan Type"
            value={getOptionLabel(
              loanTypeOptions,
              loanData.loanType,
              "pk_id",
              "loan_type",
            )}
          />
          <Field
            label="Loan Sector"
            value={getOptionLabel(
              loanSectorOptions,
              loanData.loanSector,
              "loan_sector_id",
              "loan_sector",
            )}
          />
          <Field
            label="Loan Sub-Sector"
            value={getOptionLabel(
              loanSubSectorOptions,
              loanData.loanSubSector,
              "sub_sector_id",
              "sub_sector",
            )}
          />
          <Field
            label="Loan Sub-Sector Category"
            value={getOptionLabel(
              loanSubSectorCategoryOptions,
              loanData.loanSubSectorCategory,
              "sub_sector_cat_id",
              "sub_cat_sector",
            )}
          />
          <Field label="Loan Amount (Nu.)" value={loanData.loanAmount} />
          <Field label="Loan Purpose" value={loanData.loanPurpose} />
          <Field label="Interest Rate (%)" value={loanData.interestRate} />
          <Field label="Tenure (months)" value={loanData.tenure} />
        </div>
      </AccordionSection>

      {/* PERSONAL DETAILS (includes business & ownership) */}
      <AccordionSection title="Personal Details" defaultOpen>
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
          {/* --- A. BUSINESS DETAILS --- */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4">
              A. BUSINESS DETAILS
            </h2>

            {/* A1. Business Identification & Financial */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-700">
                A1. Business Identification & Financial Information
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Field
                  label="Business / Agency Name"
                  value={businessData.businessName}
                />
                <Field
                  label="Business Type"
                  value={businessData.businessType}
                />
                <Field
                  label="Establishment Date"
                  value={formatDateForInput(businessData.establishmentDate)}
                />
                <Field
                  label="Industry Classification"
                  value={businessData.industryClassification}
                />
                <Field
                  label="Identification Type"
                  value={getOptionLabel(
                    identificationTypeOptions,
                    businessData.identificationType,
                    "id",
                    "identification_type",
                  )}
                />
                <Field
                  label="Identification Number"
                  value={businessData.identificationNumber}
                />
                <Field
                  label="Identification Issue Date"
                  value={formatDateForInput(
                    businessData.identificationIssueDate,
                  )}
                />
                <Field
                  label="Identification Expiry Date"
                  value={formatDateForInput(
                    businessData.identificationExpiryDate,
                  )}
                />
                <Field
                  label="Upload Identification Proof"
                  value={businessData.identificationProofFileName}
                />
                <Field
                  label="Tax Identifier Type"
                  value={businessData.taxIdentifierType}
                />
                <Field
                  label="Tax Identifier Number"
                  value={businessData.taxIdentifierNumber}
                />
                <Field
                  label="Name of Bank"
                  value={getOptionLabel(
                    banksOptions,
                    businessData.nameOfBank,
                    "id",
                    "bank_name",
                  )}
                />
                <Field
                  label="Bank Current Account Number"
                  value={businessData.bankCurrentAccountNumber}
                />
                <Field
                  label="Gross Annual Income"
                  value={businessData.grossAnnualIncome}
                />
              </div>
            </div>

            {/* A2. Business Address */}
            <div className="space-y-6 pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-700">
                A2. Business Address
              </h3>

              <div className="grid md:grid-cols-3 gap-6">
                <Field
                  label="Country"
                  value={getOptionLabel(
                    countryOptions,
                    businessAddress.country,
                    "id",
                    "country_name",
                  )}
                />
                <Field
                  label={isBusinessBhutan ? "Dzongkhag" : "State"}
                  value={
                    isBusinessBhutan
                      ? getOptionLabel(
                          dzongkhagOptions,
                          businessAddress.dzongkhag,
                          "id",
                          "dzongkhag_name",
                        )
                      : businessAddress.dzongkhag
                  }
                />
                <Field
                  label={isBusinessBhutan ? "Gewog" : "Province"}
                  value={
                    isBusinessBhutan
                      ? getOptionLabel(
                          gewogOptions,
                          businessAddress.gewog,
                          "id",
                          "gewog_name",
                        )
                      : businessAddress.gewog
                  }
                />
                <Field
                  label={isBusinessBhutan ? "Village / Street" : "Street"}
                  value={businessAddress.villageStreet}
                />
                <Field
                  label="Specific Area / Location"
                  value={businessAddress.specificLocation}
                />
                <Field
                  label="Contact Number"
                  value={businessAddress.contactNumber}
                />
                <Field
                  label="Alternate Contact Number"
                  value={businessAddress.alternateContactNumber}
                />
                <Field label="Email Address" value={businessAddress.email} />
              </div>
            </div>
          </div>

          {/* --- B. OWNERSHIP / MANAGEMENT DETAILS --- */}
          {businessData.businessType && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4">
                B. OWNERSHIP & MANAGEMENT DETAILS
              </h2>

              {/* Owner Details (Sole Proprietorship) */}
              {businessData.businessType === "Sole Proprietorship" &&
                ownerData && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-600" /> Owner Personal
                      Details
                    </h3>
                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 mb-6">
                      <h4 className="text-xl font-bold text-gray-800 mb-6">
                        Owner Personal Information
                      </h4>
                      <div className="space-y-8">
                        {/* Personal Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <Field
                            label="Identification Type"
                            value={getOptionLabel(
                              identificationTypeOptions,
                              ownerData.identificationType,
                              "id",
                              "identification_type",
                            )}
                          />
                          <Field
                            label="Identification No."
                            value={ownerData.identificationNo}
                          />
                          <Field
                            label="Salutation"
                            value={ownerData.salutation}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Applicant Name"
                            value={ownerData.applicantName}
                          />
                          <Field
                            label="Nationality"
                            value={getOptionLabel(
                              nationalityOptions,
                              ownerData.nationality,
                              "id",
                              "nationality",
                            )}
                          />
                          <Field
                            label="Gender"
                            value={ownerData.gender}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Identification Issue Date"
                            value={formatDateForInput(
                              ownerData.identificationIssueDate,
                            )}
                          />
                          <Field
                            label="Identification Expiry Date"
                            value={formatDateForInput(
                              ownerData.identificationExpiryDate,
                            )}
                          />
                          <Field
                            label="Date of Birth"
                            value={formatDateForInput(ownerData.dateOfBirth)}
                          />
                          <Field label="TPN No" value={ownerData.tpn} />
                          <Field
                            label="Marital Status"
                            value={getOptionLabel(
                              maritalStatusOptions,
                              ownerData.maritalStatus,
                              "id",
                              "marital_status",
                            )}
                          />
                          {ownerData.shareholdingPercent && (
                            <Field
                              label="Shareholding %"
                              value={ownerData.shareholdingPercent}
                            />
                          )}
                        </div>

                        {/* Spouse Information if Married */}
                        {ownerData.maritalStatus &&
                          getOptionLabel(
                            maritalStatusOptions,
                            ownerData.maritalStatus,
                            "id",
                            "marital_status",
                          )
                            ?.toLowerCase()
                            .includes("married") && (
                            <div className="mt-4 border-t pt-4">
                              <h5 className="font-semibold text-gray-800 mb-4">
                                Spouse Personal Information
                              </h5>
                              <div className="grid md:grid-cols-3 gap-6">
                                <Field
                                  label="Spouse CID/ID No."
                                  value={ownerData.spouseIdentificationNo}
                                />
                                <Field
                                  label="Spouse Name"
                                  value={ownerData.spouseName}
                                />
                                <Field
                                  label="Spouse Contact No."
                                  value={ownerData.spouseContact}
                                />
                              </div>
                            </div>
                          )}

                        {/* File Uploads */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t mt-4">
                          <Field
                            label="Family Tree File"
                            value={ownerData.familyTreeName}
                          />
                          <Field
                            label="Passport Photo"
                            value={ownerData.passportPhotoName}
                          />
                        </div>

                        {/* Bank Details */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t">
                          <Field
                            label="Name of Bank"
                            value={getOptionLabel(
                              banksOptions,
                              ownerData.bankName,
                              "id",
                              "bank_name",
                            )}
                          />
                          <Field
                            label="Saving Account No"
                            value={ownerData.bankAccount}
                          />
                        </div>

                        {/* Address Details */}
                        <div className="space-y-6 pt-4 border-t">
                          <h5 className="font-semibold text-gray-800">
                            Permanent Address
                          </h5>
                          <div className="grid md:grid-cols-4 gap-6">
                            <Field
                              label="Country"
                              value={getOptionLabel(
                                countryOptions,
                                ownerData.permCountry,
                                "id",
                                "country_name",
                              )}
                            />
                            {ownerData.permCountry &&
                            countryOptions
                              .find(
                                (c) =>
                                  String(c.id) ===
                                  String(ownerData.permCountry),
                              )
                              ?.country_name?.toLowerCase()
                              .includes("bhutan") ? (
                              <>
                                <Field
                                  label="Dzongkhag"
                                  value={getOptionLabel(
                                    dzongkhagOptions,
                                    ownerData.permDzongkhag,
                                    "id",
                                    "dzongkhag_name",
                                  )}
                                />
                                <Field
                                  label="Gewog"
                                  value={getOptionLabel(
                                    gewogOptions,
                                    ownerData.permGewog,
                                    "id",
                                    "gewog_name",
                                  )}
                                />
                                <Field
                                  label="Village/Street"
                                  value={ownerData.permVillage}
                                />
                                <Field
                                  label="Thram No."
                                  value={ownerData.permThram}
                                />
                                <Field
                                  label="House No."
                                  value={ownerData.permHouse}
                                />
                              </>
                            ) : (
                              <>
                                <Field
                                  label="State"
                                  value={ownerData.permDzongkhag}
                                />
                                <Field
                                  label="Province"
                                  value={ownerData.permGewog}
                                />
                                <Field
                                  label="Street Name"
                                  value={ownerData.permVillage}
                                />
                              </>
                            )}
                            <Field
                              label="Address Proof"
                              value={ownerData.permAddressProofName}
                            />
                          </div>
                        </div>

                        {/* Current Address */}
                        <div className="space-y-4 pt-4 border-t">
                          <h5 className="font-semibold text-gray-800">
                            Current/Residential Address
                          </h5>
                          <div className="grid md:grid-cols-4 gap-6">
                            <Field
                              label="Country"
                              value={getOptionLabel(
                                countryOptions,
                                ownerData.currCountry,
                                "id",
                                "country_name",
                              )}
                            />
                            {ownerData.currCountry &&
                            countryOptions
                              .find(
                                (c) =>
                                  String(c.id) ===
                                  String(ownerData.currCountry),
                              )
                              ?.country_name?.toLowerCase()
                              .includes("bhutan") ? (
                              <>
                                <Field
                                  label="Dzongkhag"
                                  value={getOptionLabel(
                                    dzongkhagOptions,
                                    ownerData.currDzongkhag,
                                    "id",
                                    "dzongkhag_name",
                                  )}
                                />
                                <Field
                                  label="Gewog"
                                  value={getOptionLabel(
                                    gewogOptions,
                                    ownerData.currGewog,
                                    "id",
                                    "gewog_name",
                                  )}
                                />
                                <Field
                                  label="Village/Street"
                                  value={ownerData.currVillage}
                                />
                                <Field
                                  label="House/Building/Flat No"
                                  value={ownerData.currFlat}
                                />
                              </>
                            ) : (
                              <>
                                <Field
                                  label="State"
                                  value={ownerData.currDzongkhag}
                                />
                                <Field
                                  label="Province"
                                  value={ownerData.currGewog}
                                />
                                <Field
                                  label="Street Name"
                                  value={ownerData.currVillage}
                                />
                              </>
                            )}
                            <Field
                              label="Email Address"
                              value={ownerData.currEmail}
                            />
                            <Field
                              label="Contact Number"
                              value={ownerData.currContact}
                            />
                            <Field
                              label="Alternate Contact No"
                              value={ownerData.currAlternateContact}
                            />
                            <Field
                              label="Address Proof"
                              value={ownerData.currAddressProofName}
                            />
                          </div>
                        </div>

                        {/* PEP Declaration */}
                        {ownerData.pepPerson && (
                          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                            <h5 className="font-semibold text-gray-800">
                              PEP Declaration
                            </h5>
                            <div className="grid md:grid-cols-4 gap-6">
                              <Field
                                label="Politically Exposed Person"
                                value={ownerData.pepPerson}
                                capitalizeFirst={true}
                              />
                              {ownerData.pepPerson === "yes" && (
                                <>
                                  <Field
                                    label="PEP Category"
                                    value={getOptionLabel(
                                      pepCategoryOptions,
                                      ownerData.pepCategory,
                                      "id",
                                      "pep_category",
                                    )}
                                  />
                                  <Field
                                    label="PEP Sub Category"
                                    value={ownerData.pepSubCategory}
                                  />
                                  <Field
                                    label="Identification Proof"
                                    value={ownerData.identificationProofName}
                                  />
                                </>
                              )}
                              {ownerData.pepPerson === "no" &&
                                ownerData.pepRelated && (
                                  <Field
                                    label="Related to any PEP"
                                    value={ownerData.pepRelated}
                                    capitalizeFirst={true}
                                  />
                                )}
                            </div>
                          </div>
                        )}

                        {/* Employment Status */}
                        {ownerData.employmentStatus && (
                          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                            <h5 className="font-semibold text-gray-800">
                              Employment Status
                            </h5>
                            <Field
                              label="Employment Status"
                              value={ownerData.employmentStatus}
                              capitalizeFirst={true}
                            />

                            {ownerData.employmentStatus === "employed" && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                  <Field
                                    label="Employee ID"
                                    value={ownerData.employeeId}
                                  />
                                  <Field
                                    label="Occupation"
                                    value={getOptionLabel(
                                      occupationOptions,
                                      ownerData.occupation,
                                      "id",
                                      "occ_name",
                                    )}
                                  />
                                  <Field
                                    label="Employer Type"
                                    value={ownerData.employerType}
                                    capitalizeFirst={true}
                                  />
                                  <Field
                                    label="Designation"
                                    value={ownerData.designation}
                                    capitalizeFirst={true}
                                  />
                                  <Field
                                    label="Grade"
                                    value={ownerData.grade}
                                  />
                                  <Field
                                    label="Organization Name"
                                    value={getOptionLabel(
                                      organizationOptions,
                                      ownerData.organizationName,
                                      "id",
                                      "lgal_constitution",
                                    )}
                                  />
                                  <Field
                                    label="Organization Location"
                                    value={ownerData.orgLocation}
                                  />
                                  <Field
                                    label="Service Joining Date"
                                    value={formatDateForInput(
                                      ownerData.joiningDate,
                                    )}
                                  />
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                  <Field
                                    label="Nature of Service"
                                    value={ownerData.serviceNature}
                                    capitalizeFirst={true}
                                  />
                                  <Field
                                    label="Gross Annual Salary Income"
                                    value={ownerData.annualSalary}
                                  />
                                  {ownerData.serviceNature === "contract" && (
                                    <Field
                                      label="Contract End Date"
                                      value={formatDateForInput(
                                        ownerData.contractEndDate,
                                      )}
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Partners Display */}
              {businessData.businessType === "Partnership" &&
                partners.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-600" /> Partners
                      Personal Details
                    </h3>
                    {partners.map((partner: any, index: number) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 mb-6"
                      >
                        <h4 className="text-xl font-bold text-gray-800 mb-6">
                          Partner {index + 1} Personal Details
                        </h4>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Field
                              label="Shareholding %"
                              value={partner.shareholdingPercent}
                            />
                            <Field
                              label="Identification Type"
                              value={getOptionLabel(
                                identificationTypeOptions,
                                partner.identificationType,
                                "id",
                                "identification_type",
                              )}
                            />
                            <Field
                              label="Identification No."
                              value={partner.identificationNo}
                            />
                            <Field
                              label="Applicant Name"
                              value={partner.applicantName}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Private Limited Company Display */}
              {businessData.businessType === "Private Limited Company" && (
                <div className="space-y-12">
                  {/* Shareholders */}
                  {shareholders.length > 0 && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-600" /> 1.
                        Shareholders / Partners Personal Details
                      </h3>
                      {shareholders.map((sh: any, idx: number) => (
                        <div
                          key={idx}
                          className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 mb-6"
                        >
                          <h4 className="text-xl font-bold text-gray-800 mb-6">
                            Shareholder {idx + 1} Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Field
                              label="Shareholding %"
                              value={sh.shareholdingPercent}
                            />
                            <Field
                              label="Applicant Name"
                              value={sh.applicantName}
                            />
                            <Field
                              label="Identification No."
                              value={sh.identificationNo}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CEO */}
                  {ceo && ceo.applicantName && (
                    <div className="space-y-6 pt-8 border-t border-dashed">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-gray-600" /> 2. CEO
                        Personal Details
                      </h3>
                      <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <Field
                            label="Applicant Name"
                            value={ceo.applicantName}
                          />
                          <Field
                            label="Identification No."
                            value={ceo.identificationNo}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Board Members */}
                  {boardMembers.length > 0 && (
                    <div className="space-y-6 pt-8 border-t border-dashed">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-600" /> 3. Board of
                        Directors Information
                      </h3>
                      {boardMembers.map((bm: any, idx: number) => (
                        <div
                          key={idx}
                          className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 mb-6"
                        >
                          <h4 className="text-xl font-bold text-gray-800 mb-6">
                            Director {idx + 1} Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Field
                              label="Applicant Name"
                              value={bm.applicantName}
                            />
                            <Field
                              label="Identification No."
                              value={bm.identificationNo}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Other Business Types - Simplified Display */}
              {businessData.businessType &&
                ![
                  "Sole Proprietorship",
                  "Partnership",
                  "Private Limited Company",
                ].includes(businessData.businessType) && (
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-600 text-sm text-blue-800">
                    <strong>Note:</strong> {businessData.businessType}{" "}
                    ownership/management details are included in the submitted
                    data.
                  </div>
                )}
            </div>
          )}
        </div>
      </AccordionSection>

      {/* SECURITY DETAILS */}
      <AccordionSection title="Security Details" defaultOpen>
        {securityData.securityType &&
          securityData.securityType?.toLowerCase() !== "not applicable" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pb-6">
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
              </div>

              {/* Land Security Details */}
              {securityData.securityType?.toLowerCase() === "land" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                  <Field
                    label="Thram No."
                    value={securityData.thramNo || "N/A"}
                  />
                  <Field
                    label="Plot No."
                    value={securityData.plotNo || "N/A"}
                  />
                  <Field
                    label="Area (Sq.Ft)"
                    value={securityData.area || "N/A"}
                  />
                  <Field
                    label="Land Use Type"
                    value={securityData.landUse || "N/A"}
                  />
                  <Field
                    label="Dzongkhag"
                    value={securityData.dzongkhag || "N/A"}
                  />
                  <Field label="Gewog" value={securityData.gewog || "N/A"} />
                  <Field
                    label="Village/Street"
                    value={securityData.village || "N/A"}
                  />
                  <Field
                    label="House No."
                    value={securityData.houseNo || "N/A"}
                  />
                </div>
              )}

              {/* Vehicle Security Details */}
              {securityData.securityType?.toLowerCase() === "vehicle" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                  <Field
                    label="Vehicle Type"
                    value={securityData.vehicleType || "N/A"}
                  />
                  <Field
                    label="Make/Brand"
                    value={securityData.vehicleMake || "N/A"}
                  />
                  <Field
                    label="Model"
                    value={securityData.vehicleModel || "N/A"}
                  />
                  <Field
                    label="Year of Manufacture"
                    value={securityData.vehicleYear || "N/A"}
                  />
                  <Field
                    label="Registration No."
                    value={securityData.registrationNo || "N/A"}
                  />
                  <Field
                    label="Chassis No."
                    value={securityData.chassisNo || "N/A"}
                  />
                  <Field
                    label="Engine No."
                    value={securityData.engineNo || "N/A"}
                  />
                </div>
              )}

              {/* Insurance Security Details */}
              {securityData.securityType?.toLowerCase() === "insurance" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                  <Field
                    label="Insurance Company"
                    value={securityData.insuranceCompany || "N/A"}
                  />
                  <Field
                    label="Policy No."
                    value={securityData.policyNo || "N/A"}
                  />
                  <Field
                    label="Insurance Value"
                    value={securityData.insuranceValue || "N/A"}
                  />
                  <Field
                    label="Start Date"
                    value={formatDateForInput(securityData.insuranceStartDate)}
                  />
                  <Field
                    label="Expiry Date"
                    value={formatDateForInput(securityData.insuranceExpiryDate)}
                  />
                </div>
              )}

              {/* Pension/Provident Security Details */}
              {securityData.securityType?.toLowerCase() === "pension" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                  <Field
                    label="Institution Name"
                    value={securityData.ppfInstitution || "N/A"}
                  />
                  <Field
                    label="Provident Fund No."
                    value={securityData.ppfFundNo || "N/A"}
                  />
                  <Field
                    label="Account No."
                    value={securityData.ppfAccountNo || "N/A"}
                  />
                  <Field
                    label="Fund Value (Nu.)"
                    value={securityData.ppfValue || "N/A"}
                  />
                </div>
              )}

              {/* Fixed Deposit Details */}
              {securityData.securityType?.toLowerCase() === "fixed deposit" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                  <Field
                    label="FD Account No."
                    value={securityData.fdAccountNo || "N/A"}
                  />
                  <Field
                    label="FD Amount"
                    value={securityData.fdAmount || "N/A"}
                  />
                  <Field label="FD Bank" value={securityData.fdBank || "N/A"} />
                  <Field
                    label="Maturity Date"
                    value={formatDateForInput(securityData.fdMaturityDate)}
                  />
                </div>
              )}

              {/* Security Proof Document */}
              <div className="pt-6 mt-6 border-t">
                <Field
                  label="Security Proof Document"
                  value={securityData.securityProof || "No file uploaded"}
                />
              </div>
            </>
          )}
        {(!securityData.securityType ||
          securityData.securityType?.toLowerCase() === "not applicable") && (
          <p className="text-gray-500 italic">No security details provided.</p>
        )}
      </AccordionSection>

      {/* REPAYMENT SOURCE */}
      <AccordionSection title="Repayment Source" defaultOpen>
        <div className="space-y-8">
          {/* Primary Repayment Source */}
          <div>
            <h4 className="text-lg font-bold text-gray-800 mb-4 bg-gray-50 p-2 rounded">
              Primary Repayment Source
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field
                label="Repayment Source Type"
                value={repaymentData.repaymentSourceType}
              />
              <Field label="Amount (Nu.)" value={repaymentData.monthlyIncome} />
              <Field
                label="Upload Proof"
                value={repaymentData.proofFileName || "No file uploaded"}
              />
            </div>
          </div>

          {/* Guarantors Section */}
          {guarantorsData && guarantorsData.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-4 bg-gray-50 p-2 rounded">
                Guarantors ({guarantorsData.length})
              </h4>
              <div className="space-y-6">
                {guarantorsData.map((guarantor: any, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-6 bg-gray-50/50"
                  >
                    <h5 className="text-md font-bold text-gray-800 mb-4">
                      Guarantor {index + 1}
                    </h5>

                    {/* Guarantor Personal Information */}
                    <div className="mb-6">
                      <h6 className="font-semibold text-gray-700 mb-3">
                        Personal Information
                      </h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Field
                          label="Salutation"
                          value={guarantor.salutation}
                        />
                        <Field
                          label="Applicant Name"
                          value={
                            guarantor.guarantorName || guarantor.applicantName
                          }
                        />
                        <Field
                          label="Identification Type"
                          value={getOptionLabel(
                            identificationTypeOptions,
                            guarantor.idType || guarantor.identificationType,
                            "id",
                            "identification_type",
                          )}
                        />
                        <Field
                          label="Identification No."
                          value={
                            guarantor.idNumber || guarantor.identificationNo
                          }
                        />
                        <Field
                          label="Nationality"
                          value={getOptionLabel(
                            nationalityOptions,
                            guarantor.nationality,
                            "id",
                            "nationality",
                          )}
                        />
                        <Field
                          label="Gender"
                          value={guarantor.gender}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Date of Birth"
                          value={formatDateForInput(guarantor.dateOfBirth)}
                        />
                        <Field label="TPN No" value={guarantor.tpn} />
                      </div>
                    </div>

                    {/* Guarantor Repayment Source */}
                    <div className="mb-6">
                      <h6 className="font-semibold text-gray-700 mb-3">
                        Repayment Source
                      </h6>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field
                          label="Repayment Source Type"
                          value={guarantor.repaymentSourceType}
                        />
                        <Field label="Amount (Nu.)" value={guarantor.amount} />
                        <Field
                          label="Upload Proof"
                          value={guarantor.proofFileName || "No file uploaded"}
                        />
                      </div>
                    </div>

                    {/* Guarantor Address Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Permanent Address */}
                      <div>
                        <h6 className="font-semibold text-gray-700 mb-3">
                          Permanent Address
                        </h6>
                        <div className="space-y-3">
                          <Field
                            label="Country"
                            value={getOptionLabel(
                              countryOptions,
                              guarantor.permCountry,
                              "id",
                              "country_name",
                            )}
                          />
                          {guarantor.permCountry &&
                          countryOptions
                            .find(
                              (c) =>
                                String(c.id) === String(guarantor.permCountry),
                            )
                            ?.country_name?.toLowerCase()
                            .includes("bhutan") ? (
                            <>
                              <Field
                                label="Dzongkhag"
                                value={getOptionLabel(
                                  dzongkhagOptions,
                                  guarantor.permDzongkhag,
                                  "id",
                                  "dzongkhag_name",
                                )}
                              />
                              <Field
                                label="Gewog"
                                value={getOptionLabel(
                                  gewogOptions,
                                  guarantor.permGewog,
                                  "id",
                                  "gewog_name",
                                )}
                              />
                              <Field
                                label="Village/Street"
                                value={guarantor.permVillage}
                              />
                              <Field
                                label="Thram No."
                                value={guarantor.permThram}
                              />
                              <Field
                                label="House No."
                                value={guarantor.permHouse}
                              />
                            </>
                          ) : (
                            <>
                              <Field
                                label="State"
                                value={guarantor.permDzongkhag}
                              />
                              <Field
                                label="Province"
                                value={guarantor.permGewog}
                              />
                              <Field
                                label="Street"
                                value={guarantor.permVillage}
                              />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Current Address */}
                      <div>
                        <h6 className="font-semibold text-gray-700 mb-3">
                          Current/Residential Address
                        </h6>
                        <div className="space-y-3">
                          <Field
                            label="Country"
                            value={getOptionLabel(
                              countryOptions,
                              guarantor.currCountry,
                              "id",
                              "country_name",
                            )}
                          />
                          {guarantor.currCountry &&
                          countryOptions
                            .find(
                              (c) =>
                                String(c.id) === String(guarantor.currCountry),
                            )
                            ?.country_name?.toLowerCase()
                            .includes("bhutan") ? (
                            <>
                              <Field
                                label="Dzongkhag"
                                value={getOptionLabel(
                                  dzongkhagOptions,
                                  guarantor.currDzongkhag,
                                  "id",
                                  "dzongkhag_name",
                                )}
                              />
                              <Field
                                label="Gewog"
                                value={getOptionLabel(
                                  gewogOptions,
                                  guarantor.currGewog,
                                  "id",
                                  "gewog_name",
                                )}
                              />
                              <Field
                                label="Village/Street"
                                value={guarantor.currVillage}
                              />
                            </>
                          ) : (
                            <>
                              <Field
                                label="State"
                                value={guarantor.currDzongkhag}
                              />
                              <Field
                                label="Province"
                                value={guarantor.currGewog}
                              />
                              <Field
                                label="Street"
                                value={guarantor.currVillage}
                              />
                            </>
                          )}
                          <Field
                            label="House/Building/Flat No."
                            value={guarantor.currHouse}
                          />
                          <Field label="Email" value={guarantor.email} />
                          <Field
                            label="Contact No."
                            value={guarantor.contact}
                          />
                          <Field
                            label="Alternate Contact"
                            value={guarantor.currAlternateContact}
                          />
                        </div>
                      </div>
                    </div>

                    {/* PEP Declaration */}
                    {guarantor.isPep && (
                      <div className="mt-6 border-t pt-4">
                        <h6 className="font-semibold text-gray-700 mb-3">
                          PEP Declaration
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Field
                            label="Politically Exposed Person"
                            value={guarantor.isPep}
                            capitalizeFirst={true}
                          />
                          {guarantor.isPep === "yes" && (
                            <>
                              <Field
                                label="PEP Category"
                                value={getOptionLabel(
                                  pepCategoryOptions,
                                  guarantor.pepCategory,
                                  "id",
                                  "pep_category",
                                )}
                              />
                              <Field
                                label="PEP Sub Category"
                                value={guarantor.pepSubCategory}
                              />
                            </>
                          )}
                          {guarantor.isPep === "no" &&
                            guarantor.relatedToPep && (
                              <Field
                                label="Related to any PEP"
                                value={guarantor.relatedToPep}
                                capitalizeFirst={true}
                              />
                            )}
                        </div>
                      </div>
                    )}

                    {/* Employment Status */}
                    {guarantor.employmentStatus && (
                      <div className="mt-6 border-t pt-4">
                        <h6 className="font-semibold text-gray-700 mb-3">
                          Employment Status
                        </h6>
                        <Field
                          label="Current Status"
                          value={guarantor.employmentStatus}
                          capitalizeFirst={true}
                        />

                        {guarantor.employmentStatus === "employed" && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Field
                              label="Employee ID"
                              value={guarantor.employeeId}
                            />
                            <Field
                              label="Occupation"
                              value={getOptionLabel(
                                occupationOptions,
                                guarantor.occupation,
                                "id",
                                "occ_name",
                              )}
                            />
                            <Field
                              label="Employer Type"
                              value={guarantor.employerType}
                              capitalizeFirst={true}
                            />
                            <Field
                              label="Designation"
                              value={guarantor.designation}
                            />
                            <Field label="Grade" value={guarantor.grade} />
                            <Field
                              label="Organization"
                              value={getOptionLabel(
                                organizationOptions,
                                guarantor.organizationName,
                                "id",
                                "lgal_constitution",
                              )}
                            />
                            <Field
                              label="Organization Location"
                              value={guarantor.orgLocation}
                            />
                            <Field
                              label="Joining Date"
                              value={formatDateForInput(guarantor.joiningDate)}
                            />
                            <Field
                              label="Annual Salary"
                              value={guarantor.annualSalary}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
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

      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 pt-6 sm:pt-8">
        <Button
          type="button"
          onClick={onBack}
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
