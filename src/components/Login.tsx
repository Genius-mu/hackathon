import { useState } from "react";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import axios from "axios";
import { storeToken } from "./api/api";
import logo from "figma:asset/eb6d15466f76858f9aa3d9535154b129bc9f0c63.png";

interface LoginProps {
  userType: "patient" | "clinic" | null;
  onComplete: (data: {
    email: string;
    userType: "patient" | "clinic";
    token: string;
  }) => void;
  onBack: () => void;
  onSignup: () => void;
}

export default function Login({
  userType,
  onComplete,
  onBack,
  onSignup,
}: LoginProps) {
  const [activeTab, setActiveTab] = useState<"patient" | "clinic">(
    userType || "patient"
  );
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [profile, setProfile] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null); // store JWT after login

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const body = {
        email: formData.email,
        password: formData.password,
        userType: activeTab,
      };

      const res = await axios.post(
        "https://dosewise-2p1n.onrender.com/api/auth/login",
        body,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`${activeTab} logged in:`, res.data);

      // Store the token properly
      const token = res.data.data.token;
      const userType = activeTab;

      // Use the storeToken function from api.js
      storeToken(token, userType);

      // Also store in localStorage as backup
      localStorage.setItem(`${userType}Token`, token);

      // Proceed to next step
      onComplete({
        email: formData.email,
        userType: activeTab,
        token: token, // Pass the token to parent
      });
    } catch (err: any) {
      console.error("Login error:", err.response?.data || err.message);
      alert("Login failed. Check your email/password and try again.");
    }
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-md mx-auto">
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

          <div className="flex items-center gap-3 mb-6">
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
                  fontSize: "28px",
                }}
              >
                Welcome Back
              </h1>
              <p
                style={{
                  fontFamily: "Roboto",
                  color: "#1B4F72",
                  fontSize: "14px",
                }}
              >
                Sign in to your Dosewise account
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div
          className="p-8 rounded-xl"
          style={{
            backgroundColor: "#FFFFFF",
            boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
          }}
        >
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "patient" | "clinic")}
            className="mb-6"
          >
            <TabsList
              className="w-full grid grid-cols-2 rounded-lg p-1"
              style={{ backgroundColor: "#F2F6FA" }}
            >
              <TabsTrigger
                value="patient"
                className="rounded-lg"
                style={{ fontFamily: "Poppins" }}
              >
                Patient
              </TabsTrigger>
              <TabsTrigger
                value="clinic"
                className="rounded-lg"
                style={{ fontFamily: "Poppins" }}
              >
                Clinic
              </TabsTrigger>
            </TabsList>

            <TabsContent value="patient">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label
                    htmlFor="email"
                    className="mb-2 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" style={{ color: "#1B4F72" }} />
                    <span style={{ fontFamily: "Roboto", color: "#1B4F72" }}>
                      Email Address
                    </span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="your.email@example.com"
                    className="rounded-lg border-2"
                    style={{ borderColor: "#E8F4F8" }}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="password"
                    className="mb-2 flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" style={{ color: "#1B4F72" }} />
                    <span style={{ fontFamily: "Roboto", color: "#1B4F72" }}>
                      Password
                    </span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Enter your password"
                    className="rounded-lg border-2"
                    style={{ borderColor: "#E8F4F8" }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span
                      style={{
                        fontFamily: "Roboto",
                        color: "#1B4F72",
                        fontSize: "14px",
                      }}
                    >
                      Remember me
                    </span>
                  </label>
                  <a
                    href="#"
                    style={{
                      fontFamily: "Roboto",
                      color: "#0A3D62",
                      fontSize: "14px",
                    }}
                  >
                    Forgot password?
                  </a>
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-lg py-6"
                  style={{
                    fontFamily: "Poppins",
                    backgroundColor: "#0A3D62",
                    color: "#FFFFFF",
                  }}
                >
                  Sign In as Patient
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="clinic">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label
                    htmlFor="clinic-email"
                    className="mb-2 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" style={{ color: "#1B4F72" }} />
                    <span style={{ fontFamily: "Roboto", color: "#1B4F72" }}>
                      Professional Email
                    </span>
                  </Label>
                  <Input
                    id="clinic-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="doctor@hospital.com"
                    className="rounded-lg border-2"
                    style={{ borderColor: "#E8F4F8" }}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="clinic-password"
                    className="mb-2 flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" style={{ color: "#1B4F72" }} />
                    <span style={{ fontFamily: "Roboto", color: "#1B4F72" }}>
                      Password
                    </span>
                  </Label>
                  <Input
                    id="clinic-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Enter your password"
                    className="rounded-lg border-2"
                    style={{ borderColor: "#E8F4F8" }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span
                      style={{
                        fontFamily: "Roboto",
                        color: "#1B4F72",
                        fontSize: "14px",
                      }}
                    >
                      Remember me
                    </span>
                  </label>
                  <a
                    href="#"
                    style={{
                      fontFamily: "Roboto",
                      color: "#0A3D62",
                      fontSize: "14px",
                    }}
                  >
                    Forgot password?
                  </a>
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-lg py-6"
                  style={{
                    fontFamily: "Poppins",
                    backgroundColor: "#0A3D62",
                    color: "#FFFFFF",
                  }}
                >
                  Sign In as Clinician
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p
              style={{
                fontFamily: "Roboto",
                color: "#1B4F72",
                fontSize: "14px",
              }}
            >
              Don't have an account?{" "}
              <button
                onClick={onSignup}
                style={{
                  fontFamily: "Roboto",
                  color: "#0A3D62",
                  fontSize: "14px",
                  textDecoration: "underline",
                }}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div
          className="mt-6 p-4 rounded-lg"
          style={{ backgroundColor: "#F0F9FF" }}
        >
          <p
            style={{
              fontFamily: "Lato",
              color: "#1B4F72",
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            🔒 Your data is encrypted and HIPAA compliant
          </p>
        </div>
      </div>
    </div>
  );
}
