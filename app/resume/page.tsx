import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileEdit } from "lucide-react"

export default function ResumeApplicationPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Resume Application</h1>
                <p className="text-muted-foreground">Continue your saved loan application</p>
              </div>

              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input id="mobile" type="tel" placeholder="Enter your mobile number" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="reference-resume">Application Reference Number</Label>
                  <Input id="reference-resume" type="text" placeholder="Enter your reference number" className="mt-2" />
                </div>

                <Button className="w-full bg-primary" size="lg">
                  <FileEdit className="mr-2 h-5 w-5" />
                  Resume Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
