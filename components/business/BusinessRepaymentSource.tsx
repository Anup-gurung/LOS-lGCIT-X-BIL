"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Plus, Trash2, PlusCircle } from "lucide-react";

// Import for lookup functionality
import { mapCustomerDataToForm } from "@/lib/mapCustomerData";
import DocumentPopup from "@/components/BILSearchStatus";

import {
  fetchNationality,
  fetchIdentificationType,
  fetchCountry,
  fetchDzongkhag,
  fetchGewogsByDzongkhag,
  fetchMaritalStatus,
  fetchOccupations,
  fetchLegalConstitution,
  fetchPepCategory,
  fetchPepSubCategoryByCategory,
  fetchBanks,
} from "@/services/api";

// ================== IndexedDB Helpers ==================
import { storeFile, deleteFile } from "@/lib/indexDB";

// ================== Validation Helpers ==================
const isRequired = (value: any) => {
  if (value === 0) return false;
  return !value || value.toString().trim() === "";
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidCID = (value: string) => /^\d{11}$/.test(value);
const isValidMobile = (value: string) => /^(16|17|77)\d{6}$/.test(value);
const isValidFixedLine = (value: string) => /^[2-8]\d{6,7}$/.test(value);
const isValidPhoneNumber = (value: string) =>
  isValidMobile(value) || isValidFixedLine(value);

const isLegalAge = (dateOfBirth: string): boolean => {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 18;
};
// ================== END Validation Helpers ==================

// --- Uniform Styling ---
const getFieldStyle = (hasError: boolean) => {
  const baseStyle =
    "h-12 w-full bg-white border rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus-visible:outline-none focus:ring-1 focus-visible:ring-1 focus:ring-[#FF9800] focus-visible:ring-[#FF9800] transition-colors";
  if (hasError) {
    return `${baseStyle} border-red-500 focus:border-red-500 focus-visible:border-red-500`;
  }
  return `${baseStyle} border-gray-300 focus:border-[#FF9800] focus-visible:border-[#FF9800]`;
};

const fileUploadStyle = (hasError: boolean) =>
  `h-12 w-full bg-white border rounded-lg flex items-center px-3 justify-between cursor-pointer hover:bg-gray-50 transition-colors text-sm ${
    hasError ? "border-red-500" : "border-gray-300"
  }`;

// ================== Restricted Input Component ==================
type AllowedPattern = "numeric" | "alpha" | "alphanumeric" | "text";

const RestrictedInput = ({
  allowed = "text",
  maxLength,
  value,
  onChange,
  className,
  ...props
}: {
  allowed?: AllowedPattern;
  maxLength?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  [key: string]: any;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (allowed === "numeric") {
      newValue = newValue.replace(/[^0-9]/g, "");
    } else if (allowed === "alpha") {
      newValue = newValue.replace(/[^a-zA-Z\s\-']/g, "");
    } else if (allowed === "alphanumeric") {
      newValue = newValue.replace(/[^a-zA-Z0-9\s\-_]/g, "");
    }

    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
    }

    if (onChange) {
      onChange({ ...e, target: { ...e.target, value: newValue } });
    }
  };

  return (
    <Input
      value={value}
      onChange={handleChange}
      className={className}
      maxLength={maxLength}
      {...props}
    />
  );
};
// ================== END Restricted Input ==================

// ================== Helper: findPkCodeByLabel ==================
const findPkCodeByLabel = (
  label: string,
  options: any[],
  labelFields: string[],
): string => {
  if (!label) return "";

  const trimmedLabel = String(label).trim().toLowerCase();
  const strippedLabel = trimmedLabel.replace(/\s+/g, "");
  const inputWords = trimmedLabel.split(/\s+/).filter((w) => w.length > 0);

  for (const option of options) {
    for (const field of labelFields) {
      const optionValue = String(option[field] || "");
      const trimmedOption = optionValue.trim().toLowerCase();
      const strippedOption = trimmedOption.replace(/\s+/g, "");
      const optionWords = trimmedOption
        .split(/\s+/)
        .filter((w) => w.length > 0);

      if (strippedOption === strippedLabel) {
        return String(
          option.bank_pk_code ||
            option.country_pk_code ||
            option.nationality_pk_code ||
            option.identity_type_pk_code ||
            option.marital_status_pk_code ||
            option.occupation_pk_code ||
            option.occ_pk_code ||
            option.lgal_constitution_pk_code ||
            option.dzongkhag_pk_code ||
            option.gewog_pk_code ||
            option.curr_gewog_pk_code ||
            option.pk_gewog_id ||
            option.pep_category_pk_code ||
            option.pep_sub_category_pk_code ||
            option.pk_code ||
            option.id ||
            option.code ||
            "",
        );
      }

      if (trimmedOption === trimmedLabel) {
        return String(
          option.bank_pk_code ||
            option.country_pk_code ||
            option.nationality_pk_code ||
            option.identity_type_pk_code ||
            option.marital_status_pk_code ||
            option.occupation_pk_code ||
            option.occ_pk_code ||
            option.lgal_constitution_pk_code ||
            option.dzongkhag_pk_code ||
            option.gewog_pk_code ||
            option.curr_gewog_pk_code ||
            option.pk_gewog_id ||
            option.pep_category_pk_code ||
            option.pep_sub_category_pk_code ||
            option.pk_code ||
            option.id ||
            option.code ||
            "",
        );
      }

      if (inputWords.length > 0 && optionWords.length > 0) {
        const allWordsMatch = inputWords.every((word) =>
          optionWords.some(
            (optWord) => optWord.includes(word) || word.includes(optWord),
          ),
        );
        if (allWordsMatch) {
          return String(
            option.bank_pk_code ||
              option.country_pk_code ||
              option.nationality_pk_code ||
              option.identity_type_pk_code ||
              option.marital_status_pk_code ||
              option.occupation_pk_code ||
              option.occ_pk_code ||
              option.lgal_constitution_pk_code ||
              option.dzongkhag_pk_code ||
              option.gewog_pk_code ||
              option.curr_gewog_pk_code ||
              option.pk_gewog_id ||
              option.pep_category_pk_code ||
              option.pep_sub_category_pk_code ||
              option.pk_code ||
              option.id ||
              option.code ||
              "",
          );
        }
      }
    }
  }

  if (trimmedLabel.length >= 4) {
    for (const option of options) {
      for (const field of labelFields) {
        const optionLabel = String(option[field] || "")
          .trim()
          .toLowerCase();
        if (
          optionLabel.includes(trimmedLabel) ||
          trimmedLabel.includes(optionLabel)
        ) {
          return String(
            option.bank_pk_code ||
              option.country_pk_code ||
              option.nationality_pk_code ||
              option.identity_type_pk_code ||
              option.marital_status_pk_code ||
              option.occupation_pk_code ||
              option.occ_pk_code ||
              option.lgal_constitution_pk_code ||
              option.dzongkhag_pk_code ||
              option.gewog_pk_code ||
              option.curr_gewog_pk_code ||
              option.pk_gewog_id ||
              option.pep_category_pk_code ||
              option.pep_sub_category_pk_code ||
              option.pk_code ||
              option.id ||
              option.code ||
              "",
          );
        }
      }
    }
  }

  return label;
};

const mapEmployerType = (rawType: string): string => {
  if (!rawType) return "";
  const lower = rawType.toLowerCase();
  if (lower.includes("government") || lower.includes("ministry"))
    return "government";
  if (
    lower.includes("financial") ||
    lower.includes("corporate") ||
    lower.includes("limited") ||
    lower.includes("non-bank") ||
    lower.includes("company")
  )
    return "corporate";
  if (lower.includes("private")) return "private";
  return "private";
};

interface BusinessRepaymentSourceFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
  formData: any;
}

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

// Initialize empty related PEP entry (Expanded with personal & address fields)
const createEmptyRelatedPep = () => ({
  relationship: "",
  category: "",
  subCategory: "",
  identificationProof: "", // file name
  identificationProofId: "", // file ID in IndexedDB

  // Personal Info
  identificationType: "",
  identificationNo: "",
  salutation: "",
  applicantName: "",
  nationality: "",
  gender: "",
  idIssueDate: "",
  idExpiryDate: "",
  dateOfBirth: "",
  tpnNo: "",
  taxIdentifierType: "",
  householdNumber: "",
  maritalStatus: "",

  // PEP Spouse Details
  spouseIdType: "",
  spouseIdNumber: "",
  spouseSalutation: "",
  spouseName: "",
  spouseNationality: "",
  spouseGender: "",
  spouseIdIssueDate: "",
  spouseIdExpiryDate: "",
  spouseDob: "",
  spouseTpnNo: "",
  spouseTaxIdentifierType: "",
  spouseHouseholdNumber: "",

  // PEP Spouse Address & Contact (No Current Address)
  spousePermCountry: "",
  spousePermDzongkhag: "",
  spousePermGewog: "",
  spousePermVillage: "",
  spousePermThram: "",
  spousePermHouse: "",
  spousePermCity: "",
  spousePermPostal: "",
  spousePermAddressProof: "",
  spousePermAddressProofId: "",
  spouseEmail: "",
  spouseContact: "",
  spouseAlternateContact: "",

  // Permanent Address
  permCountry: "",
  permDzongkhag: "",
  permGewog: "",
  permVillage: "",
  permThram: "",
  permHouse: "",
  permAddressProof: "",
  permAddressProofId: "",

  // Current Address & Contact
  currCountry: "",
  currDzongkhag: "",
  currGewog: "",
  currVillage: "",
  currHouse: "",
  currAddressProof: "",
  currAddressProofId: "",
  email: "",
  contact: "",
  alternateContact: "",

  // Dynamic Options (isolated for each PEP row)
  permGewogOptions: [] as any[],
  currGewogOptions: [] as any[],
  spousePermGewogOptions: [] as any[],
});

// Initialize empty guarantor (No Spouse Current Address)
const createEmptyGuarantor = () => ({
  idType: "",
  idNumber: "",
  salutation: "",
  guarantorName: "",
  nationality: "",
  gender: "",
  idIssueDate: "",
  idExpiryDate: "",
  dateOfBirth: "",
  tpnNo: "",
  taxIdentifierType: "",
  taxIdentifierNumber: "",
  householdNumber: "",
  maritalStatus: "",

  // COMPREHENSIVE SPOUSE FIELDS
  spouseIdType: "",
  spouseCid: "",
  spouseSalutation: "",
  spouseName: "",
  spouseNationality: "",
  spouseGender: "",
  spouseIdIssueDate: "",
  spouseIdExpiryDate: "",
  spouseDateOfBirth: "",
  spouseTaxIdentifierType: "",
  spouseTpnNumber: "",
  spouseHouseholdNumber: "",
  spouseContact: "",
  // Spouse Permanent Address
  spousePermCountry: "",
  spousePermDzongkhag: "",
  spousePermGewog: "",
  spousePermVillage: "",
  spousePermThram: "",
  spousePermHouse: "",
  spousePermCity: "",
  spousePermPostal: "",
  spousePermAddressProof: "",
  spousePermAddressProofId: "",
  spousePermGewogOptions: [] as any[],
  // Spouse Contact Info
  spouseEmail: "",
  spouseCurrContact: "", // using currContact property name for consistency with UI
  spouseCurrAlternateContact: "",

  familyTree: "", // file name
  familyTreeId: "", // file ID
  passportPhoto: "", // file name
  passportPhotoId: "", // file ID
  bankName: "",
  bankAccountNumber: "",

  permCountry: "",
  permDzongkhag: "",
  permGewog: "",
  permVillage: "",
  permThram: "",
  permHouse: "",
  permCity: "",
  permPostal: "",
  permAddressProof: "", // file name
  permAddressProofId: "", // file ID

  currCountry: "",
  currDzongkhag: "",
  currGewog: "",
  currVillage: "",
  currHouse: "",
  currCity: "",
  currPostal: "",
  email: "",
  contact: "",
  currAlternateContact: "",
  currAddressProof: "", // file name
  currAddressProofId: "", // file ID

  isPep: "",
  pepCategory: "",
  pepSubCategory: "",
  pepUpload: "", // file name
  pepUploadId: "", // file ID
  relatedToPep: "",
  relatedPeps: [] as any[],

  employmentStatus: "",
  employeeId: "",
  occupation: "",
  employerType: "",
  designation: "",
  grade: "",
  organizationName: "",
  orgLocation: "",
  joiningDate: "",
  serviceNature: "",
  annualSalary: "",
  contractEndDate: "",

  repaymentSourceType: "",
  amount: "",
  proofFileId: "", // file ID
  proofFileName: "", // file name

  errors: {} as Record<string, string>,

  permGewogOptions: [] as any[],
  currGewogOptions: [] as any[],
  pepSubCategoryOptions: [] as any[],
  relatedPepOptionsMap: {} as Record<number, any[]>,

  showLookupPopup: false,
  lookupStatus: "searching" as "searching" | "found" | "not_found",
  fetchedCustomerData: null,
});

export function BusinessRepaymentSourceForm({
  onNext,
  onBack,
  formData,
}: BusinessRepaymentSourceFormProps) {
  // Business Income State (file metadata only)
  const [businessIncomeData, setBusinessIncomeData] = useState({
    repaymentSourceType: "Business Income",
    amount: formData?.businessIncome?.amount || "",
    proofFileId: formData?.businessIncome?.proofFileId || "",
    proofFileName: formData?.businessIncome?.proofFileName || "",
  });

  const [businessErrors, setBusinessErrors] = useState<Record<string, string>>(
    {},
  );

  const [isGuarantorApplicable, setIsGuarantorApplicable] = useState(
    formData?.isGuarantorApplicable || "No",
  );

  const [guarantors, setGuarantors] = useState<any[]>(
    formData?.guarantors && formData.guarantors.length > 0
      ? formData.guarantors.map((g: any) => ({
          ...createEmptyGuarantor(),
          ...g,
        }))
      : [createEmptyGuarantor()],
  );

  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<
    any[]
  >([]);
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([]);
  const [pepCategoryOptions, setPepCategoryOptions] = useState<any[]>([]);
  const [banksOptions, setBankOptions] = useState<any[]>([]);
  const [occupationOptions, setOccupationOptions] = useState<any[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<any[]>([]);
  const [bhutanNationalityCode, setBhutanNationalityCode] = useState<
    string | null
  >(null);

  const today = new Date().toISOString().split("T")[0];
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
  const maxDobDate = eighteenYearsAgo.toISOString().split("T")[0];

  const isBhutan = (id: string) => {
    if (!id) return false;
    const c = countryOptions.find(
      (o) => String(o.country_pk_code || o.id) === String(id),
    );
    return c && (c.country || c.name || "").toLowerCase().includes("bhutan");
  };

  const isNationalityBhutanese = (nationalityCode: string | undefined) => {
    if (!nationalityCode || !bhutanNationalityCode) return false;
    return String(nationalityCode) === String(bhutanNationalityCode);
  };

  const getIsMarried = (guarantor: any) => {
    const status = guarantor.maritalStatus;
    if (!status) return false;
    const statusStr = String(status).toLowerCase();
    if (statusStr === "married") return true;
    if (statusStr === "unmarried") return false;

    const selectedOption = maritalStatusOptions.find(
      (opt) =>
        String(opt.marital_status_pk_code || opt.id || opt.value) == status,
    );
    if (selectedOption) {
      const label = (
        selectedOption.marital_status ||
        selectedOption.name ||
        ""
      ).toLowerCase();
      return label.includes("married") && !label.includes("unmarried");
    }
    return false;
  };

  const getPepIsMarried = (pep: any) => {
    const status = pep.maritalStatus;
    if (!status) return false;

    const statusStr = String(status).toLowerCase();
    if (statusStr === "married") return true;
    if (statusStr === "unmarried") return false;

    const selectedOption = maritalStatusOptions.find((option) => {
      const val = String(
        option.marital_status_pk_code ||
          option.id ||
          option.value ||
          option.code ||
          "",
      );
      return val == status;
    });

    if (selectedOption) {
      const label = (
        selectedOption.marital_status ||
        selectedOption.name ||
        selectedOption.label ||
        ""
      ).toLowerCase();
      return label.includes("married") && !label.includes("unmarried");
    }

    return false;
  };

  // --- FIELD VALIDATION ---
  const validateField = (fieldName: string, value: any): string => {
    if (!value || value.toString().trim() === "") return "";
    switch (fieldName) {
      case "idNumber":
      case "spouseCid":
      case "identificationNo":
      case "spouseIdNumber":
        if (!isValidCID(value)) return "CID must be 11 digits";
        break;
      case "contact":
      case "spouseContact":
      case "currAlternateContact":
      case "spouseCurrContact":
      case "alternateContact":
      case "spouseAlternateContact":
        if (!isValidMobile(value))
          return "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";
        break;
      case "email":
      case "spouseEmail":
        if (!isValidEmail(value)) return "Invalid email format";
        break;
      case "dateOfBirth":
      case "spouseDateOfBirth":
      case "spouseDob":
        if (!isLegalAge(value)) return "Must be at least 18 years old";
        break;
    }
    return "";
  };

  // Handle onBlur for specific field formatting issues (real-time feedback)
  const handleBlurField = (index: number, field: string, value: any) => {
    const formatError = validateField(field, value);

    setGuarantors((prev) => {
      const updated = [...prev];
      const currentErrors = updated[index].errors || {};

      if (formatError) {
        updated[index] = {
          ...updated[index],
          errors: { ...currentErrors, [field]: formatError },
        };
      } else {
        const newErrors = { ...currentErrors };
        delete newErrors[field];
        updated[index] = {
          ...updated[index],
          errors: newErrors,
        };
      }
      return updated;
    });
  };

  // ...[useEffect hooks for loading data - same as original code] ...
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [
          nat,
          idTypes,
          countries,
          dzos,
          marital,
          pepCats,
          banks,
          occs,
          orgs,
        ] = await Promise.all([
          fetchNationality().catch(() => []),
          fetchIdentificationType().catch(() => []),
          fetchCountry().catch(() => []),
          fetchDzongkhag().catch(() => []),
          fetchMaritalStatus().catch(() => []),
          fetchPepCategory().catch(() => []),
          fetchBanks().catch(() => []),
          fetchOccupations().catch(() => []),
          fetchLegalConstitution().catch(() => []),
        ]);

        const bhutanOption = nat.find((opt: any) => {
          const label = (
            opt.nationality ||
            opt.name ||
            opt.label ||
            ""
          ).toLowerCase();
          return label.includes("bhutan") && !label.includes("non");
        });
        const bhutanCode = bhutanOption
          ? String(
              bhutanOption.nationality_pk_code ||
                bhutanOption.id ||
                bhutanOption.code ||
                "",
            )
          : null;

        setNationalityOptions(nat);
        setBhutanNationalityCode(bhutanCode);
        setIdentificationTypeOptions(idTypes);
        setCountryOptions(countries);
        setDzongkhagOptions(dzos);
        setMaritalStatusOptions(marital);
        setPepCategoryOptions(pepCats);

        if (banks && Array.isArray(banks)) {
          const bankData = banks?.data?.data || banks?.data || banks || [];
          setBankOptions(bankData);
        } else {
          setBankOptions([]);
        }

        setOccupationOptions(occs);
        setOrganizationOptions(orgs);
      } catch (error) {
        console.error("Failed to load dropdown data:", error);
      }
    };
    loadAllData();
  }, []);

  // Gewog fetch for Guarantor's Permanent Address
  useEffect(() => {
    const loadPermGewogs = async () => {
      const updated = [...guarantors];
      let needsUpdate = false;

      for (let i = 0; i < guarantors.length; i++) {
        const g = guarantors[i];
        if (g.permCountry && isBhutan(g.permCountry) && g.permDzongkhag) {
          if (!g.permGewogOptions || g.permGewogOptions.length === 0) {
            try {
              const opts = await fetchGewogsByDzongkhag(g.permDzongkhag);
              updated[i] = { ...updated[i], permGewogOptions: opts };

              if (g.permGewog) {
                const isId = opts.some(
                  (o: any) =>
                    String(o.gewog_pk_code || o.id) === String(g.permGewog),
                );

                if (!isId) {
                  const converted = findPkCodeByLabel(g.permGewog, opts, [
                    "gewog_name",
                    "gewog",
                    "name",
                    "gewogName",
                  ]);
                  if (converted && converted !== g.permGewog) {
                    updated[i].permGewog = converted;
                  }
                }
              }
              needsUpdate = true;
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
      if (needsUpdate) setGuarantors(updated);
    };
    loadPermGewogs();
  }, [guarantors.map((g) => `${g.permCountry}-${g.permDzongkhag}`).join(",")]);

  // Gewog fetch for Guarantor's Current Address
  useEffect(() => {
    const loadCurrGewogs = async () => {
      const updated = [...guarantors];
      let needsUpdate = false;

      for (let i = 0; i < guarantors.length; i++) {
        const g = guarantors[i];
        if (g.currCountry && isBhutan(g.currCountry) && g.currDzongkhag) {
          if (!g.currGewogOptions || g.currGewogOptions.length === 0) {
            try {
              const opts = await fetchGewogsByDzongkhag(g.currDzongkhag);
              updated[i] = { ...updated[i], currGewogOptions: opts };

              if (g.currGewog) {
                const isId = opts.some(
                  (o: any) =>
                    String(o.gewog_pk_code || o.id) === String(g.currGewog),
                );

                if (!isId) {
                  const converted = findPkCodeByLabel(g.currGewog, opts, [
                    "gewog_name",
                    "gewog",
                    "name",
                    "gewogName",
                  ]);
                  if (converted && converted !== g.currGewog) {
                    updated[i].currGewog = converted;
                  }
                }
              }
              needsUpdate = true;
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
      if (needsUpdate) setGuarantors(updated);
    };
    loadCurrGewogs();
  }, [guarantors.map((g) => `${g.currCountry}-${g.currDzongkhag}`).join(",")]);

  // Gewog fetch for Spouse Permanent Address
  useEffect(() => {
    const loadSpousePermGewogs = async () => {
      const updated = [...guarantors];
      let needsUpdate = false;

      for (let i = 0; i < guarantors.length; i++) {
        const g = guarantors[i];
        if (
          g.spousePermCountry &&
          isBhutan(g.spousePermCountry) &&
          g.spousePermDzongkhag
        ) {
          if (
            !g.spousePermGewogOptions ||
            g.spousePermGewogOptions.length === 0
          ) {
            try {
              const opts = await fetchGewogsByDzongkhag(g.spousePermDzongkhag);
              updated[i] = { ...updated[i], spousePermGewogOptions: opts };

              if (g.spousePermGewog) {
                const isId = opts.some(
                  (o: any) =>
                    String(o.gewog_pk_code || o.id) ===
                    String(g.spousePermGewog),
                );

                if (!isId) {
                  const converted = findPkCodeByLabel(g.spousePermGewog, opts, [
                    "gewog_name",
                    "gewog",
                    "name",
                    "gewogName",
                  ]);
                  if (converted && converted !== g.spousePermGewog) {
                    updated[i].spousePermGewog = converted;
                  }
                }
              }
              needsUpdate = true;
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
      if (needsUpdate) setGuarantors(updated);
    };
    loadSpousePermGewogs();
  }, [
    guarantors
      .map((g) => `${g.spousePermCountry}-${g.spousePermDzongkhag}`)
      .join(","),
  ]);

  // --- Load Related PEPs Gewogs Dynamically ---
  useEffect(() => {
    const loadPepGewogs = async () => {
      let needsUpdate = false;
      const updatedGuarantors = [...guarantors];

      for (let gIdx = 0; gIdx < updatedGuarantors.length; gIdx++) {
        const guarantor = updatedGuarantors[gIdx];
        if (guarantor.relatedPeps && guarantor.relatedPeps.length > 0) {
          for (let pIdx = 0; pIdx < guarantor.relatedPeps.length; pIdx++) {
            const pep = guarantor.relatedPeps[pIdx];

            // Perm Gewog Loading
            if (pep.permDzongkhag) {
              try {
                const options = await fetchGewogsByDzongkhag(pep.permDzongkhag);
                if (
                  JSON.stringify(pep.permGewogOptions) !==
                  JSON.stringify(options)
                ) {
                  updatedGuarantors[gIdx].relatedPeps[pIdx].permGewogOptions =
                    options;
                  needsUpdate = true;
                }
              } catch (error) {
                console.error(
                  `Failed to load perm gewogs for related PEP ${pIdx}:`,
                  error,
                );
              }
            }

            // Curr Gewog Loading
            if (pep.currDzongkhag) {
              try {
                const options = await fetchGewogsByDzongkhag(pep.currDzongkhag);
                if (
                  JSON.stringify(pep.currGewogOptions) !==
                  JSON.stringify(options)
                ) {
                  updatedGuarantors[gIdx].relatedPeps[pIdx].currGewogOptions =
                    options;
                  needsUpdate = true;
                }
              } catch (error) {
                console.error(
                  `Failed to load curr gewogs for related PEP ${pIdx}:`,
                  error,
                );
              }
            }

            // Spouse Perm Gewog Loading
            if (pep.spousePermDzongkhag) {
              try {
                const options = await fetchGewogsByDzongkhag(
                  pep.spousePermDzongkhag,
                );
                if (
                  JSON.stringify(pep.spousePermGewogOptions) !==
                  JSON.stringify(options)
                ) {
                  updatedGuarantors[gIdx].relatedPeps[
                    pIdx
                  ].spousePermGewogOptions = options;
                  needsUpdate = true;
                }
              } catch (error) {
                console.error(
                  `Failed to load spouse perm gewogs for related PEP ${pIdx}:`,
                  error,
                );
              }
            }
          }
        }
      }

      if (needsUpdate) {
        setGuarantors(updatedGuarantors);
      }
    };

    loadPepGewogs();
  }, [
    JSON.stringify(
      guarantors.map((g) =>
        g.relatedPeps?.map(
          (p: any) =>
            `${p.permDzongkhag}-${p.currDzongkhag}-${p.spousePermDzongkhag}`,
        ),
      ),
    ),
  ]);

  // PEP Subcategory fetch
  useEffect(() => {
    const loadPepSub = async () => {
      const updated = [...guarantors];
      let needsUpdate = false;

      for (let i = 0; i < guarantors.length; i++) {
        if (guarantors[i].isPep === "yes" && guarantors[i].pepCategory) {
          if (
            !updated[i].pepSubCategoryOptions ||
            updated[i].pepSubCategoryOptions.length === 0
          ) {
            try {
              const opts = await fetchPepSubCategoryByCategory(
                guarantors[i].pepCategory,
              );
              updated[i] = { ...updated[i], pepSubCategoryOptions: opts };
              needsUpdate = true;
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
      if (needsUpdate) setGuarantors(updated);
    };
    loadPepSub();
  }, [guarantors.map((g) => `${g.isPep}-${g.pepCategory}`).join(",")]);

  const handleIdentityCheck = async (index: number) => {
    const guarantor = guarantors[index];
    const idType = guarantor.idType;
    const idNo = guarantor.idNumber;

    if (!idType || !idNo || idNo.trim() === "") return;

    setGuarantors((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        showLookupPopup: true,
        lookupStatus: "searching",
      };
      return updated;
    });

    try {
      const payload = {
        type: "I",
        identification_type_pk_code: idType,
        identity_no: idNo,
      };

      const response = await fetch("/api/customer-onboarded-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result?.success && result?.data) {
        const mappedData = mapCustomerDataToForm(result);
        setGuarantors((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            fetchedCustomerData: mappedData,
            lookupStatus: "found",
          };
          return updated;
        });
      } else {
        setGuarantors((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            lookupStatus: "not_found",
            fetchedCustomerData: null,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error("Identity lookup failed", error);
      setGuarantors((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          lookupStatus: "not_found",
          fetchedCustomerData: null,
        };
        return updated;
      });
    }
  };

  const handleLookupProceed = async (index: number) => {
    const guarantor = guarantors[index];
    if (guarantor.lookupStatus === "found" && guarantor.fetchedCustomerData) {
      const fetched = guarantor.fetchedCustomerData;

      const mappedNationality = findPkCodeByLabel(
        fetched.nationality,
        nationalityOptions,
        ["nationality", "name"],
      );
      const mappedMaritalStatus = findPkCodeByLabel(
        fetched.maritalStatus,
        maritalStatusOptions,
        ["marital_status", "name"],
      );
      const mappedBankName = findPkCodeByLabel(fetched.bankName, banksOptions, [
        "bank_name",
        "name",
        "bank",
      ]);
      const mappedPermCountry = findPkCodeByLabel(
        fetched.permCountry,
        countryOptions,
        ["country_name", "country", "name"],
      );
      const mappedCurrCountry = findPkCodeByLabel(
        fetched.currCountry,
        countryOptions,
        ["country_name", "country", "name"],
      );
      const mappedPermDzongkhag = findPkCodeByLabel(
        fetched.permDzongkhag,
        dzongkhagOptions,
        ["dzongkhag_name", "dzongkhag", "name"],
      );
      const mappedCurrDzongkhag = findPkCodeByLabel(
        fetched.currDzongkhag,
        dzongkhagOptions,
        ["dzongkhag_name", "dzongkhag", "name"],
      );

      const mappedOccupation = findPkCodeByLabel(
        fetched.occupation || fetched.designation,
        occupationOptions,
        ["occ_name", "occupation", "name", "occ_pk_code"],
      );

      let mappedOrganizationName = findPkCodeByLabel(
        fetched.organizationName,
        organizationOptions,
        ["lgal_constitution", "name"],
      );
      if (!mappedOrganizationName && fetched.organizationType) {
        mappedOrganizationName = findPkCodeByLabel(
          fetched.organizationType,
          organizationOptions,
          ["lgal_constitution", "name"],
        );
      }

      const mappedEmployerType = mapEmployerType(
        fetched.employerType || fetched.organizationType,
      );
      const determinedEmploymentStatus =
        fetched.employmentStatus === "employed" ||
        fetched.occupation ||
        fetched.employerName
          ? "employed"
          : fetched.employmentStatus || "";

      const rawPermGewog = fetched.permGewog || fetched.permanentGewog || "";
      const rawCurrGewog = fetched.currGewog || fetched.currentGewog || "";

      const sanitized = {
        idType: guarantor.idType,
        idNumber: guarantor.idNumber,
        salutation: fetched.salutation || "",
        guarantorName: fetched.fullName || fetched.applicantName || "",
        nationality: mappedNationality || fetched.nationality || "",
        gender: fetched.gender || "",
        idIssueDate: formatDateForInput(
          fetched.identificationIssueDate || fetched.identityIssuedDate,
        ),
        idExpiryDate: formatDateForInput(
          fetched.identificationExpiryDate || fetched.identityExpiryDate,
        ),
        dateOfBirth: formatDateForInput(fetched.dateOfBirth),
        tpnNo: fetched.tpn || fetched.tpnNumber || "",
        taxIdentifierType: "",
        taxIdentifierNumber: "",
        householdNumber: "",
        maritalStatus: mappedMaritalStatus || fetched.maritalStatus || "",
        spouseIdType: "",
        spouseCid: fetched.spouseIdentificationNo || "",
        spouseSalutation: "",
        spouseName: fetched.spouseName || "",
        spouseNationality: "",
        spouseGender: "",
        spouseIdIssueDate: "",
        spouseIdExpiryDate: "",
        spouseDateOfBirth: "",
        spouseTaxIdentifierType: "",
        spouseTpnNumber: "",
        spouseHouseholdNumber: "",
        spouseContact: fetched.spouseContact || "",
        // Spouse address fields remain empty (not returned by lookup)
        spousePermCountry: "",
        spousePermDzongkhag: "",
        spousePermGewog: "",
        spousePermVillage: "",
        spousePermThram: "",
        spousePermHouse: "",
        spousePermCity: "",
        spousePermPostal: "",
        spousePermAddressProof: "",
        spousePermAddressProofId: "",
        spouseEmail: "",
        spouseCurrContact: "",
        spouseCurrAlternateContact: "",

        familyTree: fetched.familyTree || "",
        familyTreeId: fetched.familyTreeId || "",
        passportPhoto: fetched.passportPhoto || "",
        passportPhotoId: fetched.passportPhotoId || "",
        bankName: mappedBankName || fetched.bankName || "",
        bankAccountNumber: fetched.bankAccount || fetched.bankAccountNo || "",

        permCountry:
          mappedPermCountry ||
          fetched.permCountry ||
          fetched.permanentCountry ||
          "",
        permDzongkhag:
          mappedPermDzongkhag ||
          fetched.permDzongkhag ||
          fetched.permanentDzongkhag ||
          "",
        permGewog: rawPermGewog,
        permVillage:
          fetched.permVillage ||
          fetched.permanentStreet ||
          fetched.permStreet ||
          "",
        permThram: fetched.permThram || fetched.thramNo || "",
        permHouse: fetched.permHouse || fetched.houseNo || "",
        permCity: fetched.permCity || "",
        permPostal: fetched.permPostal || "",
        permAddressProof: fetched.permAddressProof || "",
        permAddressProofId: fetched.permAddressProofId || "",

        currCountry:
          mappedCurrCountry ||
          fetched.currCountry ||
          fetched.currentCountry ||
          "",
        currDzongkhag:
          mappedCurrDzongkhag ||
          fetched.currDzongkhag ||
          fetched.currentDzongkhag ||
          "",
        currGewog: rawCurrGewog,
        currVillage:
          fetched.currVillage ||
          fetched.currStreet ||
          fetched.currentStreet ||
          "",
        currHouse:
          fetched.currFlat ||
          fetched.currHouse ||
          fetched.currentBuildingNo ||
          fetched.currBuildingNo ||
          "",
        currCity: fetched.currCity || "",
        currPostal: fetched.currPostal || "",
        email: fetched.currEmail || fetched.email || fetched.emailId || "",
        contact:
          fetched.currContact || fetched.contactNo || fetched.phone || "",
        currAlternateContact:
          fetched.currAlternateContact ||
          fetched.alternateContactNo ||
          fetched.alternatePhone ||
          "",
        currAddressProof: fetched.currAddressProof || "",
        currAddressProofId: fetched.currAddressProofId || "",

        isPep: fetched.pepPerson || fetched.pepDeclaration || "",
        pepCategory: fetched.pepCategory || "",
        pepSubCategory: fetched.pepSubCategory || "",
        pepUpload: fetched.identificationProof || "",
        pepUploadId: fetched.pepUploadId || "",
        relatedToPep: fetched.pepRelated || fetched.relatedToAnyPep || "",
        relatedPeps: fetched.relatedPeps || [],

        employmentStatus: determinedEmploymentStatus,
        employeeId: fetched.employeeId || "",
        occupation: mappedOccupation || fetched.occupation || "",
        employerType: mappedEmployerType,
        designation: fetched.designation || "",
        grade: fetched.grade || "",
        organizationName:
          mappedOrganizationName ||
          fetched.organizationName ||
          fetched.employerName ||
          "",
        orgLocation:
          fetched.orgLocation ||
          fetched.employerLocation ||
          fetched.organizationLocation ||
          "",
        joiningDate: formatDateForInput(
          fetched.joiningDate || fetched.appointmentDate,
        ),
        serviceNature: fetched.serviceNature || fetched.natureOfService || "",
        annualSalary: fetched.annualSalary || fetched.annualIncome || "",
        contractEndDate: formatDateForInput(fetched.contractEndDate),

        repaymentSourceType: fetched.repaymentSourceType || "",
        amount: fetched.amount || "",
        proofFileId: fetched.proofFileId || "",
        proofFileName: fetched.proofFileName || "",
      };

      let permGewogOptions: any[] = [];
      let currGewogOptions: any[] = [];

      // Logic to fetch gewogs if DZ is populated from lookup
      if (
        sanitized.permCountry &&
        isBhutan(sanitized.permCountry) &&
        sanitized.permDzongkhag
      ) {
        try {
          permGewogOptions = await fetchGewogsByDzongkhag(
            sanitized.permDzongkhag,
          );
          if (rawPermGewog) {
            const converted = findPkCodeByLabel(
              rawPermGewog,
              permGewogOptions,
              ["gewog_name", "gewog", "name", "gewogName"],
            );
            if (converted && converted !== rawPermGewog) {
              sanitized.permGewog = converted;
            } else {
              const cleanedRaw = rawPermGewog
                .toLowerCase()
                .replace(/\s+gewog$/, "");
              const matched = permGewogOptions.find((opt) =>
                [opt.gewog_name, opt.gewog, opt.name].some(
                  (field) =>
                    field?.toLowerCase().replace(/\s+gewog$/, "") ===
                    cleanedRaw,
                ),
              );
              if (matched) {
                sanitized.permGewog = String(
                  matched.gewog_pk_code || matched.id,
                );
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch permanent gewog options", e);
        }
      }

      if (
        sanitized.currCountry &&
        isBhutan(sanitized.currCountry) &&
        sanitized.currDzongkhag
      ) {
        try {
          currGewogOptions = await fetchGewogsByDzongkhag(
            sanitized.currDzongkhag,
          );
          if (rawCurrGewog) {
            const converted = findPkCodeByLabel(
              rawCurrGewog,
              currGewogOptions,
              ["gewog_name", "gewog", "name", "gewogName"],
            );
            if (converted && converted !== rawCurrGewog) {
              sanitized.currGewog = converted;
            } else {
              const cleanedRaw = rawCurrGewog
                .toLowerCase()
                .replace(/\s+gewog$/, "");
              const matched = currGewogOptions.find((opt) =>
                [opt.gewog_name, opt.gewog, opt.name].some(
                  (field) =>
                    field?.toLowerCase().replace(/\s+gewog$/, "") ===
                    cleanedRaw,
                ),
              );
              if (matched) {
                sanitized.currGewog = String(
                  matched.gewog_pk_code || matched.id,
                );
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch current gewog options", e);
        }
      }

      setGuarantors((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...prev[index],
          ...sanitized,
          permGewogOptions,
          currGewogOptions,
          // Spouse gewog options remain empty for now
          spousePermGewogOptions: [],
          pepSubCategoryOptions: prev[index].pepSubCategoryOptions,
          relatedPepOptionsMap: prev[index].relatedPepOptionsMap,
          showLookupPopup: false,
          errors: {}, // Clear errors on fresh fetch
        };
        return updated;
      });
    } else {
      setGuarantors((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          showLookupPopup: false,
        };
        return updated;
      });
    }
  };

  // ...[useEffect hooks for mapping options - same as original code] ...
  useEffect(() => {
    if (nationalityOptions.length > 0) {
      setGuarantors((prev) =>
        prev.map((g) => {
          if (
            g.nationality &&
            !nationalityOptions.some(
              (opt) =>
                String(opt.nationality_pk_code || opt.id) ===
                String(g.nationality),
            )
          ) {
            const converted = findPkCodeByLabel(
              g.nationality,
              nationalityOptions,
              ["nationality", "name"],
            );
            return converted ? { ...g, nationality: converted } : g;
          }
          return g;
        }),
      );
    }
  }, [nationalityOptions]);

  useEffect(() => {
    if (maritalStatusOptions.length > 0) {
      setGuarantors((prev) =>
        prev.map((g) => {
          if (
            g.maritalStatus &&
            !maritalStatusOptions.some(
              (opt) =>
                String(opt.marital_status_pk_code || opt.id) ===
                String(g.maritalStatus),
            )
          ) {
            const converted = findPkCodeByLabel(
              g.maritalStatus,
              maritalStatusOptions,
              ["marital_status", "name"],
            );
            return converted ? { ...g, maritalStatus: converted } : g;
          }
          return g;
        }),
      );
    }
  }, [maritalStatusOptions]);

  useEffect(() => {
    if (banksOptions.length > 0) {
      setGuarantors((prev) =>
        prev.map((g) => {
          if (
            g.bankName &&
            !banksOptions.some(
              (opt) =>
                String(opt.bank_pk_code || opt.id) === String(g.bankName),
            )
          ) {
            const converted = findPkCodeByLabel(g.bankName, banksOptions, [
              "bank_name",
              "name",
              "bank",
            ]);
            return converted ? { ...g, bankName: converted } : g;
          }
          return g;
        }),
      );
    }
  }, [banksOptions]);

  useEffect(() => {
    if (countryOptions.length > 0) {
      setGuarantors((prev) =>
        prev.map((g) => {
          if (
            g.permCountry &&
            !countryOptions.some(
              (opt) =>
                String(opt.country_pk_code || opt.id) === String(g.permCountry),
            )
          ) {
            const converted = findPkCodeByLabel(g.permCountry, countryOptions, [
              "country_name",
              "country",
              "name",
            ]);
            if (converted) g.permCountry = converted;
          }
          if (
            g.currCountry &&
            !countryOptions.some(
              (opt) =>
                String(opt.country_pk_code || opt.id) === String(g.currCountry),
            )
          ) {
            const converted = findPkCodeByLabel(g.currCountry, countryOptions, [
              "country_name",
              "country",
              "name",
            ]);
            if (converted) g.currCountry = converted;
          }
          // Spouse country fields
          if (
            g.spousePermCountry &&
            !countryOptions.some(
              (opt) =>
                String(opt.country_pk_code || opt.id) ===
                String(g.spousePermCountry),
            )
          ) {
            const converted = findPkCodeByLabel(
              g.spousePermCountry,
              countryOptions,
              ["country_name", "country", "name"],
            );
            if (converted) g.spousePermCountry = converted;
          }
          return g;
        }),
      );
    }
  }, [countryOptions]);

  useEffect(() => {
    if (dzongkhagOptions.length > 0) {
      setGuarantors((prev) =>
        prev.map((g) => {
          if (
            g.permDzongkhag &&
            !dzongkhagOptions.some(
              (opt) =>
                String(opt.dzongkhag_pk_code || opt.id) ===
                String(g.permDzongkhag),
            )
          ) {
            const converted = findPkCodeByLabel(
              g.permDzongkhag,
              dzongkhagOptions,
              ["dzongkhag_name", "dzongkhag", "name"],
            );
            if (converted) g.permDzongkhag = converted;
          }
          if (
            g.currDzongkhag &&
            !dzongkhagOptions.some(
              (opt) =>
                String(opt.dzongkhag_pk_code || opt.id) ===
                String(g.currDzongkhag),
            )
          ) {
            const converted = findPkCodeByLabel(
              g.currDzongkhag,
              dzongkhagOptions,
              ["dzongkhag_name", "dzongkhag", "name"],
            );
            if (converted) g.currDzongkhag = converted;
          }
          // Spouse dzongkhag fields
          if (
            g.spousePermDzongkhag &&
            !dzongkhagOptions.some(
              (opt) =>
                String(opt.dzongkhag_pk_code || opt.id) ===
                String(g.spousePermDzongkhag),
            )
          ) {
            const converted = findPkCodeByLabel(
              g.spousePermDzongkhag,
              dzongkhagOptions,
              ["dzongkhag_name", "dzongkhag", "name"],
            );
            if (converted) g.spousePermDzongkhag = converted;
          }
          return g;
        }),
      );
    }
  }, [dzongkhagOptions]);

  useEffect(() => {
    if (occupationOptions.length > 0) {
      setGuarantors((prev) =>
        prev.map((g) => {
          if (
            g.occupation &&
            !occupationOptions.some(
              (opt) =>
                String(opt.occ_pk_code || opt.id) === String(g.occupation),
            )
          ) {
            const converted = findPkCodeByLabel(
              g.occupation,
              occupationOptions,
              ["occ_name", "occupation", "name"],
            );
            return converted ? { ...g, occupation: converted } : g;
          }
          return g;
        }),
      );
    }
  }, [occupationOptions]);

  useEffect(() => {
    if (organizationOptions.length > 0) {
      setGuarantors((prev) =>
        prev.map((g) => {
          if (
            g.organizationName &&
            !organizationOptions.some(
              (opt) =>
                String(opt.lgal_constitution_pk_code || opt.id) ===
                String(g.organizationName),
            )
          ) {
            const converted = findPkCodeByLabel(
              g.organizationName,
              organizationOptions,
              ["lgal_constitution", "name"],
            );
            return converted ? { ...g, organizationName: converted } : g;
          }
          return g;
        }),
      );
    }
  }, [organizationOptions]);

  // File upload handlers with IndexedDB
  const handleBusinessIncomeFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const fileId = await storeFile(file);
        setBusinessIncomeData({
          ...businessIncomeData,
          proofFileId: fileId,
          proofFileName: file.name,
        });
        if (businessErrors.proofFile) {
          const newErrors = { ...businessErrors };
          delete newErrors.proofFile;
          setBusinessErrors(newErrors);
        }
      } catch (error) {
        console.error("Failed to save file to IndexedDB", error);
      }
    }
  };

  const handleFileChange = async (
    index: number,
    fieldName: string,
    file: File | null,
  ) => {
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      const maxSize = 5 * 1024 * 1024;

      if (!allowedTypes.includes(file.type)) {
        setGuarantors((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            errors: {
              ...updated[index].errors,
              [fieldName]: "Only PDF, JPG, JPEG, and PNG files are allowed",
            },
          };
          return updated;
        });
        return;
      }

      if (file.size > maxSize) {
        setGuarantors((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            errors: {
              ...updated[index].errors,
              [fieldName]: "File size must be less than 5MB",
            },
          };
          return updated;
        });
        return;
      }

      try {
        // Delete old file if exists
        const oldFileId = guarantors[index]?.[`${fieldName}Id`];
        if (oldFileId) {
          await deleteFile(oldFileId).catch(console.error);
        }

        const fileId = await storeFile(file);
        setGuarantors((prev) => {
          const updated = [...prev];
          const newErrors = { ...updated[index].errors };
          delete newErrors[fieldName];
          updated[index] = {
            ...updated[index],
            [fieldName]: file.name, // store file name for display
            [`${fieldName}Id`]: fileId, // store file ID
            errors: newErrors,
          };
          return updated;
        });
      } catch (error) {
        console.error("Failed to save file to IndexedDB", error);
      }
    }
  };

  const handleGuarantorProofChange = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      const maxSize = 5 * 1024 * 1024;

      if (!allowedTypes.includes(file.type)) {
        setGuarantors((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            errors: {
              ...updated[index].errors,
              proofFile: "Only PDF, JPG, JPEG, and PNG files are allowed",
            },
          };
          return updated;
        });
        return;
      }

      if (file.size > maxSize) {
        setGuarantors((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            errors: {
              ...updated[index].errors,
              proofFile: "File size must be less than 5MB",
            },
          };
          return updated;
        });
        return;
      }

      try {
        // Delete old file if exists
        const oldFileId = guarantors[index]?.proofFileId;
        if (oldFileId) {
          await deleteFile(oldFileId).catch(console.error);
        }

        const fileId = await storeFile(file);
        setGuarantors((prev) => {
          const updated = [...prev];
          const newErrors = { ...updated[index].errors };
          delete newErrors.proofFile;

          updated[index] = {
            ...updated[index],
            proofFileId: fileId,
            proofFileName: file.name,
            errors: newErrors,
          };
          return updated;
        });
      } catch (error) {
        console.error("Failed to save file to IndexedDB", error);
      }
    }
  };

  const handleRelatedPepFileChange = async (
    gIndex: number,
    pIndex: number,
    field: string,
    file: File | null,
  ) => {
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      const maxSize = 5 * 1024 * 1024;
      if (!allowedTypes.includes(file.type)) return;
      if (file.size > maxSize) return;

      try {
        // Delete old file if exists
        const oldFileId =
          guarantors[gIndex]?.relatedPeps?.[pIndex]?.[`${field}Id`];
        if (oldFileId) {
          await deleteFile(oldFileId).catch(console.error);
        }

        const fileId = await storeFile(file);
        setGuarantors((prev) => {
          const updated = [...prev];
          const relatedPeps = [...updated[gIndex].relatedPeps];
          relatedPeps[pIndex] = {
            ...relatedPeps[pIndex],
            [field]: file.name,
            [`${field}Id`]: fileId,
          };
          updated[gIndex].relatedPeps = relatedPeps;
          return updated;
        });
      } catch (error) {
        console.error("Failed to save file to IndexedDB", error);
      }
    }
  };

  const addGuarantor = () => {
    setGuarantors([...guarantors, createEmptyGuarantor()]);
  };

  const removeGuarantor = async (index: number) => {
    if (guarantors.length > 1) {
      // Delete all files associated with this guarantor from IndexedDB
      const guarantor = guarantors[index];
      const fileIds = [
        guarantor.passportPhotoId,
        guarantor.familyTreeId,
        guarantor.permAddressProofId,
        guarantor.currAddressProofId,
        guarantor.pepUploadId,
        guarantor.proofFileId,
        guarantor.spousePermAddressProofId,
        ...(guarantor.relatedPeps?.map((p: any) => p.identificationProofId) ||
          []),
        ...(guarantor.relatedPeps?.map((p: any) => p.permAddressProofId) || []),
        ...(guarantor.relatedPeps?.map((p: any) => p.currAddressProofId) || []),
        ...(guarantor.relatedPeps?.map(
          (p: any) => p.spousePermAddressProofId,
        ) || []),
      ].filter(Boolean);
      await Promise.all(
        fileIds.map((id) => deleteFile(id).catch(console.error)),
      );

      setGuarantors(guarantors.filter((_, i) => i !== index));
    }
  };

  const updateGuarantorField = (index: number, field: string, value: any) => {
    setGuarantors((prev) => {
      const updated = [...prev];
      const newErrors = { ...updated[index].errors };
      // Clear error immediately on change
      delete newErrors[field];

      updated[index] = {
        ...updated[index],
        [field]: value,
        ...(field === "isPep" && value === "yes" ? { relatedToPep: "" } : {}),
        ...(field === "isPep" && value === "no"
          ? {
              pepCategory: "",
              pepSubCategory: "",
              pepUpload: "",
              pepUploadId: "",
            }
          : {}),
        ...(field === "relatedToPep" && value === "yes"
          ? {
              relatedPeps: updated[index].relatedPeps?.length
                ? updated[index].relatedPeps
                : [createEmptyRelatedPep()],
            }
          : {}),
        ...(field === "relatedToPep" && value === "no"
          ? { relatedPeps: [] }
          : {}),
        ...(field === "permDzongkhag"
          ? { permGewog: "", permGewogOptions: [] }
          : {}),
        ...(field === "currDzongkhag"
          ? { currGewog: "", currGewogOptions: [] }
          : {}),
        ...(field === "permCountry"
          ? {
              permDzongkhag: "",
              permGewog: "",
              permThram: "",
              permHouse: "",
              permCity: "",
              permPostal: "",
            }
          : {}),
        ...(field === "currCountry"
          ? { currDzongkhag: "", currGewog: "", currCity: "", currPostal: "" }
          : {}),
        ...(field === "serviceNature" && value !== "contract"
          ? { contractEndDate: "" }
          : {}),
        // Spouse address clearings
        ...(field === "spousePermDzongkhag"
          ? { spousePermGewog: "", spousePermGewogOptions: [] }
          : {}),
        ...(field === "spousePermCountry"
          ? {
              spousePermDzongkhag: "",
              spousePermGewog: "",
              spousePermThram: "",
              spousePermHouse: "",
              spousePermCity: "",
              spousePermPostal: "",
            }
          : {}),
        // Clear spouse personal fields when spouseNationality changes
        ...(field === "spouseNationality" ? { spouseHouseholdNumber: "" } : {}),
        errors: newErrors,
      };
      return updated;
    });
  };

  const handleAddRelatedPep = (index: number) => {
    setGuarantors((prev) => {
      const updatedGuarantors = [...prev];
      const currentGuarantor = { ...updatedGuarantors[index] };
      const currentRelatedPeps = currentGuarantor.relatedPeps
        ? [...currentGuarantor.relatedPeps]
        : [];
      currentRelatedPeps.push(createEmptyRelatedPep());
      currentGuarantor.relatedPeps = currentRelatedPeps;
      updatedGuarantors[index] = currentGuarantor;
      return updatedGuarantors;
    });
  };

  const handleRemoveRelatedPep = async (gIndex: number, pIndex: number) => {
    // Delete the associated file from IndexedDB
    const pepToDelete = guarantors[gIndex]?.relatedPeps?.[pIndex];
    if (pepToDelete) {
      if (pepToDelete.identificationProofId)
        deleteFile(pepToDelete.identificationProofId).catch(console.error);
      if (pepToDelete.permAddressProofId)
        deleteFile(pepToDelete.permAddressProofId).catch(console.error);
      if (pepToDelete.currAddressProofId)
        deleteFile(pepToDelete.currAddressProofId).catch(console.error);
      if (pepToDelete.spousePermAddressProofId)
        deleteFile(pepToDelete.spousePermAddressProofId).catch(console.error);
    }

    setGuarantors((prev) => {
      const up = [...prev];
      if (!up[gIndex].relatedPeps) return up;
      const updatedRelatedPeps = [...up[gIndex].relatedPeps];
      updatedRelatedPeps.splice(pIndex, 1);
      up[gIndex].relatedPeps = updatedRelatedPeps;
      return up;
    });
  };

  const handleRelatedPepChange = (
    gIndex: number,
    pIndex: number,
    field: string,
    value: string,
  ) => {
    setGuarantors((prev) => {
      const up = [...prev];
      const peps = [...up[gIndex].relatedPeps];
      const currentPep = { ...peps[pIndex] };
      // Update field
      currentPep[field] = value;

      if (field === "permDzongkhag") {
        currentPep.permGewog = "";
        currentPep.permGewogOptions = [];
      }
      if (field === "currDzongkhag") {
        currentPep.currGewog = "";
        currentPep.currGewogOptions = [];
      }
      if (field === "spousePermDzongkhag") {
        currentPep.spousePermGewog = "";
        currentPep.spousePermGewogOptions = [];
      }

      peps[pIndex] = currentPep;
      up[gIndex].relatedPeps = peps;

      // Also clear errors for this specific field in relatedPep
      const nestedErrorKey = `relatedPeps.${pIndex}.${field}`;
      const newErrors = { ...up[gIndex].errors };
      delete newErrors[nestedErrorKey];
      up[gIndex].errors = newErrors;

      if (field === "category") {
        peps[pIndex].subCategory = "";
        up[gIndex].relatedPeps = peps;
        fetchPepSubCategoryByCategory(value).then((res) => {
          setGuarantors((curr) => {
            const cUp = [...curr];
            if (!cUp[gIndex].relatedPepOptionsMap)
              cUp[gIndex].relatedPepOptionsMap = {};
            cUp[gIndex].relatedPepOptionsMap = {
              ...cUp[gIndex].relatedPepOptionsMap,
              [pIndex]: res || [],
            };
            return cUp;
          });
        });
      }
      return up;
    });
  };

  // Pure function to validate validators without side effects (returns the new array)
  const calculateGuarantorValidation = (): {
    allValid: boolean;
    updatedGuarantors: any[];
  } => {
    let allValid = true;

    // We map to create a fresh array
    const updatedGuarantors = guarantors.map((guarantor) => {
      // Start with a FRESH error object.
      const newErrors: Record<string, string> = {};

      const check = (field: string, condition: boolean, message: string) => {
        if (condition) {
          newErrors[field] = message;
        }
      };

      // Personal Information
      check("idType", isRequired(guarantor.idType), "idType is required");
      check("idNumber", isRequired(guarantor.idNumber), "idNumber is required");
      if (guarantor.idNumber && !isValidCID(guarantor.idNumber)) {
        newErrors["idNumber"] = "CID must be 11 digits";
      }

      check(
        "salutation",
        isRequired(guarantor.salutation),
        "salutation is required",
      );
      check(
        "guarantorName",
        isRequired(guarantor.guarantorName),
        "guarantorName is required",
      );
      check(
        "nationality",
        isRequired(guarantor.nationality),
        "nationality is required",
      );
      check("gender", isRequired(guarantor.gender), "gender is required");
      check(
        "idIssueDate",
        isRequired(guarantor.idIssueDate),
        "idIssueDate is required",
      );
      check(
        "idExpiryDate",
        isRequired(guarantor.idExpiryDate),
        "idExpiryDate is required",
      );
      check(
        "dateOfBirth",
        isRequired(guarantor.dateOfBirth),
        "dateOfBirth is required",
      );
      if (guarantor.dateOfBirth && !isLegalAge(guarantor.dateOfBirth)) {
        newErrors["dateOfBirth"] = "Guarantor must be at least 18 years old";
      }

      check(
        "maritalStatus",
        isRequired(guarantor.maritalStatus),
        "maritalStatus is required",
      );
      check("bankName", isRequired(guarantor.bankName), "bankName is required");
      check(
        "bankAccountNumber",
        isRequired(guarantor.bankAccountNumber),
        "bankAccountNumber is required",
      );

      // Spouse fields if married
      if (getIsMarried(guarantor)) {
        // Personal details
        check(
          "spouseIdType",
          isRequired(guarantor.spouseIdType),
          "Spouse ID Type is required",
        );
        check(
          "spouseCid",
          isRequired(guarantor.spouseCid),
          "Spouse ID Number is required",
        );
        if (guarantor.spouseCid && !isValidCID(guarantor.spouseCid)) {
          newErrors["spouseCid"] = "CID must be 11 digits";
        }
        check(
          "spouseSalutation",
          isRequired(guarantor.spouseSalutation),
          "Spouse Salutation is required",
        );
        check(
          "spouseName",
          isRequired(guarantor.spouseName),
          "Spouse Name is required",
        );
        check(
          "spouseNationality",
          isRequired(guarantor.spouseNationality),
          "Spouse Nationality is required",
        );
        check(
          "spouseGender",
          isRequired(guarantor.spouseGender),
          "Spouse Gender is required",
        );
        check(
          "spouseIdIssueDate",
          isRequired(guarantor.spouseIdIssueDate),
          "Spouse ID Issue Date is required",
        );
        check(
          "spouseIdExpiryDate",
          isRequired(guarantor.spouseIdExpiryDate),
          "Spouse ID Expiry Date is required",
        );
        check(
          "spouseDateOfBirth",
          isRequired(guarantor.spouseDateOfBirth),
          "Spouse Date of Birth is required",
        );
        if (
          guarantor.spouseDateOfBirth &&
          !isLegalAge(guarantor.spouseDateOfBirth)
        ) {
          newErrors["spouseDateOfBirth"] =
            "Spouse must be at least 18 years old";
        }

        if (
          isNationalityBhutanese(guarantor.spouseNationality) &&
          isRequired(guarantor.spouseHouseholdNumber)
        ) {
          newErrors["spouseHouseholdNumber"] = "Household number is required";
        }

        // Spouse Permanent Address validation
        const isSpousePermBhutan =
          guarantor.spousePermCountry && isBhutan(guarantor.spousePermCountry);
        check(
          "spousePermCountry",
          isRequired(guarantor.spousePermCountry),
          "Spouse Country is required",
        );
        if (isSpousePermBhutan) {
          check(
            "spousePermDzongkhag",
            isRequired(guarantor.spousePermDzongkhag),
            "Spouse Dzongkhag is required",
          );
          check(
            "spousePermGewog",
            isRequired(guarantor.spousePermGewog),
            "Spouse Gewog is required",
          );
          check(
            "spousePermVillage",
            isRequired(guarantor.spousePermVillage),
            "Spouse Village/Street is required",
          );
        } else if (guarantor.spousePermCountry) {
          check(
            "spousePermDzongkhag",
            isRequired(guarantor.spousePermDzongkhag),
            "Spouse State is required",
          );
          check(
            "spousePermGewog",
            isRequired(guarantor.spousePermGewog),
            "Spouse Province is required",
          );
          check(
            "spousePermVillage",
            isRequired(guarantor.spousePermVillage),
            "Spouse Street name is required",
          );
          check(
            "spousePermCity",
            isRequired(guarantor.spousePermCity),
            "Spouse City is required",
          );
          check(
            "spousePermAddressProof",
            !guarantor.spousePermAddressProofId,
            "Spouse Address proof is required",
          );
        }

        check(
          "spouseEmail",
          isRequired(guarantor.spouseEmail),
          "Spouse Email is required",
        );
        if (guarantor.spouseEmail && !isValidEmail(guarantor.spouseEmail)) {
          newErrors["spouseEmail"] = "Invalid email format";
        }
        check(
          "spouseCurrContact",
          isRequired(guarantor.spouseCurrContact),
          "Spouse Contact is required",
        );
        if (
          guarantor.spouseCurrContact &&
          !isValidMobile(guarantor.spouseCurrContact)
        ) {
          newErrors["spouseCurrContact"] =
            "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";
        }
        if (
          guarantor.spouseCurrAlternateContact &&
          !isValidMobile(guarantor.spouseCurrAlternateContact)
        ) {
          newErrors["spouseCurrAlternateContact"] =
            "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";
        }
      }

      // Permanent Address
      check(
        "permCountry",
        isRequired(guarantor.permCountry),
        "permCountry is required",
      );
      const isBhutanPerm =
        guarantor.permCountry && isBhutan(guarantor.permCountry);

      if (isBhutanPerm) {
        check(
          "permDzongkhag",
          isRequired(guarantor.permDzongkhag),
          "Dzongkhag is required",
        );
        check(
          "permGewog",
          isRequired(guarantor.permGewog),
          "Gewog is required",
        );
        check(
          "permVillage",
          isRequired(guarantor.permVillage),
          "Village/Street is required",
        );
      } else if (guarantor.permCountry) {
        check(
          "permDzongkhag",
          isRequired(guarantor.permDzongkhag),
          "State is required",
        );
        check(
          "permGewog",
          isRequired(guarantor.permGewog),
          "Province is required",
        );
        check(
          "permVillage",
          isRequired(guarantor.permVillage),
          "Street name is required",
        );
        check("permCity", isRequired(guarantor.permCity), "City is required");
        check(
          "permAddressProof",
          !guarantor.permAddressProofId,
          "Address proof is required",
        );
      }

      // Current Address
      check(
        "currCountry",
        isRequired(guarantor.currCountry),
        "currCountry is required",
      );
      const isBhutanCurr =
        guarantor.currCountry && isBhutan(guarantor.currCountry);

      if (isBhutanCurr) {
        check(
          "currDzongkhag",
          isRequired(guarantor.currDzongkhag),
          "Dzongkhag is required",
        );
        check(
          "currGewog",
          isRequired(guarantor.currGewog),
          "Gewog is required",
        );
        check(
          "currVillage",
          isRequired(guarantor.currVillage),
          "Village/Street is required",
        );
      } else if (guarantor.currCountry) {
        check(
          "currDzongkhag",
          isRequired(guarantor.currDzongkhag),
          "State is required",
        );
        check(
          "currGewog",
          isRequired(guarantor.currGewog),
          "Province is required",
        );
        check(
          "currVillage",
          isRequired(guarantor.currVillage),
          "Street name is required",
        );
        check("currCity", isRequired(guarantor.currCity), "City is required");
        check(
          "currAddressProof",
          !guarantor.currAddressProofId,
          "Address proof is required",
        );
      }

      check("email", isRequired(guarantor.email), "Email is required");
      if (guarantor.email && !isValidEmail(guarantor.email)) {
        newErrors["email"] = "Invalid email format";
      }

      check("contact", isRequired(guarantor.contact), "Contact is required");
      if (guarantor.contact && !isValidMobile(guarantor.contact)) {
        newErrors["contact"] =
          "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";
      }

      if (
        guarantor.currAlternateContact &&
        !isValidMobile(guarantor.currAlternateContact)
      ) {
        newErrors["currAlternateContact"] =
          "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";
      }

      // PEP Declaration
      check("isPep", isRequired(guarantor.isPep), "PEP status is required");
      if (guarantor.isPep === "yes") {
        check(
          "pepCategory",
          isRequired(guarantor.pepCategory),
          "PEP category is required",
        );
        check(
          "pepSubCategory",
          isRequired(guarantor.pepSubCategory),
          "PEP sub-category is required",
        );
        check(
          "pepUpload",
          !guarantor.pepUploadId,
          "Identification proof is required",
        );
      }

      if (guarantor.isPep === "no") {
        check(
          "relatedToPep",
          isRequired(guarantor.relatedToPep),
          "Please indicate if related to a PEP",
        );
        if (guarantor.relatedToPep === "yes") {
          (guarantor.relatedPeps || []).forEach((pep: any, pepIdx: number) => {
            const pepBase = `relatedPeps.${pepIdx}`;

            // Base PEP Fields
            check(
              `${pepBase}.relationship`,
              isRequired(pep.relationship),
              "Required",
            );
            check(`${pepBase}.category`, isRequired(pep.category), "Required");
            check(
              `${pepBase}.subCategory`,
              isRequired(pep.subCategory),
              "Required",
            );
            check(
              `${pepBase}.identificationProof`,
              !pep.identificationProofId,
              "Required",
            );

            // PEP Personal Information
            const pepPersonal = [
              "identificationType",
              "identificationNo",
              "salutation",
              "applicantName",
              "nationality",
              "gender",
              "idIssueDate",
              "idExpiryDate",
              "dateOfBirth",
              "maritalStatus",
            ];
            pepPersonal.forEach((f) => {
              check(`${pepBase}.${f}`, isRequired(pep[f]), "Required");
            });

            if (pep.identificationNo && !isValidCID(pep.identificationNo))
              newErrors[`${pepBase}.identificationNo`] =
                "CID must be 11 digits";
            if (pep.dateOfBirth && !isLegalAge(pep.dateOfBirth))
              newErrors[`${pepBase}.dateOfBirth`] = "Must be >= 18 years old";

            if (
              isNationalityBhutanese(pep.nationality) &&
              isRequired(pep.householdNumber)
            ) {
              newErrors[`${pepBase}.householdNumber`] = "Required";
            }

            // PEP Spouse Information
            if (getPepIsMarried(pep)) {
              const pepSpouseRequired = [
                "spouseIdType",
                "spouseIdNumber",
                "spouseSalutation",
                "spouseName",
                "spouseNationality",
                "spouseGender",
                "spouseIdIssueDate",
                "spouseIdExpiryDate",
                "spouseDob",
                "spousePermCountry",
                "spouseEmail",
                "spouseContact",
              ];
              pepSpouseRequired.forEach((f) => {
                check(`${pepBase}.${f}`, isRequired(pep[f]), "Required");
              });

              if (pep.spouseIdNumber && !isValidCID(pep.spouseIdNumber))
                newErrors[`${pepBase}.spouseIdNumber`] =
                  "CID must be 11 digits";
              if (pep.spouseDob && !isLegalAge(pep.spouseDob))
                newErrors[`${pepBase}.spouseDob`] = "Must be >= 18 years old";
              if (pep.spouseEmail && !isValidEmail(pep.spouseEmail))
                newErrors[`${pepBase}.spouseEmail`] = "Invalid email";
              if (pep.spouseContact && !isValidMobile(pep.spouseContact))
                newErrors[`${pepBase}.spouseContact`] = "Invalid number";
              if (
                pep.spouseAlternateContact &&
                !isValidMobile(pep.spouseAlternateContact)
              )
                newErrors[`${pepBase}.spouseAlternateContact`] =
                  "Invalid number";

              if (
                isNationalityBhutanese(pep.spouseNationality) &&
                isRequired(pep.spouseHouseholdNumber)
              ) {
                newErrors[`${pepBase}.spouseHouseholdNumber`] = "Required";
              }

              const isPepSpouseBhutanPerm = countryOptions.some(
                (c) =>
                  String(c.country_pk_code || c.id || c.code) ===
                    pep.spousePermCountry &&
                  (c.country || c.name || "").toLowerCase().includes("bhutan"),
              );
              if (isPepSpouseBhutanPerm) {
                check(
                  `${pepBase}.spousePermDzongkhag`,
                  isRequired(pep.spousePermDzongkhag),
                  "Required",
                );
                check(
                  `${pepBase}.spousePermGewog`,
                  isRequired(pep.spousePermGewog),
                  "Required",
                );
                check(
                  `${pepBase}.spousePermVillage`,
                  isRequired(pep.spousePermVillage),
                  "Required",
                );
                check(
                  `${pepBase}.spousePermThram`,
                  isRequired(pep.spousePermThram),
                  "Required",
                );
                check(
                  `${pepBase}.spousePermHouse`,
                  isRequired(pep.spousePermHouse),
                  "Required",
                );
              } else if (pep.spousePermCountry) {
                check(
                  `${pepBase}.spousePermDzongkhag`,
                  isRequired(pep.spousePermDzongkhag),
                  "Required",
                );
                check(
                  `${pepBase}.spousePermGewog`,
                  isRequired(pep.spousePermGewog),
                  "Required",
                );
                check(
                  `${pepBase}.spousePermVillage`,
                  isRequired(pep.spousePermVillage),
                  "Required",
                );
                check(
                  `${pepBase}.spousePermAddressProof`,
                  !pep.spousePermAddressProofId,
                  "Required",
                );
              }
            }

            // PEP Permanent Address
            check(
              `${pepBase}.permCountry`,
              isRequired(pep.permCountry),
              "Required",
            );
            const isPepBhutanPerm = countryOptions.some(
              (c) =>
                String(c.country_pk_code || c.id) === pep.permCountry &&
                (c.country || c.name || "").toLowerCase().includes("bhutan"),
            );
            if (isPepBhutanPerm) {
              check(
                `${pepBase}.permDzongkhag`,
                isRequired(pep.permDzongkhag),
                "Required",
              );
              check(
                `${pepBase}.permGewog`,
                isRequired(pep.permGewog),
                "Required",
              );
              check(
                `${pepBase}.permVillage`,
                isRequired(pep.permVillage),
                "Required",
              );
              check(
                `${pepBase}.permThram`,
                isRequired(pep.permThram),
                "Required",
              );
              check(
                `${pepBase}.permHouse`,
                isRequired(pep.permHouse),
                "Required",
              );
            } else if (pep.permCountry) {
              check(
                `${pepBase}.permDzongkhag`,
                isRequired(pep.permDzongkhag),
                "Required",
              );
              check(
                `${pepBase}.permGewog`,
                isRequired(pep.permGewog),
                "Required",
              );
              check(
                `${pepBase}.permVillage`,
                isRequired(pep.permVillage),
                "Required",
              );
              check(
                `${pepBase}.permAddressProof`,
                !pep.permAddressProofId,
                "Required",
              );
            }

            // PEP Current Address
            check(
              `${pepBase}.currCountry`,
              isRequired(pep.currCountry),
              "Required",
            );
            const isPepBhutanCurr = countryOptions.some(
              (c) =>
                String(c.country_pk_code || c.id) === pep.currCountry &&
                (c.country || c.name || "").toLowerCase().includes("bhutan"),
            );
            if (isPepBhutanCurr) {
              check(
                `${pepBase}.currDzongkhag`,
                isRequired(pep.currDzongkhag),
                "Required",
              );
              check(
                `${pepBase}.currGewog`,
                isRequired(pep.currGewog),
                "Required",
              );
              check(
                `${pepBase}.currVillage`,
                isRequired(pep.currVillage),
                "Required",
              );
              check(
                `${pepBase}.currHouse`,
                isRequired(pep.currHouse),
                "Required",
              );
            } else if (pep.currCountry) {
              check(
                `${pepBase}.currDzongkhag`,
                isRequired(pep.currDzongkhag),
                "Required",
              );
              check(
                `${pepBase}.currGewog`,
                isRequired(pep.currGewog),
                "Required",
              );
              check(
                `${pepBase}.currVillage`,
                isRequired(pep.currVillage),
                "Required",
              );
              check(
                `${pepBase}.currAddressProof`,
                !pep.currAddressProofId,
                "Required",
              );
            }

            // PEP Contact
            check(`${pepBase}.email`, isRequired(pep.email), "Required");
            if (pep.email && !isValidEmail(pep.email))
              newErrors[`${pepBase}.email`] = "Invalid email";

            check(`${pepBase}.contact`, isRequired(pep.contact), "Required");
            if (pep.contact && !isValidMobile(pep.contact))
              newErrors[`${pepBase}.contact`] = "Invalid number";

            if (pep.alternateContact && !isValidMobile(pep.alternateContact))
              newErrors[`${pepBase}.alternateContact`] = "Invalid number";
          });
        }
      }

      // Repayment Source
      check(
        "repaymentSourceType",
        isRequired(guarantor.repaymentSourceType),
        "Repayment source type is required",
      );
      check("amount", isRequired(guarantor.amount), "Amount is required");
      check("proofFile", !guarantor.proofFileId, "Proof file is required");

      // Employment
      check(
        "employmentStatus",
        isRequired(guarantor.employmentStatus),
        "Employment status is required",
      );

      if (guarantor.employmentStatus === "employed") {
        check(
          "employeeId",
          isRequired(guarantor.employeeId),
          "employeeId is required",
        );
        check(
          "occupation",
          isRequired(guarantor.occupation),
          "occupation is required",
        );
        check(
          "employerType",
          isRequired(guarantor.employerType),
          "employerType is required",
        );
        check(
          "designation",
          isRequired(guarantor.designation),
          "designation is required",
        );
        check("grade", isRequired(guarantor.grade), "grade is required");
        check(
          "organizationName",
          isRequired(guarantor.organizationName),
          "organizationName is required",
        );
        check(
          "orgLocation",
          isRequired(guarantor.orgLocation),
          "orgLocation is required",
        );
        check(
          "joiningDate",
          isRequired(guarantor.joiningDate),
          "joiningDate is required",
        );
        check(
          "annualSalary",
          isRequired(guarantor.annualSalary),
          "annualSalary is required",
        );
        check(
          "serviceNature",
          isRequired(guarantor.serviceNature),
          "serviceNature is required",
        );
        if (guarantor.serviceNature === "contract") {
          check(
            "contractEndDate",
            isRequired(guarantor.contractEndDate),
            "contractEndDate is required",
          );
        }
      }

      if (Object.keys(newErrors).length > 0) {
        allValid = false;
        return { ...guarantor, errors: newErrors };
      }
      return { ...guarantor, errors: {} };
    });

    return { allValid, updatedGuarantors };
  };

  const scrollToFirstError = () => {
    setTimeout(() => {
      const errorElements = document.querySelectorAll(".border-red-500");
      if (errorElements.length > 0) {
        errorElements[0].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        (errorElements[0] as HTMLElement).focus();
      }
    }, 100);
  };

  const handleNext = () => {
    let isValid = true;

    // 1. Validate Business Income
    const newBusinessErrors: Record<string, string> = {};
    if (!businessIncomeData.amount) {
      newBusinessErrors.amount = "Amount is required";
      isValid = false;
    }
    if (!businessIncomeData.proofFileId) {
      newBusinessErrors.proofFile = "Proof file is required";
      isValid = false;
    }
    setBusinessErrors(newBusinessErrors);

    // 2. Validate Guarantors (if applicable)
    if (isGuarantorApplicable === "Yes") {
      if (guarantors.length === 0) {
        alert("Please add at least one guarantor");
        return;
      }

      // Use the pure function to get the latest validation state
      const { allValid, updatedGuarantors } = calculateGuarantorValidation();

      // Update state regardless of validity to show errors
      setGuarantors(updatedGuarantors);

      if (!allValid) {
        isValid = false;
      }
    }

    if (!isValid) {
      alert("Please fix the errors highlighted in red before proceeding.");
      scrollToFirstError();
      return;
    }

    // --- Prepare data for session storage, adding string labels for code fields ---
    const getLabel = (
      code: string,
      options: any[],
      labelField: string,
    ): string => {
      if (!code || !options) return "";
      const option = options.find(
        (opt) =>
          String(
            opt.bank_pk_code ||
              opt.country_pk_code ||
              opt.nationality_pk_code ||
              opt.identity_type_pk_code ||
              opt.marital_status_pk_code ||
              opt.occ_pk_code ||
              opt.lgal_constitution_pk_code ||
              opt.dzongkhag_pk_code ||
              opt.gewog_pk_code ||
              opt.pep_category_pk_code ||
              opt.pep_sub_category_pk_code ||
              opt.id,
          ) === String(code),
      );
      if (option) {
        return option[labelField] || option.name || "";
      }
      return "";
    };

    const repaymentSourceData = {
      businessIncome: businessIncomeData, // already contains fileId and fileName
      isGuarantorApplicable,
      guarantors: guarantors.map((g) => {
        // Extract temporary options and metadata (they won't be stored)
        const {
          permGewogOptions,
          currGewogOptions,
          spousePermGewogOptions,
          pepSubCategoryOptions,
          relatedPepOptionsMap,
          fetchedCustomerData,
          showLookupPopup,
          lookupStatus,
          errors,
          ...cleanGuarantor
        } = g;

        // Map each code field to its string label
        const idTypeLabel = getLabel(
          cleanGuarantor.idType,
          identificationTypeOptions,
          "identity_type",
        );
        const nationalityLabel = getLabel(
          cleanGuarantor.nationality,
          nationalityOptions,
          "nationality",
        );
        const maritalStatusLabel = getLabel(
          cleanGuarantor.maritalStatus,
          maritalStatusOptions,
          "marital_status",
        );
        const bankNameLabel = getLabel(
          cleanGuarantor.bankName,
          banksOptions,
          "bank_name",
        );
        const permCountryLabel = getLabel(
          cleanGuarantor.permCountry,
          countryOptions,
          "country",
        );
        const permDzongkhagLabel = getLabel(
          cleanGuarantor.permDzongkhag,
          dzongkhagOptions,
          "dzongkhag",
        );
        let permGewogLabel = "";
        if (
          cleanGuarantor.permCountry &&
          isBhutan(cleanGuarantor.permCountry)
        ) {
          permGewogLabel = getLabel(
            cleanGuarantor.permGewog,
            permGewogOptions,
            "gewog",
          );
        } else {
          permGewogLabel = cleanGuarantor.permGewog || "";
        }
        const currCountryLabel = getLabel(
          cleanGuarantor.currCountry,
          countryOptions,
          "country",
        );
        const currDzongkhagLabel = getLabel(
          cleanGuarantor.currDzongkhag,
          dzongkhagOptions,
          "dzongkhag",
        );
        let currGewogLabel = "";
        if (
          cleanGuarantor.currCountry &&
          isBhutan(cleanGuarantor.currCountry)
        ) {
          currGewogLabel = getLabel(
            cleanGuarantor.currGewog,
            currGewogOptions,
            "gewog",
          );
        } else {
          currGewogLabel = cleanGuarantor.currGewog || "";
        }

        // Spouse labels
        const spouseIdTypeLabel = getLabel(
          cleanGuarantor.spouseIdType,
          identificationTypeOptions,
          "identity_type",
        );
        const spouseNationalityLabel = getLabel(
          cleanGuarantor.spouseNationality,
          nationalityOptions,
          "nationality",
        );
        const spousePermCountryLabel = getLabel(
          cleanGuarantor.spousePermCountry,
          countryOptions,
          "country",
        );
        const spousePermDzongkhagLabel = getLabel(
          cleanGuarantor.spousePermDzongkhag,
          dzongkhagOptions,
          "dzongkhag",
        );
        let spousePermGewogLabel = "";
        if (
          cleanGuarantor.spousePermCountry &&
          isBhutan(cleanGuarantor.spousePermCountry)
        ) {
          spousePermGewogLabel = getLabel(
            cleanGuarantor.spousePermGewog,
            spousePermGewogOptions,
            "gewog",
          );
        } else {
          spousePermGewogLabel = cleanGuarantor.spousePermGewog || "";
        }

        const pepCategoryLabel = getLabel(
          cleanGuarantor.pepCategory,
          pepCategoryOptions,
          "pep_category",
        );
        const pepSubCategoryLabel = getLabel(
          cleanGuarantor.pepSubCategory,
          pepSubCategoryOptions,
          "pep_sub_category",
        );
        const occupationLabel = getLabel(
          cleanGuarantor.occupation,
          occupationOptions,
          "occ_name",
        );
        const organizationNameLabel = getLabel(
          cleanGuarantor.organizationName,
          organizationOptions,
          "lgal_constitution",
        );

        // For related PEPs
        const relatedPepsWithLabels = (cleanGuarantor.relatedPeps || []).map(
          (pep: any, idx: number) => {
            const categoryLabel = getLabel(
              pep.category,
              pepCategoryOptions,
              "pep_category",
            );
            const subCategoryLabel = getLabel(
              pep.subCategory,
              relatedPepOptionsMap?.[idx] || [],
              "pep_sub_category",
            );

            const identificationTypeLabel = getLabel(
              pep.identificationType,
              identificationTypeOptions,
              "identity_type",
            );
            const nationalityLabel = getLabel(
              pep.nationality,
              nationalityOptions,
              "nationality",
            );
            const maritalStatusLabel = getLabel(
              pep.maritalStatus,
              maritalStatusOptions,
              "marital_status",
            );

            const spouseIdTypeLabel = getLabel(
              pep.spouseIdType,
              identificationTypeOptions,
              "identity_type",
            );
            const spouseNationalityLabel = getLabel(
              pep.spouseNationality,
              nationalityOptions,
              "nationality",
            );

            const permCountryLabel = getLabel(
              pep.permCountry,
              countryOptions,
              "country",
            );
            const currCountryLabel = getLabel(
              pep.currCountry,
              countryOptions,
              "country",
            );
            const spousePermCountryLabel = getLabel(
              pep.spousePermCountry,
              countryOptions,
              "country",
            );

            let permDzongkhagLabel = pep.permDzongkhag;
            let permGewogLabel = pep.permGewog;
            if (pep.permCountry && isBhutan(pep.permCountry)) {
              permDzongkhagLabel = getLabel(
                pep.permDzongkhag,
                dzongkhagOptions,
                "dzongkhag",
              );
              permGewogLabel = getLabel(
                pep.permGewog,
                pep.permGewogOptions || [],
                "gewog",
              );
            }

            let currDzongkhagLabel = pep.currDzongkhag;
            let currGewogLabel = pep.currGewog;
            if (pep.currCountry && isBhutan(pep.currCountry)) {
              currDzongkhagLabel = getLabel(
                pep.currDzongkhag,
                dzongkhagOptions,
                "dzongkhag",
              );
              currGewogLabel = getLabel(
                pep.currGewog,
                pep.currGewogOptions || [],
                "gewog",
              );
            }

            let spousePermDzongkhagLabel = pep.spousePermDzongkhag;
            let spousePermGewogLabel = pep.spousePermGewog;
            if (pep.spousePermCountry && isBhutan(pep.spousePermCountry)) {
              spousePermDzongkhagLabel = getLabel(
                pep.spousePermDzongkhag,
                dzongkhagOptions,
                "dzongkhag",
              );
              spousePermGewogLabel = getLabel(
                pep.spousePermGewog,
                pep.spousePermGewogOptions || [],
                "gewog",
              );
            }

            return {
              ...pep,
              categoryLabel,
              subCategoryLabel,
              identificationTypeLabel,
              nationalityLabel,
              maritalStatusLabel,
              spouseIdTypeLabel,
              spouseNationalityLabel,
              permCountryLabel,
              permDzongkhagLabel,
              permGewogLabel,
              currCountryLabel,
              currDzongkhagLabel,
              currGewogLabel,
              spousePermCountryLabel,
              spousePermDzongkhagLabel,
              spousePermGewogLabel,
            };
          },
        );

        return {
          ...cleanGuarantor,
          idTypeLabel,
          nationalityLabel,
          maritalStatusLabel,
          bankNameLabel,
          permCountryLabel,
          permDzongkhagLabel,
          permGewogLabel,
          currCountryLabel,
          currDzongkhagLabel,
          currGewogLabel,
          spouseIdTypeLabel,
          spouseNationalityLabel,
          spousePermCountryLabel,
          spousePermDzongkhagLabel,
          spousePermGewogLabel,
          pepCategoryLabel,
          pepSubCategoryLabel,
          occupationLabel,
          organizationNameLabel,
          relatedPeps: relatedPepsWithLabels,
        };
      }),
    };

    // Merge with existing session data under "businessRepaymentSourceDetail"
    const existingData = sessionStorage.getItem("businessLoanApplicationData");
    const allData = existingData ? JSON.parse(existingData) : {};
    const updatedData = {
      ...allData,
      businessRepaymentSourceDetail: repaymentSourceData,
    };

    sessionStorage.setItem(
      "businessLoanApplicationData",
      JSON.stringify(updatedData),
    );

    onNext(repaymentSourceData);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* 1. BUSINESS INCOME SECTION */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4 mb-6">
          REPAYMENT SOURCE - BUSINESS INCOME
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
              Repayment Source Type <span className="text-red-500">*</span>
            </Label>
            <Input
              value={businessIncomeData.repaymentSourceType}
              disabled
              className="h-12 w-full bg-gray-100 border border-gray-300 rounded-lg text-sm cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Business loans must use Business Income as repayment source
            </p>
          </div>

          <div>
            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
              Amount (Nu.) <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={businessIncomeData.amount}
              onChange={(e) => {
                setBusinessIncomeData({
                  ...businessIncomeData,
                  amount: e.target.value,
                });
                if (businessErrors.amount) {
                  const newErrs = { ...businessErrors };
                  delete newErrs.amount;
                  setBusinessErrors(newErrs);
                }
              }}
              className={getFieldStyle(!!businessErrors.amount)}
            />
            {businessErrors.amount && (
              <p className="text-xs text-red-500 mt-1">
                {businessErrors.amount}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
            Upload Repayment Proof <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <input
              id="business-income-proof"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleBusinessIncomeFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-28 bg-transparent"
              onClick={() =>
                document.getElementById("business-income-proof")?.click()
              }
            >
              Choose File
            </Button>
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {businessIncomeData.proofFileName || "No file chosen"}
            </span>
          </div>
          {businessErrors.proofFile && (
            <p className="text-xs text-red-500 mt-1">
              {businessErrors.proofFile}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Allowed: PDF, JPG, PNG (Max 5MB)
          </p>
        </div>
      </div>

      {/* 2. GUARANTOR SECTION */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4 mb-6">
          GUARANTOR INFORMATION
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
              Is Repayment Guarantor Applicable?{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Select
              value={isGuarantorApplicable || ""}
              onValueChange={setIsGuarantorApplicable}
            >
              <SelectTrigger className="h-12 w-full border border-gray-300 rounded-lg focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isGuarantorApplicable === "Yes" && (
          <div className="space-y-10">
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-[#003DA5]">
                Guarantors List ({guarantors.length})
              </h3>
              <Button
                type="button"
                onClick={addGuarantor}
                className="bg-[#003DA5] hover:bg-[#002D7A] h-10"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Guarantor
              </Button>
            </div>

            {guarantors.map((guarantor, index) => {
              const isPermBhutan = isBhutan(guarantor.permCountry);
              const isCurrBhutan = isBhutan(guarantor.currCountry);
              const isMarried = getIsMarried(guarantor);
              const errors = guarantor.errors || {};

              const isSpousePermBhutan =
                guarantor.spousePermCountry &&
                isBhutan(guarantor.spousePermCountry);

              const isSpouseNationalityBhutanese = (
                nationalityCode: string,
              ) => {
                if (!nationalityCode || !bhutanNationalityCode) return false;
                return (
                  String(nationalityCode) === String(bhutanNationalityCode)
                );
              };

              return (
                <div
                  key={index}
                  className="border-2 border-gray-100 rounded-xl p-6 relative bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                    <h3 className="text-xl font-bold text-[#003DA5]">
                      Guarantor #{index + 1}
                    </h3>
                    {guarantors.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeGuarantor(index)}
                        className="h-9 px-3"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Remove
                      </Button>
                    )}
                  </div>

                  {guarantor.showLookupPopup && (
                    <DocumentPopup
                      open={guarantor.showLookupPopup}
                      onOpenChange={(open) => {
                        if (!open) {
                          setGuarantors((prev) => {
                            const updated = [...prev];
                            updated[index] = {
                              ...updated[index],
                              showLookupPopup: false,
                            };
                            return updated;
                          });
                        }
                      }}
                      searchStatus={guarantor.lookupStatus}
                      onProceed={() => handleLookupProceed(index)}
                    />
                  )}

                  {/* A. PERSONAL DETAILS */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-[#003DA5] mb-4 bg-gray-50 p-2 rounded">
                      A. Personal Details
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Identification Type{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.idType}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "idType", val)
                          }
                        >
                          <SelectTrigger
                            className={getFieldStyle(!!errors.idType)}
                          >
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent>
                            {identificationTypeOptions
                              .filter((opt: any) => {
                                const label = (
                                  opt.identity_type ||
                                  opt.identification_type ||
                                  opt.name ||
                                  ""
                                ).toLowerCase();
                                return !(
                                  label.includes("trade license number") ||
                                  label.includes("company registration number")
                                );
                              })
                              .map((opt, i) => (
                                <SelectItem
                                  key={i}
                                  value={String(
                                    opt.identity_type_pk_code || opt.id,
                                  )}
                                >
                                  {opt.identity_type || opt.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {errors.idType && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.idType}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Identification No.{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <RestrictedInput
                          allowed="numeric"
                          maxLength={11}
                          value={guarantor.idNumber || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "idNumber",
                              e.target.value,
                            )
                          }
                          onBlur={() => handleIdentityCheck(index)}
                          className={getFieldStyle(!!errors.idNumber)}
                          placeholder="Enter ID"
                        />
                        {errors.idNumber && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.idNumber}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Salutation <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.salutation}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "salutation", val)
                          }
                        >
                          <SelectTrigger
                            className={getFieldStyle(!!errors.salutation)}
                          >
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mr">Mr.</SelectItem>
                            <SelectItem value="mrs">Mrs.</SelectItem>
                            <SelectItem value="ms">Ms.</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.salutation && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.salutation}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Guarantor Name <span className="text-red-500">*</span>
                        </Label>
                        <RestrictedInput
                          allowed="alpha"
                          value={guarantor.guarantorName || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "guarantorName",
                              e.target.value,
                            )
                          }
                          onBlur={(e) =>
                            handleBlurField(
                              index,
                              "guarantorName",
                              e.target.value,
                            )
                          }
                          className={getFieldStyle(!!errors.guarantorName)}
                          placeholder="Full Name"
                        />
                        {errors.guarantorName && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.guarantorName}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Nationality <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.nationality}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "nationality", val)
                          }
                        >
                          <SelectTrigger
                            className={getFieldStyle(!!errors.nationality)}
                          >
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent>
                            {nationalityOptions.map((opt, i) => (
                              <SelectItem
                                key={i}
                                value={String(
                                  opt.nationality_pk_code || opt.id,
                                )}
                              >
                                {opt.nationality || opt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.nationality && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.nationality}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Gender <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.gender}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "gender", val)
                          }
                        >
                          <SelectTrigger
                            className={getFieldStyle(!!errors.gender)}
                          >
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.gender && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.gender}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          ID Issue Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          max={today}
                          value={formatDateForInput(guarantor.idIssueDate)}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "idIssueDate",
                              e.target.value,
                            )
                          }
                          className={getFieldStyle(!!errors.idIssueDate)}
                        />
                        {errors.idIssueDate && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.idIssueDate}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          ID Expiry Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          min={today}
                          value={formatDateForInput(guarantor.idExpiryDate)}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "idExpiryDate",
                              e.target.value,
                            )
                          }
                          className={getFieldStyle(!!errors.idExpiryDate)}
                        />
                        {errors.idExpiryDate && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.idExpiryDate}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          TPN No.
                        </Label>
                        <RestrictedInput
                          allowed="numeric"
                          maxLength={11}
                          value={guarantor.tpnNo || ""}
                          onChange={(e) =>
                            updateGuarantorField(index, "tpnNo", e.target.value)
                          }
                          onBlur={(e) =>
                            handleBlurField(index, "tpnNo", e.target.value)
                          }
                          className={getFieldStyle(!!errors.tpnNo)}
                          placeholder="Enter TPN"
                        />
                        {errors.tpnNo && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.tpnNo}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Tax Identifier Type
                        </Label>
                        <Select
                          value={guarantor.taxIdentifierType}
                          onValueChange={(val) =>
                            updateGuarantorField(
                              index,
                              "taxIdentifierType",
                              val,
                            )
                          }
                        >
                          <SelectTrigger
                            className={getFieldStyle(
                              !!errors.taxIdentifierType,
                            )}
                          >
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BIT">BIT</SelectItem>
                            <SelectItem value="GST">GST</SelectItem>
                            <SelectItem value="CIT">CIT</SelectItem>
                            <SelectItem value="PIT">PIT</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.taxIdentifierType && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.taxIdentifierType}
                          </p>
                        )}
                      </div>

                      {isNationalityBhutanese(guarantor.nationality) && (
                        <div>
                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                            Household Number{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <RestrictedInput
                            allowed="alphanumeric"
                            value={guarantor.householdNumber || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "householdNumber",
                                e.target.value,
                              )
                            }
                            className={getFieldStyle(!!errors.householdNumber)}
                            placeholder="Enter household number"
                          />
                          {errors.householdNumber && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.householdNumber}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Date of Birth <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          max={maxDobDate}
                          value={formatDateForInput(guarantor.dateOfBirth)}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "dateOfBirth",
                              e.target.value,
                            )
                          }
                          onBlur={(e) =>
                            handleBlurField(
                              index,
                              "dateOfBirth",
                              e.target.value,
                            )
                          }
                          className={getFieldStyle(!!errors.dateOfBirth)}
                        />
                        {errors.dateOfBirth && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.dateOfBirth}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Marital Status <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.maritalStatus}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "maritalStatus", val)
                          }
                        >
                          <SelectTrigger
                            className={getFieldStyle(!!errors.maritalStatus)}
                          >
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent>
                            {maritalStatusOptions.map((opt, i) => (
                              <SelectItem
                                key={i}
                                value={String(
                                  opt.marital_status_pk_code || opt.id,
                                )}
                              >
                                {opt.marital_status || opt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.maritalStatus && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.maritalStatus}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Upload Family Tree
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            id={`familyTree-${index}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              handleFileChange(
                                index,
                                "familyTree",
                                e.target.files?.[0] || null,
                              )
                            }
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-28 bg-transparent"
                            onClick={() =>
                              document
                                .getElementById(`familyTree-${index}`)
                                ?.click()
                            }
                          >
                            Choose File
                          </Button>
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {guarantor.familyTree || "No file chosen"}
                          </span>
                        </div>
                        {errors.familyTree && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.familyTree}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Allowed: PDF, JPG, PNG (Max 5MB)
                        </p>
                      </div>
                    </div>

                    {isMarried && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                        {/* Spouse Personal Details */}
                        <div className="mb-6">
                          <h6 className="font-semibold text-[#003DA5] mb-3">
                            Spouse Personal Details
                          </h6>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                Identification Type{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={guarantor.spouseIdType}
                                onValueChange={(val) =>
                                  updateGuarantorField(
                                    index,
                                    "spouseIdType",
                                    val,
                                  )
                                }
                              >
                                <SelectTrigger
                                  className={getFieldStyle(
                                    !!errors.spouseIdType,
                                  )}
                                >
                                  <SelectValue placeholder="[Select]" />
                                </SelectTrigger>
                                <SelectContent>
                                  {identificationTypeOptions
                                    .filter((opt: any) => {
                                      const label = (
                                        opt.identity_type ||
                                        opt.identification_type ||
                                        opt.name ||
                                        ""
                                      ).toLowerCase();
                                      return !(
                                        label.includes(
                                          "trade license number",
                                        ) ||
                                        label.includes(
                                          "company registration number",
                                        )
                                      );
                                    })
                                    .map((opt, i) => (
                                      <SelectItem
                                        key={i}
                                        value={String(
                                          opt.identity_type_pk_code || opt.id,
                                        )}
                                      >
                                        {opt.identity_type || opt.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              {errors.spouseIdType && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spouseIdType}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                Identification No.{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <RestrictedInput
                                allowed="numeric"
                                maxLength={11}
                                value={guarantor.spouseCid || ""}
                                onChange={(e) =>
                                  updateGuarantorField(
                                    index,
                                    "spouseCid",
                                    e.target.value,
                                  )
                                }
                                onBlur={(e) =>
                                  handleBlurField(
                                    index,
                                    "spouseCid",
                                    e.target.value,
                                  )
                                }
                                className={getFieldStyle(!!errors.spouseCid)}
                                placeholder="Enter ID"
                              />
                              {errors.spouseCid && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spouseCid}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                Salutation{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={guarantor.spouseSalutation}
                                onValueChange={(val) =>
                                  updateGuarantorField(
                                    index,
                                    "spouseSalutation",
                                    val,
                                  )
                                }
                              >
                                <SelectTrigger
                                  className={getFieldStyle(
                                    !!errors.spouseSalutation,
                                  )}
                                >
                                  <SelectValue placeholder="[Select]" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mr">Mr.</SelectItem>
                                  <SelectItem value="mrs">Mrs.</SelectItem>
                                  <SelectItem value="ms">Ms.</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.spouseSalutation && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spouseSalutation}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                Spouse Name{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <RestrictedInput
                                allowed="alpha"
                                value={guarantor.spouseName || ""}
                                onChange={(e) =>
                                  updateGuarantorField(
                                    index,
                                    "spouseName",
                                    e.target.value,
                                  )
                                }
                                onBlur={(e) =>
                                  handleBlurField(
                                    index,
                                    "spouseName",
                                    e.target.value,
                                  )
                                }
                                className={getFieldStyle(!!errors.spouseName)}
                              />
                              {errors.spouseName && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spouseName}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                Nationality{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={guarantor.spouseNationality}
                                onValueChange={(val) =>
                                  updateGuarantorField(
                                    index,
                                    "spouseNationality",
                                    val,
                                  )
                                }
                              >
                                <SelectTrigger
                                  className={getFieldStyle(
                                    !!errors.spouseNationality,
                                  )}
                                >
                                  <SelectValue placeholder="[Select]" />
                                </SelectTrigger>
                                <SelectContent>
                                  {nationalityOptions.map((opt, i) => (
                                    <SelectItem
                                      key={i}
                                      value={String(
                                        opt.nationality_pk_code || opt.id,
                                      )}
                                    >
                                      {opt.nationality || opt.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {errors.spouseNationality && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spouseNationality}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                Gender <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={guarantor.spouseGender}
                                onValueChange={(val) =>
                                  updateGuarantorField(
                                    index,
                                    "spouseGender",
                                    val,
                                  )
                                }
                              >
                                <SelectTrigger
                                  className={getFieldStyle(
                                    !!errors.spouseGender,
                                  )}
                                >
                                  <SelectValue placeholder="[Select]" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.spouseGender && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spouseGender}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                ID Issue Date{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                type="date"
                                max={today}
                                value={formatDateForInput(
                                  guarantor.spouseIdIssueDate,
                                )}
                                onChange={(e) =>
                                  updateGuarantorField(
                                    index,
                                    "spouseIdIssueDate",
                                    e.target.value,
                                  )
                                }
                                className={getFieldStyle(
                                  !!errors.spouseIdIssueDate,
                                )}
                              />
                              {errors.spouseIdIssueDate && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spouseIdIssueDate}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                ID Expiry Date{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                type="date"
                                min={today}
                                value={formatDateForInput(
                                  guarantor.spouseIdExpiryDate,
                                )}
                                onChange={(e) =>
                                  updateGuarantorField(
                                    index,
                                    "spouseIdExpiryDate",
                                    e.target.value,
                                  )
                                }
                                className={getFieldStyle(
                                  !!errors.spouseIdExpiryDate,
                                )}
                              />
                              {errors.spouseIdExpiryDate && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spouseIdExpiryDate}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                Date of Birth{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                type="date"
                                max={maxDobDate}
                                value={formatDateForInput(
                                  guarantor.spouseDateOfBirth,
                                )}
                                onChange={(e) =>
                                  updateGuarantorField(
                                    index,
                                    "spouseDateOfBirth",
                                    e.target.value,
                                  )
                                }
                                onBlur={(e) =>
                                  handleBlurField(
                                    index,
                                    "spouseDateOfBirth",
                                    e.target.value,
                                  )
                                }
                                className={getFieldStyle(
                                  !!errors.spouseDateOfBirth,
                                )}
                              />
                              {errors.spouseDateOfBirth && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spouseDateOfBirth}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                Tax Identifier Type
                              </Label>
                              <Select
                                value={guarantor.spouseTaxIdentifierType}
                                onValueChange={(val) =>
                                  updateGuarantorField(
                                    index,
                                    "spouseTaxIdentifierType",
                                    val,
                                  )
                                }
                              >
                                <SelectTrigger
                                  className={getFieldStyle(
                                    !!errors.spouseTaxIdentifierType,
                                  )}
                                >
                                  <SelectValue placeholder="[Select]" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="BIT">BIT</SelectItem>
                                  <SelectItem value="GST">GST</SelectItem>
                                  <SelectItem value="CIT">CIT</SelectItem>
                                  <SelectItem value="PIT">PIT</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.spouseTaxIdentifierType && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spouseTaxIdentifierType}
                                </p>
                              )}
                            </div>

                            {isSpouseNationalityBhutanese(
                              guarantor.spouseNationality,
                            ) && (
                              <div>
                                <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                  Household Number{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <RestrictedInput
                                  allowed="alphanumeric"
                                  value={guarantor.spouseHouseholdNumber || ""}
                                  onChange={(e) =>
                                    updateGuarantorField(
                                      index,
                                      "spouseHouseholdNumber",
                                      e.target.value,
                                    )
                                  }
                                  className={getFieldStyle(
                                    !!errors.spouseHouseholdNumber,
                                  )}
                                  placeholder="Enter household number"
                                />
                                {errors.spouseHouseholdNumber && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {errors.spouseHouseholdNumber}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Spouse Permanent Address */}
                        <div className="mt-6 border-t pt-4">
                          <h6 className="font-semibold text-[#003DA5] mb-3">
                            Spouse Permanent Address
                          </h6>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                Country <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={guarantor.spousePermCountry}
                                onValueChange={(val) =>
                                  updateGuarantorField(
                                    index,
                                    "spousePermCountry",
                                    val,
                                  )
                                }
                              >
                                <SelectTrigger
                                  className={getFieldStyle(
                                    !!errors.spousePermCountry,
                                  )}
                                >
                                  <SelectValue placeholder="[Select]" />
                                </SelectTrigger>
                                <SelectContent>
                                  {countryOptions.map((opt, i) => (
                                    <SelectItem
                                      key={i}
                                      value={String(
                                        opt.country_pk_code || opt.id,
                                      )}
                                    >
                                      {opt.country || opt.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {errors.spousePermCountry && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spousePermCountry}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                {isSpousePermBhutan ? "Dzongkhag" : "State"}{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              {isSpousePermBhutan ? (
                                <Select
                                  value={guarantor.spousePermDzongkhag}
                                  onValueChange={(val) =>
                                    updateGuarantorField(
                                      index,
                                      "spousePermDzongkhag",
                                      val,
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    className={getFieldStyle(
                                      !!errors.spousePermDzongkhag,
                                    )}
                                  >
                                    <SelectValue placeholder="[Select]" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {dzongkhagOptions.map((opt, i) => (
                                      <SelectItem
                                        key={i}
                                        value={String(
                                          opt.dzongkhag_pk_code || opt.id,
                                        )}
                                      >
                                        {opt.dzongkhag || opt.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <RestrictedInput
                                  allowed="alpha"
                                  value={guarantor.spousePermDzongkhag || ""}
                                  onChange={(e) =>
                                    updateGuarantorField(
                                      index,
                                      "spousePermDzongkhag",
                                      e.target.value,
                                    )
                                  }
                                  onBlur={(e) =>
                                    handleBlurField(
                                      index,
                                      "spousePermDzongkhag",
                                      e.target.value,
                                    )
                                  }
                                  className={getFieldStyle(
                                    !!errors.spousePermDzongkhag,
                                  )}
                                />
                              )}
                              {errors.spousePermDzongkhag && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spousePermDzongkhag}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                {isSpousePermBhutan ? "Gewog" : "Province"}{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              {isSpousePermBhutan ? (
                                <Select
                                  value={guarantor.spousePermGewog}
                                  onValueChange={(val) =>
                                    updateGuarantorField(
                                      index,
                                      "spousePermGewog",
                                      val,
                                    )
                                  }
                                  disabled={!guarantor.spousePermDzongkhag}
                                >
                                  <SelectTrigger
                                    className={getFieldStyle(
                                      !!errors.spousePermGewog,
                                    )}
                                  >
                                    <SelectValue placeholder="[Select]" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {guarantor.spousePermGewogOptions?.map(
                                      (opt: any, i: number) => (
                                        <SelectItem
                                          key={i}
                                          value={String(
                                            opt.gewog_pk_code || opt.id,
                                          )}
                                        >
                                          {opt.gewog || opt.name}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <RestrictedInput
                                  allowed="alpha"
                                  value={guarantor.spousePermGewog || ""}
                                  onChange={(e) =>
                                    updateGuarantorField(
                                      index,
                                      "spousePermGewog",
                                      e.target.value,
                                    )
                                  }
                                  onBlur={(e) =>
                                    handleBlurField(
                                      index,
                                      "spousePermGewog",
                                      e.target.value,
                                    )
                                  }
                                  className={getFieldStyle(
                                    !!errors.spousePermGewog,
                                  )}
                                />
                              )}
                              {errors.spousePermGewog && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spousePermGewog}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                {isSpousePermBhutan
                                  ? "Village/Street"
                                  : "Street"}{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <RestrictedInput
                                allowed="alphanumeric"
                                value={guarantor.spousePermVillage || ""}
                                onChange={(e) =>
                                  updateGuarantorField(
                                    index,
                                    "spousePermVillage",
                                    e.target.value,
                                  )
                                }
                                onBlur={(e) =>
                                  handleBlurField(
                                    index,
                                    "spousePermVillage",
                                    e.target.value,
                                  )
                                }
                                className={getFieldStyle(
                                  !!errors.spousePermVillage,
                                )}
                              />
                              {errors.spousePermVillage && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spousePermVillage}
                                </p>
                              )}
                            </div>

                            {isSpousePermBhutan ? (
                              <>
                                <div>
                                  <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                    Thram No.{" "}
                                    <span className="text-red-500">*</span>
                                  </Label>
                                  <RestrictedInput
                                    allowed="alphanumeric"
                                    value={guarantor.spousePermThram || ""}
                                    onChange={(e) =>
                                      updateGuarantorField(
                                        index,
                                        "spousePermThram",
                                        e.target.value,
                                      )
                                    }
                                    onBlur={(e) =>
                                      handleBlurField(
                                        index,
                                        "spousePermThram",
                                        e.target.value,
                                      )
                                    }
                                    className={getFieldStyle(
                                      !!errors.spousePermThram,
                                    )}
                                  />
                                  {errors.spousePermThram && (
                                    <p className="text-xs text-red-500 mt-1">
                                      {errors.spousePermThram}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                    House No.{" "}
                                    <span className="text-red-500">*</span>
                                  </Label>
                                  <RestrictedInput
                                    allowed="alphanumeric"
                                    value={guarantor.spousePermHouse || ""}
                                    onChange={(e) =>
                                      updateGuarantorField(
                                        index,
                                        "spousePermHouse",
                                        e.target.value,
                                      )
                                    }
                                    onBlur={(e) =>
                                      handleBlurField(
                                        index,
                                        "spousePermHouse",
                                        e.target.value,
                                      )
                                    }
                                    className={getFieldStyle(
                                      !!errors.spousePermHouse,
                                    )}
                                  />
                                  {errors.spousePermHouse && (
                                    <p className="text-xs text-red-500 mt-1">
                                      {errors.spousePermHouse}
                                    </p>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                    City <span className="text-red-500">*</span>
                                  </Label>
                                  <RestrictedInput
                                    allowed="alpha"
                                    value={guarantor.spousePermCity || ""}
                                    onChange={(e) =>
                                      updateGuarantorField(
                                        index,
                                        "spousePermCity",
                                        e.target.value,
                                      )
                                    }
                                    onBlur={(e) =>
                                      handleBlurField(
                                        index,
                                        "spousePermCity",
                                        e.target.value,
                                      )
                                    }
                                    className={getFieldStyle(
                                      !!errors.spousePermCity,
                                    )}
                                  />
                                  {errors.spousePermCity && (
                                    <p className="text-xs text-red-500 mt-1">
                                      {errors.spousePermCity}
                                    </p>
                                  )}
                                </div>
                                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                  <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                    Address Proof{" "}
                                    <span className="text-red-500">*</span>
                                  </Label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      id={`spouse-perm-proof-${index}`}
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      onChange={(e) =>
                                        handleFileChange(
                                          index,
                                          "spousePermAddressProof",
                                          e.target.files?.[0] || null,
                                        )
                                      }
                                      className="hidden"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="w-28 bg-transparent"
                                      onClick={() =>
                                        document
                                          .getElementById(
                                            `spouse-perm-proof-${index}`,
                                          )
                                          ?.click()
                                      }
                                    >
                                      Choose File
                                    </Button>
                                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                      {guarantor.spousePermAddressProof ||
                                        "No file chosen"}
                                    </span>
                                  </div>
                                  {errors.spousePermAddressProof && (
                                    <p className="text-xs text-red-500 mt-1">
                                      {errors.spousePermAddressProof}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500">
                                    Allowed: PDF, JPG, PNG (Max 5MB)
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Spouse Contact Details */}
                        <div className="mt-6 border-t pt-4">
                          <h6 className="font-semibold text-[#003DA5] mb-3">
                            Spouse Contact Information
                          </h6>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                Email <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                type="email"
                                value={guarantor.spouseEmail || ""}
                                onChange={(e) =>
                                  updateGuarantorField(
                                    index,
                                    "spouseEmail",
                                    e.target.value,
                                  )
                                }
                                onBlur={(e) =>
                                  handleBlurField(
                                    index,
                                    "spouseEmail",
                                    e.target.value,
                                  )
                                }
                                className={getFieldStyle(!!errors.spouseEmail)}
                              />
                              {errors.spouseEmail && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spouseEmail}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                Contact No.{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <RestrictedInput
                                allowed="numeric"
                                maxLength={8}
                                value={guarantor.spouseCurrContact || ""}
                                onChange={(e) =>
                                  updateGuarantorField(
                                    index,
                                    "spouseCurrContact",
                                    e.target.value,
                                  )
                                }
                                onBlur={(e) =>
                                  handleBlurField(
                                    index,
                                    "spouseCurrContact",
                                    e.target.value,
                                  )
                                }
                                className={getFieldStyle(
                                  !!errors.spouseCurrContact,
                                )}
                              />
                              {errors.spouseCurrContact && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spouseCurrContact}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                Alternate Contact No.
                              </Label>
                              <RestrictedInput
                                allowed="numeric"
                                maxLength={8}
                                value={
                                  guarantor.spouseCurrAlternateContact || ""
                                }
                                onChange={(e) =>
                                  updateGuarantorField(
                                    index,
                                    "spouseCurrAlternateContact",
                                    e.target.value,
                                  )
                                }
                                onBlur={(e) =>
                                  handleBlurField(
                                    index,
                                    "spouseCurrAlternateContact",
                                    e.target.value,
                                  )
                                }
                                className={getFieldStyle(
                                  !!errors.spouseCurrAlternateContact,
                                )}
                              />
                              {errors.spouseCurrAlternateContact && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.spouseCurrAlternateContact}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Bank Name <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.bankName}
                          onValueChange={(value) =>
                            updateGuarantorField(index, "bankName", value)
                          }
                        >
                          <SelectTrigger
                            className={getFieldStyle(!!errors.bankName)}
                          >
                            <SelectValue placeholder="[Select Bank]" />
                          </SelectTrigger>
                          <SelectContent>
                            {banksOptions.map((opt, i) => (
                              <SelectItem
                                key={i}
                                value={String(
                                  opt.bank_pk_code || opt.id || opt.bank_code,
                                )}
                              >
                                {opt.bank_name || opt.name || opt.bank}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.bankName && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.bankName}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Bank Account No.{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <RestrictedInput
                          allowed="alphanumeric"
                          value={guarantor.bankAccountNumber || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "bankAccountNumber",
                              e.target.value,
                            )
                          }
                          onBlur={(e) =>
                            handleBlurField(
                              index,
                              "bankAccountNumber",
                              e.target.value,
                            )
                          }
                          className={getFieldStyle(!!errors.bankAccountNumber)}
                        />
                        {errors.bankAccountNumber && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.bankAccountNumber}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Passport Size Photo{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            id={`passport-${index}`}
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) =>
                              handleFileChange(
                                index,
                                "passportPhoto",
                                e.target.files?.[0] || null,
                              )
                            }
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-28 bg-transparent"
                            onClick={() =>
                              document
                                .getElementById(`passport-${index}`)
                                ?.click()
                            }
                          >
                            Choose File
                          </Button>
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {guarantor.passportPhoto || "No file chosen"}
                          </span>
                        </div>
                        {errors.passportPhoto && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.passportPhoto}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Allowed: JPG, PNG (Max 5MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* B. REPAYMENT SOURCE */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-[#003DA5] mb-4 bg-gray-50 p-2 rounded">
                      B. Repayment Source
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Repayment Source Type{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.repaymentSourceType || ""}
                          onValueChange={(value) =>
                            updateGuarantorField(
                              index,
                              "repaymentSourceType",
                              value,
                            )
                          }
                        >
                          <SelectTrigger
                            className={getFieldStyle(
                              !!errors.repaymentSourceType,
                            )}
                          >
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Monthly Salary – Civil Servant">
                              Monthly Salary – Civil Servant
                            </SelectItem>
                            <SelectItem value="Monthly Salary – Corporate">
                              Monthly Salary – Corporate
                            </SelectItem>
                            <SelectItem value="Monthly Salary – Private">
                              Monthly Salary – Private
                            </SelectItem>
                            <SelectItem value="Business Income">
                              Business Income
                            </SelectItem>
                            <SelectItem value="Rental Income">
                              Rental Income
                            </SelectItem>
                            <SelectItem value="Truck / Taxi Income">
                              Truck / Taxi Income
                            </SelectItem>
                            <SelectItem value="Dividend Income">
                              Dividend Income
                            </SelectItem>
                            <SelectItem value="Agriculture Income">
                              Agriculture Income
                            </SelectItem>
                            <SelectItem value="Vehicle Hiring Income">
                              Vehicle Hiring Income
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.repaymentSourceType && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.repaymentSourceType}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Amount (Nu.) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={guarantor.amount || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "amount",
                              e.target.value,
                            )
                          }
                          className={getFieldStyle(!!errors.amount)}
                          placeholder="0.00"
                        />
                        {errors.amount && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.amount}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Upload Proof <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            id={`guarantor-proof-${index}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              handleGuarantorProofChange(index, e)
                            }
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-28 bg-transparent"
                            onClick={() =>
                              document
                                .getElementById(`guarantor-proof-${index}`)
                                ?.click()
                            }
                          >
                            Choose File
                          </Button>
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {guarantor.proofFileName || "No file chosen"}
                          </span>
                        </div>
                        {errors.proofFile && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.proofFile}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Allowed: PDF, JPG, PNG (Max 5MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* C. PERMANENT ADDRESS */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-[#003DA5] mb-4 bg-gray-50 p-2 rounded">
                      C. Permanent Address
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.permCountry}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "permCountry", val)
                          }
                        >
                          <SelectTrigger
                            className={getFieldStyle(!!errors.permCountry)}
                          >
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((opt, i) => (
                              <SelectItem
                                key={i}
                                value={String(opt.country_pk_code || opt.id)}
                              >
                                {opt.country || opt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.permCountry && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.permCountry}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          {isPermBhutan ? "Dzongkhag" : "State"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        {isPermBhutan ? (
                          <Select
                            value={guarantor.permDzongkhag}
                            onValueChange={(val) =>
                              updateGuarantorField(index, "permDzongkhag", val)
                            }
                          >
                            <SelectTrigger
                              className={getFieldStyle(!!errors.permDzongkhag)}
                            >
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent>
                              {dzongkhagOptions.map((opt, i) => (
                                <SelectItem
                                  key={i}
                                  value={String(
                                    opt.dzongkhag_pk_code || opt.id,
                                  )}
                                >
                                  {opt.dzongkhag || opt.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <RestrictedInput
                            allowed="alpha"
                            value={guarantor.permDzongkhag || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "permDzongkhag",
                                e.target.value,
                              )
                            }
                            onBlur={(e) =>
                              handleBlurField(
                                index,
                                "permDzongkhag",
                                e.target.value,
                              )
                            }
                            className={getFieldStyle(!!errors.permDzongkhag)}
                          />
                        )}
                        {errors.permDzongkhag && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.permDzongkhag}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          {isPermBhutan ? "Gewog" : "Province"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        {isPermBhutan ? (
                          <Select
                            value={guarantor.permGewog}
                            onValueChange={(val) =>
                              updateGuarantorField(index, "permGewog", val)
                            }
                            disabled={!guarantor.permDzongkhag}
                          >
                            <SelectTrigger
                              className={getFieldStyle(!!errors.permGewog)}
                            >
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent>
                              {guarantor.permGewogOptions?.map(
                                (opt: any, i: number) => (
                                  <SelectItem
                                    key={i}
                                    value={String(opt.gewog_pk_code || opt.id)}
                                  >
                                    {opt.gewog || opt.name}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <RestrictedInput
                            allowed="alpha"
                            value={guarantor.permGewog || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "permGewog",
                                e.target.value,
                              )
                            }
                            onBlur={(e) =>
                              handleBlurField(
                                index,
                                "permGewog",
                                e.target.value,
                              )
                            }
                            className={getFieldStyle(!!errors.permGewog)}
                          />
                        )}
                        {errors.permGewog && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.permGewog}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          {isPermBhutan ? "Village/Street" : "Street"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <RestrictedInput
                          allowed="alphanumeric"
                          value={guarantor.permVillage || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "permVillage",
                              e.target.value,
                            )
                          }
                          onBlur={(e) =>
                            handleBlurField(
                              index,
                              "permVillage",
                              e.target.value,
                            )
                          }
                          className={getFieldStyle(!!errors.permVillage)}
                        />
                        {errors.permVillage && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.permVillage}
                          </p>
                        )}
                      </div>

                      {isPermBhutan ? (
                        <>
                          <div>
                            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                              Thram No. <span className="text-red-500">*</span>
                            </Label>
                            <RestrictedInput
                              allowed="alphanumeric"
                              value={guarantor.permThram || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "permThram",
                                  e.target.value,
                                )
                              }
                              onBlur={(e) =>
                                handleBlurField(
                                  index,
                                  "permThram",
                                  e.target.value,
                                )
                              }
                              className={getFieldStyle(!!errors.permThram)}
                            />
                            {errors.permThram && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.permThram}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                              House No. <span className="text-red-500">*</span>
                            </Label>
                            <RestrictedInput
                              allowed="alphanumeric"
                              value={guarantor.permHouse || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "permHouse",
                                  e.target.value,
                                )
                              }
                              onBlur={(e) =>
                                handleBlurField(
                                  index,
                                  "permHouse",
                                  e.target.value,
                                )
                              }
                              className={getFieldStyle(!!errors.permHouse)}
                            />
                            {errors.permHouse && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.permHouse}
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                              City <span className="text-red-500">*</span>
                            </Label>
                            <RestrictedInput
                              allowed="alpha"
                              value={guarantor.permCity || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "permCity",
                                  e.target.value,
                                )
                              }
                              onBlur={(e) =>
                                handleBlurField(
                                  index,
                                  "permCity",
                                  e.target.value,
                                )
                              }
                              className={getFieldStyle(!!errors.permCity)}
                            />
                            {errors.permCity && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.permCity}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                              Postal/ZIP
                            </Label>
                            <RestrictedInput
                              allowed="alphanumeric"
                              value={guarantor.permPostal || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "permPostal",
                                  e.target.value,
                                )
                              }
                              onBlur={(e) =>
                                handleBlurField(
                                  index,
                                  "permPostal",
                                  e.target.value,
                                )
                              }
                              className={getFieldStyle(!!errors.permPostal)}
                            />
                            {errors.permPostal && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.permPostal}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                              Address Proof{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                              <input
                                id={`perm-proof-${index}`}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) =>
                                  handleFileChange(
                                    index,
                                    "permAddressProof",
                                    e.target.files?.[0] || null,
                                  )
                                }
                                className="hidden"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-28 bg-transparent"
                                onClick={() =>
                                  document
                                    .getElementById(`perm-proof-${index}`)
                                    ?.click()
                                }
                              >
                                Choose File
                              </Button>
                              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {guarantor.permAddressProof || "No file chosen"}
                              </span>
                            </div>
                            {errors.permAddressProof && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.permAddressProof}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Allowed: PDF, JPG, PNG (Max 5MB)
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* D. CURRENT ADDRESS */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-[#003DA5] mb-4 bg-gray-50 p-2 rounded">
                      D. Current/Residential Address
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.currCountry}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "currCountry", val)
                          }
                        >
                          <SelectTrigger
                            className={getFieldStyle(!!errors.currCountry)}
                          >
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((opt, i) => (
                              <SelectItem
                                key={i}
                                value={String(opt.country_pk_code || opt.id)}
                              >
                                {opt.country || opt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.currCountry && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.currCountry}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          {isCurrBhutan ? "Dzongkhag" : "State"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        {isCurrBhutan ? (
                          <Select
                            value={guarantor.currDzongkhag}
                            onValueChange={(val) =>
                              updateGuarantorField(index, "currDzongkhag", val)
                            }
                          >
                            <SelectTrigger
                              className={getFieldStyle(!!errors.currDzongkhag)}
                            >
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent>
                              {dzongkhagOptions.map((opt, i) => (
                                <SelectItem
                                  key={i}
                                  value={String(
                                    opt.dzongkhag_pk_code || opt.id,
                                  )}
                                >
                                  {opt.dzongkhag || opt.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <RestrictedInput
                            allowed="alpha"
                            value={guarantor.currDzongkhag || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "currDzongkhag",
                                e.target.value,
                              )
                            }
                            onBlur={(e) =>
                              handleBlurField(
                                index,
                                "currDzongkhag",
                                e.target.value,
                              )
                            }
                            className={getFieldStyle(!!errors.currDzongkhag)}
                          />
                        )}
                        {errors.currDzongkhag && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.currDzongkhag}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          {isCurrBhutan ? "Gewog" : "Province"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        {isCurrBhutan ? (
                          <Select
                            value={guarantor.currGewog}
                            onValueChange={(val) =>
                              updateGuarantorField(index, "currGewog", val)
                            }
                            disabled={!guarantor.currDzongkhag}
                          >
                            <SelectTrigger
                              className={getFieldStyle(!!errors.currGewog)}
                            >
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent>
                              {guarantor.currGewogOptions?.map(
                                (opt: any, i: number) => (
                                  <SelectItem
                                    key={i}
                                    value={String(opt.gewog_pk_code || opt.id)}
                                  >
                                    {opt.gewog || opt.name}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <RestrictedInput
                            allowed="alpha"
                            value={guarantor.currGewog || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "currGewog",
                                e.target.value,
                              )
                            }
                            onBlur={(e) =>
                              handleBlurField(
                                index,
                                "currGewog",
                                e.target.value,
                              )
                            }
                            className={getFieldStyle(!!errors.currGewog)}
                          />
                        )}
                        {errors.currGewog && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.currGewog}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          {isCurrBhutan ? "Village/Street" : "Street"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <RestrictedInput
                          allowed="alphanumeric"
                          value={guarantor.currVillage || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "currVillage",
                              e.target.value,
                            )
                          }
                          onBlur={(e) =>
                            handleBlurField(
                              index,
                              "currVillage",
                              e.target.value,
                            )
                          }
                          className={getFieldStyle(!!errors.currVillage)}
                        />
                        {errors.currVillage && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.currVillage}
                          </p>
                        )}
                      </div>

                      {isCurrBhutan && (
                        <div>
                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                            House/Building/Flat No.{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <RestrictedInput
                            allowed="alphanumeric"
                            value={guarantor.currHouse || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "currHouse",
                                e.target.value,
                              )
                            }
                            onBlur={(e) =>
                              handleBlurField(
                                index,
                                "currHouse",
                                e.target.value,
                              )
                            }
                            className={getFieldStyle(!!errors.currHouse)}
                          />
                          {errors.currHouse && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.currHouse}
                            </p>
                          )}
                        </div>
                      )}

                      {!isCurrBhutan && (
                        <>
                          <div>
                            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                              City <span className="text-red-500">*</span>
                            </Label>
                            <RestrictedInput
                              allowed="alpha"
                              value={guarantor.currCity || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "currCity",
                                  e.target.value,
                                )
                              }
                              onBlur={(e) =>
                                handleBlurField(
                                  index,
                                  "currCity",
                                  e.target.value,
                                )
                              }
                              className={getFieldStyle(!!errors.currCity)}
                            />
                            {errors.currCity && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.currCity}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                              Postal/ZIP
                            </Label>
                            <RestrictedInput
                              allowed="alphanumeric"
                              value={guarantor.currPostal || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "currPostal",
                                  e.target.value,
                                )
                              }
                              onBlur={(e) =>
                                handleBlurField(
                                  index,
                                  "currPostal",
                                  e.target.value,
                                )
                              }
                              className={getFieldStyle(!!errors.currPostal)}
                            />
                            {errors.currPostal && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.currPostal}
                              </p>
                            )}
                          </div>
                        </>
                      )}

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="email"
                          value={guarantor.email || ""}
                          onChange={(e) =>
                            updateGuarantorField(index, "email", e.target.value)
                          }
                          onBlur={(e) =>
                            handleBlurField(index, "email", e.target.value)
                          }
                          className={getFieldStyle(!!errors.email)}
                        />
                        {errors.email && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Contact No. <span className="text-red-500">*</span>
                        </Label>
                        <RestrictedInput
                          allowed="numeric"
                          maxLength={8}
                          value={guarantor.contact || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "contact",
                              e.target.value,
                            )
                          }
                          onBlur={(e) =>
                            handleBlurField(index, "contact", e.target.value)
                          }
                          className={getFieldStyle(!!errors.contact)}
                        />
                        {errors.contact && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.contact}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Alternate Contact
                        </Label>
                        <RestrictedInput
                          allowed="numeric"
                          maxLength={8}
                          value={guarantor.currAlternateContact || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "currAlternateContact",
                              e.target.value,
                            )
                          }
                          onBlur={(e) =>
                            handleBlurField(
                              index,
                              "currAlternateContact",
                              e.target.value,
                            )
                          }
                          className={getFieldStyle(
                            !!errors.currAlternateContact,
                          )}
                        />
                        {errors.currAlternateContact && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.currAlternateContact}
                          </p>
                        )}
                      </div>

                      {!isCurrBhutan && (
                        <div>
                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                            Address Proof{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <div className="flex items-center gap-2">
                            <input
                              id={`curr-proof-${index}`}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                handleFileChange(
                                  index,
                                  "currAddressProof",
                                  e.target.files?.[0] || null,
                                )
                              }
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-28 bg-transparent"
                              onClick={() =>
                                document
                                  .getElementById(`curr-proof-${index}`)
                                  ?.click()
                              }
                            >
                              Choose File
                            </Button>
                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {guarantor.currAddressProof || "No file chosen"}
                            </span>
                          </div>
                          {errors.currAddressProof && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.currAddressProof}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Allowed: PDF, JPG, PNG (Max 5MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* E. PEP DECLARATION */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-[#003DA5] mb-4 bg-gray-50 p-2 rounded">
                      E. PEP Declaration
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          Politically Exposed Person?{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.isPep}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "isPep", val)
                          }
                        >
                          <SelectTrigger
                            className={getFieldStyle(!!errors.isPep)}
                          >
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.isPep && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.isPep}
                          </p>
                        )}
                      </div>

                      {guarantor.isPep === "yes" && (
                        <>
                          <div>
                            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                              PEP Category{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={guarantor.pepCategory}
                              onValueChange={(val) =>
                                updateGuarantorField(index, "pepCategory", val)
                              }
                            >
                              <SelectTrigger
                                className={getFieldStyle(!!errors.pepCategory)}
                              >
                                <SelectValue placeholder="[Select]" />
                              </SelectTrigger>
                              <SelectContent>
                                {pepCategoryOptions.map((opt, i) => (
                                  <SelectItem
                                    key={i}
                                    value={String(
                                      opt.pep_category_pk_code || opt.id,
                                    )}
                                  >
                                    {opt.pep_category || opt.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.pepCategory && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.pepCategory}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                              Sub Category{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={guarantor.pepSubCategory}
                              onValueChange={(val) =>
                                updateGuarantorField(
                                  index,
                                  "pepSubCategory",
                                  val,
                                )
                              }
                              disabled={!guarantor.pepCategory}
                            >
                              <SelectTrigger
                                className={getFieldStyle(
                                  !!errors.pepSubCategory,
                                )}
                              >
                                <SelectValue placeholder="[Select]" />
                              </SelectTrigger>
                              <SelectContent>
                                {guarantor.pepSubCategoryOptions?.map(
                                  (opt: any, i: number) => (
                                    <SelectItem
                                      key={i}
                                      value={String(
                                        opt.pep_sub_category_pk_code || opt.id,
                                      )}
                                    >
                                      {opt.pep_sub_category || opt.name}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                            {errors.pepSubCategory && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.pepSubCategory}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                              Upload ID <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                              <input
                                id={`pep-self-${index}`}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) =>
                                  handleFileChange(
                                    index,
                                    "pepUpload",
                                    e.target.files?.[0] || null,
                                  )
                                }
                                className="hidden"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-28 bg-transparent"
                                onClick={() =>
                                  document
                                    .getElementById(`pep-self-${index}`)
                                    ?.click()
                                }
                              >
                                Choose File
                              </Button>
                              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {guarantor.pepUpload || "No file chosen"}
                              </span>
                            </div>
                            {errors.pepUpload && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.pepUpload}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Allowed: PDF, JPG, PNG (Max 5MB)
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {guarantor.isPep === "no" && (
                      <div className="mt-4">
                        <div className="mb-6">
                          <div className="grid grid-cols-1 md:grid-cols-3">
                            <div>
                              <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                Related to any PEP?{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={guarantor.relatedToPep}
                                onValueChange={(val) =>
                                  updateGuarantorField(
                                    index,
                                    "relatedToPep",
                                    val,
                                  )
                                }
                              >
                                <SelectTrigger
                                  className={getFieldStyle(
                                    !!errors.relatedToPep,
                                  )}
                                >
                                  <SelectValue placeholder="[Select]" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Yes</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.relatedToPep && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.relatedToPep}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {guarantor.relatedToPep === "yes" && (
                          <div className="space-y-4">
                            {guarantor.relatedPeps?.map(
                              (pep: any, pIndex: number) => {
                                const isPepBhutanese = isNationalityBhutanese(
                                  pep.nationality,
                                );
                                const isPepBhutanPerm = countryOptions.find(
                                  (c) =>
                                    String(
                                      c.country_pk_code || c.id || c.code,
                                    ) === pep.permCountry &&
                                    (c.country || c.name || "")
                                      .toLowerCase()
                                      .includes("bhutan"),
                                );
                                const isPepBhutanCurr = countryOptions.find(
                                  (c) =>
                                    String(
                                      c.country_pk_code || c.id || c.code,
                                    ) === pep.currCountry &&
                                    (c.country || c.name || "")
                                      .toLowerCase()
                                      .includes("bhutan"),
                                );

                                const isPepMarried = getPepIsMarried(pep);
                                const isPepSpouseBhutanese =
                                  isNationalityBhutanese(pep.spouseNationality);
                                const isPepSpouseBhutanPerm =
                                  countryOptions.find(
                                    (c) =>
                                      String(
                                        c.country_pk_code || c.id || c.code,
                                      ) === pep.spousePermCountry &&
                                      (c.country || c.name || "")
                                        .toLowerCase()
                                        .includes("bhutan"),
                                  );

                                return (
                                  <div
                                    key={pIndex}
                                    className="bg-gray-50 p-6 rounded-lg border border-gray-200 relative space-y-8"
                                  >
                                    <div className="flex justify-between items-center mb-3 border-b pb-2">
                                      <h5 className="font-semibold text-base text-[#003DA5]">
                                        Related PEP #{pIndex + 1}
                                      </h5>
                                      {guarantor.relatedPeps.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleRemoveRelatedPep(
                                              index,
                                              pIndex,
                                            )
                                          }
                                          className="h-8 text-red-500"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>

                                    {/* 1. Relationship & PEP Classification */}
                                    <div className="space-y-4">
                                      <h4 className="text-sm font-semibold text-[#003DA5]">
                                        Relationship & Classification
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                            Relationship{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <Select
                                            value={pep.relationship}
                                            onValueChange={(val) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "relationship",
                                                val,
                                              )
                                            }
                                          >
                                            <SelectTrigger
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.relationship`
                                                ],
                                              )}
                                            >
                                              <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="spouse">
                                                Spouse
                                              </SelectItem>
                                              <SelectItem value="parent">
                                                Parent
                                              </SelectItem>
                                              <SelectItem value="sibling">
                                                Sibling
                                              </SelectItem>
                                              <SelectItem value="child">
                                                Child
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                          {errors[
                                            `relatedPeps.${pIndex}.relationship`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.relationship`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                            Category{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <Select
                                            value={pep.category}
                                            onValueChange={(val) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "category",
                                                val,
                                              )
                                            }
                                          >
                                            <SelectTrigger
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.category`
                                                ],
                                              )}
                                            >
                                              <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {pepCategoryOptions.map(
                                                (opt, i) => (
                                                  <SelectItem
                                                    key={i}
                                                    value={String(
                                                      opt.pep_category_pk_code ||
                                                        opt.id,
                                                    )}
                                                  >
                                                    {opt.pep_category ||
                                                      opt.name}
                                                  </SelectItem>
                                                ),
                                              )}
                                            </SelectContent>
                                          </Select>
                                          {errors[
                                            `relatedPeps.${pIndex}.category`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.category`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                            Sub Category{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <Select
                                            value={pep.subCategory}
                                            onValueChange={(val) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "subCategory",
                                                val,
                                              )
                                            }
                                            disabled={!pep.category}
                                          >
                                            <SelectTrigger
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.subCategory`
                                                ],
                                              )}
                                            >
                                              <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {guarantor.relatedPepOptionsMap?.[
                                                pIndex
                                              ]?.map((opt: any, i: number) => (
                                                <SelectItem
                                                  key={i}
                                                  value={String(
                                                    opt.pep_sub_category_pk_code ||
                                                      opt.id,
                                                  )}
                                                >
                                                  {opt.pep_sub_category ||
                                                    opt.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          {errors[
                                            `relatedPeps.${pIndex}.subCategory`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.subCategory`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                            Upload ID Proof{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <div className="flex items-center gap-2">
                                            <input
                                              id={`pep-related-proof-${index}-${pIndex}`}
                                              type="file"
                                              accept=".pdf,.jpg,.jpeg,.png"
                                              onChange={(e) =>
                                                handleRelatedPepFileChange(
                                                  index,
                                                  pIndex,
                                                  "identificationProof",
                                                  e.target.files?.[0] || null,
                                                )
                                              }
                                              className="hidden"
                                            />
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="w-28 bg-transparent"
                                              onClick={() =>
                                                document
                                                  .getElementById(
                                                    `pep-related-proof-${index}-${pIndex}`,
                                                  )
                                                  ?.click()
                                              }
                                            >
                                              Choose File
                                            </Button>
                                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                              {pep.identificationProof ||
                                                "No file chosen"}
                                            </span>
                                          </div>
                                          {errors[
                                            `relatedPeps.${pIndex}.identificationProof`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.identificationProof`
                                                ]
                                              }
                                            </p>
                                          )}
                                          <p className="text-xs text-gray-500">
                                            Allowed: PDF, JPG, PNG (Max 5MB)
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* 2. Personal Information */}
                                    <div className="space-y-4 pt-4 border-t border-gray-200">
                                      <h4 className="text-sm font-semibold text-[#003DA5]">
                                        Personal Information
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            Identification Type{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <Select
                                            value={pep.identificationType}
                                            onValueChange={(v) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "identificationType",
                                                v,
                                              )
                                            }
                                          >
                                            <SelectTrigger
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.identificationType`
                                                ],
                                              )}
                                            >
                                              <SelectValue placeholder="[Select]" />
                                            </SelectTrigger>
                                            <SelectContent sideOffset={4}>
                                              {identificationTypeOptions
                                                .filter((opt: any) => {
                                                  const label = (
                                                    opt.identity_type ||
                                                    opt.identification_type ||
                                                    opt.name ||
                                                    ""
                                                  ).toLowerCase();
                                                  return !(
                                                    label.includes(
                                                      "trade license number",
                                                    ) ||
                                                    label.includes(
                                                      "company registration number",
                                                    )
                                                  );
                                                })
                                                .map((option, idx) => {
                                                  const value = String(
                                                    option.identity_type_pk_code ||
                                                      option.identification_type_pk_code ||
                                                      option.id ||
                                                      idx,
                                                  );
                                                  const label =
                                                    option.identity_type ||
                                                    option.identification_type ||
                                                    option.name ||
                                                    "Unknown";
                                                  return (
                                                    <SelectItem
                                                      key={value}
                                                      value={value}
                                                    >
                                                      {label}
                                                    </SelectItem>
                                                  );
                                                })}
                                            </SelectContent>
                                          </Select>
                                          {errors[
                                            `relatedPeps.${pIndex}.identificationType`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.identificationType`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            Identification No.{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <RestrictedInput
                                            allowed="numeric"
                                            maxLength={11}
                                            placeholder="Enter ID No"
                                            className={getFieldStyle(
                                              !!errors[
                                                `relatedPeps.${pIndex}.identificationNo`
                                              ],
                                            )}
                                            value={pep.identificationNo || ""}
                                            onChange={(e) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "identificationNo",
                                                e.target.value,
                                              )
                                            }
                                          />
                                          {errors[
                                            `relatedPeps.${pIndex}.identificationNo`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.identificationNo`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            Salutation{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <Select
                                            value={pep.salutation}
                                            onValueChange={(v) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "salutation",
                                                v,
                                              )
                                            }
                                          >
                                            <SelectTrigger
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.salutation`
                                                ],
                                              )}
                                            >
                                              <SelectValue placeholder="[Select]" />
                                            </SelectTrigger>
                                            <SelectContent sideOffset={4}>
                                              <SelectItem value="mr">
                                                Mr.
                                              </SelectItem>
                                              <SelectItem value="mrs">
                                                Mrs.
                                              </SelectItem>
                                              <SelectItem value="ms">
                                                Ms.
                                              </SelectItem>
                                              <SelectItem value="dr">
                                                Dr.
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                          {errors[
                                            `relatedPeps.${pIndex}.salutation`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.salutation`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            Full Name{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <RestrictedInput
                                            allowed="alpha"
                                            placeholder="Enter Full Name"
                                            className={getFieldStyle(
                                              !!errors[
                                                `relatedPeps.${pIndex}.applicantName`
                                              ],
                                            )}
                                            value={pep.applicantName || ""}
                                            onChange={(e) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "applicantName",
                                                e.target.value,
                                              )
                                            }
                                          />
                                          {errors[
                                            `relatedPeps.${pIndex}.applicantName`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.applicantName`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            Nationality{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <Select
                                            value={pep.nationality}
                                            onValueChange={(v) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "nationality",
                                                v,
                                              )
                                            }
                                          >
                                            <SelectTrigger
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.nationality`
                                                ],
                                              )}
                                            >
                                              <SelectValue placeholder="[Select]" />
                                            </SelectTrigger>
                                            <SelectContent sideOffset={4}>
                                              {nationalityOptions.map(
                                                (option, idx) => {
                                                  const value = String(
                                                    option.nationality_pk_code ||
                                                      option.id ||
                                                      option.code ||
                                                      idx,
                                                  );
                                                  const label =
                                                    option.nationality ||
                                                    option.name ||
                                                    option.label ||
                                                    "Unknown";
                                                  return (
                                                    <SelectItem
                                                      key={value}
                                                      value={value}
                                                    >
                                                      {label}
                                                    </SelectItem>
                                                  );
                                                },
                                              )}
                                            </SelectContent>
                                          </Select>
                                          {errors[
                                            `relatedPeps.${pIndex}.nationality`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.nationality`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            Gender{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <Select
                                            value={pep.gender}
                                            onValueChange={(v) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "gender",
                                                v,
                                              )
                                            }
                                          >
                                            <SelectTrigger
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.gender`
                                                ],
                                              )}
                                            >
                                              <SelectValue placeholder="[Select]" />
                                            </SelectTrigger>
                                            <SelectContent sideOffset={4}>
                                              <SelectItem value="male">
                                                Male
                                              </SelectItem>
                                              <SelectItem value="female">
                                                Female
                                              </SelectItem>
                                              <SelectItem value="other">
                                                Other
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                          {errors[
                                            `relatedPeps.${pIndex}.gender`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.gender`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            ID Issue Date{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <Input
                                            type="date"
                                            max={today}
                                            className={getFieldStyle(
                                              !!errors[
                                                `relatedPeps.${pIndex}.idIssueDate`
                                              ],
                                            )}
                                            value={formatDateForInput(
                                              pep.idIssueDate,
                                            )}
                                            onChange={(e) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "idIssueDate",
                                                e.target.value,
                                              )
                                            }
                                          />
                                          {errors[
                                            `relatedPeps.${pIndex}.idIssueDate`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.idIssueDate`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            ID Expiry Date{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <Input
                                            type="date"
                                            min={today}
                                            className={getFieldStyle(
                                              !!errors[
                                                `relatedPeps.${pIndex}.idExpiryDate`
                                              ],
                                            )}
                                            value={formatDateForInput(
                                              pep.idExpiryDate,
                                            )}
                                            onChange={(e) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "idExpiryDate",
                                                e.target.value,
                                              )
                                            }
                                          />
                                          {errors[
                                            `relatedPeps.${pIndex}.idExpiryDate`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.idExpiryDate`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            Date of Birth{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <Input
                                            type="date"
                                            max={maxDobDate}
                                            className={getFieldStyle(
                                              !!errors[
                                                `relatedPeps.${pIndex}.dateOfBirth`
                                              ],
                                            )}
                                            value={formatDateForInput(
                                              pep.dateOfBirth,
                                            )}
                                            onChange={(e) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "dateOfBirth",
                                                e.target.value,
                                              )
                                            }
                                          />
                                          {errors[
                                            `relatedPeps.${pIndex}.dateOfBirth`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.dateOfBirth`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            Marital Status{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <Select
                                            value={pep.maritalStatus}
                                            onValueChange={(v) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "maritalStatus",
                                                v,
                                              )
                                            }
                                          >
                                            <SelectTrigger
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.maritalStatus`
                                                ],
                                              )}
                                            >
                                              <SelectValue placeholder="[Select]" />
                                            </SelectTrigger>
                                            <SelectContent sideOffset={4}>
                                              {maritalStatusOptions.map(
                                                (option, idx) => {
                                                  const value = String(
                                                    option.marital_status_pk_code ||
                                                      option.id ||
                                                      option.value ||
                                                      option.code ||
                                                      idx,
                                                  );
                                                  const label =
                                                    option.marital_status ||
                                                    option.name ||
                                                    option.label ||
                                                    "Unknown";
                                                  return (
                                                    <SelectItem
                                                      key={value}
                                                      value={value}
                                                    >
                                                      {label}
                                                    </SelectItem>
                                                  );
                                                },
                                              )}
                                            </SelectContent>
                                          </Select>
                                          {errors[
                                            `relatedPeps.${pIndex}.maritalStatus`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.maritalStatus`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            Tax Identifier Type
                                          </Label>
                                          <Select
                                            value={pep.taxIdentifierType}
                                            onValueChange={(v) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "taxIdentifierType",
                                                v,
                                              )
                                            }
                                          >
                                            <SelectTrigger
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.taxIdentifierType`
                                                ],
                                              )}
                                            >
                                              <SelectValue placeholder="[Select]" />
                                            </SelectTrigger>
                                            <SelectContent sideOffset={4}>
                                              <SelectItem value="BIT">
                                                BIT
                                              </SelectItem>
                                              <SelectItem value="GST">
                                                GST
                                              </SelectItem>
                                              <SelectItem value="CIT">
                                                CIT
                                              </SelectItem>
                                              <SelectItem value="PIT">
                                                PIT
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                          {errors[
                                            `relatedPeps.${pIndex}.taxIdentifierType`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.taxIdentifierType`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            TPN No
                                          </Label>
                                          <RestrictedInput
                                            allowed="numeric"
                                            maxLength={11}
                                            placeholder="Enter TPN"
                                            className={getFieldStyle(
                                              !!errors[
                                                `relatedPeps.${pIndex}.tpnNo`
                                              ],
                                            )}
                                            value={pep.tpnNo || ""}
                                            onChange={(e) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "tpnNo",
                                                e.target.value,
                                              )
                                            }
                                          />
                                          {errors[
                                            `relatedPeps.${pIndex}.tpnNo`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.tpnNo`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        {isPepBhutanese && (
                                          <div className="space-y-1.5 sm:space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                              Household Number{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </Label>
                                            <RestrictedInput
                                              allowed="alphanumeric"
                                              maxLength={20}
                                              placeholder="Enter Household No"
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.householdNumber`
                                                ],
                                              )}
                                              value={pep.householdNumber || ""}
                                              onChange={(e) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "householdNumber",
                                                  e.target.value,
                                                )
                                              }
                                            />
                                            {errors[
                                              `relatedPeps.${pIndex}.householdNumber`
                                            ] && (
                                              <p className="text-xs text-red-500 mt-1">
                                                {
                                                  errors[
                                                    `relatedPeps.${pIndex}.householdNumber`
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* 2.1 Spouse Personal Information (Conditional) */}
                                    {isPepMarried && (
                                      <div className="space-y-4 pt-4 border-t border-gray-200">
                                        <h4 className="text-sm font-semibold text-[#003DA5]">
                                          Spouse Personal Information
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                          <div className="space-y-1.5 sm:space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                              Spouse ID Type{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </Label>
                                            <Select
                                              value={pep.spouseIdType}
                                              onValueChange={(v) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "spouseIdType",
                                                  v,
                                                )
                                              }
                                            >
                                              <SelectTrigger
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.spouseIdType`
                                                  ],
                                                )}
                                              >
                                                <SelectValue placeholder="[Select]" />
                                              </SelectTrigger>
                                              <SelectContent sideOffset={4}>
                                                {identificationTypeOptions
                                                  .filter((opt: any) => {
                                                    const label = (
                                                      opt.identity_type ||
                                                      opt.identification_type ||
                                                      opt.name ||
                                                      ""
                                                    ).toLowerCase();
                                                    return !(
                                                      label.includes(
                                                        "trade license number",
                                                      ) ||
                                                      label.includes(
                                                        "company registration number",
                                                      )
                                                    );
                                                  })
                                                  .map((option, idx) => {
                                                    const value = String(
                                                      option.identity_type_pk_code ||
                                                        option.identification_type_pk_code ||
                                                        option.id ||
                                                        idx,
                                                    );
                                                    const label =
                                                      option.identity_type ||
                                                      option.identification_type ||
                                                      option.name ||
                                                      "Unknown";
                                                    return (
                                                      <SelectItem
                                                        key={value}
                                                        value={value}
                                                      >
                                                        {label}
                                                      </SelectItem>
                                                    );
                                                  })}
                                              </SelectContent>
                                            </Select>
                                            {errors[
                                              `relatedPeps.${pIndex}.spouseIdType`
                                            ] && (
                                              <p className="text-xs text-red-500 mt-1">
                                                {
                                                  errors[
                                                    `relatedPeps.${pIndex}.spouseIdType`
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </div>

                                          <div className="space-y-1.5 sm:space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                              Spouse ID No.{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </Label>
                                            <RestrictedInput
                                              allowed="numeric"
                                              maxLength={11}
                                              placeholder="Enter ID No"
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.spouseIdNumber`
                                                ],
                                              )}
                                              value={pep.spouseIdNumber || ""}
                                              onChange={(e) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "spouseIdNumber",
                                                  e.target.value,
                                                )
                                              }
                                            />
                                            {errors[
                                              `relatedPeps.${pIndex}.spouseIdNumber`
                                            ] && (
                                              <p className="text-xs text-red-500 mt-1">
                                                {
                                                  errors[
                                                    `relatedPeps.${pIndex}.spouseIdNumber`
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </div>

                                          <div className="space-y-1.5 sm:space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                              Spouse Salutation{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </Label>
                                            <Select
                                              value={pep.spouseSalutation}
                                              onValueChange={(v) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "spouseSalutation",
                                                  v,
                                                )
                                              }
                                            >
                                              <SelectTrigger
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.spouseSalutation`
                                                  ],
                                                )}
                                              >
                                                <SelectValue placeholder="[Select]" />
                                              </SelectTrigger>
                                              <SelectContent sideOffset={4}>
                                                <SelectItem value="mr">
                                                  Mr.
                                                </SelectItem>
                                                <SelectItem value="mrs">
                                                  Mrs.
                                                </SelectItem>
                                                <SelectItem value="ms">
                                                  Ms.
                                                </SelectItem>
                                                <SelectItem value="dr">
                                                  Dr.
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                            {errors[
                                              `relatedPeps.${pIndex}.spouseSalutation`
                                            ] && (
                                              <p className="text-xs text-red-500 mt-1">
                                                {
                                                  errors[
                                                    `relatedPeps.${pIndex}.spouseSalutation`
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </div>

                                          <div className="space-y-1.5 sm:space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                              Spouse Name{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </Label>
                                            <RestrictedInput
                                              allowed="alpha"
                                              placeholder="Enter Full Name"
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.spouseName`
                                                ],
                                              )}
                                              value={pep.spouseName || ""}
                                              onChange={(e) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "spouseName",
                                                  e.target.value,
                                                )
                                              }
                                            />
                                            {errors[
                                              `relatedPeps.${pIndex}.spouseName`
                                            ] && (
                                              <p className="text-xs text-red-500 mt-1">
                                                {
                                                  errors[
                                                    `relatedPeps.${pIndex}.spouseName`
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </div>

                                          <div className="space-y-1.5 sm:space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                              Spouse Nationality{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </Label>
                                            <Select
                                              value={pep.spouseNationality}
                                              onValueChange={(v) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "spouseNationality",
                                                  v,
                                                )
                                              }
                                            >
                                              <SelectTrigger
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.spouseNationality`
                                                  ],
                                                )}
                                              >
                                                <SelectValue placeholder="[Select]" />
                                              </SelectTrigger>
                                              <SelectContent sideOffset={4}>
                                                {nationalityOptions.map(
                                                  (option, idx) => {
                                                    const value = String(
                                                      option.nationality_pk_code ||
                                                        option.id ||
                                                        option.code ||
                                                        idx,
                                                    );
                                                    const label =
                                                      option.nationality ||
                                                      option.name ||
                                                      option.label ||
                                                      "Unknown";
                                                    return (
                                                      <SelectItem
                                                        key={value}
                                                        value={value}
                                                      >
                                                        {label}
                                                      </SelectItem>
                                                    );
                                                  },
                                                )}
                                              </SelectContent>
                                            </Select>
                                            {errors[
                                              `relatedPeps.${pIndex}.spouseNationality`
                                            ] && (
                                              <p className="text-xs text-red-500 mt-1">
                                                {
                                                  errors[
                                                    `relatedPeps.${pIndex}.spouseNationality`
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </div>

                                          <div className="space-y-1.5 sm:space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                              Spouse Gender{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </Label>
                                            <Select
                                              value={pep.spouseGender}
                                              onValueChange={(v) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "spouseGender",
                                                  v,
                                                )
                                              }
                                            >
                                              <SelectTrigger
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.spouseGender`
                                                  ],
                                                )}
                                              >
                                                <SelectValue placeholder="[Select]" />
                                              </SelectTrigger>
                                              <SelectContent sideOffset={4}>
                                                <SelectItem value="male">
                                                  Male
                                                </SelectItem>
                                                <SelectItem value="female">
                                                  Female
                                                </SelectItem>
                                                <SelectItem value="other">
                                                  Other
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                            {errors[
                                              `relatedPeps.${pIndex}.spouseGender`
                                            ] && (
                                              <p className="text-xs text-red-500 mt-1">
                                                {
                                                  errors[
                                                    `relatedPeps.${pIndex}.spouseGender`
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </div>

                                          <div className="space-y-1.5 sm:space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                              Spouse ID Issue Date{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </Label>
                                            <Input
                                              type="date"
                                              max={today}
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.spouseIdIssueDate`
                                                ],
                                              )}
                                              value={formatDateForInput(
                                                pep.spouseIdIssueDate,
                                              )}
                                              onChange={(e) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "spouseIdIssueDate",
                                                  e.target.value,
                                                )
                                              }
                                            />
                                            {errors[
                                              `relatedPeps.${pIndex}.spouseIdIssueDate`
                                            ] && (
                                              <p className="text-xs text-red-500 mt-1">
                                                {
                                                  errors[
                                                    `relatedPeps.${pIndex}.spouseIdIssueDate`
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </div>

                                          <div className="space-y-1.5 sm:space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                              Spouse ID Expiry Date{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </Label>
                                            <Input
                                              type="date"
                                              min={today}
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.spouseIdExpiryDate`
                                                ],
                                              )}
                                              value={formatDateForInput(
                                                pep.spouseIdExpiryDate,
                                              )}
                                              onChange={(e) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "spouseIdExpiryDate",
                                                  e.target.value,
                                                )
                                              }
                                            />
                                            {errors[
                                              `relatedPeps.${pIndex}.spouseIdExpiryDate`
                                            ] && (
                                              <p className="text-xs text-red-500 mt-1">
                                                {
                                                  errors[
                                                    `relatedPeps.${pIndex}.spouseIdExpiryDate`
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </div>

                                          <div className="space-y-1.5 sm:space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                              Spouse Date of Birth{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </Label>
                                            <Input
                                              type="date"
                                              max={maxDobDate}
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.spouseDob`
                                                ],
                                              )}
                                              value={formatDateForInput(
                                                pep.spouseDob,
                                              )}
                                              onChange={(e) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "spouseDob",
                                                  e.target.value,
                                                )
                                              }
                                            />
                                            {errors[
                                              `relatedPeps.${pIndex}.spouseDob`
                                            ] && (
                                              <p className="text-xs text-red-500 mt-1">
                                                {
                                                  errors[
                                                    `relatedPeps.${pIndex}.spouseDob`
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </div>

                                          <div className="space-y-1.5 sm:space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                              Spouse Tax Identifier
                                            </Label>
                                            <Select
                                              value={
                                                pep.spouseTaxIdentifierType
                                              }
                                              onValueChange={(v) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "spouseTaxIdentifierType",
                                                  v,
                                                )
                                              }
                                            >
                                              <SelectTrigger
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.spouseTaxIdentifierType`
                                                  ],
                                                )}
                                              >
                                                <SelectValue placeholder="[Select]" />
                                              </SelectTrigger>
                                              <SelectContent sideOffset={4}>
                                                <SelectItem value="BIT">
                                                  BIT
                                                </SelectItem>
                                                <SelectItem value="GST">
                                                  GST
                                                </SelectItem>
                                                <SelectItem value="CIT">
                                                  CIT
                                                </SelectItem>
                                                <SelectItem value="PIT">
                                                  PIT
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                            {errors[
                                              `relatedPeps.${pIndex}.spouseTaxIdentifierType`
                                            ] && (
                                              <p className="text-xs text-red-500 mt-1">
                                                {
                                                  errors[
                                                    `relatedPeps.${pIndex}.spouseTaxIdentifierType`
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </div>

                                          {isPepSpouseBhutanese && (
                                            <div className="space-y-1.5 sm:space-y-2.5">
                                              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                                Spouse Household No{" "}
                                                <span className="text-red-500">
                                                  *
                                                </span>
                                              </Label>
                                              <RestrictedInput
                                                allowed="alphanumeric"
                                                maxLength={20}
                                                placeholder="Enter Household No"
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.spouseHouseholdNumber`
                                                  ],
                                                )}
                                                value={
                                                  pep.spouseHouseholdNumber ||
                                                  ""
                                                }
                                                onChange={(e) =>
                                                  handleRelatedPepChange(
                                                    index,
                                                    pIndex,
                                                    "spouseHouseholdNumber",
                                                    e.target.value,
                                                  )
                                                }
                                              />
                                              {errors[
                                                `relatedPeps.${pIndex}.spouseHouseholdNumber`
                                              ] && (
                                                <p className="text-xs text-red-500 mt-1">
                                                  {
                                                    errors[
                                                      `relatedPeps.${pIndex}.spouseHouseholdNumber`
                                                    ]
                                                  }
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Spouse Permanent Address */}
                                        <div className="mt-6 border-t border-gray-200 pt-4">
                                          <h4 className="text-sm font-semibold text-[#003DA5] mb-3">
                                            Spouse Permanent Address
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="space-y-1.5 sm:space-y-2.5">
                                              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                                Country{" "}
                                                <span className="text-red-500">
                                                  *
                                                </span>
                                              </Label>
                                              <Select
                                                value={pep.spousePermCountry}
                                                onValueChange={(v) =>
                                                  handleRelatedPepChange(
                                                    index,
                                                    pIndex,
                                                    "spousePermCountry",
                                                    v,
                                                  )
                                                }
                                              >
                                                <SelectTrigger
                                                  className={getFieldStyle(
                                                    !!errors[
                                                      `relatedPeps.${pIndex}.spousePermCountry`
                                                    ],
                                                  )}
                                                >
                                                  <SelectValue placeholder="Select Country" />
                                                </SelectTrigger>
                                                <SelectContent sideOffset={4}>
                                                  {countryOptions.map(
                                                    (option, idx) => {
                                                      const value = String(
                                                        option.country_pk_code ||
                                                          option.id ||
                                                          idx,
                                                      );
                                                      const label =
                                                        option.country ||
                                                        option.name ||
                                                        "Unknown";
                                                      return (
                                                        <SelectItem
                                                          key={value}
                                                          value={value}
                                                        >
                                                          {label}
                                                        </SelectItem>
                                                      );
                                                    },
                                                  )}
                                                </SelectContent>
                                              </Select>
                                              {errors[
                                                `relatedPeps.${pIndex}.spousePermCountry`
                                              ] && (
                                                <p className="text-xs text-red-500 mt-1">
                                                  {
                                                    errors[
                                                      `relatedPeps.${pIndex}.spousePermCountry`
                                                    ]
                                                  }
                                                </p>
                                              )}
                                            </div>

                                            <div className="space-y-1.5 sm:space-y-2.5">
                                              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                                {isPepSpouseBhutanPerm
                                                  ? "Dzongkhag"
                                                  : "State"}{" "}
                                                <span className="text-red-500">
                                                  *
                                                </span>
                                              </Label>
                                              {!isPepSpouseBhutanPerm ? (
                                                <RestrictedInput
                                                  allowed="alpha"
                                                  placeholder="Enter State"
                                                  className={getFieldStyle(
                                                    !!errors[
                                                      `relatedPeps.${pIndex}.spousePermDzongkhag`
                                                    ],
                                                  )}
                                                  value={
                                                    pep.spousePermDzongkhag ||
                                                    ""
                                                  }
                                                  onChange={(e) =>
                                                    handleRelatedPepChange(
                                                      index,
                                                      pIndex,
                                                      "spousePermDzongkhag",
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                              ) : (
                                                <Select
                                                  value={
                                                    pep.spousePermDzongkhag
                                                  }
                                                  onValueChange={(v) =>
                                                    handleRelatedPepChange(
                                                      index,
                                                      pIndex,
                                                      "spousePermDzongkhag",
                                                      v,
                                                    )
                                                  }
                                                  disabled={
                                                    !pep.spousePermCountry ||
                                                    !isPepSpouseBhutanPerm
                                                  }
                                                >
                                                  <SelectTrigger
                                                    className={getFieldStyle(
                                                      !!errors[
                                                        `relatedPeps.${pIndex}.spousePermDzongkhag`
                                                      ],
                                                    )}
                                                  >
                                                    <SelectValue placeholder="Select Dzongkhag" />
                                                  </SelectTrigger>
                                                  <SelectContent sideOffset={4}>
                                                    {dzongkhagOptions.map(
                                                      (option, idx) => {
                                                        const value = String(
                                                          option.dzongkhag_pk_code ||
                                                            option.id ||
                                                            idx,
                                                        );
                                                        const label =
                                                          option.dzongkhag ||
                                                          option.name ||
                                                          "Unknown";
                                                        return (
                                                          <SelectItem
                                                            key={value}
                                                            value={value}
                                                          >
                                                            {label}
                                                          </SelectItem>
                                                        );
                                                      },
                                                    )}
                                                  </SelectContent>
                                                </Select>
                                              )}
                                              {errors[
                                                `relatedPeps.${pIndex}.spousePermDzongkhag`
                                              ] && (
                                                <p className="text-xs text-red-500 mt-1">
                                                  {
                                                    errors[
                                                      `relatedPeps.${pIndex}.spousePermDzongkhag`
                                                    ]
                                                  }
                                                </p>
                                              )}
                                            </div>

                                            <div className="space-y-1.5 sm:space-y-2.5">
                                              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                                {isPepSpouseBhutanPerm
                                                  ? "Gewog"
                                                  : "Province"}{" "}
                                                <span className="text-red-500">
                                                  *
                                                </span>
                                              </Label>
                                              {!isPepSpouseBhutanPerm ? (
                                                <RestrictedInput
                                                  allowed="alpha"
                                                  placeholder="Enter Province"
                                                  className={getFieldStyle(
                                                    !!errors[
                                                      `relatedPeps.${pIndex}.spousePermGewog`
                                                    ],
                                                  )}
                                                  value={
                                                    pep.spousePermGewog || ""
                                                  }
                                                  onChange={(e) =>
                                                    handleRelatedPepChange(
                                                      index,
                                                      pIndex,
                                                      "spousePermGewog",
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                              ) : (
                                                <Select
                                                  value={pep.spousePermGewog}
                                                  onValueChange={(v) =>
                                                    handleRelatedPepChange(
                                                      index,
                                                      pIndex,
                                                      "spousePermGewog",
                                                      v,
                                                    )
                                                  }
                                                  disabled={
                                                    !pep.spousePermCountry ||
                                                    !isPepSpouseBhutanPerm ||
                                                    !pep.spousePermDzongkhag
                                                  }
                                                >
                                                  <SelectTrigger
                                                    className={getFieldStyle(
                                                      !!errors[
                                                        `relatedPeps.${pIndex}.spousePermGewog`
                                                      ],
                                                    )}
                                                  >
                                                    <SelectValue placeholder="Select Gewog" />
                                                  </SelectTrigger>
                                                  <SelectContent sideOffset={4}>
                                                    {pep.spousePermGewogOptions
                                                      ?.length > 0 ? (
                                                      pep.spousePermGewogOptions.map(
                                                        (
                                                          option: any,
                                                          optionIndex: number,
                                                        ) => {
                                                          const value = String(
                                                            option.gewog_pk_code ||
                                                              option.id ||
                                                              option.code ||
                                                              optionIndex,
                                                          );
                                                          const label =
                                                            option.gewog ||
                                                            option.name ||
                                                            option.label ||
                                                            "Unknown";
                                                          return (
                                                            <SelectItem
                                                              key={value}
                                                              value={value}
                                                            >
                                                              {label}
                                                            </SelectItem>
                                                          );
                                                        },
                                                      )
                                                    ) : (
                                                      <SelectItem
                                                        value="loading"
                                                        disabled
                                                      >
                                                        {pep.spousePermDzongkhag
                                                          ? "Loading..."
                                                          : "Select Dzongkhag first"}
                                                      </SelectItem>
                                                    )}
                                                  </SelectContent>
                                                </Select>
                                              )}
                                              {errors[
                                                `relatedPeps.${pIndex}.spousePermGewog`
                                              ] && (
                                                <p className="text-xs text-red-500 mt-1">
                                                  {
                                                    errors[
                                                      `relatedPeps.${pIndex}.spousePermGewog`
                                                    ]
                                                  }
                                                </p>
                                              )}
                                            </div>

                                            <div className="space-y-1.5 sm:space-y-2.5">
                                              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                                {isPepSpouseBhutanPerm
                                                  ? "Village/Street"
                                                  : "Street Name"}{" "}
                                                <span className="text-red-500">
                                                  *
                                                </span>
                                              </Label>
                                              <RestrictedInput
                                                allowed="alphanumeric"
                                                placeholder={
                                                  isPepSpouseBhutanPerm
                                                    ? "Enter Village/Street"
                                                    : "Enter Street"
                                                }
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.spousePermVillage`
                                                  ],
                                                )}
                                                value={
                                                  pep.spousePermVillage || ""
                                                }
                                                onChange={(e) =>
                                                  handleRelatedPepChange(
                                                    index,
                                                    pIndex,
                                                    "spousePermVillage",
                                                    e.target.value,
                                                  )
                                                }
                                                disabled={
                                                  !pep.spousePermCountry
                                                }
                                              />
                                              {errors[
                                                `relatedPeps.${pIndex}.spousePermVillage`
                                              ] && (
                                                <p className="text-xs text-red-500 mt-1">
                                                  {
                                                    errors[
                                                      `relatedPeps.${pIndex}.spousePermVillage`
                                                    ]
                                                  }
                                                </p>
                                              )}
                                            </div>
                                          </div>

                                          {isPepSpouseBhutanPerm && (
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                                              <div className="space-y-1.5 sm:space-y-2.5">
                                                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                                  Thram No{" "}
                                                  <span className="text-red-500">
                                                    *
                                                  </span>
                                                </Label>
                                                <RestrictedInput
                                                  allowed="alphanumeric"
                                                  placeholder="Enter Thram No"
                                                  className={getFieldStyle(
                                                    !!errors[
                                                      `relatedPeps.${pIndex}.spousePermThram`
                                                    ],
                                                  )}
                                                  value={
                                                    pep.spousePermThram || ""
                                                  }
                                                  onChange={(e) =>
                                                    handleRelatedPepChange(
                                                      index,
                                                      pIndex,
                                                      "spousePermThram",
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                                {errors[
                                                  `relatedPeps.${pIndex}.spousePermThram`
                                                ] && (
                                                  <p className="text-xs text-red-500 mt-1">
                                                    {
                                                      errors[
                                                        `relatedPeps.${pIndex}.spousePermThram`
                                                      ]
                                                    }
                                                  </p>
                                                )}
                                              </div>
                                              <div className="space-y-1.5 sm:space-y-2.5">
                                                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                                  House No{" "}
                                                  <span className="text-red-500">
                                                    *
                                                  </span>
                                                </Label>
                                                <RestrictedInput
                                                  allowed="alphanumeric"
                                                  placeholder="Enter House No"
                                                  className={getFieldStyle(
                                                    !!errors[
                                                      `relatedPeps.${pIndex}.spousePermHouse`
                                                    ],
                                                  )}
                                                  value={
                                                    pep.spousePermHouse || ""
                                                  }
                                                  onChange={(e) =>
                                                    handleRelatedPepChange(
                                                      index,
                                                      pIndex,
                                                      "spousePermHouse",
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                                {errors[
                                                  `relatedPeps.${pIndex}.spousePermHouse`
                                                ] && (
                                                  <p className="text-xs text-red-500 mt-1">
                                                    {
                                                      errors[
                                                        `relatedPeps.${pIndex}.spousePermHouse`
                                                      ]
                                                    }
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          {!isPepSpouseBhutanPerm &&
                                            pep.spousePermCountry && (
                                              <div className="space-y-1.5 sm:space-y-2.5 mt-4 w-full col-span-1 md:col-span-2">
                                                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                                  Upload Address Proof{" "}
                                                  <span className="text-red-500">
                                                    *
                                                  </span>
                                                </Label>
                                                <div className="flex items-center gap-2">
                                                  <input
                                                    type="file"
                                                    id={`pep-spousePermAddressProof-${index}-${pIndex}`}
                                                    className="hidden"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) =>
                                                      handleRelatedPepFileChange(
                                                        index,
                                                        pIndex,
                                                        "spousePermAddressProof",
                                                        e.target.files?.[0] ||
                                                          null,
                                                      )
                                                    }
                                                  />
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-28 bg-transparent"
                                                    onClick={() =>
                                                      document
                                                        .getElementById(
                                                          `pep-spousePermAddressProof-${index}-${pIndex}`,
                                                        )
                                                        ?.click()
                                                    }
                                                  >
                                                    Choose File
                                                  </Button>
                                                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                    {pep.spousePermAddressProof ||
                                                      "No file chosen"}
                                                  </span>
                                                </div>
                                                {errors[
                                                  `relatedPeps.${pIndex}.spousePermAddressProof`
                                                ] && (
                                                  <p className="text-xs text-red-500 mt-1">
                                                    {
                                                      errors[
                                                        `relatedPeps.${pIndex}.spousePermAddressProof`
                                                      ]
                                                    }
                                                  </p>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                  Allowed: PDF, JPG, PNG (Max
                                                  5MB)
                                                </p>
                                              </div>
                                            )}
                                        </div>

                                        {/* Spouse Contact Information */}
                                        <div className="mt-4 border-t border-gray-200 pt-4">
                                          <h4 className="text-sm font-semibold text-[#003DA5] mb-3">
                                            Spouse Contact Information
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-1.5 sm:space-y-2.5">
                                              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                                Email Address{" "}
                                                <span className="text-red-500">
                                                  *
                                                </span>
                                              </Label>
                                              <Input
                                                type="email"
                                                placeholder="Enter Email"
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.spouseEmail`
                                                  ],
                                                )}
                                                value={pep.spouseEmail || ""}
                                                onChange={(e) =>
                                                  handleRelatedPepChange(
                                                    index,
                                                    pIndex,
                                                    "spouseEmail",
                                                    e.target.value,
                                                  )
                                                }
                                              />
                                              {errors[
                                                `relatedPeps.${pIndex}.spouseEmail`
                                              ] && (
                                                <p className="text-xs text-red-500 mt-1">
                                                  {
                                                    errors[
                                                      `relatedPeps.${pIndex}.spouseEmail`
                                                    ]
                                                  }
                                                </p>
                                              )}
                                            </div>

                                            <div className="space-y-1.5 sm:space-y-2.5">
                                              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                                Contact No.{" "}
                                                <span className="text-red-500">
                                                  *
                                                </span>
                                              </Label>
                                              <RestrictedInput
                                                allowed="numeric"
                                                maxLength={8}
                                                placeholder="Enter Contact No"
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.spouseContact`
                                                  ],
                                                )}
                                                value={pep.spouseContact || ""}
                                                onChange={(e) =>
                                                  handleRelatedPepChange(
                                                    index,
                                                    pIndex,
                                                    "spouseContact",
                                                    e.target.value,
                                                  )
                                                }
                                              />
                                              {errors[
                                                `relatedPeps.${pIndex}.spouseContact`
                                              ] && (
                                                <p className="text-xs text-red-500 mt-1">
                                                  {
                                                    errors[
                                                      `relatedPeps.${pIndex}.spouseContact`
                                                    ]
                                                  }
                                                </p>
                                              )}
                                            </div>

                                            <div className="space-y-1.5 sm:space-y-2.5">
                                              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                                Alternate Contact No
                                              </Label>
                                              <RestrictedInput
                                                allowed="numeric"
                                                maxLength={8}
                                                placeholder="Enter Alternate No"
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.spouseAlternateContact`
                                                  ],
                                                )}
                                                value={
                                                  pep.spouseAlternateContact ||
                                                  ""
                                                }
                                                onChange={(e) =>
                                                  handleRelatedPepChange(
                                                    index,
                                                    pIndex,
                                                    "spouseAlternateContact",
                                                    e.target.value,
                                                  )
                                                }
                                              />
                                              {errors[
                                                `relatedPeps.${pIndex}.spouseAlternateContact`
                                              ] && (
                                                <p className="text-xs text-red-500 mt-1">
                                                  {
                                                    errors[
                                                      `relatedPeps.${pIndex}.spouseAlternateContact`
                                                    ]
                                                  }
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* 3. Permanent Address */}
                                    <div className="space-y-4 pt-4 border-t border-gray-200">
                                      <h4 className="text-sm font-semibold text-[#003DA5]">
                                        Permanent Address
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            Country{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <Select
                                            value={pep.permCountry}
                                            onValueChange={(v) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "permCountry",
                                                v,
                                              )
                                            }
                                          >
                                            <SelectTrigger
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.permCountry`
                                                ],
                                              )}
                                            >
                                              <SelectValue placeholder="Select Country" />
                                            </SelectTrigger>
                                            <SelectContent sideOffset={4}>
                                              {countryOptions.map(
                                                (option, idx) => {
                                                  const value = String(
                                                    option.country_pk_code ||
                                                      option.id ||
                                                      idx,
                                                  );
                                                  const label =
                                                    option.country ||
                                                    option.name ||
                                                    "Unknown";
                                                  return (
                                                    <SelectItem
                                                      key={value}
                                                      value={value}
                                                    >
                                                      {label}
                                                    </SelectItem>
                                                  );
                                                },
                                              )}
                                            </SelectContent>
                                          </Select>
                                          {errors[
                                            `relatedPeps.${pIndex}.permCountry`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.permCountry`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            {isPepBhutanPerm
                                              ? "Dzongkhag"
                                              : "State"}{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          {!isPepBhutanPerm ? (
                                            <RestrictedInput
                                              allowed="alpha"
                                              placeholder="Enter State"
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.permDzongkhag`
                                                ],
                                              )}
                                              value={pep.permDzongkhag || ""}
                                              onChange={(e) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "permDzongkhag",
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          ) : (
                                            <Select
                                              value={pep.permDzongkhag}
                                              onValueChange={(v) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "permDzongkhag",
                                                  v,
                                                )
                                              }
                                              disabled={
                                                !pep.permCountry ||
                                                !isPepBhutanPerm
                                              }
                                            >
                                              <SelectTrigger
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.permDzongkhag`
                                                  ],
                                                )}
                                              >
                                                <SelectValue placeholder="Select Dzongkhag" />
                                              </SelectTrigger>
                                              <SelectContent sideOffset={4}>
                                                {dzongkhagOptions.map(
                                                  (option, idx) => {
                                                    const value = String(
                                                      option.dzongkhag_pk_code ||
                                                        option.id ||
                                                        idx,
                                                    );
                                                    const label =
                                                      option.dzongkhag ||
                                                      option.name ||
                                                      "Unknown";
                                                    return (
                                                      <SelectItem
                                                        key={value}
                                                        value={value}
                                                      >
                                                        {label}
                                                      </SelectItem>
                                                    );
                                                  },
                                                )}
                                              </SelectContent>
                                            </Select>
                                          )}
                                          {errors[
                                            `relatedPeps.${pIndex}.permDzongkhag`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.permDzongkhag`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            {isPepBhutanPerm
                                              ? "Gewog"
                                              : "Province"}{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          {!isPepBhutanPerm ? (
                                            <RestrictedInput
                                              allowed="alpha"
                                              placeholder="Enter Province"
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.permGewog`
                                                ],
                                              )}
                                              value={pep.permGewog || ""}
                                              onChange={(e) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "permGewog",
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          ) : (
                                            <Select
                                              value={pep.permGewog}
                                              onValueChange={(v) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "permGewog",
                                                  v,
                                                )
                                              }
                                              disabled={
                                                !pep.permCountry ||
                                                !isPepBhutanPerm ||
                                                !pep.permDzongkhag
                                              }
                                            >
                                              <SelectTrigger
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.permGewog`
                                                  ],
                                                )}
                                              >
                                                <SelectValue placeholder="Select Gewog" />
                                              </SelectTrigger>
                                              <SelectContent sideOffset={4}>
                                                {pep.permGewogOptions?.length >
                                                0 ? (
                                                  pep.permGewogOptions.map(
                                                    (
                                                      option: any,
                                                      optionIndex: number,
                                                    ) => {
                                                      const value = String(
                                                        option.gewog_pk_code ||
                                                          option.id ||
                                                          option.code ||
                                                          optionIndex,
                                                      );
                                                      const label =
                                                        option.gewog ||
                                                        option.name ||
                                                        option.label ||
                                                        "Unknown";
                                                      return (
                                                        <SelectItem
                                                          key={value}
                                                          value={value}
                                                        >
                                                          {label}
                                                        </SelectItem>
                                                      );
                                                    },
                                                  )
                                                ) : (
                                                  <SelectItem
                                                    value="loading"
                                                    disabled
                                                  >
                                                    {pep.permDzongkhag
                                                      ? "Loading..."
                                                      : "Select Dzongkhag first"}
                                                  </SelectItem>
                                                )}
                                              </SelectContent>
                                            </Select>
                                          )}
                                          {errors[
                                            `relatedPeps.${pIndex}.permGewog`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.permGewog`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            {isPepBhutanPerm
                                              ? "Village/Street"
                                              : "Street"}{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <RestrictedInput
                                            allowed="alphanumeric"
                                            placeholder={
                                              isPepBhutanPerm
                                                ? "Enter Village/Street"
                                                : "Enter Street"
                                            }
                                            className={getFieldStyle(
                                              !!errors[
                                                `relatedPeps.${pIndex}.permVillage`
                                              ],
                                            )}
                                            value={pep.permVillage || ""}
                                            onChange={(e) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "permVillage",
                                                e.target.value,
                                              )
                                            }
                                            disabled={!pep.permCountry}
                                          />
                                          {errors[
                                            `relatedPeps.${pIndex}.permVillage`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.permVillage`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        {isPepBhutanPerm && (
                                          <>
                                            <div className="space-y-1.5 sm:space-y-2.5">
                                              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                                Thram No{" "}
                                                <span className="text-red-500">
                                                  *
                                                </span>
                                              </Label>
                                              <RestrictedInput
                                                allowed="alphanumeric"
                                                placeholder="Enter Thram No"
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.permThram`
                                                  ],
                                                )}
                                                value={pep.permThram || ""}
                                                onChange={(e) =>
                                                  handleRelatedPepChange(
                                                    index,
                                                    pIndex,
                                                    "permThram",
                                                    e.target.value,
                                                  )
                                                }
                                              />
                                              {errors[
                                                `relatedPeps.${pIndex}.permThram`
                                              ] && (
                                                <p className="text-xs text-red-500 mt-1">
                                                  {
                                                    errors[
                                                      `relatedPeps.${pIndex}.permThram`
                                                    ]
                                                  }
                                                </p>
                                              )}
                                            </div>
                                            <div className="space-y-1.5 sm:space-y-2.5">
                                              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                                House No{" "}
                                                <span className="text-red-500">
                                                  *
                                                </span>
                                              </Label>
                                              <RestrictedInput
                                                allowed="alphanumeric"
                                                placeholder="Enter House No"
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.permHouse`
                                                  ],
                                                )}
                                                value={pep.permHouse || ""}
                                                onChange={(e) =>
                                                  handleRelatedPepChange(
                                                    index,
                                                    pIndex,
                                                    "permHouse",
                                                    e.target.value,
                                                  )
                                                }
                                              />
                                              {errors[
                                                `relatedPeps.${pIndex}.permHouse`
                                              ] && (
                                                <p className="text-xs text-red-500 mt-1">
                                                  {
                                                    errors[
                                                      `relatedPeps.${pIndex}.permHouse`
                                                    ]
                                                  }
                                                </p>
                                              )}
                                            </div>
                                          </>
                                        )}

                                        {!isPepBhutanPerm &&
                                          pep.permCountry && (
                                            <div className="space-y-1.5 sm:space-y-2.5 mt-4 w-full col-span-1 md:col-span-2">
                                              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                                Upload Address Proof{" "}
                                                <span className="text-red-500">
                                                  *
                                                </span>
                                              </Label>
                                              <div className="flex items-center gap-2">
                                                <input
                                                  type="file"
                                                  id={`pep-permAddressProof-${index}-${pIndex}`}
                                                  className="hidden"
                                                  accept=".pdf,.jpg,.jpeg,.png"
                                                  onChange={(e) =>
                                                    handleRelatedPepFileChange(
                                                      index,
                                                      pIndex,
                                                      "permAddressProof",
                                                      e.target.files?.[0] ||
                                                        null,
                                                    )
                                                  }
                                                />
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  className="w-28 bg-transparent"
                                                  onClick={() =>
                                                    document
                                                      .getElementById(
                                                        `pep-permAddressProof-${index}-${pIndex}`,
                                                      )
                                                      ?.click()
                                                  }
                                                >
                                                  Choose File
                                                </Button>
                                                <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                  {pep.permAddressProof ||
                                                    "No file chosen"}
                                                </span>
                                              </div>
                                              {errors[
                                                `relatedPeps.${pIndex}.permAddressProof`
                                              ] && (
                                                <p className="text-xs text-red-500 mt-1">
                                                  {
                                                    errors[
                                                      `relatedPeps.${pIndex}.permAddressProof`
                                                    ]
                                                  }
                                                </p>
                                              )}
                                              <p className="text-xs text-gray-500">
                                                Allowed: PDF, JPG, PNG (Max 5MB)
                                              </p>
                                            </div>
                                          )}
                                      </div>
                                    </div>

                                    {/* 4. Current Address & Contact */}
                                    <div className="space-y-4 pt-4 border-t border-gray-200">
                                      <h4 className="text-sm font-semibold text-[#003DA5]">
                                        Current Address & Contact Details
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            Country{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <Select
                                            value={pep.currCountry}
                                            onValueChange={(v) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "currCountry",
                                                v,
                                              )
                                            }
                                          >
                                            <SelectTrigger
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.currCountry`
                                                ],
                                              )}
                                            >
                                              <SelectValue placeholder="Select Country" />
                                            </SelectTrigger>
                                            <SelectContent sideOffset={4}>
                                              {countryOptions.map(
                                                (option, idx) => {
                                                  const value = String(
                                                    option.country_pk_code ||
                                                      option.id ||
                                                      idx,
                                                  );
                                                  const label =
                                                    option.country ||
                                                    option.name ||
                                                    "Unknown";
                                                  return (
                                                    <SelectItem
                                                      key={value}
                                                      value={value}
                                                    >
                                                      {label}
                                                    </SelectItem>
                                                  );
                                                },
                                              )}
                                            </SelectContent>
                                          </Select>
                                          {errors[
                                            `relatedPeps.${pIndex}.currCountry`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.currCountry`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            {isPepBhutanCurr
                                              ? "Dzongkhag"
                                              : "State"}{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          {!isPepBhutanCurr ? (
                                            <RestrictedInput
                                              allowed="alpha"
                                              placeholder="Enter State"
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.currDzongkhag`
                                                ],
                                              )}
                                              value={pep.currDzongkhag || ""}
                                              onChange={(e) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "currDzongkhag",
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          ) : (
                                            <Select
                                              value={pep.currDzongkhag}
                                              onValueChange={(v) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "currDzongkhag",
                                                  v,
                                                )
                                              }
                                              disabled={
                                                !pep.currCountry ||
                                                !isPepBhutanCurr
                                              }
                                            >
                                              <SelectTrigger
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.currDzongkhag`
                                                  ],
                                                )}
                                              >
                                                <SelectValue placeholder="Select Dzongkhag" />
                                              </SelectTrigger>
                                              <SelectContent sideOffset={4}>
                                                {dzongkhagOptions.map(
                                                  (option, idx) => {
                                                    const value = String(
                                                      option.dzongkhag_pk_code ||
                                                        option.id ||
                                                        idx,
                                                    );
                                                    const label =
                                                      option.dzongkhag ||
                                                      option.name ||
                                                      "Unknown";
                                                    return (
                                                      <SelectItem
                                                        key={value}
                                                        value={value}
                                                      >
                                                        {label}
                                                      </SelectItem>
                                                    );
                                                  },
                                                )}
                                              </SelectContent>
                                            </Select>
                                          )}
                                          {errors[
                                            `relatedPeps.${pIndex}.currDzongkhag`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.currDzongkhag`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            {isPepBhutanCurr
                                              ? "Gewog"
                                              : "Province"}{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          {!isPepBhutanCurr ? (
                                            <RestrictedInput
                                              allowed="alpha"
                                              placeholder="Enter Province"
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.currGewog`
                                                ],
                                              )}
                                              value={pep.currGewog || ""}
                                              onChange={(e) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "currGewog",
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          ) : (
                                            <Select
                                              value={pep.currGewog}
                                              onValueChange={(v) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "currGewog",
                                                  v,
                                                )
                                              }
                                              disabled={
                                                !pep.currCountry ||
                                                !isPepBhutanCurr ||
                                                !pep.currDzongkhag
                                              }
                                            >
                                              <SelectTrigger
                                                className={getFieldStyle(
                                                  !!errors[
                                                    `relatedPeps.${pIndex}.currGewog`
                                                  ],
                                                )}
                                              >
                                                <SelectValue placeholder="Select Gewog" />
                                              </SelectTrigger>
                                              <SelectContent sideOffset={4}>
                                                {pep.currGewogOptions?.length >
                                                0 ? (
                                                  pep.currGewogOptions.map(
                                                    (
                                                      option: any,
                                                      optionIndex: number,
                                                    ) => {
                                                      const value = String(
                                                        option.gewog_pk_code ||
                                                          option.id ||
                                                          option.code ||
                                                          optionIndex,
                                                      );
                                                      const label =
                                                        option.gewog ||
                                                        option.name ||
                                                        option.label ||
                                                        "Unknown";
                                                      return (
                                                        <SelectItem
                                                          key={value}
                                                          value={value}
                                                        >
                                                          {label}
                                                        </SelectItem>
                                                      );
                                                    },
                                                  )
                                                ) : (
                                                  <SelectItem
                                                    value="loading"
                                                    disabled
                                                  >
                                                    {pep.currDzongkhag
                                                      ? "Loading..."
                                                      : "Select Dzongkhag first"}
                                                  </SelectItem>
                                                )}
                                              </SelectContent>
                                            </Select>
                                          )}
                                          {errors[
                                            `relatedPeps.${pIndex}.currGewog`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.currGewog`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            {isPepBhutanCurr
                                              ? "Village/Street"
                                              : "Street Name"}{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <RestrictedInput
                                            allowed="alphanumeric"
                                            placeholder={
                                              isPepBhutanCurr
                                                ? "Enter Village/Street"
                                                : "Enter Street"
                                            }
                                            className={getFieldStyle(
                                              !!errors[
                                                `relatedPeps.${pIndex}.currVillage`
                                              ],
                                            )}
                                            value={pep.currVillage || ""}
                                            onChange={(e) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "currVillage",
                                                e.target.value,
                                              )
                                            }
                                            disabled={!pep.currCountry}
                                          />
                                          {errors[
                                            `relatedPeps.${pIndex}.currVillage`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.currVillage`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {isPepBhutanCurr && (
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                                          <div className="space-y-1.5 sm:space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                              House/Flat No{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </Label>
                                            <RestrictedInput
                                              allowed="alphanumeric"
                                              placeholder="Enter House/Flat No"
                                              className={getFieldStyle(
                                                !!errors[
                                                  `relatedPeps.${pIndex}.currHouse`
                                                ],
                                              )}
                                              value={pep.currHouse || ""}
                                              onChange={(e) =>
                                                handleRelatedPepChange(
                                                  index,
                                                  pIndex,
                                                  "currHouse",
                                                  e.target.value,
                                                )
                                              }
                                            />
                                            {errors[
                                              `relatedPeps.${pIndex}.currHouse`
                                            ] && (
                                              <p className="text-xs text-red-500 mt-1">
                                                {
                                                  errors[
                                                    `relatedPeps.${pIndex}.currHouse`
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {!isPepBhutanCurr && pep.currCountry && (
                                        <div className="space-y-1.5 sm:space-y-2.5 mt-4 w-full col-span-1 md:col-span-2">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            Upload Address Proof{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="file"
                                              id={`pep-currAddressProof-${index}-${pIndex}`}
                                              className="hidden"
                                              accept=".pdf,.jpg,.jpeg,.png"
                                              onChange={(e) =>
                                                handleRelatedPepFileChange(
                                                  index,
                                                  pIndex,
                                                  "currAddressProof",
                                                  e.target.files?.[0] || null,
                                                )
                                              }
                                            />
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="w-28 bg-transparent"
                                              onClick={() =>
                                                document
                                                  .getElementById(
                                                    `pep-currAddressProof-${index}-${pIndex}`,
                                                  )
                                                  ?.click()
                                              }
                                            >
                                              Choose File
                                            </Button>
                                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                              {pep.currAddressProof ||
                                                "No file chosen"}
                                            </span>
                                          </div>
                                          {errors[
                                            `relatedPeps.${pIndex}.currAddressProof`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.currAddressProof`
                                                ]
                                              }
                                            </p>
                                          )}
                                          <p className="text-xs text-gray-500">
                                            Allowed: PDF, JPG, PNG (Max 5MB)
                                          </p>
                                        </div>
                                      )}

                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            Email Address{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <Input
                                            type="email"
                                            placeholder="Enter Email"
                                            className={getFieldStyle(
                                              !!errors[
                                                `relatedPeps.${pIndex}.email`
                                              ],
                                            )}
                                            value={pep.email || ""}
                                            onChange={(e) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "email",
                                                e.target.value,
                                              )
                                            }
                                          />
                                          {errors[
                                            `relatedPeps.${pIndex}.email`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.email`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            Contact No.{" "}
                                            <span className="text-red-500">
                                              *
                                            </span>
                                          </Label>
                                          <RestrictedInput
                                            allowed="numeric"
                                            maxLength={8}
                                            placeholder="Enter Contact No"
                                            className={getFieldStyle(
                                              !!errors[
                                                `relatedPeps.${pIndex}.contact`
                                              ],
                                            )}
                                            value={pep.contact || ""}
                                            onChange={(e) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "contact",
                                                e.target.value,
                                              )
                                            }
                                          />
                                          {errors[
                                            `relatedPeps.${pIndex}.contact`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.contact`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2.5">
                                          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                            Alternate Contact No
                                          </Label>
                                          <RestrictedInput
                                            allowed="numeric"
                                            maxLength={8}
                                            placeholder="Enter Alternate No"
                                            className={getFieldStyle(
                                              !!errors[
                                                `relatedPeps.${pIndex}.alternateContact`
                                              ],
                                            )}
                                            value={pep.alternateContact || ""}
                                            onChange={(e) =>
                                              handleRelatedPepChange(
                                                index,
                                                pIndex,
                                                "alternateContact",
                                                e.target.value,
                                              )
                                            }
                                          />
                                          {errors[
                                            `relatedPeps.${pIndex}.alternateContact`
                                          ] && (
                                            <p className="text-xs text-red-500 mt-1">
                                              {
                                                errors[
                                                  `relatedPeps.${pIndex}.alternateContact`
                                                ]
                                              }
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              },
                            )}

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleAddRelatedPep(index)}
                              className="w-full sm:w-auto border-dashed border-2 border-gray-300 text-gray-600 hover:border-[#003DA5] hover:text-[#003DA5]"
                            >
                              <PlusCircle className="mr-2 h-4 w-4" /> Add
                              Another Related PEP
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* F. EMPLOYMENT STATUS */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-[#003DA5] mb-4 bg-gray-50 p-2 rounded">
                      F. Employment Status
                    </h4>
                    <div className="mb-6">
                      <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                        Current Status <span className="text-red-500">*</span>
                      </Label>
                      <div
                        className={
                          errors.employmentStatus
                            ? "border border-red-500 rounded-lg p-2"
                            : ""
                        }
                      >
                        <RadioGroup
                          value={guarantor.employmentStatus}
                          onValueChange={(value) =>
                            updateGuarantorField(
                              index,
                              "employmentStatus",
                              value,
                            )
                          }
                          className="flex flex-col sm:flex-row gap-6 mt-2"
                        >
                          {["employed", "unemployed", "self-employed"].map(
                            (status) => (
                              <div
                                key={status}
                                className="flex items-center space-x-2"
                              >
                                <RadioGroupItem
                                  value={status}
                                  id={`${status}-${index}`}
                                />
                                <Label
                                  htmlFor={`${status}-${index}`}
                                  className="cursor-pointer font-normal mb-0"
                                >
                                  {status.charAt(0).toUpperCase() +
                                    status.slice(1)}
                                </Label>
                              </div>
                            ),
                          )}
                        </RadioGroup>
                      </div>
                      {errors.employmentStatus && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.employmentStatus}
                        </p>
                      )}
                    </div>

                    {guarantor.employmentStatus === "employed" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                            Employee ID <span className="text-red-500">*</span>
                          </Label>
                          <RestrictedInput
                            allowed="alphanumeric"
                            value={guarantor.employeeId || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "employeeId",
                                e.target.value,
                              )
                            }
                            onBlur={(e) =>
                              handleBlurField(
                                index,
                                "employeeId",
                                e.target.value,
                              )
                            }
                            className={getFieldStyle(!!errors.employeeId)}
                            placeholder="Enter Employee ID"
                          />
                          {errors.employeeId && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.employeeId}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                            Occupation <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={guarantor.occupation}
                            onValueChange={(value) =>
                              updateGuarantorField(index, "occupation", value)
                            }
                          >
                            <SelectTrigger
                              className={getFieldStyle(!!errors.occupation)}
                            >
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent>
                              {occupationOptions.map((opt, i) => (
                                <SelectItem
                                  key={i}
                                  value={String(opt.occ_pk_code || opt.id || i)}
                                >
                                  {opt.occ_name || opt.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.occupation && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.occupation}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                            Employer Type{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={guarantor.employerType}
                            onValueChange={(value) =>
                              updateGuarantorField(index, "employerType", value)
                            }
                          >
                            <SelectTrigger
                              className={getFieldStyle(!!errors.employerType)}
                            >
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="government">
                                Government
                              </SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                              <SelectItem value="corporate">
                                Corporate
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.employerType && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.employerType}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                            Designation <span className="text-red-500">*</span>
                          </Label>
                          <RestrictedInput
                            allowed="alpha"
                            value={guarantor.designation || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "designation",
                                e.target.value,
                              )
                            }
                            onBlur={(e) =>
                              handleBlurField(
                                index,
                                "designation",
                                e.target.value,
                              )
                            }
                            className={getFieldStyle(!!errors.designation)}
                            placeholder="Enter Designation"
                          />
                          {errors.designation && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.designation}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                            Grade <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={guarantor.grade}
                            onValueChange={(value) =>
                              updateGuarantorField(index, "grade", value)
                            }
                          >
                            <SelectTrigger
                              className={getFieldStyle(!!errors.grade)}
                            >
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 20 }, (_, i) => i + 1).map(
                                (num) => (
                                  <SelectItem key={num} value={String(num)}>
                                    {num}
                                  </SelectItem>
                                ),
                              )}
                              <SelectItem value="p1">P1</SelectItem>
                              <SelectItem value="p2">P2</SelectItem>
                              <SelectItem value="p3">P3</SelectItem>
                              <SelectItem value="p4">P4</SelectItem>
                              <SelectItem value="p5">P5</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.grade && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.grade}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                            Organization Name{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={guarantor.organizationName}
                            onValueChange={(value) =>
                              updateGuarantorField(
                                index,
                                "organizationName",
                                value,
                              )
                            }
                          >
                            <SelectTrigger
                              className={getFieldStyle(
                                !!errors.organizationName,
                              )}
                            >
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent>
                              {organizationOptions.map((opt, i) => (
                                <SelectItem
                                  key={i}
                                  value={String(
                                    opt.lgal_constitution_pk_code ||
                                      opt.id ||
                                      i,
                                  )}
                                >
                                  {opt.lgal_constitution || opt.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.organizationName && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.organizationName}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                            Org. Location{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <RestrictedInput
                            allowed="alphanumeric"
                            value={guarantor.orgLocation || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "orgLocation",
                                e.target.value,
                              )
                            }
                            onBlur={(e) =>
                              handleBlurField(
                                index,
                                "orgLocation",
                                e.target.value,
                              )
                            }
                            className={getFieldStyle(!!errors.orgLocation)}
                            placeholder="Enter Location"
                          />
                          {errors.orgLocation && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.orgLocation}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                            Service Joining Date{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="date"
                            max={today}
                            value={formatDateForInput(guarantor.joiningDate)}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "joiningDate",
                                e.target.value,
                              )
                            }
                            className={getFieldStyle(!!errors.joiningDate)}
                          />
                          {errors.joiningDate && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.joiningDate}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                            Nature of Service{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={guarantor.serviceNature}
                            onValueChange={(value) =>
                              updateGuarantorField(
                                index,
                                "serviceNature",
                                value,
                              )
                            }
                          >
                            <SelectTrigger
                              className={getFieldStyle(!!errors.serviceNature)}
                            >
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="permanent">
                                Permanent
                              </SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="temporary">
                                Temporary
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.serviceNature && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.serviceNature}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                            Gross Annual Salary{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            value={guarantor.annualSalary || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "annualSalary",
                                e.target.value,
                              )
                            }
                            className={getFieldStyle(!!errors.annualSalary)}
                            placeholder="Enter Amount"
                          />
                          {errors.annualSalary && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.annualSalary}
                            </p>
                          )}
                        </div>

                        {guarantor.serviceNature === "contract" && (
                          <div>
                            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                              Contract End Date{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              type="date"
                              min={today}
                              value={formatDateForInput(
                                guarantor.contractEndDate,
                              )}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "contractEndDate",
                                  e.target.value,
                                )
                              }
                              className={getFieldStyle(
                                !!errors.contractEndDate,
                              )}
                            />
                            {errors.contractEndDate && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.contractEndDate}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-6 mt-12 mb-6">
        <Button
          variant="secondary"
          size="lg"
          onClick={onBack}
          className="h-14 bg-gray-500 hover:bg-gray-600 text-white px-10 py-6 rounded-xl text-base font-semibold shadow-lg"
        >
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleNext}
          className="h-14 bg-[#003DA5] hover:bg-[#002D7A] text-white px-10 py-6 rounded-xl text-base font-semibold shadow-lg"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
