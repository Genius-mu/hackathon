import { useState } from "react";
import {
  ArrowLeft,
  Upload,
  User,
  Mail,
  Calendar,
  Phone,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { storeToken } from "./api/api";
import axios from "axios";
import logo from "figma:asset/eb6d15466f76858f9aa3d9535154b129bc9f0c63.png";

interface PatientOnboardingProps {
  onComplete: (data: {
    name: string;
    password: string;
    dob: string;
    email: string;
    gender: string;
    phone: string;
    address: string;
    allergies: string;
    token: string; // Add this
  }) => void;
  onBack: () => void;
}

export default function PatientOnboarding({
  onComplete,
  onBack,
}: PatientOnboardingProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    dob: "",
    email: "",
    gender: "",
    countryCode: "+234",
    phone: "",
    address: "",
    allergies: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else {
      setLoading(true);
      try {
        // Complete registration even without files
        const res = await axios.post(
          "https://dosewise-2p1n.onrender.com/api/auth/patient/register",
          {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            dob: formData.dob,
            gender:
              formData.gender.charAt(0).toUpperCase() +
              formData.gender.slice(1),
            phone: `${formData.countryCode}${formData.phone.replace(
              /\D/g,
              ""
            )}`,
            address: formData.address,
            allergies: formData.allergies
              ? formData.allergies.split(",").map((a) => a.trim())
              : [],
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const token = res.data.data.token;
        storeToken(token, "patient");
        console.log("Patient created, token stored:", token);

        onComplete({
          ...formData,
          token: token,
        });
      } catch (err: any) {
        console.error("Error creating patient:", err.response || err.message);

        // Even if there's an error, check if it's just about files and proceed
        if (
          err.response?.data?.message?.includes("file") ||
          err.response?.data?.message?.includes("upload")
        ) {
          // If it's just a file-related error, proceed with onboarding
          console.warn("File upload failed, but proceeding with user creation");
          onComplete({
            ...formData,
            token: "dummy-token-or-handle-differently", // You'll need to handle this case
          });
        } else {
          alert("Failed to create patient. Check console for details.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileNames = Array.from(files).map((f) => f.name);
      setUploadedFiles((prev) => [...prev, ...fileNames]);
    }
  };

  const isStep1Valid =
    formData.name &&
    formData.password &&
    formData.dob &&
    formData.email &&
    formData.gender &&
    formData.countryCode &&
    formData.phone &&
    formData.address;

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 mb-6 transition-colors"
            style={{ color: "#1B4F72" }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span style={{ fontFamily: "Roboto" }}>Back</span>
          </button>
          <div className="flex items-center gap-3 mb-4">
            <img
              src={logo}
              alt="Dosewise Logo"
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1
                style={{
                  fontFamily: "Nunito Sans",
                  color: "#0A3D62",
                  fontSize: "32px",
                }}
              >
                Welcome to Dosewise
              </h1>
            </div>
          </div>
          <p
            style={{ fontFamily: "Roboto", color: "#1B4F72", fontSize: "16px" }}
          >
            Let's set up your account in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-2">
            <div
              className="h-2 rounded-full flex-1 transition-all"
              style={{ backgroundColor: step >= 1 ? "#0A3D62" : "#E8F4F8" }}
            />
            <div
              className="h-2 rounded-full flex-1 transition-all"
              style={{ backgroundColor: step >= 2 ? "#0A3D62" : "#E8F4F8" }}
            />
          </div>
          <div className="flex justify-between">
            <span
              style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "14px" }}
            >
              Basic Info
            </span>
            <span
              style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "14px" }}
            >
              Medical Records
            </span>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div
            className="p-8 rounded-xl"
            style={{
              backgroundColor: "#FFFFFF",
              boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
            }}
          >
            <h2
              className="mb-6"
              style={{
                fontFamily: "Nunito Sans",
                color: "#0A3D62",
                fontSize: "24px",
              }}
            >
              Basic Information
            </h2>
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" style={{ color: "#1B4F72" }} />
                  <span style={{ fontFamily: "Roboto", color: "#1B4F72" }}>
                    Full Name *
                  </span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Doe"
                  className="rounded-lg border-2"
                  style={{ borderColor: "#E8F4F8" }}
                />
              </div>
              <div>
                <Label
                  htmlFor="password"
                  className="mb-2 flex items-center gap-2"
                >
                  <User className="w-4 h-4" style={{ color: "#1B4F72" }} />
                  <span style={{ fontFamily: "Roboto", color: "#1B4F72" }}>
                    Password *
                  </span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter a secure password"
                  className="rounded-lg border-2"
                  style={{ borderColor: "#E8F4F8" }}
                />
              </div>

              <div>
                <Label htmlFor="dob" className="mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: "#1B4F72" }} />
                  <span style={{ fontFamily: "Roboto", color: "#1B4F72" }}>
                    Date of Birth *
                  </span>
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) =>
                    setFormData({ ...formData, dob: e.target.value })
                  }
                  className="rounded-lg border-2"
                  style={{ borderColor: "#E8F4F8" }}
                />
                <p
                  className="mt-2"
                  style={{
                    fontFamily: "Lato",
                    color: "#1B4F72",
                    fontSize: "12px",
                  }}
                >
                  Required for emergency access
                </p>
              </div>
              <div>
                <Label htmlFor="email" className="mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: "#1B4F72" }} />
                  <span style={{ fontFamily: "Roboto", color: "#1B4F72" }}>
                    Email Address *
                  </span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john.doe@example.com"
                  className="rounded-lg border-2"
                  style={{ borderColor: "#E8F4F8" }}
                />
              </div>
              <div>
                <Label
                  htmlFor="gender"
                  className="mb-2 flex items-center gap-2"
                >
                  <User className="w-4 h-4" style={{ color: "#1B4F72" }} />
                  <span style={{ fontFamily: "Roboto", color: "#1B4F72" }}>
                    Gender *
                  </span>
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger
                    className="rounded-lg border-2"
                    style={{ borderColor: "#E8F4F8" }}
                  >
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone" className="mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" style={{ color: "#1B4F72" }} />
                  <span style={{ fontFamily: "Roboto", color: "#1B4F72" }}>
                    Phone Number *
                  </span>
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.countryCode}
                    onValueChange={(value) =>
                      setFormData({ ...formData, countryCode: value })
                    }
                  >
                    <SelectTrigger
                      className="w-32 rounded-lg border-2"
                      style={{ borderColor: "#E8F4F8" }}
                    >
                      <SelectValue placeholder="+234" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+234">🇳🇬 +234</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      <SelectItem value="+91">🇮🇳 +91</SelectItem>
                      <SelectItem value="+27">🇿🇦 +27</SelectItem>
                      <SelectItem value="+254">🇰🇪 +254</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="8012345678"
                    className="flex-1 rounded-lg border-2"
                    style={{ borderColor: "#E8F4F8" }}
                  />
                </div>
              </div>
              <div>
                <Label
                  htmlFor="address"
                  className="mb-2 flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" style={{ color: "#1B4F72" }} />
                  <span style={{ fontFamily: "Roboto", color: "#1B4F72" }}>
                    Address *
                  </span>
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="123 Main St, City, Country"
                  className="rounded-lg border-2"
                  style={{ borderColor: "#E8F4F8" }}
                />
              </div>
              <div>
                <Label
                  htmlFor="allergies"
                  className="mb-2 flex items-center gap-2"
                >
                  <AlertCircle
                    className="w-4 h-4"
                    style={{ color: "#1B4F72" }}
                  />
                  <span style={{ fontFamily: "Roboto", color: "#1B4F72" }}>
                    Allergies (if any)
                  </span>
                </Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) =>
                    setFormData({ ...formData, allergies: e.target.value })
                  }
                  placeholder="List any known allergies"
                  className="rounded-lg border-2"
                  style={{ borderColor: "#E8F4F8" }}
                />
              </div>
            </div>
            <div className="mt-8">
              <Button
                onClick={handleNext}
                disabled={!isStep1Valid}
                className="w-full rounded-lg py-6"
                style={{
                  fontFamily: "Poppins",
                  backgroundColor: isStep1Valid ? "#0A3D62" : "#E8F4F8",
                  color: isStep1Valid ? "#FFFFFF" : "#1B4F72",
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Medical Records Upload */}
        {step === 2 && (
          <div
            className="p-8 rounded-xl"
            style={{
              backgroundColor: "#FFFFFF",
              boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
            }}
          >
            <h2
              className="mb-6"
              style={{
                fontFamily: "Nunito Sans",
                color: "#0A3D62",
                fontSize: "24px",
              }}
            >
              Upload Medical Records (Optional)
            </h2>
            <p
              className="mb-6"
              style={{
                fontFamily: "Roboto",
                color: "#1B4F72",
                fontSize: "14px",
              }}
            >
              Upload any existing medical records, prescriptions, or lab
              results. Our AI will automatically extract and organize the
              information.
            </p>

            <div
              className="border-2 border-dashed rounded-xl p-12 text-center mb-6 transition-colors hover:border-opacity-100"
              style={{ borderColor: "#E8F4F8", backgroundColor: "#F2F6FA" }}
            >
              <Upload
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "#1B4F72" }}
              />
              <p
                className="mb-2"
                style={{ fontFamily: "Nunito Sans", color: "#0A3D62" }}
              >
                Drag and drop files here
              </p>
              <p
                className="mb-4"
                style={{
                  fontFamily: "Lato",
                  color: "#1B4F72",
                  fontSize: "14px",
                }}
              >
                or
              </p>
              <label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span
                  className="inline-block px-6 py-3 rounded-lg cursor-pointer"
                  style={{
                    fontFamily: "Poppins",
                    backgroundColor: "#E8F4F8",
                    color: "#0A3D62",
                  }}
                >
                  Browse Files
                </span>
              </label>
              <p
                className="mt-4"
                style={{
                  fontFamily: "Lato",
                  color: "#1B4F72",
                  fontSize: "12px",
                }}
              >
                Supported formats: PDF, JPG, PNG, CSV
              </p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mb-6">
                <h3
                  className="mb-3"
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "16px",
                  }}
                >
                  Uploaded Files ({uploadedFiles.length})
                </h3>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg flex items-center gap-3"
                      style={{ backgroundColor: "#F2F6FA" }}
                    >
                      <Upload
                        className="w-4 h-4"
                        style={{ color: "#1B4F72" }}
                      />
                      <span
                        style={{
                          fontFamily: "Roboto",
                          color: "#1B4F72",
                          fontSize: "14px",
                        }}
                      >
                        {file}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 rounded-lg py-6 border-2"
                style={{
                  fontFamily: "Poppins",
                  borderColor: "#1B4F72",
                  color: "#1B4F72",
                }}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 rounded-lg py-6"
                style={{
                  fontFamily: "Poppins",
                  backgroundColor: "#0A3D62",
                  color: "#FFFFFF",
                }}
              >
                Upload & Complete
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
