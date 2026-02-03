"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { de } from "date-fns/locale"

/* ----------------------- Types ----------------------- */

interface ConfirmationProps {
  onNext: (data: any) => void
  onBack: () => void
  formData: any
}

/* ---------------- Reusable Components ---------------- */

function AccordionSection({
  title,
  children,
  defaultOpen = false,
  headerClassName = "",

}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  headerClassName?: string

}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex justify-between items-center px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-bold transition-colors
          ${headerClassName || 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
      >
        {title}
        <span className="text-xl sm:text-2xl font-bold">{open ? "−" : "+"}</span>
      </button>

      {open && <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 bg-white">{children}</div>}

    </div>
  )
}
interface FieldProps {
  label: string
  value?: any
  capitalizeFirst?: boolean // add this
}

function Field({ label, value, capitalizeFirst }: FieldProps) {
    const displayValue = value
    ? capitalizeFirst
      ? String(value).charAt(0).toUpperCase() + String(value).slice(1)
      : value
    : ""
  return (
    <div className="space-y-1.5 sm:space-y-2.5">
      <Label className="text-xs sm:text-sm font-semibold text-gray-800">{label}</Label>
      <input
        disabled
        value={displayValue}
        className="w-full h-10 sm:h-12 rounded-lg border border-gray-300 px-3 sm:px-4 bg-gray-50 text-sm sm:text-base text-gray-700"
      />
    </div>
  )
}

/* -------------------- Main Page ---------------------- */

export function Confirmation({ onNext, onBack, formData }: ConfirmationProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const laonData = formData || {}
  const personalData = formData?.personalDetails || {}
  const coBorrowerData = formData?.coBorrowerDetails || {}
  const securityData = formData?.securityDetails || {}
  const repaymentData = formData?.repaymentSource || {}

  /* ---------------- Payload Builder ---------------- */

  const buildBilPayload = () => ({
    loanData: {
      loanType: laonData.loanType,
      loanSector: laonData.loanSector,
      loanSubSector: laonData.loanSubSector,
      loanSubSectorCategory: laonData.loanSubSectorCategory,
      loanAmount: laonData.loanAmount,
      loanPurpose: laonData.loanPurpose, 
      // loanTenure: laonData.loanTenure,
    },
    personalData: {
      salutation: personalData.salutation,
      applicantName: personalData.applicantName,
      nationality: personalData.nationality,
      cid: personalData.identificationNo,
      issueDate: personalData.identificationIssueDate,
      expiryDate: personalData.identificationExpiryDate,
      gender: personalData.gender,
      dob: personalData.dateOfBirth,
      maritalStatus: personalData.maritalStatus,
      tpn: personalData.tpn,
      spouseName: personalData.spouseName,
      spouseCid: personalData.spouseCid,
      spouseContact: personalData.spouseContact,
      bankName: personalData.bankName,
      bankAccount: personalData.bankAccount,
      contact: personalData.currContact,
      alternateContact: personalData.alternateContact,
      email: personalData.currEmail,
      permCountry: personalData.permCountry,
      permDzongkhag: personalData.permDzongkhag,
      permGewog: personalData.permGewog,
      permVillage: personalData.permVillage,
      permThram: personalData.permThram,
      permHouse: personalData.permHouse,
      currCountry: personalData.currCountry,
      currDzongkhag: personalData.currDzongkhag,
      currGewog: personalData.currGewog,
      currVillage: personalData.currVillage,
      currFlat: personalData.currFlat,
      pep: personalData.pepPerson,
      pepSubCategory: personalData.pepSubCategory,
      pepRelated: personalData.pepRelated,
      pepRelationship: personalData.pepRelationship,
      bilRelated: personalData.bilRelated,
      empolymentStatus: personalData.employmentStatus,
      occupation: personalData.occupation,
      organizationName: personalData.organizationName,
      employerType: personalData.employerType,
      orgLocation: personalData.orgLocation,
      employeeId: personalData.employeeId,
      joiningDate: personalData.joiningDate,
      designation: personalData.designation,
      grade: personalData.grade,
      employeeType: personalData.employeeType,
      grossIncome: personalData.grossIncome,
    },

    coBorrowerData: {
      salutation: coBorrowerData.salutation,
      name: coBorrowerData.name,
      nationality: coBorrowerData.nationality,
      identificationType: coBorrowerData.identificationType,
      cid: coBorrowerData.cid,
      pep: coBorrowerData.pep,
      pep_related: coBorrowerData.pepRelated,
      identification_proof: coBorrowerData.identificationProof,
      relationship: coBorrowerData.relationship,
      contact: coBorrowerData.contact,
    },

    securityData: {
      securityType: securityData.securityType,
      propertyLocation: securityData.propertyLocation,
      estimatedValue: securityData.estimatedValue,
    },

    repaymentData: {
      source: repaymentData.source,
      monthlyIncome: repaymentData.monthlyIncome,
    },
  })

  /* ---------------- Submit Handler ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const bilPayload = buildBilPayload()
      const fd = new FormData()

      /* 🔹 Append structured data */
      Object.entries(bilPayload).forEach(([section, data]) => {
        if (typeof data === "object" && data !== null) {
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              fd.append(`${section}[${key}]`, String(value))
            }
          })
        }
      })

      /* 🔹 Append files */
      if (personalData.passportPhotoFile instanceof File) {
        fd.append("passportPhoto", personalData.passportPhotoFile)
      }

      if (personalData.currAddressProofFile instanceof File) {
        fd.append("currentAddressProof", personalData.currAddressProofFile)
      }

      if (personalData.permAddressProofFile instanceof File) {
        fd.append("permanentAddressProof", personalData.permAddressProofFile)
      }

      /* 🔍 DEBUG */
      console.log("---- FORM DATA DEBUG ----")
      for (const [k, v] of fd.entries()) {
        console.log(k, v)
      }

      /* 🔹 API Call */
      const res = await fetch("https://bil.example.com/api/loan-applications", {
        method: "POST",
        body: fd,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "BIL submission failed")
      }

      const response = await res.json()
      console.log("BIL SUCCESS:", response)

      onNext({ confirmation: true })
      
      router.push("/billing")
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* -------------------- UI ----------------------- */

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 md:space-y-10 pt-4 sm:pt-6 md:pt-8 pb-6 sm:pb-8 md:pb-12">

      <AccordionSection title="Loan Details"
  defaultOpen={true}
