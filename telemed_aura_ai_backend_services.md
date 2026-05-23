
# TeleMed Aura — Complete Backend AI Services Code

## Adjusted According to Existing Repository

This structure integrates with:
- Existing Next.js API routes
- Existing Genie AI system
- Existing doctor escalation system
- Existing health advisor system
- Existing document upload system

---

# FINAL AI BACKEND STRUCTURE

```bash
backend/
│
├── ai/
│   ├── symptomScanner/
│   ├── prescriptionOCR/
│   ├── scanAnalyzer/
│   ├── riskAnalyzer/
│   ├── healthSummary/
│   ├── emergencyPrediction/
│   ├── doctorRecommendation/
│   ├── medicineRecommendation/
│   └── analytics/
```

# 1. AI CLIENT

## backend/services/aiClient.js

```js
const axios = require("axios");

const aiClient = axios.create({
  baseURL: process.env.AI_SERVICE_URL,
  timeout: 30000,
});

aiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("AI Service Error:", error.message);
    return Promise.reject(error);
  }
);

module.exports = aiClient;
```

# 2. SYMPTOM SCANNER

## backend/ai/symptomScanner/symptomScanner.service.js

```js
const aiClient = require("../../services/aiClient");

exports.analyzeSymptoms = async (data) => {
  const response = await aiClient.post(
    "/symptom-analysis",
    {
      symptoms: data.symptoms,
      age: data.age,
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      medicalHistory: data.medicalHistory,
    }
  );

  return response.data;
};
```

## backend/ai/symptomScanner/symptomScanner.controller.js

```js
const service = require("./symptomScanner.service");

exports.scanSymptoms = async (req, res) => {
  try {
    const result = await service.analyzeSymptoms(
      req.body
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "AI analysis failed",
    });
  }
};
```

## backend/ai/symptomScanner/symptomScanner.routes.js

```js
const express = require("express");

const router = express.Router();

const controller = require(
  "./symptomScanner.controller"
);

router.post("/scan", controller.scanSymptoms);

module.exports = router;
```

# 3. PRESCRIPTION OCR

## backend/ai/prescriptionOCR/ocr.service.js

```js
const Tesseract = require("tesseract.js");

exports.extractPrescription = async (
  filePath
) => {
  const result = await Tesseract.recognize(
    filePath,
    "eng"
  );

  return {
    text: result.data.text,
    confidence: result.data.confidence,
  };
};
```

## backend/ai/prescriptionOCR/ocr.controller.js

```js
const service = require("./ocr.service");

exports.scanPrescription = async (
  req,
  res
) => {
  try {
    const result =
      await service.extractPrescription(
        req.file.path
      );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "OCR failed",
    });
  }
};
```

# 4. SCAN ANALYZER

## backend/ai/scanAnalyzer/scanAnalyzer.service.js

```js
const aiClient = require("../../services/aiClient");

exports.analyzeScan = async (filePath) => {
  const response = await aiClient.post(
    "/scan-analysis",
    {
      image: filePath,
    }
  );

  return response.data;
};
```

## backend/ai/scanAnalyzer/scanAnalyzer.controller.js

```js
const service = require(
  "./scanAnalyzer.service"
);

exports.analyzeMedicalScan = async (
  req,
  res
) => {
  try {
    const result =
      await service.analyzeScan(
        req.file.path
      );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Scan analysis failed",
    });
  }
};
```

# 5. RISK ANALYZER

## backend/ai/riskAnalyzer/riskAnalyzer.service.js

```js
exports.calculateRisk = async (data) => {
  const {
    bloodPressure,
    sugarLevel,
    oxygenLevel,
    symptoms,
  } = data;

  let risk = "LOW";
  let score = 85;

  if (
    bloodPressure > 140 ||
    sugarLevel > 180
  ) {
    risk = "HIGH";
    score = 45;
  }

  if (oxygenLevel < 92) {
    risk = "CRITICAL";
    score = 20;
  }

  return {
    risk,
    healthScore: score,
    recommendation:
      risk === "CRITICAL"
        ? "Emergency consultation required"
        : "Stable condition",
  };
};
```

# 6. HEALTH SUMMARY SERVICE

## backend/ai/healthSummary/healthSummary.service.js

