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
  fetchCountry,
  fetchDzongkhag,
  fetchGewogsByDzongkhag,
  fetchIdentificationType,
} from "@/services/api";

interface BusinessDetailsFormProps {
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

export function BusinessDetailsForm({
  onNext,
  onBack,
  formData,
}: BusinessDetailsFormProps) {
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
    alternateContactNumber: formData?.businessAddress?.alternateContactNumber || "",
    emailAddress: formData?.businessAddress?.emailAddress || "",
  });

  // Options
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([]);
  const [gewogOptions, setGewogOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<any[]>([]);

  // Conditional entities based on business type
  const [ownerData, setOwnerData] = useState(formData?.ownerData || {});
  const [partners, setPartners] = useState<any[]>(formData?.partners || []);
  const [ceo, setCeo] = useState(formData?.ceo || {});
  const [boardMembers, setBoardMembers] = useState<any[]>(formData?.boardMembers || []);
  const [shareholders, setShareholders] = useState<any[]>(formData?.shareholders || []);
  const [trustees, setTrustees] = useState<any[]>(formData?.trustees || []);
  const [president, setPresident] = useState(formData?.president || {});
  const [headOfAgency, setHeadOfAgency] = useState(formData?.headOfAgency || {});
  const [headOfNGO, setHeadOfNGO] = useState(formData?.headOfNGO || {});

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [country, dzongkhag, identificationType] = await Promise.all([
          fetchCountry().catch(() => []),
          fetchDzongkhag().catch(() => []),
          fetchIdentificationType().catch(() => []),
        ]);

        const countryData = country?.data?.data || country?.data || country || [];
        const dzongkhagData = dzongkhag?.data?.data || dzongkhag?.data || dzongkhag || [];
        const identificationTypeData =
          identificationType?.data?.data ||
          identificationType?.data ||
          identificationType ||
          [];

        setCountryOptions(countryData);
        setDzongkhagOptions(dzongkhagData);
        setIdentificationTypeOptions(identificationTypeData);
      } catch (error) {
        console.error("Error loading form data:", error);
      }
    };
    loadAllData();
  }, []);

  useEffect(() => {
    if (businessAddress.dzongkhag) {
      const loadGewogs = async () => {
        try {
          const gewogs = await fetchGewogsByDzongkhag(businessAddress.dzongkhag);
          const gewogsData = gewogs?.data?.data || gewogs?.data || gewogs || [];
          setGewogOptions(gewogsData);
        } catch (error) {
          console.error("Error loading gewogs:", error);
          setGewogOptions([]);
        }
      };
      loadGewogs();
    } else {
      setGewogOptions([]);
    }
  }, [businessAddress.dzongkhag]);

  const handleBusinessDataChange = (field: string, value: any) => {
    setBusinessData({ ...businessData, [field]: value });
  };

  const handleBusinessAddressChange = (field: string, value: any) => {
    setBusinessAddress({ ...businessAddress, [field]: value });
  };

  const handleIdentificationProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBusinessData({
        ...businessData,
        identificationProofFile: file,
        identificationProofFileName: file.name,
      });
    }
  };

  const handleAddPartner = () => {
    setPartners([...partners, { personalDetails: {}, shareholding: "" }]);
  };

  const handleRemovePartner = (index: number) => {
    setPartners(partners.filter((_, i) => i !== index));
  };

  const updatePartnerField = (index: number, field: string, value: any) => {
    const updated = [...partners];
    if (field.startsWith("personalDetails.")) {
      const personalField = field.replace("personalDetails.", "");
      updated[index] = {
        ...updated[index],
        personalDetails: {
          ...updated[index].personalDetails,
          [personalField]: value,
        },
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setPartners(updated);
  };

  const handleAddBoardMember = () => {
    setBoardMembers([...boardMembers, { personalDetails: {} }]);
  };

  const handleRemoveBoardMember = (index: number) => {
    setBoardMembers(boardMembers.filter((_, i) => i !== index));
  };

  const updateBoardMemberField = (index: number, field: string, value: any) => {
    const updated = [...boardMembers];
    if (field.startsWith("personalDetails.")) {
      const personalField = field.replace("personalDetails.", "");
      updated[index] = {
        ...updated[index],
        personalDetails: {
          ...updated[index].personalDetails,
          [personalField]: value,
        },
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setBoardMembers(updated);
  };

  const handleAddShareholder = () => {
    setShareholders([...shareholders, { personalDetails: {}, shareholding: "" }]);
  };

  const handleRemoveShareholder = (index: number) => {
    setShareholders(shareholders.filter((_, i) => i !== index));
  };

  const updateShareholderField = (index: number, field: string, value: any) => {
    const updated = [...shareholders];
    if (field.startsWith("personalDetails.")) {
      const personalField = field.replace("personalDetails.", "");
      updated[index] = {
        ...updated[index],
        personalDetails: {
          ...updated[index].personalDetails,
          [personalField]: value,
        },
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setShareholders(updated);
  };

  const handleAddTrustee = () => {
    setTrustees([...trustees, { personalDetails: {} }]);
  };

  const handleRemoveTrustee = (index: number) => {
    setTrustees(trustees.filter((_, i) => i !== index));
  };

  const updateTrusteeField = (index: number, field: string, value: any) => {
    const updated = [...trustees];
    if (field.startsWith("personalDetails.")) {
      const personalField = field.replace("personalDetails.", "");
      updated[index] = {
        ...updated[index],
        personalDetails: {
          ...updated[index].personalDetails,
          [personalField]: value,
        },
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setTrustees(updated);
  };

  const renderPersonalDetailsForm = (
    data: any,
    onChange: (field: string, value: any) => void,
    prefix: string = ""
  ) => {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-gray-800 font-semibold">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={data.firstName || ""}
            onChange={(e) => onChange(`${prefix}firstName`, e.target.value)}
            className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-800 font-semibold">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={data.lastName || ""}
            onChange={(e) => onChange(`${prefix}lastName`, e.target.value)}
            className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-800 font-semibold">
            Date of Birth <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            value={formatDateForInput(data.dateOfBirth) || ""}
            onChange={(e) => onChange(`${prefix}dateOfBirth`, e.target.value)}
            className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-800 font-semibold">Contact Number</Label>
          <Input
            value={data.contactNumber || ""}
            onChange={(e) => onChange(`${prefix}contactNumber`, e.target.value)}
            className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-800 font-semibold">Email Address</Label>
          <Input
            type="email"
            value={data.emailAddress || ""}
            onChange={(e) => onChange(`${prefix}emailAddress`, e.target.value)}
            className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-800 font-semibold">
            Identification Type
          </Label>
          <Select
            value={data.identificationType || ""}
            onValueChange={(value) => onChange(`${prefix}identificationType`, value)}
          >
            <SelectTrigger className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {identificationTypeOptions.map((option, idx) => (
                <SelectItem key={idx} value={String(option.identification_type_id || idx)}>
                  {option.identification_type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-800 font-semibold">
            Identification Number
          </Label>
          <Input
            value={data.identificationNumber || ""}
            onChange={(e) => onChange(`${prefix}identificationNumber`, e.target.value)}
            className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
          />
        </div>
      </div>
    );
  };

  const isFormValid = () => {
    if (
      !businessData.businessName ||
      !businessData.establishmentDate ||
      !businessData.businessType ||
      !businessAddress.country
    ) {
      return false;
    }

    // Validate based on business type
    if (businessData.businessType === "Sole Proprietorship") {
      if (!ownerData.firstName || !ownerData.lastName || !ownerData.dateOfBirth) {
        return false;
      }
    } else if (businessData.businessType === "Partnership") {
      if (partners.length === 0) return false;
      for (const partner of partners) {
        if (
          !partner.personalDetails?.firstName ||
          !partner.personalDetails?.lastName ||
          !partner.shareholding
        ) {
          return false;
        }
      }
    } else if (businessData.businessType === "Private Limited Company") {
      if (
        partners.length === 0 ||
        !ceo.firstName ||
        boardMembers.length === 0
      ) {
        return false;
      }
    } else if (businessData.businessType === "Public Limited Company") {
      if (
        !ceo.firstName ||
        boardMembers.length === 0 ||
        shareholders.length === 0
      ) {
        return false;
      }
    } else if (businessData.businessType === "Trust") {
      if (trustees.length === 0) return false;
    } else if (businessData.businessType === "Association / Club") {
      if (!president.firstName) return false;
    } else if (businessData.businessType === "Government Body") {
      if (!headOfAgency.firstName) return false;
    } else if (businessData.businessType === "NGO") {
      if (!headOfNGO.firstName) return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!isFormValid()) {
      alert("Please fill in all required fields");
      return;
    }

    const data = {
      ...businessData,
      businessAddress,
      ownerData: businessData.businessType === "Sole Proprietorship" ? ownerData : undefined,
      partners:
        businessData.businessType === "Partnership" ||
        businessData.businessType === "Private Limited Company"
          ? partners
          : undefined,
      ceo:
        businessData.businessType === "Private Limited Company" ||
        businessData.businessType === "Public Limited Company"
          ? ceo
          : undefined,
      boardMembers:
        businessData.businessType === "Private Limited Company" ||
        businessData.businessType === "Public Limited Company"
          ? boardMembers
          : undefined,
      shareholders:
        businessData.businessType === "Public Limited Company" ? shareholders : undefined,
      trustees: businessData.businessType === "Trust" ? trustees : undefined,
      president: businessData.businessType === "Association / Club" ? president : undefined,
      headOfAgency: businessData.businessType === "Government Body" ? headOfAgency : undefined,
      headOfNGO: businessData.businessType === "NGO" ? headOfNGO : undefined,
    };

    onNext(data);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
          BUSINESS IDENTIFICATION & FINANCIAL INFORMATION
        </h2>
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Business / Agency Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={businessData.businessName}
                onChange={(e) => handleBusinessDataChange("businessName", e.target.value)}
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Establishment Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formatDateForInput(businessData.establishmentDate)}
                onChange={(e) =>
                  handleBusinessDataChange("establishmentDate", e.target.value)
                }
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Industry Classification
              </Label>
              <Input
                value={businessData.industryClassification}
                onChange={(e) =>
                  handleBusinessDataChange("industryClassification", e.target.value)
                }
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Identification Type
              </Label>
              <Select
                value={businessData.identificationType || ""}
                onValueChange={(value) =>
                  handleBusinessDataChange("identificationType", value)
                }
              >
                <SelectTrigger className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {identificationTypeOptions.map((option, idx) => (
                    <SelectItem
                      key={idx}
                      value={String(option.identification_type_id || idx)}
                    >
                      {option.identification_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Identification Number
              </Label>
              <Input
                value={businessData.identificationNumber}
                onChange={(e) =>
                  handleBusinessDataChange("identificationNumber", e.target.value)
                }
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Identification Issue Date
              </Label>
              <Input
                type="date"
                value={formatDateForInput(businessData.identificationIssueDate)}
                onChange={(e) =>
                  handleBusinessDataChange("identificationIssueDate", e.target.value)
                }
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Identification Expiry Date
              </Label>
              <Input
                type="date"
                value={formatDateForInput(businessData.identificationExpiryDate)}
                onChange={(e) =>
                  handleBusinessDataChange("identificationExpiryDate", e.target.value)
                }
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Upload Identification Proof
              </Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("identification-proof")?.click()
                  }
                  className="border-gray-300 hover:border-[#FF9800]"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
                <span className="text-sm text-gray-600">
                  {businessData.identificationProofFileName || "No file selected"}
                </span>
              </div>
              <input
                id="identification-proof"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleIdentificationProofChange}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Tax Identifier Type
              </Label>
              <Input
                value={businessData.taxIdentifierType}
                onChange={(e) =>
                  handleBusinessDataChange("taxIdentifierType", e.target.value)
                }
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Tax Identifier Number
              </Label>
              <Input
                value={businessData.taxIdentifierNumber}
                onChange={(e) =>
                  handleBusinessDataChange("taxIdentifierNumber", e.target.value)
                }
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Bank Current Account Number
              </Label>
              <Input
                value={businessData.bankCurrentAccountNumber}
                onChange={(e) =>
                  handleBusinessDataChange("bankCurrentAccountNumber", e.target.value)
                }
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">Name of Bank</Label>
              <Input
                value={businessData.nameOfBank}
                onChange={(e) => handleBusinessDataChange("nameOfBank", e.target.value)}
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Gross Annual Income (Nu.)
              </Label>
              <Input
                type="number"
                value={businessData.grossAnnualIncome}
                onChange={(e) =>
                  handleBusinessDataChange("grossAnnualIncome", e.target.value)
                }
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Business Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={businessData.businessType || ""}
                onValueChange={(value) => handleBusinessDataChange("businessType", value)}
              >
                <SelectTrigger className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="Select Business Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Private Limited Company">
                    Private Limited Company
                  </SelectItem>
                  <SelectItem value="Public Limited Company">
                    Public Limited Company
                  </SelectItem>
                  <SelectItem value="Trust">Trust</SelectItem>
                  <SelectItem value="Association / Club">Association / Club</SelectItem>
                  <SelectItem value="Government Body">Government Body</SelectItem>
                  <SelectItem value="NGO">NGO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
          BUSINESS ADDRESS
        </h2>
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Country <span className="text-red-500">*</span>
              </Label>
              <Select
                value={businessAddress.country || ""}
                onValueChange={(value) => handleBusinessAddressChange("country", value)}
              >
                <SelectTrigger className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((option, idx) => (
                    <SelectItem key={idx} value={String(option.country_id || idx)}>
                      {option.country_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">Dzongkhag</Label>
              <Select
                value={businessAddress.dzongkhag || ""}
                onValueChange={(value) => handleBusinessAddressChange("dzongkhag", value)}
              >
                <SelectTrigger className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="Select Dzongkhag" />
                </SelectTrigger>
                <SelectContent>
                  {dzongkhagOptions.map((option, idx) => (
                    <SelectItem key={idx} value={String(option.pk_dzongkhag_id || idx)}>
                      {option.dzongkhag_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">Gewog</Label>
              <Select
                value={businessAddress.gewog || ""}
                onValueChange={(value) => handleBusinessAddressChange("gewog", value)}
              >
                <SelectTrigger className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="Select Gewog" />
                </SelectTrigger>
                <SelectContent>
                  {gewogOptions.length > 0 ? (
                    gewogOptions.map((option, idx) => (
                      <SelectItem key={idx} value={String(option.pk_gewog_id || idx)}>
                        {option.gewog_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      {businessAddress.dzongkhag ? "No gewogs available" : "Select dzongkhag first"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">Village / Street</Label>
              <Input
                value={businessAddress.villageStreet}
                onChange={(e) =>
                  handleBusinessAddressChange("villageStreet", e.target.value)
                }
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Specific Area / Location
              </Label>
              <Input
                value={businessAddress.specificLocation}
                onChange={(e) =>
                  handleBusinessAddressChange("specificLocation", e.target.value)
                }
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">Contact Number</Label>
              <Input
                value={businessAddress.contactNumber}
                onChange={(e) =>
                  handleBusinessAddressChange("contactNumber", e.target.value)
                }
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">
                Alternate Contact Number
              </Label>
              <Input
                value={businessAddress.alternateContactNumber}
                onChange={(e) =>
                  handleBusinessAddressChange("alternateContactNumber", e.target.value)
                }
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">Email Address</Label>
              <Input
                type="email"
                value={businessAddress.emailAddress}
                onChange={(e) =>
                  handleBusinessAddressChange("emailAddress", e.target.value)
                }
                className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Sections Based on Business Type */}
      {businessData.businessType === "Sole Proprietorship" && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
            OWNER DETAILS
          </h2>
          <div className="space-y-6">
            {renderPersonalDetailsForm(
              ownerData,
              (field, value) => setOwnerData({ ...ownerData, [field]: value }),
              ""
            )}
          </div>
        </div>
      )}

      {businessData.businessType === "Partnership" && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-[#003DA5]">
              PARTNERS ({partners.length})
            </h2>
            <Button
                type="button"
                onClick={handleAddPartner}
                className="bg-[#003DA5] text-white hover:bg-[#002D7A]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Partner
              </Button>
            </div>
          <div className="space-y-6 mt-6">
            {partners.map((partner, index) => (
              <div key={index} className="border-2 border-gray-200 shadow-md rounded-lg p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Partner {index + 1}
                  </h3>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemovePartner(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                <div>
                  {renderPersonalDetailsForm(
                    partner.personalDetails,
                    (field, value) => updatePartnerField(index, field, value),
                    "personalDetails."
                  )}
                  <div className="space-y-2">
                    <Label className="text-gray-800 font-semibold">
                      Shareholding Percentage <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={partner.shareholding || ""}
                      onChange={(e) =>
                        updatePartnerField(index, "shareholding", e.target.value)
                      }
                      className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      placeholder="Enter percentage"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {businessData.businessType === "Private Limited Company" && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-bold text-[#003DA5]">
                PARTNERS ({partners.length})
              </h2>
              <Button
                type="button"
                onClick={handleAddPartner}
                className="bg-[#003DA5] text-white hover:bg-[#002D7A]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Partner
              </Button>
            </div>
            <div className="space-y-6">
              {partners.map((partner, index) => (
                <div key={index} className="border-2 border-gray-200 shadow-md rounded-lg p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Partner {index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemovePartner(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    {renderPersonalDetailsForm(
                      partner.personalDetails,
                      (field, value) => updatePartnerField(index, field, value),
                      "personalDetails."
                    )}
                    <div className="space-y-2">
                      <Label className="text-gray-800 font-semibold">
                        Shareholding Percentage <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        value={partner.shareholding || ""}
                        onChange={(e) =>
                          updatePartnerField(index, "shareholding", e.target.value)
                        }
                        className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        placeholder="Enter percentage"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">CEO DETAILS</h2>
            <div className="space-y-6">{renderPersonalDetailsForm(
                ceo,
                (field, value) => setCeo({ ...ceo, [field]: value }),
                ""
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-bold text-[#003DA5]">
                BOARD OF DIRECTORS ({boardMembers.length})
              </h2>
              <Button
                type="button"
                onClick={handleAddBoardMember}
                className="bg-[#003DA5] text-white hover:bg-[#002D7A]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Board Member
              </Button>
            </div>
            <div className="space-y-6">
              {boardMembers.map((member, index) => (
                <div key={index} className="border-2 border-gray-200 shadow-md rounded-lg p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Board Member {index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveBoardMember(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    {renderPersonalDetailsForm(
                      member.personalDetails,
                      (field, value) => updateBoardMemberField(index, field, value),
                      "personalDetails."
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {businessData.businessType === "Public Limited Company" && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">CEO DETAILS</h2>
            <div className="space-y-6">
              {renderPersonalDetailsForm(
                ceo,
                (field, value) => setCeo({ ...ceo, [field]: value }),
                ""
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-bold text-[#003DA5]">
                BOARD OF DIRECTORS ({boardMembers.length})
              </h2>
              <Button
                type="button"
                onClick={handleAddBoardMember}
                className="bg-[#003DA5] text-white hover:bg-[#002D7A]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Board Member
              </Button>
            </div>
            <div className="space-y-6">
              {boardMembers.map((member, index) => (
                <div key={index} className="border-2 border-gray-200 shadow-md rounded-lg p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Board Member {index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveBoardMember(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    {renderPersonalDetailsForm(
                      member.personalDetails,
                      (field, value) => updateBoardMemberField(index, field, value),
                      "personalDetails."
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-bold text-[#003DA5]">
                SHAREHOLDERS WITH {">"} 25% SHAREHOLDING ({shareholders.length})
              </h2>
              <Button
                type="button"
                onClick={handleAddShareholder}
                className="bg-[#003DA5] text-white hover:bg-[#002D7A]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Shareholder
              </Button>
            </div>
            <div className="space-y-6">
              {shareholders.map((shareholder, index) => (
                <div key={index} className="border-2 border-gray-200 shadow-md rounded-lg p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Shareholder {index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveShareholder(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    {renderPersonalDetailsForm(
                      shareholder.personalDetails,
                      (field, value) => updateShareholderField(index, field, value),
                      "personalDetails."
                    )}
                    <div className="space-y-2">
                      <Label className="text-gray-800 font-semibold">
                        Shareholding Percentage <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        value={shareholder.shareholding || ""}
                        onChange={(e) =>
                          updateShareholderField(index, "shareholding", e.target.value)
                        }
                        className="border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        placeholder="Enter percentage (>25)"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {businessData.businessType === "Trust" && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-[#003DA5]">
              TRUSTEES ({trustees.length})
            </h2>
            <Button
              type="button"
              onClick={handleAddTrustee}
              className="bg-[#003DA5] text-white hover:bg-[#002D7A]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Trustee
            </Button>
          </div>
          <div className="space-y-6">
            {trustees.map((trustee, index) => (
              <div key={index} className="border-2 border-gray-200 shadow-md rounded-lg p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Trustee {index + 1}
                  </h3>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveTrustee(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  {renderPersonalDetailsForm(
                    trustee.personalDetails,
                    (field, value) => updateTrusteeField(index, field, value),
                    "personalDetails."
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {businessData.businessType === "Association / Club" && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">PRESIDENT DETAILS</h2>
          <div className="space-y-6">
            {renderPersonalDetailsForm(
              president,
              (field, value) => setPresident({ ...president, [field]: value }),
              ""
            )}
          </div>
        </div>
      )}

      {businessData.businessType === "Government Body" && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
            HEAD OF GOVERNMENT AGENCY DETAILS
          </h2>
          <div className="space-y-6">
            {renderPersonalDetailsForm(
              headOfAgency,
              (field, value) => setHeadOfAgency({ ...headOfAgency, [field]: value }),
              ""
            )}
          </div>
        </div>
      )}

      {businessData.businessType === "NGO" && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">HEAD OF NGO DETAILS</h2>
          <div className="space-y-6">
            {renderPersonalDetailsForm(
              headOfNGO,
              (field, value) => setHeadOfNGO({ ...headOfNGO, [field]: value }),
              ""
            )}
          </div>
        </div>
      )}

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
