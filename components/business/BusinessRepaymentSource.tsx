"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
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
import {
  mapCustomerDataToForm,
  getVerifiedCustomerDataFromSession,
} from "@/lib/mapCustomerData";
import DocumentPopup from "@/components/BILSearchStatus"; // Adjust path as needed

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

// Helper to create empty related PEP entry
const createEmptyRelatedPep = () => ({
  relationship: "",
  identificationNo: "",
  category: "",
  subCategory: "",
  identificationProof: "",
});

// Initialize empty guarantor with comprehensive fields
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
  maritalStatus: "",
  spouseCid: "",
  spouseName: "",
  spouseContact: "",
  familyTree: "",
  passportPhoto: "",
  bankName: "",
  bankAccountNumber: "",

  // Permanent Address
  permCountry: "",
  permDzongkhag: "",
  permGewog: "",
  permVillage: "",
  permThram: "",
  permHouse: "",
  permCity: "",
  permPostal: "",
  permAddressProof: "",

  // Current Address
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

  // PEP Declaration
  isPep: "",
  pepCategory: "",
  pepSubCategory: "",
  pepUpload: "",
  relatedToPep: "",
  relatedPeps: [], // Initialize as empty array

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

  // Repayment Source
  repaymentSourceType: "",
  amount: "",
  proofFile: null as File | null,
  proofFileName: "",

  // Internal State
  errors: {} as Record<string, string>,

  // Dynamic Dropdown Options
  permGewogOptions: [] as any[],
  currGewogOptions: [] as any[],
  pepSubCategoryOptions: [] as any[],
  relatedPepOptionsMap: {} as Record<number, any[]>,

  // Lookup state
  showLookupPopup: false,
  lookupStatus: "searching" as "searching" | "found" | "not_found",
  fetchedCustomerData: null,
});

