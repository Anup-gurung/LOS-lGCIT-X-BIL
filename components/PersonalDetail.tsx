"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { fetchMaritalStatus, fetchBanks, fetchNationality, fetchIdentificationType, fetchCountry, fetchDzongkhag, fetchGewogsByDzongkhag, fetchOccupations, fetchLegalConstitution, fetchPepCategory, fetchPepSubCategoryByCategory } from "@/services/api"

interface PersonalDetailsFormProps {
  onNext: (data: any) => void
  onBack: () => void
  formData: any
  isFirstStep: boolean
}

export function PersonalDetailsForm({ onNext, onBack, formData }: PersonalDetailsFormProps) {
  const [data, setData] = useState(() => {
    // Initialize with formData if available, otherwise empty object
    const initial = formData?.personalDetails || formData || {}
    return initial
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCoBorrowerDialog, setShowCoBorrowerDialog] = useState(false)
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([])
  const [banksOptions, setBanksOptions] = useState<any[]>([])
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([])
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<any[]>([])
  const [countryOptions, setCountryOptions] = useState<any[]>([])
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([])
  const [permGewogOptions, setPermGewogOptions] = useState<any[]>([])
  const [currGewogOptions, setCurrGewogOptions] = useState<any[]>([])
  const [occupationOptions, setOccupationOptions] = useState<any[]>([])
  const [organizationOptions, setOrganizationOptions] = useState<any[]>([])
  const [pepSubCategoryOptions, setPepSubCategoryOptions] = useState<any[]>([])
  const [pepCategoryOptions, setPepCategoryOptions] = useState<any[]>([])
  const [relatedPepSubCategoryOptions, setRelatedPepSubCategoryOptions] = useState<any[]>([])

  // Calculate date constraints
  const today = new Date().toISOString().split('T')[0]
  const fifteenYearsAgo = new Date()
  fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15)
  const maxDobDate = fifteenYearsAgo.toISOString().split('T')[0]

  useEffect(() => {
    // Fetch marital status options from API
    const loadMaritalStatus = async () => {
      try {
        const options = await fetchMaritalStatus()
        setMaritalStatusOptions(options)
      } catch (error) {
        // Fallback to default options
        setMaritalStatusOptions([
          { id: 'single', name: 'Single' },
          { id: 'married', name: 'Married' },
          { id: 'divorced', name: 'Divorced' },
          { id: 'widowed', name: 'Widowed' }
        ])
      }
    }

    loadMaritalStatus()

    // Fetch banks from API
    const loadBanks = async () => {
      try {
        const options = await fetchBanks()
        setBanksOptions(options)
      } catch (error) {
        // Fallback to default options
        setBanksOptions([
          { id: 'bob', name: 'Bank of Bhutan' },
          { id: 'bnb', name: 'Bhutan National Bank' },
          { id: 'dpnb', name: 'Druk PNB Bank' },
          { id: 'tbank', name: 'T Bank' }
        ])
      }
    }

    loadBanks()

    // Fetch nationality from API
    const loadNationality = async () => {
      try {
        const options = await fetchNationality()
        setNationalityOptions(options)
      } catch (error) {
        // Fallback to default options
        setNationalityOptions([
          { id: 'bhutanese', name: 'Bhutanese' },
          { id: 'indian', name: 'Indian' },
          { id: 'other', name: 'Other' }
        ])
      }
    }

    loadNationality()

    // Fetch identification type from API
    const loadIdentificationType = async () => {
      try {
        const options = await fetchIdentificationType()
        setIdentificationTypeOptions(options)
      } catch (error) {
        setIdentificationTypeOptions([
          { id: 'cid', name: 'Citizenship ID' },
          { id: 'passport', name: 'Passport' },
          { id: 'work_permit', name: 'Work Permit' }
        ])
      }
    }

    loadIdentificationType()

    // Fetch country from API
    const loadCountry = async () => {
      try {
        const options = await fetchCountry()
        setCountryOptions(options)
      } catch (error) {
        setCountryOptions([
          { id: 'bhutan', name: 'Bhutan' },
          { id: 'india', name: 'India' }
        ])
      }
    }

    loadCountry()

    // Fetch dzongkhag from API
    const loadDzongkhag = async () => {
      try {
        const options = await fetchDzongkhag()
        setDzongkhagOptions(options)
      } catch (error) {
        setDzongkhagOptions([
          { id: 'thimphu', name: 'Thimphu' },
          { id: 'paro', name: 'Paro' },
          { id: 'punakha', name: 'Punakha' }
        ])
      }
    }

    loadDzongkhag()

    // Fetch occupation from API
    const loadOccupation = async () => {
      try {
        const options = await fetchOccupations()
        setOccupationOptions(options)
      } catch (error) {
        setOccupationOptions([
          { id: 'engineer', name: 'Engineer' },
          { id: 'teacher', name: 'Teacher' },
          { id: 'doctor', name: 'Doctor' },
          { id: 'other', name: 'Other' }
        ])
      }
    }

    loadOccupation()

    // Fetch legal constitution (organizations) from API
    const loadOrganizations = async () => {
      try {
        const options = await fetchLegalConstitution()
        setOrganizationOptions(options)
      } catch (error) {
        setOrganizationOptions([
          { id: 'org1', name: 'Organization 1' },
          { id: 'org2', name: 'Organization 2' }
        ])
      }
    }

    loadOrganizations()

    // Fetch PEP categories from API
    const loadPepCategories = async () => {
      try {
        const options = await fetchPepCategory()
        if (!options || options.length === 0) {
          throw new Error('Empty PEP categories list')
        }
        setPepCategoryOptions(options)
      } catch (error) {
        setPepCategoryOptions([
          { pep_category_pk_code: '14001', pep_category: 'Foreign PEP' },
          { pep_category_pk_code: '14002', pep_category: 'Domestic PEP' },
          { pep_category_pk_code: '14003', pep_category: 'International Organization PEP' },
          { pep_category_pk_code: '14004', pep_category: 'Family Member of PEP' },
          { pep_category_pk_code: '14005', pep_category: 'Close Associate of PEP' }
        ])
      }
    }

    loadPepCategories()
  }, [])

  // Sync with formData when it changes (e.g., from verified customer data)
  useEffect(() => {
    // Only update if formData has meaningful data
    if (formData && typeof formData === 'object' && Object.keys(formData).length > 0) {
      // Check if formData has actual values (not just empty nested objects)
      const hasData = Object.entries(formData).some(([key, val]) => {
        // Check the nested personalDetails first
        if (key === 'personalDetails' && val && typeof val === 'object') {
          return Object.keys(val).length > 0
        }
        // Skip other nested form section references
        if (key === 'coBorrowerDetails' || key === 'securityDetails' || key === 'repaymentSource') {
          return false
        }
        // Check actual field values
        if (typeof val === 'string') return val.trim() !== ''
        if (typeof val === 'boolean') return true
        if (Array.isArray(val)) return val.length > 0
        return val !== null && val !== undefined
      })
      
      if (hasData) {
        setData((prev: any) => {
          const merged = {
            ...prev,
            ...(formData.personalDetails || {}),
            ...formData // Also spread root level properties from verified data
          }
          return merged
        })
      }
    }
  }, [formData])

  // Load permanent gewogs when permanent dzongkhag changes
  useEffect(() => {
    const loadPermGewogs = async () => {
      if (data.permDzongkhag) {
        try {
          const options = await fetchGewogsByDzongkhag(data.permDzongkhag)
          setPermGewogOptions(options)
        } catch (error) {
          setPermGewogOptions([])
        }
      }
    }
    loadPermGewogs()
  }, [data.permDzongkhag])

  // Load current gewogs when current dzongkhag changes
  useEffect(() => {
    const loadCurrGewogs = async () => {
      if (data.currDzongkhag) {
        try {
          const options = await fetchGewogsByDzongkhag(data.currDzongkhag)
          setCurrGewogOptions(options)
        } catch (error) {
          setCurrGewogOptions([])
        }
      }
    }
    loadCurrGewogs()
  }, [data.currDzongkhag])

  // Load PEP sub-categories when pepPerson is 'yes'
  useEffect(() => {
    const loadPepSubCategories = async () => {
      if (data.pepPerson === 'yes') {
        try {
          // Using 14003 as the PEP category code
          const options = await fetchPepSubCategoryByCategory('14003')
          if (!options || options.length === 0) {
            throw new Error('Empty PEP sub-category list')
          }
          setPepSubCategoryOptions(options)
        } catch (error) {
          setPepSubCategoryOptions([
            { id: 'foreign-pep', name: 'Foreign PEP' },
            { id: 'domestic-pep', name: 'Domestic PEP' },
            { id: 'international-org', name: 'International Organization PEP' },
            { id: 'family-member', name: 'Family Member of PEP' },
            { id: 'close-associate', name: 'Close Associate of PEP' }
          ])
        }
      } else {
        setPepSubCategoryOptions([])
      }
    }
    loadPepSubCategories()
  }, [data.pepPerson])

  // Load PEP sub-categories for related PEP flow when a category is selected
  useEffect(() => {
    const loadRelatedSubCategories = async () => {
      if (data.pepPerson === 'no' && data.pepRelated === 'yes' && data.pepCategory) {
        try {
          const options = await fetchPepSubCategoryByCategory(String(data.pepCategory))
          if (!options || options.length === 0) {
            throw new Error('Empty related PEP sub-category list')
          }
          setRelatedPepSubCategoryOptions(options)
        } catch (error) {
          setRelatedPepSubCategoryOptions([
            { id: 'related-foreign-pep', name: 'Foreign PEP' },
            { id: 'related-domestic-pep', name: 'Domestic PEP' },
            { id: 'related-international-org', name: 'International Organization PEP' },
            { id: 'related-family-member', name: 'Family Member of PEP' },
            { id: 'related-close-associate', name: 'Close Associate of PEP' }
          ])
        }
      } else {
        setRelatedPepSubCategoryOptions([])
      }
    }
    loadRelatedSubCategories()
  }, [data.pepPerson, data.pepRelated, data.pepCategory])

  const handleFileChange = (fieldName: string, file: File | null) => {
    if (file) {
      // Validate file type and size (max 5MB)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      const maxSize = 5 * 1024 * 1024 // 5MB
      
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, [fieldName]: 'Only PDF, JPG, JPEG, and PNG files are allowed' })
        return
      }
      
      if (file.size > maxSize) {
        setErrors({ ...errors, [fieldName]: 'File size must be less than 5MB' })
        return
      }
      
      setErrors({ ...errors, [fieldName]: '' })
      setData({ ...data, [fieldName]: file.name })
    }
  }

  const validateDates = () => {
    const newErrors: Record<string, string> = {}
    
    // Validate Identification Issue Date (not future)
    if (data.identificationIssueDate && data.identificationIssueDate > today) {
      newErrors.identificationIssueDate = 'Issue date cannot be in the future'
    }
    
    // Validate Identification Expiry Date (not past)
    if (data.identificationExpiryDate && data.identificationExpiryDate < today) {
      newErrors.identificationExpiryDate = 'Expiry date cannot be in the past'
    }
    
    // Validate Date of Birth (at least 15 years old)
    if (data.dateOfBirth && data.dateOfBirth > maxDobDate) {
      newErrors.dateOfBirth = 'You must be at least 15 years old'
    }
    
    // Validate Issue Date is before Expiry Date
    if (data.identificationIssueDate && data.identificationExpiryDate && 
        data.identificationIssueDate >= data.identificationExpiryDate) {
      newErrors.identificationExpiryDate = 'Expiry date must be after issue date'
    }
    
    setErrors({ ...errors, ...newErrors })
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateDates()) {
      setShowCoBorrowerDialog(true)
    }
  }

  const handleCoBorrowerResponse = (hasCoBorrower: boolean) => {
    setShowCoBorrowerDialog(false)
    onNext({ personalDetails: data, hasCoBorrower })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 md:space-y-10 pt-4 sm:pt-6 md:pt-8 pb-6 sm:pb-8 md:pb-12">
      {/* Application Personal Information */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">Application Personal Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-1.5 sm:space-y-2.5">
            <Label htmlFor="salutation" className="text-gray-800 font-semibold text-xs sm:text-sm">
              Salutation <span className="text-red-500">*</span>
            </Label>
            <Select value={data.salutation} onValueChange={(value) => setData({ ...data, salutation: value })}>
              <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                <SelectItem value="mr">Mr.</SelectItem>
                <SelectItem value="mrs">Mrs.</SelectItem>
                <SelectItem value="ms">Ms.</SelectItem>
                <SelectItem value="dr">Dr.</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:space-y-2.5">
            <Label htmlFor="applicantName" className="text-gray-800 font-semibold text-xs sm:text-sm">
              Applicant Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="applicantName"
              placeholder="Enter Your Full Name"
              className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
              value={data.applicantName || ""}
              onChange={(e) => setData({ ...data, applicantName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2.5">
            <Label htmlFor="nationality" className="text-gray-800 font-semibold text-xs sm:text-sm">
              Nationality <span className="text-red-500">*</span>
            </Label>
            <Select value={data.nationality} onValueChange={(value) => setData({ ...data, nationality: value })}>
              <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {nationalityOptions.length > 0 ? (
                  nationalityOptions.map((option, index) => {
                    const key = option.nationality_pk_code || option.id || option.code || `nationality-${index}`
                    const value = String(option.nationality_pk_code || option.id || option.code || index)
                    const label = option.nationality || option.name || option.label || 'Unknown'
                    
                    return (
                      <SelectItem key={key} value={value}>
                        {label}
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:space-y-2.5">
            <Label htmlFor="identificationType" className="text-gray-800 font-semibold text-xs sm:text-sm">
              Identification Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.identificationType}
              onValueChange={(value) => setData({ ...data, identificationType: value })}
            >
              <SelectTrigger className="h-10 sm:h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {identificationTypeOptions.length > 0 ? (
                  identificationTypeOptions.map((option, index) => {
                    const key = option.identity_type_pk_code || option.identification_type_pk_code || option.id || `id-${index}`
                    const value = String(option.identity_type_pk_code || option.identification_type_pk_code || option.id || index)
                    const label = option.identity_type || option.identification_type || option.name || 'Unknown'
                    
                    return (
                      <SelectItem key={key} value={value}>
                        {label}
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-1.5 sm:space-y-2.5">
            <Label htmlFor="identificationNo" className="text-gray-800 font-semibold text-xs sm:text-sm">
              Identification No. <span className="text-red-500">*</span>
            </Label>
            <Input
              id="identificationNo"
              placeholder="Enter identification No"
              className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
              value={data.identificationNo || ""}
              onChange={(e) => setData({ ...data, identificationNo: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2.5">
            <Label htmlFor="identificationIssueDate" className="text-gray-800 font-semibold text-xs sm:text-sm">
              Identification Issue Date <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              id="identificationIssueDate"
              max={today}
              className="h-10 sm:h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800] text-sm sm:text-base"
              value={data.identificationIssueDate || ""}
              onChange={(e) => {
                setData({ ...data, identificationIssueDate: e.target.value })
                setErrors({ ...errors, identificationIssueDate: '' })
              }}
              required
            />
            {errors.identificationIssueDate && (
              <p className="text-xs text-red-500 mt-1">{errors.identificationIssueDate}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2.5">
            <Label htmlFor="identificationExpiryDate" className="text-gray-800 font-semibold text-xs sm:text-sm">
              Identification Expiry Date <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              id="identificationExpiryDate"
              min={today}
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.identificationExpiryDate || ""}
              onChange={(e) => {
                setData({ ...data, identificationExpiryDate: e.target.value })
                setErrors({ ...errors, identificationExpiryDate: '' })
              }}
              required
            />
            {errors.identificationExpiryDate && (
              <p className="text-xs text-red-500 mt-1">{errors.identificationExpiryDate}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="dateOfBirth" className="text-gray-800 font-semibold text-sm">
              Date of Birth <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              id="dateOfBirth"
              max={maxDobDate}
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.dateOfBirth || ""}
              onChange={(e) => {
                setData({ ...data, dateOfBirth: e.target.value })
                setErrors({ ...errors, dateOfBirth: '' })
              }}
              required
            />
            {errors.dateOfBirth && (
              <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2.5">
            <Label htmlFor="tpn" className="text-gray-800 font-semibold text-sm">
              TPN No <span className="text-red-500">*</span>
            </Label>
            <Input
              id="tpn"
              placeholder="Enter TPN"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.tpn || ""}
              onChange={(e) => setData({ ...data, tpn: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="maritalStatus" className="text-gray-800 font-semibold text-sm">
              Marital Status <span className="text-red-500">*</span>
            </Label>
            <Select value={data.maritalStatus} onValueChange={(value) => setData({ ...data, maritalStatus: value })}>
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {maritalStatusOptions.length > 0 ? (
                  maritalStatusOptions.map((option, index) => {
                    const key = option.marital_status_pk_code || option.id || option.value || option.code || `marital-${index}`
                    const value = String(option.marital_status_pk_code || option.id || option.value || option.code || index)
                    const label = option.marital_status || option.name || option.label || option.description || option.value || 'Unknown'
                    
                    return (
                      <SelectItem key={key} value={value}>
                        {label}
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="gender" className="text-gray-800 font-semibold text-sm">
              Gender <span className="text-red-500">*</span>
            </Label>
            <Select value={data.gender} onValueChange={(value) => setData({ ...data, gender: value })}>
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="spouseName" className="text-gray-800 font-semibold text-sm">
              Spouse Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="spouseName"
              placeholder="Enter Full Name"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.spouseName || ""}
              onChange={(e) => setData({ ...data, spouseName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2.5">
            <Label htmlFor="spouseCid" className="text-gray-800 font-semibold text-sm">
              Spouse CID No <span className="text-red-500">*</span>
            </Label>
            <Input
              id="spouseCid"
              placeholder="Enter CID No"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.spouseCid || ""}
              onChange={(e) => setData({ ...data, spouseCid: e.target.value })}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="spouseContact" className="text-gray-800 font-semibold text-sm">
              Spouse Contact No <span className="text-red-500">*</span>
            </Label>
            <Input
              id="spouseContact"
              placeholder="Enter Contact No"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.spouseContact || ""}
              onChange={(e) => setData({ ...data, spouseContact: e.target.value })}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="uploadFamilyTree" className="text-gray-800 font-semibold text-sm">
              Upload Family Tree <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="uploadFamilyTree"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('familyTree', e.target.files?.[0] || null)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-28 bg-transparent"
                onClick={() => document.getElementById('uploadFamilyTree')?.click()}
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {data.familyTree || 'No file chosen'}
              </span>
            </div>
            {errors.familyTree && (
              <p className="text-xs text-red-500 mt-1">{errors.familyTree}</p>
            )}
            <p className="text-xs text-gray-500">Allowed: PDF, JPG, PNG (Max 5MB)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <Label htmlFor="bankAccount" className="text-gray-800 font-semibold text-sm">
              Bank Saving Account No <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bankAccount"
              placeholder="Enter saving account number"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.bankAccount || ""}
              onChange={(e) => setData({ ...data, bankAccount: e.target.value })}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="bankName" className="text-gray-800 font-semibold text-sm">
              Name of Bank <span className="text-red-500">*</span>
            </Label>
            <Select value={data.bankName} onValueChange={(value) => setData({ ...data, bankName: value })}>
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {banksOptions.length > 0 ? (
                  banksOptions.map((option, index) => {
                    // console.log('Bank option:', option)
                    const key = option.bank_pk_code || option.id || option.code || option.bank_code || `bank-${index}`
                    const value = String(option.bank_pk_code || option.id || option.code || option.bank_code || index)
                    const label = option.bank_name || option.name || option.label || option.bankName || option.bank || 'Unknown'
                    
                    return (
                      <SelectItem key={key} value={value}>
                        {label}
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="uploadPassport" className="text-gray-800 font-semibold text-sm">
            Upload Passport-size Photograph <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="uploadPassport"
              className="hidden"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => handleFileChange('passportPhoto', e.target.files?.[0] || null)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-28 bg-transparent"
              onClick={() => document.getElementById('uploadPassport')?.click()}
            >
              Choose File
            </Button>
            <span className="text-sm text-muted-foreground">
              {data.passportPhoto || 'No file chosen'}
            </span>
          </div>
          {errors.passportPhoto && (
            <p className="text-xs text-red-500 mt-1">{errors.passportPhoto}</p>
          )}
          <p className="text-xs text-gray-500">Allowed: JPG, PNG (Max 5MB)</p>
        </div>
      </div>

      {/* Permanent Address */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">Permanent Address</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-2.5">
            <Label htmlFor="permCountry" className="text-gray-800 font-semibold text-sm">
              Country <span className="text-red-500">*</span>
            </Label>
            <Select value={data.permCountry} onValueChange={(value) => setData({ ...data, permCountry: value })}>
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {countryOptions.length > 0 ? (
                  countryOptions.map((option, index) => {
                    const key = option.country_pk_code || option.id || option.code || `perm-country-${index}`
                    const value = String(option.country_pk_code || option.id || option.code || index)
                    const label = option.country || option.name || option.label || 'Unknown'
                    
                    return (
                      <SelectItem key={key} value={value}>
                        {label}
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="permDzongkhag" className="text-gray-800 font-semibold text-sm">
              {data.permCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Dzongkhag' : 'State'} <span className="text-red-500">*</span>
            </Label>
            {data.permCountry && !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? (
              <Input
                id="permDzongkhag"
                placeholder="Enter State"
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.permDzongkhag || ""}
                onChange={(e) => setData({ ...data, permDzongkhag: e.target.value })}
              />
            ) : (
            <Select 
              value={data.permDzongkhag || ''} 
              onValueChange={(value) => setData({ ...data, permDzongkhag: value })}
              disabled={data.permCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) === undefined}
            >
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {dzongkhagOptions.length > 0 ? (
                  dzongkhagOptions.map((option, index) => {
                    const key = option.dzongkhag_pk_code || option.id || option.code || `perm-dzo-${index}`
                    const value = String(option.dzongkhag_pk_code || option.id || option.code || index)
                    const label = option.dzongkhag || option.name || option.label || 'Unknown'
                    
                    return (
                      <SelectItem key={key} value={value}>
                        {label}
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                )}
              </SelectContent>
            </Select>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="permGewog" className="text-gray-800 font-semibold text-sm">
              {data.permCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Gewog' : 'Province'} <span className="text-red-500">*</span>
            </Label>
            {data.permCountry && !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? (
              <Input
                id="permGewog"
                placeholder="Enter Province"
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.permGewog || ""}
                onChange={(e) => setData({ ...data, permGewog: e.target.value })}
              />
            ) : (
            <Select 
              value={data.permCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? data.permGewog : ''} 
              onValueChange={(value) => setData({ ...data, permGewog: value })}
              disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            >
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {permGewogOptions.length > 0 ? (
                  permGewogOptions.map((option, index) => {
                    const key = option.gewog_pk_code || option.id || option.code || `perm-gewog-${index}`
                    const value = String(option.gewog_pk_code || option.id || option.code || index)
                    const label = option.gewog || option.name || option.label || 'Unknown'
                    
                    return (
                      <SelectItem key={key} value={value}>
                        {label}
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="loading" disabled>{data.permDzongkhag ? 'Loading...' : 'Select Dzongkhag first'}</SelectItem>
                )}
              </SelectContent>
            </Select>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="permVillage" className="text-gray-800 font-semibold text-sm">
              {data.permCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Village/Street' : 'Street'} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="permVillage"
              placeholder={data.permCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Enter Village/Street' : 'Enter Street'}
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.permVillage || ""}
              onChange={(e) => setData({ ...data, permVillage: e.target.value })}
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

        {/* Document Upload for Non-Bhutan Countries */}
        {data.permCountry && !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) && (
          <div className="space-y-2.5 border-t pt-4">
            <Label htmlFor="permAddressProof" className="text-gray-800 font-semibold text-sm">
              Upload Address Proof Document <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="permAddressProof"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('permAddressProof', e.target.files?.[0] || null)}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-28 bg-transparent"
                onClick={() => document.getElementById('permAddressProof')?.click()}
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {data.permAddressProof || 'No file chosen'}
              </span>
            </div>
            {errors.permAddressProof && (
              <p className="text-xs text-red-500 mt-1">{errors.permAddressProof}</p>
            )}
            <p className="text-xs text-gray-500">Please upload a valid address proof document for non-Bhutan residence. Allowed: PDF, JPG, PNG (Max 5MB)</p>
          </div>
        )}
      </div>

      {/* Current/Residential Address */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">Current/Residential Address</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-2.5">
            <Label htmlFor="currCountry" className="text-gray-800 font-semibold text-sm">
              Country of Resident <span className="text-red-500">*</span>
            </Label>
            <Select value={data.currCountry} onValueChange={(value) => setData({ ...data, currCountry: value })}>
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {countryOptions.length > 0 ? (
                  countryOptions.map((option, index) => {
                    const key = option.country_pk_code || option.id || option.code || `curr-country-${index}`
                    const value = String(option.country_pk_code || option.id || option.code || index)
                    const label = option.country || option.name || option.label || 'Unknown'
                    
                    return (
                      <SelectItem key={key} value={value}>
                        {label}
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="currDzongkhag" className="text-gray-800 font-semibold text-sm">
              {data.currCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Dzongkhag' : 'State'} <span className="text-red-500">*</span>
            </Label>
            {data.currCountry && !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? (
              <Input
                id="currDzongkhag"
                placeholder="Enter State"
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.currDzongkhag || ""}
                onChange={(e) => setData({ ...data, currDzongkhag: e.target.value })}
              />
            ) : (
            <Select 
              value={data.currCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? data.currDzongkhag : ''} 
              onValueChange={(value) => setData({ ...data, currDzongkhag: value })}
              disabled={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            >
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {dzongkhagOptions.length > 0 ? (
                  dzongkhagOptions.map((option, index) => {
                    const key = option.dzongkhag_pk_code || option.id || option.code || `curr-dzo-${index}`
                    const value = String(option.dzongkhag_pk_code || option.id || option.code || index)
                    const label = option.dzongkhag || option.name || option.label || 'Unknown'
                    
                    return (
                      <SelectItem key={key} value={value}>
                        {label}
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                )}
              </SelectContent>
            </Select>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="currGewog" className="text-gray-800 font-semibold text-sm">
              {data.currCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Gewog' : 'Province'} <span className="text-red-500">*</span>
            </Label>
            {data.currCountry && !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? (
              <Input
                id="currGewog"
                placeholder="Enter Province"
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.currGewog || ""}
                onChange={(e) => setData({ ...data, currGewog: e.target.value })}
              />
            ) : (
            <Select 
              value={data.currCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? data.currGewog : ''} 
              onValueChange={(value) => setData({ ...data, currGewog: value })}
              disabled={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            >
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {currGewogOptions.length > 0 ? (
                  currGewogOptions.map((option, index) => {
                    const key = option.gewog_pk_code || option.id || option.code || `curr-gewog-${index}`
                    const value = String(option.gewog_pk_code || option.id || option.code || index)
                    const label = option.gewog || option.name || option.label || 'Unknown'
                    
                    return (
                      <SelectItem key={key} value={value}>
                        {label}
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="loading" disabled>{data.currDzongkhag ? 'Loading...' : 'Select Dzongkhag first'}</SelectItem>
                )}
              </SelectContent>
            </Select>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="currVillage" className="text-gray-800 font-semibold text-sm">
              {data.currCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Village/Street' : 'Street'} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="currVillage"
              placeholder={data.currCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Enter Village/Street' : 'Enter Street'}
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.currVillage || ""}
              onChange={(e) => setData({ ...data, currVillage: e.target.value })}
              disabled={!data.currCountry}
            />
          </div>
        </div>

        {/* Conditional grid layout based on country */}
        {data.currCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2.5">
            <Label htmlFor="currFlat" className="text-gray-800 font-semibold text-sm">
              House/Building/ Flat No <span className="text-red-500">*</span>
            </Label>
            <Input
              id="currFlat"
              placeholder="Enter Flat No"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.currFlat || ""}
              onChange={(e) => setData({ ...data, currFlat: e.target.value })}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="currEmail" className="text-gray-800 font-semibold text-sm">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="currEmail"
              type="email"
              placeholder="Enter Your Email"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.currEmail || ""}
              onChange={(e) => setData({ ...data, currEmail: e.target.value })}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="currContact" className="text-gray-800 font-semibold text-sm">
              Contact Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="currContact"
              placeholder="Enter Contact No"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.currContact || ""}
              onChange={(e) => setData({ ...data, currContact: e.target.value })}
            />
          </div>
        </div>
        )}

        {data.currCountry && !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <Label htmlFor="currEmail" className="text-gray-800 font-semibold text-sm">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="currEmail"
              type="email"
              placeholder="Enter Your Email"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.currEmail || ""}
              onChange={(e) => setData({ ...data, currEmail: e.target.value })}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="currContact" className="text-gray-800 font-semibold text-sm">
              Contact Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="currContact"
              placeholder="Enter Contact No"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.currContact || ""}
              onChange={(e) => setData({ ...data, currContact: e.target.value })}
            />
          </div>
        </div>
        )}

        {/* Document Upload for Non-Bhutan Countries */}
        {data.currCountry && !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) && (
          <div className="space-y-2.5 border-t pt-4">
            <Label htmlFor="currAddressProof" className="text-gray-800 font-semibold text-sm">
              Upload Address Proof Document <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="currAddressProof"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('currAddressProof', e.target.files?.[0] || null)}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-28 bg-transparent"
                onClick={() => document.getElementById('currAddressProof')?.click()}
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {data.currAddressProof || 'No file chosen'}
              </span>
            </div>
            {errors.currAddressProof && (
              <p className="text-xs text-red-500 mt-1">{errors.currAddressProof}</p>
            )}
            <p className="text-xs text-gray-500">Please upload a valid address proof document for non-Bhutan residence. Allowed: PDF, JPG, PNG (Max 5MB)</p>
          </div>
        )}

        <div className="space-y-2.5">
          <Label htmlFor="currAlternateContact" className="text-gray-800 font-semibold text-sm">Alternate Contact No</Label>
          <Input
            id="currAlternateContact"
            placeholder="Enter Contact No"
            className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
            value={data.currAlternateContact || ""}
            onChange={(e) => setData({ ...data, currAlternateContact: e.target.value })}
          />
        </div>
      </div>

      {/* PEP Declaration */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">PEP Declaration</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-2.5">
            <Label htmlFor="pepPerson" className="text-gray-800 font-semibold text-sm">Politically Exposed Person<span className="text-destructive">*</span></Label>
            <Select value={data.pepPerson} onValueChange={(value) => setData({ ...data, pepPerson: value })}>
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
            <Label htmlFor="pepSubCategory" className="text-gray-800 font-semibold text-sm">PEP Sub Category<span className="text-destructive">*</span></Label>
            <Select
              value={data.pepPerson === 'yes' ? data.pepSubCategory : ''}
              onValueChange={(value) => setData({ ...data, pepSubCategory: value })}
              disabled={data.pepPerson !== 'yes'}
            >
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {pepSubCategoryOptions.length > 0 ? (
                  pepSubCategoryOptions.map((option, index) => {
                    const key = option.pep_sub_category_pk_code || option.id || option.code || `pep-sub-${index}`
                    const value = String(option.pep_sub_category_pk_code || option.id || option.code || index)
                    const label = option.pep_sub_category || option.name || option.label || 'Unknown'
                    
                    return (
                      <SelectItem key={key} value={value}>
                        {label}
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="pepRelated" className="text-gray-800 font-semibold text-sm">Are you related to any PEP?<span className="text-destructive">*</span></Label>
            <Select 
              value={data.pepPerson === 'no' ? data.pepRelated : ''} 
              onValueChange={(value) => setData({ ...data, pepRelated: value })}
              disabled={data.pepPerson !== 'no'}
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
            <Label htmlFor="pepRelationship" className="text-gray-800 font-semibold text-sm">Relationship<span className="text-destructive">*</span></Label>
            <Select
              value={data.pepPerson === 'no' && data.pepRelated === 'yes' ? data.pepRelationship : ''}
              onValueChange={(value) => setData({ ...data, pepRelationship: value })}
              disabled={data.pepPerson !== 'no' || data.pepRelated !== 'yes'}
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
            <Label htmlFor="pepIdentification" className="text-gray-800 font-semibold text-sm">
              Identification No. <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pepIdentification"
              placeholder="Enter Identification No"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.pepPerson === 'no' && data.pepRelated === 'yes' ? data.pepIdentification || "" : ''}
              onChange={(e) => setData({ ...data, pepIdentification: e.target.value })}
              disabled={data.pepPerson !== 'no' || data.pepRelated !== 'yes'}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="pepCategory" className="text-gray-800 font-semibold text-sm">PEP Category<span className="text-destructive">*</span></Label>
            <Select
              value={data.pepPerson === 'no' && data.pepRelated === 'yes' ? data.pepCategory : ''}
              onValueChange={(value) => setData({ ...data, pepCategory: value })}
              disabled={data.pepPerson !== 'no' || data.pepRelated !== 'yes'}
            >
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {pepCategoryOptions.length > 0 ? (
                  pepCategoryOptions.map((option, index) => {
                    const key = option.pep_category_pk_code || option.id || option.code || `pep-cat-${index}`
                    const value = String(option.pep_category_pk_code || option.id || option.code || index)
                    const label = option.pep_category || option.name || option.label || 'Unknown'
                    return (
                      <SelectItem key={key} value={value}>
                        {label}
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="pepSubCat2" className="text-gray-800 font-semibold text-sm">PEP Sub Category<span className="text-destructive">*</span></Label>
            <Select
              value={data.pepPerson === 'no' && data.pepRelated === 'yes' ? data.pepSubCat2 : ''}
              onValueChange={(value) => setData({ ...data, pepSubCat2: value })}
              disabled={data.pepPerson !== 'no' || data.pepRelated !== 'yes'}
            >
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {relatedPepSubCategoryOptions.length > 0 ? (
                  relatedPepSubCategoryOptions.map((option, index) => {
                    const key = option.pep_sub_category_pk_code || option.id || option.code || `pep-rel-sub-${index}`
                    const value = String(option.pep_sub_category_pk_code || option.id || option.code || index)
                    const label = option.pep_sub_category || option.name || option.label || 'Unknown'
                    return (
                      <SelectItem key={key} value={value}>
                        {label}
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="uploadId" className="text-gray-800 font-semibold text-sm">
            Upload Identification Proof <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="uploadId"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange('identificationProof', e.target.files?.[0] || null)}
              disabled={data.pepPerson !== 'no' || data.pepRelated !== 'yes'}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-28 bg-transparent"
              onClick={() => document.getElementById('uploadId')?.click()}
              disabled={data.pepPerson !== 'no' || data.pepRelated !== 'yes'}
            >
              Choose File
            </Button>
            <span className="text-sm text-muted-foreground">
              {data.pepPerson === 'no' && data.pepRelated === 'yes' ? (data.identificationProof || 'No file chosen') : 'No file chosen'}
            </span>
          </div>
        </div>
      </div>

      {/* Related to BIL */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">Related to BIL</h2>

        <div className="space-y-2.5">
          <Label htmlFor="relatedToBil" className="text-gray-800 font-semibold text-sm">
            Related to BIL <span className="text-red-500">*</span>
          </Label>
          <Select value={data.relatedToBil} onValueChange={(value) => setData({ ...data, relatedToBil: value })}>
            <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent sideOffset={4}>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Employment Status */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">Employment Status</h2>

        <div className="space-y-4">
          <Label className="text-gray-800 font-semibold text-xs sm:text-sm">Employment Status <span className="text-red-500">*</span></Label>
          <RadioGroup
            value={data.employmentStatus}
            onValueChange={(value) => setData({ ...data, employmentStatus: value })}
            className="flex flex-col sm:flex-row gap-3 sm:gap-6 md:gap-8"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="employed" id="employed" />
              <Label htmlFor="employed" className="font-normal cursor-pointer text-sm">
                Employed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unemployed" id="unemployed" />
              <Label htmlFor="unemployed" className="font-normal cursor-pointer text-sm">
                Unemployed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="self-employed" id="self-employed" />
              <Label htmlFor="self-employed" className="font-normal cursor-pointer text-sm">
                Self-employed
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Employment Details */}
      {data.employmentStatus === "employed" && (
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 shadow-sm">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-2 sm:pb-3 md:pb-4">Employment Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="space-y-2.5">
              <Label htmlFor="occupation" className="text-gray-800 font-semibold text-sm">
                Occupation <span className="text-red-500">*</span>
              </Label>
              <Select value={data.occupation} onValueChange={(value) => setData({ ...data, occupation: value })}>
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {occupationOptions.length > 0 ? (
                    occupationOptions.map((option, index) => {
                      const key = option.occ_pk_code || option.occupation_pk_code || option.id || `occupation-${index}`
                      const value = String(option.occ_pk_code || option.occupation_pk_code || option.id || index)
                      const label = option.occ_name || option.occupation || option.name || 'Unknown'
                      
                      return (
                        <SelectItem key={key} value={label}>
                          {label}
                        </SelectItem>
                      )
                    })
                  ) : (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="organizationName" className="text-gray-800 font-semibold text-sm">
                Organization Name <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.organizationName}
                onValueChange={(value) => setData({ ...data, organizationName: value })}
              >
                <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {organizationOptions.length > 0 ? (
                    organizationOptions.map((option, index) => {
                      const key = option.lgal_constitution_pk_code || option.legal_const_pk_code || option.id || `org-${index}`
                      const value = String(option.lgal_constitution_pk_code || option.legal_const_pk_code || option.id || index)
                      const label = option.lgal_constitution || option.legal_const_name || option.name || 'Unknown'
                      
                      return (
                        <SelectItem key={key} value={value}>
                          {label}
                        </SelectItem>
                      )
                    })
                  ) : (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="employerType" className="text-gray-800 font-semibold text-sm">
                Type of Employer <span className="text-red-500">*</span>
              </Label>
              <Select value={data.employerType} onValueChange={(value) => setData({ ...data, employerType: value })}>
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
              <Label htmlFor="orgLocation" className="text-gray-800 font-semibold text-sm">
                Organization Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="orgLocation"
                placeholder="Enter Full Name"
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.orgLocation || ""}
                onChange={(e) => setData({ ...data, orgLocation: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2.5">
              <Label htmlFor="employeeId" className="text-gray-800 font-semibold text-sm">
                Employee ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="employeeId"
                placeholder="Enter ID"
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.employeeId || ""}
                onChange={(e) => setData({ ...data, employeeId: e.target.value })}
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="joiningDate" className="text-gray-800 font-semibold text-sm">
                Service Joining Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                id="joiningDate"
                max={today}
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.joiningDate || ""}
                onChange={(e) => setData({ ...data, joiningDate: e.target.value })}
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="designation" className="text-gray-800 font-semibold text-sm">
                Designation <span className="text-red-500">*</span>
              </Label>
              <Select value={data.designation} onValueChange={(value) => setData({ ...data, designation: value })}>
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
              <Label htmlFor="grade" className="text-gray-800 font-semibold text-sm">
                Grade <span className="text-red-500">*</span>
              </Label>
              <Select value={data.grade} onValueChange={(value) => setData({ ...data, grade: value })}>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label htmlFor="serviceNature" className="text-gray-800 font-semibold text-sm">Nature of Service <span className="text-red-500">*</span></Label>
              <Select value={data.serviceNature} onValueChange={(value) => setData({ ...data, serviceNature: value })}>
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
              <Label htmlFor="annualSalary" className="text-gray-800 font-semibold text-sm">
                Gross Annual Salary Income <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                id="annualSalary"
                placeholder="Enter Annual Salary"
                className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                value={data.annualSalary || ""}
                onChange={(e) => setData({ ...data, annualSalary: e.target.value })}
              />
            </div>
          </div>

          {/* Contract End Date - Only visible when Nature of Service is Contract */}
          {data.serviceNature === "contract" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label htmlFor="contractEndDate" className="text-gray-800 font-semibold text-sm">
                  Contract End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  id="contractEndDate"
                  min={today}
                  className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
                  value={data.contractEndDate || ""}
                  onChange={(e) => setData({ ...data, contractEndDate: e.target.value })}
                  required
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 md:gap-6 pt-3 sm:pt-4">
        <Button type="button" onClick={onBack} variant="secondary" size="lg" className="w-full sm:w-auto sm:min-w-32 md:min-w-40 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all">
          Back
        </Button>
        <Button type="submit" size="lg" className="w-full sm:w-auto sm:min-w-32 md:min-w-40 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-[#003DA5] hover:bg-[#002D7A]">
          Next
        </Button>
      </div>

      {/* Co-Borrower Confirmation Dialog */}
      <AlertDialog open={showCoBorrowerDialog} onOpenChange={setShowCoBorrowerDialog}>
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
  )
}


