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
import { Trash2, PlusCircle } from "lucide-react";

// Import mapping utility and Popup
import { mapCustomerDataToForm } from "@/lib/mapCustomerData";
import DocumentPopup from "@/components/BILSearchStatus";
import {
  fetchNationality,
  fetchIdentificationType,
  fetchCountry,
  fetchDzongkhag,
  fetchGewogsByDzongkhag,
  fetchMaritalStatus,
  fetchPepCategory,
  fetchPepSubCategoryByCategory,
  fetchBanks,
} from "@/services/api";

interface RepaymentSourceFormProps {
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

// Initialize empty related PEP entry
const createEmptyRelatedPep = () => ({
  relationship: "",
  identificationNo: "",
  category: "",
  subCategory: "",
  identificationProof: "",
});

// Initialize empty guarantor with updated fields
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
  relatedPeps: [],

  // Internal State
  showLookupPopup: false,
  lookupStatus: "searching" as "searching" | "found" | "not_found",
  fetchedCustomerData: null,
  errors: {} as Record<string, string>,

  // Dropdown options specific to this guarantor
  permGewogOptions: [] as any[],
  currGewogOptions: [] as any[],
  pepSubCategoryOptions: [] as any[],
  relatedPepOptionsMap: {} as Record<number, any[]>,
});

