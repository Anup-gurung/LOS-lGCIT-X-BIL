"use client";

import type React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
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

// Import mapping utility and the Popup component
import {
  mapCustomerDataToForm,
  mapCoBorrowerData,
} from "@/lib/mapCustomerData";
import DocumentPopup from "@/components/BILSearchStatus";
import {
  fetchMaritalStatus,
  fetchNationality,
  fetchBanks,
  fetchIdentificationType,
  fetchCountry,
  fetchDzongkhag,
  fetchGewogsByDzongkhag,
  fetchOccupations,
  fetchLegalConstitution,
  fetchPepCategory,
  fetchPepSubCategoryByCategory,
  fetchTaxIdentifierType,
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
    if (isNaN(date.getTime())) return dateString;
    return date.toISOString().split("T")[0];
  } catch (e) {
    return "";
  }
};

// ================== Helpers: getOptionPkCode & getOptionLabel ==================
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

// ================== Helper: resolveLabelByValue ==================
// Given a value that may be a PK code OR a label, returns the human-readable label
// by looking it up in the provided options array.
const resolveLabelByValue = (value: string, options: any[]): string => {
  if (!value || !options || options.length === 0) return value || "";

  // Case 1: value is a PK code — find the matching option and return its label
  const byCode = options.find((o) => getOptionPkCode(o) === String(value));
  if (byCode) return getOptionLabel(byCode);

  // Case 2: value is already a label — find the matching option and return its label
  const valLower = String(value).toLowerCase().trim();
  const byLabel = options.find((o) => {
    const lbl = getOptionLabel(o).toLowerCase().trim();
    return lbl === valLower || lbl.includes(valLower) || valLower.includes(lbl);
  });
  if (byLabel) return getOptionLabel(byLabel);

  // Fallback: return value as-is
  return value;
};

// ================== Helper: findPkCodeByLabel ==================
const findPkCodeByLabel = (
  label: string,
  options: any[],
  labelFields?: string[],
): string => {
  if (!label || !options || !Array.isArray(options)) return label;

  const trimmedLabel = String(label).trim().toLowerCase();
  const strippedLabel = trimmedLabel.replace(/\s+/g, "");
  const inputWords = trimmedLabel.split(/\s+/).filter((w) => w.length > 0);

  // 0. Check if it's already a valid PK code string matched exactly
  for (const option of options) {
    const pkCode = getOptionPkCode(option);
    if (String(pkCode).toLowerCase() === trimmedLabel) {
      return pkCode;
    }
  }

  const checkMatch = (option: any, optionValue: string) => {
    if (!optionValue) return false;
    const trimmedOption = String(optionValue).trim().toLowerCase();
    const strippedOption = trimmedOption.replace(/\s+/g, "");

    // 1. Exact match (stripped spaces)
    if (strippedOption === strippedLabel) return true;

    // 2. Exact match (trimmed)
    if (trimmedOption === trimmedLabel) return true;

    // 3. All words match
    const optionWords = trimmedOption.split(/\s+/).filter((w) => w.length > 0);
    if (inputWords.length > 0 && optionWords.length > 0) {
      const allWordsMatch = inputWords.every((word) =>
        optionWords.some(
          (optWord) => optWord === word || optWord.includes(word) || word.includes(optWord),
        ),
      );
      if (allWordsMatch) return true;
    }
    return false;
  };

  // 1. Precise Match Look-up Loop
  for (const option of options) {
    let matched = false;
    if (labelFields) {
      for (const field of labelFields) {
        if (checkMatch(option, option[field])) {
          matched = true;
          break;
        }
      }
    }
    // Final generic property fallback verification
    if (!matched && checkMatch(option, getOptionLabel(option))) {
      matched = true;
    }

    if (matched) return getOptionPkCode(option);
  }

  // 2. Fuzzy Match (includes) for longer strings as worst-case scenario check
  if (trimmedLabel.length >= 4) {
    for (const option of options) {
      const possibleLabels = new Set<string>();
      if (labelFields) {
        for (const field of labelFields) {
          if (option[field]) possibleLabels.add(String(option[field]));
        }
      }
      possibleLabels.add(getOptionLabel(option));

      for (const optionValue of possibleLabels) {
        const optionLabelStr = String(optionValue).trim().toLowerCase();
        if (
          optionLabelStr.includes(trimmedLabel) ||
          trimmedLabel.includes(optionLabelStr)
        ) {
          return getOptionPkCode(option);
        }
      }
    }
  }

  return label;
};

// ================== Helper: Normalize Data Payload ==================
const normalizeData = (sourceData: any) => {
  if (!sourceData) return {};
  let d = { ...sourceData };

  // 1. Personal Info Mappings
  if (!d.identificationNo && d.idNumber) d.identificationNo = d.idNumber;
  if (!d.identificationType && d.idType) d.identificationType = d.idType;
  if (!d.identificationIssueDate && d.identityIssuedDate) d.identificationIssueDate = d.identityIssuedDate;
  if (!d.identificationExpiryDate && d.identityExpiryDate) d.identificationExpiryDate = d.identityExpiryDate;
  if (!d.name && d.fullName) d.name = d.fullName;
  if (!d.name && d.applicantName) d.name = d.applicantName;
  if (d.gender) d.gender = String(d.gender).toLowerCase();
  if (d.salutation) d.salutation = String(d.salutation).toLowerCase().replace(/\./g, '');

  // Documents mapped from API response strings
  if (!d.idProofDocument && d.identityProofName) d.idProofDocument = d.identityProofName;
  if (!d.passportPhoto && d.passportPhotoName) d.passportPhoto = d.passportPhotoName;
  if (!d.familyTree && d.familyTreeName) d.familyTree = d.familyTreeName;

  // 2. Contact & Address Mappings
  if (!d.currContact && (d.contactNo || d.phone)) d.currContact = d.contactNo || d.phone;
  if (!d.currAlternateContact && (d.alternatePhone || d.alternateContactNo)) d.currAlternateContact = d.alternatePhone || d.alternateContactNo;
  if (!d.currEmail && (d.emailId || d.email)) d.currEmail = d.emailId || d.email;

  if (!d.permHouse && d.houseNo) d.permHouse = d.houseNo;
  if (!d.currFlat && (d.currBuildingNo || d.currentBuildingNo || d.currHouse || d.houseNo)) d.currFlat = d.currBuildingNo || d.currentBuildingNo || d.currHouse || d.houseNo;
  if (!d.currVillage && d.currStreet) d.currVillage = d.currStreet;
  if (!d.permVillage && d.permStreet) d.permVillage = d.permStreet;
  if (!d.permThram && d.thramNo) d.permThram = d.thramNo;

  // 3. Bank Account Mapping
  if (!d.bankAccount && (d.bankAccountNo || d.accountNumber)) d.bankAccount = d.bankAccountNo || d.accountNumber;

  // 4. Employment Status Inference
  if (!d.employmentStatus && (d.employeeId || d.occupation || d.employerName || d.organizationName || d.annualSalary || d.annualIncome)) {
    d.employmentStatus = "employed";
  }

  if (!d.annualSalary && d.annualIncome) d.annualSalary = d.annualIncome;

  // 5. Employment Details Refinements
  if (d.employerType || d.organizationType) {
    const typeStr = String(d.employerType || d.organizationType || "").toLowerCase();
    if (typeStr.includes("gov") || typeStr.includes("civil") || typeStr.includes("public") || typeStr.includes("armed") || typeStr.includes("ministry") || typeStr.includes("rgob") || typeStr.includes("authority") || typeStr.includes("commis") || typeStr.includes("judic") || typeStr.includes("parl") || typeStr.includes("force") || typeStr.includes("police") || typeStr.includes("royal") || typeStr.includes("council")) {
      d.employerType = "government";
    } else if (typeStr.includes("priv") || typeStr.includes("pvt") || typeStr.includes("enterprise") || typeStr.includes("shop") || typeStr.includes("business") || typeStr.includes("self") || typeStr.includes("retail") || typeStr.includes("trad")) {
      d.employerType = "private";
    } else if (typeStr.includes("corp") || typeStr.includes("institution") || typeStr.includes("bank") || typeStr.includes("limited") || typeStr.includes("ltd") || typeStr.includes("dhi") || typeStr.includes("board") || typeStr.includes("agency") || typeStr.includes("foundation") || typeStr.includes("ngo") || typeStr.includes("cso") || typeStr.includes("school") || typeStr.includes("hospital") || typeStr.includes("university") || typeStr.includes("college")) {
      d.employerType = "corporate";
    } else {
      d.employerType = ""; // Prevent unmappable inputs from bypassing constraints
    }
  }

  if (!d.organizationName && d.employerName) d.organizationName = d.employerName;
  if (!d.orgLocation && (d.employerLocation || d.organizationLocation)) d.orgLocation = d.employerLocation || d.organizationLocation;

  if (!d.serviceNature && d.natureOfService) d.serviceNature = d.natureOfService;
  if (d.serviceNature) {
    const natStr = String(d.serviceNature).toLowerCase();
    if (natStr.includes("perm") || natStr.includes("regula")) d.serviceNature = "permanent";
    else if (natStr.includes("contract")) d.serviceNature = "contract";
    else if (natStr.includes("temp") || natStr.includes("casual") || natStr.includes("probation")) d.serviceNature = "temporary";
    else d.serviceNature = "";
  }

  if (d.grade) {
    let resolvedGrade = String(d.grade).toLowerCase();
    if (resolvedGrade.includes("p1") || resolvedGrade.includes("p-1")) d.grade = "p1";
    else if (resolvedGrade.includes("p2") || resolvedGrade.includes("p-2")) d.grade = "p2";
    else if (resolvedGrade.includes("p3") || resolvedGrade.includes("p-3")) d.grade = "p3";
    else {
      const match = resolvedGrade.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num >= 1 && num <= 11) d.grade = String(num);
        else d.grade = "";
      } else {
        d.grade = "";
      }
    }
  }

  if (d.designation) {
    const desig = String(d.designation).toLowerCase();
    if (desig.includes("manag") || desig.includes("mgr") || desig.includes("dir") || desig.includes("head") || desig.includes("chief")) {
      d.designation = "manager";
    } else if (desig.includes("officer") || desig.includes("clerk") || desig.includes("exec") || desig.includes("professional") || desig.includes("analyst")) {
      d.designation = "officer";
    } else if (desig.includes("assist") || desig.includes("helper") || desig.includes("support")) {
      d.designation = "assistant";
    } else {
      d.designation = "";
    }
  }

  // 6. Address field consistency
  if (!d.permCountry && d.permanentCountry) d.permCountry = d.permanentCountry;
  if (!d.permDzongkhag && d.permanentDzongkhag) d.permDzongkhag = d.permanentDzongkhag;
  if (!d.permGewog && d.permanentGewog) d.permGewog = d.permanentGewog;
  if (!d.permVillage && d.permanentVillage) d.permVillage = d.permanentVillage;
  if (!d.permThram && d.permanentThram) d.permThram = d.permanentThram;
  if (!d.permHouse && d.permanentHouse) d.permHouse = d.permanentHouse;

  if (!d.currCountry && d.currentCountry) d.currCountry = d.currentCountry;
  if (!d.currDzongkhag && d.currentDzongkhag) d.currDzongkhag = d.currentDzongkhag;
  if (!d.currGewog && d.currentGewog) d.currGewog = d.currentGewog;
  if (!d.currVillage && d.currentVillage) d.currVillage = d.currentVillage;
  if (!d.currFlat && d.currentFlat) d.currFlat = d.currentFlat;
  if (!d.currEmail && d.currentEmail) d.currEmail = d.currentEmail;
  if (!d.currContact && d.currentContact) d.currContact = d.currentContact;
  if (!d.currAlternateContact && d.currentAlternateContact) d.currAlternateContact = d.currentAlternateContact;

  if (!d.pepPerson && d.pepDeclaration) d.pepPerson = String(d.pepDeclaration).toLowerCase() === 'no' ? 'no' : 'yes';

  return d;
};