>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Field label="Loan Type" value={laonData.loanType} capitalizeFirst={true} />
          <Field label="Loan Sector" value={laonData.loanSector} capitalizeFirst={true} />
          <Field label="Loan Sub-Sector" value={laonData.loanSubSector} capitalizeFirst={true} />
          <Field label="Loan Sub-Sector Category" value={laonData.loanSubSectorCategory} capitalizeFirst={true} />
          <Field label="Loan Amount" value={laonData.loanAmount} />
          <Field label="Loan Purpose" value={laonData.loanPurpose} />
        </div>
      </AccordionSection>

      <AccordionSection title="Personal Details" 
      defaultOpen>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">Applicant Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">

           <Field label="Salutation" value={personalData.salutation} capitalizeFirst={true} />
          <Field label="Full Name" value={personalData.applicantName} capitalizeFirst={true} />
          <Field label="Nationality" value={personalData.nationality} capitalizeFirst={true} />
          <Field label="CID" value={personalData.identificationNo} />
          <Field label="Issue Date" value={personalData.identificationIssueDate} />
          <Field label="Expiry Date" value={personalData.identificationExpiryDate} /> 
          <Field label="Gender" value={personalData.gender} capitalizeFirst={true} />
          <Field label="Date of Birth" value={personalData.dateOfBirth} />
          <Field label="Marital Status" value={personalData.maritalStatus} capitalizeFirst={true} />
          <Field label="TPN" value={personalData.tpn} />
          </div>
         <div>

          {personalData.maritalStatus === "married" && (
            <>
            <div className="mt-6 sm:mt-8">
             <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">Marital Status Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <Field label = "Marital Status" value={personalData.maritalStatus} capitalizeFirst={true} />
              <Field label="Spouse Name" value={personalData.spouseName} capitalizeFirst={true} />
              <Field label="Spouse CID" value={personalData.spouseCid} />
              <Field label="Spouse Contact" value={personalData.spouseContact} />
            </div>
            </>
          )}
          </div>
          <div className="mt-6 sm:mt-8">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">Permanent Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Field label="Country" value={personalData.permCountry} capitalizeFirst={true} />
          <Field label="Dzongkhag/State" value={personalData.permDzongkhag} capitalizeFirst={true} />
          <Field label="Gewog/Province" value={personalData.permGewog} capitalizeFirst={true} />
          <Field label="Village/Street" value={personalData.permVillage} capitalizeFirst={true} />
          <Field label="Thram No." value={personalData.permThram} />
          <Field label="House No." value={personalData.permHouse} />
          </div>
          </div>

          <div className="mt-6 sm:mt-8">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">Current Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Field label="Country of Residence" value={personalData.currCountry} capitalizeFirst={true} />
          <Field label="Dzongkhag/State" value={personalData.currDzongkhag} capitalizeFirst={true} />
          <Field label="Gewog/Province" value={personalData.currGewog} capitalizeFirst={true} />
          <Field label="Village/Street" value={personalData.currVillage} capitalizeFirst={true} />
          <Field label="Flat/House No." value={personalData.currFlat} />
          </div>
          </div>

          <div className="mt-6 sm:mt-8">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">PEP Declarations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Field label="PEP Person" value={personalData.pepPerson} capitalizeFirst={true} />
          <Field label="PEP Sub-Category" value={personalData.pepSubCategory} capitalizeFirst={true} />
          <Field label="PEP Related" value={personalData.pepRelated} capitalizeFirst={true} />
          <Field label="PEP Relationship" value={personalData.pepRelationship} capitalizeFirst={true} />
          <Field label="BIL Related" value={personalData.bilRelated} capitalizeFirst={true} />
          </div>
          </div>

          <div className="mt-6 sm:mt-8">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">Employment Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Field label="Employment Status" value={personalData.employmentStatus} capitalizeFirst={true} />
          <Field label="Occupation" value={personalData.occupation} capitalizeFirst={true} />
          <Field label="Organization Name" value={personalData.organizationName} capitalizeFirst={true} />
          <Field label="Employer Type" value={personalData.employerType} capitalizeFirst={true} />
          <Field label="Organization Location" value={personalData.orgLocation} capitalizeFirst={true} />
          <Field label="Employee ID" value={personalData.employeeId} />
          <Field label="Service Joining Date" value={personalData.joiningDate} />
          <Field label="Designation" value={personalData.designation} capitalizeFirst={true} />
          <Field label="Grade" value={personalData.grade} />
          <Field label="Employee Type" value={personalData.employeeType} capitalizeFirst={true} />
          <Field label="Gross Income" value={personalData.grossIncome} />
          </div>
          </div>

          <div className="mt-6 sm:mt-8">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 sm:pb-3 mb-4 sm:mb-6">Contact Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Field label="Bank Name"  value={personalData.bankName} capitalizeFirst={true} />
          <Field label="Bank Account" value={personalData.bankAccount} />
          <Field label="Contact" value={personalData.currContact} />
          <Field label="Alternate Contact" value={personalData.alternateContact} />
          <Field label="Email" value={personalData.currEmail} />
          </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="Co-Borrower Details"
      defaultOpen>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Field label="Salutation" value={coBorrowerData.salutation} capitalizeFirst={true} />
          <Field label="Co-Borrower Name" value={coBorrowerData.name} capitalizeFirst/>
          <Field label="Nationality" value={coBorrowerData.nationality} capitalizeFirst={true} />
          <Field label="Identification Type" value={coBorrowerData.identificationType} capitalizeFirst={true} /> 
          <Field label="CID" value={coBorrowerData.cid} />
          <Field label="Politically Exposed Person" value={coBorrowerData.pep} capitalizeFirst={true} />
          <Field label="Is he/she related to PEP?" value={coBorrowerData.pepRelated} capitalizeFirst={true} />
          {/* <Field label="Relationship" value={coBorrowerData.relationship} /> */}
          {/* <Field label="Contact" value={coBorrowerData.contact} /> */}
        </div>
      </AccordionSection>

      <AccordionSection title="Security Details"
      defaultOpen>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Field label="Security Type" value={securityData.securityType} capitalizeFirst={true} />
          <Field label="Location" value={securityData.propertyLocation} capitalizeFirst={true} />
          <Field label="Estimated Value" value={securityData.estimatedValue} />
        </div>
      </AccordionSection>

      <AccordionSection title="Repayment Source"
      defaultOpen>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Field label="Source" value={repaymentData.source} capitalizeFirst={true} />
          <Field label="Monthly Income" value={repaymentData.monthlyIncome} />
        </div>
      </AccordionSection>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 font-medium">
          ❌ {error}
        </div>
      )}

      {/* <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>

        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Confirm & Submit"}
        </Button>
      </div> */}

              <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 pt-6 sm:pt-8">
                <Button
                  type="button"
                  onClick={onBack}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto min-w-[160px] h-12 sm:h-14 px-8 sm:px-12 rounded-lg font-semibold text-base border-2 border-gray-300 hover:bg-gray-50 transition-all"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full sm:w-auto min-w-[160px] h-12 sm:h-14 px-8 sm:px-12 rounded-lg font-semibold text-base bg-gray-800 hover:bg-gray-900 transition-all disabled:opacity-50"
                >
                {loading ? "Submitting..." : "Confirm & Submit"}
                </Button>
              </div>
    </form>
  )
}


