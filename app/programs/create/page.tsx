"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TOTAL_STEPS = 5;

const programSchema = z.object({
  title: z.string().min(1, "Program title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.string().min(1, "Program type is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  application_deadline: z.string().min(1, "Application deadline is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  location: z.string().min(1, "Location is required"),
  fee: z.number().optional(),
  blind_review: z.boolean().optional(),
}).refine((data) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  return !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate < endDate;
}, {
  message: "Start date must be before end date",
  path: ["end_date"],
}).refine((data) => {
  const appDeadline = new Date(data.application_deadline);
  const startDate = new Date(data.start_date);
  return !isNaN(appDeadline.getTime()) && !isNaN(startDate.getTime()) && appDeadline < startDate;
}, {
  message: "Application deadline must be before start date",
  path: ["application_deadline"],
});

type ProgramForm = z.infer<typeof programSchema>;

export default function CreateProgramPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [templateType, setTemplateType] = useState("scratch");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const { user } = useAuth();

  const form = useForm<ProgramForm>({
    resolver: zodResolver(programSchema),
    mode: "onBlur", // Validate on blur for better UX
    reValidateMode: "onChange", // Re-validate on change after first validation
    defaultValues: {
      title: "",
      description: "",
      type: "",
      start_date: "",
      end_date: "",
      application_deadline: "",
      capacity: 30,
      location: "",
      fee: undefined,
      blind_review: false,
    },
  });

  // Trigger validation when reaching the review step
  useEffect(() => {
    if (currentStep === TOTAL_STEPS) {
      form.trigger(); // Validate all fields when on review step
    }
  }, [currentStep, form]);

  // Debug log form state
  useEffect(() => {
    console.log("Form state:", {
      errors: form.formState.errors,
      isValid: form.formState.isValid,
      values: form.getValues(),
    });
  }, [form.formState.errors, form.formState.isValid]);

  const handleNext = async () => {
    // Validate current step fields before proceeding
    let fieldsToValidate: (keyof ProgramForm)[] = [];
    
    switch (currentStep) {
      case 2: // Basic Information
        fieldsToValidate = ["title", "description", "type"];
        break;
      case 3: // Schedule & Capacity
        fieldsToValidate = ["start_date", "end_date", "application_deadline", "capacity"];
        break;
      case 4: // Location & Fees
        fieldsToValidate = ["location"];
        break;
    }
    
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate);
      if (!isValid) {
        return; // Don't proceed if validation fails
      }
    }
    
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: ProgramForm) => {
    if (!user) {
      setError("You must be logged in to create a program");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Debug log the data being submitted
      console.log("Submitting program data:", data);
      
      const response = await fetch("/api/programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.error || "Failed to create program");
      }

      const { program } = await response.json();
      console.log("Program created successfully:", program);
      router.push(`/programs/${program.id}`);
    } catch (err) {
      console.error("Submit error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
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
                  {...form.register("title")}
                  placeholder="e.g., Advanced Machine Learning Workshop"
                  className="mt-1"
                />
                {form.formState.errors.title?.message && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Provide a detailed description of your program..."
                  className="mt-1 min-h-[120px]"
                />
                {form.formState.errors.description?.message && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.description.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="type">Program Type *</Label>
                <Select
                  value={form.watch("type")}
                  onValueChange={(value) => form.setValue("type", value)}
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
                {form.formState.errors.type?.message && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.type.message}</p>
                )}
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
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    {...form.register("start_date")}
                    className="mt-1"
                  />
                  {form.formState.errors.start_date?.message && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.start_date.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    {...form.register("end_date")}
                    className="mt-1"
                  />
                  {form.formState.errors.end_date?.message && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.end_date.message}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="application_deadline">Application Deadline *</Label>
                <Input
                  id="application_deadline"
                  type="date"
                  {...form.register("application_deadline")}
                  className="mt-1"
                />
                {form.formState.errors.application_deadline?.message && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.application_deadline.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="capacity">Maximum Participants *</Label>
                <Input
                  id="capacity"
                  type="number"
                  {...form.register("capacity", { 
                    valueAsNumber: true,
                    setValueAs: (value) => value === '' ? 0 : Number(value)
                  })}
                  placeholder="e.g., 30"
                  className="mt-1"
                />
                {form.formState.errors.capacity?.message && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.capacity.message}</p>
                )}
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
                  {...form.register("location")}
                  placeholder="e.g., Stanford University, Palo Alto, CA"
                  className="mt-1"
                />
                {form.formState.errors.location?.message && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.location.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="fee">Registration Fee</Label>
                <Input
                  id="fee"
                  type="number"
                  step="0.01"
                  {...form.register("fee", { 
                    valueAsNumber: true,
                    setValueAs: (value) => value === '' ? undefined : Number(value)
                  })}
                  placeholder="0.00"
                  className="mt-1"
                />
                {form.formState.errors.fee?.message && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.fee.message}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Leave blank if the program is free
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="blind_review"
                  {...form.register("blind_review")}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="blind_review">
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
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}
            <Card>
              <CardContent className="pt-6">
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Title</dt>
                    <dd className="text-sm">{form.watch("title") || "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                    <dd className="text-sm capitalize">{form.watch("type") || "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Dates</dt>
                    <dd className="text-sm">
                      {form.watch("start_date") && form.watch("end_date")
                        ? `${form.watch("start_date")} to ${form.watch("end_date")}`
                        : "Not set"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Application Deadline</dt>
                    <dd className="text-sm">{form.watch("application_deadline") || "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Capacity</dt>
                    <dd className="text-sm">{form.watch("capacity") ? `${form.watch("capacity")} participants` : "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Location</dt>
                    <dd className="text-sm">{form.watch("location") || "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Fee</dt>
                    <dd className="text-sm">{form.watch("fee") ? `$${form.watch("fee")}` : "Free"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Blind Review</dt>
                    <dd className="text-sm">{form.watch("blind_review") ? "Enabled" : "Disabled"}</dd>
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
            
            {/* Debug panel (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Debug Info</h3>
                <div className="text-xs space-y-1">
                  <div>Form Valid: {form.formState.isValid ? 'Yes' : 'No'}</div>
                  <div>Error Count: {Object.keys(form.formState.errors).length}</div>
                  {Object.entries(form.formState.errors).map(([field, error]) => (
                    <div key={field} className="text-red-600">
                      {field}: {error?.message || 'Unknown error'}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Show validation message on review step if form is incomplete */}
            {currentStep === TOTAL_STEPS && Object.keys(form.formState.errors).length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Please go back and fill in all required fields before creating the program.
                  Issues with: {Object.keys(form.formState.errors).join(", ")}
                </p>
                <div className="mt-2 text-xs text-yellow-700">
                  {Object.entries(form.formState.errors).map(([field, error]) => (
                    <div key={field}>
                      {field}: {error?.message || "Invalid value"}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              {currentStep === TOTAL_STEPS ? (
                <Button 
                  onClick={form.handleSubmit(onSubmit)} 
                  disabled={isSubmitting || Object.keys(form.formState.errors).length > 0}
                >
                  {isSubmitting ? "Creating..." : "Create Program"}
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