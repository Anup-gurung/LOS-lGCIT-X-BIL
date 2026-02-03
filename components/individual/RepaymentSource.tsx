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
import {
  fetchNationality,
  fetchIdentificationType,
  fetchCountry,
  fetchDzongkhag,
  fetchGewogsByDzongkhag,
  fetchMaritalStatus,
} from "@/services/api";

// Import mapping utility and Popup (Adjust paths based on your project structure)
import { mapCustomerDataToForm } from "@/lib/mapCustomerData";
import DocumentPopup from "@/components/BILSearchStatus";

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

export function RepaymentSourceForm({
  onNext,
  onBack,
  formData,
}: RepaymentSourceFormProps) {
  // Separate Income Data from Guarantor Data
  const [incomeData, setIncomeData] = useState(formData?.incomeDetails || {});

  // Initialize guarantors array
  const [guarantors, setGuarantors] = useState<any[]>(
    formData?.guarantors && formData.guarantors.length > 0
      ? formData.guarantors
      : [{}],
  );

  // Dropdown Options
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<
    any[]
  >([]);
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([]);

  // Store gewog options keyed by "guarantorIndex-type" (e.g. "0-perm", "1-curr")
  const [dynamicGewogOptions, setDynamicGewogOptions] = useState<
    Record<string, any[]>
  >({});

  // --- Lookup States ---
  const [showLookupPopup, setShowLookupPopup] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<
    "searching" | "found" | "not_found"
  >("searching");
  const [fetchedCustomerData, setFetchedCustomerData] = useState<any>(null);
  const [activeGuarantorIndex, setActiveGuarantorIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [
          nationality,
          identificationType,
          country,
          dzongkhag,
          maritalStatus,
        ] = await Promise.all([
          fetchNationality().catch(() => []),
          fetchIdentificationType().catch(() => []),
          fetchCountry().catch(() => []),
          fetchDzongkhag().catch(() => []),
          fetchMaritalStatus().catch(() => []),
        ]);

        setNationalityOptions(nationality);
        setIdentificationTypeOptions(identificationType);
        setCountryOptions(country);
        setDzongkhagOptions(dzongkhag);
        setMaritalStatusOptions(maritalStatus);
      } catch (error) {
        console.error("Failed to load dropdown data:", error);
      }
    };

    loadAllData();
  }, []);

  // Sync with formData when it changes
  useEffect(() => {
    if (formData) {
      if (formData.incomeDetails) setIncomeData(formData.incomeDetails);
      if (formData.guarantors && Array.isArray(formData.guarantors)) {
        setGuarantors(formData.guarantors);
      }
    }
  }, [formData]);

  // Handle Income Data Changes
  const handleIncomeChange = (field: string, value: any) => {
    setIncomeData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Handle Guarantor Data Changes
  const handleGuarantorChange = (index: number, field: string, value: any) => {
    const updatedGuarantors = [...guarantors];
    updatedGuarantors[index] = { ...updatedGuarantors[index], [field]: value };
    setGuarantors(updatedGuarantors);
  };

  // Handle Dynamic Gewog Fetching via Dropdown
  const handleDzongkhagChange = async (
    index: number,
    type: "perm" | "curr",
    dzongkhagId: string,
  ) => {
    handleGuarantorChange(
      index,
      type === "perm" ? "permDzongkhag" : "currDzongkhag",
      dzongkhagId,
    );
    handleGuarantorChange(
      index,
      type === "perm" ? "permGewog" : "currGewog",
      "",
    );

    try {
      const options = await fetchGewogsByDzongkhag(dzongkhagId);
      setDynamicGewogOptions((prev) => ({
        ...prev,
        [`${index}-${type}`]: options,
      }));
    } catch (error) {
      console.error(
        `Failed to load ${type} gewogs for guarantor ${index}:`,
        error,
      );
      setDynamicGewogOptions((prev) => ({
        ...prev,
        [`${index}-${type}`]: [],
      }));
    }
  };

  // --- AUTOMATIC LOOKUP LOGIC ---
  const handleGuarantorIdentityCheck = async (index: number) => {
    const guarantor = guarantors[index];
    const idType = guarantor.idType;
    const idNo = guarantor.idNumber;

    if (!idType || !idNo || idNo.trim() === "") return;

    setActiveGuarantorIndex(index);
    setShowLookupPopup(true);
    setLookupStatus("searching");

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
        setFetchedCustomerData(mappedData);
        setLookupStatus("found");
      } else {
        setLookupStatus("not_found");
        setFetchedCustomerData(null);
      }
    } catch (error) {
      console.error("Identity lookup failed", error);
      setLookupStatus("not_found");
      setFetchedCustomerData(null);
    }
  };

  const handleLookupProceed = async () => {
    if (
      lookupStatus === "found" &&
      fetchedCustomerData &&
      activeGuarantorIndex !== null
    ) {
      const index = activeGuarantorIndex;

      // Prepare sanitized data
      const sanitizedData = {
        ...fetchedCustomerData,
        idIssueDate: formatDateForInput(
          fetchedCustomerData.identificationIssueDate,
        ),
        idExpiryDate: formatDateForInput(
          fetchedCustomerData.identificationExpiryDate,
        ),
        dateOfBirth: formatDateForInput(fetchedCustomerData.dateOfBirth),

        // Map common fields to Guarantor specific field names if needed
        guarantorName: fetchedCustomerData.name, // Ensure name maps to guarantorName
        idNumber:
          fetchedCustomerData.identificationNo || guarantors[index].idNumber, // Preserve typing
        idType:
          fetchedCustomerData.identificationType || guarantors[index].idType,

        // String conversions
        nationality: fetchedCustomerData.nationality
          ? String(fetchedCustomerData.nationality)
          : "",
        permCountry: fetchedCustomerData.permCountry
          ? String(fetchedCustomerData.permCountry)
          : "",
        permDzongkhag: fetchedCustomerData.permDzongkhag
          ? String(fetchedCustomerData.permDzongkhag)
          : "",
        permGewog: fetchedCustomerData.permGewog
          ? String(fetchedCustomerData.permGewog)
          : "",
        currCountry: fetchedCustomerData.currCountry
          ? String(fetchedCustomerData.currCountry)
          : "",
        currDzongkhag: fetchedCustomerData.currDzongkhag
          ? String(fetchedCustomerData.currDzongkhag)
          : "",
        currGewog: fetchedCustomerData.currGewog
          ? String(fetchedCustomerData.currGewog)
          : "",
        maritalStatus: fetchedCustomerData.maritalStatus
          ? String(fetchedCustomerData.maritalStatus)
          : "",
      };

      // Load Gewogs immediately if Dzongkhags are present in fetched data
      // This ensures dropdowns show the correct label instead of just ID
      if (sanitizedData.permDzongkhag) {
        try {
          const options = await fetchGewogsByDzongkhag(
            sanitizedData.permDzongkhag,
          );
          setDynamicGewogOptions((prev) => ({
            ...prev,
            [`${index}-perm`]: options,
          }));
        } catch (e) {
          console.error(e);
        }
      }

      if (sanitizedData.currDzongkhag) {
        try {
          const options = await fetchGewogsByDzongkhag(
            sanitizedData.currDzongkhag,
          );
          setDynamicGewogOptions((prev) => ({
            ...prev,
            [`${index}-curr`]: options,
          }));
        } catch (e) {
          console.error(e);
        }
      }

      // Update State
      const updatedGuarantors = [...guarantors];
      updatedGuarantors[index] = {
        ...updatedGuarantors[index],
        ...sanitizedData,
      };
      setGuarantors(updatedGuarantors);
    }

    setShowLookupPopup(false);
    setActiveGuarantorIndex(null);
  };

  const addGuarantor = () => {
    setGuarantors([...guarantors, {}]);
  };

  const removeGuarantor = (index: number) => {
    if (guarantors.length > 1) {
      setGuarantors(guarantors.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      repaymentSource: {
        ...incomeData,
        guarantors: guarantors,
      },
    });
  };

  const isBhutan = (countryId: string) => {
    if (!countryId) return false;
    const country = countryOptions.find(
      (c) => String(c.country_pk_code || c.id) === String(countryId),
    );
    return (
      country &&
      (country.country || country.name || "").toLowerCase().includes("bhutan")
    );
  };

  return (
    <>
      {/* Search Status Popup */}
      <DocumentPopup
        open={showLookupPopup}
        onOpenChange={setShowLookupPopup}
        searchStatus={lookupStatus}
        onProceed={handleLookupProceed}
      />

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* INCOME DETAILS - Remains Static */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
            INCOME DETAILS
          </h2>
          {/* ... (Income inputs remain unchanged) ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enable-monthly-salary"
                  className="h-4 w-4 rounded border-gray-400"
                  checked={incomeData.enableMonthlySalary || false}
                  onChange={(e) => {
                    handleIncomeChange("enableMonthlySalary", e.target.checked);
                    if (!e.target.checked)
                      handleIncomeChange("monthlySalary", "");
                  }}
                />
                <label
                  htmlFor="enable-monthly-salary"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Monthly Salary (Nu.)
                </label>
              </div>
              <Input
                id="monthly-salary"
                type="number"
                placeholder="Amount *"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                value={incomeData.monthlySalary || ""}
                onChange={(e) =>
                  handleIncomeChange("monthlySalary", e.target.value)
                }
                disabled={!incomeData.enableMonthlySalary}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enable-rental-income"
                  className="h-4 w-4 rounded border-gray-400"
                  checked={incomeData.enableRentalIncome || false}
                  onChange={(e) => {
                    handleIncomeChange("enableRentalIncome", e.target.checked);
                    if (!e.target.checked)
                      handleIncomeChange("rentalIncome", "");
                  }}
                />
                <label
                  htmlFor="enable-rental-income"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Monthly Rental Income (Nu.)
                </label>
              </div>
              <Input
                id="rental-income"
                type="number"
                placeholder="Amount *"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                value={incomeData.rentalIncome || ""}
                onChange={(e) =>
                  handleIncomeChange("rentalIncome", e.target.value)
                }
                disabled={!incomeData.enableRentalIncome}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enable-business-income"
                  className="h-4 w-4 rounded border-gray-400"
                  checked={incomeData.enableBusinessIncome || false}
                  onChange={(e) => {
                    handleIncomeChange(
                      "enableBusinessIncome",
                      e.target.checked,
                    );
                    if (!e.target.checked)
                      handleIncomeChange("businessIncome", "");
                  }}
                />
                <label
                  htmlFor="enable-business-income"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Business Income (Nu.)
                </label>
              </div>
              <Input
                id="business-income"
                type="number"
                placeholder="Amount *"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                value={incomeData.businessIncome || ""}
                onChange={(e) =>
                  handleIncomeChange("businessIncome", e.target.value)
                }
                disabled={!incomeData.enableBusinessIncome}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enable-vehicle-hiring"
                  className="h-4 w-4 rounded border-gray-400"
                  checked={incomeData.enableVehicleHiring || false}
                  onChange={(e) => {
                    handleIncomeChange("enableVehicleHiring", e.target.checked);
                    if (!e.target.checked)
                      handleIncomeChange("vehicleHiringIncome", "");
                  }}
                />
                <label
                  htmlFor="enable-vehicle-hiring"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Vehicle Hiring Income (Nu.)
                </label>
              </div>
              <Input
                id="vehicle-hiring"
                type="number"
                placeholder="Amount *"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                value={incomeData.vehicleHiringIncome || ""}
                onChange={(e) =>
                  handleIncomeChange("vehicleHiringIncome", e.target.value)
                }
                disabled={!incomeData.enableVehicleHiring}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enable-dividend-income"
                  className="h-4 w-4 rounded border-gray-400"
                  checked={incomeData.enableDividendIncome || false}
                  onChange={(e) => {
                    handleIncomeChange(
                      "enableDividendIncome",
                      e.target.checked,
                    );
                    if (!e.target.checked)
                      handleIncomeChange("dividendIncome", "");
                  }}
                />
                <label
                  htmlFor="enable-dividend-income"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Dividend Income (Nu.)
                </label>
              </div>
              <Input
                id="dividend-income"
                type="number"
                placeholder="Amount *"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                value={incomeData.dividendIncome || ""}
                onChange={(e) =>
                  handleIncomeChange("dividendIncome", e.target.value)
                }
                disabled={!incomeData.enableDividendIncome}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enable-agriculture-income"
                  className="h-4 w-4 rounded border-gray-400"
                  checked={incomeData.enableAgricultureIncome || false}
                  onChange={(e) => {
                    handleIncomeChange(
                      "enableAgricultureIncome",
                      e.target.checked,
                    );
                    if (!e.target.checked)
                      handleIncomeChange("agricultureIncome", "");
                  }}
                />
                <label
                  htmlFor="enable-agriculture-income"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Agriculture Income (Nu.)
                </label>
              </div>
              <Input
                id="agriculture-income"
                type="number"
                placeholder="Amount *"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                value={incomeData.agricultureIncome || ""}
                onChange={(e) =>
                  handleIncomeChange("agricultureIncome", e.target.value)
                }
                disabled={!incomeData.enableAgricultureIncome}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enable-truck-taxi-income"
                  className="h-4 w-4 rounded border-gray-400"
                  checked={incomeData.enableTruckTaxiIncome || false}
                  onChange={(e) => {
                    handleIncomeChange(
                      "enableTruckTaxiIncome",
                      e.target.checked,
                    );
                    if (!e.target.checked)
                      handleIncomeChange("truckTaxiIncome", "");
                  }}
                />
                <label
                  htmlFor="enable-truck-taxi-income"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Truck/Taxi Income (Nu.)
                </label>
              </div>
              <Input
                id="truck-taxi-income"
                type="number"
                placeholder="Amount *"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                value={incomeData.truckTaxiIncome || ""}
                onChange={(e) =>
                  handleIncomeChange("truckTaxiIncome", e.target.value)
                }
                disabled={!incomeData.enableTruckTaxiIncome}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            <div className="space-y-3">
              <Label
                htmlFor="repayment-proof"
                className="text-gray-800 font-semibold text-sm"
              >
                Upload Repayment Proof{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-28 bg-transparent"
                >
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground">
                  No file chosen
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="repayment-guarantor"
                className="text-gray-800 font-semibold text-sm"
              >
                Is Repayment Guarantor Applicable?{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={incomeData.repaymentGuarantor || ""}
                  onValueChange={(value) =>
                    handleIncomeChange("repaymentGuarantor", value)
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
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
        </div>

        {/* DYNAMIC GUARANTORS LOOP */}
        {incomeData.repaymentGuarantor === "yes" && (
        <>
        {guarantors.map((guarantor, index) => {
          const currentPermGewogOptions =
            dynamicGewogOptions[`${index}-perm`] || [];
          const currentCurrGewogOptions =
            dynamicGewogOptions[`${index}-curr`] || [];
          const isPermBhutan = isBhutan(guarantor.permCountry);
          const isCurrBhutan = isBhutan(guarantor.currCountry);

          return (
            <div key={index} className="space-y-10">
              <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
                <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-bold text-[#003DA5]">
                    Guarantor {index + 1}
                  </h2>
                  {guarantors.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeGuarantor(index)}
                    >
                      Remove Guarantor
                    </Button>
                  )}
                </div>

                {/* Row 1 - Identification Type, Number, Issue Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor={`id-type-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Identification Type{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="w-full h-12" style={{ minHeight: "48px" }}>
                      <Select
                        value={guarantor.idType || ""}
                        onValueChange={(value) =>
                          handleGuarantorChange(index, "idType", value)
                        }
                      >
                        <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent>
                          {identificationTypeOptions.length > 0 ? (
                            identificationTypeOptions.map((option, idx) => (
                              <SelectItem
                                key={option.identity_type_pk_code || idx}
                                value={String(
                                  option.identity_type_pk_code || option.id,
                                )}
                              >
                                {option.identity_type || option.name}
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
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor={`id-number-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Identification No.{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`id-number-${index}`}
                      placeholder="Enter ID Number"
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={guarantor.idNumber || ""}
                      onChange={(e) =>
                        handleGuarantorChange(index, "idNumber", e.target.value)
                      }
                      // TRIGGER SEARCH ON BLUR
                      onBlur={() => handleGuarantorIdentityCheck(index)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor={`id-issue-date-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Identification Issue Date{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`id-issue-date-${index}`}
                      type="date"
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={formatDateForInput(guarantor.idIssueDate)}
                      onChange={(e) =>
                        handleGuarantorChange(
                          index,
                          "idIssueDate",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                {/* Row 2: Expiry Date, TPN */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor={`id-expiry-date-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Identification Expiry Date{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`id-expiry-date-${index}`}
                      type="date"
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={formatDateForInput(guarantor.idExpiryDate)}
                      onChange={(e) =>
                        handleGuarantorChange(
                          index,
                          "idExpiryDate",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor={`tpn-no-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      TPN No.
                    </Label>
                    <Input
                      id={`tpn-no-${index}`}
                      placeholder="Enter TPN Number"
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={guarantor.tpnNo || ""}
                      onChange={(e) =>
                        handleGuarantorChange(index, "tpnNo", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Row 3: Salutation, Name, Nationality */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor={`salutation-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Salutation <span className="text-destructive">*</span>
                    </Label>
                    <div className="w-full h-12" style={{ minHeight: "48px" }}>
                      <Select
                        value={guarantor.salutation || ""}
                        onValueChange={(value) =>
                          handleGuarantorChange(index, "salutation", value)
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

                  <div className="space-y-3">
                    <Label
                      htmlFor={`guarantor-name-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Guarantor Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`guarantor-name-${index}`}
                      placeholder="Enter Full Name"
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={guarantor.guarantorName || ""}
                      onChange={(e) =>
                        handleGuarantorChange(
                          index,
                          "guarantorName",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor={`nationality-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Nationality <span className="text-destructive">*</span>
                    </Label>
                    <div className="w-full h-12" style={{ minHeight: "48px" }}>
                      <Select
                        value={guarantor.nationality || ""}
                        onValueChange={(value) =>
                          handleGuarantorChange(index, "nationality", value)
                        }
                      >
                        <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent>
                          {nationalityOptions.map((option, idx) => (
                            <SelectItem
                              key={option.nationality_pk_code || idx}
                              value={String(
                                option.nationality_pk_code || option.id,
                              )}
                            >
                              {option.nationality || option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Row 4: DOB, Marital Status, Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor={`dob-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Date of Birth <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`dob-${index}`}
                      type="date"
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={formatDateForInput(guarantor.dateOfBirth)}
                      onChange={(e) =>
                        handleGuarantorChange(
                          index,
                          "dateOfBirth",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor={`marital-status-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Marital Status <span className="text-destructive">*</span>
                    </Label>
                    <div className="w-full h-12" style={{ minHeight: "48px" }}>
                      <Select
                        value={guarantor.maritalStatus || ""}
                        onValueChange={(value) =>
                          handleGuarantorChange(index, "maritalStatus", value)
                        }
                      >
                        <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent>
                          {maritalStatusOptions.map((option, idx) => (
                            <SelectItem
                              key={option.marital_status_pk_code || idx}
                              value={String(
                                option.marital_status_pk_code || option.id,
                              )}
                            >
                              {option.marital_status || option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor={`gender-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Gender <span className="text-destructive">*</span>
                    </Label>
                    <div className="w-full h-12" style={{ minHeight: "48px" }}>
                      <Select
                        value={guarantor.gender || ""}
                        onValueChange={(value) =>
                          handleGuarantorChange(index, "gender", value)
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

                {/* Row 5: Spouse Info & Family Tree */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor={`spouse-name-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Spouse Name
                    </Label>
                    <Input
                      id={`spouse-name-${index}`}
                      placeholder="Enter Spouse Name"
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={guarantor.spouseName || ""}
                      onChange={(e) =>
                        handleGuarantorChange(
                          index,
                          "spouseName",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor={`spouse-cid-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Spouse CID No.
                    </Label>
                    <Input
                      id={`spouse-cid-${index}`}
                      placeholder="Enter Spouse CID"
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={guarantor.spouseCid || ""}
                      onChange={(e) =>
                        handleGuarantorChange(
                          index,
                          "spouseCid",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor={`spouse-contact-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Spouse Contact No.
                    </Label>
                    <Input
                      id={`spouse-contact-${index}`}
                      placeholder="Enter Contact Number"
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={guarantor.spouseContact || ""}
                      onChange={(e) =>
                        handleGuarantorChange(
                          index,
                          "spouseContact",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor={`family-tree-${index}`}
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Upload Family Tree
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-28 bg-transparent"
                    >
                      Choose File
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      No file chosen
                    </span>
                  </div>
                </div>
              </div>

              {/* Permanent Address */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                  Permanent Address (Guarantor {index + 1})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor={`perm-country-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Country <span className="text-destructive">*</span>
                    </Label>
                    <div className="w-full h-12" style={{ minHeight: "48px" }}>
                      <Select
                        value={guarantor.permCountry || ""}
                        onValueChange={(value) =>
                          handleGuarantorChange(index, "permCountry", value)
                        }
                      >
                        <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="[Select Country]" />
                        </SelectTrigger>
                        <SelectContent>
                          {countryOptions.map((option, idx) => (
                            <SelectItem
                              key={option.country_pk_code || idx}
                              value={String(
                                option.country_pk_code || option.id,
                              )}
                            >
                              {option.country || option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor={`perm-dzongkhag-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      {isPermBhutan ? "Dzongkhag" : "State"}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    {!isPermBhutan ? (
                      <Input
                        id={`perm-dzongkhag-${index}`}
                        placeholder="Enter State"
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={guarantor.permDzongkhag || ""}
                        onChange={(e) =>
                          handleGuarantorChange(
                            index,
                            "permDzongkhag",
                            e.target.value,
                          )
                        }
                      />
                    ) : (
                      <div
                        className="w-full h-12"
                        style={{ minHeight: "48px" }}
                      >
                        <Select
                          value={guarantor.permDzongkhag || ""}
                          onValueChange={(value) =>
                            handleDzongkhagChange(index, "perm", value)
                          }
                          disabled={!guarantor.permCountry}
                        >
                          <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            <SelectValue placeholder="[Select Dzongkhag]" />
                          </SelectTrigger>
                          <SelectContent>
                            {dzongkhagOptions.map((option, idx) => (
                              <SelectItem
                                key={option.dzongkhag_pk_code || idx}
                                value={String(
                                  option.dzongkhag_pk_code || option.id,
                                )}
                              >
                                {option.dzongkhag || option.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor={`perm-gewog-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      {isPermBhutan ? "Gewog" : "Province"}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    {!isPermBhutan ? (
                      <Input
                        id={`perm-gewog-${index}`}
                        placeholder="Enter Province"
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={guarantor.permGewog || ""}
                        onChange={(e) =>
                          handleGuarantorChange(
                            index,
                            "permGewog",
                            e.target.value,
                          )
                        }
                      />
                    ) : (
                      <div
                        className="w-full h-12"
                        style={{ minHeight: "48px" }}
                      >
                        <Select
                          value={guarantor.permGewog || ""}
                          onValueChange={(value) =>
                            handleGuarantorChange(index, "permGewog", value)
                          }
                          disabled={!guarantor.permDzongkhag}
                        >
                          <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            <SelectValue placeholder="[Select Gewog]" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentPermGewogOptions.length > 0 ? (
                              currentPermGewogOptions.map((option, idx) => (
                                <SelectItem
                                  key={option.gewog_pk_code || idx}
                                  value={String(
                                    option.gewog_pk_code || option.id,
                                  )}
                                >
                                  {option.gewog || option.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="empty" disabled>
                                {guarantor.permDzongkhag
                                  ? "Loading..."
                                  : "Select Dzongkhag"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor={`perm-village-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      {isPermBhutan ? "Village/Street" : "Street"}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`perm-village-${index}`}
                      placeholder={
                        isPermBhutan ? "Enter Village/Street" : "Enter Street"
                      }
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={guarantor.permVillage || ""}
                      onChange={(e) =>
                        handleGuarantorChange(
                          index,
                          "permVillage",
                          e.target.value,
                        )
                      }
                      disabled={!guarantor.permCountry}
                    />
                  </div>

                  {isPermBhutan && (
                    <>
                      <div className="space-y-3">
                        <Label
                          htmlFor={`perm-thram-${index}`}
                          className="text-gray-800 font-semibold text-sm"
                        >
                          Thram No
                        </Label>
                        <Input
                          id={`perm-thram-${index}`}
                          placeholder="Enter Thram No"
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          value={guarantor.permThram || ""}
                          onChange={(e) =>
                            handleGuarantorChange(
                              index,
                              "permThram",
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor={`perm-house-${index}`}
                          className="text-gray-800 font-semibold text-sm"
                        >
                          House No
                        </Label>
                        <Input
                          id={`perm-house-${index}`}
                          placeholder="Enter House No"
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          value={guarantor.permHouse || ""}
                          onChange={(e) =>
                            handleGuarantorChange(
                              index,
                              "permHouse",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
                {!isPermBhutan && guarantor.permCountry && (
                  <div className="space-y-2 mt-4">
                    <Label
                      htmlFor={`perm-address-proof-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Upload Address Proof Document{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-28 bg-transparent"
                      >
                        Choose File
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        No file chosen
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Current/Residential Address */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                  Current/Residential Address (Guarantor {index + 1})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor={`curr-country-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Country of Resident{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="w-full h-12" style={{ minHeight: "48px" }}>
                      <Select
                        value={guarantor.currCountry || ""}
                        onValueChange={(value) =>
                          handleGuarantorChange(index, "currCountry", value)
                        }
                      >
                        <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="[Select Country]" />
                        </SelectTrigger>
                        <SelectContent>
                          {countryOptions.map((option, idx) => (
                            <SelectItem
                              key={option.country_pk_code || idx}
                              value={String(
                                option.country_pk_code || option.id,
                              )}
                            >
                              {option.country || option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor={`curr-dzongkhag-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      {isCurrBhutan ? "Dzongkhag" : "State"}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    {!isCurrBhutan ? (
                      <Input
                        id={`curr-dzongkhag-${index}`}
                        placeholder="Enter State"
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={guarantor.currDzongkhag || ""}
                        onChange={(e) =>
                          handleGuarantorChange(
                            index,
                            "currDzongkhag",
                            e.target.value,
                          )
                        }
                      />
                    ) : (
                      <div
                        className="w-full h-12"
                        style={{ minHeight: "48px" }}
                      >
                        <Select
                          value={guarantor.currDzongkhag || ""}
                          onValueChange={(value) =>
                            handleDzongkhagChange(index, "curr", value)
                          }
                          disabled={!guarantor.currCountry}
                        >
                          <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            <SelectValue placeholder="[Select Dzongkhag]" />
                          </SelectTrigger>
                          <SelectContent>
                            {dzongkhagOptions.map((option, idx) => (
                              <SelectItem
                                key={option.dzongkhag_pk_code || idx}
                                value={String(
                                  option.dzongkhag_pk_code || option.id,
                                )}
                              >
                                {option.dzongkhag || option.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor={`curr-gewog-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      {isCurrBhutan ? "Gewog" : "Province"}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    {!isCurrBhutan ? (
                      <Input
                        id={`curr-gewog-${index}`}
                        placeholder="Enter Province"
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={guarantor.currGewog || ""}
                        onChange={(e) =>
                          handleGuarantorChange(
                            index,
                            "currGewog",
                            e.target.value,
                          )
                        }
                      />
                    ) : (
                      <div
                        className="w-full h-12"
                        style={{ minHeight: "48px" }}
                      >
                        <Select
                          value={guarantor.currGewog || ""}
                          onValueChange={(value) =>
                            handleGuarantorChange(index, "currGewog", value)
                          }
                          disabled={!guarantor.currDzongkhag}
                        >
                          <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            <SelectValue placeholder="[Select Gewog]" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentCurrGewogOptions.length > 0 ? (
                              currentCurrGewogOptions.map((option, idx) => (
                                <SelectItem
                                  key={option.gewog_pk_code || idx}
                                  value={String(
                                    option.gewog_pk_code || option.id,
                                  )}
                                >
                                  {option.gewog || option.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="empty" disabled>
                                {guarantor.currDzongkhag
                                  ? "Loading..."
                                  : "Select Dzongkhag"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor={`curr-village-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      {isCurrBhutan ? "Village/Street" : "Street"}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`curr-village-${index}`}
                      placeholder={
                        isCurrBhutan ? "Enter Village/Street" : "Enter Street"
                      }
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={guarantor.currVillage || ""}
                      onChange={(e) =>
                        handleGuarantorChange(
                          index,
                          "currVillage",
                          e.target.value,
                        )
                      }
                      disabled={!guarantor.currCountry}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor={`curr-house-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      House/Building/Flat No.
                    </Label>
                    <Input
                      id={`curr-house-${index}`}
                      placeholder="Enter House/Building/Flat No"
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={guarantor.currHouse || ""}
                      onChange={(e) =>
                        handleGuarantorChange(
                          index,
                          "currHouse",
                          e.target.value,
                        )
                      }
                      disabled={!guarantor.currCountry}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor={`email-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      placeholder="Enter Email Address"
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={guarantor.email || ""}
                      onChange={(e) =>
                        handleGuarantorChange(index, "email", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor={`contact-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Contact Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`contact-${index}`}
                      placeholder="Enter Contact Number"
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={guarantor.contact || ""}
                      onChange={(e) =>
                        handleGuarantorChange(index, "contact", e.target.value)
                      }
                    />
                  </div>
                </div>
                {!isCurrBhutan && guarantor.currCountry && (
                  <div className="space-y-2 mt-4">
                    <Label
                      htmlFor={`curr-address-proof-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Upload Address Proof Document{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-28 bg-transparent"
                      >
                        Choose File
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        No file chosen
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* PEP Declaration */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                  PEP Declaration (Guarantor {index + 1})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2.5">
                    <Label
                      htmlFor={`is-pep-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Politically Exposed Person?{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={guarantor.isPep || ""}
                      onValueChange={(value) =>
                        handleGuarantorChange(index, "isPep", value)
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

                  <div className="space-y-2.5">
                    <Label
                      htmlFor={`pep-category-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      PEP Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={
                        guarantor.isPep === "yes" ? guarantor.pepCategory : ""
                      }
                      onValueChange={(value) =>
                        handleGuarantorChange(index, "pepCategory", value)
                      }
                      disabled={guarantor.isPep !== "yes"}
                    >
                      <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
                        <SelectItem value="domestic">Domestic PEP</SelectItem>
                        <SelectItem value="foreign">Foreign PEP</SelectItem>
                        <SelectItem value="international">
                          International Organization PEP
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5">
                    <Label
                      htmlFor={`related-to-pep-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Are you related to any PEP?{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={
                        guarantor.isPep === "no" ? guarantor.relatedToPep : ""
                      }
                      onValueChange={(value) =>
                        handleGuarantorChange(index, "relatedToPep", value)
                      }
                      disabled={guarantor.isPep !== "no"}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2.5">
                    <Label
                      htmlFor={`pep-relationship-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Relationship <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={
                        guarantor.isPep === "no" &&
                        guarantor.relatedToPep === "yes"
                          ? guarantor.pepRelationship
                          : ""
                      }
                      onValueChange={(value) =>
                        handleGuarantorChange(index, "pepRelationship", value)
                      }
                      disabled={
                        guarantor.isPep !== "no" ||
                        guarantor.relatedToPep !== "yes"
                      }
                    >
                      <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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

                  <div className="space-y-2.5">
                    <Label
                      htmlFor={`pep-id-no-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Identification No. <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`pep-id-no-${index}`}
                      placeholder="Enter Identification No"
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      value={
                        guarantor.isPep === "no" &&
                        guarantor.relatedToPep === "yes"
                          ? guarantor.pepIdNo || ""
                          : ""
                      }
                      onChange={(e) =>
                        handleGuarantorChange(index, "pepIdNo", e.target.value)
                      }
                      disabled={
                        guarantor.isPep !== "no" ||
                        guarantor.relatedToPep !== "yes"
                      }
                    />
                  </div>

                  <div className="space-y-2.5">
                    <Label
                      htmlFor={`pep-category-2-${index}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      PEP Category <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`pep-category-2-${index}`}
                      placeholder="Enter PEP Category"
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      value={
                        guarantor.isPep === "no" &&
                        guarantor.relatedToPep === "yes"
                          ? guarantor.pepCategory2 || ""
                          : ""
                      }
                      onChange={(e) =>
                        handleGuarantorChange(
                          index,
                          "pepCategory2",
                          e.target.value,
                        )
                      }
                      disabled={
                        guarantor.isPep !== "no" ||
                        guarantor.relatedToPep !== "yes"
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor={`pep-upload-${index}`}
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Upload Identification Proof{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id={`pep-upload-${index}`}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                          handleGuarantorChange(
                            index,
                            "pepIdentificationProof",
                            file,
                          );
                      }}
                      disabled={
                        guarantor.isPep !== "no" ||
                        guarantor.relatedToPep !== "yes"
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-28 bg-transparent"
                      disabled={
                        guarantor.isPep !== "no" ||
                        guarantor.relatedToPep !== "yes"
                      }
                      onClick={() =>
                        document.getElementById(`pep-upload-${index}`)?.click()
                      }
                    >
                      Choose File
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {guarantor.pepIdentificationProof?.name ||
                        "No file chosen"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 pt-4">
          <Button
            type="button"
            size="lg"
            className="min-w-40"
            onClick={addGuarantor}
          >
            + Add Guarantor
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
    </>
  );
}
