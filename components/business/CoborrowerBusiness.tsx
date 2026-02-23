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

// Import mapping utility and the Popup component (keep original search features)
import {
  mapCustomerDataToForm,
  getVerifiedCustomerDataFromSession,
} from "@/lib/mapCustomerData";
import DocumentPopup from "@/components/BILSearchStatus"; // Adjust path if needed

import {
  fetchMaritalStatus,
  fetchNationality,
  fetchBanks,
  fetchIdentificationType,
  fetchCountry,
  fetchDzongkhag,
  fetchGewogsByDzongkhag,
  fetchOccupations,
  fetchLegalConstitution,
  fetchPepCategory,
  fetchPepSubCategoryByCategory,
} from "@/services/api";

// ================== Validation Helpers ==================
const isRequired = (value: any) => !value || value.toString().trim() === "";
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidCID = (value: string) => /^\d{11}$/.test(value);
const isValidTPN = (value: string) => /^\d{11}$/.test(value);
const isValidMobile = (value: string) => /^(16|17|77)\d{6}$/.test(value); // Only 8-digit mobile numbers starting with 16,17,77
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
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
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

    // Filter based on allowed pattern
    if (allowed === "numeric") {
      newValue = newValue.replace(/[^0-9]/g, "");
    } else if (allowed === "alpha") {
      // Allow letters, spaces, hyphens, apostrophes (for names)
      newValue = newValue.replace(/[^a-zA-Z\s\-']/g, "");
    } else if (allowed === "alphanumeric") {
      // Allow letters, numbers, spaces, hyphens, underscores
      newValue = newValue.replace(/[^a-zA-Z0-9\s\-_]/g, "");
    }

    // Apply maxLength
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
    }

    // Call original onChange with filtered value
    if (onChange) {
      onChange({ ...e, target: { ...e.target, value: newValue } });
    }
  };

  return (
    <Input
      value={value}
      onChange={handleChange}
      className={className}
      maxLength={maxLength} // also pass to native input for browser hint
      {...props}
    />
  );
};
// ================== END Restricted Input ==================

// Helper to format dates to YYYY-MM-DD for input fields
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

// Initialize empty co-borrower with all required fields
const createEmptyCoBorrower = () => ({
  // Personal Information
  identificationType: "",
  identificationNo: "",
  salutation: "",
  name: "",
  nationality: "",
  gender: "",
  identificationIssueDate: "",
  identificationExpiryDate: "",
  dateOfBirth: "",
  tpn: "",
  relationship: "",
  maritalStatus: "",
  spouseIdentificationNo: "",
  spouseName: "",
  spouseContact: "",
  familyTree: "",
  bankName: "",
  bankAccount: "",
  passportPhoto: "",

  // Permanent Address
  permCountry: "",
  permDzongkhag: "",
  permGewog: "",
  permVillage: "",
  permThram: "",
  permHouse: "",
  permAddressProof: "",

  // Current Address
  currCountry: "",
  currDzongkhag: "",
  currGewog: "",
  currVillage: "",
  currFlat: "",
  currEmail: "",
  currContact: "",
  currAlternateContact: "",
  currAddressProof: "",

  // PEP Declaration
  pepPerson: "",
  pepCategory: "",
  pepSubCategory: "",
  identificationProof: "",
  pepRelated: "",
  relatedPeps: [createEmptyRelatedPep()],

  // Related to BIL
  relatedToBil: "",

  // Employment Status
  employmentStatus: "",

  // Employment Details (if employed)
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

  // Additional fields for married status
  isMarried: false,
  permGewogOptions: [],
  currGewogOptions: [],
  pepSubCategoryOptions: [],
  relatedPepOptionsMap: {},

  // Lookup states
  showLookupPopup: false,
  lookupStatus: "searching" as "searching" | "found" | "not_found",
  fetchedCustomerData: null,
  errors: {},
});

interface CoBorrowerDetailsFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
  formData: any;
}

