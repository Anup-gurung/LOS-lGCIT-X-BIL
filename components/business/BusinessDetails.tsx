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

// Import for lookup functionality
import { mapCustomerDataToForm } from "@/lib/mapCustomerData";
import DocumentPopup from "@/components/BILSearchStatus";
// NEW: Import the DocumentPopupOnly component for "Others" business types
import DocumentPopupOnly from "@/components/BILSearchStatusOnly";

// ================== IndexedDB File Storage (external) ==================
import { storeFile, deleteFile } from "@/lib/indexDB";

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

// ================== Validation Helpers ==================
const isRequired = (value: any) => !value || value.toString().trim() === "";
const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidCID = (value: string) => /^\d{11}$/.test(value);
const isValidMobile = (value: string) => /^(16|17|77)\d{6}$/.test(value);
const isValidFixedLine = (value: string) => /^[2-8]\d{6,7}$/.test(value);
const isValidPhoneNumber = (value: string) =>
    isValidMobile(value) || isValidFixedLine(value);
const isValidShareholding = (value: string) => {
    const num = Number(value);
    return !isNaN(num) && num >= 0 && num <= 100;
};
const isLegalAge = (dateOfBirth: string): boolean => {
    if (!dateOfBirth) return false;
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age >= 18;
};
// ================== END Validation Helpers ==================

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
    // Relationship & PEP-specific
    relationship: "",
    category: "",
    subCategory: "",
    // Personal Information
    identificationType: "",
    identificationNo: "",
    identificationIssueDate: "",
    identificationExpiryDate: "",
    salutation: "",
    applicantName: "",
    nationality: "",
    gender: "",
    dateOfBirth: "",
    taxIdentifierType: "",
    tpn: "",
    householdNumber: "",
    maritalStatus: "",

    // Permanent Address
    permCountry: "",
    permDzongkhag: "",
    permGewog: "",
    permVillage: "",
    permThram: "",
    permHouse: "",
    permAddressProof: "",
    permAddressProofName: "",

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
    currAddressProofName: "",

    // Spouse fields (not used for related PEPs but included for consistency)
    spouseIdentityProof: "",
    spouseIdentityProofName: "",
});

// --- Uniform Styling (Orange Focus, Red Error) ---
const getFieldStyle = (hasError: boolean) => {
    const baseStyle =
        "h-11 w-full bg-white border rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus-visible:outline-none focus:ring-1 focus-visible:ring-1 focus:ring-[#FF9800] focus-visible:ring-[#FF9800] transition-colors";
    if (hasError) {
        return `${baseStyle} border-red-500 focus:border-red-500 focus-visible:border-red-500`;
    }
    return `${baseStyle} border-gray-300 focus:border-[#FF9800] focus-visible:border-[#FF9800]`;
};

// --- Helper to check if a marital status value means "married" using options ---
const isMarriedStatusFromOptions = (
    statusValue: string,
    maritalStatusOptions: any[],
): boolean => {
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

// --- Helper to convert a label to pk_code using options (Enhanced) ---
const findPkCodeByLabel = (
    label: string,
    options: any[],
    labelFields: string[],
): string => {
    if (!label) return "";

    // Normalizations
    const trimmedLabel = String(label).trim().toLowerCase();
    const strippedLabel = trimmedLabel.replace(/\s+/g, ""); // for strict spacing‑insensitive match
    const inputWords = trimmedLabel.split(/\s+/).filter((w) => w.length > 0);

    // Handle case where options are an array of strings (not objects)
    if (options.length > 0 && typeof options[0] === 'string') {
        const found = options.find(opt => String(opt).trim().toLowerCase() === trimmedLabel);
        return found ? String(found) : label;
    }

    for (const option of options) {
        for (const field of labelFields) {
            const optionValue = String(option[field] || "");
            const trimmedOption = optionValue.trim().toLowerCase();
            const strippedOption = trimmedOption.replace(/\s+/g, "");
            const optionWords = trimmedOption
                .split(/\s+/)
                .filter((w) => w.length > 0);

            // 1. Exact stripped match (handles inconsistent spacing)
            if (strippedOption === strippedLabel) {
                return String(
                    option.bank_pk_code ||
                    option.country_pk_code ||
                    option.nationality_pk_code ||
                    option.identity_type_pk_code ||
                    option.marital_status_pk_code ||
                    option.occupation_pk_code ||
                    option.dzongkhag_pk_code ||
                    option.gewog_pk_code ||
                    option.curr_gewog_pk_code ||
                    option.pk_gewog_id ||
                    option.industry_classification_pk_code ||
                    option.industry_pk_code ||
                    option.inds_class_pk_code ||
                    option.tax_identifier_type_pk_code ||
                    option.pk_code ||
                    option.id ||
                    option.code ||
                    "",
                );
            }

            // 2. Exact trimmed match
            if (trimmedOption === trimmedLabel) {
                return String(
                    option.bank_pk_code ||
                    option.country_pk_code ||
                    option.nationality_pk_code ||
                    option.identity_type_pk_code ||
                    option.marital_status_pk_code ||
                    option.occupation_pk_code ||
                    option.dzongkhag_pk_code ||
                    option.gewog_pk_code ||
                    option.curr_gewog_pk_code ||
                    option.pk_gewog_id ||
                    option.industry_classification_pk_code ||
                    option.industry_pk_code ||
                    option.inds_class_pk_code ||
                    option.tax_identifier_type_pk_code ||
                    option.pk_code ||
                    option.id ||
                    option.code ||
                    "",
                );
            }

            // 3. Word‑based match: all input words must appear in option words
            if (inputWords.length > 0 && optionWords.length > 0) {
                const allWordsMatch = inputWords.every((word) =>
                    optionWords.some(
                        (optWord) => optWord.includes(word) || word.includes(optWord),
                    ),
                );
                if (allWordsMatch) {
                    return String(
                        option.bank_pk_code ||
                        option.country_pk_code ||
                        option.nationality_pk_code ||
                        option.identity_type_pk_code ||
                        option.marital_status_pk_code ||
                        option.occupation_pk_code ||
                        option.dzongkhag_pk_code ||
                        option.gewog_pk_code ||
                        option.curr_gewog_pk_code ||
                        option.pk_gewog_id ||
                        option.industry_classification_pk_code ||
                        option.industry_pk_code ||
                        option.inds_class_pk_code ||
                        option.tax_identifier_type_pk_code ||
                        option.pk_code ||
                        option.id ||
                        option.code ||
                        "",
                    );
                }
            }
        }
    }

    // 4. Substring match fallback (only for long strings)
    if (trimmedLabel.length >= 4) {
        for (const option of options) {
            for (const field of labelFields) {
                const optionLabel = String(option[field] || "")
                    .trim()
                    .toLowerCase();
                if (
                    optionLabel.includes(trimmedLabel) ||
                    trimmedLabel.includes(optionLabel)
                ) {
                    return String(
                        option.bank_pk_code ||
                        option.country_pk_code ||
                        option.nationality_pk_code ||
                        option.identity_type_pk_code ||
                        option.marital_status_pk_code ||
                        option.occupation_pk_code ||
                        option.dzongkhag_pk_code ||
                        option.gewog_pk_code ||
                        option.curr_gewog_pk_code ||
                        option.pk_gewog_id ||
                        option.industry_classification_pk_code ||
                        option.industry_pk_code ||
                        option.inds_class_pk_code ||
                        option.tax_identifier_type_pk_code ||
                        option.pk_code ||
                        option.id ||
                        option.code ||
                        "",
                    );
                }
            }
        }
    }

    return label; // Return original if no match found
};

// --- Helper to convert an ID to its label using options ---
const findLabelById = (
    id: string,
    options: any[],
    labelFields: string[],
): string => {
    if (!id) return "";

    // Handle case where options are an array of strings
    if (options.length > 0 && typeof options[0] === 'string') {
        return options.includes(String(id)) ? String(id) : id;
    }

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
                opt.curr_gewog_pk_code ||
                opt.pk_gewog_id ||
                opt.pep_category_pk_code ||
                opt.pep_sub_category_pk_code ||
                opt.industry_classification_pk_code ||
                opt.industry_pk_code ||
                opt.inds_class_pk_code ||
                opt.tax_identifier_type_pk_code
            ) === String(id),
    );
    if (!option) return id; // fallback to the ID itself
    for (const field of labelFields) {
        if (option[field]) return String(option[field]);
    }
    return id;
};

// ================== Restricted Input Component ==================
type AllowedPattern = "numeric" | "alpha" | "alphanumeric" | "text";

