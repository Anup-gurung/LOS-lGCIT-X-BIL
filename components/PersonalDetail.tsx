"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { fetchMaritalStatus, fetchBanks, fetchNationality, fetchIdentificationType, fetchCountry, fetchDzongkhag, fetchGewogsByDzongkhag, fetchOccupations, fetchLegalConstitution } from "@/services/api"

interface PersonalDetailsFormProps {
  onNext: (data: any) => void
  onBack: () => void
  formData: any
  isFirstStep: boolean
}

export function PersonalDetailsForm({ onNext, onBack, formData }: PersonalDetailsFormProps) {
  const [data, setData] = useState(formData.personalDetails || {})
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

  useEffect(() => {
    // Fetch marital status options from API
    const loadMaritalStatus = async () => {
      try {
        const options = await fetchMaritalStatus()
        setMaritalStatusOptions(options)
      } catch (error) {
        console.error('Failed to load marital status:', error)
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
        console.error('Failed to load banks:', error)
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
        console.error('Failed to load nationality:', error)
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
        console.error('Failed to load identification type:', error)
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
        console.error('Failed to load country:', error)
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
        console.error('Failed to load dzongkhag:', error)
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
        console.error('Failed to load occupations:', error)
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
        console.error('Failed to load organizations:', error)
        setOrganizationOptions([
          { id: 'org1', name: 'Organization 1' },
          { id: 'org2', name: 'Organization 2' }
        ])
      }
    }

    loadOrganizations()
  }, [])

  // Load permanent gewogs when permanent dzongkhag changes
  useEffect(() => {
    const loadPermGewogs = async () => {
      if (data.permDzongkhag) {
        try {
          const options = await fetchGewogsByDzongkhag(data.permDzongkhag)
          setPermGewogOptions(options)
        } catch (error) {
          console.error('Failed to load permanent gewogs:', error)
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
          console.error('Failed to load current gewogs:', error)
          setCurrGewogOptions([])
        }
      }
    }
    loadCurrGewogs()
  }, [data.currDzongkhag])

  const handleFileChange = (fieldName: string, file: File | null) => {
    if (file) {
      setData({ ...data, [fieldName]: file.name })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext({ personalDetails: data })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Application Personal Information */}
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold">Application Personal Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="salutation">
              Salutation <span className="text-destructive">*</span>
            </Label>
            <Select value={data.salutation} onValueChange={(value) => setData({ ...data, salutation: value })}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="applicantName">
              Applicant Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="applicantName"
              placeholder="Enter Your Full Name"
              value={data.applicantName || ""}
              onChange={(e) => setData({ ...data, applicantName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">
              Nationality <span className="text-destructive">*</span>
            </Label>
            <Select value={data.nationality} onValueChange={(value) => setData({ ...data, nationality: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
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

          <div className="space-y-2">
            <Label htmlFor="identificationType">
              Identification Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.identificationType}
              onValueChange={(value) => setData({ ...data, identificationType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="identificationNo">
              Identification No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="identificationNo"
              placeholder="Enter identification No"
              value={data.identificationNo || ""}
              onChange={(e) => setData({ ...data, identificationNo: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="identificationIssueDate">
              Identification Issue Date <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              id="identificationIssueDate"
              value={data.identificationIssueDate || ""}
              onChange={(e) => setData({ ...data, identificationIssueDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="identificationExpiryDate">
              Identification Expiry Date <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              id="identificationExpiryDate"
              value={data.identificationExpiryDate || ""}
              onChange={(e) => setData({ ...data, identificationExpiryDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">
              Date of Birth <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              id="dateOfBirth"
              value={data.dateOfBirth || ""}
              onChange={(e) => setData({ ...data, dateOfBirth: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tpn">
              TPN No <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tpn"
              placeholder="Enter TPN"
              value={data.tpn || ""}
              onChange={(e) => setData({ ...data, tpn: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maritalStatus">
              Marital Status <span className="text-destructive">*</span>
            </Label>
            <Select value={data.maritalStatus} onValueChange={(value) => setData({ ...data, maritalStatus: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
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

          <div className="space-y-2">
            <Label htmlFor="gender">
              Gender <span className="text-destructive">*</span>
            </Label>
            <Select value={data.gender} onValueChange={(value) => setData({ ...data, gender: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spouseName">
              Spouse Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="spouseName"
              placeholder="Enter Full Name"
              value={data.spouseName || ""}
              onChange={(e) => setData({ ...data, spouseName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="spouseCid">
              Spouse CID No <span className="text-destructive">*</span>
            </Label>
            <Input
              id="spouseCid"
              placeholder="Enter CID No"
              value={data.spouseCid || ""}
              onChange={(e) => setData({ ...data, spouseCid: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spouseContact">
              Spouse Contact No <span className="text-destructive">*</span>
            </Label>
            <Input
              id="spouseContact"
              placeholder="Enter Contact No"
              value={data.spouseContact || ""}
              onChange={(e) => setData({ ...data, spouseContact: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uploadFamilyTree">
              Upload Family Tree <span className="text-destructive">*</span>
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bankAccount">
              Bank Saving Account No <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bankAccount"
              placeholder="Enter saving account number"
              value={data.bankAccount || ""}
              onChange={(e) => setData({ ...data, bankAccount: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">
              Name of Bank <span className="text-destructive">*</span>
            </Label>
            <Select value={data.bankName} onValueChange={(value) => setData({ ...data, bankName: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
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

        <div className="space-y-2">
          <Label htmlFor="uploadPassport">
            Upload Passport-size Photograph <span className="text-destructive">*</span>
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
        </div>
      </div>

      {/* Permanent Address */}
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold">Permanent Address</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="permCountry">
              Country <span className="text-destructive">*</span>
            </Label>
            <Select value={data.permCountry} onValueChange={(value) => setData({ ...data, permCountry: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
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

          <div className="space-y-2">
            <Label htmlFor="permDzongkhag">
              Dzongkhag <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={data.permCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? data.permDzongkhag : ''} 
              onValueChange={(value) => setData({ ...data, permDzongkhag: value })}
              disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            >
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="permGewog">
              Gewog <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={data.permCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? data.permGewog : ''} 
              onValueChange={(value) => setData({ ...data, permGewog: value })}
              disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            >
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="permVillage">
              Village/Street <span className="text-destructive">*</span>
            </Label>
            <Input
              id="permVillage"
              placeholder="Enter Village/Street"
              value={data.permCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? data.permVillage || "" : ''}
              onChange={(e) => setData({ ...data, permVillage: e.target.value })}
              disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="permThram">
              Thram No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="permThram"
              placeholder="Enter Thram No"
              value={data.permCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? data.permThram || "" : ''}
              onChange={(e) => setData({ ...data, permThram: e.target.value })}
              disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="permHouse">
              House No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="permHouse"
              placeholder="Enter House No"
              value={data.permCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? data.permHouse || "" : ''}
              onChange={(e) => setData({ ...data, permHouse: e.target.value })}
              disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            />
          </div>
        </div>

        {/* Document Upload for Non-Bhutan Countries */}
        {data.permCountry && !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) && (
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="permAddressProof">
              Upload Address Proof Document <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="w-28 bg-transparent">
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {data.permAddressProofFile ? data.permAddressProofFile.name : 'No file chosen'}
              </span>
            </div>
            <p className="text-xs text-gray-500">Please upload a valid address proof document for non-Bhutan residence</p>
          </div>
        )}
      </div>

      {/* Current/Residential Address */}
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold">Current/Residential Address</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currCountry">
              Country of Resident <span className="text-destructive">*</span>
            </Label>
            <Select value={data.currCountry} onValueChange={(value) => setData({ ...data, currCountry: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
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

          <div className="space-y-2">
            <Label htmlFor="currDzongkhag">
              Dzongkhag <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={data.currCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? data.currDzongkhag : ''} 
              onValueChange={(value) => setData({ ...data, currDzongkhag: value })}
              disabled={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            >
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="currGewog">
              Gewog <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={data.currCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? data.currGewog : ''} 
              onValueChange={(value) => setData({ ...data, currGewog: value })}
              disabled={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            >
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="currVillage">
              Village/Street <span className="text-destructive">*</span>
            </Label>
            <Input
              id="currVillage"
              placeholder="Enter Village/Street"
              value={data.currCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? data.currVillage || "" : ''}
              onChange={(e) => setData({ ...data, currVillage: e.target.value })}
              disabled={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currFlat">
              House/Building/ Flat No <span className="text-destructive">*</span>
            </Label>
            <Input
              id="currFlat"
              placeholder="Enter Flat No"
              value={data.currCountry && countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? data.currFlat || "" : ''}
              onChange={(e) => setData({ ...data, currFlat: e.target.value })}
              disabled={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currEmail">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="currEmail"
              type="email"
              placeholder="Enter Your Email"
              value={data.currEmail || ""}
              onChange={(e) => setData({ ...data, currEmail: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currContact">
              Contact Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="currContact"
              placeholder="Enter Contact No"
              value={data.currContact || ""}
              onChange={(e) => setData({ ...data, currContact: e.target.value })}
            />
          </div>
        </div>

        {/* Document Upload for Non-Bhutan Countries */}
        {data.currCountry && !countryOptions.find(c => String(c.country_pk_code || c.id || c.code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) && (
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="currAddressProof">
              Upload Address Proof Document <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="w-28 bg-transparent">
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {data.currAddressProofFile ? data.currAddressProofFile.name : 'No file chosen'}
              </span>
            </div>
            <p className="text-xs text-gray-500">Please upload a valid address proof document for non-Bhutan residence</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="currAlternateContact">Alternate Contact No</Label>
          <Input
            id="currAlternateContact"
            placeholder="Enter Contact No"
            value={data.currAlternateContact || ""}
            onChange={(e) => setData({ ...data, currAlternateContact: e.target.value })}
            className="md:w-1/3"
          />
        </div>
      </div>

      {/* PEP Declaration */}
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold">PEP Declaration</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pepPerson">Politically Exposed Person*</Label>
            <Select value={data.pepPerson} onValueChange={(value) => setData({ ...data, pepPerson: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pepSubCategory">PEP Sub Category*</Label>
            <Input
              id="pepSubCategory"
              placeholder="Enter Full Name"
              value={data.pepPerson === 'yes' ? data.pepSubCategory || "" : ''}
              onChange={(e) => setData({ ...data, pepSubCategory: e.target.value })}
              disabled={data.pepPerson !== 'yes'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pepRelated">Is he/she related to any PEP?*</Label>
            <Select 
              value={data.pepPerson === 'yes' ? data.pepRelated : ''} 
              onValueChange={(value) => setData({ ...data, pepRelated: value })}
              disabled={data.pepPerson !== 'yes'}
            >
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pepRelationship">Relationship*</Label>
            <Select
              value={data.pepPerson === 'yes' ? data.pepRelationship : ''}
              onValueChange={(value) => setData({ ...data, pepRelationship: value })}
              disabled={data.pepPerson !== 'yes'}
            >
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="pepIdentification">
              Identification No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pepIdentification"
              placeholder="Enter Identification No"
              value={data.pepPerson === 'yes' ? data.pepIdentification || "" : ''}
              onChange={(e) => setData({ ...data, pepIdentification: e.target.value })}
              disabled={data.pepPerson !== 'yes'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pepCategory">PEP Category*</Label>
            <Input
              id="pepCategory"
              placeholder="Enter Full Name"
              value={data.pepPerson === 'yes' ? data.pepCategory || "" : ''}
              onChange={(e) => setData({ ...data, pepCategory: e.target.value })}
              disabled={data.pepPerson !== 'yes'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pepSubCat2">PEP Sub Category*</Label>
            <Input
              id="pepSubCat2"
              placeholder="Enter Full Name"
              value={data.pepPerson === 'yes' ? data.pepSubCat2 || "" : ''}
              onChange={(e) => setData({ ...data, pepSubCat2: e.target.value })}
              disabled={data.pepPerson !== 'yes'}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="uploadId">
            Upload Identification Proof <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="uploadId"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange('identificationProof', e.target.files?.[0] || null)}
              disabled={data.pepPerson !== 'yes'}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-28 bg-transparent"
              onClick={() => document.getElementById('uploadId')?.click()}
              disabled={data.pepPerson !== 'yes'}
            >
              Choose File
            </Button>
            <span className="text-sm text-muted-foreground">
              {data.pepPerson === 'yes' ? (data.identificationProof || 'No file chosen') : 'No file chosen'}
            </span>
          </div>
        </div>
      </div>

      {/* Related to BIL */}
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="relatedToBil">
            Related to BIL <span className="text-destructive">*</span>
          </Label>
          <Select value={data.relatedToBil} onValueChange={(value) => setData({ ...data, relatedToBil: value })}>
            <SelectTrigger className="md:w-1/4">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bilRelationship">
            Relationship <span className="text-destructive">*</span>
          </Label>
          <Input
            id="bilRelationship"
            placeholder="Enter your Relationship"
            value={data.bilRelationship || ""}
            onChange={(e) => setData({ ...data, bilRelationship: e.target.value })}
            className="md:w-1/2"
          />
        </div>
      </div>

      {/* Employment Status */}
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <div className="space-y-4">
          <Label>Employment Status*</Label>
          <RadioGroup
            value={data.employmentStatus}
            onValueChange={(value) => setData({ ...data, employmentStatus: value })}
            className="flex gap-8"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="employed" id="employed" />
              <Label htmlFor="employed" className="font-normal cursor-pointer">
                Employed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unemployed" id="unemployed" />
              <Label htmlFor="unemployed" className="font-normal cursor-pointer">
                Unemployed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="self-employed" id="self-employed" />
              <Label htmlFor="self-employed" className="font-normal cursor-pointer">
                Self-employed
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Employment Details */}
      {data.employmentStatus === "employed" && (
        <div className="bg-card border rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold">Employment Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occupation">
                Occupation <span className="text-destructive">*</span>
              </Label>
              <Select value={data.occupation} onValueChange={(value) => setData({ ...data, occupation: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  {occupationOptions.length > 0 ? (
                    occupationOptions.map((option, index) => {
                      const key = option.occ_pk_code || option.occupation_pk_code || option.id || `occupation-${index}`
                      const value = String(option.occ_pk_code || option.occupation_pk_code || option.id || index)
                      const label = option.occ_name || option.occupation || option.name || 'Unknown'
                      
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

            <div className="space-y-2">
              <Label htmlFor="organizationName">
                Organization Name <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.organizationName}
                onValueChange={(value) => setData({ ...data, organizationName: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
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

            <div className="space-y-2">
              <Label htmlFor="employerType">
                Type of Employer <span className="text-destructive">*</span>
              </Label>
              <Select value={data.employerType} onValueChange={(value) => setData({ ...data, employerType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgLocation">
                Organization Location <span className="text-destructive">*</span>
              </Label>
              <Input
                id="orgLocation"
                placeholder="Enter Full Name"
                value={data.orgLocation || ""}
                onChange={(e) => setData({ ...data, orgLocation: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">
                Employee ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="employeeId"
                placeholder="Enter CID No"
                value={data.employeeId || ""}
                onChange={(e) => setData({ ...data, employeeId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="joiningDate">
                Service Joining Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="joiningDate"
                placeholder="Enter Contact No"
                value={data.joiningDate || ""}
                onChange={(e) => setData({ ...data, joiningDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">
                Designation* <span className="text-destructive">*</span>
              </Label>
              <Select value={data.designation} onValueChange={(value) => setData({ ...data, designation: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="officer">Officer</SelectItem>
                  <SelectItem value="assistant">Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">
                Grade <span className="text-destructive">*</span>
              </Label>
              <Select value={data.grade} onValueChange={(value) => setData({ ...data, grade: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p1">P1</SelectItem>
                  <SelectItem value="p2">P2</SelectItem>
                  <SelectItem value="p3">P3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceNature">Nature of Service*</Label>
              <Select value={data.serviceNature} onValueChange={(value) => setData({ ...data, serviceNature: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualSalary">
                Gross Annual Salary Income <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                id="annualSalary"
                placeholder="Enter Annual Salary"
                value={data.annualSalary || ""}
                onChange={(e) => setData({ ...data, annualSalary: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between gap-4">
        <Button type="button" onClick={onBack} variant="secondary" size="lg" className="min-w-32">
          Back
        </Button>
        <Button type="submit" size="lg" className="min-w-32">
          Next
        </Button>
      </div>
    </form>
  )
}
