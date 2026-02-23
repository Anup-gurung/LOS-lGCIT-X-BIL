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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  fetchMaritalStatus,
  fetchBanks,
  fetchNationality,
  fetchIdentificationType,
  fetchCountry,
  fetchDzongkhag,
  fetchGewogsByDzongkhag,
  fetchOccupations,
  fetchLegalConstitution,
  fetchPepCategory,
  fetchPepSubCategoryByCategory,
} from "@/services/api";
import { getNdiDataFromSession } from "@/lib/mapNdiData";
import { getVerifiedCustomerDataFromSession } from "@/lib/mapCustomerData";
import { PlusCircle, Trash2 } from "lucide-react";
// const [errors, setErrors] = useState<Record<string, string>>({});
const isRequired = (value: any) => !value || value.toString().trim() === "";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidNumber = (value: string) => /^\d+$/.test(value);

const isValidDate = (date: string) => !isNaN(Date.parse(date));

interface PersonalDetailsFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
  formData: any;
  isFirstStep: boolean;
}

// Initialize empty related PEP entry
const createEmptyRelatedPep = () => ({
  relationship: "",
  identificationNo: "",
  category: "",
  subCategory: "",
  identificationProof: "",
});

export function PersonalDetailsForm({
  onNext,
  onBack,
  formData,
}: PersonalDetailsFormProps) {
  const [data, setData] = useState(() => {
    console.log("========== PersonalDetail INIT ==========");

    // PRIORITY 1: Check for verified customer data (existing users)
    const verifiedData = getVerifiedCustomerDataFromSession();
    if (verifiedData && Object.keys(verifiedData).length > 0) {
      console.log("✅ INIT: Loading verified customer data:", verifiedData);
      let initialData = { ...verifiedData };

      if (!(initialData as any).relatedPeps) {
        (initialData as any).relatedPeps = [createEmptyRelatedPep()];
      }
      console.log("========== Init Complete ==========\n");
      return initialData as any;
    }

    // PRIORITY 2: Check for NDI verified data (new users)
    const ndiData = getNdiDataFromSession();
    if (ndiData && Object.keys(ndiData).length > 0) {
      console.log("✅ INIT: Loading NDI data:", ndiData);
      let initialData = { ...ndiData };

      if (!(initialData as any).relatedPeps) {
        (initialData as any).relatedPeps = [createEmptyRelatedPep()];
      }
      console.log("========== Init Complete ==========\n");
      return initialData as any;
    }

    // PRIORITY 3: Use formData from page
    console.log("⚠️ INIT: No verified/NDI data, using formData:", formData);
    let initialData = formData?.personalDetails || formData || {};

    // --- MIGRATION LOGIC FOR RELATED PEPS ---
    if (!(initialData as any).relatedPeps) {
      if ((initialData as any).pepRelated === "yes") {
        (initialData as any).relatedPeps = [
          {
            relationship: (initialData as any).pepRelationship || "",
            identificationNo: (initialData as any).pepIdentification || "",
            category: (initialData as any).pepCategory || "",
            subCategory: (initialData as any).pepSubCat2 || "",
            identificationProof: (initialData as any).identificationProof || "",
          },
        ];
      } else {
        (initialData as any).relatedPeps = [createEmptyRelatedPep()];
      }
    }

    console.log("========== Init Complete ==========\n");
    return initialData as any;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCoBorrowerDialog, setShowCoBorrowerDialog] = useState(false);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([]);
  const [banksOptions, setBanksOptions] = useState<any[]>([]);
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<
    any[]
  >([]);
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([]);
  const [permGewogOptions, setPermGewogOptions] = useState<any[]>([]);
  const [currGewogOptions, setCurrGewogOptions] = useState<any[]>([]);
  const [occupationOptions, setOccupationOptions] = useState<any[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<any[]>([]);
  const [pepSubCategoryOptions, setPepSubCategoryOptions] = useState<any[]>([]);
  const [pepCategoryOptions, setPepCategoryOptions] = useState<any[]>([]);

  // Store options for related PEPs separately because each row might have a different Category selected
  const [relatedPepOptionsMap, setRelatedPepOptionsMap] = useState<
    Record<number, any[]>
  >({});

  // Calculate date constraints
  const today = new Date().toISOString().split("T")[0];
  const fifteenYearsAgo = new Date();
  fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
  const maxDobDate = fifteenYearsAgo.toISOString().split("T")[0];

  // --- HELPER: Determine if Married ---
  const getIsMarried = () => {
    const status = data.maritalStatus;
    if (!status) return false;

    // 1. Check against simple string (fallback data)
    const statusStr = String(status).toLowerCase();
    if (statusStr === "married") return true;
    if (statusStr === "unmarried") return false;

    // 2. Check against loaded options
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

  const isMarried = getIsMarried();

  /**
   * Helper to check if a country value represents Bhutan
   * Handles both pk_code values and label values like "Bhutan"
   */
  const isBhutanCountry = (countryValue: string, options: any[]): boolean => {
    if (!countryValue) return false;

    // Check if the value itself is "Bhutan" (case-insensitive)
    if (String(countryValue).toLowerCase().includes("bhutan")) {
      return true;
    }

    // Check if the pk_code matches a Bhutan option
    const matchedOption = options.find(
      (c) => String(c.country_pk_code || c.id || c.code) === countryValue,
    );

    if (matchedOption) {
      const label = (
        matchedOption.country ||
        matchedOption.name ||
        ""
      ).toLowerCase();
      return label.includes("bhutan");
    }

    return false;
  };

  /**
   * Helper to find pk_code from label by searching through available options
   * This allows us to match stored label values to dropdown pk_codes
   */
  const findPkCodeByLabel = (
    label: string,
    options: any[],
    labelFields: string[],
  ): string => {
    if (!label) return "";

    const labelLower = String(label).toLowerCase().trim();

    for (const option of options) {
      // Try each possible label field
      for (const field of labelFields) {
        const optionLabel = String(option[field] || "")
          .toLowerCase()
          .trim();
        if (
          optionLabel === labelLower ||
          optionLabel.includes(labelLower) ||
          labelLower.includes(optionLabel)
        ) {
          // Found a match, return the pk_code by checking common pk_code field names
          return String(
            option.bank_pk_code ||
              option.country_pk_code ||
              option.nationality_pk_code ||
              option.identity_type_pk_code ||
              option.marital_status_pk_code ||
              option.occupation_pk_code ||
              option.pk_code ||
              option.id ||
              option.code ||
              "",
          );
        }
      }
    }

    // No match found, return the label as-is (it might already be a pk_code)
    return label;
  };

  // Load NDI verified data or existing customer verified data from session on mount
  useEffect(() => {
    // Check for existing customer verified data first
    const verifiedData = getVerifiedCustomerDataFromSession();
    if (verifiedData && Object.keys(verifiedData).length > 0) {
      console.log(
        "========== PersonalDetail - LOADING VERIFIED CUSTOMER DATA ==========",
      );
      console.log("Verified data:", verifiedData);
      console.log("Key fields:");
      console.log("  applicantName:", verifiedData.applicantName);
      console.log("  salutation:", verifiedData.salutation);
      console.log("  gender:", verifiedData.gender);
      console.log("  maritalStatus:", verifiedData.maritalStatus);
      console.log("  nationality:", verifiedData.nationality);
      console.log("  identificationType:", verifiedData.identificationType);
      console.log("  currEmail:", verifiedData.currEmail);
      console.log("  currContact:", verifiedData.currContact);
      console.log("  bankName:", verifiedData.bankName);
      console.log(
        "====================================================================\n",
      );

      setData((prevData: any) => ({
        ...verifiedData,
        ...prevData,
        // Ensure relatedPeps is preserved
        relatedPeps: prevData.relatedPeps || [createEmptyRelatedPep()],
      }));
      return; // Don't check NDI data if verified customer data exists
    }

    // If no verified customer data, check for NDI data
    const ndiData = getNdiDataFromSession();
    if (ndiData && Object.keys(ndiData).length > 0) {
      console.log("PersonalDetail - Loading NDI data:", ndiData);
      setData((prevData: any) => ({
        ...ndiData,
        ...prevData,
        // Ensure relatedPeps is preserved
        relatedPeps: prevData.relatedPeps || [createEmptyRelatedPep()],
      }));
    }
  }, []);

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
    if (
      formData &&
      typeof formData === "object" &&
      Object.keys(formData).length > 0
    ) {
      const hasData = Object.entries(formData).some(([key, val]) => {
        if (key === "personalDetails" && val && typeof val === "object") {
          return Object.keys(val).length > 0;
        }
        if (
          key === "coBorrowerDetails" ||
          key === "securityDetails" ||
          key === "repaymentSource"
        ) {
          return false;
        }
        if (typeof val === "string") return val.trim() !== "";
        if (typeof val === "boolean") return true;
        if (Array.isArray(val)) return val.length > 0;
        return val !== null && val !== undefined;
      });

      if (hasData) {
        setData((prev: any) => {
          const merged = {
            ...prev,
            ...(formData.personalDetails || {}),
            ...formData,
          };

          // Ensure relatedPeps array structure is preserved during sync
          if (!merged.relatedPeps) {
            if (merged.pepRelated === "yes") {
              merged.relatedPeps = [
                {
                  relationship: merged.pepRelationship || "",
                  identificationNo: merged.pepIdentification || "",
                  category: merged.pepCategory || "",
                  subCategory: merged.pepSubCat2 || "",
                  identificationProof: merged.identificationProof || "",
                },
              ];
            } else {
              merged.relatedPeps = [createEmptyRelatedPep()];
            }
          }

          return merged;
        });
      }
    }
  }, [formData]);

  // Load permanent gewogs
  useEffect(() => {
    const loadPermGewogs = async () => {
      if (data.permDzongkhag) {
        try {
          const options = await fetchGewogsByDzongkhag(data.permDzongkhag);
          setPermGewogOptions(options);
        } catch (error) {
          setPermGewogOptions([]);
        }
      }
    };
    loadPermGewogs();
  }, [data.permDzongkhag]);

  // Load current gewogs
  useEffect(() => {
    const loadCurrGewogs = async () => {
      if (data.currDzongkhag) {
        try {
          const options = await fetchGewogsByDzongkhag(data.currDzongkhag);
          setCurrGewogOptions(options);
        } catch (error) {
          setCurrGewogOptions([]);
        }
      }
    };
    loadCurrGewogs();
  }, [data.currDzongkhag]);

  // Load PEP sub-categories for SELF PEP
  useEffect(() => {
    const loadPepSubCategories = async () => {
      if (data.pepPerson === "yes" && data.pepCategory) {
        try {
          const options = await fetchPepSubCategoryByCategory(data.pepCategory);
          if (!options || options.length === 0) {
            throw new Error("Empty PEP sub-category list");
          }
          setPepSubCategoryOptions(options);
        } catch (error) {
          console.error("Failed to load PEP sub-categories:", error);
          setPepSubCategoryOptions([]);
        }
      } else {
        setPepSubCategoryOptions([]);
      }
    };
    loadPepSubCategories();
  }, [data.pepPerson, data.pepCategory]);

  const handleFileChange = (fieldName: string, file: File | null) => {
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setErrors({
          ...errors,
          [fieldName]: "Only PDF, JPG, JPEG, and PNG files are allowed",
        });
        return;
      }

      if (file.size > maxSize) {
        setErrors({
          ...errors,
          [fieldName]: "File size must be less than 5MB",
        });
        return;
      }

      setErrors({ ...errors, [fieldName]: "" });
      setData({ ...data, [fieldName]: file.name });
    }
  };

  // --- HANDLERS FOR MULTIPLE PEP DECLARATIONS ---

  const handleAddRelatedPep = () => {
    setData({
      ...data,
      relatedPeps: [...(data.relatedPeps || []), createEmptyRelatedPep()],
    });
  };

  const handleRemoveRelatedPep = (index: number) => {
    const updatedPeps = (data.relatedPeps || []).filter(
      (_: any, i: number) => i !== index,
    );

    // Cleanup options map
    const newOptionsMap: Record<number, any[]> = {};
    Object.keys(relatedPepOptionsMap).forEach((key) => {
      const keyNum = parseInt(key);
      if (keyNum < index) {
        newOptionsMap[keyNum] = relatedPepOptionsMap[keyNum];
      } else if (keyNum > index) {
        newOptionsMap[keyNum - 1] = relatedPepOptionsMap[keyNum];
      }
    });

    setRelatedPepOptionsMap(newOptionsMap);
    setData({ ...data, relatedPeps: updatedPeps });
  };

  const handleRelatedPepChange = async (
    index: number,
    field: string,
    value: string,
  ) => {
    const updatedPeps = [...(data.relatedPeps || [])];
    if (!updatedPeps[index]) {
      updatedPeps[index] = createEmptyRelatedPep();
    }

    updatedPeps[index] = { ...updatedPeps[index], [field]: value };

    // Special logic for Category change -> Fetch Sub Categories
    if (field === "category") {
      updatedPeps[index].subCategory = ""; // Clear sub category
      try {
        const options = await fetchPepSubCategoryByCategory(value);
        setRelatedPepOptionsMap((prev) => ({
          ...prev,
          [index]: options || [],
        }));
      } catch (e) {
        console.error("Failed to fetch PEP sub-categories:", e);
        setRelatedPepOptionsMap((prev) => ({ ...prev, [index]: [] }));
      }
    }

    setData({ ...data, relatedPeps: updatedPeps });
  };

  const handleRelatedPepFileChange = (index: number, file: File | null) => {
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

      const updatedPeps = [...(data.relatedPeps || [])];
      if (!updatedPeps[index]) {
        updatedPeps[index] = createEmptyRelatedPep();
      }

      updatedPeps[index] = {
        ...updatedPeps[index],
        identificationProof: file.name,
      };
      setData({ ...data, relatedPeps: updatedPeps });
    }
  };
  const isEmpty = (val: any) =>
    val === undefined || val === null || String(val).trim() === "";

  const isEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const isNumeric = (val: string) => /^\d+$/.test(val);