export function BusinessRepaymentSourceForm({
  onNext,
  onBack,
  formData,
}: BusinessRepaymentSourceFormProps) {
  const [businessIncomeData, setBusinessIncomeData] = useState({
    repaymentSourceType: "Business Income",
    amount: formData?.businessIncome?.amount || "",
    proofFile: formData?.businessIncome?.proofFile || null,
    proofFileName: formData?.businessIncome?.proofFileName || "",
  });

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

  // Shared Dropdown Options
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

  // Constants
  const today = new Date().toISOString().split("T")[0];
  const fifteenYearsAgo = new Date();
  fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
  const maxDobDate = fifteenYearsAgo.toISOString().split("T")[0];

  // Helper functions
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

  // Load shared dropdown data
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

  // Dynamic Gewog loading
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

  // PEP Subcategory loading
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

  // --- Identity Lookup Handlers ---
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

  const handleLookupProceed = (index: number) => {
    const guarantor = guarantors[index];
    if (guarantor.lookupStatus === "found" && guarantor.fetchedCustomerData) {
      const fetched = guarantor.fetchedCustomerData;

      // Map fetched data to guarantor field names
      const sanitized = {
        // Personal Information
        idType: guarantor.idType, // Keep original selection
        idNumber: guarantor.idNumber, // Keep original number
        salutation: fetched.salutation || "",
        guarantorName: fetched.name || "",
        nationality: fetched.nationality ? String(fetched.nationality) : "",
        gender: fetched.gender || "",
        idIssueDate: formatDateForInput(fetched.identificationIssueDate),
        idExpiryDate: formatDateForInput(fetched.identificationExpiryDate),
        dateOfBirth: formatDateForInput(fetched.dateOfBirth),
        tpnNo: fetched.tpn || "",
        maritalStatus: fetched.maritalStatus
          ? String(fetched.maritalStatus)
          : "",
        spouseCid: fetched.spouseIdentificationNo || "",
        spouseName: fetched.spouseName || "",
        spouseContact: fetched.spouseContact || "",
        familyTree: fetched.familyTree || "",
        bankName: fetched.bankName || "",
        bankAccountNumber: fetched.bankAccount || "",

        // Permanent Address
        permCountry: fetched.permCountry ? String(fetched.permCountry) : "",
        permDzongkhag: fetched.permDzongkhag
          ? String(fetched.permDzongkhag)
          : "",
        permGewog: fetched.permGewog ? String(fetched.permGewog) : "",
        permVillage: fetched.permVillage || "",
        permThram: fetched.permThram || "",
        permHouse: fetched.permHouse || "",
        permCity: "", // Not in fetched
        permPostal: "", // Not in fetched

        // Current Address
        currCountry: fetched.currCountry ? String(fetched.currCountry) : "",
        currDzongkhag: fetched.currDzongkhag
          ? String(fetched.currDzongkhag)
          : "",
        currGewog: fetched.currGewog ? String(fetched.currGewog) : "",
        currVillage: fetched.currVillage || "",
        currHouse: fetched.currFlat || "",
        currCity: "", // Not in fetched
        currPostal: "", // Not in fetched
        email: fetched.currEmail || "",
        contact: fetched.currContact || "",
        currAlternateContact: fetched.currAlternateContact || "",

        // PEP Declaration
        isPep: fetched.pepPerson || "",
        pepCategory: fetched.pepCategory || "",
        pepSubCategory: fetched.pepSubCategory || "",
        pepUpload: fetched.identificationProof || "",
        relatedToPep: fetched.pepRelated || "",
        relatedPeps: fetched.relatedPeps || [],

        // Employment Details
        employmentStatus: fetched.employmentStatus || "",
        employeeId: fetched.employeeId || "",
        occupation: fetched.occupation || "",
        employerType: fetched.employerType || "",
        designation: fetched.designation || "",
        grade: fetched.grade || "",
        organizationName: fetched.organizationName || "",
        orgLocation: fetched.orgLocation || "",
        joiningDate: formatDateForInput(fetched.joiningDate),
        serviceNature: fetched.serviceNature || "",
        annualSalary: fetched.annualSalary || "",
        contractEndDate: formatDateForInput(fetched.contractEndDate),
      };

      setGuarantors((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...prev[index],
          ...sanitized,
          // Preserve original dynamic options and other fields
          permGewogOptions: prev[index].permGewogOptions,
          currGewogOptions: prev[index].currGewogOptions,
          pepSubCategoryOptions: prev[index].pepSubCategoryOptions,
          relatedPepOptionsMap: prev[index].relatedPepOptionsMap,
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

  // Handlers
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
      updated[index] = {
        ...updated[index],
        [field]: value,
        // Clear dependent fields logic
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
        errors: { ...updated[index].errors, [field]: "" },
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
      setGuarantors((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [fieldName]: file.name };
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
      updateGuarantorField(index, "proofFile", file);
      updateGuarantorField(index, "proofFileName", file.name);
    }
  };

  // FIXED: Correctly handles adding a single new item safely
  const handleAddRelatedPep = (index: number) => {
    setGuarantors((prev) => {
      const updatedGuarantors = [...prev];
      // Create a shallow copy of the guarantor to modify
      const currentGuarantor = { ...updatedGuarantors[index] };
      // Create a copy of the relatedPeps array (or new if undefined)
      const currentRelatedPeps = currentGuarantor.relatedPeps
        ? [...currentGuarantor.relatedPeps]
        : [];

      // Add exactly one empty PEP object
      currentRelatedPeps.push(createEmptyRelatedPep());

      // Reassign to the guarantor
      currentGuarantor.relatedPeps = currentRelatedPeps;
      // Reassign to the main array
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

  const handleNext = () => {
    if (!businessIncomeData.amount || !businessIncomeData.proofFile) {
      alert("Please fill in all required business income fields");
      return;
    }

    if (isGuarantorApplicable === "Yes") {
      if (guarantors.length === 0) {
        alert("Please add at least one guarantor");
        return;
      }

      for (const guarantor of guarantors) {
        if (
          !guarantor.idType ||
          !guarantor.idNumber ||
          !guarantor.guarantorName ||
          !guarantor.nationality ||
          !guarantor.dateOfBirth ||
          !guarantor.contact ||
          !guarantor.email ||
          !guarantor.repaymentSourceType ||
          !guarantor.amount ||
          !guarantor.proofFile
        ) {
          alert(
            `Please fill in all required fields for Guarantor ${guarantors.indexOf(guarantor) + 1}`,
          );
          return;
        }
      }
    }

    onNext({
      businessIncome: businessIncomeData,
      isGuarantorApplicable,
      guarantors: isGuarantorApplicable === "Yes" ? guarantors : [],
    });
  };

  // --- UNIFORM STYLES ---
  const commonInputClass =
    "h-12 w-full border border-gray-300 rounded-md focus:border-[#FF9800] focus:ring-[#FF9800] bg-white text-gray-900 px-3";
  const selectTriggerClass =
    "h-12 w-full border border-gray-300 rounded-md focus:border-[#FF9800] focus:ring-[#FF9800] bg-white text-gray-900 px-3 [&>span]:truncate [&>span]:max-w-full";
  const labelClass = "text-gray-800 font-semibold text-sm mb-2 block";
  const buttonClass =
    "h-12 px-4 border border-gray-300 rounded-md hover:border-[#FF9800] hover:text-[#FF9800] bg-white text-gray-700 flex items-center justify-center transition-colors";

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* 1. BUSINESS INCOME SECTION */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4 mb-6">
          REPAYMENT SOURCE - BUSINESS INCOME
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label className={labelClass}>
              Repayment Source Type <span className="text-red-500">*</span>
            </Label>
            <Input
              value={businessIncomeData.repaymentSourceType}
              disabled
              className={`${commonInputClass} bg-gray-100 cursor-not-allowed`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Business loans must use Business Income as repayment source
            </p>
          </div>

          <div>
            <Label className={labelClass}>
              Amount (Nu.) <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={businessIncomeData.amount}
              onChange={(e) =>
                setBusinessIncomeData({
                  ...businessIncomeData,
                  amount: e.target.value,
                })
              }
              className={commonInputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className={labelClass}>
              Upload Repayment Proof <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document.getElementById("business-income-proof")?.click()
                }
                className={`${buttonClass} min-w-[140px]`}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <div className="flex-1 h-12 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500 truncate">
                {businessIncomeData.proofFileName || "No file selected"}
              </div>
            </div>
            <input
              id="business-income-proof"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleBusinessIncomeFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* 2. GUARANTOR SECTION */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4 mb-6">
          GUARANTOR INFORMATION
        </h2>

        {/* Global Guarantor Question */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <Label className={labelClass}>
              Is Repayment Guarantor Applicable?{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Select
              value={isGuarantorApplicable || ""}
              onValueChange={setIsGuarantorApplicable}
            >
              <SelectTrigger className={selectTriggerClass}>
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

              return (
                <div
                  key={index}
                  className="border-2 border-gray-100 rounded-xl p-6 relative bg-white shadow-sm"
                >
                  {/* Guarantor Header */}
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

                  {/* Identity Lookup Popup */}
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
                        <Label className={labelClass}>
                          Identification Type{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.idType}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "idType", val)
                          }
                        >
                          <SelectTrigger className={selectTriggerClass}>
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
                      </div>

                      <div>
                        <Label className={labelClass}>
                          Identification No.{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={guarantor.idNumber || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "idNumber",
                              e.target.value,
                            )
                          }
                          onBlur={() => handleIdentityCheck(index)} // Trigger lookup on blur
                          className={commonInputClass}
                          placeholder="Enter ID"
                        />
                      </div>

                      <div>
                        <Label className={labelClass}>
                          Salutation <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.salutation}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "salutation", val)
                          }
                        >
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mr">Mr.</SelectItem>
                            <SelectItem value="mrs">Mrs.</SelectItem>
                            <SelectItem value="ms">Ms.</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className={labelClass}>
                          Guarantor Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={guarantor.guarantorName || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "guarantorName",
                              e.target.value,
                            )
                          }
                          className={commonInputClass}
                          placeholder="Full Name"
                        />
                      </div>

                      <div>
                        <Label className={labelClass}>
                          Nationality <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.nationality}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "nationality", val)
                          }
                        >
                          <SelectTrigger className={selectTriggerClass}>
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
                      </div>

                      <div>
                        <Label className={labelClass}>
                          Gender <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.gender}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "gender", val)
                          }
                        >
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className={labelClass}>
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
                          className={commonInputClass}
                        />
                      </div>

                      <div>
                        <Label className={labelClass}>
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
                          className={commonInputClass}
                        />
                      </div>

                      <div>
                        <Label className={labelClass}>TPN No.</Label>
                        <Input
                          value={guarantor.tpnNo || ""}
                          onChange={(e) =>
                            updateGuarantorField(index, "tpnNo", e.target.value)
                          }
                          className={commonInputClass}
                          placeholder="Enter TPN"
                        />
                      </div>

                      <div>
                        <Label className={labelClass}>
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
                          className={commonInputClass}
                        />
                      </div>

                      <div>
                        <Label className={labelClass}>
                          Marital Status <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.maritalStatus}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "maritalStatus", val)
                          }
                        >
                          <SelectTrigger className={selectTriggerClass}>
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
                      </div>

                      <div>
                        <Label className={labelClass}>Upload Family Tree</Label>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document
                                .getElementById(`familyTree-${index}`)
                                ?.click()
                            }
                            className={`${buttonClass} min-w-[120px]`}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                          </Button>
                          <div className="flex-1 h-12 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500 truncate">
                            {guarantor.familyTree || "No file"}
                          </div>
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
                      </div>
                    </div>

                    {isMarried && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                        <h5 className="font-semibold text-gray-700 mb-4">
                          Spouse Information
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <Label className={labelClass}>Spouse Name</Label>
                            <Input
                              value={guarantor.spouseName || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "spouseName",
                                  e.target.value,
                                )
                              }
                              className={commonInputClass}
                            />
                          </div>
                          <div>
                            <Label className={labelClass}>Spouse CID No.</Label>
                            <Input
                              value={guarantor.spouseCid || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "spouseCid",
                                  e.target.value,
                                )
                              }
                              className={commonInputClass}
                            />
                          </div>
                          <div>
                            <Label className={labelClass}>Spouse Contact</Label>
                            <Input
                              value={guarantor.spouseContact || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "spouseContact",
                                  e.target.value,
                                )
                              }
                              className={commonInputClass}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label className={labelClass}>
                          Bank Name <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.bankName}
                          onValueChange={(value) =>
                            updateGuarantorField(index, "bankName", value)
                          }
                        >
                          <SelectTrigger className={selectTriggerClass}>
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
                      </div>

                      <div>
                        <Label className={labelClass}>
                          Bank Account No.{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={guarantor.bankAccountNumber || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "bankAccountNumber",
                              e.target.value,
                            )
                          }
                          className={commonInputClass}
                        />
                      </div>

                      <div>
                        <Label className={labelClass}>
                          Passport Size Photo
                        </Label>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document
                                .getElementById(`passport-${index}`)
                                ?.click()
                            }
                            className={`${buttonClass} min-w-[120px]`}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                          </Button>
                          <div className="flex-1 h-12 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500 truncate">
                            {guarantor.passportPhoto || "No file"}
                          </div>
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
                        <Label className={labelClass}>
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
                          <SelectTrigger className={selectTriggerClass}>
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
                      </div>

                      <div>
                        <Label className={labelClass}>
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
                          className={commonInputClass}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label className={labelClass}>
                          Upload Proof <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document
                                .getElementById(`guarantor-proof-${index}`)
                                ?.click()
                            }
                            className={`${buttonClass} min-w-[120px]`}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                          </Button>
                          <div className="flex-1 h-12 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500 truncate">
                            {guarantor.proofFileName || "No file"}
                          </div>
                        </div>
                        <input
                          id={`guarantor-proof-${index}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleGuarantorProofChange(index, e)}
                          className="hidden"
                        />
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
                        <Label className={labelClass}>
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.permCountry}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "permCountry", val)
                          }
                        >
                          <SelectTrigger className={selectTriggerClass}>
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
                      </div>

                      <div>
                        <Label className={labelClass}>
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
                            <SelectTrigger className={selectTriggerClass}>
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
                          <Input
                            value={guarantor.permDzongkhag || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "permDzongkhag",
                                e.target.value,
                              )
                            }
                            className={commonInputClass}
                          />
                        )}
                      </div>

                      <div>
                        <Label className={labelClass}>
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
                            <SelectTrigger className={selectTriggerClass}>
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
                          <Input
                            value={guarantor.permGewog || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "permGewog",
                                e.target.value,
                              )
                            }
                            className={commonInputClass}
                          />
                        )}
                      </div>

                      <div>
                        <Label className={labelClass}>
                          {isPermBhutan ? "Village/Street" : "Street"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={guarantor.permVillage || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "permVillage",
                              e.target.value,
                            )
                          }
                          className={commonInputClass}
                        />
                      </div>

                      {isPermBhutan ? (
                        <>
                          <div>
                            <Label className={labelClass}>Thram No.</Label>
                            <Input
                              value={guarantor.permThram || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "permThram",
                                  e.target.value,
                                )
                              }
                              className={commonInputClass}
                            />
                          </div>
                          <div>
                            <Label className={labelClass}>House No.</Label>
                            <Input
                              value={guarantor.permHouse || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "permHouse",
                                  e.target.value,
                                )
                              }
                              className={commonInputClass}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <Label className={labelClass}>
                              City <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              value={guarantor.permCity || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "permCity",
                                  e.target.value,
                                )
                              }
                              className={commonInputClass}
                            />
                          </div>
                          <div>
                            <Label className={labelClass}>Postal/ZIP</Label>
                            <Input
                              value={guarantor.permPostal || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "permPostal",
                                  e.target.value,
                                )
                              }
                              className={commonInputClass}
                            />
                          </div>
                          <div>
                            <Label className={labelClass}>Address Proof</Label>
                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  document
                                    .getElementById(`perm-proof-${index}`)
                                    ?.click()
                                }
                                className={`${buttonClass} min-w-[120px]`}
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload
                              </Button>
                              <div className="flex-1 h-12 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500 truncate">
                                {guarantor.permAddressProof || "No file"}
                              </div>
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
                        <Label className={labelClass}>
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.currCountry}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "currCountry", val)
                          }
                        >
                          <SelectTrigger className={selectTriggerClass}>
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
                      </div>

                      <div>
                        <Label className={labelClass}>
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
                            <SelectTrigger className={selectTriggerClass}>
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
                          <Input
                            value={guarantor.currDzongkhag || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "currDzongkhag",
                                e.target.value,
                              )
                            }
                            className={commonInputClass}
                          />
                        )}
                      </div>

                      <div>
                        <Label className={labelClass}>
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
                            <SelectTrigger className={selectTriggerClass}>
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
                          <Input
                            value={guarantor.currGewog || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "currGewog",
                                e.target.value,
                              )
                            }
                            className={commonInputClass}
                          />
                        )}
                      </div>

                      <div>
                        <Label className={labelClass}>
                          {isCurrBhutan ? "Village/Street" : "Street"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={guarantor.currVillage || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "currVillage",
                              e.target.value,
                            )
                          }
                          className={commonInputClass}
                        />
                      </div>

                      <div>
                        <Label className={labelClass}>
                          House/Building/Flat No.
                        </Label>
                        <Input
                          value={guarantor.currHouse || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "currHouse",
                              e.target.value,
                            )
                          }
                          className={commonInputClass}
                        />
                      </div>

                      {!isCurrBhutan && (
                        <>
                          <div>
                            <Label className={labelClass}>
                              City <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              value={guarantor.currCity || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "currCity",
                                  e.target.value,
                                )
                              }
                              className={commonInputClass}
                            />
                          </div>
                          <div>
                            <Label className={labelClass}>Postal/ZIP</Label>
                            <Input
                              value={guarantor.currPostal || ""}
                              onChange={(e) =>
                                updateGuarantorField(
                                  index,
                                  "currPostal",
                                  e.target.value,
                                )
                              }
                              className={commonInputClass}
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <Label className={labelClass}>
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="email"
                          value={guarantor.email || ""}
                          onChange={(e) =>
                            updateGuarantorField(index, "email", e.target.value)
                          }
                          className={commonInputClass}
                        />
                      </div>

                      <div>
                        <Label className={labelClass}>
                          Contact No. <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={guarantor.contact || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "contact",
                              e.target.value,
                            )
                          }
                          className={commonInputClass}
                        />
                      </div>

                      <div>
                        <Label className={labelClass}>Alternate Contact</Label>
                        <Input
                          value={guarantor.currAlternateContact || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "currAlternateContact",
                              e.target.value,
                            )
                          }
                          className={commonInputClass}
                        />
                      </div>

                      {!isCurrBhutan && (
                        <div>
                          <Label className={labelClass}>Address Proof</Label>
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                document
                                  .getElementById(`curr-proof-${index}`)
                                  ?.click()
                              }
                              className={`${buttonClass} min-w-[120px]`}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Upload
                            </Button>
                            <div className="flex-1 h-12 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500 truncate">
                              {guarantor.currAddressProof || "No file"}
                            </div>
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
                        <Label className={labelClass}>
                          Politically Exposed Person?{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.isPep}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "isPep", val)
                          }
                        >
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {guarantor.isPep === "yes" && (
                        <>
                          <div>
                            <Label className={labelClass}>
                              PEP Category{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={guarantor.pepCategory}
                              onValueChange={(val) =>
                                updateGuarantorField(index, "pepCategory", val)
                              }
                            >
                              <SelectTrigger className={selectTriggerClass}>
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
                          </div>

                          <div>
                            <Label className={labelClass}>
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
                              <SelectTrigger className={selectTriggerClass}>
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
                          </div>

                          <div>
                            <Label className={labelClass}>Upload ID</Label>
                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  document
                                    .getElementById(`pep-self-${index}`)
                                    ?.click()
                                }
                                className={`${buttonClass} min-w-[120px]`}
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload
                              </Button>
                              <div className="flex-1 h-12 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500 truncate">
                                {guarantor.pepUpload || "No file"}
                              </div>
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
                          </div>
                        </>
                      )}
                    </div>

                    {guarantor.isPep === "no" && (
                      <div className="mt-4">
                        <div className="mb-6">
                          <div className="grid grid-cols-1 md:grid-cols-3">
                            <div>
                              <Label className={labelClass}>
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
                                <SelectTrigger className={selectTriggerClass}>
                                  <SelectValue placeholder="[Select]" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Yes</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
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

                                  {/* FIXED: Uniform Grid Layout */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                      <Label className={labelClass}>
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
                                          className={selectTriggerClass}
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
                                    </div>

                                    <div className="space-y-2">
                                      <Label className={labelClass}>
                                        ID Number
                                      </Label>
                                      <Input
                                        className={commonInputClass}
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
                                    </div>

                                    <div className="space-y-2">
                                      <Label className={labelClass}>
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
                                          className={selectTriggerClass}
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
                                    </div>

                                    <div className="space-y-2">
                                      <Label className={labelClass}>
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
                                          className={selectTriggerClass}
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
                                    </div>

                                    {/* FIXED: Upload Field matches grid and height */}
                                    <div className="space-y-2">
                                      <Label className={labelClass}>
                                        Upload ID Proof
                                      </Label>
                                      <div className="flex items-center gap-3 h-12">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={() =>
                                            document
                                              .getElementById(
                                                `pep-related-proof-${index}-${pIndex}`,
                                              )
                                              ?.click()
                                          }
                                          className={`${buttonClass} min-w-[120px]`}
                                        >
                                          <Upload className="mr-2 h-4 w-4" />
                                          Upload
                                        </Button>
                                        <div className="flex-1 h-12 flex items-center px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-500 truncate">
                                          {pep.identificationProof || "No file"}
                                        </div>
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
                      <Label className={labelClass}>
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
                    </div>

                    {guarantor.employmentStatus === "employed" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <Label className={labelClass}>Employee ID</Label>
                          <Input
                            value={guarantor.employeeId || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "employeeId",
                                e.target.value,
                              )
                            }
                            className={commonInputClass}
                          />
                        </div>

                        <div>
                          <Label className={labelClass}>Occupation</Label>
                          <Select
                            value={guarantor.occupation}
                            onValueChange={(value) =>
                              updateGuarantorField(index, "occupation", value)
                            }
                          >
                            <SelectTrigger className={selectTriggerClass}>
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
                        </div>

                        <div>
                          <Label className={labelClass}>Employer Type</Label>
                          <Select
                            value={guarantor.employerType}
                            onValueChange={(value) =>
                              updateGuarantorField(index, "employerType", value)
                            }
                          >
                            <SelectTrigger className={selectTriggerClass}>
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
                        </div>

                        <div>
                          <Label className={labelClass}>Designation</Label>
                          <Input
                            value={guarantor.designation || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "designation",
                                e.target.value,
                              )
                            }
                            className={commonInputClass}
                          />
                        </div>

                        <div>
                          <Label className={labelClass}>Grade</Label>
                          <Select
                            value={guarantor.grade}
                            onValueChange={(value) =>
                              updateGuarantorField(index, "grade", value)
                            }
                          >
                            <SelectTrigger className={selectTriggerClass}>
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="p1">P1</SelectItem>
                              <SelectItem value="p2">P2</SelectItem>
                              <SelectItem value="p3">P3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className={labelClass}>Organization</Label>
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
                            <SelectTrigger className={selectTriggerClass}>
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
                        </div>

                        <div>
                          <Label className={labelClass}>Org. Location</Label>
                          <Input
                            value={guarantor.orgLocation || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "orgLocation",
                                e.target.value,
                              )
                            }
                            className={commonInputClass}
                          />
                        </div>

                        <div>
                          <Label className={labelClass}>Joining Date</Label>
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
                            className={commonInputClass}
                          />
                        </div>

                        <div>
                          <Label className={labelClass}>
                            Nature of Service
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
                            <SelectTrigger className={selectTriggerClass}>
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
                        </div>

                        <div>
                          <Label className={labelClass}>Annual Salary</Label>
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
                            className={commonInputClass}
                          />
                        </div>

                        {guarantor.serviceNature === "contract" && (
                          <div>
                            <Label className={labelClass}>
                              Contract End Date
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
                              className={commonInputClass}
                            />
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
