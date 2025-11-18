"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { fetchMaritalStatus, fetchNationality, fetchIdentificationType, fetchCountry, fetchDzongkhag, fetchGewogsByDzongkhag, fetchOccupations } from "@/services/api"

interface CoBorrowerDetailsFormProps {
  onNext: (data: any) => void
  onBack: () => void
  formData: any
}

export function CoBorrowerDetailsForm({ onNext, onBack, formData }: CoBorrowerDetailsFormProps) {
  const [data, setData] = useState(formData.coBorrowerDetails || {})
  const [coBorrowers, setCoBorrowers] = useState<any[]>(formData.coBorrowers || [{}])
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([])
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([])
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<any[]>([])
  const [countryOptions, setCountryOptions] = useState<any[]>([])
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([])
  const [permGewogOptions, setPermGewogOptions] = useState<any[]>([])
  const [currGewogOptions, setCurrGewogOptions] = useState<any[]>([])
  const [occupationOptions, setOccupationOptions] = useState<any[]>([])

  useEffect(() => {
    // Load all initial API data
    const loadAllData = async () => {
      try {
        const [maritalStatus, nationality, identificationType, country, dzongkhag, occupations] = await Promise.all([
          fetchMaritalStatus().catch(() => []),
          fetchNationality().catch(() => []),
          fetchIdentificationType().catch(() => []),
          fetchCountry().catch(() => []),
          fetchDzongkhag().catch(() => []),
          fetchOccupations().catch(() => [])
        ])

        setMaritalStatusOptions(maritalStatus)
        setNationalityOptions(nationality)
        setIdentificationTypeOptions(identificationType)
        setCountryOptions(country)
        setDzongkhagOptions(dzongkhag)
        setOccupationOptions(occupations)
      } catch (error) {
        console.error('Failed to load dropdown data:', error)
      }
    }

    loadAllData()
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext({ coBorrowerDetails: data, coBorrowers })
  }

  const addCoBorrower = () => {
    setCoBorrowers([...coBorrowers, {}])
  }

  const removeCoBorrower = (index: number) => {
    const updatedCoBorrowers = coBorrowers.filter((_, i) => i !== index)
    setCoBorrowers(updatedCoBorrowers)
  }

  const updateCoBorrower = (index: number, field: string, value: any) => {
    const updatedCoBorrowers = [...coBorrowers]
    updatedCoBorrowers[index] = { ...updatedCoBorrowers[index], [field]: value }
    setCoBorrowers(updatedCoBorrowers)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Co-Borrower Personal Information */}
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold">Co-Borrower Personal Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="co-salutation">
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
            <Label htmlFor="co-name">
              Co-Borrower Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="co-name"
              placeholder="Enter Full Name"
              value={data.name || ""}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="co-nationality">
              Nationality <span className="text-destructive">*</span>
            </Label>
            <Select value={data.nationality} onValueChange={(value) => setData({ ...data, nationality: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                {nationalityOptions.length > 0 ? (
                  nationalityOptions.map((option, index) => {
                    const key = option.nationality_pk_code || option.id || `nationality-${index}`
                    const value = String(option.nationality_pk_code || option.id || index)
                    const label = option.nationality || option.name || 'Unknown'
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
            <Label htmlFor="co-identificationType">
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
                    const key = option.identity_type_pk_code || option.id || `id-${index}`
                    const value = String(option.identity_type_pk_code || option.id || index)
                    const label = option.identity_type || option.name || 'Unknown'
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
            <Label htmlFor="co-identificationNo">
              Identification No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="co-identificationNo"
              placeholder="Enter identification No"
              value={data.identificationNo || ""}
              onChange={(e) => setData({ ...data, identificationNo: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="co-identificationIssueDate">
              Issue Date <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              id="co-identificationIssueDate"
              value={data.identificationIssueDate || ""}
              onChange={(e) => setData({ ...data, identificationIssueDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="co-identificationExpiryDate">
              Expiry Date <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              id="co-identificationExpiryDate"
              value={data.identificationExpiryDate || ""}
              onChange={(e) => setData({ ...data, identificationExpiryDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="co-dateOfBirth">
              Date of Birth <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              id="co-dateOfBirth"
              value={data.dateOfBirth || ""}
              onChange={(e) => setData({ ...data, dateOfBirth: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="co-tpn">
              TPN No <span className="text-destructive">*</span>
            </Label>
            <Input
              id="co-tpn"
              placeholder="Enter TPN"
              value={data.tpn || ""}
              onChange={(e) => setData({ ...data, tpn: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="co-maritalStatus">
              Marital Status <span className="text-destructive">*</span>
            </Label>
            <Select value={data.maritalStatus} onValueChange={(value) => setData({ ...data, maritalStatus: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                {maritalStatusOptions.length > 0 ? (
                  maritalStatusOptions.map((option, index) => {
                    const key = option.marital_status_pk_code || option.id || `marital-${index}`
                    const value = String(option.marital_status_pk_code || option.id || index)
                    const label = option.marital_status || option.name || 'Unknown'
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
            <Label htmlFor="co-gender">
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
            <Label htmlFor="co-relationship">
              Relationship to Borrower <span className="text-destructive">*</span>
            </Label>
            <Select value={data.relationship} onValueChange={(value) => setData({ ...data, relationship: value })}>
              <SelectTrigger>
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

      {/* Contact Information */}
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold">Contact Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="co-email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="co-email"
              type="email"
              placeholder="Enter Email"
              value={data.email || ""}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="co-contact">
              Contact Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="co-contact"
              placeholder="Enter Contact No"
              value={data.contact || ""}
              onChange={(e) => setData({ ...data, contact: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="co-alternateContact">Alternate Contact No</Label>
            <Input
              id="co-alternateContact"
              placeholder="Enter Contact No"
              value={data.alternateContact || ""}
              onChange={(e) => setData({ ...data, alternateContact: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Permanent Address */}
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold">Permanent Address</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="co-permCountry">
              Country <span className="text-destructive">*</span>
            </Label>
            <Select value={data.permCountry} onValueChange={(value) => setData({ ...data, permCountry: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.length > 0 ? (
                  countryOptions.map((option, index) => {
                    const key = option.country_pk_code || option.id || `perm-country-${index}`
                    const value = String(option.country_pk_code || option.id || index)
                    const label = option.country || option.name || 'Unknown'
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
            <Label htmlFor="co-permDzongkhag">
              Dzongkhag <span className="text-destructive">*</span>
            </Label>
            <Select value={data.permDzongkhag} onValueChange={(value) => setData({ ...data, permDzongkhag: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                {dzongkhagOptions.length > 0 ? (
                  dzongkhagOptions.map((option, index) => {
                    const key = option.dzongkhag_pk_code || option.id || `perm-dzo-${index}`
                    const value = String(option.dzongkhag_pk_code || option.id || index)
                    const label = option.dzongkhag || option.name || 'Unknown'
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
            <Label htmlFor="co-permGewog">
              Gewog <span className="text-destructive">*</span>
            </Label>
            <Select value={data.permGewog} onValueChange={(value) => setData({ ...data, permGewog: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                {permGewogOptions.length > 0 ? (
                  permGewogOptions.map((option, index) => {
                    const key = option.gewog_pk_code || option.id || `perm-gewog-${index}`
                    const value = String(option.gewog_pk_code || option.id || index)
                    const label = option.gewog || option.name || 'Unknown'
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
            <Label htmlFor="co-permVillage">
              Village/Street <span className="text-destructive">*</span>
            </Label>
            <Input
              id="co-permVillage"
              placeholder="Enter Village/Street"
              value={data.permVillage || ""}
              onChange={(e) => setData({ ...data, permVillage: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Current Address */}
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold">Current/Residential Address</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="co-currCountry">
              Country of Resident <span className="text-destructive">*</span>
            </Label>
            <Select value={data.currCountry} onValueChange={(value) => setData({ ...data, currCountry: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.length > 0 ? (
                  countryOptions.map((option, index) => {
                    const key = option.country_pk_code || option.id || `curr-country-${index}`
                    const value = String(option.country_pk_code || option.id || index)
                    const label = option.country || option.name || 'Unknown'
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
            <Label htmlFor="co-currDzongkhag">
              Dzongkhag <span className="text-destructive">*</span>
            </Label>
            <Select value={data.currDzongkhag} onValueChange={(value) => setData({ ...data, currDzongkhag: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                {dzongkhagOptions.length > 0 ? (
                  dzongkhagOptions.map((option, index) => {
                    const key = option.dzongkhag_pk_code || option.id || `curr-dzo-${index}`
                    const value = String(option.dzongkhag_pk_code || option.id || index)
                    const label = option.dzongkhag || option.name || 'Unknown'
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
            <Label htmlFor="co-currGewog">
              Gewog <span className="text-destructive">*</span>
            </Label>
            <Select value={data.currGewog} onValueChange={(value) => setData({ ...data, currGewog: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                {currGewogOptions.length > 0 ? (
                  currGewogOptions.map((option, index) => {
                    const key = option.gewog_pk_code || option.id || `curr-gewog-${index}`
                    const value = String(option.gewog_pk_code || option.id || index)
                    const label = option.gewog || option.name || 'Unknown'
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
            <Label htmlFor="co-currVillage">
              Village/Street <span className="text-destructive">*</span>
            </Label>
            <Input
              id="co-currVillage"
              placeholder="Enter Village/Street"
              value={data.currVillage || ""}
              onChange={(e) => setData({ ...data, currVillage: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="co-currFlat">
              House/Building/Flat No <span className="text-destructive">*</span>
            </Label>
            <Input
              id="co-currFlat"
              placeholder="Enter Flat No"
              value={data.currFlat || ""}
              onChange={(e) => setData({ ...data, currFlat: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* PEP Declaration */}
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold">PEP Declaration</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="co-pepPerson">Politically Exposed Person*</Label>
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
            <Label htmlFor="co-pepSubCategory">PEP Sub Category*</Label>
            <Input
              id="co-pepSubCategory"
              placeholder="Enter Sub Category"
              value={data.pepSubCategory || ""}
              onChange={(e) => setData({ ...data, pepSubCategory: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="co-pepRelated">Is he/she related to any PEP?*</Label>
            <Select value={data.pepRelated} onValueChange={(value) => setData({ ...data, pepRelated: value })}>
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
            <Label htmlFor="co-pepRelationship">Relationship*</Label>
            <Select
              value={data.pepRelationship}
              onValueChange={(value) => setData({ ...data, pepRelationship: value })}
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
            <Label htmlFor="co-pepIdentification">
              Identification No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="co-pepIdentification"
              placeholder="Enter Identification No"
              value={data.pepIdentification || ""}
              onChange={(e) => setData({ ...data, pepIdentification: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="co-pepCategory">PEP Category*</Label>
            <Input
              id="co-pepCategory"
              placeholder="Enter Category"
              value={data.pepCategory || ""}
              onChange={(e) => setData({ ...data, pepCategory: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="co-pepSubCat2">PEP Sub Category*</Label>
            <Input
              id="co-pepSubCat2"
              placeholder="Enter Sub Category"
              value={data.pepSubCat2 || ""}
              onChange={(e) => setData({ ...data, pepSubCat2: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="co-uploadId">
            Upload Identification Proof <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="w-28 bg-transparent">
              Choose File
            </Button>
            <span className="text-sm text-muted-foreground">No file chosen</span>
          </div>
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
              <RadioGroupItem value="employed" id="co-employed" />
              <Label htmlFor="co-employed" className="font-normal cursor-pointer">
                Employed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unemployed" id="co-unemployed" />
              <Label htmlFor="co-unemployed" className="font-normal cursor-pointer">
                Unemployed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="self-employed" id="co-self-employed" />
              <Label htmlFor="co-self-employed" className="font-normal cursor-pointer">
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
              <Label htmlFor="co-occupation">
                Occupation <span className="text-destructive">*</span>
              </Label>
              <Select value={data.occupation} onValueChange={(value) => setData({ ...data, occupation: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  {occupationOptions.length > 0 ? (
                    occupationOptions.map((option, index) => {
                      const key = option.occ_pk_code || option.id || `occupation-${index}`
                      const value = String(option.occ_pk_code || option.id || index)
                      const label = option.occ_name || option.name || 'Unknown'
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
              <Label htmlFor="co-organizationName">
                Organization Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="co-organizationName"
                placeholder="Enter Organization Name"
                value={data.organizationName || ""}
                onChange={(e) => setData({ ...data, organizationName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="co-employerType">
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
              <Label htmlFor="co-annualSalary">
                Annual Salary Income <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                id="co-annualSalary"
                placeholder="Enter Annual Salary"
                value={data.annualSalary || ""}
                onChange={(e) => setData({ ...data, annualSalary: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Additional Co-Borrowers */}
      {coBorrowers.length > 1 && coBorrowers.slice(1).map((coBorrower, index) => {
        const actualIndex = index + 1
        return (
          <div key={actualIndex} className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Additional Co-Borrower {actualIndex}</h2>
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
              <h3 className="text-lg font-semibold">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Salutation <span className="text-destructive">*</span></Label>
                  <Select
                    value={coBorrower.salutation}
                    onValueChange={(value) => updateCoBorrower(actualIndex, "salutation", value)}
                  >
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
                  <Label>Co-Borrower Name <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Enter Full Name"
                    value={coBorrower.name || ""}
                    onChange={(e) => updateCoBorrower(actualIndex, "name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nationality <span className="text-destructive">*</span></Label>
                  <Select
                    value={coBorrower.nationality}
                    onValueChange={(value) => updateCoBorrower(actualIndex, "nationality", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bhutanese">Bhutanese</SelectItem>
                      <SelectItem value="indian">Indian</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Identification Type <span className="text-destructive">*</span></Label>
                  <Select
                    value={coBorrower.identificationType}
                    onValueChange={(value) => updateCoBorrower(actualIndex, "identificationType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cid">Citizenship ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="work_permit">Work Permit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Identification No. <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Enter identification No"
                    value={coBorrower.identificationNo || ""}
                    onChange={(e) => updateCoBorrower(actualIndex, "identificationNo", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={coBorrower.dateOfBirth || ""}
                    onChange={(e) => updateCoBorrower(actualIndex, "dateOfBirth", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Address <span className="text-destructive">*</span></Label>
                  <Input
                    type="email"
                    placeholder="Enter Email"
                    value={coBorrower.email || ""}
                    onChange={(e) => updateCoBorrower(actualIndex, "email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Number <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Enter Contact No"
                    value={coBorrower.contact || ""}
                    onChange={(e) => updateCoBorrower(actualIndex, "contact", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Relationship to Borrower <span className="text-destructive">*</span></Label>
                  <Select
                    value={coBorrower.relationship}
                    onValueChange={(value) => updateCoBorrower(actualIndex, "relationship", value)}
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label>Annual Income (Nu.) <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    placeholder="Enter Annual Income"
                    value={coBorrower.annualIncome || ""}
                    onChange={(e) => updateCoBorrower(actualIndex, "annualIncome", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Occupation</Label>
                  <Input
                    placeholder="Enter Occupation"
                    value={coBorrower.occupation || ""}
                    onChange={(e) => updateCoBorrower(actualIndex, "occupation", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )
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
