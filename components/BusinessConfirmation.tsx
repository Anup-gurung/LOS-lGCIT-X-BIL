"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Users,
  UserCheck,
  Loader2,
  FileText,
  ExternalLink
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
  fetchIndustryClassification,
  fetchTaxIdentifierType,
} from "@/services/api";

// Import IndexedDB helper to retrieve files
import { getFile } from "@/lib/indexDB";

/* ----------------------- Types ----------------------- */

interface ConfirmationProps {
  onNext: (data: any) => void;
  onBack: () => void;
  formData: any; // full session data

  // Optional function to route the user back to a specific step
  onEditStep?: (stepId: number) => void;

  // Optional props for loan dropdown options (if needed for other sections)
  loanTypeOptions?: any[];
  loanSectorOptions?: any[];
  loanSubSectorOptions?: any[];
  loanSubSectorCategoryOptions?: any[];
}

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

/**
 * Finds the label for a given PK Code/Value from an options array.
 * Scans comprehensively across typical API return structures.
 */
const getOptionLabel = (options: any[], value: any) => {
  if (!value || !options || options.length === 0) return value || "";

  const lookupValue = String(value).split("-")[0].trim().toLowerCase();

  const option = options.find((opt) => {
    // Scan all possible ID keys returned by various APIs
    const optId = String(
      opt.bank_pk_code || opt.country_pk_code || opt.nationality_pk_code ||
      opt.identity_type_pk_code || opt.identification_type_pk_code ||
      opt.marital_status_pk_code || opt.occupation_pk_code || opt.occ_pk_code ||
      opt.lgal_constitution_pk_code || opt.dzongkhag_pk_code || opt.gewog_pk_code ||
      opt.curr_gewog_pk_code || opt.pk_gewog_id || opt.pep_category_pk_code ||
      opt.pep_sub_category_pk_code || opt.tax_identifier_type_pk_code ||
      opt.industry_classification_pk_code || opt.pk_code || opt.id || opt.code || ""
    ).trim().toLowerCase();

    // Also check if it's already matching a label (fallback)
    const optLabelPrimary = String(opt.name || opt.label || "").trim().toLowerCase();
    const optLabelSecondary = String(
      opt.country_name || opt.country || opt.dzongkhag_name || opt.dzongkhag ||
      opt.gewog_name || opt.gewog || opt.identity_type || opt.identification_type ||
      opt.bank_name || opt.bank || opt.marital_status || opt.nationality ||
      opt.occ_name || opt.occupation || opt.lgal_constitution || opt.pep_category ||
      opt.pep_sub_category || opt.tax_identifier_type || opt.industry_classification || ""
    ).trim().toLowerCase();

    return optId === lookupValue || optLabelPrimary === lookupValue || optLabelSecondary === lookupValue;
  });

  if (option) {
    return (
      option.name || option.label || option.country_name || option.country ||
      option.dzongkhag_name || option.dzongkhag || option.gewog_name || option.gewog ||
      option.identity_type || option.identification_type || option.bank_name || option.bank ||
      option.marital_status || option.nationality || option.occ_name || option.occupation ||
      option.lgal_constitution || option.pep_category || option.pep_sub_category ||
      option.tax_identifier_type || option.industry_classification || value
    );
  }

  return value;
};

// --- Deep Merge Utility ---
function isObject(item: any) {
  return item && typeof item === "object" && !Array.isArray(item);
}

function deepMerge(target: any, source: any) {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        if (source[key] !== undefined) {
          Object.assign(output, { [key]: source[key] });
        }
      }
    });
  }
  return output;
}

/* -------------------- Main Page ---------------------- */

