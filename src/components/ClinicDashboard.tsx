import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Activity,
  AlertCircle,
  Mic,
  Search,
  Bell,
  LogOut,
  Crown,
  Filter,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  Square,
  Plus,
  X,
  Eye,
  Trash2,
  Send,
  Download,
  Calendar,
  Clock,
  Mail,
  Phone,
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
import {
  createEncounter,
  getClinicPatientInfo,
  checkPrescriptionInteractions,
  getEncounterById,
  createPrescription,
} from "./api/api";
import logo from "figma:asset/eb6d15466f76858f9aa3d9535154b129bc9f0c63.png";

interface User {
  name: string;
  hospital?: string;
  subscriptionTier?: "free" | "premium";
}

interface ClinicDashboardProps {
  user: User;
  onLogout: () => void;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  dob: string;
  email: string;
  phone: string;
  lastVisit: string;
  alerts: number;
  activePrescriptions: number;
  visits: number;
}

interface Alert {
  id: string;
  priority: "high" | "medium" | "low";
  patient: string;
  patientId: string;
  title: string;
  description: string;
  timestamp: string;
  aiScore: number;
  status: "active" | "reviewed" | "dismissed";
}

interface Session {
  id: string;
  patient: string;
  patientId: string;
  date: string;
  duration: string;
  summary: string;
  transcribed: boolean;
  transcript?: string;
}

interface EncounterData {
  summary: string;
  symptoms: string[];
  diagnosis: string;
  medications: string[];
  vitals: Record<string, any>;
}

interface DrugInteractionResult {
  interactions: any[];
  severity?: "high" | "medium" | "low";
}

