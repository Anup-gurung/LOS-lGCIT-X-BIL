"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  UserPlus,
  Users,
  UserCheck,
} from "lucide-react";
import {
  fetchCountry,
  fetchDzongkhag,
  fetchGewogsByDzongkhag,
  fetchIdentificationType,
  fetchMaritalStatus,
  fetchBanks,
  fetchNationality,
  fetchOccupations,
  fetchLegalConstitution,
  fetchPepCategory,
  fetchPepSubCategoryByCategory,
} from "@/services/api";

// --- Types & Interfaces ---

interface BusinessDetailsFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
  formData: any;
}

// --- Constants for Uniform Styling ---
const uniformStyle =
  "h-11 w-full bg-white border border-gray-300 focus-visible:ring-1 focus-visible:ring-[#003DA5] focus-visible:border-[#003DA5] rounded-lg text-sm placeholder:text-gray-400";

const fileUploadStyle =
  "h-11 w-full bg-white border border-gray-300 rounded-lg flex items-center px-3 justify-between cursor-pointer hover:bg-gray-50 transition-colors text-sm";

// --- Helper Functions ---
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

const createEmptyRelatedPep = () => ({
  relationship: "",
  identificationNo: "",
  category: "",
  subCategory: "",
  identificationProof: null,
  identificationProofName: "",
});

// --- COMPONENT: Comprehensive Owner/Partner/Trustee Details ---

