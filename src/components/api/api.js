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
  const res = await api.post(`/drugs/interactions`, { medications });
  return res.data.data;
};

export const aiEMRExtraction = async (text, patientId) => {
  const res = await api.post(`/ai/emr`, { text, patientId });
  return res.data.data;
};

// ==================== CLINIC ENDPOINTS ====================

// Get patient information (clinic view)
export const getClinicPatientInfo = async (patientId) => {
  const res = await api.get(`/clinic/patient/${patientId}`);
  return res.data.data;
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
