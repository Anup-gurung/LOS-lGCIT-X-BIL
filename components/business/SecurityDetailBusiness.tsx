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
import { Trash2, PlusCircle, Upload } from "lucide-react";

// Import mapping utility and the Popup component
import { mapCustomerDataToForm } from "@/lib/mapCustomerData";
import DocumentPopup from "@/components/BILSearchStatus";
import {
  fetchNationality,
  fetchIdentificationType,
  fetchCountry,
  fetchDzongkhag,
  fetchGewogsByDzongkhag,
  fetchMaritalStatus,
  fetchBanks,
  fetchPepCategory,
  fetchOccupations,
  fetchLegalConstitution,
  fetchPepSubCategoryByCategory,
} from "@/services/api";

// ================== Validation Helpers ==================
const isRequired = (value: any) => !value || value.toString().trim() === "";
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidCID = (value: string) => /^\d{11}$/.test(value);
const isValidTPN = (value: string) => /^\d{11}$/.test(value);
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

// Helper to format dates to YYYY-MM-DD
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

// Initialize empty related PEP entry
const createEmptyRelatedPep = () => ({
  relationship: "",
  identificationNo: "",
  category: "",
  subCategory: "",
  identificationProof: "",
});

// Initialize empty security entry
const createEmptySecurity = () => ({
  securityType: "",
  ownershipType: "",
  vehicleType: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  registrationNo: "",
  chassisNo: "",
  engineNo: "",
  thramNo: "",
  plotNo: "",
  area: "",
  landUse: "",
  dzongkhag: "",
  gewog: "",
  village: "",
  houseNo: "",
  insuranceCompany: "",
  policyNo: "",
  insuranceValue: "",
  insuranceStartDate: "",
  insuranceExpiryDate: "",
  ppfInstitution: "",
  ppfFundNo: "",
  ppfAccountNo: "",
  ppfValue: "",
  shareCompany: "",
  shareCertificateNo: "",
  shareRegistrationNo: "",
  stockName: "",
  stockQuantity: "",
  stockValue: "",
  equipmentType: "",
  equipmentMake: "",
  equipmentModel: "",
  equipmentSerialNo: "",
  equipmentValue: "",
  fdBank: "",
  fdAccountNo: "",
  fdAmount: "",
  fdMaturityDate: "",
  buildingType: "",
  buildingArea: "",
  buildingYear: "",
  securityProof: "",
  gewogOptions: [] as any[],
});

// Initialize empty guarantor
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
  bankName: "",
  bankAccount: "",
  passportPhoto: "",
  permCountry: "",
  permDzongkhag: "",
  permGewog: "",
  permVillage: "",
  permThram: "",
  permHouse: "",
  permAddressProof: "",
  currCountry: "",
  currDzongkhag: "",
  currGewog: "",
  currVillage: "",
  currHouse: "",
  email: "",
  contact: "",
  currAlternateContact: "",
  currAddressProof: "",
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
  isPep: "",
  pepCategory: "",
  pepSubCategory: "",
  pepUpload: "",
  relatedToPep: "",
  relatedPeps: [createEmptyRelatedPep()],
  showLookupPopup: false,
  lookupStatus: "searching" as "searching" | "found" | "not_found",
  fetchedCustomerData: null,
  errors: {} as Record<string, string>,
  permGewogOptions: [] as any[],
  currGewogOptions: [] as any[],
  pepSubCategoryOptions: [] as any[],
  relatedPepOptionsMap: {} as Record<number, any[]>,
});

interface SecurityDetailsFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
  formData: any;
}