const ComprehensiveOwnerDetails = ({
  data,
  onUpdate,
  countryOptions,
  dzongkhagOptions,
  identificationTypeOptions,
  title = "Personal Information",
  isPartner = false, // When true, shows Shareholding % field
  onRemove,
}: {
  data: any;
  onUpdate: (newData: any) => void;
  countryOptions: any[];
  dzongkhagOptions: any[];
  identificationTypeOptions: any[];
  title?: string;
  isPartner?: boolean;
  onRemove?: () => void;
}) => {
  // Local Options State
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([]);
  const [banksOptions, setBanksOptions] = useState<any[]>([]);
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [occupationOptions, setOccupationOptions] = useState<any[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<any[]>([]);
  const [pepCategoryOptions, setPepCategoryOptions] = useState<any[]>([]);

  // Dynamic Options State
  const [permGewogOptions, setPermGewogOptions] = useState<any[]>([]);
  const [currGewogOptions, setCurrGewogOptions] = useState<any[]>([]);
  const [pepSubCategoryOptions, setPepSubCategoryOptions] = useState<any[]>([]);
  const [relatedPepOptionsMap, setRelatedPepOptionsMap] = useState<
    Record<number, any[]>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isExpanded, setIsExpanded] = useState(true);

  // Date Constraints
  const today = new Date().toISOString().split("T")[0];

  // Helper to update parent state
  const updateField = (field: string, value: any) => {
    onUpdate({ ...data, [field]: value });
  };

  const updateRelatedPep = (index: number, field: string, value: any) => {
    const updatedPeps = [...(data.relatedPeps || [])];
    if (!updatedPeps[index]) updatedPeps[index] = createEmptyRelatedPep();
    updatedPeps[index] = { ...updatedPeps[index], [field]: value };
    updateField("relatedPeps", updatedPeps);
  };

  // --- Initial Data Loading ---
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [marital, banks, national, occ, org, pepCat] = await Promise.all([
          fetchMaritalStatus().catch(() => []),
          fetchBanks().catch(() => []),
          fetchNationality().catch(() => []),
          fetchOccupations().catch(() => []),
          fetchLegalConstitution().catch(() => []),
          fetchPepCategory().catch(() => []),
        ]);
        setMaritalStatusOptions(marital?.data?.data || marital || []);
        setBanksOptions(banks?.data?.data || banks || []);
        setNationalityOptions(national?.data?.data || national || []);
        setOccupationOptions(occ?.data?.data || occ || []);
        setOrganizationOptions(org?.data?.data || org || []);
        setPepCategoryOptions(pepCat?.data?.data || pepCat || []);
      } catch (e) {
        console.error("Error loading owner options", e);
      }
    };
    loadOptions();
  }, []);

  // --- Logic: Address Gewogs ---
  useEffect(() => {
    if (data.permDzongkhag) {
      fetchGewogsByDzongkhag(data.permDzongkhag)
        .then((res) => setPermGewogOptions(res?.data?.data || res || []))
        .catch(() => setPermGewogOptions([]));
    }
  }, [data.permDzongkhag]);

  useEffect(() => {
    if (data.currDzongkhag) {
      fetchGewogsByDzongkhag(data.currDzongkhag)
        .then((res) => setCurrGewogOptions(res?.data?.data || res || []))
        .catch(() => setCurrGewogOptions([]));
    }
  }, [data.currDzongkhag]);

  // --- Logic: PEP Subcategories ---
  useEffect(() => {
    if (data.pepPerson === "yes" && data.pepCategory) {
      fetchPepSubCategoryByCategory(data.pepCategory)
        .then((res) => setPepSubCategoryOptions(res?.data?.data || res || []))
        .catch(() => setPepSubCategoryOptions([]));
    }
  }, [data.pepPerson, data.pepCategory]);

  // --- Logic: Related PEP Subcategories ---
  const handleRelatedPepCategoryChange = async (
    index: number,
    value: string,
  ) => {
    const updatedPeps = [...(data.relatedPeps || [])];
    updatedPeps[index] = {
      ...updatedPeps[index],
      category: value,
      subCategory: "",
    };
    updateField("relatedPeps", updatedPeps);

    try {
      const res = await fetchPepSubCategoryByCategory(value);
      const options = res?.data?.data || res || [];
      setRelatedPepOptionsMap((prev) => ({ ...prev, [index]: options }));
    } catch (e) {
      setRelatedPepOptionsMap((prev) => ({ ...prev, [index]: [] }));
    }
  };

  const handleAddRelatedPep = () => {
    updateField("relatedPeps", [
      ...(data.relatedPeps || []),
      createEmptyRelatedPep(),
    ]);
  };

  const handleRemoveRelatedPep = (index: number) => {
    const newPeps = data.relatedPeps.filter((_: any, i: number) => i !== index);
    updateField("relatedPeps", newPeps);
  };

  const handleRelatedPepFileChange = (index: number, file: File | null) => {
    if (file) {
      updateRelatedPep(index, "identificationProof", file);
      updateRelatedPep(index, "identificationProofName", file.name);
    }
  };

  // --- Helper Check for Marriage Status ---
  const isMarried = () => {
    const statusValue = data.maritalStatus;
    if (!statusValue) return false;
    if (String(statusValue).toLowerCase() === "married") return true;
    const selectedOption = maritalStatusOptions.find((opt) => {
      const optValue = String(
        opt.id || opt.marital_status_pk_code || opt.value || "",
      );
      return optValue === String(statusValue);
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

  const isBhutan = (countryId: string) => {
    const c = countryOptions.find(
      (opt) =>
        String(opt.country_pk_code || opt.country_id || opt.id) ===
        String(countryId),
    );
    return (
      c && (c.country_name || c.country || "").toLowerCase().includes("bhutan")
    );
  };

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

      if (fieldName === "passportPhoto") {
        updateField("passportPhoto", file);
        updateField("passportPhotoName", file.name);
      } else {
        updateField(fieldName, file);
        updateField(`${fieldName}Name`, file.name);
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 mb-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h4 className="text-xl font-bold text-[#003DA5]">{title}</h4>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-[#003DA5]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[#003DA5]" />
          )}
        </div>
        {onRemove && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onRemove}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" /> Remove Entry
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-8">
          {/* 1. Personal Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>Identification Type *</Label>
              <Select
                value={data.identificationType}
                onValueChange={(v) => updateField("identificationType", v)}
              >
                <SelectTrigger className={uniformStyle}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {identificationTypeOptions.map((opt: any, i) => (
                    <SelectItem
                      key={i}
                      value={String(
                        opt.id ||
                          opt.identification_type_id ||
                          opt.identity_type_pk_code,
                      )}
                    >
                      {opt.identification_type || opt.identity_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Identification No. *</Label>
              <Input
                className={uniformStyle}
                value={data.identificationNo}
                onChange={(e) =>
                  updateField("identificationNo", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Salutation *</Label>
              <Select
                value={data.salutation}
                onValueChange={(v) => updateField("salutation", v)}
              >
                <SelectTrigger className={uniformStyle}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mr">Mr.</SelectItem>
                  <SelectItem value="mrs">Mrs.</SelectItem>
                  <SelectItem value="ms">Ms.</SelectItem>
                  <SelectItem value="dasho">Dasho</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Applicant Name *</Label>
              <Input
                className={uniformStyle}
                value={data.applicantName}
                onChange={(e) => updateField("applicantName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nationality *</Label>
              <Select
                value={data.nationality}
                onValueChange={(v) => updateField("nationality", v)}
              >
                <SelectTrigger className={uniformStyle}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {nationalityOptions.map((opt: any, i) => (
                    <SelectItem
                      key={i}
                      value={String(opt.id || opt.nationality_pk_code)}
                    >
                      {opt.nationality || opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select
                value={data.gender}
                onValueChange={(v) => updateField("gender", v)}
              >
                <SelectTrigger className={uniformStyle}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Identification Issue Date *</Label>
              <Input
                type="date"
                className={uniformStyle}
                value={formatDateForInput(data.identificationIssueDate)}
                onChange={(e) =>
                  updateField("identificationIssueDate", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Identification Expiry Date *</Label>
              <Input
                type="date"
                className={uniformStyle}
                value={formatDateForInput(data.identificationExpiryDate)}
                onChange={(e) =>
                  updateField("identificationExpiryDate", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <Input
                type="date"
                className={uniformStyle}
                value={formatDateForInput(data.dateOfBirth)}
                onChange={(e) => updateField("dateOfBirth", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>TPN No *</Label>
              <Input
                className={uniformStyle}
                value={data.tpn}
                onChange={(e) => updateField("tpn", e.target.value)}
              />
            </div>

            {/* Dynamic Shareholding % field */}
            {isPartner && (
              <div className="space-y-2">
                <Label>Shareholding %</Label>
                <Input
                  type="number"
                  className={`${uniformStyle} border-[#003DA5]/40 focus:border-[#003DA5] focus:ring-1 focus:ring-[#003DA5] bg-blue-50/20`}
                  value={data.shareholdingPercent}
                  placeholder="e.g. 25"
                  onChange={(e) =>
                    updateField("shareholdingPercent", e.target.value)
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Marital Status *</Label>
              <Select
                value={data.maritalStatus}
                onValueChange={(v) => updateField("maritalStatus", v)}
              >
                <SelectTrigger className={uniformStyle}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {maritalStatusOptions.map((opt: any, i) => (
                    <SelectItem
                      key={i}
                      value={String(
                        opt.id || opt.marital_status_pk_code || opt.value,
                      )}
                    >
                      {opt.marital_status || opt.name || opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isMarried() && (
            <div className="mt-4 border-t pt-4">
              <h5 className="font-semibold text-[#003DA5] mb-4">
                Spouse Personal Information
              </h5>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Spouse CID/ID No. *</Label>
                  <Input
                    className={uniformStyle}
                    value={data.spouseIdentificationNo}
                    onChange={(e) =>
                      updateField("spouseIdentificationNo", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Spouse Name *</Label>
                  <Input
                    className={uniformStyle}
                    value={data.spouseName}
                    onChange={(e) => updateField("spouseName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Spouse Contact No. *</Label>
                  <Input
                    className={uniformStyle}
                    value={data.spouseContact}
                    onChange={(e) =>
                      updateField("spouseContact", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t mt-4">
            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Upload Family Tree <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id={`family-tree-${data.id || "owner"}`}
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
                    document
                      .getElementById(`family-tree-${data.id || "owner"}`)
                      ?.click()
                  }
                >
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground">
                  {data.familyTreeName || "No file chosen"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t">
            <div className="space-y-2">
              <Label>Name of Bank *</Label>
              <Select
                value={data.bankName}
                onValueChange={(v) => updateField("bankName", v)}
              >
                <SelectTrigger className={uniformStyle}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {banksOptions.map((option: any, index: number) => {
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
                      <SelectItem key={index} value={value}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Saving Account No *</Label>
              <Input
                className={uniformStyle}
                value={data.bankAccount}
                onChange={(e) => updateField("bankAccount", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Upload Passport-size Photograph *</Label>
              <div
                className={fileUploadStyle}
                onClick={() =>
                  document
                    .getElementById(`passport-${data.id || "owner"}`)
                    ?.click()
                }
              >
                <span className="text-gray-500 truncate">
                  {data.passportPhotoName || "Choose File"}
                </span>
                <Upload className="h-4 w-4 text-[#003DA5]" />
              </div>
              <input
                type="file"
                id={`passport-${data.id || "owner"}`}
                className="hidden"
                accept=".jpg,.jpeg,.png"
                onChange={(e) =>
                  handleFileChange("passportPhoto", e.target.files?.[0] || null)
                }
              />
            </div>
          </div>

          {/* 2. Permanent Address */}
          <div className="space-y-4 pt-4 border-t">
            <h5 className="font-semibold text-[#003DA5]">Permanent Address</h5>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select
                  value={data.permCountry}
                  onValueChange={(v) => updateField("permCountry", v)}
                >
                  <SelectTrigger className={uniformStyle}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((opt: any, i) => (
                      <SelectItem
                        key={i}
                        value={String(
                          opt.id || opt.country_pk_code || opt.country_id,
                        )}
                      >
                        {opt.country_name || opt.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isBhutan(data.permCountry) ? (
                <>
                  <div className="space-y-2">
                    <Label>Dzongkhag *</Label>
                    <Select
                      value={data.permDzongkhag}
                      onValueChange={(v) => updateField("permDzongkhag", v)}
                    >
                      <SelectTrigger className={uniformStyle}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {dzongkhagOptions.map((opt: any, i) => (
                          <SelectItem
                            key={i}
                            value={String(
                              opt.id ||
                                opt.dzongkhag_pk_code ||
                                opt.pk_dzongkhag_id,
                            )}
                          >
                            {opt.dzongkhag || opt.dzongkhag_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gewog *</Label>
                    <Select
                      value={data.permGewog}
                      onValueChange={(v) => updateField("permGewog", v)}
                    >
                      <SelectTrigger className={uniformStyle}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {permGewogOptions.map((opt: any, i) => (
                          <SelectItem
                            key={i}
                            value={String(
                              opt.id || opt.gewog_pk_code || opt.pk_gewog_id,
                            )}
                          >
                            {opt.gewog || opt.gewog_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Village/Street *</Label>
                    <Input
                      className={uniformStyle}
                      value={data.permVillage}
                      onChange={(e) =>
                        updateField("permVillage", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Thram No. *</Label>
                    <Input
                      className={uniformStyle}
                      value={data.permThram}
                      onChange={(e) => updateField("permThram", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>House No. *</Label>
                    <Input
                      className={uniformStyle}
                      value={data.permHouse}
                      onChange={(e) => updateField("permHouse", e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Input
                      className={uniformStyle}
                      value={data.permDzongkhag}
                      onChange={(e) =>
                        updateField("permDzongkhag", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Province *</Label>
                    <Input
                      className={uniformStyle}
                      value={data.permGewog}
                      onChange={(e) => updateField("permGewog", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Street Name *</Label>
                    <Input
                      className={uniformStyle}
                      value={data.permVillage}
                      onChange={(e) =>
                        updateField("permVillage", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Upload Address Proof *</Label>
                    <div
                      className={fileUploadStyle}
                      onClick={() =>
                        document
                          .getElementById(`perm-proof-${data.id || "owner"}`)
                          ?.click()
                      }
                    >
                      <span className="text-gray-500 truncate">
                        {data.permAddressProofName || "Choose File"}
                      </span>
                      <Upload className="h-4 w-4 text-[#003DA5]" />
                    </div>
                    <input
                      type="file"
                      id={`perm-proof-${data.id || "owner"}`}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          updateField("permAddressProof", e.target.files[0]);
                          updateField(
                            "permAddressProofName",
                            e.target.files[0].name,
                          );
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 3. Current Address */}
          <div className="space-y-4 pt-4 border-t">
            <h5 className="font-semibold text-[#003DA5]">
              Current/Residential Address
            </h5>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select
                  value={data.currCountry}
                  onValueChange={(v) => updateField("currCountry", v)}
                >
                  <SelectTrigger className={uniformStyle}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((opt: any, i) => (
                      <SelectItem
                        key={i}
                        value={String(
                          opt.id || opt.country_pk_code || opt.country_id,
                        )}
                      >
                        {opt.country_name || opt.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isBhutan(data.currCountry) ? (
                <>
                  <div className="space-y-2">
                    <Label>Dzongkhag *</Label>
                    <Select
                      value={data.currDzongkhag}
                      onValueChange={(v) => updateField("currDzongkhag", v)}
                    >
                      <SelectTrigger className={uniformStyle}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {dzongkhagOptions.map((opt: any, i) => (
                          <SelectItem
                            key={i}
                            value={String(
                              opt.id ||
                                opt.dzongkhag_pk_code ||
                                opt.pk_dzongkhag_id,
                            )}
                          >
                            {opt.dzongkhag || opt.dzongkhag_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gewog *</Label>
                    <Select
                      value={data.currGewog}
                      onValueChange={(v) => updateField("currGewog", v)}
                    >
                      <SelectTrigger className={uniformStyle}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {currGewogOptions.map((opt: any, i) => (
                          <SelectItem
                            key={i}
                            value={String(
                              opt.id ||
                                opt.curr_gewog_pk_code ||
                                opt.pk_gewog_id,
                            )}
                          >
                            {opt.gewog || opt.gewog_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Village/Street *</Label>
                    <Input
                      className={uniformStyle}
                      value={data.currVillage}
                      onChange={(e) =>
                        updateField("currVillage", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>House/Building/Flat No *</Label>
                    <Input
                      className={uniformStyle}
                      value={data.currFlat}
                      onChange={(e) => updateField("currFlat", e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Input
                      className={uniformStyle}
                      value={data.currDzongkhag}
                      onChange={(e) =>
                        updateField("currDzongkhag", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Province *</Label>
                    <Input
                      className={uniformStyle}
                      value={data.currGewog}
                      onChange={(e) => updateField("currGewog", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Street Name *</Label>
                    <Input
                      className={uniformStyle}
                      value={data.currVillage}
                      onChange={(e) =>
                        updateField("currVillage", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Upload Address Proof *</Label>
                    <div
                      className={fileUploadStyle}
                      onClick={() =>
                        document
                          .getElementById(`curr-proof-${data.id || "owner"}`)
                          ?.click()
                      }
                    >
                      <span className="text-gray-500 truncate">
                        {data.currAddressProofName || "Choose File"}
                      </span>
                      <Upload className="h-4 w-4 text-[#003DA5]" />
                    </div>
                    <input
                      type="file"
                      id={`curr-proof-${data.id || "owner"}`}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          updateField("currAddressProof", e.target.files[0]);
                          updateField(
                            "currAddressProofName",
                            e.target.files[0].name,
                          );
                        }
                      }}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input
                  className={uniformStyle}
                  value={data.currEmail}
                  onChange={(e) => updateField("currEmail", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Number *</Label>
                <Input
                  className={uniformStyle}
                  value={data.currContact}
                  onChange={(e) => updateField("currContact", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Alternate Contact No</Label>
                <Input
                  className={uniformStyle}
                  value={data.currAlternateContact}
                  onChange={(e) =>
                    updateField("currAlternateContact", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* 4. PEP Declaration */}
          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
              PEP Declaration
            </h2>

            {/* SELF PEP Question */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 border-b pb-6">
              <div className="space-y-2.5">
                <Label className="text-gray-800 font-semibold text-sm">
                  Politically Exposed Person
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={data.pepPerson}
                  onValueChange={(value) => {
                    onUpdate({
                      ...data,
                      pepPerson: value,
                      pepRelated: value === "yes" ? "" : data.pepRelated,
                    });
                  }}
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
                    <Label className="text-gray-800 font-semibold text-sm">
                      PEP Category<span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={data.pepCategory}
                      onValueChange={(value) => {
                        onUpdate({
                          ...data,
                          pepCategory: value,
                          pepSubCategory: "",
                        });
                      }}
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
                              `pep-cat-${index}`;
                            const value = String(
                              option.pep_category_pk_code || option.id,
                            );
                            const label =
                              option.pep_category || option.name || "Unknown";
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
                    <Label className="text-gray-800 font-semibold text-sm">
                      PEP Sub Category
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={data.pepSubCategory}
                      onValueChange={(value) =>
                        updateField("pepSubCategory", value)
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
                              `pep-sub-${index}`;
                            const value = String(
                              option.pep_sub_category_pk_code || option.id,
                            );
                            const label =
                              option.pep_sub_category ||
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
                        id={`self-pep-${data.id || "owner"}`}
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
                          document
                            .getElementById(`self-pep-${data.id || "owner"}`)
                            ?.click()
                        }
                      >
                        Choose File
                      </Button>
                      <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {data.identificationProofName || "No file chosen"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* RELATED PEP Question */}
            {data.pepPerson === "no" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pt-6">
                <div className="space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-sm">
                    Are you related to any PEP?
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={data.pepRelated}
                    onValueChange={(value) => {
                      onUpdate({
                        ...data,
                        pepRelated: value,
                        relatedPeps:
                          value === "yes" ? [createEmptyRelatedPep()] : [],
                      });
                    }}
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
            {data.pepPerson === "no" && data.pepRelated === "yes" && (
              <div className="space-y-6 pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-bold text-gray-700">
                    Related PEP Details
                  </h3>
                </div>

                {(data.relatedPeps || []).map((pep: any, index: number) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold text-sm text-gray-600">
                        Person {index + 1}
                      </span>
                      {data.relatedPeps.length > 1 && (
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
                          Relationship{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={pep.relationship || ""}
                          onValueChange={(value) =>
                            updateRelatedPep(index, "relationship", value)
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
                        <Label className="text-gray-800 font-semibold text-sm">
                          Identification No.{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Enter Identification No"
                          className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          value={pep.identificationNo || ""}
                          onChange={(e) =>
                            updateRelatedPep(
                              index,
                              "identificationNo",
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-sm">
                          PEP Category{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={pep.category || ""}
                          onValueChange={(value) =>
                            handleRelatedPepCategoryChange(index, value)
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
                                  `pep-cat-${idx}`;
                                const val = String(
                                  option.pep_category_pk_code || option.id,
                                );
                                const label =
                                  option.pep_category ||
                                  option.name ||
                                  "Unknown";
                                return (
                                  <SelectItem key={key} value={val}>
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
                        <Label className="text-gray-800 font-semibold text-sm">
                          PEP Sub Category
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={pep.subCategory || ""}
                          onValueChange={(v) =>
                            updateRelatedPep(index, "subCategory", v)
                          }
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
                                  `pep-rel-sub-${idx}`;
                                const val = String(
                                  option.pep_sub_category_pk_code || option.id,
                                );
                                const label =
                                  option.pep_sub_category ||
                                  option.name ||
                                  "Unknown";
                                return (
                                  <SelectItem key={key} value={val}>
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
                          id={`uploadId-${data.id || "owner"}-${index}`}
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
                            document
                              .getElementById(
                                `uploadId-${data.id || "owner"}-${index}`,
                              )
                              ?.click()
                          }
                        >
                          Choose File
                        </Button>
                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {pep.identificationProofName || "No file chosen"}
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

          {/* 5. Employment Status */}
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
                onValueChange={(v) => updateField("employmentStatus", v)}
                className="flex flex-col sm:flex-row gap-3 sm:gap-6 md:gap-8"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="employed"
                    id={`emp-${data.id || "owner"}`}
                  />
                  <Label
                    htmlFor={`emp-${data.id || "owner"}`}
                    className="font-normal cursor-pointer text-sm"
                  >
                    Employed
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="unemployed"
                    id={`unemp-${data.id || "owner"}`}
                  />
                  <Label
                    htmlFor={`unemp-${data.id || "owner"}`}
                    className="font-normal cursor-pointer text-sm"
                  >
                    Unemployed
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="self-employed"
                    id={`self-${data.id || "owner"}`}
                  />
                  <Label
                    htmlFor={`self-${data.id || "owner"}`}
                    className="font-normal cursor-pointer text-sm"
                  >
                    Self-employed
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {data.employmentStatus === "employed" && (
            <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
                Employment Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <div className="space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-sm">
                    Employee ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Enter ID"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={data.employeeId || ""}
                    onChange={(e) => updateField("employeeId", e.target.value)}
                  />
                </div>

                <div className="space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-sm">
                    Occupation <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.occupation}
                    onValueChange={(v) => updateField("occupation", v)}
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {occupationOptions.length > 0 ? (
                        occupationOptions.map((opt: any, i) => (
                          <SelectItem
                            key={i}
                            value={String(
                              opt.occ_name || opt.occupation || opt.name,
                            )}
                          >
                            {opt.occ_name || opt.occupation || opt.name}
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

                <div className="space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-sm">
                    Type of Employer <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.employerType}
                    onValueChange={(v) => updateField("employerType", v)}
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
                  <Label className="text-gray-800 font-semibold text-sm">
                    Designation <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.designation}
                    onValueChange={(v) => updateField("designation", v)}
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
                  <Label className="text-gray-800 font-semibold text-sm">
                    Grade <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.grade}
                    onValueChange={(v) => updateField("grade", v)}
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
                  <Label className="text-gray-800 font-semibold text-sm">
                    Organization Name <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.organizationName}
                    onValueChange={(v) => updateField("organizationName", v)}
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {organizationOptions.length > 0 ? (
                        organizationOptions.map((opt: any, i) => (
                          <SelectItem
                            key={i}
                            value={String(
                              opt.lgal_constitution_pk_code ||
                                opt.legal_const_pk_code ||
                                opt.id ||
                                i,
                            )}
                          >
                            {opt.lgal_constitution ||
                              opt.legal_const_name ||
                              opt.name}
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

                <div className="space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-sm">
                    Organization Location{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Enter Location"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={data.orgLocation || ""}
                    onChange={(e) => updateField("orgLocation", e.target.value)}
                  />
                </div>

                <div className="space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-sm">
                    Service Joining Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    max={today}
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={formatDateForInput(data.joiningDate)}
                    onChange={(e) => updateField("joiningDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-sm">
                    Nature of Service <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.serviceNature}
                    onValueChange={(v) => updateField("serviceNature", v)}
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
                  <Label className="text-gray-800 font-semibold text-sm">
                    Gross Annual Salary Income{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="Enter Annual Salary"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={data.annualSalary || ""}
                    onChange={(e) =>
                      updateField("annualSalary", e.target.value)
                    }
                  />
                </div>
              </div>

              {data.serviceNature === "contract" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Contract End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      min={today}
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      value={formatDateForInput(data.contractEndDate)}
                      onChange={(e) =>
                        updateField("contractEndDate", e.target.value)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Form Component ---

export function BusinessDetailsForm({
  onNext,
  onBack,
  formData,
}: BusinessDetailsFormProps) {
  // --- State Initialization ---

  const [businessData, setBusinessData] = useState({
    businessName: formData?.businessName || "",
    establishmentDate: formData?.establishmentDate || "",
    industryClassification: formData?.industryClassification || "",
    identificationType: formData?.identificationType || "",
    identificationNumber: formData?.identificationNumber || "",
    identificationIssueDate: formData?.identificationIssueDate || "",
    identificationExpiryDate: formData?.identificationExpiryDate || "",
    identificationProofFile: formData?.identificationProofFile || null,
    identificationProofFileName: formData?.identificationProofFileName || "",
    taxIdentifierType: formData?.taxIdentifierType || "",
    taxIdentifierNumber: formData?.taxIdentifierNumber || "",
    bankCurrentAccountNumber: formData?.bankCurrentAccountNumber || "",
    bankSavingAccountNumber: formData?.bankSavingAccountNumber || "",
    nameOfBank: formData?.nameOfBank || "",
    grossAnnualIncome: formData?.grossAnnualIncome || "",
    businessType: formData?.businessType || "",
  });

  const [businessAddress, setBusinessAddress] = useState({
    country: formData?.businessAddress?.country || "",
    dzongkhag: formData?.businessAddress?.dzongkhag || "",
    gewog: formData?.businessAddress?.gewog || "",
    villageStreet: formData?.businessAddress?.villageStreet || "",
    specificLocation: formData?.businessAddress?.specificLocation || "",
    contactNumber: formData?.businessAddress?.contactNumber || "",
    alternateContactNumber:
      formData?.businessAddress?.alternateContactNumber || "",
    email: formData?.businessAddress?.email || "",
  });

  const [attachments, setAttachments] = useState({
    familyTree: formData?.attachments?.familyTree || null,
    familyTreeName: formData?.attachments?.familyTreeName || "",
    supportingDoc: formData?.attachments?.supportingDoc || null,
    supportingDocName: formData?.attachments?.supportingDocName || "",
    declarationConsent: formData?.attachments?.declarationConsent || false,
  });

  const initialComprehensiveState = {
    id: Date.now(),
    shareholdingPercent: "",
    identificationType: "",
    identificationNo: "",
    salutation: "",
    applicantName: "",
    nationality: "",
    gender: "",
    identificationIssueDate: "",
    identificationExpiryDate: "",
    dateOfBirth: "",
    tpn: "",
    maritalStatus: "",
    spouseIdentificationNo: "",
    spouseName: "",
    spouseContact: "",
    bankName: "",
    bankAccount: "",
    passportPhoto: null,
    passportPhotoName: "",
    permCountry: "",
    permDzongkhag: "",
    permGewog: "",
    permVillage: "",
    permThram: "",
    permHouse: "",
    permAddressProof: null,
    permAddressProofName: "",
    currCountry: "",
    currDzongkhag: "",
    currGewog: "",
    currVillage: "",
    currFlat: "",
    currEmail: "",
    currContact: "",
    currAlternateContact: "",
    currAddressProof: null,
    currAddressProofName: "",
    pepPerson: "",
    pepCategory: "",
    pepSubCategory: "",
    identificationProof: null,
    identificationProofName: "",
    pepRelated: "",
    relatedPeps: [],
    employmentStatus: "",
    employeeId: "",
    occupation: "",
    employerType: "",
    designation: "",
    grade: "",
    organizationName: "",
    orgLocation: "",
    joiningDate: "",
    annualSalary: "",
    serviceNature: "",
    contractEndDate: "",
  };

  const [ownerData, setOwnerData] = useState(
    formData?.ownerData || { ...initialComprehensiveState },
  );

  const [partners, setPartners] = useState<any[]>(formData?.partners || []);

  const [ceo, setCeo] = useState(
    formData?.ceo || { ...initialComprehensiveState, id: "ceo-" + Date.now() },
  );
  const [boardMembers, setBoardMembers] = useState<any[]>(
    formData?.boardMembers || [],
  );
  const [shareholders, setShareholders] = useState<any[]>(
    formData?.shareholders || [],
  );
  const [trustees, setTrustees] = useState<any[]>(formData?.trustees || []);
  const [president, setPresident] = useState(
    formData?.president || {
      ...initialComprehensiveState,
      id: "pres-" + Date.now(),
    },
  );
  const [headOfAgency, setHeadOfAgency] = useState(
    formData?.headOfAgency || { ...initialComprehensiveState },
  );
  const [headOfNGO, setHeadOfNGO] = useState(
    formData?.headOfNGO || {
      ...initialComprehensiveState,
      id: "ngo-" + Date.now(),
    },
  );

  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([]);
  const [gewogOptions, setGewogOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<
    any[]
  >([]);
  const [banksOptions, setBanksOptions] = useState<any[]>([]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [country, dzongkhag, identificationType, banks] =
          await Promise.all([
            fetchCountry().catch(() => []),
            fetchDzongkhag().catch(() => []),
            fetchIdentificationType().catch(() => []),
            fetchBanks().catch(() => []),
          ]);
        setCountryOptions(country?.data?.data || country || []);
        setDzongkhagOptions(dzongkhag?.data?.data || dzongkhag || []);
        setIdentificationTypeOptions(
          identificationType?.data?.data || identificationType || [],
        );
        setBanksOptions(banks?.data?.data || banks || []);
      } catch (error) {
        console.error("Error loading form data:", error);
      }
    };
    loadAllData();
  }, []);

  const isBusinessBhutan = useMemo(() => {
    if (!businessAddress.country || countryOptions.length === 0) return false;
    const selected = countryOptions.find(
      (c: any) =>
        String(c.id || c.country_id || c.country_pk_code) ===
        String(businessAddress.country),
    );
    return (selected?.country_name || selected?.country || "")
      .toLowerCase()
      .includes("bhutan");
  }, [businessAddress.country, countryOptions]);

  useEffect(() => {
    if (isBusinessBhutan && businessAddress.dzongkhag) {
      fetchGewogsByDzongkhag(businessAddress.dzongkhag)
        .then((res) => setGewogOptions(res?.data?.data || res || []))
        .catch(() => setGewogOptions([]));
    } else {
      setGewogOptions([]);
    }
  }, [businessAddress.dzongkhag, isBusinessBhutan]);

  const handleBusinessDataChange = (field: string, value: any) => {
    setBusinessData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBusinessAddressChange = (field: string, value: any) => {
    setBusinessAddress((prev) => {
      const newState = { ...prev, [field]: value };
      if (field === "country") {
        newState.dzongkhag = "";
        newState.gewog = "";
        newState.villageStreet = "";
      }
      if (field === "dzongkhag") {
        newState.gewog = "";
      }
      return newState;
    });
  };

  // --- Partner/Shareholder Management Functions ---
  const handleAddPartner = () => {
    setPartners([
      ...partners,
      { ...initialComprehensiveState, id: Date.now() },
    ]);
  };

  const handleRemovePartner = (index: number) => {
    setPartners(partners.filter((_, i) => i !== index));
  };

  const handleUpdatePartner = (index: number, newData: any) => {
    const newPartners = [...partners];
    newPartners[index] = newData;
    setPartners(newPartners);
  };

  const handleAddShareholder = () => {
    setShareholders([
      ...shareholders,
      { ...initialComprehensiveState, id: "sh-" + Date.now() },
    ]);
  };

  const handleRemoveShareholder = (index: number) => {
    setShareholders(shareholders.filter((_, i) => i !== index));
  };

  const handleUpdateShareholder = (index: number, newData: any) => {
    const newSh = [...shareholders];
    newSh[index] = newData;
    setShareholders(newSh);
  };

  // --- Board Members Management ---
  const handleAddBoardMember = () => {
    setBoardMembers([
      ...boardMembers,
      { ...initialComprehensiveState, id: "bm-" + Date.now() },
    ]);
  };

  const handleRemoveBoardMember = (index: number) => {
    setBoardMembers(boardMembers.filter((_, i) => i !== index));
  };

  const handleUpdateBoardMember = (index: number, newData: any) => {
    const newBm = [...boardMembers];
    newBm[index] = newData;
    setBoardMembers(newBm);
  };

  // --- Trustee Management Functions ---
  const handleAddTrustee = () => {
    setTrustees([
      ...trustees,
      { ...initialComprehensiveState, id: "tr-" + Date.now() },
    ]);
  };

  const handleRemoveTrustee = (index: number) => {
    setTrustees(trustees.filter((_, i) => i !== index));
  };

  const handleUpdateTrustee = (index: number, newData: any) => {
    const newTr = [...trustees];
    newTr[index] = newData;
    setTrustees(newTr);
  };

  const handleFileChange = (
    section: "business" | "attachments",
    field: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (section === "business") {
        setBusinessData((prev) => ({
          ...prev,
          [`${field}File`]: file,
          [`${field}FileName`]: file.name,
        }));
      } else {
        setAttachments((prev) => ({
          ...prev,
          [field]: file,
          [`${field}Name`]: file.name,
        }));
      }
    }
  };

  const isFormValid = () => {
    if (
      !businessData.businessName ||
      !businessData.businessType ||
      !businessAddress.country
    )
      return false;
    return true;
  };

  const handleNext = () => {
    if (!isFormValid()) {
      alert("Please fill in all required fields.");
      return;
    }
    const data = {
      ...businessData,
      businessAddress,
      ownerData,
      partners,
      ceo,
      boardMembers,
      shareholders,
      trustees,
      president,
      headOfAgency,
      headOfNGO,
      attachments,
    };
    onNext(data);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* --- A. BUSINESS DETAILS --- */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
          A. BUSINESS DETAILS
        </h2>

        {/* A1. Business Identification & Financial */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-700">
            A1. Business Identification & Financial Information
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>
                Business / Agency Name <span className="text-red-500">*</span>
              </Label>
              <Input
                className={uniformStyle}
                value={businessData.businessName}
                onChange={(e) =>
                  handleBusinessDataChange("businessName", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                Business Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={businessData.businessType}
                onValueChange={(v) => {
                  handleBusinessDataChange("businessType", v);
                  if (v === "Partnership" && partners.length === 0)
                    handleAddPartner();
                  if (v === "Private Limited Company") {
                    if (shareholders.length === 0) handleAddShareholder();
                    if (boardMembers.length === 0) handleAddBoardMember();
                  }
                  if (v === "Public Limited Company") {
                    if (shareholders.length === 0) handleAddShareholder();
                    if (boardMembers.length === 0) handleAddBoardMember();
                  }
                  if (v === "Trust" && trustees.length === 0) {
                    handleAddTrustee();
                  }
                }}
              >
                <SelectTrigger className={uniformStyle}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Sole Proprietorship",
                    "Partnership",
                    "Private Limited Company",
                    "Public Limited Company",
                    "Trust",
                    "Association / Club",
                    "Government Body",
                    "NGO",
                  ].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Establishment Date <span className="text-red-500">*</span>
              </Label>
              <Input
                className={uniformStyle}
                type="date"
                value={formatDateForInput(businessData.establishmentDate)}
                onChange={(e) =>
                  handleBusinessDataChange("establishmentDate", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                Industry Classification <span className="text-red-500">*</span>
              </Label>
              <Input
                className={uniformStyle}
                value={businessData.industryClassification}
                onChange={(e) =>
                  handleBusinessDataChange(
                    "industryClassification",
                    e.target.value,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                Identification Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={businessData.identificationType}
                onValueChange={(v) =>
                  handleBusinessDataChange("identificationType", v)
                }
              >
                <SelectTrigger className={uniformStyle}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {identificationTypeOptions.map((opt: any, i) => (
                    <SelectItem
                      key={i}
                      value={String(
                        opt.id ||
                          opt.identification_type_id ||
                          opt.identity_type_pk_code,
                      )}
                    >
                      {opt.identification_type || opt.identity_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Identification Number <span className="text-red-500">*</span>
              </Label>
              <Input
                className={uniformStyle}
                value={businessData.identificationNumber}
                onChange={(e) =>
                  handleBusinessDataChange(
                    "identificationNumber",
                    e.target.value,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                Identification Issue Date{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                className={uniformStyle}
                type="date"
                value={formatDateForInput(businessData.identificationIssueDate)}
                onChange={(e) =>
                  handleBusinessDataChange(
                    "identificationIssueDate",
                    e.target.value,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>
                Identification Expiry Date{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                className={uniformStyle}
                type="date"
                value={formatDateForInput(
                  businessData.identificationExpiryDate,
                )}
                onChange={(e) =>
                  handleBusinessDataChange(
                    "identificationExpiryDate",
                    e.target.value,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                Upload Identification Proof{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div
                className={fileUploadStyle}
                onClick={() => document.getElementById("biz-id-proof")?.click()}
              >
                <span className="text-gray-500 truncate max-w-[200px]">
                  {businessData.identificationProofFileName ||
                    "No file selected"}
                </span>
                <div className="flex items-center text-[#003DA5] text-xs font-medium bg-blue-50 px-2 py-1 rounded">
                  <Upload className="h-3 w-3 mr-1" /> Upload
                </div>
              </div>
              <input
                id="biz-id-proof"
                type="file"
                className="hidden"
                onChange={(e) =>
                  handleFileChange("business", "identificationProof", e)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                Tax Identifier Type <span className="text-red-500">*</span>
              </Label>
              <Input
                className={uniformStyle}
                value={businessData.taxIdentifierType}
                onChange={(e) =>
                  handleBusinessDataChange("taxIdentifierType", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>
                Tax Identifier Number <span className="text-red-500">*</span>
              </Label>
              <Input
                className={uniformStyle}
                value={businessData.taxIdentifierNumber}
                onChange={(e) =>
                  handleBusinessDataChange(
                    "taxIdentifierNumber",
                    e.target.value,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                Name of Bank <span className="text-red-500">*</span>
              </Label>
              <Select
                value={businessData.nameOfBank}
                onValueChange={(v) => handleBusinessDataChange("nameOfBank", v)}
              >
                <SelectTrigger className={uniformStyle}>
                  <SelectValue placeholder="Select Bank" />
                </SelectTrigger>
                <SelectContent>
                  {banksOptions.map((option: any, index: number) => {
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
                      <SelectItem key={index} value={value}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bank Current Account Number</Label>
              <Input
                className={uniformStyle}
                value={businessData.bankCurrentAccountNumber}
                onChange={(e) =>
                  handleBusinessDataChange(
                    "bankCurrentAccountNumber",
                    e.target.value,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>
                Gross Annual Income <span className="text-red-500">*</span>
              </Label>
              <Input
                className={uniformStyle}
                type="number"
                value={businessData.grossAnnualIncome}
                onChange={(e) =>
                  handleBusinessDataChange("grossAnnualIncome", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* A2. Business Address */}
        <div className="space-y-6 pt-4 border-t">
          <h3 className="text-lg font-semibold text-gray-700">
            A2. Business Address
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>
                Country <span className="text-red-500">*</span>
              </Label>
              <Select
                value={businessAddress.country}
                onValueChange={(v) => handleBusinessAddressChange("country", v)}
              >
                <SelectTrigger className={uniformStyle}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((opt: any, i) => (
                    <SelectItem
                      key={i}
                      value={String(
                        opt.id || opt.country_id || opt.country_pk_code,
                      )}
                    >
                      {opt.country_name || opt.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {isBusinessBhutan ? "Dzongkhag" : "State"}{" "}
                <span className="text-red-500">*</span>
              </Label>

              {isBusinessBhutan ? (
                <Select
                  value={businessAddress.dzongkhag}
                  onValueChange={(v) =>
                    handleBusinessAddressChange("dzongkhag", v)
                  }
                  disabled={!businessAddress.country}
                >
                  <SelectTrigger className={uniformStyle}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {dzongkhagOptions.map((opt: any, i) => (
                      <SelectItem
                        key={i}
                        value={String(
                          opt.id ||
                            opt.pk_dzongkhag_id ||
                            opt.dzongkhag_pk_code,
                        )}
                      >
                        {opt.dzongkhag_name || opt.dzongkhag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className={uniformStyle}
                  placeholder="Enter State"
                  value={businessAddress.dzongkhag}
                  onChange={(e) =>
                    handleBusinessAddressChange("dzongkhag", e.target.value)
                  }
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>
                {isBusinessBhutan ? "Gewog" : "Province"}{" "}
                <span className="text-red-500">*</span>
              </Label>

              {isBusinessBhutan ? (
                <Select
                  value={businessAddress.gewog}
                  onValueChange={(v) => handleBusinessAddressChange("gewog", v)}
                  disabled={!businessAddress.dzongkhag}
                >
                  <SelectTrigger className={uniformStyle}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {gewogOptions.map((opt: any, i) => (
                      <SelectItem
                        key={i}
                        value={String(
                          opt.id || opt.pk_gewog_id || opt.gewog_pk_code,
                        )}
                      >
                        {opt.gewog_name || opt.gewog}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className={uniformStyle}
                  placeholder="Enter Province"
                  value={businessAddress.gewog}
                  onChange={(e) =>
                    handleBusinessAddressChange("gewog", e.target.value)
                  }
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>
                {isBusinessBhutan ? "Village / Street" : "Street"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                className={uniformStyle}
                placeholder={
                  isBusinessBhutan ? "Enter Village / Street" : "Enter Street"
                }
                value={businessAddress.villageStreet}
                onChange={(e) =>
                  handleBusinessAddressChange("villageStreet", e.target.value)
                }
                disabled={!businessAddress.country}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>
                Specific Area / Location <span className="text-red-500">*</span>
              </Label>
              <Input
                className={uniformStyle}
                value={businessAddress.specificLocation}
                onChange={(e) =>
                  handleBusinessAddressChange(
                    "specificLocation",
                    e.target.value,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                Contact Number <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                className={uniformStyle}
                value={businessAddress.contactNumber}
                onChange={(e) =>
                  handleBusinessAddressChange("contactNumber", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Alternate Contact Number</Label>
              <Input
                type="tel"
                className={uniformStyle}
                value={businessAddress.alternateContactNumber}
                onChange={(e) =>
                  handleBusinessAddressChange(
                    "alternateContactNumber",
                    e.target.value,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                className={uniformStyle}
                value={businessAddress.email}
                onChange={(e) =>
                  handleBusinessAddressChange("email", e.target.value)
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- B. OWNERSHIP / MANAGEMENT DETAILS --- */}
      {businessData.businessType && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
            B. OWNERSHIP & MANAGEMENT DETAILS
          </h2>

          {/* Sole Proprietorship */}
          {businessData.businessType === "Sole Proprietorship" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#003DA5]" /> Owner Personal
                Details
              </h3>
              <ComprehensiveOwnerDetails
                data={ownerData}
                onUpdate={setOwnerData}
                countryOptions={countryOptions}
                dzongkhagOptions={dzongkhagOptions}
                identificationTypeOptions={identificationTypeOptions}
                title="Owner Personal Information"
              />
            </div>
          )}

          {/* Partnership */}
          {businessData.businessType === "Partnership" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#003DA5]" /> Partners Personal
                  Details
                </h3>
                <Button
                  onClick={handleAddPartner}
                  className="bg-[#003DA5] hover:bg-[#002D7A]"
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Add Partner
                </Button>
              </div>

              {partners.map((partner, index) => (
                <ComprehensiveOwnerDetails
                  key={partner.id || index}
                  data={partner}
                  isPartner={true} // Shows Shareholding %
                  title={`Partner ${index + 1} Personal Details`}
                  onUpdate={(newData) => handleUpdatePartner(index, newData)}
                  onRemove={() => handleRemovePartner(index)}
                  countryOptions={countryOptions}
                  dzongkhagOptions={dzongkhagOptions}
                  identificationTypeOptions={identificationTypeOptions}
                />
              ))}
            </div>
          )}

          {/* Private Limited Company */}
          {businessData.businessType === "Private Limited Company" && (
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#003DA5]" /> 1. Shareholders
                    / Partners Personal Details
                  </h3>
                  <Button
                    onClick={handleAddShareholder}
                    className="bg-[#003DA5] hover:bg-[#002D7A]"
                  >
                    <UserPlus className="mr-2 h-4 w-4" /> Add Shareholder
                  </Button>
                </div>
                {shareholders.map((sh, idx) => (
                  <ComprehensiveOwnerDetails
                    key={sh.id || idx}
                    data={sh}
                    isPartner={true}
                    title={`Shareholder ${idx + 1} Information`}
                    onUpdate={(newData) =>
                      handleUpdateShareholder(idx, newData)
                    }
                    onRemove={() => handleRemoveShareholder(idx)}
                    countryOptions={countryOptions}
                    dzongkhagOptions={dzongkhagOptions}
                    identificationTypeOptions={identificationTypeOptions}
                  />
                ))}
              </div>

              <div className="space-y-6 pt-8 border-t border-dashed">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-[#003DA5]" /> 2. CEO
                  Personal Details
                </h3>
                <ComprehensiveOwnerDetails
                  data={ceo}
                  onUpdate={setCeo}
                  isPartner={true}
                  title="CEO Information"
                  countryOptions={countryOptions}
                  dzongkhagOptions={dzongkhagOptions}
                  identificationTypeOptions={identificationTypeOptions}
                />
              </div>

              <div className="space-y-6 pt-8 border-t border-dashed">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#003DA5]" /> 3. Board of
                    Directors Information
                  </h3>
                  <Button
                    onClick={handleAddBoardMember}
                    variant="outline"
                    className="border-[#003DA5] text-[#003DA5] hover:bg-blue-50"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Director
                  </Button>
                </div>
                {boardMembers.map((bm, idx) => (
                  <ComprehensiveOwnerDetails
                    key={bm.id || idx}
                    data={bm}
                    isPartner={true}
                    title={`Director ${idx + 1} Information`}
                    onUpdate={(newData) =>
                      handleUpdateBoardMember(idx, newData)
                    }
                    onRemove={() => handleRemoveBoardMember(idx)}
                    countryOptions={countryOptions}
                    dzongkhagOptions={dzongkhagOptions}
                    identificationTypeOptions={identificationTypeOptions}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Public Limited Company */}
          {businessData.businessType === "Public Limited Company" && (
            <div className="space-y-12">
              <div className="p-4 bg-blue-50 border-l-4 border-[#003DA5] text-sm text-[#003DA5] mb-6">
                <strong>Note:</strong> Please provide personal data for the CEO,
                all Board of Directors, and any individual shareholder holding
                more than 25% shareholding.
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#003DA5]" /> 1. Individual
                    Shareholders (&gt; 25% shareholding)
                  </h3>
                  <Button
                    onClick={handleAddShareholder}
                    className="bg-[#003DA5] hover:bg-[#002D7A]"
                  >
                    <UserPlus className="mr-2 h-4 w-4" /> Add Shareholder
                  </Button>
                </div>
                {shareholders.map((sh, idx) => (
                  <ComprehensiveOwnerDetails
                    key={sh.id || idx}
                    data={sh}
                    isPartner={true}
                    title={`Shareholder ${idx + 1} Information`}
                    onUpdate={(newData) =>
                      handleUpdateShareholder(idx, newData)
                    }
                    onRemove={() => handleRemoveShareholder(idx)}
                    countryOptions={countryOptions}
                    dzongkhagOptions={dzongkhagOptions}
                    identificationTypeOptions={identificationTypeOptions}
                  />
                ))}
              </div>

              <div className="space-y-6 pt-8 border-t border-dashed">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-[#003DA5]" /> 2. CEO
                  Personal Details
                </h3>
                <ComprehensiveOwnerDetails
                  data={ceo}
                  onUpdate={setCeo}
                  isPartner={true}
                  title="CEO Information"
                  countryOptions={countryOptions}
                  dzongkhagOptions={dzongkhagOptions}
                  identificationTypeOptions={identificationTypeOptions}
                />
              </div>

              <div className="space-y-6 pt-8 border-t border-dashed">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#003DA5]" /> 3. Board of
                    Directors Information
                  </h3>
                  <Button
                    onClick={handleAddBoardMember}
                    variant="outline"
                    className="border-[#003DA5] text-[#003DA5] hover:bg-blue-50"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Director
                  </Button>
                </div>
                {boardMembers.map((bm, idx) => (
                  <ComprehensiveOwnerDetails
                    key={bm.id || idx}
                    data={bm}
                    isPartner={true}
                    title={`Director ${idx + 1} Information`}
                    onUpdate={(newData) =>
                      handleUpdateBoardMember(idx, newData)
                    }
                    onRemove={() => handleRemoveBoardMember(idx)}
                    countryOptions={countryOptions}
                    dzongkhagOptions={dzongkhagOptions}
                    identificationTypeOptions={identificationTypeOptions}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Trust Details */}
          {businessData.businessType === "Trust" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#003DA5]" /> Trustees Personal
                  Details
                </h3>
                <Button
                  onClick={handleAddTrustee}
                  className="bg-[#003DA5] hover:bg-[#002D7A]"
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Add Trustee
                </Button>
              </div>

              {trustees.map((trustee, index) => (
                <ComprehensiveOwnerDetails
                  key={trustee.id || index}
                  data={trustee}
                  isPartner={false}
                  title={`Trustee ${index + 1} Personal Details`}
                  onUpdate={(newData) => handleUpdateTrustee(index, newData)}
                  onRemove={() => handleRemoveTrustee(index)}
                  countryOptions={countryOptions}
                  dzongkhagOptions={dzongkhagOptions}
                  identificationTypeOptions={identificationTypeOptions}
                />
              ))}
            </div>
          )}

          {/* Association / Club Details */}
          {businessData.businessType === "Association / Club" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#003DA5]" /> President
                Personal Details
              </h3>
              <ComprehensiveOwnerDetails
                data={president}
                onUpdate={setPresident}
                isPartner={false}
                title="President Information"
                countryOptions={countryOptions}
                dzongkhagOptions={dzongkhagOptions}
                identificationTypeOptions={identificationTypeOptions}
              />
            </div>
          )}

          {/* Government Body Head of Agency Details */}
          {businessData.businessType === "Government Body" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#003DA5]" /> Head of
                Government Agency Personal Details
              </h3>
              <ComprehensiveOwnerDetails
                data={headOfAgency}
                onUpdate={setHeadOfAgency}
                isPartner={false}
                title="Head of Agency Information"
                countryOptions={countryOptions}
                dzongkhagOptions={dzongkhagOptions}
                identificationTypeOptions={identificationTypeOptions}
              />
            </div>
          )}

          {/* NGO Head of NGO Details */}
          {businessData.businessType === "NGO" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#003DA5]" /> Head of NGO
                Personal Details
              </h3>
              <ComprehensiveOwnerDetails
                data={headOfNGO}
                onUpdate={setHeadOfNGO}
                isPartner={false}
                title="Head of NGO Personal Information"
                countryOptions={countryOptions}
                dzongkhagOptions={dzongkhagOptions}
                identificationTypeOptions={identificationTypeOptions}
              />
            </div>
          )}

          {/* Fallback */}
          {![
            "Sole Proprietorship",
            "Partnership",
            "Private Limited Company",
            "Public Limited Company",
            "Trust",
            "Association / Club",
            "Government Body",
            "NGO",
          ].includes(businessData.businessType) && (
            <div className="p-10 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 italic">
              Please provide personal details as required for{" "}
              {businessData.businessType} management.
            </div>
          )}
        </div>
      )}

      {/* --- Footer Buttons --- */}
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
          className="bg-[#003DA5] hover:bg-[#002D7A] text-white px-10 py-6 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
