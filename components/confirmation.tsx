"use client"

import type React from "react"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface ConfirmationProps {
  onNext: (data: any) => void
  onBack: () => void
  formData: any
}

export function Confirmation({ onNext, onBack, formData }: ConfirmationProps) {
  const router = useRouter()
  const personalData = formData.personalDetails || {}
  const coBorrowerData = formData.coBorrowerDetails || {}
  const securityData = formData.securityDetails || {}
  const repaymentData = formData.repaymentSource || {}

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext({ confirmation: true })
    router.push('/billing')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <h2 className="text-3xl font-bold text-[#003DA5] mb-2">Review & Confirmation</h2>
        <p className="text-gray-600">
          Please review all your information carefully before submitting your loan application.
        </p>
      </div>

      {/* Personal Details Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">Personal Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Salutation</Label>
            <input
              disabled
              value={personalData.salutation || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Full Name</Label>
            <input
              disabled
              value={personalData.applicantName || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Nationality</Label>
            <input
              disabled
              value={personalData.nationality || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Identification Type</Label>
            <input
              disabled
              value={personalData.identificationType || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Identification Number</Label>
            <input
              disabled
              value={personalData.identificationNo || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Issue Date</Label>
            <input
              disabled
              value={personalData.identificationIssueDate || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Expiry Date</Label>
            <input
              disabled
              value={personalData.identificationExpiryDate || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
            <input
              disabled
              value={personalData.dateOfBirth || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">TPN</Label>
            <input
              disabled
              value={personalData.tpn || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Gender</Label>
            <input
              disabled
              value={personalData.gender || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Marital Status</Label>
            <input
              disabled
              value={personalData.maritalStatus || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          {personalData.maritalStatus === 'married' && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Spouse Name</Label>
                <input
                  disabled
                  value={personalData.spouseName || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Spouse CID</Label>
                <input
                  disabled
                  value={personalData.spouseCid || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Spouse Contact</Label>
                <input
                  disabled
                  value={personalData.spouseContact || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Bank Account</Label>
            <input
              disabled
              value={personalData.bankAccount || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Bank Name</Label>
            <input
              disabled
              value={personalData.bankName || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Email Address</Label>
            <input
              disabled
              value={personalData.currEmail || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Mobile Number</Label>
            <input
              disabled
              value={personalData.currContact || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Alternate Contact</Label>
            <input
              disabled
              value={personalData.currAlternateContact || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Employment Status</Label>
            <input
              disabled
              value={personalData.employmentStatus || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          {personalData.employmentStatus === 'employed' && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Occupation</Label>
                <input
                  disabled
                  value={personalData.occupation || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Organization Name</Label>
                <input
                  disabled
                  value={personalData.organizationName || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Employer Type</Label>
                <input
                  disabled
                  value={personalData.employerType || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Organization Location</Label>
                <input
                  disabled
                  value={personalData.orgLocation || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Employee ID</Label>
                <input
                  disabled
                  value={personalData.employeeId || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Joining Date</Label>
                <input
                  disabled
                  value={personalData.joiningDate || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>
            </>
          )}
        </div>

        {/* Permanent Address */}
        <div className="pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Permanent Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Country</Label>
              <input
                disabled
                value={personalData.permCountry || ""}
                className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Dzongkhag/State</Label>
              <input
                disabled
                value={personalData.permDzongkhag || ""}
                className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Gewog/Province</Label>
              <input
                disabled
                value={personalData.permGewog || ""}
                className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Village/Street</Label>
              <input
                disabled
                value={personalData.permVillage || ""}
                className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Thram No.</Label>
              <input
                disabled
                value={personalData.permThram || ""}
                className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">House No.</Label>
              <input
                disabled
                value={personalData.permHouse || ""}
                className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Current/Residential Address */}
        <div className="pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Current/Residential Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Country</Label>
              <input
                disabled
                value={personalData.currCountry || ""}
                className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Dzongkhag/State</Label>
              <input
                disabled
                value={personalData.currDzongkhag || ""}
                className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Gewog/Province</Label>
              <input
                disabled
                value={personalData.currGewog || ""}
                className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Village/Street</Label>
              <input
                disabled
                value={personalData.currVillage || ""}
                className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Flat/House No.</Label>
              <input
                disabled
                value={personalData.currFlat || ""}
                className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* PEP Declaration */}
        <div className="pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">PEP Declaration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Politically Exposed Person?</Label>
              <input
                disabled
                value={personalData.pepPerson || ""}
                className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
              />
            </div>

            {personalData.pepPerson === 'yes' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">PEP Sub-Category</Label>
                <input
                  disabled
                  value={personalData.pepSubCategory || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>
            )}

            {personalData.pepPerson === 'no' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Related to PEP</Label>
                  <input
                    disabled
                    value={personalData.pepRelated || ""}
                    className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                  />
                </div>

                {personalData.pepRelated === 'yes' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Relationship</Label>
                      <input
                        disabled
                        value={personalData.pepRelationship || ""}
                        className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">PEP Identification</Label>
                      <input
                        disabled
                        value={personalData.pepIdentification || ""}
                        className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">PEP Category</Label>
                      <input
                        disabled
                        value={personalData.pepCategory || ""}
                        className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">PEP Sub-Category 2</Label>
                      <input
                        disabled
                        value={personalData.pepSubCat2 || ""}
                        className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Related to BIL */}
        <div className="pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Relationship with BIL</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Related to BIL Staff?</Label>
              <input
                disabled
                value={personalData.relatedToBil || ""}
                className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Co-Borrower Details Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">Co-Borrower Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Has Co-Borrower?</Label>
            <input
              disabled
              value={coBorrowerData.hasCoBorrower || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          {coBorrowerData.hasCoBorrower === "yes" && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Salutation</Label>
                <input
                  disabled
                  value={coBorrowerData.salutation || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                <input
                  disabled
                  value={coBorrowerData.name || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Nationality</Label>
                <input
                  disabled
                  value={coBorrowerData.nationality || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Identification Type</Label>
                <input
                  disabled
                  value={coBorrowerData.identificationType || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Identification Number</Label>
                <input
                  disabled
                  value={coBorrowerData.identificationNo || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Issue Date</Label>
                <input
                  disabled
                  value={coBorrowerData.identificationIssueDate || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Expiry Date</Label>
                <input
                  disabled
                  value={coBorrowerData.identificationExpiryDate || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
                <input
                  disabled
                  value={coBorrowerData.dateOfBirth || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">TPN</Label>
                <input
                  disabled
                  value={coBorrowerData.tpn || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Gender</Label>
                <input
                  disabled
                  value={coBorrowerData.gender || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Marital Status</Label>
                <input
                  disabled
                  value={coBorrowerData.maritalStatus || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <input
                  disabled
                  value={coBorrowerData.email || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Contact</Label>
                <input
                  disabled
                  value={coBorrowerData.contact || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Alternate Contact</Label>
                <input
                  disabled
                  value={coBorrowerData.alternateContact || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Relationship</Label>
                <input
                  disabled
                  value={coBorrowerData.relationship || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>
            </>
          )}
        </div>

        {/* Co-Borrower Addresses */}
        {coBorrowerData.hasCoBorrower === "yes" && (
          <>
            <div className="pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Permanent Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Country</Label>
                  <input
                    disabled
                    value={coBorrowerData.permCountry || ""}
                    className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Dzongkhag/State</Label>
                  <input
                    disabled
                    value={coBorrowerData.permDzongkhag || ""}
                    className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Gewog/Province</Label>
                  <input
                    disabled
                    value={coBorrowerData.permGewog || ""}
                    className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Village/Street</Label>
                  <input
                    disabled
                    value={coBorrowerData.permVillage || ""}
                    className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Current/Residential Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Country</Label>
                  <input
                    disabled
                    value={coBorrowerData.currCountry || ""}
                    className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Dzongkhag/State</Label>
                  <input
                    disabled
                    value={coBorrowerData.currDzongkhag || ""}
                    className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Gewog/Province</Label>
                  <input
                    disabled
                    value={coBorrowerData.currGewog || ""}
                    className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Village/Street</Label>
                  <input
                    disabled
                    value={coBorrowerData.currVillage || ""}
                    className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Flat/House No.</Label>
                  <input
                    disabled
                    value={coBorrowerData.currFlat || ""}
                    className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Security Details Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">Security Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Security Type</Label>
            <input
              disabled
              value={securityData.securityType || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Ownership Type</Label>
            <input
              disabled
              value={securityData.ownershipType || ""}
              className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
            />
          </div>

          {securityData.securityType === 'vehicle' && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Vehicle Type</Label>
                <input
                  disabled
                  value={securityData.vehicleType || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Vehicle Make</Label>
                <input
                  disabled
                  value={securityData.vehicleMake || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Vehicle Model</Label>
                <input
                  disabled
                  value={securityData.vehicleModel || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Vehicle Year</Label>
                <input
                  disabled
                  value={securityData.vehicleYear || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Registration No.</Label>
                <input
                  disabled
                  value={securityData.registrationNo || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Chassis No.</Label>
                <input
                  disabled
                  value={securityData.chassisNo || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Engine No.</Label>
                <input
                  disabled
                  value={securityData.engineNo || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>
            </>
          )}

          {securityData.securityType === 'land' && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Dzongkhag</Label>
                <input
                  disabled
                  value={securityData.dzongkhag || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Gewog</Label>
                <input
                  disabled
                  value={securityData.gewog || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Village</Label>
                <input
                  disabled
                  value={securityData.village || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">House No.</Label>
                <input
                  disabled
                  value={securityData.houseNo || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Thram No.</Label>
                <input
                  disabled
                  value={securityData.thramNo || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Plot No.</Label>
                <input
                  disabled
                  value={securityData.plotNo || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Area</Label>
                <input
                  disabled
                  value={securityData.area || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Land Use</Label>
                <input
                  disabled
                  value={securityData.landUse || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>
            </>
          )}
        </div>

        {/* Insurance Details */}
        {(securityData.securityType === 'vehicle' || securityData.securityType === 'land') && (
          <div className="pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Insurance Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Insurance Company</Label>
                <input
                  disabled
                  value={securityData.insuranceCompany || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Policy Number</Label>
                <input
                  disabled
                  value={securityData.policyNo || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Insurance Value</Label>
                <input
                  disabled
                  value={securityData.insuranceValue || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Start Date</Label>
                <input
                  disabled
                  value={securityData.insuranceStartDate || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Expiry Date</Label>
                <input
                  disabled
                  value={securityData.insuranceExpiryDate || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Co-Borrower/Co-Owner Details from Security */}
        {securityData.ownershipType === 'joint' && (
          <div className="pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Co-Owner Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Salutation</Label>
                <input
                  disabled
                  value={securityData.salutation || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Co-Owner Name</Label>
                <input
                  disabled
                  value={securityData.coBorrowerName || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Nationality</Label>
                <input
                  disabled
                  value={securityData.nationality || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">ID Type</Label>
                <input
                  disabled
                  value={securityData.idType || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">ID Number</Label>
                <input
                  disabled
                  value={securityData.idNumber || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
                <input
                  disabled
                  value={securityData.dateOfBirth || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Gender</Label>
                <input
                  disabled
                  value={securityData.gender || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Marital Status</Label>
                <input
                  disabled
                  value={securityData.maritalStatus || ""}
                  className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Repayment Source - Income Details Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">Income Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repaymentData.enableMonthlySalary && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Monthly Salary</Label>
              <input
                disabled
                value={`Nu. ${repaymentData.monthlySalary || "0"}`}
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700"
              />
            </div>
          )}

          {repaymentData.enableRentalIncome && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Monthly Rental Income</Label>
              <input
                disabled
                value={`Nu. ${repaymentData.rentalIncome || "0"}`}
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700"
              />
            </div>
          )}

          {repaymentData.enableBusinessIncome && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Business Income</Label>
              <input
                disabled
                value={`Nu. ${repaymentData.businessIncome || "0"}`}
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700"
              />
            </div>
          )}

          {repaymentData.enableVehicleHiring && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Vehicle Hiring Income</Label>
              <input
                disabled
                value={`Nu. ${repaymentData.vehicleHiringIncome || "0"}`}
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700"
              />
            </div>
          )}

          {repaymentData.enableDividendIncome && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Dividend Income</Label>
              <input
                disabled
                value={`Nu. ${repaymentData.dividendIncome || "0"}`}
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700"
              />
            </div>
          )}

          {repaymentData.enableAgricultureIncome && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Agriculture Income</Label>
              <input
                disabled
                value={`Nu. ${repaymentData.agricultureIncome || "0"}`}
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700"
              />
            </div>
          )}

          {repaymentData.enableTruckTaxiIncome && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Truck/Taxi Income</Label>
              <input
                disabled
                value={`Nu. ${repaymentData.truckTaxiIncome || "0"}`}
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700"
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4">
        <Button
          type="button"
          onClick={onBack}
          variant="secondary"
          size="lg"
          className="w-full sm:w-auto min-w-40 px-10 py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto min-w-40 px-10 py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all bg-[#003DA5] hover:bg-[#002D7A]"
        >
          Confirm & Submit
        </Button>
      </div>
    </form>
  )
}
