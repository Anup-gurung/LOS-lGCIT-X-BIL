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
import { Trash2, PlusCircle } from "lucide-react";

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
  fetchTaxIdentifierType,
} from "@/services/api";

interface SecurityDetailsFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
  formData: any;
}

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

// Helper to normalize tax identifier options (handles different API response structures)
const normalizeTaxIdentifierOptions = (data: any): any[] => {
  if (!data) return [];
  // If it's an array, assume it's already the list
  if (Array.isArray(data)) return data;
  // If it has a data property that is an array, use that (common pattern)
  if (data.data && Array.isArray(data.data)) return data.data;
  // If it has a data property that itself has data, go deeper
  if (data.data && data.data.data && Array.isArray(data.data.data))
    return data.data.data;
  // Fallback: try to find any array property
  for (const key in data) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
};

// Helper to map tax identifier type label to code (if needed)
const findTaxIdentifierCodeByLabel = (
  label: string,
  options: any[],
): string => {
  if (!label) return "";
  const lowerLabel = label.toLowerCase().trim();
  for (const opt of options) {
    const optLabel = (opt.tax_identifier_type || opt.name || "").toLowerCase().trim();
    if (optLabel.includes(lowerLabel) || lowerLabel.includes(optLabel)) {
      return String(opt.tax_identifier_type_pk_code || opt.id || "");
    }
  }
  return "";
};

// Initialize empty related PEP entry (Expanded structure without spouse details)
const createEmptyRelatedPep = () => ({
  // PEP Info
  relationship: "",
  identificationNo: "",
  category: "",
  subCategory: "",
  identificationProof: "",

  // Personal Info
  identificationType: "",
  salutation: "",
  applicantName: "",
  nationality: "",
  gender: "",
  identificationIssueDate: "",
  identificationExpiryDate: "",
  dateOfBirth: "",
  taxIdentifierType: "",
  tpn: "",
  householdNumber: "",
  maritalStatus: "",

  // PEP Permanent Address
  permCountry: "",
  permDzongkhag: "",
  permGewog: "",
  permVillage: "",
  permThram: "",
  permHouse: "",
  permAddressProof: "",

  // PEP Current Address
  currCountry: "",
  currDzongkhag: "",
  currGewog: "",
  currVillage: "",
  currFlat: "",
  currAddressProof: "",
  currEmail: "",
  currContact: "",
  currAlternateContact: "",
});

// Initialize empty security entry
const createEmptySecurity = () => ({
  securityType: "",
  ownershipType: "",
  // Vehicle fields
  vehicleType: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  registrationNo: "",
  chassisNo: "",
  engineNo: "",
  // Land/Property fields
  thramNo: "",
  plotNo: "",
  area: "",
  landUse: "",
  dzongkhag: "",
  gewog: "",
  village: "",
  houseNo: "",
  // Insurance fields
  insuranceCompany: "",
  policyNo: "",
  insuranceValue: "",
  insuranceStartDate: "",
  insuranceExpiryDate: "",
  // PPF fields
  ppfInstitution: "",
  ppfFundNo: "",
  ppfAccountNo: "",
  ppfValue: "",
  // Share fields
  shareCompany: "",
  shareCertificateNo: "",
  shareRegistrationNo: "",
  // Stock fields
  stockName: "",
  stockQuantity: "",
  stockValue: "",
  // Equipment fields
  equipmentType: "",
  equipmentMake: "",
  equipmentModel: "",
  equipmentSerialNo: "",
  equipmentValue: "",
  // Fixed Deposit fields
  fdBank: "",
  fdAccountNo: "",
  fdAmount: "",
  fdMaturityDate: "",
  // Building fields
  buildingType: "",
  buildingArea: "",
  buildingYear: "",
  // Security Proof File Upload
  securityProof: "",
  // Local options for this specific row
  gewogOptions: [] as any[],
});

// Initialize empty guarantor with all required fields (Expanded structure)
const createEmptyGuarantor = () => ({
  // Personal Information
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
  taxIdentifierType: "", // <-- NEW field
  householdNumber: "",
  maritalStatus: "",
  familyTree: "",
  bankName: "",
  bankAccount: "",
  passportPhoto: "",
  idProof: "",

  // Expanded Spouse Info
  spouseIdentificationType: "",
  spouseIdentificationNo: "",
  spouseSalutation: "",
  spouseName: "",
  spouseNationality: "",
  spouseGender: "",
  spouseIdentificationIssueDate: "",
  spouseIdentificationExpiryDate: "",
  spouseTaxIdentifierType: "",
  spouseTpn: "",
  spouseDateOfBirth: "",
  spouseHouseholdNumber: "",
  spousePermCountry: "",
  spousePermDzongkhag: "",
  spousePermGewog: "",
  spousePermVillage: "",
  spousePermThram: "",
  spousePermHouse: "",
  spousePermAddressProof: "",
  spouseEmail: "",
  spouseContact: "",
  spouseAlternateContact: "",
  // NEW: Spouse Identity Proof Upload
  spouseIdProof: "",

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
  currHouse: "",
  email: "",
  contact: "",
  currAlternateContact: "",
  currAddressProof: "",

  // Employment Details
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

  // PEP Declaration
  isPep: "",
  pepCategory: "",
  pepSubCategory: "",
  relatedToPep: "",
  relatedPeps: [createEmptyRelatedPep()],

  // Lookup states
  showLookupPopup: false,
  lookupStatus: "searching" as "searching" | "found" | "not_found",
  fetchedCustomerData: null,
  errors: {} as Record<string, string>,

  // Dropdown options specific to this guarantor
  permGewogOptions: [] as any[],
  currGewogOptions: [] as any[],
  spousePermGewogOptions: [] as any[],
  pepSubCategoryOptions: [] as any[],
  relatedPepOptionsMap: {} as Record<number, any[]>,
  relatedPepPermGewogMap: {} as Record<number, any[]>,
  relatedPepCurrGewogMap: {} as Record<number, any[]>,
});

