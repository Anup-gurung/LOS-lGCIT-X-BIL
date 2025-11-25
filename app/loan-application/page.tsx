"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Percent, Calendar } from "lucide-react"
import DocumentPopup from "@/components/DocumentPopup"
import { PersonalDetailsForm } from "@/components/PersonalDetail"
import { CoBorrowerDetailsForm } from "@/components/CoBorrowerDetail"
import { SecurityDetailsForm } from "@/components/SecurityDetail"
import { RepaymentSourceForm } from "@/components/RepaymentSource"
import { fetchLoanData } from "@/services/api"

const steps = [
  "Loan Details",
  "Personal Details",
  "Co-Borrower Details",
  "Security Details",
  "Repayment Source",
  "Confirmation",
]

export default function LoanApplicationPage() {
  const searchParams = useSearchParams()
  const stepParam = searchParams.get('step')
  const [currentStep, setCurrentStep] = useState(stepParam ? parseInt(stepParam) : 0)
  const [loanAmount, setLoanAmount] = useState([500000])
  const [interestRate, setInterestRate] = useState([8.0])
  const [tenure, setTenure] = useState([12])
  const [totalLoanInput, setTotalLoanInput] = useState("")
  const [showDocumentPopup, setShowDocumentPopup] = useState(false)
  const [formData, setFormData] = useState({})
  const [loanSectorOptions, setLoanSectorOptions] = useState<any[]>([])
  const [loanSubSectorOptions, setLoanSubSectorOptions] = useState<any[]>([])
  const [selectedSector, setSelectedSector] = useState("")
  const [selectedSubSector, setSelectedSubSector] = useState("")
  const [loanTypeOptions, setLoanTypeOptions] = useState<any[]>([])
  const [selectedLoanType, setSelectedLoanType] = useState("")
  const [subSectorCategoryOptions, setSubSectorCategoryOptions] = useState<any[]>([])
  const [selectedSubSectorCategory, setSelectedSubSectorCategory] = useState("")

  useEffect(() => {
    // Load loan data from API
    const loadLoanData = async () => {
      try {
        const result = await fetchLoanData()
        if (result && result.loanSector && Array.isArray(result.loanSector)) {
          setLoanSectorOptions(result.loanSector)
        }
        if (result && result.loanType && Array.isArray(result.loanType)) {
          setLoanTypeOptions(result.loanType)
        }
      } catch (error) {
        console.error('Failed to load loan data:', error)
      }
    }
    loadLoanData()
  }, [])

  // Filter sub-sectors when sector is selected
  useEffect(() => {
    if (selectedSector) {
      const sector = loanSectorOptions.find(
        (s) => s.loan_sector_code_1 === selectedSector
      )
      if (sector && sector.loanSubSector && Array.isArray(sector.loanSubSector)) {
        setLoanSubSectorOptions(sector.loanSubSector)
      } else {
        setLoanSubSectorOptions([])
      }
      setSelectedSubSector("")
    } else {
      setLoanSubSectorOptions([])
      setSelectedSubSector("")
    }
  }, [selectedSector, loanSectorOptions])

  // Filter sub-sector categories when sub-sector is selected
  useEffect(() => {
    if (selectedSubSector) {
      const subSectorIndex = parseInt(selectedSubSector.split('-')[1])
      const subSector = loanSubSectorOptions[subSectorIndex]
      
      if (subSector && subSector.loanSubSectorCategory && Array.isArray(subSector.loanSubSectorCategory)) {
        setSubSectorCategoryOptions(subSector.loanSubSectorCategory)
      } else {
        setSubSectorCategoryOptions([])
      }
      setSelectedSubSectorCategory("")
    } else {
      setSubSectorCategoryOptions([])
      setSelectedSubSectorCategory("")
    }
  }, [selectedSubSector, loanSubSectorOptions])

  const handlePersonalDetailsNext = (data: any) => {
    setFormData({ ...formData, ...data })
    setCurrentStep(2) // Move to Co-Borrower Details step
  }

  const handlePersonalDetailsBack = () => {
    setCurrentStep(0) // Go back to Loan Details step
  }

  const handleCoBorrowerDetailsNext = (data: any) => {
    setFormData({ ...formData, ...data })
    setCurrentStep(3) // Move to Security Details step
  }

  const handleCoBorrowerDetailsBack = () => {
    setCurrentStep(1) // Go back to Personal Details step
  }

  const handleSecurityDetailsNext = (data: any) => {
    setFormData({ ...formData, ...data })
    setCurrentStep(4) // Move to Repayment Source step
  }

  const handleSecurityDetailsBack = () => {
    setCurrentStep(2) // Go back to Co-Borrower Details step
  }

  const handleRepaymentSourceNext = (data: any) => {
    setFormData({ ...formData, ...data })
    setCurrentStep(5) // Move to Confirmation step
  }

  const handleRepaymentSourceBack = () => {
    setCurrentStep(3) // Go back to Security Details step
  }

  const calculateEMI = () => {
    // Return 0 if no loan amount is entered
    if (!totalLoanInput || totalLoanInput === "" || parseFloat(totalLoanInput) <= 0) {
      return "0.00"
    }
    
    const P = parseFloat(totalLoanInput)
    const r = interestRate[0] / 12 / 100 // Monthly interest rate
    const n = tenure[0] // Loan tenure in months
    
    // If interest rate is 0, simply divide principal by tenure
    if (r === 0) {
      return (P / n).toFixed(2)
    }
    
    // EMI Formula: P × r × (1 + r)^n / ((1 + r)^n - 1)
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    
    // Check for valid number
    if (isNaN(emi) || !isFinite(emi)) {
      return "0.00"
    }
    
    return emi.toFixed(2)
  }

  const isFormValid = () => {
    return (
      selectedSector !== "" &&
      selectedLoanType !== "" &&
      selectedSubSector !== "" &&
      selectedSubSectorCategory !== "" &&
      totalLoanInput !== "" &&
      parseFloat(totalLoanInput) > 0
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-6xl mx-auto gap-2">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-full h-12 flex items-center justify-center rounded-lg font-medium text-sm transition-colors ${
                      index === currentStep
                        ? "bg-[#FF9800] text-white"
                        : index < currentStep
                          ? "bg-gray-300 text-gray-700"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        {currentStep === 1 ? (
          <div className="max-w-7xl mx-auto">
            <PersonalDetailsForm
              onNext={handlePersonalDetailsNext}
              onBack={handlePersonalDetailsBack}
              formData={formData}
              isFirstStep={false}
            />
          </div>
        ) : currentStep === 2 ? (
          <div className="max-w-7xl mx-auto">
            <CoBorrowerDetailsForm
              onNext={handleCoBorrowerDetailsNext}
              onBack={handleCoBorrowerDetailsBack}
              formData={formData}
            />
          </div>
        ) : currentStep === 3 ? (
          <div className="max-w-7xl mx-auto">
            <SecurityDetailsForm
              onNext={handleSecurityDetailsNext}
              onBack={handleSecurityDetailsBack}
              formData={formData}
            />
          </div>
        ) : currentStep === 4 ? (
          <div className="max-w-7xl mx-auto">
            <RepaymentSourceForm
              onNext={handleRepaymentSourceNext}
              onBack={handleRepaymentSourceBack}
              formData={formData}
            />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Left Side - Form Fields */}
            <Card className="shadow-lg border-gray-200">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="loan-sector" className="text-gray-700 font-medium">
                    Loan Sector <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedSector} onValueChange={setSelectedSector}>
                    <SelectTrigger id="loan-sector" className="mt-1.5">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
                      {loanSectorOptions.length > 0 ? (
                        loanSectorOptions.map((option, index) => (
                          <SelectItem key={option.loan_sector_code_1 || index} value={option.loan_sector_code_1}>
                            {option.loan_sector}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehicle-type" className="text-gray-700 font-medium">
                    Loan Type: <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedLoanType} onValueChange={setSelectedLoanType}>
                    <SelectTrigger id="vehicle-type" className="mt-1.5">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
                      {loanTypeOptions.length > 0 ? (
                        loanTypeOptions.map((option, index) => (
                          <SelectItem key={`loantype-${index}`} value={`${option.loan_type_code_1}-${index}`}>
                            {option.loan_type}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="loan-subsector" className="text-gray-700 font-medium">
                    Loan Sub-Sector <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedSubSector} onValueChange={setSelectedSubSector}>
                    <SelectTrigger id="loan-subsector" className="mt-1.5">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
                      {loanSubSectorOptions.length > 0 ? (
                        loanSubSectorOptions.map((option, index) => (
                          <SelectItem key={`subsector-${index}`} value={`${option.sector_link_code}-${index}`}>
                            {option.sub_sector}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>
                          {selectedSector ? 'No sub-sectors available' : 'Select sector first'}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sub-sector-category" className="text-gray-700 font-medium">
                    Loan Sub-Sector Category <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedSubSectorCategory} onValueChange={setSelectedSubSectorCategory}>
                    <SelectTrigger id="sub-sector-category" className="mt-1.5">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
                      {subSectorCategoryOptions.length > 0 ? (
                        subSectorCategoryOptions.map((option, index) => (
                          <SelectItem key={`category-${index}`} value={`${option.sub_sector_link_code}-${index}`}>
                            {option.sub_cat_sector}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>
                          {selectedSubSector ? 'No categories available' : 'Select sub-sector first'}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Loan Info Box */}
              <div className="bg-blue-50 p-6 rounded-lg space-y-4 border border-blue-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Transport Loan</h3>
                  <p className="text-sm italic text-gray-600">"Fuel Your Fleet, Accelerate Your Success."</p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Transport Commercial Loan</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Drive your commercial transport business forward with financing solutions for vehicle purchase, and
                    operational upgrades.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-[#FF9800] text-white p-5 rounded-lg shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5" />
                      <span className="text-sm font-medium">Loan Tenure</span>
                    </div>
                    <p className="text-3xl font-bold">5 Years</p>
                  </div>

                  <div className="bg-[#FF9800] text-white p-5 rounded-lg shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="h-5 w-5" />
                      <span className="text-sm font-medium">Interest Rate</span>
                    </div>
                    <p className="text-3xl font-bold">12.45%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Side - EMI Calculator */}
          <Card className="shadow-lg border-gray-200">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="total-loan" className="text-gray-700 font-medium">
                    Total Loan Required (Nu.) <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="total-loan" 
                    type="number" 
                    placeholder="Enter Total Loan Amount" 
                    className="mt-1.5" 
                    value={totalLoanInput}
                    onChange={(e) => setTotalLoanInput(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="purpose" className="text-gray-700 font-medium">
                    Purpose <span className="text-red-500">*</span>
                  </Label>
                  <Textarea id="purpose" placeholder="Write your purpose" rows={3} className="mt-1.5" />
                </div>
              </div>

              {/* EMI Display */}
              <div className="border-t pt-6">
                <div className="bg-gradient-to-br from-[#FF9800] to-[#FF6F00] p-10 rounded-xl text-center shadow-lg">
                  <p className="text-lg text-white/90 mb-3 font-medium">Your Monthly EMI</p>
                  <p className="text-6xl font-bold text-white">Nu. {calculateEMI()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Navigation Buttons */}
        {currentStep !== 1 && currentStep !== 2 && currentStep !== 3 && currentStep !== 4 && (
        <div className="flex justify-center gap-4 mt-8">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="bg-gray-500 hover:bg-gray-600 text-white px-8"
          >
            Back
          </Button>
          <Button
            size="lg"
            className="bg-[#003DA5] hover:bg-[#002D7A] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShowDocumentPopup(true)}
            disabled={!isFormValid()}
          >
            Next
          </Button>
        </div>
        )}
      </div>

      <DocumentPopup 
        open={showDocumentPopup} 
        onOpenChange={setShowDocumentPopup}
        onProceed={() => setCurrentStep(1)}
      />
    </div>
  )
}
