"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { fetchNationality, fetchIdentificationType, fetchCountry, fetchDzongkhag, fetchGewogsByDzongkhag, fetchMaritalStatus } from "@/services/api"

interface SecurityDetailsFormProps {
  onNext: (data: any) => void
  onBack: () => void
  formData: any
}

export function SecurityDetailsForm({ onNext, onBack, formData }: SecurityDetailsFormProps) {
  const [data, setData] = useState(formData.securityDetails || {})
  const [guarantors, setGuarantors] = useState<any[]>([{}])
  const [securities, setSecurities] = useState<any[]>([{}])
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([])
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<any[]>([])
  const [countryOptions, setCountryOptions] = useState<any[]>([])
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([])
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([])
  const [permGewogOptions, setPermGewogOptions] = useState<any[]>([])
  const [currGewogOptions, setCurrGewogOptions] = useState<any[]>([])
  const [propertyGewogOptions, setPropertyGewogOptions] = useState<any[]>([])

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [nationality, identificationType, country, dzongkhag, maritalStatus] = await Promise.all([
          fetchNationality().catch(() => []),
          fetchIdentificationType().catch(() => []),
          fetchCountry().catch(() => []),
          fetchDzongkhag().catch(() => []),
          fetchMaritalStatus().catch(() => [])
        ])

        setNationalityOptions(nationality)
        setIdentificationTypeOptions(identificationType)
        setCountryOptions(country)
        setDzongkhagOptions(dzongkhag)
        setMaritalStatusOptions(maritalStatus)
      } catch (error) {
        console.error('Failed to load dropdown data:', error)
      }
    }

    loadAllData()
  }, [])

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

  useEffect(() => {
    const loadPropertyGewogs = async () => {
      if (data.dzongkhag) {
        try {
          const options = await fetchGewogsByDzongkhag(data.dzongkhag)
          setPropertyGewogOptions(options)
        } catch (error) {
          console.error('Failed to load property gewogs:', error)
          setPropertyGewogOptions([])
        }
      }
    }
    loadPropertyGewogs()
  }, [data.dzongkhag])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext({ securityDetails: data })
  }

  const addGuarantor = () => {
    setGuarantors([...guarantors, {}])
  }

  const addSecurity = () => {
    setSecurities([...securities, {}])
  }

  const removeGuarantor = (index: number) => {
    if (guarantors.length > 1) {
      setGuarantors(guarantors.filter((_, i) => i !== index))
    }
  }

  const removeSecurity = (index: number) => {
    if (securities.length > 1) {
      setSecurities(securities.filter((_, i) => i !== index))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Dynamic Securities */}
      {securities.map((security, secIndex) => (
        <div key={secIndex} className="space-y-8">
          {/* Primary Security/Collateral Details */}
          <div className="bg-card border rounded-lg p-8 space-y-8 shadow-sm">
            <div className="flex justify-between items-center border-b pb-4 mb-2">
              <h2 className="text-2xl font-semibold text-[#003DA5]">
                {secIndex === 0 ? "Primary Security/Collateral Details" : `Security ${secIndex + 1}`}
              </h2>
              {securities.length > 1 && secIndex > 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeSecurity(secIndex)}
                >
                  Remove
                </Button>
              )}
            </div>

        {/* Security Type - Full Width */}
        <div className="space-y-3">
          <Label htmlFor="security-type">
            Type of Security <span className="text-destructive">*</span>
          </Label>
          <Select value={data.securityType} onValueChange={(value) => setData({ ...data, securityType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select Security Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="land">Land</SelectItem>
              <SelectItem value="building">Building</SelectItem>
              <SelectItem value="vehicle">Vehicle</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="fd">Fixed Deposit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ownership Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label htmlFor="ownership-type">
              Security ownership <span className="text-destructive">*</span>
            </Label>
            <Select value={data.ownershipType} onValueChange={(value) => setData({ ...data, ownershipType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Ownership Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Self Owned</SelectItem>
                <SelectItem value="third-party">Third Party</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Vehicle Details (if applicable) */}
      <div className="bg-card border rounded-lg p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#003DA5] border-b pb-4">Vehicle Details (If Applicable)</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-3">
            <Label htmlFor="vehicle-type">Vehicle Type</Label>
            <Select value={data.vehicleType} onValueChange={(value) => setData({ ...data, vehicleType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="car">Car</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="truck">Truck</SelectItem>
                <SelectItem value="bus">Bus</SelectItem>
                <SelectItem value="motorcycle">Motorcycle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="vehicle-make">Make/Brand</Label>
            <Input
              id="vehicle-make"
              placeholder="Enter Make/Brand"
              value={data.vehicleMake || ""}
              onChange={(e) => setData({ ...data, vehicleMake: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="vehicle-model">Model</Label>
            <Input
              id="vehicle-model"
              placeholder="Enter Model"
              value={data.vehicleModel || ""}
              onChange={(e) => setData({ ...data, vehicleModel: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="vehicle-year">Year of Manufacture</Label>
            <Input
              id="vehicle-year"
              type="number"
              placeholder="Enter Year"
              value={data.vehicleYear || ""}
              onChange={(e) => setData({ ...data, vehicleYear: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label htmlFor="registration-no">Registration No.</Label>
            <Input
              id="registration-no"
              placeholder="Enter Registration No"
              value={data.registrationNo || ""}
              onChange={(e) => setData({ ...data, registrationNo: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="chassis-no">Chassis No.</Label>
            <Input
              id="chassis-no"
              placeholder="Enter Chassis No"
              value={data.chassisNo || ""}
              onChange={(e) => setData({ ...data, chassisNo: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="engine-no">Engine No.</Label>
            <Input
              id="engine-no"
              placeholder="Enter Engine No"
              value={data.engineNo || ""}
              onChange={(e) => setData({ ...data, engineNo: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Property/Land Details */}
      <div className="bg-card border rounded-lg p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#003DA5] border-b pb-4">Property/Land Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label htmlFor="security-dzongkhag">
              Dzongkhag <span className="text-destructive">*</span>
            </Label>
            <Select value={data.dzongkhag} onValueChange={(value) => setData({ ...data, dzongkhag: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                {dzongkhagOptions.length > 0 ? (
                  dzongkhagOptions.map((option, index) => {
                    const key = option.dzongkhag_pk_code || option.id || `sec-dzo-${index}`
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
            <Label htmlFor="security-gewog">
              Gewog <span className="text-destructive">*</span>
            </Label>
            <Select value={data.gewog} onValueChange={(value) => setData({ ...data, gewog: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                {propertyGewogOptions.length > 0 ? (
                  propertyGewogOptions.map((option, index) => {
                    const key = option.gewog_pk_code || option.id || `prop-gewog-${index}`
                    const value = String(option.gewog_pk_code || option.id || index)
                    const label = option.gewog || option.name || 'Unknown'
                    return (
                      <SelectItem key={key} value={value}>
                        {label}
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="loading" disabled>{data.dzongkhag ? 'Loading...' : 'Select Dzongkhag first'}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="security-village">
              Village/Street <span className="text-destructive">*</span>
            </Label>
            <Input
              id="security-village"
              placeholder="Enter Village/Street"
              value={data.village || ""}
              onChange={(e) => setData({ ...data, village: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="house-no">House No.</Label>
            <Input
              id="house-no"
              placeholder="Enter House No"
              value={data.houseNo || ""}
              onChange={(e) => setData({ ...data, houseNo: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-3">
            <Label htmlFor="thram-no">
              Thram No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="thram-no"
              placeholder="Enter Thram No"
              value={data.thramNo || ""}
              onChange={(e) => setData({ ...data, thramNo: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plot-no">
              Plot No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="plot-no"
              placeholder="Enter Plot No"
              value={data.plotNo || ""}
              onChange={(e) => setData({ ...data, plotNo: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">
              Area (in Sq. Ft) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="area"
              type="number"
              placeholder="Enter Area"
              value={data.area || ""}
              onChange={(e) => setData({ ...data, area: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="land-use">
              Land Use Type <span className="text-destructive">*</span>
            </Label>
            <Select value={data.landUse} onValueChange={(value) => setData({ ...data, landUse: value })}>
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="agricultural">Agricultural</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Insurance Details */}
      <div className="bg-card border rounded-lg p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#003DA5] border-b pb-4">Insurance Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="insurance-company">
              Insurance Company <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.insuranceCompany}
              onValueChange={(value) => setData({ ...data, insuranceCompany: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bil">Bhutan Insurance Limited</SelectItem>
                <SelectItem value="rigc">Royal Insurance Corporation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="policy-no">
              Policy No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="policy-no"
              placeholder="Enter Policy No"
              value={data.policyNo || ""}
              onChange={(e) => setData({ ...data, policyNo: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="insurance-value">
              Insurance Value (Nu.) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="insurance-value"
              type="number"
              placeholder="Enter Insurance Value"
              value={data.insuranceValue || ""}
              onChange={(e) => setData({ ...data, insuranceValue: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="insurance-start">
              Insurance Start Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="insurance-start"
              type="date"
              value={data.insuranceStartDate || ""}
              onChange={(e) => setData({ ...data, insuranceStartDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="insurance-expiry">
              Insurance Expiry Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="insurance-expiry"
              type="date"
              value={data.insuranceExpiryDate || ""}
              onChange={(e) => setData({ ...data, insuranceExpiryDate: e.target.value })}
            />
          </div>
        </div>
      </div>
      </div>
      ))}

      {/* First Guarantor */}
      <div className="bg-card border rounded-lg p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#003DA5] border-b pb-4">Guarantor 1</h2>

        {/* Row 1: Salutation, Name, Nationality, ID Type */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label htmlFor="salutation">
              Salutation <span className="text-destructive">*</span>
            </Label>
            <Select value={data.salutation} onValueChange={(value) => setData({ ...data, salutation: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
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
            <Label htmlFor="co-borrower-name">
              Guarantor Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="co-borrower-name"
              placeholder="Enter Full Name"
              value={data.coBorrowerName || ""}
              onChange={(e) => setData({ ...data, coBorrowerName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">
              Nationality <span className="text-destructive">*</span>
            </Label>
            <Select value={data.nationality} onValueChange={(value) => setData({ ...data, nationality: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
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
            <Label htmlFor="id-type">
              Identification Type <span className="text-destructive">*</span>
            </Label>
            <Select value={data.idType} onValueChange={(value) => setData({ ...data, idType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
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

        {/* Row 2: ID Number, Issue Date, Expiry Date, DOB */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label htmlFor="id-number">
              Identification No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="id-number"
              placeholder="Enter ID Number"
              value={data.idNumber || ""}
              onChange={(e) => setData({ ...data, idNumber: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id-issue-date">
              Issue Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="id-issue-date"
              type="date"
              value={data.idIssueDate || ""}
              onChange={(e) => setData({ ...data, idIssueDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id-expiry-date">
              Expiry Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="id-expiry-date"
              type="date"
              value={data.idExpiryDate || ""}
              onChange={(e) => setData({ ...data, idExpiryDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">
              Date of Birth <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dob"
              type="date"
              value={data.dateOfBirth || ""}
              onChange={(e) => setData({ ...data, dateOfBirth: e.target.value })}
            />
          </div>
        </div>

        {/* Row 3: TPN, Marital Status, Gender, Spouse Name */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label htmlFor="tpn-no">TPN No</Label>
            <Input
              id="tpn-no"
              placeholder="Enter TPN Number"
              value={data.tpnNo || ""}
              onChange={(e) => setData({ ...data, tpnNo: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marital-status">
              Marital Status <span className="text-destructive">*</span>
            </Label>
            <Select value={data.maritalStatus} onValueChange={(value) => setData({ ...data, maritalStatus: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
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
            <Label htmlFor="gender">
              Gender <span className="text-destructive">*</span>
            </Label>
            <Select value={data.gender} onValueChange={(value) => setData({ ...data, gender: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spouse-name">Spouse Name</Label>
            <Input
              id="spouse-name"
              placeholder="Enter Spouse Name"
              value={data.spouseName || ""}
              onChange={(e) => setData({ ...data, spouseName: e.target.value })}
            />
          </div>
        </div>

        {/* Row 4: Spouse CID, Spouse Contact, Family Tree Upload */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="spouse-cid">Spouse CID No</Label>
            <Input
              id="spouse-cid"
              placeholder="Enter Spouse CID"
              value={data.spouseCid || ""}
              onChange={(e) => setData({ ...data, spouseCid: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spouse-contact">Spouse Contact No</Label>
            <Input
              id="spouse-contact"
              placeholder="Enter Contact Number"
              value={data.spouseContact || ""}
              onChange={(e) => setData({ ...data, spouseContact: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="family-tree">Upload Family Tree</Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="w-28 bg-transparent">
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">No file chosen</span>
            </div>
          </div>
        </div>
      </div>

      {/* Permanent Address */}
      <div className="bg-card border rounded-lg p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#003DA5] border-b pb-4">Permanent Address</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="perm-country">
              Country <span className="text-destructive">*</span>
            </Label>
            <Select value={data.permCountry} onValueChange={(value) => setData({ ...data, permCountry: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Country" />
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
            <Label htmlFor="perm-dzongkhag">
              Dzongkhag <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? '' : data.permDzongkhag} 
              onValueChange={(value) => setData({ ...data, permDzongkhag: value })}
              disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Dzongkhag" />
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
            <Label htmlFor="perm-gewog">
              Gewog <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? '' : data.permGewog} 
              onValueChange={(value) => setData({ ...data, permGewog: value })}
              disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Gewog" />
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="perm-village">
              Village/Street <span className="text-destructive">*</span>
            </Label>
            <Input
              id="perm-village"
              placeholder="Enter Village/Street"
              value={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? '' : data.permVillage || ""}
              onChange={(e) => setData({ ...data, permVillage: e.target.value })}
              disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="perm-thram">Thram No</Label>
            <Input
              id="perm-thram"
              placeholder="Enter Thram No"
              value={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? '' : data.permThram || ""}
              onChange={(e) => setData({ ...data, permThram: e.target.value })}
              disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="perm-house">House No</Label>
            <Input
              id="perm-house"
              placeholder="Enter House No"
              value={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? '' : data.permHouse || ""}
              onChange={(e) => setData({ ...data, permHouse: e.target.value })}
              disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            />
          </div>
        </div>

        {data.permCountry && !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) && (
          <div className="space-y-2 mt-4">
            <Label htmlFor="perm-address-proof">
              Upload Address Proof Document <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="w-28 bg-transparent">
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">No file chosen</span>
            </div>
            <p className="text-xs text-muted-foreground">Please upload a valid address proof document for non-Bhutan residence</p>
          </div>
        )}
      </div>

      {/* Current/Residential Address */}
      <div className="bg-card border rounded-lg p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#003DA5] border-b pb-4">Current/Residential Address</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="curr-country">
              Country <span className="text-destructive">*</span>
            </Label>
            <Select value={data.currCountry} onValueChange={(value) => setData({ ...data, currCountry: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Country" />
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
            <Label htmlFor="curr-dzongkhag">
              Dzongkhag <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? '' : data.currDzongkhag} 
              onValueChange={(value) => setData({ ...data, currDzongkhag: value })}
              disabled={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Dzongkhag" />
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
            <Label htmlFor="curr-gewog">
              Gewog <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? '' : data.currGewog} 
              onValueChange={(value) => setData({ ...data, currGewog: value })}
              disabled={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Gewog" />
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="curr-village">
              Village/Street <span className="text-destructive">*</span>
            </Label>
            <Input
              id="curr-village"
              placeholder="Enter Village/Street"
              value={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? '' : data.currVillage || ""}
              onChange={(e) => setData({ ...data, currVillage: e.target.value })}
              disabled={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="curr-house">House/Flat No</Label>
            <Input
              id="curr-house"
              placeholder="Enter House/Flat No"
              value={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? '' : data.currHouse || ""}
              onChange={(e) => setData({ ...data, currHouse: e.target.value })}
              disabled={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter Email Address"
              value={data.email || ""}
              onChange={(e) => setData({ ...data, email: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="contact">
              Contact Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contact"
              placeholder="Enter Contact Number"
              value={data.contact || ""}
              onChange={(e) => setData({ ...data, contact: e.target.value })}
            />
          </div>
        </div>

        {data.currCountry && !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) && (
          <div className="space-y-2 mt-4">
            <Label htmlFor="curr-address-proof">
              Upload Address Proof Document <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="w-28 bg-transparent">
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">No file chosen</span>
            </div>
            <p className="text-xs text-muted-foreground">Please upload a valid address proof document for non-Bhutan residence</p>
          </div>
        )}
      </div>

      {/* PEP Declaration */}
      <div className="bg-card border rounded-lg p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#003DA5] border-b pb-4">PEP Declaration</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="is-pep">
              Politically Exposed Person? <span className="text-destructive">*</span>
            </Label>
            <Select value={data.isPep} onValueChange={(value) => setData({ ...data, isPep: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pep-category">PEP Category</Label>
            <Select 
              value={data.isPep === 'yes' ? data.pepCategory : ''} 
              onValueChange={(value) => setData({ ...data, pepCategory: value })}
              disabled={data.isPep !== 'yes'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="domestic">Domestic PEP</SelectItem>
                <SelectItem value="foreign">Foreign PEP</SelectItem>
                <SelectItem value="international">International Organization PEP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pep-sub-category">PEP Sub Category</Label>
            <Input
              id="pep-sub-category"
              placeholder="Enter Sub Category"
              value={data.isPep === 'yes' ? data.pepSubCategory || "" : ''}
              onChange={(e) => setData({ ...data, pepSubCategory: e.target.value })}
              disabled={data.isPep !== 'yes'}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="pep-relationship">Relationship</Label>
            <Input
              id="pep-relationship"
              placeholder="Enter Relationship"
              value={data.isPep === 'yes' ? data.pepRelationship || "" : ''}
              onChange={(e) => setData({ ...data, pepRelationship: e.target.value })}
              disabled={data.isPep !== 'yes'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="related-to-pep">Is he/she related to any PEP?</Label>
            <Select 
              value={data.isPep === 'yes' ? data.relatedToPep : ''} 
              onValueChange={(value) => setData({ ...data, relatedToPep: value })}
              disabled={data.isPep !== 'yes'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pep-id-no">Identification No.</Label>
            <Input
              id="pep-id-no"
              placeholder="Enter ID Number"
              value={data.isPep === 'yes' ? data.pepIdNo || "" : ''}
              onChange={(e) => setData({ ...data, pepIdNo: e.target.value })}
              disabled={data.isPep !== 'yes'}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="pep-upload">Upload Identification Proof</Label>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-28 bg-transparent"
                disabled={data.isPep !== 'yes'}
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">No file chosen</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-6 pt-4">
        <Button type="button" size="lg" className="min-w-40" onClick={addGuarantor}>
          + Add Guarantor
        </Button>
        <Button type="button" size="lg" className="min-w-40" onClick={addSecurity}>
          + Add Securities
        </Button>
      </div>

      {/* Additional Guarantors */}
      {guarantors.slice(1).map((guarantor, index) => (
        <div key={index + 1} className="bg-card border rounded-lg p-8 space-y-8 shadow-sm">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-2xl font-semibold text-[#003DA5]">Guarantor {index + 2}</h2>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeGuarantor(index + 1)}
            >
              Remove
            </Button>
          </div>

          {/* Row 1: Salutation, Name, Nationality, ID Type */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor={`salutation-${index + 1}`}>
                Salutation <span className="text-destructive">*</span>
              </Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
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
              <Label htmlFor={`guarantor-name-${index + 1}`}>
                Guarantor Name <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Enter Full Name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`nationality-${index + 1}`}>
                Nationality <span className="text-destructive">*</span>
              </Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bhutanese">Bhutanese</SelectItem>
                  <SelectItem value="indian">Indian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`id-type-${index + 1}`}>
                Identification Type <span className="text-destructive">*</span>
              </Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cid">CID</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="work-permit">Work Permit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: ID Number, Issue Date, Expiry Date, DOB */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor={`id-number-${index + 1}`}>
                Identification No. <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Enter ID Number" />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`id-issue-${index + 1}`}>
                Issue Date <span className="text-destructive">*</span>
              </Label>
              <Input type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`id-expiry-${index + 1}`}>
                Expiry Date <span className="text-destructive">*</span>
              </Label>
              <Input type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`dob-${index + 1}`}>
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input type="date" />
            </div>
          </div>

          {/* Row 3: TPN, Marital Status, Gender, Spouse Name */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor={`tpn-${index + 1}`}>TPN No</Label>
              <Input placeholder="Enter TPN Number" />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`marital-${index + 1}`}>
                Marital Status <span className="text-destructive">*</span>
              </Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`gender-${index + 1}`}>
                Gender <span className="text-destructive">*</span>
              </Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`spouse-name-${index + 1}`}>Spouse Name</Label>
              <Input placeholder="Enter Spouse Name" />
            </div>
          </div>

          {/* Row 4: Spouse CID, Spouse Contact, Email, Phone */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor={`spouse-cid-${index + 1}`}>Spouse CID No</Label>
              <Input placeholder="Enter Spouse CID" />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`spouse-contact-${index + 1}`}>Spouse Contact No</Label>
              <Input placeholder="Enter Contact Number" />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`email-${index + 1}`}>
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input type="email" placeholder="Enter Email Address" />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`contact-${index + 1}`}>
                Contact Number <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Enter Contact Number" />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-between gap-6 pt-6">
        <Button type="button" onClick={onBack} variant="secondary" size="lg" className="min-w-40 px-8 py-6 text-base">
          Back
        </Button>
        <Button type="submit" size="lg" className="min-w-40 px-8 py-6 text-base">
          Next
        </Button>
      </div>
    </form>
  )
}