// "use client"

// import type React from "react"

// import { useRouter } from "next/navigation"

// import { Button } from "@/components/ui/button"
// import { Label } from "@/components/ui/label"
// import { useState } from "react"

// interface ConfirmationProps {
//   onNext: (data: any) => void
//   onBack: () => void
//   formData: any
// }

// interface AccordionSectionProps {
//   title: string
//   children: React.ReactNode
//   defaultOpen?: boolean
// }


// export function Confirmation({ onNext, onBack, formData }: ConfirmationProps) {
//   const router = useRouter()
//   const personalData = formData ? { ...formData, ...formData.personalDetails } : {}
//   const coBorrowerData = formData?.coBorrowerDetails || {}
//   const securityData = formData?.securityDetails || {}
//   const repaymentData = formData?.repaymentSource || {}
//   const [open, setOpen] = useState(false) // open by default


  

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     onNext({ confirmation: true })
//     router.push('/billing')
//   }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-10">
//       {/* Header */}
//       <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
//         <h2 className="text-3xl font-bold text-[#003DA5] mb-2">Review & Confirmation</h2>
//         <p className="text-gray-600">
//           Please review all your information carefully before submitting your loan application.
//         </p>
//       </div>


//       {/* Personal Details Section */}
//       <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
        
//         {/* <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">Personal Details</h2> */}
//     <button
//         type="button"
//         onClick={() => setOpen(prev => !prev)}
//         className="w-full flex items-center justify-between px-8 py-6 text-left"
//       >
//         <h2 className="text-2xl font-bold text-[#003DA5]">
//           Personal Details
//         </h2>