// const validateForm = () => {
//   const newErrors: Record<string, string> = {};

  //   if (isRequired(data.applicantName)) {
  //     newErrors.applicantName = "Full Name is required";
  //   }

  //   if (isRequired(data.email)) {
  //     newErrors.email = "Email is required";
  //   } else if (!isValidEmail(data.email)) {
  //     newErrors.email = "Invalid email format";
  //   }

  //   if (isRequired(data.mobileNo)) {
  //     newErrors.mobileNo = "Mobile number is required";
  //   } else if (!isValidNumber(data.mobileNo)) {
  //     newErrors.mobileNo = "Mobile number must contain digits only";
  //   }

  //   if (isRequired(data.identificationType)) {
  //     newErrors.identificationType = "Identification Type is required";
  //   }

  //   setErrors(newErrors);

  //   return Object.keys(newErrors).length === 0;
  // };

  const validateForm = () => {
    let newErrors: Record<string, string> = {};

    // ============================
    // BASIC PERSONAL INFO
    // ============================
    if (isRequired(data.applicantName))
      newErrors.applicantName = "Applicant name is required";

    if (isEmpty(data.identificationType))
      newErrors.identificationType = "Identification type is required";

    if (isEmpty(data.identificationNo))
      newErrors.identificationNo = "Identification number is required";

    if (isEmpty(data.salutation))
      newErrors.salutation = "Salutation is required";

    if (isEmpty(data.nationality))
      newErrors.nationality = "Nationality is required";

    if (isEmpty(data.gender)) newErrors.gender = "Gender is required";

    if (isEmpty(data.dateOfBirth))
      newErrors.dateOfBirth = "Date of birth is required";

  if (isEmpty(data.tpnNo))
    newErrors.tpnNo = "TPN Number is required";

    // ============================
    // MARITAL STATUS
    // ============================
    if (isEmpty(data.maritalStatus))
      newErrors.maritalStatus = "Please select a marital status";

  if (isMarried) {
    if (isEmpty(data.spouseName))
      newErrors.spouseName = "Spouse name is required";

    if (isEmpty(data.spouseCid))
      newErrors.spouseCid = "Spouse CID/ID is required";
  }
  if (isEmpty(data.FamilyTree))
    newErrors.FamiltyTree = "No files uploaded"

  // ============================
  // Bank Details
  // ============================
  // if(isEmpty(data.BankName))
  //   newErrors.BankName = "Please select a Bank"
  // if(isEmpty(data.BankAccountNo))
  //   newErrors.BankAccountNo = "Enter Bank Saving Account Number"

  // ============================
  // PERMANENT ADDRESS
  // ============================
  if (!isBhutanCountry(data.permCountry, countryOptions)) {
    if (isEmpty(data.permState))
      newErrors.permState = "State is required";

    if (isEmpty(data.permProvince))
      newErrors.permProvince = "Province is required";

    if (isEmpty(data.permStreet))
      newErrors.permStreet = "Street is required";
  } else {
    if (isEmpty(data.permDzongkhag))
      newErrors.permDzongkhag = "Dzongkhag is required";

    if (isEmpty(data.permGewog))
      newErrors.permGewog = "Gewog is required";

    if (isEmpty(data.permVillage))
      newErrors.permVillage = "Village/Street is required";
  }

  if (isEmpty(data.permAddressProof))
    newErrors.permAddressProof = "Address proof is required";

  // ============================
  // CURRENT ADDRESS
  // ============================
  if (!isBhutanCountry(data.currCountry, countryOptions)) {
    if (isEmpty(data.currState))
      newErrors.currState = "State is required";

    if (isEmpty(data.currProvince))
      newErrors.currProvince = "Province is required";
  } else {
    if (isEmpty(data.currDzongkhag))
      newErrors.currDzongkhag = "Dzongkhag is required";

    if (isEmpty(data.currGewog))
      newErrors.currGewog = "Gewog is required";
  }

  if (isEmpty(data.currEmail))
    newErrors.currEmail = "Email is required";
  else if (!isEmail(data.currEmail))
    newErrors.currEmail = "Invalid email format";

  if (isEmpty(data.currContact))
    newErrors.currContact = "Contact number is required";
  else if (!isNumeric(data.currContact))
    newErrors.currContact = "Contact must be numeric";

  // ============================
  // BANK DETAILS
  // ============================
  if (isEmpty(data.bankName))
    newErrors.bankName = "Bank is required";

  if (isEmpty(data.bankSavingAccountNo))
    newErrors.bankSavingAccountNo = "Account number is required";
  else if (!isNumeric(data.bankSavingAccountNo))
    newErrors.bankSavingAccountNo = "Account number must be numeric";

  if (isEmpty(data.passportPhoto))
    newErrors.passportPhoto = "Passport-size photo is required";

  // ============================
  // EMPLOYMENT
  // ============================
  if (data.employmentStatus === "Employed") {
    if (isEmpty(data.employeeId))
      newErrors.employeeId = "Employee ID is required";

      if (isEmpty(data.occupation))
        newErrors.occupation = "Occupation is required";

    if (isEmpty(data.organizationName))
      newErrors.organizationName = "Organization name is required";

    if (isEmpty(data.serviceJoiningDate))
      newErrors.serviceJoiningDate = "Joining date is required";

    if (data.natureOfService === "Contract" && isEmpty(data.contractEndDate))
      newErrors.contractEndDate = "Contract end date is required";

    if (isEmpty(data.grossAnnualIncome))
      newErrors.grossAnnualIncome = "Gross annual income is required";
    else if (!isNumeric(data.grossAnnualIncome))
      newErrors.grossAnnualIncome = "Income must be numeric";
  }

  // ============================
  // SELF PEP
  // ============================
  if (data.pepPerson === "yes") {
    if (isEmpty(data.pepCategory))
      newErrors.pepCategory = "PEP category is required";

      if (isEmpty(data.pepSubCategory))
        newErrors.pepSubCategory = "PEP sub category is required";

    if (isEmpty(data.pepIdentificationProof))
      newErrors.pepIdentificationProof = "Identification proof required";
  }

  // ============================
  // RELATED PEP
  // ============================
  if (data.pepRelated === "yes") {
    relatedPeps.forEach((pep: any, index: number) => {
      if (isEmpty(pep.relationship))
        newErrors[`relatedPeps.${index}.relationship`] =
          "Relationship is required";

        if (isEmpty(pep.identificationNo))
          newErrors[`relatedPeps.${index}.identificationNo`] =
            "Identification number is required";

        if (isEmpty(pep.category))
          newErrors[`relatedPeps.${index}.category`] = "Category is required";

      if (isEmpty(pep.subCategory))
        newErrors[`relatedPeps.${index}.subCategory`] =
          "Sub category is required";
    });
  }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const validateDates = () => {
    const newErrors: Record<string, string> = {};

    if (data.identificationIssueDate && data.identificationIssueDate > today) {
      newErrors.identificationIssueDate = "Issue date cannot be in the future";
    }
    if (
      data.identificationExpiryDate &&
      data.identificationExpiryDate < today
    ) {
      newErrors.identificationExpiryDate = "Expiry date cannot be in the past";
    }
    if (data.dateOfBirth && data.dateOfBirth > maxDobDate) {
      newErrors.dateOfBirth = "You must be at least 15 years old";
    }
    if (
      data.identificationIssueDate &&
      data.identificationExpiryDate &&
      data.identificationIssueDate >= data.identificationExpiryDate
    ) {
      newErrors.identificationExpiryDate =
        "Expiry date must be after issue date";
    }

    setErrors({ ...errors, ...newErrors });
    return Object.keys(newErrors).length === 0;
  };

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (validateDates()) {
  //     setShowCoBorrowerDialog(true);
  //   }
  // };

  const handleSubmit = (e: React.FormEvent) => {
     alert("Handle SUbmit")
  e.preventDefault();
 

  // const isValidDates = validateDates();
  const isValid = validateForm();

    if (isValid) {
    setShowCoBorrowerDialog(true);
  }
};


  const handleCoBorrowerResponse = (hasCoBorrower: boolean) => {
    setShowCoBorrowerDialog(false);
    onNext({ personalDetails: data, hasCoBorrower });
  };

  // Ensure relatedPeps is always an array
  const relatedPeps = data.relatedPeps || [createEmptyRelatedPep()];

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 sm:space-y-8 md:space-y-10 pt-4 sm:pt-6 md:pt-8 pb-6 sm:pb-8 md:pb-12"
    >
      {/* Application Personal Information */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
          Application Personal Information
        </h2>

        {/* Identification Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-1.5 sm:space-y-2.5">
            <Label
              htmlFor="identificationType"
              className="text-gray-800 font-semibold text-xs sm:text-sm"
            >
              Identification Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={
                findPkCodeByLabel(
                  data.identificationType,
                  identificationTypeOptions,
                  ["identity_type", "identification_type", "name", "label"],
                ) || data.identificationType
              }
              onValueChange={(value) => {
                setData({ ...data, identificationType: value });

                if (!isRequired(value)) {
                  setErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.identificationType;
                    return updated;
                  });
                }
              }}
            >
              <SelectTrigger
                className={`h-10 sm:h-12 w-full text-sm sm:text-base border
                ${
                  errors.identificationType
                    ? "!border-red-500 focus:!ring-red-500 focus:!border-red-500"
                    : "border-gray-300 focus:border-[#FF9800] focus:ring-[#228822]"
                }`}
              >
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {identificationTypeOptions.length > 0 ? (
                  identificationTypeOptions.map((option, index) => {
                    const key =
                      option.identity_type_pk_code ||
                      option.identification_type_pk_code ||
                      option.id ||
                      `id-${index}`;
                    const value = String(
                      option.identity_type_pk_code ||
                        option.identification_type_pk_code ||
                        option.id ||
                        index,
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
            {errors.identificationType && (
              <p className="text-xs text-red-500 mt-1">
                {errors.identificationType}
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2.5">
            <Label
              htmlFor="identificationNo"
              className="text-gray-800 font-semibold text-xs sm:text-sm"
            >
              Identification No. <span className="text-red-500">*</span>
            </Label>
            <Input
              id="identificationNo"
              placeholder="Enter identification No"
              // className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
              value={data.applicantName || ""}
              onChange={(e) =>
                setData({ ...data, applicantName: e.target.value })
              }
              className={`h-10 sm:h-12 w-full text-sm sm:text-base border
              ${
                errors.applicantName
                    ? "!border-red-500 focus:!ring-red-500 focus:!border-red-500"
                    : "border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              }`}
              // required
            />
            {errors.identificationNo && (
              <p className="text-xs text-red-500 mt-1">
                {errors.identificationNo}
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2.5">
            <Label
              htmlFor="salutation"
              className="text-gray-800 font-semibold text-xs sm:text-sm"
            >
              Salutation <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.salutation}
              onValueChange={(value) => setData({ ...data, salutation: value })}
            >
              <SelectTrigger 
              // className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                className={`h-10 sm:h-12 w-full text-sm sm:text-base border
                ${
                  errors.salutation
                    ? "!border-red-500 focus:!ring-red-500 focus:!border-red-500"
                    : "border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                }`}
              >
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
              htmlFor="applicantName"
              className="text-gray-800 font-semibold text-xs sm:text-sm"
            >
              Applicant Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="applicantName"
              placeholder="Enter Your Full Name"
              // className={`h-10 sm:h-12 border-gray-300 
              //   focus:border-[#FF9800] focus:ring-[#FF9800] 
              //   text-sm sm:text-base 
              //   ${errors.applicantName ? "border-red-500" : ""}`}              
              onChange={(e) => {
      const value = e.target.value;

                setData({ ...data, applicantName: value });

      // Auto clear error when valid
      if (!isRequired(value)) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.applicantName;
          return updated;
        });
      }
    }}

    className={`h-10 sm:h-12 w-full text-sm sm:text-base border
     ${
      errors.applicantName
          ? "!border-red-500 focus:!ring-red-500 focus:!border-red-500"
          : "border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
    }`}
              // required
                // className={`form-input ${errors.applicantName ? "border-red-500" : ""}`}

            />
   {errors.applicantName && (
    <p className="text-xs text-red-500 mt-1">
      {errors.applicantName}
    </p>
  )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-1.5 sm:space-y-2.5">
            <Label
              htmlFor="nationality"
              className="text-gray-800 font-semibold text-xs sm:text-sm"
            >
              Nationality <span className="text-red-500">*</span>
            </Label>
            <Select
              value={findPkCodeByLabel(data.nationality, nationalityOptions, ['nationality', 'name', 'label'])}
              onValueChange={(value) =>
                setData({ ...data, nationality: value })
              }
            >
              <SelectTrigger
                // className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                className={`h-10 sm:h-12 w-full text-sm sm:text-base border
                ${
                  errors.nationality
                    ? "!border-red-500 focus:!ring-red-500 focus:!border-red-500"
                    : "border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                }`}
              >
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {nationalityOptions.length > 0 ? (
                  nationalityOptions.map((option, index) => {
                    const key =
                      option.nationality_pk_code ||
                      option.id ||
                      option.code ||
                      `nationality-${index}`;
                    const value = String(
                      option.nationality_pk_code ||
                        option.id ||
                        option.code ||
                        index,
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
              <p className="text-xs text-red-500 mt-1">{errors.nationality}</p>
            )}
          </div>
          <div className="space-y-2.5">
            <Label
              htmlFor="gender"
              className="text-gray-800 font-semibold text-sm"
            >
              Gender <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.gender}
              onValueChange={(value) => setData({ ...data, gender: value })}
            >
              <SelectTrigger 
              // className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                className={`h-10 sm:h-12 w-full text-sm sm:text-base border
                ${
                  errors.gender
                    ? "!border-red-500 focus:!ring-red-500 focus:!border-red-500"
                    : "border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                }`}
              >
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
              htmlFor="identificationIssueDate"
              className="text-gray-800 font-semibold text-xs sm:text-sm"
            >
              Identification Issue Date <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              id="identificationIssueDate"
              max={today}
              // className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
              value={data.identificationIssueDate || ""}
              onChange={(e) => {
                setData({ ...data, identificationIssueDate: e.target.value });
                setErrors({ ...errors, identificationIssueDate: "" });
                
              }}
              // required
              className={`h-10 sm:h-12 w-full text-sm sm:text-base border
                ${
                  errors.identificationIssueDate
                      ? "!border-red-500 focus:!ring-red-500 focus:!border-red-500"
                      : "border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                }`}
            />
            {errors.identificationIssueDate && (
              <p className="text-xs text-red-500 mt-1">
                {errors.identificationIssueDate}
              </p>
            )}
          </div>
          <div className="space-y-1.5 sm:space-y-2.5">
            <Label
              htmlFor="identificationExpiryDate"
              className="text-gray-800 font-semibold text-xs sm:text-sm"
            >
              Identification Expiry Date <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              id="identificationExpiryDate"
              min={today}
              // className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.identificationExpiryDate || ""}
              onChange={(e) => {
                setData({ ...data, identificationExpiryDate: e.target.value });
                setErrors({ ...errors, identificationExpiryDate: "" });
              }}
              // required
            />
            {errors.identificationExpiryDate && (
              <p className="text-xs text-red-500 mt-1">
                {errors.identificationExpiryDate}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-2.5">
            <Label
              htmlFor="dateOfBirth"
              className="text-gray-800 font-semibold text-sm"
            >
              Date of Birth <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              id="dateOfBirth"
              max={maxDobDate}
              // className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.dateOfBirth || ""}
              onChange={(e) => {
                setData({ ...data, dateOfBirth: e.target.value });
                setErrors({ ...errors, dateOfBirth: "" });
              }}
              // required
            />
            {errors.dateOfBirth && (
              <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="tpn"
              className="text-gray-800 font-semibold text-sm"
            >
              TPN No <span className="text-red-500">*</span>
            </Label>
            <Input
              id="tpn"
              placeholder="Enter TPN"
              // className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.tpn || ""}
              onChange={(e) => setData({ ...data, tpn: e.target.value })}
              // required
            />
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="maritalStatus"
              className="text-gray-800 font-semibold text-sm"
            >
              Marital Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={findPkCodeByLabel(data.maritalStatus, maritalStatusOptions, ['marital_status', 'name', 'label']) || data.maritalStatus}
              onValueChange={(value) =>
                setData({ ...data, maritalStatus: value })
              }
            >
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {maritalStatusOptions.length > 0 ? (
                  maritalStatusOptions.map((option, index) => {
                    const key =
                      option.marital_status_pk_code ||
                      option.id ||
                      option.value ||
                      option.code ||
                      `marital-${index}`;
                    const value = String(
                      option.marital_status_pk_code ||
                        option.id ||
                        option.value ||
                        option.code ||
                        index,
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
                  htmlFor="spouseIdentificationNo"
                  className="text-gray-800 font-semibold text-xs sm:text-sm"
                >
                  Spouse CID/ID No. <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="spouseIdentificationNo"
                  placeholder="Enter Spouse CID/ID"
                  // className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                  value={data.spouseIdentificationNo || ""}
                  onChange={(e) =>
                    setData({ ...data, spouseIdentificationNo: e.target.value })
                  }
                  // required
                  
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label
                  htmlFor="spouseName"
                  className="text-gray-800 font-semibold text-xs sm:text-sm"
                >
                  Spouse Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="spouseName"
                  placeholder="Enter Spouse Full Name"
                  // className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                  value={data.spouseName || ""}
                  onChange={(e) =>
                    setData({ ...data, spouseName: e.target.value })
                  }
                  // required
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label
                  htmlFor="spouseContact"
                  className="text-gray-800 font-semibold text-xs sm:text-sm"
                >
                  Spouse Contact No. <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="spouseContact"
                  placeholder="Enter Contact Number"
                  // className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                  value={data.spouseContact || ""}
                  onChange={(e) =>
                    setData({ ...data, spouseContact: e.target.value })
                  }
                  // required
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t mt-4">
          <div className="space-y-2.5">
            <Label
              htmlFor="uploadFamilyTree"
              className="text-gray-800 font-semibold text-sm"
            >
              Upload Family Tree <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="uploadFamilyTree"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  handleFileChange("familyTree", e.target.files?.[0] || null)
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-28 bg-transparent"
                onClick={() =>
                  document.getElementById("uploadFamilyTree")?.click()
                }
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {data.familyTree || "No file chosen"}
              </span>
            </div>
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
              htmlFor="bankName"
              className="text-gray-800 font-semibold text-sm"
            >
              Name of Bank <span className="text-red-500">*</span>
            </Label>
            <Select
              value={findPkCodeByLabel(data.bankName, banksOptions, ['bank_name', 'name', 'label']) || data.bankName}
              onValueChange={(value) => setData({ ...data, bankName: value })}
            >
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {banksOptions.length > 0 ? (
                  banksOptions.map((option, index) => {
                    const key =
                      option.bank_pk_code ||
                      option.id ||
                      option.code ||
                      option.bank_code ||
                      `bank-${index}`;
                    const value = String(
                      option.bank_pk_code ||
                        option.id ||
                        option.code ||
                        option.bank_code ||
                        index,
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
              htmlFor="bankAccount"
              className="text-gray-800 font-semibold text-sm"
            >
              Bank Saving Account No <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bankAccount"
              placeholder="Enter saving account number"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.bankAccount || ""}
              onChange={(e) =>
                setData({ ...data, bankAccount: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <Label
            htmlFor="uploadPassport"
            className="text-gray-800 font-semibold text-sm"
          >
            Upload Passport-size Photograph{" "}
            <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="uploadPassport"
              className="hidden"
              accept=".jpg,.jpeg,.png"
              onChange={(e) =>
                handleFileChange("passportPhoto", e.target.files?.[0] || null)
              }
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-28 bg-transparent"
              onClick={() => document.getElementById("uploadPassport")?.click()}
            >
              Choose File
            </Button>
            <span className="text-sm text-muted-foreground">
              {data.passportPhoto || "No file chosen"}
            </span>
          </div>
          {errors.passportPhoto && (
            <p className="text-xs text-red-500 mt-1">{errors.passportPhoto}</p>
          )}
          <p className="text-xs text-gray-500">Allowed: JPG, PNG (Max 5MB)</p>
        </div>
      </div>

      {/* Permanent Address */}
      {/* making sure that bhutanese addresses pops up first */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
          Permanent Address
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-2.5">
            <Label
              htmlFor="permCountry"
              className="text-gray-800 font-semibold text-sm"
            >
              Country <span className="text-red-500">*</span>
            </Label>
            <Select
              value={findPkCodeByLabel(data.permCountry, countryOptions, ['country', 'name', 'label']) || data.permCountry}
              onValueChange={(value) =>
                setData({ ...data, permCountry: value })
              }
            >
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {countryOptions.length > 0 ? (
                  countryOptions.map((option, index) => {
                    const key =
                      option.country_pk_code ||
                      option.id ||
                      option.code ||
                      `perm-country-${index}`;
                    const value = String(
                      option.country_pk_code ||
                        option.id ||
                        option.code ||
                        index,
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
              <p className="text-xs text-red-500 mt-1">{errors.permCountry}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="permDzongkhag"
              className="text-gray-800 font-semibold text-sm"
            >
              {isBhutanCountry(data.permCountry, countryOptions)
                ? "Dzongkhag"
                : "State"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            {data.permCountry &&
            !isBhutanCountry(data.permCountry, countryOptions) ? (
              <Input
                id="permDzongkhag"
                placeholder="Enter State"
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.permDzongkhag || ""}
                onChange={(e) =>
                  setData({ ...data, permDzongkhag: e.target.value })
                }
              />
            ) : (
              <Select
                value={data.permDzongkhag || ""}
                onValueChange={(value) =>
                  setData({ ...data, permDzongkhag: value })
                }
                disabled={!isBhutanCountry(data.permCountry, countryOptions)}
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {dzongkhagOptions.length > 0 ? (
                    dzongkhagOptions.map((option, index) => {
                      const key =
                        option.dzongkhag_pk_code ||
                        option.id ||
                        option.code ||
                        `perm-dzo-${index}`;
                      const value = String(
                        option.dzongkhag_pk_code ||
                          option.id ||
                          option.code ||
                          index,
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
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="permGewog"
              className="text-gray-800 font-semibold text-sm"
            >
              {isBhutanCountry(data.permCountry, countryOptions)
                ? "Gewog"
                : "Province"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            {data.permCountry &&
            !isBhutanCountry(data.permCountry, countryOptions) ? (
              <Input
                id="permGewog"
                placeholder="Enter Province"
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.permGewog || ""}
                onChange={(e) =>
                  setData({ ...data, permGewog: e.target.value })
                }
              />
            ) : (
              <Select
                value={isBhutanCountry(data.permCountry, countryOptions) ? data.permGewog : ""}
                onValueChange={(value) =>
                  setData({ ...data, permGewog: value })
                }
                disabled={!isBhutanCountry(data.permCountry, countryOptions)}
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {permGewogOptions.length > 0 ? (
                    permGewogOptions.map((option, index) => {
                      const key =
                        option.gewog_pk_code ||
                        option.id ||
                        option.code ||
                        `perm-gewog-${index}`;
                      const value = String(
                        option.gewog_pk_code ||
                          option.id ||
                          option.code ||
                          index,
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
                    })
                  ) : (
                    <SelectItem value="loading" disabled>
                      {data.permDzongkhag
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
              htmlFor="permVillage"
              className="text-gray-800 font-semibold text-sm"
            >
              {isBhutanCountry(data.permCountry, countryOptions)
                ? "Village/Street"
                : "Street"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="permVillage"
              placeholder={
                isBhutanCountry(data.permCountry, countryOptions)
                  ? "Enter Village/Street"
                  : "Enter Street"
              }
              // className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.permVillage || ""}
              onChange={(e) =>
                setData({ ...data, permVillage: e.target.value })
              }
              disabled={!data.permCountry}
            />
          </div>
        </div>

        {/* Conditional grid - show Thram and House only for Bhutan */}
        {isBhutanCountry(data.permCountry, countryOptions) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor="permThram"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Thram No. <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="permThram"
                  placeholder="Enter Thram No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={data.permThram || ""}
                  onChange={(e) =>
                    setData({ ...data, permThram: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="permHouse"
                  className="text-gray-800 font-semibold text-sm"
                >
                  House No. <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="permHouse"
                  placeholder="Enter House No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={data.permHouse || ""}
                  onChange={(e) =>
                    setData({ ...data, permHouse: e.target.value })
                  }
                />
              </div>
            </div>
          )}

        {/* Document Upload for Non-Bhutan Countries */}
        {data.permCountry &&
          !isBhutanCountry(data.permCountry, countryOptions) && (
            <div className="space-y-2.5 border-t pt-4">
              <Label
                htmlFor="permAddressProof"
                className="text-gray-800 font-semibold text-sm"
              >
                Upload Address Proof Document{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="permAddressProof"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    handleFileChange(
                      "permAddressProof",
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
                    document.getElementById("permAddressProof")?.click()
                  }
                >
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground">
                  {data.permAddressProof || "No file chosen"}
                </span>
              </div>
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
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
          Current/Residential Address
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-2.5">
            <Label
              htmlFor="currCountry"
              className="text-gray-800 font-semibold text-sm"
            >
              Country of Resident <span className="text-red-500">*</span>
            </Label>
            <Select
              value={findPkCodeByLabel(data.currCountry, countryOptions, ['country', 'name', 'label']) || data.currCountry}
              onValueChange={(value) =>
                setData({ ...data, currCountry: value })
              }
            >
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {countryOptions.length > 0 ? (
                  countryOptions.map((option, index) => {
                    const key =
                      option.country_pk_code ||
                      option.id ||
                      option.code ||
                      `curr-country-${index}`;
                    const value = String(
                      option.country_pk_code ||
                        option.id ||
                        option.code ||
                        index,
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
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="currDzongkhag"
              className="text-gray-800 font-semibold text-sm"
            >
              {isBhutanCountry(data.currCountry, countryOptions)
                ? "Dzongkhag"
                : "State"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            {data.currCountry &&
            !isBhutanCountry(data.currCountry, countryOptions) ? (
              <Input
                id="currDzongkhag"
                placeholder="Enter State"
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.currDzongkhag || ""}
                onChange={(e) =>
                  setData({ ...data, currDzongkhag: e.target.value })
                }
              />
            ) : (
              <Select
                value={data.currDzongkhag || ""}
                onValueChange={(value) => {
                  setData({ ...data, currDzongkhag: value });

                  if (!isRequired(value)) {
                    setErrors((prev) => {
                      const updated = { ...prev };
                      delete updated.currDzongkhag;
                      return updated;
                    });
                  }
                }}
                disabled={!isBhutanCountry(data.currCountry, countryOptions)}
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {dzongkhagOptions.length > 0 ? (
                    dzongkhagOptions.map((option, index) => {
                      const key =
                        option.dzongkhag_pk_code ||
                        option.id ||
                        option.code ||
                        `curr-dzo-${index}`;
                      const value = String(
                        option.dzongkhag_pk_code ||
                          option.id ||
                          option.code ||
                          index,
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
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="currGewog"
              className="text-gray-800 font-semibold text-sm"
            >
              {isBhutanCountry(data.currCountry, countryOptions)
                ? "Gewog"
                : "Province"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            {data.currCountry &&
            !isBhutanCountry(data.currCountry, countryOptions) ? (
              <Input
                id="currGewog"
                placeholder="Enter Province"
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.currGewog || ""}
                onChange={(e) =>
                  setData({ ...data, currGewog: e.target.value })
                }
              />
            ) : (
              <Select
                value={isBhutanCountry(data.currCountry, countryOptions) ? data.currGewog : ""}
                onValueChange={(value) =>
                  setData({ ...data, currGewog: value })
                }
                disabled={!isBhutanCountry(data.currCountry, countryOptions)}
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {currGewogOptions.length > 0 ? (
                    currGewogOptions.map((option, index) => {
                      const key =
                        option.gewog_pk_code ||
                        option.id ||
                        option.code ||
                        `curr-gewog-${index}`;
                      const value = String(
                        option.gewog_pk_code ||
                          option.id ||
                          option.code ||
                          index,
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
                    })
                  ) : (
                    <SelectItem value="loading" disabled>
                      {data.currDzongkhag
                        ? "Loading..."
                        : "Select Dzongkhag first"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="currVillage"
              className="text-gray-800 font-semibold text-sm"
            >
              {isBhutanCountry(data.currCountry, countryOptions)
                ? "Village/Street"
                : "Street"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="currVillage"
              placeholder={
                isBhutanCountry(data.currCountry, countryOptions)
                  ? "Enter Village/Street"
                  : "Enter Street"
              }
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.currVillage || ""}
              onChange={(e) =>
                setData({ ...data, currVillage: e.target.value })
              }
              disabled={!data.currCountry}
            />
          </div>
        </div>

        {/* Conditional grid layout based on country */}
        {isBhutanCountry(data.currCountry, countryOptions) && (
            // Updated Grid to accommodate Alternate Contact
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor="currFlat"
                  className="text-gray-800 font-semibold text-sm"
                >
                  House/Building/ Flat No{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="currFlat"
                  placeholder="Enter Flat No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={data.currFlat || ""}
                  onChange={(e) =>
                    setData({ ...data, currFlat: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="currEmail"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="currEmail"
                  type="email"
                  placeholder="Enter Your Email"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={data.currEmail || ""}
                  onChange={(e) =>
                    setData({ ...data, currEmail: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="currContact"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Contact Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="currContact"
                  placeholder="Enter Contact No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={data.currContact || ""}
                  onChange={(e) =>
                    setData({ ...data, currContact: e.target.value })
                  }
                />
              </div>

              {/* NEW Alternate Contact Field for Bhutan */}
              <div className="space-y-2.5">
                <Label
                  htmlFor="currAlternateContact"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Alternate Contact No
                </Label>
                <Input
                  id="currAlternateContact"
                  placeholder="Enter Contact No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={data.currAlternateContact || ""}
                  onChange={(e) =>
                    setData({ ...data, currAlternateContact: e.target.value })
                  }
                />
              </div>
            </div>
          )}

        {data.currCountry &&
          !isBhutanCountry(data.currCountry, countryOptions) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor="currEmail"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="currEmail"
                  type="email"
                  placeholder="Enter Your Email"
                  // className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={data.currEmail || ""}
                  onChange={(e) =>
                    setData({ ...data, currEmail: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="currContact"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Contact Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="currContact"
                  placeholder="Enter Contact No"
                  // className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={data.currContact || ""}
                  onChange={(e) =>
                    setData({ ...data, currContact: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="currAlternateContact"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Alternate Contact No
                </Label>
                <Input
                  id="currAlternateContact"
                  placeholder="Enter Contact No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={data.currAlternateContact || ""}
                  onChange={(e) =>
                    setData({ ...data, currAlternateContact: e.target.value })
                  }
                />
              </div>
            </div>
          )}

        {/* Document Upload for Non-Bhutan Countries */}
        {data.currCountry &&
          !isBhutanCountry(data.currCountry, countryOptions) && (
            <div className="space-y-2.5 border-t pt-4">
              <Label
                htmlFor="currAddressProof"
                className="text-gray-800 font-semibold text-sm"
              >
                Upload Address Proof Document{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="currAddressProof"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    handleFileChange(
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
                    document.getElementById("currAddressProof")?.click()
                  }
                >
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground">
                  {data.currAddressProof || "No file chosen"}
                </span>
              </div>
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
          )}
      </div>

      {/* PEP Declaration - UPDATED SECTION */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
          PEP Declaration
        </h2>

        {/* SELF PEP Question */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 border-b pb-6">
          <div className="space-y-2.5">
            <Label
              htmlFor="pepPerson"
              className="text-gray-800 font-semibold text-sm"
            >
              Politically Exposed Person
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.pepPerson}
              onValueChange={(value) =>
                setData({
                  ...data,
                  pepPerson: value,
                  pepRelated: value === "yes" ? "" : data.pepRelated,
                })
              }
            >
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {data.pepPerson === "yes" && (
            <>
              <div className="space-y-2.5">
                <Label
                  htmlFor="pepCategory"
                  className="text-gray-800 font-semibold text-sm"
                >
                  PEP Category<span className="text-destructive">*</span>
                </Label>
                <Select
                  value={data.pepCategory}
                  onValueChange={(value) =>
                    setData({ ...data, pepCategory: value, pepSubCategory: "" })
                  }
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {pepCategoryOptions.length > 0 ? (
                      pepCategoryOptions.map((option, index) => {
                        const key =
                          option.pep_category_pk_code ||
                          option.id ||
                          option.code ||
                          `pep-cat-${index}`;
                        const value = String(
                          option.pep_category_pk_code ||
                            option.id ||
                            option.code ||
                            index,
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
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="pepSubCategory"
                  className="text-gray-800 font-semibold text-sm"
                >
                  PEP Sub Category<span className="text-destructive">*</span>
                </Label>
                <Select
                  value={data.pepSubCategory}
                  onValueChange={(value) =>
                    setData({ ...data, pepSubCategory: value })
                  }
                  disabled={!data.pepCategory}
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {pepSubCategoryOptions.length > 0 ? (
                      pepSubCategoryOptions.map((option, index) => {
                        const key =
                          option.pep_sub_category_pk_code ||
                          option.id ||
                          option.code ||
                          `pep-sub-${index}`;
                        const value = String(
                          option.pep_sub_category_pk_code ||
                            option.id ||
                            option.code ||
                            index,
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
                      })
                    ) : (
                      <SelectItem value="loading" disabled>
                        {data.pepCategory
                          ? "Loading..."
                          : "Select Category first"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label className="text-gray-800 font-semibold text-sm">
                  Upload Identification Proof{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="selfPepProof"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleFileChange(
                        "identificationProof",
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
                      document.getElementById("selfPepProof")?.click()
                    }
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                    {data.identificationProof || "No file chosen"}
                  </span>
                </div>
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
        {data.pepPerson === "no" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pt-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="pepRelated"
                className="text-gray-800 font-semibold text-sm"
              >
                Are you related to any PEP?
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.pepRelated}
                onValueChange={(value) =>
                  setData({
                    ...data,
                    pepRelated: value,
                    relatedPeps:
                      value === "yes" ? [createEmptyRelatedPep()] : [],
                  })
                }
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              {errors.pepRelated && (
                <p className="text-xs text-red-500 mt-1">{errors.pepRelated}</p>
              )}
            </div>
          </div>
        )}

        {/* RELATED PEP MULTIPLE ENTRIES */}
        {data.pepRelated === "yes" && (
          <div className="space-y-6 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-bold text-gray-700">
                Related PEP Details
              </h3>
            </div>

            {relatedPeps.map((pep: any, index: number) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative"
              >
                {/* Remove Button */}
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-sm text-gray-600">
                    Person {index + 1}
                  </span>
                  {relatedPeps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRelatedPep(index)}
                      className="h-8 w-8 p-0 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-2">
                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Relationship <span className="text-destructive">*</span>
                    </Label>

                    <Select
                      value={pep.relationship || ""}
                      onValueChange={(value) => {
                        handleRelatedPepChange(index, "relationship", value);

                        if (!isRequired(value)) {
                          setErrors((prev) => {
                            const updated = { ...prev };
                            delete updated[`relatedPeps.${index}.relationship`];
                            return updated;
                          });
                        }
                      }}
                    >
                      <SelectTrigger
                        className={`h-10 sm:h-12 w-full text-sm sm:text-base border
                          ${
                            errors[`relatedPeps.${index}.relationship`]
                              ? "!border-red-500 focus:!ring-red-500 focus:!border-red-500"
                              : "border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          }`}
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

                    {errors[`relatedPeps.${index}.relationship`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${index}.relationship`]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Identification No. <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter Identification No"
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      value={pep.identificationNo || ""}
                      onChange={(e) =>
                        handleRelatedPepChange(
                          index,
                          "identificationNo",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      PEP Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={pep.category || ""}
                      onValueChange={(value) =>
                        handleRelatedPepChange(index, "category", value)
                      }
                    >
                      <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
                        {pepCategoryOptions.length > 0 ? (
                          pepCategoryOptions.map((option, idx) => {
                            const key =
                              option.pep_category_pk_code ||
                              option.id ||
                              option.code ||
                              `pep-cat-${idx}`;
                            const value = String(
                              option.pep_category_pk_code ||
                                option.id ||
                                option.code ||
                                idx,
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
                    {errors[`relatedPeps.${index}.category`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${index}.category`]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      PEP Sub Category
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={pep.subCategory || ""}
                      // onValueChange={(value) =>
                      //   handleRelatedPepChange(index, "subCategory", value)
                      // }
                      onValueChange={(value) => {
                        handleRelatedPepChange(index, "subCategory", value);

                        if (!isRequired(value)) {
                          setErrors((prev) => {
                            const updated = { ...prev };
                            delete updated[`relatedPeps.${index}.subCategory`];
                            return updated;
                          });
                        }
                      }}
                      disabled={!pep.category}
                    >
                      <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
                        {relatedPepOptionsMap[index]?.length > 0 ? (
                          relatedPepOptionsMap[index].map((option, idx) => {
                            const key =
                              option.pep_sub_category_pk_code ||
                              option.id ||
                              option.code ||
                              `pep-rel-sub-${idx}`;
                            const value = String(
                              option.pep_sub_category_pk_code ||
                                option.id ||
                                option.code ||
                                idx,
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
                          })
                        ) : (
                          <SelectItem value="loading" disabled>
                            {pep.category
                              ? "Loading..."
                              : "Select Category first"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-sm">
                    Upload Identification Proof{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id={`uploadId-${index}`}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleRelatedPepFileChange(
                          index,
                          e.target.files?.[0] || null,
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-28 bg-white"
                      onClick={() =>
                        document.getElementById(`uploadId-${index}`)?.click()
                      }
                    >
                      Choose File
                    </Button>
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {pep.identificationProof || "No file chosen"}
                    </span>

                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddRelatedPep}
              className="w-full sm:w-auto border-dashed border-2 border-gray-300 text-gray-600 hover:border-[#003DA5] hover:text-[#003DA5]"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Another Related PEP
            </Button>
          </div>
        )}
      </div>

      {/* Related to BIL */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
          Related to BIL
        </h2>

        <div className="space-y-2.5">
          <Label
            htmlFor="relatedToBil"
            className="text-gray-800 font-semibold text-sm"
          >
            Related to BIL <span className="text-red-500">*</span>
          </Label>
          <Select
            value={data.relatedToBil}
            onValueChange={(value) => setData({ ...data, relatedToBil: value })}
          >
            <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
          Employment Status
        </h2>

        <div className="space-y-4">
          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
            Employment Status <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={data.employmentStatus}
            onValueChange={(value) =>
              setData({ ...data, employmentStatus: value })
            }
            className="flex flex-col sm:flex-row gap-3 sm:gap-6 md:gap-8"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="employed" id="employed" />
              <Label
                htmlFor="employed"
                className="font-normal cursor-pointer text-sm"
              >
                Employed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unemployed" id="unemployed" />
              <Label
                htmlFor="unemployed"
                className="font-normal cursor-pointer text-sm"
              >
                Unemployed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="self-employed" id="self-employed" />
              <Label
                htmlFor="self-employed"
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
      {data.employmentStatus === "employed" && (
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
            Employment Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="employeeId"
                className="text-gray-800 font-semibold text-sm"
              >
                Employee ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="employeeId"
                placeholder="Enter ID"
                // className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.employeeId || ""}
                onChange={(e) =>
                  setData({ ...data, employeeId: e.target.value })
                }
              />
            </div>
            <div className="space-y-2.5">
              <Label
                htmlFor="occupation"
                className="text-gray-800 font-semibold text-sm"
              >
                Occupation <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.occupation}
                onValueChange={(value) =>
                  setData({ ...data, occupation: value })
                }
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {occupationOptions.length > 0 ? (
                    occupationOptions.map((option, index) => {
                      const key =
                        option.occ_pk_code ||
                        option.occupation_pk_code ||
                        option.id ||
                        `occupation-${index}`;
                      const value = String(
                        option.occ_pk_code ||
                          option.occupation_pk_code ||
                          option.id ||
                          index,
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
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="employerType"
                className="text-gray-800 font-semibold text-sm"
              >
                Type of Employer <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.employerType}
                onValueChange={(value) =>
                  setData({ ...data, employerType: value })
                }
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="designation"
                className="text-gray-800 font-semibold text-sm"
              >
                Designation <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.designation}
                onValueChange={(value) =>
                  setData({ ...data, designation: value })
                }
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="officer">Officer</SelectItem>
                  <SelectItem value="assistant">Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="grade"
                className="text-gray-800 font-semibold text-sm"
              >
                Grade <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.grade}
                onValueChange={(value) => setData({ ...data, grade: value })}
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="p1">P1</SelectItem>
                  <SelectItem value="p2">P2</SelectItem>
                  <SelectItem value="p3">P3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="organizationName"
                className="text-gray-800 font-semibold text-sm"
              >
                Organization Name <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.organizationName}
                onValueChange={(value) =>
                  setData({ ...data, organizationName: value })
                }
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {organizationOptions.length > 0 ? (
                    organizationOptions.map((option, index) => {
                      const key =
                        option.lgal_constitution_pk_code ||
                        option.legal_const_pk_code ||
                        option.id ||
                        `org-${index}`;
                      const value = String(
                        option.lgal_constitution_pk_code ||
                          option.legal_const_pk_code ||
                          option.id ||
                          index,
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
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="orgLocation"
                className="text-gray-800 font-semibold text-sm"
              >
                Organization Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="orgLocation"
                placeholder="Enter Full Name"
                // className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.orgLocation || ""}
                onChange={(e) =>
                  setData({ ...data, orgLocation: e.target.value })
                }
              />
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="joiningDate"
                className="text-gray-800 font-semibold text-sm"
              >
                Service Joining Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                id="joiningDate"
                max={today}
                // className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.joiningDate || ""}
                onChange={(e) =>
                  setData({ ...data, joiningDate: e.target.value })
                }
              />
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="serviceNature"
                className="text-gray-800 font-semibold text-sm"
              >
                Nature of Service <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.serviceNature}
                onValueChange={(value) =>
                  setData({ ...data, serviceNature: value })
                }
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="annualSalary"
                className="text-gray-800 font-semibold text-sm"
              >
                Gross Annual Salary Income{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                id="annualSalary"
                placeholder="Enter Annual Salary"
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.annualSalary || ""}
                onChange={(e) =>
                  setData({ ...data, annualSalary: e.target.value })
                }
              />
            </div>
          </div>

          {/* Contract End Date - Only visible when Nature of Service is Contract */}
          {data.serviceNature === "contract" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor="contractEndDate"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Contract End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  id="contractEndDate"
                  min={today}
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={data.contractEndDate || ""}
                  onChange={(e) =>
                    setData({ ...data, contractEndDate: e.target.value })
                  }
                  // required
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 md:gap-6 pt-3 sm:pt-4">
        <Button
          type="button"
          onClick={onBack}
          variant="secondary"
          size="lg"
          className="w-full sm:w-auto sm:min-w-32 md:min-w-40 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto sm:min-w-32 md:min-w-40 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-[#003DA5] hover:bg-[#002D7A]"
        >
          Next
        </Button>
      </div>

      {/* Co-Borrower Confirmation Dialog */}
      <AlertDialog
        open={showCoBorrowerDialog}
        onOpenChange={setShowCoBorrowerDialog}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-[#003DA5]">
              Co-Borrower Information
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600 pt-2">
              Do you have a co-borrower for this loan application?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel
              onClick={() => handleCoBorrowerResponse(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
            >
              No, Skip to Security Details
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleCoBorrowerResponse(true)}
              className="bg-[#003DA5] hover:bg-[#002D7A] text-white font-semibold"
            >
              Yes, Add Co-Borrower
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
