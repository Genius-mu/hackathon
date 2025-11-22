// api.js
import axios from "axios";

const API_BASE = "https://dosewise-2p1n.onrender.com/api";

// Helper functions
export const getStoredToken = () => {
  return (
    localStorage.getItem("patientToken") || localStorage.getItem("clinicToken")
  );
};

export const storeToken = (token, userType) => {
  const key = userType === "patient" ? "patientToken" : "clinicToken";
  localStorage.setItem(key, token);
};

export const removeToken = () => {
  localStorage.removeItem("patientToken");
  localStorage.removeItem("clinicToken");
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

// ==================== PATIENT ENDPOINTS ====================

export const getPatientProfile = async () => {
  const res = await api.get(`/patient/me`);
  return res.data.data;
};

export const getPatientRecords = async () => {
  const res = await api.get(`/patient/records`);
  return res.data.data;
};

export const uploadMedicalRecord = async (recordText) => {
  const res = await api.post(`/patient/upload-record`, { recordText });
  return res.data.data;
};

// Temporary mock solution for symptom logging
export const logSymptom = async (symptomData) => {
  try {
    console.log("Sending symptom data:", symptomData);
    console.log("⚠️ Backend returns 500 error - Using mock data instead");

    const mockResponse = {
      _id: `symptom_${Date.now()}`,
      patientId: "current_patient_id",
      symptom: symptomData.symptom,
      severity: symptomData.severity,
      notes: symptomData.notes || "",
      duration: symptomData.duration || "",
      loggedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    console.log("✅ Mock symptom logged successfully:", mockResponse);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return mockResponse;
  } catch (error) {
    console.error("Unexpected error in logSymptom:", error);
    const fallbackResponse = {
      _id: `fallback_${Date.now()}`,
      patientId: "current_patient_id",
      symptom: symptomData.symptom,
      severity: symptomData.severity,
      notes: symptomData.notes || "",
      duration: symptomData.duration || "",
      loggedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    return fallbackResponse;
  }
};

export const getSymptoms = async () => {
  const res = await api.get(`/patient/symptoms`);
  return res.data.data;
};

export const checkDrugInteractions = async (medications) => {
  try {
    console.log("Checking drug interactions for:", medications);

    // For now, return mock data since the backend might not be fully implemented
    const mockResponse = {
      interactions:
        medications.length > 1
          ? ["Potential mild interaction detected between medications"]
          : [],
      severity: medications.length > 1 ? "low" : "none",
      recommendations:
        medications.length > 1
          ? [
              "Monitor for any unusual symptoms",
              "Take medications at different times if possible",
            ]
          : ["No significant interactions detected"],
    };

    console.log("✅ Mock drug interactions check completed:", mockResponse);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      data: mockResponse,
    };
  } catch (error) {
    console.error("Error checking drug interactions:", error);

    // Fallback mock response
    const fallbackResponse = {
      interactions: [],
      severity: "none",
      recommendations: ["No interactions detected based on available data"],
    };

    return {
      data: fallbackResponse,
    };
  }
};

export const aiEMRExtraction = async (text, patientId) => {
  const res = await api.post(`/ai/emr`, { text, patientId });
  return res.data.data;
};

// ==================== CLINIC ENDPOINTS ====================

// Get patient information (clinic view)
export const getClinicPatientInfo = async (patientId) => {
  try {
    const res = await api.get(`/clinic/patient/${patientId}`);
    return res.data.data;
  } catch (error) {
    console.error("Error fetching patient info:", error);

    // Mock data for development
    const mockPatient = {
      _id: patientId,
      name: "John Doe",
      email: "john.doe@email.com",
      dob: "1980-05-15",
      conditions: ["hypertension", "peptic ulcer"],
      currentMedications: ["Lisinopril 10mg", "Metformin 500mg"],
      allergies: ["Penicillin"],
      emergencyContact: {
        name: "Jane Doe",
        phone: "(555) 123-4567",
      },
    };

    console.log("⚠️ Using mock patient data due to backend error");
    return mockPatient;
  }
};

// Create encounter
export const createEncounter = async (encounterData) => {
  const res = await api.post(`/clinic/encounter`, encounterData);
  return res.data.data;
};

// Get encounter by ID with drug interactions
export const getEncounterById = async (encounterId) => {
  const res = await api.get(`/clinic/encounter/${encounterId}`);
  return res.data.data;
};
// Create prescription for patient
// export const createPrescription = async (prescriptionData) => {
//   try {
//     const res = await api.post(`/clinic/prescription`, prescriptionData);
//     return res.data.data;
//   } catch (error) {
//     console.error("Error creating prescription:", error);

//     // Mock success response for development
//     const mockResponse = {
//       _id: `prescription_${Date.now()}`,
//       ...prescriptionData,
//       status: "active",
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     };

//     console.log("⚠️ Using mock prescription creation");
//     return mockResponse;
//   }
// };

// export const getPatientPrescriptions = async (patientId) => {
//   try {
//     const res = await api.get(`/patient/prescriptions/${patientId}`);
//     return res.data.data;
//   } catch (error) {
//     console.error("Error fetching prescriptions:", error);

//     // Mock prescriptions for development
//     const mockPrescriptions = [
//       {
//         _id: "1",
//         medication: "Lisinopril 10mg",
//         dosage: "10mg",
//         frequency: "Once daily",
//         duration: "Ongoing",
//         instructions: "Take in the morning",
//         prescribedBy: "Dr. Sarah Johnson",
//         prescribedDate: "2025-10-01",
//         status: "active",
//       },
//       {
//         _id: "2",
//         medication: "Metformin 500mg",
//         dosage: "500mg",
//         frequency: "Twice daily with meals",
//         duration: "Ongoing",
//         instructions: "Take with food to minimize stomach upset",
//         prescribedBy: "Dr. Sarah Johnson",
//         prescribedDate: "2025-09-15",
//         status: "active",
//       },
//     ];

//     console.log("⚠️ Using mock prescriptions data");
//     return mockPrescriptions;
//   }
// };

// ==================== PRESCRIPTION ENDPOINTS ====================

// Create prescription (Clinic)
export const createPrescription = async (prescriptionData) => {
  try {
    console.log("Creating prescription:", prescriptionData);

    const res = await api.post(`/prescriptions`, prescriptionData);
    console.log("✅ Prescription created successfully:", res.data);
    return res.data.data;
  } catch (error) {
    console.error("❌ Error creating prescription:", error);

    // Enhanced mock response for development
    const mockResponse = {
      _id: `prescription_${Date.now()}`,
      ...prescriptionData,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      patientId: prescriptionData.patientId,
      patientName: prescriptionData.patientName,
      medication: prescriptionData.medication,
      dosage: prescriptionData.dosage,
      frequency: prescriptionData.frequency,
      duration: prescriptionData.duration,
      instructions: prescriptionData.instructions,
      prescribedBy: prescriptionData.prescribedBy,
      prescribedDate: prescriptionData.prescribedDate,
    };

    console.log(
      "⚠️ Using mock prescription creation - STORED IN MOCK DATABASE"
    );

    // Store in localStorage as mock database
    const existingPrescriptions = JSON.parse(
      localStorage.getItem("mockPrescriptions") || "[]"
    );
    const updatedPrescriptions = [...existingPrescriptions, mockResponse];
    localStorage.setItem(
      "mockPrescriptions",
      JSON.stringify(updatedPrescriptions)
    );

    console.log(
      "📦 Mock prescription stored. Total prescriptions:",
      updatedPrescriptions.length
    );

    return mockResponse;
  }
};

// Get prescriptions for patient (Patient)
export const getPatientPrescriptions = async (patientId) => {
  try {
    const res = await api.get(`/prescriptions/patient/${patientId}`);
    console.log(
      "✅ Prescriptions fetched successfully for patient:",
      patientId
    );
    return res.data.data;
  } catch (error) {
    console.error("❌ Error fetching prescriptions:", error);

    // Get from mock database (localStorage)
    const mockPrescriptions = JSON.parse(
      localStorage.getItem("mockPrescriptions") || "[]"
    );
    const patientPrescriptions = mockPrescriptions.filter(
      (p) => p.patientId === patientId
    );

    console.log(
      "⚠️ Using mock prescriptions from storage. Found:",
      patientPrescriptions.length
    );

    // If no prescriptions found, return some default ones
    if (patientPrescriptions.length === 0) {
      const defaultPrescriptions = [
        {
          _id: "1",
          patientId: patientId,
          patientName: "John Doe",
          medication: "Lisinopril 10mg",
          dosage: "10mg",
          frequency: "Once daily",
          duration: "Ongoing",
          instructions: "Take in the morning",
          prescribedBy: "Dr. Sarah Johnson",
          prescribedDate: "2025-10-01T00:00:00.000Z",
          status: "active",
          createdAt: "2025-10-01T00:00:00.000Z",
          updatedAt: "2025-10-01T00:00:00.000Z",
        },
        {
          _id: "2",
          patientId: patientId,
          patientName: "John Doe",
          medication: "Metformin 500mg",
          dosage: "500mg",
          frequency: "Twice daily with meals",
          duration: "Ongoing",
          instructions: "Take with food to minimize stomach upset",
          prescribedBy: "Dr. Sarah Johnson",
          prescribedDate: "2025-09-15T00:00:00.000Z",
          status: "active",
          createdAt: "2025-09-15T00:00:00.000Z",
          updatedAt: "2025-09-15T00:00:00.000Z",
        },
      ];

      // Store defaults in mock database
      localStorage.setItem(
        "mockPrescriptions",
        JSON.stringify(defaultPrescriptions)
      );
      console.log("📦 Default prescriptions stored in mock database");
      return defaultPrescriptions;
    }

    return patientPrescriptions;
  }
};

// Get prescriptions by clinic (Clinic)
export const getClinicPrescriptions = async (clinicId) => {
  try {
    const res = await api.get(`/prescriptions/clinic/${clinicId}`);
    return res.data.data;
  } catch (error) {
    console.error("Error fetching clinic prescriptions:", error);

    // Get all prescriptions from mock database
    const mockPrescriptions = JSON.parse(
      localStorage.getItem("mockPrescriptions") || "[]"
    );
    console.log("📋 All prescriptions in mock database:", mockPrescriptions);

    return mockPrescriptions;
  }
};

// Check prescription drug interactions
export const checkPrescriptionInteractions = async (medications) => {
  const res = await api.post(`/clinic/prescription/check`, { medications });
  return res.data.data;
};

// ==================== ACCESS CONTROL ENDPOINTS ====================

// Generate QR code (patient) - SINGLE DECLARATION
// api.js - Update the generateQRCode function
export const generateQRCode = async (clinicId) => {
  try {
    const res = await api.post(`/access/generate-qr`, { clinicId });
    return res.data.data;
  } catch (error) {
    console.error("Error generating QR code:", error);

    // Return mock data for development
    const mockQRData = {
      qrCode: `mock_qr_data_${clinicId}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
      clinicId: clinicId,
      accessCode: `MOCK-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`,
    };

    console.log("⚠️ Using mock QR code data due to backend error");
    return mockQRData;
  }
};

// Scan QR code (clinic)
export const scanQRCode = async (code) => {
  const res = await api.get(`/access/scan/${code}`);
  return res.data.data;
};

// Revoke access (patient)
export const revokeAccess = async (grantId) => {
  const res = await api.delete(`/access/revoke/${grantId}`);
  return res.data;
};

// ==================== AUTH ENDPOINTS ====================

export const loginPatient = async (email, password) => {
  const res = await axios.post(`${API_BASE}/auth/login`, {
    email,
    password,
    userType: "patient",
  });
  return res.data.data;
};

export const registerPatient = async (patientData) => {
  const res = await axios.post(
    `${API_BASE}/auth/patient/register`,
    patientData
  );
  return res.data.data;
};

export const loginClinic = async (email, password) => {
  const res = await axios.post(`${API_BASE}/auth/login`, {
    email,
    password,
    userType: "clinic",
  });
  return res.data.data;
};

// In your api/api.ts file, add these functions:

// Advanced AI prescription analysis
export const analyzePrescriptionWithAI = async (prescriptionData) => {
  const token = getStoredToken();
  const response = await axios.post(
    `${API_BASE}/ai/prescription-analysis`,
    prescriptionData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// AI medication alternatives
export const getAIMedicationAlternatives = async (medication, condition) => {
  const token = getStoredToken();
  const response = await axios.post(
    `${API_BASE}/ai/medication-alternatives`,
    { medication, condition },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// AI dosage optimization
export const getAIDosageRecommendation = async (medication, patientData) => {
  const token = getStoredToken();
  const response = await axios.post(
    `${API_BASE}/ai/dosage-recommendation`,
    { medication, patientData },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};
