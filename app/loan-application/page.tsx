"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { Slider } from "@/components/ui/slider";
import { Percent, Calendar, Menu, X } from "lucide-react";
import DocumentPopup from "@/components/DocumentPopup";
import { PersonalDetailsForm } from "@/components/individual/PersonalDetail";
import { CoBorrowerDetailsForm } from "@/components/individual/CoBorrowerDetail";
import { SecurityDetailsForm } from "@/components/individual/SecurityDetail";
import { RepaymentSourceForm } from "@/components/individual/RepaymentSource";
import { Confirmation } from "@/components/confirmation";
import { fetchLoanData } from "@/services/api";
import { loanInfoContent } from "@/components/text";

const steps = [
  "Loan Details",
  "Personal Details",
  "Co-Borrower Details",
  "Security Details",
  "Repayment Source",
  "Confirmation",
];

const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-lg">Loading...</p>
    </div>
  );
};

function LoanApplicationContent() {
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const [currentStep, setCurrentStep] = useState(
    stepParam ? parseInt(stepParam) : 0,
  );
  const [loanAmount, setLoanAmount] = useState([500000]);
  const [interestRate, setInterestRate] = useState([8.0]);
  const [tenure, setTenure] = useState([12]);
  const [totalLoanInput, setTotalLoanInput] = useState("");
  const [showDocumentPopup, setShowDocumentPopup] = useState(false);
  const [showStepsMenu, setShowStepsMenu] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [loanSectorOptions, setLoanSectorOptions] = useState<any[]>([]);
  const [loanSubSectorOptions, setLoanSubSectorOptions] = useState<any[]>([]);
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedSubSector, setSelectedSubSector] = useState("");
  const [loanTypeOptions, setLoanTypeOptions] = useState<any[]>([]);
  const [selectedLoanType, setSelectedLoanType] = useState("");
  const [subSectorCategoryOptions, setSubSectorCategoryOptions] = useState<
    any[]
  >([]);
  const [selectedSubSectorCategory, setSelectedSubSectorCategory] =
    useState("");
  const [apiTenure, setApiTenure] = useState<number>(0);
  const [apiInterestRate, setApiInterestRate] = useState<number>(0);

  // Allowed loan sectors as per requirement
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

  useEffect(() => {
    // Load loan data from API
    const loadLoanData = async () => {
      try {
        const result = await fetchLoanData();
        // Handle nested response: result.data.data.loanSector
        const data = result?.data?.data || result?.data || result;
        if (data && data.loanSector && Array.isArray(data.loanSector)) {
          // Filter loan sectors to only include allowed ones
          const filteredSectors = data.loanSector.filter((sector: any) =>
            allowedLoanSectors.includes(sector.loan_sector),
          );
          setLoanSectorOptions(filteredSectors);
        }
        if (data && data.loanType && Array.isArray(data.loanType)) {
          setLoanTypeOptions(data.loanType);
        }
      } catch (error) {
        // Failed to load loan data
      }
    };
    loadLoanData();
  }, []);

  // Filter sub-sectors when sector is selected
  useEffect(() => {
    if (selectedSector) {
      const sector = loanSectorOptions.find(
        (s) => s.loan_sector_id === parseInt(selectedSector),
      );
      if (
        sector &&
        sector.loanSubSector &&
        Array.isArray(sector.loanSubSector)
      ) {
        setLoanSubSectorOptions(sector.loanSubSector);
      } else {
        setLoanSubSectorOptions([]);
      }
      setSelectedSubSector("");
      setSelectedSubSectorCategory("");
      setApiTenure(0);
      setApiInterestRate(0);
    } else {
      setLoanSubSectorOptions([]);
      setSelectedSubSector("");
      setSelectedSubSectorCategory("");
      setApiTenure(0);
      setApiInterestRate(0);
    }
  }, [selectedSector, loanSectorOptions]);

  // Filter sub-sector categories when sub-sector is selected
  useEffect(() => {
    if (selectedSubSector) {
      const subSectorIndex = parseInt(selectedSubSector.split("-")[1]);
      const subSector = loanSubSectorOptions[subSectorIndex];

      if (
        subSector &&
        subSector.loanSubSectorCategory &&
        Array.isArray(subSector.loanSubSectorCategory)
      ) {
        setSubSectorCategoryOptions(subSector.loanSubSectorCategory);
      } else {
        setSubSectorCategoryOptions([]);
      }

      // Extract interest rate and loan tenure from the selected sub-sector
      if (subSector) {
        const tenure = parseFloat(subSector.loan_tenure || "0");
        const rate = parseFloat(subSector.interest_rate || "0");
        setApiTenure(tenure);
        setApiInterestRate(rate);
      }

      setSelectedSubSectorCategory("");
    } else {
      setSubSectorCategoryOptions([]);
      setSelectedSubSectorCategory("");
      // Reset to 0 when no sub-sector is selected
      setApiTenure(0);
      setApiInterestRate(0);
    }
  }, [selectedSubSector, loanSubSectorOptions]);

  const handlePersonalDetailsNext = (data: any) => {
    setFormData({ ...formData, ...data });
    // If hasCoBorrower is true, go to Co-Borrower Details (step 2)
    // If hasCoBorrower is false, skip to Security Details (step 3)
    setCurrentStep(data.hasCoBorrower ? 2 : 3);
  };

  const handlePersonalDetailsBack = () => {
    setCurrentStep(0); // Go back to Loan Details step
  };

  const handleCoBorrowerDetailsNext = (data: any) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(3); // Move to Security Details step
  };

  const handleCoBorrowerDetailsBack = () => {
    setCurrentStep(1); // Go back to Personal Details step
  };

  const handleSecurityDetailsNext = (data: any) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(4); // Move to Repayment Source step
  };

  const handleSecurityDetailsBack = () => {
    setCurrentStep(2); // Go back to Co-Borrower Details step
  };

  const handleRepaymentSourceNext = (data: any) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(5); // Move to Confirmation step
  };

  const handleRepaymentSourceBack = () => {
    setCurrentStep(3); // Go back to Security Details step
  };

  const handleConfirmationNext = (data: any) => {
    setFormData({ ...formData, ...data });
    // Handle final submission here (e.g., API call)
    alert("Application submitted successfully!");
  };

  const handleConfirmationBack = () => {
    setCurrentStep(4); // Go back to Repayment Source step
  };

  const calculateEMI = () => {
    // Return 0 if no loan amount is entered
    if (
      !totalLoanInput ||
      totalLoanInput === "" ||
      parseFloat(totalLoanInput) <= 0
    ) {
      return "0.00";
    }

    const P = parseFloat(totalLoanInput);
    const r =
      (apiInterestRate > 0 ? apiInterestRate : interestRate[0]) / 12 / 100; // Monthly interest rate
    const n = apiTenure > 0 ? apiTenure : tenure[0]; // Loan tenure in months

    // If interest rate is 0, simply divide principal by tenure
    if (r === 0) {
      return (P / n).toFixed(2);
    }

    // EMI Formula: P × r × (1 + r)^n / ((1 + r)^n - 1)
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    // Check for valid number
    if (isNaN(emi) || !isFinite(emi)) {
      return "0.00";
    }

    return emi.toFixed(2);
  };

  const isFormValid = () => {
    return (
      selectedSector !== "" &&
      selectedLoanType !== "" &&
      selectedSubSector !== "" &&
      selectedSubSectorCategory !== "" &&
      totalLoanInput !== "" &&
      parseFloat(totalLoanInput) > 0
    );
  };

  const selectedSectorId = selectedSector || "";
  // Prefer sector-specific copy; fall back to default when no sector match is found
  const loanInfo = loanInfoContent[selectedSectorId] || loanInfoContent.default;

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
                    className={`w-full h-12 md:h-14 flex items-center justify-center rounded-xl font-semibold text-xs md:text-sm transition-all duration-300 shadow-sm ${
                      index === currentStep
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
                      setShowStepsMenu(false);
                    }}
                    disabled={index > currentStep}
                    className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      index === currentStep
                        ? "bg-[#FF9800] text-white"
                        : index < currentStep
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-white text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          index === currentStep
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
                      onValueChange={(value) => {
                        setSelectedLoanType(value);
                      }}
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
                      onValueChange={(value) => {
                        setSelectedSector(value);
                      }}
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
                        {loanSectorOptions.length > 0 ? (
                          loanSectorOptions.map((option, index) => (
                            <SelectItem
                              key={option.loan_sector_id || index}
                              value={String(option.loan_sector_id)}
                            >
                              {option.loan_sector}
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
                      htmlFor="loan-subsector"
                      className="text-gray-800 font-semibold text-sm sm:text-base"
                    >
                      Loan Sub-Sector <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedSubSector}
                      onValueChange={setSelectedSubSector}
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
                        {loanSubSectorOptions.length > 0 ? (
                          loanSubSectorOptions.map((option, index) => (
                            <SelectItem
                              key={`subsector-${index}`}
                              value={`${option.sub_sector_id}-${index}`}
                            >
                              {option.sub_sector}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>
                            {selectedSector
                              ? "No sub-sectors available"
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
                        {subSectorCategoryOptions.length > 0 ? (
                          subSectorCategoryOptions.map((option, index) => (
                            <SelectItem
                              key={`category-${index}`}
                              value={`${option.sub_sector_cat_id}-${index}`}
                            >
                              {option.sub_cat_sector}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>
                            {selectedSubSector
                              ? "No categories available"
                              : "Select sub-sector first"}
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
                          Loan Tenure
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
                      type="number"
                      placeholder="Enter Total Loan Amount"
                      className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
                      value={totalLoanInput}
                      onChange={(e) => setTotalLoanInput(e.target.value)}
                    />
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
                    />
                  </div>
                </div>

                {/* EMI Display */}
                {selectedLoanType && selectedLoanType.split("-")[0] === "1" && (
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

        {/* Navigation Buttons */}
        {currentStep !== 1 &&
          currentStep !== 2 &&
          currentStep !== 3 &&
          currentStep !== 4 && (
            <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8 md:mt-12 mb-4 sm:mb-6">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
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
        onProceed={() => setCurrentStep(1)}
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
