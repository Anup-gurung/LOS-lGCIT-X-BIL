"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { de } from "date-fns/locale";
import { fetchBanks, fetchDzongkhag, fetchGewogsByDzongkhag, fetchPepCategory, fetchPepSubCategoryByCategory, fetchCountry, fetchNationality, fetchIdentificationType, fetchMaritalStatus, fetchTaxIdentifierType } from "@/services/api";

/* ----------------------- Types ----------------------- */

interface ConfirmationProps {
  onNext: (data: any) => void;
  onBack: () => void;
  formData: any;
}

/**
 * Reusable component to display dynamic PEP (Politically Exposed Person) declarations.
 * Handles both direct PEP status and related PEP details.
 */
function PepDeclarationDisplay({
  data,
  resolveDzongkhag,
  resolveGewog,
  resolvePepCategory,
  resolvePepSubCategory,
  resolveCountry,
  resolveNationality,
  resolveIdentificationType,
  resolveMaritalStatus,
  resolveTaxIdentifierType,
  title = "PEP Declarations"
}: {
  data: any;
  resolveDzongkhag: (val: any) => string;
  resolveGewog: (d: any, g: any) => string;
  resolvePepCategory: (code: any) => string;
  resolvePepSubCategory: (catCode: any, subCode: any) => string;
  resolveCountry: (val: any) => string;
  resolveNationality: (val: any) => string;
  resolveIdentificationType: (val: any) => string;
  resolveMaritalStatus: (val: any) => string;
  resolveTaxIdentifierType: (val: any) => string;
  title?: string;
}) {
  const isPep = String(data.isPep || data.pepPerson || "").trim().toLowerCase() === "yes";
  const relatedToPep = String(data.relatedToPep || data.pepRelated || "").trim().toLowerCase() === "yes";
  const relatedPeps = Array.isArray(data.relatedPeps) ? data.relatedPeps : [];

  if (!isPep && !relatedToPep) {
    return (
      <div className="mt-8 border-t border-dashed border-gray-200 pt-6">
        <h3 className="text-base sm:text-lg font-bold text-[#003DA5] mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[#003DA5] rounded-full"></span>
          {title}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Field label="Politically Exposed Person" value="No" />
          <Field label="Related to a PEP" value="No" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-dashed border-gray-200 pt-6 space-y-8">
      <h3 className="text-base sm:text-lg font-bold text-[#003DA5] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-[#003DA5] rounded-full"></span>
        {title}
      </h3>

      {/* Direct PEP Info */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          Personal PEP Status
          <hr className="flex-grow border-gray-200" />
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Field label="Politically Exposed Person" value={isPep ? "Yes" : "No"} />
          {isPep && (
            <>
              <Field 
                label="PEP Category" 
                value={resolvePepCategory(data.pepCategory || data.category || data.pep_category)} 
                capitalizeFirst 
              />
              <Field 
                label="PEP Sub-Category" 
                value={resolvePepSubCategory(
                  data.pepCategory || data.category || data.pep_category, 
                  data.pepSubCategory || data.subCategory || data.pep_sub_category
                )} 
                capitalizeFirst 
              />
            </>
          )}
        </div>
      </div>

      {/* Related PEP Info */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          Relation to a PEP
          <hr className="flex-grow border-gray-200" />
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Field label="Related to a PEP" value={relatedToPep ? "Yes" : "No"} />
        </div>

        {relatedToPep && relatedPeps.length > 0 && (
          <div className="space-y-6">
            {relatedPeps.map((pep: any, idx: number) => (
              <div key={idx} className="bg-gray-50/50 p-4 sm:p-6 rounded-xl border border-gray-200 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <h5 className="text-sm font-bold text-[#003DA5] uppercase">Related PEP {idx + 1}: {pep.applicantName}</h5>
                  <span className="text-xs font-semibold px-2 py-1 bg-[#003DA5]/10 text-[#003DA5] rounded">Relationship: {pep.relationship}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  <Field label="Salutation" value={pep.salutation} capitalizeFirst />
                  <Field label="Relationship" value={pep.relationship} capitalizeFirst />
                  <Field label="Nationality" value={resolveNationality(pep.nationality)} capitalizeFirst />
                  <Field label="Gender" value={pep.gender} capitalizeFirst />
                  <Field label="Date of Birth" value={pep.dateOfBirth} />
                  <Field label="Marital Status" value={resolveMaritalStatus(pep.maritalStatus)} capitalizeFirst />
                </div>

                <div className="space-y-4">
                  <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Identification & Tax</h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    <Field label="Identification Type" value={resolveIdentificationType(pep.identificationType)} capitalizeFirst />
                    <Field label="Identification No" value={pep.identificationNo} />
                    <Field label="Issue Date" value={pep.identificationIssueDate} />
                    <Field label="Expiry Date" value={pep.identificationExpiryDate} />
                    <Field label="TPN" value={pep.tpn} />
                    <Field label="Tax ID Type" value={resolveTaxIdentifierType(pep.taxIdentifierType)} />
                    <Field label="Household No" value={pep.householdNumber} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PEP Position</h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    <Field label="PEP Category" value={resolvePepCategory(pep.category)} capitalizeFirst />
                    <Field label="PEP Sub-Category" value={resolvePepSubCategory(pep.category, pep.subCategory)} capitalizeFirst />
                  </div>
                </div>

                <div className="space-y-4">
                  <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Permanent Address</h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    <Field label="Country" value={resolveCountry(pep.permCountry)} />
                    <Field label="Dzongkhag" value={resolveDzongkhag(pep.permDzongkhag)} />
                    <Field label="Gewog" value={resolveGewog(pep.permDzongkhag, pep.permGewog)} />
                    <Field label="Village/Street" value={pep.permVillage} />
                    <Field label="Thram No" value={pep.permThram} />
                    <Field label="House No" value={pep.permHouse} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current/Residential Address</h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    <Field label="Country" value={resolveCountry(pep.currCountry)} />
                    <Field label="Dzongkhag" value={resolveDzongkhag(pep.currDzongkhag)} />
                    <Field label="Gewog" value={resolveGewog(pep.currDzongkhag, pep.currGewog)} />
                    <Field label="Village" value={pep.currVillage} />
                    <Field label="House/Flat No" value={pep.currFlat} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  <Field label="Contact No" value={pep.currContact} />
                  <Field label="Alternate Contact" value={pep.currAlternateContact || pep.alternateContact} />
                  <Field label="Email" value={pep.currEmail} />
                  <Field
                    label="Identity Proof"
                    value={
                      pep.identificationProof || pep.idProof
                        ? typeof (pep.identificationProof || pep.idProof) === 'string' 
                          ? (pep.identificationProof || pep.idProof) 
                          : (pep.identificationProof || pep.idProof).name
                        : "No file uploaded"
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Reusable Components ---------------- */

function AccordionSection({
  title,
  children,
  defaultOpen = false,
  headerClassName = "",
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  headerClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{ backgroundColor: open ? '#e68900' : '#ff9800' }}
        className={`w-full flex justify-between items-center px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-bold transition-colors text-white
          ${headerClassName}`}
      >
        {title}
        <span className="text-xl sm:text-2xl font-bold">
          {open ? "−" : "+"}
        </span>
      </button>

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
  capitalizeFirst?: boolean; // add this
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

/**
 * Reusable component to display comprehensive spouse details.
 * Structured with categorization and separation for better readability.
 */
function SpouseDisplay({
  data,
  resolveDzongkhag,
  resolveGewog,
  title = "Spouse Information"
}: {
  data: any;
  resolveDzongkhag: (val: any) => string;
  resolveGewog: (d: any, g: any) => string;
  title?: string;
}) {
  if (!data) return null;

  return (
    <div className="mt-8 pt-6 border-t border-[#003DA5]/20 space-y-8 bg-gray-50/30 p-4 sm:p-6 rounded-xl border">
      <h3 className="text-base sm:text-lg font-bold text-[#003DA5] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-[#003DA5] rounded-full"></span>
        {title}
      </h3>

      {/* category 1: basic information */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          Basic Information
          <hr className="flex-grow border-gray-200" />
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Field label="Salutation" value={data.spouseSalutation} capitalizeFirst />
          <Field label="Spouse Name" value={data.spouseName || data.name} capitalizeFirst />
          <Field label="Nationality" value={data.spouseNationality} capitalizeFirst />
          <Field label="Gender" value={data.spouseGender} capitalizeFirst />
          <Field label="Date of Birth" value={data.spouseDateOfBirth} />
        </div>
      </div>

      {/* category 2: identification details */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          Identification Details
          <hr className="flex-grow border-gray-200" />
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Field label="Identification Type" value={data.spouseIdentificationType} capitalizeFirst />
          <Field label="Identification No" value={data.spouseIdentificationNo || data.spouseCid} />
          <Field label="ID Issue Date" value={data.spouseIdentificationIssueDate} />
          <Field label="ID Expiry Date" value={data.spouseIdentificationExpiryDate} />
          <Field label="TPN" value={data.spouseTpn} />
          <Field label="Household Number" value={data.spouseHouseholdNumber} />
        </div>
      </div>

      {/* category 3: contact details */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          Contact Details
          <hr className="flex-grow border-gray-200" />
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Field label="Contact No" value={data.spouseContact} />
          <Field label="Email" value={data.spouseEmail} />
          <Field label="Alternate Contact" value={data.spouseAlternateContact} />
        </div>
      </div>

      {/* category 4: permanent address */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          Permanent Address
          <hr className="flex-grow border-gray-200" />
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Field label="Permanent Country" value={data.spousePermCountry} capitalizeFirst />
          <Field label="Dzongkhag/State" value={resolveDzongkhag(data.spousePermDzongkhag)} />
          <Field label="Gewog/Province" value={resolveGewog(data.spousePermDzongkhag, data.spousePermGewog)} />
          <Field label="Village/Street" value={data.spousePermVillage} capitalizeFirst />
          <Field label="Thram No" value={data.spousePermThram} />
          <Field label="House No" value={data.spousePermHouse} />
        </div>
      </div>

      {/* category 5: uploaded documents */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          Uploaded Documents
          <hr className="flex-grow border-gray-200" />
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Field
            label="Identity Proof"
            value={
              (() => {
                const proof = data.spouseIdentificationProof || data.spouseIdProofDocument || data.spouseIdProof;
                if (!proof) return "No file uploaded";
                return typeof proof === 'string' ? proof : proof.name;
              })()
            }
          />
          {data.spousePermCountry && String(data.spousePermCountry).trim().toLowerCase() !== "bhutan" && (
            <Field
              label="Address Proof"
              value={
                data.spousePermAddressProof
                  ? typeof data.spousePermAddressProof === 'string' ? data.spousePermAddressProof : data.spousePermAddressProof.name
                  : "No file uploaded"
              }
            />
          )}
        </div>
      </div>
    </div>

  );
}


/* -------------------- Main Page ---------------------- */

export function Confirmation({ onNext, onBack, formData }: ConfirmationProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Retrieve data from sessionStorage
  const [sessionData, setSessionData] = useState<any>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const [banksLoaded, setBanksLoaded] = useState(false);
  const [dzongkhags, setDzongkhags] = useState<any[]>([]);
  const [dzongkhagsLoaded, setDzongkhagsLoaded] = useState(false);
  const [gewogsMap, setGewogsMap] = useState<Record<string, any[]>>({});
  const [pepCategories, setPepCategories] = useState<any[]>([]);
  const [pepSubCategoriesMap, setPepSubCategoriesMap] = useState<Record<string, any[]>>({});
  const [pepLoaded, setPepLoaded] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [nationalities, setNationalities] = useState<any[]>([]);
  const [idTypes, setIdTypes] = useState<any[]>([]);
  const [maritalStatuses, setMaritalStatuses] = useState<any[]>([]);
  const [taxIdTypes, setTaxIdTypes] = useState<any[]>([]);
  const [metadataLoaded, setMetadataLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = (retries = 3) => {
      fetchBanks()
        .then((data) => {
          if (cancelled) return;
          if (data && data.length > 0) {
            setBanks(data);
          } else if (retries > 0) {
            // Retry after 800ms if we got an empty array (API may still be waking up)
            setTimeout(() => load(retries - 1), 800);
            return;
          }
          setBanksLoaded(true);
        })
        .catch((err) => {
          console.error("Failed to fetch banks in confirmation:", err);
          if (!cancelled) setBanksLoaded(true);
        });
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    fetchDzongkhag()
      .then((data) => {
        if (data) setDzongkhags(data);
        setDzongkhagsLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to fetch dzongkhags in confirmation:", err);
        setDzongkhagsLoaded(true);
      });
  }, []);

  useEffect(() => {
    fetchPepCategory()
      .then((data) => {
        if (data) setPepCategories(data);
        setPepLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to fetch PEP categories in confirmation:", err);
        setPepLoaded(true);
      });
  }, []);

  useEffect(() => {
    Promise.all([
      fetchCountry(),
      fetchNationality(),
      fetchIdentificationType(),
      fetchMaritalStatus(),
      fetchTaxIdentifierType()
    ]).then(([c, n, i, m, t]) => {
      if (c) setCountries(c);
      if (n) setNationalities(n);
      if (i) setIdTypes(i);
      if (m) setMaritalStatuses(m);
      if (t) setTaxIdTypes(t);
      setMetadataLoaded(true);
    }).catch(err => {
      console.error("Failed to fetch secondary metadata in confirmation:", err);
      setMetadataLoaded(true);
    });
  }, []);

  useEffect(() => {
    const allData = sessionData || formData || {};
    const usedCategoryCodes = new Set<string>();

    const extractCodes = (d: any) => {
      if (!d) return;
      // Category fields
      if (d.pepCategory) usedCategoryCodes.add(String(d.pepCategory));
      if (d.pep_category) usedCategoryCodes.add(String(d.pep_category));
      if (d.pep_category_pk_code) usedCategoryCodes.add(String(d.pep_category_pk_code));
      if (d.category) usedCategoryCodes.add(String(d.category));
      if (d.pep_category_pk_code) usedCategoryCodes.add(String(d.pep_category_pk_code));

      // Array fields (guarantors, co-borrowers, etc.)
      if (Array.isArray(d.relatedPeps)) {
        d.relatedPeps.forEach((rp: any) => {
          if (rp.category) usedCategoryCodes.add(String(rp.category));
          if (rp.pepCategory) usedCategoryCodes.add(String(rp.pepCategory));
          if (rp.pep_category) usedCategoryCodes.add(String(rp.pep_category));
          if (rp.pep_category_pk_code) usedCategoryCodes.add(String(rp.pep_category_pk_code));
        });
      }
      if (Array.isArray(d.guarantors)) {
        d.guarantors.forEach(extractCodes);
      }
      if (Array.isArray(d.coBorrowers)) {
        d.coBorrowers.forEach(extractCodes);
      }
      if (Array.isArray(d.coBorrowerDetails)) {
        d.coBorrowerDetails.forEach(extractCodes);
      }
    };

    // Personal
    extractCodes(allData.personalDetails || allData);
    // Co-borrowers (try both variants)
    if (Array.isArray(allData.coBorrowers)) {
      allData.coBorrowers.forEach(extractCodes);
    }
    if (Array.isArray(allData.coBorrowerDetails)) {
      allData.coBorrowerDetails.forEach(extractCodes);
    }
    // Security Guarantors
    if (Array.isArray(allData.additionalGuarantors)) {
      allData.additionalGuarantors.forEach(extractCodes);
    }
    // Repayment Source (which may contain a guarantors array)
    if (allData.repaymentSource) {
      extractCodes(allData.repaymentSource);
    }

    usedCategoryCodes.forEach((code) => {
      if (!code) return;

      // Ensure we have a PK code for the fetch (code might already be a label)
      let pkCode = code;
      const matchedCat = pepCategories.find(
        (c) => String(c.pep_category || "").toLowerCase() === code.toLowerCase()
      );
      if (matchedCat) {
        pkCode = String(matchedCat.pep_category_pk_code || matchedCat.id || code);
      }

      if (pkCode && !pepSubCategoriesMap[pkCode]) {
        fetchPepSubCategoryByCategory(pkCode)
          .then((data) => {
            if (data && Array.isArray(data)) {
              setPepSubCategoriesMap((prev) => ({
                ...prev,
                [pkCode]: data,
                [code]: data, // Store under label too for direct lookup fallback
              }));
            }
          })
          .catch((err) =>
            console.error(
              `Failed to fetch subcategories for category ${pkCode} (derived from ${code}):`,
              err
            )
          );
      }
    });
  }, [sessionData, formData, pepCategories]);

  useEffect(() => {
    const storedData = sessionStorage.getItem('loanApplicationForm');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setSessionData(parsed);
        console.log('Retrieved from sessionStorage:', parsed);
      } catch (e) {
        console.error('Failed to parse sessionStorage data:', e);
      }
    }
  }, []);

  /**
   * Resolves a stored bankName value (pk code or label) to a human-readable bank name.
   * Tries every possible pk field variant (mirrors what the dropdown stores),
   * then falls back to a name match if no pk match is found.
   */
  const resolveBank = (value: any): string => {
    if (!value) return "";
    const strValue = String(value).trim();
    if (!strValue) return "";

    // Still fetching — show blank so no raw pk codes flash on screen
    if (!banksLoaded && !banks.length) return "";

    // Banks loaded but empty (API failure) — nothing we can do, show value
    if (!banks.length) return strValue;

    // Debug: log the first bank so you can see the actual field names
    if (banks.length > 0) {
      console.log('[resolveBank] sample bank entry:', banks[0], '| looking for:', strValue);
    }

    // Helper: get the label for a bank entry
    const getLabel = (b: any) =>
      b.bank_name || b.name || b.label || b.bankName || b.bank || strValue;

    // 1. Try pk-code match using || (mirrors PersonalDetail's dropdown value logic)
    const byPk = banks.find((b) => {
      const candidates = [
        // Primary: same || chain the dropdown uses
        String(b.bank_pk_code || b.id || b.code || b.bank_code || b.value || ''),
        // Individual fields as fallback
        b.bank_pk_code !== undefined && b.bank_pk_code !== null ? String(b.bank_pk_code) : null,
        b.pk_code !== undefined && b.pk_code !== null ? String(b.pk_code) : null,
        b.id !== undefined && b.id !== null ? String(b.id) : null,
        b.code !== undefined && b.code !== null ? String(b.code) : null,
        b.bank_code !== undefined && b.bank_code !== null ? String(b.bank_code) : null,
        b.value !== undefined && b.value !== null ? String(b.value) : null,
      ].filter((c): c is string => !!c && c.trim() !== '').map(c => c.trim());
      return candidates.includes(strValue);
    });
    if (byPk) return getLabel(byPk);

    // 2. Try name match (stored value might already be a human-readable label)
    const byName = banks.find((b) =>
      getLabel(b).toLowerCase() === strValue.toLowerCase()
    );
    if (byName) return getLabel(byName);

    // 3. Fallback — return as stored
    return strValue;
  };

  /**
   * Helper to determine if a marital status value represents "Married".
   * Handles both human-readable labels and common PK code patterns.
   */
  const isMarried = (status: any) => {
    if (!status) return false;
    const s = String(status).trim().toLowerCase();
    return s === "married" || (s.includes("married") && !s.includes("unmarried"));
  };

  /**
   * Resolves a dzongkhag value to a human-readable name.
   */
  const resolveDzongkhag = (value: any): string => {
    if (!value) return "";
    const strValue = String(value).trim();
    if (!strValue) return "";

    if (!dzongkhagsLoaded && !dzongkhags.length) return "";

    const matched = dzongkhags.find(
      (d) =>
        String(d.dzongkhag_pk_code || d.id || d.pk_dzongkhag_id || "") ===
        strValue
    );
    return matched
      ? matched.dzongkhag_name || matched.dzongkhag || matched.name || strValue
      : strValue;
  };

  /**
   * Resolves a PEP category PK code to a human-readable name.
   */
  const resolvePepCategory = (code: any): string => {
    if (!code) return "";
    const strCode = String(code).trim();
    if (!strCode) return "";

    if (!pepLoaded && !pepCategories.length) return "";

    const matched = pepCategories.find(
      (c) =>
        String(c.pep_category_pk_code || c.id || "") === strCode ||
        String(c.pep_category || "").toLowerCase() === strCode.toLowerCase()
    );
    return matched ? matched.pep_category || matched.name || strCode : strCode;
  };

  /**
   * Resolves a PEP sub-category PK code to a human-readable name.
   */
  const resolvePepSubCategory = (categoryCode: any, subCode: any): string => {
    if (!subCode) return "";
    const strCatCode = String(categoryCode || "").trim();
    const strSubCode = String(subCode).trim();
    if (!strSubCode) return "";

    // 1. Try resolving using the specific category's sub-list
    const subList = pepSubCategoriesMap[strCatCode];
    if (subList) {
      const matched = subList.find(
        (s) =>
          String(s.pep_sub_category_pk_code || s.id || "") === strSubCode ||
          String(s.pep_sub_category || "").toLowerCase() === strSubCode.toLowerCase()
      );
      if (matched) return matched.pep_sub_category || matched.name || strSubCode;
    }

    // 2. Resilience: If not found in primary list, search through ALL loaded sub-category lists
    // (Handles cases where categoryCode might be a label, null, or mismatched)
    for (const catKey in pepSubCategoriesMap) {
      const list = pepSubCategoriesMap[catKey];
      if (Array.isArray(list)) {
        const matched = list.find(
          (s) =>
            String(s.pep_sub_category_pk_code || s.id || "") === strSubCode ||
            String(s.pep_sub_category || "").toLowerCase() === strSubCode.toLowerCase()
        );
        if (matched) return matched.pep_sub_category || matched.name || strSubCode;
      }
    }

    return strSubCode;
  };

  /**
   * Resolves a gewog value to a human-readable name based on dzongkhag.
   */
  const resolveGewog = (dzongkhagValue: any, gewogValue: any): string => {
    if (!gewogValue) return "";
    const dzongPk = String(dzongkhagValue || "").trim();
    const gewogPk = String(gewogValue).trim();

    const gewogList = gewogsMap[dzongPk];
    if (!gewogList) return gewogPk;

    const matched = gewogList.find((g) =>
      String(g.gewog_pk_code || g.pk_gewog_id || g.gewog_pk_id || g.id || "") === gewogPk
    );

    return matched ? (matched.gewog_name || matched.gewog || matched.name || gewogPk) : gewogPk;
  };

  /**
   * Resolves a country value to a human-readable name.
   */
  const resolveCountry = (value: any): string => {
    if (!value) return "";
    const strValue = String(value).trim();
    if (!strValue) return "";
    const matched = countries.find(c => 
      String(c.country_pk_code || c.id || "") === strValue ||
      String(c.country || "").toLowerCase() === strValue.toLowerCase()
    );
    return matched ? (matched.country_name || matched.country || matched.name || strValue) : strValue;
  };

  /**
   * Resolves a nationality value to a human-readable name.
   */
  const resolveNationality = (value: any): string => {
    if (!value) return "";
    const strValue = String(value).trim();
    if (!strValue) return "";
    const matched = nationalities.find(n => 
      String(n.nationality_pk_code || n.id || "") === strValue ||
      String(n.nationality || "").toLowerCase() === strValue.toLowerCase()
    );
    return matched ? (matched.nationality || matched.name || strValue) : strValue;
  };

  /**
   * Resolves an identification type value to a human-readable name.
   */
  const resolveIdentificationType = (value: any): string => {
    if (!value) return "";
    const strValue = String(value).trim();
    if (!strValue) return "";
    const matched = idTypes.find(i => 
      String(i.identity_type_pk_code || i.id || "") === strValue ||
      String(i.identity_type || "").toLowerCase() === strValue.toLowerCase()
    );
    return matched ? (matched.identity_type || matched.name || strValue) : strValue;
  };

  /**
   * Resolves a marital status value to a human-readable name.
   */
  const resolveMaritalStatus = (value: any): string => {
    if (!value) return "";
    const strValue = String(value).trim();
    if (!strValue) return "";
    const matched = maritalStatuses.find(m => 
      String(m.marital_status_pk_code || m.id || "") === strValue ||
      String(m.marital_status || "").toLowerCase() === strValue.toLowerCase()
    );
    return matched ? (matched.marital_status || matched.name || strValue) : strValue;
  };

  /**
   * Resolves a tax identifier type value to a human-readable name.
   */
  const resolveTaxIdentifierType = (value: any): string => {
    if (!value) return "";
    const strValue = String(value).trim();
    if (!strValue) return "";
    const matched = taxIdTypes.find(t => 
      String(t.tax_identifier_type_pk_code || t.id || "") === strValue ||
      String(t.tax_identifier_type || "").toLowerCase() === strValue.toLowerCase()
    );
    return matched ? (matched.tax_identifier_type || matched.name || strValue) : strValue;
  };

  // Effect to load gewogs for all dzongkhags found in the form (securities, PEP relatives, etc.)
  useEffect(() => {
    const allData = sessionData || formData || {};
    const usedDzongkhags = new Set<string>();

    // 1. Collect from Securities
    const securities = Array.isArray(allData.securityDetails) ? allData.securityDetails : (allData.securityDetails ? [allData.securityDetails] : []);
    securities.forEach((s: any) => {
      if (s.dzongkhag) usedDzongkhags.add(String(s.dzongkhag).trim());
    });

    // 2. Helper to collect from PEP objects
    const collectFromPep = (d: any) => {
      if (!d) return;
      if (Array.isArray(d.relatedPeps)) {
        d.relatedPeps.forEach((rp: any) => {
          if (rp.permDzongkhag) usedDzongkhags.add(String(rp.permDzongkhag).trim());
          if (rp.currDzongkhag) usedDzongkhags.add(String(rp.currDzongkhag).trim());
        });
      }
    };

    // 3. Scan all sections for PEP relatives
    collectFromPep(allData.personalDetails || allData);
    if (Array.isArray(allData.coBorrowers)) allData.coBorrowers.forEach(collectFromPep);
    if (Array.isArray(allData.additionalGuarantors)) allData.additionalGuarantors.forEach(collectFromPep);
    if (allData.repaymentSource?.guarantors) allData.repaymentSource.guarantors.forEach(collectFromPep);

    // 4. Fetch missing gewogs
    usedDzongkhags.forEach((pk) => {
      if (pk && !gewogsMap[pk]) {
        fetchGewogsByDzongkhag(pk)
          .then((data) => {
            if (data) {
              setGewogsMap((prev) => ({ ...prev, [pk]: data }));
            }
          })
          .catch((err) => console.error(`Failed to fetch gewogs for dzongkhag ${pk}:`, err));
      }
    });
  }, [sessionData, formData, dzongkhagsLoaded]);

  // Use sessionStorage data if available, otherwise fallback to formData
  const allData = sessionData || formData || {};

  // Loan details are stored under the nested "loandetail" key (set by saveFormDataToSession in page.tsx)
  const loanDetail = allData?.loandetail || {};
  const loanData = {
    loanType: loanDetail.loanTypeString || loanDetail.loanType || allData?.loanTypeString || allData?.loanType || "",
    loanSector: loanDetail.loanSectorString || loanDetail.loanSector || allData?.loanSectorString || allData?.loanSector || "",
    loanSubSector: loanDetail.loanSubSectorString || loanDetail.loanSubSector || allData?.loanSubSectorString || allData?.loanSubSector || "",
    loanSubSectorCategory: loanDetail.loanSubSectorCategoryString || loanDetail.loanSubSectorCategory || allData?.loanSubSectorCategoryString || allData?.loanSubSectorCategory || "",
    loanAmount: loanDetail.loanAmount || allData?.loanAmount || "",
    loanPurpose: loanDetail.loanPurpose || allData?.loanPurpose || "",
    tenure: loanDetail.selectedMonths || (loanDetail.selectedYears ? loanDetail.selectedYears + " years" : "") || allData?.selectedMonths || "",
    interestRate: loanDetail.interestRate || allData?.interestRate || "",
  };

  // Personal details are stored under "personalDetails"
  const personalData = allData?.personalDetails || {};

  // Co-borrower data is stored under "coBorrowers" (array)
  const coBorrowerData = allData?.coBorrowers || [];

  // Security details stored under "securityDetails" (array)
  const securityDataRaw = allData?.securityDetails || [];
  const securityData = Array.isArray(securityDataRaw) ? securityDataRaw[0] || {} : securityDataRaw || {};
  const allSecurities = Array.isArray(securityDataRaw) ? securityDataRaw : [securityDataRaw].filter(Boolean);

  // Additional (security) guarantors stored under "additionalGuarantors"
  const securityGuarantors = allData?.additionalGuarantors || [];

  // Repayment source stored under "repaymentSource"
  const repaymentData = allData?.repaymentSource || {};
  const repaymentGuarantors = repaymentData?.guarantors || [];

  console.log('Confirmation page data:', {
    loanData,
    personalData,
    coBorrowerData,
    allSecurities,
    securityGuarantors,
    repaymentData,
    repaymentGuarantors,
  });

  /* ---------------- Payload Builder ---------------- */

  const buildBilPayload = () => ({
    loanData: {
      loanType: loanData.loanType,
      loanSector: loanData.loanSector,
      loanSubSector: loanData.loanSubSector,
      loanSubSectorCategory: loanData.loanSubSectorCategory,
      loanAmount: loanData.loanAmount,
      loanPurpose: loanData.loanPurpose,
      tenure: loanData.tenure,
      interestRate: loanData.interestRate,
    },
    personalData: {
      salutation: personalData.salutation,
      applicantName: personalData.applicantName,
      nationality: personalData.nationality,
      cid: personalData.identificationNo,
      issueDate: personalData.identificationIssueDate,
      expiryDate: personalData.identificationExpiryDate,
      gender: personalData.gender,
      dob: personalData.dateOfBirth,
      maritalStatus: personalData.maritalStatus,
      tpn: personalData.tpn,
      spouseName: personalData.spouseName,
      spouseCid: personalData.spouseCid,
      spouseContact: personalData.spouseContact,
      familyTreeDocs: personalData.familyTree,
      bankName: personalData.bankName,
      bankAccount: personalData.bankAccount,
      passportPhoto: personalData.passportPhoto,
      contact: personalData.currContact,
      alternatePhone: personalData.alternatePhone,
      email: personalData.currEmail,
      permCountry: personalData.permCountry,
      permDzongkhag: personalData.permDzongkhag,
      permanentGewog: personalData.permanentGewog,
      permVillage: personalData.permVillage,
      permThram: personalData.permThram,
      permHouse: personalData.permHouse,
      currCountry: personalData.currCountry,
      currDzongkhag: personalData.currDzongkhag,
      currGewog: personalData.currGewog,
      currVillage: personalData.currVillage,
      currFlat: personalData.currFlat,
      pep: personalData.pepPerson,
      proofDoc: personalData.identificationProof,
      pepSubCategory: personalData.pepSubCategory,
      pepRelated: personalData.pepRelated,
      pepRelationship: personalData.pepRelationship,
      // pepRelatedPepCategroy:personalData.
      pepIdentificationNo: personalData.pepIdentificationNo,
      pepCategory: personalData.pepCategory,
      pepSubCat2: personalData.pepSubCat2,
      empolymentStatus: personalData.employmentStatus,
      occupation: personalData.occupation,
      organizationName: personalData.organizationName,
      employerType: personalData.employerType,
      orgLocation: personalData.orgLocation,
      employeeId: personalData.employeeId,
      joiningDate: personalData.joiningDate,
      designation: personalData.designation,
      grade: personalData.grade,
      employeeType: personalData.employeeType,
      grossIncome: personalData.annualIncome,
    },

    coBorrowerData: {
      salutation: coBorrowerData.salutation,
      name: coBorrowerData.name,
      nationality: coBorrowerData.nationality,
      identificationType: coBorrowerData.identificationType,
      cid: coBorrowerData.cid,
      pep: coBorrowerData.pep,
      pep_related: coBorrowerData.pepRelated,
      identification_proof: coBorrowerData.identificationProof,
      relationship: coBorrowerData.relationship,
      contact: coBorrowerData.alternateContactNo,
      alternatePhone: coBorrowerData.alternatePhone,
    },

    securityData: {
      securityType: securityData.securityType,
      propertyLocation: securityData.propertyLocation,
      estimatedValue: securityData.estimatedValue,
    },

    repaymentData: {
      source: repaymentData.source,
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

      /* 🔹 Append structured data */
      Object.entries(bilPayload).forEach(([section, data]) => {
        if (typeof data === "object" && data !== null) {
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              fd.append(`${section}[${key}]`, String(value));
            }
          });
        }
      });

      /* 🔹 Append files */
      if (personalData.passportPhotoFile instanceof File) {
        fd.append("passportPhoto", personalData.passportPhotoFile);
      }

      if (personalData.currAddressProofFile instanceof File) {
        fd.append("currentAddressProof", personalData.currAddressProofFile);
      }

      if (personalData.permAddressProofFile instanceof File) {
        fd.append("permanentAddressProof", personalData.permAddressProofFile);
      }

      /* 🔍 DEBUG */
      console.log("---- FORM DATA DEBUG ----");
      for (const [k, v] of fd.entries()) {
        console.log(k, v);
      }

      /* 🔹 API Call */
      const res = await fetch(
        "http://119.2.100.178/api/cdms/onboard-customer",
        {
          method: "POST",
          body: fd,
        },
      );

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

  /* -------------------- UI ----------------------- */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 sm:space-y-8 md:space-y-10 pt-4 sm:pt-6 md:pt-8 pb-6 sm:pb-8 md:pb-12"
    >
      <AccordionSection title="Loan Details" defaultOpen={true}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Field
            label="Loan Type"
            value={loanData.loanType}
            capitalizeFirst={true}
          />
          <Field
            label="Loan Sector"
            value={loanData.loanSector}
            capitalizeFirst={true}
          />
          <Field
            label="Loan Sub-Sector"
            value={loanData.loanSubSector}
            capitalizeFirst={true}
          />
          <Field
            label="Loan Sub-Sector Category"
            value={loanData.loanSubSectorCategory}
            capitalizeFirst={true}
          />
          <Field label="Loan Amount" value={loanData.loanAmount} />
          <Field label="Loan Purpose" value={loanData.loanPurpose} />
          <Field label="Tenure (Months)" value={loanData.tenure} />
          <Field label="Interest Rate (%)" value={loanData.interestRate} />
        </div>
      </AccordionSection>

      <AccordionSection title="Personal Details" defaultOpen>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
            Applicant Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <Field
              label="Salutation"
              value={personalData.salutation}
              capitalizeFirst={true}
            />
            <Field
              label="Applicant Name"
              value={personalData.applicantName}
              capitalizeFirst={true}
            />
            <Field
              label="Nationality"
              value={personalData.nationality}
              capitalizeFirst={true}
            />
            <Field
              label="Identification Type"
              value={personalData.identificationType}
              capitalizeFirst={true}
            />

            <Field
              label="Identification No"
              value={personalData.identificationNo}
            />
            <Field
              label="Identification Issue Date"
              value={personalData.identificationIssueDate}
            />
            <Field
              label="Identification Expiry Date"
              value={personalData.identificationExpiryDate}
            />
            <Field label="TPN" value={personalData.tpn} />
            <Field label="Date of Birth" value={personalData.dateOfBirth} />
            <Field
              label="Gender"
              value={personalData.gender}
              capitalizeFirst={true}
            />
            <Field
              label="Marital Status"
              value={personalData.maritalStatus}
              capitalizeFirst={true}
            />
            <Field
              label="Identification Proof Document"
              value={
                personalData.identificationProof
                  ? typeof personalData.identificationProof === 'string' ? personalData.identificationProof : personalData.identificationProof.name
                  : "No file uploaded"
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {/* <Field
              label="Family Tree Documents"
              value={
                personalData.familyTree
                  ? personalData.familyTree.name
                  : ""
              }
            /> */}

            <Field
              label="Family Tree Documents"
              value={
                personalData.familyTree
                  ? typeof personalData.familyTree === 'string' ? personalData.familyTree : personalData.familyTree.name
                  : ""
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <Field
              label="Bank Name"
              value={resolveBank(personalData.bankName)}
              capitalizeFirst={true}
            />
            <Field label="Bank Account" value={personalData.bankAccount} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {/* <Field
              label="Passport Photo"
              value={
                personalData.passportPhotoFile
                  ? personalData.passportPhotoFile.name
                  : ""
              }
            /> */}

            <Field
              label="Passport Photo"
              value={
                personalData.passportPhoto
                  ? typeof personalData.passportPhoto === 'string' ? personalData.passportPhoto : personalData.passportPhoto.name
                  : ""
              }
            />

          </div>
          <div>
            <div>
              <h3 className="py-4 px-6 text-sm font-bold pt-15">
                Contact Details
              </h3>
              <hr />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <Field label="Contact" value={personalData.currContact || personalData.contactNo || personalData.phone} />
                <Field
                  label="Alternate Contact"
                  value={personalData.currAlternateContact || personalData.alternatePhone || personalData.alternateContactNo}
                />
                <Field label="Email" value={personalData.currEmail || personalData.emailId || personalData.email} />
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-8">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
              Permanent Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <Field
                label="Country"
                value={personalData.permCountry}
                capitalizeFirst={true}
              />
              <Field
                label="Dzongkhag/State"
                value={personalData.permDzongkhag}
                capitalizeFirst={true}
              />
              <Field
                label="Gewog/Province"
                value={personalData.permGewog}
                capitalizeFirst={true}
              />
              <Field
                label="Village/Street"
                value={personalData.permVillage}
                capitalizeFirst={true}
              />
              <Field label="Thram No." value={personalData.permThram} />
              <Field label="House No." value={personalData.permHouse} />
            </div>
            {String(personalData.permCountry || "").trim().toLowerCase() !== "bhutan" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <Field
                  label="Permanent Address Proof"
                  value={
                    personalData.permAddressProofFile
                      ? typeof personalData.permAddressProofFile === 'string' ? personalData.permAddressProofFile : personalData.permAddressProofFile.name
                      : ""
                  }
                />
              </div>
            )}
          </div>

          <div className="mt-6 sm:mt-8">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
              Current Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <Field
                label="Country of Residence"
                value={personalData.currCountry}
                capitalizeFirst={true}
              />
              <Field
                label="Dzongkhag/State"
                value={personalData.currDzongkhag}
                capitalizeFirst={true}
              />
              <Field
                label="Gewog/Province"
                value={personalData.currGewog}
                capitalizeFirst={true}
              />
              <Field
                label="Village/Street"
                value={personalData.currVillage}
                capitalizeFirst={true}
              />
              <Field label="Flat/House No." value={personalData.currFlat} />
            </div>
            {String(personalData.currCountry || "").trim().toLowerCase() !== "bhutan" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <Field
                  label="Current Address Proof"
                  value={
                    personalData.currAddressProofFile
                      ? typeof personalData.currAddressProofFile === 'string' ? personalData.currAddressProofFile : personalData.currAddressProofFile.name
                      : ""
                  }
                />
              </div>
            )}
          </div>

          <PepDeclarationDisplay
            data={personalData}
            resolveDzongkhag={resolveDzongkhag}
            resolveGewog={resolveGewog}
            resolvePepCategory={resolvePepCategory}
            resolvePepSubCategory={resolvePepSubCategory}
            resolveCountry={resolveCountry}
            resolveNationality={resolveNationality}
            resolveIdentificationType={resolveIdentificationType}
            resolveMaritalStatus={resolveMaritalStatus}
            resolveTaxIdentifierType={resolveTaxIdentifierType}
            title="Applicant PEP Declarations"
          />

          <div>
            <h3 className="py-4 px-6 text-sm font-bold pt-15">
              Employment Details
            </h3>
            <hr />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {/* Always show Employment Status */}
              <Field
                label="Employment Status"
                value={personalData.employmentStatus || ""}
                capitalizeFirst={true}
              />
            </div>

            {personalData.employmentStatus === "employed" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <Field
                    label="Employee ID"
                    value={personalData.employeeId || "No value"}
                  />
                  <Field
                    label="Occupation"
                    value={personalData.occupation || "No value"}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Employer Type"
                    value={personalData.employerType || "No value"}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Designation"
                    value={personalData.designation || "No value"}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Grade"
                    value={personalData.grade || "No value"}
                  />

                  <Field
                    label="Organization Name"
                    value={personalData.organizationName || "No value"}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Organization Location"
                    value={personalData.orgLocation || "No value"}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Service Joining Date"
                    value={personalData.joiningDate || "No value"}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <Field
                    label="Nature of Service"
                    value={personalData.serviceNature || "No value"}
                    capitalizeFirst={true}
                  />

                  {personalData.serviceNature?.toLowerCase() === "contract" && (
                    <Field
                      label="Contract End Date"
                      value={personalData.contractEndDate || "No value"}
                    />
                  )}

                  <Field
                    label="Gross Income"
                    value={personalData.annualIncome || "No value"}
                  />
                </div>
              </>
            )}
          </div>

          {isMarried(personalData.maritalStatus) && (
            <SpouseDisplay
              data={personalData}
              resolveDzongkhag={resolveDzongkhag}
              resolveGewog={resolveGewog}
              title="Applicant's Spouse Information"
            />
          )}
        </div>
      </AccordionSection>

      <AccordionSection title="Co-Borrower Details" defaultOpen>
        {!coBorrowerData || (Array.isArray(coBorrowerData) && coBorrowerData.length === 0) ? (
          <div className="text-center py-8 text-gray-500">
            No Co-Borrower Details Available
          </div>
        ) : (
          (() => {
            const coBorrowers = Array.isArray(coBorrowerData) ? coBorrowerData : [coBorrowerData];
            return coBorrowers.map((coBorrower: any, index: number) => (
              <div key={index} className="mb-8 last:mb-0">
                {coBorrowers.length > 1 && (
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                    Co-Borrower {index + 1}
                  </h3>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  <Field
                    label="Salutation"
                    value={coBorrower.salutation}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Name"
                    value={coBorrower.name}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Nationality"
                    value={coBorrower.nationality}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Identification Type"
                    value={coBorrower.identificationType}
                    capitalizeFirst={true}
                  />

                  <Field
                    label="Identification No"
                    value={coBorrower.identificationNo}
                  />
                  <Field
                    label="Identification Issue Date"
                    value={coBorrower.identificationIssueDate}
                  />
                  <Field
                    label="Identification Expiry Date"
                    value={coBorrower.identificationExpiryDate}
                  />
                  <Field label="TPN" value={coBorrower.tpn} />
                  <Field label="Date of Birth" value={coBorrower.dateOfBirth} />
                  <Field
                    label="Gender"
                    value={coBorrower.gender}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Marital Status"
                    value={coBorrower.maritalStatus}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Relationship to Borrower"
                    value={coBorrower.relationship}
                    capitalizeFirst={true}
                  />
                  <Field
                    label="Identification Proof Document"
                    value={
                      coBorrower.idProofDocument
                        ? typeof coBorrower.idProofDocument === 'string'
                          ? coBorrower.idProofDocument
                          : coBorrower.idProofDocument.name
                        : "No file uploaded"
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <Field
                    label="Family Tree Documents"
                    value={
                      coBorrower.familyTree
                        ? typeof coBorrower.familyTree === 'string' ? coBorrower.familyTree : coBorrower.familyTree.name
                        : ""
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <Field
                    label="Bank Name"
                    value={resolveBank(coBorrower.bankName)}
                    capitalizeFirst={true}
                  />
                  <Field label="Bank Account" value={coBorrower.bankAccount} />
                  <Field
                    label="Passport Photo"
                    value={
                      coBorrower.passportPhoto
                        ? typeof coBorrower.passportPhoto === 'string' ? coBorrower.passportPhoto : coBorrower.passportPhoto.name
                        : ""
                    }
                  />
                </div>

                <div>
                  <h3 className="py-4 px-6 text-sm font-bold pt-15">Contact Details</h3>
                  <hr />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Field label="Contact" value={coBorrower.currContact || coBorrower.contactNo || coBorrower.phone} />
                    <Field
                      label="Alternate Contact"
                      value={coBorrower.currAlternateContact || coBorrower.alternatePhone || coBorrower.alternateContactNo}
                    />
                    <Field label="Email" value={coBorrower.currEmail || coBorrower.emailId || coBorrower.email} />
                  </div>
                </div>

                <div className="mt-6 sm:mt-8">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                    Permanent Address
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    <Field
                      label="Country"
                      value={coBorrower.permCountry}
                      capitalizeFirst={true}
                    />
                    <Field
                      label="Dzongkhag/State"
                      value={coBorrower.permDzongkhag}
                      capitalizeFirst={true}
                    />
                    <Field
                      label="Gewog/Province"
                      value={coBorrower.permGewog}
                      capitalizeFirst={true}
                    />
                    <Field
                      label="Village/Street"
                      value={coBorrower.permVillage}
                      capitalizeFirst={true}
                    />
                    <Field label="Thram No." value={coBorrower.permThram} />
                    <Field label="House No." value={coBorrower.permHouse} />
                  </div>
                  {String(coBorrower.permCountry || "").trim().toLowerCase() !== "bhutan" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                      <Field
                        label="Permanent Address Proof"
                        value={
                          coBorrower.permAddressProof
                            ? typeof coBorrower.permAddressProof === 'string' ? coBorrower.permAddressProof : coBorrower.permAddressProof.name
                            : ""
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="mt-6 sm:mt-8">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                    Current Address
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    <Field
                      label="Country of Residence"
                      value={coBorrower.currCountry}
                      capitalizeFirst={true}
                    />
                    <Field
                      label="Dzongkhag/State"
                      value={coBorrower.currDzongkhag}
                      capitalizeFirst={true}
                    />
                    <Field
                      label="Gewog/Province"
                      value={coBorrower.currGewog}
                      capitalizeFirst={true}
                    />
                    <Field
                      label="Village/Street"
                      value={coBorrower.currVillage}
                      capitalizeFirst={true}
                    />
                    <Field label="Flat/House No." value={coBorrower.currFlat} />
                  </div>
                  {String(coBorrower.currCountry || "").trim().toLowerCase() !== "bhutan" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                      <Field
                        label="Current Address Proof"
                        value={
                          coBorrower.currAddressProof
                            ? typeof coBorrower.currAddressProof === 'string' ? coBorrower.currAddressProof : coBorrower.currAddressProof.name
                            : ""
                        }
                      />
                    </div>
                  )}
                </div>

                  <PepDeclarationDisplay
                    data={coBorrower}
                    resolveDzongkhag={resolveDzongkhag}
                    resolveGewog={resolveGewog}
                    resolvePepCategory={resolvePepCategory}
                    resolvePepSubCategory={resolvePepSubCategory}
                    resolveCountry={resolveCountry}
                    resolveNationality={resolveNationality}
                    resolveIdentificationType={resolveIdentificationType}
                    resolveMaritalStatus={resolveMaritalStatus}
                    resolveTaxIdentifierType={resolveTaxIdentifierType}
                    title="Co-Borrower PEP Declarations"
                  />
                <div>
                  <h3 className="py-4 px-6 text-sm font-bold pt-15">
                    Employment Details
                  </h3>
                  <hr />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Field
                      label="Employment Status"
                      value={coBorrower.employmentStatus || ""}
                      capitalizeFirst={true}
                    />
                  </div>

                  {coBorrower.employmentStatus === "employed" && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="Employee ID"
                          value={coBorrower.employeeId || "No value"}
                        />
                        <Field
                          label="Occupation"
                          value={coBorrower.occupation || "No value"}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Employer Type"
                          value={coBorrower.employerType || "No value"}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Designation"
                          value={coBorrower.designation || "No value"}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Grade"
                          value={coBorrower.grade || "No value"}
                        />

                        <Field
                          label="Organization Name"
                          value={coBorrower.organizationName || "No value"}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Organization Location"
                          value={coBorrower.orgLocation || "No value"}
                          capitalizeFirst={true}
                        />
                        <Field
                          label="Service Joining Date"
                          value={coBorrower.joiningDate || "No value"}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field
                          label="Nature of Service"
                          value={coBorrower.serviceNature || "No value"}
                          capitalizeFirst={true}
                        />

                        {coBorrower.serviceNature?.toLowerCase() === "contract" && (
                          <Field
                            label="Contract End Date"
                            value={coBorrower.contractEndDate || "No value"}
                          />
                        )}

                        <Field
                          label="Annual Salary"
                          value={coBorrower.annualSalary || "No value"}
                        />
                      </div>
                    </>
                  )}
                </div>

                  {isMarried(coBorrower.maritalStatus) && (
                    <SpouseDisplay
                      data={coBorrower}
                      resolveDzongkhag={resolveDzongkhag}
                      resolveGewog={resolveGewog}
                      title="Co-Borrower's Spouse Information"
                    />
                  )}
                </div>
              ));
            })()
          )}
        </AccordionSection>

      <AccordionSection title="Security Details" defaultOpen>
        {allSecurities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No Security Details Available</div>
        ) : (
          allSecurities.map((sec: any, secIdx: number) => (
            <div key={secIdx} className="mb-8 last:mb-0">
              {allSecurities.length > 1 && (
                <h3 className="text-base sm:text-lg font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                  Security {secIdx + 1}
                </h3>
              )}

              {/* Common header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pb-4">
                <Field label="Security Type" value={sec.securityType} capitalizeFirst />
                <Field label="Security Ownership" value={sec.ownershipType} capitalizeFirst />
              </div>


              {/* Land */}
              {(sec.securityType?.toLowerCase() === "land") && (
                <div className="pb-6">
                  <h3 className="py-3 px-4 font-bold text-sm">
                    {sec.securityType?.toLowerCase() === "building" ? "Building & Land Details" : "Land Details"}
                  </h3>
                  <hr />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Field label="Thram No." value={sec.thramNo} />
                    <Field label="Plot No." value={sec.plotNo} />
                    <Field label="Dzongkhag" value={resolveDzongkhag(sec.dzongkhag)} />
                    <Field label="Gewog" value={resolveGewog(sec.dzongkhag, sec.gewog)} />
                    <Field label="Village/Street" value={sec.village} />
                    <Field label="House No." value={sec.houseNo} />
                    <Field label="Security Proof Document" value={sec.securityProof} />
                  </div>
                </div>
              )}

              {/* Land / Building Details */}
              {(sec.securityType?.toLowerCase() === "building") && (
                <div className="pb-6">
                  <h3 className="py-3 px-4 font-bold text-sm">
                    {sec.securityType?.toLowerCase() === "building" ? "Building & Land Details" : "Land Details"}
                  </h3>
                  <hr />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Field label="Thram No." value={sec.thramNo} />
                    <Field label="Plot No." value={sec.plotNo} />

                    <Field label="Building Type" value={sec.buildingType} />
                    <Field label="Year of Construction" value={sec.buildingYear} />

                    <Field label="Dzongkhag" value={resolveDzongkhag(sec.dzongkhag)} />
                    <Field label="Gewog" value={resolveGewog(sec.dzongkhag, sec.gewog)} />
                    <Field label="Village/Street" value={sec.village} />
                    <Field label="House No." value={sec.houseNo} />
                    <Field label="Security Proof Document" value={sec.securityProof} />
                  </div>
                </div>
              )}

              {/* Vehicle Details */}
              {sec.securityType?.toLowerCase() === "vehicle" && (
                <div className="pb-6">
                  <h3 className="py-3 px-4 font-bold text-sm">Vehicle Details</h3>
                  <hr />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Field label="Vehicle Type" value={sec.vehicleType} />
                    <Field label="Make/Brand" value={sec.vehicleMake} />
                    <Field label="Model" value={sec.vehicleModel} />
                    <Field label="Year of Manufacture" value={sec.vehicleYear} />
                    <Field label="Registration No. / Invoice No." value={sec.registrationNo} />
                    <Field label="Chassis No." value={sec.chassisNo} />
                    <Field label="Engine No." value={sec.engineNo} />
                    <Field label="Security Proof Document" value={sec.securityProof} />
                  </div>
                </div>
              )}

              {/* Insurance Details */}
              {sec.securityType?.toLowerCase() === "insurance" && (
                <div className="pb-6">
                  <h3 className="py-3 px-4 font-bold text-sm">Insurance Details</h3>
                  <hr />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Field label="Insurance Company" value={sec.insuranceCompany} />
                    <Field label="Policy No." value={sec.policyNo} />
                    <Field label="Insurance Value" value={sec.insuranceValue} />
                    <Field label="Start Date" value={sec.insuranceStartDate} />
                    <Field label="Expiry Date" value={sec.insuranceExpiryDate} />
                    <Field label="Security Proof Document" value={sec.securityProof} />
                  </div>
                </div>
              )}

              {/* Fixed Deposit Details */}
              {(sec.securityType?.toLowerCase() === "fixed deposit" || sec.securityType?.toLowerCase() === "fd") && (
                <div className="pb-6">
                  <h3 className="py-3 px-4 font-bold text-sm">Fixed Deposit Details</h3>
                  <hr />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Field label="Account No." value={sec.fdAccountNo} />
                    <Field label="Deposit Amount (Nu.)" value={sec.fdAmount} />
                    <Field label="Maturity Date" value={sec.fdMaturityDate} />
                    <Field label="Bank Name" value={resolveBank(sec.fdBank)} />
                    <Field label="Security Proof Document" value={sec.securityProof} />
                  </div>
                </div>
              )}

              {/* Equipment Details */}
              {(sec.securityType?.toLowerCase() === "equipment" || sec.securityType?.toLowerCase() === "plant") && (
                <div className="pb-6">
                  <h3 className="py-3 px-4 font-bold text-sm">Equipment/Plant Details</h3>
                  <hr />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Field label="Make/Brand" value={sec.equipmentMake} />
                    <Field label="Model" value={sec.equipmentModel} />
                    <Field label="Identification No." value={sec.equipmentSerialNo} />
                    <Field label="Equipment Value" value={sec.equipmentValue} />
                    <Field label="Security Proof Document" value={sec.securityProof} />
                  </div>
                </div>
              )}

              {/* PPF Details */}
              {sec.securityType?.toLowerCase() === "ppf" && (
                <div className="pb-6">
                  <h3 className="py-3 px-4 font-bold text-sm">Pension & Provident Fund Details</h3>
                  <hr />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Field label="Institution Name" value={sec.ppfInstitution} />
                    <Field label="Account No" value={sec.ppfAccountNo} />
                    <Field label="Fund Value (Nu.)" value={sec.ppfAmount} />
                    <Field label="Security Proof Document" value={sec.securityProof} />
                  </div>
                </div>
              )}

              {/* Stocks Details*/}
              {(sec.securityType?.toLowerCase() === "stocks") && (
                <div className="pb-6">
                  <h3 className="py-3 px-4 font-bold text-sm">Shares & Securities Details</h3>
                  <hr />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Field label="Stock Name" value={sec.stockName} />
                    <Field label="Quantity" value={sec.stockQuantity} />
                    <Field label="Stock value (Nu.)" value={sec.stockValue} />
                    <Field label="Security Proof Document" value={sec.securityProof} />
                  </div>
                </div>
              )}
              {/*Shares */}
              {(sec.securityType?.toLowerCase() === "share") && (
                <div className="pb-6">
                  <h3 className="py-3 px-4 font-bold text-sm">Shares & Securities Details</h3>
                  <hr />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Field label="Company Name" value={sec.shareCompany} />
                    <Field label="Numbers of Shares" value={sec.shareCertificateNo} />
                    <Field label="Number of Volume" value={sec.shareRegistrationNo} />
                    <Field label="Security Proof Document" value={sec.securityProof} />
                  </div>
                </div>
              )}


              {/* Third-party Guarantors from additionalGuarantors array */}
              {(sec.ownershipType?.toLowerCase() === "third-party" || 
                sec.ownershipType?.toLowerCase() === "third party" || 
                sec.ownershipType?.toLowerCase() === "other" || 
                sec.ownershipType?.toLowerCase() === "joint") && securityGuarantors.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                    Security Guarantor Details
                  </h3>
                  {securityGuarantors.map((g: any, gIdx: number) => (
                    <div key={gIdx} className="mb-6 last:mb-0">
                      {securityGuarantors.length > 1 && (
                        <h4 className="text-sm font-semibold text-gray-600 mb-3">Guarantor {gIdx + 1}</h4>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        <Field label="Salutation" value={g.salutation} capitalizeFirst />
                        <Field label="Guarantor Name" value={g.guarantorName} capitalizeFirst />
                        <Field label="Nationality" value={g.nationality} capitalizeFirst />
                        <Field label="Identification Type" value={g.idType} capitalizeFirst />
                        <Field label="Identification No" value={g.idNumber} />
                        <Field label="Issue Date" value={g.idIssueDate} />
                        <Field label="Expiry Date" value={g.idExpiryDate} />
                        <Field label="TPN" value={g.tpnNo} />
                        <Field label="Date of Birth" value={g.dateOfBirth} />
                        <Field label="Gender" value={g.gender} capitalizeFirst />
                        <Field label="Marital Status" value={g.maritalStatus} capitalizeFirst />

                        <Field
                          label="Identification Proof Document"
                          value={
                            g.idProof
                              ? typeof g.idProof === 'string' ? g.idProof : g.idProof.name
                              : "No file uploaded"
                          }
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Field label="Contact" value={g.contact} />
                        <Field label="Alternate Contact" value={g.currAlternateContact} />
                        <Field label="Email" value={g.email} />
                        <Field label="Bank Name" value={resolveBank(g.bankName)} capitalizeFirst />
                        <Field label="Bank Account" value={g.bankAccount || g.bankAccountNumber || g.bankAccountNo} />
                        <Field
                          label="Passport Size Photo"
                          value={
                            g.passportPhoto
                              ? typeof g.passportPhoto === 'string' ? g.passportPhoto : g.passportPhoto.name
                              : "No file uploaded"
                          }
                        />
                        <Field
                          label="Family Tree Documents"
                          value={
                            g.familyTree
                              ? typeof g.familyTree === 'string' ? g.familyTree : g.familyTree.name
                              : "No file uploaded"
                          }
                        />
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">Permanent Address</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <Field label="Country" value={g.permCountry} capitalizeFirst />
                          <Field label="Dzongkhag" value={g.permDzongkhag} capitalizeFirst />
                          <Field label="Gewog" value={g.permGewog} capitalizeFirst />
                          <Field label="Village" value={g.permVillage} capitalizeFirst />
                          <Field label="Thram No." value={g.permThram} />
                          <Field label="House No." value={g.permHouse} />
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">Current Address</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <Field label="Country" value={g.currCountry} capitalizeFirst />
                          <Field label="Dzongkhag" value={g.currDzongkhag} capitalizeFirst />
                          <Field label="Gewog" value={g.currGewog} capitalizeFirst />
                          <Field label="Village" value={g.currVillage} capitalizeFirst />
                          <Field label="Flat/House No." value={g.currHouse} />
                        </div>
                      </div>

                      {g.employmentStatus && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">Employment Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Field label="Employment Status" value={g.employmentStatus} capitalizeFirst />
                            {g.employmentStatus === "employed" && (
                              <>
                                <Field label="Employee ID" value={g.employeeId} />
                                <Field label="Occupation" value={g.occupation} capitalizeFirst />
                                <Field label="Employer Type" value={g.employerType} capitalizeFirst />
                                <Field label="Designation" value={g.designation} capitalizeFirst />
                                <Field label="Grade" value={g.grade} />
                                <Field label="Organization Name" value={g.organizationName} capitalizeFirst />
                                <Field label="Organization Location" value={g.orgLocation} capitalizeFirst />
                                <Field label="Joining Date" value={g.joiningDate} />
                                <Field label="Nature of Service" value={g.serviceNature} capitalizeFirst />
                                <Field label="Annual Salary" value={g.annualSalary} />
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <PepDeclarationDisplay
                        data={g}
                        resolveDzongkhag={resolveDzongkhag}
                        resolveGewog={resolveGewog}
                        resolvePepCategory={resolvePepCategory}
                        resolvePepSubCategory={resolvePepSubCategory}
                        resolveCountry={resolveCountry}
                        resolveNationality={resolveNationality}
                        resolveIdentificationType={resolveIdentificationType}
                        resolveMaritalStatus={resolveMaritalStatus}
                        resolveTaxIdentifierType={resolveTaxIdentifierType}
                        title="Guarantor PEP Declarations"
                      />

                      {isMarried(g.maritalStatus) && (
                        <SpouseDisplay
                          data={g}
                          resolveDzongkhag={resolveDzongkhag}
                          resolveGewog={resolveGewog}
                          title="Guarantor's Spouse Information"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </AccordionSection>


      <AccordionSection title="Repayment Source" defaultOpen>
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Field label="Source" value={repaymentData.source} capitalizeFirst={true} />
          <Field label="Monthly Income" value={repaymentData.monthlyIncome} />
        </div> */}

        <div>
          <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
            INCOME DETAILS
          </h2>

          {(() => {
            const incomeItems = [
              {
                key: "enableMonthlySalaryCivil",
                label: "Monthly Salary (Civil Servant)",
                valueKey: "monthlySalaryCivil",
                proofKey: "monthlySalaryProofCivil",
              },
              {
                key: "enableMonthlySalaryCorporate",
                label: "Monthly Salary (Corporate)",
                valueKey: "monthlySalaryCorporate",
                proofKey: "monthlySalaryProofCorporate",
              },
              {
                key: "enableMonthlySalaryPrivate",
                label: "Monthly Salary (Private)",
                valueKey: "monthlySalaryPrivate",
                proofKey: "monthlySalaryProofPrivate",
              },
              {
                key: "enableRentalIncome",
                label: "Rental Income",
                valueKey: "rentalIncome",
                proofKey: "rentalIncomeProof",
              },
              {
                key: "enableBusinessIncome",
                label: "Business Income",
                valueKey: "businessIncome",
                proofKey: "businessIncomeProof",
              },
              {
                key: "enableVehicleHiring",
                label: "Vehicle Hiring Income",
                valueKey: "vehicleHiringIncome",
                proofKey: "vehicleHiringIncomeProof",
              },
              {
                key: "enableDividendIncome",
                label: "Dividend Income",
                valueKey: "dividendIncome",
                proofKey: "dividendIncomeProof",
              },
              {
                key: "enableAgricultureIncome",
                label: "Agriculture Income",
                valueKey: "agricultureIncome",
                proofKey: "agricultureIncomeProof",
              },
              {
                key: "enableTruckTaxiIncome",
                label: "Truck/Taxi Income",
                valueKey: "truckTaxiIncome",
                proofKey: "truckTaxiIncomeProof",
              },
            ];

            // Filter only selected sources
            const selectedIncome = incomeItems.filter(
              (item) => repaymentData?.incomeData?.[item.key] || repaymentData?.[item.key],
            );

            // If none selected, show default N/A row
            if (selectedIncome.length === 0) {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  <Field label="Source" value="N/A" capitalizeFirst={true} />
                  <Field label="Monthly Income" value="N/A" />
                  <Field label="Repayment Proof" value="N/A" />
                </div>
              );
            }

            // Display all selected sources
            return selectedIncome.map((item) => (
              <div
                key={item.key}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6"
              >
                <Field
                  label="Source"
                  value={item.label}
                  capitalizeFirst={true}
                />
                <Field
                  label="Amount (Nu.)"
                  value={repaymentData?.incomeData?.[item.valueKey] || repaymentData?.[item.valueKey] || "N/A"}
                />
              </div>
            ));
          })()}

          {/* Single global repayment proof */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pt-4">
            <Field
              label="Upload Repayment Proof"
              value={
                repaymentData?.repaymentProof
                  ? (typeof repaymentData.repaymentProof === "string"
                    ? repaymentData.repaymentProof
                    : (repaymentData.repaymentProof as any)?.name || "Uploaded")
                  : "No file uploaded"
              }
            />
          </div>
          <h2 className="text-md font-bold border-b border-gray-200 pb-4 pt-15">
            Repayment Guarantor Details
          </h2>

          {/* Show if yes/no selection exists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pt-5">
            <Field
              label="Is Repayment Guarantor Applicable?"
              value={repaymentData.repaymentGuarantor}
              capitalizeFirst={true}
            />
          </div>

          {/* Only show repayment guarantor details if yes */}
          {repaymentData?.repaymentGuarantor?.toLowerCase() === "yes" && repaymentGuarantors.length > 0 && (
            <div className="mt-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">
                Repayment Guarantor Details
              </h3>
              {repaymentGuarantors.map((g: any, gIdx: number) => (
                <div key={gIdx} className="mb-8 last:mb-0">
                  {repaymentGuarantors.length > 1 && (
                    <h4 className="text-sm font-semibold text-gray-600 mb-3">Guarantor {gIdx + 1}</h4>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    <Field label="Salutation" value={g.salutation} capitalizeFirst />
                    <Field label="Guarantor Name" value={g.guarantorName} capitalizeFirst />
                    <Field label="Nationality" value={g.nationality} capitalizeFirst />
                    <Field label="Identification Type" value={g.idType} capitalizeFirst />
                    <Field label="Identification No" value={g.idNumber} />
                    <Field label="Issue Date" value={g.idIssueDate} />
                    <Field label="Expiry Date" value={g.idExpiryDate} />
                    <Field label="TPN" value={g.tpnNo} />
                    <Field label="Date of Birth" value={g.dateOfBirth} />
                    <Field label="Gender" value={g.gender} capitalizeFirst />
                    <Field label="Marital Status" value={g.maritalStatus} capitalizeFirst />

                    <Field
                      label="Identification Proof Document"
                      value={
                        g.idProof
                          ? typeof g.idProof === 'string' ? g.idProof : g.idProof.name
                          : "No file uploaded"
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Field label="Contact" value={g.contact} />
                    <Field label="Alternate Contact" value={g.currAlternateContact} />
                    <Field label="Email" value={g.email} />
                    <Field label="Bank Name" value={resolveBank(g.bankName)} capitalizeFirst />
                    <Field label="Bank Account" value={g.bankAccount || g.bankAccountNumber || g.bankAccountNo} />
                    <Field
                      label="Passport Size Photo"
                      value={
                        g.passportPhoto
                          ? typeof g.passportPhoto === 'string' ? g.passportPhoto : g.passportPhoto.name
                          : "No file uploaded"
                      }
                    />
                    <Field
                      label="Family Tree Documents"
                      value={
                        g.familyTree
                          ? typeof g.familyTree === 'string' ? g.familyTree : g.familyTree.name
                          : "No file uploaded"
                      }
                    />
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">Permanent Address</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Field label="Country" value={g.permCountry} capitalizeFirst />
                      <Field label="Dzongkhag" value={g.permDzongkhag} capitalizeFirst />
                      <Field label="Gewog" value={g.permGewog} capitalizeFirst />
                      <Field label="Village" value={g.permVillage} capitalizeFirst />
                      <Field label="Thram No." value={g.permThram} />
                      <Field label="House No." value={g.permHouse} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">Current Address</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Field label="Country" value={g.currCountry} capitalizeFirst />
                      <Field label="Dzongkhag" value={g.currDzongkhag} capitalizeFirst />
                      <Field label="Gewog" value={g.currGewog} capitalizeFirst />
                      <Field label="Village" value={g.currVillage} capitalizeFirst />
                      <Field label="Flat/House No." value={g.currHouse} />
                    </div>
                  </div>
                  {g.employmentStatus && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">Employment Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Field label="Employment Status" value={g.employmentStatus} capitalizeFirst />
                        {g.employmentStatus === "employed" && (
                          <>
                            <Field label="Employee ID" value={g.employeeId} />
                            <Field label="Occupation" value={g.occupation} capitalizeFirst />
                            <Field label="Employer Type" value={g.employerType} capitalizeFirst />
                            <Field label="Designation" value={g.designation} capitalizeFirst />
                            <Field label="Grade" value={g.grade} />
                            <Field label="Organization Name" value={g.organizationName} capitalizeFirst />
                            <Field label="Organization Location" value={g.orgLocation} capitalizeFirst />
                            <Field label="Joining Date" value={g.joiningDate} />
                            <Field label="Nature of Service" value={g.serviceNature} capitalizeFirst />
                            <Field label="Annual Salary" value={g.annualSalary} />
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <PepDeclarationDisplay
                    data={g}
                    resolveDzongkhag={resolveDzongkhag}
                    resolveGewog={resolveGewog}
                    resolvePepCategory={resolvePepCategory}
                    resolvePepSubCategory={resolvePepSubCategory}
                    resolveCountry={resolveCountry}
                    resolveNationality={resolveNationality}
                    resolveIdentificationType={resolveIdentificationType}
                    resolveMaritalStatus={resolveMaritalStatus}
                    resolveTaxIdentifierType={resolveTaxIdentifierType}
                    title="Guarantor PEP Declarations"
                  />

                  {isMarried(g.maritalStatus) && (
                    <SpouseDisplay
                      data={g}
                      resolveDzongkhag={resolveDzongkhag}
                      resolveGewog={resolveGewog}
                      title="Guarantor's Spouse Information"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          {/* End of repayment section */}

        </div>
      </AccordionSection>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 font-medium">
          ❌ {error}
        </div>
      )}

      {/* <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>

        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Confirm & Submit"}
        </Button>
      </div> */}

      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 pt-6 sm:pt-8">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
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