// ================== Helper: Map Related PEP Data ==================
const mapRelatedPep = (
  pep: any,
  options: {
    identificationTypeOptions: any[];
    nationalityOptions: any[];
    maritalStatusOptions: any[];
    countryOptions: any[];
    dzongkhagOptions: any[];
    pepCategoryOptions: any[];
    taxIdentifierTypeOptions: any[];
  },
) => {
  if (!pep) return createEmptyRelatedPep();

  const mapped = { ...pep };

  // Identification Type
  if (mapped.identificationType && options.identificationTypeOptions.length) {
    mapped.identificationType = findPkCodeByLabel(
      mapped.identificationType,
      options.identificationTypeOptions,
      ["identity_type", "identification_type", "name", "label"],
    );
  }

  // Nationality
  if (mapped.nationality && options.nationalityOptions.length) {
    mapped.nationality = findPkCodeByLabel(
      mapped.nationality,
      options.nationalityOptions,
      ["nationality", "name", "label"],
    );
  }

  // Marital Status
  if (mapped.maritalStatus && options.maritalStatusOptions.length) {
    mapped.maritalStatus = findPkCodeByLabel(
      mapped.maritalStatus,
      options.maritalStatusOptions,
      ["marital_status", "name", "label"],
    );
  }

  // Tax Identifier Type
  if (mapped.taxIdentifierType && options.taxIdentifierTypeOptions.length) {
    mapped.taxIdentifierType = findPkCodeByLabel(
      mapped.taxIdentifierType,
      options.taxIdentifierTypeOptions,
      ["tax_identifier_type", "name", "label"],
    );
  }

  // Country for Permanent Address
  if (mapped.permCountry && options.countryOptions.length) {
    mapped.permCountry = findPkCodeByLabel(
      mapped.permCountry,
      options.countryOptions,
      ["country", "country_name", "countryName", "name", "label"],
    );
  }

  // Dzongkhag for Permanent Address
  if (mapped.permDzongkhag && options.dzongkhagOptions.length) {
    mapped.permDzongkhag = findPkCodeByLabel(
      mapped.permDzongkhag,
      options.dzongkhagOptions,
      ["dzongkhag", "dzongkhag_name", "dzongkhagName", "name", "label"],
    );
  }

  // Country for Current Address
  if (mapped.currCountry && options.countryOptions.length) {
    mapped.currCountry = findPkCodeByLabel(
      mapped.currCountry,
      options.countryOptions,
      ["country", "country_name", "countryName", "name", "label"],
    );
  }

  // Dzongkhag for Current Address
  if (mapped.currDzongkhag && options.dzongkhagOptions.length) {
    mapped.currDzongkhag = findPkCodeByLabel(
      mapped.currDzongkhag,
      options.dzongkhagOptions,
      ["dzongkhag", "dzongkhag_name", "dzongkhagName", "name", "label"],
    );
  }

  // PEP Category
  if (mapped.category && options.pepCategoryOptions.length) {
    mapped.category = findPkCodeByLabel(
      mapped.category,
      options.pepCategoryOptions,
      ["pep_category", "name", "label"],
    );
  }

  return mapped;
};

// ================== Helper: Map Fetched Data to Co-Borrower ==================
const mapFetchedToCoBorrower = (
  data: any,
  options: {
    identificationTypeOptions: any[];
    nationalityOptions: any[];
    maritalStatusOptions: any[];
    countryOptions: any[];
    dzongkhagOptions: any[];
    banksOptions: any[];
    occupationOptions: any[];
    organizationOptions: any[];
    pepCategoryOptions: any[];
    taxIdentifierTypeOptions: any[];
  },
) => {
  // First normalize the fetched data
  let d = normalizeData(data);

  // Resolve dropdown values to PK codes
  const resolvedNationality = findPkCodeByLabel(
    d.nationality,
    options.nationalityOptions,
    ["nationality", "name", "label"],
  ) || d.nationality || "";

  const resolvedMaritalStatus = findPkCodeByLabel(
    d.maritalStatus,
    options.maritalStatusOptions,
    ["marital_status", "name", "label"],
  ) || d.maritalStatus || "";

  // Evaluate Is Married securely handling matched Code ID
  const rawMaritalStatusStr = String(d.maritalStatus || "").toLowerCase();
  let isMarried = rawMaritalStatusStr.includes("married") && !rawMaritalStatusStr.includes("unmarried");
  if (!isMarried) {
    const matchedOpt = options.maritalStatusOptions.find(o => String(o.marital_status_pk_code || o.id || o.value || o.code) === String(resolvedMaritalStatus));
    if (matchedOpt) {
      const label = String(matchedOpt.marital_status || matchedOpt.name || matchedOpt.label || "").toLowerCase();
      if (label.includes("married") && !label.includes("unmarried")) isMarried = true;
    }
  }

  const resolvedIdentificationType = findPkCodeByLabel(
    d.identificationType,
    options.identificationTypeOptions,
    ["identity_type", "identification_type", "name", "label"],
  ) || d.identificationType || "";
  const resolvedBankName = findPkCodeByLabel(
    d.bankName,
    options.banksOptions,
    ["bank_name", "name", "label", "bankName", "bank"],
  ) || d.bankName || "";
  const resolvedOccupation = findPkCodeByLabel(
    d.occupation,
    options.occupationOptions,
    ["occ_name", "occupation", "name", "label"],
  ) || d.occupation || "";
  const resolvedOrganization = findPkCodeByLabel(
    d.organizationName,
    options.organizationOptions,
    ["lgal_constitution", "legal_const_name", "name", "label"],
  ) || d.organizationName || "";
  const resolvedPermCountry = findPkCodeByLabel(
    d.permCountry || d.permanentCountry,
    options.countryOptions,
    ["country", "country_name", "countryName", "name", "label"],
  ) || d.permCountry || d.permanentCountry || "";
  const resolvedPermDzongkhag = findPkCodeByLabel(
    d.permDzongkhag || d.permanentDzongkhag,
    options.dzongkhagOptions,
    ["dzongkhag", "dzongkhag_name", "dzongkhagName", "name", "label"],
  ) || d.permDzongkhag || d.permanentDzongkhag || "";
  const resolvedCurrCountry = findPkCodeByLabel(
    d.currCountry || d.currentCountry,
    options.countryOptions,
    ["country", "country_name", "countryName", "name", "label"],
  ) || d.currCountry || d.currentCountry || "";
  const resolvedCurrDzongkhag = findPkCodeByLabel(
    d.currDzongkhag || d.currentDzongkhag,
    options.dzongkhagOptions,
    ["dzongkhag", "dzongkhag_name", "dzongkhagName", "name", "label"],
  ) || d.currDzongkhag || d.currentDzongkhag || "";
  const resolvedTaxIdentifierType = findPkCodeByLabel(
    d.taxIdentifierType,
    options.taxIdentifierTypeOptions,
    ["tax_identifier_type", "name", "label"],
  ) || d.taxIdentifierType || "";

  // Spouse fields
  const resolvedSpouseNationality = findPkCodeByLabel(
    d.spouseNationality,
    options.nationalityOptions,
    ["nationality", "name", "label"],
  ) || d.spouseNationality || "";
  const resolvedSpouseTaxIdentifierType = findPkCodeByLabel(
    d.spouseTaxIdentifierType,
    options.taxIdentifierTypeOptions,
    ["tax_identifier_type", "name", "label"],
  ) || d.spouseTaxIdentifierType || "";
  const resolvedSpousePermCountry = findPkCodeByLabel(
    d.spousePermCountry,
    options.countryOptions,
    ["country", "country_name", "countryName", "name", "label"],
  ) || d.spousePermCountry || "";
  const resolvedSpousePermDzongkhag = findPkCodeByLabel(
    d.spousePermDzongkhag,
    options.dzongkhagOptions,
    ["dzongkhag", "dzongkhag_name", "dzongkhagName", "name", "label"],
  ) || d.spousePermDzongkhag || "";

  // PEP Category for self
  const resolvedPepCategory = findPkCodeByLabel(
    d.pepCategory,
    options.pepCategoryOptions,
    ["pep_category", "name", "label"],
  ) || d.pepCategory || "";

  // Map related PEPs if present
  let relatedPeps = [];
  if (d.relatedPeps && Array.isArray(d.relatedPeps)) {
    relatedPeps = d.relatedPeps.map((pep: any) =>
      mapRelatedPep(pep, {
        identificationTypeOptions: options.identificationTypeOptions,
        nationalityOptions: options.nationalityOptions,
        maritalStatusOptions: options.maritalStatusOptions,
        countryOptions: options.countryOptions,
        dzongkhagOptions: options.dzongkhagOptions,
        pepCategoryOptions: options.pepCategoryOptions,
        taxIdentifierTypeOptions: options.taxIdentifierTypeOptions,
      }),
    );
  }

  return {
    // Personal Information
    identificationType: resolvedIdentificationType,
    identificationNo: d.identificationNo || "",
    salutation: d.salutation || "",
    name: d.name || "",
    nationality: resolvedNationality,
    gender: d.gender || "",
    identificationIssueDate: formatDateForInput(d.identificationIssueDate),
    identificationExpiryDate: formatDateForInput(d.identificationExpiryDate),
    dateOfBirth: formatDateForInput(d.dateOfBirth),
    tpn: d.tpn || "",
    taxIdentifierType: resolvedTaxIdentifierType,
    householdNumber: d.householdNumber || "",
    relationship: d.relationship ? String(d.relationship).toLowerCase() : "",
    maritalStatus: resolvedMaritalStatus,
    familyTree: d.familyTree || "",
    bankName: resolvedBankName,
    bankAccount: d.bankAccount || "",
    passportPhoto: d.passportPhoto || "",
    idProofDocument: d.identificationProof || d.idProofDocument || "",

    // Spouse Info
    spouseIdentificationType: d.spouseIdentificationType || "",
    spouseIdentificationNo: d.spouseIdentificationNo || "",
    spouseSalutation: d.spouseSalutation ? String(d.spouseSalutation).toLowerCase().replace(/\./g, '') : "",
    spouseName: d.spouseName || "",
    spouseNationality: resolvedSpouseNationality,
    spouseGender: d.spouseGender ? String(d.spouseGender).toLowerCase() : "",
    spouseIdentificationIssueDate: formatDateForInput(d.spouseIdentificationIssueDate),
    spouseIdentificationExpiryDate: formatDateForInput(d.spouseIdentificationExpiryDate),
    spouseTaxIdentifierType: resolvedSpouseTaxIdentifierType,
    spouseTpn: d.spouseTpn || "",
    spouseDateOfBirth: formatDateForInput(d.spouseDateOfBirth),
    spouseHouseholdNumber: d.spouseHouseholdNumber || "",
    spousePermCountry: resolvedSpousePermCountry,
    spousePermDzongkhag: resolvedSpousePermDzongkhag,
    spousePermGewog: d.spousePermGewog || "",
    spousePermVillage: d.spousePermVillage || "",
    spousePermThram: d.spousePermThram || "",
    spousePermHouse: d.spousePermHouse || "",
    spousePermAddressProof: d.spousePermAddressProof || "",
    spouseEmail: d.spouseEmail || "",
    spouseContact: d.spouseContact || "",
    spouseAlternateContact: d.spouseAlternateContact || "",
    spouseIdProofDocument: d.spouseIdProofDocument || "",

    // Permanent Address
    permCountry: resolvedPermCountry,
    permDzongkhag: resolvedPermDzongkhag,
    permGewog: d.permGewog || d.permanentGewog || "",
    permVillage: d.permVillage || d.permanentVillage || "",
    permThram: d.permThram || d.permanentThram || "",
    permHouse: d.permHouse || d.permanentHouse || "",
    permAddressProof: d.permAddressProof || "",

    // Current Address
    currCountry: resolvedCurrCountry,
    currDzongkhag: resolvedCurrDzongkhag,
    currGewog: d.currGewog || d.currentGewog || "",
    currVillage: d.currVillage || d.currentVillage || "",
    currFlat: d.currFlat || d.currentFlat || "",
    currEmail: d.currEmail || d.currentEmail || "",
    currContact: d.currContact || d.currentContact || "",
    currAlternateContact: d.currAlternateContact || d.currentAlternateContact || "",
    currAddressProof: d.currAddressProof || "",

    // PEP Declaration
    pepPerson: d.pepPerson || "",
    pepCategory: resolvedPepCategory,
    pepSubCategory: d.pepSubCategory || "",
    identificationProof: d.identificationProof || "",
    pepRelated: d.pepRelated || "",
    relatedPeps: relatedPeps.length ? relatedPeps : [createEmptyRelatedPep()],

    // Employment Status
    employmentStatus: d.employmentStatus || "",

    // Employment Details
    employeeId: d.employeeId || "",
    occupation: resolvedOccupation,
    employerType: d.employerType || "",
    designation: d.designation || "",
    grade: d.grade || "",
    organizationName: resolvedOrganization,
    orgLocation: d.orgLocation || "",
    joiningDate: formatDateForInput(d.joiningDate),
    serviceNature: d.serviceNature || "",
    annualSalary: d.annualSalary || "",
    contractEndDate: formatDateForInput(d.contractEndDate),

    // Additional flags
    isMarried: isMarried,
    permGewogOptions: [],
    currGewogOptions: [],
    spousePermGewogOptions: [],
    pepSubCategoryOptions: [],
    relatedPepOptionsMap: {},
    relatedPepSpouseGewogMap: {},
    relatedPepPermGewogMap: {},
    relatedPepCurrGewogMap: {},
    showLookupPopup: false,
    lookupStatus: "searching" as "searching" | "found" | "not_found",
    fetchedCustomerData: null,
    errors: {},
  };
};

// Initialize empty related PEP entry
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
});

// Initialize empty co-borrower with all required fields
const createEmptyCoBorrower = () => ({
  // Personal Information
  identificationType: "",
  identificationNo: "",
  salutation: "",
  name: "",
  nationality: "",
  gender: "",
  identificationIssueDate: "",
  identificationExpiryDate: "",
  dateOfBirth: "",
  tpn: "",
  taxIdentifierType: "",
  householdNumber: "",
  relationship: "",
  maritalStatus: "",
  familyTree: "",
  bankName: "",
  bankAccount: "",
  passportPhoto: "",
  idProofDocument: "",

  // Spouse Info
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
  spouseIdProofDocument: "",

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
  currFlat: "",
  currEmail: "",
  currContact: "",
  currAlternateContact: "",
  currAddressProof: "",

  // PEP Declaration
  pepPerson: "",
  pepCategory: "",
  pepSubCategory: "",
  identificationProof: "",
  pepRelated: "",
  relatedPeps: [createEmptyRelatedPep()],

  // Employment Status
  employmentStatus: "",

  // Employment Details (if employed)
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

  // Additional fields for married status
  isMarried: false,
  permGewogOptions: [],
  currGewogOptions: [],
  spousePermGewogOptions: [],
  pepSubCategoryOptions: [],

  // Dynamic Options Maps for Related PEPs
  relatedPepOptionsMap: {},
  relatedPepSpouseGewogMap: {},
  relatedPepPermGewogMap: {},
  relatedPepCurrGewogMap: {},

  // Lookup states
  showLookupPopup: false,
  lookupStatus: "searching" as "searching" | "found" | "not_found",
  fetchedCustomerData: null,
  errors: {},
});