export function SecurityDetailBusiness({
  onNext,
  onBack,
  formData,
}: SecurityDetailsFormProps) {
  const [securities, setSecurities] = useState<any[]>([createEmptySecurity()]);
  const [guarantors, setGuarantors] = useState<any[]>([createEmptyGuarantor()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<
    any[]
  >([]);
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([]);
  const [banksOptions, setBanksOptions] = useState<any[]>([]);
  const [pepCategoryOptions, setPepCategoryOptions] = useState<any[]>([]);
  const [occupationOptions, setOccupationOptions] = useState<any[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<any[]>([]);

  const today = new Date().toISOString().split("T")[0];
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
  const maxDobDate = eighteenYearsAgo.toISOString().split("T")[0];

  const getIsMarried = (guarantor: any) => {
    const status = guarantor.maritalStatus;
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

  // --- DATA FETCHING ---
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [
          nationality,
          identificationType,
          country,
          dzongkhag,
          maritalStatus,
          banks,
          pepCategories,
          occupations,
          organizations,
        ] = await Promise.all([
          fetchNationality().catch(() => []),
          fetchIdentificationType().catch(() => []),
          fetchCountry().catch(() => []),
          fetchDzongkhag().catch(() => []),
          fetchMaritalStatus().catch(() => []),
          fetchBanks().catch(() => []),
          fetchPepCategory().catch(() => []),
          fetchOccupations().catch(() => []),
          fetchLegalConstitution().catch(() => []),
        ]);

        setNationalityOptions(nationality);
        setIdentificationTypeOptions(identificationType);
        setCountryOptions(country);
        setDzongkhagOptions(dzongkhag);
        setMaritalStatusOptions(maritalStatus);
        setBanksOptions(banks);
        setPepCategoryOptions(pepCategories || []);
        setOccupationOptions(occupations || []);
        setOrganizationOptions(organizations || []);
      } catch (error) {
        console.error("Failed to load dropdown data:", error);
      }
    };

    loadAllData();
  }, []);

  // Sync with formData
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      if (formData.securityDetails) {
        if (Array.isArray(formData.securityDetails)) {
          setSecurities(formData.securityDetails);
        } else if (typeof formData.securityDetails === "object") {
          setSecurities([
            { ...createEmptySecurity(), ...formData.securityDetails },
          ]);
        }
      }
      if (
        formData.additionalGuarantors &&
        Array.isArray(formData.additionalGuarantors)
      ) {
        setGuarantors(formData.additionalGuarantors);
      }
    }
  }, [formData]);

  // --- EFFECT: Load Gewogs for EACH Security Row Independently ---
  useEffect(() => {
    const loadSecurityGewogs = async () => {
      const updatedSecurities = [...securities];
      let needsUpdate = false;

      for (let i = 0; i < securities.length; i++) {
        const security = securities[i];
        if (
          (security.securityType === "land" ||
            security.securityType === "building") &&
          security.dzongkhag
        ) {
          if (!security.gewogOptions || security.gewogOptions.length === 0) {
            try {
              const options = await fetchGewogsByDzongkhag(security.dzongkhag);
              updatedSecurities[i] = {
                ...updatedSecurities[i],
                gewogOptions: options,
              };
              needsUpdate = true;
            } catch (error) {
              console.error(
                `Failed to load property gewogs for security ${i}:`,
                error,
              );
            }
          }
        }
      }

      if (needsUpdate) {
        setSecurities(updatedSecurities);
      }
    };
    loadSecurityGewogs();
  }, [securities.map((s) => s.dzongkhag).join(",")]);

  // Load permanent gewogs for all guarantors
  useEffect(() => {
    const loadPermGewogs = async () => {
      const updatedGuarantors = [...guarantors];
      let needsUpdate = false;

      for (let i = 0; i < guarantors.length; i++) {
        const guarantor = guarantors[i];
        if (guarantor.permDzongkhag) {
          try {
            const options = await fetchGewogsByDzongkhag(
              guarantor.permDzongkhag,
            );
            updatedGuarantors[i] = {
              ...updatedGuarantors[i],
              permGewogOptions: options,
            };
            needsUpdate = true;
          } catch (error) {
            console.error(
              `Failed to load permanent gewogs for guarantor ${i}:`,
              error,
            );
            updatedGuarantors[i] = {
              ...updatedGuarantors[i],
              permGewogOptions: [],
            };
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        setGuarantors(updatedGuarantors);
      }
    };
    loadPermGewogs();
  }, [guarantors.map((g) => g.permDzongkhag).join(",")]);

  // Load current gewogs for all guarantors
  useEffect(() => {
    const loadCurrGewogs = async () => {
      const updatedGuarantors = [...guarantors];
      let needsUpdate = false;

      for (let i = 0; i < guarantors.length; i++) {
        const guarantor = guarantors[i];
        if (guarantor.currDzongkhag) {
          try {
            const options = await fetchGewogsByDzongkhag(
              guarantor.currDzongkhag,
            );
            updatedGuarantors[i] = {
              ...updatedGuarantors[i],
              currGewogOptions: options,
            };
            needsUpdate = true;
          } catch (error) {
            console.error(
              `Failed to load current gewogs for guarantor ${i}:`,
              error,
            );
            updatedGuarantors[i] = {
              ...updatedGuarantors[i],
              currGewogOptions: [],
            };
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        setGuarantors(updatedGuarantors);
      }
    };
    loadCurrGewogs();
  }, [guarantors.map((g) => g.currDzongkhag).join(",")]);

  // Load PEP sub-categories for SELF PEP
  useEffect(() => {
    const loadPepSubCategories = async () => {
      const updatedGuarantors = [...guarantors];
      let needsUpdate = false;

      for (let i = 0; i < guarantors.length; i++) {
        const guarantor = guarantors[i];
        if (guarantor.isPep === "yes" && guarantor.pepCategory) {
          try {
            const options = await fetchPepSubCategoryByCategory(
              guarantor.pepCategory,
            );
            updatedGuarantors[i] = {
              ...updatedGuarantors[i],
              pepSubCategoryOptions: options,
            };
            needsUpdate = true;
          } catch (error) {
            console.error(
              `Failed to load PEP sub-categories for guarantor ${i}:`,
              error,
            );
            updatedGuarantors[i] = {
              ...updatedGuarantors[i],
              pepSubCategoryOptions: [],
            };
            needsUpdate = true;
          }
        } else {
          updatedGuarantors[i] = {
            ...updatedGuarantors[i],
            pepSubCategoryOptions: [],
          };
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        setGuarantors(updatedGuarantors);
      }
    };
    loadPepSubCategories();
  }, [guarantors.map((g) => `${g.isPep}-${g.pepCategory}`).join(",")]);

  // --- LABEL-TO-ID HELPER (for lookup) ---
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
              option.occ_pk_code ||
              option.occupation_pk_code ||
              option.dzongkhag_pk_code ||
              option.gewog_pk_code ||
              option.curr_gewog_pk_code ||
              option.pk_gewog_id ||
              option.pep_category_pk_code ||
              option.pep_sub_category_pk_code ||
              option.lgal_constitution_pk_code ||
              option.legal_const_pk_code ||
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
              option.occ_pk_code ||
              option.occupation_pk_code ||
              option.dzongkhag_pk_code ||
              option.gewog_pk_code ||
              option.curr_gewog_pk_code ||
              option.pk_gewog_id ||
              option.pep_category_pk_code ||
              option.pep_sub_category_pk_code ||
              option.lgal_constitution_pk_code ||
              option.legal_const_pk_code ||
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
                option.occ_pk_code ||
                option.occupation_pk_code ||
                option.dzongkhag_pk_code ||
                option.gewog_pk_code ||
                option.curr_gewog_pk_code ||
                option.pk_gewog_id ||
                option.pep_category_pk_code ||
                option.pep_sub_category_pk_code ||
                option.lgal_constitution_pk_code ||
                option.legal_const_pk_code ||
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
                option.occ_pk_code ||
                option.occupation_pk_code ||
                option.dzongkhag_pk_code ||
                option.gewog_pk_code ||
                option.curr_gewog_pk_code ||
                option.pk_gewog_id ||
                option.pep_category_pk_code ||
                option.pep_sub_category_pk_code ||
                option.lgal_constitution_pk_code ||
                option.legal_const_pk_code ||
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

  // --- FIELD VALIDATION (individual) ---
  const validateField = (
    fieldName: string,
    value: any,
    fullData?: any,
  ): string => {
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
    const errorMsg = validateField(field, value);
    if (errorMsg) {
      setGuarantors((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          errors: { ...updated[index].errors, [field]: errorMsg },
        };
        return updated;
      });
    }
  };

  // --- FILE UPLOAD HANDLERS ---
  const handleFileChange = (
    index: number | "main",
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
        const errorMsg = "Only PDF, JPG, JPEG, and PNG files are allowed";
        if (index === "main") {
          setErrors((prev) => ({ ...prev, [fieldName]: errorMsg }));
        } else {
          setGuarantors((prev) => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              errors: { ...updated[index].errors, [fieldName]: errorMsg },
            };
            return updated;
          });
        }
        return;
      }

      if (file.size > maxSize) {
        const errorMsg = "File size must be less than 5MB";
        if (index === "main") {
          setErrors((prev) => ({ ...prev, [fieldName]: errorMsg }));
        } else {
          setGuarantors((prev) => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              errors: { ...updated[index].errors, [fieldName]: errorMsg },
            };
            return updated;
          });
        }
        return;
      }

      if (index === "main") {
        setErrors((prev) => ({ ...prev, [fieldName]: "" }));
      } else {
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
    }
  };

  const handleSecurityFileChange = (index: number, file: File | null) => {
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      const maxSize = 5 * 1024 * 1024;

      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          [`security-${index}-proof`]:
            "Only PDF, JPG, JPEG, and PNG files are allowed",
        }));
        return;
      }

      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          [`security-${index}-proof`]: "File size must be less than 5MB",
        }));
        return;
      }

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`security-${index}-proof`];
        return newErrors;
      });

      updateSecurityField(index, "securityProof", file.name);
    }
  };

  // --- IDENTITY CHECK LOGIC ---
  const handleIdentityCheck = async (index: number) => {
    const guarantor = guarantors[index];
    const idType = guarantor.idType;
    const idNo = guarantor.idNumber;

    if (!idType) {
      setGuarantors((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          errors: {
            ...updated[index].errors,
            idType: "Please select identification type first",
          },
        };
        return updated;
      });
      return;
    }

    if (!idNo || idNo.trim() === "") {
      setGuarantors((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          errors: {
            ...updated[index].errors,
            idNumber: "Please enter identification number",
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
        showLookupPopup: true,
        lookupStatus: "searching",
        errors: {
          ...updated[index].errors,
          idType: "",
          idNumber: "",
        },
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
      const api = guarantor.fetchedCustomerData;

      // --- 1. PRE-CALCULATE IDs FROM LABELS ---
      const mappedNationality = findPkCodeByLabel(
        api.nationality,
        nationalityOptions,
        ["nationality", "name", "label"],
      );

      const mappedMaritalStatus = findPkCodeByLabel(
        api.maritalStatus,
        maritalStatusOptions,
        ["marital_status", "name", "label"],
      );

      const mappedBankName = findPkCodeByLabel(api.bankName, banksOptions, [
        "bank_name",
        "name",
        "label",
        "bank",
      ]);

      const mappedPermCountry = findPkCodeByLabel(
        api.permCountry || api.permanentCountry,
        countryOptions,
        ["country_name", "country", "name", "label"],
      );

      const mappedCurrCountry = findPkCodeByLabel(
        api.currCountry || api.currentCountry,
        countryOptions,
        ["country_name", "country", "name", "label"],
      );

      const isPermBhutan =
        mappedPermCountry &&
        countryOptions.some(
          (c) =>
            String(c.country_pk_code || c.id) === mappedPermCountry &&
            (c.country_name || c.country || "")
              .toLowerCase()
              .includes("bhutan"),
        );

      const isCurrBhutan =
        mappedCurrCountry &&
        countryOptions.some(
          (c) =>
            String(c.country_pk_code || c.id) === mappedCurrCountry &&
            (c.country_name || c.country || "")
              .toLowerCase()
              .includes("bhutan"),
        );

      let mappedPermDzongkhag = api.permDzongkhag || api.permanentDzongkhag;
      let mappedCurrDzongkhag = api.currDzongkhag || api.currentDzongkhag;

      if (isPermBhutan) {
        mappedPermDzongkhag = findPkCodeByLabel(
          mappedPermDzongkhag,
          dzongkhagOptions,
          ["dzongkhag_name", "dzongkhag", "name", "label"],
        );
      }
      if (isCurrBhutan) {
        mappedCurrDzongkhag = findPkCodeByLabel(
          mappedCurrDzongkhag,
          dzongkhagOptions,
          ["dzongkhag_name", "dzongkhag", "name", "label"],
        );
      }

      const rawPermGewog = api.permGewog || api.permanentGewog || "";
      const rawCurrGewog = api.currGewog || api.currentGewog || "";

      // --- MAP OCCUPATION AND ORGANIZATION (with expanded field list) ---
      const mappedOccupation = findPkCodeByLabel(
        api.occupation,
        occupationOptions,
        ["occ_name", "occupation", "name", "occupation_name"],
      );

      const mappedOrganization = findPkCodeByLabel(
        api.organizationName || api.employerName,
        organizationOptions,
        ["lgal_constitution", "legal_const_name", "name", "constitution_name"],
      );

      // --- INFER EMPLOYMENT STATUS & TYPE ---
      let inferredEmploymentStatus = "unemployed";
      const hasOccupation =
        api.occupation && api.occupation.toLowerCase() !== "na";
      const hasEmployeeId =
        api.employeeId && api.employeeId.toLowerCase() !== "na";
      const hasEmployer =
        api.employerName && api.employerName.toLowerCase() !== "na";
      const hasAnnualSalary = parseFloat(api.annualSalary) > 0;

      if (hasOccupation || hasEmployeeId || hasEmployer || hasAnnualSalary) {
        inferredEmploymentStatus = "employed";
      }

      let inferredEmployerType = "";
      const rawOrgType = (api.organizationType || "").toLowerCase();
      if (
        rawOrgType.includes("government") ||
        rawOrgType.includes("ministry")
      ) {
        inferredEmployerType = "government";
      } else if (
        rawOrgType.includes("financial") ||
        rawOrgType.includes("corporate") ||
        rawOrgType.includes("limited")
      ) {
        inferredEmployerType = "corporate";
      } else if (rawOrgType.includes("private")) {
        inferredEmployerType = "private";
      } else if (inferredEmploymentStatus === "employed") {
        inferredEmployerType = "private";
      }

      const mappedDesignation = (api.designation || "").toLowerCase();
      const mappedGrade = api.grade ? String(api.grade) : "";
      const mappedServiceNature = (
        api.natureOfService ||
        api.serviceNature ||
        ""
      ).toLowerCase();

      // --- PEP FIELDS ---
      let mappedPepPerson = "";
      if (api.pepPerson === "yes" || api.pepPerson === "no") {
        mappedPepPerson = api.pepPerson;
      } else if (api.pepDeclaration === "yes" || api.pepDeclaration === "no") {
        mappedPepPerson = api.pepDeclaration;
      }

      const mappedPepCategory = findPkCodeByLabel(
        api.pepCategory,
        pepCategoryOptions,
        ["pep_category", "name", "label"],
      );

      let mappedPepRelated = "";
      if (api.relatedToAnyPep === "yes" || api.relatedToAnyPep === "no") {
        mappedPepRelated = api.relatedToAnyPep;
      } else if (api.pepRelated === "yes" || api.pepRelated === "no") {
        mappedPepRelated = api.pepRelated;
      }

      // --- BUILD BASE GUARANTOR OBJECT ---
      const baseGuarantor = {
        ...guarantor,
        salutation: api.salutation || guarantor.salutation,
        guarantorName:
          api.fullName || api.applicantName || guarantor.guarantorName,
        nationality: mappedNationality || guarantor.nationality,
        gender: api.gender || guarantor.gender,
        idIssueDate:
          formatDateForInput(api.identificationIssueDate) ||
          guarantor.idIssueDate,
        idExpiryDate:
          formatDateForInput(api.identificationExpiryDate) ||
          guarantor.idExpiryDate,
        dateOfBirth:
          formatDateForInput(api.dateOfBirth) || guarantor.dateOfBirth,
        tpnNo: api.tpn || api.tpnNumber || guarantor.tpnNo,
        maritalStatus: mappedMaritalStatus || guarantor.maritalStatus,
        spouseCid: api.spouseCid || guarantor.spouseCid,
        spouseName: api.spouseName || guarantor.spouseName,
        spouseContact: api.spouseContact || guarantor.spouseContact,
        bankName: mappedBankName || guarantor.bankName,
        bankAccount:
          api.bankAccount || api.bankAccountNo || guarantor.bankAccount,
        permCountry: mappedPermCountry || guarantor.permCountry,
        permDzongkhag: mappedPermDzongkhag || guarantor.permDzongkhag,
        permGewog: rawPermGewog,
        permVillage:
          api.permVillage || api.permanentStreet || guarantor.permVillage,
        permThram: api.permThram || api.thramNo || guarantor.permThram,
        permHouse: api.permHouse || api.houseNo || guarantor.permHouse,
        currCountry: mappedCurrCountry || guarantor.currCountry,
        currDzongkhag: mappedCurrDzongkhag || guarantor.currDzongkhag,
        currGewog: rawCurrGewog,
        currVillage:
          api.currVillage || api.currentStreet || guarantor.currVillage,
        currHouse:
          api.currFlat ||
          api.currHouse ||
          api.currentBuildingNo ||
          guarantor.currHouse,
        email: api.email || api.emailId || guarantor.email,
        contact: api.contactNo || api.phone || guarantor.contact,
        currAlternateContact:
          api.alternateContactNo ||
          api.alternatePhone ||
          guarantor.currAlternateContact,
        employmentStatus:
          inferredEmploymentStatus || guarantor.employmentStatus,
        employeeId: api.employeeId || guarantor.employeeId,
        occupation: mappedOccupation || guarantor.occupation,
        employerType: inferredEmployerType || guarantor.employerType,
        designation: mappedDesignation || guarantor.designation,
        grade: mappedGrade || guarantor.grade,
        organizationName: mappedOrganization || guarantor.organizationName,
        orgLocation:
          api.orgLocation || api.employerLocation || guarantor.orgLocation,
        joiningDate:
          formatDateForInput(api.joiningDate || api.appointmentDate) ||
          guarantor.joiningDate,
        annualSalary:
          api.annualSalary || api.annualIncome || guarantor.annualSalary,
        serviceNature: mappedServiceNature || guarantor.serviceNature,
        contractEndDate:
          formatDateForInput(api.contractEndDate) || guarantor.contractEndDate,
        isPep: mappedPepPerson || guarantor.isPep,
        pepCategory: mappedPepCategory || guarantor.pepCategory,
        relatedToPep: mappedPepRelated || guarantor.relatedToPep,
      };

      // --- FETCH GEWOG OPTIONS AND MAP GEWOG NAMES TO IDs ---
      let permGewogOptions: any[] = [];
      let currGewogOptions: any[] = [];
      let mappedPermGewog = rawPermGewog;
      let mappedCurrGewog = rawCurrGewog;

      if (isPermBhutan && mappedPermDzongkhag) {
        try {
          permGewogOptions = await fetchGewogsByDzongkhag(mappedPermDzongkhag);
          if (rawPermGewog) {
            const converted = findPkCodeByLabel(
              rawPermGewog,
              permGewogOptions,
              ["gewog_name", "gewog", "name", "label"],
            );
            if (converted && converted !== rawPermGewog) {
              mappedPermGewog = converted;
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
                mappedPermGewog = String(
                  matched.gewog_pk_code || matched.id || matched.pk_gewog_id,
                );
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch permanent gewog options", e);
        }
      }

      if (isCurrBhutan && mappedCurrDzongkhag) {
        try {
          currGewogOptions = await fetchGewogsByDzongkhag(mappedCurrDzongkhag);
          if (rawCurrGewog) {
            const converted = findPkCodeByLabel(
              rawCurrGewog,
              currGewogOptions,
              ["gewog_name", "gewog", "name", "label"],
            );
            if (converted && converted !== rawCurrGewog) {
              mappedCurrGewog = converted;
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
                mappedCurrGewog = String(
                  matched.gewog_pk_code || matched.id || matched.pk_gewog_id,
                );
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch current gewog options", e);
        }
      }

      const finalGuarantor = {
        ...baseGuarantor,
        permGewog: mappedPermGewog,
        currGewog: mappedCurrGewog,
        permGewogOptions,
        currGewogOptions,
        pepSubCategoryOptions: guarantor.pepSubCategoryOptions,
        relatedPepOptionsMap: guarantor.relatedPepOptionsMap,
        showLookupPopup: false,
        lookupStatus: "searching",
        errors: {},
      };

      setGuarantors((prev) => {
        const updated = [...prev];
        updated[index] = finalGuarantor;
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

  // --- FALLBACK EFFECTS: Convert labels to IDs after options load ---

  // Convert permGewog label to ID when options load
  useEffect(() => {
    guarantors.forEach((guarantor, idx) => {
      if (
        guarantor.permGewog &&
        guarantor.permGewogOptions.length > 0 &&
        !guarantor.permGewogOptions.some(
          (opt: any) =>
            String(
              opt.gewog_pk_code ||
                opt.id ||
                opt.pk_gewog_id ||
                opt.curr_gewog_pk_code,
            ) === String(guarantor.permGewog),
        )
      ) {
        const mapped = findPkCodeByLabel(
          guarantor.permGewog,
          guarantor.permGewogOptions,
          ["gewog_name", "gewog", "name", "label"],
        );
        if (mapped && mapped !== guarantor.permGewog) {
          updateGuarantorField(idx, "permGewog", mapped);
        }
      }
    });
  }, [
    guarantors
      .map((g) => `${g.permGewog}-${g.permGewogOptions.length}`)
      .join(","),
  ]);

  // Convert currGewog label to ID when options load
  useEffect(() => {
    guarantors.forEach((guarantor, idx) => {
      if (
        guarantor.currGewog &&
        guarantor.currGewogOptions.length > 0 &&
        !guarantor.currGewogOptions.some(
          (opt: any) =>
            String(
              opt.gewog_pk_code ||
                opt.id ||
                opt.pk_gewog_id ||
                opt.curr_gewog_pk_code,
            ) === String(guarantor.currGewog),
        )
      ) {
        const mapped = findPkCodeByLabel(
          guarantor.currGewog,
          guarantor.currGewogOptions,
          ["gewog_name", "gewog", "name", "label"],
        );
        if (mapped && mapped !== guarantor.currGewog) {
          updateGuarantorField(idx, "currGewog", mapped);
        }
      }
    });
  }, [
    guarantors
      .map((g) => `${g.currGewog}-${g.currGewogOptions.length}`)
      .join(","),
  ]);

  // Convert pepSubCategory label to ID when options load
  useEffect(() => {
    guarantors.forEach((guarantor, idx) => {
      if (
        guarantor.pepSubCategory &&
        guarantor.pepSubCategoryOptions.length > 0 &&
        !guarantor.pepSubCategoryOptions.some(
          (opt: any) =>
            String(opt.pep_sub_category_pk_code || opt.id) ===
            String(guarantor.pepSubCategory),
        )
      ) {
        const mapped = findPkCodeByLabel(
          guarantor.pepSubCategory,
          guarantor.pepSubCategoryOptions,
          ["pep_sub_category", "name", "label"],
        );
        if (mapped && mapped !== guarantor.pepSubCategory) {
          updateGuarantorField(idx, "pepSubCategory", mapped);
        }
      }
    });
  }, [
    guarantors
      .map((g) => `${g.pepSubCategory}-${g.pepSubCategoryOptions.length}`)
      .join(","),
  ]);

  // --- FALLBACK EFFECTS for Occupation and Organization ---
  // Enhanced: also set employmentStatus to "employed" if occupation becomes valid
  useEffect(() => {
    if (occupationOptions.length > 0) {
      guarantors.forEach((guarantor, idx) => {
        if (
          guarantor.occupation &&
          !occupationOptions.some(
            (opt) =>
              String(opt.occ_pk_code || opt.occupation_pk_code || opt.id) ===
              String(guarantor.occupation),
          )
        ) {
          const mapped = findPkCodeByLabel(
            guarantor.occupation,
            occupationOptions,
            ["occ_name", "occupation", "name", "occupation_name"],
          );
          if (mapped && mapped !== guarantor.occupation) {
            updateGuarantorField(idx, "occupation", mapped);
            // If occupation is now set, ensure employment status is "employed"
            if (guarantor.employmentStatus !== "employed") {
              updateGuarantorField(idx, "employmentStatus", "employed");
            }
          }
        }
      });
    }
  }, [occupationOptions.length, guarantors.map((g) => g.occupation).join(",")]);

  useEffect(() => {
    if (organizationOptions.length > 0) {
      guarantors.forEach((guarantor, idx) => {
        if (
          guarantor.organizationName &&
          !organizationOptions.some(
            (opt) =>
              String(
                opt.lgal_constitution_pk_code ||
                  opt.legal_const_pk_code ||
                  opt.id,
              ) === String(guarantor.organizationName),
          )
        ) {
          const mapped = findPkCodeByLabel(
            guarantor.organizationName,
            organizationOptions,
            [
              "lgal_constitution",
              "legal_const_name",
              "name",
              "constitution_name",
            ],
          );
          if (mapped && mapped !== guarantor.organizationName) {
            updateGuarantorField(idx, "organizationName", mapped);
          }
        }
      });
    }
  }, [
    organizationOptions.length,
    guarantors.map((g) => g.organizationName).join(","),
  ]);

  // --- HANDLERS FOR MULTIPLE PEP DECLARATIONS ---
  const handleAddRelatedPep = (index: number) => {
    setGuarantors((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        relatedPeps: [
          ...(updated[index].relatedPeps || []),
          createEmptyRelatedPep(),
        ],
      };
      return updated;
    });
  };

  const handleRemoveRelatedPep = (guarantorIndex: number, pepIndex: number) => {
    setGuarantors((prev) => {
      const updated = [...prev];
      const updatedPeps = (updated[guarantorIndex].relatedPeps || []).filter(
        (_: any, i: number) => i !== pepIndex,
      );

      const newOptionsMap: Record<number, any[]> = {
        ...updated[guarantorIndex].relatedPepOptionsMap,
      };
      Object.keys(newOptionsMap).forEach((key) => {
        const keyNum = parseInt(key);
        if (keyNum > pepIndex) {
          newOptionsMap[keyNum - 1] = newOptionsMap[keyNum];
          delete newOptionsMap[keyNum];
        }
      });

      updated[guarantorIndex] = {
        ...updated[guarantorIndex],
        relatedPeps: updatedPeps,
        relatedPepOptionsMap: newOptionsMap,
      };
      return updated;
    });
  };

  const handleRelatedPepChange = async (
    guarantorIndex: number,
    pepIndex: number,
    field: string,
    value: string,
  ) => {
    setGuarantors((prev) => {
      const updated = [...prev];
      const updatedPeps = [...(updated[guarantorIndex].relatedPeps || [])];
      if (!updatedPeps[pepIndex]) {
        updatedPeps[pepIndex] = createEmptyRelatedPep();
      }

      updatedPeps[pepIndex] = { ...updatedPeps[pepIndex], [field]: value };

      if (field === "category") {
        updatedPeps[pepIndex].subCategory = "";
        fetchPepSubCategoryByCategory(value)
          .then((options) => {
            setGuarantors((current) => {
              const currentUpdated = [...current];
              currentUpdated[guarantorIndex] = {
                ...currentUpdated[guarantorIndex],
                relatedPepOptionsMap: {
                  ...currentUpdated[guarantorIndex].relatedPepOptionsMap,
                  [pepIndex]: options || [],
                },
              };
              return currentUpdated;
            });
          })
          .catch((e) => {
            console.error("Failed to fetch PEP sub-categories:", e);
            setGuarantors((current) => {
              const currentUpdated = [...current];
              currentUpdated[guarantorIndex] = {
                ...currentUpdated[guarantorIndex],
                relatedPepOptionsMap: {
                  ...currentUpdated[guarantorIndex].relatedPepOptionsMap,
                  [pepIndex]: [],
                },
              };
              return currentUpdated;
            });
          });
      }

      updated[guarantorIndex] = {
        ...updated[guarantorIndex],
        relatedPeps: updatedPeps,
      };
      return updated;
    });
  };

  const handleRelatedPepFileChange = (
    guarantorIndex: number,
    pepIndex: number,
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
        const updatedPeps = [...(updated[guarantorIndex].relatedPeps || [])];
        if (!updatedPeps[pepIndex]) {
          updatedPeps[pepIndex] = createEmptyRelatedPep();
        }

        updatedPeps[pepIndex] = {
          ...updatedPeps[pepIndex],
          identificationProof: file.name,
        };
        updated[guarantorIndex] = {
          ...updated[guarantorIndex],
          relatedPeps: updatedPeps,
        };
        return updated;
      });
    }
  };

  // --- SECURITY HANDLERS ---
  const addSecurity = () => {
    setSecurities([...securities, createEmptySecurity()]);
  };

  const removeSecurity = (index: number) => {
    if (securities.length > 1) {
      setSecurities(securities.filter((_, i) => i !== index));
    }
  };

  const updateSecurityField = (index: number, field: string, value: any) => {
    setSecurities((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      if (field === "dzongkhag") {
        updated[index].gewog = "";
        updated[index].gewogOptions = [];
      }

      return updated;
    });
  };

  // --- GUARANTOR CRUD HANDLERS ---
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
      const currentGuarantor = updated[index];

      let updatedGuarantor = {
        ...currentGuarantor,
        [field]: value,
      };

      if (field === "isPep") {
        if (value === "yes") {
          updatedGuarantor = {
            ...updatedGuarantor,
            relatedToPep: "",
            relatedPeps: [],
          };
        } else if (value === "no") {
          updatedGuarantor = {
            ...updatedGuarantor,
            pepCategory: "",
            pepSubCategory: "",
            pepUpload: "",
          };
        }
      }

      if (field === "relatedToPep") {
        if (value === "yes") {
          if (
            !updatedGuarantor.relatedPeps ||
            updatedGuarantor.relatedPeps.length === 0
          ) {
            updatedGuarantor.relatedPeps = [createEmptyRelatedPep()];
          }
        } else if (value === "no") {
          updatedGuarantor.relatedPeps = [];
        }
      }

      updatedGuarantor.errors = {
        ...updatedGuarantor.errors,
        [field]: "",
      };

      updated[index] = updatedGuarantor;
      return updated;
    });
  };

  // Enhanced validation for all guarantors
  const validateAllGuarantors = (): boolean => {
    let isValid = true;
    const updatedGuarantors = [...guarantors];

    guarantors.forEach((guarantor, index) => {
      const errors: Record<string, string> = {};

      const personalFields = [
        "idType",
        "idNumber",
        "salutation",
        "guarantorName",
        "nationality",
        "gender",
        "idIssueDate",
        "idExpiryDate",
        "dateOfBirth",
        "maritalStatus",
        "bankName",
        "bankAccount",
      ];
      personalFields.forEach((field) => {
        if (isRequired(guarantor[field]))
          errors[field] = `${field} is required`;
      });

      if (guarantor.idNumber && !isValidCID(guarantor.idNumber))
        errors.idNumber = "CID must be 11 digits";

      if (guarantor.tpnNo && !isValidTPN(guarantor.tpnNo))
        errors.tpnNo = "TPN must be 11 digits";

      if (guarantor.dateOfBirth && !isLegalAge(guarantor.dateOfBirth))
        errors.dateOfBirth = "Guarantor must be at least 18 years old";

      if (getIsMarried(guarantor)) {
        if (isRequired(guarantor.spouseCid))
          errors.spouseCid = "Spouse CID is required";
        else if (guarantor.spouseCid && !isValidCID(guarantor.spouseCid))
          errors.spouseCid = "CID must be 11 digits";

        if (isRequired(guarantor.spouseName))
          errors.spouseName = "Spouse name is required";

        if (isRequired(guarantor.spouseContact))
          errors.spouseContact = "Spouse contact is required";
        else if (
          guarantor.spouseContact &&
          !isValidMobile(guarantor.spouseContact)
        )
          errors.spouseContact =
            "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";
      }

      if (!guarantor.passportPhoto)
        errors.passportPhoto = "Passport photo is required";

      if (!guarantor.familyTree)
        errors.familyTree = "Family tree document is required";

      if (isRequired(guarantor.permCountry))
        errors.permCountry = "Country is required";

      const isBhutanPerm = countryOptions.find(
        (c) =>
          String(c.country_pk_code || c.id || c.code) ===
            guarantor.permCountry &&
          (c.country || c.name || "").toLowerCase().includes("bhutan"),
      );

      if (isBhutanPerm) {
        if (isRequired(guarantor.permDzongkhag))
          errors.permDzongkhag = "Dzongkhag is required";
        if (isRequired(guarantor.permGewog))
          errors.permGewog = "Gewog is required";
        if (isRequired(guarantor.permVillage))
          errors.permVillage = "Village/Street is required";
        if (isRequired(guarantor.permThram))
          errors.permThram = "Thram number is required";
        if (isRequired(guarantor.permHouse))
          errors.permHouse = "House number is required";
      } else {
        if (isRequired(guarantor.permDzongkhag))
          errors.permDzongkhag = "State is required";
        if (isRequired(guarantor.permGewog))
          errors.permGewog = "Province is required";
        if (isRequired(guarantor.permVillage))
          errors.permVillage = "Street name is required";
        if (!guarantor.permAddressProof)
          errors.permAddressProof = "Address proof is required";
      }

      if (isRequired(guarantor.currCountry))
        errors.currCountry = "Country is required";

      const isBhutanCurr = countryOptions.find(
        (c) =>
          String(c.country_pk_code || c.id || c.code) ===
            guarantor.currCountry &&
          (c.country || c.name || "").toLowerCase().includes("bhutan"),
      );

      if (isBhutanCurr) {
        if (isRequired(guarantor.currDzongkhag))
          errors.currDzongkhag = "Dzongkhag is required";
        if (isRequired(guarantor.currGewog))
          errors.currGewog = "Gewog is required";
        if (isRequired(guarantor.currVillage))
          errors.currVillage = "Village/Street is required";
        if (isRequired(guarantor.currHouse))
          errors.currHouse = "Flat/House number is required";
      } else {
        if (isRequired(guarantor.currDzongkhag))
          errors.currDzongkhag = "State is required";
        if (isRequired(guarantor.currGewog))
          errors.currGewog = "Province is required";
        if (isRequired(guarantor.currVillage))
          errors.currVillage = "Street name is required";
        if (!guarantor.currAddressProof)
          errors.currAddressProof = "Address proof is required";
      }

      if (isRequired(guarantor.email)) errors.email = "Email is required";
      else if (guarantor.email && !isValidEmail(guarantor.email))
        errors.email = "Invalid email format";

      if (isRequired(guarantor.contact))
        errors.contact = "Contact number is required";
      else if (guarantor.contact && !isValidMobile(guarantor.contact))
        errors.contact =
          "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";

      if (
        guarantor.currAlternateContact &&
        !isValidMobile(guarantor.currAlternateContact)
      )
        errors.currAlternateContact =
          "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";

      if (isRequired(guarantor.isPep)) errors.isPep = "PEP status is required";
      if (guarantor.isPep === "yes") {
        if (isRequired(guarantor.pepCategory))
          errors.pepCategory = "PEP category is required";
        if (isRequired(guarantor.pepSubCategory))
          errors.pepSubCategory = "PEP sub-category is required";
        if (!guarantor.pepUpload)
          errors.pepUpload = "Identification proof is required";
      } else if (guarantor.isPep === "no") {
        if (isRequired(guarantor.relatedToPep))
          errors.relatedToPep = "Please indicate if related to a PEP";
        if (guarantor.relatedToPep === "yes") {
          (guarantor.relatedPeps || []).forEach((pep: any, pepIdx: number) => {
            if (isRequired(pep.relationship))
              errors[`relatedPeps.${pepIdx}.relationship`] =
                "Relationship is required";
            if (isRequired(pep.identificationNo))
              errors[`relatedPeps.${pepIdx}.identificationNo`] =
                "Identification number is required";
            else if (pep.identificationNo && !isValidCID(pep.identificationNo))
              errors[`relatedPeps.${pepIdx}.identificationNo`] =
                "Must be 11 digits";
            if (isRequired(pep.category))
              errors[`relatedPeps.${pepIdx}.category`] =
                "PEP category is required";
            if (isRequired(pep.subCategory))
              errors[`relatedPeps.${pepIdx}.subCategory`] =
                "PEP sub-category is required";
            if (!pep.identificationProof)
              errors[`relatedPeps.${pepIdx}.identificationProof`] =
                "Identification proof is required";
          });
        }
      }

      if (isRequired(guarantor.employmentStatus))
        errors.employmentStatus = "Employment status is required";
      if (guarantor.employmentStatus === "employed") {
        const empFields = [
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
        ];
        empFields.forEach((field) => {
          if (isRequired(guarantor[field]))
            errors[field] = `${field} is required`;
        });
        if (guarantor.serviceNature === "contract") {
          if (isRequired(guarantor.contractEndDate))
            errors.contractEndDate = "Contract end date is required";
        }
      }

      if (Object.keys(errors).length > 0) {
        isValid = false;
        updatedGuarantors[index] = {
          ...updatedGuarantors[index],
          errors: { ...updatedGuarantors[index].errors, ...errors },
        };
      }
    });

    if (!isValid) {
      setGuarantors(updatedGuarantors);
    }

    return isValid;
  };

  const validateSecurities = (): boolean => {
    let isValid = true;
    securities.forEach((security, index) => {
      if (security.securityType && security.securityType !== "Not Applicable") {
        if (!security.securityProof) {
          setErrors((prev) => ({
            ...prev,
            [`security-${index}-proof`]: "Security proof is required",
          }));
          isValid = false;
        }
      }
    });
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const areSecuritiesValid = validateSecurities();
    if (!areSecuritiesValid) {
      return;
    }

    const hasThirdParty = securities.some(
      (s) => s.ownershipType === "third-party",
    );

    if (hasThirdParty) {
      const allGuarantorsValid = validateAllGuarantors();
      if (!allGuarantorsValid) {
        return;
      }
    }

    // Prepare the data to save
    const formDataToSave = {
      securityDetails: securities,
      additionalGuarantors: guarantors,
    };

    // Retrieve existing data from sessionStorage
    const existingData = sessionStorage.getItem("businessLoanApplicationData");
    const allData = existingData ? JSON.parse(existingData) : {};

    // Merge and save to sessionStorage
    const updatedData = { ...allData, ...formDataToSave };
    sessionStorage.setItem(
      "businessLoanApplicationData",
      JSON.stringify(updatedData),
    );

    onNext(formDataToSave);
  };

  // Render security proof upload section
  const renderSecurityProofUpload = (security: any, secIndex: number) => {
    const securityType = security.securityType;
    const proofFileName = security.securityProof || "No file chosen";

    const getUploadLabel = () => {
      switch (securityType) {
        case "vehicle":
          return "Upload Vehicle Proof (Registration, Insurance)";
        case "land":
          return "Upload Land Proof (Thram Copy, Land Tax Receipt)";
        case "building":
          return "Upload Building Proof (Building Approval, Valuation Report)";
        case "equipment":
          return "Upload Equipment Proof (Invoice, Serial Number Proof)";
        case "insurance":
          return "Upload Insurance Policy Document";
        case "PPF":
          return "Upload PPF Statement/Certificate";
        case "Share":
          return "Upload Share Certificate/Proof";
        case "Stocks":
          return "Upload Stock Holding Certificate";
        case "fd":
          return "Upload Fixed Deposit Certificate";
        default:
          return "Upload Security Proof";
      }
    };

    return (
      <div className="space-y-2.5 mt-6 pt-6 border-t">
        <Label className="text-gray-800 font-semibold text-sm">
          {getUploadLabel()} <span className="text-red-500">*</span>
        </Label>
        <div
          className={fileUploadStyle(!!errors[`security-${secIndex}-proof`])}
          onClick={() =>
            document.getElementById(`security-proof-${secIndex}`)?.click()
          }
        >
          <span className="text-gray-500 truncate">{proofFileName}</span>
          <Upload className="h-4 w-4 text-[#003DA5]" />
        </div>
        <input
          type="file"
          id={`security-proof-${secIndex}`}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) =>
            handleSecurityFileChange(secIndex, e.target.files?.[0] || null)
          }
        />
        {errors[`security-${secIndex}-proof`] && (
          <p className="text-xs text-red-500 mt-1">
            {errors[`security-${secIndex}-proof`]}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Allowed: PDF, JPG, PNG (Max 5MB)
        </p>
      </div>
    );
  };

  // Render a single guarantor form section
  const renderGuarantorForm = (guarantor: any, index: number) => {
    const isMarried = getIsMarried(guarantor);
    const relatedPeps = guarantor.relatedPeps || [createEmptyRelatedPep()];
    const errors = guarantor.errors || {};

    const isBhutanPerm = countryOptions.find(
      (c) =>
        String(c.country_pk_code || c.id || c.code) === guarantor.permCountry &&
        (c.country || c.name || "").toLowerCase().includes("bhutan"),
    );

    const isBhutanCurr = countryOptions.find(
      (c) =>
        String(c.country_pk_code || c.id || c.code) === guarantor.currCountry &&
        (c.country || c.name || "").toLowerCase().includes("bhutan"),
    );

    return (
      <div
        key={index}
        className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm mb-8"
      >
        {/* Guarantor Header */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5]">
            {index === 0 ? "Security Guarantor 1" : `Guarantor ${index + 1}`}
          </h2>
          {index > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeGuarantor(index)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Remove Guarantor
            </Button>
          )}
        </div>

        {/* Search Status Popup for this guarantor */}
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

        {/* Personal Information */}
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
            Guarantor Personal Information
          </h2>

          {/* Identification Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`id-type-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Identification Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={guarantor.idType}
                onValueChange={(value) =>
                  updateGuarantorField(index, "idType", value)
                }
                required
              >
                <SelectTrigger className={getFieldStyle(!!errors.idType)}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {identificationTypeOptions.length > 0 ? (
                    identificationTypeOptions.map((option, idx) => {
                      const key =
                        option.identity_type_pk_code ||
                        option.identification_type_pk_code ||
                        option.id ||
                        `id-${idx}`;
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
                        <SelectItem key={key} value={value}>
                          {label}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.idType && (
                <p className="text-xs text-red-500 mt-1">{errors.idType}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`id-number-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Identification No. <span className="text-red-500">*</span>
              </Label>
              <RestrictedInput
                allowed="numeric"
                maxLength={11}
                id={`id-number-${index}`}
                placeholder="Enter identification No"
                className={getFieldStyle(!!errors.idNumber)}
                value={guarantor.idNumber || ""}
                onChange={(e) =>
                  updateGuarantorField(index, "idNumber", e.target.value)
                }
                onBlur={() => handleIdentityCheck(index)}
              />
              {errors.idNumber && (
                <p className="text-xs text-red-500 mt-1">{errors.idNumber}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`salutation-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Salutation <span className="text-red-500">*</span>
              </Label>
              <Select
                value={guarantor.salutation}
                onValueChange={(value) =>
                  updateGuarantorField(index, "salutation", value)
                }
                required
              >
                <SelectTrigger className={getFieldStyle(!!errors.salutation)}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="mr">Mr.</SelectItem>
                  <SelectItem value="mrs">Mrs.</SelectItem>
                  <SelectItem value="ms">Ms.</SelectItem>
                  <SelectItem value="dr">Dr.</SelectItem>
                </SelectContent>
              </Select>
              {errors.salutation && (
                <p className="text-xs text-red-500 mt-1">{errors.salutation}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`guarantor-name-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Guarantor Name <span className="text-red-500">*</span>
              </Label>
              <RestrictedInput
                allowed="alpha"
                id={`guarantor-name-${index}`}
                placeholder="Enter Your Full Name"
                className={getFieldStyle(!!errors.guarantorName)}
                value={guarantor.guarantorName || ""}
                onChange={(e) =>
                  updateGuarantorField(index, "guarantorName", e.target.value)
                }
                onBlur={(e) =>
                  handleBlurField(index, "guarantorName", e.target.value)
                }
              />
              {errors.guarantorName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.guarantorName}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`nationality-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Nationality <span className="text-red-500">*</span>
              </Label>
              <Select
                value={guarantor.nationality}
                onValueChange={(value) =>
                  updateGuarantorField(index, "nationality", value)
                }
                required
              >
                <SelectTrigger className={getFieldStyle(!!errors.nationality)}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {nationalityOptions.length > 0 ? (
                    nationalityOptions.map((option, idx) => {
                      const key =
                        option.nationality_pk_code ||
                        option.id ||
                        option.code ||
                        `nationality-${idx}`;
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
                        <SelectItem key={key} value={value}>
                          {label}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.nationality && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.nationality}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`gender-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Gender <span className="text-red-500">*</span>
              </Label>
              <Select
                value={guarantor.gender}
                onValueChange={(value) =>
                  updateGuarantorField(index, "gender", value)
                }
                required
              >
                <SelectTrigger className={getFieldStyle(!!errors.gender)}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-xs text-red-500 mt-1">{errors.gender}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`id-issue-date-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Identification Issue Date{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                id={`id-issue-date-${index}`}
                max={today}
                className={getFieldStyle(!!errors.idIssueDate)}
                value={formatDateForInput(guarantor.idIssueDate)}
                onChange={(e) =>
                  updateGuarantorField(index, "idIssueDate", e.target.value)
                }
              />
              {errors.idIssueDate && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.idIssueDate}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`id-expiry-date-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Identification Expiry Date{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                id={`id-expiry-date-${index}`}
                min={today}
                className={getFieldStyle(!!errors.idExpiryDate)}
                value={formatDateForInput(guarantor.idExpiryDate)}
                onChange={(e) =>
                  updateGuarantorField(index, "idExpiryDate", e.target.value)
                }
              />
              {errors.idExpiryDate && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.idExpiryDate}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`dob-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                id={`dob-${index}`}
                max={maxDobDate}
                className={getFieldStyle(!!errors.dateOfBirth)}
                value={formatDateForInput(guarantor.dateOfBirth)}
                onChange={(e) =>
                  updateGuarantorField(index, "dateOfBirth", e.target.value)
                }
                onBlur={(e) =>
                  handleBlurField(index, "dateOfBirth", e.target.value)
                }
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.dateOfBirth}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`tpn-no-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                TPN No
              </Label>
              <RestrictedInput
                allowed="numeric"
                maxLength={11}
                id={`tpn-no-${index}`}
                placeholder="Enter TPN"
                className={getFieldStyle(!!errors.tpnNo)}
                value={guarantor.tpnNo || ""}
                onChange={(e) =>
                  updateGuarantorField(index, "tpnNo", e.target.value)
                }
                onBlur={(e) => handleBlurField(index, "tpnNo", e.target.value)}
              />
              {errors.tpnNo && (
                <p className="text-xs text-red-500 mt-1">{errors.tpnNo}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`marital-status-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Marital Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={guarantor.maritalStatus}
                onValueChange={(value) =>
                  updateGuarantorField(index, "maritalStatus", value)
                }
                required
              >
                <SelectTrigger
                  className={getFieldStyle(!!errors.maritalStatus)}
                >
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {maritalStatusOptions.length > 0 ? (
                    maritalStatusOptions.map((option, idx) => {
                      const key =
                        option.marital_status_pk_code ||
                        option.id ||
                        option.value ||
                        option.code ||
                        `marital-${idx}`;
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
                        option.description ||
                        option.value ||
                        "Unknown";
                      return (
                        <SelectItem key={key} value={value}>
                          {label}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.maritalStatus && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.maritalStatus}
                </p>
              )}
            </div>
          </div>

          {/* Conditional Spouse Details Section */}
          {isMarried && (
            <div className="mt-6 sm:mt-8 border-t pt-6 sm:pt-8">
              <h3 className="text-lg font-bold text-[#003DA5] mb-4">
                Spouse Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label
                    htmlFor={`spouse-cid-${index}`}
                    className="text-gray-800 font-semibold text-xs sm:text-sm"
                  >
                    Spouse CID/ID No. <span className="text-red-500">*</span>
                  </Label>
                  <RestrictedInput
                    allowed="numeric"
                    maxLength={11}
                    id={`spouse-cid-${index}`}
                    placeholder="Enter Spouse CID/ID"
                    className={getFieldStyle(!!errors.spouseCid)}
                    value={guarantor.spouseCid || ""}
                    onChange={(e) =>
                      updateGuarantorField(index, "spouseCid", e.target.value)
                    }
                    onBlur={(e) =>
                      handleBlurField(index, "spouseCid", e.target.value)
                    }
                  />
                  {errors.spouseCid && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.spouseCid}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label
                    htmlFor={`spouse-name-${index}`}
                    className="text-gray-800 font-semibold text-xs sm:text-sm"
                  >
                    Spouse Name <span className="text-red-500">*</span>
                  </Label>
                  <RestrictedInput
                    allowed="alpha"
                    id={`spouse-name-${index}`}
                    placeholder="Enter Spouse Full Name"
                    className={getFieldStyle(!!errors.spouseName)}
                    value={guarantor.spouseName || ""}
                    onChange={(e) =>
                      updateGuarantorField(index, "spouseName", e.target.value)
                    }
                    onBlur={(e) =>
                      handleBlurField(index, "spouseName", e.target.value)
                    }
                  />
                  {errors.spouseName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.spouseName}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label
                    htmlFor={`spouse-contact-${index}`}
                    className="text-gray-800 font-semibold text-xs sm:text-sm"
                  >
                    Spouse Contact No. <span className="text-red-500">*</span>
                  </Label>
                  <RestrictedInput
                    allowed="numeric"
                    maxLength={8}
                    id={`spouse-contact-${index}`}
                    placeholder="Enter Contact Number"
                    className={getFieldStyle(!!errors.spouseContact)}
                    value={guarantor.spouseContact || ""}
                    onChange={(e) =>
                      updateGuarantorField(
                        index,
                        "spouseContact",
                        e.target.value,
                      )
                    }
                    onBlur={(e) =>
                      handleBlurField(index, "spouseContact", e.target.value)
                    }
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t mt-4">
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`family-tree-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Upload Family Tree
              </Label>
              <div
                className={fileUploadStyle(!!errors.familyTree)}
                onClick={() =>
                  document.getElementById(`family-tree-input-${index}`)?.click()
                }
              >
                <span className="text-gray-500 truncate">
                  {guarantor.familyTree || "No file chosen"}
                </span>
                <Upload className="h-4 w-4 text-[#003DA5]" />
              </div>
              <input
                type="file"
                id={`family-tree-input-${index}`}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  handleFileChange(
                    index,
                    "familyTree",
                    e.target.files?.[0] || null,
                  )
                }
              />
              {errors.familyTree && (
                <p className="text-xs text-red-500 mt-1">{errors.familyTree}</p>
              )}
              <p className="text-xs text-gray-500">
                Allowed: PDF, JPG, PNG (Max 5MB)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`bankName-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Name of Bank <span className="text-red-500">*</span>
              </Label>
              <Select
                value={guarantor.bankName}
                onValueChange={(value) =>
                  updateGuarantorField(index, "bankName", value)
                }
              >
                <SelectTrigger className={getFieldStyle(!!errors.bankName)}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {banksOptions.length > 0 ? (
                    banksOptions.map((option, optionIndex) => {
                      const key =
                        option.bank_pk_code ||
                        option.id ||
                        option.code ||
                        option.bank_code ||
                        `bank-${optionIndex}`;
                      const value = String(
                        option.bank_pk_code ||
                          option.id ||
                          option.code ||
                          option.bank_code ||
                          optionIndex,
                      );
                      const label =
                        option.bank_name ||
                        option.name ||
                        option.label ||
                        option.bankName ||
                        option.bank ||
                        "Unknown";

                      return (
                        <SelectItem key={key} value={value}>
                          {label}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.bankName && (
                <p className="text-xs text-red-500 mt-1">{errors.bankName}</p>
              )}
            </div>
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`bankAccount-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Bank Saving Account No <span className="text-red-500">*</span>
              </Label>
              <RestrictedInput
                allowed="alphanumeric"
                id={`bankAccount-${index}`}
                placeholder="Enter saving account number"
                className={getFieldStyle(!!errors.bankAccount)}
                value={guarantor.bankAccount || ""}
                onChange={(e) =>
                  updateGuarantorField(index, "bankAccount", e.target.value)
                }
                onBlur={(e) =>
                  handleBlurField(index, "bankAccount", e.target.value)
                }
              />
              {errors.bankAccount && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.bankAccount}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2.5">
            <Label
              htmlFor={`uploadPassport-${index}`}
              className="text-gray-800 font-semibold text-xs sm:text-sm"
            >
              Upload Passport-size Photograph{" "}
              <span className="text-red-500">*</span>
            </Label>
            <div
              className={fileUploadStyle(!!errors.passportPhoto)}
              onClick={() =>
                document.getElementById(`uploadPassport-${index}`)?.click()
              }
            >
              <span className="text-gray-500 truncate">
                {guarantor.passportPhoto || "No file chosen"}
              </span>
              <Upload className="h-4 w-4 text-[#003DA5]" />
            </div>
            <input
              type="file"
              id={`uploadPassport-${index}`}
              className="hidden"
              accept=".jpg,.jpeg,.png"
              onChange={(e) =>
                handleFileChange(
                  index,
                  "passportPhoto",
                  e.target.files?.[0] || null,
                )
              }
            />
            {errors.passportPhoto && (
              <p className="text-xs text-red-500 mt-1">
                {errors.passportPhoto}
              </p>
            )}
            <p className="text-xs text-gray-500">Allowed: JPG, PNG (Max 5MB)</p>
          </div>
        </div>

        {/* Permanent Address */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm mt-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
            Permanent Address
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`permCountry-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Country <span className="text-red-500">*</span>
              </Label>
              <Select
                value={guarantor.permCountry}
                onValueChange={(value) =>
                  updateGuarantorField(index, "permCountry", value)
                }
                required
              >
                <SelectTrigger className={getFieldStyle(!!errors.permCountry)}>
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {countryOptions.length > 0 ? (
                    countryOptions.map((option, idx) => {
                      const key =
                        option.country_pk_code ||
                        option.id ||
                        `perm-country-${idx}`;
                      const value = String(
                        option.country_pk_code || option.id || idx,
                      );
                      const label = option.country || option.name || "Unknown";
                      return (
                        <SelectItem key={key} value={value}>
                          {label}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.permCountry && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.permCountry}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`permDzongkhag-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                {isBhutanPerm ? "Dzongkhag" : "State"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {!isBhutanPerm ? (
                <RestrictedInput
                  allowed="alpha"
                  id={`permDzongkhag-${index}`}
                  placeholder="Enter State"
                  className={getFieldStyle(!!errors.permDzongkhag)}
                  value={guarantor.permDzongkhag || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "permDzongkhag", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlurField(index, "permDzongkhag", e.target.value)
                  }
                />
              ) : (
                <Select
                  value={guarantor.permDzongkhag || ""}
                  onValueChange={(value) =>
                    updateGuarantorField(index, "permDzongkhag", value)
                  }
                  disabled={!guarantor.permCountry || !isBhutanPerm}
                >
                  <SelectTrigger
                    className={getFieldStyle(!!errors.permDzongkhag)}
                  >
                    <SelectValue placeholder="Select Dzongkhag" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {dzongkhagOptions.length > 0 ? (
                      dzongkhagOptions.map((option, idx) => {
                        const key =
                          option.dzongkhag_pk_code ||
                          option.id ||
                          `perm-dzo-${idx}`;
                        const value = String(
                          option.dzongkhag_pk_code || option.id || idx,
                        );
                        const label =
                          option.dzongkhag || option.name || "Unknown";
                        return (
                          <SelectItem key={key} value={value}>
                            {label}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
              {errors.permDzongkhag && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.permDzongkhag}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`permGewog-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                {isBhutanPerm ? "Gewog" : "Province"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {!isBhutanPerm ? (
                <RestrictedInput
                  allowed="alpha"
                  id={`permGewog-${index}`}
                  placeholder="Enter Province"
                  className={getFieldStyle(!!errors.permGewog)}
                  value={guarantor.permGewog || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "permGewog", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlurField(index, "permGewog", e.target.value)
                  }
                />
              ) : (
                <Select
                  value={guarantor.permGewog}
                  onValueChange={(value) =>
                    updateGuarantorField(index, "permGewog", value)
                  }
                  disabled={
                    !guarantor.permCountry ||
                    !isBhutanPerm ||
                    !guarantor.permDzongkhag
                  }
                >
                  <SelectTrigger className={getFieldStyle(!!errors.permGewog)}>
                    <SelectValue placeholder="Select Gewog" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {guarantor.permGewogOptions?.length > 0 ? (
                      guarantor.permGewogOptions.map(
                        (option: any, optionIndex: number) => {
                          const key =
                            option.gewog_pk_code ||
                            option.id ||
                            option.code ||
                            `perm-gewog-${optionIndex}`;
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
                            <SelectItem key={key} value={value}>
                              {label}
                            </SelectItem>
                          );
                        },
                      )
                    ) : (
                      <SelectItem value="loading" disabled>
                        {guarantor.permDzongkhag
                          ? "Loading..."
                          : "Select Dzongkhag first"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
              {errors.permGewog && (
                <p className="text-xs text-red-500 mt-1">{errors.permGewog}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`permVillage-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                {isBhutanPerm ? "Village/Street" : "Street"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <RestrictedInput
                allowed="alphanumeric"
                id={`permVillage-${index}`}
                placeholder={
                  isBhutanPerm ? "Enter Village/Street" : "Enter Street"
                }
                className={getFieldStyle(!!errors.permVillage)}
                value={guarantor.permVillage || ""}
                onChange={(e) =>
                  updateGuarantorField(index, "permVillage", e.target.value)
                }
                disabled={!guarantor.permCountry}
                onBlur={(e) =>
                  handleBlurField(index, "permVillage", e.target.value)
                }
              />
              {errors.permVillage && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.permVillage}
                </p>
              )}
            </div>

            {/* Thram and House fields - only for Bhutan */}
            {isBhutanPerm && (
              <>
                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label
                    htmlFor={`permThram-${index}`}
                    className="text-gray-800 font-semibold text-xs sm:text-sm"
                  >
                    Thram No
                  </Label>
                  <RestrictedInput
                    allowed="alphanumeric"
                    id={`permThram-${index}`}
                    placeholder="Enter Thram No"
                    className={getFieldStyle(!!errors.permThram)}
                    value={guarantor.permThram || ""}
                    onChange={(e) =>
                      updateGuarantorField(index, "permThram", e.target.value)
                    }
                    onBlur={(e) =>
                      handleBlurField(index, "permThram", e.target.value)
                    }
                  />
                  {errors.permThram && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.permThram}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label
                    htmlFor={`permHouse-${index}`}
                    className="text-gray-800 font-semibold text-xs sm:text-sm"
                  >
                    House No
                  </Label>
                  <RestrictedInput
                    allowed="alphanumeric"
                    id={`permHouse-${index}`}
                    placeholder="Enter House No"
                    className={getFieldStyle(!!errors.permHouse)}
                    value={guarantor.permHouse || ""}
                    onChange={(e) =>
                      updateGuarantorField(index, "permHouse", e.target.value)
                    }
                    onBlur={(e) =>
                      handleBlurField(index, "permHouse", e.target.value)
                    }
                  />
                  {errors.permHouse && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.permHouse}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {!isBhutanPerm && guarantor.permCountry && (
            <div className="space-y-1.5 sm:space-y-2.5 mt-4">
              <Label
                htmlFor={`permAddressProof-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Upload Address Proof Document{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div
                className={fileUploadStyle(!!errors.permAddressProof)}
                onClick={() =>
                  document.getElementById(`permAddressProof-${index}`)?.click()
                }
              >
                <span className="text-gray-500 truncate">
                  {guarantor.permAddressProof || "No file chosen"}
                </span>
                <Upload className="h-4 w-4 text-[#003DA5]" />
              </div>
              <input
                type="file"
                id={`permAddressProof-${index}`}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  handleFileChange(
                    index,
                    "permAddressProof",
                    e.target.files?.[0] || null,
                  )
                }
              />
              {errors.permAddressProof && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.permAddressProof}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Please upload a valid address proof document for non-Bhutan
                residence
              </p>
            </div>
          )}
        </div>

        {/* Current/Residential Address */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm mt-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
            Current/Residential Address
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`currCountry-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Country <span className="text-red-500">*</span>
              </Label>
              <Select
                value={guarantor.currCountry}
                onValueChange={(value) =>
                  updateGuarantorField(index, "currCountry", value)
                }
              >
                <SelectTrigger className={getFieldStyle(!!errors.currCountry)}>
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {countryOptions.length > 0 ? (
                    countryOptions.map((option, idx) => {
                      const key =
                        option.country_pk_code ||
                        option.id ||
                        `curr-country-${idx}`;
                      const value = String(
                        option.country_pk_code || option.id || idx,
                      );
                      const label = option.country || option.name || "Unknown";
                      return (
                        <SelectItem key={key} value={value}>
                          {label}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.currCountry && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.currCountry}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`currDzongkhag-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                {isBhutanCurr ? "Dzongkhag" : "State"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {!isBhutanCurr ? (
                <RestrictedInput
                  allowed="alpha"
                  id={`currDzongkhag-${index}`}
                  placeholder="Enter State"
                  className={getFieldStyle(!!errors.currDzongkhag)}
                  value={guarantor.currDzongkhag || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "currDzongkhag", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlurField(index, "currDzongkhag", e.target.value)
                  }
                />
              ) : (
                <Select
                  value={guarantor.currDzongkhag}
                  onValueChange={(value) =>
                    updateGuarantorField(index, "currDzongkhag", value)
                  }
                  disabled={!guarantor.currCountry || !isBhutanCurr}
                >
                  <SelectTrigger
                    className={getFieldStyle(!!errors.currDzongkhag)}
                  >
                    <SelectValue placeholder="Select Dzongkhag" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {dzongkhagOptions.length > 0 ? (
                      dzongkhagOptions.map((option, idx) => {
                        const key =
                          option.dzongkhag_pk_code ||
                          option.id ||
                          `curr-dzo-${idx}`;
                        const value = String(
                          option.dzongkhag_pk_code || option.id || idx,
                        );
                        const label =
                          option.dzongkhag || option.name || "Unknown";
                        return (
                          <SelectItem key={key} value={value}>
                            {label}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
              {errors.currDzongkhag && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.currDzongkhag}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`currGewog-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                {isBhutanCurr ? "Gewog" : "Province"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {!isBhutanCurr ? (
                <RestrictedInput
                  allowed="alpha"
                  id={`currGewog-${index}`}
                  placeholder="Enter Province"
                  className={getFieldStyle(!!errors.currGewog)}
                  value={guarantor.currGewog || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "currGewog", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlurField(index, "currGewog", e.target.value)
                  }
                />
              ) : (
                <Select
                  value={guarantor.currGewog}
                  onValueChange={(value) =>
                    updateGuarantorField(index, "currGewog", value)
                  }
                  disabled={
                    !guarantor.currCountry ||
                    !isBhutanCurr ||
                    !guarantor.currDzongkhag
                  }
                >
                  <SelectTrigger className={getFieldStyle(!!errors.currGewog)}>
                    <SelectValue placeholder="Select Gewog" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {guarantor.currGewogOptions?.length > 0 ? (
                      guarantor.currGewogOptions.map(
                        (option: any, optionIndex: number) => {
                          const key =
                            option.gewog_pk_code ||
                            option.id ||
                            option.code ||
                            `curr-gewog-${optionIndex}`;
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
                            <SelectItem key={key} value={value}>
                              {label}
                            </SelectItem>
                          );
                        },
                      )
                    ) : (
                      <SelectItem value="loading" disabled>
                        {guarantor.currDzongkhag
                          ? "Loading..."
                          : "Select Dzongkhag first"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
              {errors.currGewog && (
                <p className="text-xs text-red-500 mt-1">{errors.currGewog}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`currVillage-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                {isBhutanCurr ? "Village/Street" : "Street"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <RestrictedInput
                allowed="alphanumeric"
                id={`currVillage-${index}`}
                placeholder={
                  isBhutanCurr ? "Enter Village/Street" : "Enter Street"
                }
                className={getFieldStyle(!!errors.currVillage)}
                value={guarantor.currVillage || ""}
                onChange={(e) =>
                  updateGuarantorField(index, "currVillage", e.target.value)
                }
                disabled={!guarantor.currCountry}
                onBlur={(e) =>
                  handleBlurField(index, "currVillage", e.target.value)
                }
              />
              {errors.currVillage && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.currVillage}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`currHouse-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                {isBhutanCurr ? "House/Building/Flat No" : ""}
              </Label>
              {isBhutanCurr ? (
                <RestrictedInput
                  allowed="alphanumeric"
                  id={`currHouse-${index}`}
                  placeholder="Enter House/Flat No"
                  className={getFieldStyle(!!errors.currHouse)}
                  value={guarantor.currHouse || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "currHouse", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlurField(index, "currHouse", e.target.value)
                  }
                />
              ) : null}
              {errors.currHouse && (
                <p className="text-xs text-red-500 mt-1">{errors.currHouse}</p>
              )}
            </div>

            {guarantor.currCountry && (
              <div className="space-y-1.5 sm:space-y-2.5">
                <Label
                  htmlFor={`email-${index}`}
                  className="text-gray-800 font-semibold text-xs sm:text-sm"
                >
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`email-${index}`}
                  type="email"
                  placeholder="Enter Email Address"
                  className={getFieldStyle(!!errors.email)}
                  value={guarantor.email || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "email", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlurField(index, "email", e.target.value)
                  }
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
            )}
          </div>

          {/* Contact Information - only show when current country is selected */}
          {guarantor.currCountry && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label
                    htmlFor={`contact-${index}`}
                    className="text-gray-800 font-semibold text-xs sm:text-sm"
                  >
                    Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <RestrictedInput
                    allowed="numeric"
                    maxLength={8}
                    id={`contact-${index}`}
                    placeholder="Enter Contact Number"
                    className={getFieldStyle(!!errors.contact)}
                    value={guarantor.contact || ""}
                    onChange={(e) =>
                      updateGuarantorField(index, "contact", e.target.value)
                    }
                    onBlur={(e) =>
                      handleBlurField(index, "contact", e.target.value)
                    }
                  />
                  {errors.contact && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.contact}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label
                    htmlFor={`currAlternateContact-${index}`}
                    className="text-gray-800 font-semibold text-xs sm:text-sm"
                  >
                    Alternate Contact No
                  </Label>
                  <RestrictedInput
                    allowed="numeric"
                    maxLength={8}
                    id={`currAlternateContact-${index}`}
                    placeholder="Enter Contact No"
                    className={getFieldStyle(!!errors.currAlternateContact)}
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
                  />
                  {errors.currAlternateContact && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.currAlternateContact}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {!isBhutanCurr && guarantor.currCountry && (
            <div className="space-y-1.5 sm:space-y-2.5 mt-4">
              <Label
                htmlFor={`currAddressProof-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Upload Address Proof Document{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div
                className={fileUploadStyle(!!errors.currAddressProof)}
                onClick={() =>
                  document.getElementById(`currAddressProof-${index}`)?.click()
                }
              >
                <span className="text-gray-500 truncate">
                  {guarantor.currAddressProof || "No file chosen"}
                </span>
                <Upload className="h-4 w-4 text-[#003DA5]" />
              </div>
              <input
                type="file"
                id={`currAddressProof-${index}`}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  handleFileChange(
                    index,
                    "currAddressProof",
                    e.target.files?.[0] || null,
                  )
                }
              />
              {errors.currAddressProof && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.currAddressProof}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Please upload a valid address proof document for non-Bhutan
                residence
              </p>
            </div>
          )}
        </div>

        {/* PEP Declaration */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm mt-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
            PEP Declaration
          </h2>

          {/* SELF PEP Question */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-b pb-6">
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`isPep-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm min-h-[40px] flex items-end pb-1"
              >
                Politically Exposed Person{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={guarantor.isPep}
                onValueChange={(value) =>
                  updateGuarantorField(index, "isPep", value)
                }
              >
                <SelectTrigger className={getFieldStyle(!!errors.isPep)}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              {errors.isPep && (
                <p className="text-xs text-red-500 mt-1">{errors.isPep}</p>
              )}
            </div>

            {guarantor.isPep === "yes" && (
              <>
                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label
                    htmlFor={`pepCategory-${index}`}
                    className="text-gray-800 font-semibold text-xs sm:text-sm min-h-[40px] flex items-end pb-1"
                  >
                    PEP Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={guarantor.pepCategory}
                    onValueChange={(value) =>
                      updateGuarantorField(index, "pepCategory", value)
                    }
                  >
                    <SelectTrigger
                      className={getFieldStyle(!!errors.pepCategory)}
                    >
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {pepCategoryOptions.length > 0 ? (
                        pepCategoryOptions.map((option, optionIndex) => {
                          const key =
                            option.pep_category_pk_code ||
                            option.id ||
                            option.code ||
                            `pep-cat-${optionIndex}`;
                          const value = String(
                            option.pep_category_pk_code ||
                              option.id ||
                              option.code ||
                              optionIndex,
                          );
                          const label =
                            option.pep_category ||
                            option.name ||
                            option.label ||
                            "Unknown";

                          return (
                            <SelectItem key={key} value={value}>
                              {label}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.pepCategory && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.pepCategory}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label
                    htmlFor={`pepSubCategory-${index}`}
                    className="text-gray-800 font-semibold text-xs sm:text-sm min-h-[40px] flex items-end pb-1"
                  >
                    PEP Sub Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={guarantor.pepSubCategory}
                    onValueChange={(value) =>
                      updateGuarantorField(index, "pepSubCategory", value)
                    }
                    disabled={!guarantor.pepCategory}
                  >
                    <SelectTrigger
                      className={getFieldStyle(!!errors.pepSubCategory)}
                    >
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {guarantor.pepSubCategoryOptions?.length > 0 ? (
                        guarantor.pepSubCategoryOptions.map(
                          (option: any, optionIndex: number) => {
                            const key =
                              option.pep_sub_category_pk_code ||
                              option.id ||
                              option.code ||
                              `pep-sub-${optionIndex}`;
                            const value = String(
                              option.pep_sub_category_pk_code ||
                                option.id ||
                                option.code ||
                                optionIndex,
                            );
                            const label =
                              option.pep_sub_category ||
                              option.name ||
                              option.label ||
                              "Unknown";

                            return (
                              <SelectItem key={key} value={value}>
                                {label}
                              </SelectItem>
                            );
                          },
                        )
                      ) : (
                        <SelectItem value="loading" disabled>
                          {guarantor.pepCategory
                            ? "Loading..."
                            : "Select Category first"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.pepSubCategory && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.pepSubCategory}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-xs sm:text-sm min-h-[40px] flex items-end pb-1">
                    Upload Identification Proof{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div
                    className={fileUploadStyle(!!errors.pepUpload)}
                    onClick={() =>
                      document.getElementById(`selfPepProof-${index}`)?.click()
                    }
                  >
                    <span className="text-gray-500 truncate">
                      {guarantor.pepUpload || "No file chosen"}
                    </span>
                    <Upload className="h-4 w-4 text-[#003DA5]" />
                  </div>
                  <input
                    type="file"
                    id={`selfPepProof-${index}`}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleFileChange(
                        index,
                        "pepUpload",
                        e.target.files?.[0] || null,
                      )
                    }
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

          {/* RELATED PEP Question */}
          {guarantor.isPep === "no" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
              <div className="space-y-1.5 sm:space-y-2.5">
                <Label
                  htmlFor={`relatedToPep-${index}`}
                  className="text-gray-800 font-semibold text-xs sm:text-sm min-h-[40px] flex items-end pb-1"
                >
                  Are you related to any PEP?{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={guarantor.relatedToPep}
                  onValueChange={(value) =>
                    updateGuarantorField(index, "relatedToPep", value)
                  }
                >
                  <SelectTrigger
                    className={getFieldStyle(!!errors.relatedToPep)}
                  >
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
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
          )}

          {/* RELATED PEP MULTIPLE ENTRIES */}
          {guarantor.isPep === "no" && guarantor.relatedToPep === "yes" && (
            <div className="space-y-6 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-bold text-gray-700">
                  Related PEP Details
                </h3>
              </div>

              {relatedPeps.map((pep: any, pepIndex: number) => (
                <div
                  key={pepIndex}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative"
                >
                  {/* Remove Button */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-sm text-gray-600">
                      Person {pepIndex + 1}
                    </span>
                    {relatedPeps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRelatedPep(index, pepIndex)}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-2">
                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm min-h-[40px] flex items-end pb-1">
                        Relationship <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={pep.relationship || ""}
                        onValueChange={(value) =>
                          handleRelatedPepChange(
                            index,
                            pepIndex,
                            "relationship",
                            value,
                          )
                        }
                      >
                        <SelectTrigger
                          className={getFieldStyle(
                            !!errors[`relatedPeps.${pepIndex}.relationship`],
                          )}
                        >
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors[`relatedPeps.${pepIndex}.relationship`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`relatedPeps.${pepIndex}.relationship`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm min-h-[40px] flex items-end pb-1">
                        Identification No.{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <RestrictedInput
                        allowed="numeric"
                        maxLength={11}
                        placeholder="Enter Identification No"
                        className={getFieldStyle(
                          !!errors[`relatedPeps.${pepIndex}.identificationNo`],
                        )}
                        value={pep.identificationNo || ""}
                        onChange={(e) =>
                          handleRelatedPepChange(
                            index,
                            pepIndex,
                            "identificationNo",
                            e.target.value,
                          )
                        }
                      />
                      {errors[`relatedPeps.${pepIndex}.identificationNo`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`relatedPeps.${pepIndex}.identificationNo`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm min-h-[40px] flex items-end pb-1">
                        PEP Category <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={pep.category || ""}
                        onValueChange={(value) =>
                          handleRelatedPepChange(
                            index,
                            pepIndex,
                            "category",
                            value,
                          )
                        }
                      >
                        <SelectTrigger
                          className={getFieldStyle(
                            !!errors[`relatedPeps.${pepIndex}.category`],
                          )}
                        >
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {pepCategoryOptions.length > 0 ? (
                            pepCategoryOptions.map((option, optionIndex) => {
                              const key =
                                option.pep_category_pk_code ||
                                option.id ||
                                option.code ||
                                `pep-cat-${optionIndex}`;
                              const value = String(
                                option.pep_category_pk_code ||
                                  option.id ||
                                  option.code ||
                                  optionIndex,
                              );
                              const label =
                                option.pep_category ||
                                option.name ||
                                option.label ||
                                "Unknown";
                              return (
                                <SelectItem key={key} value={value}>
                                  {label}
                                </SelectItem>
                              );
                            })
                          ) : (
                            <SelectItem value="loading" disabled>
                              Loading...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {errors[`relatedPeps.${pepIndex}.category`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`relatedPeps.${pepIndex}.category`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm min-h-[40px] flex items-end pb-1">
                        PEP Sub Category
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={pep.subCategory || ""}
                        onValueChange={(value) =>
                          handleRelatedPepChange(
                            index,
                            pepIndex,
                            "subCategory",
                            value,
                          )
                        }
                        disabled={!pep.category}
                      >
                        <SelectTrigger
                          className={getFieldStyle(
                            !!errors[`relatedPeps.${pepIndex}.subCategory`],
                          )}
                        >
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {guarantor.relatedPepOptionsMap?.[pepIndex]?.length >
                          0 ? (
                            guarantor.relatedPepOptionsMap[pepIndex].map(
                              (option: any, optionIndex: number) => {
                                const key =
                                  option.pep_sub_category_pk_code ||
                                  option.id ||
                                  option.code ||
                                  `pep-rel-sub-${optionIndex}`;
                                const value = String(
                                  option.pep_sub_category_pk_code ||
                                    option.id ||
                                    option.code ||
                                    optionIndex,
                                );
                                const label =
                                  option.pep_sub_category ||
                                  option.name ||
                                  option.label ||
                                  "Unknown";
                                return (
                                  <SelectItem key={key} value={value}>
                                    {label}
                                  </SelectItem>
                                );
                              },
                            )
                          ) : (
                            <SelectItem value="loading" disabled>
                              {pep.category
                                ? "Loading..."
                                : "Select Category first"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {errors[`relatedPeps.${pepIndex}.subCategory`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`relatedPeps.${pepIndex}.subCategory`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm min-h-[40px] flex items-end pb-1">
                        Upload Proof <span className="text-red-500">*</span>
                      </Label>
                      <div
                        className={fileUploadStyle(
                          !!errors[
                            `relatedPeps.${pepIndex}.identificationProof`
                          ],
                        )}
                        onClick={() =>
                          document
                            .getElementById(`uploadId-${index}-${pepIndex}`)
                            ?.click()
                        }
                      >
                        <span className="text-gray-500 truncate">
                          {pep.identificationProof || "No file chosen"}
                        </span>
                        <Upload className="h-4 w-4 text-[#003DA5]" />
                      </div>
                      <input
                        type="file"
                        id={`uploadId-${index}-${pepIndex}`}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          handleRelatedPepFileChange(
                            index,
                            pepIndex,
                            e.target.files?.[0] || null,
                          )
                        }
                      />
                      {errors[
                        `relatedPeps.${pepIndex}.identificationProof`
                      ] && (
                        <p className="text-xs text-red-500 mt-1">
                          {
                            errors[
                              `relatedPeps.${pepIndex}.identificationProof`
                            ]
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddRelatedPep(index)}
                className="w-full sm:w-auto border-dashed border-2 border-gray-300 text-gray-600 hover:border-[#003DA5] hover:text-[#003DA5]"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Another Related PEP
              </Button>
            </div>
          )}
        </div>

        {/* Employment Status */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm mt-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
            Employment Status
          </h2>

          <div className="space-y-4">
            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
              Employment Status <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={guarantor.employmentStatus}
              onValueChange={(value) =>
                updateGuarantorField(index, "employmentStatus", value)
              }
              className="flex flex-col sm:flex-row gap-3 sm:gap-6 md:gap-8"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employed" id={`employed-${index}`} />
                <Label
                  htmlFor={`employed-${index}`}
                  className="font-normal cursor-pointer text-sm"
                >
                  Employed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unemployed" id={`unemployed-${index}`} />
                <Label
                  htmlFor={`unemployed-${index}`}
                  className="font-normal cursor-pointer text-sm"
                >
                  Unemployed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="self-employed"
                  id={`self-employed-${index}`}
                />
                <Label
                  htmlFor={`self-employed-${index}`}
                  className="font-normal cursor-pointer text-sm"
                >
                  Self-employed
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Employment Details */}
        {guarantor.employmentStatus === "employed" && (
          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm mt-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
              Employment Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor={`employeeId-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Employee ID <span className="text-red-500">*</span>
                </Label>
                <RestrictedInput
                  allowed="alphanumeric"
                  id={`employeeId-${index}`}
                  placeholder="Enter ID"
                  className={getFieldStyle(!!errors.employeeId)}
                  value={guarantor.employeeId || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "employeeId", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlurField(index, "employeeId", e.target.value)
                  }
                />
                {errors.employeeId && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.employeeId}
                  </p>
                )}
              </div>
              <div className="space-y-2.5">
                <Label
                  htmlFor={`occupation-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Occupation <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={guarantor.occupation}
                  onValueChange={(value) =>
                    updateGuarantorField(index, "occupation", value)
                  }
                >
                  <SelectTrigger className={getFieldStyle(!!errors.occupation)}>
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {occupationOptions.length > 0 ? (
                      occupationOptions.map((option, optionIndex) => {
                        const key =
                          option.occ_pk_code ||
                          option.occupation_pk_code ||
                          option.id ||
                          `occupation-${optionIndex}`;
                        const value = String(
                          option.occ_pk_code ||
                            option.occupation_pk_code ||
                            option.id ||
                            optionIndex,
                        );
                        const label =
                          option.occ_name ||
                          option.occupation ||
                          option.name ||
                          "Unknown";

                        return (
                          <SelectItem key={key} value={value}>
                            {label}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.occupation && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.occupation}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`employerType-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Type of Employer <span className="text-red-500">*</span>
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
                  <SelectContent sideOffset={4}>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
                {errors.employerType && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.employerType}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`designation-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Designation <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={guarantor.designation}
                  onValueChange={(value) =>
                    updateGuarantorField(index, "designation", value)
                  }
                >
                  <SelectTrigger
                    className={getFieldStyle(!!errors.designation)}
                  >
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="officer">Officer</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
                {errors.designation && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.designation}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`grade-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Grade <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={guarantor.grade}
                  onValueChange={(value) =>
                    updateGuarantorField(index, "grade", value)
                  }
                >
                  <SelectTrigger className={getFieldStyle(!!errors.grade)}>
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={String(num)}>
                        {num}
                      </SelectItem>
                    ))}
                    <SelectItem value="p1">P1</SelectItem>
                    <SelectItem value="p2">P2</SelectItem>
                    <SelectItem value="p3">P3</SelectItem>
                    <SelectItem value="p4">P4</SelectItem>
                    <SelectItem value="p5">P5</SelectItem>
                  </SelectContent>
                </Select>
                {errors.grade && (
                  <p className="text-xs text-red-500 mt-1">{errors.grade}</p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`organizationName-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Organization Name <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={guarantor.organizationName}
                  onValueChange={(value) =>
                    updateGuarantorField(index, "organizationName", value)
                  }
                >
                  <SelectTrigger
                    className={getFieldStyle(!!errors.organizationName)}
                  >
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {organizationOptions.length > 0 ? (
                      organizationOptions.map((option, optionIndex) => {
                        const key =
                          option.lgal_constitution_pk_code ||
                          option.legal_const_pk_code ||
                          option.id ||
                          `org-${optionIndex}`;
                        const value = String(
                          option.lgal_constitution_pk_code ||
                            option.legal_const_pk_code ||
                            option.id ||
                            optionIndex,
                        );
                        const label =
                          option.lgal_constitution ||
                          option.legal_const_name ||
                          option.name ||
                          "Unknown";

                        return (
                          <SelectItem key={key} value={value}>
                            {label}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.organizationName && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.organizationName}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`orgLocation-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Organization Location <span className="text-red-500">*</span>
                </Label>
                <RestrictedInput
                  allowed="alphanumeric"
                  id={`orgLocation-${index}`}
                  placeholder="Enter Full Name"
                  className={getFieldStyle(!!errors.orgLocation)}
                  value={guarantor.orgLocation || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "orgLocation", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlurField(index, "orgLocation", e.target.value)
                  }
                />
                {errors.orgLocation && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.orgLocation}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`joiningDate-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Service Joining Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  id={`joiningDate-${index}`}
                  max={today}
                  className={getFieldStyle(!!errors.joiningDate)}
                  value={guarantor.joiningDate || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "joiningDate", e.target.value)
                  }
                />
                {errors.joiningDate && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.joiningDate}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor={`serviceNature-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Nature of Service <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={guarantor.serviceNature}
                  onValueChange={(value) =>
                    updateGuarantorField(index, "serviceNature", value)
                  }
                >
                  <SelectTrigger
                    className={getFieldStyle(!!errors.serviceNature)}
                  >
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
                {errors.serviceNature && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.serviceNature}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`annualSalary-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Gross Annual Salary Income{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  id={`annualSalary-${index}`}
                  placeholder="Enter Annual Salary"
                  className={getFieldStyle(!!errors.annualSalary)}
                  value={guarantor.annualSalary || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "annualSalary", e.target.value)
                  }
                />
                {errors.annualSalary && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.annualSalary}
                  </p>
                )}
              </div>
            </div>

            {/* Contract End Date - Only visible when Nature of Service is Contract */}
            {guarantor.serviceNature === "contract" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor={`contractEndDate-${index}`}
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Contract End Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    id={`contractEndDate-${index}`}
                    min={today}
                    className={getFieldStyle(!!errors.contractEndDate)}
                    value={guarantor.contractEndDate || ""}
                    onChange={(e) =>
                      updateGuarantorField(
                        index,
                        "contractEndDate",
                        e.target.value,
                      )
                    }
                    required
                  />
                  {errors.contractEndDate && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.contractEndDate}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Dynamic Securities */}
      {securities.map((security, secIndex) => (
        <div key={secIndex} className="space-y-8">
          {/* Primary Security/Collateral Details */}
          <div
            className={`border rounded-lg p-8 space-y-8 shadow-sm ${secIndex === 0 ? "bg-card" : "bg-blue-50 border-blue-200"}`}
          >
            <div className="flex justify-between items-center border-b pb-4 mb-2">
              <h2 className="text-2xl font-semibold text-[#003DA5]">
                {secIndex === 0
                  ? "Primary Security/Collateral Details"
                  : `Security ${secIndex + 1}`}
              </h2>
              {securities.length > 1 && secIndex > 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeSecurity(secIndex)}
                >
                  Remove
                </Button>
              )}
            </div>

            {/* Security Type and Ownership Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor="security-type"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Type of Security <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={security.securityType}
                  onValueChange={(value) =>
                    updateSecurityField(secIndex, "securityType", value)
                  }
                  required
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    <SelectItem value="Not Applicable">
                      Not Applicable
                    </SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="fd">Fixed Deposit</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="PPF">
                      Pension & Provident Fund
                    </SelectItem>
                    <SelectItem value="Share">Share & Security</SelectItem>
                    <SelectItem value="Stocks">Stocks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="ownership-type"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Security Ownership <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={security.ownershipType}
                  onValueChange={(value) =>
                    updateSecurityField(secIndex, "ownershipType", value)
                  }
                  required
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    <SelectItem value="self">Self Owned</SelectItem>
                    <SelectItem value="third-party">Third Party</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Vehicle Details (if applicable) */}
          {security.securityType === "vehicle" && (
            <div
              className={`border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm ${secIndex === 0 ? "bg-white" : "bg-blue-50 border-blue-200"}`}
            >
              <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                Vehicle Details (If Applicable)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="vehicle-type"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Vehicle Type
                  </Label>
                  <Select
                    value={security.vehicleType}
                    onValueChange={(value) =>
                      updateSecurityField(secIndex, "vehicleType", value)
                    }
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="vehicle-make"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Make/Brand
                  </Label>
                  <Input
                    id="vehicle-make"
                    placeholder="Enter Make/Brand"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.vehicleMake || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "vehicleMake",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="vehicle-model"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Model
                  </Label>
                  <Input
                    id="vehicle-model"
                    placeholder="Enter Model"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.vehicleModel || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "vehicleModel",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="vehicle-year"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Year of Manufacture
                  </Label>
                  <Input
                    id="vehicle-year"
                    type="number"
                    placeholder="Enter Year"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.vehicleYear || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "vehicleYear",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="registration-no"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Registration No.
                  </Label>
                  <Input
                    id="registration-no"
                    placeholder="Enter Registration No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.registrationNo || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "registrationNo",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="chassis-no"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Chassis No.
                  </Label>
                  <Input
                    id="chassis-no"
                    placeholder="Enter Chassis No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.chassisNo || ""}
                    onChange={(e) =>
                      updateSecurityField(secIndex, "chassisNo", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="engine-no"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Engine No.
                  </Label>
                  <Input
                    id="engine-no"
                    placeholder="Enter Engine No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.engineNo || ""}
                    onChange={(e) =>
                      updateSecurityField(secIndex, "engineNo", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Vehicle Security Proof Upload */}
              {renderSecurityProofUpload(security, secIndex)}
            </div>
          )}

          {/* Property/Land Details */}
          {security.securityType === "land" && (
            <div
              className={`border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm ${secIndex === 0 ? "bg-white" : "bg-blue-50 border-blue-200"}`}
            >
              <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                Property/Land Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="thram-no"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Thram No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="thram-no"
                    placeholder="Enter Thram No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.thramNo || ""}
                    onChange={(e) =>
                      updateSecurityField(secIndex, "thramNo", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="plot-no"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Plot No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="plot-no"
                    placeholder="Enter Plot No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.plotNo || ""}
                    onChange={(e) =>
                      updateSecurityField(secIndex, "plotNo", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="area"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Area (in Sq. Ft) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="Enter Area"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.area || ""}
                    onChange={(e) =>
                      updateSecurityField(secIndex, "area", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="land-use"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Land Use Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={security.landUse}
                    onValueChange={(value) =>
                      updateSecurityField(secIndex, "landUse", value)
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="agricultural">Agricultural</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="security-dzongkhag"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Dzongkhag <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={security.dzongkhag}
                    onValueChange={(value) =>
                      updateSecurityField(secIndex, "dzongkhag", value)
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {dzongkhagOptions.length > 0 ? (
                        dzongkhagOptions.map((option, idx) => {
                          const key =
                            option.dzongkhag_pk_code ||
                            option.id ||
                            `sec-dzo-${idx}`;
                          const value = String(
                            option.dzongkhag_pk_code || option.id || idx,
                          );
                          const label =
                            option.dzongkhag || option.name || "Unknown";
                          return (
                            <SelectItem key={key} value={value}>
                              {label}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="security-gewog"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Gewog <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={security.gewog}
                    onValueChange={(value) =>
                      updateSecurityField(secIndex, "gewog", value)
                    }
                    required
                    disabled={!security.dzongkhag}
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {security.gewogOptions?.length > 0 ? (
                        security.gewogOptions.map(
                          (option: any, idx: number) => {
                            const key =
                              option.gewog_pk_code ||
                              option.id ||
                              `prop-gewog-${idx}`;
                            const value = String(
                              option.gewog_pk_code || option.id || idx,
                            );
                            const label =
                              option.gewog || option.name || "Unknown";
                            return (
                              <SelectItem key={key} value={value}>
                                {label}
                              </SelectItem>
                            );
                          },
                        )
                      ) : (
                        <SelectItem value="loading" disabled>
                          {security.dzongkhag
                            ? "Loading..."
                            : "Select Dzongkhag first"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="security-village"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Village/Street <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="security-village"
                    placeholder="Enter Village/Street"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.village || ""}
                    onChange={(e) =>
                      updateSecurityField(secIndex, "village", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="house-no"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    House No.
                  </Label>
                  <Input
                    id="house-no"
                    placeholder="Enter House No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.houseNo || ""}
                    onChange={(e) =>
                      updateSecurityField(secIndex, "houseNo", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Land Security Proof Upload */}
              {renderSecurityProofUpload(security, secIndex)}
            </div>
          )}

          {/* Building Details */}
          {security.securityType === "building" && (
            <div
              className={`border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm ${secIndex === 0 ? "bg-white" : "bg-blue-50 border-blue-200"}`}
            >
              <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                Building Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="building-type"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Building Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={security.buildingType}
                    onValueChange={(value) =>
                      updateSecurityField(secIndex, "buildingType", value)
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="mixed">Mixed Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="building-area"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Building Area (Sq. Ft){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="building-area"
                    type="number"
                    placeholder="Enter Building Area"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.buildingArea || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "buildingArea",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="building-year"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Year Built <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="building-year"
                    type="number"
                    placeholder="Enter Year Built"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.buildingYear || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "buildingYear",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
              </div>

              {/* Building Security Proof Upload */}
              {renderSecurityProofUpload(security, secIndex)}
            </div>
          )}

          {/* Equipment Details */}
          {security.securityType === "equipment" && (
            <div
              className={`border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm ${secIndex === 0 ? "bg-white" : "bg-blue-50 border-blue-200"}`}
            >
              <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                Equipment Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="equipment-type"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Equipment Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={security.equipmentType}
                    onValueChange={(value) =>
                      updateSecurityField(secIndex, "equipmentType", value)
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      <SelectItem value="heavy">Heavy Machinery</SelectItem>
                      <SelectItem value="medical">Medical Equipment</SelectItem>
                      <SelectItem value="industrial">
                        Industrial Equipment
                      </SelectItem>
                      <SelectItem value="computer">
                        Computer Equipment
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="equipment-make"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Make/Brand <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="equipment-make"
                    placeholder="Enter Make/Brand"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.equipmentMake || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "equipmentMake",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="equipment-model"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Model <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="equipment-model"
                    placeholder="Enter Model"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.equipmentModel || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "equipmentModel",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="equipment-serial"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Serial No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="equipment-serial"
                    placeholder="Enter Serial No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.equipmentSerialNo || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "equipmentSerialNo",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="equipment-value"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Equipment Value (Nu.){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="equipment-value"
                    type="number"
                    placeholder="Enter Equipment Value"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.equipmentValue || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "equipmentValue",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
              </div>

              {/* Equipment Security Proof Upload */}
              {renderSecurityProofUpload(security, secIndex)}
            </div>
          )}

          {/* Insurance Details */}
          {security.securityType === "insurance" && (
            <div
              className={`border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm ${secIndex === 0 ? "bg-white" : "bg-blue-50 border-blue-200"}`}
            >
              <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                Insurance Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="insurance-company"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Insurance Company <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={security.insuranceCompany}
                    onValueChange={(value) =>
                      updateSecurityField(secIndex, "insuranceCompany", value)
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      <SelectItem value="bil">
                        Bhutan Insurance Limited
                      </SelectItem>
                      <SelectItem value="rigc">
                        Royal Insurance Corporation
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="policy-no"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Policy No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="policy-no"
                    placeholder="Enter Policy No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.policyNo || ""}
                    onChange={(e) =>
                      updateSecurityField(secIndex, "policyNo", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="insurance-value"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Insurance Value (Nu.){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="insurance-value"
                    type="number"
                    placeholder="Enter Insurance Value"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.insuranceValue || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "insuranceValue",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="insurance-start"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Insurance Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="insurance-start"
                    type="date"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.insuranceStartDate || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "insuranceStartDate",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="insurance-expiry"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Insurance Expiry Date{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="insurance-expiry"
                    type="date"
                    min={today}
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.insuranceExpiryDate || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "insuranceExpiryDate",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
              </div>

              {/* Insurance Security Proof Upload */}
              {renderSecurityProofUpload(security, secIndex)}
            </div>
          )}

          {/* Pension and  Provident Fund*/}
          {security.securityType === "PPF" && (
            <div
              className={`border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm ${secIndex === 0 ? "bg-white" : "bg-blue-50 border-blue-200"}`}
            >
              <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                Pension & Provident Fund Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="ppf-institution"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Institution Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ppf-institution"
                    placeholder="Enter Institution Name"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.ppfInstitution || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "ppfInstitution",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
                <div className="space-y-2.5">
                  <Label
                    htmlFor="ppf-fund-no"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Provident Fund No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ppf-fund-no"
                    placeholder="Enter fund No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.ppfFundNo || ""}
                    onChange={(e) =>
                      updateSecurityField(secIndex, "ppfFundNo", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="ppf-account-no"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Account No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ppf-account-no"
                    placeholder="Enter Account No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.ppfAccountNo || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "ppfAccountNo",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="ppf-value"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Fund Value (Nu.) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ppf-value"
                    type="number"
                    placeholder="Enter Fund Value"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.ppfValue || ""}
                    onChange={(e) =>
                      updateSecurityField(secIndex, "ppfValue", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              {/* PPF Security Proof Upload */}
              {renderSecurityProofUpload(security, secIndex)}
            </div>
          )}

          {/* Share and  Security*/}
          {security.securityType === "Share" && (
            <div
              className={`border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm ${secIndex === 0 ? "bg-white" : "bg-blue-50 border-blue-200"}`}
            >
              <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                Share & Security Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="share-company"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="share-company"
                    placeholder="Enter Company Name"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.shareCompany || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "shareCompany",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="share-CertificateNo"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Share Certificate Folio No{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="share-CertificateNo"
                    type="number"
                    placeholder="Enter Certificate No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.shareCertificateNo || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "shareCertificateNo",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="share-RegistrationNo"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Share Registration No{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="share-Registration-No"
                    type="number"
                    placeholder="Enter Share Registration No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.shareRegistrationNo || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "shareRegistrationNo",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
              </div>

              {/* Share Security Proof Upload */}
              {renderSecurityProofUpload(security, secIndex)}
            </div>
          )}

          {/* Stocks */}
          {security.securityType === "Stocks" && (
            <div
              className={`border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm ${secIndex === 0 ? "bg-white" : "bg-blue-50 border-blue-200"}`}
            >
              <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                Stocks Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="stock-name"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Stock Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="stock-name"
                    placeholder="Enter Stock Name"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.stockName || ""}
                    onChange={(e) =>
                      updateSecurityField(secIndex, "stockName", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="stock-quantity"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="stock-quantity"
                    type="number"
                    placeholder="Enter Quantity"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.stockQuantity || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "stockQuantity",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="stock-value"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Stock Value (Nu.) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="stock-value"
                    type="number"
                    placeholder="Enter Stock Value"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.stockValue || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "stockValue",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
              </div>

              {/* Stocks Security Proof Upload */}
              {renderSecurityProofUpload(security, secIndex)}
            </div>
          )}

          {/* Fixed Deposit Details */}
          {security.securityType === "fd" && (
            <div
              className={`border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm ${secIndex === 0 ? "bg-white" : "bg-blue-50 border-blue-200"}`}
            >
              <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                Fixed Deposit Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="fd-bank"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Bank Name <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={security.fdBank}
                    onValueChange={(value) =>
                      updateSecurityField(secIndex, "fdBank", value)
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {banksOptions.length > 0 ? (
                        banksOptions.map((option, optionIndex) => {
                          const key =
                            option.bank_pk_code ||
                            option.id ||
                            option.code ||
                            option.bank_code ||
                            `bank-${optionIndex}`;
                          const value = String(
                            option.bank_pk_code ||
                              option.id ||
                              option.code ||
                              option.bank_code ||
                              optionIndex,
                          );
                          const label =
                            option.bank_name ||
                            option.name ||
                            option.label ||
                            option.bankName ||
                            option.bank ||
                            "Unknown";

                          return (
                            <SelectItem key={key} value={value}>
                              {label}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="fd-account-no"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Account No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fd-account-no"
                    placeholder="Enter FD Account No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.fdAccountNo || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "fdAccountNo",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="fd-amount"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Deposit Amount (Nu.) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fd-amount"
                    type="number"
                    placeholder="Enter Deposit Amount"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.fdAmount || ""}
                    onChange={(e) =>
                      updateSecurityField(secIndex, "fdAmount", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="fd-maturity"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Maturity Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fd-maturity"
                    type="date"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={security.fdMaturityDate || ""}
                    onChange={(e) =>
                      updateSecurityField(
                        secIndex,
                        "fdMaturityDate",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
              </div>

              {/* Fixed Deposit Security Proof Upload */}
              {renderSecurityProofUpload(security, secIndex)}
            </div>
          )}

          {/* Add Securities Button - shown after each security */}
          {secIndex === securities.length - 1 && (
            <div className="flex justify-center pt-4">
              <Button
                type="button"
                size="lg"
                className="min-w-40 px-10 py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all bg-[#003DA5] hover:bg-[#002D7A]"
                onClick={addSecurity}
              >
                + Add Securities
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Guarantor sections - only show if ANY security has ownership type "third-party" */}
      {securities.some((s) => s.ownershipType === "third-party") && (
        <>
          {/* Render all guarantors */}
          {guarantors.map((guarantor, index) =>
            renderGuarantorForm(guarantor, index),
          )}

          {/* Add Guarantor Button - shown after all guarantors */}
          <div className="flex justify-center pt-4">
            <Button
              type="button"
              size="lg"
              className="min-w-40 px-10 py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all bg-[#003DA5] hover:bg-[#002D7A]"
              onClick={addGuarantor}
            >
              + Add Guarantor
            </Button>
          </div>
        </>
      )}

      <div className="flex justify-between gap-6 pt-6">
        <Button
          type="button"
          onClick={onBack}
          variant="secondary"
          size="lg"
          className="min-w-40 px-10 py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          className="min-w-40 px-10 py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all bg-[#003DA5] hover:bg-[#002D7A]"
        >
          Next
        </Button>
      </div>
    </form>
  );
}
