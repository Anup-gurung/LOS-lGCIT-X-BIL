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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  fetchMaritalStatus,
  fetchBanks,
  fetchNationality,
  fetchIdentificationType,
  fetchCountry,
  fetchDzongkhag,
  fetchGewogsByDzongkhag,
  fetchOccupations,
  fetchLegalConstitution,
  fetchPepCategory,
  fetchPepSubCategoryByCategory,
  fetchTaxIdentifierType, // <-- NEW import
} from "@/services/api";
import { getNdiDataFromSession } from "@/lib/mapNdiData";
import { getVerifiedCustomerDataFromSession } from "@/lib/mapCustomerData";
import { PlusCircle, Trash2 } from "lucide-react";

const isRequired = (value: any) => !value || value.toString().trim() === "";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidNumber = (value: string) => /^\d+$/.test(value);

const isValidDate = (date: string) => !isNaN(Date.parse(date));

interface PersonalDetailsFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
  formData: any;
  isFirstStep: boolean;
}

// Initialize empty related PEP entry with comprehensive fields
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

  // Spouse Info (kept for data structure but not rendered)
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
  spouseIdentificationProof: "",
  spouseEmail: "",
  spouseContact: "",
  spouseAlternateContact: "",
});

export function PersonalDetailsForm({
  onNext,
  onBack,
  formData,
}: PersonalDetailsFormProps) {
  const [data, setData] = useState(() => {
    console.log("========== PersonalDetail INIT ==========");

    // PRIORITY 1: Check for verified customer data (existing users)
    const verifiedData = getVerifiedCustomerDataFromSession();
    if (verifiedData && Object.keys(verifiedData).length > 0) {
      console.log("✅ INIT: Loading verified customer data:", verifiedData);
      let initialData = { ...verifiedData };

      if (!(initialData as any).relatedPeps) {
        (initialData as any).relatedPeps = [createEmptyRelatedPep()];
      }
      console.log("========== Init Complete ==========\n");
      return initialData as any;
    }

    // PRIORITY 2: Check for NDI verified data (new users)
    const ndiData = getNdiDataFromSession();
    if (ndiData && Object.keys(ndiData).length > 0) {
      console.log("✅ INIT: Loading NDI data:", ndiData);
      let initialData = { ...ndiData };

      if (!(initialData as any).relatedPeps) {
        (initialData as any).relatedPeps = [createEmptyRelatedPep()];
      }
      console.log("========== Init Complete ==========\n");
      return initialData as any;
    }

    // PRIORITY 3: Use formData from page
    console.log("⚠️ INIT: No verified/NDI data, using formData:", formData);
    let initialData = formData?.personalDetails || formData || {};

    // --- MIGRATION LOGIC FOR RELATED PEPS ---
    if (!(initialData as any).relatedPeps) {
      if ((initialData as any).pepRelated === "yes") {
        (initialData as any).relatedPeps = [
          {
            ...createEmptyRelatedPep(),
            relationship: (initialData as any).pepRelationship || "",
            identificationNo: (initialData as any).pepIdentification || "",
            category: (initialData as any).pepCategory || "",
            subCategory: (initialData as any).pepSubCat2 || "",
            identificationProof: (initialData as any).identificationProof || "",
          },
        ];
      } else {
        (initialData as any).relatedPeps = [createEmptyRelatedPep()];
      }
    }

    console.log("========== Init Complete ==========\n");
    return initialData as any;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCoBorrowerDialog, setShowCoBorrowerDialog] = useState(false);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([]);
  const [banksOptions, setBanksOptions] = useState<any[]>([]);
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<
    any[]
  >([]);
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([]);
  const [permGewogOptions, setPermGewogOptions] = useState<any[]>([]);
  const [currGewogOptions, setCurrGewogOptions] = useState<any[]>([]);
  const [spousePermGewogOptions, setSpousePermGewogOptions] = useState<any[]>(
    [],
  );
  const [occupationOptions, setOccupationOptions] = useState<any[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<any[]>([]);
  const [pepSubCategoryOptions, setPepSubCategoryOptions] = useState<any[]>([]);
  const [pepCategoryOptions, setPepCategoryOptions] = useState<any[]>([]);
  // NEW: tax identifier type options
  const [taxIdentifierTypeOptions, setTaxIdentifierTypeOptions] = useState<any[]>([]);

  // Maps for dynamic dropdowns inside the Related PEPs loop
  const [relatedPepOptionsMap, setRelatedPepOptionsMap] = useState<
    Record<number, any[]>
  >({});
  const [relatedPepSpouseGewogMap, setRelatedPepSpouseGewogMap] = useState<
    Record<number, any[]>
  >({});
  const [relatedPepPermGewogMap, setRelatedPepPermGewogMap] = useState<
    Record<number, any[]>
  >({});
  const [relatedPepCurrGewogMap, setRelatedPepCurrGewogMap] = useState<
    Record<number, any[]>
  >({});

  const today = new Date().toISOString().split("T")[0];
  const fifteenYearsAgo = new Date();
  fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
  const maxDobDate = fifteenYearsAgo.toISOString().split("T")[0];

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

  // --- HELPER: Determine if Married ---
  const isMarriedStatus = (status: any) => {
    if (!status) return false;
    const statusStr = String(status).toLowerCase();
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
      return val == status;
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

  const isMarried = isMarriedStatus(data.maritalStatus);

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

    // 1. Exact match on code (in case it's already properly assigned)
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

  useEffect(() => {
    const verifiedData = getVerifiedCustomerDataFromSession();
    if (verifiedData && Object.keys(verifiedData).length > 0) {
      setData((prevData: any) => ({
        ...verifiedData,
        ...prevData,
        relatedPeps: prevData.relatedPeps || [createEmptyRelatedPep()],
      }));
      return;
    }
    const ndiData = getNdiDataFromSession();
    if (ndiData && Object.keys(ndiData).length > 0) {
      setData((prevData: any) => ({
        ...ndiData,
        ...prevData,
        relatedPeps: prevData.relatedPeps || [createEmptyRelatedPep()],
      }));
    }
  }, []);

  useEffect(() => {
    fetchMaritalStatus()
      .then(setMaritalStatusOptions)
      .catch(() => setMaritalStatusOptions([]));
    fetchBanks()
      .then(setBanksOptions)
      .catch(() => setBanksOptions([]));
    fetchNationality()
      .then(setNationalityOptions)
      .catch(() => setNationalityOptions([]));
    fetchIdentificationType()
      .then(setIdentificationTypeOptions)
      .catch(() => setIdentificationTypeOptions([]));
    fetchCountry()
      .then(setCountryOptions)
      .catch(() => setCountryOptions([]));
    fetchDzongkhag()
      .then(setDzongkhagOptions)
      .catch(() => setDzongkhagOptions([]));
    fetchOccupations()
      .then(setOccupationOptions)
      .catch(() => setOccupationOptions([]));
    fetchLegalConstitution()
      .then(setOrganizationOptions)
      .catch(() => setOrganizationOptions([]));
    fetchPepCategory()
      .then(setPepCategoryOptions)
      .catch(() => setPepCategoryOptions([]));
    fetchTaxIdentifierType()   // <-- NEW
      .then(setTaxIdentifierTypeOptions)
      .catch(() => setTaxIdentifierTypeOptions([]));
  }, []);

  useEffect(() => {
    if (
      formData &&
      typeof formData === "object" &&
      Object.keys(formData).length > 0
    ) {
      const hasData = Object.entries(formData).some(([key, val]) => {
        if (key === "personalDetails" && val && typeof val === "object")
          return Object.keys(val).length > 0;
        if (
          key === "coBorrowerDetails" ||
          key === "securityDetails" ||
          key === "repaymentSource"
        )
          return false;
        if (typeof val === "string") return val.trim() !== "";
        if (typeof val === "boolean") return true;
        if (Array.isArray(val)) return val.length > 0;
        return val !== null && val !== undefined;
      });

      if (hasData) {
        setData((prev: any) => {
          const merged = {
            ...prev,
            ...(formData.personalDetails || {}),
            ...formData,
          };
          if (!merged.relatedPeps) {
            if (merged.pepRelated === "yes") {
              merged.relatedPeps = [
                {
                  ...createEmptyRelatedPep(),
                  relationship: merged.pepRelationship || "",
                  identificationNo: merged.pepIdentification || "",
                  category: merged.pepCategory || "",
                  subCategory: merged.pepSubCat2 || "",
                  identificationProof: merged.identificationProof || "",
                },
              ];
            } else {
              merged.relatedPeps = [createEmptyRelatedPep()];
            }
          }
          return merged;
        });
      }
    }
  }, [formData]);

  useEffect(() => {
    if (countryOptions.length > 0 && dzongkhagOptions.length > 0) {
      const updates: any = {};
      if (
        data.permCountry &&
        !countryOptions.find(
          (c) => String(c.country_pk_code || c.id) === data.permCountry,
        )
      ) {
        const pkCode = findPkCodeByLabel(data.permCountry, countryOptions, [
          "country",
          "name",
          "label",
        ]);
        if (pkCode && pkCode !== data.permCountry) updates.permCountry = pkCode;
      }
      if (
        data.currCountry &&
        !countryOptions.find(
          (c) => String(c.country_pk_code || c.id) === data.currCountry,
        )
      ) {
        const pkCode = findPkCodeByLabel(data.currCountry, countryOptions, [
          "country",
          "name",
          "label",
        ]);
        if (pkCode && pkCode !== data.currCountry) updates.currCountry = pkCode;
      }
      if (
        data.permDzongkhag &&
        !dzongkhagOptions.find(
          (d) => String(d.dzongkhag_pk_code || d.id) === data.permDzongkhag,
        )
      ) {
        const pkCode = findPkCodeByLabel(data.permDzongkhag, dzongkhagOptions, [
          "dzongkhag",
          "name",
          "label",
        ]);
        if (pkCode && pkCode !== data.permDzongkhag)
          updates.permDzongkhag = pkCode;
      }
      if (
        data.currDzongkhag &&
        !dzongkhagOptions.find(
          (d) => String(d.dzongkhag_pk_code || d.id) === data.currDzongkhag,
        )
      ) {
        const pkCode = findPkCodeByLabel(data.currDzongkhag, dzongkhagOptions, [
          "dzongkhag",
          "name",
          "label",
        ]);
        if (pkCode && pkCode !== data.currDzongkhag)
          updates.currDzongkhag = pkCode;
      }
      if (
        data.spousePermCountry &&
        !countryOptions.find(
          (c) => String(c.country_pk_code || c.id) === data.spousePermCountry,
        )
      ) {
        const pkCode = findPkCodeByLabel(
          data.spousePermCountry,
          countryOptions, ["country", "name", "label"],
        );
        if (pkCode && pkCode !== data.spousePermCountry)
          updates.spousePermCountry = pkCode;
      }
      if (
        data.spousePermDzongkhag &&
        !dzongkhagOptions.find(
          (d) =>
            String(d.dzongkhag_pk_code || d.id) === data.spousePermDzongkhag,
        )
      ) {
        const pkCode = findPkCodeByLabel(
          data.spousePermDzongkhag,
          dzongkhagOptions, ["dzongkhag", "name", "label"],
        );
        if (pkCode && pkCode !== data.spousePermDzongkhag)
          updates.spousePermDzongkhag = pkCode;
      }
      if (Object.keys(updates).length > 0)
        setData((prev: any) => ({ ...prev, ...updates }));
    }
  }, [
    countryOptions,
    dzongkhagOptions,
    data.permCountry,
    data.currCountry,
    data.permDzongkhag,
    data.currDzongkhag,
    data.spousePermCountry,
    data.spousePermDzongkhag,
  ]);

  useEffect(() => {
    if (
      identificationTypeOptions.length > 0 ||
      banksOptions.length > 0 ||
      nationalityOptions.length > 0 ||
      maritalStatusOptions.length > 0 ||
      taxIdentifierTypeOptions.length > 0   // <-- NEW
    ) {
      const updates: any = {};
      if (
        identificationTypeOptions.length > 0 &&
        data.identificationType &&
        !identificationTypeOptions.find(
          (i) =>
            String(
              i.identity_type_pk_code || i.identification_type_pk_code || i.id,
            ) === data.identificationType,
        )
      ) {
        const pkCode = findPkCodeByLabel(
          data.identificationType,
          identificationTypeOptions, ["identity_type", "identification_type", "name", "label"],
        );
        if (pkCode && pkCode !== data.identificationType)
          updates.identificationType = pkCode;
      }
      if (
        banksOptions.length > 0 &&
        data.bankName &&
        !banksOptions.find(
          (b) => String(b.bank_pk_code || b.id) === data.bankName,
        )
      ) {
        const pkCode = findPkCodeByLabel(data.bankName, banksOptions, [
          "bank",
          "bank_name",
          "name",
          "label",
        ]);
        if (pkCode && pkCode !== data.bankName) updates.bankName = pkCode;
      }
      if (
        nationalityOptions.length > 0 &&
        data.nationality &&
        !nationalityOptions.find(
          (n) => String(n.nationality_pk_code || n.id) === data.nationality,
        )
      ) {
        const pkCode = findPkCodeByLabel(data.nationality, nationalityOptions, [
          "nationality",
          "name",
          "label",
        ]);
        if (pkCode && pkCode !== data.nationality) updates.nationality = pkCode;
      }
      if (
        maritalStatusOptions.length > 0 &&
        data.maritalStatus &&
        !maritalStatusOptions.find(
          (m) =>
            String(m.marital_status_pk_code || m.id) === data.maritalStatus,
        )
      ) {
        const pkCode = findPkCodeByLabel(
          data.maritalStatus,
          maritalStatusOptions,
          ["marital_status", "name", "label"],
        );
        if (pkCode && pkCode !== data.maritalStatus)
          updates.maritalStatus = pkCode;
      }
      if (
        identificationTypeOptions.length > 0 &&
        data.spouseIdentificationType &&
        !identificationTypeOptions.find(
          (i) =>
            String(
              i.identity_type_pk_code || i.identification_type_pk_code || i.id,
            ) === data.spouseIdentificationType,
        )
      ) {
        const pkCode = findPkCodeByLabel(
          data.spouseIdentificationType,
          identificationTypeOptions, ["identity_type", "identification_type", "name", "label"],
        );
        if (pkCode && pkCode !== data.spouseIdentificationType)
          updates.spouseIdentificationType = pkCode;
      }
      if (
        nationalityOptions.length > 0 &&
        data.spouseNationality &&
        !nationalityOptions.find(
          (n) =>
            String(n.nationality_pk_code || n.id) === data.spouseNationality,
        )
      ) {
        const pkCode = findPkCodeByLabel(
          data.spouseNationality,
          nationalityOptions,
          ["nationality", "name", "label"],
        );
        if (pkCode && pkCode !== data.spouseNationality)
          updates.spouseNationality = pkCode;
      }
      // Tax identifier type conversions (applicant, spouse, related PEPs) will be handled by their own useEffect blocks later
      if (Object.keys(updates).length > 0)
        setData((prev: any) => ({ ...prev, ...updates }));
    }
  }, [
    identificationTypeOptions,
    banksOptions,
    nationalityOptions,
    maritalStatusOptions,
    taxIdentifierTypeOptions,   // <-- NEW
    data.identificationType,
    data.bankName,
    data.nationality,
    data.maritalStatus,
    data.spouseIdentificationType,
    data.spouseNationality,
  ]);

  useEffect(() => {
    if (occupationOptions.length > 0 && data.occupation) {
      const isValidPkCode = occupationOptions.find(
        (o) => String(o.occupation_pk_code || o.id) === data.occupation,
      );
      if (!isValidPkCode) {
        const pkCode = findPkCodeByLabel(data.occupation, occupationOptions, [
          "occupation",
          "name",
          "label",
        ]);
        if (pkCode && pkCode !== data.occupation)
          setData((prev: any) => ({ ...prev, occupation: pkCode }));
      }
    }
  }, [occupationOptions, data.occupation]);

  // Load Gewogs
  useEffect(() => {
    if (data.permDzongkhag)
      fetchGewogsByDzongkhag(data.permDzongkhag)
        .then(setPermGewogOptions)
        .catch(() => setPermGewogOptions([]));
  }, [data.permDzongkhag]);

  useEffect(() => {
    if (data.currDzongkhag)
      fetchGewogsByDzongkhag(data.currDzongkhag)
        .then(setCurrGewogOptions)
        .catch(() => setCurrGewogOptions([]));
  }, [data.currDzongkhag]);

  useEffect(() => {
    if (data.spousePermDzongkhag)
      fetchGewogsByDzongkhag(data.spousePermDzongkhag)
        .then(setSpousePermGewogOptions)
        .catch(() => setSpousePermGewogOptions([]));
  }, [data.spousePermDzongkhag]);

  useEffect(() => {
    if (
      permGewogOptions.length > 0 &&
      data.permGewog &&
      !permGewogOptions.find(
        (g) => String(g.gewog_pk_code || g.id) === data.permGewog,
      )
    ) {
      const pkCode = findPkCodeByLabel(data.permGewog, permGewogOptions, [
        "gewog",
        "name",
        "label",
      ]);
      if (pkCode && pkCode !== data.permGewog)
        setData((prev: any) => ({ ...prev, permGewog: pkCode }));
    }
  }, [permGewogOptions, data.permGewog]);

  useEffect(() => {
    if (
      currGewogOptions.length > 0 &&
      data.currGewog &&
      !currGewogOptions.find(
        (g) => String(g.gewog_pk_code || g.id) === data.currGewog,
      )
    ) {
      const pkCode = findPkCodeByLabel(data.currGewog, currGewogOptions, [
        "gewog",
        "name",
        "label",
      ]);
      if (pkCode && pkCode !== data.currGewog)
        setData((prev: any) => ({ ...prev, currGewog: pkCode }));
    }
  }, [currGewogOptions, data.currGewog]);

  useEffect(() => {
    if (
      spousePermGewogOptions.length > 0 &&
      data.spousePermGewog &&
      !spousePermGewogOptions.find(
        (g) => String(g.gewog_pk_code || g.id) === data.spousePermGewog,
      )
    ) {
      const pkCode = findPkCodeByLabel(
        data.spousePermGewog,
        spousePermGewogOptions,
        ["gewog", "name", "label"],
      );
      if (pkCode && pkCode !== data.spousePermGewog)
        setData((prev: any) => ({ ...prev, spousePermGewog: pkCode }));
    }
  }, [spousePermGewogOptions, data.spousePermGewog]);

  useEffect(() => {
    if (data.pepPerson === "yes" && data.pepCategory) {
      fetchPepSubCategoryByCategory(data.pepCategory)
        .then(setPepSubCategoryOptions)
        .catch(() => setPepSubCategoryOptions([]));
    } else {
      setPepSubCategoryOptions([]);
    }
  }, [data.pepPerson, data.pepCategory]);

  // Convert tax identifier type for main applicant when options load   <-- NEW
  useEffect(() => {
    if (taxIdentifierTypeOptions.length && data.taxIdentifierType) {
      const isValid = taxIdentifierTypeOptions.some(
        (opt) => String(opt.tax_identifier_type_pk_code || opt.id) === String(data.taxIdentifierType)
      );
      if (!isValid) {
        const pkCode = findPkCodeByLabel(
          data.taxIdentifierType,
          taxIdentifierTypeOptions,
          ["tax_identifier_type", "name", "label"]
        );
        if (pkCode && pkCode !== data.taxIdentifierType) {
          setData((prev: any) => ({ ...prev, taxIdentifierType: pkCode }));
        }
      }
    }
  }, [taxIdentifierTypeOptions, data.taxIdentifierType]);

  // Convert tax identifier type for spouse when options load   <-- NEW
  useEffect(() => {
    if (taxIdentifierTypeOptions.length && data.spouseTaxIdentifierType) {
      const isValid = taxIdentifierTypeOptions.some(
        (opt) => String(opt.tax_identifier_type_pk_code || opt.id) === String(data.spouseTaxIdentifierType)
      );
      if (!isValid) {
        const pkCode = findPkCodeByLabel(
          data.spouseTaxIdentifierType,
          taxIdentifierTypeOptions,
          ["tax_identifier_type", "name", "label"]
        );
        if (pkCode && pkCode !== data.spouseTaxIdentifierType) {
          setData((prev: any) => ({ ...prev, spouseTaxIdentifierType: pkCode }));
        }
      }
    }
  }, [taxIdentifierTypeOptions, data.spouseTaxIdentifierType]);

  const handleFileChange = (fieldName: string, file: File | null) => {
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors({
          ...errors,
          [fieldName]: "Only PDF, JPG, JPEG, and PNG files are allowed",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors, [fieldName]: "File size must be less than 5MB",
        });
        return;
      }
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
      setData({ ...data, [fieldName]: file.name });
    }
  };

  // --- HANDLERS FOR MULTIPLE PEP DECLARATIONS ---
  const handleAddRelatedPep = () => {
    setData({
      ...data,
      relatedPeps: [...(data.relatedPeps || []), createEmptyRelatedPep()],
    });
  };

  const handleRemoveRelatedPep = (index: number) => {
    const updatedPeps = (data.relatedPeps || []).filter(
      (_: any, i: number) => i !== index,
    );

    // Cleanup dynamic maps
    const newOptionsMap: Record<number, any[]> = {};
    const newSpouseGewogMap: Record<number, any[]> = {};
    const newPermGewogMap: Record<number, any[]> = {};
    const newCurrGewogMap: Record<number, any[]> = {};

    Object.keys(relatedPepOptionsMap).forEach((key) => {
      const keyNum = parseInt(key);
      if (keyNum < index) newOptionsMap[keyNum] = relatedPepOptionsMap[keyNum];
      else if (keyNum > index)
        newOptionsMap[keyNum - 1] = relatedPepOptionsMap[keyNum];
    });

    Object.keys(relatedPepSpouseGewogMap).forEach((key) => {
      const keyNum = parseInt(key);
      if (keyNum < index)
        newSpouseGewogMap[keyNum] = relatedPepSpouseGewogMap[keyNum];
      else if (keyNum > index)
        newSpouseGewogMap[keyNum - 1] = relatedPepSpouseGewogMap[keyNum];
    });

    Object.keys(relatedPepPermGewogMap).forEach((key) => {
      const keyNum = parseInt(key);
      if (keyNum < index)
        newPermGewogMap[keyNum] = relatedPepPermGewogMap[keyNum];
      else if (keyNum > index)
        newPermGewogMap[keyNum - 1] = relatedPepPermGewogMap[keyNum];
    });

    Object.keys(relatedPepCurrGewogMap).forEach((key) => {
      const keyNum = parseInt(key);
      if (keyNum < index)
        newCurrGewogMap[keyNum] = relatedPepCurrGewogMap[keyNum];
      else if (keyNum > index)
        newCurrGewogMap[keyNum - 1] = relatedPepCurrGewogMap[keyNum];
    });

    setRelatedPepOptionsMap(newOptionsMap);
    setRelatedPepSpouseGewogMap(newSpouseGewogMap);
    setRelatedPepPermGewogMap(newPermGewogMap);
    setRelatedPepCurrGewogMap(newCurrGewogMap);
    setData({ ...data, relatedPeps: updatedPeps });
  };

  const handleRelatedPepChange = async (
    index: number,
    field: string,
    value: string,
  ) => {
    const updatedPeps = [...(data.relatedPeps || [])];
    if (!updatedPeps[index]) updatedPeps[index] = createEmptyRelatedPep();
    updatedPeps[index] = { ...updatedPeps[index], [field]: value };

    if (field === "category") {
      updatedPeps[index].subCategory = "";
      try {
        const options = await fetchPepSubCategoryByCategory(value);
        setRelatedPepOptionsMap((prev) => ({
          ...prev,
          [index]: options || [],
        }));
      } catch (e) {
        setRelatedPepOptionsMap((prev) => ({ ...prev, [index]: [] }));
      }
    }

    if (field === "spousePermDzongkhag") {
      updatedPeps[index].spousePermGewog = "";
      try {
        const options = await fetchGewogsByDzongkhag(value);
        setRelatedPepSpouseGewogMap((prev) => ({
          ...prev,
          [index]: options || [],
        }));
      } catch (e) {
        setRelatedPepSpouseGewogMap((prev) => ({ ...prev, [index]: [] }));
      }
    }

    if (field === "permDzongkhag") {
      updatedPeps[index].permGewog = "";
      try {
        const options = await fetchGewogsByDzongkhag(value);
        setRelatedPepPermGewogMap((prev) => ({
          ...prev,
          [index]: options || [],
        }));
      } catch (e) {
        setRelatedPepPermGewogMap((prev) => ({ ...prev, [index]: [] }));
      }
    }

    if (field === "currDzongkhag") {
      updatedPeps[index].currGewog = "";
      try {
        const options = await fetchGewogsByDzongkhag(value);
        setRelatedPepCurrGewogMap((prev) => ({
          ...prev, [index]: options || [],
        }));
      } catch (e) {
        setRelatedPepCurrGewogMap((prev) => ({ ...prev, [index]: [] }));
      }
    }

    setData({ ...data, relatedPeps: updatedPeps });

    if (!isRequired(value)) {
      setErrors((prev) => {
        const upd = { ...prev };
        delete upd[`relatedPeps.${index}.${field}`];
        return upd;
      });
    }
  };

  const handleRelatedPepFileChange = (
    index: number,
    field: string,
    file: File | null,
  ) => {
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024)
        return;
      const updatedPeps = [...(data.relatedPeps || [])];
      if (!updatedPeps[index]) updatedPeps[index] = createEmptyRelatedPep();
      updatedPeps[index] = { ...updatedPeps[index], [field]: file.name };
      setData({ ...data, relatedPeps: updatedPeps });

      setErrors((prev) => {
        const upd = { ...prev };
        delete upd[`relatedPeps.${index}.${field}`];
        return upd;
      });
    }
  };

  // Utilities
  const isEmpty = (val: any) =>
    val === undefined || val === null || String(val).trim() === "";
  const isEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isNumeric = (val: string) => /^\d+$/.test(val);
  const capitalizeWords = (value: string) =>
    value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

  // Utility to clean up the input field classes
  const getFieldStyle = (errorKey: string) => {
    return `h-10 sm:h-12 w-full text-sm sm:text-base border ${errors[errorKey]
      ? "!border-red-500 focus:!ring-red-500 focus:!border-red-500"
      : "border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
      }`;
  };

  const validateForm = () => {
    let newErrors: Record<string, string> = {};

    // BASIC PERSONAL INFO
    if (isEmpty(data.applicantName))
      newErrors.applicantName = "Applicant name is required";
    if (isEmpty(data.identificationType))
      newErrors.identificationType = "Identification type is required";
    if (isEmpty(data.identificationNo))
      newErrors.identificationNo = "Identification number is required";
    if (isEmpty(data.salutation))
      newErrors.salutation = "Salutation is required";
    if (isEmpty(data.nationality))
      newErrors.nationality = "Nationality is required";
    if (isEmpty(data.gender)) newErrors.gender = "Gender is required";
    if (isEmpty(data.dateOfBirth))
      newErrors.dateOfBirth = "Date of birth is required";
    // Tax identifier fields are no longer required

    if (isNatBhutanese(data.nationality) && isEmpty(data.householdNumber)) {
      newErrors.householdNumber = "Household number is required";
    }

    if (isEmpty(data.identificationIssueDate))
      newErrors.identificationIssueDate =
        "Identification Issue Date is required";
    if (isEmpty(data.identificationExpiryDate))
      newErrors.identificationExpiryDate =
        "Identification Expiry Date is required";
    if (isEmpty(data.maritalStatus))
      newErrors.maritalStatus = "Please select a marital status";

    // SPOUSE INFORMATION
    if (isMarried) {
      const spouseRequiredFields = [
        {
          field: "spouseIdentificationType",
          msg: "Spouse Identification Type is required",
        },
        {
          field: "spouseIdentificationNo",
          msg: "Spouse Identification Number is required",
        },
        { field: "spouseSalutation", msg: "Spouse Salutation is required" },
        { field: "spouseName", msg: "Spouse name is required" },
        { field: "spouseNationality", msg: "Spouse Nationality is required" },
        { field: "spouseGender", msg: "Spouse Gender is required" },
        {
          field: "spouseIdentificationIssueDate",
          msg: "Spouse ID Issue Date is required",
        },
        {
          field: "spouseIdentificationExpiryDate",
          msg: "Spouse ID Expiry Date is required",
        },
        // Spouse tax fields no longer required
        { field: "spouseDateOfBirth", msg: "Spouse Date of Birth is required" },
        {
          field: "spouseIdentificationProof",
          msg: "Spouse Identification Proof is required",
        },
      ];

      spouseRequiredFields.forEach(({ field, msg }) => {
        if (isEmpty(data[field])) newErrors[field] = msg;
      });

      if (
        isNatBhutanese(data.spouseNationality) &&
        isEmpty(data.spouseHouseholdNumber)
      ) {
        newErrors.spouseHouseholdNumber = "Spouse Household number is required";
      }

      if (isEmpty(data.spousePermCountry))
        newErrors.spousePermCountry = "Spouse Country is required";

      if (isBhutanCountry(data.spousePermCountry, countryOptions)) {
        if (isEmpty(data.spousePermDzongkhag))
          newErrors.spousePermDzongkhag = "Spouse Dzongkhag is required";
        if (isEmpty(data.spousePermGewog))
          newErrors.spousePermGewog = "Spouse Gewog is required";
        if (isEmpty(data.spousePermVillage))
          newErrors.spousePermVillage = "Spouse Village/Street is required";
        if (isEmpty(data.spousePermThram))
          newErrors.spousePermThram = "Spouse Thram No is required";
        if (isEmpty(data.spousePermHouse))
          newErrors.spousePermHouse = "Spouse House No is required";
      } else if (data.spousePermCountry) {
        if (isEmpty(data.spousePermDzongkhag))
          newErrors.spousePermDzongkhag = "Spouse State is required";
        if (isEmpty(data.spousePermGewog))
          newErrors.spousePermGewog = "Spouse Province is required";
        if (isEmpty(data.spousePermVillage))
          newErrors.spousePermVillage = "Spouse Street is required";
        if (isEmpty(data.spousePermAddressProof))
          newErrors.spousePermAddressProof = "Spouse Address Proof is required";
      }

      if (isEmpty(data.spouseEmail)) {
        newErrors.spouseEmail = "Spouse Email is required";
      } else if (!isEmail(data.spouseEmail)) {
        newErrors.spouseEmail = "Invalid email format";
      }

      if (isEmpty(data.spouseContact)) {
        newErrors.spouseContact = "Spouse Contact is required";
      } else if (!isNumeric(data.spouseContact)) {
        newErrors.spouseContact = "Contact must be numeric";
      }
    }

    if (isEmpty(data.familyTree)) newErrors.familyTree = "No files uploaded";

    // PERMANENT ADDRESS
    if (!data.permCountry) newErrors.permCountry = "Country is required";
    if (!data.permDzongkhag)
      newErrors.permDzongkhag = isBhutanCountry(
        data.permCountry,
        countryOptions,
      )
        ? "Dzongkhag is required"
        : "State is required";
    if (!data.permGewog)
      newErrors.permGewog = isBhutanCountry(data.permCountry, countryOptions)
        ? "Gewog is required"
        : "Province is required";
    if (isEmpty(data.permVillage))
      newErrors.permVillage = isBhutanCountry(data.permCountry, countryOptions)
        ? "Village is required"
        : "Street is required";

    if (isBhutanCountry(data.permCountry, countryOptions)) {
      if (isEmpty(data.permThram))
        newErrors.permThram = "Thram number is required";
      if (isEmpty(data.permHouse))
        newErrors.permHouse = "House number is required";
    } else if (data.permCountry) {
      if (!data.permAddressProof)
        newErrors.permAddressProof = "Address proof document is required";
    }

    // CURRENT ADDRESS
    if (!data.currCountry) newErrors.currCountry = "Country is required";
    if (!data.currDzongkhag)
      newErrors.currDzongkhag = isBhutanCountry(
        data.currCountry,
        countryOptions,
      )
        ? "Dzongkhag is required"
        : "State is required";
    if (!data.currGewog)
      newErrors.currGewog = isBhutanCountry(data.currCountry, countryOptions)
        ? "Gewog is required"
        : "Province is required";
    if (isEmpty(data.currVillage))
      newErrors.currVillage = isBhutanCountry(data.currCountry, countryOptions)
        ? "Village is required"
        : "Street is required";
    if (isEmpty(data.currFlat)) newErrors.currFlat = "Flat Number is required";

    if (isEmpty(data.currEmail)) newErrors.currEmail = "Email is required";
    else if (!isEmail(data.currEmail))
      newErrors.currEmail = "Invalid email format";
    if (isEmpty(data.currContact))
      newErrors.currContact = "Contact number is required";
    else if (!isNumeric(data.currContact))
      newErrors.currContact = "Contact must be numeric";

    if (
      data.currCountry &&
      !isBhutanCountry(data.currCountry, countryOptions)
    ) {
      if (!data.currAddressProof)
        newErrors.currAddressProof = "Address proof document is required";
    }

    // BANK DETAILS
    if (isEmpty(data.bankName)) newErrors.bankName = "Bank is required";
    if (isEmpty(data.bankAccount))
      newErrors.bankAccount = "Account number is required";
    else if (!isNumeric(data.bankAccount))
      newErrors.bankAccount = "Account number must be numeric";
    if (!data.passportPhoto)
      newErrors.passportPhoto = "No Passport-size photo is uploaded";

    // IDENTIFICATION PROOF (new field)
    if (!data.identificationProof)
      newErrors.identificationProof = "Identification proof is required";

    // EMPLOYMENT
    if (isEmpty(data.employmentStatus))
      newErrors.employmentStatus = "Employment status is required";
    if (data.employmentStatus === "employed") {
      if (isEmpty(data.employeeId))
        newErrors.employeeId = "Employee ID is required";
      if (isEmpty(data.occupation))
        newErrors.occupation = "Occupation is required";
      if (!data.employerType)
        newErrors.employerType = "Employer type is required";
      if (!data.designation) newErrors.designation = "Designation is required";
      if (!data.grade) newErrors.grade = "Grade is required";
      if (isEmpty(data.organizationName))
        newErrors.organizationName = "Organization name is required";
      if (isEmpty(data.orgLocation))
        newErrors.orgLocation = "Organization location is required";
      if (!data.joiningDate) newErrors.joiningDate = "Joining date is required";
      if (!data.serviceNature)
        newErrors.serviceNature = "Service nature is required";
      if (isEmpty(data.annualSalary)) {
        newErrors.annualSalary = "Gross annual salary income is required";
      } else {
        if (!/^\d+(\.\d{1,2})?$/.test(data.annualSalary))
          newErrors.annualSalary = "Income must be a valid number";
        else if (Number(data.annualSalary) <= 0)
          newErrors.annualSalary = "Income must be greater than zero";
      }
    }

    // PEP
    if (isEmpty(data.pepPerson))
      newErrors.pepPerson = "Please specify if you are a PEP or not";
    if (data.pepPerson === "yes") {
      if (isEmpty(data.pepCategory))
        newErrors.pepCategory = "PEP category is required";
      if (isEmpty(data.pepSubCategory))
        newErrors.pepSubCategory = "PEP sub category is required";
      // Removed self identification proof validation here because it's now in personal details section
    }

    // RELATED PEP - Comprehensive Validation (excluding tax fields and spouse info)
    if (data.pepPerson === "no") {
      if (isEmpty(data.pepRelated))
        newErrors.pepRelated =
          "Please specify if you are related to a PEP or not";
      if (data.pepRelated === "yes") {
        (data.relatedPeps || []).forEach((pep: any, index: number) => {
          // PEP Metadata
          if (isEmpty(pep.relationship))
            newErrors[`relatedPeps.${index}.relationship`] = "Required";
          if (isEmpty(pep.identificationNo))
            newErrors[`relatedPeps.${index}.identificationNo`] = "Required";
          if (isEmpty(pep.category))
            newErrors[`relatedPeps.${index}.category`] = "Required";
          if (isEmpty(pep.subCategory))
            newErrors[`relatedPeps.${index}.subCategory`] = "Required";
          if (isEmpty(pep.identificationProof))
            newErrors[`relatedPeps.${index}.identificationProof`] = "Required";

          // Personal Info
          if (isEmpty(pep.identificationType))
            newErrors[`relatedPeps.${index}.identificationType`] = "Required";
          if (isEmpty(pep.salutation))
            newErrors[`relatedPeps.${index}.salutation`] = "Required";
          if (isEmpty(pep.applicantName))
            newErrors[`relatedPeps.${index}.applicantName`] = "Required";
          if (isEmpty(pep.nationality))
            newErrors[`relatedPeps.${index}.nationality`] = "Required";
          if (isEmpty(pep.gender))
            newErrors[`relatedPeps.${index}.gender`] = "Required";
          if (isEmpty(pep.identificationIssueDate))
            newErrors[`relatedPeps.${index}.identificationIssueDate`] =
              "Required";
          if (isEmpty(pep.identificationExpiryDate))
            newErrors[`relatedPeps.${index}.identificationExpiryDate`] =
              "Required";
          if (isEmpty(pep.dateOfBirth))
            newErrors[`relatedPeps.${index}.dateOfBirth`] = "Required";
          // Tax fields not required
          if (isNatBhutanese(pep.nationality) && isEmpty(pep.householdNumber))
            newErrors[`relatedPeps.${index}.householdNumber`] = "Required";
          if (isEmpty(pep.maritalStatus))
            newErrors[`relatedPeps.${index}.maritalStatus`] = "Required";

          // PEP Permanent Address
          if (isEmpty(pep.permCountry))
            newErrors[`relatedPeps.${index}.permCountry`] = "Required";
          if (isBhutanCountry(pep.permCountry, countryOptions)) {
            if (isEmpty(pep.permDzongkhag))
              newErrors[`relatedPeps.${index}.permDzongkhag`] = "Required";
            if (isEmpty(pep.permGewog))
              newErrors[`relatedPeps.${index}.permGewog`] = "Required";
            if (isEmpty(pep.permVillage))
              newErrors[`relatedPeps.${index}.permVillage`] = "Required";
            if (isEmpty(pep.permThram))
              newErrors[`relatedPeps.${index}.permThram`] = "Required";
            if (isEmpty(pep.permHouse))
              newErrors[`relatedPeps.${index}.permHouse`] = "Required";
          } else if (pep.permCountry) {
            if (isEmpty(pep.permDzongkhag))
              newErrors[`relatedPeps.${index}.permDzongkhag`] = "Required";
            if (isEmpty(pep.permGewog))
              newErrors[`relatedPeps.${index}.permGewog`] = "Required";
            if (isEmpty(pep.permVillage))
              newErrors[`relatedPeps.${index}.permVillage`] = "Required";
            if (isEmpty(pep.permAddressProof))
              newErrors[`relatedPeps.${index}.permAddressProof`] = "Required";
          }

          // PEP Current Address
          if (isEmpty(pep.currCountry))
            newErrors[`relatedPeps.${index}.currCountry`] = "Required";
          if (isBhutanCountry(pep.currCountry, countryOptions)) {
            if (isEmpty(pep.currDzongkhag))
              newErrors[`relatedPeps.${index}.currDzongkhag`] = "Required";
            if (isEmpty(pep.currGewog))
              newErrors[`relatedPeps.${index}.currGewog`] = "Required";
            if (isEmpty(pep.currVillage))
              newErrors[`relatedPeps.${index}.currVillage`] = "Required";
            if (isEmpty(pep.currFlat))
              newErrors[`relatedPeps.${index}.currFlat`] = "Required";
          } else if (pep.currCountry) {
            if (isEmpty(pep.currDzongkhag))
              newErrors[`relatedPeps.${index}.currDzongkhag`] = "Required";
            if (isEmpty(pep.currGewog))
              newErrors[`relatedPeps.${index}.currGewog`] = "Required";
            if (isEmpty(pep.currVillage))
              newErrors[`relatedPeps.${index}.currVillage`] = "Required";
            if (isEmpty(pep.currAddressProof))
              newErrors[`relatedPeps.${index}.currAddressProof`] = "Required";
          }

          if (isEmpty(pep.currEmail)) {
            newErrors[`relatedPeps.${index}.currEmail`] = "Required";
          } else if (!isEmail(pep.currEmail)) {
            newErrors[`relatedPeps.${index}.currEmail`] = "Invalid Format";
          }

          if (isEmpty(pep.currContact)) {
            newErrors[`relatedPeps.${index}.currContact`] = "Required";
          } else if (!isNumeric(pep.currContact)) {
            newErrors[`relatedPeps.${index}.currContact`] = "Must be numeric";
          }

          // Spouse Info validation removed to match removal of spouse fields in render
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDates = () => {
    const newErrors: Record<string, string> = {};
    if (data.identificationIssueDate && data.identificationIssueDate > today) {
      newErrors.identificationIssueDate = "Issue date cannot be in the future";
    }
    if (
      data.identificationExpiryDate &&
      data.identificationExpiryDate < today
    ) {
      newErrors.identificationExpiryDate = "Expiry date cannot be in the past";
    }
    if (data.dateOfBirth && data.dateOfBirth > maxDobDate) {
      newErrors.dateOfBirth = "You must be at least 15 years old";
    }
    if (
      data.identificationIssueDate &&
      data.identificationExpiryDate &&
      data.identificationIssueDate >= data.identificationExpiryDate
    ) {
      newErrors.identificationExpiryDate =
        "Expiry date must be after issue date";
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValidDates = validateDates();
    const isValid = validateForm();

    if (!isValid || !isValidDates) return;

    try {
      const verifiedData = getVerifiedCustomerDataFromSession();
      const isExistingUser =
        verifiedData && Object.keys(verifiedData).length > 0;

      if (isExistingUser) {
        setShowCoBorrowerDialog(true);
        return;
      }

      const submitData = new FormData();
      submitData.append("data", JSON.stringify(data));
      if (data.passportPhoto)
        submitData.append("passportPhoto", data.passportPhoto);
      if (data.currAddressProof)
        submitData.append("currAddressProof", data.currAddressProof);
      if (data.permAddressProof)
        submitData.append("permAddressProof", data.permAddressProof);
      if (data.spousePermAddressProof)
        submitData.append(
          "spousePermAddressProof",
          data.spousePermAddressProof,
        );
      if (data.familyTree) submitData.append("familyTree", data.familyTree);
      if (data.identificationProof)
        submitData.append("identificationProof", data.identificationProof);
      if (data.spouseIdentificationProof)
        submitData.append(
          "spouseIdentificationProof",
          data.spouseIdentificationProof,
        );

      const response = await fetch("http://localhost:3001/api/personal", {
        method: "POST",
        body: submitData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.includes("already exists")) {
          setShowCoBorrowerDialog(true);
          return;
        }
        alert(result.error || "Something went wrong");
        return;
      }
      alert("Personal details saved successfully!");
      setShowCoBorrowerDialog(true);
    } catch (error) {
      alert("Failed to submit form");
    }
  };

  const handleCoBorrowerResponse = (hasCoBorrower: boolean) => {
    setShowCoBorrowerDialog(false);
    onNext({ personalDetails: data, hasCoBorrower });
  };

  // Filter identification types to EXCLUDE "Trade License Number" and "Company Registration Number"
  const filteredIdentificationOptions = identificationTypeOptions.filter(
    (option) => {
      const label = (
        option.identity_type ||
        option.identification_type ||
        option.name ||
        ""
      ).toLowerCase();
      // Return true for options that do NOT contain the excluded keywords
      return !(
        label.includes("trade") ||
        label.includes("license") ||
        label.includes("company") ||
        label.includes("registration")
      );
    },
  );

  // Filter tax identifier types to show only Personal Income Tax (PIT)   <-- NEW
  const personalTaxIdentifierOptions = taxIdentifierTypeOptions.filter((opt) => {
    const label = (opt.tax_identifier_type || opt.name || "").toLowerCase();
    return label.includes("personal income tax") || label === "pit";
  });

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 sm:space-y-8 md:space-y-10 pt-4 sm:pt-6 md:pt-8 pb-6 sm:pb-8 md:pb-12"
    >
      {/* 1. Application Personal Information */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
          Application Personal Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-1.5 sm:space-y-2.5">
            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
              Identification Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={
                findPkCodeByLabel(
                  data.identificationType,
                  filteredIdentificationOptions,
                  ["identity_type", "identification_type", "name", "label"],
                ) || data.identificationType
              }
              onValueChange={(value) => {
                setData({ ...data, identificationType: value });
                if (!isRequired(value))
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.identificationType;
                    return upd;
                  });
              }}
            >
              <SelectTrigger className={getFieldStyle("identificationType")}>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {filteredIdentificationOptions.length > 0 ? (
                  filteredIdentificationOptions.map((option, index) => {
                    const value = String(
                      option.identity_type_pk_code ||
                      option.identification_type_pk_code ||
                      option.id ||
                      index,
                    );
                    const label =
                      option.identity_type ||
                      option.identification_type ||
                      option.name ||
                      "Unknown";
                    return (
                      <SelectItem key={value} value={value}>
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
            {errors.identificationType && (
              <p className="text-xs text-red-500 mt-1">
                {errors.identificationType}
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2.5">
            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
              Identification No. <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Enter identification No"
              value={data.identificationNo || ""}
              onChange={(e) => {
                const value = e.target.value;
                setData({ ...data, identificationNo: value });
                if (!isRequired(value))
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.identificationNo;
                    return upd;
                  });
              }}
              className={getFieldStyle("identificationNo")}
            />
            {errors.identificationNo && (
              <p className="text-xs text-red-500 mt-1">
                {errors.identificationNo}
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2.5">
            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
              Salutation <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.salutation}
              onValueChange={(value) => {
                setData({ ...data, salutation: value });
                if (!isRequired(value))
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.salutation;
                    return upd;
                  });
              }}
            >
              <SelectTrigger className={getFieldStyle("salutation")}>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                <SelectItem value="mr">Mr.</SelectItem>
                <SelectItem value="mrs">Mrs.</SelectItem>
                <SelectItem value="ms">Ms.</SelectItem>
                <SelectItem value="dr">Dr.</SelectItem>
              </SelectContent>
            </Select>
            {errors.salutation && (
              <p className="text-xs text-red-500 mt-1">{errors.salutation}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2.5">
            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
              Applicant Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Enter Your Full Name"
              value={data.applicantName || ""}
              onChange={(e) => {
                let value = e.target.value;
                if (!/^[A-Za-z\s]*$/.test(value)) {
                  setErrors((prev) => ({
                    ...prev,
                    applicantName: "Only alphabets are allowed",
                  }));
                  return;
                }
                value = capitalizeWords(value);
                setData({ ...data, applicantName: value });
                if (value.trim() === "")
                  setErrors((prev) => ({
                    ...prev,
                    applicantName: "Full name is required",
                  }));
                else
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.applicantName;
                    return upd;
                  });
              }}
              className={getFieldStyle("applicantName")}
            />
            {errors.applicantName && (
              <p className="text-xs text-red-500 mt-1">
                {errors.applicantName}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-1.5 sm:space-y-2.5">
            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
              Nationality <span className="text-red-500">*</span>
            </Label>
            <Select
              value={findPkCodeByLabel(data.nationality, nationalityOptions, [
                "nationality",
                "name",
                "label",
              ])}
              onValueChange={(value) => {
                setData({ ...data, nationality: value });
                if (!isRequired(value))
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.nationality;
                    return upd;
                  });
              }}
            >
              <SelectTrigger className={getFieldStyle("nationality")}>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {nationalityOptions.length > 0 ? (
                  nationalityOptions.map((option, index) => {
                    const value = String(
                      option.nationality_pk_code ||
                      option.id ||
                      option.code ||
                      index,
                    );
                    const label =
                      option.nationality ||
                      option.name ||
                      option.label ||
                      "Unknown";
                    return (
                      <SelectItem key={value} value={value}>
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
            {errors.nationality && (
              <p className="text-xs text-red-500 mt-1">{errors.nationality}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              Gender <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.gender}
              onValueChange={(value) => {
                setData({ ...data, gender: value });
                if (!isRequired(value))
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.gender;
                    return upd;
                  });
              }}
            >
              <SelectTrigger className={getFieldStyle("gender")}>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-xs text-red-500 mt-1">{errors.gender}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2.5">
            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
              Identification Issue Date <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              max={today}
              value={data.identificationIssueDate || ""}
              onChange={(e) => {
                setData({ ...data, identificationIssueDate: e.target.value });
                setErrors((prev) => {
                  const upd = { ...prev };
                  delete upd.identificationIssueDate;
                  return upd;
                });
              }}
              className={getFieldStyle("identificationIssueDate")}
            />
            {errors.identificationIssueDate && (
              <p className="text-xs text-red-500 mt-1">
                {errors.identificationIssueDate}
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2.5">
            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
              Identification Expiry Date <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              min={today}
              value={data.identificationExpiryDate || ""}
              onChange={(e) => {
                setData({ ...data, identificationExpiryDate: e.target.value });
                setErrors((prev) => {
                  const upd = { ...prev };
                  delete upd.identificationExpiryDate;
                  return upd;
                });
              }}
              className={getFieldStyle("identificationExpiryDate")}
            />
            {errors.identificationExpiryDate && (
              <p className="text-xs text-red-500 mt-1">
                {errors.identificationExpiryDate}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              Date of Birth <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              max={maxDobDate}
              value={data.dateOfBirth || ""}
              onChange={(e) => {
                setData({ ...data, dateOfBirth: e.target.value });
                setErrors((prev) => {
                  const upd = { ...prev };
                  delete upd.dateOfBirth;
                  return upd;
                });
              }}
              className={getFieldStyle("dateOfBirth")}
            />
            {errors.dateOfBirth && (
              <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          {/* Tax Identifier Type - Not required, shows only PIT */}
          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              Tax Identifier Type
            </Label>
            <Select
              value={data.taxIdentifierType}
              onValueChange={(value) => {
                setData({ ...data, taxIdentifierType: value });
              }}
            >
              <SelectTrigger className="h-10 sm:h-12 w-full text-sm sm:text-base border border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
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

          {/* TPN No - Not required */}
          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              TPN No
            </Label>
            <Input
              placeholder="Enter TPN"
              value={data.tpn || ""}
              onChange={(e) => {
                setData({ ...data, tpn: e.target.value });
              }}
              className="h-10 sm:h-12 w-full text-sm sm:text-base border border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
            />
          </div>

          {isNatBhutanese(data.nationality) && (
            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Household Number <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter Household Number"
                value={data.householdNumber || ""}
                onChange={(e) => {
                  setData({ ...data, householdNumber: e.target.value });
                  if (!isRequired(e.target.value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.householdNumber;
                      return upd;
                    });
                }}
                className={getFieldStyle("householdNumber")}
              />
              {errors.householdNumber && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.householdNumber}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              Marital Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={String(data.maritalStatus || "")}
              onValueChange={(value) => {
                setData({ ...data, maritalStatus: value });
                if (!isRequired(value))
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.maritalStatus;
                    return upd;
                  });
              }}
            >
              <SelectTrigger className={getFieldStyle("maritalStatus")}>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {maritalStatusOptions.length > 0 ? (
                  maritalStatusOptions.map((option, index) => {
                    const value = String(
                      option.marital_status_pk_code ||
                      option.id ||
                      option.value ||
                      option.code ||
                      index,
                    );
                    const label =
                      option.marital_status ||
                      option.name ||
                      option.label ||
                      option.description ||
                      option.value ||
                      "Unknown";
                    return (
                      <SelectItem key={value} value={value}>
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
            {errors.maritalStatus && (
              <p className="text-xs text-red-500 mt-1">
                {errors.maritalStatus}
              </p>
            )}
          </div>
        </div>

        {/* File Uploads (Family Tree, Identification Proof, Bank, Passport) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t mt-4">
          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              Upload Family Tree <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="uploadFamilyTree"
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
                  document.getElementById("uploadFamilyTree")?.click()
                }
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {data.familyTree || "No file chosen"}
              </span>
            </div>
            {errors.familyTree && (
              <p className="text-xs text-red-500 mt-1">{errors.familyTree}</p>
            )}
            <p className="text-xs text-gray-500">
              Allowed: PDF, JPG, PNG (Max 5MB)
            </p>
          </div>

          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              Upload Identification Proof <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="uploadIdentificationProof"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  handleFileChange("identificationProof", e.target.files?.[0] || null)
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-28 bg-transparent"
                onClick={() =>
                  document.getElementById("uploadIdentificationProof")?.click()
                }
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {data.identificationProof || "No file chosen"}
              </span>
            </div>
            {errors.identificationProof && (
              <p className="text-xs text-red-500 mt-1">{errors.identificationProof}</p>
            )}
            <p className="text-xs text-gray-500">
              Allowed: PDF, JPG, PNG (Max 5MB)
            </p>
          </div>

          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              Upload Passport-size Photograph{" "}
              <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="uploadPassport"
                className="hidden"
                accept=".jpg,.jpeg,.png"
                onChange={(e) =>
                  handleFileChange("passportPhoto", e.target.files?.[0] || null)
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-28 bg-transparent"
                onClick={() => document.getElementById("uploadPassport")?.click()}
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {data.passportPhoto || "No file chosen"}
              </span>
            </div>
            {errors.passportPhoto && (
              <p className="text-xs text-red-500 mt-1">{errors.passportPhoto}</p>
            )}
            <p className="text-xs text-gray-500">Allowed: JPG, PNG (Max 5MB)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              Name of Bank <span className="text-red-500">*</span>
            </Label>
            <Select
              value={
                findPkCodeByLabel(data.bankName, banksOptions, [
                  "bank_name",
                  "name",
                  "label",
                ]) || data.bankName
              }
              onValueChange={(value) => {
                setData({ ...data, bankName: value });
                if (!isRequired(value))
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.bankName;
                    return upd;
                  });
              }}
            >
              <SelectTrigger className={getFieldStyle("bankName")}>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {banksOptions.length > 0 ? (
                  banksOptions.map((option, index) => {
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
                      <SelectItem key={value} value={value}>
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
            {errors.bankName && (
              <p className="text-xs text-red-500 mt-1">{errors.bankName}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              Bank Saving Account No <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Enter saving account number"
              value={data.bankAccount || ""}
              inputMode="numeric"
              onChange={(e) => {
                const rawValue = e.target.value;
                const valueWithoutSpaces = rawValue.replace(/\s/g, "");
                if (!/^\d*$/.test(valueWithoutSpaces)) {
                  setErrors((prev) => ({
                    ...prev,
                    bankAccount: "Only numeric is allowed",
                  }));
                  const digitsOnly = valueWithoutSpaces.replace(/\D/g, "");
                  setData({ ...data, bankAccount: digitsOnly });
                  return;
                }
                if (valueWithoutSpaces === "")
                  setErrors((prev) => ({
                    ...prev,
                    bankAccount: "Bank account number is required",
                  }));
                else
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.bankAccount;
                    return upd;
                  });
                setData({ ...data, bankAccount: valueWithoutSpaces });
              }}
              className={getFieldStyle("bankAccount")}
            />
            {errors.bankAccount && (
              <p className="text-xs text-red-500 mt-1">{errors.bankAccount}</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Permanent Address */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
          Permanent Address
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              Country <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.permCountry || ""}
              onValueChange={(value) => {
                setData({ ...data, permCountry: value });
                if (!isRequired(value))
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.permCountry;
                    return upd;
                  });
              }}
            >
              <SelectTrigger className={getFieldStyle("permCountry")}>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {countryOptions.length > 0 ? (
                  countryOptions.map((option, index) => {
                    const value = String(
                      option.country_pk_code ||
                      option.id ||
                      option.code ||
                      index,
                    );
                    const label =
                      option.country ||
                      option.name ||
                      option.label ||
                      "Unknown";
                    return (
                      <SelectItem key={value} value={value}>
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
            {errors.permCountry && (
              <p className="text-xs text-red-500 mt-1">{errors.permCountry}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              {isBhutanCountry(data.permCountry, countryOptions)
                ? "Dzongkhag"
                : "State"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            {data.permCountry &&
              !isBhutanCountry(data.permCountry, countryOptions) ? (
              <Input
                placeholder="Enter State"
                value={data.permDzongkhag || ""}
                onChange={(e) => {
                  setData({ ...data, permDzongkhag: e.target.value });
                  if (!isRequired(e.target.value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.permDzongkhag;
                      return upd;
                    });
                }}
                className={getFieldStyle("permDzongkhag")}
              />
            ) : (
              <Select
                value={data.permDzongkhag || ""}
                onValueChange={(value) => {
                  setData({ ...data, permDzongkhag: value });
                  if (!isRequired(value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.permDzongkhag;
                      return upd;
                    });
                }}
                disabled={!isBhutanCountry(data.permCountry, countryOptions)}
              >
                <SelectTrigger className={getFieldStyle("permDzongkhag")}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {dzongkhagOptions.length > 0 ? (
                    dzongkhagOptions.map((option, index) => {
                      const value = String(
                        option.dzongkhag_pk_code ||
                        option.id ||
                        option.code ||
                        index,
                      );
                      const label =
                        option.dzongkhag ||
                        option.name ||
                        option.label ||
                        "Unknown";
                      return (
                        <SelectItem key={value} value={value}>
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
            {errors.permDzongkhag && (
              <p className="text-xs text-red-500 mt-1">
                {errors.permDzongkhag}
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              {isBhutanCountry(data.permCountry, countryOptions)
                ? "Gewog"
                : "Province"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            {data.permCountry &&
              !isBhutanCountry(data.permCountry, countryOptions) ? (
              <Input
                placeholder="Enter Province"
                value={data.permGewog || ""}
                onChange={(e) => {
                  setData({ ...data, permGewog: e.target.value });
                  if (!isRequired(e.target.value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.permGewog;
                      return upd;
                    });
                }}
                className={getFieldStyle("permGewog")}
              />
            ) : (
              <Select
                value={
                  isBhutanCountry(data.permCountry, countryOptions)
                    ? data.permGewog
                    : ""
                }
                onValueChange={(value) => {
                  setData({ ...data, permGewog: value });
                  if (!isRequired(value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.permGewog;
                      return upd;
                    });
                }}
                disabled={!isBhutanCountry(data.permCountry, countryOptions)}
              >
                <SelectTrigger className={getFieldStyle("permGewog")}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {permGewogOptions.length > 0 ? (
                    permGewogOptions.map((option, index) => {
                      const value = String(
                        option.gewog_pk_code ||
                        option.id ||
                        option.code ||
                        index,
                      );
                      const label =
                        option.gewog ||
                        option.name ||
                        option.label ||
                        "Unknown";
                      return (
                        <SelectItem key={value} value={value}>
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
            {errors.permGewog && (
              <p className="text-xs text-red-500 mt-1">{errors.permGewog}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              {isBhutanCountry(data.permCountry, countryOptions)
                ? "Village/Street"
                : "Street"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder={
                isBhutanCountry(data.permCountry, countryOptions)
                  ? "Enter Village/Street"
                  : "Enter Street"
              }
              value={data.permVillage || ""}
              onChange={(e) => {
                setData({ ...data, permVillage: e.target.value });
                if (!isRequired(e.target.value))
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.permVillage;
                    return upd;
                  });
              }}
              className={getFieldStyle("permVillage")}
              disabled={!data.permCountry}
            />
            {errors.permVillage && (
              <p className="text-xs text-red-500 mt-1">{errors.permVillage}</p>
            )}
          </div>
        </div>

        {isBhutanCountry(data.permCountry, countryOptions) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Thram No. <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter Thram No"
                value={data.permThram || ""}
                onChange={(e) => {
                  setData({ ...data, permThram: e.target.value });
                  if (!isRequired(e.target.value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.permThram;
                      return upd;
                    });
                }}
                className={getFieldStyle("permThram")}
              />
              {errors.permThram && (
                <p className="text-xs text-red-500 mt-1">{errors.permThram}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                House No. <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter House No"
                value={data.permHouse || ""}
                onChange={(e) => {
                  setData({ ...data, permHouse: e.target.value });
                  if (!isRequired(e.target.value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.permHouse;
                      return upd;
                    });
                }}
                className={getFieldStyle("permHouse")}
              />
              {errors.permHouse && (
                <p className="text-xs text-red-500 mt-1">{errors.permHouse}</p>
              )}
            </div>
          </div>
        )}

        {data.permCountry &&
          !isBhutanCountry(data.permCountry, countryOptions) && (
            <div className="space-y-2.5 border-t pt-4">
              <Label className="text-gray-800 font-semibold text-sm">
                Upload Address Proof Document{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="permAddressProof"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    handleFileChange(
                      "permAddressProof",
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
                    document.getElementById("permAddressProof")?.click()
                  }
                >
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground">
                  {data.permAddressProof || "No file chosen"}
                </span>
              </div>
              {errors.permAddressProof && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.permAddressProof}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Allowed: PDF, JPG, PNG (Max 5MB)
              </p>
            </div>
          )}
      </div>

      {/* 3. Current/Residential Address */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
          Current/Residential Address
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              Country of Resident <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.currCountry || ""}
              onValueChange={(value) => {
                setData({ ...data, currCountry: value });
                if (!isRequired(value))
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.currCountry;
                    return upd;
                  });
              }}
            >
              <SelectTrigger className={getFieldStyle("currCountry")}>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {countryOptions.length > 0 ? (
                  countryOptions.map((option, index) => {
                    const value = String(
                      option.country_pk_code ||
                      option.id ||
                      option.code ||
                      index,
                    );
                    const label =
                      option.country ||
                      option.name ||
                      option.label ||
                      "Unknown";
                    return (
                      <SelectItem key={value} value={value}>
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
            {errors.currCountry && (
              <p className="text-xs text-red-500 mt-1">{errors.currCountry}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              {isBhutanCountry(data.currCountry, countryOptions)
                ? "Dzongkhag"
                : "State"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            {data.currCountry &&
              !isBhutanCountry(data.currCountry, countryOptions) ? (
              <Input
                placeholder="Enter State"
                value={data.currDzongkhag || ""}
                onChange={(e) => {
                  setData({ ...data, currDzongkhag: e.target.value });
                  if (!isRequired(e.target.value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.currDzongkhag;
                      return upd;
                    });
                }}
                className={getFieldStyle("currDzongkhag")}
              />
            ) : (
              <Select
                value={data.currDzongkhag || ""}
                onValueChange={(value) => {
                  setData({ ...data, currDzongkhag: value });
                  if (!isRequired(value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.currDzongkhag;
                      return upd;
                    });
                }}
                disabled={!isBhutanCountry(data.currCountry, countryOptions)}
              >
                <SelectTrigger className={getFieldStyle("currDzongkhag")}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {dzongkhagOptions.length > 0 ? (
                    dzongkhagOptions.map((option, index) => {
                      const value = String(
                        option.dzongkhag_pk_code ||
                        option.id ||
                        option.code ||
                        index,
                      );
                      const label =
                        option.dzongkhag ||
                        option.name ||
                        option.label ||
                        "Unknown";
                      return (
                        <SelectItem key={value} value={value}>
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
            {errors.currDzongkhag && (
              <p className="text-xs text-red-500 mt-1">
                {errors.currDzongkhag}
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              {isBhutanCountry(data.currCountry, countryOptions)
                ? "Gewog"
                : "Province"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            {data.currCountry &&
              !isBhutanCountry(data.currCountry, countryOptions) ? (
              <Input
                placeholder="Enter Province"
                value={data.currGewog || ""}
                onChange={(e) => {
                  setData({ ...data, currGewog: e.target.value });
                  if (!isRequired(e.target.value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.currGewog;
                      return upd;
                    });
                }}
                className={getFieldStyle("currGewog")}
              />
            ) : (
              <Select
                value={
                  isBhutanCountry(data.currCountry, countryOptions)
                    ? data.currGewog
                    : ""
                }
                onValueChange={(value) => {
                  setData({ ...data, currGewog: value });
                  if (!isRequired(value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.currGewog;
                      return upd;
                    });
                }}
                disabled={!isBhutanCountry(data.currCountry, countryOptions)}
              >
                <SelectTrigger className={getFieldStyle("currGewog")}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {currGewogOptions.length > 0 ? (
                    currGewogOptions.map((option, index) => {
                      const value = String(
                        option.gewog_pk_code ||
                        option.id ||
                        option.code ||
                        index,
                      );
                      const label =
                        option.gewog ||
                        option.name ||
                        option.label ||
                        "Unknown";
                      return (
                        <SelectItem key={value} value={value}>
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
            {errors.currGewog && (
              <p className="text-xs text-red-500 mt-1">{errors.currGewog}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              {isBhutanCountry(data.currCountry, countryOptions)
                ? "Village/Street"
                : "Street"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder={
                isBhutanCountry(data.currCountry, countryOptions)
                  ? "Enter Village/Street"
                  : "Enter Street"
              }
              value={data.currVillage || ""}
              onChange={(e) => {
                setData({ ...data, currVillage: e.target.value });
                if (!isRequired(e.target.value))
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.currVillage;
                    return upd;
                  });
              }}
              className={getFieldStyle("currVillage")}
              disabled={!data.currCountry}
            />
            {errors.currVillage && (
              <p className="text-xs text-red-500 mt-1">{errors.currVillage}</p>
            )}
          </div>
        </div>

        {isBhutanCountry(data.currCountry, countryOptions) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                House/Building/ Flat No <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter Flat No"
                value={data.currFlat || ""}
                onChange={(e) => {
                  setData({ ...data, currFlat: e.target.value });
                  if (!isRequired(e.target.value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.currFlat;
                      return upd;
                    });
                }}
                className={getFieldStyle("currFlat")}
              />
              {errors.currFlat && (
                <p className="text-xs text-red-500 mt-1">{errors.currFlat}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="Enter Your Email"
                value={data.currEmail || ""}
                onChange={(e) => {
                  setData({ ...data, currEmail: e.target.value });
                  if (!isRequired(e.target.value) && isEmail(e.target.value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.currEmail;
                      return upd;
                    });
                }}
                className={getFieldStyle("currEmail")}
              />
              {errors.currEmail && (
                <p className="text-xs text-red-500 mt-1">{errors.currEmail}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Contact Number <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter Contact No"
                value={data.currContact || ""}
                onChange={(e) => {
                  setData({ ...data, currContact: e.target.value });
                  if (!isRequired(e.target.value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.currContact;
                      return upd;
                    });
                }}
                className={getFieldStyle("currContact")}
              />
              {errors.currContact && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.currContact}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Alternate Contact No
              </Label>
              <Input
                placeholder="Enter Contact No"
                value={data.currAlternateContact || ""}
                onChange={(e) =>
                  setData({ ...data, currAlternateContact: e.target.value })
                }
                className="h-10 sm:h-12 w-full text-sm sm:text-base border border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>
          </div>
        )}

        {data.currCountry &&
          !isBhutanCountry(data.currCountry, countryOptions) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2.5">
                <Label className="text-gray-800 font-semibold text-sm">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="Enter Your Email"
                  value={data.currEmail || ""}
                  onChange={(e) => {
                    setData({ ...data, currEmail: e.target.value });
                    if (!isRequired(e.target.value) && isEmail(e.target.value))
                      setErrors((prev) => {
                        const upd = { ...prev };
                        delete upd.currEmail;
                        return upd;
                      });
                  }}
                  className={getFieldStyle("currEmail")}
                />
                {errors.currEmail && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.currEmail}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label className="text-gray-800 font-semibold text-sm">
                  Contact Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter Contact No"
                  value={data.currContact || ""}
                  onChange={(e) => {
                    setData({ ...data, currContact: e.target.value });
                    if (!isRequired(e.target.value))
                      setErrors((prev) => {
                        const upd = { ...prev };
                        delete upd.currContact;
                        return upd;
                      });
                  }}
                  className={getFieldStyle("currContact")}
                />
                {errors.currContact && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.currContact}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label className="text-gray-800 font-semibold text-sm">
                  Alternate Contact No
                </Label>
                <Input
                  placeholder="Enter Contact No"
                  value={data.currAlternateContact || ""}
                  onChange={(e) =>
                    setData({ ...data, currAlternateContact: e.target.value })
                  }
                  className="h-10 sm:h-12 w-full text-sm sm:text-base border border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                />
              </div>
            </div>
          )}

        {data.currCountry &&
          !isBhutanCountry(data.currCountry, countryOptions) && (
            <div className="space-y-2.5 border-t pt-4">
              <Label className="text-gray-800 font-semibold text-sm">
                Upload Address Proof Document{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="currAddressProof"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    handleFileChange(
                      "currAddressProof",
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
                    document.getElementById("currAddressProof")?.click()
                  }
                >
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground">
                  {data.currAddressProof || "No file chosen"}
                </span>
              </div>
              {errors.currAddressProof && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.currAddressProof}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Allowed: PDF, JPG, PNG (Max 5MB)
              </p>
            </div>
          )}
      </div>

      {/* 4. PEP Declaration */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
          PEP Declaration
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 border-b pb-6">
          <div className="space-y-2.5">
            <Label className="text-gray-800 font-semibold text-sm">
              Politically Exposed Person{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.pepPerson}
              onValueChange={(value) => {
                setData((prev: any) => ({
                  ...prev,
                  pepPerson: value,
                  pepRelated: value === "yes" ? "no" : prev.pepRelated,
                  relatedPeps: value === "yes" ? [] : prev.relatedPeps,
                }));
                setErrors((prev) => {
                  const upd = { ...prev };
                  delete upd.pepPerson;
                  if (value === "yes") delete upd.pepRelated;
                  return upd;
                });
              }}
            >
              <SelectTrigger className={getFieldStyle("pepPerson")}>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            {errors.pepPerson && (
              <p className="text-xs text-red-500 mt-1">{errors.pepPerson}</p>
            )}
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
                    setData({
                      ...data,
                      pepCategory: value,
                      pepSubCategory: "",
                    });
                    if (!isRequired(value))
                      setErrors((prev) => {
                        const upd = { ...prev };
                        delete upd.pepCategory;
                        return upd;
                      });
                  }}
                >
                  <SelectTrigger className={getFieldStyle("pepCategory")}>
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {pepCategoryOptions.length > 0 ? (
                      pepCategoryOptions.map((option, index) => {
                        const value = String(
                          option.pep_category_pk_code || option.id || index,
                        );
                        const label =
                          option.pep_category || option.name || "Unknown";
                        return (
                          <SelectItem key={value} value={value}>
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
                {errors.pepCategory && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.pepCategory}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label className="text-gray-800 font-semibold text-sm">
                  PEP Sub Category<span className="text-destructive">*</span>
                </Label>
                <Select
                  value={data.pepSubCategory}
                  onValueChange={(value) => {
                    setData({ ...data, pepSubCategory: value });
                    if (!isRequired(value))
                      setErrors((prev) => {
                        const upd = { ...prev };
                        delete upd.pepSubCategory;
                        return upd;
                      });
                  }}
                  disabled={!data.pepCategory}
                >
                  <SelectTrigger className={getFieldStyle("pepSubCategory")}>
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {pepSubCategoryOptions.length > 0 ? (
                      pepSubCategoryOptions.map((option, index) => {
                        const value = String(
                          option.pep_sub_category_pk_code || option.id || index,
                        );
                        const label =
                          option.pep_sub_category || option.name || "Unknown";
                        return (
                          <SelectItem key={value} value={value}>
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
                {errors.pepSubCategory && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.pepSubCategory}
                  </p>
                )}
              </div>

              {/* Removed self identification proof upload from here */}
            </>
          )}
        </div>

        {data.pepPerson === "no" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pt-6">
            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Are you related to any PEP?{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.pepRelated}
                onValueChange={(value) => {
                  setData({
                    ...data,
                    pepRelated: value,
                    relatedPeps:
                      value === "yes" ? [createEmptyRelatedPep()] : [],
                  });
                  if (!isRequired(value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.pepRelated;
                      return upd;
                    });
                }}
              >
                <SelectTrigger className={getFieldStyle("pepRelated")}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              {errors.pepRelated && (
                <p className="text-xs text-red-500 mt-1">{errors.pepRelated}</p>
              )}
            </div>
          </div>
        )}

        {/* COMPREHENSIVE RELATED PEP MULTIPLE ENTRIES (spouse info removed) */}
        {data.pepRelated === "yes" && (
          <div className="space-y-8 pt-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-lg font-bold text-[#003DA5]">
                Related PEP Details
              </h3>
            </div>

            {(data.relatedPeps || []).map((pep: any, index: number) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-200 rounded-lg p-6 relative shadow-sm"
              >
                <div className="flex justify-between items-center mb-6">
                  <span className="text-md font-bold text-gray-700">
                    Person {index + 1}
                  </span>
                  {(data.relatedPeps || []).length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRelatedPep(index)}
                      className="hover:bg-red-50"
                    >
                      <Trash2 className="h-5 w-5 text-red-500" />
                    </Button>
                  )}
                </div>

                {/* --- PEP Declaration Information --- */}
                <h4 className="text-sm font-bold text-[#003DA5] mb-4 uppercase tracking-wide">
                  PEP Declaration Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Relationship <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={pep.relationship || ""}
                      onValueChange={(value) =>
                        handleRelatedPepChange(index, "relationship", value)
                      }
                    >
                      <SelectTrigger
                        className={getFieldStyle(
                          `relatedPeps.${index}.relationship`,
                        )}
                      >
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors[`relatedPeps.${index}.relationship`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${index}.relationship`]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      PEP Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={pep.category || ""}
                      onValueChange={(value) =>
                        handleRelatedPepChange(index, "category", value)
                      }
                    >
                      <SelectTrigger
                        className={getFieldStyle(
                          `relatedPeps.${index}.category`,
                        )}
                      >
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
                        {pepCategoryOptions.length > 0 ? (
                          pepCategoryOptions.map((option, idx) => {
                            const value = String(
                              option.pep_category_pk_code || option.id || idx,
                            );
                            const label =
                              option.pep_category || option.name || "Unknown";
                            return (
                              <SelectItem key={value} value={value}>
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
                    {errors[`relatedPeps.${index}.category`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${index}.category`]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      PEP Sub Category{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={pep.subCategory || ""}
                      onValueChange={(value) =>
                        handleRelatedPepChange(index, "subCategory", value)
                      }
                      disabled={!pep.category}
                    >
                      <SelectTrigger
                        className={getFieldStyle(
                          `relatedPeps.${index}.subCategory`,
                        )}
                      >
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
                        {relatedPepOptionsMap[index]?.length > 0 ? (
                          relatedPepOptionsMap[index].map((option, idx) => {
                            const value = String(
                              option.pep_sub_category_pk_code ||
                              option.id ||
                              idx,
                            );
                            const label =
                              option.pep_sub_category ||
                              option.name ||
                              "Unknown";
                            return (
                              <SelectItem key={value} value={value}>
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
                    {errors[`relatedPeps.${index}.subCategory`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${index}.subCategory`]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Upload Identification Proof{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id={`uploadId-${index}`}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          handleRelatedPepFileChange(
                            index,
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
                          document.getElementById(`uploadId-${index}`)?.click()
                        }
                      >
                        Choose File
                      </Button>
                      <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {pep.identificationProof || "No file chosen"}
                      </span>
                    </div>
                    {errors[`relatedPeps.${index}.identificationProof`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${index}.identificationProof`]}
                      </p>
                    )}
                  </div>
                </div>

                {/* --- Personal Information --- */}
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
                      value={
                        findPkCodeByLabel(
                          pep.identificationType,
                          filteredIdentificationOptions, [
                          "identity_type",
                          "identification_type",
                          "name",
                          "label",
                        ],
                        ) || pep.identificationType
                      }
                      onValueChange={(value) =>
                        handleRelatedPepChange(
                          index,
                          "identificationType",
                          value,
                        )
                      }
                    >
                      <SelectTrigger
                        className={getFieldStyle(
                          `relatedPeps.${index}.identificationType`,
                        )}
                      >
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
                        {filteredIdentificationOptions.length > 0 ? (
                          filteredIdentificationOptions.map((opt, i) => (
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
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {errors[`relatedPeps.${index}.identificationType`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${index}.identificationType`]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Identification No. <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter ID No"
                      value={pep.identificationNo || ""}
                      onChange={(e) =>
                        handleRelatedPepChange(
                          index,
                          "identificationNo",
                          e.target.value,
                        )
                      }
                      className={getFieldStyle(
                        `relatedPeps.${index}.identificationNo`,
                      )}
                    />
                    {errors[`relatedPeps.${index}.identificationNo`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${index}.identificationNo`]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Salutation <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={pep.salutation || ""}
                      onValueChange={(value) =>
                        handleRelatedPepChange(index, "salutation", value)
                      }
                    >
                      <SelectTrigger
                        className={getFieldStyle(
                          `relatedPeps.${index}.salutation`,
                        )}
                      >
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
                        <SelectItem value="mr">Mr.</SelectItem>
                        <SelectItem value="mrs">Mrs.</SelectItem>
                        <SelectItem value="ms">Ms.</SelectItem>
                        <SelectItem value="dr">Dr.</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors[`relatedPeps.${index}.salutation`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${index}.salutation`]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Applicant Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter Full Name"
                      value={pep.applicantName || ""}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (!/^[A-Za-z\s]*$/.test(value)) return;
                        value = capitalizeWords(value);
                        handleRelatedPepChange(index, "applicantName", value);
                      }}
                      className={getFieldStyle(
                        `relatedPeps.${index}.applicantName`,
                      )}
                    />
                    {errors[`relatedPeps.${index}.applicantName`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${index}.applicantName`]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Nationality <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={
                        findPkCodeByLabel(pep.nationality, nationalityOptions, [
                          "nationality",
                          "name",
                          "label",
                        ]) || pep.nationality
                      }
                      onValueChange={(value) =>
                        handleRelatedPepChange(index, "nationality", value)
                      }
                    >
                      <SelectTrigger
                        className={getFieldStyle(
                          `relatedPeps.${index}.nationality`,
                        )}
                      >
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
                        {nationalityOptions.length > 0 ? (
                          nationalityOptions.map((opt, i) => (
                            <SelectItem
                              key={i}
                              value={String(
                                opt.nationality_pk_code || opt.id || i,
                              )}
                            >
                              {opt.nationality || opt.name || "Unknown"}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {errors[`relatedPeps.${index}.nationality`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${index}.nationality`]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={pep.gender || ""}
                      onValueChange={(value) =>
                        handleRelatedPepChange(index, "gender", value)
                      }
                    >
                      <SelectTrigger
                        className={getFieldStyle(`relatedPeps.${index}.gender`)}
                      >
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors[`relatedPeps.${index}.gender`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${index}.gender`]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Identification Issue Date{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      max={today}
                      value={pep.identificationIssueDate || ""}
                      onChange={(e) =>
                        handleRelatedPepChange(
                          index,
                          "identificationIssueDate",
                          e.target.value,
                        )
                      }
                      className={getFieldStyle(
                        `relatedPeps.${index}.identificationIssueDate`,
                      )}
                    />
                    {errors[`relatedPeps.${index}.identificationIssueDate`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${index}.identificationIssueDate`]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Identification Expiry Date{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      min={today}
                      value={pep.identificationExpiryDate || ""}
                      onChange={(e) =>
                        handleRelatedPepChange(
                          index,
                          "identificationExpiryDate",
                          e.target.value,
                        )
                      }
                      className={getFieldStyle(
                        `relatedPeps.${index}.identificationExpiryDate`,
                      )}
                    />
                    {errors[
                      `relatedPeps.${index}.identificationExpiryDate`
                    ] && (
                        <p className="text-xs text-red-500 mt-1">
                          {
                            errors[
                            `relatedPeps.${index}.identificationExpiryDate`
                            ]
                          }
                        </p>
                      )}
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Date of Birth <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      max={maxDobDate}
                      value={pep.dateOfBirth || ""}
                      onChange={(e) =>
                        handleRelatedPepChange(
                          index,
                          "dateOfBirth",
                          e.target.value,
                        )
                      }
                      className={getFieldStyle(
                        `relatedPeps.${index}.dateOfBirth`,
                      )}
                    />
                    {errors[`relatedPeps.${index}.dateOfBirth`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${index}.dateOfBirth`]}
                      </p>
                    )}
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
                          "taxIdentifierType",
                          value,
                        )
                      }
                    >
                      <SelectTrigger
                        className={getFieldStyle(
                          `relatedPeps.${index}.taxIdentifierType`,
                        )}
                      >
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
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
                      value={pep.tpn || ""}
                      onChange={(e) =>
                        handleRelatedPepChange(index, "tpn", e.target.value)
                      }
                      className="h-10 sm:h-12 w-full text-sm sm:text-base border border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    />
                  </div>

                  {isNatBhutanese(pep.nationality) && (
                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Household Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Household No"
                        value={pep.householdNumber || ""}
                        onChange={(e) =>
                          handleRelatedPepChange(
                            index,
                            "householdNumber",
                            e.target.value,
                          )
                        }
                        className={getFieldStyle(
                          `relatedPeps.${index}.householdNumber`,
                        )}
                      />
                      {errors[`relatedPeps.${index}.householdNumber`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`relatedPeps.${index}.householdNumber`]}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-sm">
                      Marital Status <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={String(pep.maritalStatus || "")}
                      onValueChange={(value) =>
                        handleRelatedPepChange(index, "maritalStatus", value)
                      }
                    >
                      <SelectTrigger
                        className={getFieldStyle(
                          `relatedPeps.${index}.maritalStatus`,
                        )}
                      >
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent sideOffset={4}>
                        {maritalStatusOptions.length > 0 ? (
                          maritalStatusOptions.map((opt, i) => (
                            <SelectItem
                              key={i}
                              value={String(
                                opt.marital_status_pk_code || opt.id || i,
                              )}
                            >
                              {opt.marital_status || opt.name || "Unknown"}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {errors[`relatedPeps.${index}.maritalStatus`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`relatedPeps.${index}.maritalStatus`]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Spouse Information removed entirely */}

                {/* --- PEP Permanent Address --- */}
                <div className="mt-8 border-t border-dashed pt-8">
                  <h4 className="text-sm font-bold text-[#003DA5] mb-4 uppercase tracking-wide">
                    Permanent Address
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={pep.permCountry || ""}
                        onValueChange={(value) =>
                          handleRelatedPepChange(index, "permCountry", value)
                        }
                      >
                        <SelectTrigger
                          className={getFieldStyle(
                            `relatedPeps.${index}.permCountry`,
                          )}
                        >
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {countryOptions.length > 0 ? (
                            countryOptions.map((opt, i) => (
                              <SelectItem
                                key={i}
                                value={String(
                                  opt.country_pk_code || opt.id || i,
                                )}
                              >
                                {opt.country || opt.name || "Unknown"}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="loading" disabled>
                              Loading...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {errors[`relatedPeps.${index}.permCountry`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`relatedPeps.${index}.permCountry`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        {isBhutanCountry(pep.permCountry, countryOptions)
                          ? "Dzongkhag"
                          : "State"}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      {pep.permCountry &&
                        !isBhutanCountry(pep.permCountry, countryOptions) ? (
                        <Input
                          placeholder="Enter State"
                          value={pep.permDzongkhag || ""}
                          onChange={(e) =>
                            handleRelatedPepChange(
                              index,
                              "permDzongkhag",
                              e.target.value,
                            )
                          }
                          className={getFieldStyle(
                            `relatedPeps.${index}.permDzongkhag`,
                          )}
                        />
                      ) : (
                        <Select
                          value={pep.permDzongkhag || ""}
                          onValueChange={(value) =>
                            handleRelatedPepChange(
                              index,
                              "permDzongkhag",
                              value,
                            )
                          }
                          disabled={
                            !isBhutanCountry(pep.permCountry, countryOptions)
                          }
                        >
                          <SelectTrigger
                            className={getFieldStyle(
                              `relatedPeps.${index}.permDzongkhag`,
                            )}
                          >
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent sideOffset={4}>
                            {dzongkhagOptions.length > 0 ? (
                              dzongkhagOptions.map((opt, i) => (
                                <SelectItem
                                  key={i}
                                  value={String(
                                    opt.dzongkhag_pk_code || opt.id || i,
                                  )}
                                >
                                  {opt.dzongkhag || opt.name || "Unknown"}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="loading" disabled>
                                Loading...
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      {errors[`relatedPeps.${index}.permDzongkhag`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`relatedPeps.${index}.permDzongkhag`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        {isBhutanCountry(pep.permCountry, countryOptions)
                          ? "Gewog"
                          : "Province"}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      {pep.permCountry &&
                        !isBhutanCountry(pep.permCountry, countryOptions) ? (
                        <Input
                          placeholder="Enter Province"
                          value={pep.permGewog || ""}
                          onChange={(e) =>
                            handleRelatedPepChange(
                              index,
                              "permGewog",
                              e.target.value,
                            )
                          }
                          className={getFieldStyle(
                            `relatedPeps.${index}.permGewog`,
                          )}
                        />
                      ) : (
                        <Select
                          value={pep.permGewog || ""}
                          onValueChange={(value) =>
                            handleRelatedPepChange(index, "permGewog", value)
                          }
                          disabled={
                            !isBhutanCountry(pep.permCountry, countryOptions)
                          }
                        >
                          <SelectTrigger
                            className={getFieldStyle(
                              `relatedPeps.${index}.permGewog`,
                            )}
                          >
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent sideOffset={4}>
                            {relatedPepPermGewogMap[index]?.length > 0 ? (
                              relatedPepPermGewogMap[index].map((opt, i) => (
                                <SelectItem
                                  key={i}
                                  value={String(
                                    opt.gewog_pk_code || opt.id || i,
                                  )}
                                >
                                  {opt.gewog || opt.name || "Unknown"}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="loading" disabled>
                                {pep.permDzongkhag
                                  ? "Loading..."
                                  : "Select Dzongkhag first"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      {errors[`relatedPeps.${index}.permGewog`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`relatedPeps.${index}.permGewog`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        {isBhutanCountry(pep.permCountry, countryOptions)
                          ? "Village/Street"
                          : "Street"}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Location"
                        value={pep.permVillage || ""}
                        onChange={(e) =>
                          handleRelatedPepChange(
                            index,
                            "permVillage",
                            e.target.value,
                          )
                        }
                        className={getFieldStyle(
                          `relatedPeps.${index}.permVillage`,
                        )}
                        disabled={!pep.permCountry}
                      />
                      {errors[`relatedPeps.${index}.permVillage`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`relatedPeps.${index}.permVillage`]}
                        </p>
                      )}
                    </div>

                    {isBhutanCountry(pep.permCountry, countryOptions) && (
                      <>
                        <div className="space-y-2.5">
                          <Label className="text-gray-800 font-semibold text-sm">
                            Thram No. <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder="Enter Thram No"
                            value={pep.permThram || ""}
                            onChange={(e) =>
                              handleRelatedPepChange(
                                index,
                                "permThram",
                                e.target.value,
                              )
                            }
                            className={getFieldStyle(
                              `relatedPeps.${index}.permThram`,
                            )}
                          />
                          {errors[`relatedPeps.${index}.permThram`] && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors[`relatedPeps.${index}.permThram`]}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-gray-800 font-semibold text-sm">
                            House No. <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder="Enter House No"
                            value={pep.permHouse || ""}
                            onChange={(e) =>
                              handleRelatedPepChange(
                                index,
                                "permHouse",
                                e.target.value,
                              )
                            }
                            className={getFieldStyle(
                              `relatedPeps.${index}.permHouse`,
                            )}
                          />
                          {errors[`relatedPeps.${index}.permHouse`] && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors[`relatedPeps.${index}.permHouse`]}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {pep.permCountry &&
                    !isBhutanCountry(pep.permCountry, countryOptions) && (
                      <div className="space-y-2.5 mb-8">
                        <Label className="text-gray-800 font-semibold text-sm">
                          Upload Address Proof Document{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id={`pepPermProof-${index}`}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              handleRelatedPepFileChange(
                                index,
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
                                .getElementById(`pepPermProof-${index}`)
                                ?.click()
                            }
                          >
                            Choose File
                          </Button>
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {pep.permAddressProof || "No file chosen"}
                          </span>
                        </div>
                        {errors[`relatedPeps.${index}.permAddressProof`] && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors[`relatedPeps.${index}.permAddressProof`]}
                          </p>
                        )}
                      </div>
                    )}
                </div>

                {/* --- PEP Current/Residential Address --- */}
                <div className="mt-8 border-t border-dashed pt-8">
                  <h4 className="text-sm font-bold text-[#003DA5] mb-4 uppercase tracking-wide">
                    Current/Residential Address
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={pep.currCountry || ""}
                        onValueChange={(value) =>
                          handleRelatedPepChange(index, "currCountry", value)
                        }
                      >
                        <SelectTrigger
                          className={getFieldStyle(
                            `relatedPeps.${index}.currCountry`,
                          )}
                        >
                          <SelectValue placeholder="[Select]" />
                        </SelectTrigger>
                        <SelectContent sideOffset={4}>
                          {countryOptions.length > 0 ? (
                            countryOptions.map((opt, i) => (
                              <SelectItem
                                key={i}
                                value={String(
                                  opt.country_pk_code || opt.id || i,
                                )}
                              >
                                {opt.country || opt.name || "Unknown"}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="loading" disabled>
                              Loading...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {errors[`relatedPeps.${index}.currCountry`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`relatedPeps.${index}.currCountry`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        {isBhutanCountry(pep.currCountry, countryOptions)
                          ? "Dzongkhag"
                          : "State"}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      {pep.currCountry &&
                        !isBhutanCountry(pep.currCountry, countryOptions) ? (
                        <Input
                          placeholder="Enter State"
                          value={pep.currDzongkhag || ""}
                          onChange={(e) =>
                            handleRelatedPepChange(
                              index,
                              "currDzongkhag",
                              e.target.value,
                            )
                          }
                          className={getFieldStyle(
                            `relatedPeps.${index}.currDzongkhag`,
                          )}
                        />
                      ) : (
                        <Select
                          value={pep.currDzongkhag || ""}
                          onValueChange={(value) =>
                            handleRelatedPepChange(
                              index,
                              "currDzongkhag",
                              value,
                            )
                          }
                          disabled={
                            !isBhutanCountry(pep.currCountry, countryOptions)
                          }
                        >
                          <SelectTrigger
                            className={getFieldStyle(
                              `relatedPeps.${index}.currDzongkhag`,
                            )}
                          >
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent sideOffset={4}>
                            {dzongkhagOptions.length > 0 ? (
                              dzongkhagOptions.map((opt, i) => (
                                <SelectItem
                                  key={i}
                                  value={String(
                                    opt.dzongkhag_pk_code || opt.id || i,
                                  )}
                                >
                                  {opt.dzongkhag || opt.name || "Unknown"}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="loading" disabled>
                                Loading...
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      {errors[`relatedPeps.${index}.currDzongkhag`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`relatedPeps.${index}.currDzongkhag`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        {isBhutanCountry(pep.currCountry, countryOptions)
                          ? "Gewog"
                          : "Province"}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      {pep.currCountry &&
                        !isBhutanCountry(pep.currCountry, countryOptions) ? (
                        <Input
                          placeholder="Enter Province"
                          value={pep.currGewog || ""}
                          onChange={(e) =>
                            handleRelatedPepChange(
                              index,
                              "currGewog",
                              e.target.value,
                            )
                          }
                          className={getFieldStyle(
                            `relatedPeps.${index}.currGewog`,
                          )}
                        />
                      ) : (
                        <Select
                          value={pep.currGewog || ""}
                          onValueChange={(value) =>
                            handleRelatedPepChange(index, "currGewog", value)
                          }
                          disabled={
                            !isBhutanCountry(pep.currCountry, countryOptions)
                          }
                        >
                          <SelectTrigger
                            className={getFieldStyle(
                              `relatedPeps.${index}.currGewog`,
                            )}
                          >
                            <SelectValue placeholder="[Select]" />
                          </SelectTrigger>
                          <SelectContent sideOffset={4}>
                            {relatedPepCurrGewogMap[index]?.length > 0 ? (
                              relatedPepCurrGewogMap[index].map((opt, i) => (
                                <SelectItem
                                  key={i}
                                  value={String(
                                    opt.gewog_pk_code || opt.id || i,
                                  )}
                                >
                                  {opt.gewog || opt.name || "Unknown"}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="loading" disabled>
                                {pep.currDzongkhag
                                  ? "Loading..."
                                  : "Select Dzongkhag first"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      {errors[`relatedPeps.${index}.currGewog`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`relatedPeps.${index}.currGewog`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        {isBhutanCountry(pep.currCountry, countryOptions)
                          ? "Village/Street"
                          : "Street"}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Location"
                        value={pep.currVillage || ""}
                        onChange={(e) =>
                          handleRelatedPepChange(
                            index,
                            "currVillage",
                            e.target.value,
                          )
                        }
                        className={getFieldStyle(
                          `relatedPeps.${index}.currVillage`,
                        )}
                        disabled={!pep.currCountry}
                      />
                      {errors[`relatedPeps.${index}.currVillage`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`relatedPeps.${index}.currVillage`]}
                        </p>
                      )}
                    </div>

                    {isBhutanCountry(pep.currCountry, countryOptions) && (
                      <div className="space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-sm">
                          Flat No. <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Enter Flat No"
                          value={pep.currFlat || ""}
                          onChange={(e) =>
                            handleRelatedPepChange(
                              index,
                              "currFlat",
                              e.target.value,
                            )
                          }
                          className={getFieldStyle(
                            `relatedPeps.${index}.currFlat`,
                          )}
                        />
                        {errors[`relatedPeps.${index}.currFlat`] && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors[`relatedPeps.${index}.currFlat`]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {pep.currCountry &&
                    !isBhutanCountry(pep.currCountry, countryOptions) && (
                      <div className="space-y-2.5 mb-8">
                        <Label className="text-gray-800 font-semibold text-sm">
                          Upload Address Proof Document{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id={`pepCurrProof-${index}`}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              handleRelatedPepFileChange(
                                index,
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
                                .getElementById(`pepCurrProof-${index}`)
                                ?.click()
                            }
                          >
                            Choose File
                          </Button>
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {pep.currAddressProof || "No file chosen"}
                          </span>
                        </div>
                        {errors[`relatedPeps.${index}.currAddressProof`] && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors[`relatedPeps.${index}.currAddressProof`]}
                          </p>
                        )}
                      </div>
                    )}

                  <h5 className="text-sm font-bold text-gray-700 mb-4">
                    Contact Information
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="Enter Email"
                        value={pep.currEmail || ""}
                        onChange={(e) =>
                          handleRelatedPepChange(
                            index,
                            "currEmail",
                            e.target.value,
                          )
                        }
                        className={getFieldStyle(
                          `relatedPeps.${index}.currEmail`,
                        )}
                      />
                      {errors[`relatedPeps.${index}.currEmail`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`relatedPeps.${index}.currEmail`]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Contact No. <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Contact No"
                        value={pep.currContact || ""}
                        onChange={(e) =>
                          handleRelatedPepChange(
                            index,
                            "currContact",
                            e.target.value,
                          )
                        }
                        className={getFieldStyle(
                          `relatedPeps.${index}.currContact`,
                        )}
                      />
                      {errors[`relatedPeps.${index}.currContact`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`relatedPeps.${index}.currContact`]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Alternate Contact No.
                      </Label>
                      <Input
                        placeholder="Enter Alternate Contact"
                        value={pep.currAlternateContact || ""}
                        onChange={(e) =>
                          handleRelatedPepChange(
                            index,
                            "currAlternateContact",
                            e.target.value,
                          )
                        }
                        className="h-10 sm:h-12 w-full text-sm sm:text-base border border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                      />
                    </div>
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

      {/* Removed Related to BIL section */}

      {/* 5. Employment Status (renumbered) */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
          Employment Status
        </h2>
        <div className="space-y-4">
          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
            Employment Status <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            className="flex flex-col sm:flex-row gap-3 sm:gap-6 md:gap-8 border rounded-md p-3 border-transparent"
            value={data.employmentStatus}
            onValueChange={(value) => {
              setData({ ...data, employmentStatus: value });
              if (!isRequired(value))
                setErrors((prev) => {
                  const upd = { ...prev };
                  delete upd.employmentStatus;
                  return upd;
                });
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="employed" id="employed" />
              <Label
                htmlFor="employed"
                className="font-normal cursor-pointer text-sm"
              >
                Employed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unemployed" id="unemployed" />
              <Label
                htmlFor="unemployed"
                className="font-normal cursor-pointer text-sm"
              >
                Unemployed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="self-employed" id="self-employed" />
              <Label
                htmlFor="self-employed"
                className="font-normal cursor-pointer text-sm"
              >
                Self-employed
              </Label>
            </div>
          </RadioGroup>
          {errors.employmentStatus && (
            <p className="text-xs text-red-500 mt-1">
              {errors.employmentStatus}
            </p>
          )}
        </div>
      </div>

      {/* 6. Employment Details (conditional) */}
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
                value={data.employeeId || ""}
                onChange={(e) => {
                  setData({ ...data, employeeId: e.target.value });
                  if (e.target.value.trim() !== "")
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.employeeId;
                      return upd;
                    });
                }}
                className={getFieldStyle("employeeId")}
              />
              {errors.employeeId && (
                <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Occupation <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.occupation}
                onValueChange={(value) => {
                  setData({ ...data, occupation: value });
                  if (value)
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.occupation;
                      return upd;
                    });
                }}
              >
                <SelectTrigger className={getFieldStyle("occupation")}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {occupationOptions.length > 0 ? (
                    occupationOptions.map((option, index) => {
                      const value = String(
                        option.occ_pk_code ||
                        option.occupation_pk_code ||
                        option.id ||
                        index,
                      );
                      const label =
                        option.occ_name ||
                        option.occupation ||
                        option.name ||
                        "Unknown";
                      return (
                        <SelectItem key={value} value={value}>
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
              {errors.occupation && (
                <p className="text-xs text-red-500 mt-1">{errors.occupation}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Type of Employer <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.employerType}
                onValueChange={(value) => {
                  setData({ ...data, employerType: value });
                  if (value)
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.employerType;
                      return upd;
                    });
                }}
              >
                <SelectTrigger className={getFieldStyle("employerType")}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
              {errors.employerType && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.employerType}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Designation <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.designation}
                onValueChange={(value) => {
                  setData({ ...data, designation: value });
                  if (value)
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.designation;
                      return upd;
                    });
                }}
              >
                <SelectTrigger className={getFieldStyle("designation")}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="officer">Officer</SelectItem>
                  <SelectItem value="assistant">Assistant</SelectItem>
                </SelectContent>
              </Select>
              {errors.designation && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.designation}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Grade <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.grade}
                onValueChange={(value) => {
                  setData({ ...data, grade: value });
                  if (value)
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.grade;
                      return upd;
                    });
                }}
              >
                <SelectTrigger className={getFieldStyle("grade")}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="1">Grade 1</SelectItem>
                  <SelectItem value="2">Grade 2</SelectItem>
                  <SelectItem value="3">Grade 3</SelectItem>
                  <SelectItem value="4">Grade 4</SelectItem>
                  <SelectItem value="5">Grade 5</SelectItem>
                  <SelectItem value="6">Grade 6</SelectItem>
                  <SelectItem value="7">Grade 7</SelectItem>
                  <SelectItem value="8">Grade 8</SelectItem>
                  <SelectItem value="9">Grade 9</SelectItem>
                  <SelectItem value="10">Grade 10</SelectItem>
                  <SelectItem value="11">Grade 11</SelectItem>
                  <SelectItem value="p1">P1</SelectItem>
                  <SelectItem value="p2">P2</SelectItem>
                  <SelectItem value="p3">P3</SelectItem>
                </SelectContent>
              </Select>
              {errors.grade && (
                <p className="text-xs text-red-500 mt-1">{errors.grade}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Organization Name <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.organizationName}
                onValueChange={(value) => {
                  setData({ ...data, organizationName: value });
                  if (value)
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.organizationName;
                      return upd;
                    });
                }}
              >
                <SelectTrigger className={getFieldStyle("organizationName")}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {organizationOptions.length > 0 ? (
                    organizationOptions.map((option, index) => {
                      const value = String(
                        option.lgal_constitution_pk_code ||
                        option.legal_const_pk_code ||
                        option.id ||
                        index,
                      );
                      const label =
                        option.lgal_constitution ||
                        option.legal_const_name ||
                        option.name ||
                        "Unknown";
                      return (
                        <SelectItem key={value} value={value}>
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
              {errors.organizationName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.organizationName}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Organization Location <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter Full Name"
                value={data.orgLocation || ""}
                onChange={(e) => {
                  setData({ ...data, orgLocation: e.target.value });
                  if (e.target.value.trim() !== "")
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.orgLocation;
                      return upd;
                    });
                }}
                className={getFieldStyle("orgLocation")}
              />
              {errors.orgLocation && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.orgLocation}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Service Joining Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                max={today}
                value={data.joiningDate || ""}
                onChange={(e) => {
                  setData({ ...data, joiningDate: e.target.value });
                  if (e.target.value)
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.joiningDate;
                      return upd;
                    });
                }}
                className={getFieldStyle("joiningDate")}
              />
              {errors.joiningDate && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.joiningDate}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Nature of Service <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.serviceNature}
                onValueChange={(value) => {
                  setData({ ...data, serviceNature: value });
                  if (value)
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.serviceNature;
                      return upd;
                    });
                }}
              >
                <SelectTrigger className={getFieldStyle("serviceNature")}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
              {errors.serviceNature && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.serviceNature}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Gross Annual Salary Income{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                placeholder="Enter Annual Salary"
                className={getFieldStyle("annualSalary")}
                value={data.annualSalary || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setData({ ...data, annualSalary: value });
                  if (value.trim() !== "" && !isNaN(Number(value)))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.annualSalary;
                      return upd;
                    });
                }}
              />
              {errors.annualSalary && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.annualSalary}
                </p>
              )}
            </div>
          </div>

          {data.serviceNature === "contract" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2.5">
                <Label className="text-gray-800 font-semibold text-sm">
                  Contract End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  min={today}
                  value={data.contractEndDate || ""}
                  onChange={(e) => {
                    setData({ ...data, contractEndDate: e.target.value });
                    if (e.target.value)
                      setErrors((prev) => {
                        const upd = { ...prev };
                        delete upd.contractEndDate;
                        return upd;
                      });
                  }}
                  className={getFieldStyle("contractEndDate")}
                />
                {errors.contractEndDate && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.contractEndDate}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. Spouse Details Section (moved here) */}
      {isMarried && (
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
            Spouse Personal Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                Spouse Identification Type{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={
                  findPkCodeByLabel(
                    data.spouseIdentificationType,
                    filteredIdentificationOptions,
                    ["identity_type", "identification_type", "name", "label"],
                  ) || data.spouseIdentificationType
                }
                onValueChange={(value) => {
                  setData({ ...data, spouseIdentificationType: value });
                  if (!isRequired(value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.spouseIdentificationType;
                      return upd;
                    });
                }}
              >
                <SelectTrigger
                  className={getFieldStyle("spouseIdentificationType")}
                >
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {filteredIdentificationOptions.length > 0 ? (
                    filteredIdentificationOptions.map((option, index) => {
                      const value = String(
                        option.identity_type_pk_code ||
                        option.identification_type_pk_code ||
                        option.id ||
                        index,
                      );
                      const label =
                        option.identity_type ||
                        option.identification_type ||
                        option.name ||
                        "Unknown";
                      return (
                        <SelectItem key={value} value={value}>
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
              {errors.spouseIdentificationType && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.spouseIdentificationType}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                Spouse ID No. <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter Spouse CID/ID"
                value={data.spouseIdentificationNo || ""}
                onChange={(e) => {
                  setData({
                    ...data,
                    spouseIdentificationNo: e.target.value,
                  });
                  if (!isRequired(e.target.value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.spouseIdentificationNo;
                      return upd;
                    });
                }}
                className={getFieldStyle("spouseIdentificationNo")}
              />
              {errors.spouseIdentificationNo && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.spouseIdentificationNo}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                Spouse Salutation <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.spouseSalutation}
                onValueChange={(value) => {
                  setData({ ...data, spouseSalutation: value });
                  if (!isRequired(value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.spouseSalutation;
                      return upd;
                    });
                }}
              >
                <SelectTrigger className={getFieldStyle("spouseSalutation")}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="mr">Mr.</SelectItem>
                  <SelectItem value="mrs">Mrs.</SelectItem>
                  <SelectItem value="ms">Ms.</SelectItem>
                  <SelectItem value="dr">Dr.</SelectItem>
                </SelectContent>
              </Select>
              {errors.spouseSalutation && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.spouseSalutation}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                Spouse Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter Spouse Full Name"
                value={data.spouseName || ""}
                onChange={(e) => {
                  let value = e.target.value;
                  if (!/^[A-Za-z\s]*$/.test(value)) return;
                  value = capitalizeWords(value);
                  setData({ ...data, spouseName: value });
                  if (!isRequired(value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.spouseName;
                      return upd;
                    });
                }}
                className={getFieldStyle("spouseName")}
              />
              {errors.spouseName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.spouseName}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                Spouse Nationality <span className="text-red-500">*</span>
              </Label>
              <Select
                value={findPkCodeByLabel(
                  data.spouseNationality,
                  nationalityOptions, ["nationality", "name", "label"],
                )}
                onValueChange={(value) => {
                  setData({ ...data, spouseNationality: value });
                  if (!isRequired(value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.spouseNationality;
                      return upd;
                    });
                }}
              >
                <SelectTrigger className={getFieldStyle("spouseNationality")}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {nationalityOptions.length > 0 ? (
                    nationalityOptions.map((option, index) => {
                      const value = String(
                        option.nationality_pk_code ||
                        option.id ||
                        option.code ||
                        index,
                      );
                      const label =
                        option.nationality ||
                        option.name ||
                        option.label ||
                        "Unknown";
                      return (
                        <SelectItem key={value} value={value}>
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
              {errors.spouseNationality && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.spouseNationality}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                Spouse Gender <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.spouseGender}
                onValueChange={(value) => {
                  setData({ ...data, spouseGender: value });
                  if (!isRequired(value))
                    setErrors((prev) => {
                      const upd = { ...prev };
                      delete upd.spouseGender;
                      return upd;
                    });
                }}
              >
                <SelectTrigger className={getFieldStyle("spouseGender")}>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.spouseGender && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.spouseGender}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                Spouse ID Issue Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                max={today}
                value={data.spouseIdentificationIssueDate || ""}
                onChange={(e) => {
                  setData({
                    ...data,
                    spouseIdentificationIssueDate: e.target.value,
                  });
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.spouseIdentificationIssueDate;
                    return upd;
                  });
                }}
                className={getFieldStyle("spouseIdentificationIssueDate")}
              />
              {errors.spouseIdentificationIssueDate && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.spouseIdentificationIssueDate}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                Spouse ID Expiry Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                min={today}
                value={data.spouseIdentificationExpiryDate || ""}
                onChange={(e) => {
                  setData({
                    ...data,
                    spouseIdentificationExpiryDate: e.target.value,
                  });
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.spouseIdentificationExpiryDate;
                    return upd;
                  });
                }}
                className={getFieldStyle("spouseIdentificationExpiryDate")}
              />
              {errors.spouseIdentificationExpiryDate && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.spouseIdentificationExpiryDate}
                </p>
              )}
            </div>

            {/* Spouse Tax Identifier Type - Not required, shows only PIT */}
            <div className="space-y-1.5 sm:space-y-2.5">
              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                Spouse Tax Identifier Type
              </Label>
              <Select
                value={data.spouseTaxIdentifierType}
                onValueChange={(value) => {
                  setData({ ...data, spouseTaxIdentifierType: value });
                }}
              >
                <SelectTrigger
                  className={getFieldStyle("spouseTaxIdentifierType")}
                >
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
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
                value={data.spouseTpn || ""}
                onChange={(e) => {
                  setData({ ...data, spouseTpn: e.target.value });
                }}
                className="h-10 sm:h-12 w-full text-sm sm:text-base border border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                Spouse Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                max={maxDobDate}
                value={data.spouseDateOfBirth || ""}
                onChange={(e) => {
                  setData({ ...data, spouseDateOfBirth: e.target.value });
                  setErrors((prev) => {
                    const upd = { ...prev };
                    delete upd.spouseDateOfBirth;
                    return upd;
                  });
                }}
                className={getFieldStyle("spouseDateOfBirth")}
              />
              {errors.spouseDateOfBirth && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.spouseDateOfBirth}
                </p>
              )}
            </div>

            {isNatBhutanese(data.spouseNationality) && (
              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Household Number{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter Household Number"
                  value={data.spouseHouseholdNumber || ""}
                  onChange={(e) => {
                    setData({
                      ...data,
                      spouseHouseholdNumber: e.target.value,
                    });
                    if (!isRequired(e.target.value))
                      setErrors((prev) => {
                        const upd = { ...prev };
                        delete upd.spouseHouseholdNumber;
                        return upd;
                      });
                  }}
                  className={getFieldStyle("spouseHouseholdNumber")}
                />
                {errors.spouseHouseholdNumber && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.spouseHouseholdNumber}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Document Upload for Spouse Identification Proof */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t mt-4">
            <div className="space-y-2.5">
              <Label className="text-gray-800 font-semibold text-sm">
                Upload Spouse Identification Proof <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="spouseIdentificationProof"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    handleFileChange("spouseIdentificationProof", e.target.files?.[0] || null)
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-28 bg-transparent"
                  onClick={() =>
                    document.getElementById("spouseIdentificationProof")?.click()
                  }
                >
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {data.spouseIdentificationProof || "No file chosen"}
                </span>
              </div>
              {errors.spouseIdentificationProof && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.spouseIdentificationProof}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Allowed: PDF, JPG, PNG (Max 5MB)
              </p>
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
                  Spouse Country <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={data.spousePermCountry || ""}
                  onValueChange={(value) => {
                    setData({ ...data, spousePermCountry: value });
                    if (!isRequired(value))
                      setErrors((prev) => {
                        const upd = { ...prev };
                        delete upd.spousePermCountry;
                        return upd;
                      });
                  }}
                >
                  <SelectTrigger
                    className={getFieldStyle("spousePermCountry")}
                  >
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {countryOptions.length > 0 ? (
                      countryOptions.map((option, index) => {
                        const value = String(
                          option.country_pk_code ||
                          option.id ||
                          option.code ||
                          index,
                        );
                        const label =
                          option.country ||
                          option.name ||
                          option.label ||
                          "Unknown";
                        return (
                          <SelectItem key={value} value={value}>
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
                {errors.spousePermCountry && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.spousePermCountry}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  {isBhutanCountry(data.spousePermCountry, countryOptions)
                    ? "Spouse Dzongkhag"
                    : "Spouse State"}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                {data.spousePermCountry &&
                  !isBhutanCountry(data.spousePermCountry, countryOptions) ? (
                  <Input
                    placeholder="Enter State"
                    value={data.spousePermDzongkhag || ""}
                    onChange={(e) => {
                      setData({
                        ...data,
                        spousePermDzongkhag: e.target.value,
                      });
                      if (!isRequired(e.target.value))
                        setErrors((prev) => {
                          const upd = { ...prev };
                          delete upd.spousePermDzongkhag;
                          return upd;
                        });
                    }}
                    className={getFieldStyle("spousePermDzongkhag")}
                  />
                ) : (
                  <Select
                    value={data.spousePermDzongkhag || ""}
                    onValueChange={(value) => {
                      setData({ ...data, spousePermDzongkhag: value });
                      if (!isRequired(value))
                        setErrors((prev) => {
                          const upd = { ...prev };
                          delete upd.spousePermDzongkhag;
                          return upd;
                        });
                    }}
                    disabled={
                      !isBhutanCountry(data.spousePermCountry, countryOptions)
                    }
                  >
                    <SelectTrigger
                      className={getFieldStyle("spousePermDzongkhag")}
                    >
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {dzongkhagOptions.length > 0 ? (
                        dzongkhagOptions.map((option, index) => {
                          const value = String(
                            option.dzongkhag_pk_code ||
                            option.id ||
                            option.code ||
                            index,
                          );
                          const label =
                            option.dzongkhag ||
                            option.name ||
                            option.label ||
                            "Unknown";
                          return (
                            <SelectItem key={value} value={value}>
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
                {errors.spousePermDzongkhag && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.spousePermDzongkhag}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  {isBhutanCountry(data.spousePermCountry, countryOptions)
                    ? "Spouse Gewog"
                    : "Spouse Province"}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                {data.spousePermCountry &&
                  !isBhutanCountry(data.spousePermCountry, countryOptions) ? (
                  <Input
                    placeholder="Enter Province"
                    value={data.spousePermGewog || ""}
                    onChange={(e) => {
                      setData({ ...data, spousePermGewog: e.target.value });
                      if (!isRequired(e.target.value))
                        setErrors((prev) => {
                          const upd = { ...prev };
                          delete upd.spousePermGewog;
                          return upd;
                        });
                    }}
                    className={getFieldStyle("spousePermGewog")}
                  />
                ) : (
                  <Select
                    value={
                      isBhutanCountry(data.spousePermCountry, countryOptions)
                        ? data.spousePermGewog
                        : ""
                    }
                    onValueChange={(value) => {
                      setData({ ...data, spousePermGewog: value });
                      if (!isRequired(value))
                        setErrors((prev) => {
                          const upd = { ...prev };
                          delete upd.spousePermGewog;
                          return upd;
                        });
                    }}
                    disabled={
                      !isBhutanCountry(data.spousePermCountry, countryOptions)
                    }
                  >
                    <SelectTrigger
                      className={getFieldStyle("spousePermGewog")}
                    >
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {spousePermGewogOptions.length > 0 ? (
                        spousePermGewogOptions.map((option, index) => {
                          const value = String(
                            option.gewog_pk_code ||
                            option.id ||
                            option.code ||
                            index,
                          );
                          const label =
                            option.gewog ||
                            option.name ||
                            option.label ||
                            "Unknown";
                          return (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="loading" disabled>
                          {data.spousePermDzongkhag
                            ? "Loading..."
                            : "Select Dzongkhag first"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
                {errors.spousePermGewog && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.spousePermGewog}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  {isBhutanCountry(data.spousePermCountry, countryOptions)
                    ? "Spouse Village/Street"
                    : "Spouse Street"}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder={
                    isBhutanCountry(data.spousePermCountry, countryOptions)
                      ? "Enter Village/Street"
                      : "Enter Street"
                  }
                  value={data.spousePermVillage || ""}
                  onChange={(e) => {
                    setData({ ...data, spousePermVillage: e.target.value });
                    if (!isRequired(e.target.value))
                      setErrors((prev) => {
                        const upd = { ...prev };
                        delete upd.spousePermVillage;
                        return upd;
                      });
                  }}
                  className={getFieldStyle("spousePermVillage")}
                  disabled={!data.spousePermCountry}
                />
                {errors.spousePermVillage && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.spousePermVillage}
                  </p>
                )}
              </div>

              {/* Conditional grid - show Thram and House only for Bhutan */}
              {isBhutanCountry(data.spousePermCountry, countryOptions) && (
                <>
                  <div className="space-y-1.5 sm:space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                      Spouse Thram No. <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter Thram No"
                      value={data.spousePermThram || ""}
                      onChange={(e) => {
                        setData({ ...data, spousePermThram: e.target.value });
                        if (!isRequired(e.target.value))
                          setErrors((prev) => {
                            const upd = { ...prev };
                            delete upd.spousePermThram;
                            return upd;
                          });
                      }}
                      className={getFieldStyle("spousePermThram")}
                    />
                    {errors.spousePermThram && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.spousePermThram}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2.5">
                    <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                      Spouse House No. <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter House No"
                      value={data.spousePermHouse || ""}
                      onChange={(e) => {
                        setData({ ...data, spousePermHouse: e.target.value });
                        if (!isRequired(e.target.value))
                          setErrors((prev) => {
                            const upd = { ...prev };
                            delete upd.spousePermHouse;
                            return upd;
                          });
                      }}
                      className={getFieldStyle("spousePermHouse")}
                    />
                    {errors.spousePermHouse && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.spousePermHouse}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Document Upload for Non-Bhutan Countries */}
            {data.spousePermCountry &&
              !isBhutanCountry(data.spousePermCountry, countryOptions) && (
                <div className="space-y-2.5 mt-4">
                  <Label className="text-gray-800 font-semibold text-sm">
                    Upload Spouse Address Proof Document{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="spousePermAddressProof"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleFileChange(
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
                          .getElementById("spousePermAddressProof")
                          ?.click()
                      }
                    >
                      Choose File
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {data.spousePermAddressProof || "No file chosen"}
                    </span>
                  </div>
                  {errors.spousePermAddressProof && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.spousePermAddressProof}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Allowed: PDF, JPG, PNG (Max 5MB)
                  </p>
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
                  value={data.spouseEmail || ""}
                  onChange={(e) => {
                    setData({ ...data, spouseEmail: e.target.value });
                    if (
                      !isRequired(e.target.value) &&
                      isEmail(e.target.value)
                    )
                      setErrors((prev) => {
                        const upd = { ...prev };
                        delete upd.spouseEmail;
                        return upd;
                      });
                  }}
                  className={getFieldStyle("spouseEmail")}
                />
                {errors.spouseEmail && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.spouseEmail}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Contact No. <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter Contact Number"
                  value={data.spouseContact || ""}
                  onChange={(e) => {
                    setData({ ...data, spouseContact: e.target.value });
                    if (!isRequired(e.target.value))
                      setErrors((prev) => {
                        const upd = { ...prev };
                        delete upd.spouseContact;
                        return upd;
                      });
                  }}
                  className={getFieldStyle("spouseContact")}
                />
                {errors.spouseContact && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.spouseContact}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Alternate Contact No.
                </Label>
                <Input
                  placeholder="Enter Alternate Contact"
                  value={data.spouseAlternateContact || ""}
                  onChange={(e) => {
                    setData({
                      ...data,
                      spouseAlternateContact: e.target.value,
                    });
                  }}
                  className="h-10 sm:h-12 w-full text-sm sm:text-base border border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 md:gap-6 pt-3 sm:pt-4">
        <Button
          type="button"
          onClick={onBack}
          variant="secondary"
          size="lg"
          className="w-full sm:w-auto sm:min-w-32 md:min-w-40 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto sm:min-w-32 md:min-w-40 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-[#003DA5] hover:bg-[#002D7A]"
        >
          Next
        </Button>
      </div>

      {/* Co-Borrower Confirmation Dialog */}
      <AlertDialog
        open={showCoBorrowerDialog}
        onOpenChange={setShowCoBorrowerDialog}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-[#003DA5]">
              Co-Borrower Information
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600 pt-2">
              Do you have a co-borrower for this loan application?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel
              onClick={() => handleCoBorrowerResponse(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
            >
              No, Skip to Security Details
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleCoBorrowerResponse(true)}
              className="bg-[#003DA5] hover:bg-[#002D7A] text-white font-semibold"
            >
              Yes, Add Co-Borrower
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}