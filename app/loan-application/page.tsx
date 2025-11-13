"use client"

import { useState } from "react"
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

const steps = [
  "Loan Details",
  "Personal Details",
  "Co-Borrower Details",
  "Security Details",
  "Repayment Source",
  "Confirmation",
]

export default function LoanApplicationPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [loanAmount, setLoanAmount] = useState([500000])
  const [interestRate, setInterestRate] = useState([8.0])
  const [tenure, setTenure] = useState([12])
  const [showDocumentPopup, setShowDocumentPopup] = useState(false)
  const [formData, setFormData] = useState({})

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

  const calculateEMI = () => {
    const P = loanAmount[0]
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

  return (
    <div className="min-h-screen bg-gray-50">
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
                  <Select>
                    <SelectTrigger id="loan-sector" className="mt-1.5">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="housing">Housing</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="loan-subsector" className="text-gray-700 font-medium">
                    Loan Sub-Sector <span className="text-red-500">*</span>
                  </Label>
                  <Select>
                    <SelectTrigger id="loan-subsector" className="mt-1.5">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal Vehicle</SelectItem>
                      <SelectItem value="commercial">Commercial Vehicle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehicle-type" className="text-gray-700 font-medium">
                    Vechicle Type: <span className="text-red-500">*</span>
                  </Label>
                  <Select>
                    <SelectTrigger id="vehicle-type" className="mt-1.5">
                      <SelectValue placeholder="[Select]" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
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
                  <Input id="total-loan" type="text" placeholder="Enter Total Loan Amount" className="mt-1.5" />
                </div>

                <div>
                  <Label htmlFor="purpose" className="text-gray-700 font-medium">
                    Purpose <span className="text-red-500">*</span>
                  </Label>
                  <Textarea id="purpose" placeholder="Write your purpose" rows={3} className="mt-1.5" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="interest-rate" className="text-gray-700 font-medium">
                      Interest Rate (%)<span className="text-red-500">*</span>
                    </Label>
                    <Select>
                      <SelectTrigger id="interest-rate" className="mt-1.5">
                        <SelectValue placeholder="[Select]" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8.0%</SelectItem>
                        <SelectItem value="10">10.0%</SelectItem>
                        <SelectItem value="12">12.0%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tenure" className="text-gray-700 font-medium">
                      Tenure (months)<span className="text-red-500">*</span>
                    </Label>
                    <Input id="tenure" type="text" placeholder="Enter Number of Months" className="mt-1.5" />
                  </div>
                </div>
              </div>

              {/* EMI Calculator */}
              <div className="border-t pt-6 space-y-6">
                <h3 className="font-bold text-lg text-gray-900">EMI Calculator</h3>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-gray-700">Loan Amount (Nu.)</Label>
                      <span className="font-semibold text-gray-900">{loanAmount[0].toLocaleString()}</span>
                    </div>
                    <Slider
                      value={loanAmount}
                      onValueChange={setLoanAmount}
                      min={100000}
                      max={10000000}
                      step={50000}
                      className="w-full [&_[role=slider]]:bg-[#003DA5] [&_[role=slider]]:border-[#003DA5]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-gray-700">Interest Rate %</Label>
                      <span className="font-semibold text-gray-900">{interestRate[0].toFixed(1)}</span>
                    </div>
                    <Slider
                      value={interestRate}
                      onValueChange={setInterestRate}
                      min={5}
                      max={20}
                      step={0.5}
                      className="w-full [&_[role=slider]]:bg-[#003DA5] [&_[role=slider]]:border-[#003DA5]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-gray-700">Loan Tenure in Months</Label>
                      <span className="font-semibold text-gray-900">{tenure[0]}</span>
                    </div>
                    <Slider
                      value={tenure}
                      onValueChange={setTenure}
                      min={6}
                      max={60}
                      step={6}
                      className="w-full [&_[role=slider]]:bg-[#003DA5] [&_[role=slider]]:border-[#003DA5]"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg text-right border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Your EMI:</p>
                  <p className="text-4xl font-bold text-[#FF9800]">Nu. {calculateEMI()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Navigation Buttons */}
        {currentStep !== 1 && currentStep !== 2 && (
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
            className="bg-[#003DA5] hover:bg-[#002D7A] text-white px-8"
            onClick={() => setShowDocumentPopup(true)}
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