export function SecurityDetailsForm({
  onNext,
  onBack,
  formData,
}: SecurityDetailsFormProps) {
  // State for Securities
  const [securities, setSecurities] = useState<any[]>([createEmptySecurity()]);

  // State for Guarantors
  const [guarantors, setGuarantors] = useState<any[]>([createEmptyGuarantor()]);

  // Global/Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dropdown Options
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<any[]>([]);
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([]);
  const [banksOptions, setBanksOptions] = useState<any[]>([]);
  const [pepCategoryOptions, setPepCategoryOptions] = useState<any[]>([]);
  const [occupationOptions, setOccupationOptions] = useState<any[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<any[]>([]);
  // New state for tax identifier types
  const [taxIdentifierTypeOptions, setTaxIdentifierTypeOptions] = useState<any[]>([]);

  // Calculate date constraints
  const today = new Date().toISOString().split("T")[0];
  const fifteenYearsAgo = new Date();
  fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
  const maxDobDate = fifteenYearsAgo.toISOString().split("T")[0];

  // --- HELPER: Nationality Check ---
  const isNatBhutanese = (nationalityId: string) => {
    if (!nationalityId) return false;
    const n = nationalityOptions.find((opt) => {
      const pkCode = String(
        opt.nationality_pk_code || opt.id || opt.code || "",
      );
      return pkCode === String(nationalityId);
    });
    const label = n
      ? n.nationality || n.name || n.label || ""
      : String(nationalityId);
    const lowerLabel = label.toLowerCase();
    return lowerLabel.includes("bhutan") && !lowerLabel.includes("non");
  };

  const isBhutanCountry = (countryValue: string, options: any[]): boolean => {
    if (!countryValue) return false;
    if (String(countryValue).toLowerCase().includes("bhutan")) return true;
    const matchedOption = options.find(
      (c) =>
        String(c.country_pk_code || c.id || c.code) === String(countryValue),
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

  // --- HELPER: Determine if Married (Robust against IDs) ---
  const checkIsMarried = (statusValue: string | number) => {
    if (!statusValue) return false;
    const statusStr = String(statusValue).toLowerCase();
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
      return val == statusValue;
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
          identificationTypeRaw,
          country,
          dzongkhag,
          maritalStatus,
          banks,
          pepCategories,
          occupations,
          organizations,
          taxTypesRaw,
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
          fetchTaxIdentifierType().catch(() => []),
        ]);

        // Normalize tax identifier options
        const normalizedTaxTypes = normalizeTaxIdentifierOptions(taxTypesRaw);
        console.log("Normalized tax types:", normalizedTaxTypes); // for debugging

        // Exclude Corporate IDs ("Trade License", "Company Registration") for this individual form
        const filteredIdTypes = (identificationTypeRaw || []).filter(
          (opt: any) => {
            const label = String(
              opt.identity_type || opt.identification_type || opt.name || ""
            ).toLowerCase();
            return (
              !label.includes("trade license") &&
              !label.includes("company reg")
            );
          }
        );

        setNationalityOptions(nationality);
        setIdentificationTypeOptions(filteredIdTypes);
        setCountryOptions(country);
        setDzongkhagOptions(dzongkhag);
        setMaritalStatusOptions(maritalStatus);
        setBanksOptions(banks);
        setPepCategoryOptions(pepCategories || []);
        setOccupationOptions(
          occupations || [
            { id: "engineer", name: "Engineer" },
            { id: "teacher", name: "Teacher" },
          ],
        );
        setOrganizationOptions(
          organizations || [{ id: "org1", name: "Organization 1" }],
        );
        setTaxIdentifierTypeOptions(normalizedTaxTypes);
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

  // Load Gewogs for EACH Security Row Independently
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
            updatedGuarantors[i] = {
              ...updatedGuarantors[i],
              permGewogOptions: [],
            };
            needsUpdate = true;
          }
        }
      }
      if (needsUpdate) setGuarantors(updatedGuarantors);
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
            updatedGuarantors[i] = {
              ...updatedGuarantors[i],
              currGewogOptions: [],
            };
            needsUpdate = true;
          }
        }
      }
      if (needsUpdate) setGuarantors(updatedGuarantors);
    };
    loadCurrGewogs();
  }, [guarantors.map((g) => g.currDzongkhag).join(",")]);

  // Load spouse perm gewogs for all guarantors
  useEffect(() => {
    const loadSpousePermGewogs = async () => {
      const updatedGuarantors = [...guarantors];
      let needsUpdate = false;
      for (let i = 0; i < guarantors.length; i++) {
        const guarantor = guarantors[i];
        if (guarantor.spousePermDzongkhag) {
          try {
            const options = await fetchGewogsByDzongkhag(
              guarantor.spousePermDzongkhag,
            );
            updatedGuarantors[i] = {
              ...updatedGuarantors[i],
              spousePermGewogOptions: options,
            };
            needsUpdate = true;
          } catch (error) {
            updatedGuarantors[i] = {
              ...updatedGuarantors[i],
              spousePermGewogOptions: [],
            };
            needsUpdate = true;
          }
        }
      }
      if (needsUpdate) setGuarantors(updatedGuarantors);
    };
    loadSpousePermGewogs();
  }, [guarantors.map((g) => g.spousePermDzongkhag).join(",")]);

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
              pepSubCategoryOptions: options || [],
            };
            needsUpdate = true;
          } catch (error) {
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

      if (needsUpdate) setGuarantors(updatedGuarantors);
    };
    loadPepSubCategories();
  }, [guarantors.map((g) => `${g.isPep}-${g.pepCategory}`).join(",")]);

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
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        if (index === "main") {
          setErrors({
            ...errors,
            [fieldName]: "Only PDF, JPG, JPEG, and PNG files are allowed",
          });
        } else {
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
        }
        return;
      }

      if (file.size > maxSize) {
        if (index === "main") {
          setErrors({
            ...errors,
            [fieldName]: "File size must be less than 5MB",
          });
        } else {
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
        }
        return;
      }

      if (index === "main") {
        setErrors({ ...errors, [fieldName]: "" });
      } else {
        setGuarantors((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            [fieldName]: file.name,
            errors: {
              ...updated[index].errors,
              [fieldName]: "",
            },
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
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setErrors({
          ...errors,
          [`security-${index}-proof`]:
            "Only PDF, JPG, JPEG, and PNG files are allowed",
        });
        return;
      }

      if (file.size > maxSize) {
        setErrors({
          ...errors,
          [`security-${index}-proof`]: "File size must be less than 5MB",
        });
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

  const handleLookupProceed = (index: number) => {
    const guarantor = guarantors[index];
    if (guarantor.lookupStatus === "found" && guarantor.fetchedCustomerData) {
      // Map any tax identifier type if present
      const mappedTaxIdentifier = findTaxIdentifierCodeByLabel(
        guarantor.fetchedCustomerData.taxIdentifierType,
        taxIdentifierTypeOptions,
      );

      const formattedData = {
        nationality: guarantor.fetchedCustomerData.nationality
          ? String(guarantor.fetchedCustomerData.nationality)
          : "",
        idIssueDate: formatDateForInput(
          guarantor.fetchedCustomerData.identificationIssueDate,
        ),
        idExpiryDate: formatDateForInput(
          guarantor.fetchedCustomerData.identificationExpiryDate,
        ),
        dateOfBirth: formatDateForInput(
          guarantor.fetchedCustomerData.dateOfBirth,
        ),
        tpnNo: guarantor.fetchedCustomerData.tpn || "",
        householdNumber: guarantor.fetchedCustomerData.householdNumber || "",
        maritalStatus: guarantor.fetchedCustomerData.maritalStatus
          ? String(guarantor.fetchedCustomerData.maritalStatus)
          : "",
        gender: guarantor.fetchedCustomerData.gender
          ? String(guarantor.fetchedCustomerData.gender)
          : "",
        email: guarantor.fetchedCustomerData.email || "",
        contact: guarantor.fetchedCustomerData.contact || "",
        occupation: guarantor.fetchedCustomerData.occupation || "",
        taxIdentifierType: mappedTaxIdentifier || "", // <-- map to guarantor's field

        // Address
        permCountry: guarantor.fetchedCustomerData.permCountry
          ? String(guarantor.fetchedCustomerData.permCountry)
          : "",
        permDzongkhag: guarantor.fetchedCustomerData.permDzongkhag
          ? String(guarantor.fetchedCustomerData.permDzongkhag)
          : "",
        permGewog: guarantor.fetchedCustomerData.permGewog
          ? String(guarantor.fetchedCustomerData.permGewog)
          : "",
        permVillage: guarantor.fetchedCustomerData.permVillage || "",
        currCountry: guarantor.fetchedCustomerData.currCountry
          ? String(guarantor.fetchedCustomerData.currCountry)
          : "",
        currDzongkhag: guarantor.fetchedCustomerData.currDzongkhag
          ? String(guarantor.fetchedCustomerData.currDzongkhag)
          : "",
        currGewog: guarantor.fetchedCustomerData.currGewog
          ? String(guarantor.fetchedCustomerData.currGewog)
          : "",
        currVillage: guarantor.fetchedCustomerData.currVillage || "",
        spouseTaxIdentifierType: mappedTaxIdentifier, // optionally map if lookup provides it
      };

      setGuarantors((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...prev[index],
          ...formattedData,
          guarantorName:
            guarantor.fetchedCustomerData.name || prev[index].guarantorName,
          salutation:
            guarantor.fetchedCustomerData.salutation || prev[index].salutation,
          // Preserve ID fields
          idType: prev[index].idType,
          idNumber: prev[index].idNumber,
          showLookupPopup: false,
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

      // Cleanup options maps
      const cleanMap = (mapObj: Record<number, any[]>) => {
        const newMap: Record<number, any[]> = { ...mapObj };
        Object.keys(newMap).forEach((key) => {
          const keyNum = parseInt(key);
          if (keyNum > pepIndex) {
            newMap[keyNum - 1] = newMap[keyNum];
            delete newMap[keyNum];
          } else if (keyNum === pepIndex) {
            delete newMap[keyNum];
          }
        });
        return newMap;
      };

      updated[guarantorIndex] = {
        ...updated[guarantorIndex],
        relatedPeps: updatedPeps,
        relatedPepOptionsMap: cleanMap(
          updated[guarantorIndex].relatedPepOptionsMap || {},
        ),
        relatedPepPermGewogMap: cleanMap(
          updated[guarantorIndex].relatedPepPermGewogMap || {},
        ),
        relatedPepCurrGewogMap: cleanMap(
          updated[guarantorIndex].relatedPepCurrGewogMap || {},
        ),
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

      // Dynamic Fetches
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
          .catch(() => { });
      }

      if (field === "permDzongkhag") {
        updatedPeps[pepIndex].permGewog = "";
        fetchGewogsByDzongkhag(value)
          .then((options) => {
            setGuarantors((current) => {
              const currentUpdated = [...current];
              currentUpdated[guarantorIndex] = {
                ...currentUpdated[guarantorIndex],
                relatedPepPermGewogMap: {
                  ...currentUpdated[guarantorIndex].relatedPepPermGewogMap,
                  [pepIndex]: options || [],
                },
              };
              return currentUpdated;
            });
          })
          .catch(() => { });
      }

      if (field === "currDzongkhag") {
        updatedPeps[pepIndex].currGewog = "";
        fetchGewogsByDzongkhag(value)
          .then((options) => {
            setGuarantors((current) => {
              const currentUpdated = [...current];
              currentUpdated[guarantorIndex] = {
                ...currentUpdated[guarantorIndex],
                relatedPepCurrGewogMap: {
                  ...currentUpdated[guarantorIndex].relatedPepCurrGewogMap,
                  [pepIndex]: options || [],
                },
              };
              return currentUpdated;
            });
          })
          .catch(() => { });
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

      setGuarantors((prev) => {
        const updated = [...prev];
        const updatedPeps = [...(updated[guarantorIndex].relatedPeps || [])];
        if (!updatedPeps[pepIndex]) {
          updatedPeps[pepIndex] = createEmptyRelatedPep();
        }

        updatedPeps[pepIndex] = {
          ...updatedPeps[pepIndex],
          [field]: file.name,
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
      updated[index] = {
        ...updated[index],
        [field]: value,
        ...(field === "isPep" && value === "yes" ? { relatedToPep: "" } : {}),
        ...(field === "isPep" && value === "no"
          ? {
            pepCategory: "",
            pepSubCategory: "",
          }
          : {}),
        ...(field === "relatedToPep" && value === "no"
          ? { relatedPeps: [] }
          : {}),
        errors: {
          ...updated[index].errors,
          [field]: "",
        },
      };
      return updated;
    });
  };

  const validateAllGuarantors = (): boolean => {
    let isValid = true;
    const updatedGuarantors = [...guarantors];

    guarantors.forEach((guarantor, index) => {
      const errors: Record<string, string> = {};

      if (!guarantor.idType) errors.idType = "Required";
      if (!guarantor.idNumber) errors.idNumber = "Required";
      if (!guarantor.guarantorName) errors.guarantorName = "Required";
      if (!guarantor.nationality) errors.nationality = "Required";
      if (!guarantor.dateOfBirth) errors.dateOfBirth = "Required";
      if (!guarantor.maritalStatus) errors.maritalStatus = "Required";
      if (!guarantor.gender) errors.gender = "Required";
      if (!guarantor.email) errors.email = "Required";
      if (!guarantor.contact) errors.contact = "Required";

      if (!guarantor.permCountry) errors.permCountry = "Required";
      if (!guarantor.permDzongkhag) errors.permDzongkhag = "Required";
      if (!guarantor.permVillage) errors.permVillage = "Required";

      if (!guarantor.isPep) errors.isPep = "Required";
      if (guarantor.isPep === "yes") {
        if (!guarantor.pepCategory) errors.pepCategory = "Required";
        if (!guarantor.pepSubCategory) errors.pepSubCategory = "Required";
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
            ...prev, [`security-${index}-proof`]: "Security proof is required",
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
    if (!areSecuritiesValid) return;

    const hasThirdParty = securities.some(
      (s) => s.ownershipType === "third-party",
    );

    if (hasThirdParty) {
      const allGuarantorsValid = validateAllGuarantors();
      if (!allGuarantorsValid) return;
    }

    const securityData = {
      securityDetails: securities,
      additionalGuarantors: guarantors,
    };

    const existingData = sessionStorage.getItem("loanApplicationData");
    const allData = existingData ? JSON.parse(existingData) : {};

    const updatedData = { ...allData, ...securityData };
    sessionStorage.setItem("loanApplicationData", JSON.stringify(updatedData));

    onNext(securityData);
  };

  const renderSecurityProofUpload = (security: any, secIndex: number) => {
    const securityType = security.securityType;
    const proofFileName = security.securityProof || "No file chosen";

    const getUploadLabel = () => {
      switch (securityType) {
        case "vehicle":
          return "Upload Vehicle Proof (Registration, Insurance)";
        case "land":
          return "Upload Land Proof (Thram Copy)";
        case "building":
          return "Upload Building Proof (Building Approval, Valuation Report)";
        case "equipment":
          return "Upload Equipment Proof ( Invoice No / Registration No)";
        case "insurance":
          return "Upload Insurance Policy Document";
        case "PPF":
          return "Upload PPF Statement/Certificate";
        case "Share":
          return "Upload Share Certificate/Proof";
        case "Stocks":
          return "Upload Stock List ";
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
        <div className="flex items-center gap-2">
          <input
            type="file"
            id={`security-proof-${secIndex}`}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) =>
              handleSecurityFileChange(secIndex, e.target.files?.[0] || null)
            }
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-28 bg-transparent"
            onClick={() =>
              document.getElementById(`security-proof-${secIndex}`)?.click()
            }
          >
            Choose File
          </Button>
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {proofFileName}
          </span>
        </div>
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

  const renderGuarantorForm = (guarantor: any, index: number) => {
    const isMarried = checkIsMarried(guarantor.maritalStatus);
    const relatedPeps = guarantor.relatedPeps || [createEmptyRelatedPep()];
    const errors = guarantor.errors || {};

    // Filter tax identifier options to only show "Personal Income Tax" (more lenient matching)
    const filteredTaxOptions = taxIdentifierTypeOptions.filter(opt => {
      const label = (opt.tax_identifier_type || opt.name || '').toLowerCase();
      return label.includes('personal') && label.includes('income') && label.includes('tax') ||
        label.includes('pit');
    });

    return (
      <div
        key={index}
        className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm mb-8"
      >
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

        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
            Guarantor Personal Information
          </h2>

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
                <SelectTrigger
                  className={`h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.idType ? "border-red-500" : ""}`}
                >
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
              <Input
                id={`id-number-${index}`}
                placeholder="Enter identification No"
                className={`h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.idNumber ? "border-red-500" : ""}`}
                value={guarantor.idNumber || ""}
                onChange={(e) =>
                  updateGuarantorField(index, "idNumber", e.target.value)
                }
                onBlur={() => handleIdentityCheck(index)}
                required
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
                <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="mr">Mr.</SelectItem>
                  <SelectItem value="mrs">Mrs.</SelectItem>
                  <SelectItem value="ms">Ms.</SelectItem>
                  <SelectItem value="dr">Dr.</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`guarantor-name-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Guarantor Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`guarantor-name-${index}`}
                placeholder="Enter Your Full Name"
                className={`h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.guarantorName ? "border-red-500" : ""}`}
                value={guarantor.guarantorName || ""}
                onChange={(e) =>
                  updateGuarantorField(index, "guarantorName", e.target.value)
                }
                required
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
                <SelectTrigger
                  className={`h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.nationality ? "border-red-500" : ""}`}
                >
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
                <SelectTrigger
                  className={`h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.gender ? "border-red-500" : ""}`}
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
                className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                value={formatDateForInput(guarantor.idIssueDate)}
                onChange={(e) =>
                  updateGuarantorField(index, "idIssueDate", e.target.value)
                }
                required
              />
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
                className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                value={formatDateForInput(guarantor.idExpiryDate)}
                onChange={(e) =>
                  updateGuarantorField(index, "idExpiryDate", e.target.value)
                }
                required
              />
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
                className={`h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.dateOfBirth ? "border-red-500" : ""}`}
                value={formatDateForInput(guarantor.dateOfBirth)}
                onChange={(e) =>
                  updateGuarantorField(index, "dateOfBirth", e.target.value)
                }
                required
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
              <Input
                id={`tpn-no-${index}`}
                placeholder="Enter TPN"
                className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                value={guarantor.tpnNo || ""}
                onChange={(e) =>
                  updateGuarantorField(index, "tpnNo", e.target.value)
                }
              />
            </div>

            {/* NEW: Tax Identifier Type for Guarantor */}
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`taxIdentifierType-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Tax Identifier Type
              </Label>
              <Select
                value={guarantor.taxIdentifierType || ""}
                onValueChange={(value) =>
                  updateGuarantorField(index, "taxIdentifierType", value)
                }
              >
                <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {filteredTaxOptions.length > 0 ? (
                    filteredTaxOptions.map((opt, idx) => {
                      const value = String(opt.tax_identifier_type_pk_code || opt.id || idx);
                      const label = opt.tax_identifier_type || opt.name || 'Personal Income Tax';
                      return (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="loading" disabled>
                      No options available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {isNatBhutanese(guarantor.nationality) && (
              <div className="space-y-1.5 sm:space-y-2.5">
                <Label
                  htmlFor={`household-number-${index}`}
                  className="text-gray-800 font-semibold text-xs sm:text-sm"
                >
                  Household Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`household-number-${index}`}
                  placeholder="Enter Household Number"
                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                  value={guarantor.householdNumber || ""}
                  onChange={(e) =>
                    updateGuarantorField(
                      index,
                      "householdNumber",
                      e.target.value,
                    )
                  }
                  required
                />
              </div>
            )}

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
                  className={`h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.maritalStatus ? "border-red-500" : ""}`}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t mt-4">
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`family-tree-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Upload Family Tree
              </Label>
              <div className="flex items-center gap-2">
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-28 bg-transparent"
                  onClick={() =>
                    document
                      .getElementById(`family-tree-input-${index}`)
                      ?.click()
                  }
                >
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground">
                  {guarantor.familyTree || "No file chosen"}
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
                <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base">
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
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`bankAccount-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Bank Saving Account No <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`bankAccount-${index}`}
                placeholder="Enter saving account number"
                className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                value={guarantor.bankAccount || ""}
                onChange={(e) =>
                  updateGuarantorField(index, "bankAccount", e.target.value)
                }
              />
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
            <div className="flex items-center gap-2">
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-28 bg-transparent"
                onClick={() =>
                  document.getElementById(`uploadPassport-${index}`)?.click()
                }
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {guarantor.passportPhoto || "No file chosen"}
              </span>
            </div>
            {errors.passportPhoto && (
              <p className="text-xs text-red-500 mt-1">
                {errors.passportPhoto}
              </p>
            )}
            <p className="text-xs text-gray-500">Allowed: JPG, PNG (Max 5MB)</p>
          </div>

          {/* Normal Identification Proof Upload */}
          <div className="space-y-1.5 sm:space-y-2.5">
            <Label
              htmlFor={`idProof-${index}`}
              className="text-gray-800 font-semibold text-xs sm:text-sm"
            >
              Upload Identification Proof <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id={`idProof-${index}`}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  handleFileChange(
                    index,
                    "idProof",
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
                  document.getElementById(`idProof-${index}`)?.click()
                }
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {guarantor.idProof || "No file chosen"}
              </span>
            </div>
            {errors.idProof && (
              <p className="text-xs text-red-500 mt-1">{errors.idProof}</p>
            )}
            <p className="text-xs text-gray-500">
              Allowed: PDF, JPG, PNG (Max 5MB)
            </p>
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
                <SelectTrigger
                  className={`h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.permCountry ? "border-red-500" : ""}`}
                >
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
                {isBhutanCountry(guarantor.permCountry, countryOptions)
                  ? "Dzongkhag"
                  : "State"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {guarantor.permCountry &&
                !isBhutanCountry(guarantor.permCountry, countryOptions) ? (
                <Input
                  id={`permDzongkhag-${index}`}
                  placeholder="Enter State"
                  value={guarantor.permDzongkhag || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "permDzongkhag", e.target.value)
                  }
                  className={`h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.permDzongkhag ? "border-red-500" : ""}`}
                />
              ) : (
                <Select
                  value={guarantor.permDzongkhag || ""}
                  onValueChange={(value) =>
                    updateGuarantorField(index, "permDzongkhag", value)
                  }
                  disabled={
                    !isBhutanCountry(guarantor.permCountry, countryOptions)
                  }
                >
                  <SelectTrigger
                    className={`h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.permDzongkhag ? "border-red-500" : ""}`}
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
                {isBhutanCountry(guarantor.permCountry, countryOptions)
                  ? "Gewog"
                  : "Province"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {guarantor.permCountry &&
                !isBhutanCountry(guarantor.permCountry, countryOptions) ? (
                <Input
                  id={`permGewog-${index}`}
                  placeholder="Enter Province"
                  value={guarantor.permGewog || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "permGewog", e.target.value)
                  }
                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                />
              ) : (
                <Select
                  value={
                    isBhutanCountry(guarantor.permCountry, countryOptions)
                      ? guarantor.permGewog
                      : ""
                  }
                  onValueChange={(value) =>
                    updateGuarantorField(index, "permGewog", value)
                  }
                  disabled={
                    !isBhutanCountry(guarantor.permCountry, countryOptions)
                  }
                >
                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base">
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`permVillage-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                {isBhutanCountry(guarantor.permCountry, countryOptions)
                  ? "Village/Street"
                  : "Street"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`permVillage-${index}`}
                placeholder={
                  isBhutanCountry(guarantor.permCountry, countryOptions)
                    ? "Enter Village/Street"
                    : "Enter Street"
                }
                value={guarantor.permVillage || ""}
                onChange={(e) =>
                  updateGuarantorField(index, "permVillage", e.target.value)
                }
                disabled={!guarantor.permCountry}
                className={`h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.permVillage ? "border-red-500" : ""}`}
              />
              {errors.permVillage && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.permVillage}
                </p>
              )}
            </div>

            {isBhutanCountry(guarantor.permCountry, countryOptions) && (
              <>
                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label
                    htmlFor={`permThram-${index}`}
                    className="text-gray-800 font-semibold text-xs sm:text-sm"
                  >
                    Thram No
                  </Label>
                  <Input
                    id={`permThram-${index}`}
                    placeholder="Enter Thram No"
                    value={guarantor.permThram || ""}
                    onChange={(e) =>
                      updateGuarantorField(index, "permThram", e.target.value)
                    }
                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label
                    htmlFor={`permHouse-${index}`}
                    className="text-gray-800 font-semibold text-xs sm:text-sm"
                  >
                    House No
                  </Label>
                  <Input
                    id={`permHouse-${index}`}
                    placeholder="Enter House No"
                    value={guarantor.permHouse || ""}
                    onChange={(e) =>
                      updateGuarantorField(index, "permHouse", e.target.value)
                    }
                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                  />
                </div>
              </>
            )}
          </div>

          {guarantor.permCountry &&
            !isBhutanCountry(guarantor.permCountry, countryOptions) && (
              <div className="space-y-1.5 sm:space-y-2.5 mt-4">
                <Label
                  htmlFor={`permAddressProof-${index}`}
                  className="text-gray-800 font-semibold text-xs sm:text-sm"
                >
                  Upload Address Proof Document{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-28 bg-transparent"
                    onClick={() =>
                      document
                        .getElementById(`permAddressProof-${index}`)
                        ?.click()
                    }
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {guarantor.permAddressProof || "No file chosen"}
                  </span>
                </div>
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
                <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base">
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
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`currDzongkhag-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                {isBhutanCountry(guarantor.currCountry, countryOptions)
                  ? "Dzongkhag"
                  : "State"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {guarantor.currCountry &&
                !isBhutanCountry(guarantor.currCountry, countryOptions) ? (
                <Input
                  id={`currDzongkhag-${index}`}
                  placeholder="Enter State"
                  value={guarantor.currDzongkhag || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "currDzongkhag", e.target.value)
                  }
                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                />
              ) : (
                <Select
                  value={
                    isBhutanCountry(guarantor.currCountry, countryOptions)
                      ? guarantor.currDzongkhag
                      : ""
                  }
                  onValueChange={(value) =>
                    updateGuarantorField(index, "currDzongkhag", value)
                  }
                  disabled={
                    !isBhutanCountry(guarantor.currCountry, countryOptions)
                  }
                >
                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base">
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
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`currGewog-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                {isBhutanCountry(guarantor.currCountry, countryOptions)
                  ? "Gewog"
                  : "Province"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {guarantor.currCountry &&
                !isBhutanCountry(guarantor.currCountry, countryOptions) ? (
                <Input
                  id={`currGewog-${index}`}
                  placeholder="Enter Province"
                  value={guarantor.currGewog || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "currGewog", e.target.value)
                  }
                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                />
              ) : (
                <Select
                  value={
                    isBhutanCountry(guarantor.currCountry, countryOptions)
                      ? guarantor.currGewog
                      : ""
                  }
                  onValueChange={(value) =>
                    updateGuarantorField(index, "currGewog", value)
                  }
                  disabled={
                    !isBhutanCountry(guarantor.currCountry, countryOptions)
                  }
                >
                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base">
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`currVillage-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                {isBhutanCountry(guarantor.currCountry, countryOptions)
                  ? "Village/Street"
                  : "Street"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`currVillage-${index}`}
                placeholder={
                  isBhutanCountry(guarantor.currCountry, countryOptions)
                    ? "Enter Village/Street"
                    : "Enter Street"
                }
                value={guarantor.currVillage || ""}
                onChange={(e) =>
                  updateGuarantorField(index, "currVillage", e.target.value)
                }
                disabled={!guarantor.currCountry}
                className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label
                htmlFor={`currHouse-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                House/Flat No
              </Label>
              <Input
                id={`currHouse-${index}`}
                placeholder="Enter House/Flat No"
                value={
                  !isBhutanCountry(guarantor.currCountry, countryOptions)
                    ? ""
                    : guarantor.currHouse || ""
                }
                onChange={(e) =>
                  updateGuarantorField(index, "currHouse", e.target.value)
                }
                disabled={
                  !isBhutanCountry(guarantor.currCountry, countryOptions)
                }
                className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
              />
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
                  value={guarantor.email || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "email", e.target.value)
                  }
                  className={`h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.email ? "border-red-500" : ""}`}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
            )}
          </div>

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
                  <Input
                    id={`contact-${index}`}
                    placeholder="Enter Contact Number"
                    value={guarantor.contact || ""}
                    onChange={(e) =>
                      updateGuarantorField(index, "contact", e.target.value)
                    }
                    className={`h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.contact ? "border-red-500" : ""}`}
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
                  <Input
                    id={`currAlternateContact-${index}`}
                    placeholder="Enter Contact No"
                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                    value={guarantor.currAlternateContact || ""}
                    onChange={(e) =>
                      updateGuarantorField(
                        index,
                        "currAlternateContact",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </>
          )}

          {guarantor.currCountry &&
            !isBhutanCountry(guarantor.currCountry, countryOptions) && (
              <div className="space-y-1.5 sm:space-y-2.5 mt-4">
                <Label
                  htmlFor={`currAddressProof-${index}`}
                  className="text-gray-800 font-semibold text-xs sm:text-sm"
                >
                  Upload Address Proof Document{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-28 bg-transparent"
                    onClick={() =>
                      document
                        .getElementById(`currAddressProof-${index}`)
                        ?.click()
                    }
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {guarantor.currAddressProof || "No file chosen"}
                  </span>
                </div>
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
                <SelectTrigger
                  className={`h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.isPep ? "border-red-500" : ""}`}
                >
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
                      className={`h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.pepCategory ? "border-red-500" : ""}`}
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
                      className={`h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base ${errors.pepSubCategory ? "border-red-500" : ""}`}
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
                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* RELATED PEP MULTIPLE ENTRIES */}
          {guarantor.isPep === "no" && guarantor.relatedToPep === "yes" && (
            <div className="space-y-8 pt-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-lg font-bold text-[#003DA5]">
                  Related PEP Details
                </h3>
              </div>

              {relatedPeps.map((pep: any, pepIndex: number) => (
                <div
                  key={pepIndex}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-6 relative shadow-sm"
                >
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-md font-bold text-gray-700">
                      Person {pepIndex + 1}
                    </span>
                    {relatedPeps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRelatedPep(index, pepIndex)}
                        className="hover:bg-red-50"
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </Button>
                    )}
                  </div>

                  {/* PEP Declaration Information */}
                  <h4 className="text-sm font-bold text-[#003DA5] mb-4 uppercase tracking-wide">
                    PEP Declaration Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="space-y-2.5 w-full">
                      <Label className="text-gray-800 font-semibold text-sm">
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
                        <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="spouse">Spouse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5 w-full">
                      <Label className="text-gray-800 font-semibold text-sm">
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
                        <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
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
                    </div>

                    <div className="space-y-2.5 w-full">
                      <Label className="text-gray-800 font-semibold text-sm">
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
                        <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
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
                    </div>

                    <div className="space-y-2.5 w-full">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Upload Identification Proof <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id={`uploadId-${index}-${pepIndex}`}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) =>
                            handleRelatedPepFileChange(
                              index,
                              pepIndex,
                              "identificationProof",
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
                            document
                              .getElementById(`uploadId-${index}-${pepIndex}`)
                              ?.click()
                          }
                        >
                          Choose File
                        </Button>
                        <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {pep.identificationProof || "No file chosen"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <h4 className="text-sm font-bold text-[#003DA5] mb-4 uppercase tracking-wide">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Identification Type{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={pep.identificationType}
                        onValueChange={(value) =>
                          handleRelatedPepChange(
                            index,
                            pepIndex,
                            "identificationType",
                            value,
                          )
                        }
                      >
                        <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {identificationTypeOptions.map((opt, i) => (
                            <SelectItem
                              key={i}
                              value={String(
                                opt.identity_type_pk_code || opt.id || i,
                              )}
                            >
                              {opt.identity_type ||
                                opt.identification_type ||
                                "Unknown"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Identification No.{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter ID No"
                        className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
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
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Salutation <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={pep.salutation || ""}
                        onValueChange={(value) =>
                          handleRelatedPepChange(
                            index,
                            pepIndex,
                            "salutation",
                            value,
                          )
                        }
                      >
                        <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          <SelectItem value="mr">Mr.</SelectItem>
                          <SelectItem value="mrs">Mrs.</SelectItem>
                          <SelectItem value="ms">Ms.</SelectItem>
                          <SelectItem value="dr">Dr.</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Applicant Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Full Name"
                        className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                        value={pep.applicantName || ""}
                        onChange={(e) =>
                          handleRelatedPepChange(
                            index,
                            pepIndex,
                            "applicantName",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Nationality <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={pep.nationality}
                        onValueChange={(value) =>
                          handleRelatedPepChange(
                            index,
                            pepIndex,
                            "nationality",
                            value,
                          )
                        }
                      >
                        <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {nationalityOptions.map((opt, i) => (
                            <SelectItem
                              key={i}
                              value={String(
                                opt.nationality_pk_code || opt.id || i,
                              )}
                            >
                              {opt.nationality || opt.name || "Unknown"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Gender <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={pep.gender || ""}
                        onValueChange={(value) =>
                          handleRelatedPepChange(
                            index,
                            pepIndex,
                            "gender",
                            value,
                          )
                        }
                      >
                        <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Identification Issue Date{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        max={today}
                        className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                        value={pep.identificationIssueDate || ""}
                        onChange={(e) =>
                          handleRelatedPepChange(
                            index,
                            pepIndex,
                            "identificationIssueDate",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Identification Expiry Date{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        min={today}
                        className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                        value={pep.identificationExpiryDate || ""}
                        onChange={(e) =>
                          handleRelatedPepChange(
                            index,
                            pepIndex,
                            "identificationExpiryDate",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Date of Birth <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        max={maxDobDate}
                        className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                        value={pep.dateOfBirth || ""}
                        onChange={(e) =>
                          handleRelatedPepChange(
                            index,
                            pepIndex,
                            "dateOfBirth",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    {/* Tax Identifier Type - Not required, shows only PIT */}
                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Tax Identifier Type
                      </Label>
                      <Select
                        value={pep.taxIdentifierType || ""}
                        onValueChange={(value) =>
                          handleRelatedPepChange(
                            index,
                            pepIndex,
                            "taxIdentifierType",
                            value,
                          )
                        }
                      >
                        <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {filteredTaxOptions.length > 0 ? (
                            filteredTaxOptions.map((opt, idx) => {
                              const value = String(opt.tax_identifier_type_pk_code || opt.id || idx);
                              const label = opt.tax_identifier_type || opt.name || 'Personal Income Tax';
                              return (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              );
                            })
                          ) : (
                            <SelectItem value="loading" disabled>
                              No options available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        TPN No
                      </Label>
                      <Input
                        placeholder="Enter TPN"
                        className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                        value={pep.tpn || ""}
                        onChange={(e) =>
                          handleRelatedPepChange(
                            index,
                            pepIndex,
                            "tpn",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    {isNatBhutanese(pep.nationality) && (
                      <div className="space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-sm">
                          Household Number{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Enter Household No"
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                          value={pep.householdNumber || ""}
                          onChange={(e) =>
                            handleRelatedPepChange(
                              index,
                              pepIndex,
                              "householdNumber",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Marital Status <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={String(pep.maritalStatus || "")}
                        onValueChange={(value) =>
                          handleRelatedPepChange(
                            index,
                            pepIndex,
                            "maritalStatus",
                            value,
                          )
                        }
                      >
                        <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {maritalStatusOptions.map((opt, i) => (
                            <SelectItem
                              key={i}
                              value={String(
                                opt.marital_status_pk_code || opt.id || i,
                              )}
                            >
                              {opt.marital_status || opt.name || "Unknown"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* PEP Permanent Address */}
                  <div className="mt-8 border-t border-dashed pt-8">
                    <h4 className="text-sm font-bold text-[#003DA5] mb-4 uppercase tracking-wide">
                      Permanent Address
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <div className="space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-sm">
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={pep.permCountry || ""}
                          onValueChange={(value) =>
                            handleRelatedPepChange(
                              index,
                              pepIndex,
                              "permCountry",
                              value,
                            )
                          }
                        >
                          <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent sideOffset={4}>
                            {countryOptions.map((opt, i) => (
                              <SelectItem
                                key={i}
                                value={String(
                                  opt.country_pk_code || opt.id || i,
                                )}
                              >
                                {opt.country || opt.name || "Unknown"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-sm">
                          {isBhutanCountry(pep.permCountry, countryOptions)
                            ? "Dzongkhag"
                            : "State"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        {pep.permCountry &&
                          !isBhutanCountry(pep.permCountry, countryOptions) ? (
                          <Input
                            placeholder="Enter State"
                            className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                            value={pep.permDzongkhag || ""}
                            onChange={(e) =>
                              handleRelatedPepChange(
                                index,
                                pepIndex,
                                "permDzongkhag",
                                e.target.value,
                              )
                            }
                          />
                        ) : (
                          <Select
                            value={pep.permDzongkhag || ""}
                            onValueChange={(value) =>
                              handleRelatedPepChange(
                                index,
                                pepIndex,
                                "permDzongkhag",
                                value,
                              )
                            }
                            disabled={
                              !isBhutanCountry(pep.permCountry, countryOptions)
                            }
                          >
                            <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent sideOffset={4}>
                              {dzongkhagOptions.map((opt, i) => (
                                <SelectItem
                                  key={i}
                                  value={String(
                                    opt.dzongkhag_pk_code || opt.id || i,
                                  )}
                                >
                                  {opt.dzongkhag || opt.name || "Unknown"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-sm">
                          {isBhutanCountry(pep.permCountry, countryOptions)
                            ? "Gewog"
                            : "Province"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        {pep.permCountry &&
                          !isBhutanCountry(pep.permCountry, countryOptions) ? (
                          <Input
                            placeholder="Enter Province"
                            className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                            value={pep.permGewog || ""}
                            onChange={(e) =>
                              handleRelatedPepChange(
                                index,
                                pepIndex,
                                "permGewog",
                                e.target.value,
                              )
                            }
                          />
                        ) : (
                          <Select
                            value={pep.permGewog || ""}
                            onValueChange={(value) =>
                              handleRelatedPepChange(
                                index,
                                pepIndex,
                                "permGewog",
                                value,
                              )
                            }
                            disabled={
                              !isBhutanCountry(pep.permCountry, countryOptions)
                            }
                          >
                            <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent sideOffset={4}>
                              {guarantor.relatedPepPermGewogMap?.[pepIndex]
                                ?.length > 0 ? (
                                guarantor.relatedPepPermGewogMap[pepIndex].map(
                                  (opt: any, i: number) => (
                                    <SelectItem
                                      key={i}
                                      value={String(
                                        opt.gewog_pk_code || opt.id || i,
                                      )}
                                    >
                                      {opt.gewog || opt.name || "Unknown"}
                                    </SelectItem>
                                  ),
                                )
                              ) : (
                                <SelectItem value="loading" disabled>
                                  {pep.permDzongkhag
                                    ? "Loading..."
                                    : "Select Dzongkhag first"}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-sm">
                          {isBhutanCountry(pep.permCountry, countryOptions)
                            ? "Village/Street"
                            : "Street"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Enter Location"
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                          value={pep.permVillage || ""}
                          onChange={(e) =>
                            handleRelatedPepChange(
                              index,
                              pepIndex,
                              "permVillage",
                              e.target.value,
                            )
                          }
                          disabled={!pep.permCountry}
                        />
                      </div>

                      {isBhutanCountry(pep.permCountry, countryOptions) && (
                        <>
                          <div className="space-y-2.5">
                            <Label className="text-gray-800 font-semibold text-sm">
                              Thram No. <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              placeholder="Enter Thram No"
                              className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                              value={pep.permThram || ""}
                              onChange={(e) =>
                                handleRelatedPepChange(
                                  index,
                                  pepIndex,
                                  "permThram",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2.5">
                            <Label className="text-gray-800 font-semibold text-sm">
                              House No. <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              placeholder="Enter House No"
                              className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                              value={pep.permHouse || ""}
                              onChange={(e) =>
                                handleRelatedPepChange(
                                  index,
                                  pepIndex,
                                  "permHouse",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {pep.permCountry &&
                      !isBhutanCountry(pep.permCountry, countryOptions) && (
                        <div className="space-y-2.5 mb-8">
                          <Label className="text-gray-800 font-semibold text-sm">
                            Upload Address Proof Document{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              id={`pepPermProof-${index}-${pepIndex}`}
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                handleRelatedPepFileChange(
                                  index,
                                  pepIndex,
                                  "permAddressProof",
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
                                document
                                  .getElementById(
                                    `pepPermProof-${index}-${pepIndex}`,
                                  )
                                  ?.click()
                              }
                            >
                              Choose File
                            </Button>
                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {pep.permAddressProof || "No file chosen"}
                            </span>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* PEP Current/Residential Address */}
                  <div className="mt-8 border-t border-dashed pt-8">
                    <h4 className="text-sm font-bold text-[#003DA5] mb-4 uppercase tracking-wide">
                      Current/Residential Address
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <div className="space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-sm">
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={pep.currCountry || ""}
                          onValueChange={(value) =>
                            handleRelatedPepChange(
                              index,
                              pepIndex,
                              "currCountry",
                              value,
                            )
                          }
                        >
                          <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent sideOffset={4}>
                            {countryOptions.map((opt, i) => (
                              <SelectItem
                                key={i}
                                value={String(
                                  opt.country_pk_code || opt.id || i,
                                )}
                              >
                                {opt.country || opt.name || "Unknown"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-sm">
                          {isBhutanCountry(pep.currCountry, countryOptions)
                            ? "Dzongkhag"
                            : "State"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        {pep.currCountry &&
                          !isBhutanCountry(pep.currCountry, countryOptions) ? (
                          <Input
                            placeholder="Enter State"
                            className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                            value={pep.currDzongkhag || ""}
                            onChange={(e) =>
                              handleRelatedPepChange(
                                index,
                                pepIndex,
                                "currDzongkhag",
                                e.target.value,
                              )
                            }
                          />
                        ) : (
                          <Select
                            value={pep.currDzongkhag || ""}
                            onValueChange={(value) =>
                              handleRelatedPepChange(
                                index,
                                pepIndex,
                                "currDzongkhag",
                                value,
                              )
                            }
                            disabled={
                              !isBhutanCountry(pep.currCountry, countryOptions)
                            }
                          >
                            <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent sideOffset={4}>
                              {dzongkhagOptions.map((opt, i) => (
                                <SelectItem
                                  key={i}
                                  value={String(
                                    opt.dzongkhag_pk_code || opt.id || i,
                                  )}
                                >
                                  {opt.dzongkhag || opt.name || "Unknown"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-sm">
                          {isBhutanCountry(pep.currCountry, countryOptions)
                            ? "Gewog"
                            : "Province"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        {pep.currCountry &&
                          !isBhutanCountry(pep.currCountry, countryOptions) ? (
                          <Input
                            placeholder="Enter Province"
                            className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                            value={pep.currGewog || ""}
                            onChange={(e) =>
                              handleRelatedPepChange(
                                index,
                                pepIndex,
                                "currGewog",
                                e.target.value,
                              )
                            }
                          />
                        ) : (
                          <Select
                            value={pep.currGewog || ""}
                            onValueChange={(value) =>
                              handleRelatedPepChange(
                                index,
                                pepIndex,
                                "currGewog",
                                value,
                              )
                            }
                            disabled={
                              !isBhutanCountry(pep.currCountry, countryOptions)
                            }
                          >
                            <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent sideOffset={4}>
                              {guarantor.relatedPepCurrGewogMap?.[pepIndex]
                                ?.length > 0 ? (
                                guarantor.relatedPepCurrGewogMap[pepIndex].map(
                                  (opt: any, i: number) => (
                                    <SelectItem
                                      key={i}
                                      value={String(
                                        opt.gewog_pk_code || opt.id || i,
                                      )}
                                    >
                                      {opt.gewog || opt.name || "Unknown"}
                                    </SelectItem>
                                  ),
                                )
                              ) : (
                                <SelectItem value="loading" disabled>
                                  {pep.currDzongkhag
                                    ? "Loading..."
                                    : "Select Dzongkhag first"}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-sm">
                          {isBhutanCountry(pep.currCountry, countryOptions)
                            ? "Village/Street"
                            : "Street"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Enter Location"
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                          value={pep.currVillage || ""}
                          onChange={(e) =>
                            handleRelatedPepChange(
                              index,
                              pepIndex,
                              "currVillage",
                              e.target.value,
                            )
                          }
                          disabled={!pep.currCountry}
                        />
                      </div>

                      {isBhutanCountry(pep.currCountry, countryOptions) && (
                        <div className="space-y-2.5">
                          <Label className="text-gray-800 font-semibold text-sm">
                            Flat No. <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder="Enter Flat No"
                            className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                            value={pep.currFlat || ""}
                            onChange={(e) =>
                              handleRelatedPepChange(
                                index,
                                pepIndex,
                                "currFlat",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      )}
                    </div>

                    {pep.currCountry &&
                      !isBhutanCountry(pep.currCountry, countryOptions) && (
                        <div className="space-y-2.5 mb-8">
                          <Label className="text-gray-800 font-semibold text-sm">
                            Upload Address Proof Document{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              id={`pepCurrProof-${index}-${pepIndex}`}
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                handleRelatedPepFileChange(
                                  index,
                                  pepIndex,
                                  "currAddressProof",
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
                                document
                                  .getElementById(
                                    `pepCurrProof-${index}-${pepIndex}`,
                                  )
                                  ?.click()
                              }
                            >
                              Choose File
                            </Button>
                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {pep.currAddressProof || "No file chosen"}
                            </span>
                          </div>
                        </div>
                      )}

                    <h5 className="text-sm font-bold text-gray-700 mb-4">
                      Contact Information
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-sm">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="email"
                          placeholder="Enter Email"
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                          value={pep.currEmail || ""}
                          onChange={(e) =>
                            handleRelatedPepChange(
                              index,
                              pepIndex,
                              "currEmail",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-sm">
                          Contact No. <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Enter Contact No"
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                          value={pep.currContact || ""}
                          onChange={(e) =>
                            handleRelatedPepChange(
                              index,
                              pepIndex,
                              "currContact",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-sm">
                          Alternate Contact No.
                        </Label>
                        <Input
                          placeholder="Enter Alternate Contact"
                          className="h-10 sm:h-12 w-full text-sm sm:text-base border border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          value={pep.currAlternateContact || ""}
                          onChange={(e) =>
                            handleRelatedPepChange(
                              index,
                              pepIndex,
                              "currAlternateContact",
                              e.target.value,
                            )
                          }
                        />
                      </div>
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
                <Input
                  id={`employeeId-${index}`}
                  placeholder="Enter ID"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={guarantor.employeeId || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "employeeId", e.target.value)
                  }
                />
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
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`orgLocation-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Organization Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`orgLocation-${index}`}
                  placeholder="Enter Full Name"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={guarantor.orgLocation || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "orgLocation", e.target.value)
                  }
                />
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
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={guarantor.joiningDate || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "joiningDate", e.target.value)
                  }
                />
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
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={guarantor.annualSalary || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "annualSalary", e.target.value)
                  }
                />
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
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
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
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conditional Spouse Details - Moved after Employment Details */}
        {isMarried && (
          <div className="mt-8 border-t pt-8 space-y-6">
            <h3 className="text-lg font-bold text-[#003DA5] mb-4">
              Spouse Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Identification Type{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={guarantor.spouseIdentificationType}
                  onValueChange={(value) =>
                    updateGuarantorField(
                      index,
                      "spouseIdentificationType",
                      value,
                    )
                  }
                >
                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {identificationTypeOptions.map((opt, i) => (
                      <SelectItem
                        key={i}
                        value={String(
                          opt.identity_type_pk_code || opt.id || i,
                        )}
                      >
                        {opt.identity_type ||
                          opt.identification_type ||
                          "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse ID No. <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter Spouse CID/ID"
                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                  value={guarantor.spouseIdentificationNo || ""}
                  onChange={(e) =>
                    updateGuarantorField(
                      index,
                      "spouseIdentificationNo",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Salutation <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={guarantor.spouseSalutation}
                  onValueChange={(value) =>
                    updateGuarantorField(index, "spouseSalutation", value)
                  }
                >
                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mr">Mr.</SelectItem>
                    <SelectItem value="mrs">Mrs.</SelectItem>
                    <SelectItem value="ms">Ms.</SelectItem>
                    <SelectItem value="dr">Dr.</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter Spouse Full Name"
                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                  value={guarantor.spouseName || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "spouseName", e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Nationality <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={guarantor.spouseNationality}
                  onValueChange={(value) =>
                    updateGuarantorField(index, "spouseNationality", value)
                  }
                >
                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    {nationalityOptions.map((opt, i) => (
                      <SelectItem
                        key={i}
                        value={String(opt.nationality_pk_code || opt.id || i)}
                      >
                        {opt.nationality || opt.name || "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Gender <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={guarantor.spouseGender}
                  onValueChange={(value) =>
                    updateGuarantorField(index, "spouseGender", value)
                  }
                >
                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse ID Issue Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  max={today}
                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                  value={guarantor.spouseIdentificationIssueDate || ""}
                  onChange={(e) =>
                    updateGuarantorField(
                      index,
                      "spouseIdentificationIssueDate",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse ID Expiry Date{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  min={today}
                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                  value={guarantor.spouseIdentificationExpiryDate || ""}
                  onChange={(e) =>
                    updateGuarantorField(
                      index,
                      "spouseIdentificationExpiryDate",
                      e.target.value,
                    )
                  }
                />
              </div>

              {/* Spouse Tax Identifier Type - Not required, shows only PIT */}
              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Tax Identifier Type
                </Label>
                <Select
                  value={guarantor.spouseTaxIdentifierType}
                  onValueChange={(value) =>
                    updateGuarantorField(
                      index,
                      "spouseTaxIdentifierType",
                      value,
                    )
                  }
                >
                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTaxOptions.length > 0 ? (
                      filteredTaxOptions.map((opt, idx) => {
                        const value = String(opt.tax_identifier_type_pk_code || opt.id || idx);
                        const label = opt.tax_identifier_type || opt.name || 'Personal Income Tax';
                        return (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="loading" disabled>
                        No options available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse TPN No
                </Label>
                <Input
                  placeholder="Enter TPN"
                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                  value={guarantor.spouseTpn || ""}
                  onChange={(e) =>
                    updateGuarantorField(index, "spouseTpn", e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Date of Birth <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  max={maxDobDate}
                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                  value={guarantor.spouseDateOfBirth || ""}
                  onChange={(e) =>
                    updateGuarantorField(
                      index,
                      "spouseDateOfBirth",
                      e.target.value,
                    )
                  }
                />
              </div>

              {isNatBhutanese(guarantor.spouseNationality) && (
                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                    Spouse Household Number{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Enter Household Number"
                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                    value={guarantor.spouseHouseholdNumber || ""}
                    onChange={(e) =>
                      updateGuarantorField(
                        index,
                        "spouseHouseholdNumber",
                        e.target.value,
                      )
                    }
                  />
                </div>
              )}
            </div>

            {/* NEW: Spouse Identity Proof Upload */}
            <div className="space-y-1.5 sm:space-y-2.5 mt-4">
              <Label
                htmlFor={`spouseIdProof-${index}`}
                className="text-gray-800 font-semibold text-xs sm:text-sm"
              >
                Upload Spouse Identification Proof <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id={`spouseIdProof-${index}`}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    handleFileChange(
                      index,
                      "spouseIdProof",
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
                    document.getElementById(`spouseIdProof-${index}`)?.click()
                  }
                >
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground">
                  {guarantor.spouseIdProof || "No file chosen"}
                </span>
              </div>
              {errors.spouseIdProof && (
                <p className="text-xs text-red-500 mt-1">{errors.spouseIdProof}</p>
              )}
              <p className="text-xs text-gray-500">
                Allowed: PDF, JPG, PNG (Max 5MB)
              </p>
            </div>

            {/* Spouse Permanent Address */}
            <div className="mt-6 pt-6 border-t border-dashed">
              <h4 className="text-md font-semibold text-gray-700 mb-4">
                Spouse Permanent Address
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                    Spouse Country <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={guarantor.spousePermCountry}
                    onValueChange={(value) =>
                      updateGuarantorField(index, "spousePermCountry", value)
                    }
                  >
                    <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((opt, i) => (
                        <SelectItem
                          key={i}
                          value={String(opt.country_pk_code || opt.id || i)}
                        >
                          {opt.country || opt.name || "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                    {isBhutanCountry(
                      guarantor.spousePermCountry,
                      countryOptions,
                    )
                      ? "Spouse Dzongkhag"
                      : "Spouse State"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  {guarantor.spousePermCountry &&
                    !isBhutanCountry(
                      guarantor.spousePermCountry,
                      countryOptions,
                    ) ? (
                    <Input
                      placeholder="Enter State"
                      className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                      value={guarantor.spousePermDzongkhag || ""}
                      onChange={(e) =>
                        updateGuarantorField(
                          index,
                          "spousePermDzongkhag",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <Select
                      value={guarantor.spousePermDzongkhag}
                      onValueChange={(value) =>
                        updateGuarantorField(
                          index,
                          "spousePermDzongkhag",
                          value,
                        )
                      }
                      disabled={
                        !isBhutanCountry(
                          guarantor.spousePermCountry,
                          countryOptions,
                        )
                      }
                    >
                      <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent>
                        {dzongkhagOptions.map((opt, i) => (
                          <SelectItem
                            key={i}
                            value={String(
                              opt.dzongkhag_pk_code || opt.id || i,
                            )}
                          >
                            {opt.dzongkhag || opt.name || "Unknown"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                    {isBhutanCountry(
                      guarantor.spousePermCountry,
                      countryOptions,
                    )
                      ? "Spouse Gewog"
                      : "Spouse Province"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  {guarantor.spousePermCountry &&
                    !isBhutanCountry(
                      guarantor.spousePermCountry,
                      countryOptions,
                    ) ? (
                    <Input
                      placeholder="Enter Province"
                      className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                      value={guarantor.spousePermGewog || ""}
                      onChange={(e) =>
                        updateGuarantorField(
                          index,
                          "spousePermGewog",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <Select
                      value={guarantor.spousePermGewog}
                      onValueChange={(value) =>
                        updateGuarantorField(index, "spousePermGewog", value)
                      }
                      disabled={
                        !isBhutanCountry(
                          guarantor.spousePermCountry,
                          countryOptions,
                        )
                      }
                    >
                      <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent>
                        {guarantor.spousePermGewogOptions?.length > 0 ? (
                          guarantor.spousePermGewogOptions.map(
                            (opt: any, i: number) => (
                              <SelectItem
                                key={i}
                                value={String(
                                  opt.gewog_pk_code || opt.id || i,
                                )}
                              >
                                {opt.gewog || opt.name || "Unknown"}
                              </SelectItem>
                            ),
                          )
                        ) : (
                          <SelectItem value="loading" disabled>
                            {guarantor.spousePermDzongkhag
                              ? "Loading..."
                              : "Select Dzongkhag first"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                    {isBhutanCountry(
                      guarantor.spousePermCountry,
                      countryOptions,
                    )
                      ? "Spouse Village/Street"
                      : "Spouse Street"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder={
                      isBhutanCountry(
                        guarantor.spousePermCountry,
                        countryOptions,
                      )
                        ? "Enter Village/Street"
                        : "Enter Street"
                    }
                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                    value={guarantor.spousePermVillage || ""}
                    onChange={(e) =>
                      updateGuarantorField(
                        index,
                        "spousePermVillage",
                        e.target.value,
                      )
                    }
                    disabled={!guarantor.spousePermCountry}
                  />
                </div>

                {isBhutanCountry(
                  guarantor.spousePermCountry,
                  countryOptions,
                ) && (
                    <>
                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                          Spouse Thram No.{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Enter Thram No"
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                          value={guarantor.spousePermThram || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "spousePermThram",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                          Spouse House No.{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Enter House No"
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                          value={guarantor.spousePermHouse || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "spousePermHouse",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </>
                  )}
              </div>

              {guarantor.spousePermCountry &&
                !isBhutanCountry(
                  guarantor.spousePermCountry,
                  countryOptions,
                ) && (
                  <div className="space-y-2.5 mt-4">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Upload Spouse Address Proof Document{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id={`spousePermAddressProof-${index}`}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          handleFileChange(
                            index,
                            "spousePermAddressProof",
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
                            .getElementById(`spousePermAddressProof-${index}`)
                            ?.click()
                        }
                      >
                        Choose File
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {guarantor.spousePermAddressProof || "No file chosen"}
                      </span>
                    </div>
                  </div>
                )}
            </div>

            {/* Spouse Contact Details */}
            <div className="mt-6 pt-6 border-t border-dashed">
              <h4 className="text-md font-semibold text-gray-700 mb-4">
                Spouse Contact Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                    Spouse Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="Enter Spouse Email"
                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                    value={guarantor.spouseEmail || ""}
                    onChange={(e) =>
                      updateGuarantorField(
                        index,
                        "spouseEmail",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                    Spouse Contact No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Enter Contact Number"
                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                    value={guarantor.spouseContact || ""}
                    onChange={(e) =>
                      updateGuarantorField(
                        index,
                        "spouseContact",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                    Spouse Alternate Contact No.
                  </Label>
                  <Input
                    placeholder="Enter Alternate Contact"
                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                    value={guarantor.spouseAlternateContact || ""}
                    onChange={(e) =>
                      updateGuarantorField(
                        index,
                        "spouseAlternateContact",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </div>
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
                    <SelectItem value="building">Building & Land</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="equipment">Plant, Machinery, and Equipment</SelectItem>
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
                    Registration No. / Invoice No.
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
                    required >
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
                      <SelectItem value="flat">Flat</SelectItem>
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
                    Year of Construction<span className="text-red-500">*</span>
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

              <div
                className={`border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm ${secIndex === 0 ? "bg-white" : "bg-blue-50 border-blue-200"}`}
              >
                <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                  Building Land Details
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

                </div>
                {renderSecurityProofUpload(security, secIndex)}
              </div>
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
                    Identification No. <span className="text-red-500">*</span>
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

          {/* Pension and Provident Fund */}
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

          {/* Share and Security */}
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
                    Numbers of Share{" "}
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
                    Numbers of Volume{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="share-RegistrationNo"
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