export function RepaymentSourceForm({
  onNext,
  onBack,
  formData,
}: RepaymentSourceFormProps) {
  // --- STATE ---
  const [incomeData, setIncomeData] = useState(
    formData?.incomeDetails || {
      repaymentGuarantor: "no",
      enableMonthlySalary: false,
      enableRentalIncome: false,
      enableBusinessIncome: false,
      enableVehicleHiring: false,
      enableDividendIncome: false,
      enableAgricultureIncome: false,
      enableTruckTaxiIncome: false,
      repaymentProof: null as File | null,
    },
  );

  // Guarantors Array (Independent Objects)
  const [guarantors, setGuarantors] = useState<any[]>([createEmptyGuarantor()]);

  // Dropdown Options (Shared)
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<
    any[]
  >([]);
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([]);
  const [pepCategoryOptions, setPepCategoryOptions] = useState<any[]>([]);
  const [banksOptions, setBankOptions] = useState<any[]>([]);

  // Constants
  const today = new Date().toISOString().split("T")[0];
  const fifteenYearsAgo = new Date();
  fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
  const maxDobDate = fifteenYearsAgo.toISOString().split("T")[0];

  // --- HELPER: Determine if Married ---
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

  const isBhutan = (id: string) => {
    if (!id) return false;
    const c = countryOptions.find(
      (o) => String(o.country_pk_code || o.id) === String(id),
    );
    return c && (c.country || c.name || "").toLowerCase().includes("bhutan");
  };

  // --- DATA LOADING ---
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [nat, idTypes, countries, dzos, marital, pepCats, banks] =
          await Promise.all([
            fetchNationality().catch(() => []),
            fetchIdentificationType().catch(() => []),
            fetchCountry().catch(() => []),
            fetchDzongkhag().catch(() => []),
            fetchMaritalStatus().catch(() => []),
            fetchPepCategory().catch(() => []),
            fetchBanks().catch(() => []),
          ]);
        setNationalityOptions(nat);
        setIdentificationTypeOptions(idTypes);
        setCountryOptions(countries);
        setDzongkhagOptions(dzos);
        setMaritalStatusOptions(marital);
        setPepCategoryOptions(pepCats);
        setBankOptions(banks || []);
      } catch (error) {
        console.error("Failed to load dropdown data:", error);
      }
    };
    loadAllData();
  }, []);

  // Sync with formData
  useEffect(() => {
    if (formData) {
      if (formData.repaymentSource) {
        const { guarantors: savedGuarantors, ...restIncome } =
          formData.repaymentSource;
        setIncomeData(restIncome);
        if (
          savedGuarantors &&
          Array.isArray(savedGuarantors) &&
          savedGuarantors.length > 0
        ) {
          setGuarantors(savedGuarantors);
        }
      } else if (formData.incomeDetails) {
        setIncomeData(formData.incomeDetails);
        if (formData.guarantors && Array.isArray(formData.guarantors)) {
          setGuarantors(formData.guarantors);
        }
      }
    }
  }, [formData]);

  // --- DYNAMIC GEWOG LOADING (Per Guarantor) ---
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

  // --- PEP SUBCATEGORY LOADING ---
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

  // --- HANDLERS ---

  const handleIncomeChange = (field: string, value: any) => {
    setIncomeData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleRepaymentProofChange = (file: File | null) => {
    setIncomeData((prev: any) => ({ ...prev, repaymentProof: file }));
  };

  const addGuarantor = () =>
    setGuarantors([...guarantors, createEmptyGuarantor()]);

  const removeGuarantor = (index: number) => {
    if (guarantors.length > 1)
      setGuarantors(guarantors.filter((_, i) => i !== index));
  };

  const updateGuarantorField = (index: number, field: string, value: any) => {
    setGuarantors((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
        ...(field === "isPep" && value === "yes" ? { relatedToPep: "" } : {}),
        ...(field === "isPep" && value === "no"
          ? { pepCategory: "", pepSubCategory: "", pepUpload: "" }
          : {}),
        ...(field === "relatedToPep" && value === "yes"
          ? {
              relatedPeps: [createEmptyRelatedPep()],
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

  // --- IDENTITY LOOKUP ---
  const handleIdentityCheck = async (index: number) => {
    const guarantor = guarantors[index];
    if (!guarantor.idType || !guarantor.idNumber) return;

    setGuarantors((prev) => {
      const up = [...prev];
      up[index].showLookupPopup = true;
      up[index].lookupStatus = "searching";
      return up;
    });

    try {
      const response = await fetch("/api/customer-onboarded-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "I",
          identification_type_pk_code: guarantor.idType,
          identity_no: guarantor.idNumber,
        }),
      });
      const result = await response.json();
      if (response.ok && result?.success && result?.data) {
        const mapped = mapCustomerDataToForm(result);
        setGuarantors((prev) => {
          const up = [...prev];
          up[index].fetchedCustomerData = mapped;
          up[index].lookupStatus = "found";
          return up;
        });
      } else {
        setGuarantors((prev) => {
          const up = [...prev];
          up[index].lookupStatus = "not_found";
          return up;
        });
      }
    } catch (error) {
      setGuarantors((prev) => {
        const up = [...prev];
        up[index].lookupStatus = "not_found";
        return up;
      });
    }
  };

  const handleLookupProceed = (index: number) => {
    const g = guarantors[index];
    if (g.lookupStatus === "found" && g.fetchedCustomerData) {
      const d = g.fetchedCustomerData;
      const mapped = {
        guarantorName: d.name,
        nationality: d.nationality ? String(d.nationality) : "",
        idIssueDate: formatDateForInput(d.identificationIssueDate),
        idExpiryDate: formatDateForInput(d.identificationExpiryDate),
        dateOfBirth: formatDateForInput(d.dateOfBirth),
        tpnNo: d.tpn || "",
        maritalStatus: d.maritalStatus ? String(d.maritalStatus) : "",
        gender: d.gender ? String(d.gender) : "",
        email: d.email || "",
        contact: d.contact || "",
        permCountry: d.permCountry ? String(d.permCountry) : "",
        permDzongkhag: d.permDzongkhag ? String(d.permDzongkhag) : "",
        permGewog: d.permGewog ? String(d.permGewog) : "",
        permVillage: d.permVillage || "",
        currCountry: d.currCountry ? String(d.currCountry) : "",
        currDzongkhag: d.currDzongkhag ? String(d.currDzongkhag) : "",
        currGewog: d.currGewog ? String(d.currGewog) : "",
        currVillage: d.currVillage || "",
      };

      setGuarantors((prev) => {
        const up = [...prev];
        up[index] = { ...up[index], ...mapped, showLookupPopup: false };
        return up;
      });
    } else {
      setGuarantors((prev) => {
        const up = [...prev];
        up[index].showLookupPopup = false;
        return up;
      });
    }
  };

  // --- FIXED PEP HANDLERS ---
  const handleAddRelatedPep = useCallback((index: number) => {
    setGuarantors((prev) => {
      const up = [...prev];
      // Ensure relatedPeps array exists
      if (!up[index].relatedPeps) {
        up[index].relatedPeps = [];
      }

      // Create a new array with one additional entry
      const updatedRelatedPeps = [
        ...up[index].relatedPeps,
        createEmptyRelatedPep(),
      ];

      // Update the specific guarantor with the new array
      up[index] = {
        ...up[index],
        relatedPeps: updatedRelatedPeps,
      };

      return up;
    });
  }, []);

  const handleRemoveRelatedPep = (gIndex: number, pIndex: number) => {
    setGuarantors((prev) => {
      const up = [...prev];
      if (up[gIndex].relatedPeps && up[gIndex].relatedPeps.length > 1) {
        up[gIndex].relatedPeps = up[gIndex].relatedPeps.filter(
          (_: any, i: number) => i !== pIndex,
        );
      } else {
        // If only one entry, reset to empty array
        up[gIndex].relatedPeps = [];
      }
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

      if (!peps[pIndex]) {
        // Initialize if doesn't exist
        peps[pIndex] = createEmptyRelatedPep();
      }

      peps[pIndex] = { ...peps[pIndex], [field]: value };

      if (field === "category") {
        peps[pIndex].subCategory = "";
        fetchPepSubCategoryByCategory(value).then((res) => {
          setGuarantors((curr) => {
            const cUp = [...curr];
            if (!cUp[gIndex].relatedPepOptionsMap)
              cUp[gIndex].relatedPepOptionsMap = {};
            cUp[gIndex].relatedPepOptionsMap[pIndex] = res || [];
            return cUp;
          });
        });
      }
      up[gIndex].relatedPeps = peps;
      return up;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      repaymentSource: {
        ...incomeData,
        guarantors: incomeData.repaymentGuarantor === "yes" ? guarantors : [],
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* 1. INCOME DETAILS */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
          INCOME DETAILS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Monthly Salary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chk-salary"
                checked={incomeData.enableMonthlySalary || false}
                onChange={(e) =>
                  handleIncomeChange("enableMonthlySalary", e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-400"
              />
              <label
                htmlFor="chk-salary"
                className="text-gray-800 font-semibold text-sm"
              >
                Monthly Salary (Nu.)
              </label>
            </div>
            <Input
              type="number"
              disabled={!incomeData.enableMonthlySalary}
              value={incomeData.monthlySalary || ""}
              onChange={(e) =>
                handleIncomeChange("monthlySalary", e.target.value)
              }
              placeholder="Amount"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
            />
          </div>

          {/* Rental Income */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chk-rental"
                checked={incomeData.enableRentalIncome || false}
                onChange={(e) =>
                  handleIncomeChange("enableRentalIncome", e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-400"
              />
              <label
                htmlFor="chk-rental"
                className="text-gray-800 font-semibold text-sm"
              >
                Monthly Rental Income (Nu.)
              </label>
            </div>
            <Input
              type="number"
              disabled={!incomeData.enableRentalIncome}
              value={incomeData.rentalIncome || ""}
              onChange={(e) =>
                handleIncomeChange("rentalIncome", e.target.value)
              }
              placeholder="Amount"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
            />
          </div>

          {/* Business Income */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chk-business"
                checked={incomeData.enableBusinessIncome || false}
                onChange={(e) =>
                  handleIncomeChange("enableBusinessIncome", e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-400"
              />
              <label
                htmlFor="chk-business"
                className="text-gray-800 font-semibold text-sm"
              >
                Business Income (Nu.)
              </label>
            </div>
            <Input
              type="number"
              disabled={!incomeData.enableBusinessIncome}
              value={incomeData.businessIncome || ""}
              onChange={(e) =>
                handleIncomeChange("businessIncome", e.target.value)
              }
              placeholder="Amount"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
            />
          </div>

          {/* Vehicle Hiring */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chk-vehicle"
                checked={incomeData.enableVehicleHiring || false}
                onChange={(e) =>
                  handleIncomeChange("enableVehicleHiring", e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-400"
              />
              <label
                htmlFor="chk-vehicle"
                className="text-gray-800 font-semibold text-sm"
              >
                Vehicle Hiring Income (Nu.)
              </label>
            </div>
            <Input
              type="number"
              disabled={!incomeData.enableVehicleHiring}
              value={incomeData.vehicleHiringIncome || ""}
              onChange={(e) =>
                handleIncomeChange("vehicleHiringIncome", e.target.value)
              }
              placeholder="Amount"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
            />
          </div>

          {/* Dividend Income */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chk-dividend"
                checked={incomeData.enableDividendIncome || false}
                onChange={(e) =>
                  handleIncomeChange("enableDividendIncome", e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-400"
              />
              <label
                htmlFor="chk-dividend"
                className="text-gray-800 font-semibold text-sm"
              >
                Dividend Income (Nu.)
              </label>
            </div>
            <Input
              type="number"
              disabled={!incomeData.enableDividendIncome}
              value={incomeData.dividendIncome || ""}
              onChange={(e) =>
                handleIncomeChange("dividendIncome", e.target.value)
              }
              placeholder="Amount"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
            />
          </div>

          {/* Agriculture Income */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chk-agri"
                checked={incomeData.enableAgricultureIncome || false}
                onChange={(e) =>
                  handleIncomeChange(
                    "enableAgricultureIncome",
                    e.target.checked,
                  )
                }
                className="h-4 w-4 rounded border-gray-400"
              />
              <label
                htmlFor="chk-agri"
                className="text-gray-800 font-semibold text-sm"
              >
                Agriculture Income (Nu.)
              </label>
            </div>
            <Input
              type="number"
              disabled={!incomeData.enableAgricultureIncome}
              value={incomeData.agricultureIncome || ""}
              onChange={(e) =>
                handleIncomeChange("agricultureIncome", e.target.value)
              }
              placeholder="Amount"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
            />
          </div>

          {/* Truck/Taxi Income */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chk-truck"
                checked={incomeData.enableTruckTaxiIncome || false}
                onChange={(e) =>
                  handleIncomeChange("enableTruckTaxiIncome", e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-400"
              />
              <label
                htmlFor="chk-truck"
                className="text-gray-800 font-semibold text-sm"
              >
                Truck/Taxi Income (Nu.)
              </label>
            </div>
            <Input
              type="number"
              disabled={!incomeData.enableTruckTaxiIncome}
              value={incomeData.truckTaxiIncome || ""}
              onChange={(e) =>
                handleIncomeChange("truckTaxiIncome", e.target.value)
              }
              placeholder="Amount"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {/* FIXED: Repayment Proof File Upload */}
          <div className="space-y-3">
            <Label className="text-gray-800 font-semibold text-sm">
              Upload Repayment Proof <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                className="hidden"
                id="repayment-proof"
                onChange={(e) =>
                  handleRepaymentProofChange(e.target.files?.[0] || null)
                }
              />
              <Button
                variant="outline"
                type="button"
                className="h-12 bg-transparent"
                onClick={() =>
                  document.getElementById("repayment-proof")?.click()
                }
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {incomeData.repaymentProof
                  ? incomeData.repaymentProof.name
                  : "No file chosen"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-gray-800 font-semibold text-sm">
              Is Repayment Guarantor Applicable?{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={incomeData.repaymentGuarantor}
              onValueChange={(val) =>
                handleIncomeChange("repaymentGuarantor", val)
              }
            >
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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

      {/* 2. GUARANTORS SECTION */}
      {incomeData.repaymentGuarantor === "yes" &&
        guarantors.map((guarantor, index) => {
          const errors = guarantor.errors || {};
          const isPermBhutan = isBhutan(guarantor.permCountry);
          const isCurrBhutan = isBhutan(guarantor.currCountry);
          const isMarried = getIsMarried(guarantor);

          return (
            <div key={index} className="space-y-10">
              <DocumentPopup
                open={guarantor.showLookupPopup}
                onOpenChange={(v) => {
                  if (!v)
                    setGuarantors((p) => {
                      const u = [...p];
                      u[index].showLookupPopup = false;
                      return u;
                    });
                }}
                searchStatus={guarantor.lookupStatus}
                onProceed={() => handleLookupProceed(index)}
              />

              {/* A. PERSONAL DETAILS */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
                <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-bold text-[#003DA5]">
                    Guarantor {index + 1} Personal Details
                  </h2>
                  {guarantors.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeGuarantor(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Remove
                    </Button>
                  )}
                </div>

                {/* Row 1: ID Type, ID No, Issue Date */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
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
                        className={`h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] ${errors.idType ? "border-red-500" : ""}`}
                      >
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent>
                        {identificationTypeOptions.map((opt, i) => (
                          <SelectItem
                            key={i}
                            value={String(opt.identity_type_pk_code || opt.id)}
                          >
                            {opt.identity_type || opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Identification No. <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={guarantor.idNumber || ""}
                      onChange={(e) =>
                        updateGuarantorField(index, "idNumber", e.target.value)
                      }
                      onBlur={() => handleIdentityCheck(index)}
                      className={`h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] ${errors.idNumber ? "border-red-500" : ""}`}
                      placeholder="Enter ID"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Salutation <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={guarantor.salutation}
                      onValueChange={(val) =>
                        updateGuarantorField(index, "salutation", val)
                      }
                    >
                      <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mr">Mr.</SelectItem>
                        <SelectItem value="mrs">Mrs.</SelectItem>
                        <SelectItem value="ms">Ms.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Salutation, Name, Nationality */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Guarantor Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className={`h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] ${errors.guarantorName ? "border-red-500" : ""}`}
                      value={guarantor.guarantorName || ""}
                      onChange={(e) =>
                        updateGuarantorField(
                          index,
                          "guarantorName",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Nationality <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={guarantor.nationality}
                      onValueChange={(val) =>
                        updateGuarantorField(index, "nationality", val)
                      }
                    >
                      <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent>
                        {nationalityOptions.map((opt, i) => (
                          <SelectItem
                            key={i}
                            value={String(opt.nationality_pk_code || opt.id)}
                          >
                            {opt.nationality || opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={guarantor.gender}
                      onValueChange={(val) =>
                        updateGuarantorField(index, "gender", val)
                      }
                    >
                      <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Row 2: Expiry, TPN */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Identification Issue Date{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      value={formatDateForInput(guarantor.idIssueDate)}
                      onChange={(e) =>
                        updateGuarantorField(
                          index,
                          "idIssueDate",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Identification Expiry Date{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      value={formatDateForInput(guarantor.idExpiryDate)}
                      onChange={(e) =>
                        updateGuarantorField(
                          index,
                          "idExpiryDate",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">TPN No.</Label>
                    <Input
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      placeholder="Enter TPN"
                      value={guarantor.tpnNo || ""}
                      onChange={(e) =>
                        updateGuarantorField(index, "tpnNo", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Row 4: DOB, Marital, Gender */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Date of Birth <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      max={maxDobDate}
                      value={formatDateForInput(guarantor.dateOfBirth)}
                      onChange={(e) =>
                        updateGuarantorField(
                          index,
                          "dateOfBirth",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Marital Status <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={guarantor.maritalStatus}
                      onValueChange={(val) =>
                        updateGuarantorField(index, "maritalStatus", val)
                      }
                    >
                      <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent>
                        {maritalStatusOptions.map((opt, i) => (
                          <SelectItem
                            key={i}
                            value={String(opt.marital_status_pk_code || opt.id)}
                          >
                            {opt.marital_status || opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* SPOUSE PERSONAL INFORMATION */}
                  {isMarried && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-bold text-[#003DA5]">
                        Spouse Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">
                            Spouse Name
                          </Label>
                          <Input
                            className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                            placeholder="Enter Spouse Name"
                            value={guarantor.spouseName || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "spouseName",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">
                            Spouse CID No.
                          </Label>
                          <Input
                            className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                            placeholder="Enter Spouse CID"
                            value={guarantor.spouseCid || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "spouseCid",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">
                            Spouse Contact No.
                          </Label>
                          <Input
                            className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                            placeholder="Enter Spouse Contact"
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
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Upload Family Tree
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        className="hidden"
                        id={`ft-${index}`}
                        onChange={(e) =>
                          handleFileChange(
                            index,
                            "familyTree",
                            e.target.files?.[0] || null,
                          )
                        }
                      />
                      <Button
                        variant="outline"
                        type="button"
                        className="h-12 w-28"
                        onClick={() =>
                          document.getElementById(`ft-${index}`)?.click()
                        }
                      >
                        Choose File
                      </Button>
                      <span className="text-sm text-gray-500">
                        {guarantor.familyTree || "No file chosen"}
                      </span>
                    </div>
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
                      Bank Saving Account No{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`bankAccount-${index}`}
                      placeholder="Enter saving account number"
                      className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                      value={guarantor.bankAccount || ""}
                      onChange={(e) =>
                        updateGuarantorField(
                          index,
                          "bankAccount",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Passport Size Photo
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      className="hidden"
                      id={`passport-${index}`}
                      accept="image/*"
                      onChange={(e) =>
                        handleFileChange(
                          index,
                          "passportPhoto",
                          e.target.files?.[0] || null,
                        )
                      }
                    />
                    <Button
                      variant="outline"
                      type="button"
                      className="h-12 w-28"
                      onClick={() =>
                        document.getElementById(`passport-${index}`)?.click()
                      }
                    >
                      Choose File
                    </Button>
                    <span className="text-sm text-gray-500">
                      {guarantor.passportPhoto || "No file chosen"}
                    </span>
                  </div>
                </div>
              </div>

              {/* B. PERMANENT ADDRESS */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                  Permanent Address (Guarantor {index + 1})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={guarantor.permCountry}
                      onValueChange={(val) =>
                        updateGuarantorField(index, "permCountry", val)
                      }
                    >
                      <SelectTrigger
                        className={`h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] ${errors.permCountry ? "border-red-500" : ""}`}
                      >
                        <SelectValue placeholder="[Select Country]" />
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

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
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
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent>
                          {dzongkhagOptions.map((opt, i) => (
                            <SelectItem
                              key={i}
                              value={String(opt.dzongkhag_pk_code || opt.id)}
                            >
                              {opt.dzongkhag || opt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        placeholder="Enter State"
                        value={guarantor.permDzongkhag || ""}
                        onChange={(e) =>
                          updateGuarantorField(
                            index,
                            "permDzongkhag",
                            e.target.value,
                          )
                        }
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
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
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        placeholder="Enter Province"
                        value={guarantor.permGewog || ""}
                        onChange={(e) =>
                          updateGuarantorField(
                            index,
                            "permGewog",
                            e.target.value,
                          )
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      {isPermBhutan ? "Village/Street" : "Street"}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      value={guarantor.permVillage || ""}
                      onChange={(e) =>
                        updateGuarantorField(
                          index,
                          "permVillage",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  {isPermBhutan ? (
                    <>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          Thram No
                        </Label>
                        <Input
                          className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          value={guarantor.permThram || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "permThram",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          House No
                        </Label>
                        <Input
                          className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          value={guarantor.permHouse || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "permHouse",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          City <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          value={guarantor.permCity || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "permCity",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          Postal/ZIP Code
                        </Label>
                        <Input
                          className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          value={guarantor.permPostal || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "permPostal",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Perm Address Proof - Only for non-Bhutan */}
                {!isPermBhutan && guarantor.permCountry && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Upload Address Proof Document{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        className="hidden"
                        id={`pap-${index}`}
                        onChange={(e) =>
                          handleFileChange(
                            index,
                            "permAddressProof",
                            e.target.files?.[0] || null,
                          )
                        }
                      />
                      <Button
                        variant="outline"
                        type="button"
                        className="h-12 w-28"
                        onClick={() =>
                          document.getElementById(`pap-${index}`)?.click()
                        }
                      >
                        Choose File
                      </Button>
                      <span className="text-sm text-gray-500">
                        {guarantor.permAddressProof || "No file chosen"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* C. CURRENT ADDRESS */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                  Current/Residential Address (Guarantor {index + 1})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={guarantor.currCountry}
                      onValueChange={(val) =>
                        updateGuarantorField(index, "currCountry", val)
                      }
                    >
                      <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                        <SelectValue placeholder="[Select Country]" />
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

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
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
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent>
                          {dzongkhagOptions.map((opt, i) => (
                            <SelectItem
                              key={i}
                              value={String(opt.dzongkhag_pk_code || opt.id)}
                            >
                              {opt.dzongkhag || opt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        placeholder="Enter State"
                        value={guarantor.currDzongkhag || ""}
                        onChange={(e) =>
                          updateGuarantorField(
                            index,
                            "currDzongkhag",
                            e.target.value,
                          )
                        }
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
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
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        placeholder="Enter Province"
                        value={guarantor.currGewog || ""}
                        onChange={(e) =>
                          updateGuarantorField(
                            index,
                            "currGewog",
                            e.target.value,
                          )
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      {isCurrBhutan ? "Village/Street" : "Street"}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      value={guarantor.currVillage || ""}
                      onChange={(e) =>
                        updateGuarantorField(
                          index,
                          "currVillage",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      House/Building/Flat No.
                    </Label>
                    <Input
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      value={guarantor.currHouse || ""}
                      onChange={(e) =>
                        updateGuarantorField(index, "currHouse", e.target.value)
                      }
                    />
                  </div>

                  {!isCurrBhutan && (
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">
                        City <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.currCity || ""}
                        onChange={(e) =>
                          updateGuarantorField(
                            index,
                            "currCity",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  )}
                </div>
                {!isCurrBhutan && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Postal/ZIP Code
                    </Label>
                    <Input
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      value={guarantor.currPostal || ""}
                      onChange={(e) =>
                        updateGuarantorField(
                          index,
                          "currPostal",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      type="email"
                      value={guarantor.email || ""}
                      onChange={(e) =>
                        updateGuarantorField(index, "email", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Contact Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      value={guarantor.contact || ""}
                      onChange={(e) =>
                        updateGuarantorField(index, "contact", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Alternate Contact Number{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      value={guarantor.contact || ""}
                      onChange={(e) =>
                        updateGuarantorField(index, "contact", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Curr Address Proof - Only for non-Bhutan */}
                {!isCurrBhutan && guarantor.currCountry && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Upload Address Proof Document{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        className="hidden"
                        id={`cap-${index}`}
                        onChange={(e) =>
                          handleFileChange(
                            index,
                            "currAddressProof",
                            e.target.files?.[0] || null,
                          )
                        }
                      />
                      <Button
                        variant="outline"
                        type="button"
                        className="h-12 w-28"
                        onClick={() =>
                          document.getElementById(`cap-${index}`)?.click()
                        }
                      >
                        Choose File
                      </Button>
                      <span className="text-sm text-gray-500">
                        {guarantor.currAddressProof || "No file chosen"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* D. PEP DECLARATION */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                  PEP Declaration (Guarantor {index + 1})
                </h2>

                {/* Self PEP */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Politically Exposed Person?{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={guarantor.isPep}
                      onValueChange={(val) =>
                        updateGuarantorField(index, "isPep", val)
                      }
                    >
                      <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          PEP Category <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.pepCategory}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "pepCategory", val)
                          }
                        >
                          <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          Sub Category <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.pepSubCategory}
                          onValueChange={(val) =>
                            updateGuarantorField(index, "pepSubCategory", val)
                          }
                          disabled={!guarantor.pepCategory}
                        >
                          <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          Upload ID Proof{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            className="hidden"
                            id={`pep-self-${index}`}
                            onChange={(e) =>
                              handleFileChange(
                                index,
                                "pepUpload",
                                e.target.files?.[0] || null,
                              )
                            }
                          />
                          <Button
                            variant="outline"
                            type="button"
                            className="h-12 w-28"
                            onClick={() =>
                              document
                                .getElementById(`pep-self-${index}`)
                                ?.click()
                            }
                          >
                            Choose File
                          </Button>
                          <span className="text-sm text-gray-500">
                            {guarantor.pepUpload || "No file chosen"}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Related PEP */}
                {guarantor.isPep === "no" && (
                  <div className="mt-6">
                    <div className="space-y-3 max-w-xs mb-4">
                      <Label className="text-sm font-semibold">
                        Related to any PEP?{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.relatedToPep}
                        onValueChange={(val) =>
                          updateGuarantorField(index, "relatedToPep", val)
                        }
                      >
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {guarantor.relatedToPep === "yes" && (
                      <div className="space-y-4">
                        {guarantor.relatedPeps?.map(
                          (pep: any, pIndex: number) => (
                            <div
                              key={pIndex}
                              className="bg-gray-50 p-4 rounded-lg border relative"
                            >
                              {guarantor.relatedPeps.length > 1 && (
                                <div className="absolute top-2 right-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveRelatedPep(index, pIndex)
                                    }
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                                <div className="space-y-2">
                                  <Label className="text-xs">
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
                                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
                                  <Label className="text-xs">ID Number</Label>
                                  <Input
                                    className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
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
                                  <Label className="text-xs">Category</Label>
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
                                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                                      <SelectValue placeholder="Select" />
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
                                <div className="space-y-2">
                                  <Label className="text-xs">
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
                                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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
                              </div>
                              <div className="mt-4">
                                <Label className="text-sm font-semibold">
                                  Identification Proof{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex items-center gap-2 mt-2">
                                  <input
                                    type="file"
                                    className="hidden"
                                    id={`pep-related-proof-${index}-${pIndex}`}
                                    onChange={(e) =>
                                      handleRelatedPepFileChange(
                                        index,
                                        pIndex,
                                        e.target.files?.[0] || null,
                                      )
                                    }
                                  />
                                  <Button
                                    variant="outline"
                                    type="button"
                                    className="h-12 w-28"
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
                                  <span className="text-sm text-gray-500">
                                    {pep.identificationProof ||
                                      "No file chosen"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ),
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddRelatedPep(index)}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" /> Add Related
                          Person
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

      {incomeData.repaymentGuarantor === "yes" && (
        <div className="flex justify-center pt-4">
          <Button
            type="button"
            size="lg"
            className="min-w-40 px-10 py-6 rounded-xl bg-[#003DA5] hover:bg-[#002D7A]"
            onClick={addGuarantor}
          >
            + Add Guarantor
          </Button>
        </div>
      )}

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
