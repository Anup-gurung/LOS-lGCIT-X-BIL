"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // <-- ADDED useRouter
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
import DocumentPopupBusiness from "@/components/DocumentPopupBusiness";

// Actual step components
import { BusinessRepaymentSourceForm } from "@/components/business/BusinessRepaymentSource";
import { BusinessDetailsForm } from "@/components/business/BusinessDetails";
import { BusinessConfirmation } from "@/components/BusinessConfirmation";
import { SecurityDetailBusiness } from "@/components/business/SecurityDetailBusiness";

// Updated API imports
import {
  fetchLoanTypes,
  fetchLoanSectors,
  fetchLoanSubSectors,
  fetchLoanSubSectorCategories,
} from "@/services/api";
import { loanInfoContent } from "@/components/text";

const businessSteps = [
  "Loan Details",
  "Business Details",
  "Security Details",
  "Repayment Source",
  "Confirmation",
];

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <p className="text-gray-500 text-lg">Loading...</p>
  </div>
);

function BusinessLoanApplicationContent() {
  const searchParams = useSearchParams();
  const router = useRouter(); // <-- ADDED router instance
  const stepParam = searchParams.get("step");
  const [currentStep, setCurrentStep] = useState(
    stepParam ? parseInt(stepParam) : 0,
  );

  // Helper to update step and URL
  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    router.push(`?step=${newStep}`, { scroll: false });
  };

  // Allowed loan sectors as per requirement
  const ALLOWED_SECTORS = [
    "Forestry and Logging",
    "Mining and Quarrying",
    "Production & Manufacturing",
    "Trade and Commerce",
    "Hotel and Tourism Sector",
    "Loans to Contractors",
    "Loans to Government",
    "Loans to Financial Service Providers",
    "Loan Against Term Deposits",
    "Loans for Shares and Securities",
    "Agriculture and Livestock",
    "Service Sector",
    "Transport Loans",
    "Housing Sector",
  ];

  // ---------- Loading states for each dropdown ----------
  const [isLoadingSectors, setIsLoadingSectors] = useState(false);
  const [isLoadingSubSectors, setIsLoadingSubSectors] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // ---------- Slider states (kept for consistency, not used in EMI now) ----------
  const [loanAmount, setLoanAmount] = useState([500000]);
  const [interestRate, setInterestRate] = useState([8.0]);
  const [tenure, setTenure] = useState([12]);

  // ---------- Loan Details State ----------
  const [totalLoanInput, setTotalLoanInput] = useState("");
  const [loanPurpose, setLoanPurpose] = useState("");
  const [showStepsMenu, setShowStepsMenu] = useState(false);
  const [showDocumentPopup, setShowDocumentPopup] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Dropdown options
  const [loanSectorOptions, setLoanSectorOptions] = useState<any[]>([]);
  const [loanSubSectorOptions, setLoanSubSectorOptions] = useState<any[]>([]);
  const [loanTypeOptions, setLoanTypeOptions] = useState<any[]>([]);
  const [subSectorCategoryOptions, setSubSectorCategoryOptions] = useState<any[]>([]);

  // Selected values
  const [selectedLoanType, setSelectedLoanType] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedSubSector, setSelectedSubSector] = useState("");
  const [selectedSubSectorCategory, setSelectedSubSectorCategory] = useState("");

  // Derived values from selected sub‑sector / category
  const [apiTenure, setApiTenure] = useState<number>(0);
  const [apiInterestRate, setApiInterestRate] = useState<number>(0);

  // User input tenure values based on api limit
  const [selectedYears, setSelectedYears] = useState<number | "">("");

  // ---------- Session data for pre‑filling ----------
  const [sessionData, setSessionData] = useState<any>(null);
  const hasSetYearsRef = useRef(false);

  // ---------- Load session data on mount ----------
  useEffect(() => {
    const saved = sessionStorage.getItem("businessLoanApplicationData");
    if (saved) {
      try {
        setSessionData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse session data", e);
      }
    }
  }, []);

  // ---------- Pre‑fill loan type from session once options are loaded ----------
  useEffect(() => {
    if (!sessionData) return;
    if (selectedLoanType) return; // already set
    if (loanTypeOptions.length === 0) return;
    const loanTypeString = sessionData.loanTypeString;
    if (!loanTypeString) return;
    const index = loanTypeOptions.findIndex(opt => opt.loan_type === loanTypeString);
    if (index !== -1) {
      setSelectedLoanType(`${loanTypeOptions[index].pk_id}-${index}`);
    }
  }, [sessionData, loanTypeOptions, selectedLoanType]);

  // ---------- Pre‑fill sector from session once sectors are loaded ----------
  useEffect(() => {
    if (!sessionData) return;
    if (!selectedLoanType) return; // need loan type first
    if (selectedSector) return;
    if (loanSectorOptions.length === 0) return;
    const sectorString = sessionData.loanSectorString;
    if (!sectorString) return;
    const option = loanSectorOptions.find(opt => opt.loan_sector === sectorString);
    if (option) {
      setSelectedSector(String(option.pk_id));
    }
  }, [sessionData, selectedLoanType, selectedSector, loanSectorOptions]);

  // ---------- Pre‑fill sub‑sector from session once sub‑sectors are loaded ----------
  useEffect(() => {
    if (!sessionData) return;
    if (!selectedSector) return;
    if (selectedSubSector) return;
    if (loanSubSectorOptions.length === 0) return;
    const subSectorString = sessionData.loanSubSectorString;
    if (!subSectorString) return;
    const index = loanSubSectorOptions.findIndex(opt => opt.sub_sector === subSectorString);
    if (index !== -1) {
      setSelectedSubSector(`${loanSubSectorOptions[index].pk_id}-${index}`);
    }
  }, [sessionData, selectedSector, selectedSubSector, loanSubSectorOptions]);

  // ---------- Pre‑fill category from session once categories are loaded ----------
  useEffect(() => {
    if (!sessionData) return;
    if (!selectedSubSector) return;
    if (selectedSubSectorCategory) return;
    if (subSectorCategoryOptions.length === 0) return;
    const categoryString = sessionData.loanSubSectorCategoryString;
    if (!categoryString) return;
    const index = subSectorCategoryOptions.findIndex(opt => opt.sub_cat_sector === categoryString);
    if (index !== -1) {
      setSelectedSubSectorCategory(`${subSectorCategoryOptions[index].pk_id}-${index}`);
    }
  }, [sessionData, selectedSubSector, selectedSubSectorCategory, subSectorCategoryOptions]);

  // ---------- Pre‑fill loan amount and purpose ----------
  useEffect(() => {
    if (!sessionData) return;
    if (sessionData.loanAmount) {
      setTotalLoanInput(sessionData.loanAmount);
    }
    if (sessionData.loanPurpose) {
      setLoanPurpose(sessionData.loanPurpose);
    }
  }, [sessionData]);

  // ---------- Pre‑fill selected years after apiTenure is available ----------
  useEffect(() => {
    if (!sessionData) return;
    if (hasSetYearsRef.current) return;
    if (apiTenure === 0) return; // not ready
    const years = sessionData.selectedYears;
    if (years && years > 0 && years <= Math.floor(apiTenure / 12)) {
      setSelectedYears(years);
      hasSetYearsRef.current = true;
    }
  }, [sessionData, apiTenure]);

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

    // Extract index from value (format: "pk_id-index")
    const index = parseInt(value.split("-")[1]);
    if (isNaN(index) || !loanTypeOptions[index]) {
      console.warn("Invalid loan type selection", value);
      return;
    }

    const selectedType = loanTypeOptions[index];
    // The API expects the loan_type_code_1 (e.g., "005")
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
        ALLOWED_SECTORS.some(
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
      const subSectors = await fetchLoanSubSectors(value); // value is sector pk_id
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

    const subSectorId = value.split("-")[0]; // pk_id
    if (!subSectorId) return;

    // Extract index to get the selected sub‑sector object
    const index = parseInt(value.split("-")[1]);
    const subSector = loanSubSectorOptions[index];
    if (subSector) {
      // Use correct field names from API
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

  // ---------- Category selection effect (updates tenure/rate) ----------
  useEffect(() => {
    if (selectedSubSectorCategory) {
      // Categories do not have tenure/rate; keep sub‑sector values.
      // If you need to override, you would handle it here.
    } else {
      // Fallback to sub‑sector values when category is cleared
      if (selectedSubSector) {
        const subSectorIndex = parseInt(selectedSubSector.split("-")[1]);
        const subSector = loanSubSectorOptions[subSectorIndex];
        if (subSector) {
          setApiTenure(parseFloat(subSector.sub_sector_tenure || "0"));
          setApiInterestRate(parseFloat(subSector.sub_sector_interest_rate || "0"));
        }
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

  // ---------- Helper to save data to sessionStorage ----------
  const saveToSession = (data: any) => {
    const existing = sessionStorage.getItem("businessLoanApplicationData");
    const parsed = existing ? JSON.parse(existing) : {};
    const merged = { ...parsed, ...data };
    sessionStorage.setItem("businessLoanApplicationData", JSON.stringify(merged));
  };

  // ---------- Helper functions to get string values from IDs ----------
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

  // ---------- Navigation Handlers ----------
  const handleLoanDetailsNext = () => {
    if (!isFormValid()) return;
    setShowDocumentPopup(true);
  };

  const handleBusinessDetailsNext = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
    saveToSession(data);
    updateStep(2); // <-- CHANGED
  };

  const handleSecurityNext = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
    saveToSession(data);
    updateStep(3); // <-- CHANGED
  };

  const handleRepaymentSourceNext = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
    saveToSession(data);
    updateStep(4); // <-- CHANGED
  };

  const handleConfirmationNext = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
    saveToSession(data);
    alert("Business Loan Application submitted successfully!");
  };

  // ---------- EMI Calculation ----------
  const calculateEMI = () => {
    const amount = parseFloat(totalLoanInput);
    const months = Number(selectedYears) * 12;

    if (!amount || amount <= 0 || apiInterestRate <= 0 || months <= 0) {
      return "0.00";
    }

    const P = amount;
    const r = apiInterestRate / 12 / 100; // Monthly interest rate
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
      selectedLoanType !== "" &&
      selectedSector !== "" &&
      selectedSubSector !== "" &&
      selectedSubSectorCategory !== "" &&
      totalLoanInput !== "" &&
      parseFloat(totalLoanInput) > 0 &&
      selectedYears !== "" &&
      Number(selectedYears) > 0
    );
  };

  const selectedSectorId = selectedSector || "";
  const loanInfo = loanInfoContent[selectedSectorId] || loanInfoContent.default;

  const maxAllowedYears = Math.max(0, Math.floor(apiTenure / 12));

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 sm:pt-20 md:pt-24">
      <Header />

      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10">
        {/* Progress Steps - Desktop (unchanged) */}
        <div className="hidden lg:block mb-8 md:mb-12">
          <div className="flex items-center justify-between max-w-6xl mx-auto gap-2 md:gap-3">
            {businessSteps.map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-full h-12 md:h-14 flex items-center justify-center rounded-xl font-semibold text-xs md:text-sm transition-all duration-300 shadow-sm ${index === currentStep
                      ? "bg-[#FF9800] text-white shadow-md scale-105"
                      : index < currentStep
                        ? "bg-gray-300 text-gray-700"
                        : "bg-white text-gray-500 border border-gray-200"
                      }`}
                  >
                    {step}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Steps - Mobile (unchanged) */}
        <div className="lg:hidden mb-6">
          <div className="relative">
            <button
              onClick={() => setShowStepsMenu(!showStepsMenu)}
              className="w-full bg-[#FF9800] text-white px-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-between shadow-md"
            >
              <span>
                Step {currentStep + 1}: {businessSteps[currentStep]}
              </span>
              {showStepsMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {showStepsMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                {businessSteps.map((step, index) => (
                  <button
                    key={step}
                    onClick={() => setShowStepsMenu(false)}
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

        {/* ---------- Step 0 : Loan Details ---------- */}
        {currentStep === 0 && (
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-10 max-w-7xl mx-auto">
            {/* Left Column – Dropdowns & Loan Info */}
            <Card className="shadow-lg sm:shadow-xl border-0 bg-white rounded-lg sm:rounded-2xl overflow-hidden">
              <CardContent className="p-4 sm:p-6 md:p-10 space-y-4 sm:space-y-6 md:space-y-8">
                {/* Loan Type */}
                <div className="space-y-2">
                  <Label className="text-gray-800 font-semibold text-sm sm:text-base">
                    Loan Type: <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedLoanType}
                    onValueChange={handleLoanTypeChange}
                  >
                    <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
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

                {/* Loan Sector */}
                <div className="space-y-2">
                  <Label className="text-gray-800 font-semibold text-sm sm:text-base">
                    Loan Sector <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedSector}
                    onValueChange={handleSectorChange}
                    disabled={!selectedLoanType}
                  >
                    <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
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

                {/* Loan Sub‑Sector */}
                <div className="space-y-2">
                  <Label className="text-gray-800 font-semibold text-sm sm:text-base">
                    Loan Sub-Sector <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedSubSector}
                    onValueChange={handleSubSectorChange}
                    disabled={!selectedSector}
                  >
                    <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
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

                {/* Loan Sub‑Sector Category */}
                <div className="space-y-2">
                  <Label className="text-gray-800 font-semibold text-sm sm:text-base">
                    Loan Sub-Sector Category{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedSubSectorCategory}
                    onValueChange={setSelectedSubSectorCategory}
                    disabled={!selectedSubSector}
                  >
                    <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
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

                {/* Loan Info Box – Sector‑specific content (unchanged) */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-2xl space-y-3 sm:space-y-5 border border-blue-200 shadow-sm mt-4">
                  <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                      {loanInfo.title}
                    </h3>
                    <p className="text-xs sm:text-sm italic text-gray-700 font-medium">
                      {loanInfo.tagline}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                      {loanInfo.highlightTitle}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      {loanInfo.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-5 pt-3">
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

            {/* Right Column – Loan Amount, Purpose, and EMI (unchanged) */}
            <Card className="shadow-lg sm:shadow-xl border-0 bg-white rounded-lg sm:rounded-2xl overflow-hidden">
              <CardContent className="p-4 sm:p-6 md:p-10 space-y-4 sm:space-y-6 md:space-y-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-800 font-semibold text-sm sm:text-base">
                      Total Loan Required (Nu.){" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="Enter Total Loan Amount"
                      className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      value={totalLoanInput}
                      onChange={(e) => setTotalLoanInput(e.target.value)}
                    />
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
                    <Label className="text-gray-800 font-semibold text-sm sm:text-base">
                      Purpose
                    </Label>
                    <Textarea
                      placeholder="Write your purpose (optional)"
                      rows={4}
                      className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] resize-none"
                      value={loanPurpose}
                      onChange={(e) => setLoanPurpose(e.target.value)}
                    />
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
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ---------- Other Steps ---------- */}
        {currentStep === 1 && (
          <div className="max-w-7xl mx-auto">
            <BusinessDetailsForm
              onNext={handleBusinessDetailsNext}
              onBack={() => updateStep(0)} // <-- CHANGED
              formData={formData}
            />
          </div>
        )}
        {currentStep === 2 && (
          <div className="max-w-7xl mx-auto">
            <SecurityDetailBusiness
              onNext={handleSecurityNext}
              onBack={() => updateStep(1)} // <-- CHANGED
              formData={formData}
            />
          </div>
        )}
        {currentStep === 3 && (
          <div className="max-w-7xl mx-auto">
            <BusinessRepaymentSourceForm
              onNext={handleRepaymentSourceNext}
              onBack={() => updateStep(2)} // <-- CHANGED
              formData={formData}
            />
          </div>
        )}
        {currentStep === 4 && (
          <div className="max-w-7xl mx-auto">
            <BusinessConfirmation
              onNext={handleConfirmationNext}
              onBack={() => updateStep(3)} // <-- CHANGED
              formData={formData}
            />
          </div>
        )}

        {/* ---------- Global Navigation Buttons (only for step 0) ---------- */}
        {currentStep !== 1 &&
          currentStep !== 2 &&
          currentStep !== 3 &&
          currentStep !== 4 && (
            <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8 md:mt-12 mb-4 sm:mb-6">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => updateStep(Math.max(0, currentStep - 1))} // <-- CHANGED
                disabled={currentStep === 0}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </Button>
              <Button
                size="lg"
                className="bg-[#003DA5] hover:bg-[#002D7A] text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleLoanDetailsNext}
                disabled={!isFormValid()}
              >
                Next
              </Button>
            </div>
          )}
      </div>

      {/* Document Popup – Now only string values are stored */}
      <DocumentPopupBusiness
        open={showDocumentPopup}
        onOpenChange={setShowDocumentPopup}
        onProceed={() => {
          const loanTypeString = getLoanTypeString(selectedLoanType);
          const loanSectorString = getSectorString(selectedSector);
          const loanSubSectorString = getSubSectorString(selectedSubSector);
          const loanSubSectorCategoryString = getCategoryString(
            selectedSubSectorCategory,
          );

          // Store only the human‑readable values (strings) and numbers.
          // ID fields (selectedLoanType, selectedSector, etc.) are NOT saved.
          const loanDetails = {
            loanTypeString,
            loanSectorString,
            loanSubSectorString,
            loanSubSectorCategoryString,
            loanAmount: totalLoanInput,
            loanPurpose,
            maxApiTenureMonths: apiTenure,
            selectedYears: selectedYears,
            selectedMonths: Number(selectedYears) * 12,
            interestRate: apiInterestRate,
          };

          setFormData((prev: any) => ({ ...prev, ...loanDetails }));
          saveToSession(loanDetails);
          setShowDocumentPopup(false);
          updateStep(1); // <-- CHANGED
        }}
      />
    </div>
  );
}

export default function BusinessLoanApplicationPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BusinessLoanApplicationContent />
    </Suspense>
  );
}