//         <svg
//           className={`w-6 h-6 transition-transform duration-200 ${
//             open ? "rotate-180" : ""
//           }`}
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M19 9l-7 7-7-7"
//           />
//         </svg>
//       </button>

//       {open && (
      
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Salutation</Label>
//             <input
//               disabled
//               value={personalData.salutation || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Full Name</Label>
//             <input
//               disabled
//               value={personalData.applicantName || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Nationality</Label>
//             <input
//               disabled
//               value={personalData.nationality || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Identification Type</Label>
//             <input
//               disabled
//               value={personalData.identificationType || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Identification Number</Label>
//             <input
//               disabled
//               value={personalData.identificationNo || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Issue Date</Label>
//             <input
//               disabled
//               value={personalData.identificationIssueDate || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Expiry Date</Label>
//             <input
//               disabled
//               value={personalData.identificationExpiryDate || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
//             <input
//               disabled
//               value={personalData.dateOfBirth || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">TPN</Label>
//             <input
//               disabled
//               value={personalData.tpn || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Gender</Label>
//             <input
//               disabled
//               value={personalData.gender || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Marital Status</Label>
//             <input
//               disabled
//               value={personalData.maritalStatus || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           {personalData.maritalStatus === 'married' && (
//             <>
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Spouse Name</Label>
//                 <input
//                   disabled
//                   value={personalData.spouseName || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Spouse CID</Label>
//                 <input
//                   disabled
//                   value={personalData.spouseCid || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Spouse Contact</Label>
//                 <input
//                   disabled
//                   value={personalData.spouseContact || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>
//             </>
//           )}