const RestrictedInput = ({
    allowed = "text",
    maxLength,
    value,
    onChange,
    className,
    ...props
}: {
    allowed?: AllowedPattern;
    maxLength?: number;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    [key: string]: any;
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value;

        // Filter based on allowed pattern
        if (allowed === "numeric") {
            newValue = newValue.replace(/[^0-9]/g, "");
        } else if (allowed === "alpha") {
            // Allow letters, spaces, hyphens, apostrophes (for names)
            newValue = newValue.replace(/[^a-zA-Z\s\-']/g, "");
        } else if (allowed === "alphanumeric") {
            // Allow letters, numbers, spaces, hyphens, underscores
            newValue = newValue.replace(/[^a-zA-Z0-9\s\-_]/g, "");
        }

        // Apply maxLength
        if (maxLength && newValue.length > maxLength) {
            newValue = newValue.slice(0, maxLength);
        }

        // Call original onChange with filtered value
        if (onChange) {
            onChange({ ...e, target: { ...e.target, value: newValue } });
        }
    };

    return (
        <Input
            value={value}
            onChange={handleChange}
            className={className}
            maxLength={maxLength} // also pass to native input for browser hint
            {...props}
        />
    );
};
// ================== END Restricted Input ==================

// --- COMPONENT: Comprehensive Owner/Partner/Trustee Details ---
const ComprehensiveOwnerDetails = ({
    data,
    onUpdate,
    countryOptions,
    dzongkhagOptions,
    identificationTypeOptions,
    maritalStatusOptions, // new prop
    taxIdentifierTypeOptions,  // <-- NEW prop
    title = "Personal Information",
    isPartner = false,
    onRemove,
    errors = {},
    basePath = "",
    onClearError,
    onSetError,
    onValidateField,
    // New conditional rendering props
    hidePepDeclaration = false,
    hideEmployment = false,
    hideBank = false,
    hideFamilyTree = false,
    hideSpouse = false, // added to hide spouse section (e.g., for related PEPs)
    businessType, // to know if shareholder >25% validation applies
}: {
    data: any;
    onUpdate: (newData: any) => void;
    countryOptions: any[];
    dzongkhagOptions: any[];
    identificationTypeOptions: any[];
    maritalStatusOptions: any[];
    taxIdentifierTypeOptions?: any[];   // <-- NEW prop
    title?: string;
    isPartner?: boolean;
    onRemove?: () => void;
    errors?: Record<string, string>;
    basePath?: string;
    onClearError?: (fieldPath: string) => void;
    onSetError?: (fieldPath: string, error: string) => void;
    onValidateField?: (fieldPath: string, value: any, fullData?: any) => string;
    hidePepDeclaration?: boolean;
    hideEmployment?: boolean;
    hideBank?: boolean;
    hideFamilyTree?: boolean;
    hideSpouse?: boolean; // added
    businessType?: string; // added
}) => {
    // Local Options State (remaining ones)
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

    // Spouse dynamic options
    const [spousePermGewogOptions, setSpousePermGewogOptions] = useState<any[]>(
        [],
    );

    const [isExpanded, setIsExpanded] = useState(true);

    // --- Lookup state ---
    const [showLookupPopup, setShowLookupPopup] = useState(false);
    const [lookupStatus, setLookupStatus] = useState<
        "searching" | "found" | "not_found"
    >("searching");
    const [fetchedCustomerData, setFetchedCustomerData] = useState<any>(null);

    const today = new Date().toISOString().split("T")[0];

    // Unique identifier for this person (used as session key)
    const personId = data.id;

    // Function to determine if current nationality is Bhutanese
    const isNatBhutanese = (nationalityId: string) => {
        if (!nationalityId) return false;
        const n = nationalityOptions.find(
            (opt) =>
                String(opt.id || opt.nationality_pk_code) === String(nationalityId),
        );

        const label = n ? n.nationality || n.name || "" : String(nationalityId);
        const lowerLabel = label.toLowerCase();

        // Check if it includes "bhutan" but explicitly exclude "non" (e.g., "non-bhutanese")
        return lowerLabel.includes("bhutan") && !lowerLabel.includes("non");
    };
    // ---- Helper: convert person data to storable version (IDs -> labels) ----
    const convertPersonToStorable = (personData: any) => {
        const result: any = { ...personData };

        // Identification Type
        if (result.identificationType) {
            result.identificationType = findLabelById(
                result.identificationType,
                identificationTypeOptions, ["identification_type", "identity_type", "name"],
            );
        }

        // Nationality
        if (result.nationality) {
            result.nationality = findLabelById(
                result.nationality,
                nationalityOptions,
                ["nationality", "name"],
            );
        }

        // Marital Status
        if (result.maritalStatus) {
            result.maritalStatus = findLabelById(
                result.maritalStatus,
                maritalStatusOptions,
                ["marital_status", "name"],
            );
        }

        // Tax Identifier Type   <-- NEW
        if (result.taxIdentifierType && taxIdentifierTypeOptions?.length) {
            result.taxIdentifierType = findLabelById(
                result.taxIdentifierType,
                taxIdentifierTypeOptions,
                ["tax_identifier_type", "name", "label"],
            );
        }

        // Bank Name
        if (result.bankName) {
            result.bankName = findLabelById(result.bankName, banksOptions, [
                "bank_name",
                "name",
            ]);
        }

        // Permanent Country
        if (result.permCountry) {
            result.permCountry = findLabelById(result.permCountry, countryOptions, [
                "country_name",
                "country",
            ]);
        }

        // Permanent Dzongkhag (if Bhutan)
        if (result.permDzongkhag) {
            result.permDzongkhag = findLabelById(
                result.permDzongkhag,
                dzongkhagOptions, ["dzongkhag_name", "dzongkhag"],
            );
        }

        // Permanent Gewog (if available)
        if (result.permGewog && permGewogOptions.length > 0) {
            result.permGewog = findLabelById(result.permGewog, permGewogOptions, [
                "gewog_name",
                "gewog",
            ]);
        }

        // Current Country
        if (result.currCountry) {
            result.currCountry = findLabelById(result.currCountry, countryOptions, [
                "country_name",
                "country",
            ]);
        }

        // Current Dzongkhag
        if (result.currDzongkhag) {
            result.currDzongkhag = findLabelById(
                result.currDzongkhag,
                dzongkhagOptions,
                ["dzongkhag_name", "dzongkhag"],
            );
        }

        // Current Gewog
        if (result.currGewog && currGewogOptions.length > 0) {
            result.currGewog = findLabelById(result.currGewog, currGewogOptions, [
                "gewog_name",
                "gewog",
            ]);
        }

        // Occupation
        if (result.occupation) {
            result.occupation = findLabelById(result.occupation, occupationOptions, [
                "occ_name",
                "occupation",
            ]);
        }

        // PEP Category
        if (result.pepCategory) {
            result.pepCategory = findLabelById(
                result.pepCategory,
                pepCategoryOptions, ["pep_category", "name"],
            );
        }

        // PEP SubCategory
        if (result.pepSubCategory && pepSubCategoryOptions.length > 0) {
            result.pepSubCategory = findLabelById(
                result.pepSubCategory,
                pepSubCategoryOptions,
                ["pep_sub_category", "name"],
            );
        }

        // Related PEPs (nested)
        if (result.relatedPeps && Array.isArray(result.relatedPeps)) {
            result.relatedPeps = result.relatedPeps.map((pep: any, idx: number) => {
                const pepCopy = { ...pep };
                if (pepCopy.category) {
                    pepCopy.category = findLabelById(
                        pepCopy.category,
                        pepCategoryOptions,
                        ["pep_category", "name"],
                    );
                }
                if (pepCopy.subCategory && relatedPepOptionsMap[idx]) {
                    pepCopy.subCategory = findLabelById(
                        pepCopy.subCategory,
                        relatedPepOptionsMap[idx],
                        ["pep_sub_category", "name"],
                    );
                }
                return pepCopy;
            });
        }

        // Spouse fields (if any)
        if (result.spouseIdentificationType) {
            result.spouseIdentificationType = findLabelById(
                result.spouseIdentificationType,
                identificationTypeOptions,
                ["identification_type", "identity_type", "name"],
            );
        }
        if (result.spouseNationality) {
            result.spouseNationality = findLabelById(
                result.spouseNationality,
                nationalityOptions,
                ["nationality", "name"],
            );
        }
        if (result.spouseTaxIdentifierType && taxIdentifierTypeOptions?.length) {   // <-- NEW
            result.spouseTaxIdentifierType = findLabelById(
                result.spouseTaxIdentifierType,
                taxIdentifierTypeOptions,
                ["tax_identifier_type", "name", "label"],
            );
        }
        if (result.spousePermCountry) {
            result.spousePermCountry = findLabelById(
                result.spousePermCountry,
                countryOptions,
                ["country_name", "country"],
            );
        }
        if (result.spousePermDzongkhag) {
            result.spousePermDzongkhag = findLabelById(
                result.spousePermDzongkhag,
                dzongkhagOptions,
                ["dzongkhag_name", "dzongkhag"],
            );
        }
        if (result.spousePermGewog && spousePermGewogOptions.length > 0) {
            result.spousePermGewog = findLabelById(
                result.spousePermGewog,
                spousePermGewogOptions,
                ["gewog_name", "gewog"],
            );
        }

        return result;
    };

    // Load stored data from session on mount
    useEffect(() => {
        if (!personId) return;
        const stored = sessionStorage.getItem(`verifiedPersonData_${personId}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Merge with current data (preserving the ID)
                onUpdate({ ...data, ...parsed, id: data.id });
            } catch (e) {
                console.error("Failed to parse stored person data", e);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [personId]);

    const getErrorKey = (field: string) =>
        basePath ? `${basePath}.${field}` : field;
    const fieldError = (field: string) => errors[getErrorKey(field)];

    // Helper to update parent state AND validate the field in real time,
    // and also write the updated data to session storage (after converting IDs to labels).
    const updateField = (field: string, value: any) => {
        const newData = { ...data, [field]: value };
        onUpdate(newData);
        if (personId) {
            // Convert to storable (labels) before saving
            const storableData = convertPersonToStorable(newData);
            console.log(`Field "${field}" updated, storing in session:`, storableData);

            sessionStorage.setItem(
                `verifiedPersonData_${personId}`,
                JSON.stringify(storableData),
            );
        }
        if (onValidateField && onSetError && onClearError) {
            const errorMsg = onValidateField(getErrorKey(field), value, newData);
            if (errorMsg) {
                onSetError(getErrorKey(field), errorMsg);
            } else {
                onClearError(getErrorKey(field));
            }
        }
    };

    const updateRelatedPep = (index: number, field: string, value: any) => {
        const updatedPeps = [...(data.relatedPeps || [])];
        if (!updatedPeps[index]) updatedPeps[index] = createEmptyRelatedPep();
        updatedPeps[index] = { ...updatedPeps[index], [field]: value };
        updateField("relatedPeps", updatedPeps);
    };

    // --- Identity Lookup Handlers ---
    const handleIdentityCheck = async () => {
        const idType = data.identificationType;
        const idNo = data.identificationNo;

        if (!idType || !idNo || idNo.trim() === "") return;

        setShowLookupPopup(true);
        setLookupStatus("searching");

        try {
            const payload = {
                type: "I",
                identification_type_pk_code: idType,
                identity_no: idNo,
            };

            console.log("Identity lookup payload:", payload);

            const response = await fetch("/api/customer-onboarded-details", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            console.log(" Identity lookup raw response:", result);

            if (response.ok && result?.success && result?.data) {
                const mappedData = mapCustomerDataToForm(result);
                console.log("Mapped customer data:", mappedData);
                setFetchedCustomerData(mappedData);
                setLookupStatus("found");
            } else {
                console.log("Identity lookup – not found or error");
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
            // --- 1. PRE-CALCULATE IDs FROM LABELS ---
            // This is crucial because the API returns labels (e.g., "Bhutan") but Select components expect IDs.
            // We do this immediately using the props/state available so the user sees filled values instantly.

            // Map Country IDs
            const mappedPermCountry = findPkCodeByLabel(
                fetchedCustomerData.permCountry,
                countryOptions, ["country_name", "country", "name", "label"],
            );
            const mappedCurrCountry = findPkCodeByLabel(
                fetchedCustomerData.currCountry,
                countryOptions, ["country_name", "country", "name", "label"],
            );

            // Map Dzongkhag IDs (if available in props)
            const mappedPermDzongkhag = findPkCodeByLabel(
                fetchedCustomerData.permDzongkhag,
                dzongkhagOptions, ["dzongkhag_name", "dzongkhag", "name", "label"],
            );
            const mappedCurrDzongkhag = findPkCodeByLabel(
                fetchedCustomerData.currDzongkhag,
                dzongkhagOptions,
                ["dzongkhag_name", "dzongkhag", "name", "label"],
            );

            // Map Nationality ID (using internal options state if loaded, otherwise reliance on Effect)
            let mappedNationality = fetchedCustomerData.nationality;
            if (nationalityOptions.length > 0) {
                mappedNationality = findPkCodeByLabel(
                    fetchedCustomerData.nationality,
                    nationalityOptions,
                    ["nationality", "name"],
                );
            }

            // Map Marital Status ID
            const mappedMaritalStatus = findPkCodeByLabel(
                fetchedCustomerData.maritalStatus,
                maritalStatusOptions,
                ["marital_status", "name", "label"],
            );

            // Map Tax Identifier Type   <-- NEW
            let mappedTaxIdentifierType = fetchedCustomerData.taxIdentifierType;
            if (taxIdentifierTypeOptions?.length) {
                mappedTaxIdentifierType = findPkCodeByLabel(
                    fetchedCustomerData.taxIdentifierType,
                    taxIdentifierTypeOptions,
                    ["tax_identifier_type", "name", "label"],
                );
            }

            // --- 2. DETERMINE EMPLOYMENT STATUS ---
            let inferredEmploymentStatus = "unemployed";
            const hasOccupation =
                fetchedCustomerData.occupation &&
                fetchedCustomerData.occupation.toLowerCase() !== "na";
            const hasEmployeeId =
                fetchedCustomerData.employeeId &&
                fetchedCustomerData.employeeId.toLowerCase() !== "na";
            const hasEmployer =
                fetchedCustomerData.employerName &&
                fetchedCustomerData.employerName.toLowerCase() !== "na";
            const hasAnnualSalary = parseFloat(fetchedCustomerData.annualSalary) > 0;

            if (hasOccupation || hasEmployeeId || hasEmployer || hasAnnualSalary) {
                inferredEmploymentStatus = "employed";
            }

            // --- 3. MAP EMPLOYER TYPE ---
            // Form expects: "government", "private", "corporate"
            // API might return: "Non-Bank Financial Institutions", "Government", etc.
            let mappedEmployerType = "";
            const rawOrgType = (
                fetchedCustomerData.organizationType || ""
            ).toLowerCase();
            if (
                rawOrgType.includes("government") ||
                rawOrgType.includes("ministry")
            ) {
                mappedEmployerType = "government";
            } else if (
                rawOrgType.includes("financial") ||
                rawOrgType.includes("corporate") ||
                rawOrgType.includes("limited")
            ) {
                mappedEmployerType = "corporate";
            } else if (rawOrgType.includes("private")) {
                mappedEmployerType = "private";
            } else if (inferredEmploymentStatus === "employed") {
                // Default to private if employed but type unknown
                mappedEmployerType = "private";
            }

            // Prepare sanitized data (ensure dates are in YYYY-MM-DD)
            const sanitized = {
                ...fetchedCustomerData,
                // Map Keys
                nationality: mappedNationality,
                permCountry: mappedPermCountry || fetchedCustomerData.permCountry,
                permDzongkhag: mappedPermDzongkhag || fetchedCustomerData.permDzongkhag,
                currCountry: mappedCurrCountry || fetchedCustomerData.currCountry,
                currDzongkhag: mappedCurrDzongkhag || fetchedCustomerData.currDzongkhag,
                maritalStatus: mappedMaritalStatus || fetchedCustomerData.maritalStatus,
                taxIdentifierType: mappedTaxIdentifierType || fetchedCustomerData.taxIdentifierType,   // <-- NEW

                // Map Dates
                identificationIssueDate: formatDateForInput(
                    fetchedCustomerData.identificationIssueDate,
                ),
                identificationExpiryDate: formatDateForInput(
                    fetchedCustomerData.identificationExpiryDate,
                ),
                dateOfBirth: formatDateForInput(fetchedCustomerData.dateOfBirth),
                joiningDate: formatDateForInput(fetchedCustomerData.joiningDate),

                // Employment Data Logic
                employmentStatus: inferredEmploymentStatus,
                employerType: mappedEmployerType,

                // Fields directly from API that might need string conversion
                // IMPORTANT: We pass the raw string for Gewogs initially.
                // The useEffect will map these to IDs once the dependent options load.
                permGewog: fetchedCustomerData.permGewog
                    ? String(fetchedCustomerData.permGewog)
                    : "",
                currGewog: fetchedCustomerData.currGewog
                    ? String(fetchedCustomerData.currGewog)
                    : "",
                occupation: fetchedCustomerData.occupation
                    ? String(fetchedCustomerData.occupation)
                    : "",
                // Pass organization name directly as it is a text field now
                organizationName: fetchedCustomerData.organizationName
                    ? String(fetchedCustomerData.organizationName)
                    : "",
                grade: fetchedCustomerData.grade
                    ? String(fetchedCustomerData.grade)
                    : "",
                // Map alternate contact number to the form's expected field
                currAlternateContact: fetchedCustomerData.alternateContactNo || "",
                householdNumber: fetchedCustomerData.householdNumber || "",
            };

            const newData = {
                ...data,
                ...sanitized,
                identificationType: data.identificationType,
                identificationNo: data.identificationNo,
            };
            console.log("Applying lookup data to person:", newData);

            onUpdate(newData);
            if (personId) {
                // Also store in session (converted to labels)
                const storableData = convertPersonToStorable(newData);
                sessionStorage.setItem(
                    `verifiedPersonData_${personId}`,
                    JSON.stringify(storableData),
                );
            }
        }
        setShowLookupPopup(false);
    };

    // --- Initial Data Loading (remaining options) ---
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [banks, national, occ, org, pepCat] = await Promise.all([
                    fetchBanks().catch(() => []),
                    fetchNationality().catch(() => []),
                    fetchOccupations().catch(() => []),
                    fetchLegalConstitution().catch(() => []),
                    fetchPepCategory().catch(() => []),
                ]);
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

    // --- Conversion Effects (label -> pk_code) ---

    // Convert nationality label to pk_code
    useEffect(() => {
        if (nationalityOptions.length > 0 && data.nationality) {
            const isValid = nationalityOptions.some(
                (opt) =>
                    String(opt.id || opt.nationality_pk_code) ===
                    String(data.nationality),
            );
            if (!isValid) {
                const pkCode = findPkCodeByLabel(data.nationality, nationalityOptions, [
                    "nationality",
                    "name",
                    "label",
                ]);
                if (pkCode && pkCode !== data.nationality) {
                    updateField("nationality", pkCode);
                }
            }
        }
    }, [nationalityOptions, data.nationality]);

    // Convert bankName label to pk_code
    useEffect(() => {
        if (banksOptions.length > 0 && data.bankName) {
            const isValid = banksOptions.some(
                (opt) => String(opt.bank_pk_code || opt.id) === String(data.bankName),
            );
            if (!isValid) {
                const pkCode = findPkCodeByLabel(data.bankName, banksOptions, [
                    "bank_name",
                    "name",
                    "label",
                    "bank",
                ]);
                if (pkCode && pkCode !== data.bankName) {
                    updateField("bankName", pkCode);
                }
            }
        }
    }, [banksOptions, data.bankName]);

    // Convert maritalStatus label to pk_code
    useEffect(() => {
        if (maritalStatusOptions.length > 0 && data.maritalStatus) {
            const isValid = maritalStatusOptions.some(
                (opt) =>
                    String(opt.marital_status_pk_code || opt.id) ===
                    String(data.maritalStatus),
            );
            if (!isValid) {
                const pkCode = findPkCodeByLabel(
                    data.maritalStatus,
                    maritalStatusOptions,
                    ["marital_status", "name", "label"],
                );
                if (pkCode && pkCode !== data.maritalStatus) {
                    updateField("maritalStatus", pkCode);
                }
            }
        }
    }, [maritalStatusOptions, data.maritalStatus]);

    // Convert taxIdentifierType label to pk_code   <-- NEW
    useEffect(() => {
        if (taxIdentifierTypeOptions?.length && data.taxIdentifierType) {
            const isValid = taxIdentifierTypeOptions.some(
                (opt) =>
                    String(opt.tax_identifier_type_pk_code || opt.id) ===
                    String(data.taxIdentifierType),
            );
            if (!isValid) {
                const pkCode = findPkCodeByLabel(
                    data.taxIdentifierType,
                    taxIdentifierTypeOptions,
                    ["tax_identifier_type", "name", "label"],
                );
                if (pkCode && pkCode !== data.taxIdentifierType) {
                    updateField("taxIdentifierType", pkCode);
                }
            }
        }
    }, [taxIdentifierTypeOptions, data.taxIdentifierType]);

    // Convert occupation label to pk_code
    useEffect(() => {
        if (occupationOptions.length > 0 && data.occupation) {
            const isValid = occupationOptions.some(
                (opt) =>
                    String(opt.occ_pk_code || opt.occupation_pk_code || opt.id) ===
                    String(data.occupation),
            );
            if (!isValid) {
                const pkCode = findPkCodeByLabel(data.occupation, occupationOptions, [
                    "occ_name",
                    "occupation",
                    "name",
                ]);
                if (pkCode && pkCode !== data.occupation) {
                    updateField("occupation", pkCode);
                }
            }
        }
    }, [occupationOptions, data.occupation]);

    // Convert permCountry label to pk_code
    useEffect(() => {
        if (countryOptions.length > 0 && data.permCountry) {
            const isValid = countryOptions.some(
                (opt) =>
                    String(opt.country_pk_code || opt.id) === String(data.permCountry),
            );
            if (!isValid) {
                const pkCode = findPkCodeByLabel(data.permCountry, countryOptions, [
                    "country_name",
                    "country",
                ]);
                if (pkCode && pkCode !== data.permCountry) {
                    updateField("permCountry", pkCode);
                }
            }
        }
    }, [countryOptions, data.permCountry]);

    // Convert currCountry label to pk_code
    useEffect(() => {
        if (countryOptions.length > 0 && data.currCountry) {
            const isValid = countryOptions.some(
                (opt) =>
                    String(opt.country_pk_code || opt.id) === String(data.currCountry),
            );
            if (!isValid) {
                const pkCode = findPkCodeByLabel(data.currCountry, countryOptions, [
                    "country_name",
                    "country",
                ]);
                if (pkCode && pkCode !== data.currCountry) {
                    updateField("currCountry", pkCode);
                }
            }
        }
    }, [countryOptions, data.currCountry]);

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

    // Convert permDzongkhag label to pk_code (only if Bhutan)
    useEffect(() => {
        if (
            isBhutan(data.permCountry) &&
            dzongkhagOptions.length > 0 &&
            data.permDzongkhag
        ) {
            const isValid = dzongkhagOptions.some(
                (opt) =>
                    String(opt.dzongkhag_pk_code || opt.id) ===
                    String(data.permDzongkhag),
            );
            if (!isValid) {
                const pkCode = findPkCodeByLabel(data.permDzongkhag, dzongkhagOptions, [
                    "dzongkhag_name",
                    "dzongkhag",
                ]);
                if (pkCode && pkCode !== data.permDzongkhag) {
                    updateField("permDzongkhag", pkCode);
                }
            }
        }
    }, [dzongkhagOptions, data.permDzongkhag, data.permCountry]);

    // Convert currDzongkhag label to pk_code (only if Bhutan)
    useEffect(() => {
        if (
            isBhutan(data.currCountry) &&
            dzongkhagOptions.length > 0 &&
            data.currDzongkhag
        ) {
            const isValid = dzongkhagOptions.some(
                (opt) =>
                    String(opt.dzongkhag_pk_code || opt.id) ===
                    String(data.currDzongkhag),
            );
            if (!isValid) {
                const pkCode = findPkCodeByLabel(data.currDzongkhag, dzongkhagOptions, [
                    "dzongkhag_name",
                    "dzongkhag",
                ]);
                if (pkCode && pkCode !== data.currDzongkhag) {
                    updateField("currDzongkhag", pkCode);
                }
            }
        }
    }, [dzongkhagOptions, data.currDzongkhag, data.currCountry]);

    // --- Logic: Address Gewogs ---

    // 1. Fetch Options when Dzongkhag changes
    useEffect(() => {
        // Only fetch if data.permDzongkhag is present
        if (data.permDzongkhag) {
            // Check if it's an ID (numeric) or a label
            const isId = /^\d+$/.test(data.permDzongkhag);

            // If it's a label, try to resolve it to an ID first
            let dzongkhagId = data.permDzongkhag;
            if (!isId && dzongkhagOptions.length > 0) {
                const resolved = findPkCodeByLabel(
                    data.permDzongkhag,
                    dzongkhagOptions,
                    ["dzongkhag_name", "dzongkhag"],
                );
                if (resolved) dzongkhagId = resolved;
            }

            fetchGewogsByDzongkhag(dzongkhagId)
                .then((res) => setPermGewogOptions(res?.data?.data || res || []))
                .catch(() => setPermGewogOptions([]));
        } else {
            setPermGewogOptions([]);
        }
    }, [data.permDzongkhag, dzongkhagOptions]);

    useEffect(() => {
        if (data.currDzongkhag) {
            // Check if it's an ID (numeric) or a label
            const isId = /^\d+$/.test(data.currDzongkhag);

            // If it's a label, try to resolve it to an ID first
            let dzongkhagId = data.currDzongkhag;
            if (!isId && dzongkhagOptions.length > 0) {
                const resolved = findPkCodeByLabel(
                    data.currDzongkhag,
                    dzongkhagOptions,
                    ["dzongkhag_name", "dzongkhag"],
                );
                if (resolved) dzongkhagId = resolved;
            }

            fetchGewogsByDzongkhag(dzongkhagId)
                .then((res) => setCurrGewogOptions(res?.data?.data || res || []))
                .catch(() => setCurrGewogOptions([]));
        } else {
            setCurrGewogOptions([]);
        }
    }, [data.currDzongkhag, dzongkhagOptions]);

    // 2. Convert Gewog Names to IDs when Options become available
    // Permanent Gewog conversion
    useEffect(() => {
        if (permGewogOptions.length > 0 && data.permGewog) {
            // Check if the current value is already a valid ID in the options
            const isId = permGewogOptions.some(
                (opt) =>
                    String(
                        opt.gewog_pk_code ||
                        opt.id ||
                        opt.pk_gewog_id ||
                        opt.curr_gewog_pk_code,
                    ) === String(data.permGewog),
            );

            if (!isId) {
                // If not an ID, try to match by label
                const matchedId = findPkCodeByLabel(data.permGewog, permGewogOptions, [
                    "gewog_name",
                    "gewog",
                    "name",
                    "label",
                ]);
                if (matchedId && matchedId !== data.permGewog) {
                    updateField("permGewog", matchedId);
                }
            }
        }
    }, [permGewogOptions, data.permGewog]);

    // Current Gewog conversion
    useEffect(() => {
        if (currGewogOptions.length > 0 && data.currGewog) {
            // Check if the current value is already a valid ID in the options
            const isId = currGewogOptions.some(
                (opt) =>
                    String(
                        opt.gewog_pk_code ||
                        opt.id ||
                        opt.pk_gewog_id ||
                        opt.curr_gewog_pk_code,
                    ) === String(data.currGewog),
            );

            if (!isId) {
                // If not an ID, try to match by label
                const matchedId = findPkCodeByLabel(data.currGewog, currGewogOptions, [
                    "gewog_name",
                    "gewog",
                    "name",
                    "label",
                ]);
                if (matchedId && matchedId !== data.currGewog) {
                    updateField("currGewog", matchedId);
                }
            }
        }
    }, [currGewogOptions, data.currGewog]);

    // --- Logic: PEP Subcategories ---
    useEffect(() => {
        if (data.pepPerson === "yes" && data.pepCategory) {
            fetchPepSubCategoryByCategory(data.pepCategory)
                .then((res) => setPepSubCategoryOptions(res?.data?.data || res || []))
                .catch(() => setPepSubCategoryOptions([]));
        }
    }, [data.pepPerson, data.pepCategory]);

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

    const isMarried = () => {
        return isMarriedStatusFromOptions(data.maritalStatus, maritalStatusOptions);
    };

    const handleFileChange = async (fieldName: string, file: File | null) => {
        if (file) {
            const allowedTypes = [
                "application/pdf",
                "image/jpeg",
                "image/jpg",
                "image/png",
            ];
            const maxSize = 5 * 1024 * 1024; // 5MB

            if (!allowedTypes.includes(file.type)) {
                alert("Only PDF, JPG, JPEG, and PNG files are allowed");
                return;
            }
            if (file.size > maxSize) {
                alert("File size must be less than 5MB");
                return;
            }

            try {
                const fileId = await storeFile(file);
                if (fieldName === "passportPhoto") {
                    updateField("passportPhoto", fileId);
                    updateField("passportPhotoName", file.name);
                } else if (fieldName === "identityProof") {
                    // NEW: identity proof upload
                    updateField("identityProof", fileId);
                    updateField("identityProofName", file.name);
                } else {
                    updateField(fieldName, fileId);
                    updateField(`${fieldName}Name`, file.name);
                }

                // 🔥 Explicitly clear error for this field
                if (onClearError) {
                    onClearError(getErrorKey(fieldName));
                }
            } catch (error) {
                console.error("Failed to store file in IndexedDB", error);
                alert("File upload failed. Please try again.");
            }
        }
    };

    const handleSpouseChange = (field: string, value: any) => {
        onUpdate({ ...data, [field]: value });
        if (onValidateField && onSetError && onClearError) {
            const errorMsg = onValidateField(getErrorKey(field), value, {
                ...data,
                [field]: value,
            });
            if (errorMsg) {
                onSetError(getErrorKey(field), errorMsg);
            } else {
                onClearError(getErrorKey(field));
            }
        }
    };

    const handleSpouseFileChange = async (fieldName: string, file: File | null) => {
        if (file) {
            const allowedTypes = [
                "application/pdf",
                "image/jpeg",
                "image/jpg",
                "image/png",
            ];
            const maxSize = 5 * 1024 * 1024; // 5MB

            if (!allowedTypes.includes(file.type)) {
                alert("Only PDF, JPG, JPEG, and PNG files are allowed");
                return;
            }
            if (file.size > maxSize) {
                alert("File size must be less than 5MB");
                return;
            }

            try {
                const fileId = await storeFile(file);
                onUpdate({
                    ...data,
                    [fieldName]: fileId,
                    [`${fieldName}Name`]: file.name,
                });
                if (onClearError) {
                    onClearError(getErrorKey(fieldName));
                }
            } catch (error) {
                console.error("Failed to store file", error);
                alert("File upload failed. Please try again.");
            }
        }
    };

    // --- Spouse gewog options fetch ---
    useEffect(() => {
        if (data.spousePermDzongkhag) {
            let dzongkhagId = data.spousePermDzongkhag;
            const isId = /^\d+$/.test(dzongkhagId);
            if (!isId && dzongkhagOptions.length > 0) {
                const resolved = findPkCodeByLabel(dzongkhagId, dzongkhagOptions, [
                    "dzongkhag_name",
                    "dzongkhag",
                ]);
                if (resolved) dzongkhagId = resolved;
            }
            fetchGewogsByDzongkhag(dzongkhagId)
                .then((res) => setSpousePermGewogOptions(res?.data?.data || res || []))
                .catch(() => setSpousePermGewogOptions([]));
        } else {
            setSpousePermGewogOptions([]);
        }
    }, [data.spousePermDzongkhag, dzongkhagOptions]);

    // Convert spouse gewog label to ID
    useEffect(() => {
        if (spousePermGewogOptions.length > 0 && data.spousePermGewog) {
            const isId = spousePermGewogOptions.some(
                (opt) =>
                    String(
                        opt.gewog_pk_code ||
                        opt.id ||
                        opt.pk_gewog_id ||
                        opt.curr_gewog_pk_code,
                    ) === String(data.spousePermGewog),
            );
            if (!isId) {
                const matchedId = findPkCodeByLabel(
                    data.spousePermGewog,
                    spousePermGewogOptions, ["gewog_name", "gewog", "name", "label"],
                );
                if (matchedId && matchedId !== data.spousePermGewog) {
                    updateField("spousePermGewog", matchedId);
                }
            }
        }
    }, [spousePermGewogOptions, data.spousePermGewog]);

    // Convert spouse taxIdentifierType label to pk_code   <-- NEW
    useEffect(() => {
        if (taxIdentifierTypeOptions?.length && data.spouseTaxIdentifierType) {
            const isValid = taxIdentifierTypeOptions.some(
                (opt) =>
                    String(opt.tax_identifier_type_pk_code || opt.id) ===
                    String(data.spouseTaxIdentifierType),
            );
            if (!isValid) {
                const pkCode = findPkCodeByLabel(
                    data.spouseTaxIdentifierType,
                    taxIdentifierTypeOptions,
                    ["tax_identifier_type", "name", "label"],
                );
                if (pkCode && pkCode !== data.spouseTaxIdentifierType) {
                    updateField("spouseTaxIdentifierType", pkCode);
                }
            }
        }
    }, [taxIdentifierTypeOptions, data.spouseTaxIdentifierType]);

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
                    {showLookupPopup && (
                        // Conditionally render the appropriate popup based on businessType
                        businessType === "Sole Proprietorship" || businessType === "Partnership" ? (
                            <DocumentPopup
                                open={showLookupPopup}
                                onOpenChange={setShowLookupPopup}
                                searchStatus={lookupStatus}
                                onProceed={handleLookupProceed}
                            />
                        ) : (
                            <DocumentPopupOnly
                                open={showLookupPopup}
                                onOpenChange={setShowLookupPopup}
                                searchStatus={lookupStatus}
                                onProceed={handleLookupProceed}
                            />
                        )
                    )}

                    {/* 1. Personal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label>Identification Type *</Label>
                            <Select
                                value={data.identificationType}
                                onValueChange={(v) => updateField("identificationType", v)}
                            >
                                <SelectTrigger
                                    className={getFieldStyle(!!fieldError("identificationType"))}
                                >
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {identificationTypeOptions
                                        .filter((opt: any) => {
                                            const label = (
                                                opt.identification_type ||
                                                opt.identity_type ||
                                                ""
                                            ).toLowerCase();
                                            // Show all options except "trade license number" and "company registration number"
                                            return !(
                                                label.includes("trade license number") ||
                                                label.includes("company registration number")
                                            );
                                        })
                                        .map((opt: any, i) => (
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
                            {fieldError("identificationType") && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldError("identificationType")}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Identification No. *</Label>
                            <RestrictedInput
                                allowed="numeric"
                                maxLength={11}
                                className={getFieldStyle(!!fieldError("identificationNo"))}
                                value={data.identificationNo}
                                onChange={(e) =>
                                    updateField("identificationNo", e.target.value)
                                }
                                onBlur={handleIdentityCheck}
                            />
                            {fieldError("identificationNo") && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldError("identificationNo")}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Salutation *</Label>
                            <Select
                                value={data.salutation ? data.salutation.toLowerCase() : ""}
                                onValueChange={(v) => updateField("salutation", v)}
                            >
                                <SelectTrigger
                                    className={getFieldStyle(!!fieldError("salutation"))}
                                >
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mr">Mr.</SelectItem>
                                    <SelectItem value="mrs">Mrs.</SelectItem>
                                    <SelectItem value="ms">Ms.</SelectItem>
                                    <SelectItem value="dasho">Dasho</SelectItem>
                                </SelectContent>
                            </Select>
                            {fieldError("salutation") && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldError("salutation")}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Applicant Name *</Label>
                            <RestrictedInput
                                allowed="alpha"
                                className={getFieldStyle(!!fieldError("applicantName"))}
                                value={data.applicantName}
                                onChange={(e) => updateField("applicantName", e.target.value)}
                            />
                            {fieldError("applicantName") && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldError("applicantName")}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Nationality *</Label>
                            <Select
                                value={data.nationality}
                                onValueChange={(v) => updateField("nationality", v)}
                            >
                                <SelectTrigger
                                    className={getFieldStyle(!!fieldError("nationality"))}
                                >
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
                            {fieldError("nationality") && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldError("nationality")}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Gender *</Label>
                            <Select
                                value={data.gender ? data.gender.toLowerCase() : ""}
                                onValueChange={(v) => updateField("gender", v)}
                            >
                                <SelectTrigger
                                    className={getFieldStyle(!!fieldError("gender"))}
                                >
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            {fieldError("gender") && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldError("gender")}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Identification Issue Date *</Label>
                            <Input
                                type="date"
                                className={getFieldStyle(
                                    !!fieldError("identificationIssueDate"),
                                )}
                                value={formatDateForInput(data.identificationIssueDate)}
                                onChange={(e) =>
                                    updateField("identificationIssueDate", e.target.value)
                                }
                            />
                            {fieldError("identificationIssueDate") && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldError("identificationIssueDate")}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Identification Expiry Date *</Label>
                            <Input
                                type="date"
                                className={getFieldStyle(
                                    !!fieldError("identificationExpiryDate"),
                                )}
                                value={formatDateForInput(data.identificationExpiryDate)}
                                onChange={(e) =>
                                    updateField("identificationExpiryDate", e.target.value)
                                }
                            />
                            {fieldError("identificationExpiryDate") && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldError("identificationExpiryDate")}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Date of Birth *</Label>
                            <Input
                                type="date"
                                className={getFieldStyle(!!fieldError("dateOfBirth"))}
                                value={formatDateForInput(data.dateOfBirth)}
                                onChange={(e) => updateField("dateOfBirth", e.target.value)}
                            />
                            {fieldError("dateOfBirth") && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldError("dateOfBirth")}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Tax Identifier Type</Label>
                            <Select
                                value={data.taxIdentifierType}
                                onValueChange={(v) => updateField("taxIdentifierType", v)}
                            >
                                <SelectTrigger
                                    className={getFieldStyle(!!fieldError("taxIdentifierType"))}
                                >
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {taxIdentifierTypeOptions?.length ? (
                                        // In ownership details, show ONLY Personal Income Tax (PIT)
                                        taxIdentifierTypeOptions
                                            .filter((opt: any) => {
                                                const label = (opt.tax_identifier_type || opt.name || "").toLowerCase();
                                                // Include if label contains "personal income tax" or is exactly "pit"
                                                return label.includes("personal income tax") || label === "pit";
                                            })
                                            .map((opt: any, i) => (
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
                            {fieldError("taxIdentifierType") && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldError("taxIdentifierType")}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>TPN No </Label>
                            <RestrictedInput
                                allowed="numeric"
                                maxLength={11}
                                className={getFieldStyle(!!fieldError("tpn"))}
                                value={data.tpn}
                                onChange={(e) => updateField("tpn", e.target.value)}
                            />
                            {fieldError("tpn") && (
                                <p className="text-xs text-red-500 mt-1">{fieldError("tpn")}</p>
                            )}
                        </div>

                        {/* Household Number - conditionally shown */}
                        {isNatBhutanese(data.nationality) && (
                            <div className="space-y-2">
                                <Label>Household Number *</Label>
                                <RestrictedInput
                                    allowed="alphanumeric"
                                    className={getFieldStyle(!!fieldError("householdNumber"))}
                                    value={data.householdNumber}
                                    onChange={(e) =>
                                        updateField("householdNumber", e.target.value)
                                    }
                                />
                                {fieldError("householdNumber") && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {fieldError("householdNumber")}
                                    </p>
                                )}
                            </div>
                        )}

                        {isPartner && (
                            <div className="space-y-2">
                                <Label>Shareholding %</Label>
                                <Input
                                    type="number"
                                    className={getFieldStyle(!!fieldError("shareholdingPercent"))}
                                    value={data.shareholdingPercent}
                                    placeholder="e.g. 25"
                                    onChange={(e) =>
                                        updateField("shareholdingPercent", e.target.value)
                                    }
                                    min={0}
                                    max={100}
                                />
                                {fieldError("shareholdingPercent") && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {fieldError("shareholdingPercent")}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Marital Status *</Label>
                            <Select
                                value={data.maritalStatus}
                                onValueChange={(v) => updateField("maritalStatus", v)}
                            >
                                <SelectTrigger
                                    className={getFieldStyle(!!fieldError("maritalStatus"))}
                                >
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
                            {fieldError("maritalStatus") && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldError("maritalStatus")}
                                </p>
                            )}
                        </div>

                        {/* NEW: Identity Proof Upload */}
                        <div className="space-y-2.5">
                            <Label>Upload Identity Proof *</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    id={`identity-proof-${data.id || "owner"}`}
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) =>
                                        handleFileChange(
                                            "identityProof",
                                            e.target.files?.[0] || null,
                                        )
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={`w-28 ${fieldError("identityProof") ? "border-red-500" : "bg-transparent"}`}
                                    onClick={() =>
                                        document
                                            .getElementById(`identity-proof-${data.id || "owner"}`)
                                            ?.click()
                                    }
                                >
                                    Choose File
                                </Button>
                                <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                    {data.identityProofName || "No file chosen"}
                                </span>
                            </div>
                            {fieldError("identityProof") && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldError("identityProof")}
                                </p>
                            )}
                            <p className="text-xs text-gray-500">
                                Please upload a valid identification proof document (CID,
                                Passport, etc.). Allowed: PDF, JPG, PNG (Max 5MB)
                            </p>
                        </div>
                    </div>

                    {/* Family Tree Upload - conditionally rendered */}
                    {!hideFamilyTree && (
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
                                            handleFileChange(
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
                                {fieldError("familyTree") && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {fieldError("familyTree")}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500">
                                    Allowed: PDF, JPG, PNG (Max 5MB)
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Bank Details - conditionally rendered */}
                    {!hideBank && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>Name of Bank *</Label>
                                <Select
                                    value={data.bankName}
                                    onValueChange={(v) => updateField("bankName", v)}
                                >
                                    <SelectTrigger
                                        className={getFieldStyle(!!fieldError("bankName"))}
                                    >
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
                                {fieldError("bankName") && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {fieldError("bankName")}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Saving Account No *</Label>
                                <RestrictedInput
                                    allowed="alphanumeric"
                                    className={getFieldStyle(!!fieldError("bankAccount"))}
                                    value={data.bankAccount}
                                    onChange={(e) => updateField("bankAccount", e.target.value)}
                                />
                                {fieldError("bankAccount") && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {fieldError("bankAccount")}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2.5">
                                <Label>Upload Passport-size Photograph *</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        id={`passport-${data.id || "owner"}`}
                                        className="hidden"
                                        accept=".jpg,.jpeg,.png"
                                        onChange={(e) =>
                                            handleFileChange(
                                                "passportPhoto",
                                                e.target.files?.[0] || null,
                                            )
                                        }
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className={`w-28 ${fieldError("passportPhoto") ? "border-red-500" : "bg-transparent"}`}
                                        onClick={() =>
                                            document
                                                .getElementById(`passport-${data.id || "owner"}`)
                                                ?.click()
                                        }
                                    >
                                        Choose File
                                    </Button>
                                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                        {data.passportPhotoName || "No file chosen"}
                                    </span>
                                </div>
                                {fieldError("passportPhoto") && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {fieldError("passportPhoto")}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500">
                                    Allowed: JPG, PNG (Max 5MB)
                                </p>
                            </div>
                        </div>
                    )}

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
                                    <SelectTrigger
                                        className={getFieldStyle(!!fieldError("permCountry"))}
                                    >
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
                                {fieldError("permCountry") && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {fieldError("permCountry")}
                                    </p>
                                )}
                            </div>

                            {isBhutan(data.permCountry) ? (
                                <>
                                    <div className="space-y-2">
                                        <Label>Dzongkhag *</Label>
                                        <Select
                                            value={data.permDzongkhag}
                                            onValueChange={(v) => updateField("permDzongkhag", v)}
                                        >
                                            <SelectTrigger
                                                className={getFieldStyle(!!fieldError("permDzongkhag"))}
                                            >
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
                                        {fieldError("permDzongkhag") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("permDzongkhag")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gewog *</Label>
                                        <Select
                                            value={
                                                permGewogOptions.some(
                                                    (o) =>
                                                        String(
                                                            o.gewog_pk_code ||
                                                            o.id ||
                                                            o.pk_gewog_id ||
                                                            o.curr_gewog_pk_code,
                                                        ) === String(data.permGewog),
                                                )
                                                    ? data.permGewog
                                                    : ""
                                            }
                                            onValueChange={(v) => updateField("permGewog", v)}
                                        >
                                            <SelectTrigger
                                                className={getFieldStyle(!!fieldError("permGewog"))}
                                            >
                                                <SelectValue placeholder={data.permGewog || "Select"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {permGewogOptions.map((opt: any, i) => (
                                                    <SelectItem
                                                        key={i}
                                                        value={String(
                                                            opt.id ||
                                                            opt.gewog_pk_code ||
                                                            opt.pk_gewog_id ||
                                                            opt.curr_gewog_pk_code,
                                                        )}
                                                    >
                                                        {opt.gewog || opt.gewog_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldError("permGewog") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("permGewog")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Village/Street *</Label>
                                        <RestrictedInput
                                            allowed="alphanumeric"
                                            className={getFieldStyle(!!fieldError("permVillage"))}
                                            value={data.permVillage}
                                            onChange={(e) =>
                                                updateField("permVillage", e.target.value)
                                            }
                                        />
                                        {fieldError("permVillage") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("permVillage")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Thram No. *</Label>
                                        <RestrictedInput
                                            allowed="alphanumeric"
                                            className={getFieldStyle(!!fieldError("permThram"))}
                                            value={data.permThram}
                                            onChange={(e) => updateField("permThram", e.target.value)}
                                        />
                                        {fieldError("permThram") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("permThram")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>House No. *</Label>
                                        <RestrictedInput
                                            allowed="alphanumeric"
                                            className={getFieldStyle(!!fieldError("permHouse"))}
                                            value={data.permHouse}
                                            onChange={(e) => updateField("permHouse", e.target.value)}
                                        />
                                        {fieldError("permHouse") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("permHouse")}
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label>State *</Label>
                                        <RestrictedInput
                                            allowed="alpha"
                                            className={getFieldStyle(!!fieldError("permDzongkhag"))}
                                            value={data.permDzongkhag}
                                            onChange={(e) =>
                                                updateField("permDzongkhag", e.target.value)
                                            }
                                        />
                                        {fieldError("permDzongkhag") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("permDzongkhag")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Province *</Label>
                                        <RestrictedInput
                                            allowed="alpha"
                                            className={getFieldStyle(!!fieldError("permGewog"))}
                                            value={data.permGewog}
                                            onChange={(e) => updateField("permGewog", e.target.value)}
                                        />
                                        {fieldError("permGewog") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("permGewog")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Street Name *</Label>
                                        <RestrictedInput
                                            allowed="alphanumeric"
                                            className={getFieldStyle(!!fieldError("permVillage"))}
                                            value={data.permVillage}
                                            onChange={(e) =>
                                                updateField("permVillage", e.target.value)
                                            }
                                        />
                                        {fieldError("permVillage") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("permVillage")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2.5 md:col-span-2">
                                        <Label>Upload Address Proof *</Label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                id={`perm-proof-${data.id || "owner"}`}
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        handleFileChange(
                                                            "permAddressProof",
                                                            e.target.files[0],
                                                        );
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className={`w-28 ${fieldError("permAddressProof") ? "border-red-500" : "bg-transparent"}`}
                                                onClick={() =>
                                                    document
                                                        .getElementById(`perm-proof-${data.id || "owner"}`)
                                                        ?.click()
                                                }
                                            >
                                                Choose File
                                            </Button>
                                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                {data.permAddressProofName || "No file chosen"}
                                            </span>
                                        </div>
                                        {fieldError("permAddressProof") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("permAddressProof")}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                            Please upload a valid address proof document for
                                            non-Bhutan residence. Allowed: PDF, JPG, PNG (Max 5MB)
                                        </p>
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
                                    <SelectTrigger
                                        className={getFieldStyle(!!fieldError("currCountry"))}
                                    >
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
                                {fieldError("currCountry") && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {fieldError("currCountry")}
                                    </p>
                                )}
                            </div>

                            {isBhutan(data.currCountry) ? (
                                <>
                                    <div className="space-y-2">
                                        <Label>Dzongkhag *</Label>
                                        <Select
                                            value={data.currDzongkhag}
                                            onValueChange={(v) => updateField("currDzongkhag", v)}
                                        >
                                            <SelectTrigger
                                                className={getFieldStyle(!!fieldError("currDzongkhag"))}
                                            >
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
                                        {fieldError("currDzongkhag") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("currDzongkhag")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gewog *</Label>
                                        <Select
                                            value={
                                                currGewogOptions.some(
                                                    (o) =>
                                                        String(
                                                            o.gewog_pk_code ||
                                                            o.id ||
                                                            o.pk_gewog_id ||
                                                            o.curr_gewog_pk_code,
                                                        ) === String(data.currGewog),
                                                )
                                                    ? data.currGewog
                                                    : ""
                                            }
                                            onValueChange={(v) => updateField("currGewog", v)}
                                        >
                                            <SelectTrigger
                                                className={getFieldStyle(!!fieldError("currGewog"))}
                                            >
                                                <SelectValue placeholder={data.currGewog || "Select"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currGewogOptions.map((opt: any, i) => (
                                                    <SelectItem
                                                        key={i}
                                                        value={String(
                                                            opt.id ||
                                                            opt.gewog_pk_code ||
                                                            opt.pk_gewog_id ||
                                                            opt.curr_gewog_pk_code,
                                                        )}
                                                    >
                                                        {opt.gewog || opt.gewog_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldError("currGewog") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("currGewog")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Village/Street *</Label>
                                        <RestrictedInput
                                            allowed="alphanumeric"
                                            className={getFieldStyle(!!fieldError("currVillage"))}
                                            value={data.currVillage}
                                            onChange={(e) =>
                                                updateField("currVillage", e.target.value)
                                            }
                                        />
                                        {fieldError("currVillage") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("currVillage")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>House/Building/Flat No *</Label>
                                        <RestrictedInput
                                            allowed="alphanumeric"
                                            className={getFieldStyle(!!fieldError("currFlat"))}
                                            value={data.currFlat}
                                            onChange={(e) => updateField("currFlat", e.target.value)}
                                        />
                                        {fieldError("currFlat") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("currFlat")}
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label>State *</Label>
                                        <RestrictedInput
                                            allowed="alpha"
                                            className={getFieldStyle(!!fieldError("currDzongkhag"))}
                                            value={data.currDzongkhag}
                                            onChange={(e) =>
                                                updateField("currDzongkhag", e.target.value)
                                            }
                                        />
                                        {fieldError("currDzongkhag") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("currDzongkhag")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Province *</Label>
                                        <RestrictedInput
                                            allowed="alpha"
                                            className={getFieldStyle(!!fieldError("currGewog"))}
                                            value={data.currGewog}
                                            onChange={(e) => updateField("currGewog", e.target.value)}
                                        />
                                        {fieldError("currGewog") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("currGewog")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Street Name *</Label>
                                        <RestrictedInput
                                            allowed="alphanumeric"
                                            className={getFieldStyle(!!fieldError("currVillage"))}
                                            value={data.currVillage}
                                            onChange={(e) =>
                                                updateField("currVillage", e.target.value)
                                            }
                                        />
                                        {fieldError("currVillage") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("currVillage")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2.5 md:col-span-2">
                                        <Label>Upload Address Proof *</Label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                id={`curr-proof-${data.id || "owner"}`}
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        handleFileChange(
                                                            "currAddressProof",
                                                            e.target.files[0],
                                                        );
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className={`w-28 ${fieldError("currAddressProof") ? "border-red-500" : "bg-transparent"}`}
                                                onClick={() =>
                                                    document
                                                        .getElementById(`curr-proof-${data.id || "owner"}`)
                                                        ?.click()
                                                }
                                            >
                                                Choose File
                                            </Button>
                                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                {data.currAddressProofName || "No file chosen"}
                                            </span>
                                        </div>
                                        {fieldError("currAddressProof") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("currAddressProof")}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                            Please upload a valid address proof document for
                                            non-Bhutan residence. Allowed: PDF, JPG, PNG (Max 5MB)
                                        </p>
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label>Email Address *</Label>
                                <Input
                                    type="email"
                                    className={getFieldStyle(!!fieldError("currEmail"))}
                                    value={data.currEmail}
                                    onChange={(e) => updateField("currEmail", e.target.value)}
                                />
                                {fieldError("currEmail") && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {fieldError("currEmail")}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Contact Number *</Label>
                                <RestrictedInput
                                    allowed="numeric"
                                    maxLength={8}
                                    className={getFieldStyle(!!fieldError("currContact"))}
                                    value={data.currContact}
                                    onChange={(e) => updateField("currContact", e.target.value)}
                                />
                                {fieldError("currContact") && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {fieldError("currContact")}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Alternate Contact No</Label>
                                <RestrictedInput
                                    allowed="numeric"
                                    maxLength={8}
                                    className={getFieldStyle(
                                        !!fieldError("currAlternateContact"),
                                    )}
                                    value={data.currAlternateContact}
                                    onChange={(e) =>
                                        updateField("currAlternateContact", e.target.value)
                                    }
                                />
                                {fieldError("currAlternateContact") && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {fieldError("currAlternateContact")}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 4. PEP Declaration - conditionally rendered */}
                    {!hidePepDeclaration && (
                        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">
                                PEP Declaration
                            </h2>

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
                                            if (onClearError) onClearError(getErrorKey("pepPerson"));
                                        }}
                                    >
                                        <SelectTrigger
                                            className={getFieldStyle(!!fieldError("pepPerson"))}
                                        >
                                            <SelectValue placeholder="[Select]" />
                                        </SelectTrigger>
                                        <SelectContent sideOffset={4}>
                                            <SelectItem value="yes">Yes</SelectItem>
                                            <SelectItem value="no">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {fieldError("pepPerson") && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {fieldError("pepPerson")}
                                        </p>
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
                                                    onUpdate({
                                                        ...data,
                                                        pepCategory: value,
                                                        pepSubCategory: "",
                                                    });
                                                    if (onClearError)
                                                        onClearError(getErrorKey("pepCategory"));
                                                }}
                                            >
                                                <SelectTrigger
                                                    className={getFieldStyle(!!fieldError("pepCategory"))}
                                                >
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
                                            {fieldError("pepCategory") && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {fieldError("pepCategory")}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-sm">
                                                PEP Sub Category
                                                <span className="text-destructive">*</span>
                                            </Label>
                                            <Select
                                                value={data.pepSubCategory}
                                                onValueChange={(value) => {
                                                    onUpdate({ ...data, pepSubCategory: value });
                                                    if (onClearError)
                                                        onClearError(getErrorKey("pepSubCategory"));
                                                }}
                                                disabled={!data.pepCategory}
                                            >
                                                <SelectTrigger
                                                    className={getFieldStyle(
                                                        !!fieldError("pepSubCategory"),
                                                    )}
                                                >
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
                                            {fieldError("pepSubCategory") && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {fieldError("pepSubCategory")}
                                                </p>
                                            )}
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
                                                if (onClearError)
                                                    onClearError(getErrorKey("pepRelated"));
                                            }}
                                        >
                                            <SelectTrigger
                                                className={getFieldStyle(!!fieldError("pepRelated"))}
                                            >
                                                <SelectValue placeholder="[Select]" />
                                            </SelectTrigger>
                                            <SelectContent sideOffset={4}>
                                                <SelectItem value="yes">Yes</SelectItem>
                                                <SelectItem value="no">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {fieldError("pepRelated") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("pepRelated")}
                                            </p>
                                        )}
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

                                            {/* Original fields (relationship, category, subcategory) */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                                <div className="space-y-2.5">
                                                    <Label className="text-gray-800 font-semibold text-sm">
                                                        Relationship{" "}
                                                        <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Select
                                                        value={pep.relationship || ""}
                                                        onValueChange={(value) => {
                                                            updateRelatedPep(index, "relationship", value);
                                                            if (onClearError)
                                                                onClearError(
                                                                    `${getErrorKey(`relatedPeps.${index}.relationship`)}`,
                                                                );
                                                        }}
                                                    >
                                                        <SelectTrigger
                                                            className={getFieldStyle(
                                                                !!errors[
                                                                `${basePath ? basePath + "." : ""}relatedPeps.${index}.relationship`
                                                                ],
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
                                                    {errors[
                                                        `${basePath ? basePath + "." : ""}relatedPeps.${index}.relationship`
                                                    ] && (
                                                            <p className="text-xs text-red-500 mt-1">
                                                                {
                                                                    errors[
                                                                    `${basePath ? basePath + "." : ""}relatedPeps.${index}.relationship`
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                </div>

                                                <div className="space-y-2.5">
                                                    <Label className="text-gray-800 font-semibold text-sm">
                                                        PEP Category{" "}
                                                        <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Select
                                                        value={pep.category || ""}
                                                        onValueChange={(value) => {
                                                            handleRelatedPepCategoryChange(index, value);
                                                            if (onClearError)
                                                                onClearError(
                                                                    `${getErrorKey(`relatedPeps.${index}.category`)}`,
                                                                );
                                                        }}
                                                    >
                                                        <SelectTrigger
                                                            className={getFieldStyle(
                                                                !!errors[
                                                                `${basePath ? basePath + "." : ""}relatedPeps.${index}.category`
                                                                ],
                                                            )}
                                                        >
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
                                                    {errors[
                                                        `${basePath ? basePath + "." : ""}relatedPeps.${index}.category`
                                                    ] && (
                                                            <p className="text-xs text-red-500 mt-1">
                                                                {
                                                                    errors[
                                                                    `${basePath ? basePath + "." : ""}relatedPeps.${index}.category`
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                </div>

                                                <div className="space-y-2.5">
                                                    <Label className="text-gray-800 font-semibold text-sm">
                                                        PEP Sub Category
                                                        <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Select
                                                        value={pep.subCategory || ""}
                                                        onValueChange={(v) => {
                                                            updateRelatedPep(index, "subCategory", v);
                                                            if (onClearError)
                                                                onClearError(
                                                                    `${getErrorKey(`relatedPeps.${index}.subCategory`)}`,
                                                                );
                                                        }}
                                                        disabled={!pep.category}
                                                    >
                                                        <SelectTrigger
                                                            className={getFieldStyle(
                                                                !!errors[
                                                                `${basePath ? basePath + "." : ""}relatedPeps.${index}.subCategory`
                                                                ],
                                                            )}
                                                        >
                                                            <SelectValue placeholder="[Select]" />
                                                        </SelectTrigger>
                                                        <SelectContent sideOffset={4}>
                                                            {relatedPepOptionsMap[index]?.length > 0 ? (
                                                                relatedPepOptionsMap[index].map(
                                                                    (option, idx) => {
                                                                        const key =
                                                                            option.pep_sub_category_pk_code ||
                                                                            option.id ||
                                                                            `pep-rel-sub-${idx}`;
                                                                        const val = String(
                                                                            option.pep_sub_category_pk_code ||
                                                                            option.id,
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
                                                    {errors[
                                                        `${basePath ? basePath + "." : ""}relatedPeps.${index}.subCategory`
                                                    ] && (
                                                            <p className="text-xs text-red-500 mt-1">
                                                                {
                                                                    errors[
                                                                    `${basePath ? basePath + "." : ""}relatedPeps.${index}.subCategory`
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                </div>
                                            </div>

                                            {/* Personal details for this related PEP, with spouse section hidden */}
                                            <ComprehensiveOwnerDetails
                                                data={pep}
                                                onUpdate={(newData) => {
                                                    const updatedPeps = [...(data.relatedPeps || [])];
                                                    updatedPeps[index] = newData;
                                                    updateField("relatedPeps", updatedPeps);
                                                }}
                                                countryOptions={countryOptions}
                                                dzongkhagOptions={dzongkhagOptions}
                                                identificationTypeOptions={identificationTypeOptions}
                                                maritalStatusOptions={maritalStatusOptions}
                                                taxIdentifierTypeOptions={taxIdentifierTypeOptions}   // <-- NEW
                                                title={`Related PEP ${index + 1} - Personal Information`}
                                                errors={errors}
                                                basePath={`${basePath}.relatedPeps.${index}`}
                                                onClearError={onClearError}
                                                onSetError={onSetError}
                                                onValidateField={onValidateField}
                                                // Hide irrelevant sections
                                                hidePepDeclaration
                                                hideEmployment
                                                hideBank
                                                hideFamilyTree
                                                hideSpouse // Hide spouse section for related PEPs
                                            />
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
                    )}
                    {/* Employment Status - conditionally rendered */}
                    {!hideEmployment && (
                        <>
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
                                        onValueChange={(v) => {
                                            onUpdate({ ...data, employmentStatus: v });
                                            if (onClearError)
                                                onClearError(getErrorKey("employmentStatus"));
                                        }}
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
                                    {fieldError("employmentStatus") && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {fieldError("employmentStatus")}
                                        </p>
                                    )}
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
                                            <RestrictedInput
                                                allowed="alphanumeric"
                                                placeholder="Enter ID"
                                                className={getFieldStyle(!!fieldError("employeeId"))}
                                                value={data.employeeId || ""}
                                                onChange={(e) =>
                                                    updateField("employeeId", e.target.value)
                                                }
                                            />
                                            {fieldError("employeeId") && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {fieldError("employeeId")}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-sm">
                                                Occupation <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.occupation}
                                                onValueChange={(v) => updateField("occupation", v)}
                                            >
                                                <SelectTrigger
                                                    className={getFieldStyle(!!fieldError("occupation"))}
                                                >
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
                                            {fieldError("occupation") && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {fieldError("occupation")}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-sm">
                                                Type of Employer <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.employerType}
                                                onValueChange={(v) => updateField("employerType", v)}
                                            >
                                                <SelectTrigger
                                                    className={getFieldStyle(
                                                        !!fieldError("employerType"),
                                                    )}
                                                >
                                                    <SelectValue placeholder="[Select]" />
                                                </SelectTrigger>
                                                <SelectContent sideOffset={4}>
                                                    <SelectItem value="government">Government</SelectItem>
                                                    <SelectItem value="private">Private</SelectItem>
                                                    <SelectItem value="corporate">Corporate</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {fieldError("employerType") && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {fieldError("employerType")}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-sm">
                                                Designation <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.designation}
                                                onValueChange={(v) => updateField("designation", v)}
                                            >
                                                <SelectTrigger
                                                    className={getFieldStyle(!!fieldError("designation"))}
                                                >
                                                    <SelectValue placeholder="[Select]" />
                                                </SelectTrigger>
                                                <SelectContent sideOffset={4}>
                                                    <SelectItem value="manager">Manager</SelectItem>
                                                    <SelectItem value="officer">Officer</SelectItem>
                                                    <SelectItem value="assistant">Assistant</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {fieldError("designation") && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {fieldError("designation")}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-sm">
                                                Grade <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.grade}
                                                onValueChange={(v) => updateField("grade", v)}
                                            >
                                                <SelectTrigger
                                                    className={getFieldStyle(!!fieldError("grade"))}
                                                >
                                                    <SelectValue placeholder="[Select]" />
                                                </SelectTrigger>
                                                <SelectContent sideOffset={4}>
                                                    {/* Added loop for numeric grades 1-20 to accommodate data like '6' */}
                                                    {Array.from({ length: 20 }, (_, i) => i + 1).map(
                                                        (num) => (
                                                            <SelectItem key={num} value={String(num)}>
                                                                {num}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                    <SelectItem value="p1">P1</SelectItem>
                                                    <SelectItem value="p2">P2</SelectItem>
                                                    <SelectItem value="p3">P3</SelectItem>
                                                    <SelectItem value="p4">P4</SelectItem>
                                                    <SelectItem value="p5">P5</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {fieldError("grade") && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {fieldError("grade")}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-sm">
                                                Organization Name{" "}
                                                <span className="text-red-500">*</span>
                                            </Label>
                                            {/* Changed to RestrictedInput as data is coming as a string name, not an ID */}
                                            <RestrictedInput
                                                allowed="alphanumeric"
                                                placeholder="Enter Organization Name"
                                                className={getFieldStyle(
                                                    !!fieldError("organizationName"),
                                                )}
                                                value={data.organizationName || ""}
                                                onChange={(e) =>
                                                    updateField("organizationName", e.target.value)
                                                }
                                            />
                                            {fieldError("organizationName") && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {fieldError("organizationName")}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-sm">
                                                Organization Location{" "}
                                                <span className="text-red-500">*</span>
                                            </Label>
                                            <RestrictedInput
                                                allowed="alphanumeric"
                                                placeholder="Enter Location"
                                                className={getFieldStyle(!!fieldError("orgLocation"))}
                                                value={data.orgLocation || ""}
                                                onChange={(e) =>
                                                    updateField("orgLocation", e.target.value)
                                                }
                                            />
                                            {fieldError("orgLocation") && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {fieldError("orgLocation")}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-sm">
                                                Service Joining Date{" "}
                                                <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                type="date"
                                                max={today}
                                                className={getFieldStyle(!!fieldError("joiningDate"))}
                                                value={formatDateForInput(data.joiningDate)}
                                                onChange={(e) =>
                                                    updateField("joiningDate", e.target.value)
                                                }
                                            />
                                            {fieldError("joiningDate") && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {fieldError("joiningDate")}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2.5">
                                            <Label className="text-gray-800 font-semibold text-sm">
                                                Nature of Service{" "}
                                                <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.serviceNature}
                                                onValueChange={(v) => updateField("serviceNature", v)}
                                            >
                                                <SelectTrigger
                                                    className={getFieldStyle(
                                                        !!fieldError("serviceNature"),
                                                    )}
                                                >
                                                    <SelectValue placeholder="[Select]" />
                                                </SelectTrigger>
                                                <SelectContent sideOffset={4}>
                                                    <SelectItem value="permanent">Permanent</SelectItem>
                                                    <SelectItem value="contract">Contract</SelectItem>
                                                    <SelectItem value="temporary">Temporary</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {fieldError("serviceNature") && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {fieldError("serviceNature")}
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
                                                className={getFieldStyle(!!fieldError("annualSalary"))}
                                                value={data.annualSalary || ""}
                                                onChange={(e) =>
                                                    updateField("annualSalary", e.target.value)
                                                }
                                            />
                                            {fieldError("annualSalary") && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {fieldError("annualSalary")}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {data.serviceNature === "contract" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2.5">
                                                <Label className="text-gray-800 font-semibold text-sm">
                                                    Contract End Date{" "}
                                                    <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    type="date"
                                                    min={today}
                                                    className={getFieldStyle(
                                                        !!fieldError("contractEndDate"),
                                                    )}
                                                    value={formatDateForInput(data.contractEndDate)}
                                                    onChange={(e) =>
                                                        updateField("contractEndDate", e.target.value)
                                                    }
                                                />
                                                {fieldError("contractEndDate") && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {fieldError("contractEndDate")}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    {/* Spouse Section (if married) - only if not hidden */}
                    {!hideSpouse && isMarried() && (
                        <div className="border border-gray-200 rounded-lg p-6 bg-white">
                            <h5 className="font-semibold text-[#003DA5] mb-4">
                                Spouse Personal Information
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <Label>Spouse Identification Type *</Label>
                                    <Select
                                        value={data.spouseIdentificationType}
                                        onValueChange={(v) =>
                                            handleSpouseChange("spouseIdentificationType", v)
                                        }
                                    >
                                        <SelectTrigger
                                            className={getFieldStyle(
                                                !!fieldError("spouseIdentificationType"),
                                            )}
                                        >
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {identificationTypeOptions
                                                .filter((opt: any) => {
                                                    const label = (
                                                        opt.identification_type ||
                                                        opt.identity_type ||
                                                        ""
                                                    ).toLowerCase();
                                                    return !(
                                                        label.includes("trade license number") ||
                                                        label.includes("company registration number")
                                                    );
                                                })
                                                .map((opt: any, i) => (
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
                                    {fieldError("spouseIdentificationType") && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {fieldError("spouseIdentificationType")}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Spouse ID No. *</Label>
                                    <RestrictedInput
                                        allowed="numeric"
                                        maxLength={11}
                                        className={getFieldStyle(
                                            !!fieldError("spouseIdentificationNo"),
                                        )}
                                        value={data.spouseIdentificationNo}
                                        onChange={(e) =>
                                            handleSpouseChange(
                                                "spouseIdentificationNo",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {fieldError("spouseIdentificationNo") && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {fieldError("spouseIdentificationNo")}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Spouse Salutation *</Label>
                                    <Select
                                        value={
                                            data.spouseSalutation
                                                ? data.spouseSalutation.toLowerCase()
                                                : ""
                                        }
                                        onValueChange={(v) =>
                                            handleSpouseChange("spouseSalutation", v)
                                        }
                                    >
                                        <SelectTrigger
                                            className={getFieldStyle(
                                                !!fieldError("spouseSalutation"),
                                            )}
                                        >
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="mr">Mr.</SelectItem>
                                            <SelectItem value="mrs">Mrs.</SelectItem>
                                            <SelectItem value="ms">Ms.</SelectItem>
                                            <SelectItem value="dasho">Dasho</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {fieldError("spouseSalutation") && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {fieldError("spouseSalutation")}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Spouse Name *</Label>
                                    <RestrictedInput
                                        allowed="alpha"
                                        className={getFieldStyle(!!fieldError("spouseName"))}
                                        value={data.spouseName}
                                        onChange={(e) =>
                                            handleSpouseChange("spouseName", e.target.value)
                                        }
                                    />
                                    {fieldError("spouseName") && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {fieldError("spouseName")}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Spouse Nationality *</Label>
                                    <Select
                                        value={data.spouseNationality}
                                        onValueChange={(v) =>
                                            handleSpouseChange("spouseNationality", v)
                                        }
                                    >
                                        <SelectTrigger
                                            className={getFieldStyle(
                                                !!fieldError("spouseNationality"),
                                            )}
                                        >
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
                                    {fieldError("spouseNationality") && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {fieldError("spouseNationality")}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Spouse Gender *</Label>
                                    <Select
                                        value={
                                            data.spouseGender ? data.spouseGender.toLowerCase() : ""
                                        }
                                        onValueChange={(v) => handleSpouseChange("spouseGender", v)}
                                    >
                                        <SelectTrigger
                                            className={getFieldStyle(!!fieldError("spouseGender"))}
                                        >
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {fieldError("spouseGender") && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {fieldError("spouseGender")}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Spouse ID Issue Date *</Label>
                                    <Input
                                        type="date"
                                        className={getFieldStyle(
                                            !!fieldError("spouseIdentificationIssueDate"),
                                        )}
                                        value={formatDateForInput(
                                            data.spouseIdentificationIssueDate,
                                        )}
                                        onChange={(e) =>
                                            handleSpouseChange(
                                                "spouseIdentificationIssueDate",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {fieldError("spouseIdentificationIssueDate") && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {fieldError("spouseIdentificationIssueDate")}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Spouse ID Expiry Date *</Label>
                                    <Input
                                        type="date"
                                        className={getFieldStyle(
                                            !!fieldError("spouseIdentificationExpiryDate"),
                                        )}
                                        value={formatDateForInput(
                                            data.spouseIdentificationExpiryDate,
                                        )}
                                        onChange={(e) =>
                                            handleSpouseChange(
                                                "spouseIdentificationExpiryDate",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {fieldError("spouseIdentificationExpiryDate") && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {fieldError("spouseIdentificationExpiryDate")}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Spouse Tax Identifier Type</Label>
                                    <Select
                                        value={data.spouseTaxIdentifierType}
                                        onValueChange={(v) =>
                                            handleSpouseChange("spouseTaxIdentifierType", v)
                                        }
                                    >
                                        <SelectTrigger
                                            className={getFieldStyle(
                                                !!fieldError("spouseTaxIdentifierType"),
                                            )}
                                        >
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {taxIdentifierTypeOptions?.length ? (
                                                // In spouse section, show ONLY Personal Income Tax (PIT)
                                                taxIdentifierTypeOptions
                                                    .filter((opt: any) => {
                                                        const label = (opt.tax_identifier_type || opt.name || "").toLowerCase();
                                                        return label.includes("personal income tax") || label === "pit";
                                                    })
                                                    .map((opt: any, i) => (
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
                                    {fieldError("spouseTaxIdentifierType") && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {fieldError("spouseTaxIdentifierType")}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Spouse TPN No</Label>
                                    <RestrictedInput
                                        allowed="numeric"
                                        maxLength={11}
                                        className={getFieldStyle(!!fieldError("spouseTpn"))}
                                        value={data.spouseTpn}
                                        onChange={(e) =>
                                            handleSpouseChange("spouseTpn", e.target.value)
                                        }
                                    />
                                    {fieldError("spouseTpn") && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {fieldError("spouseTpn")}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Spouse Date of Birth *</Label>
                                    <Input
                                        type="date"
                                        className={getFieldStyle(!!fieldError("spouseDateOfBirth"))}
                                        value={formatDateForInput(data.spouseDateOfBirth)}
                                        onChange={(e) =>
                                            handleSpouseChange("spouseDateOfBirth", e.target.value)
                                        }
                                    />
                                    {fieldError("spouseDateOfBirth") && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {fieldError("spouseDateOfBirth")}
                                        </p>
                                    )}
                                </div>
                                {/* Spouse Household Number - conditional */}
                                {isNatBhutanese(data.spouseNationality) && (
                                    <div className="space-y-2">
                                        <Label>Spouse Household Number *</Label>
                                        <RestrictedInput
                                            allowed="alphanumeric"
                                            className={getFieldStyle(
                                                !!fieldError("spouseHouseholdNumber"),
                                            )}
                                            value={data.spouseHouseholdNumber}
                                            onChange={(e) =>
                                                handleSpouseChange(
                                                    "spouseHouseholdNumber",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {fieldError("spouseHouseholdNumber") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("spouseHouseholdNumber")}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2.5">
                                        <Label>Upload Spouse Identity Proof *</Label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                id={`spouse-identity-proof-${data.id || "owner"}`}
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) =>
                                                    handleSpouseFileChange(
                                                        "spouseIdentityProof",
                                                        e.target.files?.[0] || null,
                                                    )
                                                }
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className={`w-28 ${fieldError("spouseIdentityProof") ? "border-red-500" : "bg-transparent"}`}
                                                onClick={() =>
                                                    document
                                                        .getElementById(
                                                            `spouse-identity-proof-${data.id || "owner"}`,
                                                        )
                                                        ?.click()
                                                }
                                            >
                                                Choose File
                                            </Button>
                                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                {data.spouseIdentityProofName || "No file chosen"}
                                            </span>
                                        </div>
                                        {fieldError("spouseIdentityProof") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("spouseIdentityProof")}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                            Please upload a valid identification proof document (CID,
                                            Passport, etc.). Allowed: PDF, JPG, PNG (Max 5MB)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Spouse Permanent Address */}
                            <div className="mt-6 pt-4 border-t">
                                <h6 className="font-semibold text-[#003DA5] mb-4">
                                    Spouse Permanent Address
                                </h6>
                                <div className="grid md:grid-cols-4 gap-6">
                                    <div className="space-y-2">
                                        <Label>Spouse Country *</Label>
                                        <Select
                                            value={data.spousePermCountry}
                                            onValueChange={(v) =>
                                                handleSpouseChange("spousePermCountry", v)
                                            }
                                        >
                                            <SelectTrigger
                                                className={getFieldStyle(
                                                    !!fieldError("spousePermCountry"),
                                                )}
                                            >
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
                                        {fieldError("spousePermCountry") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("spousePermCountry")}
                                            </p>
                                        )}
                                    </div>

                                    {isBhutan(data.spousePermCountry) ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label>Spouse Dzongkhag *</Label>
                                                <Select
                                                    value={data.spousePermDzongkhag}
                                                    onValueChange={(v) =>
                                                        handleSpouseChange("spousePermDzongkhag", v)
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={getFieldStyle(
                                                            !!fieldError("spousePermDzongkhag"),
                                                        )}
                                                    >
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
                                                {fieldError("spousePermDzongkhag") && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {fieldError("spousePermDzongkhag")}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Spouse Gewog *</Label>
                                                <Select
                                                    value={
                                                        spousePermGewogOptions.some(
                                                            (o) =>
                                                                String(
                                                                    o.gewog_pk_code ||
                                                                    o.id ||
                                                                    o.pk_gewog_id ||
                                                                    o.curr_gewog_pk_code,
                                                                ) === String(data.spousePermGewog),
                                                        )
                                                            ? data.spousePermGewog
                                                            : ""
                                                    }
                                                    onValueChange={(v) =>
                                                        handleSpouseChange("spousePermGewog", v)
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={getFieldStyle(
                                                            !!fieldError("spousePermGewog"),
                                                        )}
                                                    >
                                                        <SelectValue
                                                            placeholder={data.spousePermGewog || "Select"}
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {spousePermGewogOptions.map((opt: any, i) => (
                                                            <SelectItem
                                                                key={i}
                                                                value={String(
                                                                    opt.id ||
                                                                    opt.gewog_pk_code ||
                                                                    opt.pk_gewog_id ||
                                                                    opt.curr_gewog_pk_code,
                                                                )}
                                                            >
                                                                {opt.gewog || opt.gewog_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {fieldError("spousePermGewog") && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {fieldError("spousePermGewog")}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Spouse Village/Street *</Label>
                                                <RestrictedInput
                                                    allowed="alphanumeric"
                                                    className={getFieldStyle(
                                                        !!fieldError("spousePermVillage"),
                                                    )}
                                                    value={data.spousePermVillage}
                                                    onChange={(e) =>
                                                        handleSpouseChange(
                                                            "spousePermVillage",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                {fieldError("spousePermVillage") && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {fieldError("spousePermVillage")}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Spouse Thram No. *</Label>
                                                <RestrictedInput
                                                    allowed="alphanumeric"
                                                    className={getFieldStyle(
                                                        !!fieldError("spousePermThram"),
                                                    )}
                                                    value={data.spousePermThram}
                                                    onChange={(e) =>
                                                        handleSpouseChange(
                                                            "spousePermThram",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                {fieldError("spousePermThram") && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {fieldError("spousePermThram")}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Spouse House No. *</Label>
                                                <RestrictedInput
                                                    allowed="alphanumeric"
                                                    className={getFieldStyle(
                                                        !!fieldError("spousePermHouse"),
                                                    )}
                                                    value={data.spousePermHouse}
                                                    onChange={(e) =>
                                                        handleSpouseChange(
                                                            "spousePermHouse",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                {fieldError("spousePermHouse") && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {fieldError("spousePermHouse")}
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <Label>Spouse State *</Label>
                                                <RestrictedInput
                                                    allowed="alpha"
                                                    className={getFieldStyle(
                                                        !!fieldError("spousePermDzongkhag"),
                                                    )}
                                                    value={data.spousePermDzongkhag}
                                                    onChange={(e) =>
                                                        handleSpouseChange(
                                                            "spousePermDzongkhag",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                {fieldError("spousePermDzongkhag") && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {fieldError("spousePermDzongkhag")}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Spouse Province *</Label>
                                                <RestrictedInput
                                                    allowed="alpha"
                                                    className={getFieldStyle(
                                                        !!fieldError("spousePermGewog"),
                                                    )}
                                                    value={data.spousePermGewog}
                                                    onChange={(e) =>
                                                        handleSpouseChange(
                                                            "spousePermGewog",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                {fieldError("spousePermGewog") && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {fieldError("spousePermGewog")}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Spouse Street Name *</Label>
                                                <RestrictedInput
                                                    allowed="alphanumeric"
                                                    className={getFieldStyle(
                                                        !!fieldError("spousePermVillage"),
                                                    )}
                                                    value={data.spousePermVillage}
                                                    onChange={(e) =>
                                                        handleSpouseChange(
                                                            "spousePermVillage",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                {fieldError("spousePermVillage") && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {fieldError("spousePermVillage")}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2.5 md:col-span-2">
                                                <Label>Spouse Address Proof *</Label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="file"
                                                        id={`spouse-perm-proof-${data.id || "owner"}`}
                                                        className="hidden"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) {
                                                                handleSpouseChange(
                                                                    "spousePermAddressProof",
                                                                    e.target.files[0],
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className={`w-28 ${fieldError("spousePermAddressProof") ? "border-red-500" : "bg-transparent"}`}
                                                        onClick={() =>
                                                            document
                                                                .getElementById(
                                                                    `spouse-perm-proof-${data.id || "owner"}`,
                                                                )
                                                                ?.click()
                                                        }
                                                    >
                                                        Choose File
                                                    </Button>
                                                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                        {data.spousePermAddressProofName ||
                                                            "No file chosen"}
                                                    </span>
                                                </div>
                                                {fieldError("spousePermAddressProof") && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {fieldError("spousePermAddressProof")}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    Please upload a valid address proof document for
                                                    non-Bhutan residence. Allowed: PDF, JPG, PNG (Max 5MB)
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Spouse Contact Address (Email, Contact, Alternate) */}
                            <div className="mt-6 pt-4 border-t">
                                <h6 className="font-semibold text-[#003DA5] mb-4">
                                    Spouse Contact Information
                                </h6>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label>Spouse Email *</Label>
                                        <Input
                                            type="email"
                                            className={getFieldStyle(!!fieldError("spouseEmail"))}
                                            value={data.spouseEmail}
                                            onChange={(e) =>
                                                handleSpouseChange("spouseEmail", e.target.value)
                                            }
                                        />
                                        {fieldError("spouseEmail") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("spouseEmail")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Spouse Contact No. *</Label>
                                        <RestrictedInput
                                            allowed="numeric"
                                            maxLength={8}
                                            className={getFieldStyle(!!fieldError("spouseContact"))}
                                            value={data.spouseContact}
                                            onChange={(e) =>
                                                handleSpouseChange("spouseContact", e.target.value)
                                            }
                                        />
                                        {fieldError("spouseContact") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("spouseContact")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Spouse Alternate Contact No.</Label>
                                        <RestrictedInput
                                            allowed="numeric"
                                            maxLength={8}
                                            className={getFieldStyle(
                                                !!fieldError("spouseAlternateContact"),
                                            )}
                                            value={data.spouseAlternateContact}
                                            onChange={(e) =>
                                                handleSpouseChange(
                                                    "spouseAlternateContact",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {fieldError("spouseAlternateContact") && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {fieldError("spouseAlternateContact")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Helper to sanitize data for sessionStorage (removes any leftover File objects) ---
function sanitizeForStorage(obj: any): any {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof File) return undefined; // Remove File objects completely (should not happen now)
    if (Array.isArray(obj)) {
        return obj
            .map((item) => sanitizeForStorage(item))
            .filter((item) => item !== undefined);
    }
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
        const sanitized = sanitizeForStorage(value);
        if (sanitized !== undefined) {
            result[key] = sanitized;
        }
    }
    return result;
}

// --- Main Form Component ---
export function BusinessDetailsForm({ onNext, onBack, formData }: any) {
    // --- State Initialization ---
    // Helper to check for new structure (inside businessDetail) or fallback to old structure
    const getInitialVal = (key: string, defaultVal: any = "") => {
        return formData?.businessDetail?.[key] ?? formData?.[key] ?? defaultVal;
    };

    const getInitialAddressVal = (key: string, defaultVal: any = "") => {
        return (
            formData?.businessDetail?.businessAddress?.[key] ??
            formData?.businessAddress?.[key] ??
            defaultVal
        );
    };

    const [businessData, setBusinessData] = useState({
        businessName: getInitialVal("businessName"),
        establishmentDate: getInitialVal("establishmentDate"),
        industryClassification: getInitialVal("industryClassification"),
        identificationType: getInitialVal("identificationType"),
        identificationNumber: getInitialVal("identificationNumber"),
        identificationIssueDate: getInitialVal("identificationIssueDate"),
        identificationExpiryDate: getInitialVal("identificationExpiryDate"),
        identificationProofFile: getInitialVal("identificationProofFile"), // store file ID
        identificationProofFileName: getInitialVal("identificationProofFileName"),
        taxIdentifierType: getInitialVal("taxIdentifierType"),
        taxIdentifierNumber: getInitialVal("taxIdentifierNumber"),
        bankCurrentAccountNumber: getInitialVal("bankCurrentAccountNumber"),
        bankSavingAccountNumber: getInitialVal("bankSavingAccountNumber"),
        nameOfBank: getInitialVal("nameOfBank"),
        grossAnnualIncome: getInitialVal("grossAnnualIncome"),
        businessType: getInitialVal("businessType"),
    });

    const [businessAddress, setBusinessAddress] = useState({
        country: getInitialAddressVal("country"),
        dzongkhag: getInitialAddressVal("dzongkhag"),
        gewog: getInitialAddressVal("gewog"),
        villageStreet: getInitialAddressVal("villageStreet"),
        specificLocation: getInitialAddressVal("specificLocation"),
        contactNumber: getInitialAddressVal("contactNumber"),
        alternateContactNumber: getInitialAddressVal("alternateContactNumber"),
        email: getInitialAddressVal("email"),
    });

    const [attachments, setAttachments] = useState({
        familyTree: formData?.attachments?.familyTree || "", // file ID
        familyTreeName: formData?.attachments?.familyTreeName || "",
        supportingDoc: formData?.attachments?.supportingDoc || "", // file ID
        supportingDocName: formData?.attachments?.supportingDocName || "",
        declarationConsent: formData?.attachments?.declarationConsent || false,
    });

    // --- Business Lookup State ---
    const [showBusinessLookupPopup, setShowBusinessLookupPopup] = useState(false);
    const [businessLookupStatus, setBusinessLookupStatus] = useState<
        "searching" | "found" | "not_found"
    >("searching");
    const [fetchedBusinessCustomerData, setFetchedBusinessCustomerData] =
        useState<any>(null);

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
        taxIdentifierType: "",
        householdNumber: "",
        maritalStatus: "",
        // Spouse fields - expanded
        spouseIdentificationType: "",
        spouseIdentificationNo: "",
        spouseSalutation: "",
        spouseName: "",
        spouseNationality: "",
        spouseGender: "",
        spouseIdentificationIssueDate: "",
        spouseIdentificationExpiryDate: "",
        spouseTpn: "",
        spouseTaxIdentifierType: "",
        spouseHouseholdNumber: "",
        spouseDateOfBirth: "",
        spousePermCountry: "",
        spousePermDzongkhag: "",
        spousePermGewog: "",
        spousePermVillage: "",
        spousePermThram: "",
        spousePermHouse: "",
        spousePermAddressProof: "",
        spousePermAddressProofName: "",
        spouseEmail: "",
        spouseContact: "",
        spouseAlternateContact: "",
        spouseIdentityProof: "",
        spouseIdentityProofName: "",
        // End spouse fields
        bankName: "",
        bankAccount: "",
        passportPhoto: "", // file ID
        passportPhotoName: "",
        familyTree: "", // file ID
        familyTreeName: "",
        permCountry: "",
        permDzongkhag: "",
        permGewog: "",
        permVillage: "",
        permThram: "",
        permHouse: "",
        permAddressProof: "", // file ID
        permAddressProofName: "",
        currCountry: "",
        currDzongkhag: "",
        currGewog: "",
        currVillage: "",
        currFlat: "",
        currEmail: "",
        currContact: "",
        currAlternateContact: "",
        currAddressProof: "", // file ID
        currAddressProofName: "",
        pepPerson: "",
        pepCategory: "",
        pepSubCategory: "",
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
        // NEW: identity proof for the owner
        identityProof: "", // file ID
        identityProofName: "",
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
    const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([]);
    const [nationalityOptions, setNationalityOptions] = useState<any[]>([]);
    const [occupationOptions, setOccupationOptions] = useState<any[]>([]);
    const [pepCategoryOptions, setPepCategoryOptions] = useState<any[]>([]);
    const [industryOptions, setIndustryOptions] = useState<any[]>([]);
    // NEW: tax identifier type options
    const [taxIdentifierTypeOptions, setTaxIdentifierTypeOptions] = useState<any[]>([]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const clearError = (fieldPath: string) => {
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldPath];
            return newErrors;
        });
    };

    const setError = (fieldPath: string, errorMsg: string) => {
        setErrors((prev) => ({ ...prev, [fieldPath]: errorMsg }));
    };

    // Enhanced real-time field validation
    const validateField = (
        fieldPath: string,
        value: any,
        fullData?: any,
    ): string => {
        if (!value || value.toString().trim() === "") return "";

        const parts = fieldPath.split(".");
        const fieldName = parts[parts.length - 1];

        switch (fieldName) {
            case "identificationNo":
            case "spouseIdentificationNo":
                if (!isValidCID(value)) return "CID must be 11 digits";
                break;

            case "currContact":
            case "spouseContact":
            case "currAlternateContact":
            case "spouseAlternateContact":
            case "contactNumber":
            case "alternateContactNumber":
                if (!isValidPhoneNumber(value))
                    return "Enter a valid Bhutanese phone number (mobile: 8 digits starting with 16/17/77; landline: 7-8 digits starting with 2-8)";
                break;
            case "currEmail":
            case "spouseEmail":
            case "email":
                if (!isValidEmail(value)) return "Invalid email format";
                break;
            case "shareholdingPercent":
                if (!isValidShareholding(value))
                    return "Shareholding must be between 0 and 100";
                break;
            case "dateOfBirth":
            case "spouseDateOfBirth":
                if (!isLegalAge(value))
                    return "Applicant must be at least 18 years old";
                break;
        }
        return "";
    };

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
                    pepCat,
                    industry,
                    taxIdentifierType,   // <-- NEW
                ] = await Promise.all([
                    fetchCountry().catch(() => []),
                    fetchDzongkhag().catch(() => []),
                    fetchIdentificationType().catch(() => []),
                    fetchBanks().catch(() => []),
                    fetchMaritalStatus().catch(() => []),
                    fetchNationality().catch(() => []),
                    fetchOccupations().catch(() => []),
                    fetchPepCategory().catch(() => []),
                    fetchIndustryClassification().catch(() => []),
                    fetchTaxIdentifierType().catch(() => []),   // <-- NEW
                ]);
                setCountryOptions(country?.data?.data || country || []);
                setDzongkhagOptions(dzongkhag?.data?.data || dzongkhag || []);
                setIdentificationTypeOptions(
                    identificationType?.data?.data || identificationType || [],
                );
                setBanksOptions(banks?.data?.data || banks || []);
                setMaritalStatusOptions(marital?.data?.data || marital || []);
                setNationalityOptions(national?.data?.data || national || []);
                setOccupationOptions(occ?.data?.data || occ || []);
                setPepCategoryOptions(pepCat?.data?.data || pepCat || []);
                setIndustryOptions(industry?.data?.data || industry || []);
                setTaxIdentifierTypeOptions(taxIdentifierType?.data?.data || taxIdentifierType || []);   // <-- NEW
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

    // Translate Business Address Gewog label to ID dynamically
    useEffect(() => {
        if (gewogOptions.length > 0 && businessAddress.gewog) {
            const isId = gewogOptions.some(
                (opt) =>
                    String(
                        opt.gewog_pk_code ||
                        opt.id ||
                        opt.pk_gewog_id ||
                        opt.curr_gewog_pk_code,
                    ) === String(businessAddress.gewog),
            );

            if (!isId) {
                const matchedId = findPkCodeByLabel(
                    businessAddress.gewog,
                    gewogOptions,
                    ["gewog_name", "gewog", "name", "label"],
                );
                if (matchedId && matchedId !== businessAddress.gewog) {
                    handleBusinessAddressChange("gewog", matchedId);
                }
            }
        }
    }, [gewogOptions, businessAddress.gewog]);

    // Translate Industry Classification label to ID dynamically
    useEffect(() => {
        if (industryOptions.length > 0 && businessData.industryClassification) {
            const isId = industryOptions.some(
                (opt) =>
                    String(
                        opt.id ||
                        opt.industry_classification_pk_code ||
                        opt.industry_pk_code ||
                        opt.inds_class_pk_code ||
                        opt.code ||
                        opt.value
                    ) === String(businessData.industryClassification)
            );

            if (!isId) {
                const matchedId = findPkCodeByLabel(
                    businessData.industryClassification,
                    industryOptions, [
                    "industry_classification",
                    "industry_type",
                    "industry_name",
                    "name",
                    "label",
                    "industry",
                    "inds_class_name"
                ]
                );
                if (matchedId && matchedId !== businessData.industryClassification) {
                    handleBusinessDataChange("industryClassification", matchedId);
                }
            }
        }
    }, [industryOptions, businessData.industryClassification]);

    // Translate Business Tax Identifier Type label to ID dynamically   <-- NEW
    useEffect(() => {
        if (taxIdentifierTypeOptions.length > 0 && businessData.taxIdentifierType) {
            const isId = taxIdentifierTypeOptions.some(
                (opt) =>
                    String(opt.tax_identifier_type_pk_code || opt.id) ===
                    String(businessData.taxIdentifierType)
            );

            if (!isId) {
                const matchedId = findPkCodeByLabel(
                    businessData.taxIdentifierType,
                    taxIdentifierTypeOptions,
                    ["tax_identifier_type", "name", "label"]
                );
                if (matchedId && matchedId !== businessData.taxIdentifierType) {
                    handleBusinessDataChange("taxIdentifierType", matchedId);
                }
            }
        }
    }, [taxIdentifierTypeOptions, businessData.taxIdentifierType]);

    const handleBusinessDataChange = (field: string, value: any) => {
        setBusinessData((prev) => ({ ...prev, [field]: value }));
        const fieldPath = `business.${field}`;
        const errorMsg = validateField(fieldPath, value);
        if (errorMsg) {
            setError(fieldPath, errorMsg);
        } else {
            clearError(fieldPath);
        }
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
        const fieldPath = `business.${field}`;
        const errorMsg = validateField(fieldPath, value);
        if (errorMsg) {
            setError(fieldPath, errorMsg);
        } else {
            clearError(fieldPath);
        }
    };

    // --- Identity Lookup Handler for Business Details ---
    const handleBusinessIdentityCheck = async () => {
        const idType = businessData.identificationType;
        const idNo = businessData.identificationNumber;

        if (!idType || !idNo || idNo.trim() === "") return;

        setShowBusinessLookupPopup(true);
        setBusinessLookupStatus("searching");

        try {
            const payload = {
                type: "C", // C for Corporate/Business
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
                setFetchedBusinessCustomerData(mappedData);
                setBusinessLookupStatus("found");
            } else {
                setBusinessLookupStatus("not_found");
                setFetchedBusinessCustomerData(null);
            }
        } catch (error) {
            console.error("Business lookup failed", error);
            setBusinessLookupStatus("not_found");
            setFetchedBusinessCustomerData(null);
        }
    };

    const handleBusinessLookupProceed = () => {
        if (businessLookupStatus === "found" && fetchedBusinessCustomerData) {
            // Map Country IDs
            const mappedCountry = findPkCodeByLabel(
                fetchedBusinessCustomerData.permCountry ||
                fetchedBusinessCustomerData.country,
                countryOptions, ["country_name", "country", "name", "label"],
            );

            // Map Dzongkhag IDs
            const mappedDzongkhag = findPkCodeByLabel(
                fetchedBusinessCustomerData.permDzongkhag ||
                fetchedBusinessCustomerData.dzongkhag,
                dzongkhagOptions, ["dzongkhag_name", "dzongkhag", "name", "label"],
            );

            // Map Bank
            const mappedBank = findPkCodeByLabel(
                fetchedBusinessCustomerData.bankName ||
                fetchedBusinessCustomerData.nameOfBank,
                banksOptions, ["bank_name", "name", "label", "bank"],
            );

            // Map Industry
            const mappedIndustry = findPkCodeByLabel(
                fetchedBusinessCustomerData.industryClassification ||
                fetchedBusinessCustomerData.industry,
                industryOptions, [
                "industry_classification",
                "industry_type",
                "industry_name",
                "name",
                "label",
                "industry",
                "inds_class_name"
            ]
            );

            // Map Tax Identifier Type   <-- NEW
            const mappedTaxIdentifierType = findPkCodeByLabel(
                fetchedBusinessCustomerData.taxIdentifierType,
                taxIdentifierTypeOptions,
                ["tax_identifier_type", "name", "label"]
            );

            setBusinessData((prev: any) => ({
                ...prev,
                businessName:
                    fetchedBusinessCustomerData.applicantName ||
                    fetchedBusinessCustomerData.businessName ||
                    prev.businessName,
                establishmentDate:
                    formatDateForInput(
                        fetchedBusinessCustomerData.dateOfBirth ||
                        fetchedBusinessCustomerData.establishmentDate,
                    ) || prev.establishmentDate,
                identificationIssueDate:
                    formatDateForInput(
                        fetchedBusinessCustomerData.identificationIssueDate,
                    ) || prev.identificationIssueDate,
                identificationExpiryDate:
                    formatDateForInput(
                        fetchedBusinessCustomerData.identificationExpiryDate,
                    ) || prev.identificationExpiryDate,
                industryClassification:
                    mappedIndustry ||
                    fetchedBusinessCustomerData.industryClassification ||
                    prev.industryClassification,
                taxIdentifierType:
                    mappedTaxIdentifierType ||
                    fetchedBusinessCustomerData.taxIdentifierType ||
                    prev.taxIdentifierType,
                taxIdentifierNumber:
                    fetchedBusinessCustomerData.tpn ||
                    fetchedBusinessCustomerData.taxIdentifierNumber ||
                    prev.taxIdentifierNumber,
                bankCurrentAccountNumber:
                    fetchedBusinessCustomerData.bankAccount ||
                    fetchedBusinessCustomerData.bankCurrentAccountNumber ||
                    prev.bankCurrentAccountNumber,
                nameOfBank:
                    mappedBank || fetchedBusinessCustomerData.bankName || prev.nameOfBank,
            }));

            setBusinessAddress((prev: any) => ({
                ...prev,
                country:
                    mappedCountry ||
                    fetchedBusinessCustomerData.permCountry ||
                    prev.country,
                dzongkhag:
                    mappedDzongkhag ||
                    fetchedBusinessCustomerData.permDzongkhag ||
                    prev.dzongkhag,
                gewog:
                    fetchedBusinessCustomerData.permGewog ||
                        fetchedBusinessCustomerData.gewog
                        ? String(
                            fetchedBusinessCustomerData.permGewog ||
                            fetchedBusinessCustomerData.gewog,
                        )
                        : prev.gewog,
                villageStreet:
                    fetchedBusinessCustomerData.permVillage ||
                    fetchedBusinessCustomerData.villageStreet ||
                    prev.villageStreet,
                specificLocation:
                    fetchedBusinessCustomerData.permHouse ||
                    fetchedBusinessCustomerData.permThram ||
                    fetchedBusinessCustomerData.specificLocation ||
                    prev.specificLocation,
                contactNumber:
                    fetchedBusinessCustomerData.currContact ||
                    fetchedBusinessCustomerData.contactNumber ||
                    prev.contactNumber,
                alternateContactNumber:
                    fetchedBusinessCustomerData.currAlternateContact ||
                    fetchedBusinessCustomerData.alternateContactNumber ||
                    prev.alternateContactNumber,
                email:
                    fetchedBusinessCustomerData.currEmail ||
                    fetchedBusinessCustomerData.email ||
                    prev.email,
            }));
        }
        setShowBusinessLookupPopup(false);
    };

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

    const handleFileChange = async (
        section: "business" | "attachments",
        field: string,
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const fileId = await storeFile(file);
                if (section === "business") {
                    setBusinessData((prev) => ({
                        ...prev,
                        [`${field}File`]: fileId,
                        [`${field}FileName`]: file.name,
                    }));
                    clearError(`business.${field}`);
                } else {
                    setAttachments((prev) => ({
                        ...prev,
                        [field]: fileId, [`${field}Name`]: file.name,
                    }));
                    clearError(`attachments.${field}`);
                }
            } catch (error) {
                console.error("Failed to store file in IndexedDB", error);
                alert("File upload failed. Please try again.");
            }
        }
    };

    const checkCountryBhutan = (countryId: string) => {
        const c = countryOptions.find(
            (opt) =>
                String(opt.country_pk_code || opt.country_id || opt.id) ===
                String(countryId),
        );
        return (
            c && (c.country_name || c.country || "").toLowerCase().includes("bhutan")
        );
    };

    // Enhanced comprehensive owner validation with familyTree and proper marital check
    const validateComprehensiveOwner = (
        data: any,
        basePath: string,
        businessType?: string,
        isPartnerOrShareholder?: boolean,
        options?: {
            skipBank?: boolean;
            skipEmployment?: boolean;
            skipPep?: boolean;
            skipFamilyTree?: boolean;
        },
    ): Record<string, string> => {
        const errs: Record<string, string> = {};

        // Personal required fields - removed tpn and taxIdentifierType
        const personalRequired = [
            "identificationType",
            "identificationNo",
            "salutation",
            "applicantName",
            "nationality",
            "gender",
            "identificationIssueDate",
            "identificationExpiryDate",
            "dateOfBirth",
            "maritalStatus",
        ];
        personalRequired.forEach((field) => {
            if (isRequired(data[field]))
                errs[`${basePath}.${field}`] = `${field.charAt(0).toUpperCase() + field.slice(1)
                    } is required`;
        });

        // NEW: Identity Proof is required for everyone
        if (!data.identityProofName) {
            errs[`${basePath}.identityProof`] = "Identity proof is required";
        }

        // Check if nationality is Bhutanese using generic check for household number requirement
        const isNatBhutanese = (natId: string) => {
            if (!natId) return false;
            const n = nationalityOptions.find(
                (opt) => String(opt.id || opt.nationality_pk_code) === String(natId),
            );

            const label = n ? n.nationality || n.name || "" : String(natId);
            const lowerLabel = label.toLowerCase();

            return lowerLabel.includes("bhutan") && !lowerLabel.includes("non");
        };

        // Household number if Bhutanese
        if (isNatBhutanese(data.nationality) && isRequired(data.householdNumber)) {
            errs[`${basePath}.householdNumber`] = "Household number is required";
        }

        // Shareholding validation for partners/shareholders
        if (isPartnerOrShareholder) {
            if (isRequired(data.shareholdingPercent)) {
                errs[`${basePath}.shareholdingPercent`] =
                    "Shareholding percentage is required";
            } else if (!isValidShareholding(data.shareholdingPercent)) {
                errs[`${basePath}.shareholdingPercent`] =
                    "Shareholding must be between 0 and 100";
            } else {
                // Additional rule: for Private Limited / Public Limited shareholders, shareholding must be >25%
                if (
                    (businessType === "Private Limited Company" ||
                        businessType === "Public Limited Company") &&
                    Number(data.shareholdingPercent) <= 25
                ) {
                    errs[`${basePath}.shareholdingPercent`] =
                        "Shareholding must be greater than 25% for significant shareholders";
                }
            }
        }

        // Spouse checks using the same logic as component
        if (
            data.maritalStatus &&
            isMarriedStatusFromOptions(data.maritalStatus, maritalStatusOptions)
        ) {
            // Personal required fields for spouse - removed spouseTpn and spouseTaxIdentifierType
            const spousePersonalRequired = [
                "spouseIdentificationType",
                "spouseIdentificationNo",
                "spouseSalutation",
                "spouseName",
                "spouseNationality",
                "spouseGender",
                "spouseIdentificationIssueDate",
                "spouseIdentificationExpiryDate",
                "spouseDateOfBirth",
            ];
            spousePersonalRequired.forEach((field) => {
                if (isRequired(data[field]))
                    errs[`${basePath}.${field}`] = `${field.replace("spouse", "Spouse ").charAt(0).toUpperCase() +
                        field.slice(1)
                        } is required`;
            });

            // Spouse household number if spouse nationality is Bhutanese
            if (isNatBhutanese(data.spouseNationality)) {
                if (isRequired(data.spouseHouseholdNumber)) {
                    errs[`${basePath}.spouseHouseholdNumber`] =
                        "Spouse household number is required";
                }
            }

            // Spouse permanent address
            if (isRequired(data.spousePermCountry))
                errs[`${basePath}.spousePermCountry`] = "Spouse country is required";
            const isBhutanSpousePerm = checkCountryBhutan(data.spousePermCountry);
            if (isBhutanSpousePerm) {
                if (isRequired(data.spousePermDzongkhag))
                    errs[`${basePath}.spousePermDzongkhag`] =
                        "Spouse dzongkhag is required";
                if (isRequired(data.spousePermGewog))
                    errs[`${basePath}.spousePermGewog`] = "Spouse gewog is required";
                if (isRequired(data.spousePermVillage))
                    errs[`${basePath}.spousePermVillage`] =
                        "Spouse village/street is required";
                if (isRequired(data.spousePermThram))
                    errs[`${basePath}.spousePermThram`] =
                        "Spouse thram number is required";
                if (isRequired(data.spousePermHouse))
                    errs[`${basePath}.spousePermHouse`] =
                        "Spouse house number is required";
            } else {
                if (isRequired(data.spousePermDzongkhag))
                    errs[`${basePath}.spousePermDzongkhag`] = "Spouse state is required";
                if (isRequired(data.spousePermGewog))
                    errs[`${basePath}.spousePermGewog`] = "Spouse province is required";
                if (isRequired(data.spousePermVillage))
                    errs[`${basePath}.spousePermVillage`] =
                        "Spouse street name is required";
                if (!data.spousePermAddressProofName)
                    errs[`${basePath}.spousePermAddressProof`] =
                        "Spouse address proof is required";
            }

            // Spouse contact
            if (isRequired(data.spouseEmail))
                errs[`${basePath}.spouseEmail`] = "Spouse email is required";
            else if (!isValidEmail(data.spouseEmail))
                errs[`${basePath}.spouseEmail`] = "Invalid email format";
            if (isRequired(data.spouseContact))
                errs[`${basePath}.spouseContact`] = "Spouse contact number is required";
            else if (!isValidPhoneNumber(data.spouseContact))
                errs[`${basePath}.spouseContact`] =
                    "Enter a valid Bhutanese phone number";
            if (
                data.spouseAlternateContact &&
                !isValidPhoneNumber(data.spouseAlternateContact)
            )
                errs[`${basePath}.spouseAlternateContact`] =
                    "Enter a valid Bhutanese phone number";

            // Spouse identity proof required
            if (!data.spouseIdentityProofName) {
                errs[`${basePath}.spouseIdentityProof`] =
                    "Spouse identity proof is required";
            }
        }

        // Age validation
        if (!isRequired(data.dateOfBirth) && !isLegalAge(data.dateOfBirth)) {
            errs[`${basePath}.dateOfBirth`] =
                "Applicant must be at least 18 years old";
        }

        // Family Tree Upload (check file name, not the File object)
        if (!options?.skipFamilyTree && !data.familyTreeName) {
            errs[`${basePath}.familyTree`] = "Family tree document is required";
        }

        // Bank Details
        if (!options?.skipBank) {
            if (isRequired(data.bankName))
                errs[`${basePath}.bankName`] = "Bank name is required";
            if (isRequired(data.bankAccount))
                errs[`${basePath}.bankAccount`] = "Bank account number is required";
            // Passport Photo (check file name)
            if (!data.passportPhotoName) {
                errs[`${basePath}.passportPhoto`] = "Passport photo is required";
            }
        }

        // Permanent Address
        if (isRequired(data.permCountry))
            errs[`${basePath}.permCountry`] = "Country is required";

        const isBhutanPerm = checkCountryBhutan(data.permCountry);
        if (isBhutanPerm) {
            if (isRequired(data.permDzongkhag))
                errs[`${basePath}.permDzongkhag`] = "Dzongkhag is required";
            if (isRequired(data.permGewog))
                errs[`${basePath}.permGewog`] = "Gewog is required";
            if (isRequired(data.permVillage))
                errs[`${basePath}.permVillage`] = "Village/Street is required";
            if (isRequired(data.permThram))
                errs[`${basePath}.permThram`] = "Thram number is required";
            if (isRequired(data.permHouse))
                errs[`${basePath}.permHouse`] = "House number is required";
        } else {
            // Non-Bhutan mapping: permDzongkhag -> State, permGewog -> Province
            if (isRequired(data.permDzongkhag))
                errs[`${basePath}.permDzongkhag`] = "State is required";
            if (isRequired(data.permGewog))
                errs[`${basePath}.permGewog`] = "Province is required";
            if (isRequired(data.permVillage))
                errs[`${basePath}.permVillage`] = "Street name is required";
            if (!data.permAddressProofName)
                errs[`${basePath}.permAddressProof`] = "Address proof is required";
        }

        // Current Address
        if (isRequired(data.currCountry))
            errs[`${basePath}.currCountry`] = "Country is required";
        const isBhutanCurr = checkCountryBhutan(data.currCountry);
        if (isBhutanCurr) {
            if (isRequired(data.currDzongkhag))
                errs[`${basePath}.currDzongkhag`] = "Dzongkhag is required";
            if (isRequired(data.currGewog))
                errs[`${basePath}.currGewog`] = "Gewog is required";
            if (isRequired(data.currVillage))
                errs[`${basePath}.currVillage`] = "Village/Street is required";
            if (isRequired(data.currFlat))
                errs[`${basePath}.currFlat`] = "Flat/House number is required";
        } else {
            if (isRequired(data.currDzongkhag))
                errs[`${basePath}.currDzongkhag`] = "State is required";
            if (isRequired(data.currGewog))
                errs[`${basePath}.currGewog`] = "Province is required";
            if (isRequired(data.currVillage))
                errs[`${basePath}.currVillage`] = "Street name is required";
            if (!data.currAddressProofName)
                errs[`${basePath}.currAddressProof`] = "Address proof is required";
        }

        if (isRequired(data.currEmail))
            errs[`${basePath}.currEmail`] = "Email is required";
        else if (!isValidEmail(data.currEmail))
            errs[`${basePath}.currEmail`] = "Invalid email format";

        if (isRequired(data.currContact))
            errs[`${basePath}.currContact`] = "Contact number is required";
        else if (!isValidPhoneNumber(data.currContact))
            errs[`${basePath}.currContact`] = "Enter a valid Bhutanese phone number";

        // PEP - skip if this is a related PEP (handled separately)
        if (!options?.skipPep) {
            if (isRequired(data.pepPerson))
                errs[`${basePath}.pepPerson`] = "PEP status is required";
            if (data.pepPerson === "yes") {
                if (isRequired(data.pepCategory))
                    errs[`${basePath}.pepCategory`] = "PEP category is required";
                if (isRequired(data.pepSubCategory))
                    errs[`${basePath}.pepSubCategory`] = "PEP sub-category is required";
            } else if (data.pepPerson === "no") {
                if (isRequired(data.pepRelated))
                    errs[`${basePath}.pepRelated`] =
                        "Please indicate if related to a PEP";
                if (data.pepRelated === "yes") {
                    (data.relatedPeps || []).forEach((pep: any, idx: number) => {
                        const relBase = `${basePath}.relatedPeps.${idx}`;
                        if (isRequired(pep.relationship))
                            errs[`${relBase}.relationship`] = "Relationship is required";
                        if (isRequired(pep.identificationNo))
                            errs[`${relBase}.identificationNo`] =
                                "Identification number is required";
                        else if (!isValidCID(pep.identificationNo))
                            errs[`${relBase}.identificationNo`] = "Must be 11 digits";
                        if (isRequired(pep.category))
                            errs[`${relBase}.category`] = "PEP category is required";
                        if (isRequired(pep.subCategory))
                            errs[`${relBase}.subCategory`] = "PEP sub-category is required";
                    });
                }
            }
        }

        // Employment
        if (!options?.skipEmployment) {
            if (isRequired(data.employmentStatus))
                errs[`${basePath}.employmentStatus`] = "Employment status is required";
            if (data.employmentStatus === "employed") {
                const empFields = [
                    "employeeId",
                    "occupation",
                    "employerType",
                    "designation",
                    "grade",
                    "organizationName",
                    "orgLocation",
                    "joiningDate",
                    "annualSalary",
                    "serviceNature",
                ];
                empFields.forEach((field) => {
                    if (isRequired(data[field]))
                        errs[`${basePath}.${field}`] = `${field.charAt(0).toUpperCase() + field.slice(1)
                            } is required`;
                });
                if (data.serviceNature === "contract") {
                    if (isRequired(data.contractEndDate))
                        errs[`${basePath}.contractEndDate`] =
                            "Contract end date is required";
                }
            }
        }

        return errs;
    };

    const validateForm = (): boolean => {
        let newErrors: Record<string, string> = {};

        const businessRequired = [
            "businessName",
            "establishmentDate",
            "industryClassification",
            "identificationType",
            "identificationNumber",
            "identificationIssueDate",
            "identificationExpiryDate",
            "taxIdentifierType",
            "nameOfBank",
            "grossAnnualIncome",
            "businessType",
        ];
        businessRequired.forEach((field) => {
            // @ts-ignore
            if (isRequired(businessData[field]))
                newErrors[`business.${field}`] = `${field.charAt(0).toUpperCase() + field.slice(1)
                    } is required`;
        });

        if (isRequired(businessData.bankCurrentAccountNumber)) {
            newErrors["business.bankCurrentAccountNumber"] =
                "Current Account Number is required";
        }
        if (isRequired(businessData.taxIdentifierNumber)) {
            newErrors["business.taxIdentifierNumber"] =
                "Tax identifier number is required";
        }

        if (!businessData.identificationProofFileName)
            // check file name, not the ID
            newErrors["business.identificationProofFile"] =
                "Identification proof is required";

        if (isRequired(businessAddress.country))
            newErrors["business.country"] = "Country is required";
        if (businessAddress.country) {
            if (isBusinessBhutan) {
                if (isRequired(businessAddress.dzongkhag))
                    newErrors["business.dzongkhag"] = "Dzongkhag is required";
                if (isRequired(businessAddress.gewog))
                    newErrors["business.gewog"] = "Gewog is required";
                if (isRequired(businessAddress.villageStreet))
                    newErrors["business.villageStreet"] = "Village/Street is required";
            } else {
                if (isRequired(businessAddress.dzongkhag))
                    newErrors["business.dzongkhag"] = "State is required";
                if (isRequired(businessAddress.gewog))
                    newErrors["business.gewog"] = "Province is required";
                if (isRequired(businessAddress.villageStreet))
                    newErrors["business.villageStreet"] = "Street is required";
            }
            if (isRequired(businessAddress.specificLocation))
                newErrors["business.specificLocation"] =
                    "Specific location is required";
        }

        if (isRequired(businessAddress.contactNumber)) {
            newErrors["business.contactNumber"] = "Contact number is required";
        } else if (!isValidPhoneNumber(businessAddress.contactNumber)) {
            newErrors["business.contactNumber"] =
                "Enter a valid Bhutanese phone number";
        }
        if (
            businessAddress.alternateContactNumber &&
            !isValidPhoneNumber(businessAddress.alternateContactNumber)
        ) {
            newErrors["business.alternateContactNumber"] =
                "Enter a valid Bhutanese phone number";
        }
        if (isRequired(businessAddress.email)) {
            newErrors["business.email"] = "Email is required";
        } else if (!isValidEmail(businessAddress.email)) {
            newErrors["business.email"] = "Invalid email format";
        }

        // Entity validation
        if (businessData.businessType === "Sole Proprietorship") {
            newErrors = {
                ...newErrors,
                ...validateComprehensiveOwner(
                    ownerData,
                    "owner",
                    businessData.businessType,
                ),
            };
        }

        if (businessData.businessType === "Partnership") {
            partners.forEach((partner, idx) => {
                newErrors = {
                    ...newErrors,
                    ...validateComprehensiveOwner(
                        partner,
                        `partners.${idx}`,
                        businessData.businessType,
                        true, // isPartnerOrShareholder
                    ),
                };
            });
        }

        if (businessData.businessType === "Private Limited Company") {
            shareholders.forEach((sh, idx) => {
                newErrors = {
                    ...newErrors,
                    ...validateComprehensiveOwner(
                        sh,
                        `shareholders.${idx}`,
                        businessData.businessType,
                        true,
                    ),
                };
            });
            newErrors = {
                ...newErrors,
                ...validateComprehensiveOwner(
                    ceo,
                    "ceo",
                    businessData.businessType,
                    true,
                ),
            };
            boardMembers.forEach((bm, idx) => {
                newErrors = {
                    ...newErrors,
                    ...validateComprehensiveOwner(
                        bm,
                        `boardMembers.${idx}`,
                        businessData.businessType,
                        true,
                    ),
                };
            });
        }

        if (businessData.businessType === "Public Limited Company") {
            shareholders.forEach((sh, idx) => {
                newErrors = {
                    ...newErrors,
                    ...validateComprehensiveOwner(
                        sh,
                        `shareholders.${idx}`,
                        businessData.businessType,
                        true,
                    ),
                };
            });
            newErrors = {
                ...newErrors,
                ...validateComprehensiveOwner(
                    ceo,
                    "ceo",
                    businessData.businessType,
                    true,
                ),
            };
            boardMembers.forEach((bm, idx) => {
                newErrors = {
                    ...newErrors,
                    ...validateComprehensiveOwner(
                        bm,
                        `boardMembers.${idx}`,
                        businessData.businessType,
                        true,
                    ),
                };
            });
        }

        if (businessData.businessType === "Trust") {
            trustees.forEach((tr, idx) => {
                newErrors = {
                    ...newErrors,
                    ...validateComprehensiveOwner(
                        tr,
                        `trustees.${idx}`,
                        businessData.businessType,
                    ),
                };
            });
        }

        if (businessData.businessType === "Association / Club") {
            newErrors = {
                ...newErrors,
                ...validateComprehensiveOwner(
                    president,
                    "president",
                    businessData.businessType,
                ),
            };
        }

        if (businessData.businessType === "Government Body") {
            newErrors = {
                ...newErrors,
                ...validateComprehensiveOwner(
                    headOfAgency,
                    "headOfAgency",
                    businessData.businessType,
                ),
            };
        }

        if (businessData.businessType === "NGO") {
            newErrors = {
                ...newErrors,
                ...validateComprehensiveOwner(
                    headOfNGO,
                    "headOfNGO",
                    businessData.businessType,
                ),
            };
        }

        setErrors((prev) => ({ ...prev, ...newErrors }));
        return Object.keys(newErrors).length === 0;
    };

    // ---- Helper: convert entire form data to storable version (IDs -> labels) ----
    const convertFormDataToStorable = (formData: any) => {
        if (!formData) return formData;
        const result: any = { ...formData };

        // Helper to convert a single person object
        const convertPerson = (person: any) => {
            if (!person) return person;
            const p = { ...person };
            if (p.identificationType) {
                p.identificationType = findLabelById(
                    p.identificationType,
                    identificationTypeOptions,
                    ["identification_type", "identity_type"],
                );
            }
            if (p.nationality) {
                p.nationality = findLabelById(p.nationality, nationalityOptions, [
                    "nationality",
                    "name",
                ]);
            }
            if (p.maritalStatus) {
                p.maritalStatus = findLabelById(p.maritalStatus, maritalStatusOptions, [
                    "marital_status",
                    "name",
                ]);
            }
            if (p.taxIdentifierType && taxIdentifierTypeOptions.length) {   // <-- NEW
                p.taxIdentifierType = findLabelById(
                    p.taxIdentifierType,
                    taxIdentifierTypeOptions,
                    ["tax_identifier_type", "name", "label"]
                );
            }
            if (p.bankName) {
                p.bankName = findLabelById(p.bankName, banksOptions, [
                    "bank_name",
                    "name",
                ]);
            }
            if (p.permCountry) {
                p.permCountry = findLabelById(p.permCountry, countryOptions, [
                    "country_name",
                    "country",
                ]);
            }
            if (p.permDzongkhag) {
                p.permDzongkhag = findLabelById(p.permDzongkhag, dzongkhagOptions, [
                    "dzongkhag_name",
                    "dzongkhag",
                ]);
            }
            if (p.currCountry) {
                p.currCountry = findLabelById(p.currCountry, countryOptions, [
                    "country_name",
                    "country",
                ]);
            }
            if (p.currDzongkhag) {
                p.currDzongkhag = findLabelById(p.currDzongkhag, dzongkhagOptions, [
                    "dzongkhag_name",
                    "dzongkhag",
                ]);
            }
            if (p.occupation) {
                p.occupation = findLabelById(p.occupation, occupationOptions, [
                    "occ_name",
                    "occupation",
                ]);
            }
            if (p.pepCategory) {
                p.pepCategory = findLabelById(p.pepCategory, pepCategoryOptions, [
                    "pep_category",
                    "name",
                ]);
            }
            // Spouse fields
            if (p.spouseIdentificationType) {
                p.spouseIdentificationType = findLabelById(
                    p.spouseIdentificationType,
                    identificationTypeOptions,
                    ["identification_type", "identity_type"],
                );
            }
            if (p.spouseNationality) {
                p.spouseNationality = findLabelById(
                    p.spouseNationality,
                    nationalityOptions,
                    ["nationality", "name"],
                );
            }
            if (p.spouseTaxIdentifierType && taxIdentifierTypeOptions.length) {   // <-- NEW
                p.spouseTaxIdentifierType = findLabelById(
                    p.spouseTaxIdentifierType,
                    taxIdentifierTypeOptions,
                    ["tax_identifier_type", "name", "label"]
                );
            }
            if (p.spousePermCountry) {
                p.spousePermCountry = findLabelById(
                    p.spousePermCountry,
                    countryOptions,
                    ["country_name", "country"],
                );
            }
            if (p.spousePermDzongkhag) {
                p.spousePermDzongkhag = findLabelById(
                    p.spousePermDzongkhag,
                    dzongkhagOptions,
                    ["dzongkhag_name", "dzongkhag"],
                );
            }
            // Note: Gewogs and PEP subcategories are handled by the component on load
            return p;
        };

        // Convert all owner/management sections
        if (result.ownerData) result.ownerData = convertPerson(result.ownerData);
        if (result.partners)
            result.partners = result.partners.map((p: any) => convertPerson(p));
        if (result.ceo) result.ceo = convertPerson(result.ceo);
        if (result.boardMembers)
            result.boardMembers = result.boardMembers.map((p: any) =>
                convertPerson(p),
            );
        if (result.shareholders)
            result.shareholders = result.shareholders.map((p: any) =>
                convertPerson(p),
            );
        if (result.trustees)
            result.trustees = result.trustees.map((p: any) => convertPerson(p));
        if (result.president) result.president = convertPerson(result.president);
        if (result.headOfAgency)
            result.headOfAgency = convertPerson(result.headOfAgency);
        if (result.headOfNGO) result.headOfNGO = convertPerson(result.headOfNGO);

        // Convert business address fields that are dropdowns
        if (result.businessDetail?.businessAddress?.country) {
            result.businessDetail.businessAddress.country = findLabelById(
                result.businessDetail.businessAddress.country,
                countryOptions,
                ["country_name", "country"],
            );
        }
        if (result.businessDetail?.businessAddress?.dzongkhag) {
            result.businessDetail.businessAddress.dzongkhag = findLabelById(
                result.businessDetail.businessAddress.dzongkhag,
                dzongkhagOptions, ["dzongkhag_name", "dzongkhag"],
            );
        }

        // Convert Industry Classification back to text before storage
        if (result.businessDetail?.industryClassification && industryOptions.length > 0) {
            result.businessDetail.industryClassification = findLabelById(
                result.businessDetail.industryClassification,
                industryOptions, [
                "industry_classification",
                "industry_type",
                "industry_name",
                "name",
                "label",
                "industry",
                "inds_class_name"
            ]
            );
        }

        // Convert Business Tax Identifier Type   <-- NEW
        if (result.businessDetail?.taxIdentifierType && taxIdentifierTypeOptions.length > 0) {
            result.businessDetail.taxIdentifierType = findLabelById(
                result.businessDetail.taxIdentifierType,
                taxIdentifierTypeOptions,
                ["tax_identifier_type", "name", "label"]
            );
        }

        return result;
    };

    const handleNext = () => {
        if (!validateForm()) {
            alert("Please fix the errors before proceeding.");
            return;
        }

        // Retrieve existing data from sessionStorage or start fresh
        const existingSession = sessionStorage.getItem(
            "businessLoanApplicationData",
        );
        const allData = existingSession ? JSON.parse(existingSession) : {};

        // 1. CLEANUP: Define keys to remove from top-level to prevent duplication/stale data.
        // This removes business fields, address fields, AND any previously stored ownership keys.
        const keysToRemove = [
            // Business Identifiers & Financials
            "businessName",
            "establishmentDate",
            "industryClassification",
            "identificationType",
            "identificationNumber",
            "identificationIssueDate",
            "identificationExpiryDate",
            "identificationProofFile",
            "identificationProofFileName",
            "taxIdentifierType",
            "taxIdentifierNumber",
            "bankCurrentAccountNumber",
            "bankSavingAccountNumber",
            "nameOfBank",
            "grossAnnualIncome",
            "businessType",
            // Address Keys (in case they were top-level)
            "businessAddress",
            "country",
            "dzongkhag",
            "gewog",
            "villageStreet",
            "specificLocation",
            "contactNumber",
            "alternateContactNumber",
            "email",
            // Ownership Keys (We remove ALL potential keys first, then add back only the relevant one)
            "ownerData",
            "partners",
            "ceo",
            "boardMembers",
            "shareholders",
            "trustees",
            "president",
            "headOfAgency",
            "headOfNGO",
        ];

        keysToRemove.forEach((key) => {
            delete allData[key];
        });

        // 2. CONSOLIDATE: Build the clean businessDetail object
        const businessDetail = {
            ...businessData,
            businessAddress: {
                ...businessAddress,
            },
        };

        // 3. BASE UPDATE: Add consolidated business details and attachments
        const updatedData: any = {
            ...allData,
            businessDetail, // Contains all business info + address
            attachments,
        };

        // 4. SELECTIVE STORAGE: Add ONLY the ownership data relevant to the selected Business Type
        switch (businessData.businessType) {
            case "Sole Proprietorship":
                updatedData.ownerData = ownerData;
                break;
            case "Partnership":
                if (partners.length > 0) updatedData.partners = partners;
                break;
            case "Private Limited Company":
                if (shareholders.length > 0) updatedData.shareholders = shareholders;
                updatedData.ceo = ceo;
                if (boardMembers.length > 0) updatedData.boardMembers = boardMembers;
                break;
            case "Public Limited Company":
                if (shareholders.length > 0) updatedData.shareholders = shareholders;
                updatedData.ceo = ceo;
                if (boardMembers.length > 0) updatedData.boardMembers = boardMembers;
                break;
            case "Trust":
                if (trustees.length > 0) updatedData.trustees = trustees;
                break;
            case "Association / Club":
                updatedData.president = president;
                break;
            case "Government Body":
                updatedData.headOfAgency = headOfAgency;
                break;
            case "NGO":
                updatedData.headOfNGO = headOfNGO;
                break;
            default:
                // No additional ownership data added
                break;
        }

        // 5. SANITIZE & SAVE
        const sanitizedData = sanitizeForStorage(updatedData);

        // 6. CONVERT IDs TO LABELS for session storage
        const storableData = convertFormDataToStorable(sanitizedData);

        sessionStorage.setItem(
            "businessLoanApplicationData",
            JSON.stringify(storableData),
        );

        // Pass the combined data to parent for immediate UI updates/steps
        // (Note: We pass the structure the form uses internally, which is distinct components)
        const dataToPass = {
            ...sanitizedData, // pass the new structure
            // Also spread individual components if parent expects flat structure for some reason,
            // but ideally parent should now look at 'businessDetail'
        };
        onNext(dataToPass);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* --- A. BUSINESS DETAILS --- */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">
                    A. BUSINESS DETAILS
                </h2>

                {showBusinessLookupPopup && (
                    <DocumentPopup
                        open={showBusinessLookupPopup}
                        onOpenChange={setShowBusinessLookupPopup}
                        searchStatus={businessLookupStatus}
                        onProceed={handleBusinessLookupProceed}
                    />
                )}

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
                            <RestrictedInput
                                allowed="alpha"
                                className={getFieldStyle(!!errors["business.businessName"])}
                                value={businessData.businessName}
                                onChange={(e) =>
                                    handleBusinessDataChange("businessName", e.target.value)
                                }
                            />
                            {errors["business.businessName"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.businessName"]}
                                </p>
                            )}
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
                                <SelectTrigger
                                    className={getFieldStyle(!!errors["business.businessType"])}
                                >
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
                            {errors["business.businessType"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.businessType"]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Establishment Date <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                className={getFieldStyle(
                                    !!errors["business.establishmentDate"],
                                )}
                                type="date"
                                value={formatDateForInput(businessData.establishmentDate)}
                                onChange={(e) =>
                                    handleBusinessDataChange("establishmentDate", e.target.value)
                                }
                            />
                            {errors["business.establishmentDate"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.establishmentDate"]}
                                </p>
                            )}
                        </div>

                        {/* Industry Classification */}
                        <div className="space-y-2">
                            <Label>
                                Industry Classification <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={businessData.industryClassification}
                                onValueChange={(v) => handleBusinessDataChange("industryClassification", v)}
                            >
                                <SelectTrigger className={getFieldStyle(!!errors["business.industryClassification"])}>
                                    <SelectValue placeholder="Select Industry" />
                                </SelectTrigger>
                                <SelectContent>
                                    {industryOptions.length > 0 ? (
                                        industryOptions.map((opt: any, index: number) => {
                                            // Handle string options
                                            if (typeof opt === 'string') {
                                                return (
                                                    <SelectItem key={opt} value={opt}>
                                                        {opt}
                                                    </SelectItem>
                                                );
                                            }

                                            // Determine value (ID)
                                            const value = String(
                                                opt.inds_class_pk_code ||
                                                opt.industry_classification_pk_code ||
                                                opt.industry_pk_code ||
                                                opt.id ||
                                                opt.code ||
                                                opt.value ||
                                                index
                                            );

                                            // Determine label
                                            const label =
                                                opt.inds_class_name ||
                                                opt.industry_classification ||
                                                opt.industry_type ||
                                                opt.industry_name ||
                                                opt.name ||
                                                opt.industry ||
                                                opt.label ||
                                                opt.description ||
                                                opt.title ||
                                                value;

                                            return (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            );
                                        })
                                    ) : (
                                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            {errors["business.industryClassification"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.industryClassification"]}
                                </p>
                            )}
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
                                <SelectTrigger
                                    className={getFieldStyle(
                                        !!errors["business.identificationType"],
                                    )}
                                >
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {identificationTypeOptions
                                        .filter((opt: any) => {
                                            const label = (
                                                opt.identification_type ||
                                                opt.identity_type ||
                                                ""
                                            ).toLowerCase();
                                            return (
                                                label.includes("trade license number") ||
                                                label.includes("company registration number")
                                            );
                                        })
                                        .map((opt: any, i) => (
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
                            {errors["business.identificationType"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.identificationType"]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Identification Number <span className="text-red-500">*</span>
                            </Label>
                            <RestrictedInput
                                allowed="alphanumeric"
                                className={getFieldStyle(
                                    !!errors["business.identificationNumber"],
                                )}
                                value={businessData.identificationNumber}
                                onChange={(e) =>
                                    handleBusinessDataChange(
                                        "identificationNumber",
                                        e.target.value,
                                    )
                                }
                                onBlur={handleBusinessIdentityCheck}
                            />
                            {errors["business.identificationNumber"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.identificationNumber"]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Identification Issue Date{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                className={getFieldStyle(
                                    !!errors["business.identificationIssueDate"],
                                )}
                                type="date"
                                value={formatDateForInput(businessData.identificationIssueDate)}
                                onChange={(e) =>
                                    handleBusinessDataChange(
                                        "identificationIssueDate",
                                        e.target.value,
                                    )
                                }
                            />
                            {errors["business.identificationIssueDate"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.identificationIssueDate"]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Identification Expiry Date{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                className={getFieldStyle(
                                    !!errors["business.identificationExpiryDate"],
                                )}
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
                            {errors["business.identificationExpiryDate"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.identificationExpiryDate"]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2.5">
                            <Label>
                                Upload Identification Proof{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="biz-id-proof"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) =>
                                        handleFileChange("business", "identificationProof", e)
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={`w-28 ${errors["business.identificationProofFile"] ? "border-red-500" : "bg-transparent"}`}
                                    onClick={() =>
                                        document.getElementById("biz-id-proof")?.click()
                                    }
                                >
                                    Choose File{" "}
                                </Button>
                                <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                    {businessData.identificationProofFileName || "No file chosen"}
                                </span>
                            </div>
                            {errors["business.identificationProofFile"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.identificationProofFile"]}
                                </p>
                            )}
                            <p className="text-xs text-gray-500">
                                Please upload a valid business proof document. Allowed: PDF,
                                JPG, PNG (Max 5MB)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Tax Identifier Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={businessData.taxIdentifierType}
                                onValueChange={(v) =>
                                    handleBusinessDataChange("taxIdentifierType", v)
                                }
                            >
                                <SelectTrigger
                                    className={getFieldStyle(
                                        !!errors["business.taxIdentifierType"],
                                    )}
                                >
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {taxIdentifierTypeOptions.length ? (
                                        // In business section, filter out "Personal Income Tax" (PIT)
                                        taxIdentifierTypeOptions
                                            .filter((opt: any) => {
                                                const label = (opt.tax_identifier_type || opt.name || "").toLowerCase();
                                                return !(
                                                    label.includes("personal income tax") ||
                                                    label === "pit"
                                                );
                                            })
                                            .map((opt: any, i) => (
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
                            {errors["business.taxIdentifierType"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.taxIdentifierType"]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Tax Identifier Number <span className="text-red-500">*</span>
                            </Label>
                            <RestrictedInput
                                allowed="numeric"
                                maxLength={11}
                                className={getFieldStyle(
                                    !!errors["business.taxIdentifierNumber"],
                                )}
                                value={businessData.taxIdentifierNumber}
                                onChange={(e) =>
                                    handleBusinessDataChange(
                                        "taxIdentifierNumber",
                                        e.target.value,
                                    )
                                }
                            />
                            {errors["business.taxIdentifierNumber"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.taxIdentifierNumber"]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Name of Bank <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={businessData.nameOfBank}
                                onValueChange={(v) => handleBusinessDataChange("nameOfBank", v)}
                            >
                                <SelectTrigger
                                    className={getFieldStyle(!!errors["business.nameOfBank"])}
                                >
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
                            {errors["business.nameOfBank"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.nameOfBank"]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Bank Current Account Number{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <RestrictedInput
                                allowed="alphanumeric"
                                className={getFieldStyle(
                                    !!errors["business.bankCurrentAccountNumber"],
                                )}
                                value={businessData.bankCurrentAccountNumber}
                                onChange={(e) =>
                                    handleBusinessDataChange(
                                        "bankCurrentAccountNumber",
                                        e.target.value,
                                    )
                                }
                            />
                            {errors["business.bankCurrentAccountNumber"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.bankCurrentAccountNumber"]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Gross Annual Income <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                className={getFieldStyle(
                                    !!errors["business.grossAnnualIncome"],
                                )}
                                type="number"
                                value={businessData.grossAnnualIncome}
                                onChange={(e) =>
                                    handleBusinessDataChange("grossAnnualIncome", e.target.value)
                                }
                            />
                            {errors["business.grossAnnualIncome"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.grossAnnualIncome"]}
                                </p>
                            )}
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
                                <SelectTrigger
                                    className={getFieldStyle(!!errors["business.country"])}
                                >
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
                            {errors["business.country"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.country"]}
                                </p>
                            )}
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
                                    <SelectTrigger
                                        className={getFieldStyle(!!errors["business.dzongkhag"])}
                                    >
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
                                <RestrictedInput
                                    allowed="alpha"
                                    className={getFieldStyle(!!errors["business.dzongkhag"])}
                                    placeholder="Enter State"
                                    value={businessAddress.dzongkhag}
                                    onChange={(e) =>
                                        handleBusinessAddressChange("dzongkhag", e.target.value)
                                    }
                                />
                            )}
                            {errors["business.dzongkhag"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.dzongkhag"]}
                                </p>
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
                                    <SelectTrigger
                                        className={getFieldStyle(!!errors["business.gewog"])}
                                    >
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
                                <RestrictedInput
                                    allowed="alpha"
                                    className={getFieldStyle(!!errors["business.gewog"])}
                                    placeholder="Enter Province"
                                    value={businessAddress.gewog}
                                    onChange={(e) =>
                                        handleBusinessAddressChange("gewog", e.target.value)
                                    }
                                />
                            )}
                            {errors["business.gewog"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.gewog"]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>
                                {isBusinessBhutan ? "Village / Street" : "Street"}{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <RestrictedInput
                                allowed="alphanumeric"
                                className={getFieldStyle(!!errors["business.villageStreet"])}
                                placeholder={
                                    isBusinessBhutan ? "Enter Village / Street" : "Enter Street"
                                }
                                value={businessAddress.villageStreet}
                                onChange={(e) =>
                                    handleBusinessAddressChange("villageStreet", e.target.value)
                                }
                                disabled={!businessAddress.country}
                            />
                            {errors["business.villageStreet"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.villageStreet"]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>
                                Specific Area / Location <span className="text-red-500">*</span>
                            </Label>
                            <RestrictedInput
                                allowed="alphanumeric"
                                className={getFieldStyle(!!errors["business.specificLocation"])}
                                value={businessAddress.specificLocation}
                                onChange={(e) =>
                                    handleBusinessAddressChange(
                                        "specificLocation",
                                        e.target.value,
                                    )
                                }
                            />
                            {errors["business.specificLocation"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.specificLocation"]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Contact Number <span className="text-red-500">*</span>
                            </Label>
                            <RestrictedInput
                                allowed="numeric"
                                maxLength={8}
                                className={getFieldStyle(!!errors["business.contactNumber"])}
                                value={businessAddress.contactNumber}
                                onChange={(e) =>
                                    handleBusinessAddressChange("contactNumber", e.target.value)
                                }
                            />
                            {errors["business.contactNumber"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.contactNumber"]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Alternate Contact Number</Label>
                            <RestrictedInput
                                allowed="numeric"
                                maxLength={8}
                                className={getFieldStyle(
                                    !!errors["business.alternateContactNumber"],
                                )}
                                value={businessAddress.alternateContactNumber}
                                onChange={(e) =>
                                    handleBusinessAddressChange(
                                        "alternateContactNumber",
                                        e.target.value,
                                    )
                                }
                            />
                            {errors["business.alternateContactNumber"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.alternateContactNumber"]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Email Address <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="email"
                                className={getFieldStyle(!!errors["business.email"])}
                                value={businessAddress.email}
                                onChange={(e) =>
                                    handleBusinessAddressChange("email", e.target.value)
                                }
                            />
                            {errors["business.email"] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors["business.email"]}
                                </p>
                            )}
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
                                maritalStatusOptions={maritalStatusOptions}
                                taxIdentifierTypeOptions={taxIdentifierTypeOptions}   // <-- NEW
                                title="Owner Personal Information"
                                errors={errors}
                                basePath="owner"
                                onClearError={clearError}
                                onSetError={setError}
                                onValidateField={validateField}
                                businessType={businessData.businessType}
                            />
                        </div>
                    )}

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
                                    isPartner={true}
                                    title={`Partner ${index + 1} Personal Details`}
                                    onUpdate={(newData) => handleUpdatePartner(index, newData)}
                                    onRemove={() => handleRemovePartner(index)}
                                    countryOptions={countryOptions}
                                    dzongkhagOptions={dzongkhagOptions}
                                    identificationTypeOptions={identificationTypeOptions}
                                    maritalStatusOptions={maritalStatusOptions}
                                    taxIdentifierTypeOptions={taxIdentifierTypeOptions}   // <-- NEW
                                    errors={errors}
                                    basePath={`partners.${index}`}
                                    onClearError={clearError}
                                    onSetError={setError}
                                    onValidateField={validateField}
                                    businessType={businessData.businessType}
                                />
                            ))}
                        </div>
                    )}

                    {businessData.businessType === "Private Limited Company" && (
                        <div className="space-y-12">
                            <div className="p-4 bg-blue-50 border-l-4 border-[#003DA5] text-sm text-[#003DA5] mb-6">
                                <strong>Note:</strong> Please provide personal data for any
                                individual shareholder holding more than 25% shareholding.
                            </div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <Users className="h-5 w-5 text-[#003DA5]" /> 1. Shareholders
                                        / Partners Personal Details (&gt; 25% shareholding)
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
                                        maritalStatusOptions={maritalStatusOptions}
                                        taxIdentifierTypeOptions={taxIdentifierTypeOptions}   // <-- NEW
                                        errors={errors}
                                        basePath={`shareholders.${idx}`}
                                        onClearError={clearError}
                                        onSetError={setError}
                                        onValidateField={validateField}
                                        businessType={businessData.businessType}
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
                                    maritalStatusOptions={maritalStatusOptions}
                                    taxIdentifierTypeOptions={taxIdentifierTypeOptions}   // <-- NEW
                                    errors={errors}
                                    basePath="ceo"
                                    onClearError={clearError}
                                    onSetError={setError}
                                    onValidateField={validateField}
                                    businessType={businessData.businessType}
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
                                        maritalStatusOptions={maritalStatusOptions}
                                        taxIdentifierTypeOptions={taxIdentifierTypeOptions}   // <-- NEW
                                        errors={errors}
                                        basePath={`boardMembers.${idx}`}
                                        onClearError={clearError}
                                        onSetError={setError}
                                        onValidateField={validateField}
                                        businessType={businessData.businessType}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

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
                                        maritalStatusOptions={maritalStatusOptions}
                                        taxIdentifierTypeOptions={taxIdentifierTypeOptions}   // <-- NEW
                                        errors={errors}
                                        basePath={`shareholders.${idx}`}
                                        onClearError={clearError}
                                        onSetError={setError}
                                        onValidateField={validateField}
                                        businessType={businessData.businessType}
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
                                    maritalStatusOptions={maritalStatusOptions}
                                    taxIdentifierTypeOptions={taxIdentifierTypeOptions}   // <-- NEW
                                    errors={errors}
                                    basePath="ceo"
                                    onClearError={clearError}
                                    onSetError={setError}
                                    onValidateField={validateField}
                                    businessType={businessData.businessType}
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
                                        maritalStatusOptions={maritalStatusOptions}
                                        taxIdentifierTypeOptions={taxIdentifierTypeOptions}   // <-- NEW
                                        errors={errors}
                                        basePath={`boardMembers.${idx}`}
                                        onClearError={clearError}
                                        onSetError={setError}
                                        onValidateField={validateField}
                                        businessType={businessData.businessType}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

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
                                    maritalStatusOptions={maritalStatusOptions}
                                    taxIdentifierTypeOptions={taxIdentifierTypeOptions}   // <-- NEW
                                    errors={errors}
                                    basePath={`trustees.${index}`}
                                    onClearError={clearError}
                                    onSetError={setError}
                                    onValidateField={validateField}
                                    businessType={businessData.businessType}
                                />
                            ))}
                        </div>
                    )}

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
                                maritalStatusOptions={maritalStatusOptions}
                                taxIdentifierTypeOptions={taxIdentifierTypeOptions}   // <-- NEW
                                errors={errors}
                                basePath="president"
                                onClearError={clearError}
                                onSetError={setError}
                                onValidateField={validateField}
                                businessType={businessData.businessType}
                            />
                        </div>
                    )}

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
                                maritalStatusOptions={maritalStatusOptions}
                                taxIdentifierTypeOptions={taxIdentifierTypeOptions}   // <-- NEW
                                errors={errors}
                                basePath="headOfAgency"
                                onClearError={clearError}
                                onSetError={setError}
                                onValidateField={validateField}
                                businessType={businessData.businessType}
                            />
                        </div>
                    )}

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
                                maritalStatusOptions={maritalStatusOptions}
                                taxIdentifierTypeOptions={taxIdentifierTypeOptions}   // <-- NEW
                                errors={errors}
                                basePath="headOfNGO"
                                onClearError={clearError}
                                onSetError={setError}
                                onValidateField={validateField}
                                businessType={businessData.businessType}
                            />
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