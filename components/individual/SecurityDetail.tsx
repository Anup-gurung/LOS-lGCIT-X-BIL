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

// Import mapping utility and the Popup component
import { mapCustomerDataToForm } from "@/lib/mapCustomerData";
import DocumentPopup from "@/components/BILSearchStatus";

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

export function SecurityDetailsForm({
  onNext,
  onBack,
  formData,
}: SecurityDetailsFormProps) {
  const [data, setData] = useState(formData.securityDetails || formData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Guarantors state: Index 0 represents the first ADDITIONAL guarantor if needed,
  // but usually Guarantor 1 is in `data`.
  // We will initialize with one empty object for the "Additional Guarantors" section loop.
  const [guarantors, setGuarantors] = useState<any[]>([
    { isPep: "", relatedToPep: "" },
  ]);
  const [securities, setSecurities] = useState<any[]>([{}]);

  // Dropdown Options
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<
    any[]
  >([]);
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([]);
  const [permGewogOptions, setPermGewogOptions] = useState<any[]>([]);
  const [currGewogOptions, setCurrGewogOptions] = useState<any[]>([]);
  const [propertyGewogOptions, setPropertyGewogOptions] = useState<any[]>([]);

  // --- LOOKUP & POPUP STATE ---
  const [showLookupPopup, setShowLookupPopup] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<
    "searching" | "found" | "not_found"
  >("searching");
  const [fetchedCustomerData, setFetchedCustomerData] = useState<any>(null);
  // 'main' for Guarantor 1, number index for Additional Guarantors
  const [activeLookupContext, setActiveLookupContext] = useState<
    "main" | number | null
  >(null);

  // Calculate date constraints
  const today = new Date().toISOString().split("T")[0];
  const fifteenYearsAgo = new Date();
  fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
  const maxDobDate = fifteenYearsAgo.toISOString().split("T")[0];

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
      setData({ ...data, [fieldName]: file.name });
    }
  };

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

  // Sync with formData
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      const hasData = Object.values(formData).some((val) => {
        if (typeof val === "string") return val.trim() !== "";
        if (typeof val === "object" && val !== null)
          return Object.keys(val).length > 0;
        return val !== null && val !== undefined;
      });

      if (hasData) {
        setData((prev: any) => ({
          ...prev,
          ...formData.securityDetails,
          ...formData,
        }));
      }
    }
  }, [formData]);

  // Load Gewogs
  useEffect(() => {
    const loadPermGewogs = async () => {
      if (data.permDzongkhag) {
        try {
          const options = await fetchGewogsByDzongkhag(data.permDzongkhag);
          setPermGewogOptions(options);
        } catch (error) {
          console.error("Failed to load permanent gewogs:", error);
          setPermGewogOptions([]);
        }
      }
    };
    loadPermGewogs();
  }, [data.permDzongkhag]);

  useEffect(() => {
    const loadCurrGewogs = async () => {
      if (data.currDzongkhag) {
        try {
          const options = await fetchGewogsByDzongkhag(data.currDzongkhag);
          setCurrGewogOptions(options);
        } catch (error) {
          console.error("Failed to load current gewogs:", error);
          setCurrGewogOptions([]);
        }
      }
    };
    loadCurrGewogs();
  }, [data.currDzongkhag]);

  useEffect(() => {
    const loadPropertyGewogs = async () => {
      if (data.dzongkhag) {
        try {
          const options = await fetchGewogsByDzongkhag(data.dzongkhag);
          setPropertyGewogOptions(options);
        } catch (error) {
          console.error("Failed to load property gewogs:", error);
          setPropertyGewogOptions([]);
        }
      }
    };
    loadPropertyGewogs();
  }, [data.dzongkhag]);

  // --- IDENTITY CHECK LOGIC ---
  const handleIdentityCheck = async (context: "main" | number) => {
    let idType, idNo;

    if (context === "main") {
      idType = data.idType;
      idNo = data.idNumber;
    } else {
      // For additional guarantors (context is index in guarantors array)
      const guarantor = guarantors[context];
      idType = guarantor.idType;
      idNo = guarantor.idNumber;
    }

    if (!idType || !idNo || idNo.trim() === "") return;

    setActiveLookupContext(context);
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

  const handleLookupProceed = () => {
    if (lookupStatus === "found" && fetchedCustomerData) {
      const formattedData = {
        // Standard mapping from helper to form keys
        nationality: fetchedCustomerData.nationality
          ? String(fetchedCustomerData.nationality)
          : "",
        idIssueDate: formatDateForInput(
          fetchedCustomerData.identificationIssueDate,
        ),
        idExpiryDate: formatDateForInput(
          fetchedCustomerData.identificationExpiryDate,
        ),
        dateOfBirth: formatDateForInput(fetchedCustomerData.dateOfBirth),
        tpnNo: fetchedCustomerData.tpn || "",
        maritalStatus: fetchedCustomerData.maritalStatus
          ? String(fetchedCustomerData.maritalStatus)
          : "",
        gender: fetchedCustomerData.gender
          ? String(fetchedCustomerData.gender)
          : "",
        email: fetchedCustomerData.email || "",
        contact: fetchedCustomerData.contact || "",

        // Address
        permCountry: fetchedCustomerData.permCountry
          ? String(fetchedCustomerData.permCountry)
          : "",
        permDzongkhag: fetchedCustomerData.permDzongkhag
          ? String(fetchedCustomerData.permDzongkhag)
          : "",
        permGewog: fetchedCustomerData.permGewog
          ? String(fetchedCustomerData.permGewog)
          : "",
        permVillage: fetchedCustomerData.permVillage || "",
        currCountry: fetchedCustomerData.currCountry
          ? String(fetchedCustomerData.currCountry)
          : "",
        currDzongkhag: fetchedCustomerData.currDzongkhag
          ? String(fetchedCustomerData.currDzongkhag)
          : "",
        currGewog: fetchedCustomerData.currGewog
          ? String(fetchedCustomerData.currGewog)
          : "",
        currVillage: fetchedCustomerData.currVillage || "",
      };

      if (activeLookupContext === "main") {
        setData((prev: any) => ({
          ...prev,
          ...formattedData,
          coBorrowerName: fetchedCustomerData.name || prev.coBorrowerName, // Map name to coBorrowerName for G1
          salutation: fetchedCustomerData.salutation || prev.salutation,
          // Preserve ID fields
          idType: prev.idType,
          idNumber: prev.idNumber,
        }));
      } else if (typeof activeLookupContext === "number") {
        const updatedGuarantors = [...guarantors];
        updatedGuarantors[activeLookupContext] = {
          ...updatedGuarantors[activeLookupContext],
          ...formattedData,
          guarantorName:
            fetchedCustomerData.name ||
            updatedGuarantors[activeLookupContext].guarantorName,
          salutation:
            fetchedCustomerData.salutation ||
            updatedGuarantors[activeLookupContext].salutation,
          // Preserve ID fields
          idType: updatedGuarantors[activeLookupContext].idType,
          idNumber: updatedGuarantors[activeLookupContext].idNumber,
        };
        setGuarantors(updatedGuarantors);
      }
    }
    setShowLookupPopup(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ securityDetails: data, additionalGuarantors: guarantors });
  };

  const addGuarantor = () => {
    setGuarantors([...guarantors, { isPep: "", relatedToPep: "" }]);
  };

  const updateGuarantor = (index: number, field: string, value: string) => {
    const updatedGuarantors = [...guarantors];
    updatedGuarantors[index] = { ...updatedGuarantors[index], [field]: value };
    setGuarantors(updatedGuarantors);
  };

  const addSecurity = () => {
    setSecurities([...securities, {}]);
  };

  const removeGuarantor = (index: number) => {
    if (guarantors.length > 1) {
      setGuarantors(guarantors.filter((_, i) => i !== index));
    }
  };

  const removeSecurity = (index: number) => {
    if (securities.length > 1) {
      setSecurities(securities.filter((_, i) => i !== index));
    }
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
                    value={data.securityType || ""}
                    onValueChange={(value) =>
                      setData({ ...data, securityType: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                      <SelectItem value="building">Building</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="fd">Fixed Deposit</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="PPF">Pension & Provident Fund</SelectItem>
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
                    value={data.ownershipType || ""}
                    onValueChange={(value) =>
                      setData({ ...data, ownershipType: value })
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
            {data.securityType === "vehicle" && (

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
                    value={data.vehicleType || ""}
                    onValueChange={(value) =>
                      setData({ ...data, vehicleType: value })
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
                    value={data.vehicleMake || ""}
                    onChange={(e) =>
                      setData({ ...data, vehicleMake: e.target.value })
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
                    value={data.vehicleModel || ""}
                    onChange={(e) =>
                      setData({ ...data, vehicleModel: e.target.value })
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
                    value={data.vehicleYear || ""}
                    onChange={(e) =>
                      setData({ ...data, vehicleYear: e.target.value })
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
                    Registration No.
                  </Label>
                  <Input
                    id="registration-no"
                    placeholder="Enter Registration No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={data.registrationNo || ""}
                    onChange={(e) =>
                      setData({ ...data, registrationNo: e.target.value })
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
                    value={data.chassisNo || ""}
                    onChange={(e) =>
                      setData({ ...data, chassisNo: e.target.value })
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
                    value={data.engineNo || ""}
                    onChange={(e) =>
                      setData({ ...data, engineNo: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            )}
            {/* Property/Land Details */}
            {data.securityType === "land" && (
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
                    value={data.thramNo || ""}
                    onChange={(e) =>
                      setData({ ...data, thramNo: e.target.value })
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
                    value={data.plotNo || ""}
                    onChange={(e) =>
                      setData({ ...data, plotNo: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="area"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Area (in Sq. Ft) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="Enter Area"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={data.area || ""}
                    onChange={(e) => setData({ ...data, area: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="land-use"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Land Use Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.landUse || ""}
                    onValueChange={(value) =>
                      setData({ ...data, landUse: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="agricultural">Agricultural</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
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
                    value={data.dzongkhag}
                    onValueChange={(value) =>
                      setData({ ...data, dzongkhag: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {dzongkhagOptions.length > 0 ? (
                        dzongkhagOptions.map((option, index) => {
                          const key =
                            option.dzongkhag_pk_code ||
                            option.id ||
                            `sec-dzo-${index}`;
                          const value = String(
                            option.dzongkhag_pk_code || option.id || index,
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
                    value={data.gewog || ""}
                    onValueChange={(value) =>
                      setData({ ...data, gewog: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {propertyGewogOptions.length > 0 ? (
                        propertyGewogOptions.map((option, index) => {
                          const key =
                            option.gewog_pk_code ||
                            option.id ||
                            `prop-gewog-${index}`;
                          const value = String(
                            option.gewog_pk_code || option.id || index,
                          );
                          const label =
                            option.gewog || option.name || "Unknown";
                          return (
                            <SelectItem key={key} value={value}>
                              {label}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="loading" disabled>
                          {data.dzongkhag
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
                    value={data.village || ""}
                    onChange={(e) =>
                      setData({ ...data, village: e.target.value })
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
                    value={data.houseNo || ""}
                    onChange={(e) =>
                      setData({ ...data, houseNo: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            )}

            {/* Insurance Details */}
            {data.securityType === "insurance" && (
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
                    value={data.insuranceCompany || ""}
                    onValueChange={(value) =>
                      setData({ ...data, insuranceCompany: value })
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
                    value={data.policyNo || ""}
                    onChange={(e) =>
                      setData({ ...data, policyNo: e.target.value })
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
                    value={data.insuranceValue || ""}
                    onChange={(e) =>
                      setData({ ...data, insuranceValue: e.target.value })
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
                    value={data.insuranceStartDate || ""}
                    onChange={(e) =>
                      setData({ ...data, insuranceStartDate: e.target.value })
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
                    value={data.insuranceExpiryDate || ""}
                    onChange={(e) =>
                      setData({ ...data, insuranceExpiryDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>
            )}

            {/* Pension and  Provident Fund*/}
            {data.securityType === "PPF" && (
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
                    value={data.ppfInstitution || ""}
                    onChange={(e) =>
                      setData({ ...data, ppfInstitution: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2.5">
                  <Label
                    htmlFor="ppf-fund-no"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Provident Fund No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ppf-fund-no"
                    placeholder="Enter fund No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={data.ppfAccountNo || ""}
                    onChange={(e) =>
                      setData({ ...data, ppfAccountNo: e.target.value })
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
                    value={data.ppfAccountNo || ""}
                    onChange={(e) =>
                      setData({ ...data, ppfAccountNo: e.target.value })
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
                    value={data.ppfValue || ""}
                    onChange={(e) =>
                      setData({ ...data, ppfValue: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>
            )}


            {/* Share and  Security*/}
            {data.securityType === "Share" && (
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
                    value={data.shareCompany || ""}
                    onChange={(e) =>
                      setData({ ...data, shareCompany: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="share-CertificateNo"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Share Certificate Folio No <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="share-CertificateNo"
                    type="number"
                    placeholder="Enter Certificate No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={data.shareCertificateNo || ""}
                    onChange={(e) =>
                      setData({ ...data, shareCertificateNo: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="share-RegistrationNo"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Share Registration No  <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="share-Registration-No"
                    type="number"
                    placeholder="Enter Share Registration No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value ={data.shareRegistrationNo || ""}
                    onChange={(e) =>
                      setData({ ...data, shareRegistrationNo: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>
            
            )}

            {/* Stocks */}
            {data.securityType === "Stocks" && (
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
                    value={data.stockName || ""}
                    onChange={(e) =>
                      setData({ ...data, stockName: e.target.value })
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
                    value={data.stockQuantity || ""}
                    onChange={(e) =>
                      setData({ ...data, stockQuantity: e.target.value })
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
                    value={data.stockValue || ""}
                    onChange={(e) =>
                      setData({ ...data, stockValue: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
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

        {/* Guarantor sections - only show if ownership type is "third-party" */}
        {data.ownershipType === "third-party" && (
          <>
            {/* First Guarantor */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                Security Guarantor 1
              </h2>

              {/* Row 1: ID Type, ID Number, Salutation, Name */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="id-type"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Identification Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.idType}
                    onValueChange={(value) =>
                      setData({ ...data, idType: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {identificationTypeOptions.length > 0 ? (
                        identificationTypeOptions.map((option, index) => {
                          const key =
                            option.identity_type_pk_code ||
                            option.id ||
                            `id-${index}`;
                          const value = String(
                            option.identity_type_pk_code || option.id || index,
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

                <div className="space-y-2.5">
                  <Label
                    htmlFor="id-number"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Identification No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="id-number"
                    placeholder="Enter ID Number"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={data.idNumber || ""}
                    onChange={(e) =>
                      setData({ ...data, idNumber: e.target.value })
                    }
                    onBlur={() => handleIdentityCheck("main")}
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="salutation"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Salutation <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.salutation}
                    onValueChange={(value) =>
                      setData({ ...data, salutation: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="Select" />
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
                  <Label
                    htmlFor="co-borrower-name"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Guarantor Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="co-borrower-name"
                    placeholder="Enter Full Name"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={data.coBorrowerName || ""}
                    onChange={(e) =>
                      setData({ ...data, coBorrowerName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Row 2: Nationality, Issue Date, Expiry Date, DOB */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="nationality"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Nationality <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.nationality}
                    onValueChange={(value) =>
                      setData({ ...data, nationality: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {nationalityOptions.length > 0 ? (
                        nationalityOptions.map((option, index) => {
                          const key =
                            option.nationality_pk_code ||
                            option.id ||
                            `nationality-${index}`;
                          const value = String(
                            option.nationality_pk_code || option.id || index,
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

                <div className="space-y-2.5">
                  <Label
                    htmlFor="id-issue-date"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Issue Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="id-issue-date"
                    type="date"
                    max={today}
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={formatDateForInput(data.idIssueDate)}
                    onChange={(e) =>
                      setData({ ...data, idIssueDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="id-expiry-date"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Expiry Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="id-expiry-date"
                    type="date"
                    min={today}
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={formatDateForInput(data.idExpiryDate)}
                    onChange={(e) =>
                      setData({ ...data, idExpiryDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="dob"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    max={maxDobDate}
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={formatDateForInput(data.dateOfBirth)}
                    onChange={(e) =>
                      setData({ ...data, dateOfBirth: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Row 3: TPN, Marital Status, Gender, Spouse Name */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="tpn-no"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    TPN No
                  </Label>
                  <Input
                    id="tpn-no"
                    placeholder="Enter TPN Number"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={data.tpnNo || ""}
                    onChange={(e) =>
                      setData({ ...data, tpnNo: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="marital-status"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Marital Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.maritalStatus}
                    onValueChange={(value) =>
                      setData({ ...data, maritalStatus: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {maritalStatusOptions.length > 0 ? (
                        maritalStatusOptions.map((option, index) => {
                          const key =
                            option.marital_status_pk_code ||
                            option.id ||
                            `marital-${index}`;
                          const value = String(
                            option.marital_status_pk_code || option.id || index,
                          );
                          const label =
                            option.marital_status || option.name || "Unknown";
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
                    htmlFor="gender"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.gender}
                    onValueChange={(value) =>
                      setData({ ...data, gender: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="spouse-name"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Spouse Name
                  </Label>
                  <Input
                    id="spouse-name"
                    placeholder="Enter Spouse Name"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={data.spouseName || ""}
                    onChange={(e) =>
                      setData({ ...data, spouseName: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Row 4: Spouse CID, Spouse Contact, Family Tree Upload */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="spouse-cid"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Spouse CID No
                  </Label>
                  <Input
                    id="spouse-cid"
                    placeholder="Enter Spouse CID"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={data.spouseCid || ""}
                    onChange={(e) =>
                      setData({ ...data, spouseCid: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="spouse-contact"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Spouse Contact No
                  </Label>
                  <Input
                    id="spouse-contact"
                    placeholder="Enter Contact Number"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={data.spouseContact || ""}
                    onChange={(e) =>
                      setData({ ...data, spouseContact: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="family-tree"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Upload Family Tree
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="family-tree-input"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) =>
                        handleFileChange(
                          "familyTree",
                          e.target.files?.[0] || null,
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("family-tree-input")?.click()
                      }
                      className="h-12 w-32 bg-white border-gray-300 hover:bg-gray-50 hover:border-[#FF9800]"
                    >
                      Choose File
                    </Button>
                    <span className="text-sm text-gray-600">
                      {data.familyTree || "No file chosen"}
                    </span>
                  </div>
                  {errors.familyTree && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.familyTree}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Permanent Address */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                Permanent Address
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="perm-country"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.permCountry}
                    onValueChange={(value) =>
                      setData({ ...data, permCountry: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {countryOptions.length > 0 ? (
                        countryOptions.map((option, index) => {
                          const key =
                            option.country_pk_code ||
                            option.id ||
                            `perm-country-${index}`;
                          const value = String(
                            option.country_pk_code || option.id || index,
                          );
                          const label =
                            option.country || option.name || "Unknown";
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
                    htmlFor="perm-dzongkhag"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    {data.permCountry &&
                    countryOptions.find(
                      (c) =>
                        String(c.country_pk_code) === data.permCountry &&
                        (c.country || c.name || "")
                          .toLowerCase()
                          .includes("bhutan"),
                    )
                      ? "Dzongkhag"
                      : "State"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  {data.permCountry &&
                  !countryOptions.find(
                    (c) =>
                      String(c.country_pk_code) === data.permCountry &&
                      (c.country || c.name || "")
                        .toLowerCase()
                        .includes("bhutan"),
                  ) ? (
                    <Input
                      id="perm-dzongkhag"
                      placeholder="Enter State"
                      value={data.permDzongkhag || ""}
                      onChange={(e) =>
                        setData({ ...data, permDzongkhag: e.target.value })
                      }
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    />
                  ) : (
                    <Select
                      value={data.permDzongkhag || ""}
                      onValueChange={(value) =>
                        setData({ ...data, permDzongkhag: value })
                      }
                      disabled={
                        !data.permCountry ||
                        !countryOptions.find(
                          (c) =>
                            String(c.country_pk_code) === data.permCountry &&
                            (c.country || c.name || "")
                              .toLowerCase()
                              .includes("bhutan"),
                        )
                      }
                    >
                      <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                        <SelectValue placeholder="Select Dzongkhag" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
                        {dzongkhagOptions.length > 0 ? (
                          dzongkhagOptions.map((option, index) => {
                            const key =
                              option.dzongkhag_pk_code ||
                              option.id ||
                              `perm-dzo-${index}`;
                            const value = String(
                              option.dzongkhag_pk_code || option.id || index,
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

                <div className="space-y-2.5">
                  <Label
                    htmlFor="perm-gewog"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    {data.permCountry &&
                    countryOptions.find(
                      (c) =>
                        String(c.country_pk_code) === data.permCountry &&
                        (c.country || c.name || "")
                          .toLowerCase()
                          .includes("bhutan"),
                    )
                      ? "Gewog"
                      : "Province"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  {data.permCountry &&
                  !countryOptions.find(
                    (c) =>
                      String(c.country_pk_code) === data.permCountry &&
                      (c.country || c.name || "")
                        .toLowerCase()
                        .includes("bhutan"),
                  ) ? (
                    <Input
                      id="perm-gewog"
                      placeholder="Enter Province"
                      value={data.permGewog || ""}
                      onChange={(e) =>
                        setData({ ...data, permGewog: e.target.value })
                      }
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    />
                  ) : (
                    <Select
                      value={data.permGewog || ""}
                      onValueChange={(value) =>
                        setData({ ...data, permGewog: value })
                      }
                      disabled={
                        !data.permCountry ||
                        !countryOptions.find(
                          (c) =>
                            String(c.country_pk_code) === data.permCountry &&
                            (c.country || c.name || "")
                              .toLowerCase()
                              .includes("bhutan"),
                        )
                      }
                    >
                      <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                        <SelectValue placeholder="Select Gewog" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
                        {permGewogOptions.length > 0 ? (
                          permGewogOptions.map((option, index) => {
                            const key =
                              option.gewog_pk_code ||
                              option.id ||
                              `perm-gewog-${index}`;
                            const value = String(
                              option.gewog_pk_code || option.id || index,
                            );
                            const label =
                              option.gewog || option.name || "Unknown";
                            return (
                              <SelectItem key={key} value={value}>
                                {label}
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="loading" disabled>
                            {data.permDzongkhag
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
                <div className="space-y-2.5">
                  <Label
                    htmlFor="perm-village"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    {data.permCountry &&
                    countryOptions.find(
                      (c) =>
                        String(c.country_pk_code) === data.permCountry &&
                        (c.country || c.name || "")
                          .toLowerCase()
                          .includes("bhutan"),
                    )
                      ? "Village/Street"
                      : "Street"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="perm-village"
                    placeholder={
                      data.permCountry &&
                      countryOptions.find(
                        (c) =>
                          String(c.country_pk_code) === data.permCountry &&
                          (c.country || c.name || "")
                            .toLowerCase()
                            .includes("bhutan"),
                      )
                        ? "Enter Village/Street"
                        : "Enter Street"
                    }
                    value={data.permVillage || ""}
                    onChange={(e) =>
                      setData({ ...data, permVillage: e.target.value })
                    }
                    disabled={!data.permCountry}
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  />
                </div>

                {/* Thram and House fields - only for Bhutan */}
                {data.permCountry &&
                  countryOptions.find(
                    (c) =>
                      String(c.country_pk_code) === data.permCountry &&
                      (c.country || c.name || "")
                        .toLowerCase()
                        .includes("bhutan"),
                  ) && (
                    <>
                      <div className="space-y-2.5">
                        <Label
                          htmlFor="perm-thram"
                          className="text-gray-800 font-semibold text-sm"
                        >
                          Thram No
                        </Label>
                        <Input
                          id="perm-thram"
                          placeholder="Enter Thram No"
                          value={
                            !data.permCountry ||
                            !countryOptions.find(
                              (c) =>
                                String(c.country_pk_code) ===
                                  data.permCountry &&
                                (c.country || c.name || "")
                                  .toLowerCase()
                                  .includes("bhutan"),
                            )
                              ? ""
                              : data.permThram || ""
                          }
                          onChange={(e) =>
                            setData({ ...data, permThram: e.target.value })
                          }
                          disabled={
                            !data.permCountry ||
                            !countryOptions.find(
                              (c) =>
                                String(c.country_pk_code) ===
                                  data.permCountry &&
                                (c.country || c.name || "")
                                  .toLowerCase()
                                  .includes("bhutan"),
                            )
                          }
                          className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label
                          htmlFor="perm-house"
                          className="text-gray-800 font-semibold text-sm"
                        >
                          House No
                        </Label>
                        <Input
                          id="perm-house"
                          placeholder="Enter House No"
                          value={
                            !data.permCountry ||
                            !countryOptions.find(
                              (c) =>
                                String(c.country_pk_code) ===
                                  data.permCountry &&
                                (c.country || c.name || "")
                                  .toLowerCase()
                                  .includes("bhutan"),
                            )
                              ? ""
                              : data.permHouse || ""
                          }
                          onChange={(e) =>
                            setData({ ...data, permHouse: e.target.value })
                          }
                          disabled={
                            !data.permCountry ||
                            !countryOptions.find(
                              (c) =>
                                String(c.country_pk_code) ===
                                  data.permCountry &&
                                (c.country || c.name || "")
                                  .toLowerCase()
                                  .includes("bhutan"),
                            )
                          }
                          className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        />
                      </div>
                    </>
                  )}
              </div>

              {data.permCountry &&
                !countryOptions.find(
                  (c) =>
                    String(c.country_pk_code) === data.permCountry &&
                    (c.country || c.name || "")
                      .toLowerCase()
                      .includes("bhutan"),
                ) && (
                  <div className="space-y-2.5 mt-4">
                    <Label
                      htmlFor="perm-address-proof"
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Upload Address Proof Document{" "}
                      <span className="text-red-500">*</span>
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
                    <p className="text-xs text-muted-foreground">
                      Please upload a valid address proof document for
                      non-Bhutan residence
                    </p>
                  </div>
                )}
            </div>

            {/* Current/Residential Address */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                Current/Residential Address
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="curr-country"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.currCountry}
                    onValueChange={(value) =>
                      setData({ ...data, currCountry: value })
                    }
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {countryOptions.length > 0 ? (
                        countryOptions.map((option, index) => {
                          const key =
                            option.country_pk_code ||
                            option.id ||
                            `curr-country-${index}`;
                          const value = String(
                            option.country_pk_code || option.id || index,
                          );
                          const label =
                            option.country || option.name || "Unknown";
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
                    htmlFor="curr-dzongkhag"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    {data.currCountry &&
                    countryOptions.find(
                      (c) =>
                        String(c.country_pk_code) === data.currCountry &&
                        (c.country || c.name || "")
                          .toLowerCase()
                          .includes("bhutan"),
                    )
                      ? "Dzongkhag"
                      : "State"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  {data.currCountry &&
                  !countryOptions.find(
                    (c) =>
                      String(c.country_pk_code) === data.currCountry &&
                      (c.country || c.name || "")
                        .toLowerCase()
                        .includes("bhutan"),
                  ) ? (
                    <Input
                      id="curr-dzongkhag"
                      placeholder="Enter State"
                      value={data.currDzongkhag || ""}
                      onChange={(e) =>
                        setData({ ...data, currDzongkhag: e.target.value })
                      }
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    />
                  ) : (
                    <Select
                      value={data.currDzongkhag || ""}
                      onValueChange={(value) =>
                        setData({ ...data, currDzongkhag: value })
                      }
                      disabled={
                        !data.currCountry ||
                        !countryOptions.find(
                          (c) =>
                            String(c.country_pk_code) === data.currCountry &&
                            (c.country || c.name || "")
                              .toLowerCase()
                              .includes("bhutan"),
                        )
                      }
                    >
                      <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                        <SelectValue placeholder="Select Dzongkhag" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
                        {dzongkhagOptions.length > 0 ? (
                          dzongkhagOptions.map((option, index) => {
                            const key =
                              option.dzongkhag_pk_code ||
                              option.id ||
                              `curr-dzo-${index}`;
                            const value = String(
                              option.dzongkhag_pk_code || option.id || index,
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

                <div className="space-y-2.5">
                  <Label
                    htmlFor="curr-gewog"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    {data.currCountry &&
                    countryOptions.find(
                      (c) =>
                        String(c.country_pk_code) === data.currCountry &&
                        (c.country || c.name || "")
                          .toLowerCase()
                          .includes("bhutan"),
                    )
                      ? "Gewog"
                      : "Province"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  {data.currCountry &&
                  !countryOptions.find(
                    (c) =>
                      String(c.country_pk_code) === data.currCountry &&
                      (c.country || c.name || "")
                        .toLowerCase()
                        .includes("bhutan"),
                  ) ? (
                    <Input
                      id="curr-gewog"
                      placeholder="Enter Province"
                      value={data.currGewog || ""}
                      onChange={(e) =>
                        setData({ ...data, currGewog: e.target.value })
                      }
                      className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    />
                  ) : (
                    <Select
                      value={data.currGewog || ""}
                      onValueChange={(value) =>
                        setData({ ...data, currGewog: value })
                      }
                      disabled={
                        !data.currCountry ||
                        !countryOptions.find(
                          (c) =>
                            String(c.country_pk_code) === data.currCountry &&
                            (c.country || c.name || "")
                              .toLowerCase()
                              .includes("bhutan"),
                        )
                      }
                    >
                      <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                        <SelectValue placeholder="Select Gewog" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
                        {currGewogOptions.length > 0 ? (
                          currGewogOptions.map((option, index) => {
                            const key =
                              option.gewog_pk_code ||
                              option.id ||
                              `curr-gewog-${index}`;
                            const value = String(
                              option.gewog_pk_code || option.id || index,
                            );
                            const label =
                              option.gewog || option.name || "Unknown";
                            return (
                              <SelectItem key={key} value={value}>
                                {label}
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="loading" disabled>
                            {data.currDzongkhag
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
                <div className="space-y-2.5">
                  <Label
                    htmlFor="curr-village"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    {data.currCountry &&
                    countryOptions.find(
                      (c) =>
                        String(c.country_pk_code) === data.currCountry &&
                        (c.country || c.name || "")
                          .toLowerCase()
                          .includes("bhutan"),
                    )
                      ? "Village/Street"
                      : "Street"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="curr-village"
                    placeholder={
                      data.currCountry &&
                      countryOptions.find(
                        (c) =>
                          String(c.country_pk_code) === data.currCountry &&
                          (c.country || c.name || "")
                            .toLowerCase()
                            .includes("bhutan"),
                      )
                        ? "Enter Village/Street"
                        : "Enter Street"
                    }
                    value={data.currVillage || ""}
                    onChange={(e) =>
                      setData({ ...data, currVillage: e.target.value })
                    }
                    disabled={!data.currCountry}
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="curr-house"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    House/Flat No
                  </Label>
                  <Input
                    id="curr-house"
                    placeholder="Enter House/Flat No"
                    value={
                      !data.currCountry ||
                      !countryOptions.find(
                        (c) =>
                          String(c.country_pk_code) === data.currCountry &&
                          (c.country || c.name || "")
                            .toLowerCase()
                            .includes("bhutan"),
                      )
                        ? ""
                        : data.currHouse || ""
                    }
                    onChange={(e) =>
                      setData({ ...data, currHouse: e.target.value })
                    }
                    disabled={
                      !data.currCountry ||
                      !countryOptions.find(
                        (c) =>
                          String(c.country_pk_code) === data.currCountry &&
                          (c.country || c.name || "")
                            .toLowerCase()
                            .includes("bhutan"),
                      )
                    }
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="email"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter Email Address"
                    value={data.email || ""}
                    onChange={(e) =>
                      setData({ ...data, email: e.target.value })
                    }
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="contact"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contact"
                    placeholder="Enter Contact Number"
                    value={data.contact || ""}
                    onChange={(e) =>
                      setData({ ...data, contact: e.target.value })
                    }
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  />
                </div>
              </div>

              {data.currCountry &&
                !countryOptions.find(
                  (c) =>
                    String(c.country_pk_code) === data.currCountry &&
                    (c.country || c.name || "")
                      .toLowerCase()
                      .includes("bhutan"),
                ) && (
                  <div className="space-y-2.5 mt-4">
                    <Label
                      htmlFor="curr-address-proof"
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Upload Address Proof Document{" "}
                      <span className="text-red-500">*</span>
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
                    <p className="text-xs text-muted-foreground">
                      Please upload a valid address proof document for
                      non-Bhutan residence
                    </p>
                  </div>
                )}
            </div>

            {/* PEP Declaration */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                PEP Declaration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="is-pep"
                    className="text-gray-800 font-semibold text-sm min-h-[40px] flex items-end pb-1"
                  >
                    Politically Exposed Person{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.isPep}
                    onValueChange={(value) =>
                      setData({ ...data, isPep: value })
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
                    htmlFor="pep-sub-category"
                    className="text-gray-800 font-semibold text-sm min-h-[44px] flex items-end pb-1"
                  >
                    PEP Sub Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.isPep === "yes" ? data.pepSubCategory : ""}
                    onValueChange={(value) =>
                      setData({ ...data, pepSubCategory: value })
                    }
                    disabled={data.isPep !== "yes"}
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      <SelectItem value="head-of-state">
                        Head of State/Government
                      </SelectItem>
                      <SelectItem value="senior-politician">
                        Senior Politician
                      </SelectItem>
                      <SelectItem value="senior-government">
                        Senior Government Official
                      </SelectItem>
                      <SelectItem value="judicial">
                        Senior Judicial Official
                      </SelectItem>
                      <SelectItem value="military">
                        Senior Military Official
                      </SelectItem>
                      <SelectItem value="state-enterprise">
                        Senior State Enterprise Executive
                      </SelectItem>
                      <SelectItem value="political-party">
                        Political Party Official
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="related-to-pep"
                    className="text-gray-800 font-semibold text-sm min-h-[40px] flex items-end pb-1"
                  >
                    Are you related to any PEP?{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={data.isPep === "no" ? data.relatedToPep : ""}
                    onValueChange={(value) =>
                      setData({ ...data, relatedToPep: value })
                    }
                    disabled={data.isPep !== "no"}
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

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="pep-relationship"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Relationship <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={
                      data.isPep === "no" && data.relatedToPep === "yes"
                        ? data.pepRelationship
                        : ""
                    }
                    onValueChange={(value) =>
                      setData({ ...data, pepRelationship: value })
                    }
                    disabled={
                      data.isPep !== "no" || data.relatedToPep !== "yes"
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
                    htmlFor="pep-id-no"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Identification No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pep-id-no"
                    placeholder="Enter Identification No"
                    value={
                      data.isPep === "no" && data.relatedToPep === "yes"
                        ? data.pepIdNo || ""
                        : ""
                    }
                    onChange={(e) =>
                      setData({ ...data, pepIdNo: e.target.value })
                    }
                    disabled={
                      data.isPep !== "no" || data.relatedToPep !== "yes"
                    }
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="pep-category"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    PEP Category <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pep-category"
                    placeholder="Enter Full Name"
                    value={
                      data.isPep === "no" && data.relatedToPep === "yes"
                        ? data.pepCategory || ""
                        : ""
                    }
                    onChange={(e) =>
                      setData({ ...data, pepCategory: e.target.value })
                    }
                    disabled={
                      data.isPep !== "no" || data.relatedToPep !== "yes"
                    }
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="pep-sub-cat-2"
                    className="text-gray-800 font-semibold text-sm"
                  >
                    PEP Sub Category <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pep-sub-cat-2"
                    placeholder="Enter Full Name"
                    value={
                      data.isPep === "no" && data.relatedToPep === "yes"
                        ? data.pepSubCat2 || ""
                        : ""
                    }
                    onChange={(e) =>
                      setData({ ...data, pepSubCat2: e.target.value })
                    }
                    disabled={
                      data.isPep !== "no" || data.relatedToPep !== "yes"
                    }
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="pep-upload"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Upload Identification Proof{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="pep-upload"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={
                      data.isPep !== "no" || data.relatedToPep !== "yes"
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-28 bg-transparent"
                    onClick={() =>
                      document.getElementById("pep-upload")?.click()
                    }
                    disabled={
                      data.isPep !== "no" || data.relatedToPep !== "yes"
                    }
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {data.isPep === "no" && data.relatedToPep === "yes"
                      ? data.pepUpload || "No file chosen"
                      : "No file chosen"}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Guarantors */}
            {guarantors.slice(1).map((guarantor, index) => (
              <div key={index + 1} className="space-y-8">
                {/* Guarantor Details */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 space-y-8 shadow-sm">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <h2 className="text-2xl font-bold text-[#003DA5]">
                      Guarantor {index + 2}
                    </h2>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeGuarantor(index + 1)}
                    >
                      Remove
                    </Button>
                  </div>

                  {/* Row 1: ID Type, ID Number, Salutation, Name */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`id-type-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Identification Type{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.idType || ""}
                        onValueChange={(value) =>
                          updateGuarantor(index + 1, "idType", value)
                        }
                      >
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {identificationTypeOptions.length > 0 ? (
                            identificationTypeOptions.map((option, idx) => {
                              // FIXED: Standardized to match the first guarantor logic
                              const key =
                                option.identity_type_pk_code ||
                                option.id ||
                                `add-id-${idx}`;
                              const value = String(
                                option.identity_type_pk_code ||
                                  option.id ||
                                  idx,
                              );
                              const label =
                                option.identity_type ||
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
                        htmlFor={`id-number-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Identification No.{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter ID Number"
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.idNumber || ""}
                        onChange={(e) =>
                          updateGuarantor(index + 1, "idNumber", e.target.value)
                        }
                        onBlur={() => handleIdentityCheck(index + 1)}
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`salutation-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Salutation <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.salutation || ""}
                        onValueChange={(value) =>
                          updateGuarantor(index + 1, "salutation", value)
                        }
                      >
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="Select" />
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
                      <Label
                        htmlFor={`guarantor-name-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Guarantor Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Full Name"
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.guarantorName || ""}
                        onChange={(e) =>
                          updateGuarantor(
                            index + 1,
                            "guarantorName",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Row 2: Nationality, Issue Date, Expiry Date, DOB */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`nationality-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Nationality <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.nationality || ""}
                        onValueChange={(value) =>
                          updateGuarantor(index + 1, "nationality", value)
                        }
                      >
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {nationalityOptions.length > 0 ? (
                            nationalityOptions.map((option, idx) => (
                              <SelectItem
                                key={idx}
                                value={String(
                                  option.nationality_pk_code || idx,
                                )}
                              >
                                {option.nationality || option.name || "Unknown"}
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
                      <Label
                        htmlFor={`id-issue-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Issue Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        max={today}
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.idIssueDate || ""}
                        onChange={(e) =>
                          updateGuarantor(
                            index + 1,
                            "idIssueDate",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`id-expiry-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Expiry Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        min={today}
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.idExpiryDate || ""}
                        onChange={(e) =>
                          updateGuarantor(
                            index + 1,
                            "idExpiryDate",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`dob-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Date of Birth <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        max={maxDobDate}
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.dateOfBirth || ""}
                        onChange={(e) =>
                          updateGuarantor(
                            index + 1,
                            "dateOfBirth",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Row 3: TPN, Marital Status, Gender, Spouse Name */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`tpn-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        TPN No
                      </Label>
                      <Input
                        placeholder="Enter TPN Number"
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.tpnNo || ""}
                        onChange={(e) =>
                          updateGuarantor(index + 1, "tpnNo", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`marital-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Marital Status <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.maritalStatus || ""}
                        onValueChange={(value) =>
                          updateGuarantor(index + 1, "maritalStatus", value)
                        }
                      >
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {maritalStatusOptions.length > 0 ? (
                            maritalStatusOptions.map((option, idx) => (
                              <SelectItem
                                key={idx}
                                value={String(
                                  option.marital_status_pk_code || idx,
                                )}
                              >
                                {option.marital_status ||
                                  option.name ||
                                  "Unknown"}
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
                      <Label
                        htmlFor={`gender-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Gender <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.gender || ""}
                        onValueChange={(value) =>
                          updateGuarantor(index + 1, "gender", value)
                        }
                      >
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`spouse-name-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Spouse Name
                      </Label>
                      <Input
                        placeholder="Enter Spouse Name"
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.spouseName || ""}
                        onChange={(e) =>
                          updateGuarantor(
                            index + 1,
                            "spouseName",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Row 4: Spouse CID, Spouse Contact, Family Tree Upload */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`spouse-cid-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Spouse CID No
                      </Label>
                      <Input
                        placeholder="Enter Spouse CID"
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.spouseCid || ""}
                        onChange={(e) =>
                          updateGuarantor(
                            index + 1,
                            "spouseCid",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`spouse-contact-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Spouse Contact No
                      </Label>
                      <Input
                        placeholder="Enter Contact Number"
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.spouseContact || ""}
                        onChange={(e) =>
                          updateGuarantor(
                            index + 1,
                            "spouseContact",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`family-tree-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Upload Family Tree
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          id={`family-tree-input-${index + 1}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document
                              .getElementById(`family-tree-input-${index + 1}`)
                              ?.click()
                          }
                          className="h-12 w-32 bg-white border-gray-300 hover:bg-gray-50 hover:border-[#FF9800]"
                        >
                          Choose File
                        </Button>
                        <span className="text-sm text-gray-600">
                          No file chosen
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permanent Address for Additional Guarantor */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 space-y-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                    Permanent Address - Guarantor {index + 2}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`perm-country-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.permCountry || ""}
                        onValueChange={(value) =>
                          updateGuarantor(index + 1, "permCountry", value)
                        }
                      >
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {countryOptions.length > 0 ? (
                            countryOptions.map((option, idx) => (
                              <SelectItem
                                key={idx}
                                value={String(option.country_pk_code || idx)}
                              >
                                {option.country || option.name || "Unknown"}
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
                      <Label
                        htmlFor={`perm-dzongkhag-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Dzongkhag/State <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.permDzongkhag || ""}
                        onValueChange={(value) =>
                          updateGuarantor(index + 1, "permDzongkhag", value)
                        }
                      >
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {dzongkhagOptions.length > 0 ? (
                            dzongkhagOptions.map((option, idx) => (
                              <SelectItem
                                key={idx}
                                value={String(option.dzongkhag_pk_code || idx)}
                              >
                                {option.dzongkhag || option.name || "Unknown"}
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
                      <Label
                        htmlFor={`perm-gewog-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Gewog/Province <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.permGewog || ""}
                        onValueChange={(value) =>
                          updateGuarantor(index + 1, "permGewog", value)
                        }
                      >
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          <SelectItem value="loading" disabled>
                            Select Dzongkhag first
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`perm-village-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Village/Street <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Village/Street"
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.permVillage || ""}
                        onChange={(e) =>
                          updateGuarantor(
                            index + 1,
                            "permVillage",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`perm-thram-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Thram No
                      </Label>
                      <Input
                        placeholder="Enter Thram No"
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.permThram || ""}
                        onChange={(e) =>
                          updateGuarantor(
                            index + 1,
                            "permThram",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`perm-house-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        House No
                      </Label>
                      <Input
                        placeholder="Enter House No"
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.permHouse || ""}
                        onChange={(e) =>
                          updateGuarantor(
                            index + 1,
                            "permHouse",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Current/Residential Address for Additional Guarantor */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 space-y-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                    Current/Residential Address - Guarantor {index + 2}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`curr-country-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.currCountry || ""}
                        onValueChange={(value) =>
                          updateGuarantor(index + 1, "currCountry", value)
                        }
                      >
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {countryOptions.length > 0 ? (
                            countryOptions.map((option, idx) => (
                              <SelectItem
                                key={idx}
                                value={String(option.country_pk_code || idx)}
                              >
                                {option.country || option.name || "Unknown"}
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
                      <Label
                        htmlFor={`curr-dzongkhag-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Dzongkhag/State <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.currDzongkhag || ""}
                        onValueChange={(value) =>
                          updateGuarantor(index + 1, "currDzongkhag", value)
                        }
                      >
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {dzongkhagOptions.length > 0 ? (
                            dzongkhagOptions.map((option, idx) => (
                              <SelectItem
                                key={idx}
                                value={String(option.dzongkhag_pk_code || idx)}
                              >
                                {option.dzongkhag || option.name || "Unknown"}
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
                      <Label
                        htmlFor={`curr-gewog-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Gewog/Province <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.currGewog || ""}
                        onValueChange={(value) =>
                          updateGuarantor(index + 1, "currGewog", value)
                        }
                      >
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          <SelectItem value="loading" disabled>
                            Select Dzongkhag first
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`curr-village-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Village/Street <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Village/Street"
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.currVillage || ""}
                        onChange={(e) =>
                          updateGuarantor(
                            index + 1,
                            "currVillage",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`curr-house-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        House/Flat No
                      </Label>
                      <Input
                        placeholder="Enter House/Flat No"
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.currHouse || ""}
                        onChange={(e) =>
                          updateGuarantor(
                            index + 1,
                            "currHouse",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`email-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="Enter Email Address"
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.email || ""}
                        onChange={(e) =>
                          updateGuarantor(index + 1, "email", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`contact-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Contact Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Contact Number"
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        value={guarantor.contact || ""}
                        onChange={(e) =>
                          updateGuarantor(index + 1, "contact", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* PEP Declaration for Additional Guarantor */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 space-y-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                    PEP Declaration - Guarantor {index + 2}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`is-pep-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm min-h-[40px] flex items-end pb-1"
                      >
                        Politically Exposed Person{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.isPep || ""}
                        onValueChange={(value) =>
                          updateGuarantor(index + 1, "isPep", value)
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
                        htmlFor={`pep-sub-category-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm min-h-[40px] flex items-end pb-1"
                      >
                        PEP Sub Category <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={
                          guarantor.isPep === "yes"
                            ? guarantor.pepSubCategory || ""
                            : ""
                        }
                        onValueChange={(value) =>
                          updateGuarantor(index + 1, "pepSubCategory", value)
                        }
                        disabled={guarantor.isPep !== "yes"}
                      >
                        <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          <SelectItem value="head-of-state">
                            Head of State/Government
                          </SelectItem>
                          <SelectItem value="senior-politician">
                            Senior Politician
                          </SelectItem>
                          <SelectItem value="senior-government">
                            Senior Government Official
                          </SelectItem>
                          <SelectItem value="judicial">
                            Senior Judicial Official
                          </SelectItem>
                          <SelectItem value="military">
                            Senior Military Official
                          </SelectItem>
                          <SelectItem value="state-enterprise">
                            Senior State Enterprise Executive
                          </SelectItem>
                          <SelectItem value="political-party">
                            Political Party Official
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`related-to-pep-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm min-h-[40px] flex items-end pb-1"
                      >
                        Are you related to any PEP?{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={
                          guarantor.isPep === "no"
                            ? guarantor.relatedToPep || ""
                            : ""
                        }
                        onValueChange={(value) =>
                          updateGuarantor(index + 1, "relatedToPep", value)
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

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`pep-relationship-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Relationship <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={
                          guarantor.isPep === "no" &&
                          guarantor.relatedToPep === "yes"
                            ? guarantor.pepRelationship || ""
                            : ""
                        }
                        onValueChange={(value) =>
                          updateGuarantor(index + 1, "pepRelationship", value)
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
                        htmlFor={`pep-id-no-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        Identification No.{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Identification No"
                        value={
                          guarantor.isPep === "no" &&
                          guarantor.relatedToPep === "yes"
                            ? guarantor.pepIdNo || ""
                            : ""
                        }
                        onChange={(e) =>
                          updateGuarantor(index + 1, "pepIdNo", e.target.value)
                        }
                        disabled={
                          guarantor.isPep !== "no" ||
                          guarantor.relatedToPep !== "yes"
                        }
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`pep-category-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        PEP Category <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Full Name"
                        value={
                          guarantor.isPep === "no" &&
                          guarantor.relatedToPep === "yes"
                            ? guarantor.pepCategory || ""
                            : ""
                        }
                        onChange={(e) =>
                          updateGuarantor(
                            index + 1,
                            "pepCategory",
                            e.target.value,
                          )
                        }
                        disabled={
                          guarantor.isPep !== "no" ||
                          guarantor.relatedToPep !== "yes"
                        }
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor={`pep-sub-cat-2-${index + 1}`}
                        className="text-gray-800 font-semibold text-sm"
                      >
                        PEP Sub Category <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Full Name"
                        value={
                          guarantor.isPep === "no" &&
                          guarantor.relatedToPep === "yes"
                            ? guarantor.pepSubCat2 || ""
                            : ""
                        }
                        onChange={(e) =>
                          updateGuarantor(
                            index + 1,
                            "pepSubCat2",
                            e.target.value,
                          )
                        }
                        disabled={
                          guarantor.isPep !== "no" ||
                          guarantor.relatedToPep !== "yes"
                        }
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label
                      htmlFor={`pep-upload-${index + 1}`}
                      className="text-gray-800 font-semibold text-sm"
                    >
                      Upload Identification Proof{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id={`pep-upload-${index + 1}`}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
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
                        onClick={() =>
                          document
                            .getElementById(`pep-upload-${index + 1}`)
                            ?.click()
                        }
                        disabled={
                          guarantor.isPep !== "no" ||
                          guarantor.relatedToPep !== "yes"
                        }
                      >
                        Choose File
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {guarantor.isPep === "no" &&
                        guarantor.relatedToPep === "yes"
                          ? guarantor.pepUpload || "No file chosen"
                          : "No file chosen"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

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
    </>
  );
}