//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Bank Account</Label>
//             <input
//               disabled
//               value={personalData.bankAccount || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Bank Name</Label>
//             <input
//               disabled
//               value={personalData.bankName || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>


//         </div>
//       )}
//     <div>
//       </div>
//       </div>

//       <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
//             <button
//         type="button"
//         onClick={() => setOpen(prev => !prev)}
//         className="w-full flex items-center justify-between px-8 py-6 text-left"
//       >
//         <h2 className="text-2xl font-bold text-[#003DA5]">
//           Employment Details
//         </h2>

//         <svg
//           className={`w-6 h-6 transition-transform duration-200 ${
//             open ? "rotate-180" : ""
//           }`}
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M19 9l-7 7-7-7"
//           />
//         </svg>
//       </button>
//       {open && (
//       <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Employment Status</Label>
//             <input
//               disabled
//               value={personalData.employmentStatus || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>
//           )}
//           {personalData.employmentStatus === 'employed' && (
//             <>
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Occupation</Label>
//                 <input
//                   disabled
//                   value={personalData.occupation || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Organization Name</Label>
//                 <input
//                   disabled
//                   value={personalData.organizationName || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Employer Type</Label>
//                 <input
//                   disabled
//                   value={personalData.employerType || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Organization Location</Label>
//                 <input
//                   disabled
//                   value={personalData.orgLocation || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Employee ID</Label>
//                 <input
//                   disabled
//                   value={personalData.employeeId || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Joining Date</Label>
//                 <input
//                   disabled
//                   value={personalData.joiningDate || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>
//             </>
//           )}
//           </div>

//       <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Email Address</Label>
//             <input
//               disabled
//               value={personalData.currEmail || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Mobile Number</Label>
//             <input
//               disabled
//               value={personalData.currContact || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Alternate Contact</Label>
//             <input
//               disabled
//               value={personalData.currAlternateContact || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>
//           </div>
//       </div>
        
//         <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
//         {/* Permanent Address */}
//         <div className="pt-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4">Permanent Address</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             <div className="space-y-2">
//               <Label className="text-sm font-medium text-gray-700">Country</Label>
//               <input
//                 disabled
//                 value={personalData.permCountry || ""}
//                 className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label className="text-sm font-medium text-gray-700">Dzongkhag/State</Label>
//               <input
//                 disabled
//                 value={personalData.permDzongkhag || ""}
//                 className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label className="text-sm font-medium text-gray-700">Gewog/Province</Label>
//               <input
//                 disabled
//                 value={personalData.permGewog || ""}
//                 className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label className="text-sm font-medium text-gray-700">Village/Street</Label>
//               <input
//                 disabled
//                 value={personalData.permVillage || ""}
//                 className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label className="text-sm font-medium text-gray-700">Thram No.</Label>
//               <input
//                 disabled
//                 value={personalData.permThram || ""}
//                 className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label className="text-sm font-medium text-gray-700">House No.</Label>
//               <input
//                 disabled
//                 value={personalData.permHouse || ""}
//                 className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//               />
//             </div>
//           </div>
//         </div>       
//       </div>
//       {/* Current/Residential Address */}
//       <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4">Current/Residential Address</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             <div className="space-y-2">
//               <Label className="text-sm font-medium text-gray-700">Country</Label>
//               <input
//                 disabled
//                 value={personalData.currCountry || ""}
//                 className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label className="text-sm font-medium text-gray-700">Dzongkhag/State</Label>
//               <input
//                 disabled
//                 value={personalData.currDzongkhag || ""}
//                 className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label className="text-sm font-medium text-gray-700">Gewog/Province</Label>
//               <input
//                 disabled
//                 value={personalData.currGewog || ""}
//                 className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label className="text-sm font-medium text-gray-700">Village/Street</Label>
//               <input
//                 disabled
//                 value={personalData.currVillage || ""}
//                 className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label className="text-sm font-medium text-gray-700">Flat/House No.</Label>
//               <input
//                 disabled
//                 value={personalData.currFlat || ""}
//                 className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//               />
//             </div>
//           </div>
//         </div>

