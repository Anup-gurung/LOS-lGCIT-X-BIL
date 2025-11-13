"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface CoBorrowerDetailsFormProps {
  onNext: (data: any) => void
  onBack: () => void
  formData: any
}

export function CoBorrowerDetailsForm({ onNext, onBack, formData }: CoBorrowerDetailsFormProps) {
  const [data, setData] = useState(formData.coBorrowerDetails || {})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext({ coBorrowerDetails: data })
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
                <SelectItem value="bhutanese">Bhutanese</SelectItem>
                <SelectItem value="indian">Indian</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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
                <SelectItem value="cid">Citizenship ID</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="work_permit">Work Permit</SelectItem>
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
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
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
                <SelectItem value="bhutan">Bhutan</SelectItem>
                <SelectItem value="india">India</SelectItem>
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
                <SelectItem value="thimphu">Thimphu</SelectItem>
                <SelectItem value="paro">Paro</SelectItem>
                <SelectItem value="punakha">Punakha</SelectItem>
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
                <SelectItem value="gewog1">Gewog 1</SelectItem>
                <SelectItem value="gewog2">Gewog 2</SelectItem>
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
                <SelectItem value="bhutan">Bhutan</SelectItem>
                <SelectItem value="india">India</SelectItem>
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
                <SelectItem value="thimphu">Thimphu</SelectItem>
                <SelectItem value="paro">Paro</SelectItem>
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
                <SelectItem value="gewog1">Gewog 1</SelectItem>
                <SelectItem value="gewog2">Gewog 2</SelectItem>
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
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