export function CoBorrowerDetailsForm({
  onNext,
  onBack,
  formData,
}: CoBorrowerDetailsFormProps) {
  const [coBorrowers, setCoBorrowers] = useState<any[]>(
    formData.coBorrowers || [createEmptyCoBorrower()],
  );

  // Dropdown States (shared across all co-borrowers)
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([]);
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<
    any[]
  >([]);
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([]);
  const [banksOptions, setBanksOptions] = useState<any[]>([]);
  const [occupationOptions, setOccupationOptions] = useState<any[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<any[]>([]);
  const [pepCategoryOptions, setPepCategoryOptions] = useState<any[]>([]);
  const [taxIdentifierTypeOptions, setTaxIdentifierTypeOptions] = useState<any[]>([]);

  // Refs to track if initial rehydration and gewog resolution is done
  const initialRehydrationDone = useRef(false);

  // Calculate date constraints
  const today = new Date().toISOString().split("T")[0];
  const fifteenYearsAgo = new Date();
  fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
  const maxDobDate = fifteenYearsAgo.toISOString().split("T")[0];

  // Filter identification types to exclude "Trade License Number" and "Company Registration Number"
  const filteredIdentificationOptions = useMemo(() => {
    return identificationTypeOptions.filter((option) => {
      const label = (option.identity_type || option.name || "").toLowerCase();
      return !label.includes("trade license") && !label.includes("company registration");
    });
  }, [identificationTypeOptions]);

  // Filter tax identifier options to show only "Personal Income Tax"
  const personalIncomeTaxOptions = useMemo(() => {
    return taxIdentifierTypeOptions.filter(opt => {
      const label = (opt.tax_identifier_type || opt.name || opt.label || "").toLowerCase();
      return label.includes("personal income tax");
    });
  }, [taxIdentifierTypeOptions]);

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

  const isBhutanCountry = (countryValue: any, options: any[]): boolean => {
    if (!countryValue) return false;
    const valStr = String(countryValue).toLowerCase();
    if (valStr === "bhutan") return true;

    // Check if it's already a code that corresponds to Bhutan
    const matchedOption = options.find((c) => getOptionPkCode(c) === String(countryValue));
    if (matchedOption) {
      return getOptionLabel(matchedOption).toLowerCase().includes("bhutan");
    }

    // Last resort fuzzy check on the value itself
    return valStr.includes("bhutan");
  };

  // --- HELPER: Determine if Married ---
  const getIsMarried = (coBorrower: any) => {
    const status = coBorrower.maritalStatus;
    if (!status) return false;

    const statusStr = String(status).toLowerCase();
    if (statusStr.includes("married") && !statusStr.includes("unmarried")) return true;

    const selectedOption = maritalStatusOptions.find((option) => {
      const val = String(
        option.marital_status_pk_code ||
        option.id ||
        option.value ||
        option.code ||
        "",
      );
      return val === String(status);
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

  // --- DATA FETCHING ---
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [
          marital,
          banks,
          nationality,
          idTypes,
          countries,
          dzos,
          occs,
          orgs,
          pepCats,
          taxTypes,
        ] = await Promise.all([
          fetchMaritalStatus().catch(() => []),
          fetchBanks().catch(() => []),
          fetchNationality().catch(() => []),
          fetchIdentificationType().catch(() => []),
          fetchCountry().catch(() => []),
          fetchDzongkhag().catch(() => []),
          fetchOccupations().catch(() => []),
          fetchLegalConstitution().catch(() => []),
          fetchPepCategory().catch(() => []),
          fetchTaxIdentifierType().catch(() => []),
        ]);

        setMaritalStatusOptions(marital);
        setBanksOptions(banks);
        setNationalityOptions(nationality);
        setIdentificationTypeOptions(idTypes);
        setCountryOptions(countries);
        setDzongkhagOptions(dzos);
        setOccupationOptions(occs);
        setOrganizationOptions(orgs);
        setPepCategoryOptions(pepCats);
        setTaxIdentifierTypeOptions(taxTypes || []);
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

      if (hasData && formData.coBorrowers) {
        setCoBorrowers(formData.coBorrowers);
      }
    }
  }, [formData]);

  // One-shot rehydration: re-map co-borrowers after dropdown options load
  // This converts label strings stored in session/formData to PK codes for dropdowns
  useEffect(() => {
    const allOptionsLoaded =
      occupationOptions.length > 0 &&
      countryOptions.length > 0 &&
      dzongkhagOptions.length > 0 &&
      nationalityOptions.length > 0 &&
      maritalStatusOptions.length > 0 &&
      identificationTypeOptions.length > 0 &&
      taxIdentifierTypeOptions.length > 0;

    if (!allOptionsLoaded || initialRehydrationDone.current) return;

    setCoBorrowers((prev) => {
      let changed = false;
      const updated = prev.map((cb) => {
        // Only re-map if the co-borrower has data that looks like labels (not already PK codes)
        const mightHaveLabels =
          cb.occupation || cb.organizationName || cb.permCountry ||
          cb.permDzongkhag || cb.permGewog || cb.currCountry ||
          cb.currDzongkhag || cb.currGewog || cb.nationality ||
          cb.maritalStatus || cb.bankName || cb.taxIdentifierType ||
          cb.identificationType;

        if (!mightHaveLabels) return cb;

        const remapped = mapFetchedToCoBorrower(cb, {
          identificationTypeOptions,
          nationalityOptions,
          maritalStatusOptions,
          countryOptions,
          dzongkhagOptions,
          banksOptions,
          occupationOptions,
          organizationOptions,
          pepCategoryOptions,
          taxIdentifierTypeOptions,
        });

        // Preserve non-data fields
        const merged = {
          ...cb,
          ...remapped,
          // Keep UI/options state from original cb
          permGewogOptions: cb.permGewogOptions || [],
          currGewogOptions: cb.currGewogOptions || [],
          spousePermGewogOptions: cb.spousePermGewogOptions || [],
          pepSubCategoryOptions: cb.pepSubCategoryOptions || [],
          relatedPepOptionsMap: cb.relatedPepOptionsMap || {},
          relatedPepSpouseGewogMap: cb.relatedPepSpouseGewogMap || {},
          relatedPepPermGewogMap: cb.relatedPepPermGewogMap || {},
          relatedPepCurrGewogMap: cb.relatedPepCurrGewogMap || {},
          showLookupPopup: cb.showLookupPopup || false,
          lookupStatus: cb.lookupStatus || "searching",
          fetchedCustomerData: cb.fetchedCustomerData || null,
          errors: cb.errors || {},
        };

        changed = true;
        return merged;
      });

      if (changed) {
        initialRehydrationDone.current = true;
      }
      return changed ? updated : prev;
    });
  }, [
    occupationOptions.length,
    countryOptions.length,
    dzongkhagOptions.length,
    nationalityOptions.length,
    maritalStatusOptions.length,
    banksOptions.length,
    organizationOptions.length,
    identificationTypeOptions.length,
    taxIdentifierTypeOptions.length,
  ]);

  // Helper to load gewog options and resolve value
  const loadAndResolveGewogs = async (
    dzongkhag: string,
    currentValue: string,
    type: 'perm' | 'curr' | 'spouse' | 'relatedPerm' | 'relatedCurr',
    coBorrowerIndex: number,
    relatedPepIndex?: number
  ) => {
    if (!dzongkhag) return null;
    try {
      // Resolve dzongkhag label → PK code if needed (e.g. from session data before rehydration)
      let dzongkhagCode = dzongkhag;
      const isNumeric = /^\d+$/.test(String(dzongkhag).trim());
      if (!isNumeric && dzongkhagOptions.length > 0) {
        const resolved = findPkCodeByLabel(dzongkhag, dzongkhagOptions, ["dzongkhag", "dzongkhag_name", "dzongkhagName", "name", "label"]);
        if (resolved) dzongkhagCode = resolved;
      }

      const options = await fetchGewogsByDzongkhag(dzongkhagCode);
      let resolvedValue = currentValue;
      if (resolvedValue && options.length > 0) {
        const pkCode = findPkCodeByLabel(resolvedValue, options, ["gewog", "gewog_name", "gewogName", "name", "label"]);
        if (pkCode && pkCode !== resolvedValue) {
          resolvedValue = pkCode;
        }
      }
      return { options, resolvedValue };
    } catch (error) {
      console.error(`Failed to load gewogs for dzongkhag ${dzongkhag}:`, error);
      return { options: [], resolvedValue: currentValue };
    }
  };

  // Load permanent gewogs safely mapping functional updates to avoid state wipe-outs
  useEffect(() => {
    const loadPermGewogs = async () => {
      const fetchJobs = coBorrowers.map(async (cb, i) => {
        if (cb.permDzongkhag) {
          const result = await loadAndResolveGewogs(cb.permDzongkhag, cb.permGewog, 'perm', i);
          return { i, dzongkhag: cb.permDzongkhag, ...result };
        }
        return { i, dzongkhag: null, options: [], resolvedValue: cb.permGewog };
      });

      const results = await Promise.all(fetchJobs);

      setCoBorrowers((prev) => {
        // Safe-guard against array mutations (e.g. deletion) during the fetch gap
        if (prev.length !== results.length) return prev;

        let needsUpdate = false;
        const updated = [...prev];

        for (const res of results) {
          const cb = updated[res.i];
          if (!cb) continue;

          if (res.dzongkhag) {
            const optionsChanged = !cb.permGewogOptions || cb.permGewogOptions.length !== (res.options?.length || 0);
            const valueChanged = res.resolvedValue !== cb.permGewog;

            if (optionsChanged || valueChanged) {
              updated[res.i] = {
                ...cb,
                permGewogOptions: res.options || [],
                permGewog: res.resolvedValue || cb.permGewog,
              };
              needsUpdate = true;
            }
          } else if (cb.permGewogOptions?.length > 0) {
            updated[res.i] = {
              ...cb,
              permGewogOptions: [],
              permGewog: "",
            };
            needsUpdate = true;
          }
        }
        return needsUpdate ? updated : prev;
      });
    };
    loadPermGewogs();
  }, [
    coBorrowers.map((cb) => `${cb.permDzongkhag}-${cb.permGewog}`).join(","),
    dzongkhagOptions.length,
  ]);

  // Load current gewogs safely mapping functional updates to avoid state wipe-outs
  useEffect(() => {
    const loadCurrGewogs = async () => {
      const fetchJobs = coBorrowers.map(async (cb, i) => {
        if (cb.currDzongkhag) {
          const result = await loadAndResolveGewogs(cb.currDzongkhag, cb.currGewog, 'curr', i);
          return { i, dzongkhag: cb.currDzongkhag, ...result };
        }
        return { i, dzongkhag: null, options: [], resolvedValue: cb.currGewog };
      });

      const results = await Promise.all(fetchJobs);

      setCoBorrowers((prev) => {
        if (prev.length !== results.length) return prev;

        let needsUpdate = false;
        const updated = [...prev];

        for (const res of results) {
          const cb = updated[res.i];
          if (!cb) continue;

          if (res.dzongkhag) {
            const optionsChanged = !cb.currGewogOptions || cb.currGewogOptions.length !== (res.options?.length || 0);
            const valueChanged = res.resolvedValue !== cb.currGewog;

            if (optionsChanged || valueChanged) {
              updated[res.i] = {
                ...cb,
                currGewogOptions: res.options || [],
                currGewog: res.resolvedValue || cb.currGewog,
              };
              needsUpdate = true;
            }
          } else if (cb.currGewogOptions?.length > 0) {
            updated[res.i] = {
              ...cb,
              currGewogOptions: [],
              currGewog: "",
            };
            needsUpdate = true;
          }
        }
        return needsUpdate ? updated : prev;
      });
    };
    loadCurrGewogs();
  }, [
    coBorrowers.map((cb) => `${cb.currDzongkhag}-${cb.currGewog}`).join(","),
    dzongkhagOptions.length,
  ]);

  // Load spouse perm gewogs safely mapping functional updates to avoid state wipe-outs
  useEffect(() => {
    const loadSpousePermGewogs = async () => {
      const fetchJobs = coBorrowers.map(async (cb, i) => {
        if (cb.spousePermDzongkhag) {
          const result = await loadAndResolveGewogs(cb.spousePermDzongkhag, cb.spousePermGewog, 'spouse', i);
          return { i, dzongkhag: cb.spousePermDzongkhag, ...result };
        }
        return { i, dzongkhag: null, options: [], resolvedValue: cb.spousePermGewog };
      });

      const results = await Promise.all(fetchJobs);

      setCoBorrowers((prev) => {
        if (prev.length !== results.length) return prev;

        let needsUpdate = false;
        const updated = [...prev];

        for (const res of results) {
          const cb = updated[res.i];
          if (!cb) continue;

          if (res.dzongkhag) {
            const optionsChanged = !cb.spousePermGewogOptions || cb.spousePermGewogOptions.length !== (res.options?.length || 0);
            const valueChanged = res.resolvedValue !== cb.spousePermGewog;

            if (optionsChanged || valueChanged) {
              updated[res.i] = {
                ...cb,
                spousePermGewogOptions: res.options || [],
                spousePermGewog: res.resolvedValue || cb.spousePermGewog,
              };
              needsUpdate = true;
            }
          } else if (cb.spousePermGewogOptions?.length > 0) {
            updated[res.i] = {
              ...cb,
              spousePermGewogOptions: [],
              spousePermGewog: "",
            };
            needsUpdate = true;
          }
        }
        return needsUpdate ? updated : prev;
      });
    };
    loadSpousePermGewogs();
  }, [
    coBorrowers.map((cb) => `${cb.spousePermDzongkhag}-${cb.spousePermGewog}`).join(","),
    dzongkhagOptions.length,
  ]);

  // Load PEP sub-categories for SELF PEP safely via functional updates
  useEffect(() => {
    const loadPepSubCategories = async () => {
      const fetchJobs = coBorrowers.map(async (cb, i) => {
        if (cb.pepPerson === "yes" && cb.pepCategory) {
          try {
            const options = await fetchPepSubCategoryByCategory(cb.pepCategory);
            return { i, active: true, options: options || [] };
          } catch (error) {
            return { i, active: true, options: [] };
          }
        }
        return { i, active: false, options: [] };
      });

      const results = await Promise.all(fetchJobs);

      setCoBorrowers((prev) => {
        if (prev.length !== results.length) return prev;

        let needsUpdate = false;
        const updated = [...prev];

        for (const res of results) {
          const cb = updated[res.i];
          if (!cb) continue;

          if (res.active) {
            const optionsChanged = !cb.pepSubCategoryOptions || cb.pepSubCategoryOptions.length !== res.options.length;
            if (optionsChanged) {
              updated[res.i] = {
                ...cb,
                pepSubCategoryOptions: res.options,
              };
              needsUpdate = true;
            }
          } else if (cb.pepSubCategoryOptions?.length > 0) {
            updated[res.i] = {
              ...cb,
              pepSubCategoryOptions: [],
            };
            needsUpdate = true;
          }
        }
        return needsUpdate ? updated : prev;
      });
    };
    loadPepSubCategories();
  }, [coBorrowers.map((cb) => `${cb.pepPerson}-${cb.pepCategory}`).join(",")]);

  const handleFileChange = (
    index: number,
    fieldName: string,
    file: File | null,
  ) => {
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setCoBorrowers((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            errors: {
              ...updated[index].errors,
              [fieldName]: "Only PDF, JPG, JPEG, and PNG files are allowed",
            },
          };
          return updated;
        });
        return;
      }

      if (file.size > maxSize) {
        setCoBorrowers((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            errors: {
              ...updated[index].errors,
              [fieldName]: "File size must be less than 5MB",
            },
          };
          return updated;
        });
        return;
      }

      setCoBorrowers((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          [fieldName]: file.name,
          errors: {
            ...updated[index].errors,
            [fieldName]: "",
          },
        };
        return updated;
      });
    }
  };

  // --- AUTOMATIC LOOKUP LOGIC ---
  const handleIdentityCheck = async (index: number) => {
    const coBorrower = coBorrowers[index];
    const idType = coBorrower.identificationType;
    const idNo = coBorrower.identificationNo;

    if (!idType || !idNo || idNo.trim() === "") return;

    setCoBorrowers((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        showLookupPopup: true,
        lookupStatus: "searching",
      };
      return updated;
    });

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
        const mappedData = mapCoBorrowerData(result);
        setCoBorrowers((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            fetchedCustomerData: mappedData,
            lookupStatus: "found",
          };
          return updated;
        });
      } else {
        setCoBorrowers((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            lookupStatus: "not_found",
            fetchedCustomerData: null,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error("Identity lookup failed", error);
      setCoBorrowers((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          lookupStatus: "not_found",
          fetchedCustomerData: null,
        };
        return updated;
      });
    }
  };

  // Proceed handler mapping fetched data with robust normalization
  const handleLookupProceed = (index: number) => {
    const coBorrower = coBorrowers[index];
    if (coBorrower.lookupStatus === "found" && coBorrower.fetchedCustomerData) {
      // Map the fetched data to co-borrower structure using the loaded options
      const mapped = mapFetchedToCoBorrower(coBorrower.fetchedCustomerData, {
        identificationTypeOptions,
        nationalityOptions,
        maritalStatusOptions,
        countryOptions,
        dzongkhagOptions,
        banksOptions,
        occupationOptions,
        organizationOptions,
        pepCategoryOptions,
        taxIdentifierTypeOptions,
      });

      // Preserve the original identification type and number (the user's input)
      mapped.identificationType = coBorrower.identificationType;
      mapped.identificationNo = coBorrower.identificationNo;

      setCoBorrowers((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          ...mapped,
          showLookupPopup: false,
        };
        return updated;
      });
    } else {
      setCoBorrowers((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          showLookupPopup: false,
        };
        return updated;
      });
    }
  };

  // --- HANDLERS FOR MULTIPLE PEP DECLARATIONS ---
  const handleAddRelatedPep = (index: number) => {
    setCoBorrowers((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        relatedPeps: [
          ...(updated[index].relatedPeps || []),
          createEmptyRelatedPep(),
        ],
      };
      return updated;
    });
  };

  const handleRemoveRelatedPep = (index: number, pepIndex: number) => {
    setCoBorrowers((prev) => {
      const updated = [...prev];
      const updatedPeps = (updated[index].relatedPeps || []).filter(
        (_: any, i: number) => i !== pepIndex,
      );

      // Cleanup options maps
      const cleanMap = (mapObj: Record<number, any[]>) => {
        const newMap: Record<number, any[]> = { ...mapObj };
        Object.keys(newMap).forEach((key) => {
          const keyNum = parseInt(key);
          if (keyNum > pepIndex) {
            newMap[keyNum - 1] = newMap[keyNum];
            delete newMap[keyNum];
          } else if (keyNum === pepIndex) {
            delete newMap[keyNum];
          }
        });
        return newMap;
      };

      updated[index] = {
        ...updated[index],
        relatedPeps: updatedPeps,
        relatedPepOptionsMap: cleanMap(
          updated[index].relatedPepOptionsMap || {},
        ),
        relatedPepSpouseGewogMap: cleanMap(
          updated[index].relatedPepSpouseGewogMap || {},
        ),
        relatedPepPermGewogMap: cleanMap(
          updated[index].relatedPepPermGewogMap || {},
        ),
        relatedPepCurrGewogMap: cleanMap(
          updated[index].relatedPepCurrGewogMap || {},
        ),
      };
      return updated;
    });
  };

  const handleRelatedPepChange = async (
    coBorrowerIndex: number,
    pepIndex: number,
    field: string,
    value: string,
  ) => {
    setCoBorrowers((prev) => {
      const updated = [...prev];
      const updatedPeps = [...(updated[coBorrowerIndex].relatedPeps || [])];
      if (!updatedPeps[pepIndex]) {
        updatedPeps[pepIndex] = createEmptyRelatedPep();
      }

      updatedPeps[pepIndex] = { ...updatedPeps[pepIndex], [field]: value };

      // Dynamic Fetches
      if (field === "category") {
        updatedPeps[pepIndex].subCategory = "";
        fetchPepSubCategoryByCategory(value)
          .then((options) => {
            setCoBorrowers((current) => {
              const currentUpdated = [...current];
              currentUpdated[coBorrowerIndex] = {
                ...currentUpdated[coBorrowerIndex],
                relatedPepOptionsMap: {
                  ...currentUpdated[coBorrowerIndex].relatedPepOptionsMap,
                  [pepIndex]: options || [],
                },
              };
              return currentUpdated;
            });
          })
          .catch(() => { });
      }

      if (field === "spousePermDzongkhag") {
        updatedPeps[pepIndex].spousePermGewog = "";
        fetchGewogsByDzongkhag(value)
          .then((options) => {
            setCoBorrowers((current) => {
              const currentUpdated = [...current];
              currentUpdated[coBorrowerIndex] = {
                ...currentUpdated[coBorrowerIndex],
                relatedPepSpouseGewogMap: {
                  ...currentUpdated[coBorrowerIndex].relatedPepSpouseGewogMap,
                  [pepIndex]: options || [],
                },
              };
              return currentUpdated;
            });
          })
          .catch(() => { });
      }

      if (field === "permDzongkhag") {
        updatedPeps[pepIndex].permGewog = "";
        fetchGewogsByDzongkhag(value)
          .then((options) => {
            setCoBorrowers((current) => {
              const currentUpdated = [...current];
              currentUpdated[coBorrowerIndex] = {
                ...currentUpdated[coBorrowerIndex],
                relatedPepPermGewogMap: {
                  ...currentUpdated[coBorrowerIndex].relatedPepPermGewogMap,
                  [pepIndex]: options || [],
                },
              };
              return currentUpdated;
            });
          })
          .catch(() => { });
      }

      if (field === "currDzongkhag") {
        updatedPeps[pepIndex].currGewog = "";
        fetchGewogsByDzongkhag(value)
          .then((options) => {
            setCoBorrowers((current) => {
              const currentUpdated = [...current];
              currentUpdated[coBorrowerIndex] = {
                ...currentUpdated[coBorrowerIndex],
                relatedPepCurrGewogMap: {
                  ...currentUpdated[coBorrowerIndex].relatedPepCurrGewogMap,
                  [pepIndex]: options || [],
                },
              };
              return currentUpdated;
            });
          })
          .catch(() => { });
      }

      updated[coBorrowerIndex] = {
        ...updated[coBorrowerIndex],
        relatedPeps: updatedPeps,
      };
      return updated;
    });
  };

  const handleRelatedPepFileChange = (
    coBorrowerIndex: number,
    pepIndex: number,
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
      const maxSize = 5 * 1024 * 1024;

      if (!allowedTypes.includes(file.type)) return;
      if (file.size > maxSize) return;

      setCoBorrowers((prev) => {
        const updated = [...prev];
        const updatedPeps = [...(updated[coBorrowerIndex].relatedPeps || [])];
        if (!updatedPeps[pepIndex]) {
          updatedPeps[pepIndex] = createEmptyRelatedPep();
        }

        updatedPeps[pepIndex] = {
          ...updatedPeps[pepIndex],
          [field]: file.name,
        };
        updated[coBorrowerIndex] = {
          ...updated[coBorrowerIndex],
          relatedPeps: updatedPeps,
        };
        return updated;
      });
    }
  };

  const validateDates = (coBorrower: any) => {
    const newErrors: Record<string, string> = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseLocalDate = (dateString: string) => {
      const [year, month, day] = dateString.split("-").map(Number);
      return new Date(year, month - 1, day);
    };

    const issueDate = coBorrower.identificationIssueDate
      ? parseLocalDate(coBorrower.identificationIssueDate)
      : null;

    const expiryDate = coBorrower.identificationExpiryDate
      ? parseLocalDate(coBorrower.identificationExpiryDate)
      : null;

    const dobDate = coBorrower.dateOfBirth
      ? parseLocalDate(coBorrower.dateOfBirth)
      : null;

    if (issueDate && issueDate > today) {
      newErrors.identificationIssueDate = "Issue date cannot be in the future";
    }

    if (expiryDate && expiryDate < today) {
      newErrors.identificationExpiryDate = "Expiry date cannot be in the past";
    }

    if (dobDate) {
      const minDob = new Date();
      minDob.setFullYear(minDob.getFullYear() - 15);
      minDob.setHours(0, 0, 0, 0);

      if (dobDate > minDob) {
        newErrors.dateOfBirth = "You must be at least 15 years old";
      }
    }

    if (issueDate && expiryDate && expiryDate <= issueDate) {
      newErrors.identificationExpiryDate =
        "Expiry date must be after issue date";
    }

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all co-borrowers
    const validatedCoBorrowers = coBorrowers.map((coBorrower) => {
      const dateErrors = validateDates(coBorrower);

      return {
        ...coBorrower,
        errors: dateErrors, // replace, do NOT merge
        isMarried: getIsMarried(coBorrower),
      };
    });
    setCoBorrowers(validatedCoBorrowers);

    // Check if there are any errors
    const hasErrors = validatedCoBorrowers.some((coBorrower) =>
      Object.values(coBorrower.errors || {}).some((error) => error),
    );

    if (!hasErrors) {
      const coBorrowerData = { coBorrowers: validatedCoBorrowers };

      // Retrieve existing data from sessionStorage
      const existingData = sessionStorage.getItem("loanApplicationData");
      const allData = existingData ? JSON.parse(existingData) : {};

      // Merge and save to sessionStorage
      const updatedData = { ...allData, ...coBorrowerData };
      sessionStorage.setItem(
        "loanApplicationData",
        JSON.stringify(updatedData),
      );

      onNext(coBorrowerData);
    }
  };

  const addCoBorrower = () => {
    setCoBorrowers([...coBorrowers, createEmptyCoBorrower()]);
  };

  const removeCoBorrower = (index: number) => {
    if (index === 0 && coBorrowers.length === 1) {
      // Don't remove the first co-borrower if it's the only one
      return;
    }

    const updatedCoBorrowers = coBorrowers.filter((_, i) => i !== index);
    setCoBorrowers(updatedCoBorrowers);
  };

  const updateCoBorrowerField = (index: number, field: string, value: any) => {
    setCoBorrowers((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
        // Clear dependent fields when parent field changes
        ...(field === "pepPerson" && value === "yes" ? { pepRelated: "" } : {}),
        ...(field === "pepPerson" && value === "no"
          ? {
            pepCategory: "",
            pepSubCategory: "",
            identificationProof: "",
          }
          : {}),
        ...(field === "pepRelated" && value === "no"
          ? { relatedPeps: [] }
          : {}),
        ...(field === "maritalStatus"
          ? {
            isMarried: getIsMarried({
              ...updated[index],
              maritalStatus: value,
            }),
          }
          : {}),
      };
      return updated;
    });
  };

  // Render a single co-borrower form section
  const renderCoBorrowerForm = (coBorrower: any, index: number) => {
    const isMarried = getIsMarried(coBorrower);
    const relatedPeps = coBorrower.relatedPeps || [createEmptyRelatedPep()];
    const errors = coBorrower.errors || {};

    // Dynamic resolved variables for robust UI fallback injection
    const resolvedOccupation = findPkCodeByLabel(coBorrower.occupation, occupationOptions, ["occ_name", "occupation", "name", "label"]) || coBorrower.occupation || "";
    const resolvedOrganization = findPkCodeByLabel(coBorrower.organizationName, organizationOptions, ["lgal_constitution", "legal_const_name", "name", "label"]) || coBorrower.organizationName || "";
    const resolvedBankName = findPkCodeByLabel(coBorrower.bankName, banksOptions, ["bank_name", "name", "label", "bankName", "bank"]) || coBorrower.bankName || "";
    const resolvedPermGewog = findPkCodeByLabel(coBorrower.permGewog, coBorrower.permGewogOptions || [], ["gewog", "gewog_name", "gewogName", "name", "label"]) || coBorrower.permGewog || "";
    const resolvedCurrGewog = findPkCodeByLabel(coBorrower.currGewog, coBorrower.currGewogOptions || [], ["gewog", "gewog_name", "gewogName", "name", "label"]) || coBorrower.currGewog || "";
    const resolvedSpousePermGewog = findPkCodeByLabel(coBorrower.spousePermGewog, coBorrower.spousePermGewogOptions || [], ["gewog", "gewog_name", "gewogName", "name", "label"]) || coBorrower.spousePermGewog || "";

    return (
      <div
        key={index}
        className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-md hover:shadow-lg transition-shadow duration-200 mb-8"
      >
        {/* Co-Borrower Header */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-[#003DA5]">
            {index === 0
              ? "Primary Co-Borrower"
              : `Additional Co-Borrower ${index}`}
          </h2>
          {index > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeCoBorrower(index)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Remove Co-Borrower
            </Button>
          )}
        </div>

        {/* Search Status Popup for this co-borrower */}
        {coBorrower.showLookupPopup && (
          <DocumentPopup
            open={coBorrower.showLookupPopup}
            onOpenChange={(open) => {
              if (!open) {
                setCoBorrowers((prev) => {
                  const updated = [...prev];
                  updated[index] = {
                    ...updated[index],
                    showLookupPopup: false,
                  };
                  return updated;
                });
              }
            }}
            searchStatus={coBorrower.lookupStatus}
            onProceed={() => handleLookupProceed(index)}
          />
        )}

        {/* Co-Borrower Personal Information */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
            Personal Information
          </h3>

          {/* Identification Fields Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor={`co-identificationType-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Identification Type <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={coBorrower.identificationType}
                  onValueChange={(value) => {
                    updateCoBorrowerField(index, "identificationType", value);
                  }}
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredIdentificationOptions.length > 0 ? (
                      filteredIdentificationOptions.map((option, optionIndex) => {
                        const key =
                          option.identity_type_pk_code ||
                          option.id ||
                          `id-${optionIndex}`;
                        const value = String(
                          option.identity_type_pk_code ||
                          option.id ||
                          optionIndex,
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
                htmlFor={`co-identificationNo-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Identification No. <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`co-identificationNo-${index}`}
                placeholder="Enter identification No"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={coBorrower.identificationNo || ""}
                onChange={(e) =>
                  updateCoBorrowerField(
                    index,
                    "identificationNo",
                    e.target.value,
                  )
                }
                onBlur={() => handleIdentityCheck(index)}
                required
              />
            </div>
          </div>

          {/* Secondary Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor={`co-salutation-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Salutation <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={coBorrower.salutation}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "salutation", value)
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    {coBorrower.salutation && !["mr", "mrs", "ms", "dr"].includes(String(coBorrower.salutation).toLowerCase()) && (
                      <SelectItem value={coBorrower.salutation}>{coBorrower.salutation}</SelectItem>
                    )}
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
                htmlFor={`co-name-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Co-Borrower Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`co-name-${index}`}
                placeholder="Enter Full Name"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={coBorrower.name || ""}
                onChange={(e) =>
                  updateCoBorrowerField(index, "name", e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`co-nationality-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Nationality <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={
                    coBorrower.nationality ? String(coBorrower.nationality) : ""
                  }
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "nationality", value)
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    {nationalityOptions.length > 0 ? (
                      nationalityOptions.map((option, optionIndex) => {
                        const key =
                          option.nationality_pk_code ||
                          option.id ||
                          `nationality-${optionIndex}`;
                        const value = String(
                          option.nationality_pk_code ||
                          option.id ||
                          optionIndex,
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
                htmlFor={`co-gender-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Gender <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={coBorrower.gender}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "gender", value)
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    {coBorrower.gender && !["male", "female", "other"].includes(String(coBorrower.gender).toLowerCase()) && (
                      <SelectItem value={coBorrower.gender}>{coBorrower.gender}</SelectItem>
                    )}
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`co-identificationIssueDate-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Identification Issue Date
                <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                id={`co-identificationIssueDate-${index}`}
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={formatDateForInput(coBorrower.identificationIssueDate)}
                onChange={(e) =>
                  updateCoBorrowerField(
                    index,
                    "identificationIssueDate",
                    e.target.value,
                  )
                }
                required
              />
              {errors.identificationIssueDate && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.identificationIssueDate}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`co-identificationExpiryDate-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Identification Expiry Date{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                id={`co-identificationExpiryDate-${index}`}
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={formatDateForInput(coBorrower.identificationExpiryDate)}
                onChange={(e) =>
                  updateCoBorrowerField(
                    index,
                    "identificationExpiryDate",
                    e.target.value,
                  )
                }
                required
              />
              {errors.identificationExpiryDate && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.identificationExpiryDate}
                </p>
              )}
            </div>
          </div>

          {/* Dates and TPN Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor={`co-dateOfBirth-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                id={`co-dateOfBirth-${index}`}
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={formatDateForInput(coBorrower.dateOfBirth)}
                onChange={(e) =>
                  updateCoBorrowerField(index, "dateOfBirth", e.target.value)
                }
                required
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.dateOfBirth}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`co-tpn-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                TPN No
              </Label>
              <Input
                id={`co-tpn-${index}`}
                placeholder="Enter TPN"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={coBorrower.tpn || ""}
                onChange={(e) =>
                  updateCoBorrowerField(index, "tpn", e.target.value)
                }
              />
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`taxIdentifierType-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Tax Identifier Type
              </Label>
              <Select
                value={coBorrower.taxIdentifierType || ""}
                onValueChange={(value) =>
                  updateCoBorrowerField(index, "taxIdentifierType", value)
                }
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {personalIncomeTaxOptions.length > 0 ? (
                    personalIncomeTaxOptions.map((option, idx) => {
                      const value = String(
                        option.tax_identifier_type_pk_code || option.id || option.code || idx
                      );
                      const label = option.tax_identifier_type || option.name || option.label || "Unknown";
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
            </div>

            {isNatBhutanese(coBorrower.nationality) && (
              <div className="space-y-2.5">
                <Label
                  htmlFor={`co-householdNumber-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Household Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`co-householdNumber-${index}`}
                  placeholder="Enter Household Number"
                  className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={coBorrower.householdNumber || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "householdNumber",
                      e.target.value,
                    )
                  }
                  required
                />
              </div>
            )}
          </div>

          {/* Final Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor={`co-relationship-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Relationship to Borrower{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="w-full h-12" style={{ minHeight: "48px" }}>
                <Select
                  value={coBorrower.relationship}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "relationship", value)
                  }
                >
                  <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    {coBorrower.relationship && !["spouse", "parent", "sibling", "child", "other"].includes(String(coBorrower.relationship).toLowerCase()) && (
                      <SelectItem value={coBorrower.relationship}>{coBorrower.relationship}</SelectItem>
                    )}
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
              <Label
                htmlFor={`maritalStatus-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Marital Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={coBorrower.maritalStatus}
                onValueChange={(value) =>
                  updateCoBorrowerField(index, "maritalStatus", value)
                }
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {maritalStatusOptions.length > 0 ? (
                    maritalStatusOptions.map((option, optionIndex) => {
                      const key =
                        option.marital_status_pk_code ||
                        option.id ||
                        option.value ||
                        option.code ||
                        `marital-${optionIndex}`;
                      const value = String(
                        option.marital_status_pk_code ||
                        option.id ||
                        option.value ||
                        option.code ||
                        optionIndex,
                      );
                      const label =
                        option.marital_status ||
                        option.name ||
                        option.label ||
                        option.description ||
                        option.value ||
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t mt-4">
            <div className="space-y-2.5">
              <Label
                htmlFor={`uploadFamilyTree-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Upload Family Tree <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id={`uploadFamilyTree-${index}`}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    handleFileChange(
                      index,
                      "familyTree",
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
                      .getElementById(`uploadFamilyTree-${index}`)
                      ?.click()
                  }
                >
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground">
                  {coBorrower.familyTree || "No file chosen"}
                </span>
              </div>
              {errors.familyTree && (
                <p className="text-xs text-red-500 mt-1">{errors.familyTree}</p>
              )}
              <p className="text-xs text-gray-500">
                Allowed: PDF, JPG, PNG (Max 5MB)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor={`bankName-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Name of Bank <span className="text-red-500">*</span>
              </Label>
              <Select
                value={resolvedBankName}
                onValueChange={(value) =>
                  updateCoBorrowerField(index, "bankName", value)
                }
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {coBorrower.bankName && !banksOptions.find(o => String(o.bank_pk_code || o.id) === resolvedBankName) && (
                    <SelectItem value={resolvedBankName}>{coBorrower.bankName}</SelectItem>
                  )}
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
            <div className="space-y-2.5">
              <Label
                htmlFor={`bankAccount-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Bank Saving Account No <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`bankAccount-${index}`}
                placeholder="Enter saving account number"
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={coBorrower.bankAccount || ""}
                onChange={(e) =>
                  updateCoBorrowerField(index, "bankAccount", e.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor={`uploadPassport-${index}`}
              className="text-gray-800 font-semibold text-sm"
            >
              Upload Passport-size Photograph{" "}
              <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id={`uploadPassport-${index}`}
                className="hidden"
                accept=".jpg,.jpeg,.png"
                onChange={(e) =>
                  handleFileChange(
                    index,
                    "passportPhoto",
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
                  document.getElementById(`uploadPassport-${index}`)?.click()
                }
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {coBorrower.passportPhoto || "No file chosen"}
              </span>
            </div>
            {errors.passportPhoto && (
              <p className="text-xs text-red-500 mt-1">
                {errors.passportPhoto}
              </p>
            )}
            <p className="text-xs text-gray-500">Allowed: JPG, PNG (Max 5MB)</p>
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor={`uploadIdProof-${index}`}
              className="text-gray-800 font-semibold text-sm"
            >
              Upload Identification Proof Document{" "}
              <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id={`uploadIdProof-${index}`}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  handleFileChange(
                    index,
                    "idProofDocument",
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
                  document.getElementById(`uploadIdProof-${index}`)?.click()
                }
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {coBorrower.idProofDocument || "No file chosen"}
              </span>
            </div>
            {errors.idProofDocument && (
              <p className="text-xs text-red-500 mt-1">
                {errors.idProofDocument}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Allowed: PDF, JPG, PNG (Max 5MB)
            </p>
          </div>
        </div>

        {/* Permanent Address */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm mt-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
            Permanent Address
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor={`permCountry-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Country <span className="text-red-500">*</span>
              </Label>
              <Select
                value={coBorrower.permCountry}
                onValueChange={(value) =>
                  updateCoBorrowerField(index, "permCountry", value)
                }
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {countryOptions.length > 0 ? (
                    countryOptions.map((option, optionIndex) => {
                      const key =
                        option.country_pk_code ||
                        option.id ||
                        option.code ||
                        `perm-country-${optionIndex}`;
                      const value = String(
                        option.country_pk_code ||
                        option.id ||
                        option.code ||
                        optionIndex,
                      );
                      const label =
                        option.country ||
                        option.name ||
                        option.label ||
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
                htmlFor={`permDzongkhag-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                {isBhutanCountry(coBorrower.permCountry, countryOptions)
                  ? "Dzongkhag"
                  : "State"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {coBorrower.permCountry &&
                !isBhutanCountry(coBorrower.permCountry, countryOptions) ? (
                <Input
                  id={`permDzongkhag-${index}`}
                  placeholder="Enter State"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.permDzongkhag || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "permDzongkhag",
                      e.target.value,
                    )
                  }
                />
              ) : (
                <Select
                  value={coBorrower.permDzongkhag || ""}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "permDzongkhag", value)
                  }
                  disabled={
                    !isBhutanCountry(coBorrower.permCountry, countryOptions)
                  }
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {coBorrower.permDzongkhag && !dzongkhagOptions.find((o: any) => String(getOptionPkCode(o)) === String(coBorrower.permDzongkhag)) && (
                      <SelectItem value={coBorrower.permDzongkhag}>
                        {resolveLabelByValue(coBorrower.permDzongkhag, dzongkhagOptions) || coBorrower.permDzongkhag}
                      </SelectItem>
                    )}
                    {dzongkhagOptions.length > 0 ? (
                      dzongkhagOptions.map((option, optionIndex) => {
                        const value = getOptionPkCode(option) || String(optionIndex);
                        const label = getOptionLabel(option);

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
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`permGewog-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                {isBhutanCountry(coBorrower.permCountry, countryOptions)
                  ? "Gewog"
                  : "Province"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {coBorrower.permCountry &&
                !isBhutanCountry(coBorrower.permCountry, countryOptions) ? (
                <Input
                  id={`permGewog-${index}`}
                  placeholder="Enter Province"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.permGewog || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "permGewog", e.target.value)
                  }
                />
              ) : (
                <Select
                  value={resolvedPermGewog}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "permGewog", value)
                  }
                  disabled={
                    !isBhutanCountry(coBorrower.permCountry, countryOptions)
                  }
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                    <SelectValue placeholder="[Select]">
                      {resolvedPermGewog
                        ? resolveLabelByValue(resolvedPermGewog, coBorrower.permGewogOptions || [])
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {resolvedPermGewog && !coBorrower.permGewogOptions?.find((o: any) => String(getOptionPkCode(o)) === String(resolvedPermGewog)) && (
                      <SelectItem value={resolvedPermGewog}>
                        {resolveLabelByValue(resolvedPermGewog, coBorrower.permGewogOptions || []) || resolvedPermGewog}
                      </SelectItem>
                    )}
                    {coBorrower.permGewogOptions?.length > 0 ? (
                      coBorrower.permGewogOptions.map(
                        (option: any, optionIndex: number) => {
                          const value = getOptionPkCode(option) || String(optionIndex);
                          const label = getOptionLabel(option);
                          return (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          );
                        },
                      )
                    ) : (
                      <SelectItem value="__placeholder__" disabled>
                        {coBorrower.permDzongkhag
                          ? "Loading..."
                          : "Select Dzongkhag first"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`permVillage-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                {isBhutanCountry(coBorrower.permCountry, countryOptions)
                  ? "Village/Street"
                  : "Street"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`permVillage-${index}`}
                placeholder={
                  isBhutanCountry(coBorrower.permCountry, countryOptions)
                    ? "Enter Village/Street"
                    : "Enter Street"
                }
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={coBorrower.permVillage || ""}
                onChange={(e) =>
                  updateCoBorrowerField(index, "permVillage", e.target.value)
                }
                disabled={!coBorrower.permCountry}
              />
            </div>
          </div>

          {/* Conditional grid - show Thram and House only for Bhutan */}
          {isBhutanCountry(coBorrower.permCountry, countryOptions) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor={`permThram-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Thram No. <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`permThram-${index}`}
                  placeholder="Enter Thram No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.permThram || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "permThram", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`permHouse-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  House No. <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`permHouse-${index}`}
                  placeholder="Enter House No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.permHouse || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "permHouse", e.target.value)
                  }
                />
              </div>
            </div>
          )}

          {/* Document Upload for Non-Bhutan Countries */}
          {coBorrower.permCountry &&
            !isBhutanCountry(coBorrower.permCountry, countryOptions) && (
              <div className="space-y-2.5 border-t pt-4">
                <Label
                  htmlFor={`permAddressProof-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Upload Address Proof Document{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id={`permAddressProof-${index}`}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleFileChange(
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
                    className="w-28 bg-transparent"
                    onClick={() =>
                      document
                        .getElementById(`permAddressProof-${index}`)
                        ?.click()
                    }
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {coBorrower.permAddressProof || "No file chosen"}
                  </span>
                </div>
                {errors.permAddressProof && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.permAddressProof}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Please upload a valid address proof document for non-Bhutan
                  residence. Allowed: PDF, JPG, PNG (Max 5MB)
                </p>
              </div>
            )}
        </div>

        {/* Current/Residential Address */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm mt-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
            Current/Residential Address
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor={`currCountry-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Country of Resident <span className="text-red-500">*</span>
              </Label>
              <Select
                value={coBorrower.currCountry}
                onValueChange={(value) =>
                  updateCoBorrowerField(index, "currCountry", value)
                }
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {countryOptions.length > 0 ? (
                    countryOptions.map((option, optionIndex) => {
                      const key =
                        option.country_pk_code ||
                        option.id ||
                        option.code ||
                        `curr-country-${optionIndex}`;
                      const value = String(
                        option.country_pk_code ||
                        option.id ||
                        option.code ||
                        optionIndex,
                      );
                      const label =
                        option.country ||
                        option.name ||
                        option.label ||
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
                htmlFor={`currDzongkhag-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                {isBhutanCountry(coBorrower.currCountry, countryOptions)
                  ? "Dzongkhag"
                  : "State"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {coBorrower.currCountry &&
                !isBhutanCountry(coBorrower.currCountry, countryOptions) ? (
                <Input
                  id={`currDzongkhag-${index}`}
                  placeholder="Enter State"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.currDzongkhag || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "currDzongkhag",
                      e.target.value,
                    )
                  }
                />
              ) : (
                <Select
                  value={coBorrower.currDzongkhag || ""}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "currDzongkhag", value)
                  }
                  disabled={
                    !isBhutanCountry(coBorrower.currCountry, countryOptions)
                  }
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {coBorrower.currDzongkhag && !dzongkhagOptions.find((o: any) => String(getOptionPkCode(o)) === String(coBorrower.currDzongkhag)) && (
                      <SelectItem value={coBorrower.currDzongkhag}>
                        {resolveLabelByValue(coBorrower.currDzongkhag, dzongkhagOptions) || coBorrower.currDzongkhag}
                      </SelectItem>
                    )}
                    {dzongkhagOptions.length > 0 ? (
                      dzongkhagOptions.map((option, optionIndex) => {
                        const value = getOptionPkCode(option) || String(optionIndex);
                        const label = getOptionLabel(option);

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
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`currGewog-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                {isBhutanCountry(coBorrower.currCountry, countryOptions)
                  ? "Gewog"
                  : "Province"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {coBorrower.currCountry &&
                !isBhutanCountry(coBorrower.currCountry, countryOptions) ? (
                <Input
                  id={`currGewog-${index}`}
                  placeholder="Enter Province"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.currGewog || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "currGewog", e.target.value)
                  }
                />
              ) : (
                <Select
                  value={resolvedCurrGewog}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "currGewog", value)
                  }
                  disabled={
                    !isBhutanCountry(coBorrower.currCountry, countryOptions)
                  }
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                    <SelectValue placeholder="[Select]">
                      {resolvedCurrGewog
                        ? resolveLabelByValue(resolvedCurrGewog, coBorrower.currGewogOptions || [])
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {resolvedCurrGewog && !coBorrower.currGewogOptions?.find((o: any) => String(getOptionPkCode(o)) === String(resolvedCurrGewog)) && (
                      <SelectItem value={resolvedCurrGewog}>
                        {resolveLabelByValue(resolvedCurrGewog, coBorrower.currGewogOptions || []) || resolvedCurrGewog}
                      </SelectItem>
                    )}
                    {coBorrower.currGewogOptions?.length > 0 ? (
                      coBorrower.currGewogOptions.map(
                        (option: any, optionIndex: number) => {
                          const value = getOptionPkCode(option) || String(optionIndex);
                          const label = getOptionLabel(option);

                          return (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          );
                        },
                      )
                    ) : (
                      <SelectItem value="__placeholder__" disabled>
                        {coBorrower.currDzongkhag
                          ? "Loading..."
                          : "Select Dzongkhag first"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`currVillage-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                {isBhutanCountry(coBorrower.currCountry, countryOptions)
                  ? "Village/Street"
                  : "Street"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`currVillage-${index}`}
                placeholder={
                  isBhutanCountry(coBorrower.currCountry, countryOptions)
                    ? "Enter Village/Street"
                    : "Enter Street"
                }
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={coBorrower.currVillage || ""}
                onChange={(e) =>
                  updateCoBorrowerField(index, "currVillage", e.target.value)
                }
                disabled={!coBorrower.currCountry}
              />
            </div>
          </div>

          {/* Conditional grid layout based on country */}
          {isBhutanCountry(coBorrower.currCountry, countryOptions) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor={`currFlat-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  House/Building/ Flat No{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`currFlat-${index}`}
                  placeholder="Enter Flat No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.currFlat || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "currFlat", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`currEmail-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`currEmail-${index}`}
                  type="email"
                  placeholder="Enter Your Email"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.currEmail || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "currEmail", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`currContact-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Contact Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`currContact-${index}`}
                  placeholder="Enter Contact No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.currContact || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "currContact", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`currAlternateContact-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Alternate Contact No
                </Label>
                <Input
                  id={`currAlternateContact-${index}`}
                  placeholder="Enter Contact No"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.currAlternateContact || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "currAlternateContact",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
          )}

          {coBorrower.currCountry &&
            !isBhutanCountry(coBorrower.currCountry, countryOptions) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor={`currEmail-${index}`}
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`currEmail-${index}`}
                    type="email"
                    placeholder="Enter Your Email"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={coBorrower.currEmail || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(index, "currEmail", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor={`currContact-${index}`}
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`currContact-${index}`}
                    placeholder="Enter Contact No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={coBorrower.currContact || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
                        index,
                        "currContact",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor={`currAlternateContact-${index}`}
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Alternate Contact No
                  </Label>
                  <Input
                    id={`currAlternateContact-${index}`}
                    placeholder="Enter Contact No"
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={coBorrower.currAlternateContact || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
                        index,
                        "currAlternateContact",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            )}

          {/* Document Upload for Non-Bhutan Countries */}
          {coBorrower.currCountry &&
            !isBhutanCountry(coBorrower.currCountry, countryOptions) && (
              <div className="space-y-2.5 border-t pt-4">
                <Label
                  htmlFor={`currAddressProof-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Upload Address Proof Document{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id={`currAddressProof-${index}`}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleFileChange(
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
                    className="w-28 bg-transparent"
                    onClick={() =>
                      document
                        .getElementById(`currAddressProof-${index}`)
                        ?.click()
                    }
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {coBorrower.currAddressProof || "No file chosen"}
                  </span>
                </div>
                {errors.currAddressProof && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.currAddressProof}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Please upload a valid address proof document for non-Bhutan
                  residence. Allowed: PDF, JPG, PNG (Max 5MB)
                </p>
              </div>
            )}
        </div>

        {/* PEP Declaration - UPDATED SECTION */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm mt-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
            PEP Declaration
          </h2>

          {/* SELF PEP Question */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 border-b pb-6">
            <div className="space-y-2.5">
              <Label
                htmlFor={`pepPerson-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Politically Exposed Person
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={coBorrower.pepPerson}
                onValueChange={(value) =>
                  updateCoBorrowerField(index, "pepPerson", value)
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

            {coBorrower.pepPerson === "yes" && (
              <>
                <div className="space-y-2.5">
                  <Label
                    htmlFor={`pepCategory-${index}`}
                    className="text-gray-800 font-semibold text-sm"
                  >
                    PEP Category<span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={coBorrower.pepCategory}
                    onValueChange={(value) =>
                      updateCoBorrowerField(index, "pepCategory", value)
                    }
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {pepCategoryOptions.length > 0 ? (
                        pepCategoryOptions.map((option, optionIndex) => {
                          const key =
                            option.pep_category_pk_code ||
                            option.id ||
                            option.code ||
                            `pep-cat-${optionIndex}`;
                          const value = String(
                            option.pep_category_pk_code ||
                            option.id ||
                            option.code ||
                            optionIndex,
                          );
                          const label =
                            option.pep_category ||
                            option.name ||
                            option.label ||
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
                    htmlFor={`pepSubCategory-${index}`}
                    className="text-gray-800 font-semibold text-sm"
                  >
                    PEP Sub Category<span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={coBorrower.pepSubCategory}
                    onValueChange={(value) =>
                      updateCoBorrowerField(index, "pepSubCategory", value)
                    }
                    disabled={!coBorrower.pepCategory}
                  >
                    <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4}>
                      {coBorrower.pepSubCategoryOptions?.length > 0 ? (
                        coBorrower.pepSubCategoryOptions.map(
                          (option: any, optionIndex: number) => {
                            const key =
                              option.pep_sub_category_pk_code ||
                              option.id ||
                              option.code ||
                              `pep-sub-${optionIndex}`;
                            const value = String(
                              option.pep_sub_category_pk_code ||
                              option.id ||
                              option.code ||
                              optionIndex,
                            );
                            const label =
                              option.pep_sub_category ||
                              option.name ||
                              option.label ||
                              "Unknown";

                            return (
                              <SelectItem key={key} value={value}>
                                {label}
                              </SelectItem>
                            );
                          },
                        )
                      ) : (
                        <SelectItem value="loading" disabled>
                          {coBorrower.pepCategory
                            ? "Loading..."
                            : "Select Category first"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* RELATED PEP Question */}
          {coBorrower.pepPerson === "no" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pt-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor={`pepRelated-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Are you related to any PEP?
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={coBorrower.pepRelated}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "pepRelated", value)
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
            </div>
          )}

          {/* RELATED PEP MULTIPLE ENTRIES */}
          {coBorrower.pepPerson === "no" && coBorrower.pepRelated === "yes" && (
            <div className="space-y-8 pt-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-lg font-bold text-[#003DA5]">
                  Related PEP Details
                </h3>
              </div>

              {relatedPeps.map((pep: any, pepIndex: number) => {
                const resolvedPepPermGewog = findPkCodeByLabel(pep.permGewog, coBorrower.relatedPepPermGewogMap?.[pepIndex] || [], ["gewog", "gewog_name", "gewogName", "name", "label"]) || pep.permGewog || "";
                const resolvedPepCurrGewog = findPkCodeByLabel(pep.currGewog, coBorrower.relatedPepCurrGewogMap?.[pepIndex] || [], ["gewog", "gewog_name", "gewogName", "name", "label"]) || pep.currGewog || "";

                return (
                  <div
                    key={pepIndex}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-6 relative shadow-sm"
                  >
                    {/* Remove Button */}
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-md font-bold text-gray-700">
                        Person {pepIndex + 1}
                      </span>
                      {relatedPeps.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRelatedPep(index, pepIndex)}
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
                      {/* 1. Relationship Field */}
                      <div className="space-y-2.5 w-full">
                        <Label className="text-gray-800 font-semibold text-sm">
                          Relationship <span className="text-destructive">*</span>
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
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 2. PEP Category Field */}
                      <div className="space-y-2.5 w-full">
                        <Label className="text-gray-800 font-semibold text-sm">
                          PEP Category <span className="text-destructive">*</span>
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
                            {pepCategoryOptions.length > 0 ? (
                              pepCategoryOptions.map((option, optionIndex) => {
                                const key =
                                  option.pep_category_pk_code ||
                                  option.id ||
                                  option.code ||
                                  `pep-cat-${optionIndex}`;
                                const value = String(
                                  option.pep_category_pk_code ||
                                  option.id ||
                                  option.code ||
                                  optionIndex,
                                );
                                const label =
                                  option.pep_category ||
                                  option.name ||
                                  option.label ||
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

                      {/* 3. PEP Sub Category Field */}
                      <div className="space-y-2.5 w-full">
                        <Label className="text-gray-800 font-semibold text-sm">
                          PEP Sub Category
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
                            {coBorrower.relatedPepOptionsMap?.[pepIndex]?.length >
                              0 ? (
                              coBorrower.relatedPepOptionsMap[pepIndex].map(
                                (option: any, optionIndex: number) => {
                                  const key =
                                    option.pep_sub_category_pk_code ||
                                    option.id ||
                                    option.code ||
                                    `pep-rel-sub-${optionIndex}`;
                                  const value = String(
                                    option.pep_sub_category_pk_code ||
                                    option.id ||
                                    option.code ||
                                    optionIndex,
                                  );
                                  const label =
                                    option.pep_sub_category ||
                                    option.name ||
                                    option.label ||
                                    "Unknown";
                                  return (
                                    <SelectItem key={key} value={value}>
                                      {label}
                                    </SelectItem>
                                  );
                                },
                              )
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

                      {/* 4. Identification Proof */}
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
                                .getElementById(`uploadId-${index}-${pepIndex}`)
                                ?.click()
                            }
                          >
                            Choose File
                          </Button>
                          <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                            {pep.identificationProof || "No file chosen"}
                          </span>
                        </div>
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
                          <SelectContent sideOffset={4}>
                            {filteredIdentificationOptions.map((opt, i) => (
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
                          Salutation <span className="text-red-500">*</span>
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
                          <SelectContent sideOffset={4}>
                            {pep.salutation && !["mr", "mrs", "ms", "dr"].includes(String(pep.salutation).toLowerCase()) && (
                              <SelectItem value={pep.salutation}>{pep.salutation}</SelectItem>
                            )}
                            <SelectItem value="mr">Mr.</SelectItem>
                            <SelectItem value="mrs">Mrs.</SelectItem>
                            <SelectItem value="ms">Ms.</SelectItem>
                            <SelectItem value="dr">Dr.</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-sm">
                          Applicant Name <span className="text-red-500">*</span>
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
                          Nationality <span className="text-red-500">*</span>
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
                          <SelectContent sideOffset={4}>
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
                          <SelectContent sideOffset={4}>
                            {pep.gender && !["male", "female", "other"].includes(String(pep.gender).toLowerCase()) && (
                              <SelectItem value={pep.gender}>{pep.gender}</SelectItem>
                            )}
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
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
                          Date of Birth <span className="text-red-500">*</span>
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
                          <SelectContent sideOffset={4}>
                            {personalIncomeTaxOptions.length > 0 ? (
                              personalIncomeTaxOptions.map((option, idx) => {
                                const value = String(
                                  option.tax_identifier_type_pk_code || option.id || option.code || idx
                                );
                                const label = option.tax_identifier_type || option.name || option.label || "Unknown";
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
                          Marital Status <span className="text-red-500">*</span>
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
                          <SelectContent sideOffset={4}>
                            {maritalStatusOptions.map((opt, i) => (
                              <SelectItem
                                key={i}
                                value={String(
                                  opt.marital_status_pk_code || opt.id || i,
                                )}
                              >
                                {opt.marital_status || opt.name || "Unknown"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

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
                                    opt.country_pk_code || opt.id || i,
                                  )}
                                >
                                  {opt.country || opt.name || "Unknown"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                                !isBhutanCountry(pep.permCountry, countryOptions)
                              }
                            >
                              <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                <SelectValue placeholder="[Select]" />
                              </SelectTrigger>
                              <SelectContent sideOffset={4}>
                                {pep.permDzongkhag && !dzongkhagOptions.find((o: any) => String(getOptionPkCode(o)) === String(pep.permDzongkhag)) && (
                                  <SelectItem value={pep.permDzongkhag}>
                                    {resolveLabelByValue(pep.permDzongkhag, dzongkhagOptions) || pep.permDzongkhag}
                                  </SelectItem>
                                )}
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
                              value={resolvedPepPermGewog}
                              onValueChange={(value) =>
                                handleRelatedPepChange(
                                  index,
                                  pepIndex,
                                  "permGewog",
                                  value,
                                )
                              }
                              disabled={
                                !isBhutanCountry(pep.permCountry, countryOptions)
                              }
                            >
                              <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                <SelectValue placeholder="[Select]" />
                              </SelectTrigger>
                              <SelectContent sideOffset={4}>
                                {resolvedPepPermGewog && !coBorrower.relatedPepPermGewogMap?.[pepIndex]?.find((o: any) => String(getOptionPkCode(o)) === String(resolvedPepPermGewog)) && (
                                  <SelectItem value={resolvedPepPermGewog}>
                                    {resolveLabelByValue(resolvedPepPermGewog, coBorrower.relatedPepPermGewogMap?.[pepIndex] || []) || resolvedPepPermGewog}
                                  </SelectItem>
                                )}
                                {coBorrower.relatedPepPermGewogMap?.[pepIndex]
                                  ?.length > 0 ? (
                                  coBorrower.relatedPepPermGewogMap[pepIndex].map(
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
                                    {pep.permDzongkhag
                                      ? "Loading..."
                                      : "Select Dzongkhag first"}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
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

                        {isBhutanCountry(pep.permCountry, countryOptions) && (
                          <>
                            <div className="space-y-2.5">
                              <Label className="text-gray-800 font-semibold text-sm">
                                Thram No. <span className="text-red-500">*</span>
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
                                House No. <span className="text-red-500">*</span>
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
                        !isBhutanCountry(pep.permCountry, countryOptions) && (
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
                                {pep.permAddressProof || "No file chosen"}
                              </span>
                            </div>
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
                                    opt.country_pk_code || opt.id || i,
                                  )}
                                >
                                  {opt.country || opt.name || "Unknown"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                                !isBhutanCountry(pep.currCountry, countryOptions)
                              }
                            >
                              <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                <SelectValue placeholder="[Select]" />
                              </SelectTrigger>
                              <SelectContent sideOffset={4}>
                                {pep.currDzongkhag && !dzongkhagOptions.find((o: any) => String(getOptionPkCode(o)) === String(pep.currDzongkhag)) && (
                                  <SelectItem value={pep.currDzongkhag}>
                                    {resolveLabelByValue(pep.currDzongkhag, dzongkhagOptions) || pep.currDzongkhag}
                                  </SelectItem>
                                )}
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
                              value={resolvedPepCurrGewog}
                              onValueChange={(value) =>
                                handleRelatedPepChange(
                                  index,
                                  pepIndex,
                                  "currGewog",
                                  value,
                                )
                              }
                              disabled={
                                !isBhutanCountry(pep.currCountry, countryOptions)
                              }
                            >
                              <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                                <SelectValue placeholder="[Select]" />
                              </SelectTrigger>
                              <SelectContent sideOffset={4}>
                                {resolvedPepCurrGewog && !coBorrower.relatedPepCurrGewogMap?.[pepIndex]?.find((o: any) => String(getOptionPkCode(o)) === String(resolvedPepCurrGewog)) && (
                                  <SelectItem value={resolvedPepCurrGewog}>
                                    {resolveLabelByValue(resolvedPepCurrGewog, coBorrower.relatedPepCurrGewogMap?.[pepIndex] || []) || resolvedPepCurrGewog}
                                  </SelectItem>
                                )}
                                {coBorrower.relatedPepCurrGewogMap?.[pepIndex]
                                  ?.length > 0 ? (
                                  coBorrower.relatedPepCurrGewogMap[pepIndex].map(
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
                                    {pep.currDzongkhag
                                      ? "Loading..."
                                      : "Select Dzongkhag first"}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
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

                        {isBhutanCountry(pep.currCountry, countryOptions) && (
                          <div className="space-y-2.5">
                            <Label className="text-gray-800 font-semibold text-sm">
                              Flat No. <span className="text-red-500">*</span>
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
                        !isBhutanCountry(pep.currCountry, countryOptions) && (
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
                                {pep.currAddressProof || "No file chosen"}
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
                            Email <span className="text-red-500">*</span>
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
                            Contact No. <span className="text-red-500">*</span>
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
                );
              })}

              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddRelatedPep(index)}
                className="w-full sm:w-auto border-dashed border-2 border-gray-300 text-gray-600 hover:border-[#003DA5] hover:text-[#003DA5]"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Another Related PEP
              </Button>
            </div>
          )}
        </div>

        {/* Employment Status */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm mt-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
            Employment Status
          </h2>

          <div className="space-y-4">
            <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
              Employment Status <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={coBorrower.employmentStatus}
              onValueChange={(value) =>
                updateCoBorrowerField(index, "employmentStatus", value)
              }
              className="flex flex-col sm:flex-row gap-3 sm:gap-6 md:gap-8"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employed" id={`employed-${index}`} />
                <Label
                  htmlFor={`employed-${index}`}
                  className="font-normal cursor-pointer text-sm"
                >
                  Employed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unemployed" id={`unemployed-${index}`} />
                <Label
                  htmlFor={`unemployed-${index}`}
                  className="font-normal cursor-pointer text-sm"
                >
                  Unemployed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="self-employed"
                  id={`self-employed-${index}`}
                />
                <Label
                  htmlFor={`self-employed-${index}`}
                  className="font-normal cursor-pointer text-sm"
                >
                  Self-employed
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Employment Details */}
        {coBorrower.employmentStatus === "employed" && (
          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm mt-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
              Employment Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor={`employeeId-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Employee ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`employeeId-${index}`}
                  placeholder="Enter ID"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.employeeId || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "employeeId", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2.5">
                <Label
                  htmlFor={`occupation-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Occupation <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={resolvedOccupation}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "occupation", value)
                  }
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {coBorrower.occupation && !occupationOptions.find(o => String(o.occ_pk_code || o.occupation_pk_code || o.id) === resolvedOccupation) && (
                      <SelectItem value={resolvedOccupation}>{coBorrower.occupation}</SelectItem>
                    )}
                    {occupationOptions.length > 0 ? (
                      occupationOptions.map((option, optionIndex) => {
                        const key =
                          option.occ_pk_code ||
                          option.occupation_pk_code ||
                          option.id ||
                          `occupation-${optionIndex}`;
                        const value = String(
                          option.occ_pk_code ||
                          option.occupation_pk_code ||
                          option.id ||
                          optionIndex,
                        );
                        const label =
                          option.occ_name ||
                          option.occupation ||
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
                  htmlFor={`employerType-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Type of Employer <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={coBorrower.employerType}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "employerType", value)
                  }
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
                <Label
                  htmlFor={`designation-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Designation <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={coBorrower.designation}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "designation", value)
                  }
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {coBorrower.designation && !["manager", "officer", "assistant"].includes(String(coBorrower.designation).toLowerCase()) && (
                      <SelectItem value={coBorrower.designation}>{coBorrower.designation}</SelectItem>
                    )}
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="officer">Officer</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`grade-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Grade <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={coBorrower.grade}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "grade", value)
                  }
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {coBorrower.grade && !["p1", "p2", "p3"].includes(String(coBorrower.grade).toLowerCase()) && (
                      <SelectItem value={coBorrower.grade}>{coBorrower.grade}</SelectItem>
                    )}
                    <SelectItem value="p1">P1</SelectItem>
                    <SelectItem value="p2">P2</SelectItem>
                    <SelectItem value="p3">P3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`organizationName-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Organization Name <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={resolvedOrganization}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "organizationName", value)
                  }
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {coBorrower.organizationName && !organizationOptions.find(o => String(o.lgal_constitution_pk_code || o.legal_const_pk_code || o.id) === resolvedOrganization) && (
                      <SelectItem value={resolvedOrganization}>{coBorrower.organizationName}</SelectItem>
                    )}
                    {organizationOptions.length > 0 ? (
                      organizationOptions.map((option, optionIndex) => {
                        const key =
                          option.lgal_constitution_pk_code ||
                          option.legal_const_pk_code ||
                          option.id ||
                          `org-${optionIndex}`;
                        const value = String(
                          option.lgal_constitution_pk_code ||
                          option.legal_const_pk_code ||
                          option.id ||
                          optionIndex,
                        );
                        const label =
                          option.lgal_constitution ||
                          option.legal_const_name ||
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
                  htmlFor={`orgLocation-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Organization Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`orgLocation-${index}`}
                  placeholder="Enter Location"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.orgLocation || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "orgLocation", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`joiningDate-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Service Joining Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  id={`joiningDate-${index}`}
                  max={today}
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.joiningDate || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "joiningDate", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor={`serviceNature-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Nature of Service <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={coBorrower.serviceNature}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "serviceNature", value)
                  }
                >
                  <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent sideOffset={4}>
                    {coBorrower.serviceNature && !["permanent", "contract", "temporary"].includes(String(coBorrower.serviceNature).toLowerCase()) && (
                      <SelectItem value={coBorrower.serviceNature}>{coBorrower.serviceNature}</SelectItem>
                    )}
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor={`annualSalary-${index}`}
                  className="text-gray-800 font-semibold text-sm"
                >
                  Gross Annual Salary Income{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  id={`annualSalary-${index}`}
                  placeholder="Enter Annual Salary"
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={coBorrower.annualSalary || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "annualSalary", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Contract End Date - Only visible when Nature of Service is Contract */}
            {coBorrower.serviceNature === "contract" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor={`contractEndDate-${index}`}
                    className="text-gray-800 font-semibold text-sm"
                  >
                    Contract End Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    id={`contractEndDate-${index}`}
                    min={today}
                    className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                    value={coBorrower.contractEndDate || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
                        index,
                        "contractEndDate",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Spouse Details - Moved here after Employment Details */}
        {isMarried && (
          <div className="mt-8 border-t pt-8 space-y-6">
            <h3 className="text-lg font-bold text-[#003DA5] mb-4">
              Spouse Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Identification Type{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={coBorrower.spouseIdentificationType}
                  onValueChange={(value) =>
                    updateCoBorrowerField(
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
                    {filteredIdentificationOptions.map((opt, i) => (
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
                  value={coBorrower.spouseIdentificationNo || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "spouseIdentificationNo",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Salutation <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={coBorrower.spouseSalutation}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "spouseSalutation", value)
                  }
                >
                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    {coBorrower.spouseSalutation && !["mr", "mrs", "ms", "dr"].includes(String(coBorrower.spouseSalutation).toLowerCase()) && (
                      <SelectItem value={coBorrower.spouseSalutation}>{coBorrower.spouseSalutation}</SelectItem>
                    )}
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
                  value={coBorrower.spouseName || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "spouseName", e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Nationality <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={coBorrower.spouseNationality}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "spouseNationality", value)
                  }
                >
                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    {nationalityOptions.map((opt, i) => (
                      <SelectItem
                        key={i}
                        value={String(opt.nationality_pk_code || opt.id || i)}
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
                  value={coBorrower.spouseGender}
                  onValueChange={(value) =>
                    updateCoBorrowerField(index, "spouseGender", value)
                  }
                >
                  <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                    <SelectValue placeholder="[Select]" />
                  </SelectTrigger>
                  <SelectContent>
                    {coBorrower.spouseGender && !["male", "female", "other"].includes(String(coBorrower.spouseGender).toLowerCase()) && (
                      <SelectItem value={coBorrower.spouseGender}>{coBorrower.spouseGender}</SelectItem>
                    )}
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse ID Issue Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  max={today}
                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                  value={coBorrower.spouseIdentificationIssueDate || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "spouseIdentificationIssueDate",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse ID Expiry Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  min={today}
                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                  value={coBorrower.spouseIdentificationExpiryDate || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "spouseIdentificationExpiryDate",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Tax Identifier Type
                </Label>
                <Select
                  value={coBorrower.spouseTaxIdentifierType}
                  onValueChange={(value) =>
                    updateCoBorrowerField(
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
                    {personalIncomeTaxOptions.length > 0 ? (
                      personalIncomeTaxOptions.map((option, idx) => {
                        const value = String(
                          option.tax_identifier_type_pk_code || option.id || option.code || idx
                        );
                        const label = option.tax_identifier_type || option.name || option.label || "Unknown";
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
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse TPN No
                </Label>
                <Input
                  placeholder="Enter TPN"
                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                  value={coBorrower.spouseTpn || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(index, "spouseTpn", e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                  Spouse Date of Birth <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  max={maxDobDate}
                  className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                  value={coBorrower.spouseDateOfBirth || ""}
                  onChange={(e) =>
                    updateCoBorrowerField(
                      index,
                      "spouseDateOfBirth",
                      e.target.value,
                    )
                  }
                />
              </div>

              {isNatBhutanese(coBorrower.spouseNationality) && (
                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                    Spouse Household Number{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Enter Household Number"
                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                    value={coBorrower.spouseHouseholdNumber || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
                        index,
                        "spouseHouseholdNumber",
                        e.target.value,
                      )
                    }
                  />
                </div>
              )}
            </div>

            {/* NEW: Spouse Identification Proof Upload */}
            <div className="space-y-2.5 pt-4">
              <Label
                htmlFor={`spouseIdProof-${index}`}
                className="text-gray-800 font-semibold text-sm"
              >
                Upload Spouse Identification Proof Document{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id={`spouseIdProof-${index}`}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    handleFileChange(
                      index,
                      "spouseIdProofDocument",
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
                    document.getElementById(`spouseIdProof-${index}`)?.click()
                  }
                >
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground">
                  {coBorrower.spouseIdProofDocument || "No file chosen"}
                </span>
              </div>
              {errors.spouseIdProofDocument && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.spouseIdProofDocument}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Allowed: PDF, JPG, PNG (Max 5MB)
              </p>
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
                    value={coBorrower.spousePermCountry}
                    onValueChange={(value) =>
                      updateCoBorrowerField(index, "spousePermCountry", value)
                    }
                  >
                    <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((opt, i) => (
                        <SelectItem
                          key={i}
                          value={String(opt.country_pk_code || opt.id || i)}
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
                      coBorrower.spousePermCountry,
                      countryOptions,
                    )
                      ? "Spouse Dzongkhag"
                      : "Spouse State"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  {coBorrower.spousePermCountry &&
                    !isBhutanCountry(
                      coBorrower.spousePermCountry,
                      countryOptions,
                    ) ? (
                    <Input
                      placeholder="Enter State"
                      className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                      value={coBorrower.spousePermDzongkhag || ""}
                      onChange={(e) =>
                        updateCoBorrowerField(
                          index,
                          "spousePermDzongkhag",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <Select
                      value={coBorrower.spousePermDzongkhag || ""}
                      onValueChange={(value) =>
                        updateCoBorrowerField(
                          index,
                          "spousePermDzongkhag",
                          value,
                        )
                      }
                      disabled={
                        !isBhutanCountry(
                          coBorrower.spousePermCountry,
                          countryOptions,
                        )
                      }
                    >
                      <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent>
                        {coBorrower.spousePermDzongkhag && !dzongkhagOptions.find((o: any) => String(getOptionPkCode(o)) === String(coBorrower.spousePermDzongkhag)) && (
                          <SelectItem value={coBorrower.spousePermDzongkhag}>
                            {resolveLabelByValue(coBorrower.spousePermDzongkhag, dzongkhagOptions) || coBorrower.spousePermDzongkhag}
                          </SelectItem>
                        )}
                        {dzongkhagOptions.map((opt, i) => {
                          const value = getOptionPkCode(opt) || String(i);
                          const label = getOptionLabel(opt);
                          return (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                    {isBhutanCountry(
                      coBorrower.spousePermCountry,
                      countryOptions,
                    )
                      ? "Spouse Gewog"
                      : "Spouse Province"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  {coBorrower.spousePermCountry &&
                    !isBhutanCountry(
                      coBorrower.spousePermCountry,
                      countryOptions,
                    ) ? (
                    <Input
                      placeholder="Enter Province"
                      className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                      value={coBorrower.spousePermGewog || ""}
                      onChange={(e) =>
                        updateCoBorrowerField(
                          index,
                          "spousePermGewog",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <Select
                      value={resolvedSpousePermGewog}
                      onValueChange={(value) =>
                        updateCoBorrowerField(index, "spousePermGewog", value)
                      }
                      disabled={
                        !isBhutanCountry(
                          coBorrower.spousePermCountry,
                          countryOptions,
                        )
                      }
                    >
                      <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm">
                        <SelectValue placeholder="[Select]">
                          {resolvedSpousePermGewog
                            ? resolveLabelByValue(resolvedSpousePermGewog, coBorrower.spousePermGewogOptions || [])
                            : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {resolvedSpousePermGewog && !coBorrower.spousePermGewogOptions?.find((o: any) => String(getOptionPkCode(o)) === String(resolvedSpousePermGewog)) && (
                          <SelectItem value={resolvedSpousePermGewog}>
                            {resolveLabelByValue(resolvedSpousePermGewog, coBorrower.spousePermGewogOptions || []) || resolvedSpousePermGewog}
                          </SelectItem>
                        )}
                        {coBorrower.spousePermGewogOptions?.length > 0 ? (
                          coBorrower.spousePermGewogOptions.map(
                            (option: any, optionIndex: number) => {
                              const value = getOptionPkCode(option) || String(optionIndex);
                              const label = getOptionLabel(option);
                              return (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              );
                            },
                          )
                        ) : (
                          <SelectItem value="__placeholder__" disabled>
                            {coBorrower.spousePermDzongkhag
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
                      coBorrower.spousePermCountry,
                      countryOptions,
                    )
                      ? "Spouse Village/Street"
                      : "Spouse Street"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder={
                      isBhutanCountry(
                        coBorrower.spousePermCountry,
                        countryOptions,
                      )
                        ? "Enter Village/Street"
                        : "Enter Street"
                    }
                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                    value={coBorrower.spousePermVillage || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
                        index,
                        "spousePermVillage",
                        e.target.value,
                      )
                    }
                    disabled={!coBorrower.spousePermCountry}
                  />
                </div>

                {isBhutanCountry(
                  coBorrower.spousePermCountry,
                  countryOptions,
                ) && (
                    <>
                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                          Spouse Thram No. <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Enter Thram No"
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                          value={coBorrower.spousePermThram || ""}
                          onChange={(e) =>
                            updateCoBorrowerField(
                              index,
                              "spousePermThram",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                          Spouse House No. <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Enter House No"
                          className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                          value={coBorrower.spousePermHouse || ""}
                          onChange={(e) =>
                            updateCoBorrowerField(
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

              {coBorrower.spousePermCountry &&
                !isBhutanCountry(
                  coBorrower.spousePermCountry,
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
                            .getElementById(`spousePermAddressProof-${index}`)
                            ?.click()
                        }
                      >
                        Choose File
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {coBorrower.spousePermAddressProof || "No file chosen"}
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
                    value={coBorrower.spouseEmail || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
                        index,
                        "spouseEmail",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2.5">
                  <Label className="text-gray-800 font-semibold text-xs sm:text-sm">
                    Spouse Contact No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Enter Contact Number"
                    className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm"
                    value={coBorrower.spouseContact || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
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
                    value={coBorrower.spouseAlternateContact || ""}
                    onChange={(e) =>
                      updateCoBorrowerField(
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
        )
        }
      </div >
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Render all co-borrowers */}
      {coBorrowers.map((coBorrower, index) =>
        renderCoBorrowerForm(coBorrower, index),
      )}

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
  );
}