//       <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
//       {/* PEP Declaration */}
//         <div className="pt-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4">PEP Declaration</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             <div className="space-y-2">
//               <Label className="text-sm font-medium text-gray-700">Politically Exposed Person?</Label>
//               <input
//                 disabled
//                 value={personalData.pepPerson || ""}
//                 className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//               />
//             </div>

//             {personalData.pepPerson === 'yes' && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">PEP Sub-Category</Label>
//                 <input
//                   disabled
//                   value={personalData.pepSubCategory || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>
//             )}

//             {personalData.pepPerson === 'no' && (
//               <>
//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium text-gray-700">Related to PEP</Label>
//                   <input
//                     disabled
//                     value={personalData.pepRelated || ""}
//                     className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                   />
//                 </div>

//                 {personalData.pepRelated === 'yes' && (
//                   <>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-gray-700">Relationship</Label>
//                       <input
//                         disabled
//                         value={personalData.pepRelationship || ""}
//                         className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-gray-700">PEP Identification</Label>
//                       <input
//                         disabled
//                         value={personalData.pepIdentification || ""}
//                         className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-gray-700">PEP Category</Label>
//                       <input
//                         disabled
//                         value={personalData.pepCategory || ""}
//                         className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-gray-700">PEP Sub-Category 2</Label>
//                       <input
//                         disabled
//                         value={personalData.pepSubCat2 || ""}
//                         className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                       />
//                     </div>
//                   </>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//         </div>
//       {/* Related to BIL Section */}

//       <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
//           {/* Related to BIL */}
//         <div className="pt-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4">Relationship with BIL</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             <div className="space-y-2">
//               <Label className="text-sm font-medium text-gray-700">Related to BIL Staff?</Label>
//               <input
//                 disabled
//                 value={personalData.relatedToBil || ""}
//                 className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Co-Borrower Details Section */}
//       <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
//         <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">Co-Borrower Details</h2>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Has Co-Borrower?</Label>
//             <input
//               disabled
//               value={coBorrowerData.hasCoBorrower || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           {coBorrowerData.hasCoBorrower === "yes" && (
//             <>
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Salutation</Label>
//                 <input
//                   disabled
//                   value={coBorrowerData.salutation || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Full Name</Label>
//                 <input
//                   disabled
//                   value={coBorrowerData.name || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Nationality</Label>
//                 <input
//                   disabled
//                   value={coBorrowerData.nationality || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Identification Type</Label>
//                 <input
//                   disabled
//                   value={coBorrowerData.identificationType || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Identification Number</Label>
//                 <input
//                   disabled
//                   value={coBorrowerData.identificationNo || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Issue Date</Label>
//                 <input
//                   disabled
//                   value={coBorrowerData.identificationIssueDate || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Expiry Date</Label>
//                 <input
//                   disabled
//                   value={coBorrowerData.identificationExpiryDate || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
//                 <input
//                   disabled
//                   value={coBorrowerData.dateOfBirth || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">TPN</Label>
//                 <input
//                   disabled
//                   value={coBorrowerData.tpn || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Gender</Label>
//                 <input
//                   disabled
//                   value={coBorrowerData.gender || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Marital Status</Label>
//                 <input
//                   disabled
//                   value={coBorrowerData.maritalStatus || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Email</Label>
//                 <input
//                   disabled
//                   value={coBorrowerData.email || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Contact</Label>
//                 <input
//                   disabled
//                   value={coBorrowerData.contact || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Alternate Contact</Label>
//                 <input
//                   disabled
//                   value={coBorrowerData.alternateContact || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Relationship</Label>
//                 <input
//                   disabled
//                   value={coBorrowerData.relationship || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>
//             </>
//           )}
//         </div>