```js
const Appointment = require("../../models/Appointment");
const Prescription = require("../../models/Prescription");
const MedicalReport = require("../../models/MedicalReport");

exports.generateSummary = async (
  patientId
) => {
  const appointments =
    await Appointment.find({
      patient: patientId,
    });

  const prescriptions =
    await Prescription.find({
      patient: patientId,
    });

  const reports =
    await MedicalReport.find({
      patient: patientId,
    });

  return {
    appointments: appointments.length,
    prescriptions:
      prescriptions.length,
    reports: reports.length,
    healthStatus: "Stable",
    recommendation:
      "Continue monitoring regularly",
  };
};
```

# 7. EMERGENCY PREDICTION

## backend/ai/emergencyPrediction/emergency.service.js

```js
exports.detectEmergency = async (
  symptoms
) => {
  const severeSymptoms = [
    "chest pain",
    "breathing problem",
    "unconscious",
    "heart attack",
  ];

  const found =
    symptoms.some((s) =>
      severeSymptoms.includes(
        s.toLowerCase()
      )
    );

  return {
    emergency: found,
    priority:
      found ? "HIGH" : "NORMAL",
  };
};
```

# 8. DOCTOR RECOMMENDATION

## backend/ai/doctorRecommendation/doctorRecommendation.service.js

```js
const Doctor = require("../../models/Doctor");

exports.recommendDoctors = async (
  specialization
) => {
  const doctors =
    await Doctor.find({
      specialization,
      isVerified: true,
    }).limit(5);

  return doctors;
};
```

# 9. MEDICINE RECOMMENDATION

## backend/ai/medicineRecommendation/medicineRecommendation.service.js

```js
exports.getMedicineSuggestions =
  async (disease) => {
    const medicines = {
      fever: [
        "Paracetamol",
        "Crocin",
      ],

      headache: [
        "Ibuprofen",
        "Dolo 650",
      ],
    };

    return medicines[disease] || [];
  };
```

# 10. ANALYTICS SERVICE

## backend/ai/analytics/analytics.service.js

```js
const Appointment = require("../../models/Appointment");

exports.getAnalytics = async () => {
  const totalAppointments =
    await Appointment.countDocuments();

  const completed =
    await Appointment.countDocuments({
      status: "completed",
    });

  return {
    totalAppointments,
    completed,
    completionRate:
      (completed / totalAppointments) *
      100,
  };
};
```

# 11. MULTER UPLOAD

## backend/middleware/upload.middleware.js

```js
const multer = require("multer");

const storage = multer.diskStorage({
  destination: "uploads/",

  filename: (
    req,
    file,
    cb
  ) => {
    cb(
      null,
      Date.now() +
        "-" +
        file.originalname
    );
  },
});

module.exports = multer({
  storage,
});
```

# 12. AI ROUTER

## backend/routes/ai.routes.js

```js
const express = require("express");

const router = express.Router();

router.use(
  "/symptom-scanner",
  require(
    "../ai/symptomScanner/symptomScanner.routes"
  )
);

router.use(
  "/prescription-ocr",
  require(
    "../ai/prescriptionOCR/ocr.routes"
  )
);

module.exports = router;
```

# 13. PATIENT FEATURES

PATIENT CAN:
- Upload reports
- Upload prescriptions
- Book appointments
- View AI reports
- View health graphs
- AI symptom scanning
- View medicine reminders
- Video consultations
- View medical history

# 14. DOCTOR FEATURES

DOCTOR CAN:
- View patient reports
- View AI scan analysis
- Create prescriptions
- Access patient history
- View analytics dashboard
- Emergency alerts
- Appointment management
- Consultation management

# 15. REQUIRED MODELS

```bash
models/
├── User.js
├── Doctor.js
├── Appointment.js
├── Prescription.js
├── MedicalReport.js
├── AIAnalysis.js
└── EmergencyAlert.js
```

# 16. REQUIRED PACKAGES

```bash
npm install express mongoose multer cors dotenv axios tesseract.js
```

# 17. ENV VARIABLES

```env
PORT=5000

MONGO_URI=

JWT_SECRET=

AI_SERVICE_URL=http://localhost:8000
```

# 18. DEPLOYMENT

Frontend:
- Vercel

Backend:
- Render

AI Services:
- Separate Render service

Database:
- MongoDB Atlas

# 19. BEST FLOW

PATIENT
→ uploads report
→ AI analyzes report
→ doctor receives AI summary
→ doctor prescribes medicine
→ patient receives digital prescription
→ analytics updated