export default function ClinicDashboard({
  user,
  onLogout,
}: ClinicDashboardProps) {
  const [activeTab, setActiveTab] = useState("patients");
  const [selectedPatient, setSelectedPatient] = useState<string | null>("1");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [showEmergencyAccess, setShowEmergencyAccess] = useState(false);
  const [showAddPrescription, setShowAddPrescription] = useState(false);
  const [showAlertDetail, setShowAlertDetail] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showRecordSessionModal, setShowRecordSessionModal] = useState(false);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionType, setSessionType] = useState<"new" | "existing">(
    "existing"
  );

  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  // Data states
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: "1",
      name: "John Doe",
      age: 45,
      dob: "05/15/1980",
      email: "john.doe@email.com",
      phone: "(555) 123-4567",
      lastVisit: "Nov 18, 2025",
      alerts: 2,
      activePrescriptions: 3,
      visits: 12,
    },
    {
      id: "2",
      name: "Sarah Williams",
      age: 62,
      dob: "03/22/1963",
      email: "sarah.w@email.com",
      phone: "(555) 234-5678",
      lastVisit: "Nov 15, 2025",
      alerts: 0,
      activePrescriptions: 2,
      visits: 18,
    },
    {
      id: "3",
      name: "Michael Chen",
      age: 38,
      dob: "08/10/1987",
      email: "mchen@email.com",
      phone: "(555) 345-6789",
      lastVisit: "Nov 12, 2025",
      alerts: 1,
      activePrescriptions: 1,
      visits: 8,
    },
    {
      id: "4",
      name: "Emily Rodriguez",
      age: 51,
      dob: "12/05/1974",
      email: "emily.r@email.com",
      phone: "(555) 456-7890",
      lastVisit: "Nov 10, 2025",
      alerts: 3,
      activePrescriptions: 4,
      visits: 15,
    },
  ]);

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "1",
      priority: "high",
      patient: "John Doe",
      patientId: "1",
      title: "🚨 Critical Symptom Alert",
      description:
        "Patient reported sharp stomach pain (7/10 severity) lasting 3 hours. Related to peptic ulcer history - potential relapse. Recommended urgent consult within 24hrs.",
      timestamp: "1 hour ago",
      aiScore: 95,
      status: "active",
    },
    {
      id: "2",
      priority: "high",
      patient: "John Doe",
      patientId: "1",
      title: "Drug Interaction Warning",
      description:
        "New prescription Warfarin may interact with existing Aspirin. Risk of bleeding increased.",
      timestamp: "2 hours ago",
      aiScore: 92,
      status: "active",
    },
    {
      id: "3",
      priority: "high",
      patient: "Emily Rodriguez",
      patientId: "4",
      title: "Symptom Pattern Alert",
      description:
        "Reported dizziness frequency 3x higher than baseline. Possible medication side effect.",
      timestamp: "5 hours ago",
      aiScore: 88,
      status: "active",
    },
    {
      id: "4",
      priority: "medium",
      patient: "Sarah Williams",
      patientId: "2",
      title: "Prescription Refill Due",
      description:
        "Levothyroxine prescription expires in 5 days. Patient has not requested refill.",
      timestamp: "1 day ago",
      aiScore: 75,
      status: "active",
    },
    {
      id: "5",
      priority: "medium",
      patient: "Michael Chen",
      patientId: "3",
      title: "Lab Results Follow-up",
      description:
        "Elevated cholesterol levels detected. Consider adjusting Atorvastatin dosage.",
      timestamp: "1 day ago",
      aiScore: 82,
      status: "active",
    },
    {
      id: "6",
      priority: "low",
      patient: "John Doe",
      patientId: "1",
      title: "Annual Checkup Reminder",
      description: "Patient due for annual physical exam within 30 days.",
      timestamp: "3 days ago",
      aiScore: 65,
      status: "active",
    },
  ]);

  const [sessions, setSessions] = useState<Session[]>([
    {
      id: "1",
      patient: "John Doe",
      patientId: "1",
      date: "Nov 18, 2025",
      duration: "15 min",
      summary:
        "Follow-up for hypertension management. Patient reports headaches. BP: 135/85.",
      transcribed: true,
      transcript:
        "Patient presents with recurring headaches over the past week. Reports taking Lisinopril as prescribed. Blood pressure measured at 135/85. Discussed importance of medication compliance and lifestyle modifications. Advised patient to monitor headache frequency and severity.",
    },
    {
      id: "2",
      patient: "Sarah Williams",
      patientId: "2",
      date: "Nov 15, 2025",
      duration: "20 min",
      summary:
        "Annual physical exam. All vitals normal. Updated thyroid medication dosage.",
      transcribed: true,
      transcript:
        "Comprehensive annual physical examination completed. All vital signs within normal limits. Thyroid function tests reviewed, TSH slightly elevated. Adjusted Levothyroxine dosage from 50mcg to 75mcg daily. Patient tolerating medication well.",
    },
    {
      id: "3",
      patient: "Michael Chen",
      patientId: "3",
      date: "Nov 12, 2025",
      duration: "12 min",
      summary:
        "Lab results review. Cholesterol levels elevated. Discussed dietary changes.",
      transcribed: true,
      transcript:
        "Reviewed recent lipid panel results. Total cholesterol 240 mg/dL, LDL 160 mg/dL. Discussed dietary modifications including reduced saturated fat intake and increased fiber. Will recheck levels in 3 months before considering medication adjustment.",
    },
  ]);

  const [newPatientData, setNewPatientData] = useState({
    name: "",
    dob: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [prescriptionData, setPrescriptionData] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });

  const [emergencyAccessData, setEmergencyAccessData] = useState({
    name: "",
    dob: "",
  });

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

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStartRecording = () => {
    if (!selectedPatient && sessionType === "existing") {
      setShowRecordSessionModal(true);
      return;
    }
    setIsRecording(true);
    setRecordingTime(0);
    showToast("Recording consultation session...", "info");
  };

  // Clinic creates encounter for a patient
  const handleCreateEncounter = async (
    patientId: string,
    encounterData: EncounterData
  ) => {
    try {
      setIsLoading(true);

      // Get the actual patient data
      const patient = patients.find((p) => p.id === patientId);
      if (!patient) {
        showToast("Patient not found", "error");
        return;
      }

      // Prepare encounter data
      const encounterPayload = {
        patientId: patientId,
        summary: encounterData.summary || "Consultation session",
        symptoms: encounterData.symptoms || [],
        diagnosis: encounterData.diagnosis || "General consultation",
        medications: encounterData.medications || [],
        vitals: encounterData.vitals || {},
      };

      console.log("Creating encounter:", encounterPayload);

      // Call the actual API
      const result = await createEncounter(encounterPayload);
      console.log("Encounter created successfully:", result);

      // Update local state with the new encounter
      const newSession: Session = {
        id: result.localEncounter?._id || `encounter_${Date.now()}`,
        patient: patient.name,
        patientId: patientId,
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        duration: "Recorded",
        summary: result.localEncounter?.summary || "Consultation completed",
        transcribed: true,
        transcript: `AI Transcription: ${
          result.localEncounter?.summary || "Session recorded successfully"
        }. Diagnosis: ${
          result.localEncounter?.diagnosis || "General consultation"
        }.`,
      };

      setSessions([newSession, ...sessions]);
      showToast("Encounter created and saved to EMR!", "success");
    } catch (error) {
      console.error("Error creating encounter:", error);
      showToast("Failed to create encounter. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopRecording = async () => {
    setIsLoading(true);
    setIsRecording(false);

    try {
      const selectedPatientData = patients.find(
        (p) => p.id === selectedPatient
      );

      // Create encounter data from the recording
      const encounterData: EncounterData = {
        summary: `Voice consultation with ${
          selectedPatientData?.name || "patient"
        }`,
        symptoms: ["Recorded consultation"],
        diagnosis: "Consultation completed",
        medications: [],
        vitals: {},
      };

      // Create the actual encounter
      await handleCreateEncounter(selectedPatient!, encounterData);

      showToast(
        "Session recorded, transcribed, and EMR updated! Patient notification sent.",
        "success"
      );
      setActiveTab("sessions");
    } catch (error) {
      console.error("Error processing recording:", error);
      showToast("Recording saved locally. EMR update pending.", "info");
    } finally {
      setIsLoading(false);
    }
  };

  // Get patient information from API
  const fetchPatientInfo = async (patientId: string) => {
    try {
      const patientInfo = await getClinicPatientInfo(patientId);
      console.log("Patient info:", patientInfo);
      return patientInfo;
    } catch (error) {
      console.error("Error fetching patient info:", error);
      showToast("Failed to load patient details", "error");
    }
  };

  // Check drug interactions
  const handleCheckDrugInteractions = async (
    medications: string[]
  ): Promise<DrugInteractionResult | undefined> => {
    try {
      const result = await checkPrescriptionInteractions(medications);
      console.log("Drug interactions:", result);

      if (result.interactions.length > 0) {
        showToast(
          `⚠️ ${result.interactions.length} drug interaction(s) detected!`,
          "warning"
        );
      } else {
        showToast("No drug interactions detected", "success");
      }

      return result;
    } catch (error) {
      console.error("Error checking drug interactions:", error);
      showToast("Failed to check drug interactions", "error");
    }
  };

  // Get encounter details with drug interactions
  const fetchEncounterDetails = async (encounterId: string) => {
    try {
      const encounter = await getEncounterById(encounterId);
      console.log("Encounter details:", encounter);
      return encounter;
    } catch (error) {
      console.error("Error fetching encounter:", error);
      showToast("Failed to load encounter details", "error");
    }
  };

  const handleCreateNewPatientRecord = () => {
    if (!newPatientData.name || !newPatientData.dob || !newPatientData.email) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const age =
        new Date().getFullYear() - new Date(newPatientData.dob).getFullYear();
      const newPatient: Patient = {
        id: Date.now().toString(),
        name: newPatientData.name,
        age: age,
        dob: new Date(newPatientData.dob).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
        email: newPatientData.email,
        phone: newPatientData.phone || "Not provided",
        lastVisit: "Today",
        alerts: 0,
        activePrescriptions: 0,
        visits: 1,
      };

      setPatients([newPatient, ...patients]);
      setSelectedPatient(newPatient.id);
      setNewPatientData({ name: "", dob: "", email: "", phone: "", notes: "" });
      setShowNewPatientModal(false);
      setIsLoading(false);
      showToast(
        `Patient record created for ${newPatient.name}. Invitation email sent to ${newPatient.email}!`,
        "success"
      );

      // Start recording for new patient
      setSessionType("new");
      setTimeout(() => {
        handleStartRecording();
      }, 500);
    }, 1500);
  };

  const handleRecordForPatient = () => {
    if (sessionType === "new") {
      setShowRecordSessionModal(false);
      setShowNewPatientModal(true);
    } else {
      if (!selectedPatient) {
        showToast("Please select a patient first", "error");
        return;
      }
      setShowRecordSessionModal(false);
      handleStartRecording();
    }
  };

  const handleEmergencyAccessSubmit = () => {
    if (!emergencyAccessData.name || !emergencyAccessData.dob) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      showToast(
        "Emergency access granted. Limited patient information loaded.",
        "success"
      );
      setShowEmergencyAccess(false);
      setEmergencyAccessData({ name: "", dob: "" });
      setIsLoading(false);

      // Add emergency patient to list
      const emergencyPatient: Patient = {
        id: "emergency-" + Date.now(),
        name: emergencyAccessData.name,
        age: 0,
        dob: emergencyAccessData.dob,
        email: "Emergency Access",
        phone: "Emergency Access",
        lastVisit: "Emergency",
        alerts: 0,
        activePrescriptions: 0,
        visits: 0,
      };
      setPatients([emergencyPatient, ...patients]);
      setSelectedPatient(emergencyPatient.id);
    }, 1500);
  };

  // const handleAddPrescription = async () => {
  //   if (!prescriptionData.medication || !prescriptionData.dosage) {
  //     showToast("Please fill in required fields", "error");
  //     return;
  //   }

  //   if (!selectedPatient) {
  //     showToast("Please select a patient first", "error");
  //     return;
  //   }

  //   setIsLoading(true);

  //   try {
  //     // Get the selected patient data
  //     const patient = patients.find((p) => p.id === selectedPatient);
  //     if (!patient) {
  //       showToast("Patient not found", "error");
  //       return;
  //     }

  //     // Prepare prescription data
  //     const prescriptionPayload = {
  //       patientId: selectedPatient,
  //       patientName: patient.name,
  //       medication: prescriptionData.medication,
  //       dosage: prescriptionData.dosage,
  //       frequency: prescriptionData.frequency || "As directed",
  //       duration: prescriptionData.duration || "Ongoing",
  //       instructions: prescriptionData.instructions || "",
  //       prescribedBy: user.name, // Clinic name
  //       prescribedDate: new Date().toISOString(),
  //     };

  //     console.log("Creating prescription:", prescriptionPayload);

  //     // Call API to create prescription
  //     const result = await createPrescription(prescriptionPayload);
  //     console.log("Prescription created successfully:", result);

  //     // Check for drug interactions
  //     const currentMeds = patient.currentMedications || [];
  //     const medicationsToCheck = [...currentMeds, prescriptionData.medication];

  //     if (medicationsToCheck.length > 1) {
  //       const interactionResult = await handleCheckDrugInteractions(
  //         medicationsToCheck
  //       );

  //       // If serious interactions, show warning but still create prescription
  //       if (interactionResult?.severity === "high") {
  //         showToast(
  //           "⚠️ Serious drug interactions detected! Prescription created with warning.",
  //           "warning"
  //         );
  //       }
  //     }

  //     // Update local state
  //     setPatients(
  //       patients.map((p) =>
  //         p.id === selectedPatient
  //           ? {
  //               ...p,
  //               activePrescriptions: p.activePrescriptions + 1,
  //               currentMedications: [
  //                 ...(p.currentMedications || []),
  //                 prescriptionData.medication,
  //               ],
  //             }
  //           : p
  //       )
  //     );

  //     // Reset form
  //     setPrescriptionData({
  //       medication: "",
  //       dosage: "",
  //       frequency: "",
  //       duration: "",
  //       instructions: "",
  //     });
  //     setShowAddPrescription(false);

  //     showToast(
  //       `${prescriptionData.medication} prescribed successfully! Sent to patient and pharmacy.`,
  //       "success"
  //     );
  //   } catch (error) {
  //     console.error("Error adding prescription:", error);
  //     showToast("Failed to add prescription. Please try again.", "error");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleAddPrescription = async () => {
    if (!prescriptionData.medication || !prescriptionData.dosage) {
      showToast("Please fill in medication name and dosage", "error");
      return;
    }

    if (!selectedPatient) {
      showToast("Please select a patient first", "error");
      return;
    }

    setIsLoading(true);

    try {
      // Get the selected patient data
      const patient = patients.find((p) => p.id === selectedPatient);
      if (!patient) {
        showToast("Patient not found", "error");
        return;
      }

      // Prepare prescription data for storage
      const prescriptionPayload = {
        patientId: selectedPatient,
        patientName: patient.name,
        medication: prescriptionData.medication,
        dosage: prescriptionData.dosage,
        frequency: prescriptionData.frequency || "As directed",
        duration: prescriptionData.duration || "Ongoing",
        instructions: prescriptionData.instructions || "Take as prescribed",
        prescribedBy: user.name || "Clinic",
        prescribedDate: new Date().toISOString(),
        status: "active",
      };

      console.log("💊 Creating and storing prescription:", prescriptionPayload);

      // ✅ STORE PRESCRIPTION VIA API
      const result = await createPrescription(prescriptionPayload);
      console.log("✅ Prescription stored successfully:", result);

      // ✅ UPDATE LOCAL STATE
      const updatedPatients = patients.map((p) =>
        p.id === selectedPatient
          ? {
              ...p,
              activePrescriptions: p.activePrescriptions + 1,
              currentMedications: [
                ...(p.currentMedications || []),
                prescriptionData.medication,
              ],
            }
          : p
      );

      setPatients(updatedPatients);

      // ✅ RESET FORM
      setPrescriptionData({
        medication: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      });

      setShowAddPrescription(false);

      // ✅ SHOW SUCCESS MESSAGE
      showToast(
        `✅ ${prescriptionData.medication} prescribed and stored! Patient will see it immediately.`,
        "success"
      );

      console.log(
        "🔄 Patient state updated. New prescription count:",
        updatedPatients.find((p) => p.id === selectedPatient)
          ?.activePrescriptions
      );
    } catch (error) {
      console.error("❌ Error adding prescription:", error);
      showToast("Failed to store prescription. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to fetch and display patient details
  const handleViewPatientDetails = async (patientId: string) => {
    try {
      setIsLoading(true);

      // Fetch patient information from API
      const patientInfo = await getClinicPatientInfo(patientId);
      console.log("Patient info:", patientInfo);

      // Update the patient in local state with additional info
      setPatients((prevPatients) =>
        prevPatients.map((p) =>
          p.id === patientId
            ? {
                ...p,
                conditions: patientInfo.conditions || [],
                currentMedications: patientInfo.currentMedications || [],
                allergies: patientInfo.allergies || [],
              }
            : p
        )
      );

      setSelectedPatient(patientId);
      setShowPatientDetails(true);
    } catch (error) {
      console.error("Error fetching patient details:", error);
      showToast("Failed to load patient details", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlertAction = (action: "review" | "dismiss", alertId: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              status: action === "review" ? "reviewed" : "dismissed",
            }
          : alert
      )
    );
    showToast(`Alert ${action}ed successfully!`, "success");
    setShowAlertDetail(false);
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(alerts.filter((a) => a.id !== alertId));
    showToast("Alert removed", "success");
  };

  const handleDeletePatient = (patientId: string, patientName: string) => {
    setPatients(patients.filter((p) => p.id !== patientId));
    if (selectedPatient === patientId) {
      setSelectedPatient(null);
    }
    showToast(`${patientName} removed from patient list`, "success");
  };

  const handleExportData = (type: string) => {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      showToast(`${type} exported successfully as PDF!`, "success");
    }, 1500);
  };

  const handleViewPatient = (patientId: string) => {
    setSelectedPatient(patientId);
    const patient = patients.find((p) => p.id === patientId);
    if (patient) {
      setShowPatientDetails(true);
    }
  };

  const handleViewSession = (session: Session) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority =
      filterPriority === "all" || alert.priority === filterPriority;
    return matchesSearch && matchesPriority && alert.status === "active";
  });

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPatientData = patients.find((p) => p.id === selectedPatient);

  // Rest of the JSX remains the same...
  // [The JSX part of your component remains unchanged as it was already correct]

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
                  Clinic Portal
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
                onClick={() => handleExportData("Practice Analytics")}
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
                    {user.hospital}
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
              <Button
                variant="ghost"
                onClick={onLogout}
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
            {alerts
              .filter((a) => a.status === "active")
              .slice(0, 5)
              .map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg cursor-pointer hover:bg-opacity-80"
                  style={{
                    backgroundColor:
                      alert.priority === "high" ? "#FFF5F5" : "#F0F9FF",
                  }}
                  onClick={() => {
                    setSelectedAlert(alert);
                    setShowAlertDetail(true);
                    setShowNotifications(false);
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Roboto",
                      color: alert.priority === "high" ? "#FF6F61" : "#0A3D62",
                      fontSize: "14px",
                    }}
                  >
                    {alert.priority === "high" ? "⚠️" : "📋"} {alert.title}
                  </p>
                  <p
                    style={{
                      fontFamily: "Lato",
                      color: "#1B4F72",
                      fontSize: "12px",
                    }}
                  >
                    {alert.patient} • {alert.timestamp}
                  </p>
                </div>
              ))}
          </div>
          <div
            className="p-3 border-t text-center"
            style={{ borderColor: "#E8F4F8" }}
          >
            <button
              onClick={() => {
                setActiveTab("alerts");
                setShowNotifications(false);
              }}
              style={{
                fontFamily: "Poppins",
                color: "#0A3D62",
                fontSize: "14px",
              }}
            >
              View All Alerts
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Subscription Banner */}
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
                Professional Subscription Active
              </p>
              <p
                style={{
                  fontFamily: "Lato",
                  color: "#EAEFF2",
                  fontSize: "14px",
                }}
              >
                Unlimited patient access, advanced AI analytics, and priority
                API integration
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="rounded-lg px-6"
            style={{
              fontFamily: "Poppins",
              color: "#FFFFFF",
            }}
            onClick={() =>
              showToast("Subscription management available in settings", "info")
            }
          >
            Manage Plan
          </Button>
        </div>

        {/* Recording Banner */}
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
                    Recording Consultation
                  </p>
                  <p
                    style={{
                      fontFamily: "Lato",
                      color: "#1B4F72",
                      fontSize: "14px",
                    }}
                  >
                    Patient: {selectedPatientData?.name || "New Patient"} •{" "}
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
                {isLoading ? "Processing..." : "Save & Transcribe"}
              </Button>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users />}
            value={patients.length.toString()}
            label="Active Patients"
            change={`+${Math.floor(patients.length * 0.1)} this week`}
            onClick={() => setActiveTab("patients")}
          />
          <StatCard
            icon={<FileText />}
            value={sessions.length.toString()}
            label="Pending Reviews"
            change={`${Math.floor(sessions.length * 0.2)} urgent`}
            onClick={() => setActiveTab("sessions")}
          />
          <StatCard
            icon={<AlertCircle />}
            value={alerts
              .filter((a) => a.status === "active")
              .length.toString()}
            label="AI Alerts"
            change={`${
              alerts.filter((a) => a.priority === "high").length
            } new today`}
            onClick={() => setActiveTab("alerts")}
          />
          <StatCard
            icon={<Activity />}
            value={sessions.length.toString()}
            label="Sessions This Month"
            change="+12% vs last month"
            onClick={() => setActiveTab("analytics")}
          />
        </div>

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
              value="patients"
              className="rounded-lg px-6"
              style={{ fontFamily: "Poppins" }}
            >
              <Users className="w-4 h-4 mr-2" />
              Patients
            </TabsTrigger>
            <TabsTrigger
              value="alerts"
              className="rounded-lg px-6"
              style={{ fontFamily: "Poppins" }}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              AI Alerts
              {alerts.filter((a) => a.status === "active").length > 0 && (
                <Badge
                  className="ml-2"
                  style={{ backgroundColor: "#FF6F61", color: "#FFFFFF" }}
                >
                  {alerts.filter((a) => a.status === "active").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="sessions"
              className="rounded-lg px-6"
              style={{ fontFamily: "Poppins" }}
            >
              <Mic className="w-4 h-4 mr-2" />
              Sessions
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-lg px-6"
              style={{ fontFamily: "Poppins" }}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Patients Tab */}
          <TabsContent value="patients">
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
                  style={{ color: "#1B4F72" }}
                />
                <Input
                  placeholder="Search patients by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 rounded-lg border-2"
                  style={{ borderColor: "#E8F4F8" }}
                />
              </div>
              <Button
                onClick={() => setShowNewPatientModal(true)}
                className="rounded-lg whitespace-nowrap"
                style={{
                  fontFamily: "Poppins",
                  backgroundColor: "#0A3D62",
                  color: "#FFFFFF",
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Patient
              </Button>
              <Button
                onClick={() => setShowEmergencyAccess(true)}
                className="rounded-lg whitespace-nowrap"
                style={{
                  fontFamily: "Poppins",
                  backgroundColor: "#FF6F61",
                  color: "#FFFFFF",
                }}
              >
                Emergency Access
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Patient List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3
                    style={{
                      fontFamily: "Nunito Sans",
                      color: "#0A3D62",
                      fontSize: "20px",
                    }}
                  >
                    Your Patients ({filteredPatients.length})
                  </h3>
                </div>
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <PatientListItem
                      key={patient.id}
                      {...patient}
                      isSelected={selectedPatient === patient.id}
                      onClick={() => setSelectedPatient(patient.id)}
                      onView={() => handleViewPatient(patient.id)}
                    />
                  ))
                ) : (
                  <div
                    className="p-12 rounded-xl text-center"
                    style={{ backgroundColor: "#F2F6FA" }}
                  >
                    <Users
                      className="w-16 h-16 mx-auto mb-4"
                      style={{ color: "#1B4F72", opacity: 0.5 }}
                    />
                    <p style={{ fontFamily: "Roboto", color: "#1B4F72" }}>
                      No patients found matching your search
                    </p>
                  </div>
                )}
              </div>

              {/* Patient Details */}
              {selectedPatientData ? (
                <div
                  className="p-6 rounded-xl"
                  style={{
                    backgroundColor: "#FFFFFF",
                    boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
                  }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3
                        style={{
                          fontFamily: "Nunito Sans",
                          color: "#0A3D62",
                          fontSize: "24px",
                        }}
                      >
                        {selectedPatientData.name}
                      </h3>
                      <p
                        style={{
                          fontFamily: "Roboto",
                          color: "#1B4F72",
                          fontSize: "14px",
                        }}
                      >
                        DOB: {selectedPatientData.dob} • Age{" "}
                        {selectedPatientData.age}
                      </p>
                      <p
                        style={{
                          fontFamily: "Roboto",
                          color: "#1B4F72",
                          fontSize: "14px",
                        }}
                      >
                        <Mail className="w-3 h-3 inline mr-1" />
                        {selectedPatientData.email}
                      </p>
                      <p
                        style={{
                          fontFamily: "Roboto",
                          color: "#1B4F72",
                          fontSize: "14px",
                        }}
                      >
                        <Phone className="w-3 h-3 inline mr-1" />
                        {selectedPatientData.phone}
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        isRecording
                          ? handleStopRecording()
                          : handleStartRecording()
                      }
                      disabled={isLoading}
                      className="rounded-lg"
                      style={{
                        fontFamily: "Poppins",
                        backgroundColor: isRecording ? "#FF6F61" : "#0A3D62",
                        color: "#FFFFFF",
                      }}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      {isRecording ? "Stop" : "Record"}
                    </Button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div
                      className="text-center p-3 rounded-lg"
                      style={{ backgroundColor: "#F2F6FA" }}
                    >
                      <p
                        style={{
                          fontFamily: "Nunito Sans",
                          color: "#0A3D62",
                          fontSize: "24px",
                        }}
                      >
                        {selectedPatientData.activePrescriptions}
                      </p>
                      <p
                        style={{
                          fontFamily: "Lato",
                          color: "#1B4F72",
                          fontSize: "12px",
                        }}
                      >
                        Active Rx
                      </p>
                    </div>
                    <div
                      className="text-center p-3 rounded-lg"
                      style={{ backgroundColor: "#F2F6FA" }}
                    >
                      <p
                        style={{
                          fontFamily: "Nunito Sans",
                          color: "#0A3D62",
                          fontSize: "24px",
                        }}
                      >
                        {selectedPatientData.visits}
                      </p>
                      <p
                        style={{
                          fontFamily: "Lato",
                          color: "#1B4F72",
                          fontSize: "12px",
                        }}
                      >
                        Visits
                      </p>
                    </div>
                    <div
                      className="text-center p-3 rounded-lg"
                      style={{
                        backgroundColor:
                          selectedPatientData.alerts > 0
                            ? "#FFF5F5"
                            : "#F2F6FA",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "Nunito Sans",
                          color:
                            selectedPatientData.alerts > 0
                              ? "#FF6F61"
                              : "#0A3D62",
                          fontSize: "24px",
                        }}
                      >
                        {selectedPatientData.alerts}
                      </p>
                      <p
                        style={{
                          fontFamily: "Lato",
                          color: "#1B4F72",
                          fontSize: "12px",
                        }}
                      >
                        Alerts
                      </p>
                    </div>
                  </div>

                  {/* AI Alerts for Patient */}
                  {selectedPatientData.alerts > 0 && (
                    <div className="mb-6">
                      <h4
                        className="mb-3"
                        style={{
                          fontFamily: "Nunito Sans",
                          color: "#0A3D62",
                          fontSize: "16px",
                        }}
                      >
                        AI Alerts
                      </h4>
                      <div className="space-y-3">
                        {alerts
                          .filter(
                            (a) =>
                              a.patientId === selectedPatient &&
                              a.status === "active"
                          )
                          .slice(0, 2)
                          .map((alert) => (
                            <div
                              key={alert.id}
                              className="p-3 rounded-lg cursor-pointer hover:shadow-md transition-all"
                              style={{
                                backgroundColor:
                                  alert.priority === "high"
                                    ? "#FFF5F5"
                                    : "#FFFBEB",
                                borderLeft: `4px solid ${
                                  alert.priority === "high"
                                    ? "#FF6F61"
                                    : "#FBBF24"
                                }`,
                              }}
                              onClick={() => {
                                setSelectedAlert(alert);
                                setShowAlertDetail(true);
                              }}
                            >
                              <p
                                style={{
                                  fontFamily: "Roboto",
                                  color:
                                    alert.priority === "high"
                                      ? "#FF6F61"
                                      : "#F59E0B",
                                  fontSize: "14px",
                                }}
                              >
                                {alert.priority === "high"
                                  ? "High Priority"
                                  : "Medium Priority"}
                              </p>
                              <p
                                style={{
                                  fontFamily: "Lato",
                                  color: "#1B4F72",
                                  fontSize: "12px",
                                }}
                              >
                                {alert.description}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="rounded-lg border-2"
                      style={{
                        fontFamily: "Poppins",
                        borderColor: "#E8F4F8",
                        color: "#1B4F72",
                      }}
                      onClick={() => handleViewPatient(selectedPatient!)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Full History
                    </Button>
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
                </div>
              ) : (
                <div
                  className="p-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#F2F6FA" }}
                >
                  <div className="text-center">
                    <Users
                      className="w-16 h-16 mx-auto mb-4"
                      style={{ color: "#1B4F72" }}
                    />
                    <p style={{ fontFamily: "Roboto", color: "#1B4F72" }}>
                      Select a patient to view details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* AI Alerts Tab */}
          <TabsContent value="alerts">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "24px",
                  }}
                >
                  AI-Generated Alerts
                </h2>
                <p
                  style={{
                    fontFamily: "Roboto",
                    color: "#1B4F72",
                    fontSize: "14px",
                  }}
                >
                  Real-time alerts for prescription risks, adverse reactions,
                  and patient monitoring
                </p>
              </div>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Only</SelectItem>
                  <SelectItem value="medium">Medium Only</SelectItem>
                  <SelectItem value="low">Low Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div
                className="p-4 rounded-xl text-center cursor-pointer hover:scale-105 transition-all"
                style={{ backgroundColor: "#FFF5F5" }}
                onClick={() => setFilterPriority("high")}
              >
                <p
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#FF6F61",
                    fontSize: "32px",
                  }}
                >
                  {
                    alerts.filter(
                      (a) => a.priority === "high" && a.status === "active"
                    ).length
                  }
                </p>
                <p
                  style={{
                    fontFamily: "Roboto",
                    color: "#1B4F72",
                    fontSize: "14px",
                  }}
                >
                  High Priority
                </p>
              </div>
              <div
                className="p-4 rounded-xl text-center cursor-pointer hover:scale-105 transition-all"
                style={{ backgroundColor: "#FFFBEB" }}
                onClick={() => setFilterPriority("medium")}
              >
                <p
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#F59E0B",
                    fontSize: "32px",
                  }}
                >
                  {
                    alerts.filter(
                      (a) => a.priority === "medium" && a.status === "active"
                    ).length
                  }
                </p>
                <p
                  style={{
                    fontFamily: "Roboto",
                    color: "#1B4F72",
                    fontSize: "14px",
                  }}
                >
                  Medium Priority
                </p>
              </div>
              <div
                className="p-4 rounded-xl text-center cursor-pointer hover:scale-105 transition-all"
                style={{ backgroundColor: "#F0F9FF" }}
                onClick={() => setFilterPriority("low")}
              >
                <p
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "32px",
                  }}
                >
                  {
                    alerts.filter(
                      (a) => a.priority === "low" && a.status === "active"
                    ).length
                  }
                </p>
                <p
                  style={{
                    fontFamily: "Roboto",
                    color: "#1B4F72",
                    fontSize: "14px",
                  }}
                >
                  Low Priority
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    {...alert}
                    onClick={() => {
                      setSelectedAlert(alert);
                      setShowAlertDetail(true);
                    }}
                    onDelete={() => handleDeleteAlert(alert.id)}
                  />
                ))
              ) : (
                <div
                  className="p-12 rounded-xl text-center"
                  style={{ backgroundColor: "#F2F6FA" }}
                >
                  <CheckCircle
                    className="w-16 h-16 mx-auto mb-4"
                    style={{ color: "#4ADE80" }}
                  />
                  <p
                    style={{
                      fontFamily: "Nunito Sans",
                      color: "#0A3D62",
                      fontSize: "20px",
                    }}
                  >
                    All Clear!
                  </p>
                  <p style={{ fontFamily: "Roboto", color: "#1B4F72" }}>
                    No active alerts at this time
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "24px",
                  }}
                >
                  Consultation Sessions
                </h2>
                <p
                  style={{
                    fontFamily: "Roboto",
                    color: "#1B4F72",
                    fontSize: "14px",
                  }}
                >
                  Voice-recorded sessions with AI transcription and EMR
                  integration
                </p>
              </div>
              <Button
                onClick={() => setShowRecordSessionModal(true)}
                className="rounded-lg whitespace-nowrap"
                style={{
                  fontFamily: "Poppins",
                  backgroundColor: "#0A3D62",
                  color: "#FFFFFF",
                }}
              >
                <Mic className="w-4 h-4 mr-2" />
                New Session
              </Button>
            </div>

            <div className="space-y-4">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  {...session}
                  onClick={() => handleViewSession(session)}
                  onExport={() =>
                    handleExportData(`Session - ${session.patient}`)
                  }
                />
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="mb-6">
              <h2
                style={{
                  fontFamily: "Nunito Sans",
                  color: "#0A3D62",
                  fontSize: "24px",
                }}
              >
                Practice Analytics
              </h2>
              <p
                style={{
                  fontFamily: "Roboto",
                  color: "#1B4F72",
                  fontSize: "14px",
                }}
              >
                AI-powered insights and trends across your patient population
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
                  Top Prescriptions
                </h3>
                <div className="space-y-3">
                  <TopPrescriptionItem
                    name="Lisinopril"
                    count={Math.floor(patients.length * 0.5)}
                    percentage={50}
                  />
                  <TopPrescriptionItem
                    name="Metformin"
                    count={Math.floor(patients.length * 0.4)}
                    percentage={40}
                  />
                  <TopPrescriptionItem
                    name="Atorvastatin"
                    count={Math.floor(patients.length * 0.3)}
                    percentage={30}
                  />
                  <TopPrescriptionItem
                    name="Levothyroxine"
                    count={Math.floor(patients.length * 0.25)}
                    percentage={25}
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
                  Common Symptoms Reported
                </h3>
                <div className="space-y-3">
                  <SymptomReportItem symptom="Headache" count={34} trend="up" />
                  <SymptomReportItem
                    symptom="Fatigue"
                    count={28}
                    trend="stable"
                  />
                  <SymptomReportItem
                    symptom="Dizziness"
                    count={19}
                    trend="down"
                  />
                  <SymptomReportItem symptom="Nausea" count={15} trend="up" />
                </div>
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
                AI Insights Summary
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div
                  className="p-4 rounded-lg cursor-pointer hover:scale-105 transition-all"
                  style={{
                    backgroundColor: "#F0FDF4",
                    borderLeft: "4px solid #4ADE80",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Nunito Sans",
                      color: "#16A34A",
                      fontSize: "16px",
                    }}
                  >
                    92%
                  </p>
                  <p
                    style={{
                      fontFamily: "Lato",
                      color: "#1B4F72",
                      fontSize: "12px",
                    }}
                  >
                    Prescription Safety Score
                  </p>
                </div>
                <div
                  className="p-4 rounded-lg cursor-pointer hover:scale-105 transition-all"
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
                    {sessions.length}
                  </p>
                  <p
                    style={{
                      fontFamily: "Lato",
                      color: "#1B4F72",
                      fontSize: "12px",
                    }}
                  >
                    Sessions Recorded
                  </p>
                </div>
                <div
                  className="p-4 rounded-lg cursor-pointer hover:scale-105 transition-all"
                  style={{
                    backgroundColor: "#FFFBEB",
                    borderLeft: "4px solid #FBBF24",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Nunito Sans",
                      color: "#F59E0B",
                      fontSize: "16px",
                    }}
                  >
                    {Math.floor(sessions.length * 2.5)} hrs
                  </p>
                  <p
                    style={{
                      fontFamily: "Lato",
                      color: "#1B4F72",
                      fontSize: "12px",
                    }}
                  >
                    Time Saved This Month
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* MODALS - All fully functional */}

      {/* Emergency Access Modal */}
      <Dialog open={showEmergencyAccess} onOpenChange={setShowEmergencyAccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: "#FF6F61" }}>
              Emergency Access
            </DialogTitle>
            <DialogDescription>
              Enter patient information for emergency access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="patient-name">Patient Full Name *</Label>
              <Input
                id="patient-name"
                placeholder="John Doe"
                value={emergencyAccessData.name}
                onChange={(e) =>
                  setEmergencyAccessData({
                    ...emergencyAccessData,
                    name: e.target.value,
                  })
                }
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="patient-dob">Date of Birth *</Label>
              <Input
                id="patient-dob"
                type="date"
                value={emergencyAccessData.dob}
                onChange={(e) =>
                  setEmergencyAccessData({
                    ...emergencyAccessData,
                    dob: e.target.value,
                  })
                }
                disabled={isLoading}
              />
            </div>
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "#FFF5F5" }}
            >
              <p className="text-sm" style={{ color: "#FF6F61" }}>
                ⚠️ <strong>Emergency Access:</strong> This action will be logged
                and limited information will be accessible.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEmergencyAccess(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEmergencyAccessSubmit}
              disabled={isLoading}
              style={{ backgroundColor: "#FF6F61", color: "#FFFFFF" }}
            >
              {isLoading ? "Granting..." : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Patient Modal */}
      <Dialog open={showNewPatientModal} onOpenChange={setShowNewPatientModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Patient Record</DialogTitle>
            <DialogDescription>
              Enter patient information to create a new record and send
              invitation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-patient-name">Patient Full Name *</Label>
              <Input
                id="new-patient-name"
                placeholder="John Doe"
                value={newPatientData.name}
                onChange={(e) =>
                  setNewPatientData({ ...newPatientData, name: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="new-patient-dob">Date of Birth *</Label>
              <Input
                id="new-patient-dob"
                type="date"
                value={newPatientData.dob}
                onChange={(e) =>
                  setNewPatientData({ ...newPatientData, dob: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="new-patient-email">Email Address *</Label>
              <Input
                id="new-patient-email"
                type="email"
                value={newPatientData.email}
                onChange={(e) =>
                  setNewPatientData({
                    ...newPatientData,
                    email: e.target.value,
                  })
                }
                placeholder="patient@email.com"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="new-patient-phone">Phone Number</Label>
              <Input
                id="new-patient-phone"
                type="tel"
                value={newPatientData.phone}
                onChange={(e) =>
                  setNewPatientData({
                    ...newPatientData,
                    phone: e.target.value,
                  })
                }
                placeholder="(555) 123-4567"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="new-patient-notes">Additional Notes</Label>
              <Textarea
                id="new-patient-notes"
                value={newPatientData.notes}
                onChange={(e) =>
                  setNewPatientData({
                    ...newPatientData,
                    notes: e.target.value,
                  })
                }
                rows={3}
                placeholder="Any relevant medical history or notes..."
                disabled={isLoading}
              />
            </div>
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "#F0F9FF" }}
            >
              <p className="text-sm" style={{ color: "#1B4F72" }}>
                📧 An invitation email will be sent to the patient to access
                their records
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewPatientModal(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewPatientRecord}
              disabled={isLoading}
              style={{ backgroundColor: "#0A3D62", color: "#FFFFFF" }}
            >
              {isLoading ? "Creating..." : "Create & Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Session Modal */}
      <Dialog
        open={showRecordSessionModal}
        onOpenChange={setShowRecordSessionModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Session</DialogTitle>
            <DialogDescription>
              Choose to record for an existing patient or create a new patient
              record
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div
              className="flex items-center gap-4 p-4 rounded-lg cursor-pointer border-2 transition-all hover:shadow-md"
              style={{
                borderColor: sessionType === "existing" ? "#0A3D62" : "#E8F4F8",
                backgroundColor:
                  sessionType === "existing" ? "#F0F9FF" : "#FFFFFF",
              }}
              onClick={() => setSessionType("existing")}
            >
              <input
                type="radio"
                id="existing-patient"
                name="session-type"
                value="existing"
                checked={sessionType === "existing"}
                onChange={() => setSessionType("existing")}
              />
              <div>
                <Label htmlFor="existing-patient" className="cursor-pointer">
                  <p
                    style={{
                      fontFamily: "Roboto",
                      color: "#0A3D62",
                      fontSize: "16px",
                    }}
                  >
                    Existing Patient
                  </p>
                  <p
                    style={{
                      fontFamily: "Lato",
                      color: "#1B4F72",
                      fontSize: "12px",
                    }}
                  >
                    Record session for a patient already in your system
                  </p>
                </Label>
              </div>
            </div>
            <div
              className="flex items-center gap-4 p-4 rounded-lg cursor-pointer border-2 transition-all hover:shadow-md"
              style={{
                borderColor: sessionType === "new" ? "#0A3D62" : "#E8F4F8",
                backgroundColor: sessionType === "new" ? "#F0F9FF" : "#FFFFFF",
              }}
              onClick={() => setSessionType("new")}
            >
              <input
                type="radio"
                id="new-patient"
                name="session-type"
                value="new"
                checked={sessionType === "new"}
                onChange={() => setSessionType("new")}
              />
              <div>
                <Label htmlFor="new-patient" className="cursor-pointer">
                  <p
                    style={{
                      fontFamily: "Roboto",
                      color: "#0A3D62",
                      fontSize: "16px",
                    }}
                  >
                    New Patient
                  </p>
                  <p
                    style={{
                      fontFamily: "Lato",
                      color: "#1B4F72",
                      fontSize: "12px",
                    }}
                  >
                    Create a new patient record and record session
                  </p>
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRecordSessionModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordForPatient}
              style={{ backgroundColor: "#0A3D62", color: "#FFFFFF" }}
            >
              {sessionType === "new" ? "Create Patient" : "Start Recording"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Prescription Modal */}
      <Dialog open={showAddPrescription} onOpenChange={setShowAddPrescription}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Prescription</DialogTitle>
            <DialogDescription>
              Prescribe medication for{" "}
              {selectedPatientData?.name || "selected patient"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="medication">Medication Name *</Label>
              <Input
                id="medication"
                placeholder="e.g., Amoxicillin 500mg"
                value={prescriptionData.medication}
                onChange={(e) =>
                  setPrescriptionData({
                    ...prescriptionData,
                    medication: e.target.value,
                  })
                }
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                placeholder="e.g., 500mg"
                value={prescriptionData.dosage}
                onChange={(e) =>
                  setPrescriptionData({
                    ...prescriptionData,
                    dosage: e.target.value,
                  })
                }
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Input
                id="frequency"
                placeholder="e.g., Three times daily"
                value={prescriptionData.frequency}
                onChange={(e) =>
                  setPrescriptionData({
                    ...prescriptionData,
                    frequency: e.target.value,
                  })
                }
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g., 7 days"
                value={prescriptionData.duration}
                onChange={(e) =>
                  setPrescriptionData({
                    ...prescriptionData,
                    duration: e.target.value,
                  })
                }
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Additional instructions for the patient..."
                value={prescriptionData.instructions}
                onChange={(e) =>
                  setPrescriptionData({
                    ...prescriptionData,
                    instructions: e.target.value,
                  })
                }
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddPrescription(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddPrescription} disabled={isLoading}>
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? "Prescribing..." : "Prescribe & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Detail Modal */}
      <Dialog open={showAlertDetail} onOpenChange={setShowAlertDetail}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
            <DialogDescription>
              {selectedAlert?.patient} - {selectedAlert?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "#F0F9FF" }}
            >
              <p className="mb-2">
                <strong>AI Confidence:</strong> {selectedAlert?.aiScore}%
              </p>
              <p className="mb-2">
                <strong>Description:</strong> {selectedAlert?.description}
              </p>
              <p className="mb-2">
                <strong>Recommendation:</strong> Review patient medication and
                symptom history. Consider consultation or dosage adjustment.
              </p>
              <p className="text-sm">
                <strong>Data Sources:</strong> Patient symptom logs,
                prescription history, drug interaction database (PharmaVigilance
                API)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedAlert?.patientId) {
                    setSelectedPatient(selectedAlert.patientId);
                    setShowAlertDetail(false);
                    setActiveTab("patients");
                  }
                }}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Patient
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                selectedAlert && handleAlertAction("dismiss", selectedAlert.id)
              }
            >
              Dismiss
            </Button>
            <Button
              onClick={() =>
                selectedAlert && handleAlertAction("review", selectedAlert.id)
              }
            >
              Mark as Reviewed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Details Modal */}
      <Dialog open={showSessionDetails} onOpenChange={setShowSessionDetails}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSession?.patient}</DialogTitle>
            <DialogDescription>
              {selectedSession?.date} • {selectedSession?.duration}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <h4
                style={{
                  fontFamily: "Nunito Sans",
                  color: "#0A3D62",
                  fontSize: "16px",
                }}
                className="mb-2"
              >
                Summary
              </h4>
              <p
                style={{
                  fontFamily: "Roboto",
                  color: "#1B4F72",
                  fontSize: "14px",
                }}
              >
                {selectedSession?.summary}
              </p>
            </div>
            {selectedSession?.transcript && (
              <div>
                <h4
                  style={{
                    fontFamily: "Nunito Sans",
                    color: "#0A3D62",
                    fontSize: "16px",
                  }}
                  className="mb-2"
                >
                  Full Transcript
                </h4>
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: "#F2F6FA" }}
                >
                  <p
                    style={{
                      fontFamily: "Roboto",
                      color: "#1B4F72",
                      fontSize: "14px",
                      lineHeight: "1.6",
                    }}
                  >
                    {selectedSession.transcript}
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSessionDetails(false)}
            >
              Close
            </Button>
            <Button
              onClick={() =>
                selectedSession &&
                handleExportData(`Session - ${selectedSession.patient}`)
              }
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              {isLoading ? "Exporting..." : "Export PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Details Modal */}
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
            <Button
              onClick={() =>
                handleExportData(
                  `Patient Record - ${selectedPatientData?.name}`
                )
              }
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              {isLoading ? "Exporting..." : "Export Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Components
function StatCard({ icon, value, label, change, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="p-6 rounded-xl cursor-pointer transition-all hover:scale-105"
      style={{
        backgroundColor: "#FFFFFF",
        boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "#E8F4F8" }}
        >
          <div style={{ color: "#0A3D62" }}>{icon}</div>
        </div>
      </div>
      <p
        style={{
          fontFamily: "Nunito Sans",
          color: "#0A3D62",
          fontSize: "32px",
        }}
      >
        {value}
      </p>
      <p style={{ fontFamily: "Roboto", color: "#1B4F72", fontSize: "14px" }}>
        {label}
      </p>
      <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
        {change}
      </p>
    </div>
  );
}

function PatientListItem({
  id,
  name,
  age,
  lastVisit,
  alerts,
  isSelected,
  onClick,
  onView,
}: any) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-xl text-left transition-all hover:shadow-md group"
      style={{
        backgroundColor: isSelected ? "#E8F4F8" : "#FFFFFF",
        boxShadow: isSelected
          ? "0 4px 16px rgba(10, 61, 98, 0.16)"
          : "0 2px 8px rgba(10, 61, 98, 0.08)",
        borderLeft: isSelected ? "4px solid #0A3D62" : "4px solid transparent",
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <p
            style={{ fontFamily: "Roboto", color: "#0A3D62", fontSize: "16px" }}
          >
            {name}
          </p>
          <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
            Age {age} • Last visit: {lastVisit}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50"
          >
            <Eye className="w-4 h-4" style={{ color: "#0A3D62" }} />
          </button>
          <ChevronRight className="w-5 h-5" style={{ color: "#1B4F72" }} />
        </div>
      </div>
      {alerts > 0 && (
        <Badge style={{ backgroundColor: "#FFF5F5", color: "#FF6F61" }}>
          {alerts} alert{alerts !== 1 ? "s" : ""}
        </Badge>
      )}
    </button>
  );
}

function AlertCard({
  id,
  priority,
  patient,
  title,
  description,
  timestamp,
  aiScore,
  status,
  onClick,
  onDelete,
}: any) {
  const priorityColors = {
    high: { bg: "#FFF5F5", border: "#FF6F61", text: "#FF6F61" },
    medium: { bg: "#FFFBEB", border: "#FBBF24", text: "#F59E0B" },
    low: { bg: "#F0F9FF", border: "#0A3D62", text: "#1B4F72" },
  };

  const colors = priorityColors[priority as keyof typeof priorityColors];

  return (
    <div
      onClick={onClick}
      className="p-6 rounded-xl cursor-pointer transition-all hover:shadow-lg group"
      style={{
        backgroundColor: colors.bg,
        borderLeft: `4px solid ${colors.border}`,
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge style={{ backgroundColor: colors.border, color: "#FFFFFF" }}>
              {priority.toUpperCase()}
            </Badge>
            <span
              style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}
            >
              {patient}
            </span>
          </div>
          <h4
            style={{
              fontFamily: "Nunito Sans",
              color: colors.text,
              fontSize: "16px",
            }}
          >
            {title}
          </h4>
          <p
            style={{
              fontFamily: "Roboto",
              color: "#1B4F72",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            {description}
          </p>
        </div>
        <div className="text-right ml-4 flex items-start gap-2">
          <div>
            <p
              style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}
            >
              {timestamp}
            </p>
            <p
              style={{
                fontFamily: "Poppins",
                color: "#0A3D62",
                fontSize: "14px",
              }}
            >
              AI: {aiScore}%
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" style={{ color: "#FF6F61" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SessionCard({
  id,
  patient,
  date,
  duration,
  summary,
  transcribed,
  onClick,
  onExport,
}: any) {
  return (
    <div
      onClick={onClick}
      className="p-6 rounded-xl cursor-pointer transition-all hover:shadow-lg group"
      style={{
        backgroundColor: "#FFFFFF",
        boxShadow: "0 4px 16px rgba(10, 61, 98, 0.08)",
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <p
            style={{
              fontFamily: "Nunito Sans",
              color: "#0A3D62",
              fontSize: "16px",
            }}
          >
            {patient}
          </p>
          <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
            {date} • {duration}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {transcribed && (
            <Badge style={{ backgroundColor: "#E8F4F8", color: "#0A3D62" }}>
              <CheckCircle className="w-3 h-3 mr-1" />
              Transcribed
            </Badge>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport();
            }}
            className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50"
          >
            <Download className="w-4 h-4" style={{ color: "#0A3D62" }} />
          </button>
        </div>
      </div>
      <p
        style={{
          fontFamily: "Roboto",
          color: "#1B4F72",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      >
        {summary}
      </p>
    </div>
  );
}

function TopPrescriptionItem({ name, count, percentage }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p style={{ fontFamily: "Roboto", color: "#0A3D62", fontSize: "14px" }}>
          {name}
        </p>
        <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
          {count} patients
        </p>
      </div>
      <div className="h-2 rounded-full" style={{ backgroundColor: "#E8F4F8" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            backgroundColor: "#0A3D62",
          }}
        />
      </div>
    </div>
  );
}

function SymptomReportItem({ symptom, count, trend }: any) {
  const trendColors = {
    up: "#FF6F61",
    down: "#4ADE80",
    stable: "#1B4F72",
  };

  return (
    <div
      className="flex justify-between items-center p-3 rounded-lg"
      style={{ backgroundColor: "#F2F6FA" }}
    >
      <div>
        <p style={{ fontFamily: "Roboto", color: "#0A3D62", fontSize: "14px" }}>
          {symptom}
        </p>
        <p style={{ fontFamily: "Lato", color: "#1B4F72", fontSize: "12px" }}>
          {count} reports
        </p>
      </div>
      <TrendingUp
        className="w-5 h-5"
        style={{
          color: trendColors[trend as keyof typeof trendColors],
          transform:
            trend === "down"
              ? "rotate(180deg)"
              : trend === "stable"
              ? "rotate(90deg)"
              : "none",
        }}
      />
    </div>
  );
}