export function BusinessConfirmation({
  onNext,
  onBack,
  formData,
  onEditStep,
  loanTypeOptions = [],
  loanSectorOptions = [],
  loanSubSectorOptions = [],
  loanSubSectorCategoryOptions = [],
}: ConfirmationProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- Enhanced Session Storage & Hydration ----------
  const SESSION_STORAGE_KEY = "businessLoanApplicationData";
  const [loadedFormData, setLoadedFormData] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Always attempt to load the full structured data from session.
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setLoadedFormData(parsed);
        }
      } catch (e) {
        console.error("Failed to parse stored data", e);
      }
    }
    setIsHydrated(true);
  }, [formData]);

  const effectiveFormData = useMemo(() => {
    const sessionData = loadedFormData || {};
    const propData = formData || {};

    // Safely deep merge the live props with the Session Storage payload
    if (Object.keys(propData).length === 0) return sessionData;
    if (Object.keys(sessionData).length === 0) return propData;

    return deepMerge(sessionData, propData);
  }, [formData, loadedFormData]);

  // ---------- Extract all data from the effective session ----------
  const session = effectiveFormData;

  // --- Loan details ---
  const loanData = {
    loanTypeString: session.loanTypeString || "",
    loanSectorString: session.loanSectorString || "",
    loanSubSectorString: session.loanSubSectorString || "",
    loanSubSectorCategoryString: session.loanSubSectorCategoryString || "",
    loanAmount: session.loanAmount || session.loanData?.loanAmount || "",
    loanPurpose: session.loanPurpose || session.loanData?.loanPurpose || "",
    interestRate: session.interestRate || session.loanData?.interestRate || "",
    tenure: session.selectedMonths || session.tenure || "",
  };

  // Business details (inside businessDetail)
  const businessDetail = session.businessDetail || {};
  const businessAddress = businessDetail.businessAddress || {};

  const businessData = {
    businessName: businessDetail.businessName || "",
    establishmentDate: businessDetail.establishmentDate || "",
    industryClassification: businessDetail.industryClassification || "",
    identificationType:
      session.identificationType || businessDetail.identificationType || "",
    identificationNumber:
      session.identificationNumber || businessDetail.identificationNumber || "",
    identificationIssueDate:
      session.identificationIssueDate ||
      businessDetail.identificationIssueDate ||
      "",
    identificationExpiryDate:
      session.identificationExpiryDate ||
      businessDetail.identificationExpiryDate ||
      "",
    identificationProofFileName:
      session.identificationProofFileName ||
      businessDetail.identificationProofFileName ||
      "",
    identificationProofFileId:
      session.identificationProofFileId ||
      businessDetail.identificationProofFileId ||
      "",
    taxIdentifierType:
      session.taxIdentifierType || businessDetail.taxIdentifierType || "",
    taxIdentifierNumber:
      session.taxIdentifierNumber || businessDetail.taxIdentifierNumber || "",
    bankCurrentAccountNumber:
      session.bankCurrentAccountNumber ||
      businessDetail.bankCurrentAccountNumber ||
      "",
    bankSavingAccountNumber:
      session.bankSavingAccountNumber ||
      businessDetail.bankSavingAccountNumber ||
      "",
    nameOfBank: session.nameOfBank || businessDetail.nameOfBank || "",
    grossAnnualIncome: businessDetail.grossAnnualIncome || "",
    businessType: businessDetail.businessType || "",
  };

  // Owner data (primary applicant) – normalize all field names with additional fallbacks
  const rawOwner = session.ownerData || {};
  const ownerData = {
    identificationType:
      rawOwner.idType ||
      rawOwner.identificationType ||
      session.identificationType ||
      "",
    identificationNo:
      rawOwner.idNumber ||
      rawOwner.identificationNo ||
      session.identificationNumber ||
      "",
    identificationIssueDate:
      rawOwner.identificationIssueDate ||
      rawOwner.idIssueDate ||
      session.identificationIssueDate ||
      "",
    identificationExpiryDate:
      rawOwner.identificationExpiryDate ||
      rawOwner.idExpiryDate ||
      session.identificationExpiryDate ||
      "",
    salutation: rawOwner.salutation || "",
    applicantName:
      rawOwner.applicantName ||
      rawOwner.fullName ||
      session.applicantName ||
      "",
    nationality: rawOwner.nationality || session.nationality || "",
    taxIdentifierType: rawOwner.taxIdentifierType || session.taxIdentifierType || "",
    householdNumber: rawOwner.householdNumber || session.householdNumber || "",
    gender: rawOwner.gender || session.gender || "",
    dateOfBirth: rawOwner.dateOfBirth || session.dateOfBirth || "",
    tpn: rawOwner.tpn || rawOwner.tpnNumber || session.tpn || "",
    maritalStatus: rawOwner.maritalStatus || session.maritalStatus || "",
    shareholdingPercent: rawOwner.shareholdingPercent || "",

    // Spouse
    spouseIdentificationNo:
      rawOwner.spouseid ||
      rawOwner.spouseId ||
      rawOwner.spouseIdentificationNo ||
      rawOwner.spouseCid ||
      session.spouseid ||
      session.spouseId ||
      session.spouseIdentificationNo ||
      session.spouseCid ||
      "",
    spouseName: rawOwner.spouseName || session.spouseName || "",
    spouseContact: rawOwner.spouseContact || rawOwner.spouseCurrContact || session.spouseContact || session.spouseCurrContact || "",
    spouseDateOfBirth: rawOwner.spouseDateOfBirth || rawOwner.spouseDob || session.spouseDateOfBirth || session.spouseDob || "",
    spouseSalutation: rawOwner.spouseSalutation || "",
    spouseGender: rawOwner.spouseGender || "",
    spouseNationality: rawOwner.spouseNationality || "",
    spouseTaxIdentifierType: rawOwner.spouseTaxIdentifierType || "",
    spouseHouseholdNumber: rawOwner.spouseHouseholdNumber || "",
    spouseTpnNumber:
      rawOwner.spousetpnnumber ||
      rawOwner.spousetpnNumber ||
      rawOwner.spouseTpnNumber ||
      rawOwner.spouseTpn ||
      rawOwner.spouseTpnNo ||
      session.spousetpnnumber ||
      session.spousetpnNumber ||
      session.spouseTpnNumber ||
      "",

    // File names mapping fallback & their IDs
    familyTreeName: rawOwner.familyTreeName || rawOwner.familyTree || "",
    familyTreeId: rawOwner.familyTreeId || session.familyTreeId || "",

    passportPhotoName: rawOwner.passportPhotoName || rawOwner.passportPhoto || "",
    passportPhotoId: rawOwner.passportPhotoId || session.passportPhotoId || "",

    // Include both identificationProof and identityProof
    identificationProofName: rawOwner.identificationProofName || rawOwner.identificationProof || rawOwner.idProof || rawOwner.identityProofName || "",
    identificationProofId: rawOwner.identificationProofId || rawOwner.idProofId || session.identificationProofId || rawOwner.identityProof || "",

    pepUploadName: rawOwner.pepUploadName || rawOwner.pepUpload || "",
    pepUploadId: rawOwner.pepUploadId || session.pepUploadId || "",

    permAddressProofName: rawOwner.permAddressProofName || rawOwner.permAddressProof || "",
    permAddressProofId: rawOwner.permAddressProofId || session.permAddressProofId || "",

    currAddressProofName: rawOwner.currAddressProofName || rawOwner.currAddressProof || "",
    currAddressProofId: rawOwner.currAddressProofId || session.currAddressProofId || "",

    // Bank
    bankName: rawOwner.bankName || session.bankName || "",
    bankAccount:
      rawOwner.bankAccount ||
      rawOwner.bankAccountNo ||
      session.bankAccount ||
      "",

    // Permanent address
    permCountry: rawOwner.permCountry || session.permCountry || "",
    permDzongkhag: rawOwner.permDzongkhag || session.permDzongkhag || "",
    permGewog: rawOwner.permGewog || session.permGewog || "",
    permVillage: rawOwner.permVillage || session.permVillage || "",
    permThram: rawOwner.permThram || session.permThram || "",
    permHouse: rawOwner.permHouse || session.permHouse || "",

    // Current address
    currCountry: rawOwner.currCountry || session.currCountry || "",
    currDzongkhag: rawOwner.currDzongkhag || session.currDzongkhag || "",
    currGewog: rawOwner.currGewog || session.currGewog || "",
    currVillage: rawOwner.currVillage || session.currVillage || "",
    currFlat: rawOwner.currFlat || rawOwner.currHouse || session.currFlat || "",
    currEmail: rawOwner.currEmail || rawOwner.email || session.email || "",
    currContact:
      rawOwner.currContact || rawOwner.contactNo || session.contactNo || "",
    currAlternateContact:
      rawOwner.currAlternateContact || session.alternateContact || "",

    // PEP
    pepPerson: rawOwner.pepPerson || session.pepPerson || "",
    pepCategory: rawOwner.pepCategory || session.pepCategory || "",
    pepSubCategory: rawOwner.pepSubCategory || session.pepSubCategory || "",
    pepRelated:
      rawOwner.pepRelated || rawOwner.relatedToPep || session.pepRelated || "",
    pepRelationship: rawOwner.pepRelationship || session.pepRelationship || "",
    pepIdentificationNo:
      rawOwner.pepIdentificationNo || session.pepIdentificationNo || "",
    pepSubCat2: rawOwner.pepSubCat2 || session.pepSubCat2 || "",
    bilRelated: rawOwner.bilRelated || session.bilRelated || "",

    // Employment
    employmentStatus:
      rawOwner.employmentStatus || session.employmentStatus || "",
    employeeId: rawOwner.employeeId || "",
    occupation: rawOwner.occupation || session.occupation || "",
    employerType: rawOwner.employerType || "",
    designation: rawOwner.designation || "",
    grade: rawOwner.grade || "",
    organizationName: rawOwner.organizationName || "",
    orgLocation: rawOwner.orgLocation || "",
    joiningDate: rawOwner.joiningDate || "",
    serviceNature: rawOwner.serviceNature || rawOwner.natureOfService || "",
    annualSalary: rawOwner.annualSalary || rawOwner.annualIncome || "",
    contractEndDate: rawOwner.contractEndDate || "",
    employeeType: rawOwner.employeeType || session.employeeType || "",
  };

  // Normalize partners, shareholders etc.
  const rawPartners = session.partners || [];
  const partners = rawPartners.map((p: any) => ({
    ...p,
    identificationType: p.identificationType || p.idType || "",
    identificationNo: p.identificationNo || p.idNumber || "",
    applicantName: p.applicantName || p.fullName || "",
    shareholdingPercent: p.shareholdingPercent || "",
    nationality: p.nationality || "",
    taxIdentifierType: p.taxIdentifierType || "",
    householdNumber: p.householdNumber || "",
  }));

  const rawShareholders = session.shareholders || [];
  const shareholders = rawShareholders.map((s: any) => ({
    ...s,
    identificationType: s.identificationType || s.idType || "",
    identificationNo: s.identificationNo || s.idNumber || "",
    applicantName: s.applicantName || s.fullName || s.shareholderName || "",
    shareholdingPercent: s.shareholdingPercent || "",
    nationality: s.nationality || "",
    taxIdentifierType: s.taxIdentifierType || "",
    householdNumber: s.householdNumber || "",
  }));

  const rawCeo = session.ceo || {};
  const ceo = {
    ...rawCeo,
    identificationType: rawCeo.identificationType || rawCeo.idType || "",
    identificationNo: rawCeo.identificationNo || rawCeo.idNumber || "",
    applicantName: rawCeo.applicantName || rawCeo.fullName || rawCeo.ceoName || "",
    nationality: rawCeo.nationality || "",
    taxIdentifierType: rawCeo.taxIdentifierType || "",
    householdNumber: rawCeo.householdNumber || "",
  };

  const rawBoardMembers = session.boardMembers || [];
  const boardMembers = rawBoardMembers.map((bm: any) => ({
    ...bm,
    identificationType: bm.identificationType || bm.idType || "",
    identificationNo: bm.identificationNo || bm.idNumber || "",
    applicantName: bm.applicantName || bm.fullName || bm.directorName || "",
    nationality: bm.nationality || "",
    taxIdentifierType: bm.taxIdentifierType || "",
    householdNumber: bm.householdNumber || "",
  }));

  // Repayment source (business income) & Repayment Guarantors
  const repaymentSourceDetail = session.businessRepaymentSourceDetail || {};
  const businessIncome = repaymentSourceDetail.businessIncome || {};
  const repaymentData = {
    repaymentSourceType: businessIncome.repaymentSourceType || "",
    monthlyIncome: businessIncome.amount || "",
    proofFileName: businessIncome.proofFileName || "",
    proofFileId: businessIncome.proofFileId || "",
  };

  // Helper to robustly retrieve spouse TPN
  const getSpouseTpn = (g: any) => {
    if (g.spousetpnnumber) return g.spousetpnnumber;
    if (g.spousetpnNumber) return g.spousetpnNumber;
    if (g.spouseTpnNumber) return g.spouseTpnNumber;
    if (g.spouseTpnNo) return g.spouseTpnNo;
    if (g.spouseTpn) return g.spouseTpn;
    if (g.tpnSpouse) return g.tpnSpouse;
    if (g.spouseTPN) return g.spouseTPN;
    if (g.spouse) {
      if (g.spouse.tpnnumber) return g.spouse.tpnnumber;
      if (g.spouse.tpnNumber) return g.spouse.tpnNumber;
      if (g.spouse.tpnNo) return g.spouse.tpnNo;
      if (g.spouse.tpn) return g.spouse.tpn;
    }
    return "";
  };

  // Helper to robustly retrieve spouse Identification No
  const getSpouseId = (g: any) => {
    if (g.spouseid) return g.spouseid;
    if (g.spouseId) return g.spouseId;
    if (g.spouseID) return g.spouseID;
    if (g.spouseCid) return g.spouseCid;
    if (g.spouseIdentificationNo) return g.spouseIdentificationNo;
    if (g.spouseIdNumber) return g.spouseIdNumber;
    if (g.spouse) {
      if (g.spouse.id) return g.spouse.id;
      if (g.spouse.cid) return g.spouse.cid;
      if (g.spouse.identificationNo) return g.spouse.identificationNo;
    }
    return "";
  };

  // Helper mapping function for both types of guarantors (repayment & security)
  const mapGuarantorData = (g: any) => ({
    ...g,
    identificationType: g.idType || g.identificationType || "",
    identificationNo: g.idNumber || g.identificationNo || "",
    identificationIssueDate: g.identificationIssueDate || g.idIssueDate || "",
    identificationExpiryDate: g.identificationExpiryDate || g.idExpiryDate || "",
    applicantName: g.guarantorName || g.applicantName || "",
    bankName: g.bankName || "",
    bankAccount: g.bankAccount || g.bankAccountNumber || "",
    permCountry: g.permCountry || "",
    permDzongkhag: g.permDzongkhag || "",
    permGewog: g.permGewog || "",
    permVillage: g.permVillage || "",
    permThram: g.permThram || "",
    permHouse: g.permHouse || "",
    currCountry: g.currCountry || "",
    currDzongkhag: g.currDzongkhag || "",
    currGewog: g.currGewog || "",
    currVillage: g.currVillage || "",
    currHouse: g.currHouse || "",
    currAlternateContact: g.currAlternateContact || "",
    email: g.email || "",
    contact: g.contact || "",
    maritalStatus: g.maritalStatus || "",
    nationality: g.nationality || "",
    householdNumber: g.householdNumber || "",
    gender: g.gender || "",
    dateOfBirth: g.dateOfBirth || "",
    tpn: g.tpn || g.tpnNo || "",
    isPep: g.isPep || "",
    pepCategory: g.pepCategory || "",
    pepSubCategory: g.pepSubCategory || "",
    relatedToPep: g.relatedToPep || "",
    employmentStatus: g.employmentStatus || "",
    employeeId: g.employeeId || "",
    occupation: g.occupation || "",
    employerType: g.employerType || "",
    designation: g.designation || "",
    grade: g.grade || "",
    organizationName: g.organizationName || "",
    orgLocation: g.orgLocation || "",
    joiningDate: g.joiningDate || "",
    annualSalary: g.annualSalary || "",
    repaymentSourceType: g.repaymentSourceType || "",
    taxIdentifierType: g.taxIdentifierType || "",

    // Proof Document Names & Files mapped securely
    proofFileName: g.proofFileName || "",
    proofFileId: g.proofFileId || "",
    idProof: g.idProof || g.idProofName || g.identificationProof || "",
    idProofId: g.idProofId || g.identificationProofId || "",
    familyTree: g.familyTree || g.familyTreeName || "",
    familyTreeId: g.familyTreeId || "",
    passportPhoto: g.passportPhoto || g.passportPhotoName || "",
    passportPhotoId: g.passportPhotoId || "",
    pepUpload: g.pepUpload || g.pepUploadName || "",
    pepUploadId: g.pepUploadId || "",
    permAddressProof: g.permAddressProof || g.permAddressProofName || "",
    permAddressProofId: g.permAddressProofId || "",
    currAddressProof: g.currAddressProof || g.currAddressProofName || "",
    currAddressProofId: g.currAddressProofId || "",

    // Guarantee Spouse Information 
    spouseIdType: g.spouseIdType || "",
    spouseCid: getSpouseId(g),
    spouseName: g.spouseName || "",
    spouseSalutation: g.spouseSalutation || "",
    spouseGender: g.spouseGender || "",
    spouseNationality: g.spouseNationality || "",
    spouseHouseholdNumber: g.spouseHouseholdNumber || "",
    spouseDateOfBirth: g.spouseDateOfBirth || g.spouseDob || "",
    spouseTaxIdentifierType: g.spouseTaxIdentifierType || "",
    spouseTpnNumber: getSpouseTpn(g),
    spouseEmail: g.spouseEmail || "",
    spouseCurrContact: g.spouseCurrContact || g.spouseContact || "",

    // Spouse Files
    spouseIdProof: g.spouseIdProof || g.spouseIdProofName || g.spouseIdentificationProof || "",
    spouseIdProofId: g.spouseIdProofId || g.spouseIdentificationProofId || "",
    spousePermAddressProof: g.spousePermAddressProof || g.spousePermAddressProofName || "",
    spousePermAddressProofId: g.spousePermAddressProofId || "",

    // Spouse Address
    spousePermCountry: g.spousePermCountry || "",
    spousePermDzongkhag: g.spousePermDzongkhag || "",
    spousePermGewog: g.spousePermGewog || "",
    spousePermVillage: g.spousePermVillage || "",
    spousePermThram: g.spousePermThram || "",
    spousePermHouse: g.spousePermHouse || "",
    spousePermCity: g.spousePermCity || "",

    // Related PEPs mapped with their own file IDs
    relatedPeps: Array.isArray(g.relatedPeps) ? g.relatedPeps.map((pep: any) => ({
      ...pep,
      identificationProof: pep.identificationProof || pep.identificationProofName || "",
      identificationProofId: pep.identificationProofId || "",
      permAddressProof: pep.permAddressProof || pep.permAddressProofName || "",
      permAddressProofId: pep.permAddressProofId || "",
      currAddressProof: pep.currAddressProof || pep.currAddressProofName || "",
      currAddressProofId: pep.currAddressProofId || "",
    })) : [],
  });

  // Conditionally Map & Filter out empty Guarantor objects
  const guarantorsData = (repaymentSourceDetail.guarantors || [])
    .map(mapGuarantorData)
    .filter((g: any) => g.applicantName?.trim() || g.identificationNo?.trim());

  // Parse Securities Array properly
  const securitiesData = useMemo(() => {
    const sd = session.securityDetails;
    if (!sd) return [];
    return Array.isArray(sd) ? sd : [sd];
  }, [session.securityDetails]);

  const coBorrowers = session.coBorrowers || [];

  // Conditionally Map & Filter out empty Security Guarantor objects
  const rawSecurityGuarantors = session.securityGuarantors || securitiesData?.[0]?.guarantors || [];
  const securityGuarantorsData = rawSecurityGuarantors
    .map(mapGuarantorData)
    .filter((g: any) => g.applicantName?.trim() || g.identificationNo?.trim());

  // ---------- Fetch dropdown options ----------
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([]);
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<any[]>([]);
  const [banksOptions, setBanksOptions] = useState<any[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([]);
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
  const [occupationOptions, setOccupationOptions] = useState<any[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<any[]>([]);
  const [pepCategoryOptions, setPepCategoryOptions] = useState<any[]>([]);
  const [taxIdentifierTypeOptions, setTaxIdentifierTypeOptions] = useState<any[]>([]);
  const [industryClassificationOptions, setIndustryClassificationOptions] = useState<any[]>([]);

  // Gewog options (depend on Dzongkhags)
  const [businessGewogOptions, setBusinessGewogOptions] = useState<any[]>([]);
  const [ownerPermGewogOptions, setOwnerPermGewogOptions] = useState<any[]>([]);
  const [ownerCurrGewogOptions, setOwnerCurrGewogOptions] = useState<any[]>([]);
  const [securityGewogOptionsMap, setSecurityGewogOptionsMap] = useState<Record<number, any[]>>({});
  const [guarantorGewogMap, setGuarantorGewogMap] = useState<Record<string, any[]>>({});
  const [ownerPepSubCatOptions, setOwnerPepSubCatOptions] = useState<any[]>([]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [
          country,
          dzongkhag,
          identificationType,
          banks,
          marital,
          national,
          occ,
          org,
          pepCat,
          taxType,
          indClass,
        ] = await Promise.all([
          fetchCountry().catch(() => []),
          fetchDzongkhag().catch(() => []),
          fetchIdentificationType().catch(() => []),
          fetchBanks().catch(() => []),
          fetchMaritalStatus().catch(() => []),
          fetchNationality().catch(() => []),
          fetchOccupations().catch(() => []),
          fetchLegalConstitution().catch(() => []),
          fetchPepCategory().catch(() => []),
          fetchTaxIdentifierType().catch(() => []),
          fetchIndustryClassification().catch(() => []),
        ]);
        setCountryOptions(country || []);
        setDzongkhagOptions(dzongkhag || []);
        setIdentificationTypeOptions(identificationType || []);
        setBanksOptions(banks || []);
        setMaritalStatusOptions(marital || []);
        setNationalityOptions(national || []);
        setOccupationOptions(occ || []);
        setOrganizationOptions(org || []);
        setPepCategoryOptions(pepCat || []);
        setTaxIdentifierTypeOptions(taxType || []);
        setIndustryClassificationOptions(indClass || []);
      } catch (error) {
        console.error("Error loading form data:", error);
      }
    };
    loadAllData();
  }, []);

  // Helpers to safely check values mapped with Options
  const isBhutan = (countryCode: string) => {
    if (!countryCode || !countryOptions.length) return false;
    const option = countryOptions.find((c: any) => String(c.id || c.country_pk_code) === String(countryCode));
    return option && (option.country_name || option.country || "").toLowerCase().includes("bhutan");
  };

  const isNationalityBhutanese = (nationalityCode: string) => {
    if (!nationalityCode || !nationalityOptions.length) return false;
    const option = nationalityOptions.find((n: any) => String(n.id || n.nationality_pk_code) === String(nationalityCode));
    const label = option ? (option.nationality || option.name || "").toLowerCase() : String(nationalityCode).toLowerCase();
    return label.includes("bhutan") && !label.includes("non");
  };

  const checkIsMarried = (statusId: string) => {
    if (!statusId) return false;
    const label = getOptionLabel(maritalStatusOptions, statusId)?.toLowerCase() || "";
    return label.includes("married") && !label.includes("unmarried");
  };

  // Data mapping fetches (Gewogs & Subcategories)
  useEffect(() => {
    if (isBhutan(businessAddress.country) && businessAddress.dzongkhag) {
      fetchGewogsByDzongkhag(businessAddress.dzongkhag)
        .then((res) => setBusinessGewogOptions(res?.data?.data || res || []))
        .catch(() => setBusinessGewogOptions([]));
    }
  }, [businessAddress.dzongkhag, businessAddress.country, countryOptions.length]);

  useEffect(() => {
    if (isBhutan(ownerData.permCountry) && ownerData.permDzongkhag) {
      fetchGewogsByDzongkhag(ownerData.permDzongkhag)
        .then((res) => setOwnerPermGewogOptions(res?.data?.data || res || []))
        .catch(() => setOwnerPermGewogOptions([]));
    }
  }, [ownerData.permDzongkhag, ownerData.permCountry, countryOptions.length]);

  useEffect(() => {
    if (isBhutan(ownerData.currCountry) && ownerData.currDzongkhag) {
      fetchGewogsByDzongkhag(ownerData.currDzongkhag)
        .then((res) => setOwnerCurrGewogOptions(res?.data?.data || res || []))
        .catch(() => setOwnerCurrGewogOptions([]));
    }
  }, [ownerData.currDzongkhag, ownerData.currCountry, countryOptions.length]);

  useEffect(() => {
    if (ownerData.pepCategory) {
      fetchPepSubCategoryByCategory(ownerData.pepCategory)
        .then(res => setOwnerPepSubCatOptions(res || []))
        .catch(() => setOwnerPepSubCatOptions([]));
    }
  }, [ownerData.pepCategory]);

  useEffect(() => {
    const fetchSecuritiesGewogs = async () => {
      const newMap: Record<number, any[]> = {};
      for (let i = 0; i < securitiesData.length; i++) {
        if (securitiesData[i].dzongkhag) {
          try {
            const res = await fetchGewogsByDzongkhag(securitiesData[i].dzongkhag);
            newMap[i] = res?.data?.data || res || [];
          } catch (e) {
            newMap[i] = [];
          }
        }
      }
      setSecurityGewogOptionsMap(newMap);
    };
    if (securitiesData.length > 0) fetchSecuritiesGewogs();
  }, [JSON.stringify(securitiesData.map(s => s.dzongkhag))]);

  useEffect(() => {
    const fetchGuarantorGewogs = async () => {
      const newMap: Record<string, any[]> = {};

      // Repayment Guarantors Map - Using filtered guarantorsData
      for (let i = 0; i < guarantorsData.length; i++) {
        const g = guarantorsData[i];
        if (g.permCountry && isBhutan(g.permCountry) && g.permDzongkhag) {
          const key = `perm-${i}`;
          if (!guarantorGewogMap[key]) {
            try {
              const opts = await fetchGewogsByDzongkhag(g.permDzongkhag);
              newMap[key] = opts?.data?.data || opts || [];
            } catch (e) {
              newMap[key] = [];
            }
          }
        }
        if (g.currCountry && isBhutan(g.currCountry) && g.currDzongkhag) {
          const key = `curr-${i}`;
          if (!guarantorGewogMap[key]) {
            try {
              const opts = await fetchGewogsByDzongkhag(g.currDzongkhag);
              newMap[key] = opts?.data?.data || opts || [];
            } catch (e) {
              newMap[key] = [];
            }
          }
        }
        if (g.spousePermCountry && isBhutan(g.spousePermCountry) && g.spousePermDzongkhag) {
          const key = `spousePerm-${i}`;
          if (!guarantorGewogMap[key]) {
            try {
              const opts = await fetchGewogsByDzongkhag(g.spousePermDzongkhag);
              newMap[key] = opts?.data?.data || opts || [];
            } catch (e) {
              newMap[key] = [];
            }
          }
        }
      }

      // Security Guarantors Map - Using filtered securityGuarantorsData
      for (let i = 0; i < securityGuarantorsData.length; i++) {
        const g = securityGuarantorsData[i];
        if (g.permCountry && isBhutan(g.permCountry) && g.permDzongkhag) {
          const key = `sec-perm-${i}`;
          if (!guarantorGewogMap[key]) {
            try {
              const opts = await fetchGewogsByDzongkhag(g.permDzongkhag);
              newMap[key] = opts?.data?.data || opts || [];
            } catch (e) {
              newMap[key] = [];
            }
          }
        }
        if (g.currCountry && isBhutan(g.currCountry) && g.currDzongkhag) {
          const key = `sec-curr-${i}`;
          if (!guarantorGewogMap[key]) {
            try {
              const opts = await fetchGewogsByDzongkhag(g.currDzongkhag);
              newMap[key] = opts?.data?.data || opts || [];
            } catch (e) {
              newMap[key] = [];
            }
          }
        }
        if (g.spousePermCountry && isBhutan(g.spousePermCountry) && g.spousePermDzongkhag) {
          const key = `sec-spousePerm-${i}`;
          if (!guarantorGewogMap[key]) {
            try {
              const opts = await fetchGewogsByDzongkhag(g.spousePermDzongkhag);
              newMap[key] = opts?.data?.data || opts || [];
            } catch (e) {
              newMap[key] = [];
            }
          }
        }
      }

      if (Object.keys(newMap).length) {
        setGuarantorGewogMap((prev) => ({ ...prev, ...newMap }));
      }
    };

    if ((guarantorsData.length > 0 || securityGuarantorsData.length > 0) && countryOptions.length > 0) {
      fetchGuarantorGewogs();
    }
  }, [JSON.stringify(guarantorsData), JSON.stringify(securityGuarantorsData), countryOptions.length]);

  const getGuarantorGewogOptions = (index: number, type: 'perm' | 'curr' | 'spousePerm' | 'sec-perm' | 'sec-curr' | 'sec-spousePerm') => {
    return guarantorGewogMap[`${type}-${index}`] || [];
  };

  /* ---------------- Payload Builder ---------------- */
  const buildBilPayload = () => ({
    loanData: {
      loanType: loanData.loanTypeString,
      loanSector: loanData.loanSectorString,
      loanSubSector: loanData.loanSubSectorString,
      loanSubSectorCategory: loanData.loanSubSectorCategoryString,
      loanAmount: loanData.loanAmount,
      loanPurpose: loanData.loanPurpose,
    },
    personalData: {
      salutation: ownerData.salutation,
      applicantName: ownerData.applicantName,
      nationality: ownerData.nationality,
      cid: ownerData.identificationNo,
      issueDate: ownerData.identificationIssueDate,
      expiryDate: ownerData.identificationExpiryDate,
      gender: ownerData.gender,
      dob: ownerData.dateOfBirth,
      maritalStatus: ownerData.maritalStatus,
      tpn: ownerData.tpn,
      spouseName: ownerData.spouseName,
      spouseCid: ownerData.spouseIdentificationNo,
      spouseContact: ownerData.spouseContact,
      familyTreeDocs: ownerData.familyTreeName,
      bankName: ownerData.bankName,
      bankAccount: ownerData.bankAccount,
      contact: ownerData.currContact,
      alternateContact: ownerData.currAlternateContact,
      email: ownerData.currEmail,
      permCountry: ownerData.permCountry,
      permDzongkhag: ownerData.permDzongkhag,
      permGewog: ownerData.permGewog,
      permVillage: ownerData.permVillage,
      permThram: ownerData.permThram,
      permHouse: ownerData.permHouse,
      currCountry: ownerData.currCountry,
      currDzongkhag: ownerData.currDzongkhag,
      currGewog: ownerData.currGewog,
      currVillage: ownerData.currVillage,
      currFlat: ownerData.currFlat,
      pep: ownerData.pepPerson,
      proofDoc: ownerData.identificationProofName,
      pepSubCategory: ownerData.pepSubCategory,
      pepRelated: ownerData.pepRelated,
      pepRelationship: ownerData.pepRelationship,
      pepIdentificationNo: ownerData.pepIdentificationNo,
      pepCategory: ownerData.pepCategory,
      pepSubCat2: ownerData.pepSubCat2,
      bilRelated: ownerData.bilRelated,
      empolymentStatus: ownerData.employmentStatus,
      occupation: ownerData.occupation,
      organizationName: ownerData.organizationName,
      employerType: ownerData.employerType,
      orgLocation: ownerData.orgLocation,
      employeeId: ownerData.employeeId,
      joiningDate: ownerData.joiningDate,
      designation: ownerData.designation,
      grade: ownerData.grade,
      employeeType: ownerData.employeeType,
      grossIncome: ownerData.annualSalary,
    },
    coBorrowerData: coBorrowers[0] || {},
    securityData: {
      securities: securitiesData,
      guarantors: securityGuarantorsData,
    },
    repaymentData: {
      source: repaymentData.repaymentSourceType,
      monthlyIncome: repaymentData.monthlyIncome,
    },
  });

  /* ---------------- Submit Handler ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const bilPayload = buildBilPayload();
      const fd = new FormData();

      Object.entries(bilPayload).forEach(([section, data]) => {
        if (typeof data === "object" && data !== null) {
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              fd.append(`${section}[${key}]`, String(value));
            }
          });
        }
      });

      const res = await fetch("https://bil.example.com/api/loan-applications", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "BIL submission failed");
      }

      const response = await res.json();
      console.log("BIL SUCCESS:", response);

      onNext({ confirmation: true });
      router.push("/billing");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Reusable Components ---------------- */

  function AccordionSection({
    title,
    children,
    defaultOpen = false,
    headerClassName = "",
    onEdit,
  }: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    headerClassName?: string;
    onEdit?: () => void;
  }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
        <div
          className={`w-full flex justify-between items-center px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-bold transition-colors ${headerClassName || "bg-[#e68900] text-white"
            }`}
        >
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex-1 flex justify-between items-center text-left hover:opacity-80"
          >
            {title}
            <span className="text-xl sm:text-2xl font-bold mr-4">
              {open ? "−" : "+"}
            </span>
          </button>

          {onEdit && (
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              variant="secondary"
              size="sm"
              className="bg-white text-[#e68900] hover:bg-gray-100 shadow-sm whitespace-nowrap"
            >
              Edit Section
            </Button>
          )}
        </div>

        {open && (
          <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 bg-white">
            {children}
          </div>
        )}
      </div>
    );
  }

  interface FieldProps {
    label: string;
    value?: any;
    capitalizeFirst?: boolean;
  }

  function Field({ label, value, capitalizeFirst }: FieldProps) {
    const displayValue = value
      ? capitalizeFirst
        ? String(value).charAt(0).toUpperCase() + String(value).slice(1)
        : value
      : "";
    return (
      <div className="space-y-1.5 sm:space-y-2.5">
        <Label className="text-xs sm:text-sm font-semibold text-gray-800">
          {label}
        </Label>
        <input
          disabled
          value={displayValue}
          className="w-full h-10 sm:h-12 rounded-lg border border-gray-300 px-3 sm:px-4 bg-gray-50 text-sm sm:text-base text-gray-700"
        />
      </div>
    );
  }

  interface FileDisplayFieldProps {
    label: string;
    fileName?: string;
    fileId?: string;
  }

  /**
   * Component to retrieve the actual file from IndexedDB
   * and display it as a clickable link.
   */
  function FileDisplayField({ label, fileName, fileId }: FileDisplayFieldProps) {
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(!!fileId);

    useEffect(() => {
      if (fileId) {
        setIsLoading(true);
        getFile(fileId)
          .then((file) => {
            // Ensure the retrieved object is a Blob/File before creating a URL
            if (file && (file instanceof Blob || file instanceof File)) {
              const url = URL.createObjectURL(file);
              setFileUrl(url);
            } else {
              // Not a valid file; log a warning and fall back to showing the filename only
              console.warn('Retrieved file is not a valid Blob/File:', file);
              setFileUrl(null);
            }
          })
          .catch((err) => {
            console.error('Failed to load file:', err);
            setFileUrl(null);
          })
          .finally(() => setIsLoading(false));
      } else {
        setFileUrl(null);
      }
      // Cleanup: revoke object URL when component unmounts or fileId changes
      return () => {
        if (fileUrl) {
          URL.revokeObjectURL(fileUrl);
        }
      };
    }, [fileId]); // fileUrl is not included in deps because we don't want to revoke on URL change

    const renderContent = () => {
      if (isLoading) {
        return <span className="text-gray-400 italic flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading file...</span>;
      }
      if (fileUrl) {
        return (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-[#003DA5] hover:text-[#002D7A] hover:underline truncate w-full"
            title={fileName || "View Document"}
          >
            <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{fileName || "View Document"}</span>
            <ExternalLink className="w-3 h-3 ml-2 flex-shrink-0" />
          </a>
        );
      }
      if (fileName) {
        return (
          <span className="flex items-center text-gray-700 truncate w-full">
            <FileText className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="truncate">{fileName}</span>
          </span>
        );
      }
      return <span className="text-gray-400 italic">No file uploaded</span>;
    };

    return (
      <div className="space-y-1.5 sm:space-y-2.5 flex flex-col">
        <Label className="text-xs sm:text-sm font-semibold text-gray-800">
          {label}
        </Label>
        <div className="w-full h-10 sm:h-12 rounded-lg border border-gray-300 px-3 sm:px-4 bg-gray-50 text-sm sm:text-base flex items-center overflow-hidden">
          {renderContent()}
        </div>
      </div>
    );
  }

  /* -------------------- UI ----------------------- */

  if (!isHydrated) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#003DA5]" />
        <span className="ml-2 text-gray-600">Restoring session data...</span>
      </div>
    );
  }

  const isBusinessBhutanStatus = isBhutan(businessAddress.country);
  const isOwnerMarried = checkIsMarried(ownerData.maritalStatus);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 sm:space-y-8 md:space-y-10 pt-4 sm:pt-6 md:pt-8 pb-6 sm:pb-8 md:pb-12"
    >
      {/* LOAN DETAILS - Step 1 */}
      <AccordionSection
        title="Loan Details"
        defaultOpen={true}
        onEdit={onEditStep ? () => onEditStep(1) : undefined}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Field label="Loan Type" value={loanData.loanTypeString} />
          <Field label="Loan Sector" value={loanData.loanSectorString} />
          <Field label="Loan Sub-Sector" value={loanData.loanSubSectorString} />
          <Field
            label="Loan Sub-Sector Category"
            value={loanData.loanSubSectorCategoryString}
          />
          <Field label="Loan Amount (Nu.)" value={loanData.loanAmount} />
          <Field label="Loan Purpose" value={loanData.loanPurpose} />
          <Field label="Interest Rate (%)" value={loanData.interestRate} />
          <Field label="Tenure (months)" value={loanData.tenure} />
        </div>
      </AccordionSection>

      {/* PERSONAL/BUSINESS DETAILS - Step 2 */}
      <AccordionSection
        title="Personal & Business Details"
        defaultOpen
        onEdit={onEditStep ? () => onEditStep(2) : undefined}
      >
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
          {/* --- A. BUSINESS DETAILS --- */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4">
              A. BUSINESS DETAILS
            </h2>

            {/* A1. Business Identification & Financial */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-700">
                A1. Business Identification & Financial Information
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Field
                  label="Business / Agency Name"
                  value={businessData.businessName}
                />
                <Field
                  label="Business Type"
                  value={businessData.businessType}
                />
                <Field
                  label="Establishment Date"
                  value={formatDateForInput(businessData.establishmentDate)}
                />
                <Field
                  label="Industry Classification"
                  value={getOptionLabel(
                    industryClassificationOptions,
                    businessData.industryClassification
                  )}
                />
                <Field
                  label="Identification Type"
                  value={getOptionLabel(
                    identificationTypeOptions,
                    businessData.identificationType
                  )}
                />
                <Field
                  label="Identification Number"
                  value={businessData.identificationNumber}
                />
                <Field
                  label="Identification Issue Date"
                  value={formatDateForInput(
                    businessData.identificationIssueDate,
                  )}
                />
                <Field
                  label="Identification Expiry Date"
                  value={formatDateForInput(
                    businessData.identificationExpiryDate,
                  )}
                />
                <FileDisplayField
                  label="Upload Identification Proof"
                  fileName={businessData.identificationProofFileName}
                  fileId={businessData.identificationProofFileId}
                />
                <Field
                  label="Tax Identifier Type"
                  value={getOptionLabel(
                    taxIdentifierTypeOptions,
                    businessData.taxIdentifierType
                  )}
                />
                <Field
                  label="Tax Identifier Number"
                  value={businessData.taxIdentifierNumber}
                />
                <Field
                  label="Name of Bank"
                  value={getOptionLabel(
                    banksOptions,
                    businessData.nameOfBank
                  )}
                />
                <Field
                  label="Bank Current Account Number"
                  value={businessData.bankCurrentAccountNumber}
                />
                <Field
                  label="Gross Annual Income"
                  value={businessData.grossAnnualIncome}
                />
              </div>
            </div>

            {/* A2. Business Address */}
            <div className="space-y-6 pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-700">
                A2. Business Address
              </h3>

              <div className="grid md:grid-cols-3 gap-6">
                <Field
                  label="Country"
                  value={getOptionLabel(
                    countryOptions,
                    businessAddress.country
                  )}
                />
                <Field
                  label={isBusinessBhutanStatus ? "Dzongkhag" : "State"}
                  value={
                    isBusinessBhutanStatus
                      ? getOptionLabel(
                        dzongkhagOptions,
                        businessAddress.dzongkhag
                      )
                      : businessAddress.dzongkhag
                  }
                />
                <Field
                  label={isBusinessBhutanStatus ? "Gewog" : "Province"}
                  value={
                    isBusinessBhutanStatus
                      ? getOptionLabel(
                        businessGewogOptions,
                        businessAddress.gewog,
                      )
                      : businessAddress.gewog
                  }
                />
                <Field
                  label={isBusinessBhutanStatus ? "Village / Street" : "Street"}
                  value={businessAddress.villageStreet}
                />
                <Field
                  label="Specific Area / Location"
                  value={businessAddress.specificLocation}
                />
                <Field
                  label="Contact Number"
                  value={businessAddress.contactNumber}
                />
                <Field
                  label="Alternate Contact Number"
                  value={businessAddress.alternateContactNumber}
                />
                <Field label="Email Address" value={businessAddress.email} />
              </div>
            </div>
          </div>

          {/* --- B. OWNERSHIP / MANAGEMENT DETAILS --- */}
          {businessData.businessType && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4">
                B. OWNERSHIP & MANAGEMENT DETAILS
              </h2>

              {/* Owner Details (Sole Proprietorship) */}
              {businessData.businessType === "Sole Proprietorship" &&
                ownerData && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-600" /> Owner Personal
                      Details
                    </h3>
                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 mb-6">
                      <h4 className="text-xl font-bold text-gray-800 mb-6">
                        Owner Personal Information
                      </h4>
                      <div className="space-y-8">
                        {/* Personal Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <Field
                            label="Identification Type"
                            value={getOptionLabel(
                              identificationTypeOptions,
                              ownerData.identificationType
                            )}
                          />
                          <Field
                            label="Identification No."
                            value={ownerData.identificationNo}
                          />
                          <Field
                            label="Salutation"
                            value={ownerData.salutation}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Applicant Name"
                            value={ownerData.applicantName}
                          />
                          <Field
                            label="Nationality"
                            value={getOptionLabel(
                              nationalityOptions,
                              ownerData.nationality
                            )}
                          />
                          <Field
                            label="Tax Identifier Type"
                            value={getOptionLabel(
                              taxIdentifierTypeOptions,
                              ownerData.taxIdentifierType
                            )}
                          />
                          {isNationalityBhutanese(ownerData.nationality) && (
                            <Field
                              label="Household Number"
                              value={ownerData.householdNumber}
                            />
                          )}
                          <Field
                            label="Gender"
                            value={ownerData.gender}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Identification Issue Date"
                            value={formatDateForInput(
                              ownerData.identificationIssueDate,
                            )}
                          />
                          <Field
                            label="Identification Expiry Date"
                            value={formatDateForInput(
                              ownerData.identificationExpiryDate,
                            )}
                          />
                          <Field
                            label="Date of Birth"
                            value={formatDateForInput(ownerData.dateOfBirth)}
                          />
                          <Field label="TPN No" value={ownerData.tpn} />
                          <Field
                            label="Marital Status"
                            value={getOptionLabel(
                              maritalStatusOptions,
                              ownerData.maritalStatus
                            )}
                          />
                          {ownerData.shareholdingPercent && (
                            <Field
                              label="Shareholding %"
                              value={ownerData.shareholdingPercent}
                            />
                          )}
                        </div>

                        {/* Conditional Spouse Information if Married */}
                        {isOwnerMarried && (
                          <div className="mt-4 border-t pt-4">
                            <h5 className="font-semibold text-gray-800 mb-4">
                              Spouse Personal Information
                            </h5>
                            <div className="grid md:grid-cols-4 gap-6">
                              <Field
                                label="Spouse Salutation"
                                value={ownerData.spouseSalutation}
                              />
                              <Field
                                label="Spouse Name"
                                value={ownerData.spouseName}
                              />
                              <Field
                                label="Spouse Gender"
                                value={ownerData.spouseGender}
                                capitalizeFirst={true}
                              />
                              <Field
                                label="Spouse Nationality"
                                value={getOptionLabel(
                                  nationalityOptions,
                                  ownerData.spouseNationality
                                )}
                              />
                              <Field
                                label="Spouse CID/ID No."
                                value={ownerData.spouseIdentificationNo}
                              />
                              <Field
                                label="Spouse Date of Birth"
                                value={formatDateForInput(ownerData.spouseDateOfBirth)}
                              />
                              <Field
                                label="Spouse Contact No."
                                value={ownerData.spouseContact}
                              />
                              <Field
                                label="Spouse Tax Identifier Type"
                                value={getOptionLabel(
                                  taxIdentifierTypeOptions,
                                  ownerData.spouseTaxIdentifierType
                                )}
                              />
                              <Field
                                label="Spouse TPN No."
                                value={ownerData.spouseTpnNumber}
                              />
                              {isNationalityBhutanese(ownerData.spouseNationality) && (
                                <Field
                                  label="Spouse Household Number"
                                  value={ownerData.spouseHouseholdNumber}
                                />
                              )}
                            </div>
                          </div>
                        )}

                        {/* File Uploads */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t mt-4">
                          <FileDisplayField
                            label="Family Tree File"
                            fileName={ownerData.familyTreeName}
                            fileId={ownerData.familyTreeId}
                          />
                          <FileDisplayField
                            label="Passport Photo"
                            fileName={ownerData.passportPhotoName}
                            fileId={ownerData.passportPhotoId}
                          />
                          {/* Owner Identification Proof */}
                          <FileDisplayField
                            label="Identification Proof"
                            fileName={ownerData.identificationProofName}
                            fileId={ownerData.identificationProofId}
                          />
                        </div>

                        {/* Bank Details */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t">
                          <Field
                            label="Name of Bank"
                            value={getOptionLabel(
                              banksOptions,
                              ownerData.bankName
                            )}
                          />
                          <Field
                            label="Saving Account No"
                            value={ownerData.bankAccount}
                          />
                        </div>

                        {/* Address Details */}
                        <div className="space-y-6 pt-4 border-t">
                          <h5 className="font-semibold text-gray-800">
                            Permanent Address
                          </h5>
                          <div className="grid md:grid-cols-4 gap-6">
                            <Field
                              label="Country"
                              value={getOptionLabel(
                                countryOptions,
                                ownerData.permCountry
                              )}
                            />
                            {isBhutan(ownerData.permCountry) ? (
                              <>
                                <Field
                                  label="Dzongkhag"
                                  value={getOptionLabel(
                                    dzongkhagOptions,
                                    ownerData.permDzongkhag
                                  )}
                                />
                                <Field
                                  label="Gewog"
                                  value={getOptionLabel(
                                    ownerPermGewogOptions,
                                    ownerData.permGewog
                                  )}
                                />
                                <Field
                                  label="Village/Street"
                                  value={ownerData.permVillage}
                                />
                                <Field
                                  label="Thram No."
                                  value={ownerData.permThram}
                                />
                                <Field
                                  label="House No."
                                  value={ownerData.permHouse}
                                />
                              </>
                            ) : (
                              <>
                                <Field
                                  label="State"
                                  value={ownerData.permDzongkhag}
                                />
                                <Field
                                  label="Province"
                                  value={ownerData.permGewog}
                                />
                                <Field
                                  label="Street Name"
                                  value={ownerData.permVillage}
                                />
                                <FileDisplayField
                                  label="Address Proof"
                                  fileName={ownerData.permAddressProofName}
                                  fileId={ownerData.permAddressProofId}
                                />
                              </>
                            )}
                          </div>
                        </div>

                        {/* Current Address */}
                        <div className="space-y-4 pt-4 border-t">
                          <h5 className="font-semibold text-gray-800">
                            Current/Residential Address
                          </h5>
                          <div className="grid md:grid-cols-4 gap-6">
                            <Field
                              label="Country"
                              value={getOptionLabel(
                                countryOptions,
                                ownerData.currCountry
                              )}
                            />
                            {isBhutan(ownerData.currCountry) ? (
                              <>
                                <Field
                                  label="Dzongkhag"
                                  value={getOptionLabel(
                                    dzongkhagOptions,
                                    ownerData.currDzongkhag
                                  )}
                                />
                                <Field
                                  label="Gewog"
                                  value={getOptionLabel(
                                    ownerCurrGewogOptions,
                                    ownerData.currGewog
                                  )}
                                />
                                <Field
                                  label="Village/Street"
                                  value={ownerData.currVillage}
                                />
                                <Field
                                  label="House/Building/Flat No"
                                  value={ownerData.currFlat}
                                />
                              </>
                            ) : (
                              <>
                                <Field
                                  label="State"
                                  value={ownerData.currDzongkhag}
                                />
                                <Field
                                  label="Province"
                                  value={ownerData.currGewog}
                                />
                                <Field
                                  label="Street Name"
                                  value={ownerData.currVillage}
                                />
                                <FileDisplayField
                                  label="Address Proof"
                                  fileName={ownerData.currAddressProofName}
                                  fileId={ownerData.currAddressProofId}
                                />
                              </>
                            )}
                            <Field
                              label="Email Address"
                              value={ownerData.currEmail}
                            />
                            <Field
                              label="Contact Number"
                              value={ownerData.currContact}
                            />
                            <Field
                              label="Alternate Contact No"
                              value={ownerData.currAlternateContact}
                            />
                          </div>
                        </div>

                        {/* PEP Declaration */}
                        {ownerData.pepPerson && (
                          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                            <h5 className="font-semibold text-gray-800">
                              PEP Declaration
                            </h5>
                            <div className="grid md:grid-cols-4 gap-6">
                              <Field
                                label="Politically Exposed Person"
                                value={ownerData.pepPerson}
                                capitalizeFirst={true}
                              />
                              {ownerData.pepPerson === "yes" && (
                                <>
                                  <Field
                                    label="PEP Category"
                                    value={getOptionLabel(
                                      pepCategoryOptions,
                                      ownerData.pepCategory
                                    )}
                                  />
                                  <Field
                                    label="PEP Sub Category"
                                    value={getOptionLabel(
                                      ownerPepSubCatOptions,
                                      ownerData.pepSubCategory
                                    )}
                                  />

                                </>
                              )}
                              {ownerData.pepPerson === "no" &&
                                ownerData.pepRelated && (
                                  <Field
                                    label="Related to any PEP"
                                    value={ownerData.pepRelated}
                                    capitalizeFirst={true}
                                  />
                                )}
                            </div>
                          </div>
                        )}

                        {/* Employment Status */}
                        {ownerData.employmentStatus && (
                          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                            <h5 className="font-semibold text-gray-800">
                              Employment Status
                            </h5>
                            <Field
                              label="Employment Status"
                              value={ownerData.employmentStatus}
                              capitalizeFirst={true}
                            />

                            {ownerData.employmentStatus === "employed" && (
                              <div className="space-y-6 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                  <Field
                                    label="Employee ID"
                                    value={ownerData.employeeId}
                                  />
                                  <Field
                                    label="Occupation"
                                    value={getOptionLabel(
                                      occupationOptions,
                                      ownerData.occupation
                                    )}
                                  />
                                  <Field
                                    label="Employer Type"
                                    value={ownerData.employerType}
                                    capitalizeFirst={true}
                                  />
                                  <Field
                                    label="Designation"
                                    value={ownerData.designation}
                                    capitalizeFirst={true}
                                  />
                                  <Field
                                    label="Grade"
                                    value={ownerData.grade}
                                  />
                                  <Field
                                    label="Organization Name"
                                    value={getOptionLabel(
                                      organizationOptions,
                                      ownerData.organizationName
                                    )}
                                  />
                                  <Field
                                    label="Organization Location"
                                    value={ownerData.orgLocation}
                                  />
                                  <Field
                                    label="Service Joining Date"
                                    value={formatDateForInput(
                                      ownerData.joiningDate,
                                    )}
                                  />
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                  <Field
                                    label="Nature of Service"
                                    value={ownerData.serviceNature}
                                    capitalizeFirst={true}
                                  />
                                  <Field
                                    label="Gross Annual Salary Income"
                                    value={ownerData.annualSalary}
                                  />
                                  {ownerData.serviceNature === "contract" && (
                                    <Field
                                      label="Contract End Date"
                                      value={formatDateForInput(
                                        ownerData.contractEndDate,
                                      )}
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Partners Display */}
              {businessData.businessType === "Partnership" &&
                partners.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-600" /> Partners
                      Personal Details
                    </h3>
                    {partners.map((partner: any, index: number) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 mb-6"
                      >
                        <h4 className="text-xl font-bold text-gray-800 mb-6">
                          Partner {index + 1} Personal Details
                        </h4>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Field
                              label="Shareholding %"
                              value={partner.shareholdingPercent}
                            />
                            <Field
                              label="Applicant Name"
                              value={partner.applicantName}
                            />
                            <Field
                              label="Identification Type"
                              value={getOptionLabel(
                                identificationTypeOptions,
                                partner.identificationType
                              )}
                            />
                            <Field
                              label="Identification No."
                              value={partner.identificationNo}
                            />
                            <Field
                              label="Nationality"
                              value={getOptionLabel(
                                nationalityOptions,
                                partner.nationality
                              )}
                            />
                            <Field
                              label="Tax Identifier Type"
                              value={getOptionLabel(
                                taxIdentifierTypeOptions,
                                partner.taxIdentifierType
                              )}
                            />
                            {isNationalityBhutanese(partner.nationality) && (
                              <Field
                                label="Household Number"
                                value={partner.householdNumber}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Private Limited Company Display */}
              {businessData.businessType === "Private Limited Company" && (
                <div className="space-y-12">
                  {/* Shareholders */}
                  {shareholders.length > 0 && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-600" /> 1.
                        Shareholders / Partners Personal Details
                      </h3>
                      {shareholders.map((sh: any, idx: number) => (
                        <div
                          key={idx}
                          className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 mb-6"
                        >
                          <h4 className="text-xl font-bold text-gray-800 mb-6">
                            Shareholder {idx + 1} Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Field
                              label="Applicant Name"
                              value={sh.applicantName}
                            />
                            <Field
                              label="Identification Type"
                              value={getOptionLabel(
                                identificationTypeOptions,
                                sh.identificationType
                              )}
                            />
                            <Field
                              label="Identification No."
                              value={sh.identificationNo}
                            />
                            <Field
                              label="Nationality"
                              value={getOptionLabel(
                                nationalityOptions,
                                sh.nationality
                              )}
                            />
                            <Field
                              label="Tax Identifier Type"
                              value={getOptionLabel(
                                taxIdentifierTypeOptions,
                                sh.taxIdentifierType
                              )}
                            />
                            {isNationalityBhutanese(sh.nationality) && (
                              <Field
                                label="Household Number"
                                value={sh.householdNumber}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CEO */}
                  {ceo && ceo.applicantName && (
                    <div className="space-y-6 pt-8 border-t border-dashed">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-gray-600" /> 2. CEO
                        Personal Details
                      </h3>
                      <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <Field
                            label="Applicant Name"
                            value={ceo.applicantName}
                          />
                          <Field
                            label="Identification Type"
                            value={getOptionLabel(
                              identificationTypeOptions,
                              ceo.identificationType
                            )}
                          />
                          <Field
                            label="Identification No."
                            value={ceo.identificationNo}
                          />
                          <Field
                            label="Nationality"
                            value={getOptionLabel(
                              nationalityOptions,
                              ceo.nationality
                            )}
                          />
                          <Field
                            label="Tax Identifier Type"
                            value={getOptionLabel(
                              taxIdentifierTypeOptions,
                              ceo.taxIdentifierType
                            )}
                          />
                          {isNationalityBhutanese(ceo.nationality) && (
                            <Field
                              label="Household Number"
                              value={ceo.householdNumber}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Board Members */}
                  {boardMembers.length > 0 && (
                    <div className="space-y-6 pt-8 border-t border-dashed">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-600" /> 3. Board of
                        Directors Information
                      </h3>
                      {boardMembers.map((bm: any, idx: number) => (
                        <div
                          key={idx}
                          className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 mb-6"
                        >
                          <h4 className="text-xl font-bold text-gray-800 mb-6">
                            Director {idx + 1} Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Field
                              label="Applicant Name"
                              value={bm.applicantName}
                            />
                            <Field
                              label="Identification Type"
                              value={getOptionLabel(
                                identificationTypeOptions,
                                bm.identificationType
                              )}
                            />
                            <Field
                              label="Identification No."
                              value={bm.identificationNo}
                            />
                            <Field
                              label="Nationality"
                              value={getOptionLabel(
                                nationalityOptions,
                                bm.nationality
                              )}
                            />
                            <Field
                              label="Tax Identifier Type"
                              value={getOptionLabel(
                                taxIdentifierTypeOptions,
                                bm.taxIdentifierType
                              )}
                            />
                            {isNationalityBhutanese(bm.nationality) && (
                              <Field
                                label="Household Number"
                                value={bm.householdNumber}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Other Business Types - Simplified Display */}
              {businessData.businessType &&
                ![
                  "Sole Proprietorship",
                  "Partnership",
                  "Private Limited Company",
                ].includes(businessData.businessType) && (
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-600 text-sm text-blue-800">
                    <strong>Note:</strong> {businessData.businessType}{" "}
                    ownership/management details are included in the submitted
                    data.
                  </div>
                )}
            </div>
          )}
        </div>
      </AccordionSection>

      {/* SECURITY DETAILS - Step 3 */}
      <AccordionSection
        title="Security Details"
        defaultOpen
        onEdit={onEditStep ? () => onEditStep(3) : undefined}
      >
        {securitiesData.length === 0 ? (
          <p className="text-gray-500 italic">No security details provided.</p>
        ) : (
          <div className="space-y-8">
            {securitiesData.map((security: any, secIndex: number) => {
              if (!security.securityType || security.securityType.toLowerCase() === "not applicable") {
                return (
                  <div key={secIndex} className="p-4 border rounded-lg bg-gray-50">
                    <p className="text-gray-500 italic">Security not applicable for this loan application.</p>
                  </div>
                );
              }

              const secGewogOpts = securityGewogOptionsMap[secIndex] || [];

              return (
                <div key={secIndex} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm relative">
                  <h4 className="text-xl font-bold text-[#003DA5] mb-6 border-b border-gray-100 pb-2">
                    {securitiesData.length > 1 ? `Security / Collateral ${secIndex + 1}` : "Primary Security/Collateral"}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                    <Field label="Security Type" value={security.securityType} capitalizeFirst />
                    <Field label="Security Ownership" value={security.ownershipType} capitalizeFirst />
                  </div>

                  {/* Land Security Details */}
                  {security.securityType?.toLowerCase() === "land" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                      <Field label="Thram No." value={security.thramNo || "N/A"} />
                      <Field label="Plot No." value={security.plotNo || "N/A"} />
                      <Field label="Area (Sq.Ft)" value={security.area || "N/A"} />
                      <Field label="Land Use Type" value={security.landUse || "N/A"} />
                      <Field label="Dzongkhag" value={getOptionLabel(dzongkhagOptions, security.dzongkhag)} />
                      <Field label="Gewog" value={getOptionLabel(secGewogOpts, security.gewog)} />
                      <Field label="Village/Street" value={security.village || "N/A"} />
                      <Field label="House No." value={security.houseNo || "N/A"} />
                    </div>
                  )}

                  {/* Building Security Details */}
                  {security.securityType?.toLowerCase() === "building" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                      <Field label="Building Type" value={security.buildingType || "N/A"} capitalizeFirst />
                      <Field label="House No." value={security.houseNo || "N/A"} />
                      <Field label="Year of Construction" value={security.buildingYear || "N/A"} />
                      <Field label="Thram No." value={security.thramNo || "N/A"} />
                      <Field label="Plot No." value={security.plotNo || "N/A"} />
                      <Field label="Dzongkhag" value={getOptionLabel(dzongkhagOptions, security.dzongkhag)} />
                      <Field label="Gewog" value={getOptionLabel(secGewogOpts, security.gewog)} />
                      <Field label="Village/Street" value={security.village || "N/A"} />
                    </div>
                  )}

                  {/* Vehicle Security Details */}
                  {security.securityType?.toLowerCase() === "vehicle" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                      <Field label="Vehicle Type" value={security.vehicleType || "N/A"} />
                      <Field label="Make/Brand" value={security.vehicleMake || "N/A"} />
                      <Field label="Model" value={security.vehicleModel || "N/A"} />
                      <Field label="Year of Manufacture" value={security.vehicleYear || "N/A"} />
                      <Field label="Registration No." value={security.registrationNo || "N/A"} />
                      <Field label="Chassis No." value={security.chassisNo || "N/A"} />
                      <Field label="Engine No." value={security.engineNo || "N/A"} />
                    </div>
                  )}

                  {/* Equipment Security Details */}
                  {security.securityType?.toLowerCase() === "equipment" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                      <Field label="Make/Brand" value={security.equipmentMake || "N/A"} />
                      <Field label="Model" value={security.equipmentModel || "N/A"} />
                      <Field label="Identification No." value={security.equipmentSerialNo || "N/A"} />
                      <Field label="Equipment Value (Nu.)" value={security.equipmentValue || "N/A"} />
                    </div>
                  )}

                  {/* Insurance Security Details */}
                  {security.securityType?.toLowerCase() === "insurance" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                      <Field label="Insurance Company" value={security.insuranceCompany || "N/A"} />
                      <Field label="Policy No." value={security.policyNo || "N/A"} />
                      <Field label="Insurance Value" value={security.insuranceValue || "N/A"} />
                      <Field label="Start Date" value={formatDateForInput(security.insuranceStartDate)} />
                      <Field label="Expiry Date" value={formatDateForInput(security.insuranceExpiryDate)} />
                    </div>
                  )}

                  {/* Pension/Provident Security Details */}
                  {security.securityType?.toLowerCase() === "ppf" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                      <Field label="Institution Name" value={security.ppfInstitution || "N/A"} />
                      <Field label="Provident Fund No." value={security.ppfFundNo || "N/A"} />
                      <Field label="Account No." value={security.ppfAccountNo || "N/A"} />
                      <Field label="Fund Value (Nu.)" value={security.ppfValue || "N/A"} />
                    </div>
                  )}

                  {/* Share Details */}
                  {security.securityType?.toLowerCase() === "share" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                      <Field label="Company Name" value={security.shareCompany || "N/A"} />
                      <Field label="Numbers of Share" value={security.shareCertificateNo || "N/A"} />
                      <Field label="Number of Volume" value={security.shareRegistrationNo || "N/A"} />
                    </div>
                  )}

                  {/* Stocks Details */}
                  {security.securityType?.toLowerCase() === "stocks" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                      <Field label="Stock Name" value={security.stockName || "N/A"} />
                      <Field label="Quantity" value={security.stockQuantity || "N/A"} />
                      <Field label="Stock Value (Nu.)" value={security.stockValue || "N/A"} />
                    </div>
                  )}

                  {/* Fixed Deposit Details */}
                  {security.securityType?.toLowerCase() === "fd" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                      <Field label="Bank Name" value={getOptionLabel(banksOptions, security.fdBank)} />
                      <Field label="FD Account No." value={security.fdAccountNo || "N/A"} />
                      <Field label="Deposit Amount (Nu.)" value={security.fdAmount || "N/A"} />
                      <Field label="Maturity Date" value={formatDateForInput(security.fdMaturityDate)} />
                    </div>
                  )}

                  {/* Security Proof Document */}
                  <div className="pt-6 mt-6 border-t border-gray-100">
                    <FileDisplayField
                      label="Security Proof Document"
                      fileName={security.securityProof}
                      fileId={security.securityProofId}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========== SECURITY GUARANTORS - CONDITIONALLY RENDERED ========== */}
        {securityGuarantorsData && securityGuarantorsData.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4 bg-gray-50 p-2 rounded">
              Security Guarantors ({securityGuarantorsData.length})
            </h4>
            <div className="space-y-6">
              {securityGuarantorsData.map((guarantor: any, index: number) => {
                const permGewogOpts = getGuarantorGewogOptions(index, 'sec-perm');
                const currGewogOpts = getGuarantorGewogOptions(index, 'sec-curr');
                const spousePermGewogOpts = getGuarantorGewogOptions(index, 'sec-spousePerm');
                const isGuarantorMarried = checkIsMarried(guarantor.maritalStatus);

                return (
                  <div
                    key={`sec-guarantor-${index}`}
                    className="border border-gray-200 rounded-lg p-6 bg-gray-50/50"
                  >
                    <h5 className="text-md font-bold text-gray-800 mb-4">
                      Security Guarantor {index + 1}
                    </h5>

                    {/* Guarantor Personal Information */}
                    <div className="mb-6">
                      <h6 className="font-semibold text-gray-700 mb-3">
                        Personal Information
                      </h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Field label="Salutation" value={guarantor.salutation} />
                        <Field label="Applicant Name" value={guarantor.applicantName} />
                        <Field
                          label="Identification Type"
                          value={getOptionLabel(identificationTypeOptions, guarantor.identificationType)}
                        />
                        <Field label="Identification No." value={guarantor.identificationNo} />
                        <Field
                          label="Nationality"
                          value={getOptionLabel(nationalityOptions, guarantor.nationality)}
                        />
                        <Field
                          label="Tax Identifier Type"
                          value={getOptionLabel(taxIdentifierTypeOptions, guarantor.taxIdentifierType)}
                        />
                        {isNationalityBhutanese(guarantor.nationality) && (
                          <Field label="Household Number" value={guarantor.householdNumber} />
                        )}
                        <Field label="Gender" value={guarantor.gender} capitalizeFirst={true} />
                        <Field label="Date of Birth" value={formatDateForInput(guarantor.dateOfBirth)} />
                        <Field
                          label="Marital Status"
                          value={getOptionLabel(maritalStatusOptions, guarantor.maritalStatus)}
                        />
                        <Field label="TPN No" value={guarantor.tpn} />
                        <Field label="Bank Name" value={getOptionLabel(banksOptions, guarantor.bankName)} />
                        <Field label="Bank Account No." value={guarantor.bankAccount} />
                        <FileDisplayField label="Identification Proof" fileName={guarantor.idProof} fileId={guarantor.idProofId} />
                        <FileDisplayField label="Passport Photo" fileName={guarantor.passportPhoto} fileId={guarantor.passportPhotoId} />
                        <FileDisplayField label="Family Tree" fileName={guarantor.familyTree} fileId={guarantor.familyTreeId} />
                      </div>
                    </div>

                    {/* Conditional Guarantor Spouse Info */}
                    {isGuarantorMarried && (
                      <div className="mb-6 pt-4 border-t border-gray-200">
                        <h6 className="font-semibold text-gray-700 mb-3">
                          Spouse Personal Information
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <Field label="Spouse Salutation" value={guarantor.spouseSalutation} />
                          <Field label="Spouse Name" value={guarantor.spouseName} />
                          <Field
                            label="Spouse Identification Type"
                            value={getOptionLabel(identificationTypeOptions, guarantor.spouseIdType)}
                          />
                          <Field label="Spouse Identification No." value={guarantor.spouseCid} />
                          <Field
                            label="Spouse Nationality"
                            value={getOptionLabel(nationalityOptions, guarantor.spouseNationality)}
                          />
                          <Field
                            label="Spouse Tax Identifier Type"
                            value={getOptionLabel(taxIdentifierTypeOptions, guarantor.spouseTaxIdentifierType)}
                          />
                          {isNationalityBhutanese(guarantor.spouseNationality) && (
                            <Field label="Spouse Household Number" value={guarantor.spouseHouseholdNumber} />
                          )}
                          <Field label="Spouse Gender" value={guarantor.spouseGender} capitalizeFirst />
                          <Field label="Spouse Date of Birth" value={formatDateForInput(guarantor.spouseDateOfBirth)} />
                          <Field label="Spouse TPN No" value={guarantor.spouseTpnNumber} />
                          <Field label="Spouse Email" value={guarantor.spouseEmail} />
                          <Field label="Spouse Contact" value={guarantor.spouseCurrContact} />
                          <FileDisplayField label="Spouse Identification Proof" fileName={guarantor.spouseIdProof} fileId={guarantor.spouseIdProofId} />
                        </div>

                        <h6 className="font-semibold text-gray-700 mb-3 mt-6">
                          Spouse Permanent Address
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <Field
                            label="Country"
                            value={getOptionLabel(countryOptions, guarantor.spousePermCountry)}
                          />
                          {isBhutan(guarantor.spousePermCountry) ? (
                            <>
                              <Field
                                label="Dzongkhag"
                                value={getOptionLabel(dzongkhagOptions, guarantor.spousePermDzongkhag)}
                              />
                              <Field
                                label="Gewog"
                                value={getOptionLabel(spousePermGewogOpts, guarantor.spousePermGewog)}
                              />
                              <Field label="Village/Street" value={guarantor.spousePermVillage} />
                              <Field label="Thram No." value={guarantor.spousePermThram} />
                              <Field label="House No." value={guarantor.spousePermHouse} />
                            </>
                          ) : (
                            <>
                              <Field label="State" value={guarantor.spousePermDzongkhag} />
                              <Field label="Province" value={guarantor.spousePermGewog} />
                              <Field label="City" value={guarantor.spousePermCity} />
                              <FileDisplayField label="Address Proof" fileName={guarantor.spousePermAddressProof} fileId={guarantor.spousePermAddressProofId} />
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Guarantor Repayment Source */}
                    {(guarantor.repaymentSourceType || guarantor.amount || guarantor.proofFileName) && (
                      <div className="mb-6 pt-4 border-t border-gray-200">
                        <h6 className="font-semibold text-gray-700 mb-3">
                          Repayment Source
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Field label="Repayment Source Type" value={guarantor.repaymentSourceType} />
                          <Field label="Amount (Nu.)" value={guarantor.amount} />
                          <FileDisplayField label="Upload Proof" fileName={guarantor.proofFileName} fileId={guarantor.proofFileId} />
                        </div>
                      </div>
                    )}

                    {/* Guarantor Address Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                      {/* Permanent Address */}
                      <div>
                        <h6 className="font-semibold text-gray-700 mb-3">Permanent Address</h6>
                        <div className="space-y-3">
                          <Field label="Country" value={getOptionLabel(countryOptions, guarantor.permCountry)} />
                          {isBhutan(guarantor.permCountry) ? (
                            <>
                              <Field label="Dzongkhag" value={getOptionLabel(dzongkhagOptions, guarantor.permDzongkhag)} />
                              <Field label="Gewog" value={getOptionLabel(permGewogOpts, guarantor.permGewog)} />
                              <Field label="Village/Street" value={guarantor.permVillage} />
                              <Field label="Thram No." value={guarantor.permThram} />
                              <Field label="House No." value={guarantor.permHouse} />
                            </>
                          ) : (
                            <>
                              <Field label="State" value={guarantor.permDzongkhag} />
                              <Field label="Province" value={guarantor.permGewog} />
                              <Field label="Street" value={guarantor.permVillage} />
                              <FileDisplayField label="Address Proof" fileName={guarantor.permAddressProof} fileId={guarantor.permAddressProofId} />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Current Address */}
                      <div>
                        <h6 className="font-semibold text-gray-700 mb-3">Current/Residential Address</h6>
                        <div className="space-y-3">
                          <Field label="Country" value={getOptionLabel(countryOptions, guarantor.currCountry)} />
                          {isBhutan(guarantor.currCountry) ? (
                            <>
                              <Field label="Dzongkhag" value={getOptionLabel(dzongkhagOptions, guarantor.currDzongkhag)} />
                              <Field label="Gewog" value={getOptionLabel(currGewogOpts, guarantor.currGewog)} />
                              <Field label="Village/Street" value={guarantor.currVillage} />
                            </>
                          ) : (
                            <>
                              <Field label="State" value={guarantor.currDzongkhag} />
                              <Field label="Province" value={guarantor.currGewog} />
                              <Field label="Street" value={guarantor.currVillage} />
                              <FileDisplayField label="Address Proof" fileName={guarantor.currAddressProof} fileId={guarantor.currAddressProofId} />
                            </>
                          )}
                          <Field label="House/Building/Flat No." value={guarantor.currHouse} />
                          <Field label="Email" value={guarantor.email} />
                          <Field label="Contact No." value={guarantor.contact} />
                          <Field label="Alternate Contact" value={guarantor.currAlternateContact} />
                        </div>
                      </div>
                    </div>

                    {/* PEP Declaration */}
                    {guarantor.isPep && (
                      <div className="mt-6 border-t pt-4">
                        <h6 className="font-semibold text-gray-700 mb-3">PEP Declaration</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Field label="Politically Exposed Person" value={guarantor.isPep} capitalizeFirst={true} />
                          {guarantor.isPep === "yes" && (
                            <>
                              <Field label="PEP Category" value={getOptionLabel(pepCategoryOptions, guarantor.pepCategory)} />
                              <Field label="PEP Sub Category" value={guarantor.pepSubCategory} />
                            </>
                          )}
                          {guarantor.isPep === "no" && guarantor.relatedToPep && (
                            <Field label="Related to any PEP" value={guarantor.relatedToPep} capitalizeFirst={true} />
                          )}
                        </div>

                        {/* Guarantor Related PEPs array mapping */}
                        {guarantor.isPep === "no" && guarantor.relatedToPep === "yes" && guarantor.relatedPeps && guarantor.relatedPeps.length > 0 && (
                          <div className="mt-6">
                            <h6 className="font-semibold text-[#003DA5] mb-3">Related PEP Details</h6>
                            {guarantor.relatedPeps.map((pep: any, pepIdx: number) => (
                              <div key={pepIdx} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border border-gray-200 rounded bg-white mb-4">
                                <Field label="Relationship" value={pep.relationship} capitalizeFirst />
                                <Field label="PEP Category" value={getOptionLabel(pepCategoryOptions, pep.category)} />
                                <Field label="PEP Sub Category" value={pep.subCategory} />
                                <Field label="Full Name" value={pep.applicantName} />
                                <Field label="Identification Type" value={getOptionLabel(identificationTypeOptions, pep.identificationType)} />
                                <Field label="Identification No." value={pep.identificationNo} />
                                <Field label="Nationality" value={getOptionLabel(nationalityOptions, pep.nationality)} />
                                <Field label="Date of Birth" value={formatDateForInput(pep.dateOfBirth)} />
                                <FileDisplayField label="PEP Identification Proof" fileName={pep.identificationProof} fileId={pep.identificationProofId} />
                                <FileDisplayField label="Permanent Address Proof" fileName={pep.permAddressProof} fileId={pep.permAddressProofId} />
                                <FileDisplayField label="Current Address Proof" fileName={pep.currAddressProof} fileId={pep.currAddressProofId} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Employment Status */}
                    {guarantor.employmentStatus && (
                      <div className="mt-6 border-t pt-4">
                        <h6 className="font-semibold text-gray-700 mb-3">Employment Status</h6>
                        <Field label="Current Status" value={guarantor.employmentStatus} capitalizeFirst={true} />

                        {guarantor.employmentStatus === "employed" && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Field label="Employee ID" value={guarantor.employeeId} />
                            <Field label="Occupation" value={getOptionLabel(occupationOptions, guarantor.occupation)} />
                            <Field label="Employer Type" value={guarantor.employerType} capitalizeFirst={true} />
                            <Field label="Designation" value={guarantor.designation} />
                            <Field label="Grade" value={guarantor.grade} />
                            <Field label="Organization" value={getOptionLabel(organizationOptions, guarantor.organizationName)} />
                            <Field label="Organization Location" value={guarantor.orgLocation} />
                            <Field label="Joining Date" value={formatDateForInput(guarantor.joiningDate)} />
                            <Field label="Annual Salary" value={guarantor.annualSalary} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </AccordionSection>

      {/* REPAYMENT SOURCE - Step 4 */}
      <AccordionSection
        title="Repayment Source"
        defaultOpen
        onEdit={onEditStep ? () => onEditStep(4) : undefined}
      >
        <div className="space-y-8">
          {/* Primary Repayment Source */}
          <div>
            <h4 className="text-lg font-bold text-gray-800 mb-4 bg-gray-50 p-2 rounded">
              Primary Repayment Source
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field
                label="Repayment Source Type"
                value={repaymentData.repaymentSourceType}
              />
              <Field label="Amount (Nu.)" value={repaymentData.monthlyIncome} />
              <FileDisplayField
                label="Upload Proof"
                fileName={repaymentData.proofFileName}
                fileId={repaymentData.proofFileId}
              />
            </div>
          </div>

          {/* ========== REPAYMENT GUARANTORS - CONDITIONALLY RENDERED ========== */}
          {guarantorsData && guarantorsData.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-4 bg-gray-50 p-2 rounded">
                Guarantors ({guarantorsData.length})
              </h4>
              <div className="space-y-6">
                {guarantorsData.map((guarantor: any, index: number) => {
                  const permGewogOpts = getGuarantorGewogOptions(index, 'perm');
                  const currGewogOpts = getGuarantorGewogOptions(index, 'curr');
                  const spousePermGewogOpts = getGuarantorGewogOptions(index, 'spousePerm');
                  const isGuarantorMarried = checkIsMarried(guarantor.maritalStatus);

                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-6 bg-gray-50/50"
                    >
                      <h5 className="text-md font-bold text-gray-800 mb-4">
                        Guarantor {index + 1}
                      </h5>

                      {/* Guarantor Personal Information */}
                      <div className="mb-6">
                        <h6 className="font-semibold text-gray-700 mb-3">
                          Personal Information
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <Field
                            label="Salutation"
                            value={guarantor.salutation}
                          />
                          <Field
                            label="Applicant Name"
                            value={guarantor.applicantName}
                          />
                          <Field
                            label="Identification Type"
                            value={getOptionLabel(
                              identificationTypeOptions,
                              guarantor.identificationType
                            )}
                          />
                          <Field
                            label="Identification No."
                            value={guarantor.identificationNo}
                          />
                          <Field
                            label="Nationality"
                            value={getOptionLabel(
                              nationalityOptions,
                              guarantor.nationality
                            )}
                          />
                          <Field
                            label="Tax Identifier Type"
                            value={getOptionLabel(
                              taxIdentifierTypeOptions,
                              guarantor.taxIdentifierType
                            )}
                          />
                          {isNationalityBhutanese(guarantor.nationality) && (
                            <Field
                              label="Household Number"
                              value={guarantor.householdNumber}
                            />
                          )}
                          <Field
                            label="Gender"
                            value={guarantor.gender}
                            capitalizeFirst={true}
                          />
                          <Field
                            label="Date of Birth"
                            value={formatDateForInput(guarantor.dateOfBirth)}
                          />
                          <Field
                            label="Marital Status"
                            value={getOptionLabel(
                              maritalStatusOptions,
                              guarantor.maritalStatus
                            )}
                          />
                          <Field label="TPN No" value={guarantor.tpn} />
                          <Field
                            label="Bank Name"
                            value={getOptionLabel(banksOptions, guarantor.bankName)}
                          />
                          <Field
                            label="Bank Account No."
                            value={guarantor.bankAccount}
                          />
                          <FileDisplayField label="Identification Proof" fileName={guarantor.idProof} fileId={guarantor.idProofId} />
                          <FileDisplayField label="Passport Photo" fileName={guarantor.passportPhoto} fileId={guarantor.passportPhotoId} />
                          <FileDisplayField label="Family Tree" fileName={guarantor.familyTree} fileId={guarantor.familyTreeId} />
                        </div>
                      </div>

                      {/* Conditional Guarantor Spouse Info */}
                      {isGuarantorMarried && (
                        <div className="mb-6 pt-4 border-t border-gray-200">
                          <h6 className="font-semibold text-gray-700 mb-3">
                            Spouse Personal Information
                          </h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Field label="Spouse Salutation" value={guarantor.spouseSalutation} />
                            <Field label="Spouse Name" value={guarantor.spouseName} />
                            <Field
                              label="Spouse Identification Type"
                              value={getOptionLabel(identificationTypeOptions, guarantor.spouseIdType)}
                            />
                            <Field label="Spouse Identification No." value={guarantor.spouseCid} />
                            <Field
                              label="Spouse Nationality"
                              value={getOptionLabel(nationalityOptions, guarantor.spouseNationality)}
                            />
                            <Field
                              label="Spouse Tax Identifier Type"
                              value={getOptionLabel(taxIdentifierTypeOptions, guarantor.spouseTaxIdentifierType)}
                            />
                            {isNationalityBhutanese(guarantor.spouseNationality) && (
                              <Field label="Spouse Household Number" value={guarantor.spouseHouseholdNumber} />
                            )}
                            <Field label="Spouse Gender" value={guarantor.spouseGender} capitalizeFirst />
                            <Field label="Spouse Date of Birth" value={formatDateForInput(guarantor.spouseDateOfBirth)} />
                            <Field label="Spouse TPN No" value={guarantor.spouseTpnNumber} />
                            <Field label="Spouse Email" value={guarantor.spouseEmail} />
                            <Field label="Spouse Contact" value={guarantor.spouseCurrContact} />
                            <FileDisplayField label="Spouse Identification Proof" fileName={guarantor.spouseIdProof} fileId={guarantor.spouseIdProofId} />
                          </div>

                          <h6 className="font-semibold text-gray-700 mb-3 mt-6">
                            Spouse Permanent Address
                          </h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Field
                              label="Country"
                              value={getOptionLabel(countryOptions, guarantor.spousePermCountry)}
                            />
                            {isBhutan(guarantor.spousePermCountry) ? (
                              <>
                                <Field
                                  label="Dzongkhag"
                                  value={getOptionLabel(dzongkhagOptions, guarantor.spousePermDzongkhag)}
                                />
                                <Field
                                  label="Gewog"
                                  value={getOptionLabel(spousePermGewogOpts, guarantor.spousePermGewog)}
                                />
                                <Field label="Village/Street" value={guarantor.spousePermVillage} />
                                <Field label="Thram No." value={guarantor.spousePermThram} />
                                <Field label="House No." value={guarantor.spousePermHouse} />
                              </>
                            ) : (
                              <>
                                <Field label="State" value={guarantor.spousePermDzongkhag} />
                                <Field label="Province" value={guarantor.spousePermGewog} />
                                <Field label="City" value={guarantor.spousePermCity} />
                                <FileDisplayField label="Address Proof" fileName={guarantor.spousePermAddressProof} fileId={guarantor.spousePermAddressProofId} />
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Guarantor Repayment Source */}
                      <div className="mb-6 pt-4 border-t border-gray-200">
                        <h6 className="font-semibold text-gray-700 mb-3">
                          Repayment Source
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Field
                            label="Repayment Source Type"
                            value={guarantor.repaymentSourceType}
                          />
                          <Field label="Amount (Nu.)" value={guarantor.amount} />
                          <FileDisplayField
                            label="Upload Proof"
                            fileName={guarantor.proofFileName}
                            fileId={guarantor.proofFileId}
                          />
                        </div>
                      </div>

                      {/* Guarantor Address Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                        {/* Permanent Address */}
                        <div>
                          <h6 className="font-semibold text-gray-700 mb-3">
                            Permanent Address
                          </h6>
                          <div className="space-y-3">
                            <Field
                              label="Country"
                              value={getOptionLabel(
                                countryOptions,
                                guarantor.permCountry
                              )}
                            />
                            {isBhutan(guarantor.permCountry) ? (
                              <>
                                <Field
                                  label="Dzongkhag"
                                  value={getOptionLabel(
                                    dzongkhagOptions,
                                    guarantor.permDzongkhag
                                  )}
                                />
                                <Field
                                  label="Gewog"
                                  value={getOptionLabel(
                                    permGewogOpts,
                                    guarantor.permGewog
                                  )}
                                />
                                <Field
                                  label="Village/Street"
                                  value={guarantor.permVillage}
                                />
                                <Field
                                  label="Thram No."
                                  value={guarantor.permThram}
                                />
                                <Field
                                  label="House No."
                                  value={guarantor.permHouse}
                                />
                              </>
                            ) : (
                              <>
                                <Field
                                  label="State"
                                  value={guarantor.permDzongkhag}
                                />
                                <Field
                                  label="Province"
                                  value={guarantor.permGewog}
                                />
                                <Field
                                  label="Street"
                                  value={guarantor.permVillage}
                                />
                                <FileDisplayField
                                  label="Address Proof"
                                  fileName={guarantor.permAddressProof}
                                  fileId={guarantor.permAddressProofId}
                                />
                              </>
                            )}
                          </div>
                        </div>

                        {/* Current Address */}
                        <div>
                          <h6 className="font-semibold text-gray-700 mb-3">
                            Current/Residential Address
                          </h6>
                          <div className="space-y-3">
                            <Field
                              label="Country"
                              value={getOptionLabel(
                                countryOptions,
                                guarantor.currCountry
                              )}
                            />
                            {isBhutan(guarantor.currCountry) ? (
                              <>
                                <Field
                                  label="Dzongkhag"
                                  value={getOptionLabel(
                                    dzongkhagOptions,
                                    guarantor.currDzongkhag
                                  )}
                                />
                                <Field
                                  label="Gewog"
                                  value={getOptionLabel(
                                    currGewogOpts,
                                    guarantor.currGewog
                                  )}
                                />
                                <Field
                                  label="Village/Street"
                                  value={guarantor.currVillage}
                                />
                              </>
                            ) : (
                              <>
                                <Field
                                  label="State"
                                  value={guarantor.currDzongkhag}
                                />
                                <Field
                                  label="Province"
                                  value={guarantor.currGewog}
                                />
                                <Field
                                  label="Street"
                                  value={guarantor.currVillage}
                                />
                                <FileDisplayField
                                  label="Address Proof"
                                  fileName={guarantor.currAddressProof}
                                  fileId={guarantor.currAddressProofId}
                                />
                              </>
                            )}
                            <Field
                              label="House/Building/Flat No."
                              value={guarantor.currHouse}
                            />
                            <Field label="Email" value={guarantor.email} />
                            <Field
                              label="Contact No."
                              value={guarantor.contact}
                            />
                            <Field
                              label="Alternate Contact"
                              value={guarantor.currAlternateContact}
                            />
                          </div>
                        </div>
                      </div>

                      {/* PEP Declaration */}
                      {guarantor.isPep && (
                        <div className="mt-6 border-t pt-4">
                          <h6 className="font-semibold text-gray-700 mb-3">
                            PEP Declaration
                          </h6>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field
                              label="Politically Exposed Person"
                              value={guarantor.isPep}
                              capitalizeFirst={true}
                            />
                            {guarantor.isPep === "yes" && (
                              <>
                                <Field
                                  label="PEP Category"
                                  value={getOptionLabel(
                                    pepCategoryOptions,
                                    guarantor.pepCategory
                                  )}
                                />
                                <Field
                                  label="PEP Sub Category"
                                  value={guarantor.pepSubCategory}
                                />
                                <FileDisplayField
                                  label="PEP Identification Proof"
                                  fileName={guarantor.pepUpload}
                                  fileId={guarantor.pepUploadId}
                                />
                              </>
                            )}
                            {guarantor.isPep === "no" &&
                              guarantor.relatedToPep && (
                                <Field
                                  label="Related to any PEP"
                                  value={guarantor.relatedToPep}
                                  capitalizeFirst={true}
                                />
                              )}
                          </div>

                          {/* Guarantor Related PEPs array mapping */}
                          {guarantor.isPep === "no" && guarantor.relatedToPep === "yes" && guarantor.relatedPeps && guarantor.relatedPeps.length > 0 && (
                            <div className="mt-6">
                              <h6 className="font-semibold text-[#003DA5] mb-3">Related PEP Details</h6>
                              {guarantor.relatedPeps.map((pep: any, pepIdx: number) => (
                                <div key={pepIdx} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border border-gray-200 rounded bg-white mb-4">
                                  <Field label="Relationship" value={pep.relationship} capitalizeFirst />
                                  <Field label="PEP Category" value={getOptionLabel(pepCategoryOptions, pep.category)} />
                                  <Field label="PEP Sub Category" value={pep.subCategory} />
                                  <Field label="Full Name" value={pep.applicantName} />
                                  <Field label="Identification Type" value={getOptionLabel(identificationTypeOptions, pep.identificationType)} />
                                  <Field label="Identification No." value={pep.identificationNo} />
                                  <Field label="Nationality" value={getOptionLabel(nationalityOptions, pep.nationality)} />
                                  <Field label="Date of Birth" value={formatDateForInput(pep.dateOfBirth)} />
                                  <FileDisplayField label="PEP Identification Proof" fileName={pep.identificationProof} fileId={pep.identificationProofId} />
                                  <FileDisplayField label="Permanent Address Proof" fileName={pep.permAddressProof} fileId={pep.permAddressProofId} />
                                  <FileDisplayField label="Current Address Proof" fileName={pep.currAddressProof} fileId={pep.currAddressProofId} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Employment Status */}
                      {guarantor.employmentStatus && (
                        <div className="mt-6 border-t pt-4">
                          <h6 className="font-semibold text-gray-700 mb-3">
                            Employment Status
                          </h6>
                          <Field
                            label="Current Status"
                            value={guarantor.employmentStatus}
                            capitalizeFirst={true}
                          />

                          {guarantor.employmentStatus === "employed" && (
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <Field
                                label="Employee ID"
                                value={guarantor.employeeId}
                              />
                              <Field
                                label="Occupation"
                                value={getOptionLabel(
                                  occupationOptions,
                                  guarantor.occupation
                                )}
                              />
                              <Field
                                label="Employer Type"
                                value={guarantor.employerType}
                                capitalizeFirst={true}
                              />
                              <Field
                                label="Designation"
                                value={guarantor.designation}
                              />
                              <Field label="Grade" value={guarantor.grade} />
                              <Field
                                label="Organization"
                                value={getOptionLabel(
                                  organizationOptions,
                                  guarantor.organizationName
                                )}
                              />
                              <Field
                                label="Organization Location"
                                value={guarantor.orgLocation}
                              />
                              <Field
                                label="Joining Date"
                                value={formatDateForInput(guarantor.joiningDate)}
                              />
                              <Field
                                label="Annual Salary"
                                value={guarantor.annualSalary}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </AccordionSection>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 font-medium">
          ❌ {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 pt-6 sm:pt-8">
        <Button
          type="button"
          onClick={onBack}
          size="lg"
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="bg-[#003DA5] hover:bg-[#002D7A] text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Confirm & Submit"}
        </Button>
      </div>
    </form>
  );
}