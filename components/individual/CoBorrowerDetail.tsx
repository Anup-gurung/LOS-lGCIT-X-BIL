"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
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

interface CoBorrowerDetailsFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
  formData: any;
}

// Helper to format dates to YYYY-MM-DD for input fields
const formatDateForInput = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    return date.toISOString().split("T")[0];
  } catch (e) {
    return "";
  }
};

// Initialize empty related PEP entry
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

  // Spouse Info (removed, but kept for compatibility)
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
  householdNumber: "",
  relationship: "",
  maritalStatus: "",
  familyTree: "",
  bankName: "",
  bankAccount: "",
  passportPhoto: "",
  idProofDocument: "",

  // Spouse Info
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
  spouseIdProofDocument: "", // NEW: Spouse identification proof upload

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
  spousePermGewogOptions: [],
  pepSubCategoryOptions: [],

  // Dynamic Options Maps for Related PEPs
  relatedPepOptionsMap: {},
  relatedPepSpouseGewogMap: {},
  relatedPepPermGewogMap: {},
  relatedPepCurrGewogMap: {},

  // Lookup states
  showLookupPopup: false,
  lookupStatus: "searching" as "searching" | "found" | "not_found",
  fetchedCustomerData: null,
  errors: {},
});

export function CoBorrowerDetailsForm({
  onNext,
  onBack,
  formData,
}: CoBorrowerDetailsFormProps) {
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
  const fifteenYearsAgo = new Date();
  fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
  const maxDobDate = fifteenYearsAgo.toISOString().split("T")[0];

  // Filter identification types to exclude "Trade License Number" and "Company Registration Number"
  const filteredIdentificationOptions = useMemo(() => {
    return identificationTypeOptions.filter((option) => {
      const label = (option.identity_type || option.name || "").toLowerCase();
      return !label.includes("trade license") && !label.includes("company registration");
    });
  }, [identificationTypeOptions]);

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

  // --- HELPER: Determine if Married ---
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
    fetchMaritalStatus()
      .then(setMaritalStatusOptions)
      .catch(() => setMaritalStatusOptions([]));
    fetchBanks()
      .then(setBanksOptions)
      .catch(() => setBanksOptions([]));
    fetchNationality()
      .then(setNationalityOptions)
      .catch(() => setNationalityOptions([]));
    fetchIdentificationType()
      .then(setIdentificationTypeOptions)
      .catch(() => setIdentificationTypeOptions([]));
    fetchCountry()
      .then(setCountryOptions)
      .catch(() => setCountryOptions([]));
    fetchDzongkhag()
      .then(setDzongkhagOptions)
      .catch(() => setDzongkhagOptions([]));
    fetchOccupations()
      .then(setOccupationOptions)
      .catch(() => setOccupationOptions([]));
    fetchLegalConstitution()
      .then(setOrganizationOptions)
      .catch(() => setOrganizationOptions([]));
    fetchPepCategory()
      .then(setPepCategoryOptions)
      .catch(() => setPepCategoryOptions([]));
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

      if (hasData && formData.coBorrowers) {
        setCoBorrowers(formData.coBorrowers);
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

  // Load spouse perm gewogs for all co-borrowers
  useEffect(() => {
    const loadSpousePermGewogs = async () => {
      const updatedCoBorrowers = [...coBorrowers];
      let needsUpdate = false;

      for (let i = 0; i < coBorrowers.length; i++) {
        const coBorrower = coBorrowers[i];
        if (coBorrower.spousePermDzongkhag) {
          try {
            const options = await fetchGewogsByDzongkhag(
              coBorrower.spousePermDzongkhag,
            );
            updatedCoBorrowers[i] = {
              ...updatedCoBorrowers[i],
              spousePermGewogOptions: options,
            };
            needsUpdate = true;
          } catch (error) {
            updatedCoBorrowers[i] = {
              ...updatedCoBorrowers[i],
              spousePermGewogOptions: [],
            };
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        setCoBorrowers(updatedCoBorrowers);
      }
    };
    loadSpousePermGewogs();
  }, [coBorrowers.map((cb) => cb.spousePermDzongkhag).join(",")]);

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
            updatedCoBorrowers[i] = {
              ...updatedCoBorrowers[i],
              pepSubCategoryOptions: options || [],
            };
            needsUpdate = true;
          } catch (error) {
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
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setCoBorrowers((prev) => {
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
        setCoBorrowers((prev) => {
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

      setCoBorrowers((prev) => {
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
  };

  // --- AUTOMATIC LOOKUP LOGIC ---
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

      updated[index] = {
        ...updated[index],
        relatedPeps: updatedPeps,
        relatedPepOptionsMap: cleanMap(
          updated[index].relatedPepOptionsMap || {},
        ),
        relatedPepSpouseGewogMap: cleanMap(
          updated[index].relatedPepSpouseGewogMap || {},
        ),
        relatedPepPermGewogMap: cleanMap(
          updated[index].relatedPepPermGewogMap || {},
        ),
        relatedPepCurrGewogMap: cleanMap(
          updated[index].relatedPepCurrGewogMap || {},
        ),
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

      // Dynamic Fetches
      if (field === "category") {
        updatedPeps[pepIndex].subCategory = "";
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
          .catch(() => { });
      }

      if (field === "spousePermDzongkhag") {
        updatedPeps[pepIndex].spousePermGewog = "";
        fetchGewogsByDzongkhag(value)
          .then((options) => {
            setCoBorrowers((current) => {
              const currentUpdated = [...current];
              currentUpdated[coBorrowerIndex] = {
                ...currentUpdated[coBorrowerIndex],
                relatedPepSpouseGewogMap: {
                  ...currentUpdated[coBorrowerIndex].relatedPepSpouseGewogMap,
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
            setCoBorrowers((current) => {
              const currentUpdated = [...current];
              currentUpdated[coBorrowerIndex] = {
                ...currentUpdated[coBorrowerIndex],
                relatedPepPermGewogMap: {
                  ...currentUpdated[coBorrowerIndex].relatedPepPermGewogMap,
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
            setCoBorrowers((current) => {
              const currentUpdated = [...current];
              currentUpdated[coBorrowerIndex] = {
                ...currentUpdated[coBorrowerIndex],
                relatedPepCurrGewogMap: {
                  ...currentUpdated[coBorrowerIndex].relatedPepCurrGewogMap,
                  [pepIndex]: options || [],
                },
              };
              return currentUpdated;
            });
          })
          .catch(() => { });
      }

      updated[coBorrowerIndex] = {
        ...updated[coBorrowerIndex],
        relatedPeps: updatedPeps,
      };
      return updated;
    });
  };

  const handleRelatedPepFileChange = (
    coBorrowerIndex: number,
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

      setCoBorrowers((prev) => {
        const updated = [...prev];
        const updatedPeps = [...(updated[coBorrowerIndex].relatedPeps || [])];
        if (!updatedPeps[pepIndex]) {
          updatedPeps[pepIndex] = createEmptyRelatedPep();
        }

        updatedPeps[pepIndex] = {
          ...updatedPeps[pepIndex],
          [field]: file.name,
        };
        updated[coBorrowerIndex] = {
          ...updated[coBorrowerIndex],
          relatedPeps: updatedPeps,
        };
        return updated;
      });
    }
  };

  const validateDates = (coBorrower: any) => {
    const newErrors: Record<string, string> = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseLocalDate = (dateString: string) => {
      const [year, month, day] = dateString.split("-").map(Number);
      return new Date(year, month - 1, day);
    };

    const issueDate = coBorrower.identificationIssueDate
      ? parseLocalDate(coBorrower.identificationIssueDate)
      : null;

    const expiryDate = coBorrower.identificationExpiryDate
      ? parseLocalDate(coBorrower.identificationExpiryDate)
      : null;

    const dobDate = coBorrower.dateOfBirth
      ? parseLocalDate(coBorrower.dateOfBirth)
      : null;

    if (issueDate && issueDate > today) {
      newErrors.identificationIssueDate = "Issue date cannot be in the future";
    }

    if (expiryDate && expiryDate < today) {
      newErrors.identificationExpiryDate = "Expiry date cannot be in the past";
    }

    if (dobDate) {
      const minDob = new Date();
      minDob.setFullYear(minDob.getFullYear() - 15);
      minDob.setHours(0, 0, 0, 0);

      if (dobDate > minDob) {
        newErrors.dateOfBirth = "You must be at least 15 years old";
      }
    }

    if (issueDate && expiryDate && expiryDate <= issueDate) {
      newErrors.identificationExpiryDate =
        "Expiry date must be after issue date";
    }

    return newErrors;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all co-borrowers
    const validatedCoBorrowers = coBorrowers.map((coBorrower) => {
      const dateErrors = validateDates(coBorrower);

      return {
        ...coBorrower,
        errors: dateErrors, // replace, do NOT merge
        isMarried: getIsMarried(coBorrower),
      };
    });
    setCoBorrowers(validatedCoBorrowers);

    // Check if there are any errors
    const hasErrors = validatedCoBorrowers.some((coBorrower) =>
      Object.values(coBorrower.errors || {}).some((error) => error),
    );

    if (!hasErrors) {
      const coBorrowerData = { coBorrowers: validatedCoBorrowers };

      // Retrieve existing data from sessionStorage
      const existingData = sessionStorage.getItem("loanApplicationData");
      const allData = existingData ? JSON.parse(existingData) : {};

      // Merge and save to sessionStorage
      const updatedData = { ...allData, ...coBorrowerData };
      sessionStorage.setItem(
        "loanApplicationData",
        JSON.stringify(updatedData),
      );

      onNext(coBorrowerData);
    }
  };

  const addCoBorrower = () => {
    setCoBorrowers([...coBorrowers, createEmptyCoBorrower()]);
  };

  const removeCoBorrower = (index: number) => {
    if (index === 0 && coBorrowers.length === 1) {
      // Don't remove the first co-borrower if it's the only one
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
        // Clear dependent fields when parent field changes
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
      return updated;
    });
  };

  // Render a single co-borrower form section
  const renderCoBorrowerForm = (coBorrower: any, index: number) => {
    const isMarried = getIsMarried(coBorrower);
    const relatedPeps = coBorrower.relatedPeps || [createEmptyRelatedPep()];
    const errors = coBorrower.errors || {};

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

        {/* Search Status Popup for this co-borrower */}
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
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={coBorrower.identificationType}
                  onValueChange={(value) => {
                    updateCoBorrowerField(index, "identificationType", value);
                  }}
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredIdentificationOptions.length > 0 ? (
                      filteredIdentificationOptions.map((option, optionIndex) => {
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
              </div>
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`co-identificationNo-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Identification No. <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`co-identificationNo-${index}`}
                placeholder="Enter identification No"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={coBorrower.identificationNo || ""}
                onChange={(e) =>
                  updateCoBorrowerField(
                    index,
                    "identificationNo",
                    e.target.value,
                  )
                }
                onBlur={() => handleIdentityCheck(index)}
                required
              />
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
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={coBorrower.salutation}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "salutation", value)
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
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
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`co-name-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Co-Borrower Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`co-name-${index}`}
                placeholder="Enter Full Name"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={coBorrower.name || ""}
                onChange={(e) =>
                  updateCoBorrowerField(index, "name", e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`co-nationality-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Nationality <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={
                    coBorrower.nationality ? String(coBorrower.nationality) : ""
                  }
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "nationality", value)
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
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
                          option.nationality_pk_code ||
                          option.id ||
                          optionIndex,
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
              </div>
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`co-gender-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Gender <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={coBorrower.gender}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "gender", value)
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={formatDateForInput(coBorrower.identificationIssueDate)}
                onChange={(e) =>
                  updateCoBorrowerField(
                    index,
                    "identificationIssueDate",
                    e.target.value,
                  )
                }
                required
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
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={formatDateForInput(coBorrower.identificationExpiryDate)}
                onChange={(e) =>
                  updateCoBorrowerField(
                    index,
                    "identificationExpiryDate",
                    e.target.value,
                  )
                }
                required
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
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={formatDateForInput(coBorrower.dateOfBirth)}
                onChange={(e) =>
                  updateCoBorrowerField(index, "dateOfBirth", e.target.value)
                }
                required
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
                TPN No
              </Label>
              <Input
                id={`co-tpn-${index}`}
                placeholder="Enter TPN"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={coBorrower.tpn || ""}
                onChange={(e) =>
                  updateCoBorrowerField(index, "tpn", e.target.value)
                }
              />
            </div>

            {/* Conditional Household Number */}
            {isNatBhutanese(coBorrower.nationality) && (
              <div className="space-y-2.5">
                <Label
                  htmlFor={`co-householdNumber-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Household Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`co-householdNumber-${index}`}
                  placeholder="Enter Household Number"
                  className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={coBorrower.householdNumber || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "householdNumber",
                      e.target.value,
                    )
                  }
                  required
                />
              </div>
            )}
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
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={coBorrower.relationship}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "relationship", value)
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
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
              </div>
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
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t mt-4">
            <div className="space-y-2.5">
              <Label
                htmlFor={`uploadFamilyTree-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Upload Family Tree <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-28 bg-transparent"
                  onClick={() =>
                    document
                      .getElementById(`uploadFamilyTree-${index}`)
                      ?.click()
                  }
                >
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground">
                  {coBorrower.familyTree || "No file chosen"}
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
                htmlFor={`bankAccount-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Bank Saving Account No <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`bankAccount-${index}`}
                placeholder="Enter saving account number"
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={coBorrower.bankAccount || ""}
                onChange={(e) =>
                  updateCoBorrowerField(index, "bankAccount", e.target.value)
                }
              />
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
                {coBorrower.passportPhoto || "No file chosen"}
              </span>
            </div>
            {errors.passportPhoto && (
              <p className="text-xs text-red-500 mt-1">
                {errors.passportPhoto}
              </p>
            )}
            <p className="text-xs text-gray-500">Allowed: JPG, PNG (Max 5MB)</p>
          </div>

          {/* NEW: Identification Proof Document Upload */}
          <div className="space-y-2.5">
            <Label
              htmlFor={`uploadIdProof-${index}`}
              className="text-gray-800 font-semibold text-sm"
            >
              Upload Identification Proof Document{" "}
              <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id={`uploadIdProof-${index}`}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  handleFileChange(
                    index,
                    "idProofDocument",
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
                  document.getElementById(`uploadIdProof-${index}`)?.click()
                }
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {coBorrower.idProofDocument || "No file chosen"}
              </span>
            </div>
            {errors.idProofDocument && (
              <p className="text-xs text-red-500 mt-1">
                {errors.idProofDocument}
              </p>
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
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`permDzongkhag-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                {isBhutanCountry(coBorrower.permCountry, countryOptions)
                  ? "Dzongkhag"
                  : "State"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {coBorrower.permCountry &&
                !isBhutanCountry(coBorrower.permCountry, countryOptions) ? (
                <Input
                  id={`permDzongkhag-${index}`}
                  placeholder="Enter State"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.permDzongkhag || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "permDzongkhag",
                      e.target.value,
                    )
                  }
                />
              ) : (
                <Select
                  value={coBorrower.permDzongkhag || ""}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "permDzongkhag", value)
                  }
                  disabled={
                    !isBhutanCountry(coBorrower.permCountry, countryOptions)
                  }
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`permGewog-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                {isBhutanCountry(coBorrower.permCountry, countryOptions)
                  ? "Gewog"
                  : "Province"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {coBorrower.permCountry &&
                !isBhutanCountry(coBorrower.permCountry, countryOptions) ? (
                <Input
                  id={`permGewog-${index}`}
                  placeholder="Enter Province"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.permGewog || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "permGewog", e.target.value)
                  }
                />
              ) : (
                <Select
                  value={
                    isBhutanCountry(coBorrower.permCountry, countryOptions)
                      ? coBorrower.permGewog
                      : ""
                  }
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "permGewog", value)
                  }
                  disabled={
                    !isBhutanCountry(coBorrower.permCountry, countryOptions)
                  }
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`permVillage-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                {isBhutanCountry(coBorrower.permCountry, countryOptions)
                  ? "Village/Street"
                  : "Street"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`permVillage-${index}`}
                placeholder={
                  isBhutanCountry(coBorrower.permCountry, countryOptions)
                    ? "Enter Village/Street"
                    : "Enter Street"
                }
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={coBorrower.permVillage || ""}
                onChange={(e) =>
                  updateCoBorrowerField(index, "permVillage", e.target.value)
                }
                disabled={!coBorrower.permCountry}
              />
            </div>
          </div>

          {/* Conditional grid - show Thram and House only for Bhutan */}
          {isBhutanCountry(coBorrower.permCountry, countryOptions) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor={`permThram-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Thram No. <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`permThram-${index}`}
                  placeholder="Enter Thram No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.permThram || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "permThram", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`permHouse-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  House No. <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`permHouse-${index}`}
                  placeholder="Enter House No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.permHouse || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "permHouse", e.target.value)
                  }
                />
              </div>
            </div>
          )}

          {/* Document Upload for Non-Bhutan Countries */}
          {coBorrower.permCountry &&
            !isBhutanCountry(coBorrower.permCountry, countryOptions) && (
              <div className="space-y-2.5 border-t pt-4">
                <Label
                  htmlFor={`permAddressProof-${index}`}
                  className="text-gray-800 font-semibold text-sm"
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
                    {coBorrower.permAddressProof || "No file chosen"}
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
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`currDzongkhag-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                {isBhutanCountry(coBorrower.currCountry, countryOptions)
                  ? "Dzongkhag"
                  : "State"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {coBorrower.currCountry &&
                !isBhutanCountry(coBorrower.currCountry, countryOptions) ? (
                <Input
                  id={`currDzongkhag-${index}`}
                  placeholder="Enter State"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.currDzongkhag || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "currDzongkhag",
                      e.target.value,
                    )
                  }
                />
              ) : (
                <Select
                  value={
                    isBhutanCountry(coBorrower.currCountry, countryOptions)
                      ? coBorrower.currDzongkhag
                      : ""
                  }
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "currDzongkhag", value)
                  }
                  disabled={
                    !isBhutanCountry(coBorrower.currCountry, countryOptions)
                  }
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`currGewog-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                {isBhutanCountry(coBorrower.currCountry, countryOptions)
                  ? "Gewog"
                  : "Province"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {coBorrower.currCountry &&
                !isBhutanCountry(coBorrower.currCountry, countryOptions) ? (
                <Input
                  id={`currGewog-${index}`}
                  placeholder="Enter Province"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.currGewog || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "currGewog", e.target.value)
                  }
                />
              ) : (
                <Select
                  value={
                    isBhutanCountry(coBorrower.currCountry, countryOptions)
                      ? coBorrower.currGewog
                      : ""
                  }
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "currGewog", value)
                  }
                  disabled={
                    !isBhutanCountry(coBorrower.currCountry, countryOptions)
                  }
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`currVillage-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                {isBhutanCountry(coBorrower.currCountry, countryOptions)
                  ? "Village/Street"
                  : "Street"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`currVillage-${index}`}
                placeholder={
                  isBhutanCountry(coBorrower.currCountry, countryOptions)
                    ? "Enter Village/Street"
                    : "Enter Street"
                }
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={coBorrower.currVillage || ""}
                onChange={(e) =>
                  updateCoBorrowerField(index, "currVillage", e.target.value)
                }
                disabled={!coBorrower.currCountry}
              />
            </div>
          </div>

          {/* Conditional grid layout based on country */}
          {isBhutanCountry(coBorrower.currCountry, countryOptions) && (
            // Updated Grid to accommodate Alternate Contact
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor={`currFlat-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  House/Building/ Flat No{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`currFlat-${index}`}
                  placeholder="Enter Flat No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.currFlat || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "currFlat", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`currEmail-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`currEmail-${index}`}
                  type="email"
                  placeholder="Enter Your Email"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.currEmail || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "currEmail", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`currContact-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Contact Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`currContact-${index}`}
                  placeholder="Enter Contact No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.currContact || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "currContact", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`currAlternateContact-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Alternate Contact No
                </Label>
                <Input
                  id={`currAlternateContact-${index}`}
                  placeholder="Enter Contact No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.currAlternateContact || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "currAlternateContact",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
          )}

          {coBorrower.currCountry &&
            !isBhutanCountry(coBorrower.currCountry, countryOptions) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor={`currEmail-${index}`}
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`currEmail-${index}`}
                    type="email"
                    placeholder="Enter Your Email"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={coBorrower.currEmail || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(index, "currEmail", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor={`currContact-${index}`}
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`currContact-${index}`}
                    placeholder="Enter Contact No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={coBorrower.currContact || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
                        index,
                        "currContact",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor={`currAlternateContact-${index}`}
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Alternate Contact No
                  </Label>
                  <Input
                    id={`currAlternateContact-${index}`}
                    placeholder="Enter Contact No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={coBorrower.currAlternateContact || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
                        index,
                        "currAlternateContact",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            )}

          {/* Document Upload for Non-Bhutan Countries */}
          {coBorrower.currCountry &&
            !isBhutanCountry(coBorrower.currCountry, countryOptions) && (
              <div className="space-y-2.5 border-t pt-4">
                <Label
                  htmlFor={`currAddressProof-${index}`}
                  className="text-gray-800 font-semibold text-sm"
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
                    {coBorrower.currAddressProof || "No file chosen"}
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
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
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
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
                </div>

                {/* Removed: Upload Identification Proof field for Self PEP */}
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
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
          {coBorrower.pepPerson === "no" && coBorrower.pepRelated === "yes" && (
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
                  {/* Remove Button */}
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

                  {/* --- PEP Declaration Information --- */}
                  <h4 className="text-sm font-bold text-[#003DA5] mb-4 uppercase tracking-wide">
                    PEP Declaration Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {/* 1. Relationship Field */}
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
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 2. PEP Category Field */}
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

                    {/* 3. PEP Sub Category Field */}
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
                    </div>

                    {/* 4. Identification Proof */}
                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Upload Identification Proof{" "}
                        <span className="text-red-500">*</span>
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

                  {/* --- Personal Information --- */}
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
                          {filteredIdentificationOptions.map((opt, i) => (
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
                          <SelectItem value="BIT">BIT</SelectItem>
                          <SelectItem value="GST">GST</SelectItem>
                          <SelectItem value="CIT">CIT</SelectItem>
                          <SelectItem value="PIT">PIT</SelectItem>
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

                  {/* --- Removed Spouse Information block entirely --- */}

                  {/* --- PEP Permanent Address --- */}
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
                              {coBorrower.relatedPepPermGewogMap?.[pepIndex]
                                ?.length > 0 ? (
                                coBorrower.relatedPepPermGewogMap[pepIndex].map(
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

                  {/* --- PEP Current/Residential Address --- */}
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
                              {coBorrower.relatedPepCurrGewogMap?.[pepIndex]
                                ?.length > 0 ? (
                                coBorrower.relatedPepCurrGewogMap[pepIndex].map(
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
                <Input
                  id={`employeeId-${index}`}
                  placeholder="Enter ID"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.employeeId || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "employeeId", e.target.value)
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
                  value={coBorrower.occupation}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "occupation", value)
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
                  value={coBorrower.employerType}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "employerType", value)
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
                  value={coBorrower.designation}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "designation", value)
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
                  value={coBorrower.grade}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "grade", value)
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
                  value={coBorrower.organizationName}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "organizationName", value)
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
                  placeholder="Enter Location"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.orgLocation || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "orgLocation", e.target.value)
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
                  value={coBorrower.joiningDate || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "joiningDate", e.target.value)
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
                  value={coBorrower.serviceNature}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "serviceNature", value)
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
                  value={coBorrower.annualSalary || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "annualSalary", e.target.value)
                  }
                />
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
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={coBorrower.contractEndDate || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
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

        {/* Spouse Details - Moved here after Employment Details */}
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
                  value={coBorrower.spouseIdentificationType}
                  onValueChange={(value) =>
                    updateCoBorrowerField(
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
                    {filteredIdentificationOptions.map((opt, i) => (
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
                  value={coBorrower.spouseIdentificationNo || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
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
                  value={coBorrower.spouseSalutation}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "spouseSalutation", value)
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
                  value={coBorrower.spouseName || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "spouseName", e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Nationality <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={coBorrower.spouseNationality}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "spouseNationality", value)
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
                  value={coBorrower.spouseGender}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "spouseGender", value)
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
                  value={coBorrower.spouseIdentificationIssueDate || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "spouseIdentificationIssueDate",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse ID Expiry Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  min={today}
                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                  value={coBorrower.spouseIdentificationExpiryDate || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "spouseIdentificationExpiryDate",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Tax Identifier Type
                </Label>
                <Select
                  value={coBorrower.spouseTaxIdentifierType}
                  onValueChange={(value) =>
                    updateCoBorrowerField(
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
                    <SelectItem value="BIT">BIT</SelectItem>
                    <SelectItem value="GST">GST</SelectItem>
                    <SelectItem value="CIT">CIT</SelectItem>
                    <SelectItem value="PIT">PIT</SelectItem>
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
                  value={coBorrower.spouseTpn || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "spouseTpn", e.target.value)
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
                  value={coBorrower.spouseDateOfBirth || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "spouseDateOfBirth",
                      e.target.value,
                    )
                  }
                />
              </div>

              {isNatBhutanese(coBorrower.spouseNationality) && (
                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                    Spouse Household Number{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Enter Household Number"
                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                    value={coBorrower.spouseHouseholdNumber || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
                        index,
                        "spouseHouseholdNumber",
                        e.target.value,
                      )
                    }
                  />
                </div>
              )}
            </div>

            {/* NEW: Spouse Identification Proof Upload */}
            <div className="space-y-2.5 pt-4">
              <Label
                htmlFor={`spouseIdProof-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Upload Spouse Identification Proof Document{" "}
                <span className="text-red-500">*</span>
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
                      "spouseIdProofDocument",
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
                  {coBorrower.spouseIdProofDocument || "No file chosen"}
                </span>
              </div>
              {errors.spouseIdProofDocument && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.spouseIdProofDocument}
                </p>
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
                    value={coBorrower.spousePermCountry}
                    onValueChange={(value) =>
                      updateCoBorrowerField(index, "spousePermCountry", value)
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
                      coBorrower.spousePermCountry,
                      countryOptions,
                    )
                      ? "Spouse Dzongkhag"
                      : "Spouse State"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  {coBorrower.spousePermCountry &&
                    !isBhutanCountry(
                      coBorrower.spousePermCountry,
                      countryOptions,
                    ) ? (
                    <Input
                      placeholder="Enter State"
                      className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                      value={coBorrower.spousePermDzongkhag || ""}
                      onChange={(e) =>
                        updateCoBorrowerField(
                          index,
                          "spousePermDzongkhag",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <Select
                      value={coBorrower.spousePermDzongkhag}
                      onValueChange={(value) =>
                        updateCoBorrowerField(
                          index,
                          "spousePermDzongkhag",
                          value,
                        )
                      }
                      disabled={
                        !isBhutanCountry(
                          coBorrower.spousePermCountry,
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
                      coBorrower.spousePermCountry,
                      countryOptions,
                    )
                      ? "Spouse Gewog"
                      : "Spouse Province"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  {coBorrower.spousePermCountry &&
                    !isBhutanCountry(
                      coBorrower.spousePermCountry,
                      countryOptions,
                    ) ? (
                    <Input
                      placeholder="Enter Province"
                      className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                      value={coBorrower.spousePermGewog || ""}
                      onChange={(e) =>
                        updateCoBorrowerField(
                          index,
                          "spousePermGewog",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <Select
                      value={coBorrower.spousePermGewog}
                      onValueChange={(value) =>
                        updateCoBorrowerField(index, "spousePermGewog", value)
                      }
                      disabled={
                        !isBhutanCountry(
                          coBorrower.spousePermCountry,
                          countryOptions,
                        )
                      }
                    >
                      <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent>
                        {coBorrower.spousePermGewogOptions?.length > 0 ? (
                          coBorrower.spousePermGewogOptions.map(
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
                            {coBorrower.spousePermDzongkhag
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
                      coBorrower.spousePermCountry,
                      countryOptions,
                    )
                      ? "Spouse Village/Street"
                      : "Spouse Street"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder={
                      isBhutanCountry(
                        coBorrower.spousePermCountry,
                        countryOptions,
                      )
                        ? "Enter Village/Street"
                        : "Enter Street"
                    }
                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                    value={coBorrower.spousePermVillage || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
                        index,
                        "spousePermVillage",
                        e.target.value,
                      )
                    }
                    disabled={!coBorrower.spousePermCountry}
                  />
                </div>

                {isBhutanCountry(
                  coBorrower.spousePermCountry,
                  countryOptions,
                ) && (
                    <>
                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                          Spouse Thram No. <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Enter Thram No"
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                          value={coBorrower.spousePermThram || ""}
                          onChange={(e) =>
                            updateCoBorrowerField(
                              index,
                              "spousePermThram",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                          Spouse House No. <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Enter House No"
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                          value={coBorrower.spousePermHouse || ""}
                          onChange={(e) =>
                            updateCoBorrowerField(
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

              {coBorrower.spousePermCountry &&
                !isBhutanCountry(
                  coBorrower.spousePermCountry,
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
                        {coBorrower.spousePermAddressProof || "No file chosen"}
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
                    value={coBorrower.spouseEmail || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
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
                    value={coBorrower.spouseContact || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
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
                    value={coBorrower.spouseAlternateContact || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
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
    <form onSubmit={handleSubmit} className="space-y-8">
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