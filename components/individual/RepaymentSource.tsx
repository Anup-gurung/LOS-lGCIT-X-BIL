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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  fetchOccupations,
  fetchLegalConstitution,
  fetchPepCategory,
  fetchPepSubCategoryByCategory,
  fetchBanks,
  fetchTaxIdentifierType,   // <-- NEW import
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

// ================== Module-level helpers for PK resolution ==================
const getOptionPkCode = (opt: any): string => {
  if (!opt) return "";
  return String(
    opt.bank_pk_code ||
    opt.country_pk_code ||
    opt.nationality_pk_code ||
    opt.identity_type_pk_code ||
    opt.marital_status_pk_code ||
    opt.occupation_pk_code ||
    opt.occ_pk_code ||
    opt.lgal_constitution_pk_code ||
    opt.legal_const_pk_code ||
    opt.dzongkhag_pk_code ||
    opt.pk_dzongkhag_id ||
    opt.dzongkhag_pk_id ||
    opt.gewog_pk_code ||
    opt.curr_gewog_pk_code ||
    opt.pk_gewog_id ||
    opt.gewog_pk_id ||
    opt.pep_category_pk_code ||
    opt.pep_sub_category_pk_code ||
    opt.tax_identifier_type_pk_code ||
    opt.pk_code ||
    opt.id ||
    opt.code ||
    "",
  );
};

const getOptionLabel = (opt: any): string => {
  if (!opt) return "";
  return String(
    opt.gewog ||
    opt.gewog_name ||
    opt.gewogName ||
    opt.dzongkhag ||
    opt.dzongkhag_name ||
    opt.dzongkhagName ||
    opt.country ||
    opt.country_name ||
    opt.countryName ||
    opt.nationality ||
    opt.identity_type ||
    opt.identification_type ||
    opt.marital_status ||
    opt.occ_name ||
    opt.occupation ||
    opt.lgal_constitution ||
    opt.legal_const_name ||
    opt.bank_name ||
    opt.bank ||
    opt.bankName ||
    opt.pep_category ||
    opt.pep_sub_category ||
    opt.tax_identifier_type ||
    opt.name ||
    opt.label ||
    "Unknown"
  );
};

const findPkCodeByLabelStatic = (
  label: string,
  options: any[],
  labelFields?: string[],
): string => {
  if (!label || !options || !Array.isArray(options)) return label;
  const trimmedLabel = String(label).trim().toLowerCase();
  const strippedLabel = trimmedLabel.replace(/\s+/g, "");
  const inputWords = trimmedLabel.split(/\s+/).filter((w) => w.length > 0);

  const getCode = (opt: any) =>
    String(
      opt.bank_pk_code ||
      opt.country_pk_code ||
      opt.nationality_pk_code ||
      opt.identity_type_pk_code ||
      opt.marital_status_pk_code ||
      opt.occ_pk_code ||
      opt.occupation_pk_code ||
      opt.dzongkhag_pk_code ||
      opt.gewog_pk_code ||
      opt.pep_category_pk_code ||
      opt.pep_sub_category_pk_code ||
      opt.lgal_constitution_pk_code ||
      opt.legal_const_pk_code ||
      opt.tax_identifier_type_pk_code ||
      opt.pk_code ||
      opt.id ||
      opt.code ||
      ""
    );

  const getLabelFallback = (opt: any) =>
    String(
      opt.gewog || opt.dzongkhag || opt.country || opt.nationality ||
      opt.identity_type || opt.identification_type || opt.marital_status ||
      opt.occ_name || opt.occupation || opt.lgal_constitution || opt.legal_const_name ||
      opt.bank_name || opt.bank || opt.name || opt.label || "Unknown"
    );

  // 0. Exact match on code
  for (const option of options) {
    const code = getCode(option);
    if (code && String(code).toLowerCase() === trimmedLabel) return code;
  }

  const checkMatch = (optVal: string) => {
    if (!optVal) return false;
    const t = String(optVal).trim().toLowerCase();
    const s = t.replace(/\s+/g, "");
    if (s === strippedLabel || t === trimmedLabel) return true;
    const optWords = t.split(/\s+/).filter((w) => w.length > 0);
    if (inputWords.length > 0 && optWords.length > 0) {
      return inputWords.every((w) =>
        optWords.some(
          (ow) =>
            ow === w ||
            ow.includes(w) ||
            (w.startsWith("identi") && ow.startsWith("identi"))
        )
      );
    }
    return false;
  };

  // 0.5. Exact label match pass
  for (const option of options) {
    const fields = labelFields ? labelFields.map((f) => option[f]).filter(Boolean) : [];
    fields.push(getLabelFallback(option));
    if (fields.some((v) => String(v).trim().toLowerCase() === trimmedLabel)) return getCode(option);
  }

  // 1. Fuzzy match
  for (const option of options) {
    const fields = labelFields ? labelFields.map((f) => option[f]).filter(Boolean) : [];
    fields.push(getLabelFallback(option));
    if (fields.some((v) => checkMatch(String(v)))) return getCode(option);
  }

  // 2. Partial Match Fallback
  if (trimmedLabel.length >= 4) {
    for (const option of options) {
      const lbl = getLabelFallback(option).toLowerCase();
      // Handle married/unmarried specifically
      if (trimmedLabel === "unmarried" && lbl === "unmarried") return getCode(option);
      if (trimmedLabel === "married" && lbl === "married") return getCode(option);
      if (lbl.includes(trimmedLabel)) return getCode(option);
    }
  }
  return label;
};

// Helper to filter out Trade License and Company Registration from identification types
const getFilteredIdentificationOptions = (options: any[]) => {
  return options.filter((opt) => {
    const label = (
      opt.identity_type ||
      opt.identification_type ||
      opt.name ||
      ""
    ).toLowerCase();
    // Exclude options that contain "trade license" or "company registration"
    return !label.includes("trade license") && !label.includes("company registration");
  });
};

// Initialize empty related PEP entry (Expanded)
const createEmptyRelatedPep = () => ({
  // PEP Info
  relationship: "",
  identificationNo: "",
  category: "",
  subCategory: "",
  identificationProof: "",

  // Personal Info
  identificationType: "",
  salutation: "",
  applicantName: "",
  nationality: "",
  gender: "",
  identificationIssueDate: "",
  identificationExpiryDate: "",
  dateOfBirth: "",
  taxIdentifierType: "",
  tpn: "",
  householdNumber: "",
  maritalStatus: "",

  // PEP Permanent Address
  permCountry: "",
  permDzongkhag: "",
  permGewog: "",
  permVillage: "",
  permThram: "",
  permHouse: "",
  permAddressProof: "",

  // PEP Current Address
  currCountry: "",
  currDzongkhag: "",
  currGewog: "",
  currVillage: "",
  currFlat: "",
  currAddressProof: "",
  currEmail: "",
  currContact: "",
  currAlternateContact: "",

  // Spouse Info (kept for state but not rendered)
  spouseIdentificationType: "",
  spouseIdentificationNo: "",
  spouseSalutation: "",
  spouseName: "",
  spouseNationality: "",
  spouseGender: "",
  spouseIdentificationIssueDate: "",
  spouseIdentificationExpiryDate: "",
  spouseTaxIdentifierType: "",
  spouseTpn: "",
  spouseDateOfBirth: "",
  spouseHouseholdNumber: "",
  spousePermCountry: "",
  spousePermDzongkhag: "",
  spousePermGewog: "",
  spousePermVillage: "",
  spousePermThram: "",
  spousePermHouse: "",
  spousePermAddressProof: "",
  spouseEmail: "",
  spouseContact: "",
  spouseAlternateContact: "",
});

// Initialize empty guarantor with updated comprehensive fields
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
  taxIdentifierType: "",          // <-- NEW field
  tpnNo: "",
  householdNumber: "",
  maritalStatus: "",
  familyTree: "",
  bankName: "",
  bankAccount: "",
  passportPhoto: "",
  idProof: "", // Added for identification proof upload

  // Expanded Spouse Info (including new spouseIdProof)
  spouseIdentificationType: "",
  spouseIdentificationNo: "",
  spouseSalutation: "",
  spouseName: "",
  spouseNationality: "",
  spouseGender: "",
  spouseIdentificationIssueDate: "",
  spouseIdentificationExpiryDate: "",
  spouseTaxIdentifierType: "",
  spouseTpn: "",
  spouseDateOfBirth: "",
  spouseHouseholdNumber: "",
  spousePermCountry: "",
  spousePermDzongkhag: "",
  spousePermGewog: "",
  spousePermVillage: "",
  spousePermThram: "",
  spousePermHouse: "",
  spousePermAddressProof: "",
  spouseEmail: "",
  spouseContact: "",
  spouseAlternateContact: "",
  spouseIdProof: "", // New field for spouse identification proof

  // Permanent Address
  permCountry: "",
  permDzongkhag: "",
  permGewog: "",
  permVillage: "",
  permThram: "",
  permHouse: "",
  permAddressProof: "",

  // Current Address
  currCountry: "",
  currDzongkhag: "",
  currGewog: "",
  currVillage: "",
  currHouse: "",
  email: "",
  contact: "",
  currAlternateContact: "",
  currAddressProof: "",

  // Employment Details
  employmentStatus: "",
  employeeId: "",
  occupation: "",
  employerType: "",
  designation: "",
  grade: "",
  organizationName: "",
  orgLocation: "",
  joiningDate: "",
  serviceNature: "",
  annualSalary: "",
  contractEndDate: "",

  // PEP Declaration
  isPep: "",
  pepCategory: "",
  pepSubCategory: "",
  pepUpload: "", // kept for state but not rendered
  relatedToPep: "",
  relatedPeps: [createEmptyRelatedPep()],

  // Lookup states
  showLookupPopup: false,
  lookupStatus: "searching" as "searching" | "found" | "not_found",
  fetchedCustomerData: null,
  errors: {} as Record<string, string>,

  // Dropdown options specific to this guarantor
  permGewogOptions: [] as any[],
  currGewogOptions: [] as any[],
  spousePermGewogOptions: [] as any[],
  pepSubCategoryOptions: [] as any[],
  relatedPepOptionsMap: {} as Record<number, any[]>,
  relatedPepSpouseGewogMap: {} as Record<number, any[]>,
  relatedPepPermGewogMap: {} as Record<number, any[]>,
  relatedPepCurrGewogMap: {} as Record<number, any[]>,
});

