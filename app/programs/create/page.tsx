"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TOTAL_STEPS = 5;

export default function CreateProgramPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [templateType, setTemplateType] = useState("scratch");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    startDate: "",
    endDate: "",
    applicationDeadline: "",
    capacity: "",
    location: "",
    fee: "",
    blindReview: false,
  });

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              step === currentStep
                ? "bg-primary text-primary-foreground"
                : step < currentStep
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step}
          </div>
          {step < TOTAL_STEPS && (
            <div
              className={`w-16 h-0.5 ${
                step < currentStep ? "bg-primary/20" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose a Template</h2>
              <p className="text-muted-foreground">
                Select a pre-configured template to get started quickly, or create a program from scratch.
              </p>
            </div>
            <RadioGroup value={templateType} onValueChange={setTemplateType}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="scratch" id="scratch" />
                  <Label htmlFor="scratch" className="cursor-pointer flex-1">
                    <div className="font-medium">Create from scratch</div>
                    <div className="text-sm text-muted-foreground">
                      Start with a blank program and configure all settings
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="workshop" id="workshop" />
                  <Label htmlFor="workshop" className="cursor-pointer flex-1">
                    <div className="font-medium">Workshop Template</div>
                    <div className="text-sm text-muted-foreground">
                      Pre-configured for hands-on workshops and training sessions
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="conference" id="conference" />
                  <Label htmlFor="conference" className="cursor-pointer flex-1">
                    <div className="font-medium">Conference Template</div>
                    <div className="text-sm text-muted-foreground">
                      Ideal for multi-day conferences with multiple sessions
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
              <p className="text-muted-foreground">
                Provide the essential details about your program.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Program Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Advanced Machine Learning Workshop"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide a detailed description of your program..."
                  className="mt-1 min-h-[120px]"
                />
              </div>
              <div>
                <Label htmlFor="type">Program Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select program type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="symposium">Symposium</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Schedule & Capacity</h2>
              <p className="text-muted-foreground">
                Set the dates and participant limits for your program.
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="applicationDeadline">Application Deadline *</Label>
                <Input
                  id="applicationDeadline"
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="capacity">Maximum Participants *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="e.g., 30"
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Applicants beyond this limit will be added to the waitlist
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Location & Fees</h2>
              <p className="text-muted-foreground">
                Specify where the program will be held and any associated costs.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Stanford University, Palo Alto, CA"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fee">Registration Fee</Label>
                <Input
                  id="fee"
                  type="number"
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                  placeholder="0.00"
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave blank if the program is free
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="blindReview"
                  checked={formData.blindReview}
                  onChange={(e) => setFormData({ ...formData, blindReview: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="blindReview">
                  Enable blind review (reviewers cannot see applicant names)
                </Label>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Review & Create</h2>
              <p className="text-muted-foreground">
                Review your program details before creating.
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Title</dt>
                    <dd className="text-sm">{formData.title || "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                    <dd className="text-sm capitalize">{formData.type || "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Dates</dt>
                    <dd className="text-sm">
                      {formData.startDate && formData.endDate
                        ? `${formData.startDate} to ${formData.endDate}`
                        : "Not set"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Application Deadline</dt>
                    <dd className="text-sm">{formData.applicationDeadline || "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Capacity</dt>
                    <dd className="text-sm">{formData.capacity ? `${formData.capacity} participants` : "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Location</dt>
                    <dd className="text-sm">{formData.location || "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Fee</dt>
                    <dd className="text-sm">{formData.fee ? `$${formData.fee}` : "Free"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Blind Review</dt>
                    <dd className="text-sm">{formData.blindReview ? "Enabled" : "Disabled"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Create Program</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of {TOTAL_STEPS}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {renderStepIndicator()}
            {renderStepContent()}
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              {currentStep === TOTAL_STEPS ? (
                <Button onClick={() => console.log("Create program:", formData)}>
                  Create Program
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}