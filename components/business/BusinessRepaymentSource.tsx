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
import { Upload, Plus, Trash2 } from "lucide-react";

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

// ================== Validation Helpers ==================
// FIX: Updated isRequired to allow the number 0 as a valid input
const isRequired = (value: any) => {
  if (value === 0) return false;
  return !value || value.toString().trim() === "";
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidCID = (value: string) => /^\d{11}$/.test(value);
const isValidTPN = (value: string) => /^\d{11}$/.test(value);
const isValidMobile = (value: string) => /^(16|17|77)\d{6}$/.test(value);
const isValidFixedLine = (value: string) => /^[2-8]\d{6,7}$/.test(value);

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

// --- Uniform Styling (Orange Focus, Red Error) ---
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

const createEmptyRelatedPep = () => ({
  relationship: "",
  identificationNo: "",
  category: "",
  subCategory: "",
  identificationProof: "",
});

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
  maritalStatus: "",
  spouseCid: "",
  spouseName: "",
  spouseContact: "",
  familyTree: "",
  passportPhoto: "",
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
  permAddressProof: "",

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
  currAddressProof: "",

  isPep: "",
  pepCategory: "",
  pepSubCategory: "",
  pepUpload: "",
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
  proofFile: null as File | null,
  proofFileName: "",

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
  // Business Income State
  const [businessIncomeData, setBusinessIncomeData] = useState({
    repaymentSourceType: "Business Income",
    amount: formData?.businessIncome?.amount || "",
    proofFile: formData?.businessIncome?.proofFile || null,
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

  // --- FIELD VALIDATION ---
  const validateField = (fieldName: string, value: any): string => {
    if (!value || value.toString().trim() === "") return "";
    switch (fieldName) {
      case "idNumber":
      case "spouseCid":
        if (!isValidCID(value)) return "CID must be 11 digits";
        break;
      case "tpnNo":
        if (!isValidTPN(value)) return "TPN must be 11 digits";
        break;
      case "contact":
      case "spouseContact":
      case "currAlternateContact":
        if (!isValidMobile(value))
          return "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";
        break;
      case "email":
        if (!isValidEmail(value)) return "Invalid email format";
        break;
      case "dateOfBirth":
        if (!isLegalAge(value))
          return "Guarantor must be at least 18 years old";
        break;
    }
    return "";
  };

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
        const isEmpty = !value || value.toString().trim() === "";
        if (isEmpty && currentErrors[field]) {
          // Keep existing required error
        } else {
          const newErrors = { ...currentErrors };
          delete newErrors[field];
          updated[index] = {
            ...updated[index],
            errors: newErrors,
          };
        }
      }
      return updated;
    });
  };

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

        setNationalityOptions(nat);
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
        maritalStatus: mappedMaritalStatus || fetched.maritalStatus || "",
        spouseCid: fetched.spouseIdentificationNo || "",
        spouseName: fetched.spouseName || "",
        spouseContact: fetched.spouseContact || "",
        familyTree: fetched.familyTree || "",
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

        isPep: fetched.pepPerson || fetched.pepDeclaration || "",
        pepCategory: fetched.pepCategory || "",
        pepSubCategory: fetched.pepSubCategory || "",
        pepUpload: fetched.identificationProof || "",
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
      };

      let permGewogOptions: any[] = [];
      let currGewogOptions: any[] = [];

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
          pepSubCategoryOptions: prev[index].pepSubCategoryOptions,
          relatedPepOptionsMap: prev[index].relatedPepOptionsMap,
          showLookupPopup: false,
          errors: {},
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

  const handleBusinessIncomeFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setBusinessIncomeData({
        ...businessIncomeData,
        proofFile: file,
        proofFileName: file.name,
      });
      if (businessErrors.proofFile) {
        const newErrors = { ...businessErrors };
        delete newErrors.proofFile;
        setBusinessErrors(newErrors);
      }
    }
  };

  const addGuarantor = () => {
    setGuarantors([...guarantors, createEmptyGuarantor()]);
  };

  const removeGuarantor = (index: number) => {
    if (guarantors.length > 1) {
      setGuarantors(guarantors.filter((_, i) => i !== index));
    }
  };

  const updateGuarantorField = (index: number, field: string, value: any) => {
    setGuarantors((prev) => {
      const updated = [...prev];
      const newErrors = { ...updated[index].errors };
      delete newErrors[field];

      updated[index] = {
        ...updated[index],
        [field]: value,
        ...(field === "isPep" && value === "yes" ? { relatedToPep: "" } : {}),
        ...(field === "isPep" && value === "no"
          ? { pepCategory: "", pepSubCategory: "", pepUpload: "" }
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
        errors: newErrors,
      };
      return updated;
    });
  };

  const handleFileChange = (
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

      setGuarantors((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          [fieldName]: file.name,
          errors: { ...updated[index].errors, [fieldName]: "" },
        };
        return updated;
      });
    }
  };

  const handleGuarantorProofChange = (
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

      setGuarantors((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          proofFile: file,
          proofFileName: file.name,
          errors: { ...updated[index].errors, proofFile: "" },
        };
        return updated;
      });
    }
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

  const handleRemoveRelatedPep = (gIndex: number, pIndex: number) => {
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
      peps[pIndex] = { ...peps[pIndex], [field]: value };
      up[gIndex].relatedPeps = peps;

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

  const handleRelatedPepFileChange = (
    gIndex: number,
    pIndex: number,
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

      setGuarantors((prev) => {
        const updated = [...prev];
        const relatedPeps = [...updated[gIndex].relatedPeps];
        relatedPeps[pIndex] = {
          ...relatedPeps[pIndex],
          identificationProof: file.name,
        };
        updated[gIndex].relatedPeps = relatedPeps;
        return updated;
      });
    }
  };

  const validateAllGuarantors = (): boolean => {
    let isValid = true;
    const updatedGuarantors = [...guarantors];

    guarantors.forEach((guarantor, index) => {
      const updatedErrors = { ...guarantor.errors };

      const validateFieldAndSetError = (
        field: string,
        condition: boolean,
        message: string,
      ) => {
        if (condition) {
          updatedErrors[field] = message;
        } else {
          delete updatedErrors[field];
        }
      };

      // Personal Information
      validateFieldAndSetError(
        "idType",
        isRequired(guarantor.idType),
        "idType is required",
      );
      validateFieldAndSetError(
        "idNumber",
        isRequired(guarantor.idNumber),
        "idNumber is required",
      );
      if (guarantor.idNumber && !isValidCID(guarantor.idNumber)) {
        updatedErrors.idNumber = "CID must be 11 digits";
      } else if (!isRequired(guarantor.idNumber)) {
        delete updatedErrors.idNumber;
      }

      validateFieldAndSetError(
        "salutation",
        isRequired(guarantor.salutation),
        "salutation is required",
      );
      validateFieldAndSetError(
        "guarantorName",
        isRequired(guarantor.guarantorName),
        "guarantorName is required",
      );
      validateFieldAndSetError(
        "nationality",
        isRequired(guarantor.nationality),
        "nationality is required",
      );
      validateFieldAndSetError(
        "gender",
        isRequired(guarantor.gender),
        "gender is required",
      );
      validateFieldAndSetError(
        "idIssueDate",
        isRequired(guarantor.idIssueDate),
        "idIssueDate is required",
      );
      validateFieldAndSetError(
        "idExpiryDate",
        isRequired(guarantor.idExpiryDate),
        "idExpiryDate is required",
      );
      validateFieldAndSetError(
        "dateOfBirth",
        isRequired(guarantor.dateOfBirth),
        "dateOfBirth is required",
      );
      if (guarantor.dateOfBirth && !isLegalAge(guarantor.dateOfBirth)) {
        updatedErrors.dateOfBirth = "Guarantor must be at least 18 years old";
      } else if (!isRequired(guarantor.dateOfBirth)) {
        delete updatedErrors.dateOfBirth;
      }

      validateFieldAndSetError(
        "maritalStatus",
        isRequired(guarantor.maritalStatus),
        "maritalStatus is required",
      );
      validateFieldAndSetError(
        "bankName",
        isRequired(guarantor.bankName),
        "bankName is required",
      );
      validateFieldAndSetError(
        "bankAccountNumber",
        isRequired(guarantor.bankAccountNumber),
        "bankAccountNumber is required",
      );

      if (guarantor.tpnNo && !isValidTPN(guarantor.tpnNo)) {
        updatedErrors.tpnNo = "TPN must be 11 digits";
      } else {
        delete updatedErrors.tpnNo;
      }

      // Spouse fields if married
      if (getIsMarried(guarantor)) {
        validateFieldAndSetError(
          "spouseCid",
          isRequired(guarantor.spouseCid),
          "spouseCid is required",
        );
        if (guarantor.spouseCid && !isValidCID(guarantor.spouseCid)) {
          updatedErrors.spouseCid = "CID must be 11 digits";
        } else if (!isRequired(guarantor.spouseCid)) {
          delete updatedErrors.spouseCid;
        }

        validateFieldAndSetError(
          "spouseName",
          isRequired(guarantor.spouseName),
          "spouseName is required",
        );
        validateFieldAndSetError(
          "spouseContact",
          isRequired(guarantor.spouseContact),
          "spouseContact is required",
        );
        if (
          guarantor.spouseContact &&
          !isValidMobile(guarantor.spouseContact)
        ) {
          updatedErrors.spouseContact =
            "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";
        } else if (!isRequired(guarantor.spouseContact)) {
          delete updatedErrors.spouseContact;
        }
      } else {
        delete updatedErrors.spouseCid;
        delete updatedErrors.spouseName;
        delete updatedErrors.spouseContact;
      }

      // Permanent Address
      validateFieldAndSetError(
        "permCountry",
        isRequired(guarantor.permCountry),
        "permCountry is required",
      );

      const isBhutanPerm =
        guarantor.permCountry && isBhutan(guarantor.permCountry);

      if (isBhutanPerm) {
        validateFieldAndSetError(
          "permDzongkhag",
          isRequired(guarantor.permDzongkhag),
          "Dzongkhag is required",
        );
        validateFieldAndSetError(
          "permGewog",
          isRequired(guarantor.permGewog),
          "Gewog is required",
        );
        validateFieldAndSetError(
          "permVillage",
          isRequired(guarantor.permVillage),
          "Village/Street is required",
        );
        delete updatedErrors.permCity;
        delete updatedErrors.permPostal;
        delete updatedErrors.permAddressProof;
      } else if (guarantor.permCountry) {
        validateFieldAndSetError(
          "permDzongkhag",
          isRequired(guarantor.permDzongkhag),
          "State is required",
        );
        validateFieldAndSetError(
          "permGewog",
          isRequired(guarantor.permGewog),
          "Province is required",
        );
        validateFieldAndSetError(
          "permVillage",
          isRequired(guarantor.permVillage),
          "Street name is required",
        );
        validateFieldAndSetError(
          "permCity",
          isRequired(guarantor.permCity),
          "City is required",
        );
        validateFieldAndSetError(
          "permAddressProof",
          !guarantor.permAddressProof,
          "Address proof is required",
        );
        delete updatedErrors.permThram;
        delete updatedErrors.permHouse;
      }

      // Current Address
      validateFieldAndSetError(
        "currCountry",
        isRequired(guarantor.currCountry),
        "currCountry is required",
      );

      const isBhutanCurr =
        guarantor.currCountry && isBhutan(guarantor.currCountry);

      if (isBhutanCurr) {
        validateFieldAndSetError(
          "currDzongkhag",
          isRequired(guarantor.currDzongkhag),
          "Dzongkhag is required",
        );
        validateFieldAndSetError(
          "currGewog",
          isRequired(guarantor.currGewog),
          "Gewog is required",
        );
        validateFieldAndSetError(
          "currVillage",
          isRequired(guarantor.currVillage),
          "Village/Street is required",
        );
        delete updatedErrors.currCity;
        delete updatedErrors.currPostal;
        delete updatedErrors.currAddressProof;
      } else if (guarantor.currCountry) {
        validateFieldAndSetError(
          "currDzongkhag",
          isRequired(guarantor.currDzongkhag),
          "State is required",
        );
        validateFieldAndSetError(
          "currGewog",
          isRequired(guarantor.currGewog),
          "Province is required",
        );
        validateFieldAndSetError(
          "currVillage",
          isRequired(guarantor.currVillage),
          "Street name is required",
        );
        validateFieldAndSetError(
          "currCity",
          isRequired(guarantor.currCity),
          "City is required",
        );
        validateFieldAndSetError(
          "currAddressProof",
          !guarantor.currAddressProof,
          "Address proof is required",
        );
      }

      validateFieldAndSetError(
        "email",
        isRequired(guarantor.email),
        "Email is required",
      );
      if (guarantor.email && !isValidEmail(guarantor.email)) {
        updatedErrors.email = "Invalid email format";
      } else if (!isRequired(guarantor.email)) {
        delete updatedErrors.email;
      }

      validateFieldAndSetError(
        "contact",
        isRequired(guarantor.contact),
        "Contact number is required",
      );
      if (guarantor.contact && !isValidMobile(guarantor.contact)) {
        updatedErrors.contact =
          "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";
      } else if (!isRequired(guarantor.contact)) {
        delete updatedErrors.contact;
      }

      if (
        guarantor.currAlternateContact &&
        !isValidMobile(guarantor.currAlternateContact)
      ) {
        updatedErrors.currAlternateContact =
          "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";
      } else {
        delete updatedErrors.currAlternateContact;
      }

      // PEP Declaration
      validateFieldAndSetError(
        "isPep",
        isRequired(guarantor.isPep),
        "PEP status is required",
      );
      if (guarantor.isPep === "yes") {
        validateFieldAndSetError(
          "pepCategory",
          isRequired(guarantor.pepCategory),
          "PEP category is required",
        );
        validateFieldAndSetError(
          "pepSubCategory",
          isRequired(guarantor.pepSubCategory),
          "PEP sub-category is required",
        );
        validateFieldAndSetError(
          "pepUpload",
          !guarantor.pepUpload,
          "Identification proof is required",
        );
      } else {
        delete updatedErrors.pepCategory;
        delete updatedErrors.pepSubCategory;
        delete updatedErrors.pepUpload;
      }

      if (guarantor.isPep === "no") {
        validateFieldAndSetError(
          "relatedToPep",
          isRequired(guarantor.relatedToPep),
          "Please indicate if related to a PEP",
        );
        if (guarantor.relatedToPep === "yes") {
          (guarantor.relatedPeps || []).forEach((pep: any, pepIdx: number) => {
            validateFieldAndSetError(
              `relatedPeps.${pepIdx}.relationship`,
              isRequired(pep.relationship),
              "Relationship is required",
            );
            validateFieldAndSetError(
              `relatedPeps.${pepIdx}.identificationNo`,
              isRequired(pep.identificationNo),
              "Identification number is required",
            );
            if (pep.identificationNo && !isValidCID(pep.identificationNo)) {
              updatedErrors[`relatedPeps.${pepIdx}.identificationNo`] =
                "Must be 11 digits";
            } else if (!isRequired(pep.identificationNo)) {
              delete updatedErrors[`relatedPeps.${pepIdx}.identificationNo`];
            }
            validateFieldAndSetError(
              `relatedPeps.${pepIdx}.category`,
              isRequired(pep.category),
              "PEP category is required",
            );
            validateFieldAndSetError(
              `relatedPeps.${pepIdx}.subCategory`,
              isRequired(pep.subCategory),
              "PEP sub-category is required",
            );
            validateFieldAndSetError(
              `relatedPeps.${pepIdx}.identificationProof`,
              !pep.identificationProof,
              "Identification proof is required",
            );
          });
        } else {
          Object.keys(updatedErrors).forEach((key) => {
            if (key.startsWith("relatedPeps.")) {
              delete updatedErrors[key];
            }
          });
        }
      } else {
        delete updatedErrors.relatedToPep;
        Object.keys(updatedErrors).forEach((key) => {
          if (key.startsWith("relatedPeps.")) {
            delete updatedErrors[key];
          }
        });
      }

      // Repayment Source
      validateFieldAndSetError(
        "repaymentSourceType",
        isRequired(guarantor.repaymentSourceType),
        "Repayment source type is required",
      );
      validateFieldAndSetError(
        "amount",
        isRequired(guarantor.amount),
        "Amount is required",
      );
      validateFieldAndSetError(
        "proofFile",
        !guarantor.proofFile,
        "Proof file is required",
      );

      validateFieldAndSetError(
        "employmentStatus",
        isRequired(guarantor.employmentStatus),
        "Employment status is required",
      );

      if (guarantor.employmentStatus === "employed") {
        validateFieldAndSetError(
          "employeeId",
          isRequired(guarantor.employeeId),
          "employeeId is required",
        );
        validateFieldAndSetError(
          "occupation",
          isRequired(guarantor.occupation),
          "occupation is required",
        );
        validateFieldAndSetError(
          "employerType",
          isRequired(guarantor.employerType),
          "employerType is required",
        );
        validateFieldAndSetError(
          "designation",
          isRequired(guarantor.designation),
          "designation is required",
        );
        validateFieldAndSetError(
          "grade",
          isRequired(guarantor.grade),
          "grade is required",
        );
        validateFieldAndSetError(
          "organizationName",
          isRequired(guarantor.organizationName),
          "organizationName is required",
        );
        validateFieldAndSetError(
          "orgLocation",
          isRequired(guarantor.orgLocation),
          "orgLocation is required",
        );
        validateFieldAndSetError(
          "joiningDate",
          isRequired(guarantor.joiningDate),
          "joiningDate is required",
        );
        validateFieldAndSetError(
          "annualSalary",
          isRequired(guarantor.annualSalary),
          "annualSalary is required",
        );
        validateFieldAndSetError(
          "serviceNature",
          isRequired(guarantor.serviceNature),
          "serviceNature is required",
        );
        if (guarantor.serviceNature === "contract") {
          validateFieldAndSetError(
            "contractEndDate",
            isRequired(guarantor.contractEndDate),
            "contractEndDate is required",
          );
        } else {
          delete updatedErrors.contractEndDate;
        }
      } else {
        const employmentFields = [
          "employeeId",
          "occupation",
          "employerType",
          "designation",
          "grade",
          "organizationName",
          "orgLocation",
          "joiningDate",
          "annualSalary",
          "serviceNature",
          "contractEndDate",
        ];
        employmentFields.forEach((f) => delete updatedErrors[f]);
      }

      if (Object.keys(updatedErrors).length > 0) {
        isValid = false;
        updatedGuarantors[index] = {
          ...updatedGuarantors[index],
          errors: updatedErrors,
        };
      } else {
        updatedGuarantors[index] = {
          ...updatedGuarantors[index],
          errors: {},
        };
      }
    });

    setGuarantors(updatedGuarantors);
    return isValid;
  };

  const scrollToFirstError = () => {
    // Small delay to ensure state updates & UI renders error borders
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
    if (!businessIncomeData.proofFile) {
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

      const guarantorsValid = validateAllGuarantors();
      if (!guarantorsValid) {
        isValid = false;
      }
    }

    if (!isValid) {
      alert("Please fix the errors highlighted in red before proceeding.");
      scrollToFirstError();
      return;
    }

    const dataToSave = {
      businessIncome: businessIncomeData,
      isGuarantorApplicable,
      guarantors: isGuarantorApplicable === "Yes" ? guarantors : [],
    };

    const existingData = sessionStorage.getItem("businessLoanApplicationData");
    const allData = existingData ? JSON.parse(existingData) : {};
    const updatedData = { ...allData, ...dataToSave };

    sessionStorage.setItem(
      "businessLoanApplicationData",
      JSON.stringify(updatedData),
    );

    onNext(dataToSave);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
              Upload Repayment Proof <span className="text-red-500">*</span>
            </Label>
            <div
              className={fileUploadStyle(!!businessErrors.proofFile)}
              onClick={() =>
                document.getElementById("business-income-proof")?.click()
              }
            >
              <span className="text-gray-500 truncate">
                {businessIncomeData.proofFileName || "No file chosen"}
              </span>
              <Upload className="h-4 w-4 text-[#003DA5]" />
            </div>
            <input
              id="business-income-proof"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleBusinessIncomeFileChange}
              className="hidden"
            />
            {businessErrors.proofFile && (
              <p className="text-xs text-red-500 mt-1">
                {businessErrors.proofFile}
              </p>
            )}
          </div>
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
                            {identificationTypeOptions.map((opt, i) => (
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
                        <div
                          className={fileUploadStyle(!!errors.familyTree)}
                          onClick={() =>
                            document
                              .getElementById(`familyTree-${index}`)
                              ?.click()
                          }
                        >
                          <span className="text-gray-500 truncate">
                            {guarantor.familyTree || "No file chosen"}
                          </span>
                          <Upload className="h-4 w-4 text-[#003DA5]" />
                        </div>
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
                        {errors.familyTree && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.familyTree}
                          </p>
                        )}
                      </div>
                    </div>

                    {isMarried && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                        <h5 className="font-semibold text-gray-700 mb-4">
                          Spouse Information
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                              Spouse CID No.{" "}
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
                            />
                            {errors.spouseCid && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.spouseCid}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                              Spouse Contact{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <RestrictedInput
                              allowed="numeric"
                              maxLength={8}
                              value={guarantor.spouseContact || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "spouseContact",
                                  e.target.value,
                                )
                              }
                              onBlur={(e) =>
                                handleBlurField(
                                  index,
                                  "spouseContact",
                                  e.target.value,
                                )
                              }
                              className={getFieldStyle(!!errors.spouseContact)}
                            />
                            {errors.spouseContact && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.spouseContact}
                              </p>
                            )}
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
                          Passport Size Photo
                        </Label>
                        <div
                          className={fileUploadStyle(!!errors.passportPhoto)}
                          onClick={() =>
                            document
                              .getElementById(`passport-${index}`)
                              ?.click()
                          }
                        >
                          <span className="text-gray-500 truncate">
                            {guarantor.passportPhoto || "No file chosen"}
                          </span>
                          <Upload className="h-4 w-4 text-[#003DA5]" />
                        </div>
                        <input
                          id={`passport-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileChange(
                              index,
                              "passportPhoto",
                              e.target.files?.[0] || null,
                            )
                          }
                          className="hidden"
                        />
                        {errors.passportPhoto && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.passportPhoto}
                          </p>
                        )}
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
                        <div
                          className={fileUploadStyle(!!errors.proofFile)}
                          onClick={() =>
                            document
                              .getElementById(`guarantor-proof-${index}`)
                              ?.click()
                          }
                        >
                          <span className="text-gray-500 truncate">
                            {guarantor.proofFileName || "No file chosen"}
                          </span>
                          <Upload className="h-4 w-4 text-[#003DA5]" />
                        </div>
                        <input
                          id={`guarantor-proof-${index}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleGuarantorProofChange(index, e)}
                          className="hidden"
                        />
                        {errors.proofFile && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.proofFile}
                          </p>
                        )}
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
                              Thram No.
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
                              House No.
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
                            <div
                              className={fileUploadStyle(
                                !!errors.permAddressProof,
                              )}
                              onClick={() =>
                                document
                                  .getElementById(`perm-proof-${index}`)
                                  ?.click()
                              }
                            >
                              <span className="text-gray-500 truncate">
                                {guarantor.permAddressProof || "No file chosen"}
                              </span>
                              <Upload className="h-4 w-4 text-[#003DA5]" />
                            </div>
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
                            {errors.permAddressProof && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.permAddressProof}
                              </p>
                            )}
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

                      <div>
                        <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                          House/Building/Flat No.
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
                            handleBlurField(index, "currHouse", e.target.value)
                          }
                          className={getFieldStyle(!!errors.currHouse)}
                        />
                        {errors.currHouse && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.currHouse}
                          </p>
                        )}
                      </div>

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
                          <div
                            className={fileUploadStyle(
                              !!errors.currAddressProof,
                            )}
                            onClick={() =>
                              document
                                .getElementById(`curr-proof-${index}`)
                                ?.click()
                            }
                          >
                            <span className="text-gray-500 truncate">
                              {guarantor.currAddressProof || "No file chosen"}
                            </span>
                            <Upload className="h-4 w-4 text-[#003DA5]" />
                          </div>
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
                          {errors.currAddressProof && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.currAddressProof}
                            </p>
                          )}
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
                            <div
                              className={fileUploadStyle(!!errors.pepUpload)}
                              onClick={() =>
                                document
                                  .getElementById(`pep-self-${index}`)
                                  ?.click()
                              }
                            >
                              <span className="text-gray-500 truncate">
                                {guarantor.pepUpload || "No file chosen"}
                              </span>
                              <Upload className="h-4 w-4 text-[#003DA5]" />
                            </div>
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
                            {errors.pepUpload && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.pepUpload}
                              </p>
                            )}
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
                              (pep: any, pIndex: number) => (
                                <div
                                  key={pIndex}
                                  className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative"
                                >
                                  <div className="flex justify-between items-center mb-3">
                                    <h5 className="font-semibold text-sm text-gray-600">
                                      Related PEP #{pIndex + 1}
                                    </h5>
                                    {guarantor.relatedPeps.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleRemoveRelatedPep(index, pIndex)
                                        }
                                        className="h-8 text-red-500"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                      <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                        Relationship
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
                                        ID Number
                                      </Label>
                                      <RestrictedInput
                                        allowed="numeric"
                                        maxLength={11}
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

                                    <div className="space-y-2">
                                      <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                                        Category
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
                                          {pepCategoryOptions.map((opt, i) => (
                                            <SelectItem
                                              key={i}
                                              value={String(
                                                opt.pep_category_pk_code ||
                                                  opt.id,
                                              )}
                                            >
                                              {opt.pep_category || opt.name}
                                            </SelectItem>
                                          ))}
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
                                        Sub Category
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
                                              {opt.pep_sub_category || opt.name}
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
                                        Upload ID Proof
                                      </Label>
                                      <div
                                        className={fileUploadStyle(
                                          !!errors[
                                            `relatedPeps.${pIndex}.identificationProof`
                                          ],
                                        )}
                                        onClick={() =>
                                          document
                                            .getElementById(
                                              `pep-related-proof-${index}-${pIndex}`,
                                            )
                                            ?.click()
                                        }
                                      >
                                        <span className="text-gray-500 truncate">
                                          {pep.identificationProof ||
                                            "No file chosen"}
                                        </span>
                                        <Upload className="h-4 w-4 text-[#003DA5]" />
                                      </div>
                                      <input
                                        id={`pep-related-proof-${index}-${pIndex}`}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) =>
                                          handleRelatedPepFileChange(
                                            index,
                                            pIndex,
                                            e.target.files?.[0] || null,
                                          )
                                        }
                                        className="hidden"
                                      />
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
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleAddRelatedPep(index)}
                              className="h-12 border-dashed border-gray-400 text-[#003DA5] hover:bg-blue-50 w-full"
                            >
                              <Plus className="w-4 h-4 mr-2" /> Add Related
                              Person
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
                      <RadioGroup
                        value={guarantor.employmentStatus}
                        onValueChange={(value) =>
                          updateGuarantorField(index, "employmentStatus", value)
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
                      {errors.employmentStatus && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.employmentStatus}
                        </p>
                      )}
                    </div>

                    {guarantor.employmentStatus === "employed" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Corrected fields with Red Asterisks to match validation */}
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
                              {occupationOptions.map((option, i) => (
                                <SelectItem
                                  key={i}
                                  value={String(
                                    option.occ_pk_code || option.id || i,
                                  )}
                                >
                                  {option.occ_name || option.name}
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
                              {/* Numeric grades 1-20 + P1-P5 */}
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
                            Organization <span className="text-red-500">*</span>
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
                              {organizationOptions.map((option, i) => (
                                <SelectItem
                                  key={i}
                                  value={String(
                                    option.lgal_constitution_pk_code ||
                                      option.id ||
                                      i,
                                  )}
                                >
                                  {option.lgal_constitution || option.name}
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
                          />
                          {errors.orgLocation && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.orgLocation}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-800 font-semibold text-sm mb-2 block">
                            Joining Date <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="date"
                            max={today}
                            value={guarantor.joiningDate || ""}
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
                            Annual Salary{" "}
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
                              value={guarantor.contractEndDate || ""}
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