//         {/* Co-Borrower Addresses */}
//         {coBorrowerData.hasCoBorrower === "yes" && (
//           <>
//             <div className="pt-6">
//               <h3 className="text-lg font-semibold text-gray-800 mb-4">Permanent Address</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium text-gray-700">Country</Label>
//                   <input
//                     disabled
//                     value={coBorrowerData.permCountry || ""}
//                     className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium text-gray-700">Dzongkhag/State</Label>
//                   <input
//                     disabled
//                     value={coBorrowerData.permDzongkhag || ""}
//                     className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium text-gray-700">Gewog/Province</Label>
//                   <input
//                     disabled
//                     value={coBorrowerData.permGewog || ""}
//                     className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium text-gray-700">Village/Street</Label>
//                   <input
//                     disabled
//                     value={coBorrowerData.permVillage || ""}
//                     className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="pt-6">
//               <h3 className="text-lg font-semibold text-gray-800 mb-4">Current/Residential Address</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium text-gray-700">Country</Label>
//                   <input
//                     disabled
//                     value={coBorrowerData.currCountry || ""}
//                     className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium text-gray-700">Dzongkhag/State</Label>
//                   <input
//                     disabled
//                     value={coBorrowerData.currDzongkhag || ""}
//                     className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium text-gray-700">Gewog/Province</Label>
//                   <input
//                     disabled
//                     value={coBorrowerData.currGewog || ""}
//                     className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium text-gray-700">Village/Street</Label>
//                   <input
//                     disabled
//                     value={coBorrowerData.currVillage || ""}
//                     className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium text-gray-700">Flat/House No.</Label>
//                   <input
//                     disabled
//                     value={coBorrowerData.currFlat || ""}
//                     className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                   />
//                 </div>
//               </div>
//             </div>
//           </>
//         )}
//       </div>

//       {/* Security Details Section */}
//       <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
//         <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">Security Details</h2>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Security Type</Label>
//             <input
//               disabled
//               value={securityData.securityType || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-700">Ownership Type</Label>
//             <input
//               disabled
//               value={securityData.ownershipType || ""}
//               className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//             />
//           </div>

//           {securityData.securityType === 'vehicle' && (
//             <>
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Vehicle Type</Label>
//                 <input
//                   disabled
//                   value={securityData.vehicleType || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Vehicle Make</Label>
//                 <input
//                   disabled
//                   value={securityData.vehicleMake || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Vehicle Model</Label>
//                 <input
//                   disabled
//                   value={securityData.vehicleModel || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Vehicle Year</Label>
//                 <input
//                   disabled
//                   value={securityData.vehicleYear || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Registration No.</Label>
//                 <input
//                   disabled
//                   value={securityData.registrationNo || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Chassis No.</Label>
//                 <input
//                   disabled
//                   value={securityData.chassisNo || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Engine No.</Label>
//                 <input
//                   disabled
//                   value={securityData.engineNo || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>
//             </>
//           )}

//           {securityData.securityType === 'land' && (
//             <>
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Dzongkhag</Label>
//                 <input
//                   disabled
//                   value={securityData.dzongkhag || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Gewog</Label>
//                 <input
//                   disabled
//                   value={securityData.gewog || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Village</Label>
//                 <input
//                   disabled
//                   value={securityData.village || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">House No.</Label>
//                 <input
//                   disabled
//                   value={securityData.houseNo || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Thram No.</Label>
//                 <input
//                   disabled
//                   value={securityData.thramNo || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Plot No.</Label>
//                 <input
//                   disabled
//                   value={securityData.plotNo || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Area</Label>
//                 <input
//                   disabled
//                   value={securityData.area || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Land Use</Label>
//                 <input
//                   disabled
//                   value={securityData.landUse || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>
//             </>
//           )}
//         </div>

