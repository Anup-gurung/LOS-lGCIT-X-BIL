"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface PersonalDetailsFormProps {
  onNext: (data: any) => void
  onBack: () => void
  formData: any
  isFirstStep: boolean
}

export function PersonalDetailsForm({ onNext, onBack, formData }: PersonalDetailsFormProps) {
  const [data, setData] = useState(formData.personalDetails || {})

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
                <SelectItem value="bhutanese">Bhutanese</SelectItem>
                <SelectItem value="indian">Indian</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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
                <SelectItem value="cid">Citizenship ID</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="work_permit">Work Permit</SelectItem>
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
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
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
              <Button type="button" variant="outline" size="sm" className="w-28 bg-transparent">
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">No file chosen</span>
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
                <SelectItem value="bob">Bank of Bhutan</SelectItem>
                <SelectItem value="bnb">Bhutan National Bank</SelectItem>
                <SelectItem value="dpnb">Druk PNB Bank</SelectItem>
                <SelectItem value="tbank">T Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="uploadPassport">
            Upload Passport-size Photograph <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="w-28 bg-transparent">
              Choose File
            </Button>
            <span className="text-sm text-muted-foreground">No file chosen</span>
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
                <SelectItem value="bhutan">Bhutan</SelectItem>
                <SelectItem value="india">India</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="permDzongkhag">
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
            <Label htmlFor="permGewog">
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
            <Label htmlFor="permVillage">
              Village/Street <span className="text-destructive">*</span>
            </Label>
            <Input
              id="permVillage"
              placeholder="Enter Village/Street"
              value={data.permVillage || ""}
              onChange={(e) => setData({ ...data, permVillage: e.target.value })}
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
              value={data.permThram || ""}
              onChange={(e) => setData({ ...data, permThram: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="permHouse">
              House No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="permHouse"
              placeholder="Enter House No"
              value={data.permHouse || ""}
              onChange={(e) => setData({ ...data, permHouse: e.target.value })}
            />
          </div>
        </div>
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
                <SelectItem value="bhutan">Bhutan</SelectItem>
                <SelectItem value="india">India</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currDzongkhag">
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
            <Label htmlFor="currGewog">
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
            <Label htmlFor="currVillage">
              Village/Street <span className="text-destructive">*</span>
            </Label>
            <Input
              id="currVillage"
              placeholder="Enter Village/Street"
              value={data.currVillage || ""}
              onChange={(e) => setData({ ...data, currVillage: e.target.value })}
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
              value={data.currFlat || ""}
              onChange={(e) => setData({ ...data, currFlat: e.target.value })}
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
              value={data.pepSubCategory || ""}
              onChange={(e) => setData({ ...data, pepSubCategory: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pepRelated">Is he/she related to any PEP?*</Label>
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
            <Label htmlFor="pepRelationship">Relationship*</Label>
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
            <Label htmlFor="pepIdentification">
              Identification No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pepIdentification"
              placeholder="Enter Identification No"
              value={data.pepIdentification || ""}
              onChange={(e) => setData({ ...data, pepIdentification: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pepCategory">PEP Category*</Label>
            <Input
              id="pepCategory"
              placeholder="Enter Full Name"
              value={data.pepCategory || ""}
              onChange={(e) => setData({ ...data, pepCategory: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pepSubCat2">PEP Sub Category*</Label>
            <Input
              id="pepSubCat2"
              placeholder="Enter Full Name"
              value={data.pepSubCat2 || ""}
              onChange={(e) => setData({ ...data, pepSubCat2: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="uploadId">
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
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
                  <SelectItem value="org1">Organization 1</SelectItem>
                  <SelectItem value="org2">Organization 2</SelectItem>
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
