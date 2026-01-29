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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Import mapping utility and the Popup component
import { mapCustomerDataToForm } from "@/lib/mapCustomerData";
import DocumentPopup from "@/components/BILSearchStatus"; // Adjust path if needed

import {
  fetchMaritalStatus,
  fetchNationality,
  fetchIdentificationType,
  fetchCountry,
  fetchDzongkhag,
  fetchGewogsByDzongkhag,
  fetchOccupations,
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

export function CoBorrowerDetailsForm({
  onNext,
  onBack,
  formData,
}: CoBorrowerDetailsFormProps) {
  const [data, setData] = useState(
    formData.coBorrowerDetails || formData || {},
  );
  const [coBorrowers, setCoBorrowers] = useState<any[]>(
    formData.coBorrowers || [{}],
  );

  // Lookup & Popup States
  const [showLookupPopup, setShowLookupPopup] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<
    "searching" | "found" | "not_found"
  >("searching");
  const [fetchedCustomerData, setFetchedCustomerData] = useState<any>(null);

  // Dropdown States
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([]);
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<
    any[]
  >([]);
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([]);
  const [permGewogOptions, setPermGewogOptions] = useState<any[]>([]);
  const [currGewogOptions, setCurrGewogOptions] = useState<any[]>([]);
  const [occupationOptions, setOccupationOptions] = useState<any[]>([]);
  const [pepSubCategoryOptions, setPepSubCategoryOptions] = useState<any[]>([]);
  const [pepCategoryOptions, setPepCategoryOptions] = useState<any[]>([]);
  const [relatedPepSubCategoryOptions, setRelatedPepSubCategoryOptions] =
    useState<any[]>([]);

  useEffect(() => {
    // Load all initial API data
    const loadAllData = async () => {
      try {
        const [
          maritalStatus,
          nationality,
          identificationType,
          country,
          dzongkhag,
          occupations,
          pepCategories,
        ] = await Promise.all([
          fetchMaritalStatus().catch(() => []),
          fetchNationality().catch(() => []),
          fetchIdentificationType().catch(() => []),
          fetchCountry().catch(() => []),
          fetchDzongkhag().catch(() => []),
          fetchOccupations().catch(() => []),
          (async () => {
            try {
              const options = await fetchPepCategory();
              if (!options || options.length === 0) {
                throw new Error("Empty PEP categories list");
              }
              return options;
            } catch (error) {
              console.error("Failed to load PEP categories:", error);
              return [
                { pep_category_pk_code: "14001", pep_category: "Foreign PEP" },
                { pep_category_pk_code: "14002", pep_category: "Domestic PEP" },
                {
                  pep_category_pk_code: "14003",
                  pep_category: "International Organization PEP",
                },
                {
                  pep_category_pk_code: "14004",
                  pep_category: "Family Member of PEP",
                },
                {
                  pep_category_pk_code: "14005",
                  pep_category: "Close Associate of PEP",
                },
              ];
            }
          })(),
        ]);

        setMaritalStatusOptions(maritalStatus);
        setNationalityOptions(nationality);
        setIdentificationTypeOptions(identificationType);
        setCountryOptions(country);
        setDzongkhagOptions(dzongkhag);
        setOccupationOptions(occupations);
        setPepCategoryOptions(pepCategories);
      } catch (error) {
        console.error("Failed to load dropdown data:", error);
      }
    };

    loadAllData();
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

      if (hasData) {
        setData((prev: any) => ({
          ...prev,
          ...formData.coBorrowerDetails,
          ...formData,
        }));
      }
    }
    console.log("data test", data);
  }, [formData]);

  // Load permanent gewogs
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

  // Load current gewogs
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

  // Load PEP sub-categories
  useEffect(() => {
    const loadPepSubCategories = async () => {
      if (data.pepPerson === "yes") {
        try {
          const options = await fetchPepSubCategoryByCategory("14003");
          if (!options || options.length === 0) {
            throw new Error("Empty PEP sub-category list");
          }
          setPepSubCategoryOptions(options);
        } catch (error) {
          console.error("Failed to load PEP sub-categories:", error);
          setPepSubCategoryOptions([]);
        }
      } else {
        setPepSubCategoryOptions([]);
      }
    };
    loadPepSubCategories();
  }, [data.pepPerson]);

  // Load Related PEP sub-categories
  useEffect(() => {
    const loadRelatedSubCategories = async () => {
      if (
        data.pepPerson === "no" &&
        data.pepRelated === "yes" &&
        data.pepCategory
      ) {
        try {
          const options = await fetchPepSubCategoryByCategory(
            String(data.pepCategory),
          );
          if (!options || options.length === 0) {
            throw new Error("Empty related PEP sub-category list");
          }
          setRelatedPepSubCategoryOptions(options);
        } catch (error) {
          console.error("Failed to load related PEP sub-categories:", error);
          setRelatedPepSubCategoryOptions([]);
        }
      } else {
        setRelatedPepSubCategoryOptions([]);
      }
    };
    loadRelatedSubCategories();
  }, [data.pepPerson, data.pepRelated, data.pepCategory]);

  // --- AUTOMATIC LOOKUP LOGIC ---
  const handleIdentityCheck = async () => {
    const idType = data.identificationType;
    const idNo = data.identificationNo;

    // Only proceed if both fields are filled
    if (!idType || !idNo || idNo.trim() === "") return;

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result?.success && result?.data) {
        // Map the existing data to match the form structure
        // Pass the correct structure to the mapper. If mapCustomerDataToForm handles 'result', pass 'result'.
        // If it handles 'result.data', pass that. Usually mappers handle the data object.
        const mappedData = mapCustomerDataToForm(result);

        // // Store in sessionStorage for form auto-population
        // sessionStorage.setItem(
        //   "verifiedCoBorrowerData",
        //   JSON.stringify(mappedData),
        // );

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
      // Prepare sanitized data to ensure it populates the form correctly
      const sanitizedData = {
        ...fetchedCustomerData,
        // Ensure dates are in YYYY-MM-DD format for input fields
        identificationIssueDate: formatDateForInput(
          fetchedCustomerData.identificationIssueDate,
        ),
        identificationExpiryDate: formatDateForInput(
          fetchedCustomerData.identificationExpiryDate,
        ),
        dateOfBirth: formatDateForInput(fetchedCustomerData.dateOfBirth),

        // Ensure dropdown values are strings (API often returns numbers)
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
        occupation: fetchedCustomerData.occupation
          ? String(fetchedCustomerData.occupation)
          : "",
      };

      // Merge fetched data into current state, keeping the ID info that was just typed
      setData((prev: any) => ({
        ...prev,
        ...fetchedCustomerData,
        // Explicitly preserve ID fields to prevent overwrite if API returns slightly different keys
        identificationType: prev.identificationType,
        identificationNo: prev.identificationNo,
      }));

      console.log("fetchedCustomerData data data", fetchedCustomerData);
    }
    console.log("original data ", data);

    setShowLookupPopup(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ coBorrowerDetails: data, coBorrowers });
  };

  const addCoBorrower = () => {
    setCoBorrowers([...coBorrowers, {}]);
  };

  const removeCoBorrower = (index: number) => {
    const updatedCoBorrowers = coBorrowers.filter((_, i) => i !== index);
    setCoBorrowers(updatedCoBorrowers);
  };

  const updateCoBorrower = (index: number, field: string, value: any) => {
    const updatedCoBorrowers = [...coBorrowers];
    updatedCoBorrowers[index] = {
      ...updatedCoBorrowers[index],
      [field]: value,
    };
    setCoBorrowers(updatedCoBorrowers);
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Co-Borrower Personal Information */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-md hover:shadow-lg transition-shadow duration-200">
          <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
            Co-Borrower Personal Information
          </h2>

          {/* Identification Fields Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="co-identificationType"
                className="text-gray-800 font-semibold text-sm"
              >
                Identification Type <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={data.identificationType}
                  onValueChange={(value) => {
                    setData({ ...data, identificationType: value });
                    // Optional: You could trigger search here if ID No is already filled
                  }}
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
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
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-identificationNo"
                className="text-gray-800 font-semibold text-sm"
              >
                Identification No. <span className="text-destructive">*</span>
              </Label>
              <Input
                id="co-identificationNo"
                placeholder="Enter identification No"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={data.identificationNo || ""}
                onChange={(e) =>
                  setData({ ...data, identificationNo: e.target.value })
                }
                // TRIGGER: Trigger the API search when user clicks away/tabs out of the input
                onBlur={handleIdentityCheck}
                required
              />
            </div>
          </div>

          {/* Secondary Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="co-salutation"
                className="text-gray-800 font-semibold text-sm"
              >
                Salutation <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={data.salutation}
                  onValueChange={(value) =>
                    setData({ ...data, salutation: value })
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
                htmlFor="co-name"
                className="text-gray-800 font-semibold text-sm"
              >
                Co-Borrower Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="co-name"
                placeholder="Enter Full Name"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={data.name || ""}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-nationality"
                className="text-gray-800 font-semibold text-sm"
              >
                Nationality <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={data.nationality ? String(data.nationality) : ""}
                  onValueChange={(value) =>
                    setData({ ...data, nationality: value })
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
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
            </div>

                        <div className="space-y-2.5">
              <Label
                htmlFor="co-gender"
                className="text-gray-800 font-semibold text-sm"
              >
                Gender <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={data.gender}
                  onValueChange={(value) => setData({ ...data, gender: value })}
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
                htmlFor="co-identificationIssueDate"
                className="text-gray-800 font-semibold text-sm"
              >
                Issue Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                id="co-identificationIssueDate"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={formatDateForInput(data.identificationIssueDate)}
                onChange={(e) =>
                  setData({ ...data, identificationIssueDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-identificationExpiryDate"
                className="text-gray-800 font-semibold text-sm"
              >
                Expiry Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                id="co-identificationExpiryDate"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={formatDateForInput(data.identificationExpiryDate)}
                onChange={(e) =>
                  setData({ ...data, identificationExpiryDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-dateOfBirth"
                className="text-gray-800 font-semibold text-sm"
              >
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                id="co-dateOfBirth"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={formatDateForInput(data.dateOfBirth)}
                onChange={(e) =>
                  setData({ ...data, dateOfBirth: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-tpn"
                className="text-gray-800 font-semibold text-sm"
              >
                TPN No <span className="text-destructive">*</span>
              </Label>
              <Input
                id="co-tpn"
                placeholder="Enter TPN"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={data.tpn || ""}
                onChange={(e) => setData({ ...data, tpn: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Final Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="co-maritalStatus"
                className="text-gray-800 font-semibold text-sm"
              >
                Marital Status <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={data.maritalStatus ? String(data.maritalStatus) : ""}
                  onValueChange={(value) =>
                    setData({ ...data, maritalStatus: value })
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
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
            </div>


            <div className="space-y-2.5">
              <Label
                htmlFor="co-relationship"
                className="text-gray-800 font-semibold text-sm"
              >
                Relationship to Borrower{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={data.relationship}
                  onValueChange={(value) =>
                    setData({ ...data, relationship: value })
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
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-md hover:shadow-lg transition-shadow duration-200">
          <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
            Contact Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="co-email"
                className="text-gray-800 font-semibold text-sm"
              >
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="co-email"
                type="email"
                placeholder="Enter Email"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={data.email || ""}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-contact"
                className="text-gray-800 font-semibold text-sm"
              >
                Contact Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="co-contact"
                placeholder="Enter Contact No"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={data.contact || ""}
                onChange={(e) => setData({ ...data, contact: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-alternateContact"
                className="text-gray-800 font-semibold text-sm"
              >
                Alternate Contact Number
              </Label>
              <Input
                id="co-alternateContact"
                placeholder="Enter Contact No"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={data.alternateContact || ""}
                onChange={(e) =>
                  setData({ ...data, alternateContact: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Permanent Address */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-md hover:shadow-lg transition-shadow duration-200">
          <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
            Permanent Address
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="co-permCountry"
                className="text-gray-800 font-semibold text-sm"
              >
                Country <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={data.permCountry ? String(data.permCountry) : ""}
                  onValueChange={(value) =>
                    setData({ ...data, permCountry: value })
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
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
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-permDzongkhag"
                className="text-gray-800 font-semibold text-sm"
              >
                {data.permCountry &&
                countryOptions.find(
                  (c) =>
                    String(c.country_pk_code) === String(data.permCountry) &&
                    (c.country || c.name || "")
                      .toLowerCase()
                      .includes("bhutan"),
                )
                  ? "Dzongkhag"
                  : "State"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              {data.permCountry &&
              !countryOptions.find(
                (c) =>
                  String(c.country_pk_code) === String(data.permCountry) &&
                  (c.country || c.name || "").toLowerCase().includes("bhutan"),
              ) ? (
                <Input
                  id="co-permDzongkhag"
                  placeholder="Enter State"
                  className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={data.permDzongkhag || ""}
                  onChange={(e) =>
                    setData({ ...data, permDzongkhag: e.target.value })
                  }
                />
              ) : (
                <div className="w-full h-12" style={{ minHeight: "48px" }}>
                  <Select
                    value={data.permDzongkhag ? String(data.permDzongkhag) : ""}
                    onValueChange={(value) =>
                      setData({ ...data, permDzongkhag: value })
                    }
                    disabled={
                      !data.permCountry ||
                      !countryOptions.find(
                        (c) =>
                          String(c.country_pk_code) ===
                            String(data.permCountry) &&
                          (c.country || c.name || "")
                            .toLowerCase()
                            .includes("bhutan"),
                      )
                    }
                  >
                    <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-permGewog"
                className="text-gray-800 font-semibold text-sm"
              >
                {data.permCountry &&
                countryOptions.find(
                  (c) =>
                    String(c.country_pk_code) === String(data.permCountry) &&
                    (c.country || c.name || "")
                      .toLowerCase()
                      .includes("bhutan"),
                )
                  ? "Gewog"
                  : "Province"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              {data.permCountry &&
              !countryOptions.find(
                (c) =>
                  String(c.country_pk_code) === String(data.permCountry) &&
                  (c.country || c.name || "").toLowerCase().includes("bhutan"),
              ) ? (
                <Input
                  id="co-permGewog"
                  placeholder="Enter Province"
                  className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={data.permGewog || ""}
                  onChange={(e) =>
                    setData({ ...data, permGewog: e.target.value })
                  }
                />
              ) : (
                <div className="w-full h-12" style={{ minHeight: "48px" }}>
                  <Select
                    value={data.permGewog ? String(data.permGewog) : ""}
                    onValueChange={(value) =>
                      setData({ ...data, permGewog: value })
                    }
                    disabled={
                      !data.permCountry ||
                      !countryOptions.find(
                        (c) =>
                          String(c.country_pk_code) ===
                            String(data.permCountry) &&
                          (c.country || c.name || "")
                            .toLowerCase()
                            .includes("bhutan"),
                      )
                    }
                  >
                    <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-permVillage"
                className="text-gray-800 font-semibold text-sm"
              >
                {data.permCountry &&
                countryOptions.find(
                  (c) =>
                    String(c.country_pk_code) === String(data.permCountry) &&
                    (c.country || c.name || "")
                      .toLowerCase()
                      .includes("bhutan"),
                )
                  ? "Village/Street"
                  : "Street"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="co-permVillage"
                placeholder={
                  data.permCountry &&
                  countryOptions.find(
                    (c) =>
                      String(c.country_pk_code) === String(data.permCountry) &&
                      (c.country || c.name || "")
                        .toLowerCase()
                        .includes("bhutan"),
                  )
                    ? "Enter Village/Street"
                    : "Enter Street"
                }
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={data.permVillage || ""}
                onChange={(e) =>
                  setData({ ...data, permVillage: e.target.value })
                }
                disabled={!data.permCountry}
              />
            </div>
          </div>

       {/* Conditional grid - show Thram and House only for Bhutan */}
        {data.permCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <Label htmlFor="permThram" className="text-gray-800 font-semibold text-sm">
              Thram No. <span className="text-red-500">*</span>
            </Label>
            <Input
              id="permThram"
              placeholder="Enter Thram No"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.permCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? data.permThram || "" : ''}
              onChange={(e) => setData({ ...data, permThram: e.target.value })}
              disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="permHouse" className="text-gray-800 font-semibold text-sm">
              House No. <span className="text-red-500">*</span>
            </Label>
            <Input
              id="permHouse"
              placeholder="Enter House No"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.permCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? data.permHouse || "" : ''}
              onChange={(e) => setData({ ...data, permHouse: e.target.value })}
              disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            />
          </div>
        </div>
        )}
        
          {data.permCountry &&
            !countryOptions.find(
              (c) =>
                String(c.country_pk_code) === String(data.permCountry) &&
                (c.country || c.name || "").toLowerCase().includes("bhutan"),
            ) && (
              <div className="space-y-2.5 mt-4">
                <Label
                  htmlFor="co-permAddressProof"
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
                    className="h-12 w-32 rounded-lg bg-white hover:bg-gray-50 border-gray-300 font-medium transition-all"
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    No file chosen
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Please upload a valid address proof document for non-Bhutan
                  residence
                </p>
              </div>
            )}
        </div>

        {/* Current Address */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-md hover:shadow-lg transition-shadow duration-200">
          <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
            Current/Residential Address
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="co-currCountry"
                className="text-gray-800 font-semibold text-sm"
              >
                Country of Resident <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={data.currCountry ? String(data.currCountry) : ""}
                  onValueChange={(value) =>
                    setData({ ...data, currCountry: value })
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
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
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-currDzongkhag"
                className="text-gray-800 font-semibold text-sm"
              >
                {data.currCountry &&
                countryOptions.find(
                  (c) =>
                    String(c.country_pk_code) === String(data.currCountry) &&
                    (c.country || c.name || "")
                      .toLowerCase()
                      .includes("bhutan"),
                )
                  ? "Dzongkhag"
                  : "State"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              {data.currCountry &&
              !countryOptions.find(
                (c) =>
                  String(c.country_pk_code) === String(data.currCountry) &&
                  (c.country || c.name || "").toLowerCase().includes("bhutan"),
              ) ? (
                <Input
                  id="co-currDzongkhag"
                  placeholder="Enter State"
                  className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={data.currDzongkhag || ""}
                  onChange={(e) =>
                    setData({ ...data, currDzongkhag: e.target.value })
                  }
                />
              ) : (
                <div className="w-full h-12" style={{ minHeight: "48px" }}>
                  <Select
                    value={data.currDzongkhag ? String(data.currDzongkhag) : ""}
                    onValueChange={(value) =>
                      setData({ ...data, currDzongkhag: value })
                    }
                    disabled={
                      !data.currCountry ||
                      !countryOptions.find(
                        (c) =>
                          String(c.country_pk_code) ===
                            String(data.currCountry) &&
                          (c.country || c.name || "")
                            .toLowerCase()
                            .includes("bhutan"),
                      )
                    }
                  >
                    <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-currGewog"
                className="text-gray-800 font-semibold text-sm"
              >
                {data.currCountry &&
                countryOptions.find(
                  (c) =>
                    String(c.country_pk_code) === String(data.currCountry) &&
                    (c.country || c.name || "")
                      .toLowerCase()
                      .includes("bhutan"),
                )
                  ? "Gewog"
                  : "Province"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              {data.currCountry &&
              !countryOptions.find(
                (c) =>
                  String(c.country_pk_code) === String(data.currCountry) &&
                  (c.country || c.name || "").toLowerCase().includes("bhutan"),
              ) ? (
                <Input
                  id="co-currGewog"
                  placeholder="Enter Province"
                  className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={data.currGewog || ""}
                  onChange={(e) =>
                    setData({ ...data, currGewog: e.target.value })
                  }
                />
              ) : (
                <div className="w-full h-12" style={{ minHeight: "48px" }}>
                  <Select
                    value={data.currGewog ? String(data.currGewog) : ""}
                    onValueChange={(value) =>
                      setData({ ...data, currGewog: value })
                    }
                    disabled={
                      !data.currCountry ||
                      !countryOptions.find(
                        (c) =>
                          String(c.country_pk_code) ===
                            String(data.currCountry) &&
                          (c.country || c.name || "")
                            .toLowerCase()
                            .includes("bhutan"),
                      )
                    }
                  >
                    <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-currVillage"
                className="text-gray-800 font-semibold text-sm"
              >
                {data.currCountry &&
                countryOptions.find(
                  (c) =>
                    String(c.country_pk_code) === String(data.currCountry) &&
                    (c.country || c.name || "")
                      .toLowerCase()
                      .includes("bhutan"),
                )
                  ? "Village/Street"
                  : "Street"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="co-currVillage"
                placeholder={
                  data.currCountry &&
                  countryOptions.find(
                    (c) =>
                      String(c.country_pk_code) === String(data.currCountry) &&
                      (c.country || c.name || "")
                        .toLowerCase()
                        .includes("bhutan"),
                  )
                    ? "Enter Village/Street"
                    : "Enter Street"
                }
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={data.currVillage || ""}
                onChange={(e) =>
                  setData({ ...data, currVillage: e.target.value })
                }
                disabled={!data.currCountry}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="co-currFlat"
                className="text-gray-800 font-semibold text-sm"
              >
                House/Building/Flat No{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="co-currFlat"
                placeholder="Enter Flat No"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={
                  !data.currCountry ||
                  !countryOptions.find(
                    (c) =>
                      String(c.country_pk_code) === String(data.currCountry) &&
                      (c.country || c.name || "")
                        .toLowerCase()
                        .includes("bhutan"),
                  )
                    ? ""
                    : data.currFlat || ""
                }
                onChange={(e) => setData({ ...data, currFlat: e.target.value })}
                disabled={
                  !data.currCountry ||
                  !countryOptions.find(
                    (c) =>
                      String(c.country_pk_code) === String(data.currCountry) &&
                      (c.country || c.name || "")
                        .toLowerCase()
                        .includes("bhutan"),
                  )
                }
              />
            </div>
          </div>

          {data.currCountry &&
            !countryOptions.find(
              (c) =>
                String(c.country_pk_code) === String(data.currCountry) &&
                (c.country || c.name || "").toLowerCase().includes("bhutan"),
            ) && (
              <div className="space-y-2.5 mt-4">
                <Label
                  htmlFor="co-currAddressProof"
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
                    className="h-12 w-32 rounded-lg bg-white hover:bg-gray-50 border-gray-300 font-medium transition-all"
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    No file chosen
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Please upload a valid address proof document for non-Bhutan
                  residence
                </p>
              </div>
            )}
        </div>

        {/* PEP Declaration */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-md hover:shadow-lg transition-shadow duration-200">
          <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
            PEP Declaration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="co-pepPerson"
                className="text-gray-800 font-semibold text-sm"
              >
                Politically Exposed Person
                <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={data.pepPerson}
                  onValueChange={(value) =>
                    setData({ ...data, pepPerson: value })
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

            <div className="space-y-2.5">
              <Label
                htmlFor="co-pepSubCategory"
                className="text-gray-800 font-semibold text-sm"
              >
                PEP Sub Category<span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={data.pepPerson === "yes" ? data.pepSubCategory : ""}
                  onValueChange={(value) =>
                    setData({ ...data, pepSubCategory: value })
                  }
                  disabled={data.pepPerson !== "yes"}
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    {pepSubCategoryOptions.length > 0 ? (
                      pepSubCategoryOptions.map((option, index) => {
                        const key =
                          option.pep_sub_category_pk_code ||
                          option.id ||
                          `pep-sub-${index}`;
                        const value = String(
                          option.pep_sub_category_pk_code || option.id || index,
                        );
                        const label =
                          option.pep_sub_category || option.name || "Unknown";
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
                htmlFor="co-pepRelated"
                className="text-gray-800 font-semibold text-sm"
              >
                Are you related to any PEP?
                <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={data.pepPerson === "no" ? data.pepRelated : ""}
                  onValueChange={(value) =>
                    setData({ ...data, pepRelated: value })
                  }
                  disabled={data.pepPerson !== "no"}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="co-pepRelationship"
                className="text-gray-800 font-semibold text-sm"
              >
                Relationship<span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={
                    data.pepPerson === "no" && data.pepRelated === "yes"
                      ? data.pepRelationship
                      : ""
                  }
                  onValueChange={(value) =>
                    setData({ ...data, pepRelationship: value })
                  }
                  disabled={
                    data.pepPerson !== "no" || data.pepRelated !== "yes"
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-pepIdentification"
                className="text-gray-800 font-semibold text-sm"
              >
                Identification No. <span className="text-destructive">*</span>
              </Label>
              <Input
                id="co-pepIdentification"
                placeholder="Enter Identification No"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={
                  data.pepPerson === "no" && data.pepRelated === "yes"
                    ? data.pepIdentification || ""
                    : ""
                }
                onChange={(e) =>
                  setData({ ...data, pepIdentification: e.target.value })
                }
                disabled={data.pepPerson !== "no" || data.pepRelated !== "yes"}
              />
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-pepCategory"
                className="text-gray-800 font-semibold text-sm"
              >
                PEP Category<span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={
                    data.pepPerson === "no" && data.pepRelated === "yes"
                      ? data.pepCategory
                      : ""
                  }
                  onValueChange={(value) =>
                    setData({ ...data, pepCategory: value })
                  }
                  disabled={
                    data.pepPerson !== "no" || data.pepRelated !== "yes"
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    {pepCategoryOptions.length > 0 ? (
                      pepCategoryOptions.map((option, index) => {
                        const key =
                          option.pep_category_pk_code ||
                          option.id ||
                          `pep-cat-${index}`;
                        const value = String(
                          option.pep_category_pk_code || option.id || index,
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
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="co-pepSubCat2"
                className="text-gray-800 font-semibold text-sm"
              >
                PEP Sub Category<span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={
                    data.pepPerson === "no" && data.pepRelated === "yes"
                      ? data.pepSubCat2
                      : ""
                  }
                  onValueChange={(value) =>
                    setData({ ...data, pepSubCat2: value })
                  }
                  disabled={
                    data.pepPerson !== "no" || data.pepRelated !== "yes"
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    {relatedPepSubCategoryOptions.length > 0 ? (
                      relatedPepSubCategoryOptions.map((option, index) => {
                        const key =
                          option.pep_sub_category_pk_code ||
                          option.id ||
                          `pep-rel-sub-${index}`;
                        const value = String(
                          option.pep_sub_category_pk_code || option.id || index,
                        );
                        const label =
                          option.pep_sub_category || option.name || "Unknown";
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
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="co-uploadId"
              className="text-gray-800 font-semibold text-sm"
            >
              Upload Identification Proof{" "}
              <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-12 w-32 rounded-lg bg-white hover:bg-gray-50 border-gray-300 font-medium transition-all"
                disabled={data.pepPerson !== "no" || data.pepRelated !== "yes"}
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {data.pepPerson === "no" && data.pepRelated === "yes"
                  ? "No file chosen"
                  : "No file chosen"}
              </span>
            </div>
          </div>
        </div>

        {/* Employment Status */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              Employment Status<span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={data.employmentStatus}
              onValueChange={(value) =>
                setData({ ...data, employmentStatus: value })
              }
              className="flex gap-8"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employed" id="co-employed" />
                <Label
                  htmlFor="co-employed"
                  className="font-normal cursor-pointer"
                >
                  Employed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unemployed" id="co-unemployed" />
                <Label
                  htmlFor="co-unemployed"
                  className="font-normal cursor-pointer"
                >
                  Unemployed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="self-employed" id="co-self-employed" />
                <Label
                  htmlFor="co-self-employed"
                  className="font-normal cursor-pointer"
                >
                  Self-employed
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Employment Details */}
        {data.employmentStatus === "employed" && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-md hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
              Employment Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor="co-occupation"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Occupation <span className="text-destructive">*</span>
                </Label>
                <div className="w-full h-12" style={{ minHeight: "48px" }}>
                  <Select
                    value={data.occupation ? String(data.occupation) : ""}
                    onValueChange={(value) =>
                      setData({ ...data, occupation: value })
                    }
                  >
                    <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
                      {occupationOptions.length > 0 ? (
                        occupationOptions.map((option, index) => {
                          const key =
                            option.occ_pk_code ||
                            option.id ||
                            `occupation-${index}`;
                          const value = String(
                            option.occ_pk_code || option.id || index,
                          );
                          const label =
                            option.occ_name || option.name || "Unknown";
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
                  htmlFor="co-organizationName"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Organization Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="co-organizationName"
                  placeholder="Enter Organization Name"
                  className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={data.organizationName || ""}
                  onChange={(e) =>
                    setData({ ...data, organizationName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="co-employerType"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Type of Employer <span className="text-destructive">*</span>
                </Label>
                <div className="w-full h-12" style={{ minHeight: "48px" }}>
                  <Select
                    value={data.employerType}
                    onValueChange={(value) =>
                      setData({ ...data, employerType: value })
                    }
                  >
                    <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="co-annualSalary"
                  className="text-gray-800 font-semibold text-sm"
                >
                  Annual Salary Income{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  id="co-annualSalary"
                  placeholder="Enter Annual Salary"
                  className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={data.annualSalary || ""}
                  onChange={(e) =>
                    setData({ ...data, annualSalary: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Additional Co-Borrowers */}
        {coBorrowers.length > 1 &&
          coBorrowers.slice(1).map((coBorrower, index) => {
            const actualIndex = index + 1;
            return (
              <div
                key={actualIndex}
                className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Additional Co-Borrower {actualIndex}
                  </h2>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeCoBorrower(actualIndex)}
                  >
                    Remove
                  </Button>
                </div>

                {/* Co-Borrower Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2.5">
                      <Label>
                        Salutation <span className="text-destructive">*</span>
                      </Label>
                      <div
                        className="w-full h-12"
                        style={{ minHeight: "48px" }}
                      >
                        <Select
                          value={coBorrower.salutation}
                          onValueChange={(value) =>
                            updateCoBorrower(actualIndex, "salutation", value)
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
                      <Label>
                        Co-Borrower Name{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Full Name"
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={coBorrower.name || ""}
                        onChange={(e) =>
                          updateCoBorrower(actualIndex, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label>
                        Nationality <span className="text-destructive">*</span>
                      </Label>
                      <div
                        className="w-full h-12"
                        style={{ minHeight: "48px" }}
                      >
                        <Select
                          value={coBorrower.nationality}
                          onValueChange={(value) =>
                            updateCoBorrower(actualIndex, "nationality", value)
                          }
                        >
                          <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bhutanese">Bhutanese</SelectItem>
                            <SelectItem value="indian">Indian</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <Label>
                        Identification Type{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div
                        className="w-full h-12"
                        style={{ minHeight: "48px" }}
                      >
                        <Select
                          value={coBorrower.identificationType}
                          onValueChange={(value) =>
                            updateCoBorrower(
                              actualIndex,
                              "identificationType",
                              value,
                            )
                          }
                        >
                          <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cid">Citizenship ID</SelectItem>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="work_permit">
                              Work Permit
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2.5">
                      <Label>
                        Identification No.{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="Enter identification No"
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={coBorrower.identificationNo || ""}
                        onChange={(e) =>
                          updateCoBorrower(
                            actualIndex,
                            "identificationNo",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label>
                        Date of Birth{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="date"
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={coBorrower.dateOfBirth || ""}
                        onChange={(e) =>
                          updateCoBorrower(
                            actualIndex,
                            "dateOfBirth",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label>
                        Email Address{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="Enter Email"
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={coBorrower.email || ""}
                        onChange={(e) =>
                          updateCoBorrower(actualIndex, "email", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label>
                        Contact Number{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Contact No"
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={coBorrower.contact || ""}
                        onChange={(e) =>
                          updateCoBorrower(
                            actualIndex,
                            "contact",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2.5">
                      <Label>
                        Relationship to Borrower{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div
                        className="w-full h-12"
                        style={{ minHeight: "48px" }}
                      >
                        <Select
                          value={coBorrower.relationship}
                          onValueChange={(value) =>
                            updateCoBorrower(actualIndex, "relationship", value)
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
                      <Label>
                        Annual Income (Nu.){" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        placeholder="Enter Annual Income"
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={coBorrower.annualIncome || ""}
                        onChange={(e) =>
                          updateCoBorrower(
                            actualIndex,
                            "annualIncome",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label>Occupation</Label>
                      <Input
                        placeholder="Enter Occupation"
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={coBorrower.occupation || ""}
                        onChange={(e) =>
                          updateCoBorrower(
                            actualIndex,
                            "occupation",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

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
    </>
  );
}
