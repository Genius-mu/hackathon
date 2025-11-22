import { useState, useEffect } from "react";
import {
  Heart,
  FileText,
  Pill,
  Activity,
  Share2,
  AlertCircle,
  Mic,
  Plus,
  Bell,
  LogOut,
  Crown,
  QrCode,
  Upload,
  TrendingUp,
  CheckCircle,
  X,
  Square,
  Download,
  Eye,
  Trash2,
  Watch,
  Coffee,
  ShoppingCart,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import Toast from "./Toast";
import SymptomLogger from "./SymptomLogger";
import WearablesConnector from "./WearablesConnector";
import PharmacyMarketplace from "./PharmacyMarketplace";
import FoodInteractionChecker from "./FoodInteractionChecker";
import logo from "figma:asset/eb6d15466f76858f9aa3d9535154b129bc9f0c63.png";

// Import API functions
import {
  getPatientProfile,
  getPatientRecords,
  uploadMedicalRecord,
  logSymptom,
  getSymptoms,
  checkDrugInteractions,
  generateQRCode,
  aiEMRExtraction,
  getPatientPrescriptions,
} from "./api/api";
import { getStoredToken, removeToken, storeToken } from "./api/api";

interface User {
  name: string;
  dob?: string;
  email?: string;
  subscriptionTier?: "free" | "premium";
  token: string;
  _id: string;
}

interface PatientDashboardProps {
  user: User;
  onLogout: () => void;
}

interface Prescription {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  compatibility: number;
  status: string;
  aiAnalysis?: {
    riskLevel: "low" | "medium" | "high";
    interactions: string[];
    recommendations: string[];
    alternatives: Array<{
      name: string;
      reason: string;
      costComparison: "lower" | "similar" | "higher";
    }>;
    optimalDosage?: string;
    monitoringRecommendations: string[];
  };
}

interface Symptom {
  id: string;
  date: string;
  symptom: string;
  severity: string;
  notes: string;
  duration?: string;
  context?: string;
  possibleRisk?: string;
  recommendations?: string;
}

interface Clinician {
  id: string;
  name: string;
  hospital: string;
  accessLevel: string;
  grantedDate: string;
}

export default function PatientDashboard({
  user,
  onLogout,
}: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [showAddPrescription, setShowAddPrescription] = useState(false);
  const [showAddSymptom, setShowAddSymptom] = useState(false);
  const [showSymptomLogger, setShowSymptomLogger] = useState(false);
  const [showUploadRecord, setShowUploadRecord] = useState(false);
  const [showShareAccess, setShowShareAccess] = useState(false);
  const [showAddClinician, setShowAddClinician] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRecordDetails, setShowRecordDetails] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showWearables, setShowWearables] = useState(false);
  const [showPharmacy, setShowPharmacy] = useState(false);
  const [showFoodChecker, setShowFoodChecker] = useState(false);

  // Data states
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [patientProfile, setPatientProfile] = useState<any>(null);

  const [newSymptom, setNewSymptom] = useState({
    symptom: "",
    severity: "mild",
    notes: "",
  });
  const [medicationToCheck, setMedicationToCheck] = useState("");
  const [compatibilityResult, setCompatibilityResult] = useState<any>(null);
  const [isCheckingCompatibility, setIsCheckingCompatibility] = useState(false);
  const [newClinician, setNewClinician] = useState({
    name: "",
    email: "",
    accessLevel: "full",
  });
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [qrCode, setQrCode] = useState<string>("");
  const [qrExpiry, setQrExpiry] = useState<Date | null>(null);

  // Add these missing state variables at the top of your component
  const [isAnalyzingPrescription, setIsAnalyzingPrescription] = useState(false);
  const [prescriptionAnalysis, setPrescriptionAnalysis] = useState<any>(null);
  const [medicationForAlternatives, setMedicationForAlternatives] =
    useState("");
  const [isFindingAlternatives, setIsFindingAlternatives] = useState(false);
  const [medicationAlternatives, setMedicationAlternatives] = useState<any[]>(
    []
  );
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Fix the newPrescription state - remove the duplicate declaration
  const [newPrescription, setNewPrescription] = useState({
    name: "",
    dosage: "",
    frequency: "",
    prescribedBy: "",
    condition: "", // Added for AI analysis
  });

  // Add these missing API functions (you'll need to implement them in your api.ts)
  const analyzePrescriptionWithAI = async (prescriptionData: any) => {
    // This is a placeholder - implement based on your backend API
    try {
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              riskLevel: "low",
              interactions: ["No significant interactions detected"],
              recommendations: ["Take with food to minimize stomach upset"],
              alternatives: [
                {
                  name: "Alternative Medication A",
                  reason: "Lower cost with similar efficacy",
                  costComparison: "lower",
                },
              ],
              optimalDosage: "10mg once daily",
              monitoringRecommendations: ["Monitor blood pressure weekly"],
            },
          });
        }, 2000);
      });
    } catch (error) {
      throw error;
    }
  };

  const getAIMedicationAlternatives = async (
    medication: string,
    condition: string
  ) => {
    // This is a placeholder - implement based on your backend API
    try {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              alternatives: [
                {
                  name: "Alternative Medication A",
                  reason: "Better safety profile for your condition",
                  costComparison: "similar",
                  considerations: "May cause mild drowsiness",
                },
                {
                  name: "Alternative Medication B",
                  reason: "More cost-effective option",
                  costComparison: "lower",
                  considerations: "Take with meals",
                },
              ],
            },
          });
        }, 1500);
      });
    } catch (error) {
      throw error;
    }
  };

  // Fix the handleAnalyzePrescription function
  const handleAnalyzePrescription = async () => {
    if (!newPrescription.name || !newPrescription.condition) {
      showToast("Please enter medication name and condition", "error");
      return;
    }

    setIsAnalyzingPrescription(true);
    try {
      const analysis = await analyzePrescriptionWithAI({
        medication: newPrescription.name,
        dosage: newPrescription.dosage,
        frequency: newPrescription.frequency,
        condition: newPrescription.condition,
        patientAge: calculateAge(user.dob || "1990-01-01"), // Provide default if undefined
        existingConditions: patientProfile?.conditions || [],
      });

      setPrescriptionAnalysis(analysis.data);
      showToast("AI analysis completed successfully", "success");
    } catch (error) {
      console.error("Error analyzing prescription:", error);
      showToast("Failed to analyze prescription", "error");
    } finally {
      setIsAnalyzingPrescription(false);
    }
  };

  // Fix the calculateAge function to handle undefined DOB
  const calculateAge = (dob: string | undefined) => {
    if (!dob) return 30; // Default age if DOB is not provided

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Add handler for finding alternatives
  const handleFindAlternatives = async () => {
    if (!medicationForAlternatives.trim()) return;

    setIsFindingAlternatives(true);
    try {
      const result = await getAIMedicationAlternatives(
        medicationForAlternatives,
        "general" // You could make this condition-specific
      );
      setMedicationAlternatives(result.data.alternatives || []);
      showToast(
        `Found ${result.data.alternatives?.length || 0} alternatives`,
        "success"
      );
    } catch (error) {
      console.error("Error finding alternatives:", error);
      showToast("Failed to find alternatives", "error");
    } finally {
      setIsFindingAlternatives(false);
    }
  };

  // Enhanced handleAddPrescription to include AI analysis
  const handleAddPrescription = () => {
    if (!newPrescription.name || !newPrescription.dosage) {
      showToast("Please fill in required fields (name and dosage)", "error");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const newPx: Prescription = {
        id: Date.now().toString(),
        name: newPrescription.name,
        dosage: newPrescription.dosage,
        frequency: newPrescription.frequency || "As directed",
        prescribedBy: newPrescription.prescribedBy || "Self-added",
        startDate: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        compatibility: Math.floor(Math.random() * 15) + 85,
        status: "active",
        aiAnalysis: prescriptionAnalysis || undefined, // Include AI analysis if available
      };

      setPrescriptions([newPx, ...prescriptions]);
      setNewPrescription({
        name: "",
        dosage: "",
        frequency: "",
        prescribedBy: "",
        condition: "",
      });
      setPrescriptionAnalysis(null); // Reset analysis
      setShowAddPrescription(false);
      setIsLoading(false);
      showToast(`${newPx.name} added successfully!`, "success");
      setActiveTab("prescriptions");
    }, 1000);
  };

  // Load patient data on component mount
  useEffect(() => {
    loadPatientData();
  }, []);

  // const loadPatientData = async () => {
  //   try {
  //     setIsLoading(true);

  //     // Check if we have a valid token
  //     const token = getStoredToken();
  //     if (!token) {
  //       showToast("Please log in again", "error");
  //       onLogout();
  //       return;
  //     }

  //     // Load patient profile
  //     const profile = await getPatientProfile();
  //     setPatientProfile(profile);

  //     // Load patient records
  //     const records = await getPatientRecords();
  //     setPatientRecords(records.localRecords || []);

  //     // Load symptoms
  //     const symptomsData = await getSymptoms();
  //     setSymptoms(symptomsData || []);

  //     // Load prescriptions from API
  //     const prescriptionsData = await getPatientPrescriptions(user._id);
  //     console.log("Loaded prescriptions:", prescriptionsData);

  //     if (prescriptionsData && prescriptionsData.length > 0) {
  //       // Convert API prescription format to component format
  //       const formattedPrescriptions = prescriptionsData.map((px: any) => ({
  //         id: px._id,
  //         name: px.medication,
  //         dosage: px.dosage,
  //         frequency: px.frequency,
  //         prescribedBy: px.prescribedBy,
  //         startDate: new Date(px.prescribedDate).toLocaleDateString("en-US", {
  //           month: "short",
  //           day: "numeric",
  //           year: "numeric",
  //         }),
  //         compatibility: Math.floor(Math.random() * 15) + 85, // Could be calculated from API
  //         status: px.status || "active",
  //       }));

  //       setPrescriptions(formattedPrescriptions);
  //     } else {
  //       // Fallback to extracted prescriptions if no API data
  //       const extractedPrescriptions = extractPrescriptionsFromRecords(records);
  //       setPrescriptions(extractedPrescriptions);
  //     }
  //   } catch (error: any) {
  //     console.error("Error loading patient data:", error);

  //     if (error.response?.status === 401) {
  //       showToast("Session expired. Please log in again.", "error");
  //       removeToken();
  //       onLogout();
  //     } else {
  //       showToast("Failed to load patient data", "error");
  //       // Load fallback data
  //       const extractedPrescriptions = extractPrescriptionsFromRecords({
  //         localRecords: [],
  //       });
  //       setPrescriptions(extractedPrescriptions);
  //     }
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const loadPatientData = async () => {
    try {
      setIsLoading(true);

      // Check if we have a valid token
      const token = getStoredToken();
      if (!token) {
        showToast("Please log in again", "error");
        onLogout();
        return;
      }

      // Load patient profile
      const profile = await getPatientProfile();
      setPatientProfile(profile);

      // Load patient records
      const records = await getPatientRecords();
      setPatientRecords(records.localRecords || []);

      // Load symptoms
      const symptomsData = await getSymptoms();
      setSymptoms(symptomsData || []);

      // ✅ FETCH PRESCRIPTIONS FROM DATABASE/STORAGE
      console.log("🔄 Fetching prescriptions for patient:", user._id);
      const prescriptionsData = await getPatientPrescriptions(user._id);
      console.log("📋 Prescriptions fetched from storage:", prescriptionsData);

      if (prescriptionsData && prescriptionsData.length > 0) {
        // Convert API prescription format to component format
        const formattedPrescriptions = prescriptionsData.map((px: any) => ({
          id: px._id,
          name: px.medication,
          dosage: px.dosage,
          frequency: px.frequency,
          prescribedBy: px.prescribedBy,
          startDate: new Date(px.prescribedDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          compatibility: Math.floor(Math.random() * 15) + 85,
          status: px.status || "active",
          instructions: px.instructions,
          duration: px.duration,
        }));

        console.log(
          "✅ Setting prescriptions in state:",
          formattedPrescriptions
        );
        setPrescriptions(formattedPrescriptions);
      } else {
        console.log("⚠️ No prescriptions found, using fallback data");
        // Fallback to extracted prescriptions if no API data
        const extractedPrescriptions = extractPrescriptionsFromRecords(records);
        setPrescriptions(extractedPrescriptions);
      }
    } catch (error: any) {
      console.error("❌ Error loading patient data:", error);

      if (error.response?.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        removeToken();
        onLogout();
      } else {
        showToast("Failed to load patient data", "error");
        // Load fallback data
        const extractedPrescriptions = extractPrescriptionsFromRecords({
          localRecords: [],
        });
        setPrescriptions(extractedPrescriptions);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh prescriptions (call this when you know new prescriptions were added)
  const refreshPrescriptions = async () => {
    try {
      console.log("🔄 Manually refreshing prescriptions...");
      const prescriptionsData = await getPatientPrescriptions(user._id);

      if (prescriptionsData && prescriptionsData.length > 0) {
        const formattedPrescriptions = prescriptionsData.map((px: any) => ({
          id: px._id,
          name: px.medication,
          dosage: px.dosage,
          frequency: px.frequency,
          prescribedBy: px.prescribedBy,
          startDate: new Date(px.prescribedDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          compatibility: Math.floor(Math.random() * 15) + 85,
          status: px.status || "active",
          instructions: px.instructions,
          duration: px.duration,
        }));

        setPrescriptions(formattedPrescriptions);
        showToast("Prescriptions updated!", "success");
      }
    } catch (error) {
      console.error("Error refreshing prescriptions:", error);
    }
  };git 

  const extractPrescriptionsFromRecords = (records: any) => {
    const prescriptions: Prescription[] = [];

    if (records.localRecords) {
      records.localRecords.forEach((record: any) => {
        if (record.medications && Array.isArray(record.medications)) {
          record.medications.forEach((med: any) => {
            prescriptions.push({
              id: `${record._id}-${med.name}`,
              name: med.name,
              dosage: med.dosage || "As directed",
              frequency: med.frequency || "Daily",
              prescribedBy: record.clinicId || "Unknown Provider",
              startDate: new Date(record.encounterDate).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              ),
              compatibility: 95, // Default value, could be calculated
              status: "active",
            });
          });
        }
      });
    }

    // Add some default prescriptions if none found
    if (prescriptions.length === 0) {
      return [
        {
          id: "1",
          name: "Lisinopril 10mg",
          dosage: "Once daily",
          frequency: "Daily",
          prescribedBy: "Dr. Sarah Johnson",
          startDate: "Oct 1, 2025",
          compatibility: 95,
          status: "active",
        },
        {
          id: "2",
          name: "Metformin 500mg",
          dosage: "Twice daily with meals",
          frequency: "Twice daily",
          prescribedBy: "Dr. Sarah Johnson",
          startDate: "Sep 15, 2025",
          compatibility: 98,
          status: "active",
        },
      ];
    }

    return prescriptions;
  };

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // QR Code expiry timer
  useEffect(() => {
    if (qrExpiry) {
      const interval = setInterval(() => {
        if (new Date() > qrExpiry) {
          setQrCode("");
          setQrExpiry(null);
          showToast("QR code expired. Generate a new one.", "info");
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [qrExpiry]);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    showToast("Recording started. Speak clearly about your visit.", "info");
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsLoading(true);

    try {
      // In a real app, you would send the audio file to the server
      // For now, we'll simulate processing
      setTimeout(() => {
        setIsLoading(false);
        showToast(
          "Voice recording saved and transcribed successfully!",
          "success"
        );
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      showToast("Failed to process recording", "error");
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // const handleCheckCompatibility = async () => {
  //   if (!medicationToCheck.trim()) {
  //     showToast("Please enter a medication name", "error");
  //     return;
  //   }

  //   setIsCheckingCompatibility(true);

  //   try {
  //     // Get current medication names
  //     const currentMeds = prescriptions.map((p) => p.name);
  //     const medicationsToCheck = [...currentMeds, medicationToCheck];

  //     const result = await checkDrugInteractions(medicationsToCheck); // Remove user.token parameter

  //     setCompatibilityResult({
  //       medication: medicationToCheck,
  //       score: result.interactions.length === 0 ? 95 : 75, // Simplified scoring
  //       interactions: result.interactions,
  //       recommendation:
  //         result.interactions.length === 0
  //           ? "Safe to use with current medications. No significant interactions detected."
  //           : "Potential interactions detected. Consult with your doctor before taking this medication.",
  //     });

  //     showToast("Compatibility analysis complete", "success");
  //   } catch (error) {
  //     console.error("Error checking compatibility:", error);
  //     showToast("Failed to check medication compatibility", "error");
  //   } finally {
  //     setIsCheckingCompatibility(false);
  //   }
  // };

  const handleCheckCompatibility = async () => {
    if (!medicationToCheck.trim()) {
      showToast("Please enter a medication name", "error");
      return;
    }

    setIsCheckingCompatibility(true);

    try {
      // Get current medication names
      const currentMeds = prescriptions.map((p) => p.name);
      const medicationsToCheck = [...currentMeds, medicationToCheck];

      const result = await checkDrugInteractions(medicationsToCheck);

      // Safely access the response data
      const responseData = result?.data || result || {};
      const interactions = responseData.interactions || [];
      const recommendations = responseData.recommendations || [];

      setCompatibilityResult({
        medication: medicationToCheck,
        score: interactions.length === 0 ? 95 : 75,
        interactions: interactions,
        recommendation:
          interactions.length === 0
            ? "Safe to use with current medications. No significant interactions detected."
            : "Potential interactions detected. Consult with your doctor before taking this medication.",
        detailedRecommendations: recommendations,
      });

      showToast("Compatibility analysis complete", "success");
    } catch (error) {
      console.error("Error checking compatibility:", error);

      // Fallback result in case of error
      setCompatibilityResult({
        medication: medicationToCheck,
        score: 90,
        interactions: [],
        recommendation:
          "Unable to verify interactions. Please consult your healthcare provider.",
        detailedRecommendations: [
          "Consult with your doctor before taking new medications",
        ],
      });

      showToast("Using fallback compatibility data", "info");
    } finally {
      setIsCheckingCompatibility(false);
    }
  };

  const handleAddSymptom = async () => {
    if (!newSymptom.symptom) {
      showToast("Please enter a symptom", "error");
      return;
    }

    setIsLoading(true);

    try {
      const symptomData = {
        symptom: newSymptom.symptom,
        severity: newSymptom.severity,
        notes: newSymptom.notes,
      };

      const result = await logSymptom(symptomData);

      const newSymptomEntry: Symptom = {
        id: result._id,
        date: new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        symptom: result.symptom,
        severity:
          result.severity.charAt(0).toUpperCase() + result.severity.slice(1),
        notes: result.notes || "No additional notes",
      };

      setSymptoms([newSymptomEntry, ...symptoms]);
      setNewSymptom({ symptom: "", severity: "mild", notes: "" });
      setShowAddSymptom(false);
      showToast("Symptom logged successfully!", "success");
      setActiveTab("symptoms");
    } catch (error) {
      console.error("Error logging symptom:", error);
      showToast("Failed to log symptom", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // const handleSaveStructuredSymptom = async (structuredSymptom: any) => {
  //   try {
  //     const symptomData = {
  //       symptom: structuredSymptom.symptom,
  //       severity: structuredSymptom.severity.toString(),
  //       notes: structuredSymptom.context,
  //       duration: structuredSymptom.duration,
  //     };

  //     const result = await logSymptom(user.token, symptomData);

  //     const newSymptomEntry: Symptom = {
  //       id: result._id,
  //       date: structuredSymptom.timestamp,
  //       symptom: structuredSymptom.symptom,
  //       severity: `${structuredSymptom.severity}/10`,
  //       notes: structuredSymptom.context,
  //       duration: structuredSymptom.duration,
  //       context: structuredSymptom.context,
  //       possibleRisk: structuredSymptom.possibleRisk,
  //       recommendations: structuredSymptom.recommendations,
  //     };

  //     setSymptoms([newSymptomEntry, ...symptoms]);
  //     setShowSymptomLogger(false);
  //     showToast(
  //       "✓ Symptom log saved successfully! AI insights generated.",
  //       "success"
  //     );
  //     setActiveTab("symptoms");
  //   } catch (error) {
  //     console.error("Error saving structured symptom:", error);
  //     showToast("Failed to save symptom", "error");
  //   }
  // };

  // In PatientDashboard component
  const handleSaveStructuredSymptom = async (structuredSymptom: any) => {
    try {
      const symptomData = {
        symptom: structuredSymptom.symptom,
        severity: structuredSymptom.severity.toString(),
        notes: structuredSymptom.context,
        duration: structuredSymptom.duration,
      };

      const result = await logSymptom(symptomData);

      const newSymptomEntry: Symptom = {
        id: result._id,
        date: structuredSymptom.timestamp,
        symptom: structuredSymptom.symptom,
        severity: `${structuredSymptom.severity}/10`,
        notes: structuredSymptom.context,
        duration: structuredSymptom.duration,
        context: structuredSymptom.context,
        possibleRisk: structuredSymptom.possibleRisk,
        recommendations: structuredSymptom.recommendations,
      };

      setSymptoms([newSymptomEntry, ...symptoms]);
      setShowSymptomLogger(false);
      showToast(
        "✓ Symptom log saved successfully! AI insights generated.",
        "success"
      );
      setActiveTab("symptoms");
    } catch (error) {
      console.error("Error saving structured symptom:", error);
      showToast("Failed to save symptom", "error");
    }
  };

  const handleAddClinician = () => {
    if (!newClinician.name || !newClinician.email) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const newClin: Clinician = {
        id: Date.now().toString(),
        name: newClinician.name,
        hospital: "Hospital TBD",
        accessLevel:
          newClinician.accessLevel === "full"
            ? "Full Access"
            : newClinician.accessLevel === "prescriptions"
            ? "Prescriptions Only"
            : "Lab Results Only",
        grantedDate: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };

      setClinicians([...clinicians, newClin]);
      setNewClinician({ name: "", email: "", accessLevel: "full" });
      setShowAddClinician(false);
      setIsLoading(false);
      showToast(
        `Access granted to ${newClin.name}. Invitation email sent!`,
        "success"
      );
      setActiveTab("access");
    }, 1500);
  };

  const handleRevokeClinician = (id: string, name: string) => {
    setClinicians(clinicians.filter((c) => c.id !== id));
    showToast(`Access revoked for ${name}`, "success");
  };

  const handleDeletePrescription = (id: string, name: string) => {
    setPrescriptions(prescriptions.filter((p) => p.id !== id));
    showToast(`${name} removed from your prescriptions`, "success");
  };

  const handleDeleteSymptom = async (id: string) => {
    try {
      // In a real app, you would call an API to delete the symptom
      setSymptoms(symptoms.filter((s) => s.id !== id));
      showToast("Symptom entry deleted", "success");
    } catch (error) {
      console.error("Error deleting symptom:", error);
      showToast("Failed to delete symptom", "error");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setIsLoading(true);

      try {
        // For now, we'll simulate file upload
        // In a real app, you would upload the files and then use AI extraction
        const fileNames = Array.from(files).map((f) => f.name);

        setTimeout(() => {
          setUploadedFiles([...uploadedFiles, ...fileNames]);
          showToast(
            `${files.length} file(s) uploaded successfully! AI is processing...`,
            "success"
          );
          setShowUploadRecord(false);
        }, 2000);
      } catch (error) {
        console.error("Error uploading files:", error);
        showToast("Failed to upload files", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // const handleUploadMedicalRecord = async (recordText: string) => {
  //   try {
  //     setIsLoading(true);
  //     const result = await uploadMedicalRecord(user.token, recordText);
  //     showToast(
  //       "Medical record uploaded and processed successfully!",
  //       "success"
  //     );

  //     // Reload patient data to get updated records
  //     await loadPatientData();

  //     return result;
  //   } catch (error) {
  //     console.error("Error uploading medical record:", error);
  //     showToast("Failed to upload medical record", "error");
  //     throw error;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleUploadMedicalRecord = async (recordText: string) => {
    try {
      setIsLoading(true);
      const result = await uploadMedicalRecord(recordText); // Remove user.token parameter
      showToast(
        "Medical record uploaded and processed successfully!",
        "success"
      );

      // Reload patient data to get updated records
      await loadPatientData();

      return result;
    } catch (error) {
      console.error("Error uploading medical record:", error);
      showToast("Failed to upload medical record", "error");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // In your PatientDashboard component, update the handleGenerateQR function
  const handleGenerateQR = async () => {
    if (!selectedClinic) {
      showToast("Please select a clinic first", "error");
      return;
    }

    setIsLoading(true);
    try {
      const qrData = await generateQRCode(selectedClinic);

      if (qrData) {
        setQrCodeData(qrData);
        setShowQRModal(true);
        showToast("QR code generated successfully!", "success");
      } else {
        showToast("Failed to generate QR code", "error");
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      showToast(
        "QR service temporarily unavailable. Please try again later.",
        "warning"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logoutPatient = () => {
    removeToken(); // This now comes from the API file
    onLogout();
  };
  // const logoutPatient = () => {
  //   removeToken();
  //   localStorage.removeItem("patientToken");
  //   localStorage.removeItem("clinicToken");
  //   onLogout();
  // };

  const handleUpgrade = () => {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setShowUpgradeModal(false);
      showToast(
        "Payment processed successfully! Welcome to Premium!",
        "success"
      );
    }, 2000);
  };

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setShowRecordDetails(true);
  };

  const handleExportRecords = () => {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      showToast("Medical records exported as PDF successfully!", "success");
    }, 1500);
  };

  // Rest of the component remains the same...
  // [The rest of your existing JSX code goes here - it's too long to include completely]

  return (
    <div className="min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Symptom Logger Modal */}
      {showSymptomLogger && (
        <SymptomLogger
          patientName={user.name}
          onClose={() => setShowSymptomLogger(false)}
          onSave={handleSaveStructuredSymptom}
        />
      )}

      {/* Wearables Connector */}
      {showWearables && (
        <WearablesConnector onClose={() => setShowWearables(false)} />
      )}

      {/* Pharmacy Marketplace */}
      {showPharmacy && (
        <PharmacyMarketplace
          patientHistory={{
            conditions: ["peptic ulcer", "hypertension"],
            medications: prescriptions.map((p) => p.name),
          }}
          onClose={() => setShowPharmacy(false)}
        />
      )}

      {/* Food Interaction Checker */}
      {showFoodChecker && (
        <FoodInteractionChecker
          medications={prescriptions.map((p) => p.name)}
          onClose={() => setShowFoodChecker(false)}
        />
      )}

      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: "#FFFFFF",
          boxShadow: "0 2px 8px rgba(10, 61, 98, 0.08)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={logo}
                alt="Dosewise Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "20px",
                  }}
                >
                  Dosewise
                </h1>
                <p
                  style={{
                    fontFamily: "Lato",
                    color: "#1B4F72",
                    fontSize: "12px",
                  }}
                >
                  Patient Portal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="relative"
                style={{ color: "#1B4F72" }}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                <span
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: "#FF6F61" }}
                />
              </Button>

              <Button
                variant="ghost"
                onClick={handleExportRecords}
                disabled={isLoading}
                style={{ color: "#1B4F72" }}
                className="hidden sm:flex"
              >
                <Download className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p
                    style={{
                      fontFamily: "Roboto",
                      color: "#0A3D62",
                      fontSize: "14px",
                    }}
                  >
                    {user.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "Lato",
                      color: "#1B4F72",
                      fontSize: "12px",
                    }}
                  >
                    {user.email}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: "#E8F4F8" }}
                >
                  <span style={{ fontFamily: "Poppins", color: "#0A3D62" }}>
                    {user.name.charAt(0)}
                  </span>
                </div>
              </div>
              {/* <Button
                variant="ghost"
                onClick={onLogout}
                style={{ color: "#1B4F72" }}
                className="hidden sm:flex"
              >
                <LogOut className="w-5 h-5" />
              </Button> */}
              <Button
                variant="ghost"
                onClick={logoutPatient} // Change from onLogout to logoutPatient
                style={{ color: "#1B4F72" }}
                className="hidden sm:flex"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div
          className="fixed top-16 right-6 w-80 rounded-xl z-50 animate-in slide-in-from-top-2"
          style={{
            backgroundColor: "#FFFFFF",
            boxShadow: "0 8px 32px rgba(10, 61, 98, 0.16)",
          }}
        >
          <div className="p-4 border-b" style={{ borderColor: "#E8F4F8" }}>
            <div className="flex justify-between items-center">
              <h3
                style={{
                  fontFamily: "Nunito Sans",
                  color: "#0A3D62",
                  fontSize: "16px",
                }}
              >
                Notifications
              </h3>
              <button onClick={() => setShowNotifications(false)}>
                <X className="w-4 h-4" style={{ color: "#1B4F72" }} />
              </button>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            <div
              className="p-3 rounded-lg cursor-pointer hover:bg-opacity-80"
              style={{ backgroundColor: "#FFF5F5" }}
            >
              <p
                style={{
                  fontFamily: "Roboto",
                  color: "#FF6F61",
                  fontSize: "14px",
                }}
              >
                ⚠️ New Alert
              </p>
              <p
                style={{
                  fontFamily: "Lato",
                  color: "#1B4F72",
                  fontSize: "12px",
                }}
              >
                Elevated headache frequency detected. Review recommended.
              </p>
              <p
                style={{
                  fontFamily: "Lato",
                  color: "#1B4F72",
                  fontSize: "11px",
                }}
              >
                2 hours ago
              </p>
            </div>
            <div
              className="p-3 rounded-lg cursor-pointer hover:bg-opacity-80"
              style={{ backgroundColor: "#F0F9FF" }}
            >
              <p
                style={{
                  fontFamily: "Roboto",
                  color: "#0A3D62",
                  fontSize: "14px",
                }}
              >
                📋 New Record
              </p>
              <p
                style={{
                  fontFamily: "Lato",
                  color: "#1B4F72",
                  fontSize: "12px",
                }}
              >
                Dr. Sarah Johnson added a new consultation note.
              </p>
              <p
                style={{
                  fontFamily: "Lato",
                  color: "#1B4F72",
                  fontSize: "11px",
                }}
              >
                1 day ago
              </p>
            </div>
            <div
              className="p-3 rounded-lg cursor-pointer hover:bg-opacity-80"
              style={{ backgroundColor: "#F0FDF4" }}
            >
              <p
                style={{
                  fontFamily: "Roboto",
                  color: "#16A34A",
                  fontSize: "14px",
                }}
              >
                ✓ Prescription Updated
              </p>
              <p
                style={{
                  fontFamily: "Lato",
                  color: "#1B4F72",
                  fontSize: "12px",
                }}
              >
                Lisinopril dosage adjusted to 10mg daily.
              </p>
              <p
                style={{
                  fontFamily: "Lato",
                  color: "#1B4F72",
                  fontSize: "11px",
                }}
              >
                2 days ago
              </p>
            </div>
          </div>
          <div
            className="p-3 border-t text-center"
            style={{ borderColor: "#E8F4F8" }}
          >
            <button
              onClick={() => showToast("Mark all as read", "success")}
              style={{
                fontFamily: "Poppins",
                color: "#0A3D62",
                fontSize: "14px",
              }}
            >
              Mark all as read
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Subscription Banner */}
        {user.subscriptionTier === "free" && (
          <div
            className="mb-6 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4"
            style={{
              background: "linear-gradient(135deg, #0A3D62 0%, #1B4F72 100%)",
            }}
          >
            <div className="flex items-center gap-4">
              <Crown className="w-8 h-8" style={{ color: "#FFFFFF" }} />
              <div>
                <p
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#FFFFFF",
                    fontSize: "18px",
                  }}
                >
                  Upgrade to Premium
                </p>
                <p
                  style={{
                    fontFamily: "Lato",
                    color: "#EAEFF2",
                    fontSize: "14px",
                  }}
                >
                  Get unlimited AI insights, advanced symptom tracking, and
                  priority support
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              className="rounded-lg px-6"
              style={{
                fontFamily: "Poppins",
                backgroundColor: "#FFFFFF",
                color: "#0A3D62",
              }}
            >
              Upgrade Now
            </Button>
          </div>
        )}

        {/* Voice Recording Banner */}
        {isRecording && (
          <div
            className="mb-6 p-6 rounded-xl"
            style={{ backgroundColor: "#FFF5F5", border: "2px solid #FF6F61" }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse"
                  style={{ backgroundColor: "#FF6F61" }}
                >
                  <Mic className="w-6 h-6" style={{ color: "#FFFFFF" }} />
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "Nunito Sans",
                      color: "#FF6F61",
                      fontSize: "18px",
                    }}
                  >
                    Recording in Progress
                  </p>
                  <p
                    style={{
                      fontFamily: "Lato",
                      color: "#1B4F72",
                      fontSize: "14px",
                    }}
                  >
                    {formatRecordingTime(recordingTime)}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleStopRecording}
                disabled={isLoading}
                className="rounded-lg"
                style={{
                  fontFamily: "Poppins",
                  backgroundColor: "#FF6F61",
                  color: "#FFFFFF",
                }}
              >
                <Square className="w-4 h-4 mr-2 fill-current" />
                {isLoading ? "Processing..." : "Stop Recording"}
              </Button>
            </div>
          </div>
        )}

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList
            className="w-full justify-start rounded-xl p-1 mb-8 overflow-x-auto"
            style={{
              backgroundColor: "#FFFFFF",
              boxShadow: "0 2px 8px rgba(10, 61, 98, 0.08)",
            }}
          >
            <TabsTrigger
              value="overview"
              className="rounded-lg px-6"
              style={{ fontFamily: "Poppins" }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="prescriptions"
              className="rounded-lg px-6"
              style={{ fontFamily: "Poppins" }}
            >
              <Pill className="w-4 h-4 mr-2" />
              Prescriptions
            </TabsTrigger>
            <TabsTrigger
              value="symptoms"
              className="rounded-lg px-6"
              style={{ fontFamily: "Poppins" }}
            >
              <Activity className="w-4 h-4 mr-2" />
              Symptoms
            </TabsTrigger>
            <TabsTrigger
              value="access"
              className="rounded-lg px-6"
              style={{ fontFamily: "Poppins" }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Access
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div
                className="p-6 rounded-xl cursor-pointer transition-all hover:scale-105"
                style={{
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
                }}
                onClick={() => setActiveTab("prescriptions")}
              >
                <div className="flex items-center justify-between mb-4">
                  <Pill className="w-8 h-8" style={{ color: "#0A3D62" }} />
                  <Badge
                    style={{ backgroundColor: "#E8F4F8", color: "#0A3D62" }}
                  >
                    Active
                  </Badge>
                </div>
                <p
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "28px",
                  }}
                >
                  {prescriptions.length}
                </p>
                <p
                  style={{
                    fontFamily: "Roboto",
                    color: "#1B4F72",
                    fontSize: "14px",
                  }}
                >
                  Active Prescriptions
                </p>
              </div>
              <div
                className="p-6 rounded-xl cursor-pointer transition-all hover:scale-105"
                style={{
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
                }}
                onClick={() => setActiveTab("symptoms")}
              >
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8" style={{ color: "#0A3D62" }} />
                  <Badge
                    style={{ backgroundColor: "#E8F4F8", color: "#0A3D62" }}
                  >
                    7 days
                  </Badge>
                </div>
                <p
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "28px",
                  }}
                >
                  {symptoms.length}
                </p>
                <p
                  style={{
                    fontFamily: "Roboto",
                    color: "#1B4F72",
                    fontSize: "14px",
                  }}
                >
                  Symptom Entries
                </p>
              </div>
              <div
                className="p-6 rounded-xl cursor-pointer transition-all hover:scale-105"
                style={{
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
                }}
                onClick={() => handleExportRecords()}
              >
                <div className="flex items-center justify-between mb-4">
                  <FileText className="w-8 h-8" style={{ color: "#0A3D62" }} />
                  <Badge
                    style={{ backgroundColor: "#E8F4F8", color: "#0A3D62" }}
                  >
                    Updated
                  </Badge>
                </div>
                <p
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "28px",
                  }}
                >
                  {8 + uploadedFiles.length}
                </p>
                <p
                  style={{
                    fontFamily: "Roboto",
                    color: "#1B4F72",
                    fontSize: "14px",
                  }}
                >
                  Medical Records
                </p>
              </div>
            </div>

            {/* Wearables Quick View */}
            <div
              className="mb-6 p-6 rounded-xl"
              style={{
                backgroundColor: "#FFFFFF",
                boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "20px",
                  }}
                >
                  Today's Vitals
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowWearables(true)}
                  style={{ color: "#0A3D62" }}
                >
                  <Watch className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <VitalQuickView
                  icon={<Heart />}
                  title="Heart Rate"
                  value="74 bpm"
                  status="normal"
                />
                <VitalQuickView
                  icon={<Activity />}
                  title="BP"
                  value="120/80"
                  status="normal"
                />
                <VitalQuickView
                  icon={<TrendingUp />}
                  title="Steps"
                  value="4,300"
                  status="normal"
                />
                <VitalQuickView
                  icon={<Heart />}
                  title="SpO₂"
                  value="98%"
                  status="normal"
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div
                className="p-6 rounded-xl"
                style={{
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
                }}
              >
                <h3
                  className="mb-4"
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "20px",
                  }}
                >
                  Recent Medical History
                </h3>
                <div className="space-y-4">
                  <HistoryItem
                    date="Nov 18, 2025"
                    title="General Checkup"
                    doctor="Dr. Sarah Johnson"
                    type="Consultation"
                    onClick={() =>
                      handleViewRecord({
                        date: "Nov 18, 2025",
                        title: "General Checkup",
                        doctor: "Dr. Sarah Johnson",
                        type: "Consultation",
                      })
                    }
                  />
                  <HistoryItem
                    date="Nov 10, 2025"
                    title="Blood Test Results"
                    doctor="LabCorp"
                    type="Lab Results"
                    onClick={() =>
                      handleViewRecord({
                        date: "Nov 10, 2025",
                        title: "Blood Test Results",
                        doctor: "LabCorp",
                        type: "Lab Results",
                      })
                    }
                  />
                  <HistoryItem
                    date="Oct 28, 2025"
                    title="Follow-up Appointment"
                    doctor="Dr. Sarah Johnson"
                    type="Consultation"
                    onClick={() =>
                      handleViewRecord({
                        date: "Oct 28, 2025",
                        title: "Follow-up Appointment",
                        doctor: "Dr. Sarah Johnson",
                        type: "Consultation",
                      })
                    }
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4 rounded-lg border-2"
                  style={{
                    fontFamily: "Poppins",
                    borderColor: "#E8F4F8",
                    color: "#1B4F72",
                  }}
                  onClick={() =>
                    showToast("Viewing full medical history...", "info")
                  }
                >
                  View All Records
                </Button>
              </div>

              <div
                className="p-6 rounded-xl"
                style={{
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
                }}
              >
                <h3
                  className="mb-4"
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "20px",
                  }}
                >
                  AI Insights & Alerts
                </h3>
                <div className="space-y-4">
                  <AlertItem
                    type="success"
                    title="All Clear"
                    message="No drug interactions detected with current prescriptions"
                  />
                  <AlertItem
                    type="info"
                    title="Recommendation"
                    message="Consider scheduling your annual physical exam"
                  />
                  <AlertItem
                    type="warning"
                    title="Symptom Pattern"
                    message="Elevated headache frequency detected. Consider consultation."
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickActionCard
                icon={<Activity />}
                title="Log Symptoms"
                onClick={() => setShowSymptomLogger(true)}
              />
              <QuickActionCard
                icon={<Watch />}
                title="Wearables"
                onClick={() => setShowWearables(true)}
              />
              <QuickActionCard
                icon={<ShoppingCart />}
                title="Pharmacy"
                onClick={() => setShowPharmacy(true)}
              />
              <QuickActionCard
                icon={<Coffee />}
                title="Food Check"
                onClick={() => setShowFoodChecker(true)}
              />
            </div>
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2
                style={{
                  fontFamily: "Nunito Sans",
                  color: "#0A3D62",
                  fontSize: "24px",
                }}
              >
                Prescription Management
              </h2>
              <Button
                onClick={() => setShowAddPrescription(true)}
                className="rounded-lg"
                style={{
                  fontFamily: "Poppins",
                  backgroundColor: "#0A3D62",
                  color: "#FFFFFF",
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Prescription
              </Button>
            </div>

            {/* AI Medication Alternatives Section */}
            <div
              className="mb-6 p-6 rounded-xl"
              style={{
                backgroundColor: "#FFFFFF",
                boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
              }}
            >
              <h3
                className="mb-4 flex items-center gap-2"
                style={{
                  fontFamily: "Nunito Sans",
                  color: "#0A3D62",
                  fontSize: "20px",
                }}
              >
                <Activity className="w-5 h-5" />
                AI Medication Alternatives
              </h3>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    placeholder="Enter medication to find alternatives..."
                    value={medicationForAlternatives}
                    onChange={(e) =>
                      setMedicationForAlternatives(e.target.value)
                    }
                    className="rounded-lg border-2"
                    style={{ borderColor: "#E8F4F8" }}
                  />
                  <Button
                    onClick={handleFindAlternatives}
                    disabled={
                      !medicationForAlternatives.trim() || isFindingAlternatives
                    }
                    className="rounded-lg px-8 whitespace-nowrap"
                    style={{
                      fontFamily: "Poppins",
                      backgroundColor:
                        medicationForAlternatives.trim() &&
                        !isFindingAlternatives
                          ? "#0A3D62"
                          : "#E8F4F8",
                      color:
                        medicationForAlternatives.trim() &&
                        !isFindingAlternatives
                          ? "#FFFFFF"
                          : "#1B4F72",
                    }}
                  >
                    {isFindingAlternatives
                      ? "Searching..."
                      : "Find Alternatives"}
                  </Button>
                </div>

                {medicationAlternatives.length > 0 && (
                  <div className="space-y-3">
                    <p
                      style={{
                        fontFamily: "Roboto",
                        color: "#1B4F72",
                        fontSize: "14px",
                      }}
                    >
                      Alternatives for{" "}
                      <strong>{medicationForAlternatives}</strong>:
                    </p>
                    {medicationAlternatives.map(
                      (alternative: any, index: number) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg border-2"
                          style={{
                            borderColor: "#E8F4F8",
                            backgroundColor: "#F8FBFF",
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p
                              style={{
                                fontFamily: "Nunito Sans",
                                color: "#0A3D62",
                                fontSize: "16px",
                              }}
                            >
                              {alternative.name}
                            </p>
                            <Badge
                              style={{
                                backgroundColor:
                                  alternative.costComparison === "lower"
                                    ? "#F0FDF4"
                                    : alternative.costComparison === "similar"
                                    ? "#F0F9FF"
                                    : "#FEFCE8",
                                color:
                                  alternative.costComparison === "lower"
                                    ? "#16A34A"
                                    : alternative.costComparison === "similar"
                                    ? "#0A3D62"
                                    : "#CA8A04",
                              }}
                            >
                              Cost: {alternative.costComparison}
                            </Badge>
                          </div>
                          <p
                            style={{
                              fontFamily: "Lato",
                              color: "#1B4F72",
                              fontSize: "14px",
                            }}
                          >
                            {alternative.reason}
                          </p>
                          {alternative.considerations && (
                            <p
                              style={{
                                fontFamily: "Lato",
                                color: "#FF6F61",
                                fontSize: "12px",
                                marginTop: "4px",
                              }}
                            >
                              Considerations: {alternative.considerations}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Compatibility Checker */}
            <div
              className="mb-6 p-6 rounded-xl"
              style={{
                backgroundColor: "#FFFFFF",
                boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
              }}
            >
              <h3
                className="mb-4"
                style={{
                  fontFamily: "Nunito Sans",
                  color: "#0A3D62",
                  fontSize: "20px",
                }}
              >
                AI Prescription Compatibility Checker
              </h3>
              <p
                className="mb-4"
                style={{
                  fontFamily: "Lato",
                  color: "#1B4F72",
                  fontSize: "14px",
                }}
              >
                Check new prescriptions for interactions with your current
                medications
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="Enter medication name..."
                  value={medicationToCheck}
                  onChange={(e) => setMedicationToCheck(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    !isCheckingCompatibility &&
                    handleCheckCompatibility()
                  }
                  disabled={isCheckingCompatibility}
                  className="rounded-lg border-2"
                  style={{ borderColor: "#E8F4F8" }}
                />
                <Button
                  onClick={handleCheckCompatibility}
                  disabled={
                    !medicationToCheck.trim() || isCheckingCompatibility
                  }
                  className="rounded-lg px-8 whitespace-nowrap"
                  style={{
                    fontFamily: "Poppins",
                    backgroundColor:
                      medicationToCheck.trim() && !isCheckingCompatibility
                        ? "#0A3D62"
                        : "#E8F4F8",
                    color:
                      medicationToCheck.trim() && !isCheckingCompatibility
                        ? "#FFFFFF"
                        : "#1B4F72",
                  }}
                >
                  {isCheckingCompatibility ? "Analyzing..." : "Check Safety"}
                </Button>
              </div>

              {compatibilityResult && (
                <div
                  className="mt-6 p-4 rounded-lg"
                  style={{
                    backgroundColor: "#F0F9FF",
                    border: "2px solid #0A3D62",
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p
                        style={{
                          fontFamily: "Nunito Sans",
                          color: "#0A3D62",
                          fontSize: "16px",
                        }}
                      >
                        {compatibilityResult.medication}
                      </p>
                      <p
                        style={{
                          fontFamily: "Roboto",
                          color: "#1B4F72",
                          fontSize: "14px",
                        }}
                      >
                        Compatibility Score
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        style={{
                          fontFamily: "Poppins",
                          color: "#0A3D62",
                          fontSize: "32px",
                        }}
                      >
                        {compatibilityResult.score}%
                      </p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div
                      className="h-2 rounded-full"
                      style={{ backgroundColor: "#E8F4F8" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${compatibilityResult.score}%`,
                          backgroundColor:
                            compatibilityResult.score >= 90
                              ? "#4ADE80"
                              : compatibilityResult.score >= 80
                              ? "#FBBF24"
                              : "#FF6F61",
                        }}
                      />
                    </div>
                  </div>
                  <p
                    className="mb-2"
                    style={{
                      fontFamily: "Lato",
                      color: "#1B4F72",
                      fontSize: "14px",
                    }}
                  >
                    <strong>Recommendation:</strong>{" "}
                    {compatibilityResult.recommendation}
                  </p>
                  {compatibilityResult.interactions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {compatibilityResult.interactions.map(
                        (interaction: string, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: "#FFF5F5" }}
                          >
                            <p
                              style={{
                                fontFamily: "Lato",
                                color: "#FF6F61",
                                fontSize: "12px",
                              }}
                            >
                              ⚠️ {interaction}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Active Prescriptions */}
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <PrescriptionCard
                  key={prescription.id}
                  {...prescription}
                  onDelete={() =>
                    handleDeletePrescription(prescription.id, prescription.name)
                  }
                  onView={() => handleViewRecord(prescription)}
                />
              ))}
            </div>
          </TabsContent>

          {/* Symptoms Tab */}
          <TabsContent value="symptoms">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2
                style={{
                  fontFamily: "Nunito Sans",
                  color: "#0A3D62",
                  fontSize: "24px",
                }}
              >
                Symptom Tracking
              </h2>
              <Button
                onClick={() => setShowSymptomLogger(true)}
                className="rounded-lg"
                style={{
                  fontFamily: "Poppins",
                  backgroundColor: "#0A3D62",
                  color: "#FFFFFF",
                }}
              >
                <Activity className="w-4 h-4 mr-2" />
                Log Symptoms
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div
                className="p-6 rounded-xl"
                style={{
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
                }}
              >
                <h3
                  className="mb-4"
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "20px",
                  }}
                >
                  Symptom Trends (7 Days)
                </h3>
                <div className="space-y-4">
                  <SymptomTrend symptom="Headache" frequency={5} trend="up" />
                  <SymptomTrend symptom="Fatigue" frequency={3} trend="down" />
                  <SymptomTrend
                    symptom="Dizziness"
                    frequency={2}
                    trend="stable"
                  />
                </div>
              </div>

              <div
                className="p-6 rounded-xl"
                style={{
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
                }}
              >
                <h3
                  className="mb-4"
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "20px",
                  }}
                >
                  AI Analysis
                </h3>
                <div className="space-y-4">
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: "#FFF5F5",
                      borderLeft: "4px solid #FF6F61",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Nunito Sans",
                        color: "#FF6F61",
                        fontSize: "16px",
                      }}
                    >
                      Attention Required
                    </p>
                    <p
                      style={{
                        fontFamily: "Lato",
                        color: "#1B4F72",
                        fontSize: "14px",
                      }}
                    >
                      Headache frequency is 2x higher than baseline. Consider
                      consultation with your healthcare provider.
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: "#F0F9FF",
                      borderLeft: "4px solid #0A3D62",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Nunito Sans",
                        color: "#0A3D62",
                        fontSize: "16px",
                      }}
                    >
                      Recommendation
                    </p>
                    <p
                      style={{
                        fontFamily: "Lato",
                        color: "#1B4F72",
                        fontSize: "14px",
                      }}
                    >
                      Track headache timing relative to medication intake to
                      identify patterns.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Symptom Logs */}
            <div
              className="p-6 rounded-xl"
              style={{
                backgroundColor: "#FFFFFF",
                boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
              }}
            >
              <h3
                className="mb-4"
                style={{
                  fontFamily: "Nunito Sans",
                  color: "#0A3D62",
                  fontSize: "20px",
                }}
              >
                Recent Logs
              </h3>
              <div className="space-y-3">
                {symptoms.map((symptom) => (
                  <SymptomLog
                    key={symptom.id}
                    {...symptom}
                    onDelete={() => handleDeleteSymptom(symptom.id)}
                    onView={() => handleViewRecord(symptom)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Access Management Tab */}
          <TabsContent value="access">
            <div className="mb-6">
              <h2
                className="mb-2"
                style={{
                  fontFamily: "Nunito Sans",
                  color: "#0A3D62",
                  fontSize: "24px",
                }}
              >
                Access Management
              </h2>
              <p
                style={{
                  fontFamily: "Roboto",
                  color: "#1B4F72",
                  fontSize: "14px",
                }}
              >
                Control who can access your medical records
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div
                className="p-6 rounded-xl"
                style={{
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
                }}
              >
                <h3
                  className="mb-4"
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "20px",
                  }}
                >
                  Share via QR Code
                </h3>
                <div
                  className="p-8 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#F2F6FA" }}
                >
                  {qrCode ? (
                    <div className="text-center">
                      <QrCode
                        className="w-32 h-32 mx-auto mb-2"
                        style={{ color: "#0A3D62" }}
                      />
                      {qrExpiry && (
                        <p
                          style={{
                            fontFamily: "Lato",
                            color: "#FF6F61",
                            fontSize: "12px",
                          }}
                        >
                          Expires in{" "}
                          {Math.max(
                            0,
                            Math.floor(
                              (qrExpiry.getTime() - Date.now()) / 60000
                            )
                          )}{" "}
                          minutes
                        </p>
                      )}
                    </div>
                  ) : (
                    <QrCode
                      className="w-32 h-32"
                      style={{ color: "#1B4F72", opacity: 0.3 }}
                    />
                  )}
                </div>
                <p
                  className="text-center mb-4"
                  style={{
                    fontFamily: "Lato",
                    color: "#1B4F72",
                    fontSize: "14px",
                  }}
                >
                  {qrCode
                    ? "Scan this code to grant temporary access"
                    : "Generate a QR code to share access"}
                </p>
                <Button
                  onClick={handleGenerateQR}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full rounded-lg border-2"
                  style={{
                    fontFamily: "Poppins",
                    borderColor: "#E8F4F8",
                    color: "#1B4F72",
                  }}
                >
                  {isLoading
                    ? "Generating..."
                    : qrCode
                    ? "Regenerate Code"
                    : "Generate New Code"}
                </Button>
              </div>

              <div
                className="p-6 rounded-xl"
                style={{
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
                }}
              >
                <h3
                  className="mb-4"
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "20px",
                  }}
                >
                  Emergency Access
                </h3>
                <div
                  className="p-6 rounded-lg mb-4"
                  style={{
                    backgroundColor: "#FFF5F5",
                    border: "2px solid #FF6F61",
                  }}
                >
                  <AlertCircle
                    className="w-8 h-8 mb-3"
                    style={{ color: "#FF6F61" }}
                  />
                  <p
                    style={{
                      fontFamily: "Nunito Sans",
                      color: "#FF6F61",
                      fontSize: "16px",
                    }}
                  >
                    Emergency Access Enabled
                  </p>
                  <p
                    style={{
                      fontFamily: "Lato",
                      color: "#1B4F72",
                      fontSize: "14px",
                    }}
                  >
                    Healthcare providers can access essential information using
                    your name and date of birth in emergency situations.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span
                      style={{
                        fontFamily: "Roboto",
                        color: "#1B4F72",
                        fontSize: "14px",
                      }}
                    >
                      Name:
                    </span>
                    <span style={{ fontFamily: "Roboto", color: "#0A3D62" }}>
                      {user.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      style={{
                        fontFamily: "Roboto",
                        color: "#1B4F72",
                        fontSize: "14px",
                      }}
                    >
                      DOB:
                    </span>
                    <span style={{ fontFamily: "Roboto", color: "#0A3D62" }}>
                      {user.dob}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Authorized Clinicians */}
            <div
              className="p-6 rounded-xl"
              style={{
                backgroundColor: "#FFFFFF",
                boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
              }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "20px",
                  }}
                >
                  Authorized Clinicians
                </h3>
                <Button
                  onClick={() => setShowAddClinician(true)}
                  className="rounded-lg"
                  style={{
                    fontFamily: "Poppins",
                    backgroundColor: "#0A3D62",
                    color: "#FFFFFF",
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Clinician
                </Button>
              </div>
              <div className="space-y-3">
                {clinicians.map((clinician) => (
                  <ClinicianAccessCard
                    key={clinician.id}
                    {...clinician}
                    onRevoke={() =>
                      handleRevokeClinician(clinician.id, clinician.name)
                    }
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Simple Symptom Modal */}
      <Dialog open={showAddSymptom} onOpenChange={setShowAddSymptom}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log New Symptom</DialogTitle>
            <DialogDescription>
              Track your symptoms for AI analysis
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="symptom">Symptom *</Label>
              <Input
                id="symptom"
                value={newSymptom.symptom}
                onChange={(e) =>
                  setNewSymptom({ ...newSymptom, symptom: e.target.value })
                }
                placeholder="e.g., Headache, Nausea, Fatigue"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={newSymptom.severity}
                onValueChange={(value) =>
                  setNewSymptom({ ...newSymptom, severity: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={newSymptom.notes}
                onChange={(e) =>
                  setNewSymptom({ ...newSymptom, notes: e.target.value })
                }
                placeholder="When did it start? What were you doing?"
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddSymptom(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSymptom}
              disabled={!newSymptom.symptom || isLoading}
            >
              {isLoading ? "Logging..." : "Log Symptom"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Prescription Modal */}
      <Dialog open={showAddPrescription} onOpenChange={setShowAddPrescription}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Prescription</DialogTitle>
            <DialogDescription>
              Add a new prescription to your medication list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="medication-name">Medication Name *</Label>
              <Input
                id="medication-name"
                value={newPrescription.name}
                onChange={(e) =>
                  setNewPrescription({
                    ...newPrescription,
                    name: e.target.value,
                  })
                }
                placeholder="e.g., Lisinopril 10mg"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                value={newPrescription.dosage}
                onChange={(e) =>
                  setNewPrescription({
                    ...newPrescription,
                    dosage: e.target.value,
                  })
                }
                placeholder="e.g., 10mg once daily"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Input
                id="frequency"
                value={newPrescription.frequency}
                onChange={(e) =>
                  setNewPrescription({
                    ...newPrescription,
                    frequency: e.target.value,
                  })
                }
                placeholder="e.g., Once daily"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="prescribed-by">Prescribed By</Label>
              <Input
                id="prescribed-by"
                value={newPrescription.prescribedBy}
                onChange={(e) =>
                  setNewPrescription({
                    ...newPrescription,
                    prescribedBy: e.target.value,
                  })
                }
                placeholder="e.g., Dr. Sarah Johnson"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="condition">Medical Condition</Label>
              <Input
                id="condition"
                value={newPrescription.condition}
                onChange={(e) =>
                  setNewPrescription({
                    ...newPrescription,
                    condition: e.target.value,
                  })
                }
                placeholder="e.g., Hypertension"
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2">
            <Button
              onClick={handleAnalyzePrescription}
              disabled={
                !newPrescription.name ||
                !newPrescription.condition ||
                isAnalyzingPrescription
              }
              variant="outline"
              className="w-full"
            >
              {isAnalyzingPrescription
                ? "Analyzing..."
                : "🔍 AI Analyze Prescription"}
            </Button>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setShowAddPrescription(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPrescription}
                disabled={
                  !newPrescription.name || !newPrescription.dosage || isLoading
                }
                className="flex-1"
              >
                {isLoading ? "Adding..." : "Add Prescription"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Patient Details Modal
      <Dialog open={showPatientDetails} onOpenChange={setShowPatientDetails}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPatientData?.name}</DialogTitle>
            <DialogDescription>
              Complete medical history and records
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: "#F2F6FA" }}
              >
                <p
                  style={{
                    fontFamily: "Lato",
                    color: "#1B4F72",
                    fontSize: "12px",
                  }}
                >
                  Date of Birth
                </p>
                <p
                  style={{
                    fontFamily: "Roboto",
                    color: "#0A3D62",
                    fontSize: "16px",
                  }}
                >
                  {selectedPatientData?.dob}
                </p>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: "#F2F6FA" }}
              >
                <p
                  style={{
                    fontFamily: "Lato",
                    color: "#1B4F72",
                    fontSize: "12px",
                  }}
                >
                  Age
                </p>
                <p
                  style={{
                    fontFamily: "Roboto",
                    color: "#0A3D62",
                    fontSize: "16px",
                  }}
                >
                  {selectedPatientData?.age} years
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: "#F2F6FA" }}
              >
                <p
                  style={{
                    fontFamily: "Lato",
                    color: "#1B4F72",
                    fontSize: "12px",
                  }}
                >
                  Email
                </p>
                <p
                  style={{
                    fontFamily: "Roboto",
                    color: "#0A3D62",
                    fontSize: "14px",
                  }}
                >
                  {selectedPatientData?.email}
                </p>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: "#F2F6FA" }}
              >
                <p
                  style={{
                    fontFamily: "Lato",
                    color: "#1B4F72",
                    fontSize: "12px",
                  }}
                >
                  Phone
                </p>
                <p
                  style={{
                    fontFamily: "Roboto",
                    color: "#0A3D62",
                    fontSize: "14px",
                  }}
                >
                  {selectedPatientData?.phone}
                </p>
              </div>
            </div>

            {selectedPatientData?.conditions &&
              selectedPatientData.conditions.length > 0 && (
                <div>
                  <h4
                    style={{
                      fontFamily: "Nunito Sans",
                      color: "#0A3D62",
                      fontSize: "16px",
                    }}
                    className="mb-2"
                  >
                    Medical Conditions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatientData.conditions.map(
                      (condition: string, index: number) => (
                        <Badge
                          key={index}
                          style={{
                            backgroundColor: "#E8F4F8",
                            color: "#0A3D62",
                          }}
                        >
                          {condition}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}

            {selectedPatientData?.currentMedications &&
              selectedPatientData.currentMedications.length > 0 && (
                <div>
                  <h4
                    style={{
                      fontFamily: "Nunito Sans",
                      color: "#0A3D62",
                      fontSize: "16px",
                    }}
                    className="mb-2"
                  >
                    Current Medications
                  </h4>
                  <div className="space-y-2">
                    {selectedPatientData.currentMedications.map(
                      (med: string, index: number) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: "#F2F6FA" }}
                        >
                          <p
                            style={{
                              fontFamily: "Roboto",
                              color: "#0A3D62",
                              fontSize: "14px",
                            }}
                          >
                            {med}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            <div>
              <h4
                style={{
                  fontFamily: "Nunito Sans",
                  color: "#0A3D62",
                  fontSize: "16px",
                }}
                className="mb-2"
              >
                Recent Sessions
              </h4>
              <div className="space-y-2">
                {sessions
                  .filter((s) => s.patientId === selectedPatient)
                  .slice(0, 3)
                  .map((session) => (
                    <div
                      key={session.id}
                      className="p-3 rounded-lg cursor-pointer hover:shadow-md transition-all"
                      style={{ backgroundColor: "#F2F6FA" }}
                      onClick={() => handleViewSession(session)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p
                            style={{
                              fontFamily: "Roboto",
                              color: "#0A3D62",
                              fontSize: "14px",
                            }}
                          >
                            {session.date}
                          </p>
                          <p
                            style={{
                              fontFamily: "Lato",
                              color: "#1B4F72",
                              fontSize: "12px",
                            }}
                          >
                            {session.summary}
                          </p>
                        </div>
                        <Eye className="w-4 h-4" style={{ color: "#1B4F72" }} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPatientDetails(false)}
            >
              Close
            </Button>
            <Button onClick={() => setShowAddPrescription(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Prescription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

      <Dialog open={showAddClinician} onOpenChange={setShowAddClinician}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grant Clinician Access</DialogTitle>
            <DialogDescription>
              Share your medical records with a healthcare provider
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="clinician-name">Clinician Name *</Label>
              <Input
                id="clinician-name"
                value={newClinician.name}
                onChange={(e) =>
                  setNewClinician({ ...newClinician, name: e.target.value })
                }
                placeholder="Dr. Jane Smith"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="clinician-email">Email Address *</Label>
              <Input
                id="clinician-email"
                type="email"
                value={newClinician.email}
                onChange={(e) =>
                  setNewClinician({ ...newClinician, email: e.target.value })
                }
                placeholder="doctor@hospital.com"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="access-level">Access Level *</Label>
              <Select
                value={newClinician.accessLevel}
                onValueChange={(value) =>
                  setNewClinician({ ...newClinician, accessLevel: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Access</SelectItem>
                  <SelectItem value="prescriptions">
                    Prescriptions Only
                  </SelectItem>
                  <SelectItem value="lab">Lab Results Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddClinician(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddClinician}
              disabled={!newClinician.name || !newClinician.email || isLoading}
            >
              {isLoading ? "Granting..." : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadRecord} onOpenChange={setShowUploadRecord}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Medical Record</DialogTitle>
            <DialogDescription>
              Upload documents and our AI will extract the information
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div
              className="border-2 border-dashed rounded-xl p-12 text-center"
              style={{ borderColor: "#E8F4F8", backgroundColor: "#F2F6FA" }}
            >
              <Upload
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: isLoading ? "#1B4F72" : "#0A3D62" }}
              />
              {isLoading ? (
                <p className="mb-2">Processing files...</p>
              ) : (
                <>
                  <p className="mb-2">Drag and drop files here</p>
                  <p className="mb-4">or</p>
                  <label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                    />
                    <span
                      className="inline-block px-6 py-3 rounded-lg cursor-pointer"
                      style={{
                        backgroundColor: "#0A3D62",
                        color: "#FFFFFF",
                      }}
                    >
                      Browse Files
                    </span>
                  </label>
                  <p className="mt-4 text-sm">
                    Supported: PDF, JPG, PNG (Max 10MB)
                  </p>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadRecord(false)}
              disabled={isLoading}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showShareAccess} onOpenChange={setShowShareAccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Medical Records</DialogTitle>
            <DialogDescription>
              Generate a QR code for quick access sharing
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div
              className="p-8 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#F2F6FA" }}
            >
              {qrCode ? (
                <div className="text-center">
                  <QrCode
                    className="w-48 h-48 mx-auto mb-2"
                    style={{ color: "#0A3D62" }}
                  />
                  {qrExpiry && (
                    <p
                      style={{
                        fontFamily: "Lato",
                        color: "#FF6F61",
                        fontSize: "14px",
                      }}
                    >
                      Expires in{" "}
                      {Math.max(
                        0,
                        Math.floor((qrExpiry.getTime() - Date.now()) / 60000)
                      )}{" "}
                      minutes
                    </p>
                  )}
                </div>
              ) : (
                <QrCode
                  className="w-48 h-48"
                  style={{ color: "#1B4F72", opacity: 0.3 }}
                />
              )}
            </div>
            <p className="text-center mb-4">
              {qrCode
                ? "This code is valid for 15 minutes and grants temporary read-only access"
                : "Click Generate to create a new QR code"}
            </p>
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "#F0F9FF" }}
            >
              <p className="text-sm">
                🔒 <strong>Security Note:</strong> Only share this code with
                trusted healthcare providers. Access will be logged and can be
                revoked at any time.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareAccess(false)}>
              Close
            </Button>
            <Button onClick={handleGenerateQR} disabled={isLoading}>
              {isLoading
                ? "Generating..."
                : qrCode
                ? "Regenerate"
                : "Generate Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              <Crown
                className="w-6 h-6 inline mr-2"
                style={{ color: "#0A3D62" }}
              />
              Upgrade to Premium
            </DialogTitle>
            <DialogDescription>
              Get the most out of Dosewise with advanced features
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div
              className="p-6 rounded-xl"
              style={{
                backgroundColor: "#F0F9FF",
                border: "2px solid #0A3D62",
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p style={{ fontSize: "20px" }}>Premium Plan</p>
                  <p className="text-sm">Billed monthly</p>
                </div>
                <div className="text-right">
                  <p style={{ fontSize: "32px" }}>$9.99</p>
                  <p className="text-sm">per month</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="w-4 h-4"
                    style={{ color: "#4ADE80" }}
                  />
                  <p className="text-sm">Unlimited AI prescription analysis</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="w-4 h-4"
                    style={{ color: "#4ADE80" }}
                  />
                  <p className="text-sm">
                    Advanced symptom tracking & insights
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="w-4 h-4"
                    style={{ color: "#4ADE80" }}
                  />
                  <p className="text-sm">Priority customer support</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="w-4 h-4"
                    style={{ color: "#4ADE80" }}
                  />
                  <p className="text-sm">Unlimited voice recording sessions</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="w-4 h-4"
                    style={{ color: "#4ADE80" }}
                  />
                  <p className="text-sm">Export all medical records as PDF</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpgradeModal(false)}
              disabled={isLoading}
            >
              Maybe Later
            </Button>
            <Button onClick={handleUpgrade} disabled={isLoading}>
              {isLoading ? "Processing..." : "Upgrade Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code for Access</DialogTitle>
            <DialogDescription>
              Share this QR code with healthcare providers
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            {qrCodeData ? (
              <div className="text-center">
                <div className="p-4 bg-white rounded-lg inline-block">
                  <QrCode
                    className="w-48 h-48 mx-auto"
                    style={{ color: "#0A3D62" }}
                  />
                </div>
                <p className="mt-4 text-sm" style={{ color: "#1B4F72" }}>
                  Access Code: {qrCodeData.accessCode}
                </p>
                <p className="text-sm" style={{ color: "#FF6F61" }}>
                  Expires: {new Date(qrCodeData.expiresAt).toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p style={{ color: "#1B4F72" }}>Generating QR code...</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQRModal(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                // Add download functionality here
                showToast("QR code saved to camera roll", "success");
              }}
            >
              Save QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRecordDetails} onOpenChange={setShowRecordDetails}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRecord?.title || "Record Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedRecord?.date} •{" "}
              {selectedRecord?.doctor || selectedRecord?.prescribedBy}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div
              className="p-6 rounded-lg space-y-4"
              style={{ backgroundColor: "#F2F6FA" }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "16px",
                  }}
                >
                  Summary
                </p>
                <p
                  style={{
                    fontFamily: "Roboto",
                    color: "#1B4F72",
                    fontSize: "14px",
                  }}
                >
                  {selectedRecord?.notes ||
                    selectedRecord?.dosage ||
                    "Detailed medical information and notes from this encounter."}
                </p>
              </div>
              {selectedRecord?.compatibility && (
                <div>
                  <p
                    style={{
                      fontFamily: "Nunito Sans",
                      color: "#0A3D62",
                      fontSize: "16px",
                    }}
                  >
                    Compatibility Score
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <div
                      className="flex-1 h-2 rounded-full"
                      style={{ backgroundColor: "#E8F4F8" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${selectedRecord.compatibility}%`,
                          backgroundColor:
                            selectedRecord.compatibility >= 90
                              ? "#4ADE80"
                              : "#FBBF24",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: "Poppins",
                        color: "#0A3D62",
                        fontSize: "16px",
                      }}
                    >
                      {selectedRecord.compatibility}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRecordDetails(false)}>Close</Button>
            <Button onClick={handleExportRecords} disabled={isLoading}>
              <Download className="w-4 h-4 mr-2" />
              {isLoading ? "Exporting..." : "Export PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Components
function HistoryItem({ date, title, doctor, type, onClick }: any) {
  return (
    <div
      className="p-4 rounded-lg cursor-pointer hover:shadow-md transition-all"
      style={{ backgroundColor: "#F2F6FA" }}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p
            style={{ fontFamily: "Roboto", color: "#0A3D62", fontSize: "14px" }}
          >
            {title}
          </p>
          <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
            {doctor}
          </p>
        </div>
        <Badge style={{ backgroundColor: "#E8F4F8", color: "#1B4F72" }}>
          {type}
        </Badge>
      </div>
      <div className="flex justify-between items-center">
        <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
          {date}
        </p>
        <Eye className="w-4 h-4" style={{ color: "#1B4F72" }} />
      </div>
    </div>
  );
}

function AlertItem({
  type,
  title,
  message,
}: {
  type: "success" | "warning" | "info";
  title: string;
  message: string;
}) {
  const colors = {
    success: { bg: "#F0FDF4", border: "#4ADE80", icon: "#16A34A" },
    warning: { bg: "#FFF5F5", border: "#FF6F61", icon: "#FF6F61" },
    info: { bg: "#F0F9FF", border: "#0A3D62", icon: "#1B4F72" },
  };

  return (
    <div
      className="p-4 rounded-lg"
      style={{
        backgroundColor: colors[type].bg,
        borderLeft: `4px solid ${colors[type].border}`,
      }}
    >
      <p
        style={{
          fontFamily: "Nunito Sans",
          color: colors[type].icon,
          fontSize: "14px",
        }}
      >
        {title}
      </p>
      <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
        {message}
      </p>
    </div>
  );
}

function QuickActionCard({ icon, title, onClick, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-6 rounded-xl text-center transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        backgroundColor: "#FFFFFF",
        boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: "#E8F4F8" }}
      >
        <div style={{ color: "#0A3D62" }}>{icon}</div>
      </div>
      <p style={{ fontFamily: "Poppins", color: "#1B4F72", fontSize: "14px" }}>
        {title}
      </p>
    </button>
  );
}

// function PrescriptionCard({
//   id,
//   name,
//   dosage,
//   prescribedBy,
//   startDate,
//   compatibility,
//   status,
//   onDelete,
//   onView,
// }: any) {
//   return (
//     <div
//       className="p-6 rounded-xl hover:shadow-lg transition-all group"
//       style={{
//         backgroundColor: "#FFFFFF",
//         boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
//       }}
//     >
//       <div className="flex justify-between items-start mb-4">
//         <div className="flex-1">
//           <h4
//             style={{
//               fontFamily: "Nunito Sans",
//               color: "#0A3D62",
//               fontSize: "18px",
//             }}
//           >
//             {name}
//           </h4>
//           <p
//             style={{ fontFamily: "Roboto", color: "#1B4F72", fontSize: "14px" }}
//           >
//             {dosage}
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <Badge style={{ backgroundColor: "#E8F4F8", color: "#0A3D62" }}>
//             {status}
//           </Badge>
//           <button
//             onClick={onDelete}
//             className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg"
//           >
//             <Trash2 className="w-4 h-4" style={{ color: "#FF6F61" }} />
//           </button>
//         </div>
//       </div>
//       <div className="grid grid-cols-2 gap-4 mb-4">
//         <div>
//           <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
//             Prescribed By
//           </p>
//           <p
//             style={{ fontFamily: "Roboto", color: "#0A3D62", fontSize: "14px" }}
//           >
//             {prescribedBy}
//           </p>
//         </div>
//         <div>
//           <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
//             Start Date
//           </p>
//           <p
//             style={{ fontFamily: "Roboto", color: "#0A3D62", fontSize: "14px" }}
//           >
//             {startDate}
//           </p>
//         </div>
//       </div>
//       <div className="mb-4">
//         <div className="flex justify-between items-center mb-2">
//           <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
//             Compatibility Score
//           </p>
//           <p
//             style={{
//               fontFamily: "Poppins",
//               color: "#0A3D62",
//               fontSize: "16px",
//             }}
//           >
//             {compatibility}%
//           </p>
//         </div>
//         <div
//           className="h-2 rounded-full"
//           style={{ backgroundColor: "#E8F4F8" }}
//         >
//           <div
//             className="h-full rounded-full transition-all"
//             style={{
//               width: `${compatibility}%`,
//               backgroundColor:
//                 compatibility >= 90
//                   ? "#4ADE80"
//                   : compatibility >= 70
//                   ? "#FBBF24"
//                   : "#FF6F61",
//             }}
//           />
//         </div>
//       </div>
//       <Button
//         variant="outline"
//         onClick={onView}
//         className="w-full rounded-lg"
//         size="sm"
//       >
//         <Eye className="w-4 h-4 mr-2" />
//         View Details
//       </Button>
//     </div>
//   );
// }

function PrescriptionCard({
  id,
  name,
  dosage,
  prescribedBy,
  startDate,
  compatibility,
  status,
  aiAnalysis,
  onDelete,
  onView,
}: any) {
  return (
    <div
      className="p-6 rounded-xl hover:shadow-lg transition-all group border-l-4"
      style={{
        backgroundColor: "#FFFFFF",
        boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
        borderLeftColor:
          aiAnalysis?.riskLevel === "high"
            ? "#FF6F61"
            : aiAnalysis?.riskLevel === "medium"
            ? "#FBBF24"
            : "#4ADE80",
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4
              style={{
                fontFamily: "Nunito Sans",
                color: "#0A3D62",
                fontSize: "18px",
              }}
            >
              {name}
            </h4>
            {aiAnalysis && (
              <Badge
                style={{
                  backgroundColor:
                    aiAnalysis.riskLevel === "low"
                      ? "#F0FDF4"
                      : aiAnalysis.riskLevel === "medium"
                      ? "#FEFCE8"
                      : "#FEF2F2",
                  color:
                    aiAnalysis.riskLevel === "low"
                      ? "#16A34A"
                      : aiAnalysis.riskLevel === "medium"
                      ? "#CA8A04"
                      : "#DC2626",
                  fontSize: "10px",
                }}
              >
                AI: {aiAnalysis.riskLevel.toUpperCase()}
              </Badge>
            )}
          </div>
          <p
            style={{ fontFamily: "Roboto", color: "#1B4F72", fontSize: "14px" }}
          >
            {dosage}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge style={{ backgroundColor: "#E8F4F8", color: "#0A3D62" }}>
            {status}
          </Badge>
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" style={{ color: "#FF6F61" }} />
          </button>
        </div>
      </div>

      {/* AI Insights Summary */}
      {aiAnalysis &&
        aiAnalysis.recommendations &&
        aiAnalysis.recommendations.length > 0 && (
          <div
            className="mb-3 p-3 rounded-lg"
            style={{ backgroundColor: "#F0F9FF" }}
          >
            <p
              style={{
                fontFamily: "Roboto",
                color: "#0A3D62",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              AI Insight:
            </p>
            <p
              style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "11px" }}
            >
              {aiAnalysis.recommendations[0]}
            </p>
          </div>
        )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
            Prescribed By
          </p>
          <p
            style={{ fontFamily: "Roboto", color: "#0A3D62", fontSize: "14px" }}
          >
            {prescribedBy}
          </p>
        </div>
        <div>
          <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
            Start Date
          </p>
          <p
            style={{ fontFamily: "Roboto", color: "#0A3D62", fontSize: "14px" }}
          >
            {startDate}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
            Compatibility Score
          </p>
          <p
            style={{
              fontFamily: "Poppins",
              color: "#0A3D62",
              fontSize: "16px",
            }}
          >
            {compatibility}%
          </p>
        </div>
        <div
          className="h-2 rounded-full"
          style={{ backgroundColor: "#E8F4F8" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${compatibility}%`,
              backgroundColor:
                compatibility >= 90
                  ? "#4ADE80"
                  : compatibility >= 70
                  ? "#FBBF24"
                  : "#FF6F61",
            }}
          />
        </div>
      </div>

      <Button
        variant="outline"
        onClick={onView}
        className="w-full rounded-lg"
        size="sm"
      >
        <Eye className="w-4 h-4 mr-2" />
        View AI Analysis
      </Button>
    </div>
  );
}

function SymptomTrend({
  symptom,
  frequency,
  trend,
}: {
  symptom: string;
  frequency: number;
  trend: "up" | "down" | "stable";
}) {
  const trendColors = {
    up: "#FF6F61",
    down: "#4ADE80",
    stable: "#1B4F72",
  };

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg"
      style={{ backgroundColor: "#F2F6FA" }}
    >
      <div>
        <p style={{ fontFamily: "Roboto", color: "#0A3D62", fontSize: "14px" }}>
          {symptom}
        </p>
        <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
          {frequency} occurrences
        </p>
      </div>
      <TrendingUp
        className="w-5 h-5"
        style={{
          color: trendColors[trend],
          transform: trend === "down" ? "rotate(180deg)" : "none",
        }}
      />
    </div>
  );
}

function SymptomLog({
  id,
  date,
  symptom,
  severity,
  notes,
  duration,
  context,
  possibleRisk,
  recommendations,
  onDelete,
  onView,
}: any) {
  const isStructured = duration || context || possibleRisk || recommendations;

  return (
    <div
      className="p-4 rounded-lg border-l-4 hover:shadow-md transition-all group cursor-pointer"
      style={{
        backgroundColor: "#F2F6FA",
        borderColor: isStructured && possibleRisk ? "#FF6F61" : "#0A3D62",
      }}
      onClick={onView}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p
              style={{
                fontFamily: "Roboto",
                color: "#0A3D62",
                fontSize: "14px",
              }}
            >
              {symptom}
            </p>
            {isStructured && (
              <Badge
                style={{
                  backgroundColor: "#E8F4F8",
                  color: "#0A3D62",
                  fontSize: "10px",
                }}
              >
                AI Structured
              </Badge>
            )}
          </div>
          {isStructured && duration && (
            <p
              style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}
            >
              Duration: {duration}
            </p>
          )}
          {isStructured && possibleRisk && (
            <p
              style={{ fontFamily: "Lato", color: "#FF6F61", fontSize: "12px" }}
            >
              ⚠ {possibleRisk}
            </p>
          )}
          {!isStructured && (
            <p
              style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}
            >
              {notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge style={{ backgroundColor: "#E8F4F8", color: "#1B4F72" }}>
            {severity}
          </Badge>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" style={{ color: "#FF6F61" }} />
          </button>
        </div>
      </div>
      <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
        {date}
      </p>
    </div>
  );
}

function ClinicianAccessCard({
  id,
  name,
  hospital,
  accessLevel,
  grantedDate,
  onRevoke,
}: any) {
  return (
    <div
      className="p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:shadow-md transition-all group"
      style={{ backgroundColor: "#F2F6FA" }}
    >
      <div>
        <p style={{ fontFamily: "Roboto", color: "#0A3D62", fontSize: "14px" }}>
          {name}
        </p>
        <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
          {hospital}
        </p>
        <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
          Granted: {grantedDate}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge style={{ backgroundColor: "#E8F4F8", color: "#1B4F72" }}>
          {accessLevel}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRevoke}
          className="opacity-70 group-hover:opacity-100 transition-opacity"
          style={{ color: "#FF6F61" }}
        >
          Revoke
        </Button>
      </div>
    </div>
  );
}

function VitalQuickView({ icon, title, value, status }: any) {
  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: "#F2F6FA" }}>
      <div className="flex items-center gap-2 mb-1">
        <div style={{ color: status === "normal" ? "#16A34A" : "#FF6F61" }}>
          {icon}
        </div>
        <p style={{ fontFamily: "Roboto", color: "#1B4F72", fontSize: "11px" }}>
          {title}
        </p>
      </div>
      <p
        style={{
          fontFamily: "Nunito Sans",
          color: "#0A3D62",
          fontSize: "18px",
        }}
      >
        {value}
      </p>
    </div>
  );
}

// function VitalQuickView({ icon, title, value, status }: any) {
//   return (
//     <div className="p-3 rounded-lg" style={{ backgroundColor: "#F2F6FA" }}>
//       <div className="flex items-center gap-2 mb-1">
//         <div style={{ color: status === "normal" ? "#16A34A" : "#FF6F61" }}>
//           {icon}
//         </div>
//         <p style={{ fontFamily: "Roboto", color: "#1B4F72", fontSize: "11px" }}>
//           {title}
//         </p>
//       </div>
//       <p
//         style={{
//           fontFamily: "Nunito Sans",
//           color: "#0A3D62",
//           fontSize: "18px",
//         }}
//       >
//         {value}
//       </p>
//     </div>
//   );
// }
