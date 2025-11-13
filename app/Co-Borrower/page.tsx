"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CoBorrowerDetailsFormProps {
  onNext: (data: any) => void
  onBack: () => void
  formData: any
  isFirstStep: boolean
}

export function CoBorrowerDetailsForm({ onNext, onBack, formData }: CoBorrowerDetailsFormProps) {
  const [data, setData] = useState(formData.coBorrowerDetails || {})
  const [hasCoBorrower, setHasCoBorrower] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext({ coBorrowerDetails: data })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Co-borrower Question */}
      <div className="space-y-4">
        <label className="block text-sm">
          Co-borrower (if applicable)? <span className="text-red-600">*</span>
        </label>
        <button type="button" className="px-4 py-2 bg-gray-200 text-sm text-gray-700 rounded">
          Button yes / no
        </button>
      </div>

      {/* CO-BORROWER 1 */}
      {hasCoBorrower && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold">CO-BORROWER 1</h2>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm">Salutation*</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mr">Mr.</SelectItem>
                  <SelectItem value="mrs">Mrs.</SelectItem>
                  <SelectItem value="ms">Ms.</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm">
                Co-Borrower Name <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter Full Name"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm placeholder:text-gray-400"
                value={data.coBorrowerName || ""}
                onChange={(e) => setData({ ...data, coBorrowerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm">Nationality*</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bhutanese">Bhutanese</SelectItem>
                  <SelectItem value="indian">Indian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm">
                Identification Type <span className="text-red-600">*</span>
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cid">Citizenship ID</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm">
                Identification No. <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter Identification No"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm placeholder:text-gray-400"
                value={data.coIdNo || ""}
                onChange={(e) => setData({ ...data, coIdNo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm">
                Identification Issue Date <span className="text-red-600">*</span>
              </label>
              <Input
                type="date"
                placeholder="Select Date"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm placeholder:text-gray-400"
                value={data.coIdIssueDate || ""}
                onChange={(e) => setData({ ...data, coIdIssueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm">
                Identification Expiry Date <span className="text-red-600">*</span>
              </label>
              <Input
                type="date"
                placeholder="Select Date"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm placeholder:text-gray-400"
                value={data.coIdExpiryDate || ""}
                onChange={(e) => setData({ ...data, coIdExpiryDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm">
                Date of Birth <span className="text-red-600">*</span>
              </label>
              <Input
                type="date"
                placeholder="Select Date"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm placeholder:text-gray-400"
                value={data.coDob || ""}
                onChange={(e) => setData({ ...data, coDob: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm">
                TPN No <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter TPN"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm placeholder:text-gray-400"
                value={data.coTpn || ""}
                onChange={(e) => setData({ ...data, coTpn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm">
                Marital Status <span className="text-red-600">*</span>
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm">
                Gender <span className="text-red-600">*</span>
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="[Select]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm">
                Spouse Name <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter Full Name"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm placeholder:text-gray-400"
                value={data.coSpouseName || ""}
                onChange={(e) => setData({ ...data, coSpouseName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm">
                Spouse CID No <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter CID No"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm placeholder:text-gray-400"
                value={data.coSpouseCid || ""}
                onChange={(e) => setData({ ...data, coSpouseCid: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm">
                Spouse Contact No <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter Contact No"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm placeholder:text-gray-400"
                value={data.coSpouseContact || ""}
                onChange={(e) => setData({ ...data, coSpouseContact: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm">
                Upload Family Tree <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="w-28 bg-transparent">
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground">No file chosen</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-3 pt-6">
        <Button
          type="button"
          onClick={onBack}
          variant="secondary"
          size="lg"
          className="min-w-32 px-8 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => onNext({ coBorrowerDetails: data })}
          size="lg"
          className="min-w-32 px-8 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors"
        >
          Next
        </Button>
      </div>
    </form>
  )
}