export function RepaymentSourceForm({
  onNext,
  onBack,
  formData,
}: RepaymentSourceFormProps) {
  // --- STATE ---
  const [incomeData, setIncomeData] = useState(() => {
    // Priority: formData.repaymentSource, then legacy formData.incomeDetails, then default
    const source = formData?.repaymentSource || formData?.incomeDetails || {};
    return {
      repaymentGuarantor: source.repaymentGuarantor || "no",
      // Monthly salary categories
      enableMonthlySalaryCivil: source.enableMonthlySalaryCivil ?? false,
      enableMonthlySalaryCorporate: source.enableMonthlySalaryCorporate ?? false,
      enableMonthlySalaryPrivate: source.enableMonthlySalaryPrivate ?? false,
      monthlySalaryCivil: source.monthlySalaryCivil || "",
      monthlySalaryCorporate: source.monthlySalaryCorporate || "",
      monthlySalaryPrivate: source.monthlySalaryPrivate || "",
      // Other income types
      enableRentalIncome: source.enableRentalIncome ?? false,
      enableBusinessIncome: source.enableBusinessIncome ?? false,
      enableVehicleHiring: source.enableVehicleHiring ?? false,
      enableDividendIncome: source.enableDividendIncome ?? false,
      enableAgricultureIncome: source.enableAgricultureIncome ?? false,
      enableTruckTaxiIncome: source.enableTruckTaxiIncome ?? false,
      rentalIncome: source.rentalIncome || "",
      businessIncome: source.businessIncome || "",
      vehicleHiringIncome: source.vehicleHiringIncome || "",
      dividendIncome: source.dividendIncome || "",
      agricultureIncome: source.agricultureIncome || "",
      truckTaxiIncome: source.truckTaxiIncome || "",
      repaymentProof: source.repaymentProof || null,
    };
  });

  // Guarantors Array (Independent Objects)
  const [guarantors, setGuarantors] = useState<any[]>(() => {
    return formData?.repaymentSource?.guarantors || [createEmptyGuarantor()];
  });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Only load verified data if we don't have form data from previous session/step navigation
    const hasData = formData?.repaymentSource || formData?.incomeDetails;
    if (!hasData) {
      const stored = sessionStorage.getItem("verifiedRepaymentData");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && Object.keys(parsed).length > 0) {
            setIncomeData((prev: any) => ({ ...prev, repaymentGuarantor: "yes" }));
            setGuarantors((prev) => {
              let updated = [...prev];
              updated[0] = { ...updated[0], ...parsed };
              return updated;
            });
          }
        } catch (e) {
          console.error("Error parsing verifiedRepaymentData", e);
        }
      }
    }
  }, [formData]);

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
  const [occupationOptions, setOccupationOptions] = useState<any[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<any[]>([]);
  // NEW: tax identifier type options
  const [taxIdentifierTypeOptions, setTaxIdentifierTypeOptions] = useState<any[]>([]);

  // --- CONVERSION: Consistently map labels to PK codes across all Guarantors ---
  useEffect(() => {
    if (
      !nationalityOptions.length && !identificationTypeOptions.length && !countryOptions.length &&
      !taxIdentifierTypeOptions.length && !dzongkhagOptions.length && !maritalStatusOptions.length &&
      !occupationOptions.length && !banksOptions.length && !pepCategoryOptions.length
    ) return;

    setGuarantors((prev) => {
      let hasChanges = false;
      const mapped = prev.map((g) => {
        let updated = { ...g };

        const fieldsToResolve = [
          { field: 'nationality', opts: nationalityOptions, keys: ["nationality", "name", "label"] },
          { field: 'idType', opts: identificationTypeOptions, keys: ["identity_type", "identification_type", "name", "label"] },
          { field: 'maritalStatus', opts: maritalStatusOptions, keys: ["marital_status", "name", "label"] },
          { field: 'permCountry', opts: countryOptions, keys: ["country", "name", "label"] },
          { field: 'permDzongkhag', opts: dzongkhagOptions, keys: ["dzongkhag", "name", "label"] },
          { field: 'currCountry', opts: countryOptions, keys: ["country", "name", "label"] },
          { field: 'currDzongkhag', opts: dzongkhagOptions, keys: ["dzongkhag", "name", "label"] },
          { field: 'bankName', opts: banksOptions, keys: ["bank_name", "name", "label", "bank"] },
          { field: 'taxIdentifierType', opts: taxIdentifierTypeOptions, keys: ["tax_identifier_type", "name", "label"] },
          { field: 'occupation', opts: occupationOptions, keys: ["occ_name", "occupation", "name", "label"] },
          { field: 'orgLocation', opts: dzongkhagOptions, keys: ["dzongkhag", "name", "label"] },
          { field: 'pepCategory', opts: pepCategoryOptions, keys: ["pep_category", "name", "label"] },
          { field: 'spouseIdentificationType', opts: identificationTypeOptions, keys: ["identity_type", "identification_type", "name", "label"] },
          { field: 'spouseNationality', opts: nationalityOptions, keys: ["nationality", "name", "label"] },
          { field: 'spouseTaxIdentifierType', opts: taxIdentifierTypeOptions, keys: ["tax_identifier_type", "name", "label"] },
        ];

        fieldsToResolve.forEach(({ field, opts, keys }) => {
          if (updated[field] && opts.length > 0) {
            const pk = findPkCodeByLabelStatic(updated[field], opts, keys);
            if (pk && pk !== updated[field]) {
              updated[field] = pk;
              hasChanges = true;
            }
          }
        });

        // Resolve Related PEP fields if they exist
        if (updated.relatedPeps?.length > 0) {
          const resolvedPeps = updated.relatedPeps.map((pep: any) => {
            let p = { ...pep };
            const pepFields = [
              { field: 'nationality', opts: nationalityOptions, keys: ["nationality", "name", "label"] },
              { field: 'identificationType', opts: identificationTypeOptions, keys: ["identity_type", "identification_type", "name", "label"] },
              { field: 'maritalStatus', opts: maritalStatusOptions, keys: ["marital_status", "name", "label"] },
              { field: 'category', opts: pepCategoryOptions, keys: ["pep_category", "name", "label"] },
              { field: 'taxIdentifierType', opts: taxIdentifierTypeOptions, keys: ["tax_identifier_type", "name", "label"] },
              { field: 'permCountry', opts: countryOptions, keys: ["country", "name", "label"] },
              { field: 'permDzongkhag', opts: dzongkhagOptions, keys: ["dzongkhag", "name", "label"] },
              { field: 'currCountry', opts: countryOptions, keys: ["country", "name", "label"] },
              { field: 'currDzongkhag', opts: dzongkhagOptions, keys: ["dzongkhag", "name", "label"] },
            ];
            pepFields.forEach(({ field, opts, keys }) => {
              if (p[field] && opts.length > 0) {
                const pk = findPkCodeByLabelStatic(p[field], opts, keys);
                if (pk && pk !== p[field]) {
                  p[field] = pk;
                  hasChanges = true;
                }
              }
            });
            return p;
          });
          if (hasChanges) updated.relatedPeps = resolvedPeps;
        }

        return updated;
      });

      return hasChanges ? mapped : prev;
    });
  }, [
    nationalityOptions.length,
    identificationTypeOptions.length,
    countryOptions.length,
    dzongkhagOptions.length,
    maritalStatusOptions.length,
    occupationOptions.length,
    banksOptions.length,
    taxIdentifierTypeOptions.length,
    pepCategoryOptions.length,
    guarantors.length
  ]);

  // Constants
  const today = new Date().toISOString().split("T")[0];
  const fifteenYearsAgo = new Date();
  fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
  const maxDobDate = fifteenYearsAgo.toISOString().split("T")[0];

  // Filtered identification options (exclude Trade License and Company Registration)
  const filteredIdOptions = getFilteredIdentificationOptions(identificationTypeOptions);

  // --- HELPER: Find pk_code by label (Enhanced) ---
  const findPkCodeByLabel = (
    label: string,
    options: any[],
    labelFields: string[],
  ): string => {
    if (!label) return "";

    const getCode = (opt: any) =>
      String(
        opt.bank_pk_code ||
        opt.country_pk_code ||
        opt.nationality_pk_code ||
        opt.identity_type_pk_code ||
        opt.marital_status_pk_code ||
        opt.occupation_pk_code ||
        opt.dzongkhag_pk_code ||
        opt.gewog_pk_code ||
        opt.pep_category_pk_code ||
        opt.pep_sub_category_pk_code ||
        opt.lgal_constitution_pk_code ||
        opt.legal_const_pk_code ||
        opt.tax_identifier_type_pk_code ||   // <-- NEW
        opt.pk_code ||
        opt.id ||
        opt.code ||
        "",
      );

    // 1. Exact match on code
    for (const option of options) {
      const code = getCode(option);
      if (code && code === String(label)) {
        return code;
      }
    }

    const labelLower = String(label).toLowerCase().trim();
    const cleanLabel = labelLower.replace(/[^a-z0-9]/g, "");

    // 2. Strict match on label
    for (const option of options) {
      for (const field of labelFields) {
        const optionLabel = String(option[field] || "")
          .toLowerCase()
          .trim();
        const cleanOptionLabel = optionLabel.replace(/[^a-z0-9]/g, "");
        if (cleanOptionLabel && cleanOptionLabel === cleanLabel) {
          return getCode(option);
        }
      }
    }

    // 3. Partial match
    if (cleanLabel.length >= 4) {
      for (const option of options) {
        for (const field of labelFields) {
          const optionLabel = String(option[field] || "")
            .toLowerCase()
            .trim();
          const cleanOptionLabel = optionLabel.replace(/[^a-z0-9]/g, "");
          if (cleanOptionLabel && cleanOptionLabel.includes(cleanLabel)) {
            return getCode(option);
          }
        }
      }
    }

    return String(label);
  };

  // --- HELPER: Find label by ID (for storage) ---
  const findLabelById = (
    id: string,
    options: any[],
    labelFields: string[],
  ): string => {
    if (!id) return "";
    const option = options.find(
      (opt) =>
        String(
          opt.id ||
          opt.pk_code ||
          opt.bank_pk_code ||
          opt.country_pk_code ||
          opt.nationality_pk_code ||
          opt.identity_type_pk_code ||
          opt.marital_status_pk_code ||
          opt.occupation_pk_code ||
          opt.dzongkhag_pk_code ||
          opt.gewog_pk_code ||
          opt.pep_category_pk_code ||
          opt.pep_sub_category_pk_code ||
          opt.tax_identifier_type_pk_code ||   // <-- NEW
          opt.code
        ) === String(id),
    );
    if (!option) return id;
    for (const field of labelFields) {
      if (option[field]) return String(option[field]);
    }
    return id;
  };

  // --- HELPER: Nationality Check ---
  const isNatBhutanese = (nationalityId: string) => {
    if (!nationalityId) return false;
    const n = nationalityOptions.find((opt) => {
      const pkCode = String(
        opt.nationality_pk_code || opt.id || opt.code || "",
      );
      return pkCode === String(nationalityId);
    });
    const label = n
      ? n.nationality || n.name || n.label || ""
      : String(nationalityId);
    const lowerLabel = label.toLowerCase();
    return lowerLabel.includes("bhutan") && !lowerLabel.includes("non");
  };

  const isBhutanCountry = (countryValue: string, options: any[]): boolean => {
    if (!countryValue) return false;
    if (String(countryValue).toLowerCase().includes("bhutan")) return true;
    const matchedOption = options.find(
      (c) =>
        String(c.country_pk_code || c.id || c.code) === String(countryValue),
    );
    if (matchedOption) {
      const label = (
        matchedOption.country ||
        matchedOption.name ||
        ""
      ).toLowerCase();
      return label.includes("bhutan");
    }
    return false;
  };

  // --- HELPER: Determine if Married ---
  const checkIsMarried = (statusValue: string | number) => {
    if (!statusValue) return false;
    const statusStr = String(statusValue).toLowerCase();
    if (statusStr === "married") return true;
    if (statusStr === "unmarried") return false;

    const selectedOption = maritalStatusOptions.find((option) => {
      const val = String(
        option.marital_status_pk_code ||
        option.id ||
        option.value ||
        option.code ||
        "",
      );
      return val == statusValue;
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

  // --- DATA LOADING ---
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [
          nat,
          idTypes,
          countries,
          dzos,
          marital,
          pepCats,
          banks,
          occs,
          orgs,
          taxTypes, // <-- NEW
        ] = await Promise.all([
          fetchNationality().catch(() => []),
          fetchIdentificationType().catch(() => []),
          fetchCountry().catch(() => []),
          fetchDzongkhag().catch(() => []),
          fetchMaritalStatus().catch(() => []),
          fetchPepCategory().catch(() => []),
          fetchBanks().catch(() => []),
          fetchOccupations().catch(() => []),
          fetchLegalConstitution().catch(() => []),
          fetchTaxIdentifierType().catch(() => []), // <-- NEW
        ]);
        setNationalityOptions(nat);
        setIdentificationTypeOptions(idTypes);
        setCountryOptions(countries);
        setDzongkhagOptions(dzos);
        setMaritalStatusOptions(marital);
        setPepCategoryOptions(pepCats);
        setBankOptions(banks || []);
        setOccupationOptions(occs || []);
        setOrganizationOptions(orgs || []);
        setTaxIdentifierTypeOptions(taxTypes || []); // <-- NEW
      } catch (error) {
        console.error("Failed to load dropdown data:", error);
      }
    };
    loadAllData();
  }, []);

  // Sync with formData
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      if (formData.repaymentSource) {
        const { guarantors: savedGuarantors, ...restIncome } =
          formData.repaymentSource;
        setIncomeData((prev: any) => ({ ...prev, ...restIncome }));
        if (
          savedGuarantors &&
          Array.isArray(savedGuarantors) &&
          savedGuarantors.length > 0
        ) {
          setGuarantors((prev) => {
            const updated = [...savedGuarantors];
            if (prev[0] && prev[0].isVerified && (!updated[0] || !updated[0].isVerified)) {
              updated[0] = { ...updated[0], ...prev[0] };
            }
            return updated;
          });
        }
      } else if (formData.incomeDetails) {
        setIncomeData((prev: any) => ({ ...prev, ...formData.incomeDetails }));
        if (formData.guarantors && Array.isArray(formData.guarantors)) {
          setGuarantors((prev) => {
            const updated = [...formData.guarantors];
            if (prev[0] && prev[0].isVerified && (!updated[0] || !updated[0].isVerified)) {
              updated[0] = { ...updated[0], ...prev[0] };
            }
            return updated;
          });
        }
      }
    }
  }, [formData]);

  // --- DYNAMIC GEWOG LOADING (Per Guarantor) via robust loadAndResolveGewogs ---
  const loadAndResolveGewogs = async (
    dzongkhag: string,
    currentValue: string,
  ) => {
    if (!dzongkhag) return null;
    try {
      let dzongkhagCode = dzongkhag;
      const isNumeric = /^\d+$/.test(String(dzongkhag).trim());
      if (!isNumeric && dzongkhagOptions.length > 0) {
        const resolved = findPkCodeByLabelStatic(dzongkhag, dzongkhagOptions, ["dzongkhag", "dzongkhag_name", "dzongkhagName", "name", "label"]);
        if (resolved) dzongkhagCode = resolved;
      }
      const options = await fetchGewogsByDzongkhag(dzongkhagCode);
      let resolvedValue = currentValue;
      if (resolvedValue && options.length > 0) {
        const pkCode = findPkCodeByLabelStatic(resolvedValue, options, ["gewog", "gewog_name", "gewogName", "name", "label"]);
        if (pkCode && pkCode !== resolvedValue) resolvedValue = pkCode;
      }
      return { options, resolvedValue };
    } catch {
      return { options: [], resolvedValue: currentValue };
    }
  };

  useEffect(() => {
    const run = async () => {
      const jobs = guarantors.map(async (g, i) => {
        if (g.permDzongkhag) {
          const res = await loadAndResolveGewogs(g.permDzongkhag, g.permGewog);
          return { i, dzongkhag: g.permDzongkhag, ...(res || { options: [], resolvedValue: g.permGewog }) };
        }
        return { i, dzongkhag: null, options: [], resolvedValue: g.permGewog };
      });
      const results = await Promise.all(jobs);
      setGuarantors((prev) => {
        if (prev.length !== results.length) return prev;
        let changed = false;
        const updated = [...prev];
        for (const res of results) {
          const g = updated[res.i];
          if (!g) continue;
          if (res.dzongkhag) {
            const optChanged = !g.permGewogOptions || g.permGewogOptions.length !== (res.options?.length || 0);
            const valChanged = res.resolvedValue !== g.permGewog;
            if (optChanged || valChanged) {
              updated[res.i] = { ...g, permGewogOptions: res.options || [], permGewog: res.resolvedValue || g.permGewog };
              changed = true;
            }
          }
        }
        return changed ? updated : prev;
      });
    };
    run();
  }, [guarantors.map((g) => `${g.permDzongkhag}-${g.permGewog}`).join(","), dzongkhagOptions.length]);

  useEffect(() => {
    const run = async () => {
      const jobs = guarantors.map(async (g, i) => {
        if (g.currDzongkhag) {
          const res = await loadAndResolveGewogs(g.currDzongkhag, g.currGewog);
          return { i, dzongkhag: g.currDzongkhag, ...(res || { options: [], resolvedValue: g.currGewog }) };
        }
        return { i, dzongkhag: null, options: [], resolvedValue: g.currGewog };
      });
      const results = await Promise.all(jobs);
      setGuarantors((prev) => {
        if (prev.length !== results.length) return prev;
        let changed = false;
        const updated = [...prev];
        for (const res of results) {
          const g = updated[res.i];
          if (!g) continue;
          if (res.dzongkhag) {
            const optChanged = !g.currGewogOptions || g.currGewogOptions.length !== (res.options?.length || 0);
            const valChanged = res.resolvedValue !== g.currGewog;
            if (optChanged || valChanged) {
              updated[res.i] = { ...g, currGewogOptions: res.options || [], currGewog: res.resolvedValue || g.currGewog };
              changed = true;
            }
          }
        }
        return changed ? updated : prev;
      });
    };
    run();
  }, [guarantors.map((g) => `${g.currDzongkhag}-${g.currGewog}`).join(","), dzongkhagOptions.length]);

  useEffect(() => {
    const run = async () => {
      const jobs = guarantors.map(async (g, i) => {
        if (g.spousePermDzongkhag) {
          const res = await loadAndResolveGewogs(g.spousePermDzongkhag, g.spousePermGewog);
          return { i, dzongkhag: g.spousePermDzongkhag, ...(res || { options: [], resolvedValue: g.spousePermGewog }) };
        }
        return { i, dzongkhag: null, options: [], resolvedValue: g.spousePermGewog };
      });
      const results = await Promise.all(jobs);
      setGuarantors((prev) => {
        if (prev.length !== results.length) return prev;
        let changed = false;
        const updated = [...prev];
        for (const res of results) {
          const g = updated[res.i];
          if (!g) continue;
          if (res.dzongkhag) {
            const optChanged = !g.spousePermGewogOptions || g.spousePermGewogOptions.length !== (res.options?.length || 0);
            const valChanged = res.resolvedValue !== g.spousePermGewog;
            if (optChanged || valChanged) {
              updated[res.i] = { ...g, spousePermGewogOptions: res.options || [], spousePermGewog: res.resolvedValue || g.spousePermGewog };
              changed = true;
            }
          }
        }
        return changed ? updated : prev;
      });
    };
    run();
  }, [guarantors.map((g) => `${g.spousePermDzongkhag}-${g.spousePermGewog}`).join(","), dzongkhagOptions.length]);

  // --- ENHANCED METADATA REHYDRATION (Per Guarantor & Related PEPs) ---
  useEffect(() => {
    const rehydrateMetadata = async () => {
      let changed = false;
      const updatedGuarantors = await Promise.all(guarantors.map(async (g, gIdx) => {
        let updatedG = { ...g };
        let gChanged = false;

        // 1. Resolve Pep Subcategories for Guarantor
        if (updatedG.isPep === "yes" && updatedG.pepCategory) {
          try {
            const options = await fetchPepSubCategoryByCategory(updatedG.pepCategory);
            if (!updatedG.pepSubCategoryOptions || updatedG.pepSubCategoryOptions.length !== (options?.length || 0)) {
              updatedG.pepSubCategoryOptions = options || [];
              gChanged = true;
            }
            // If subcategory is label, resolve it
            if (updatedG.pepSubCategory && options?.length > 0) {
              const pk = findPkCodeByLabelStatic(updatedG.pepSubCategory, options, ["pep_sub_category", "name", "label"]);
              if (pk && pk !== updatedG.pepSubCategory) {
                updatedG.pepSubCategory = pk;
                gChanged = true;
              }
            }
          } catch (e) {}
        }

        // 2. Resolve metadata for Related PEPs (Subcategories and Gewogs)
        if (updatedG.relatedPeps && Array.isArray(updatedG.relatedPeps)) {
          const updatedPeps = await Promise.all(updatedG.relatedPeps.map(async (pep, pIdx) => {
            let p = { ...pep };
            let pChanged = false;

            // Fetch Subcategories for PEP relative
            if (p.category) {
              try {
                const opts = await fetchPepSubCategoryByCategory(p.category);
                if (!updatedG.relatedPepOptionsMap[pIdx] || updatedG.relatedPepOptionsMap[pIdx].length !== (opts?.length || 0)) {
                  updatedG.relatedPepOptionsMap = { ...updatedG.relatedPepOptionsMap, [pIdx]: opts || [] };
                  gChanged = true;
                }
                if (p.subCategory && opts?.length > 0) {
                  const pk = findPkCodeByLabelStatic(p.subCategory, opts, ["pep_sub_category", "name", "label"]);
                  if (pk && pk !== p.subCategory) { p.subCategory = pk; pChanged = true; }
                }
              } catch (e) {}
            }

            // Fetch Gewogs for PEP relative
            const dzConfigs = [
              { dz: p.permDzongkhag, mapKey: 'relatedPepPermGewogMap', field: 'permGewog' },
              { dz: p.currDzongkhag, mapKey: 'relatedPepCurrGewogMap', field: 'currGewog' },
              { dz: p.spousePermDzongkhag, mapKey: 'relatedPepSpouseGewogMap', field: 'spousePermGewog' }
            ] as const;

            for (const { dz, mapKey, field } of dzConfigs) {
              if (dz) {
                try {
                  const opts = await fetchGewogsByDzongkhag(dz);
                  const currentOpts = updatedG[mapKey as keyof typeof updatedG] as Record<number, any[]>;
                  if (!currentOpts[pIdx] || currentOpts[pIdx].length !== (opts?.length || 0)) {
                    (updatedG[mapKey as keyof typeof updatedG] as Record<number, any[]>) = { ...currentOpts, [pIdx]: opts || [] };
                    gChanged = true;
                  }
                  if (p[field as keyof typeof p] && opts?.length > 0) {
                    const pk = findPkCodeByLabelStatic(p[field as keyof typeof p] as string, opts, ["gewog", "name", "label"]);
                    if (pk && pk !== p[field as keyof typeof p]) { (p[field as keyof typeof p] as any) = pk; pChanged = true; }
                  }
                } catch (e) {}
              }
            }
            return pChanged ? p : pep;
          }));
          if (updatedPeps.some((p, i) => p !== updatedG.relatedPeps[i])) {
            updatedG.relatedPeps = updatedPeps;
            gChanged = true;
          }
        }

        if (gChanged) changed = true;
        return gChanged ? updatedG : g;
      }));

      if (changed) setGuarantors(updatedGuarantors);
    };

    rehydrateMetadata();
  }, [guarantors.length]); // Focus on initialization and manual additionstions]);



  // --- HANDLERS ---

  const handleIncomeChange = (field: string, value: any) => {
    setIncomeData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleRepaymentProofChange = (file: File | null) => {
    if (file) {
      // Store the filename string (not the File object) so it survives JSON serialization in session
      setIncomeData((prev: any) => ({ ...prev, repaymentProof: file.name }));
    }
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
    const guarantor = guarantors[index];
    if (guarantor.lookupStatus === "found" && guarantor.fetchedCustomerData) {
      const d = guarantor.fetchedCustomerData;

      // ---- Resolve all dropdown label → PK codes ----
      const resolvedNationality = findPkCodeByLabelStatic(d.nationality, nationalityOptions, ["nationality", "name", "label"]) || d.nationality || "";
      const resolvedMaritalStatus = findPkCodeByLabelStatic(d.maritalStatus, maritalStatusOptions, ["marital_status", "name", "label"]) || d.maritalStatus || "";
      const resolvedBankName = findPkCodeByLabelStatic(d.bankName, banksOptions, ["bank_name", "name", "label", "bank"]) || d.bankName || "";
      const resolvedOccupation = findPkCodeByLabelStatic(d.occupation, occupationOptions, ["occ_name", "occupation", "name", "label"]) || d.occupation || "";
      const resolvedOrganization = findPkCodeByLabelStatic(d.organizationName || d.employerName, organizationOptions, ["lgal_constitution", "legal_const_name", "name", "label"]) || d.organizationName || d.employerName || "";
      const resolvedPermCountry = findPkCodeByLabelStatic(d.permCountry || d.permanentCountry, countryOptions, ["country", "country_name", "name", "label"]) || d.permCountry || "";
      const resolvedPermDzongkhag = findPkCodeByLabelStatic(d.permDzongkhag || d.permanentDzongkhag, dzongkhagOptions, ["dzongkhag", "dzongkhag_name", "name", "label"]) || d.permDzongkhag || "";
      const resolvedCurrCountry = findPkCodeByLabelStatic(d.currCountry || d.currentCountry, countryOptions, ["country", "country_name", "name", "label"]) || d.currCountry || "";
      const resolvedCurrDzongkhag = findPkCodeByLabelStatic(d.currDzongkhag || d.currentDzongkhag, dzongkhagOptions, ["dzongkhag", "dzongkhag_name", "name", "label"]) || d.currDzongkhag || "";
      const mappedTaxIdentifier = findPkCodeByLabelStatic(d.taxIdentifierType, taxIdentifierTypeOptions, ["tax_identifier_type", "name", "label"]) || d.taxIdentifierType || "";
      const resolvedPepCategory = findPkCodeByLabelStatic(d.pepCategory, pepCategoryOptions, ["pep_category", "name", "label"]) || d.pepCategory || "";
      const resolvedIdType = findPkCodeByLabelStatic(d.idType || d.identificationType, identificationTypeOptions, ["identity_type", "identification_type", "name", "label"]) || d.idType || d.identificationType || "";

      // Spouse
      const resolvedSpouseNationality = findPkCodeByLabelStatic(d.spouseNationality, nationalityOptions, ["nationality", "name", "label"]) || d.spouseNationality || "";
      const resolvedSpousePermCountry = findPkCodeByLabelStatic(d.spousePermCountry, countryOptions, ["country", "country_name", "name", "label"]) || d.spousePermCountry || "";
      const resolvedSpousePermDzongkhag = findPkCodeByLabelStatic(d.spousePermDzongkhag, dzongkhagOptions, ["dzongkhag", "dzongkhag_name", "name", "label"]) || d.spousePermDzongkhag || "";
      const resolvedSpouseTaxIdentifierType = findPkCodeByLabelStatic(d.spouseTaxIdentifierType, taxIdentifierTypeOptions, ["tax_identifier_type", "name", "label"]) || d.spouseTaxIdentifierType || "";

      // Employment Status Derivation
      let derivedEmploymentStatus = d.employmentStatus ? String(d.employmentStatus).toLowerCase() : "";
      if (derivedEmploymentStatus === "self employed") derivedEmploymentStatus = "self-employed";
      if (!derivedEmploymentStatus && (resolvedOccupation || d.employerType || d.organizationName || d.employeeId)) {
        derivedEmploymentStatus = "employed";
      }

      // Employer Type
      let resolvedEmployerType = "";
      const rawEmployer = String(d.employerType || d.organizationType || "").toLowerCase();
      if (rawEmployer.includes("gov") || rawEmployer.includes("civil") || rawEmployer.includes("public") || rawEmployer.includes("armed") || rawEmployer.includes("ministry") || rawEmployer.includes("rgob") || rawEmployer.includes("authority") || rawEmployer.includes("council") || rawEmployer.includes("police") || rawEmployer.includes("royal")) {
        resolvedEmployerType = "government";
      } else if (rawEmployer.includes("priv") || rawEmployer.includes("pvt") || rawEmployer.includes("enterprise") || rawEmployer.includes("business") || rawEmployer.includes("shop")) {
        resolvedEmployerType = "private";
      } else if (rawEmployer.includes("corp") || rawEmployer.includes("institution") || rawEmployer.includes("bank") || rawEmployer.includes("limited") || rawEmployer.includes("ltd") || rawEmployer.includes("dhi") || rawEmployer.includes("board") || rawEmployer.includes("agency") || rawEmployer.includes("ngo")) {
        resolvedEmployerType = "corporate";
      }

      // Designation
      let resolvedDesignation = String(d.designation || "").toLowerCase();
      if (resolvedDesignation.includes("manag") || resolvedDesignation.includes("dir") || resolvedDesignation.includes("head") || resolvedDesignation.includes("chief")) resolvedDesignation = "manager";
      else if (resolvedDesignation.includes("officer") || resolvedDesignation.includes("clerk") || resolvedDesignation.includes("exec") || resolvedDesignation.includes("analyst")) resolvedDesignation = "officer";
      else if (resolvedDesignation.includes("assist") || resolvedDesignation.includes("helper") || resolvedDesignation.includes("support")) resolvedDesignation = "assistant";
      else resolvedDesignation = "";

      // Service Nature
      let resolvedServiceNature = String(d.serviceNature || d.natureOfService || "").toLowerCase();
      if (resolvedServiceNature.includes("perm") || resolvedServiceNature.includes("regula")) resolvedServiceNature = "permanent";
      else if (resolvedServiceNature.includes("contract")) resolvedServiceNature = "contract";
      else if (resolvedServiceNature.includes("temp") || resolvedServiceNature.includes("casual")) resolvedServiceNature = "temporary";
      else resolvedServiceNature = "";

      // Grade
      let resolvedGrade = String(d.grade || "").toLowerCase();
      if (resolvedGrade.includes("p1")) resolvedGrade = "p1";
      else if (resolvedGrade.includes("p2")) resolvedGrade = "p2";
      else if (resolvedGrade.includes("p3")) resolvedGrade = "p3";
      else {
        const gMatch = resolvedGrade.match(/\d+/);
        if (gMatch) { const n = parseInt(gMatch[0]); resolvedGrade = (n >= 1 && n <= 11) ? String(n) : ""; }
        else resolvedGrade = "";
      }

      // PEP
      const rawPepRelated = String(d.pepRelated || d.relatedToAnyPep || "").toLowerCase();
      const resolvedRelatedToPep = rawPepRelated === "yes" ? "yes" : rawPepRelated === "no" ? "no" : "";

      const formattedData = {
        nationality: resolvedNationality,
        idType: resolvedIdType,
        idNumber: d.idNumber || d.identificationNo || "",
        idIssueDate: formatDateForInput(d.identificationIssueDate),
        idExpiryDate: formatDateForInput(d.identificationExpiryDate),
        dateOfBirth: formatDateForInput(d.dateOfBirth),
        tpnNo: d.tpn || "",
        taxIdentifierType: mappedTaxIdentifier,
        householdNumber: d.householdNumber || "",
        maritalStatus: resolvedMaritalStatus,
        gender: d.gender ? String(d.gender).toLowerCase() : "",
        email: d.email || d.currEmail || "",
        contact: d.contact || d.currContact || "",
        currAlternateContact: d.alternatePhone || d.currAlternateContact || "",
        bankName: resolvedBankName,
        bankAccountNumber: d.bankAccount || d.bankAccountNo || "",
        idProof: d.identityProofName || d.idProofDocument || "",
        passportPhoto: d.passportPhotoName || d.passportPhoto || "",
        familyTree: d.familyTreeName || d.familyTree || "",

        // Permanent Address
        permCountry: resolvedPermCountry,
        permDzongkhag: resolvedPermDzongkhag,
        permGewog: d.permGewog || d.permanentGewog || "",
        permVillage: d.permVillage || d.permanentStreet || "",
        permThram: d.permThram || d.thramNo || "",
        permHouse: d.permHouse || d.houseNo || "",

        // Current Address
        currCountry: resolvedCurrCountry,
        currDzongkhag: resolvedCurrDzongkhag,
        currGewog: d.currGewog || d.currentGewog || "",
        currVillage: d.currVillage || d.currentStreet || "",
        currHouse: d.currHouse || d.currFlat || d.currentBuildingNo || "",

        // Employment
        employmentStatus: derivedEmploymentStatus,
        employeeId: d.employeeId || "",
        occupation: resolvedOccupation,
        employerType: resolvedEmployerType,
        designation: resolvedDesignation,
        grade: resolvedGrade,
        organizationName: resolvedOrganization,
        orgLocation: d.orgLocation || d.organizationLocation || "",
        joiningDate: formatDateForInput(d.joiningDate || d.appointmentDate),
        serviceNature: resolvedServiceNature,
        annualSalary: d.annualSalary || d.annualIncome || "",
        contractEndDate: formatDateForInput(d.contractEndDate),

        // PEP
        isPep: d.pepPerson || (String(d.pepDeclaration || "").toLowerCase() === "yes" ? "yes" : "no"),
        pepCategory: resolvedPepCategory,
        pepSubCategory: d.pepSubCategory || "",
        relatedToPep: resolvedRelatedToPep,

        // Spouse
        spouseNationality: resolvedSpouseNationality,
        spouseTaxIdentifierType: resolvedSpouseTaxIdentifierType,
        spousePermCountry: resolvedSpousePermCountry,
        spousePermDzongkhag: resolvedSpousePermDzongkhag,
        spousePermGewog: d.spousePermGewog || "",
        spousePermVillage: d.spousePermVillage || "",
        spousePermThram: d.spousePermThram || "",
        spousePermHouse: d.spousePermHouse || "",
        spouseIdentificationType: d.spouseIdentificationType || "",
        spouseIdentificationNo: d.spouseIdentificationNo || "",
        spouseSalutation: d.spouseSalutation ? String(d.spouseSalutation).toLowerCase().replace(/\./g, "") : "",
        spouseName: d.spouseName || "",
        spouseGender: d.spouseGender ? String(d.spouseGender).toLowerCase() : "",
        spouseIdentificationIssueDate: formatDateForInput(d.spouseIdentificationIssueDate),
        spouseIdentificationExpiryDate: formatDateForInput(d.spouseIdentificationExpiryDate),
        spouseTpn: d.spouseTpn || "",
        spouseDateOfBirth: formatDateForInput(d.spouseDateOfBirth),
        spouseHouseholdNumber: d.spouseHouseholdNumber || "",
        spouseEmail: d.spouseEmail || "",
        spouseContact: d.spouseContact || "",
        spouseAlternateContact: d.spouseAlternateContact || "",
      };

      setGuarantors((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...prev[index],
          ...formattedData,
          guarantorName: d.name || d.applicantName || prev[index].guarantorName,
          salutation: d.salutation || prev[index].salutation,
          idType: prev[index].idType,
          idNumber: prev[index].idNumber,
          showLookupPopup: false,
        };
        return updated;
      });
    } else {
      setGuarantors((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], showLookupPopup: false };
        return updated;
      });
    }
  };

  // --- PEP HANDLERS ---
  const handleAddRelatedPep = useCallback((index: number) => {
    setGuarantors((prev) => {
      const up = [...prev];
      if (!up[index].relatedPeps) {
        up[index].relatedPeps = [];
      }
      up[index].relatedPeps = [
        ...up[index].relatedPeps,
        createEmptyRelatedPep(),
      ];
      return up;
    });
  }, []);

  const handleRemoveRelatedPep = (gIndex: number, pIndex: number) => {
    setGuarantors((prev) => {
      const up = [...prev];

      if (!up[gIndex].relatedPeps || up[gIndex].relatedPeps.length === 0) {
        return up;
      }

      const updatedRelatedPeps = [...up[gIndex].relatedPeps];
      updatedRelatedPeps.splice(pIndex, 1);

      // Cleanup options maps
      const cleanMap = (mapObj: Record<number, any[]>) => {
        const newMap: Record<number, any[]> = { ...mapObj };
        Object.keys(newMap).forEach((key) => {
          const keyNum = parseInt(key);
          if (keyNum > pIndex) {
            newMap[keyNum - 1] = newMap[keyNum];
            delete newMap[keyNum];
          } else if (keyNum === pIndex) {
            delete newMap[keyNum];
          }
        });
        return newMap;
      };

      up[gIndex] = {
        ...up[gIndex],
        relatedPeps: updatedRelatedPeps,
        relatedPepOptionsMap: cleanMap(up[gIndex].relatedPepOptionsMap || {}),
        relatedPepSpouseGewogMap: cleanMap(
          up[gIndex].relatedPepSpouseGewogMap || {},
        ),
        relatedPepPermGewogMap: cleanMap(
          up[gIndex].relatedPepPermGewogMap || {},
        ),
        relatedPepCurrGewogMap: cleanMap(
          up[gIndex].relatedPepCurrGewogMap || {},
        ),
      };

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

      if (!up[gIndex].relatedPeps) {
        up[gIndex].relatedPeps = [];
      }

      const peps = [...up[gIndex].relatedPeps];

      if (!peps[pIndex]) {
        peps[pIndex] = createEmptyRelatedPep();
      }

      peps[pIndex] = { ...peps[pIndex], [field]: value };
      up[gIndex].relatedPeps = peps;

      // Handle Category Fetch
      if (field === "category") {
        peps[pIndex].subCategory = "";
        fetchPepSubCategoryByCategory(value)
          .then((res) => {
            setGuarantors((curr) => {
              const cUp = [...curr];
              cUp[gIndex].relatedPepOptionsMap = {
                ...(cUp[gIndex].relatedPepOptionsMap || {}),
                [pIndex]: res || [],
              };
              return cUp;
            });
          })
          .catch(() => { });
      }

      // Handle Dynamic Gewog Fetches for PEP
      if (field === "spousePermDzongkhag") {
        peps[pIndex].spousePermGewog = "";
        fetchGewogsByDzongkhag(value)
          .then((res) => {
            setGuarantors((curr) => {
              const cUp = [...curr];
              cUp[gIndex].relatedPepSpouseGewogMap = {
                ...(cUp[gIndex].relatedPepSpouseGewogMap || {}),
                [pIndex]: res || [],
              };
              return cUp;
            });
          })
          .catch(() => { });
      }

      if (field === "permDzongkhag") {
        peps[pIndex].permGewog = "";
        fetchGewogsByDzongkhag(value)
          .then((res) => {
            setGuarantors((curr) => {
              const cUp = [...curr];
              cUp[gIndex].relatedPepPermGewogMap = {
                ...(cUp[gIndex].relatedPepPermGewogMap || {}),
                [pIndex]: res || [],
              };
              return cUp;
            });
          })
          .catch(() => { });
      }

      if (field === "currDzongkhag") {
        peps[pIndex].currGewog = "";
        fetchGewogsByDzongkhag(value)
          .then((res) => {
            setGuarantors((curr) => {
              const cUp = [...curr];
              cUp[gIndex].relatedPepCurrGewogMap = {
                ...(cUp[gIndex].relatedPepCurrGewogMap || {}),
                [pIndex]: res || [],
              };
              return cUp;
            });
          })
          .catch(() => { });
      }

      return up;
    });
  };

  const handleRelatedPepFileChange = (
    gIndex: number,
    pIndex: number,
    field: string,
    file: File | null,
  ) => {
    if (file) {
      setGuarantors((prev) => {
        const updated = [...prev];
        const relatedPeps = [...updated[gIndex].relatedPeps];
        relatedPeps[pIndex] = {
          ...relatedPeps[pIndex],
          [field]: file.name,
        };
        updated[gIndex].relatedPeps = relatedPeps;
        return updated;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const getLabel = (value: string, options: any[], labelField: string, codeField: string) => {
      if (!value) return value;
      const opt = options.find((o: any) => String(o[codeField] || o.id) === String(value));
      return opt ? (opt[labelField] || opt.name || opt.label || opt.bankName || opt.bank || opt.dzongkhag || opt.gewog || opt.country || value) : value;
    };

    const resolvedGuarantors = (incomeData.repaymentGuarantor === "yes" ? guarantors : []).map((g: any) => {
      const resolved = { ...g };
      resolved.idType = getLabel(g.idType, identificationTypeOptions, "identity_type", "identity_type_pk_code");
      resolved.nationality = getLabel(g.nationality, nationalityOptions, "nationality", "nationality_pk_code");
      resolved.maritalStatus = getLabel(g.maritalStatus, maritalStatusOptions, "marital_status", "marital_status_pk_code");
      resolved.bankName = getLabel(g.bankName, banksOptions, "bank_name", "bank_pk_code");
      resolved.taxIdentifierType = getLabel(g.taxIdentifierType, taxIdentifierTypeOptions, "tax_identifier_type", "tax_identifier_type_pk_code");
      resolved.permCountry = getLabel(g.permCountry, countryOptions, "country", "country_pk_code");
      resolved.currCountry = getLabel(g.currCountry, countryOptions, "country", "country_pk_code");
      resolved.permDzongkhag = getLabel(g.permDzongkhag, dzongkhagOptions, "dzongkhag", "dzongkhag_pk_code");
      resolved.currDzongkhag = getLabel(g.currDzongkhag, dzongkhagOptions, "dzongkhag", "dzongkhag_pk_code");
      resolved.permGewog = getLabel(g.permGewog, g.permGewogOptions || [], "gewog", "gewog_pk_code");
      resolved.currGewog = getLabel(g.currGewog, g.currGewogOptions || [], "gewog", "gewog_pk_code");
      resolved.occupation = getLabel(g.occupation, occupationOptions, "occ_name", "occ_pk_code");
      resolved.organizationName = getLabel(g.organizationName, organizationOptions, "lgal_constitution", "lgal_constitution_pk_code");

      // Spouse Resolution
      resolved.spouseIdentificationType = getLabel(g.spouseIdentificationType, identificationTypeOptions, "identity_type", "identity_type_pk_code");
      resolved.spouseNationality = getLabel(g.spouseNationality, nationalityOptions, "nationality", "nationality_pk_code");
      resolved.spouseTaxIdentifierType = getLabel(g.spouseTaxIdentifierType, taxIdentifierTypeOptions, "tax_identifier_type", "tax_identifier_type_pk_code");
      resolved.spousePermCountry = getLabel(g.spousePermCountry, countryOptions, "country", "country_pk_code");
      resolved.spousePermDzongkhag = getLabel(g.spousePermDzongkhag, dzongkhagOptions, "dzongkhag", "dzongkhag_pk_code");
      resolved.spousePermGewog = getLabel(g.spousePermGewog, g.spousePermGewogOptions || [], "gewog", "gewog_pk_code");
      resolved.pepCategory = getLabel(g.pepCategory, pepCategoryOptions, "pep_category", "pep_category_pk_code");
      resolved.pepSubCategory = getLabel(g.pepSubCategory, g.pepSubCategoryOptions || [], "pep_sub_category", "pep_sub_category_pk_code");

      if (Array.isArray(g.relatedPeps)) {
        resolved.relatedPeps = g.relatedPeps.map((pep: any, i: number) => ({
          ...pep,
          identificationType: getLabel(pep.identificationType, identificationTypeOptions, "identity_type", "identity_type_pk_code"),
          nationality: getLabel(pep.nationality, nationalityOptions, "nationality", "nationality_pk_code"),
          permCountry: getLabel(pep.permCountry, countryOptions, "country", "country_pk_code"),
          permDzongkhag: getLabel(pep.permDzongkhag, dzongkhagOptions, "dzongkhag", "dzongkhag_pk_code"),
          permGewog: getLabel(pep.permGewog, g.relatedPepPermGewogMap?.[i] || [], "gewog", "gewog_pk_code"),
          currCountry: getLabel(pep.currCountry, countryOptions, "country", "country_pk_code"),
          currDzongkhag: getLabel(pep.currDzongkhag, dzongkhagOptions, "dzongkhag", "dzongkhag_pk_code"),
          currGewog: getLabel(pep.currGewog, g.relatedPepCurrGewogMap?.[i] || [], "gewog", "gewog_pk_code"),
          category: getLabel(pep.category, pepCategoryOptions, "pep_category", "pep_category_pk_code"),
          subCategory: getLabel(pep.subCategory, g.relatedPepOptionsMap?.[i] || [], "pep_sub_category", "pep_sub_category_pk_code"),
        }));
      }
      return resolved;
    });

    const repaymentData = {
      repaymentSource: {
        ...incomeData,
        guarantors: resolvedGuarantors,
      },
    };

    onNext(repaymentData);
  };

  // Filter tax identifier types to show only Personal Income Tax (PIT)   <-- NEW
  const personalTaxIdentifierOptions = taxIdentifierTypeOptions.filter((opt) => {
    const label = (opt.tax_identifier_type || opt.name || "").toLowerCase();
    return label.includes("personal income tax") || label === "pit";
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* 1. INCOME DETAILS */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
          INCOME DETAILS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Monthly Salary - Civil Servant */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chk-salary-civil"
                checked={incomeData.enableMonthlySalaryCivil || false}
                onChange={(e) =>
                  handleIncomeChange("enableMonthlySalaryCivil", e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-400"
              />
              <label
                htmlFor="chk-salary-civil"
                className="text-gray-800 font-semibold text-sm"
              >
                Monthly Salary - Civil Servant (Nu.)
              </label>
            </div>
            <Input
              type="number"
              disabled={!incomeData.enableMonthlySalaryCivil}
              value={incomeData.monthlySalaryCivil || ""}
              onChange={(e) =>
                handleIncomeChange("monthlySalaryCivil", e.target.value)
              }
              placeholder="Amount"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
            />
          </div>

          {/* Monthly Salary - Corporate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chk-salary-corporate"
                checked={incomeData.enableMonthlySalaryCorporate || false}
                onChange={(e) =>
                  handleIncomeChange("enableMonthlySalaryCorporate", e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-400"
              />
              <label
                htmlFor="chk-salary-corporate"
                className="text-gray-800 font-semibold text-sm"
              >
                Monthly Salary - Corporate (Nu.)
              </label>
            </div>
            <Input
              type="number"
              disabled={!incomeData.enableMonthlySalaryCorporate}
              value={incomeData.monthlySalaryCorporate || ""}
              onChange={(e) =>
                handleIncomeChange("monthlySalaryCorporate", e.target.value)
              }
              placeholder="Amount"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
            />
          </div>

          {/* Monthly Salary - Private */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chk-salary-private"
                checked={incomeData.enableMonthlySalaryPrivate || false}
                onChange={(e) =>
                  handleIncomeChange("enableMonthlySalaryPrivate", e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-400"
              />
              <label
                htmlFor="chk-salary-private"
                className="text-gray-800 font-semibold text-sm"
              >
                Monthly Salary - Private (Nu.)
              </label>
            </div>
            <Input
              type="number"
              disabled={!incomeData.enableMonthlySalaryPrivate}
              value={incomeData.monthlySalaryPrivate || ""}
              onChange={(e) =>
                handleIncomeChange("monthlySalaryPrivate", e.target.value)
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
              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                {incomeData.repaymentProof
                  ? (typeof incomeData.repaymentProof === "string"
                      ? incomeData.repaymentProof
                      : (incomeData.repaymentProof as File).name)
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
          const isPermBhutan = isBhutanCountry(
            guarantor.permCountry,
            countryOptions,
          );
          const isCurrBhutan = isBhutanCountry(
            guarantor.currCountry,
            countryOptions,
          );
          const isMarried = checkIsMarried(guarantor.maritalStatus);
          const relatedPeps = guarantor.relatedPeps || [
            createEmptyRelatedPep(),
          ];

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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                        {filteredIdOptions.length > 0 ? (
                          filteredIdOptions.map((opt, i) => (
                            <SelectItem
                              key={i}
                              value={String(opt.identity_type_pk_code || opt.id)}
                            >
                              {opt.identity_type || opt.name}
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
                        <SelectItem value="dr">Dr.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                      placeholder="Enter Full Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Identification Issue Date{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      max={today}
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
                      min={today}
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

                  {/* Tax Identifier Type - NEW field */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Tax Identifier Type
                    </Label>
                    <Select
                      value={guarantor.taxIdentifierType}
                      onValueChange={(val) =>
                        updateGuarantorField(index, "taxIdentifierType", val)
                      }
                    >
                      <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent>
                        {personalTaxIdentifierOptions.length > 0 ? (
                          personalTaxIdentifierOptions.map((opt, i) => (
                            <SelectItem
                              key={i}
                              value={String(opt.tax_identifier_type_pk_code || opt.id)}
                            >
                              {opt.tax_identifier_type || opt.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
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

                  {isNatBhutanese(guarantor.nationality) && (
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">
                        Household Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                        placeholder="Enter Household Number"
                        value={guarantor.householdNumber || ""}
                        onChange={(e) =>
                          updateGuarantorField(
                            index,
                            "householdNumber",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Marital Status <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={String(guarantor.maritalStatus || "")}
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t mt-4">
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
                      <span className="text-sm text-gray-500 truncate max-w-[150px]">
                        {guarantor.familyTree || "No file chosen"}
                      </span>
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
                      <span className="text-sm text-gray-500 truncate max-w-[150px]">
                        {guarantor.passportPhoto || "No file chosen"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Identification Proof
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        className="hidden"
                        id={`idProof-${index}`}
                        onChange={(e) =>
                          handleFileChange(
                            index,
                            "idProof",
                            e.target.files?.[0] || null,
                          )
                        }
                      />
                      <Button
                        variant="outline"
                        type="button"
                        className="h-12 w-28"
                        onClick={() =>
                          document.getElementById(`idProof-${index}`)?.click()
                        }
                      >
                        Choose File
                      </Button>
                      <span className="text-sm text-gray-500 truncate max-w-[150px]">
                        {guarantor.idProof || "No file chosen"}
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
                      value={guarantor.bankAccountNumber || ""}
                      onChange={(e) =>
                        updateGuarantorField(
                          index,
                          "bankAccountNumber",
                          e.target.value,
                        )
                      }
                    />
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
                      <span className="text-sm text-gray-500 truncate max-w-[200px]">
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
                      value={guarantor.currAlternateContact || ""}
                      onChange={(e) =>
                        updateGuarantorField(
                          index,
                          "currAlternateContact",
                          e.target.value,
                        )
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
                      <span className="text-sm text-gray-500 truncate max-w-[200px]">
                        {guarantor.currAddressProof || "No file chosen"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* D. EMPLOYMENT DETAILS */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                  Employment Details (Guarantor {index + 1})
                </h2>

                {/* Employment Status Radio */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Employment Status <span className="text-red-500">*</span>
                  </Label>
                  <RadioGroup
                    value={guarantor.employmentStatus || ""}
                    onValueChange={(val) => updateGuarantorField(index, "employmentStatus", val)}
                    className="flex flex-wrap gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="employed" id={`emp-employed-${index}`} />
                      <Label htmlFor={`emp-employed-${index}`}>Employed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="self-employed" id={`emp-self-${index}`} />
                      <Label htmlFor={`emp-self-${index}`}>Self Employed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unemployed" id={`emp-un-${index}`} />
                      <Label htmlFor={`emp-un-${index}`}>Unemployed</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Employment Fields - shown when employed */}
                {(guarantor.employmentStatus === "employed" || guarantor.employmentStatus === "self-employed") && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          Employee ID
                        </Label>
                        <Input
                          placeholder="Enter Employee ID"
                          className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          value={guarantor.employeeId || ""}
                          onChange={(e) => updateGuarantorField(index, "employeeId", e.target.value)}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          Occupation <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.occupation}
                          onValueChange={(val) => updateGuarantorField(index, "occupation", val)}
                        >
                          <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent sideOffset={4}>
                            {occupationOptions.length > 0 ? (
                              occupationOptions.map((option, optionIndex) => {
                                const key = option.occ_pk_code || option.occupation_pk_code || option.id || `occ-${optionIndex}`;
                                const value = String(option.occ_pk_code || option.occupation_pk_code || option.id || optionIndex);
                                const label = option.occ_name || option.occupation || option.name || "Unknown";
                                return <SelectItem key={key} value={value}>{label}</SelectItem>;
                              })
                            ) : (
                              <SelectItem value="loading" disabled>Loading...</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          Type of Employer <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.employerType}
                          onValueChange={(val) => updateGuarantorField(index, "employerType", val)}
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          Designation <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.designation}
                          onValueChange={(val) => updateGuarantorField(index, "designation", val)}
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
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          Grade <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.grade}
                          onValueChange={(val) => updateGuarantorField(index, "grade", val)}
                        >
                          <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent sideOffset={4}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                            <SelectItem value="p1">P1</SelectItem>
                            <SelectItem value="p2">P2</SelectItem>
                            <SelectItem value="p3">P3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          Organization Name <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.organizationName}
                          onValueChange={(val) => updateGuarantorField(index, "organizationName", val)}
                        >
                          <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent sideOffset={4}>
                            {guarantor.organizationName && !organizationOptions.find((o: any) => String(o.lgal_constitution_pk_code || o.legal_const_pk_code || o.id) === guarantor.organizationName) && (
                              <SelectItem value={guarantor.organizationName}>{guarantor.organizationName}</SelectItem>
                            )}
                            {organizationOptions.length > 0 ? (
                              organizationOptions.map((option: any, optionIndex: number) => {
                                const key = option.lgal_constitution_pk_code || option.legal_const_pk_code || option.id || `org-${optionIndex}`;
                                const value = String(option.lgal_constitution_pk_code || option.legal_const_pk_code || option.id || optionIndex);
                                const label = option.lgal_constitution || option.legal_const_name || option.name || "Unknown";
                                return <SelectItem key={key} value={value}>{label}</SelectItem>;
                              })
                            ) : (
                              <SelectItem value="loading" disabled>Loading...</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Organization Location</Label>
                        <Input
                          placeholder="Enter Location"
                          className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          value={guarantor.orgLocation || ""}
                          onChange={(e) => updateGuarantorField(index, "orgLocation", e.target.value)}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Service Joining Date</Label>
                        <Input
                          type="date"
                          max={today}
                          className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          value={guarantor.joiningDate || ""}
                          onChange={(e) => updateGuarantorField(index, "joiningDate", e.target.value)}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          Nature of Service <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.serviceNature}
                          onValueChange={(val) => updateGuarantorField(index, "serviceNature", val)}
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          Gross Annual Salary Income <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="Enter Annual Salary"
                          className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                          value={guarantor.annualSalary || ""}
                          onChange={(e) => updateGuarantorField(index, "annualSalary", e.target.value)}
                        />
                      </div>
                      {guarantor.serviceNature === "contract" && (
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">
                            Contract End Date <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="date"
                            min={today}
                            className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                            value={guarantor.contractEndDate || ""}
                            onChange={(e) => updateGuarantorField(index, "contractEndDate", e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* E. PEP DECLARATION */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                  PEP Declaration (Guarantor {index + 1})
                </h2>

                {/* Self PEP */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-b pb-6">
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
                      {/* Upload ID Proof field removed as per request */}
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

                    {/* RELATED PEP MULTIPLE ENTRIES - EXPANDED */}
                    {guarantor.relatedToPep === "yes" && (
                      <div className="space-y-8 pt-4">
                        {relatedPeps.map((pep: any, pepIndex: number) => (
                          <div
                            key={pepIndex}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-6 relative shadow-sm"
                          >
                            <div className="flex justify-between items-center mb-6">
                              <span className="text-md font-bold text-gray-700">
                                Person {pepIndex + 1}
                              </span>
                              {relatedPeps.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveRelatedPep(index, pepIndex)
                                  }
                                  className="hover:bg-red-50"
                                >
                                  <Trash2 className="h-5 w-5 text-red-500" />
                                </Button>
                              )}
                            </div>

                            {/* PEP Declaration Information */}
                            <h4 className="text-sm font-bold text-[#003DA5] mb-4 uppercase tracking-wide">
                              PEP Declaration Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                              <div className="space-y-2.5 w-full">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  Relationship{" "}
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                  value={pep.relationship || ""}
                                  onValueChange={(value) =>
                                    handleRelatedPepChange(
                                      index,
                                      pepIndex,
                                      "relationship",
                                      value,
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                    <SelectValue placeholder="[Select]" />
                                  </SelectTrigger>
                                  <SelectContent sideOffset={4}>
                                    <SelectItem value="spouse">
                                      Spouse
                                    </SelectItem>
                                    <SelectItem value="parent">
                                      Parent
                                    </SelectItem>
                                    <SelectItem value="sibling">
                                      Sibling
                                    </SelectItem>
                                    <SelectItem value="child">Child</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2.5 w-full">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  PEP Category{" "}
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                  value={pep.category || ""}
                                  onValueChange={(value) =>
                                    handleRelatedPepChange(
                                      index,
                                      pepIndex,
                                      "category",
                                      value,
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                    <SelectValue placeholder="[Select]" />
                                  </SelectTrigger>
                                  <SelectContent sideOffset={4}>
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

                              <div className="space-y-2.5 w-full">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  PEP Sub Category{" "}
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                  value={pep.subCategory || ""}
                                  onValueChange={(value) =>
                                    handleRelatedPepChange(
                                      index,
                                      pepIndex,
                                      "subCategory",
                                      value,
                                    )
                                  }
                                  disabled={!pep.category}
                                >
                                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                    <SelectValue placeholder="[Select]" />
                                  </SelectTrigger>
                                  <SelectContent sideOffset={4}>
                                    {guarantor.relatedPepOptionsMap?.[
                                      pepIndex
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

                              {/* Upload Identification Proof field restored */}
                              <div className="space-y-2.5">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  Upload Identification Proof{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="file"
                                    id={`uploadId-${index}-${pepIndex}`}
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) =>
                                      handleRelatedPepFileChange(
                                        index,
                                        pepIndex,
                                        "identificationProof",
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
                                          `uploadId-${index}-${pepIndex}`,
                                        )
                                        ?.click()
                                    }
                                  >
                                    Choose File
                                  </Button>
                                  <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                                    {pep.identificationProof ||
                                      "No file chosen"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Personal Information */}
                            <h4 className="text-sm font-bold text-[#003DA5] mb-4 uppercase tracking-wide">
                              Personal Information
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                              <div className="space-y-2.5">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  Identification Type{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={pep.identificationType}
                                  onValueChange={(value) =>
                                    handleRelatedPepChange(
                                      index,
                                      pepIndex,
                                      "identificationType",
                                      value,
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                    <SelectValue placeholder="[Select]" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {filteredIdOptions.map((opt, i) => (
                                      <SelectItem
                                        key={i}
                                        value={String(
                                          opt.identity_type_pk_code || opt.id,
                                        )}
                                      >
                                        {opt.identity_type ||
                                          opt.identification_type ||
                                          "Unknown"}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2.5">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  Identification No.{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  placeholder="Enter ID No"
                                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                  value={pep.identificationNo || ""}
                                  onChange={(e) =>
                                    handleRelatedPepChange(
                                      index,
                                      pepIndex,
                                      "identificationNo",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-2.5">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  Salutation{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={pep.salutation || ""}
                                  onValueChange={(value) =>
                                    handleRelatedPepChange(
                                      index,
                                      pepIndex,
                                      "salutation",
                                      value,
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
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

                              <div className="space-y-2.5">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  Applicant Name{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  placeholder="Enter Full Name"
                                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                  value={pep.applicantName || ""}
                                  onChange={(e) =>
                                    handleRelatedPepChange(
                                      index,
                                      pepIndex,
                                      "applicantName",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-2.5">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  Nationality{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={pep.nationality}
                                  onValueChange={(value) =>
                                    handleRelatedPepChange(
                                      index,
                                      pepIndex,
                                      "nationality",
                                      value,
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                    <SelectValue placeholder="[Select]" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {nationalityOptions.map((opt, i) => (
                                      <SelectItem
                                        key={i}
                                        value={String(
                                          opt.nationality_pk_code || opt.id,
                                        )}
                                      >
                                        {opt.nationality || opt.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2.5">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  Gender <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={pep.gender || ""}
                                  onValueChange={(value) =>
                                    handleRelatedPepChange(
                                      index,
                                      pepIndex,
                                      "gender",
                                      value,
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                    <SelectValue placeholder="[Select]" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">
                                      Female
                                    </SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2.5">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  Identification Issue Date{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  type="date"
                                  max={today}
                                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                  value={pep.identificationIssueDate || ""}
                                  onChange={(e) =>
                                    handleRelatedPepChange(
                                      index,
                                      pepIndex,
                                      "identificationIssueDate",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-2.5">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  Identification Expiry Date{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  type="date"
                                  min={today}
                                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                  value={pep.identificationExpiryDate || ""}
                                  onChange={(e) =>
                                    handleRelatedPepChange(
                                      index,
                                      pepIndex,
                                      "identificationExpiryDate",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-2.5">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  Date of Birth{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  type="date"
                                  max={maxDobDate}
                                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                  value={pep.dateOfBirth || ""}
                                  onChange={(e) =>
                                    handleRelatedPepChange(
                                      index,
                                      pepIndex,
                                      "dateOfBirth",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>

                              {/* Tax Identifier Type - Not required, shows only PIT */}
                              <div className="space-y-2.5">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  Tax Identifier Type
                                </Label>
                                <Select
                                  value={pep.taxIdentifierType || ""}
                                  onValueChange={(value) =>
                                    handleRelatedPepChange(
                                      index,
                                      pepIndex,
                                      "taxIdentifierType",
                                      value,
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                    <SelectValue placeholder="[Select]" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {personalTaxIdentifierOptions.length > 0 ? (
                                      personalTaxIdentifierOptions.map((opt, i) => (
                                        <SelectItem
                                          key={i}
                                          value={String(opt.tax_identifier_type_pk_code || opt.id)}
                                        >
                                          {opt.tax_identifier_type || opt.name}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2.5">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  TPN No
                                </Label>
                                <Input
                                  placeholder="Enter TPN"
                                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                  value={pep.tpn || ""}
                                  onChange={(e) =>
                                    handleRelatedPepChange(
                                      index,
                                      pepIndex,
                                      "tpn",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>

                              {isNatBhutanese(pep.nationality) && (
                                <div className="space-y-2.5">
                                  <Label className="text-gray-800 font-semibold text-sm">
                                    Household Number{" "}
                                    <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    placeholder="Enter Household No"
                                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                    value={pep.householdNumber || ""}
                                    onChange={(e) =>
                                      handleRelatedPepChange(
                                        index,
                                        pepIndex,
                                        "householdNumber",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              )}

                              <div className="space-y-2.5">
                                <Label className="text-gray-800 font-semibold text-sm">
                                  Marital Status{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={String(pep.maritalStatus || "")}
                                  onValueChange={(value) =>
                                    handleRelatedPepChange(
                                      index,
                                      pepIndex,
                                      "maritalStatus",
                                      value,
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                    <SelectValue placeholder="[Select]" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {maritalStatusOptions.map((opt, i) => (
                                      <SelectItem
                                        key={i}
                                        value={String(
                                          opt.marital_status_pk_code || opt.id,
                                        )}
                                      >
                                        {opt.marital_status || opt.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Spouse Information inside PEP - Entire block removed as per request */}

                            {/* PEP Permanent Address */}
                            <div className="mt-8 border-t border-dashed pt-8">
                              <h4 className="text-sm font-bold text-[#003DA5] mb-4 uppercase tracking-wide">
                                Permanent Address
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <div className="space-y-2.5">
                                  <Label className="text-gray-800 font-semibold text-sm">
                                    Country{" "}
                                    <span className="text-red-500">*</span>
                                  </Label>
                                  <Select
                                    value={pep.permCountry || ""}
                                    onValueChange={(value) =>
                                      handleRelatedPepChange(
                                        index,
                                        pepIndex,
                                        "permCountry",
                                        value,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                      <SelectValue placeholder="[Select]" />
                                    </SelectTrigger>
                                    <SelectContent sideOffset={4}>
                                      {countryOptions.map((opt, i) => (
                                        <SelectItem
                                          key={i}
                                          value={String(
                                            opt.country_pk_code || opt.id,
                                          )}
                                        >
                                          {opt.country || opt.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2.5">
                                  <Label className="text-gray-800 font-semibold text-sm">
                                    {isBhutanCountry(
                                      pep.permCountry,
                                      countryOptions,
                                    )
                                      ? "Dzongkhag"
                                      : "State"}{" "}
                                    <span className="text-red-500">*</span>
                                  </Label>
                                  {pep.permCountry &&
                                    !isBhutanCountry(
                                      pep.permCountry,
                                      countryOptions,
                                    ) ? (
                                    <Input
                                      placeholder="Enter State"
                                      className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                      value={pep.permDzongkhag || ""}
                                      onChange={(e) =>
                                        handleRelatedPepChange(
                                          index,
                                          pepIndex,
                                          "permDzongkhag",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  ) : (
                                    <Select
                                      value={pep.permDzongkhag || ""}
                                      onValueChange={(value) =>
                                        handleRelatedPepChange(
                                          index,
                                          pepIndex,
                                          "permDzongkhag",
                                          value,
                                        )
                                      }
                                      disabled={
                                        !isBhutanCountry(
                                          pep.permCountry,
                                          countryOptions,
                                        )
                                      }
                                    >
                                      <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                        <SelectValue placeholder="[Select]" />
                                      </SelectTrigger>
                                      <SelectContent sideOffset={4}>
                                        {dzongkhagOptions.map((opt, i) => (
                                          <SelectItem
                                            key={i}
                                            value={String(
                                              opt.dzongkhag_pk_code || opt.id,
                                            )}
                                          >
                                            {opt.dzongkhag || opt.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>

                                <div className="space-y-2.5">
                                  <Label className="text-gray-800 font-semibold text-sm">
                                    {isBhutanCountry(
                                      pep.permCountry,
                                      countryOptions,
                                    )
                                      ? "Gewog"
                                      : "Province"}{" "}
                                    <span className="text-red-500">*</span>
                                  </Label>
                                  {pep.permCountry &&
                                    !isBhutanCountry(
                                      pep.permCountry,
                                      countryOptions,
                                    ) ? (
                                    <Input
                                      placeholder="Enter Province"
                                      className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                      value={pep.permGewog || ""}
                                      onChange={(e) =>
                                        handleRelatedPepChange(
                                          index,
                                          pepIndex,
                                          "permGewog",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  ) : (
                                    <Select
                                      value={pep.permGewog || ""}
                                      onValueChange={(value) =>
                                        handleRelatedPepChange(
                                          index,
                                          pepIndex,
                                          "permGewog",
                                          value,
                                        )
                                      }
                                      disabled={
                                        !isBhutanCountry(
                                          pep.permCountry,
                                          countryOptions,
                                        )
                                      }
                                    >
                                      <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                        <SelectValue placeholder="[Select]" />
                                      </SelectTrigger>
                                      <SelectContent sideOffset={4}>
                                        {guarantor.relatedPepPermGewogMap?.[
                                          pepIndex
                                        ]?.map((opt: any, i: number) => (
                                          <SelectItem
                                            key={i}
                                            value={String(
                                              opt.gewog_pk_code || opt.id,
                                            )}
                                          >
                                            {opt.gewog || opt.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>

                                <div className="space-y-2.5">
                                  <Label className="text-gray-800 font-semibold text-sm">
                                    {isBhutanCountry(
                                      pep.permCountry,
                                      countryOptions,
                                    )
                                      ? "Village/Street"
                                      : "Street"}{" "}
                                    <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    placeholder="Enter Location"
                                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                    value={pep.permVillage || ""}
                                    onChange={(e) =>
                                      handleRelatedPepChange(
                                        index,
                                        pepIndex,
                                        "permVillage",
                                        e.target.value,
                                      )
                                    }
                                    disabled={!pep.permCountry}
                                  />
                                </div>

                                {isBhutanCountry(
                                  pep.permCountry,
                                  countryOptions,
                                ) && (
                                    <>
                                      <div className="space-y-2.5">
                                        <Label className="text-gray-800 font-semibold text-sm">
                                          Thram No.{" "}
                                          <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                          placeholder="Enter Thram No"
                                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                          value={pep.permThram || ""}
                                          onChange={(e) =>
                                            handleRelatedPepChange(
                                              index,
                                              pepIndex,
                                              "permThram",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2.5">
                                        <Label className="text-gray-800 font-semibold text-sm">
                                          House No.{" "}
                                          <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                          placeholder="Enter House No"
                                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                          value={pep.permHouse || ""}
                                          onChange={(e) =>
                                            handleRelatedPepChange(
                                              index,
                                              pepIndex,
                                              "permHouse",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                    </>
                                  )}
                              </div>

                              {pep.permCountry &&
                                !isBhutanCountry(
                                  pep.permCountry,
                                  countryOptions,
                                ) && (
                                  <div className="space-y-2.5 mb-8">
                                    <Label className="text-gray-800 font-semibold text-sm">
                                      Upload Address Proof Document{" "}
                                      <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="file"
                                        id={`pepPermProof-${index}-${pepIndex}`}
                                        className="hidden"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) =>
                                          handleRelatedPepFileChange(
                                            index,
                                            pepIndex,
                                            "permAddressProof",
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
                                              `pepPermProof-${index}-${pepIndex}`,
                                            )
                                            ?.click()
                                        }
                                      >
                                        Choose File
                                      </Button>
                                      <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                        {pep.permAddressProof ||
                                          "No file chosen"}
                                      </span>
                                    </div>
                                  </div>
                                )}
                            </div>

                            {/* PEP Current/Residential Address */}
                            <div className="mt-8 border-t border-dashed pt-8">
                              <h4 className="text-sm font-bold text-[#003DA5] mb-4 uppercase tracking-wide">
                                Current/Residential Address
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <div className="space-y-2.5">
                                  <Label className="text-gray-800 font-semibold text-sm">
                                    Country{" "}
                                    <span className="text-red-500">*</span>
                                  </Label>
                                  <Select
                                    value={pep.currCountry || ""}
                                    onValueChange={(value) =>
                                      handleRelatedPepChange(
                                        index,
                                        pepIndex,
                                        "currCountry",
                                        value,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                      <SelectValue placeholder="[Select]" />
                                    </SelectTrigger>
                                    <SelectContent sideOffset={4}>
                                      {countryOptions.map((opt, i) => (
                                        <SelectItem
                                          key={i}
                                          value={String(
                                            opt.country_pk_code || opt.id,
                                          )}
                                        >
                                          {opt.country || opt.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2.5">
                                  <Label className="text-gray-800 font-semibold text-sm">
                                    {isBhutanCountry(
                                      pep.currCountry,
                                      countryOptions,
                                    )
                                      ? "Dzongkhag"
                                      : "State"}{" "}
                                    <span className="text-red-500">*</span>
                                  </Label>
                                  {pep.currCountry &&
                                    !isBhutanCountry(
                                      pep.currCountry,
                                      countryOptions,
                                    ) ? (
                                    <Input
                                      placeholder="Enter State"
                                      className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                      value={pep.currDzongkhag || ""}
                                      onChange={(e) =>
                                        handleRelatedPepChange(
                                          index,
                                          pepIndex,
                                          "currDzongkhag",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  ) : (
                                    <Select
                                      value={pep.currDzongkhag || ""}
                                      onValueChange={(value) =>
                                        handleRelatedPepChange(
                                          index,
                                          pepIndex,
                                          "currDzongkhag",
                                          value,
                                        )
                                      }
                                      disabled={
                                        !isBhutanCountry(
                                          pep.currCountry,
                                          countryOptions,
                                        )
                                      }
                                    >
                                      <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                        <SelectValue placeholder="[Select]" />
                                      </SelectTrigger>
                                      <SelectContent sideOffset={4}>
                                        {dzongkhagOptions.map((opt, i) => (
                                          <SelectItem
                                            key={i}
                                            value={String(
                                              opt.dzongkhag_pk_code || opt.id,
                                            )}
                                          >
                                            {opt.dzongkhag || opt.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>

                                <div className="space-y-2.5">
                                  <Label className="text-gray-800 font-semibold text-sm">
                                    {isBhutanCountry(
                                      pep.currCountry,
                                      countryOptions,
                                    )
                                      ? "Gewog"
                                      : "Province"}{" "}
                                    <span className="text-red-500">*</span>
                                  </Label>
                                  {pep.currCountry &&
                                    !isBhutanCountry(
                                      pep.currCountry,
                                      countryOptions,
                                    ) ? (
                                    <Input
                                      placeholder="Enter Province"
                                      className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                      value={pep.currGewog || ""}
                                      onChange={(e) =>
                                        handleRelatedPepChange(
                                          index,
                                          pepIndex,
                                          "currGewog",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  ) : (
                                    <Select
                                      value={pep.currGewog || ""}
                                      onValueChange={(value) =>
                                        handleRelatedPepChange(
                                          index,
                                          pepIndex,
                                          "currGewog",
                                          value,
                                        )
                                      }
                                      disabled={
                                        !isBhutanCountry(
                                          pep.currCountry,
                                          countryOptions,
                                        )
                                      }
                                    >
                                      <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                        <SelectValue placeholder="[Select]" />
                                      </SelectTrigger>
                                      <SelectContent sideOffset={4}>
                                        {guarantor.relatedPepCurrGewogMap?.[
                                          pepIndex
                                        ]?.map((opt: any, i: number) => (
                                          <SelectItem
                                            key={i}
                                            value={String(
                                              opt.gewog_pk_code || opt.id,
                                            )}
                                          >
                                            {opt.gewog || opt.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>

                                <div className="space-y-2.5">
                                  <Label className="text-gray-800 font-semibold text-sm">
                                    {isBhutanCountry(
                                      pep.currCountry,
                                      countryOptions,
                                    )
                                      ? "Village/Street"
                                      : "Street"}{" "}
                                    <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    placeholder="Enter Location"
                                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                    value={pep.currVillage || ""}
                                    onChange={(e) =>
                                      handleRelatedPepChange(
                                        index,
                                        pepIndex,
                                        "currVillage",
                                        e.target.value,
                                      )
                                    }
                                    disabled={!pep.currCountry}
                                  />
                                </div>

                                {isBhutanCountry(
                                  pep.currCountry,
                                  countryOptions,
                                ) && (
                                    <div className="space-y-2.5">
                                      <Label className="text-gray-800 font-semibold text-sm">
                                        Flat No.{" "}
                                        <span className="text-red-500">*</span>
                                      </Label>
                                      <Input
                                        placeholder="Enter Flat No"
                                        className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                        value={pep.currFlat || ""}
                                        onChange={(e) =>
                                          handleRelatedPepChange(
                                            index,
                                            pepIndex,
                                            "currFlat",
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </div>
                                  )}
                              </div>

                              {pep.currCountry &&
                                !isBhutanCountry(
                                  pep.currCountry,
                                  countryOptions,
                                ) && (
                                  <div className="space-y-2.5 mb-8">
                                    <Label className="text-gray-800 font-semibold text-sm">
                                      Upload Address Proof Document{" "}
                                      <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="file"
                                        id={`pepCurrProof-${index}-${pepIndex}`}
                                        className="hidden"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) =>
                                          handleRelatedPepFileChange(
                                            index,
                                            pepIndex,
                                            "currAddressProof",
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
                                              `pepCurrProof-${index}-${pepIndex}`,
                                            )
                                            ?.click()
                                        }
                                      >
                                        Choose File
                                      </Button>
                                      <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                        {pep.currAddressProof ||
                                          "No file chosen"}
                                      </span>
                                    </div>
                                  </div>
                                )}

                              <h5 className="text-sm font-bold text-gray-700 mb-4">
                                Contact Information
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2.5">
                                  <Label className="text-gray-800 font-semibold text-sm">
                                    Email{" "}
                                    <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    type="email"
                                    placeholder="Enter Email"
                                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                    value={pep.currEmail || ""}
                                    onChange={(e) =>
                                      handleRelatedPepChange(
                                        index,
                                        pepIndex,
                                        "currEmail",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2.5">
                                  <Label className="text-gray-800 font-semibold text-sm">
                                    Contact No.{" "}
                                    <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    placeholder="Enter Contact No"
                                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                    value={pep.currContact || ""}
                                    onChange={(e) =>
                                      handleRelatedPepChange(
                                        index,
                                        pepIndex,
                                        "currContact",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2.5">
                                  <Label className="text-gray-800 font-semibold text-sm">
                                    Alternate Contact No.
                                  </Label>
                                  <Input
                                    placeholder="Enter Alternate Contact"
                                    className="h-10 sm:h-12 w-full text-sm sm:text-base border border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                                    value={pep.currAlternateContact || ""}
                                    onChange={(e) =>
                                      handleRelatedPepChange(
                                        index,
                                        pepIndex,
                                        "currAlternateContact",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

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
              {/* Spouse Details Section */}
              {isMarried && (
                <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm mt-6">
                  <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                    Spouse Personal Information (Guarantor {index + 1})
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                        Spouse Identification Type{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.spouseIdentificationType}
                        onValueChange={(value) =>
                          updateGuarantorField(
                            index,
                            "spouseIdentificationType",
                            value,
                          )
                        }
                      >
                        <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {filteredIdOptions.map((opt, i) => (
                            <SelectItem
                              key={i}
                              value={String(
                                opt.identity_type_pk_code || opt.id || i,
                              )}
                            >
                              {opt.identity_type ||
                                opt.identification_type ||
                                "Unknown"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                        Spouse ID No. <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Spouse CID/ID"
                        className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                        value={guarantor.spouseIdentificationNo || ""}
                        onChange={(e) =>
                          updateGuarantorField(
                            index,
                            "spouseIdentificationNo",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                        Spouse Salutation{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.spouseSalutation}
                        onValueChange={(value) =>
                          updateGuarantorField(index, "spouseSalutation", value)
                        }
                      >
                        <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
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

                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                        Spouse Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Spouse Full Name"
                        className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                        value={guarantor.spouseName || ""}
                        onChange={(e) =>
                          updateGuarantorField(index, "spouseName", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                        Spouse Nationality{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.spouseNationality}
                        onValueChange={(value) =>
                          updateGuarantorField(index, "spouseNationality", value)
                        }
                      >
                        <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent>
                          {nationalityOptions.map((opt, i) => (
                            <SelectItem
                              key={i}
                              value={String(
                                opt.nationality_pk_code || opt.id || i,
                              )}
                            >
                              {opt.nationality || opt.name || "Unknown"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                        Spouse Gender <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={guarantor.spouseGender}
                        onValueChange={(value) =>
                          updateGuarantorField(index, "spouseGender", value)
                        }
                      >
                        <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                        Spouse ID Issue Date{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        max={today}
                        className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                        value={guarantor.spouseIdentificationIssueDate || ""}
                        onChange={(e) =>
                          updateGuarantorField(
                            index,
                            "spouseIdentificationIssueDate",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                        Spouse ID Expiry Date{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        min={today}
                        className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                        value={guarantor.spouseIdentificationExpiryDate || ""}
                        onChange={(e) =>
                          updateGuarantorField(
                            index,
                            "spouseIdentificationExpiryDate",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    {/* Spouse Tax Identifier Type - Not required, shows only PIT */}
                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                        Spouse Tax Identifier Type
                      </Label>
                      <Select
                        value={guarantor.spouseTaxIdentifierType}
                        onValueChange={(value) =>
                          updateGuarantorField(
                            index,
                            "spouseTaxIdentifierType",
                            value,
                          )
                        }
                      >
                        <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent>
                          {personalTaxIdentifierOptions.length > 0 ? (
                            personalTaxIdentifierOptions.map((opt, i) => (
                              <SelectItem
                                key={i}
                                value={String(opt.tax_identifier_type_pk_code || opt.id)}
                              >
                                {opt.tax_identifier_type || opt.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                        Spouse TPN No
                      </Label>
                      <Input
                        placeholder="Enter TPN"
                        className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                        value={guarantor.spouseTpn || ""}
                        onChange={(e) =>
                          updateGuarantorField(
                            index,
                            "spouseTpn",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                        Spouse Date of Birth{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        max={maxDobDate}
                        className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                        value={guarantor.spouseDateOfBirth || ""}
                        onChange={(e) =>
                          updateGuarantorField(
                            index,
                            "spouseDateOfBirth",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    {isNatBhutanese(guarantor.spouseNationality) && (
                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                          Spouse Household Number{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Enter Household Number"
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                          value={guarantor.spouseHouseholdNumber || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "spouseHouseholdNumber",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Spouse Identification Proof Upload */}
                  <div className="mt-6 pt-4 border-t border-dashed">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-1.5 sm:space-y-2.5 md:col-span-2">
                        <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                          Spouse Identification Proof{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            className="hidden"
                            id={`spouseIdProof-${index}`}
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              handleFileChange(
                                index,
                                "spouseIdProof",
                                e.target.files?.[0] || null,
                              )
                            }
                          />
                          <Button
                            variant="outline"
                            type="button"
                            className="h-10 sm:h-12 w-28"
                            onClick={() =>
                              document
                                .getElementById(`spouseIdProof-${index}`)
                                ?.click()
                            }
                          >
                            Choose File
                          </Button>
                          <span className="text-sm text-gray-500 truncate max-w-[150px]">
                            {guarantor.spouseIdProof || "No file chosen"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Spouse Permanent Address */}
                  <div className="mt-6 pt-6 border-t border-dashed">
                    <h4 className="text-md font-semibold text-gray-700 mb-4">
                      Spouse Permanent Address
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                          Spouse Country{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={guarantor.spousePermCountry}
                          onValueChange={(value) =>
                            updateGuarantorField(
                              index,
                              "spousePermCountry",
                              value,
                            )
                          }
                        >
                          <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((opt, i) => (
                              <SelectItem
                                key={i}
                                value={String(
                                  opt.country_pk_code || opt.id || i,
                                )}
                              >
                                {opt.country || opt.name || "Unknown"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                          {isBhutanCountry(
                            guarantor.spousePermCountry,
                            countryOptions,
                          )
                            ? "Spouse Dzongkhag"
                            : "Spouse State"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        {guarantor.spousePermCountry &&
                          !isBhutanCountry(
                            guarantor.spousePermCountry,
                            countryOptions,
                          ) ? (
                          <Input
                            placeholder="Enter State"
                            className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                            value={guarantor.spousePermDzongkhag || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "spousePermDzongkhag",
                                e.target.value,
                              )
                            }
                          />
                        ) : (
                          <Select
                            value={guarantor.spousePermDzongkhag}
                            onValueChange={(value) =>
                              updateGuarantorField(
                                index,
                                "spousePermDzongkhag",
                                value,
                              )
                            }
                            disabled={
                              !isBhutanCountry(
                                guarantor.spousePermCountry,
                                countryOptions,
                              )
                            }
                          >
                            <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent>
                              {dzongkhagOptions.map((opt, i) => (
                                <SelectItem
                                  key={i}
                                  value={String(
                                    opt.dzongkhag_pk_code || opt.id || i,
                                  )}
                                >
                                  {opt.dzongkhag || opt.name || "Unknown"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                          {isBhutanCountry(
                            guarantor.spousePermCountry,
                            countryOptions,
                          )
                            ? "Spouse Gewog"
                            : "Spouse Province"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        {guarantor.spousePermCountry &&
                          !isBhutanCountry(
                            guarantor.spousePermCountry,
                            countryOptions,
                          ) ? (
                          <Input
                            placeholder="Enter Province"
                            className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                            value={guarantor.spousePermGewog || ""}
                            onChange={(e) =>
                              updateGuarantorField(
                                index,
                                "spousePermGewog",
                                e.target.value,
                              )
                            }
                          />
                        ) : (
                          <Select
                            value={guarantor.spousePermGewog}
                            onValueChange={(value) =>
                              updateGuarantorField(
                                index,
                                "spousePermGewog",
                                value,
                              )
                            }
                            disabled={
                              !isBhutanCountry(
                                guarantor.spousePermCountry,
                                countryOptions,
                              )
                            }
                          >
                            <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                              <SelectValue placeholder="[Select]" />
                            </SelectTrigger>
                            <SelectContent>
                              {guarantor.spousePermGewogOptions?.length >
                                0 ? (
                                guarantor.spousePermGewogOptions.map(
                                  (opt: any, i: number) => (
                                    <SelectItem
                                      key={i}
                                      value={String(
                                        opt.gewog_pk_code || opt.id || i,
                                      )}
                                    >
                                      {opt.gewog || opt.name || "Unknown"}
                                    </SelectItem>
                                  ),
                                )
                              ) : (
                                <SelectItem value="loading" disabled>
                                  {guarantor.spousePermDzongkhag
                                    ? "Loading..."
                                    : "Select Dzongkhag first"}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                          {isBhutanCountry(
                            guarantor.spousePermCountry,
                            countryOptions,
                          )
                            ? "Spouse Village/Street"
                            : "Spouse Street"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder={
                            isBhutanCountry(
                              guarantor.spousePermCountry,
                              countryOptions,
                            )
                              ? "Enter Village/Street"
                              : "Enter Street"
                          }
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                          value={guarantor.spousePermVillage || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "spousePermVillage",
                              e.target.value,
                            )
                          }
                          disabled={!guarantor.spousePermCountry}
                        />
                      </div>

                      {isBhutanCountry(
                        guarantor.spousePermCountry,
                        countryOptions,
                      ) && (
                          <>
                            <div className="space-y-1.5 sm:space-y-2.5">
                              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                Spouse Thram No.{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                placeholder="Enter Thram No"
                                className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                value={guarantor.spousePermThram || ""}
                                onChange={(e) =>
                                  updateGuarantorField(
                                    index,
                                    "spousePermThram",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1.5 sm:space-y-2.5">
                              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                                Spouse House No.{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                placeholder="Enter House No"
                                className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                                value={guarantor.spousePermHouse || ""}
                                onChange={(e) =>
                                  updateGuarantorField(
                                    index,
                                    "spousePermHouse",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </>
                        )}
                    </div>

                    {guarantor.spousePermCountry &&
                      !isBhutanCountry(
                        guarantor.spousePermCountry,
                        countryOptions,
                      ) && (
                        <div className="space-y-2.5 mt-4">
                          <Label className="text-gray-800 font-semibold text-sm">
                            Upload Spouse Address Proof Document{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              id={`spousePermAddressProof-${index}`}
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                handleFileChange(
                                  index,
                                  "spousePermAddressProof",
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
                                  .getElementById(
                                    `spousePermAddressProof-${index}`,
                                  )
                                  ?.click()
                              }
                            >
                              Choose File
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              {guarantor.spousePermAddressProof ||
                                "No file chosen"}
                            </span>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Spouse Contact Details */}
                  <div className="mt-6 pt-6 border-t border-dashed">
                    <h4 className="text-md font-semibold text-gray-700 mb-4">
                      Spouse Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                          Spouse Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="email"
                          placeholder="Enter Spouse Email"
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                          value={guarantor.spouseEmail || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "spouseEmail",
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                          Spouse Contact No.{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Enter Contact Number"
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
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

                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                          Spouse Alternate Contact No.
                        </Label>
                        <Input
                          placeholder="Enter Alternate Contact"
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                          value={guarantor.spouseAlternateContact || ""}
                          onChange={(e) =>
                            updateGuarantorField(
                              index,
                              "spouseAlternateContact",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
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