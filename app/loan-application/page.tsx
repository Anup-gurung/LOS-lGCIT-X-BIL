"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Percent, Calendar, Menu, X } from "lucide-react";
import DocumentPopup from "@/components/DocumentPopup";
import { PersonalDetailsForm } from "@/components/individual/PersonalDetail";
import { CoBorrowerDetailsForm } from "@/components/individual/CoBorrowerDetail";
import { SecurityDetailsForm } from "@/components/individual/SecurityDetail";
import { RepaymentSourceForm } from "@/components/individual/RepaymentSource";
import { Confirmation } from "@/components/confirmation";
import {
  fetchLoanTypes,
  fetchLoanSectors,
  fetchLoanSubSectors,
  fetchLoanSubSectorCategories,
} from "@/services/api";
import { loanInfoContent } from "@/components/text";

const steps = [
  "Loan Details",
  "Personal Details",
  "Co-Borrower Details",
  "Security Details",
  "Repayment Source",
  "Confirmation",
];

// Fields that belong to the loan details section
const LOAN_DETAIL_FIELDS = [
  "loanType", "loanTypeString", "loanSector", "loanSectorString",
  "loanSubSector", "loanSubSectorString", "loanSubSectorCategory",
  "loanSubSectorCategoryString", "loanAmount", "loanPurpose",
  "maxApiTenureMonths", "selectedYears", "selectedMonths", "interestRate"
];

// Allowed loan sectors as per requirement (individual version)
const allowedLoanSectors = [
  "Housing Sector",
  "Transport Loans",
  "Personal Loans",
  "Staff Incentive Loans",
  "Loan Against Term Deposits",
  "Loans for Shares and Securities",
  "Education Loans",
  "Medical Loans",
  "Agriculture and Livestock",
];

const SESSION_KEY = "loanApplicationform";

// Helper to load form data from sessionStorage (flattened)
function loadFormDataFromSession(): Record<string, any> {
  if (typeof window === "undefined") return {};
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return {};
  try {
    const data = JSON.parse(raw);
    // If loandetail exists, merge its properties into the top level
    if (data.loandetail && typeof data.loandetail === "object") {
      const { loandetail, ...rest } = data;
      return { ...rest, ...loandetail };
    }
    return data;
  } catch {
    return {};
  }
}

// Helper to save form data to sessionStorage with nested loandetail
function saveFormDataToSession(flatData: Record<string, any>) {
  if (typeof window === "undefined") return;
  // Separate loan detail fields
  const loandetail: Record<string, any> = {};
  const other: Record<string, any> = { ...flatData };
  for (const field of LOAN_DETAIL_FIELDS) {
    if (field in other) {
      loandetail[field] = other[field];
      delete other[field];
    }
  }
  const sessionData = { ...other };
  if (Object.keys(loandetail).length > 0) {
    sessionData.loandetail = loandetail;
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-lg">Loading...</p>
    </div>
  );
};

function LoanApplicationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const stepParam = searchParams.get("step");
  const [currentStep, setCurrentStep] = useState(
    stepParam ? parseInt(stepParam) : 0,
  );

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    router.push(`?step=${newStep}`, { scroll: false });
  };

  const [loanAmount, setLoanAmount] = useState([500000]);
  const [interestRate, setInterestRate] = useState([8.0]);
  const [tenure, setTenure] = useState([12]);
  const [totalLoanInput, setTotalLoanInput] = useState("");
  const [showDocumentPopup, setShowDocumentPopup] = useState(false);
  const [showStepsMenu, setShowStepsMenu] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Loading states
  const [isLoadingSectors, setIsLoadingSectors] = useState(false);
  const [isLoadingSubSectors, setIsLoadingSubSectors] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Dropdown options
  const [loanSectorOptions, setLoanSectorOptions] = useState<any[]>([]);
  const [loanSubSectorOptions, setLoanSubSectorOptions] = useState<any[]>([]);
  const [loanTypeOptions, setLoanTypeOptions] = useState<any[]>([]);
  const [subSectorCategoryOptions, setSubSectorCategoryOptions] = useState<any[]>([]);

  // Selected values
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedSubSector, setSelectedSubSector] = useState("");
  const [selectedLoanType, setSelectedLoanType] = useState("");
  const [selectedSubSectorCategory, setSelectedSubSectorCategory] = useState("");

  // Derived values
  const [apiTenure, setApiTenure] = useState<number>(0);
  const [apiInterestRate, setApiInterestRate] = useState<number>(0);
  const [purpose, setPurpose] = useState("");

  // User input tenure
  const [selectedYears, setSelectedYears] = useState<number | "">("");

  // Ref to prevent multiple initialization runs
  const initializedRef = useRef(false);

  // Load saved data from sessionStorage once
  const [savedDataLoaded, setSavedDataLoaded] = useState(false);
  useEffect(() => {
    const saved = loadFormDataFromSession();
    if (Object.keys(saved).length > 0) {
      setFormData(saved);
      // Set the raw selected values (these are the stored IDs)
      if (saved.loanType) setSelectedLoanType(saved.loanType);
      if (saved.loanSector) setSelectedSector(saved.loanSector);
      if (saved.loanSubSector) setSelectedSubSector(saved.loanSubSector);
      if (saved.loanSubSectorCategory) setSelectedSubSectorCategory(saved.loanSubSectorCategory);
      if (saved.loanAmount) setTotalLoanInput(saved.loanAmount);
      if (saved.loanPurpose) setPurpose(saved.loanPurpose);
      if (saved.selectedYears) setSelectedYears(saved.selectedYears);
      if (saved.interestRate) setApiInterestRate(saved.interestRate);
      if (saved.maxApiTenureMonths) setApiTenure(saved.maxApiTenureMonths);
    }
    setSavedDataLoaded(true);
  }, []);

  // ---------- Initial load: fetch loan types ----------
  useEffect(() => {
    const loadLoanTypes = async () => {
      try {
        const types = await fetchLoanTypes();
        setLoanTypeOptions(types);
      } catch (error) {
        console.error("Failed to load loan types", error);
      }
    };
    loadLoanTypes();
  }, []);

  // ---------- Initialize cascading dropdowns from saved data ----------
  useEffect(() => {
    // Only run once after loan types are loaded and saved data is loaded
    if (!savedDataLoaded || loanTypeOptions.length === 0) return;
    if (initializedRef.current) return;

    const initialize = async () => {
      const saved = loadFormDataFromSession();
      if (!saved.loanType) {
        initializedRef.current = true;
        return;
      }

      // 1. Restore loan type: parse the saved value to get index
      const loanTypeValue = saved.loanType;
      const loanTypeIndex = parseInt(loanTypeValue.split("-")[1]);
      if (isNaN(loanTypeIndex) || !loanTypeOptions[loanTypeIndex]) {
        console.warn("Saved loan type not found in options");
        initializedRef.current = true;
        return;
      }

      const selectedLoanTypeObj = loanTypeOptions[loanTypeIndex];
      const typeCode = selectedLoanTypeObj.loan_type_code_1;

      // 2. Fetch sectors for this loan type (filtered)
      setIsLoadingSectors(true);
      try {
        const sectors = await fetchLoanSectors(typeCode);
        const filteredSectors = sectors.filter((sector: any) =>
          allowedLoanSectors.some(
            (allowed) =>
              allowed.toLowerCase().trim() ===
              (sector.loan_sector || "").toLowerCase().trim()
          )
        );
        setLoanSectorOptions(filteredSectors);

        // 3. Restore sector if present
        if (saved.loanSector) {
          const savedSectorId = saved.loanSector;
          const sectorExists = filteredSectors.some(s => String(s.pk_id) === savedSectorId);
          if (sectorExists) {
            setSelectedSector(savedSectorId);

            // 4. Fetch sub-sectors for this sector
            setIsLoadingSubSectors(true);
            try {
              const subSectors = await fetchLoanSubSectors(savedSectorId);
              setLoanSubSectorOptions(subSectors);

              // 5. Restore sub-sector if present
              if (saved.loanSubSector) {
                const subSectorValue = saved.loanSubSector;
                const subSectorIndex = parseInt(subSectorValue.split("-")[1]);
                if (!isNaN(subSectorIndex) && subSectors[subSectorIndex]) {
                  setSelectedSubSector(subSectorValue);
                  const subSector = subSectors[subSectorIndex];
                  setApiTenure(parseFloat(subSector.sub_sector_tenure || "0"));
                  setApiInterestRate(parseFloat(subSector.sub_sector_interest_rate || "0"));

                  // 6. Fetch categories for this sub-sector
                  const subSectorId = subSectorValue.split("-")[0];
                  setIsLoadingCategories(true);
                  try {
                    const categories = await fetchLoanSubSectorCategories(subSectorId);
                    setSubSectorCategoryOptions(categories);

                    // 7. Restore category if present
                    if (saved.loanSubSectorCategory) {
                      const categoryValue = saved.loanSubSectorCategory;
                      const categoryIndex = parseInt(categoryValue.split("-")[1]);
                      if (!isNaN(categoryIndex) && categories[categoryIndex]) {
                        setSelectedSubSectorCategory(categoryValue);
                        // Categories do not affect tenure/rate; keep sub-sector values
                      }
                    }
                  } catch (err) {
                    console.error("Failed to load categories", err);
                  } finally {
                    setIsLoadingCategories(false);
                  }
                } else {
                  console.warn("Saved sub-sector not found in options");
                }
              }
            } catch (err) {
              console.error("Failed to load sub-sectors", err);
            } finally {
              setIsLoadingSubSectors(false);
            }
          } else {
            console.warn("Saved sector not found in filtered sectors");
          }
        }
      } catch (err) {
        console.error("Failed to load sectors", err);
      } finally {
        setIsLoadingSectors(false);
      }
      initializedRef.current = true;
    };

    initialize();
  }, [savedDataLoaded, loanTypeOptions]);

  // ---------- Handlers for cascading dropdowns ----------
  const handleLoanTypeChange = async (value: string) => {
    setSelectedLoanType(value);
    setSelectedSector("");
    setSelectedSubSector("");
    setSelectedSubSectorCategory("");
    setLoanSectorOptions([]);
    setLoanSubSectorOptions([]);
    setSubSectorCategoryOptions([]);
    setApiTenure(0);
    setApiInterestRate(0);

    const index = parseInt(value.split("-")[1]);
    if (isNaN(index) || !loanTypeOptions[index]) {
      console.warn("Invalid loan type selection", value);
      return;
    }

    const selectedType = loanTypeOptions[index];
    const typeCode = selectedType.loan_type_code_1;
    if (!typeCode) {
      console.warn("No loan_type_code_1 found for selected type", selectedType);
      return;
    }

    setIsLoadingSectors(true);
    try {
      const sectors = await fetchLoanSectors(typeCode);
      // Filter by allowed sectors
      const filtered = sectors.filter((sector: any) =>
        allowedLoanSectors.some(
          (allowed) =>
            allowed.toLowerCase().trim() ===
            (sector.loan_sector || "").toLowerCase().trim()
        )
      );
      setLoanSectorOptions(filtered);
    } catch (error) {
      console.error("Failed to load sectors", error);
    } finally {
      setIsLoadingSectors(false);
    }
  };

  const handleSectorChange = async (value: string) => {
    setSelectedSector(value);
    setSelectedSubSector("");
    setSelectedSubSectorCategory("");
    setLoanSubSectorOptions([]);
    setSubSectorCategoryOptions([]);
    setApiTenure(0);
    setApiInterestRate(0);

    if (!value) return;

    setIsLoadingSubSectors(true);
    try {
      const subSectors = await fetchLoanSubSectors(value);
      setLoanSubSectorOptions(subSectors);
    } catch (error) {
      console.error("Failed to load sub‑sectors", error);
    } finally {
      setIsLoadingSubSectors(false);
    }
  };

  const handleSubSectorChange = async (value: string) => {
    setSelectedSubSector(value);
    setSelectedSubSectorCategory("");
    setSubSectorCategoryOptions([]);

    const subSectorId = value.split("-")[0];
    if (!subSectorId) return;

    const index = parseInt(value.split("-")[1]);
    const subSector = loanSubSectorOptions[index];
    if (subSector) {
      setApiTenure(parseFloat(subSector.sub_sector_tenure || "0"));
      setApiInterestRate(parseFloat(subSector.sub_sector_interest_rate || "0"));
    }

    setIsLoadingCategories(true);
    try {
      const categories = await fetchLoanSubSectorCategories(subSectorId);
      setSubSectorCategoryOptions(categories);
    } catch (error) {
      console.error("Failed to load categories", error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Category selection effect
  useEffect(() => {
    if (selectedSubSectorCategory) {
      // categories do not affect tenure/rate, keep sub‑sector values
    } else if (selectedSubSector) {
      const subSectorIndex = parseInt(selectedSubSector.split("-")[1]);
      const subSector = loanSubSectorOptions[subSectorIndex];
      if (subSector) {
        setApiTenure(parseFloat(subSector.sub_sector_tenure || "0"));
        setApiInterestRate(parseFloat(subSector.sub_sector_interest_rate || "0"));
      }
    }
  }, [selectedSubSectorCategory, selectedSubSector, loanSubSectorOptions]);

  // Update selectedYears default when apiTenure changes
  useEffect(() => {
    if (apiTenure > 0) {
      setSelectedYears(Math.max(1, Math.floor(apiTenure / 12)));
    } else {
      setSelectedYears("");
    }
  }, [apiTenure]);

  // ---------- Navigation Handlers ----------
  const handlePersonalDetailsNext = (data: any) => {
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
    saveFormDataToSession(updatedFormData);
    updateStep(data.hasCoBorrower ? 2 : 3);
  };

  const handlePersonalDetailsBack = () => {
    updateStep(0);
  };

  const handleCoBorrowerDetailsNext = (data: any) => {
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
    saveFormDataToSession(updatedFormData);
    updateStep(3);
  };

  const handleCoBorrowerDetailsBack = () => {
    updateStep(1);
  };

  const handleSecurityDetailsNext = (data: any) => {
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
    saveFormDataToSession(updatedFormData);
    updateStep(4);
  };

  const handleSecurityDetailsBack = () => {
    updateStep(2);
  };

  const handleRepaymentSourceNext = (data: any) => {
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
    saveFormDataToSession(updatedFormData);
    updateStep(5);
  };

  const handleRepaymentSourceBack = () => {
    updateStep(3);
  };

  const handleConfirmationNext = (data: any) => {
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
    saveFormDataToSession(updatedFormData);
    alert("Application submitted successfully!");
  };

  const handleConfirmationBack = () => {
    updateStep(4);
  };

  // ---------- EMI Calculation ----------
  const calculateEMI = () => {
    const amount = parseFloat(totalLoanInput);
    const months = Number(selectedYears) * 12;

    if (!amount || amount <= 0 || apiInterestRate <= 0 || months <= 0) {
      return "0.00";
    }

    const P = amount;
    const r = apiInterestRate / 12 / 100;
    const n = months;

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    if (isNaN(emi) || !isFinite(emi)) {
      return "0.00";
    }

    return emi.toFixed(2);
  };

  // ---------- Utilities ----------
  const isFormValid = () => {
    return (
      selectedSector !== "" &&
      selectedLoanType !== "" &&
      selectedSubSector !== "" &&
      selectedSubSectorCategory !== "" &&
      totalLoanInput !== "" &&
      parseFloat(totalLoanInput) > 0 &&
      selectedYears !== "" &&
      Number(selectedYears) > 0 &&
      purpose.trim() !== ""
    );
  };

  const selectedSectorId = selectedSector || "";
  const loanInfo = loanInfoContent[selectedSectorId] || loanInfoContent.default;

  const maxAllowedYears = Math.max(0, Math.floor(apiTenure / 12));

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Helper functions to get display strings for document popup
  const getLoanTypeString = (value: string): string => {
    if (!value) return "";
    const index = parseInt(value.split("-")[1]);
    const option = loanTypeOptions[index];
    return option?.loan_type || "";
  };

  const getSectorString = (id: string): string => {
    if (!id) return "";
    const option = loanSectorOptions.find((opt) => opt.pk_id === parseInt(id));
    return option?.loan_sector || "";
  };

  const getSubSectorString = (value: string): string => {
    if (!value) return "";
    const index = parseInt(value.split("-")[1]);
    const option = loanSubSectorOptions[index];
    return option?.sub_sector || "";
  };

  const getCategoryString = (value: string): string => {
    if (!value) return "";
    const index = parseInt(value.split("-")[1]);
    const option = subSectorCategoryOptions[index];
    return option?.sub_cat_sector || "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 sm:pt-20 md:pt-24">
      <Header />

      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10">
        {/* Progress Steps - Desktop */}
        <div className="hidden lg:block mb-8 md:mb-12">
          <div className="flex items-center justify-between max-w-6xl mx-auto gap-2 md:gap-3">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    onClick={() => {
                      if (index <= currentStep) {
                        updateStep(index);
                      }
                    }}
                    className={`w-full h-12 md:h-14 flex items-center justify-center rounded-xl font-semibold text-xs md:text-sm transition-all duration-300 shadow-sm ${index === currentStep
                      ? "bg-[#FF9800] text-white shadow-md scale-105"
                      : index < currentStep
                        ? "bg-gray-300 text-gray-700 cursor-pointer hover:bg-gray-400"
                        : "bg-white text-gray-500 border border-gray-200 cursor-not-allowed"
                      }`}
                  >
                    {step}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Steps - Mobile Hamburger Menu */}
        <div className="lg:hidden mb-6">
          <div className="relative">
            <button
              onClick={() => setShowStepsMenu(!showStepsMenu)}
              className="w-full bg-[#FF9800] text-white px-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-between shadow-md"
            >
              <span>
                Step {currentStep + 1}: {steps[currentStep]}
              </span>
              {showStepsMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {showStepsMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                {steps.map((step, index) => (
                  <button
                    key={step}
                    onClick={() => {
                      if (index <= currentStep) {
                        updateStep(index);
                        setShowStepsMenu(false);
                      }
                    }}
                    disabled={index > currentStep}
                    className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors first:rounded-t-lg last:rounded-b-lg ${index === currentStep
                      ? "bg-[#FF9800] text-white"
                      : index < currentStep
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-white text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${index === currentStep
                          ? "bg-white text-[#FF9800]"
                          : index < currentStep
                            ? "bg-gray-300 text-gray-700"
                            : "bg-gray-200 text-gray-400"
                          }`}
                      >
                        {index + 1}
                      </span>
                      {step}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Content */}
        {currentStep === 1 ? (
          <div className="max-w-7xl mx-auto">
            <PersonalDetailsForm
              onNext={handlePersonalDetailsNext}
              onBack={handlePersonalDetailsBack}
              formData={formData}
              isFirstStep={false}
            />
          </div>
        ) : currentStep === 2 ? (
          <div className="max-w-7xl mx-auto">
            <CoBorrowerDetailsForm
              onNext={handleCoBorrowerDetailsNext}
              onBack={handleCoBorrowerDetailsBack}
              formData={formData}
            />
          </div>
        ) : currentStep === 3 ? (
          <div className="max-w-7xl mx-auto">
            <SecurityDetailsForm
              onNext={handleSecurityDetailsNext}
              onBack={handleSecurityDetailsBack}
              formData={formData}
            />
          </div>
        ) : currentStep === 4 ? (
          <div className="max-w-7xl mx-auto">
            <RepaymentSourceForm
              onNext={handleRepaymentSourceNext}
              onBack={handleRepaymentSourceBack}
              formData={formData}
            />
          </div>
        ) : currentStep === 5 ? (
          <div className="max-w-7xl mx-auto">
            <Confirmation
              onNext={handleConfirmationNext}
              onBack={handleConfirmationBack}
              formData={formData}
            />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-10 max-w-7xl mx-auto">
            {/* Left Side - Form Fields */}
            <Card className="shadow-lg sm:shadow-xl border-0 bg-white rounded-lg sm:rounded-2xl overflow-hidden">
              <CardContent className="p-4 sm:p-6 md:p-10 space-y-4 sm:space-y-6 md:space-y-8">
                <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="vehicle-type"
                      className="text-gray-800 font-semibold text-sm sm:text-base"
                    >
                      Loan Type: <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedLoanType}
                      onValueChange={handleLoanTypeChange}
                    >
                      <SelectTrigger
                        id="vehicle-type"
                        className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                      >
                        <SelectValue
                          placeholder="[Select]"
                          className="truncate"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {loanTypeOptions.length > 0 ? (
                          loanTypeOptions.map((option, index) => (
                            <SelectItem
                              key={`loantype-${index}`}
                              value={`${option.pk_id}-${index}`}
                            >
                              {option.loan_type}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="loan-sector"
                      className="text-gray-800 font-semibold text-sm sm:text-base"
                    >
                      Loan Sector <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedSector}
                      onValueChange={handleSectorChange}
                      disabled={!selectedLoanType}
                    >
                      <SelectTrigger
                        id="loan-sector"
                        className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                      >
                        <SelectValue
                          placeholder="[Select]"
                          className="truncate"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingSectors ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : loanSectorOptions.length > 0 ? (
                          loanSectorOptions.map((option) => (
                            <SelectItem
                              key={option.pk_id}
                              value={String(option.pk_id)}
                            >
                              {option.loan_sector}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-data" disabled>
                            {selectedLoanType
                              ? "No sectors available"
                              : "Select loan type first"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="loan-subsector"
                      className="text-gray-800 font-semibold text-sm sm:text-base"
                    >
                      Loan Sub-Sector <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedSubSector}
                      onValueChange={handleSubSectorChange}
                      disabled={!selectedSector}
                    >
                      <SelectTrigger
                        id="loan-subsector"
                        className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                      >
                        <SelectValue
                          placeholder="[Select]"
                          className="truncate"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingSubSectors ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : loanSubSectorOptions.length > 0 ? (
                          loanSubSectorOptions.map((option, index) => (
                            <SelectItem
                              key={`subsector-${index}`}
                              value={`${option.pk_id}-${index}`}
                            >
                              {option.sub_sector}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-data" disabled>
                            {selectedSector
                              ? "No sub‑sectors available"
                              : "Select sector first"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="sub-sector-category"
                      className="text-gray-800 font-semibold text-sm sm:text-base"
                    >
                      Loan Sub-Sector Category{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedSubSectorCategory}
                      onValueChange={setSelectedSubSectorCategory}
                      disabled={!selectedSubSector}
                    >
                      <SelectTrigger
                        id="sub-sector-category"
                        className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                      >
                        <SelectValue
                          placeholder="[Select]"
                          className="truncate"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingCategories ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : subSectorCategoryOptions.length > 0 ? (
                          subSectorCategoryOptions.map((option, index) => (
                            <SelectItem
                              key={`category-${index}`}
                              value={`${option.pk_id}-${index}`}
                            >
                              {option.sub_cat_sector}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-data" disabled>
                            {selectedSubSector
                              ? "No categories available"
                              : "Select sub‑sector first"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Loan Info Box */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-2xl space-y-3 sm:space-y-5 border border-blue-200 shadow-sm mt-4 sm:mt-6 md:mt-8">
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                      {loanInfo.title}
                    </h3>
                    <p className="text-xs sm:text-sm italic text-gray-700 font-medium">
                      {loanInfo.tagline}
                    </p>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                      {loanInfo.highlightTitle}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      {loanInfo.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-5 pt-3 sm:pt-4">
                    <div className="bg-gradient-to-br from-[#FF9800] to-[#FF6F00] text-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                      <div className="flex items-center gap-1.5 sm:gap-2.5 mb-2 sm:mb-3">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-xs sm:text-sm font-semibold">
                          Max Loan Tenure
                        </span>
                      </div>
                      <p className="text-xl sm:text-3xl md:text-4xl font-bold">
                        {apiTenure > 0
                          ? `${Math.round(apiTenure / 12)} Years`
                          : "0 Years"}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-[#FF9800] to-[#FF6F00] text-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                      <div className="flex items-center gap-1.5 sm:gap-2.5 mb-2 sm:mb-3">
                        <Percent className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-xs sm:text-sm font-semibold">
                          Interest Rate
                        </span>
                      </div>
                      <p className="text-xl sm:text-3xl md:text-4xl font-bold">
                        {apiInterestRate > 0 ? `${apiInterestRate}%` : "0%"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Side - EMI Calculator */}
            <Card className="shadow-lg sm:shadow-xl border-0 bg-white rounded-lg sm:rounded-2xl overflow-hidden">
              <CardContent className="p-4 sm:p-6 md:p-10 space-y-4 sm:space-y-6 md:space-y-8">
                <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="total-loan"
                      className="text-gray-800 font-semibold text-sm sm:text-base"
                    >
                      Total Loan Required (Nu.){" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="total-loan"
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter Total Loan Amount"
                      value={totalLoanInput}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        const withoutCommas = rawValue.replace(/,/g, "");
                        if (withoutCommas === "") {
                          setErrors((prev) => ({
                            ...prev,
                            totalLoan: "Total loan amount is required",
                          }));
                          setTotalLoanInput("");
                          return;
                        }
                        if (!/^\d+$/.test(withoutCommas)) {
                          setErrors((prev) => ({
                            ...prev,
                            totalLoan:
                              "Only whole numbers are allowed. No letters or decimals.",
                          }));
                        } else {
                          setErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.totalLoan;
                            return updated;
                          });
                        }
                        const digitsOnly = withoutCommas.replace(/\D/g, "");
                        setTotalLoanInput(digitsOnly);
                      }}
                      className={`h-10 sm:h-12 border text-sm sm:text-base
                        ${errors.totalLoan
                          ? "!border-red-500 focus:!ring-red-500 focus:!border-red-500"
                          : "border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        }`}
                    />
                    {errors.totalLoan && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.totalLoan}
                      </p>
                    )}
                  </div>

                  {/* Dynamic User Tenure Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-800 font-semibold text-sm sm:text-base">
                        Loan Tenure (Years){" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={String(selectedYears)}
                        onValueChange={(val) => setSelectedYears(Number(val))}
                        disabled={maxAllowedYears < 1}
                      >
                        <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="Select Years" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(
                            { length: maxAllowedYears },
                            (_, i) => i + 1,
                          ).map((year) => (
                            <SelectItem key={year} value={String(year)}>
                              {year} {year === 1 ? "Year" : "Years"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-800 font-semibold text-sm sm:text-base">
                        Loan Tenure (Months)
                      </Label>
                      <Input
                        type="text"
                        readOnly
                        className="h-10 sm:h-12 border-gray-300 bg-gray-100 text-gray-600 focus-visible:ring-0"
                        value={selectedYears ? Number(selectedYears) * 12 : ""}
                        placeholder="Months"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="purpose"
                      className="text-gray-800 font-semibold text-sm sm:text-base"
                    >
                      Purpose <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="purpose"
                      placeholder="Write your purpose"
                      rows={4}
                      className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] resize-none text-sm sm:text-base"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    />
                  </div>
                </div>

                {/* EMI Display */}
                {parseFloat(totalLoanInput) > 0 &&
                  apiInterestRate > 0 &&
                  selectedYears !== "" &&
                  Number(selectedYears) > 0 && (
                    <div className="border-t border-gray-200 pt-4 sm:pt-6 md:pt-8 mt-4 sm:mt-6 md:mt-8">
                      <div className="bg-gradient-to-br from-[#FF9800] to-[#FF6F00] p-6 sm:p-8 md:p-12 rounded-xl sm:rounded-2xl text-center shadow-xl sm:shadow-2xl transform hover:scale-105 transition-transform duration-300">
                        <p className="text-sm sm:text-base md:text-lg text-white/95 mb-3 sm:mb-4 font-semibold tracking-wide">
                          Your Monthly EMI
                        </p>
                        <p className="text-3xl sm:text-5xl md:text-7xl font-bold text-white drop-shadow-lg break-all">
                          Nu. {calculateEMI()}
                        </p>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons (only for step 0) */}
        {currentStep !== 1 &&
          currentStep !== 2 &&
          currentStep !== 3 &&
          currentStep !== 4 &&
          currentStep !== 5 && (
            <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8 md:mt-12 mb-4 sm:mb-6">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => updateStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </Button>
              <Button
                size="lg"
                className="bg-[#003DA5] hover:bg-[#002D7A] text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setShowDocumentPopup(true)}
                disabled={!isFormValid()}
              >
                Next
              </Button>
            </div>
          )}
      </div>

      <DocumentPopup
        open={showDocumentPopup}
        onOpenChange={setShowDocumentPopup}
        onProceed={() => {
          const loanTypeString = getLoanTypeString(selectedLoanType);
          const loanSectorString = getSectorString(selectedSector);
          const loanSubSectorString = getSubSectorString(selectedSubSector);
          const loanSubSectorCategoryString = getCategoryString(selectedSubSectorCategory);

          const loanDetails = {
            loanType: selectedLoanType,
            loanTypeString,
            loanSector: selectedSector,
            loanSectorString,
            loanSubSector: selectedSubSector,
            loanSubSectorString,
            loanSubSectorCategory: selectedSubSectorCategory,
            loanSubSectorCategoryString,
            loanAmount: totalLoanInput,
            loanPurpose: purpose,
            maxApiTenureMonths: apiTenure,
            selectedYears: selectedYears,
            selectedMonths: Number(selectedYears) * 12,
            interestRate: apiInterestRate,
          };

          const updatedFormData = { ...formData, ...loanDetails };
          setFormData(updatedFormData);
          saveFormDataToSession(updatedFormData);
          updateStep(1);
        }}
      />
    </div>
  );
}

export default function LoanApplicationPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoanApplicationContent />
    </Suspense>
  );
}