export function CoborrowerBusiness({
  onNext,
  onBack,
  formData,
}: CoBorrowerDetailsFormProps) {
  // New state to track if co-borrower is applicable
  const [isCoBorrowerApplicable, setIsCoBorrowerApplicable] = useState<string>(
    formData.isCoBorrowerApplicable || "no",
  );

  const [coBorrowers, setCoBorrowers] = useState<any[]>(
    formData.coBorrowers || [createEmptyCoBorrower()],
  );

  // Dropdown States (shared across all co-borrowers)
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([]);
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<
    any[]
  >([]);
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([]);
  const [banksOptions, setBanksOptions] = useState<any[]>([]);
  const [occupationOptions, setOccupationOptions] = useState<any[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<any[]>([]);
  const [pepCategoryOptions, setPepCategoryOptions] = useState<any[]>([]);

  // Calculate date constraints
  const today = new Date().toISOString().split("T")[0];
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
  const maxDobDate = eighteenYearsAgo.toISOString().split("T")[0];

  // --- HELPER: Determine if Married for a specific co-borrower ---
  const getIsMarried = (coBorrower: any) => {
    const status = coBorrower.maritalStatus;
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
    const loadMaritalStatus = async () => {
      try {
        const options = await fetchMaritalStatus();
        setMaritalStatusOptions(options);
      } catch (error) {
        setMaritalStatusOptions([
          { id: "single", name: "Single" },
          { id: "married", name: "Married" },
          { id: "divorced", name: "Divorced" },
          { id: "widowed", name: "Widowed" },
          { id: "unmarried", name: "Unmarried" },
        ]);
      }
    };
    loadMaritalStatus();

    const loadBanks = async () => {
      try {
        const options = await fetchBanks();
        setBanksOptions(options);
      } catch (error) {
        setBanksOptions([
          { id: "bob", name: "Bank of Bhutan" },
          { id: "bnb", name: "Bhutan National Bank" },
        ]);
      }
    };
    loadBanks();

    const loadNationality = async () => {
      try {
        const options = await fetchNationality();
        setNationalityOptions(options);
      } catch (error) {
        setNationalityOptions([
          { id: "bhutanese", name: "Bhutanese" },
          { id: "indian", name: "Indian" },
        ]);
      }
    };
    loadNationality();

    const loadIdentificationType = async () => {
      try {
        const options = await fetchIdentificationType();
        setIdentificationTypeOptions(options);
      } catch (error) {
        setIdentificationTypeOptions([
          { id: "cid", name: "Citizenship ID" },
          { id: "passport", name: "Passport" },
        ]);
      }
    };
    loadIdentificationType();

    const loadCountry = async () => {
      try {
        const options = await fetchCountry();
        setCountryOptions(options);
      } catch (error) {
        setCountryOptions([
          { id: "bhutan", name: "Bhutan" },
          { id: "india", name: "India" },
        ]);
      }
    };
    loadCountry();

    const loadDzongkhag = async () => {
      try {
        const options = await fetchDzongkhag();
        setDzongkhagOptions(options);
      } catch (error) {
        setDzongkhagOptions([
          { id: "thimphu", name: "Thimphu" },
          { id: "paro", name: "Paro" },
        ]);
      }
    };
    loadDzongkhag();

    const loadOccupation = async () => {
      try {
        const options = await fetchOccupations();
        setOccupationOptions(options);
      } catch (error) {
        setOccupationOptions([
          { id: "engineer", name: "Engineer" },
          { id: "teacher", name: "Teacher" },
        ]);
      }
    };
    loadOccupation();

    const loadOrganizations = async () => {
      try {
        const options = await fetchLegalConstitution();
        setOrganizationOptions(options);
      } catch (error) {
        setOrganizationOptions([{ id: "org1", name: "Organization 1" }]);
      }
    };
    loadOrganizations();

    const loadPepCategories = async () => {
      try {
        const options = await fetchPepCategory();
        setPepCategoryOptions(options || []);
      } catch (error) {
        setPepCategoryOptions([]);
      }
    };
    loadPepCategories();
  }, []);

  // Sync with formData when it changes
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      const hasData = Object.values(formData).some((val) => {
        if (typeof val === "string") return val.trim() !== "";
        if (typeof val === "object" && val !== null)
          return Object.keys(val).length > 0;
        return val !== null && val !== undefined;
      });

      if (hasData) {
        if (formData.isCoBorrowerApplicable) {
          setIsCoBorrowerApplicable(formData.isCoBorrowerApplicable);
        }
        if (formData.coBorrowers) {
          setCoBorrowers(formData.coBorrowers);
        }
      }
    }
  }, [formData]);

  // Load permanent gewogs for all co-borrowers
  useEffect(() => {
    const loadPermGewogs = async () => {
      const updatedCoBorrowers = [...coBorrowers];
      let needsUpdate = false;

      for (let i = 0; i < coBorrowers.length; i++) {
        const coBorrower = coBorrowers[i];
        if (coBorrower.permDzongkhag) {
          try {
            const options = await fetchGewogsByDzongkhag(
              coBorrower.permDzongkhag,
            );
            updatedCoBorrowers[i] = {
              ...updatedCoBorrowers[i],
              permGewogOptions: options,
            };
            needsUpdate = true;
          } catch (error) {
            console.error(
              `Failed to load permanent gewogs for co-borrower ${i}:`,
              error,
            );
            updatedCoBorrowers[i] = {
              ...updatedCoBorrowers[i],
              permGewogOptions: [],
            };
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        setCoBorrowers(updatedCoBorrowers);
      }
    };
    loadPermGewogs();
  }, [coBorrowers.map((cb) => cb.permDzongkhag).join(",")]);

  // Load current gewogs for all co-borrowers
  useEffect(() => {
    const loadCurrGewogs = async () => {
      const updatedCoBorrowers = [...coBorrowers];
      let needsUpdate = false;

      for (let i = 0; i < coBorrowers.length; i++) {
        const coBorrower = coBorrowers[i];
        if (coBorrower.currDzongkhag) {
          try {
            const options = await fetchGewogsByDzongkhag(
              coBorrower.currDzongkhag,
            );
            updatedCoBorrowers[i] = {
              ...updatedCoBorrowers[i],
              currGewogOptions: options,
            };
            needsUpdate = true;
          } catch (error) {
            console.error(
              `Failed to load current gewogs for co-borrower ${i}:`,
              error,
            );
            updatedCoBorrowers[i] = {
              ...updatedCoBorrowers[i],
              currGewogOptions: [],
            };
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        setCoBorrowers(updatedCoBorrowers);
      }
    };
    loadCurrGewogs();
  }, [coBorrowers.map((cb) => cb.currDzongkhag).join(",")]);

  // Load PEP sub-categories for SELF PEP
  useEffect(() => {
    const loadPepSubCategories = async () => {
      const updatedCoBorrowers = [...coBorrowers];
      let needsUpdate = false;

      for (let i = 0; i < coBorrowers.length; i++) {
        const coBorrower = coBorrowers[i];
        if (coBorrower.pepPerson === "yes" && coBorrower.pepCategory) {
          try {
            const options = await fetchPepSubCategoryByCategory(
              coBorrower.pepCategory,
            );
            if (!options || options.length === 0) {
              throw new Error("Empty PEP sub-category list");
            }
            updatedCoBorrowers[i] = {
              ...updatedCoBorrowers[i],
              pepSubCategoryOptions: options,
            };
            needsUpdate = true;
          } catch (error) {
            console.error(
              `Failed to load PEP sub-categories for co-borrower ${i}:`,
              error,
            );
            updatedCoBorrowers[i] = {
              ...updatedCoBorrowers[i],
              pepSubCategoryOptions: [],
            };
            needsUpdate = true;
          }
        } else {
          updatedCoBorrowers[i] = {
            ...updatedCoBorrowers[i],
            pepSubCategoryOptions: [],
          };
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        setCoBorrowers(updatedCoBorrowers);
      }
    };
    loadPepSubCategories();
  }, [coBorrowers.map((cb) => `${cb.pepPerson}-${cb.pepCategory}`).join(",")]);

  // Enhanced field validation
  const validateField = (
    fieldName: string,
    value: any,
    fullData?: any,
  ): string => {
    if (!value || value.toString().trim() === "") return "";

    switch (fieldName) {
      case "identificationNo":
      case "spouseIdentificationNo":
        if (!isValidCID(value)) return "CID must be 11 digits";
        break;
      case "tpn":
        if (!isValidTPN(value)) return "TPN must be 11 digits";
        break;
      case "currContact":
      case "spouseContact":
      case "currAlternateContact":
        // Updated to only allow Bhutanese mobile numbers (8 digits starting with 16/17/77)
        if (!isValidMobile(value))
          return "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";
        break;
      case "currEmail":
        if (!isValidEmail(value)) return "Invalid email format";
        break;
      case "dateOfBirth":
        if (!isLegalAge(value))
          return "Applicant must be at least 18 years old";
        break;
    }
    return "";
  };

  // Validate all fields for a co-borrower (used on submit)
  const validateCoBorrower = (
    coBorrower: any,
    index: number,
  ): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // Personal Information
    const personalFields = [
      "identificationType",
      "identificationNo",
      "salutation",
      "name",
      "nationality",
      "gender",
      "identificationIssueDate",
      "identificationExpiryDate",
      "dateOfBirth",
      "tpn",
      "relationship",
      "maritalStatus",
    ];
    personalFields.forEach((field) => {
      if (isRequired(coBorrower[field]))
        newErrors[field] = `${field} is required`;
    });

    // Specific format validations
    if (coBorrower.identificationNo && !isValidCID(coBorrower.identificationNo))
      newErrors.identificationNo = "CID must be 11 digits";

    if (coBorrower.tpn && !isValidTPN(coBorrower.tpn))
      newErrors.tpn = "TPN must be 11 digits";

    if (coBorrower.dateOfBirth && !isLegalAge(coBorrower.dateOfBirth))
      newErrors.dateOfBirth = "Applicant must be at least 18 years old";

    // Spouse fields if married
    if (getIsMarried(coBorrower)) {
      if (isRequired(coBorrower.spouseIdentificationNo))
        newErrors.spouseIdentificationNo = "Spouse CID is required";
      else if (
        coBorrower.spouseIdentificationNo &&
        !isValidCID(coBorrower.spouseIdentificationNo)
      )
        newErrors.spouseIdentificationNo = "CID must be 11 digits";

      if (isRequired(coBorrower.spouseName))
        newErrors.spouseName = "Spouse name is required";

      if (isRequired(coBorrower.spouseContact))
        newErrors.spouseContact = "Spouse contact is required";
      else if (
        coBorrower.spouseContact &&
        !isValidMobile(coBorrower.spouseContact)
      )
        newErrors.spouseContact =
          "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";
    }

    // Bank details
    if (isRequired(coBorrower.bankName))
      newErrors.bankName = "Bank name is required";
    if (isRequired(coBorrower.bankAccount))
      newErrors.bankAccount = "Bank account is required";

    // Passport photo
    if (!coBorrower.passportPhoto)
      newErrors.passportPhoto = "Passport photo is required";

    // Family tree
    if (!coBorrower.familyTree)
      newErrors.familyTree = "Family tree document is required";

    // Permanent Address
    if (isRequired(coBorrower.permCountry))
      newErrors.permCountry = "Country is required";

    const isBhutanPerm = countryOptions.find(
      (c) =>
        String(c.country_pk_code || c.id || c.code) ===
          coBorrower.permCountry &&
        (c.country || c.name || "").toLowerCase().includes("bhutan"),
    );

    if (isBhutanPerm) {
      if (isRequired(coBorrower.permDzongkhag))
        newErrors.permDzongkhag = "Dzongkhag is required";
      if (isRequired(coBorrower.permGewog))
        newErrors.permGewog = "Gewog is required";
      if (isRequired(coBorrower.permVillage))
        newErrors.permVillage = "Village/Street is required";
      if (isRequired(coBorrower.permThram))
        newErrors.permThram = "Thram number is required";
      if (isRequired(coBorrower.permHouse))
        newErrors.permHouse = "House number is required";
    } else {
      if (isRequired(coBorrower.permDzongkhag))
        newErrors.permDzongkhag = "State is required";
      if (isRequired(coBorrower.permGewog))
        newErrors.permGewog = "Province is required";
      if (isRequired(coBorrower.permVillage))
        newErrors.permVillage = "Street name is required";
      if (!coBorrower.permAddressProof)
        newErrors.permAddressProof = "Address proof is required";
    }

    // Current Address
    if (isRequired(coBorrower.currCountry))
      newErrors.currCountry = "Country is required";

    const isBhutanCurr = countryOptions.find(
      (c) =>
        String(c.country_pk_code || c.id || c.code) ===
          coBorrower.currCountry &&
        (c.country || c.name || "").toLowerCase().includes("bhutan"),
    );

    if (isBhutanCurr) {
      if (isRequired(coBorrower.currDzongkhag))
        newErrors.currDzongkhag = "Dzongkhag is required";
      if (isRequired(coBorrower.currGewog))
        newErrors.currGewog = "Gewog is required";
      if (isRequired(coBorrower.currVillage))
        newErrors.currVillage = "Village/Street is required";
      if (isRequired(coBorrower.currFlat))
        newErrors.currFlat = "Flat/House number is required";
    } else {
      if (isRequired(coBorrower.currDzongkhag))
        newErrors.currDzongkhag = "State is required";
      if (isRequired(coBorrower.currGewog))
        newErrors.currGewog = "Province is required";
      if (isRequired(coBorrower.currVillage))
        newErrors.currVillage = "Street name is required";
      if (!coBorrower.currAddressProof)
        newErrors.currAddressProof = "Address proof is required";
    }

    if (isRequired(coBorrower.currEmail))
      newErrors.currEmail = "Email is required";
    else if (coBorrower.currEmail && !isValidEmail(coBorrower.currEmail))
      newErrors.currEmail = "Invalid email format";

    if (isRequired(coBorrower.currContact))
      newErrors.currContact = "Contact number is required";
    else if (coBorrower.currContact && !isValidMobile(coBorrower.currContact))
      newErrors.currContact =
        "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";

    if (
      coBorrower.currAlternateContact &&
      !isValidMobile(coBorrower.currAlternateContact)
    )
      newErrors.currAlternateContact =
        "Enter a valid Bhutanese mobile number (8 digits starting with 16/17/77)";

    // PEP Declaration
    if (isRequired(coBorrower.pepPerson))
      newErrors.pepPerson = "PEP status is required";
    if (coBorrower.pepPerson === "yes") {
      if (isRequired(coBorrower.pepCategory))
        newErrors.pepCategory = "PEP category is required";
      if (isRequired(coBorrower.pepSubCategory))
        newErrors.pepSubCategory = "PEP sub-category is required";
      if (!coBorrower.identificationProof)
        newErrors.identificationProof = "Identification proof is required";
    } else if (coBorrower.pepPerson === "no") {
      if (isRequired(coBorrower.pepRelated))
        newErrors.pepRelated = "Please indicate if related to a PEP";
      if (coBorrower.pepRelated === "yes") {
        (coBorrower.relatedPeps || []).forEach((pep: any, pepIdx: number) => {
          if (isRequired(pep.relationship))
            newErrors[`relatedPeps.${pepIdx}.relationship`] =
              "Relationship is required";
          if (isRequired(pep.identificationNo))
            newErrors[`relatedPeps.${pepIdx}.identificationNo`] =
              "Identification number is required";
          else if (pep.identificationNo && !isValidCID(pep.identificationNo))
            newErrors[`relatedPeps.${pepIdx}.identificationNo`] =
              "Must be 11 digits";
          if (isRequired(pep.category))
            newErrors[`relatedPeps.${pepIdx}.category`] =
              "PEP category is required";
          if (isRequired(pep.subCategory))
            newErrors[`relatedPeps.${pepIdx}.subCategory`] =
              "PEP sub-category is required";
          if (!pep.identificationProof)
            newErrors[`relatedPeps.${pepIdx}.identificationProof`] =
              "Identification proof is required";
        });
      }
    }

    // Related to BIL
    if (isRequired(coBorrower.relatedToBil))
      newErrors.relatedToBil = "Please select an option";

    // Employment
    if (isRequired(coBorrower.employmentStatus))
      newErrors.employmentStatus = "Employment status is required";
    if (coBorrower.employmentStatus === "employed") {
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
        if (isRequired(coBorrower[field]))
          newErrors[field] = `${field} is required`;
      });
      if (coBorrower.serviceNature === "contract") {
        if (isRequired(coBorrower.contractEndDate))
          newErrors.contractEndDate = "Contract end date is required";
      }
    }

    return newErrors;
  };

  const handleFileChange = (
    index: number,
    fieldName: string,
    file: File | null,
  ) => {
    setCoBorrowers((prev) => {
      const updated = [...prev];
      const errors = { ...updated[index].errors };

      if (file) {
        const allowedTypes = [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
        ];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.type)) {
          errors[fieldName] = "Only PDF, JPG, JPEG, and PNG files are allowed";
        } else if (file.size > maxSize) {
          errors[fieldName] = "File size must be less than 5MB";
        } else {
          errors[fieldName] = "";
          updated[index] = {
            ...updated[index],
            [fieldName]: file.name,
          };
        }
      } else {
        errors[fieldName] = "File is required";
      }

      updated[index] = { ...updated[index], errors };
      return updated;
    });
  };

  // --- AUTOMATIC LOOKUP LOGIC (ORIGINAL SEARCH FEATURE) ---
  const handleIdentityCheck = async (index: number) => {
    const coBorrower = coBorrowers[index];
    const idType = coBorrower.identificationType;
    const idNo = coBorrower.identificationNo;

    // Only proceed if both fields are filled
    if (!idType || !idNo || idNo.trim() === "") return;

    setCoBorrowers((prev) => {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result?.success && result?.data) {
        const mappedData = mapCustomerDataToForm(result);
        setCoBorrowers((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            fetchedCustomerData: mappedData,
            lookupStatus: "found",
          };
          return updated;
        });
      } else {
        setCoBorrowers((prev) => {
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
      setCoBorrowers((prev) => {
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

  const handleLookupProceed = (index: number) => {
    const coBorrower = coBorrowers[index];
    if (coBorrower.lookupStatus === "found" && coBorrower.fetchedCustomerData) {
      const sanitizedData = {
        ...coBorrower.fetchedCustomerData,
        identificationIssueDate: formatDateForInput(
          coBorrower.fetchedCustomerData.identificationIssueDate,
        ),
        identificationExpiryDate: formatDateForInput(
          coBorrower.fetchedCustomerData.identificationExpiryDate,
        ),
        dateOfBirth: formatDateForInput(
          coBorrower.fetchedCustomerData.dateOfBirth,
        ),

        nationality: coBorrower.fetchedCustomerData.nationality
          ? String(coBorrower.fetchedCustomerData.nationality)
          : "",
        permCountry: coBorrower.fetchedCustomerData.permCountry
          ? String(coBorrower.fetchedCustomerData.permCountry)
          : "",
        permDzongkhag: coBorrower.fetchedCustomerData.permDzongkhag
          ? String(coBorrower.fetchedCustomerData.permDzongkhag)
          : "",
        permGewog: coBorrower.fetchedCustomerData.permGewog
          ? String(coBorrower.fetchedCustomerData.permGewog)
          : "",
        currCountry: coBorrower.fetchedCustomerData.currCountry
          ? String(coBorrower.fetchedCustomerData.currCountry)
          : "",
        currDzongkhag: coBorrower.fetchedCustomerData.currDzongkhag
          ? String(coBorrower.fetchedCustomerData.currDzongkhag)
          : "",
        currGewog: coBorrower.fetchedCustomerData.currGewog
          ? String(coBorrower.fetchedCustomerData.currGewog)
          : "",
        maritalStatus: coBorrower.fetchedCustomerData.maritalStatus
          ? String(coBorrower.fetchedCustomerData.maritalStatus)
          : "",
        occupation: coBorrower.fetchedCustomerData.occupation
          ? String(coBorrower.fetchedCustomerData.occupation)
          : "",
      };

      setCoBorrowers((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...prev[index],
          ...sanitizedData,
          identificationType: prev[index].identificationType,
          identificationNo: prev[index].identificationNo,
          relatedPeps: prev[index].relatedPeps || [createEmptyRelatedPep()],
          showLookupPopup: false,
        };
        return updated;
      });
    } else {
      setCoBorrowers((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          showLookupPopup: false,
        };
        return updated;
      });
    }
  };

  // --- HANDLERS FOR MULTIPLE PEP DECLARATIONS ---
  const handleAddRelatedPep = (index: number) => {
    setCoBorrowers((prev) => {
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

  const handleRemoveRelatedPep = (index: number, pepIndex: number) => {
    setCoBorrowers((prev) => {
      const updated = [...prev];
      const updatedPeps = (updated[index].relatedPeps || []).filter(
        (_: any, i: number) => i !== pepIndex,
      );

      // Cleanup options map and errors
      const newOptionsMap: Record<number, any[]> = {
        ...updated[index].relatedPepOptionsMap,
      };
      Object.keys(newOptionsMap).forEach((key) => {
        const keyNum = parseInt(key);
        if (keyNum > pepIndex) {
          newOptionsMap[keyNum - 1] = newOptionsMap[keyNum];
          delete newOptionsMap[keyNum];
        }
      });

      const errors = { ...updated[index].errors };
      // Remove errors for removed pep
      Object.keys(errors).forEach((key) => {
        if (key.startsWith(`relatedPeps.${pepIndex}`)) {
          delete errors[key];
        }
      });

      updated[index] = {
        ...updated[index],
        relatedPeps: updatedPeps,
        relatedPepOptionsMap: newOptionsMap,
        errors,
      };
      return updated;
    });
  };

  const handleRelatedPepChange = async (
    coBorrowerIndex: number,
    pepIndex: number,
    field: string,
    value: string,
  ) => {
    setCoBorrowers((prev) => {
      const updated = [...prev];
      const updatedPeps = [...(updated[coBorrowerIndex].relatedPeps || [])];
      if (!updatedPeps[pepIndex]) {
        updatedPeps[pepIndex] = createEmptyRelatedPep();
      }

      updatedPeps[pepIndex] = { ...updatedPeps[pepIndex], [field]: value };

      // Clear error for this field
      const errors = { ...updated[coBorrowerIndex].errors };
      const errorKey = `relatedPeps.${pepIndex}.${field}`;
      delete errors[errorKey];

      // Special logic for Category change -> Fetch Sub Categories
      if (field === "category") {
        updatedPeps[pepIndex].subCategory = ""; // Clear sub category
        fetchPepSubCategoryByCategory(value)
          .then((options) => {
            setCoBorrowers((current) => {
              const currentUpdated = [...current];
              currentUpdated[coBorrowerIndex] = {
                ...currentUpdated[coBorrowerIndex],
                relatedPepOptionsMap: {
                  ...currentUpdated[coBorrowerIndex].relatedPepOptionsMap,
                  [pepIndex]: options || [],
                },
              };
              return currentUpdated;
            });
          })
          .catch((e) => {
            console.error("Failed to fetch PEP sub-categories:", e);
            setCoBorrowers((current) => {
              const currentUpdated = [...current];
              currentUpdated[coBorrowerIndex] = {
                ...currentUpdated[coBorrowerIndex],
                relatedPepOptionsMap: {
                  ...currentUpdated[coBorrowerIndex].relatedPepOptionsMap,
                  [pepIndex]: [],
                },
              };
              return currentUpdated;
            });
          });
      }

      updated[coBorrowerIndex] = {
        ...updated[coBorrowerIndex],
        relatedPeps: updatedPeps,
        errors,
      };
      return updated;
    });
  };

  const handleRelatedPepFileChange = (
    coBorrowerIndex: number,
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

      if (!allowedTypes.includes(file.type) || file.size > maxSize) return;

      setCoBorrowers((prev) => {
        const updated = [...prev];
        const updatedPeps = [...(updated[coBorrowerIndex].relatedPeps || [])];
        if (!updatedPeps[pepIndex]) {
          updatedPeps[pepIndex] = createEmptyRelatedPep();
        }

        updatedPeps[pepIndex] = {
          ...updatedPeps[pepIndex],
          identificationProof: file.name,
        };
        updated[coBorrowerIndex] = {
          ...updated[coBorrowerIndex],
          relatedPeps: updatedPeps,
        };
        return updated;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If co-borrower is not applicable, simply proceed to next step
    if (isCoBorrowerApplicable === "no") {
      onNext({
        isCoBorrowerApplicable: "no",
        coBorrowers: [],
      });
      return;
    }

    // Validate all co-borrowers
    const validatedCoBorrowers = coBorrowers.map((coBorrower, idx) => {
      const fieldErrors = validateCoBorrower(coBorrower, idx);
      return {
        ...coBorrower,
        errors: fieldErrors,
        isMarried: getIsMarried(coBorrower),
      };
    });

    setCoBorrowers(validatedCoBorrowers);

    // Check if there are any errors
    const hasErrors = validatedCoBorrowers.some((coBorrower) =>
      Object.values(coBorrower.errors || {}).some(
        (error) => error && error !== "",
      ),
    );

    if (!hasErrors) {
      onNext({
        isCoBorrowerApplicable: "yes",
        coBorrowers: validatedCoBorrowers.map(({ errors, ...rest }) => rest),
      });
    } else {
      alert("Please fix the errors before proceeding.");
    }
  };

  const addCoBorrower = () => {
    setCoBorrowers([...coBorrowers, createEmptyCoBorrower()]);
  };

  const removeCoBorrower = (index: number) => {
    if (index === 0 && coBorrowers.length === 1) {
      return;
    }
    const updatedCoBorrowers = coBorrowers.filter((_, i) => i !== index);
    setCoBorrowers(updatedCoBorrowers);
  };

  const updateCoBorrowerField = (index: number, field: string, value: any) => {
    setCoBorrowers((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
        ...(field === "pepPerson" && value === "yes" ? { pepRelated: "" } : {}),
        ...(field === "pepPerson" && value === "no"
          ? {
              pepCategory: "",
              pepSubCategory: "",
              identificationProof: "",
            }
          : {}),
        ...(field === "pepRelated" && value === "no"
          ? { relatedPeps: [] }
          : {}),
        ...(field === "maritalStatus"
          ? {
              isMarried: getIsMarried({
                ...updated[index],
                maritalStatus: value,
              }),
            }
          : {}),
      };
      // Clear error for this field
      const errors = { ...updated[index].errors };
      delete errors[field];
      updated[index].errors = errors;
      return updated;
    });
  };

  // Real-time validation on blur
  const handleBlurField = (index: number, field: string, value: any) => {
    const errorMsg = validateField(field, value);
    if (errorMsg) {
      setCoBorrowers((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          errors: { ...updated[index].errors, [field]: errorMsg },
        };
        return updated;
      });
    }
  };

  // Render a single co-borrower form section
  const renderCoBorrowerForm = (coBorrower: any, index: number) => {
    const isMarried = getIsMarried(coBorrower);
    const relatedPeps = coBorrower.relatedPeps || [createEmptyRelatedPep()];
    const errors = coBorrower.errors || {};

    const isBhutanPerm = countryOptions.find(
      (c) =>
        String(c.country_pk_code || c.id || c.code) ===
          coBorrower.permCountry &&
        (c.country || c.name || "").toLowerCase().includes("bhutan"),
    );

    const isBhutanCurr = countryOptions.find(
      (c) =>
        String(c.country_pk_code || c.id || c.code) ===
          coBorrower.currCountry &&
        (c.country || c.name || "").toLowerCase().includes("bhutan"),
    );

    return (
      <div
        key={index}
        className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-md hover:shadow-lg transition-shadow duration-200 mb-8"
      >
        {/* Co-Borrower Header */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-[#003DA5]">
            {index === 0
              ? "Primary Co-Borrower"
              : `Additional Co-Borrower ${index}`}
          </h2>
          {index > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeCoBorrower(index)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Remove Co-Borrower
            </Button>
          )}
        </div>

        {/* Search Status Popup for this co-borrower (ORIGINAL SEARCH FEATURE) */}
        {coBorrower.showLookupPopup && (
          <DocumentPopup
            open={coBorrower.showLookupPopup}
            onOpenChange={(open) => {
              if (!open) {
                setCoBorrowers((prev) => {
                  const updated = [...prev];
                  updated[index] = {
                    ...updated[index],
                    showLookupPopup: false,
                  };
                  return updated;
                });
              }
            }}
            searchStatus={coBorrower.lookupStatus}
            onProceed={() => handleLookupProceed(index)}
          />
        )}

        {/* Co-Borrower Personal Information */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
            Personal Information
          </h3>

          {/* Identification Fields Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor={`co-identificationType-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Identification Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={coBorrower.identificationType}
                onValueChange={(value) => {
                  updateCoBorrowerField(index, "identificationType", value);
                }}
              >
                <SelectTrigger
                  className={getFieldStyle(!!errors.identificationType)}
                >
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  {identificationTypeOptions.length > 0 ? (
                    identificationTypeOptions.map((option, optionIndex) => {
                      const key =
                        option.identity_type_pk_code ||
                        option.id ||
                        `id-${optionIndex}`;
                      const value = String(
                        option.identity_type_pk_code ||
                          option.id ||
                          optionIndex,
                      );
                      const label =
                        option.identity_type || option.name || "Unknown";
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
              {errors.identificationType && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.identificationType}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`co-identificationNo-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Identification No. <span className="text-destructive">*</span>
              </Label>
              <RestrictedInput
                allowed="numeric"
                maxLength={11}
                id={`co-identificationNo-${index}`}
                placeholder="Enter identification No"
                className={getFieldStyle(!!errors.identificationNo)}
                value={coBorrower.identificationNo || ""}
                onChange={(e) =>
                  updateCoBorrowerField(
                    index,
                    "identificationNo",
                    e.target.value,
                  )
                }
                onBlur={() => handleIdentityCheck(index)} // ORIGINAL SEARCH TRIGGER
              />
              {errors.identificationNo && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.identificationNo}
                </p>
              )}
            </div>
          </div>

          {/* Secondary Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor={`co-salutation-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Salutation <span className="text-destructive">*</span>
              </Label>
              <Select
                value={coBorrower.salutation}
                onValueChange={(value) =>
                  updateCoBorrowerField(index, "salutation", value)
                }
              >
                <SelectTrigger className={getFieldStyle(!!errors.salutation)}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
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

            <div className="space-y-2.5">
              <Label
                htmlFor={`co-name-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Co-Borrower Name <span className="text-destructive">*</span>
              </Label>
              <RestrictedInput
                allowed="alpha"
                id={`co-name-${index}`}
                placeholder="Enter Full Name"
                className={getFieldStyle(!!errors.name)}
                value={coBorrower.name || ""}
                onChange={(e) =>
                  updateCoBorrowerField(index, "name", e.target.value)
                }
                onBlur={(e) => handleBlurField(index, "name", e.target.value)}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`co-nationality-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Nationality <span className="text-destructive">*</span>
              </Label>
              <Select
                value={
                  coBorrower.nationality ? String(coBorrower.nationality) : ""
                }
                onValueChange={(value) =>
                  updateCoBorrowerField(index, "nationality", value)
                }
              >
                <SelectTrigger className={getFieldStyle(!!errors.nationality)}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  {nationalityOptions.length > 0 ? (
                    nationalityOptions.map((option, optionIndex) => {
                      const key =
                        option.nationality_pk_code ||
                        option.id ||
                        `nationality-${optionIndex}`;
                      const value = String(
                        option.nationality_pk_code || option.id || optionIndex,
                      );
                      const label =
                        option.nationality || option.name || "Unknown";
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

            <div className="space-y-2.5">
              <Label
                htmlFor={`co-gender-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Gender <span className="text-destructive">*</span>
              </Label>
              <Select
                value={coBorrower.gender}
                onValueChange={(value) =>
                  updateCoBorrowerField(index, "gender", value)
                }
              >
                <SelectTrigger className={getFieldStyle(!!errors.gender)}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-xs text-red-500 mt-1">{errors.gender}</p>
              )}
            </div>
          </div>

          {/* Dates and TPN Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor={`co-identificationIssueDate-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Identification Issue Date
                <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                id={`co-identificationIssueDate-${index}`}
                className={getFieldStyle(!!errors.identificationIssueDate)}
                value={formatDateForInput(coBorrower.identificationIssueDate)}
                onChange={(e) =>
                  updateCoBorrowerField(
                    index,
                    "identificationIssueDate",
                    e.target.value,
                  )
                }
              />
              {errors.identificationIssueDate && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.identificationIssueDate}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`co-identificationExpiryDate-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Identification Expiry Date{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                id={`co-identificationExpiryDate-${index}`}
                className={getFieldStyle(!!errors.identificationExpiryDate)}
                value={formatDateForInput(coBorrower.identificationExpiryDate)}
                onChange={(e) =>
                  updateCoBorrowerField(
                    index,
                    "identificationExpiryDate",
                    e.target.value,
                  )
                }
              />
              {errors.identificationExpiryDate && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.identificationExpiryDate}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`co-dateOfBirth-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                id={`co-dateOfBirth-${index}`}
                className={getFieldStyle(!!errors.dateOfBirth)}
                value={formatDateForInput(coBorrower.dateOfBirth)}
                onChange={(e) =>
                  updateCoBorrowerField(index, "dateOfBirth", e.target.value)
                }
                max={maxDobDate}
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.dateOfBirth}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`co-tpn-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                TPN No <span className="text-destructive">*</span>
              </Label>
              <RestrictedInput
                allowed="numeric"
                maxLength={11}
                id={`co-tpn-${index}`}
                placeholder="Enter TPN"
                className={getFieldStyle(!!errors.tpn)}
                value={coBorrower.tpn || ""}
                onChange={(e) =>
                  updateCoBorrowerField(index, "tpn", e.target.value)
                }
                onBlur={(e) => handleBlurField(index, "tpn", e.target.value)}
              />
              {errors.tpn && (
                <p className="text-xs text-red-500 mt-1">{errors.tpn}</p>
              )}
            </div>
          </div>

          {/* Final Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor={`co-relationship-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Relationship to Borrower{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={coBorrower.relationship}
                onValueChange={(value) =>
                  updateCoBorrowerField(index, "relationship", value)
                }
              >
                <SelectTrigger className={getFieldStyle(!!errors.relationship)}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.relationship && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.relationship}
                </p>
              )}
            </div>
            <div className="space-y-2.5">
              <Label
                htmlFor={`maritalStatus-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Marital Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={coBorrower.maritalStatus}
                onValueChange={(value) =>
                  updateCoBorrowerField(index, "maritalStatus", value)
                }
              >
                <SelectTrigger
                  className={getFieldStyle(!!errors.maritalStatus)}
                >
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {maritalStatusOptions.length > 0 ? (
                    maritalStatusOptions.map((option, optionIndex) => {
                      const key =
                        option.marital_status_pk_code ||
                        option.id ||
                        option.value ||
                        option.code ||
                        `marital-${optionIndex}`;
                      const value = String(
                        option.marital_status_pk_code ||
                          option.id ||
                          option.value ||
                          option.code ||
                          optionIndex,
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
            <div className="mt-8 border-t pt-8">
              <h3 className="text-lg font-bold text-[#003DA5] mb-4">
                Spouse Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label
                    htmlFor={`spouseIdentificationNo-${index}`}
                    className="text-gray-800 font-semibold text-xs sm:text-sm"
                  >
                    Spouse CID/ID No. <span className="text-red-500">*</span>
                  </Label>
                  <RestrictedInput
                    allowed="numeric"
                    maxLength={11}
                    id={`spouseIdentificationNo-${index}`}
                    placeholder="Enter Spouse CID/ID"
                    className={getFieldStyle(!!errors.spouseIdentificationNo)}
                    value={coBorrower.spouseIdentificationNo || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
                        index,
                        "spouseIdentificationNo",
                        e.target.value,
                      )
                    }
                    onBlur={(e) =>
                      handleBlurField(
                        index,
                        "spouseIdentificationNo",
                        e.target.value,
                      )
                    }
                  />
                  {errors.spouseIdentificationNo && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.spouseIdentificationNo}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label
                    htmlFor={`spouseName-${index}`}
                    className="text-gray-800 font-semibold text-xs sm:text-sm"
                  >
                    Spouse Name <span className="text-red-500">*</span>
                  </Label>
                  <RestrictedInput
                    allowed="alpha"
                    id={`spouseName-${index}`}
                    placeholder="Enter Spouse Full Name"
                    className={getFieldStyle(!!errors.spouseName)}
                    value={coBorrower.spouseName || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(index, "spouseName", e.target.value)
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
                    htmlFor={`spouseContact-${index}`}
                    className="text-gray-800 font-semibold text-xs sm:text-sm"
                  >
                    Spouse Contact No. <span className="text-red-500">*</span>
                  </Label>
                  <RestrictedInput
                    allowed="numeric"
                    maxLength={8}
                    id={`spouseContact-${index}`}
                    placeholder="Enter Contact Number"
                    className={getFieldStyle(!!errors.spouseContact)}
                    value={coBorrower.spouseContact || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
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
            <div className="space-y-2.5">
              <Label
                htmlFor={`uploadFamilyTree-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Upload Family Tree <span className="text-red-500">*</span>
              </Label>
              <div
                className={fileUploadStyle(!!errors.familyTree)}
                onClick={() =>
                  document.getElementById(`uploadFamilyTree-${index}`)?.click()
                }
              >
                <span className="text-gray-500 truncate">
                  {coBorrower.familyTree || "No file chosen"}
                </span>
                <Upload className="h-4 w-4 text-[#003DA5]" />
              </div>
              <input
                type="file"
                id={`uploadFamilyTree-${index}`}
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
            <div className="space-y-2.5">
              <Label
                htmlFor={`bankName-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Name of Bank <span className="text-red-500">*</span>
              </Label>
              <Select
                value={coBorrower.bankName}
                onValueChange={(value) =>
                  updateCoBorrowerField(index, "bankName", value)
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
            <div className="space-y-2.5">
              <Label
                htmlFor={`bankAccount-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Bank Saving Account No <span className="text-red-500">*</span>
              </Label>
              <RestrictedInput
                allowed="alphanumeric"
                id={`bankAccount-${index}`}
                placeholder="Enter saving account number"
                className={getFieldStyle(!!errors.bankAccount)}
                value={coBorrower.bankAccount || ""}
                onChange={(e) =>
                  updateCoBorrowerField(index, "bankAccount", e.target.value)
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

          <div className="space-y-2.5">
            <Label
              htmlFor={`uploadPassport-${index}`}
              className="text-gray-800 font-semibold text-sm"
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
                {coBorrower.passportPhoto || "No file chosen"}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor={`permCountry-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Country <span className="text-red-500">*</span>
              </Label>
              <Select
                value={coBorrower.permCountry}
                onValueChange={(value) =>
                  updateCoBorrowerField(index, "permCountry", value)
                }
              >
                <SelectTrigger className={getFieldStyle(!!errors.permCountry)}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {countryOptions.length > 0 ? (
                    countryOptions.map((option, optionIndex) => {
                      const key =
                        option.country_pk_code ||
                        option.id ||
                        option.code ||
                        `perm-country-${optionIndex}`;
                      const value = String(
                        option.country_pk_code ||
                          option.id ||
                          option.code ||
                          optionIndex,
                      );
                      const label =
                        option.country ||
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
              {errors.permCountry && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.permCountry}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`permDzongkhag-${index}`}
                className="text-gray-800 font-semibold text-sm"
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
                  value={coBorrower.permDzongkhag || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "permDzongkhag",
                      e.target.value,
                    )
                  }
                  onBlur={(e) =>
                    handleBlurField(index, "permDzongkhag", e.target.value)
                  }
                />
              ) : (
                <Select
                  value={coBorrower.permDzongkhag || ""}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "permDzongkhag", value)
                  }
                  disabled={!coBorrower.permCountry}
                >
                  <SelectTrigger
                    className={getFieldStyle(!!errors.permDzongkhag)}
                  >
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {dzongkhagOptions.length > 0 ? (
                      dzongkhagOptions.map((option, optionIndex) => {
                        const key =
                          option.dzongkhag_pk_code ||
                          option.id ||
                          option.code ||
                          `perm-dzo-${optionIndex}`;
                        const value = String(
                          option.dzongkhag_pk_code ||
                            option.id ||
                            option.code ||
                            optionIndex,
                        );
                        const label =
                          option.dzongkhag ||
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
              )}
              {errors.permDzongkhag && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.permDzongkhag}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`permGewog-${index}`}
                className="text-gray-800 font-semibold text-sm"
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
                  value={coBorrower.permGewog || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "permGewog", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlurField(index, "permGewog", e.target.value)
                  }
                />
              ) : (
                <Select
                  value={coBorrower.permGewog}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "permGewog", value)
                  }
                  disabled={!coBorrower.permDzongkhag}
                >
                  <SelectTrigger className={getFieldStyle(!!errors.permGewog)}>
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {coBorrower.permGewogOptions?.length > 0 ? (
                      coBorrower.permGewogOptions.map(
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
                        {coBorrower.permDzongkhag
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

            <div className="space-y-2.5">
              <Label
                htmlFor={`permVillage-${index}`}
                className="text-gray-800 font-semibold text-sm"
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
                value={coBorrower.permVillage || ""}
                onChange={(e) =>
                  updateCoBorrowerField(index, "permVillage", e.target.value)
                }
                disabled={!coBorrower.permCountry}
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
          </div>

          {/* Conditional grid - show Thram and House only for Bhutan */}
          {isBhutanPerm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor={`permThram-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Thram No. <span className="text-red-500">*</span>
                </Label>
                <RestrictedInput
                  allowed="alphanumeric"
                  id={`permThram-${index}`}
                  placeholder="Enter Thram No"
                  className={getFieldStyle(!!errors.permThram)}
                  value={coBorrower.permThram || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "permThram", e.target.value)
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

              <div className="space-y-2.5">
                <Label
                  htmlFor={`permHouse-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  House No. <span className="text-red-500">*</span>
                </Label>
                <RestrictedInput
                  allowed="alphanumeric"
                  id={`permHouse-${index}`}
                  placeholder="Enter House No"
                  className={getFieldStyle(!!errors.permHouse)}
                  value={coBorrower.permHouse || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "permHouse", e.target.value)
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
            </div>
          )}

          {/* Document Upload for Non-Bhutan Countries */}
          {!isBhutanPerm && coBorrower.permCountry && (
            <div className="space-y-2.5 border-t pt-4">
              <Label
                htmlFor={`permAddressProof-${index}`}
                className="text-gray-800 font-semibold text-sm"
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
                  {coBorrower.permAddressProof || "No file chosen"}
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
              <p className="text-xs text-gray-500">
                Please upload a valid address proof document for non-Bhutan
                residence. Allowed: PDF, JPG, PNG (Max 5MB)
              </p>
            </div>
          )}
        </div>

        {/* Current/Residential Address */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm mt-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
            Current/Residential Address
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor={`currCountry-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Country of Resident <span className="text-red-500">*</span>
              </Label>
              <Select
                value={coBorrower.currCountry}
                onValueChange={(value) =>
                  updateCoBorrowerField(index, "currCountry", value)
                }
              >
                <SelectTrigger className={getFieldStyle(!!errors.currCountry)}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {countryOptions.length > 0 ? (
                    countryOptions.map((option, optionIndex) => {
                      const key =
                        option.country_pk_code ||
                        option.id ||
                        option.code ||
                        `curr-country-${optionIndex}`;
                      const value = String(
                        option.country_pk_code ||
                          option.id ||
                          option.code ||
                          optionIndex,
                      );
                      const label =
                        option.country ||
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
              {errors.currCountry && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.currCountry}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`currDzongkhag-${index}`}
                className="text-gray-800 font-semibold text-sm"
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
                  value={coBorrower.currDzongkhag || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "currDzongkhag",
                      e.target.value,
                    )
                  }
                  onBlur={(e) =>
                    handleBlurField(index, "currDzongkhag", e.target.value)
                  }
                />
              ) : (
                <Select
                  value={coBorrower.currDzongkhag}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "currDzongkhag", value)
                  }
                  disabled={!coBorrower.currCountry}
                >
                  <SelectTrigger
                    className={getFieldStyle(!!errors.currDzongkhag)}
                  >
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {dzongkhagOptions.length > 0 ? (
                      dzongkhagOptions.map((option, optionIndex) => {
                        const key =
                          option.dzongkhag_pk_code ||
                          option.id ||
                          option.code ||
                          `curr-dzo-${optionIndex}`;
                        const value = String(
                          option.dzongkhag_pk_code ||
                            option.id ||
                            option.code ||
                            optionIndex,
                        );
                        const label =
                          option.dzongkhag ||
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
              )}
              {errors.currDzongkhag && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.currDzongkhag}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`currGewog-${index}`}
                className="text-gray-800 font-semibold text-sm"
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
                  value={coBorrower.currGewog || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "currGewog", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlurField(index, "currGewog", e.target.value)
                  }
                />
              ) : (
                <Select
                  value={coBorrower.currGewog}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "currGewog", value)
                  }
                  disabled={!coBorrower.currDzongkhag}
                >
                  <SelectTrigger className={getFieldStyle(!!errors.currGewog)}>
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {coBorrower.currGewogOptions?.length > 0 ? (
                      coBorrower.currGewogOptions.map(
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
                        {coBorrower.currDzongkhag
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

            <div className="space-y-2.5">
              <Label
                htmlFor={`currVillage-${index}`}
                className="text-gray-800 font-semibold text-sm"
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
                value={coBorrower.currVillage || ""}
                onChange={(e) =>
                  updateCoBorrowerField(index, "currVillage", e.target.value)
                }
                disabled={!coBorrower.currCountry}
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
          </div>

          {/* Conditional grid layout based on country */}
          {isBhutanCurr ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor={`currFlat-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  House/Building/ Flat No{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <RestrictedInput
                  allowed="alphanumeric"
                  id={`currFlat-${index}`}
                  placeholder="Enter Flat No"
                  className={getFieldStyle(!!errors.currFlat)}
                  value={coBorrower.currFlat || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "currFlat", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlurField(index, "currFlat", e.target.value)
                  }
                />
                {errors.currFlat && (
                  <p className="text-xs text-red-500 mt-1">{errors.currFlat}</p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`currEmail-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  id={`currEmail-${index}`}
                  placeholder="Enter Your Email"
                  className={getFieldStyle(!!errors.currEmail)}
                  value={coBorrower.currEmail || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "currEmail", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlurField(index, "currEmail", e.target.value)
                  }
                />
                {errors.currEmail && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.currEmail}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`currContact-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Contact Number <span className="text-red-500">*</span>
                </Label>
                <RestrictedInput
                  allowed="numeric"
                  maxLength={8}
                  id={`currContact-${index}`}
                  placeholder="Enter Contact No"
                  className={getFieldStyle(!!errors.currContact)}
                  value={coBorrower.currContact || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "currContact", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlurField(index, "currContact", e.target.value)
                  }
                />
                {errors.currContact && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.currContact}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`currAlternateContact-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Alternate Contact No
                </Label>
                <RestrictedInput
                  allowed="numeric"
                  maxLength={8}
                  id={`currAlternateContact-${index}`}
                  placeholder="Enter Contact No"
                  className={getFieldStyle(!!errors.currAlternateContact)}
                  value={coBorrower.currAlternateContact || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
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
          ) : (
            coBorrower.currCountry && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <Label
                      htmlFor={`currEmail-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      id={`currEmail-${index}`}
                      placeholder="Enter Your Email"
                      className={getFieldStyle(!!errors.currEmail)}
                      value={coBorrower.currEmail || ""}
                      onChange={(e) =>
                        updateCoBorrowerField(
                          index,
                          "currEmail",
                          e.target.value,
                        )
                      }
                      onBlur={(e) =>
                        handleBlurField(index, "currEmail", e.target.value)
                      }
                    />
                    {errors.currEmail && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.currEmail}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label
                      htmlFor={`currContact-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Contact Number <span className="text-red-500">*</span>
                    </Label>
                    <RestrictedInput
                      allowed="numeric"
                      maxLength={8}
                      id={`currContact-${index}`}
                      placeholder="Enter Contact No"
                      className={getFieldStyle(!!errors.currContact)}
                      value={coBorrower.currContact || ""}
                      onChange={(e) =>
                        updateCoBorrowerField(
                          index,
                          "currContact",
                          e.target.value,
                        )
                      }
                      onBlur={(e) =>
                        handleBlurField(index, "currContact", e.target.value)
                      }
                    />
                    {errors.currContact && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.currContact}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label
                      htmlFor={`currAlternateContact-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Alternate Contact No
                    </Label>
                    <RestrictedInput
                      allowed="numeric"
                      maxLength={8}
                      id={`currAlternateContact-${index}`}
                      placeholder="Enter Contact No"
                      className={getFieldStyle(!!errors.currAlternateContact)}
                      value={coBorrower.currAlternateContact || ""}
                      onChange={(e) =>
                        updateCoBorrowerField(
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

                {/* Document Upload for Non-Bhutan Countries */}
                <div className="space-y-2.5 border-t pt-4">
                  <Label
                    htmlFor={`currAddressProof-${index}`}
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Upload Address Proof Document{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div
                    className={fileUploadStyle(!!errors.currAddressProof)}
                    onClick={() =>
                      document
                        .getElementById(`currAddressProof-${index}`)
                        ?.click()
                    }
                  >
                    <span className="text-gray-500 truncate">
                      {coBorrower.currAddressProof || "No file chosen"}
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
                  <p className="text-xs text-gray-500">
                    Please upload a valid address proof document for non-Bhutan
                    residence. Allowed: PDF, JPG, PNG (Max 5MB)
                  </p>
                </div>
              </>
            )
          )}
        </div>

        {/* PEP Declaration */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm mt-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
            PEP Declaration
          </h2>

          {/* SELF PEP Question */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 border-b pb-6">
            <div className="space-y-2.5">
              <Label
                htmlFor={`pepPerson-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Politically Exposed Person
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={coBorrower.pepPerson}
                onValueChange={(value) =>
                  updateCoBorrowerField(index, "pepPerson", value)
                }
              >
                <SelectTrigger className={getFieldStyle(!!errors.pepPerson)}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              {errors.pepPerson && (
                <p className="text-xs text-red-500 mt-1">{errors.pepPerson}</p>
              )}
            </div>

            {coBorrower.pepPerson === "yes" && (
              <>
                <div className="space-y-2.5">
                  <Label
                    htmlFor={`pepCategory-${index}`}
                    className="text-gray-800 font-semibold text-sm"
                  >
                    PEP Category<span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={coBorrower.pepCategory}
                    onValueChange={(value) =>
                      updateCoBorrowerField(index, "pepCategory", value)
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

                <div className="space-y-2.5">
                  <Label
                    htmlFor={`pepSubCategory-${index}`}
                    className="text-gray-800 font-semibold text-sm"
                  >
                    PEP Sub Category<span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={coBorrower.pepSubCategory}
                    onValueChange={(value) =>
                      updateCoBorrowerField(index, "pepSubCategory", value)
                    }
                    disabled={!coBorrower.pepCategory}
                  >
                    <SelectTrigger
                      className={getFieldStyle(!!errors.pepSubCategory)}
                    >
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {coBorrower.pepSubCategoryOptions?.length > 0 ? (
                        coBorrower.pepSubCategoryOptions.map(
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
                          {coBorrower.pepCategory
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

                <div className="space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-sm">
                    Upload Identification Proof{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div
                    className={fileUploadStyle(!!errors.identificationProof)}
                    onClick={() =>
                      document.getElementById(`selfPepProof-${index}`)?.click()
                    }
                  >
                    <span className="text-gray-500 truncate">
                      {coBorrower.identificationProof || "No file chosen"}
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
                        "identificationProof",
                        e.target.files?.[0] || null,
                      )
                    }
                  />
                  {errors.identificationProof && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.identificationProof}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* RELATED PEP Question */}
          {coBorrower.pepPerson === "no" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pt-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor={`pepRelated-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Are you related to any PEP?
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={coBorrower.pepRelated}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "pepRelated", value)
                  }
                >
                  <SelectTrigger className={getFieldStyle(!!errors.pepRelated)}>
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                {errors.pepRelated && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.pepRelated}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* RELATED PEP MULTIPLE ENTRIES */}
          {coBorrower.pepPerson === "no" && coBorrower.pepRelated === "yes" && (
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

                  {/* Grid Container for Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-2 items-start">
                    {/* 1. Relationship Field */}
                    <div className="space-y-2.5 w-full">
                      <Label className="text-gray-800 font-semibold text-sm block h-5">
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

                    {/* 2. Identification No Field */}
                    <div className="space-y-2.5 w-full">
                      <Label className="text-gray-800 font-semibold text-sm block h-5">
                        Identification No.{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <RestrictedInput
                        allowed="numeric"
                        maxLength={11}
                        placeholder="Enter ID No"
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

                    {/* 3. PEP Category Field */}
                    <div className="space-y-2.5 w-full">
                      <Label className="text-gray-800 font-semibold text-sm block h-5">
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

                    {/* 4. PEP Sub Category Field */}
                    <div className="space-y-2.5 w-full">
                      <Label className="text-gray-800 font-semibold text-sm block h-5">
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
                          {coBorrower.relatedPepOptionsMap?.[pepIndex]?.length >
                          0 ? (
                            coBorrower.relatedPepOptionsMap[pepIndex].map(
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
                  </div>

                  <div className="mt-6 space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Upload Identification Proof{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div
                      className={fileUploadStyle(
                        !!errors[`relatedPeps.${pepIndex}.identificationProof`],
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
                    {errors[`relatedPeps.${pepIndex}.identificationProof`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${pepIndex}.identificationProof`]}
                      </p>
                    )}
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

        {/* Related to BIL */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm mt-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
            Related to BIL
          </h2>

          <div className="space-y-2.5">
            <Label
              htmlFor={`relatedToBil-${index}`}
              className="text-gray-800 font-semibold text-sm"
            >
              Related to BIL <span className="text-red-500">*</span>
            </Label>
            <Select
              value={coBorrower.relatedToBil}
              onValueChange={(value) =>
                updateCoBorrowerField(index, "relatedToBil", value)
              }
            >
              <SelectTrigger className={getFieldStyle(!!errors.relatedToBil)}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            {errors.relatedToBil && (
              <p className="text-xs text-red-500 mt-1">{errors.relatedToBil}</p>
            )}
          </div>
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
              value={coBorrower.employmentStatus}
              onValueChange={(value) =>
                updateCoBorrowerField(index, "employmentStatus", value)
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
            {errors.employmentStatus && (
              <p className="text-xs text-red-500 mt-1">
                {errors.employmentStatus}
              </p>
            )}
          </div>
        </div>

        {/* Employment Details */}
        {coBorrower.employmentStatus === "employed" && (
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
                  value={coBorrower.employeeId || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "employeeId", e.target.value)
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
                  value={coBorrower.occupation}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "occupation", value)
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
                          <SelectItem key={key} value={label}>
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
                  value={coBorrower.employerType}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "employerType", value)
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
                  value={coBorrower.designation}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "designation", value)
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
                  value={coBorrower.grade}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "grade", value)
                  }
                >
                  <SelectTrigger className={getFieldStyle(!!errors.grade)}>
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    <SelectItem value="p1">P1</SelectItem>
                    <SelectItem value="p2">P2</SelectItem>
                    <SelectItem value="p3">P3</SelectItem>
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
                  value={coBorrower.organizationName}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "organizationName", value)
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
                  value={coBorrower.orgLocation || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "orgLocation", e.target.value)
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
                  value={coBorrower.joiningDate || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "joiningDate", e.target.value)
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
                  value={coBorrower.serviceNature}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "serviceNature", value)
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
                  value={coBorrower.annualSalary || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "annualSalary", e.target.value)
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
            {coBorrower.serviceNature === "contract" && (
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
                    value={coBorrower.contractEndDate || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
                        index,
                        "contractEndDate",
                        e.target.value,
                      )
                    }
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. Applicability Toggle */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-4 shadow-md mb-8">
        <Label className="text-lg font-bold text-[#003DA5]">
          Is Co-Borrower Applicable? <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={isCoBorrowerApplicable}
          onValueChange={setIsCoBorrowerApplicable}
          className="flex flex-row gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="applicable-yes" />
            <Label
              htmlFor="applicable-yes"
              className="font-normal cursor-pointer"
            >
              Yes
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="applicable-no" />
            <Label
              htmlFor="applicable-no"
              className="font-normal cursor-pointer"
            >
              No
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* 2. Form Content (Visible only if Yes) */}
      {isCoBorrowerApplicable === "yes" && (
        <>
          {/* Render all co-borrowers */}
          {coBorrowers.map((coBorrower, index) =>
            renderCoBorrowerForm(coBorrower, index),
          )}

          {/* Add Co-Borrower Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              size="lg"
              onClick={addCoBorrower}
              className="bg-[#003DA5] hover:bg-[#002D7A] text-white px-8"
            >
              + Add Another Co-Borrower
            </Button>
          </div>
        </>
      )}

      {/* 3. Navigation Buttons */}
      <div className="flex justify-between gap-6 pt-4">
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
