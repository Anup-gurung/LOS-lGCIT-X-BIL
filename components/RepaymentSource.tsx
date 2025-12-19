"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchNationality, fetchIdentificationType, fetchCountry, fetchDzongkhag, fetchGewogsByDzongkhag, fetchMaritalStatus } from "@/services/api"

interface RepaymentSourceFormProps {
  onNext: (data: any) => void
  onBack: () => void
  formData: any
}

export function RepaymentSourceForm({ onNext, onBack, formData }: RepaymentSourceFormProps) {
  const [data, setData] = useState(formData.repaymentSource || {})
  const [guarantors, setGuarantors] = useState<any[]>([{}])
  const [nationalityOptions, setNationalityOptions] = useState<any[]>([])
  const [identificationTypeOptions, setIdentificationTypeOptions] = useState<any[]>([])
  const [countryOptions, setCountryOptions] = useState<any[]>([])
  const [dzongkhagOptions, setDzongkhagOptions] = useState<any[]>([])
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<any[]>([])
  const [permGewogOptions, setPermGewogOptions] = useState<any[]>([])
  const [currGewogOptions, setCurrGewogOptions] = useState<any[]>([])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext({ repaymentSource: data })
  }

  const addGuarantor = () => {
    setGuarantors([...guarantors, {}])
  }

  const removeGuarantor = (index: number) => {
    if (guarantors.length > 1) {
      setGuarantors(guarantors.filter((_, i) => i !== index))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* INCOME DETAILS */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">INCOME DETAILS</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Monthly Salary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable-monthly-salary"
                className="h-4 w-4 rounded border-gray-400"
                checked={data.enableMonthlySalary || false}
                onChange={(e) => setData({ ...data, enableMonthlySalary: e.target.checked, monthlySalary: e.target.checked ? data.monthlySalary : '' })}
              />
              <label htmlFor="enable-monthly-salary" className="text-gray-800 font-semibold text-sm">
                {/* className="text-gray-800 font-semibold text-sm" */}
                Monthly Salary (Nu.)
              </label>
            </div>
            <Input
              id="monthly-salary"
              type="number"
              placeholder="Amount *"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              value={data.monthlySalary || ""}
              onChange={(e) => setData({ ...data, monthlySalary: e.target.value })}
              disabled={!data.enableMonthlySalary}
            />
          </div>

          {/* Monthly Rental Income */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable-rental-income"
                className="h-4 w-4 rounded border-gray-400"
                checked={data.enableRentalIncome || false}
                onChange={(e) => setData({ ...data, enableRentalIncome: e.target.checked, rentalIncome: e.target.checked ? data.rentalIncome : '' })}
              />
              <label htmlFor="enable-rental-income" className="text-gray-800 font-semibold text-sm">
                Monthly Rental Income (Nu.)
              </label>
            </div>
            <Input
              id="rental-income"
              type="number"
              placeholder="Amount *"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              value={data.rentalIncome || ""}
              onChange={(e) => setData({ ...data, rentalIncome: e.target.value })}
              disabled={!data.enableRentalIncome}
            />
          </div>

          {/* Business Income */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable-business-income"
                className="h-4 w-4 rounded border-gray-400"
                checked={data.enableBusinessIncome || false}
                onChange={(e) => setData({ ...data, enableBusinessIncome: e.target.checked, businessIncome: e.target.checked ? data.businessIncome : '' })}
              />
              <label htmlFor="enable-business-income" className="text-gray-800 font-semibold text-sm">
                Business Income (Nu.)
              </label>
            </div>
            <Input
              id="business-income"
              type="number"
              placeholder="Amount *"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              value={data.businessIncome || ""}
              onChange={(e) => setData({ ...data, businessIncome: e.target.value })}
              disabled={!data.enableBusinessIncome}
            />
          </div>

          {/* Vehicle Hiring Income */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable-vehicle-hiring"
                className="h-4 w-4 rounded border-gray-400"
                checked={data.enableVehicleHiring || false}
                onChange={(e) => setData({ ...data, enableVehicleHiring: e.target.checked, vehicleHiringIncome: e.target.checked ? data.vehicleHiringIncome : '' })}
              />
              <label htmlFor="enable-vehicle-hiring" className="text-gray-800 font-semibold text-sm">
                Vehicle Hiring Income (Nu.)
              </label>
            </div>
            <Input
              id="vehicle-hiring"
              type="number"
              placeholder="Amount *"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              value={data.vehicleHiringIncome || ""}
              onChange={(e) => setData({ ...data, vehicleHiringIncome: e.target.value })}
              disabled={!data.enableVehicleHiring}
            />
          </div>

          {/* Dividend Income */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable-dividend-income"
                className="h-4 w-4 rounded border-gray-400"
                checked={data.enableDividendIncome || false}
                onChange={(e) => setData({ ...data, enableDividendIncome: e.target.checked, dividendIncome: e.target.checked ? data.dividendIncome : '' })}
              />
              <label htmlFor="enable-dividend-income" className="text-gray-800 font-semibold text-sm">
                Dividend Income (Nu.)
              </label>
            </div>
            <Input
              id="dividend-income"
              type="number"
              placeholder="Amount *"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              value={data.dividendIncome || ""}
              onChange={(e) => setData({ ...data, dividendIncome: e.target.value })}
              disabled={!data.enableDividendIncome}
            />
          </div>

          {/* Agriculture Income */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable-agriculture-income"
                className="h-4 w-4 rounded border-gray-400"
                checked={data.enableAgricultureIncome || false}
                onChange={(e) => setData({ ...data, enableAgricultureIncome: e.target.checked, agricultureIncome: e.target.checked ? data.agricultureIncome : '' })}
              />
              <label htmlFor="enable-agriculture-income" className="text-gray-800 font-semibold text-sm">
                Agriculture Income (Nu.)
              </label>
            </div>
            <Input
              id="agriculture-income"
              type="number"
              placeholder="Amount *"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              value={data.agricultureIncome || ""}
              onChange={(e) => setData({ ...data, agricultureIncome: e.target.value })}
              disabled={!data.enableAgricultureIncome}
            />
          </div>

          {/* Truck/Taxi Income */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable-truck-taxi-income"
                className="h-4 w-4 rounded border-gray-400"
                checked={data.enableTruckTaxiIncome || false}
                onChange={(e) => setData({ ...data, enableTruckTaxiIncome: e.target.checked, truckTaxiIncome: e.target.checked ? data.truckTaxiIncome : '' })}
              />
              <label htmlFor="enable-truck-taxi-income" className="text-gray-800 font-semibold text-sm">
                Truck/Taxi Income (Nu.)
              </label>
              
            </div>
            <Input
              id="truck-taxi-income"
              type="number"
              placeholder="Amount *"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              value={data.truckTaxiIncome || ""}
              onChange={(e) => setData({ ...data, truckTaxiIncome: e.target.value })}
              disabled={!data.enableTruckTaxiIncome}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          <div className="space-y-3">
            <Label htmlFor="repayment-proof" className="text-gray-800 font-semibold text-sm">Upload Repayment Proof <span className="text-destructive">*</span></Label>
            <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm">
              <Button type="button" variant="outline" size="sm" className="w-28 bg-transparent">
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">No file chosen</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="repayment-guarantor" className="text-gray-800 font-semibold text-sm">
              Is Repayment Guarantor Applicable? <span className="text-destructive">*</span>
            </Label>
            <div className="w-full h-12" style={{ minHeight: '48px' }}>
              <Select
                value={data.repaymentGuarantor}
                onValueChange={(value) => setData({ ...data, repaymentGuarantor: value })}
              >
                <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
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
      </div>

      {/* First Guarantor */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">Guarantor 1</h2>

        {/* Row 1: Salutation, Name, Nationality */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label htmlFor="salutation" className="text-gray-800 font-semibold text-sm">
              Salutation <span className="text-destructive">*</span>
            </Label>
            <div className="w-full h-12" style={{ minHeight: '48px' }}>
              <Select value={data.salutation} onValueChange={(value) => setData({ ...data, salutation: value })}>
                <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
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
          </div>

          <div className="space-y-3">
            <Label htmlFor="guarantor-name" className="text-gray-800 font-semibold text-sm">
              Guarantor Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="guarantor-name"
              placeholder="Enter Full Name"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.guarantorName || ""}
              onChange={(e) => setData({ ...data, guarantorName: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="nationality" className="text-gray-800 font-semibold text-sm">
              Nationality <span className="text-destructive">*</span>
            </Label>
            <div className="w-full h-12" style={{ minHeight: '48px' }}>
              <Select value={data.nationality} onValueChange={(value) => setData({ ...data, nationality: value })}>
                <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
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
          </div>
        </div>

        {/* Row 2: ID Type, ID Number, Issue Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label htmlFor="id-type" className="text-gray-800 font-semibold text-sm">
              Identification Type <span className="text-destructive">*</span>
            </Label>
            <div className="w-full h-12" style={{ minHeight: '48px' }}>
              <Select value={data.idType} onValueChange={(value) => setData({ ...data, idType: value })}>
                <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
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

          <div className="space-y-3">
            <Label htmlFor="id-number" className="text-gray-800 font-semibold text-sm">
              Identification No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="id-number"
              placeholder="Enter ID Number"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.idNumber || ""}
              onChange={(e) => setData({ ...data, idNumber: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="id-issue-date" className="text-gray-800 font-semibold text-sm">
              Identification Issue Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="id-issue-date"
              type="date"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.idIssueDate || ""}
              onChange={(e) => setData({ ...data, idIssueDate: e.target.value })}
            />
          </div>
        </div>

        {/* Row 3: Expiry Date, DOB, TPN */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label htmlFor="id-expiry-date" className="text-gray-800 font-semibold text-sm">
              Identification Expiry Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="id-expiry-date"
              type="date"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.idExpiryDate || ""}
              onChange={(e) => setData({ ...data, idExpiryDate: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="dob" className="text-gray-800 font-semibold text-sm">
              Date of Birth <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dob"
              type="date"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.dateOfBirth || ""}
              onChange={(e) => setData({ ...data, dateOfBirth: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="tpn-no" className="text-gray-800 font-semibold text-sm">TPN No.</Label>
            <Input
              id="tpn-no"
              placeholder="Enter TPN Number"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.tpnNo || ""}
              onChange={(e) => setData({ ...data, tpnNo: e.target.value })}
            />
          </div>
        </div>

        {/* Row 4: Marital Status, Gender, Spouse Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label htmlFor="marital-status" className="text-gray-800 font-semibold text-sm">
              Marital Status <span className="text-destructive">*</span>
            </Label>
            <div className="w-full h-12" style={{ minHeight: '48px' }}>
              <Select value={data.maritalStatus} onValueChange={(value) => setData({ ...data, maritalStatus: value })}>
                <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
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
          </div>

          <div className="space-y-3">
            <Label htmlFor="gender" className="text-gray-800 font-semibold text-sm">
              Gender <span className="text-destructive">*</span>
            </Label>
            <div className="w-full h-12" style={{ minHeight: '48px' }}>
              <Select value={data.gender} onValueChange={(value) => setData({ ...data, gender: value })}>
                <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="spouse-name" className="text-gray-800 font-semibold text-sm">Spouse Name</Label>
            <Input
              id="spouse-name"
              placeholder="Enter Spouse Name"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.spouseName || ""}
              onChange={(e) => setData({ ...data, spouseName: e.target.value })}
            />
          </div>
        </div>

        {/* Row 5: Spouse CID, Spouse Contact, Family Tree */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label htmlFor="spouse-cid" className="text-gray-800 font-semibold text-sm">Spouse CID No.</Label>
            <Input
              id="spouse-cid"
              placeholder="Enter Spouse CID"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.spouseCid || ""}
              onChange={(e) => setData({ ...data, spouseCid: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="spouse-contact" className="text-gray-800 font-semibold text-sm">Spouse Contact No.</Label>
            <Input
              id="spouse-contact"
              placeholder="Enter Contact Number"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.spouseContact || ""}
              onChange={(e) => setData({ ...data, spouseContact: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="family-tree" className="text-gray-800 font-semibold text-sm">Upload Family Tree</Label>
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
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">Permanent Address</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label htmlFor="perm-country" className="text-gray-800 font-semibold text-sm">
              Country <span className="text-destructive">*</span>
            </Label>
            <div className="w-full h-12" style={{ minHeight: '48px' }}>
              <Select value={data.permCountry} onValueChange={(value) => setData({ ...data, permCountry: value })}>
                <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <SelectValue placeholder="[Select Country]" />
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
          </div>

          <div className="space-y-3">
            <Label htmlFor="perm-dzongkhag" className="text-gray-800 font-semibold text-sm">
              {data.permCountry && countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Dzongkhag' : 'State'} <span className="text-destructive">*</span>
            </Label>
            {data.permCountry && !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? (
              <Input
                id="perm-dzongkhag"
                placeholder="Enter State"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={data.permDzongkhag || ""}
                onChange={(e) => setData({ ...data, permDzongkhag: e.target.value })}
              />
            ) : (
            <div className="w-full h-12" style={{ minHeight: '48px' }}>
              <Select 
                value={data.permDzongkhag || ''} 
                onValueChange={(value) => setData({ ...data, permDzongkhag: value })}
                disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
              >
                <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <SelectValue placeholder="[Select Dzongkhag]" />
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
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="perm-gewog" className="text-gray-800 font-semibold text-sm">
              {data.permCountry && countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Gewog' : 'Province'} <span className="text-destructive">*</span>
            </Label>
            {data.permCountry && !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? (
              <Input
                id="perm-gewog"
                placeholder="Enter Province"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={data.permGewog || ""}
                onChange={(e) => setData({ ...data, permGewog: e.target.value })}
              />
            ) : (
            <div className="w-full h-12" style={{ minHeight: '48px' }}>
              <Select 
                value={data.permGewog || ''} 
                onValueChange={(value) => setData({ ...data, permGewog: value })}
                disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
              >
                <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <SelectValue placeholder="[Select Gewog]" />
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
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label htmlFor="perm-village" className="text-gray-800 font-semibold text-sm">
              {data.permCountry && countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Village/Street' : 'Street'} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="perm-village"
              placeholder={data.permCountry && countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Enter Village/Street' : 'Enter Street'}
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.permVillage || ""}
              onChange={(e) => setData({ ...data, permVillage: e.target.value })}
              disabled={!data.permCountry}
            />
          </div>

          {/* Thram and House fields - only for Bhutan */}
          {data.permCountry && countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) && (
          <>
          <div className="space-y-3">
            <Label htmlFor="perm-thram" className="text-gray-800 font-semibold text-sm">Thram No</Label>
            <Input
              id="perm-thram"
              placeholder="Enter Thram No"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? '' : data.permThram || ""}
              onChange={(e) => setData({ ...data, permThram: e.target.value })}
              disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="perm-house" className="text-gray-800 font-semibold text-sm">House No</Label>
            <Input
              id="perm-house"
              placeholder="Enter House No"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? '' : data.permHouse || ""}
              onChange={(e) => setData({ ...data, permHouse: e.target.value })}
              disabled={!data.permCountry || !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            />
          </div>
          </>
          )}
        </div>

        {data.permCountry && !countryOptions.find(c => String(c.country_pk_code) === data.permCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) && (
          <div className="space-y-2 mt-4">
            <Label htmlFor="perm-address-proof" className="text-gray-800 font-semibold text-sm">
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
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">Current/Residential Address</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label htmlFor="curr-country" className="text-gray-800 font-semibold text-sm">
              Country of Resident <span className="text-destructive">*</span>
            </Label>
            <div className="w-full h-12" style={{ minHeight: '48px' }}>
              <Select value={data.currCountry} onValueChange={(value) => setData({ ...data, currCountry: value })}>
                <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <SelectValue placeholder="[Select Country]" />
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
          </div>

          <div className="space-y-3">
            <Label htmlFor="curr-dzongkhag" className="text-gray-800 font-semibold text-sm">
              {data.currCountry && countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Dzongkhag' : 'State'} <span className="text-destructive">*</span>
            </Label>
            {data.currCountry && !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? (
              <Input
                id="curr-dzongkhag"
                placeholder="Enter State"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={data.currDzongkhag || ""}
                onChange={(e) => setData({ ...data, currDzongkhag: e.target.value })}
              />
            ) : (
            <div className="w-full h-12" style={{ minHeight: '48px' }}>
              <Select 
                value={data.currDzongkhag || ''} 
                onValueChange={(value) => setData({ ...data, currDzongkhag: value })}
                disabled={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
              >
                <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <SelectValue placeholder="[Select Dzongkhag]" />
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
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="curr-gewog" className="text-gray-800 font-semibold text-sm">
              {data.currCountry && countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Gewog' : 'Province'} <span className="text-destructive">*</span>
            </Label>
            {data.currCountry && !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? (
              <Input
                id="curr-gewog"
                placeholder="Enter Province"
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={data.currGewog || ""}
                onChange={(e) => setData({ ...data, currGewog: e.target.value })}
              />
            ) : (
            <div className="w-full h-12" style={{ minHeight: '48px' }}>
              <Select 
                value={data.currGewog || ''} 
                onValueChange={(value) => setData({ ...data, currGewog: value })}
                disabled={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
              >
                <SelectTrigger className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <SelectValue placeholder="[Select Gewog]" />
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
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label htmlFor="curr-village" className="text-gray-800 font-semibold text-sm">
              {data.currCountry && countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Village/Street' : 'Street'} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="curr-village"
              placeholder={data.currCountry && countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? 'Enter Village/Street' : 'Enter Street'}
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.currVillage || ""}
              onChange={(e) => setData({ ...data, currVillage: e.target.value })}
              disabled={!data.currCountry}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="curr-house" className="text-gray-800 font-semibold text-sm">House/Building/Flat No. </Label>
            <Input
              id="curr-house"
              placeholder="Enter House/Building/Flat No"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) ? '' : data.currHouse || ""}
              onChange={(e) => setData({ ...data, currHouse: e.target.value })}
              disabled={!data.currCountry || !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan'))}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="email" className="text-gray-800 font-semibold text-sm">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter Email Address"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.email || ""}
              onChange={(e) => setData({ ...data, email: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label htmlFor="contact" className="text-gray-800 font-semibold text-sm">
              Contact Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contact"
              placeholder="Enter Contact Number"
              className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.contact || ""}
              onChange={(e) => setData({ ...data, contact: e.target.value })}
            />
          </div>
        </div>

        {data.currCountry && !countryOptions.find(c => String(c.country_pk_code) === data.currCountry && (c.country || c.name || '').toLowerCase().includes('bhutan')) && (
          <div className="space-y-2 mt-4">
            <Label htmlFor="curr-address-proof" className="text-gray-800 font-semibold text-sm">
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
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">PEP Declaration</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2.5">
            <Label htmlFor="is-pep" className="text-gray-800 font-semibold text-sm">
              Politically Exposed Person? <span className="text-destructive">*</span>
            </Label>
            <Select value={data.isPep} onValueChange={(value) => setData({ ...data, isPep: value })}>
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
            <Label htmlFor="pep-category" className="text-gray-800 font-semibold text-sm">PEP Category <span className="text-destructive">*</span></Label>
            <Select 
              value={data.isPep === 'yes' ? data.pepCategory : ''} 
              onValueChange={(value) => setData({ ...data, pepCategory: value })}
              disabled={data.isPep !== 'yes'}
            >
              <SelectTrigger className="h-12 w-full border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]">
                <SelectValue placeholder="[Select]" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                <SelectItem value="domestic">Domestic PEP</SelectItem>
                <SelectItem value="foreign">Foreign PEP</SelectItem>
                <SelectItem value="international">International Organization PEP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="related-to-pep" className="text-gray-800 font-semibold text-sm">Are you related to any PEP? <span className="text-destructive">*</span></Label>
            <Select 
              value={data.isPep === 'no' ? data.relatedToPep : ''} 
              onValueChange={(value) => setData({ ...data, relatedToPep: value })}
              disabled={data.isPep !== 'no'}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2.5">
            <Label htmlFor="pep-relationship" className="text-gray-800 font-semibold text-sm">Relationship <span className="text-destructive">*</span></Label>
            <Select
              value={data.isPep === 'no' && data.relatedToPep === 'yes' ? data.pepRelationship : ''}
              onValueChange={(value) => setData({ ...data, pepRelationship: value })}
              disabled={data.isPep !== 'no' || data.relatedToPep !== 'yes'}
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
            <Label htmlFor="pep-id-no" className="text-gray-800 font-semibold text-sm">
              Identification No. <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pep-id-no"
              placeholder="Enter Identification No"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.isPep === 'no' && data.relatedToPep === 'yes' ? data.pepIdNo || "" : ''}
              onChange={(e) => setData({ ...data, pepIdNo: e.target.value })}
              disabled={data.isPep !== 'no' || data.relatedToPep !== 'yes'}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="pep-category-2" className="text-gray-800 font-semibold text-sm">PEP Category <span className="text-destructive">*</span></Label>
            <Input
              id="pep-category-2"
              placeholder="Enter PEP Category"
              className="h-12 border-gray-300 focus:border-[#FF9800] focus:ring-[#FF9800]"
              value={data.isPep === 'no' && data.relatedToPep === 'yes' ? data.pepCategory2 || "" : ''}
              onChange={(e) => setData({ ...data, pepCategory2: e.target.value })}
              disabled={data.isPep !== 'no' || data.relatedToPep !== 'yes'}
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="pep-upload" className="text-gray-800 font-semibold text-sm">
            Upload Identification Proof <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="pep-upload"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                // Handle file upload logic here
                const file = e.target.files?.[0]
                if (file) {
                  setData({ ...data, pepIdentificationProof: file })
                }
              }}
              disabled={data.isPep !== 'no' || data.relatedToPep !== 'yes'}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="w-28 bg-transparent"
              disabled={data.isPep !== 'no' || data.relatedToPep !== 'yes'}
              onClick={() => document.getElementById('pep-upload')?.click()}
            >
              Choose File
            </Button>
            <span className="text-sm text-muted-foreground">
              {data.pepIdentificationProof?.name || 'No file chosen'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-6 pt-4">
        <Button type="button" size="lg" className="min-w-40" onClick={addGuarantor}>
          + Add Guarantor
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

          {/* Simplified guarantor form */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label htmlFor={`guarantor-name-${index + 1}`}>
                Guarantor Name <span className="text-destructive">*</span>
              </Label>
              <Input 
                placeholder="Enter Full Name" 
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor={`id-number-${index + 1}`}>
                Identification No. <span className="text-destructive">*</span>
              </Label>
              <Input 
                placeholder="Enter ID Number" 
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor={`contact-${index + 1}`}>
                Contact Number <span className="text-destructive">*</span>
              </Label>
              <Input 
                placeholder="Enter Contact Number" 
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-between gap-6 pt-4">
        <Button type="button" onClick={onBack} variant="secondary" size="lg" className="min-w-40 px-10 py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
          Back
        </Button>
        <Button type="submit" size="lg" className="min-w-40 px-10 py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all bg-[#003DA5] hover:bg-[#002D7A]">
          Next
        </Button>
      </div>
    </form>
  )
}
