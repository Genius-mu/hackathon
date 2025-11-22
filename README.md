# 🩺 **DoseWise – Intelligent Medication & EMR Companion**

**DoseWise** is a digital health platform that helps patients, clinicians, and hospitals manage **medical records, medication safety, prescriptions, symptom logs, and remote vitals monitoring using AI and APIs.**

It integrates **Dorra EMR** for medical records and **PharmaVigilance APIs** for drug safety checks, allergies, interactions, and prescription risk analysis.
It also supports **wearable devices** for real-time vitals syncing (e.g., heart rate, BP, SpO2).

---

## 🚀 **Core Features**

### 👥 **Patient App**

* AI Symptom Logger (voice + text)
* Wearable Vitals Sync (Smartwatch → App)
* Medication Management + Refill
* AI Drug Interaction Checks (allergies, food, history, conflicts)
* Food Interaction Checker
* Appointment & Clinic Escalation
* In-app Medication Store (Buy/Compare/Refill)
* Prescription Renewal Requests
* Medication History Timeline + Safety Flags

### 🏥 **Clinician & Hospital Dashboard**

* Access to structured symptom logs (no chat reading)
* Real-time patient vitals monitoring
* Prescription writing + AI safety validation
* View + Create EMR files automatically
* Approve/deny refills and medication renewals
* Safety alerts for high-risk patients
* Multi-patient monitoring dashboard

---

## 🔗 **Tech Integrations**

| Integration          | Purpose                                               | API                                               |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| **Dorra EMR**        | Medical records creation, storage, sync               | Patient records, doctor logs, vitals history      |
| **PharmaVigilance**  | Safety warnings, interactions, ingredient risks       | Prescriptions, shopping cart checks, food checker |
| **Wearable Devices** | Vital tracking + alerts                               | Heart rate, BP, O2, sleep, stress                 |
| **AI Engine**        | Symptom interpretation, risk scoring, recommendations | Symptom logs, report summaries                    |

---

## 📱 **Product Structure**

```
./src
 ├── patient-app
 │    ├── symptom-logger/
 │    ├── vitals-dashboard/
 │    ├── medication-store/
 │    ├── food-checker/
 │    └── prescriptions/
 │
 ├── clinician-dashboard
 │    ├── patient-overview/
 │    ├── structured-logs/
 │    ├── prescriptions/
 │    └── vitals-monitoring/
 │
 ├── api-integrations
 │    ├── dorra-emr/
 │    └── pharmavigilance/
 │
 └── shared-components
      ├── alerts/
      ├── charts/
      ├── cards/
      └── modals/
```

---

## 🔐 **Security & Privacy**

* Zero raw chat storage for symptom intake.
* All logs are structured before saving.
* Patient data is encrypted at rest and in transmission.
* Clinician access requires hospital linking & ID verification.
* FDA/WHO interaction logic (via PharmaVigilance).

---

## 🧠 **AI Responsibilities**

| Task                        | Output                                         |
| --------------------------- | ---------------------------------------------- |
| Interpret Symptoms          | Medicalized structured log                     |
| Risk Analysis               | Severity score (mild/moderate/urgent)          |
| Drug Safety Checks          | Allergy / condition / ingredient / food alerts |
| Predict Flare-ups           | Based on vitals + history                      |
| Auto-Generate Documentation | EMR formatted summaries                        |

---

## 💊 **Medication Marketplace Rules**

* Suggests medication based on symptoms + history.
* Blocks unsafe purchases (drug conflicts or allergies).
* Shows ingredient breakdown + risk explanation.
* Supports clinic prescriptions + user refill purchases.

---

## 🛠 **Future Roadmap**

* Offline symptom logging
* Multi-country drug registry support
* Insurance integration
* Family profiles + child monitoring
* Hospital pharmacy auto-dispatch

---

## 🤝 **Contributors & Roles**

| Role         | Responsibilities                                                                            |
| ------------ | ------------------------------------------------------------------------------------------- |
| Frontend Dev | Patient app UI + Clinician dashboard implementation + alerts + cart blocking logic          |
| Backend Devs | API integrations (Dorra EMR & PharmaVigilance) + vitals processing + AI inference endpoints |
| Designer     | UX flows, medication risk states, vitals severity visuals                                   |
| PM/Product   | Requirement validation, compliance, roadmap                                                 |

---

## 📌 **Contribution Guidelines**

* Document new components before pushing.
* Avoid raw conditionals for health rules—use standard risk logic from APIs.
* Never store raw conversation text in database.

---

### 💙 **DoseWise — Safe medication. Smarter care. Anywhere.**

  # Dosewise Design & Frontend

  This is a code bundle for Dosewise Design & Frontend. The original project is available at https://www.figma.com/design/EHsHu2Q764naS2SbOQctGP/Dosewise-Design---Frontend.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
