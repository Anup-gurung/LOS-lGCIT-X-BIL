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
import { Upload, Plus, Trash2 } from "lucide-react";
import {
  fetchNationality,
  fetchIdentificationType,
  fetchCountry,
  fetchDzongkhag,
  fetchGewogsByDzongkhag,
  fetchMaritalStatus,
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
    formData?.isGuarantorApplicable || "No"
  );

  const [guarantors, setGuarantors] = useState<any[]>(
    formData?.guarantors && formData.guarantors.length > 0
      ? formData.guarantors
      : []
  );

  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<any[]>([]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [nationality, identificationType] = await Promise.all([
          fetchNationality().catch(() => []),
          fetchIdentificationType().catch(() => []),
        ]);

        const nationalityData = nationality?.data?.data || nationality?.data || nationality || [];
        const identificationTypeData =
          identificationType?.data?.data ||
          identificationType?.data ||
          identificationType ||
          [];

        setNationalityOptions(nationalityData);
        setIdentificationTypeOptions(identificationTypeData);
      } catch (error) {
        console.error("Error loading form data:", error);
      }
    };
    loadAllData();
  }, []);

  const handleBusinessIncomeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBusinessIncomeData({
        ...businessIncomeData,
        proofFile: file,
        proofFileName: file.name,
      });
    }
  };

  const handleAddGuarantor = () => {
    setGuarantors([
      ...guarantors,
      {
        personalDetails: {},
        repaymentSourceType: "",
        amount: "",
        proofFile: null,
        proofFileName: "",
      },
    ]);
  };

  const handleRemoveGuarantor = (index: number) => {
    setGuarantors(guarantors.filter((_, i) => i !== index));
  };

  const updateGuarantorField = (index: number, field: string, value: any) => {
    const updated = [...guarantors];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setGuarantors(updated);
  };

  const updateGuarantorPersonalDetail = (index: number, field: string, value: any) => {
    const updated = [...guarantors];
    updated[index] = {
      ...updated[index],
      personalDetails: {
        ...updated[index].personalDetails,
        [field]: value,
      },
    };
    setGuarantors(updated);
  };

  const handleGuarantorFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateGuarantorField(index, "proofFile", file);
      updateGuarantorField(index, "proofFileName", file.name);
    }
  };

  const isFormValid = () => {
    if (
      !businessIncomeData.amount ||
      parseFloat(businessIncomeData.amount) <= 0 ||
      !businessIncomeData.proofFile
    ) {
      return false;
    }

    if (isGuarantorApplicable === "Yes") {
      if (guarantors.length === 0) {
        return false;
      }

      for (const guarantor of guarantors) {
        if (
          !guarantor.repaymentSourceType ||
          !guarantor.amount ||
          parseFloat(guarantor.amount) <= 0 ||
          !guarantor.proofFile ||
          !guarantor.personalDetails?.firstName ||
          !guarantor.personalDetails?.lastName ||
          !guarantor.personalDetails?.dateOfBirth
        ) {
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!isFormValid()) {
      alert("Please fill in all required fields");
      return;
    }

    const data = {
      businessIncome: businessIncomeData,
      isGuarantorApplicable,
      guarantors: isGuarantorApplicable === "Yes" ? guarantors : [],
    };

    onNext(data);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
          REPAYMENT SOURCE - BUSINESS INCOME
        </h2>
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Repayment Source Type <span className="text-red-500">*</span>
              </Label>
              <Input
                value={businessIncomeData.repaymentSourceType}
                disabled
                className="bg-gray-100 cursor-not-allowed border-gray-300"
              />
              <p className="text-xs text-gray-500">
                Business loans must use Business Income as repayment source
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-income-amount" className="text-gray-800 font-semibold">
                Amount (Nu.) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="business-income-amount"
                type="number"
                placeholder="Enter amount"
                value={businessIncomeData.amount}
                onChange={(e) =>
                  setBusinessIncomeData({
                    ...businessIncomeData,
                    amount: e.target.value,
                  })
                }
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-income-proof" className="text-gray-800 font-semibold">
              Upload Repayment Proof <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document.getElementById("business-income-proof")?.click()
                }
                className="border-gray-300 hover:border-[#FF9800]"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <span className="text-sm text-gray-600">
                {businessIncomeData.proofFileName || "No file selected"}
              </span>
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

      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
          GUARANTOR INFORMATION
        </h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-gray-800 font-semibold">
              Is Repayment Guarantor Applicable? <span className="text-red-500">*</span>
            </Label>
            <Select
              value={isGuarantorApplicable || ""}
              onValueChange={setIsGuarantorApplicable}
            >
              <SelectTrigger className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isGuarantorApplicable === "Yes" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Guarantors ({guarantors.length})
                </h3>
                <Button
                  type="button"
                  onClick={handleAddGuarantor}
                  className="bg-[#003DA5] hover:bg-[#002D7A]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Guarantor
                </Button>
              </div>

              {guarantors.map((guarantor, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 shadow-md rounded-lg p-6 space-y-6"
                >
                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Guarantor {index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveGuarantor(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">
                      Personal Details
                    </h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-gray-800 font-semibold">
                            First Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={guarantor.personalDetails?.firstName || ""}
                            onChange={(e) =>
                              updateGuarantorPersonalDetail(
                                index,
                                "firstName",
                                e.target.value
                              )
                            }
                            className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-800 font-semibold">
                            Last Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={guarantor.personalDetails?.lastName || ""}
                            onChange={(e) =>
                              updateGuarantorPersonalDetail(
                                index,
                                "lastName",
                                e.target.value
                              )
                            }
                            className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-800 font-semibold">
                            Date of Birth <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="date"
                            value={
                              formatDateForInput(
                                guarantor.personalDetails?.dateOfBirth
                              ) || ""
                            }
                            onChange={(e) =>
                              updateGuarantorPersonalDetail(
                                index,
                                "dateOfBirth",
                                e.target.value
                              )
                            }
                            className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-800 font-semibold">
                            Contact Number
                          </Label>
                          <Input
                            value={
                              guarantor.personalDetails?.contactNumber || ""
                            }
                            onChange={(e) =>
                              updateGuarantorPersonalDetail(
                                index,
                                "contactNumber",
                                e.target.value
                              )
                            }
                            className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-4">
                        Repayment Source
                      </h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-gray-800 font-semibold">
                            Repayment Source Type{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={guarantor.repaymentSourceType || ""}
                            onValueChange={(value) =>
                              updateGuarantorField(
                                index,
                                "repaymentSourceType",
                                value
                              )
                            }
                          >
                            <SelectTrigger className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
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

                        <div className="space-y-2">
                          <Label className="text-gray-800 font-semibold">
                            Amount (Nu.) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            value={guarantor.amount || ""}
                            onChange={(e) =>
                              updateGuarantorField(index, "amount", e.target.value)
                            }
                            className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <Label className="text-gray-800 font-semibold">
                          Upload Repayment Proof{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document
                                .getElementById(`guarantor-proof-${index}`)
                                ?.click()
                            }
                            className="border-gray-300 hover:border-[#FF9800]"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Choose File
                          </Button>
                          <span className="text-sm text-gray-600">
                            {guarantor.proofFileName || "No file selected"}
                          </span>
                        </div>
                        <input
                          id={`guarantor-proof-${index}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleGuarantorFileChange(index, e)}
                          className="hidden"
                        />
                      </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-12 mb-6">
        <Button
          variant="secondary"
          size="lg"
          onClick={onBack}
          className="bg-gray-500 hover:bg-gray-600 text-white px-10 py-6 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleNext}
          disabled={!isFormValid()}
          className="bg-[#003DA5] hover:bg-[#002D7A] text-white px-10 py-6 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