//         {/* Insurance Details */}
//         {(securityData.securityType === 'vehicle' || securityData.securityType === 'land') && (
//           <div className="pt-6">
//             <h3 className="text-lg font-semibold text-gray-800 mb-4">Insurance Details</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Insurance Company</Label>
//                 <input
//                   disabled
//                   value={securityData.insuranceCompany || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Policy Number</Label>
//                 <input
//                   disabled
//                   value={securityData.policyNo || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Insurance Value</Label>
//                 <input
//                   disabled
//                   value={securityData.insuranceValue || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Start Date</Label>
//                 <input
//                   disabled
//                   value={securityData.insuranceStartDate || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Expiry Date</Label>
//                 <input
//                   disabled
//                   value={securityData.insuranceExpiryDate || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Co-Borrower/Co-Owner Details from Security */}
//         {securityData.ownershipType === 'joint' && (
//           <div className="pt-6">
//             <h3 className="text-lg font-semibold text-gray-800 mb-4">Co-Owner Details</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Salutation</Label>
//                 <input
//                   disabled
//                   value={securityData.salutation || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Co-Owner Name</Label>
//                 <input
//                   disabled
//                   value={securityData.coBorrowerName || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Nationality</Label>
//                 <input
//                   disabled
//                   value={securityData.nationality || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">ID Type</Label>
//                 <input
//                   disabled
//                   value={securityData.idType || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">ID Number</Label>
//                 <input
//                   disabled
//                   value={securityData.idNumber || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
//                 <input
//                   disabled
//                   value={securityData.dateOfBirth || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Gender</Label>
//                 <input
//                   disabled
//                   value={securityData.gender || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label className="text-sm font-medium text-gray-700">Marital Status</Label>
//                 <input
//                   disabled
//                   value={securityData.maritalStatus || ""}
//                   className="w-full h-12 rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-700"
//                 />
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Repayment Source - Income Details Section */}
//       <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
//         <h2 className="text-2xl font-bold text-[#003DA5] border-b border-gray-200 pb-4">Income Details</h2>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {repaymentData.enableMonthlySalary && (
//             <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
//               <Label className="text-sm font-semibold text-gray-700">Monthly Salary</Label>
//               <input
//                 disabled
//                 value={`Nu. ${repaymentData.monthlySalary || "0"}`}
//                 className="w-full h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700"
//               />
//             </div>
//           )}

//           {repaymentData.enableRentalIncome && (
//             <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
//               <Label className="text-sm font-semibold text-gray-700">Monthly Rental Income</Label>
//               <input
//                 disabled
//                 value={`Nu. ${repaymentData.rentalIncome || "0"}`}
//                 className="w-full h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700"
//               />
//             </div>
//           )}

//           {repaymentData.enableBusinessIncome && (
//             <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
//               <Label className="text-sm font-semibold text-gray-700">Business Income</Label>
//               <input
//                 disabled
//                 value={`Nu. ${repaymentData.businessIncome || "0"}`}
//                 className="w-full h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700"
//               />
//             </div>
//           )}

//           {repaymentData.enableVehicleHiring && (
//             <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
//               <Label className="text-sm font-semibold text-gray-700">Vehicle Hiring Income</Label>
//               <input
//                 disabled
//                 value={`Nu. ${repaymentData.vehicleHiringIncome || "0"}`}
//                 className="w-full h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700"
//               />
//             </div>
//           )}

//           {repaymentData.enableDividendIncome && (
//             <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
//               <Label className="text-sm font-semibold text-gray-700">Dividend Income</Label>
//               <input
//                 disabled
//                 value={`Nu. ${repaymentData.dividendIncome || "0"}`}
//                 className="w-full h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700"
//               />
//             </div>
//           )}

//           {repaymentData.enableAgricultureIncome && (
//             <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
//               <Label className="text-sm font-semibold text-gray-700">Agriculture Income</Label>
//               <input
//                 disabled
//                 value={`Nu. ${repaymentData.agricultureIncome || "0"}`}
//                 className="w-full h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700"
//               />
//             </div>
//           )}

//           {repaymentData.enableTruckTaxiIncome && (
//             <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
//               <Label className="text-sm font-semibold text-gray-700">Truck/Taxi Income</Label>
//               <input
//                 disabled
//                 value={`Nu. ${repaymentData.truckTaxiIncome || "0"}`}
//                 className="w-full h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700"
//               />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Action Buttons */}
//       <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4">
//         <Button
//           type="button"
//           onClick={onBack}
//           variant="secondary"
//           size="lg"
//           className="w-full sm:w-auto min-w-40 px-10 py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
//         >
//           Back
//         </Button>
//         <Button
//           type="submit"
//           size="lg"
//           className="w-full sm:w-auto min-w-40 px-10 py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all bg-[#003DA5] hover:bg-[#002D7A]"
//         >
//           Confirm & Submit
//         </Button>
//       </div>
//     </form>
//   )
// }
