import type {
  Appointment,
  Doctor,
  Prescription,
  MedicalReport,
  Notification,
  PatientRecord,
  AdminUser,
} from "@/types/healthcare";

export const mockDoctors: Doctor[] = [
  { id: "d1", name: "Dr. Meera Iyer", specialization: "Cardiology", experience: "12 yrs", rating: 4.9, fee: "₹599", availability: "Today 5:30 PM" },
  { id: "d2", name: "Dr. Rohan Verma", specialization: "Dermatology", experience: "9 yrs", rating: 4.8, fee: "₹449", availability: "Tomorrow 10:00 AM" },
  { id: "d3", name: "Dr. Priya Shah", specialization: "General Physician", experience: "15 yrs", rating: 4.9, fee: "₹299", availability: "Today 7:00 PM" },
  { id: "d4", name: "Dr. Karan Sethi", specialization: "Neurology", experience: "11 yrs", rating: 4.8, fee: "₹699", availability: "Fri 11:00 AM" },
  { id: "d5", name: "Dr. Anjali Mehta", specialization: "Pediatrics", experience: "8 yrs", rating: 4.9, fee: "₹399", availability: "Sat 9:30 AM" },
  { id: "d6", name: "Dr. Leena Joshi", specialization: "Gynecology", experience: "10 yrs", rating: 4.9, fee: "₹549", availability: "Today 6:15 PM" },
];

export const mockAppointments: Appointment[] = [
  { id: "a1", patientId: "pat-001", doctorId: "d1", doctorName: "Dr. Meera Iyer", specialization: "Cardiology", date: "Today", time: "5:30 PM", mode: "video", status: "confirmed", fee: "₹599" },
  { id: "a2", patientId: "pat-001", doctorId: "d2", doctorName: "Dr. Rohan Verma", specialization: "Dermatology", date: "Fri, May 24", time: "11:00 AM", mode: "video", status: "pending", fee: "₹449" },
  { id: "a3", patientId: "pat-001", doctorId: "d3", doctorName: "Dr. Priya Shah", specialization: "General Physician", date: "Mon, May 27", time: "9:00 AM", mode: "video", status: "confirmed", fee: "₹299" },
  { id: "a4", patientId: "pat-002", patientName: "Sunita Devi", doctorId: "d1", doctorName: "Dr. Meera Iyer", specialization: "Cardiology", date: "Today", time: "2:00 PM", mode: "video", status: "in_progress", fee: "₹599" },
  { id: "a5", patientId: "pat-003", patientName: "Ravi Singh", doctorId: "d1", doctorName: "Dr. Meera Iyer", specialization: "Cardiology", date: "Today", time: "3:30 PM", mode: "video", status: "pending", fee: "₹599" },
];

export const mockPrescriptions: Prescription[] = [
  {
    id: "rx1",
    doctorId: "d1",
    doctorName: "Dr. Meera Iyer",
    specialization: "Cardiology",
    patientId: "pat-001",
    date: "Aug 14, 2025",
    medicines: [
      { name: "Amoxicillin 500mg", dosage: "1 tab", frequency: "3× daily", duration: "5 days" },
      { name: "Paracetamol 650mg", dosage: "1 tab", frequency: "as needed", duration: "3 days" },
    ],
    instructions: "Take after meals. Report any rash or breathing issues immediately.",
  },
  {
    id: "rx2",
    doctorId: "d3",
    doctorName: "Dr. Priya Shah",
    specialization: "General Physician",
    patientId: "pat-001",
    date: "Aug 02, 2025",
    medicines: [{ name: "Vitamin D3 60k IU", dosage: "1 sachet", frequency: "weekly", duration: "8 weeks" }],
    instructions: "Mix in warm water. Take in the morning.",
  },
];

export const mockReports: MedicalReport[] = [
  { id: "r1", name: "Lipid Profile", type: "PDF", uploadDate: "Aug 14, 2025", doctorName: "Dr. Meera Iyer", category: "Cardiology", patientId: "pat-001" },
  { id: "r2", name: "Chest X-Ray", type: "JPG", uploadDate: "Aug 10, 2025", doctorName: "Dr. Meera Iyer", category: "Radiology", patientId: "pat-001" },
  { id: "r3", name: "CBC Report", type: "PDF", uploadDate: "Jul 28, 2025", doctorName: "Dr. Priya Shah", category: "Pathology", patientId: "pat-001" },
  { id: "r4", name: "Skin Biopsy", type: "PDF", uploadDate: "Jul 12, 2025", doctorName: "Dr. Rohan Verma", category: "Dermatology", patientId: "pat-001" },
];

export const mockNotifications: Notification[] = [
  { id: "n1", type: "appointment", title: "Appointment reminder", message: "Video consult with Dr. Meera Iyer today at 5:30 PM", time: "2h ago", read: false },
  { id: "n2", type: "prescription", title: "New prescription", message: "Dr. Priya Shah updated your Vitamin D3 dosage", time: "1d ago", read: false },
  { id: "n3", type: "ai_alert", title: "AI health alert", message: "Your symptom scan suggests monitoring fever for 48h", time: "2d ago", read: true },
  { id: "n4", type: "message", title: "Doctor message", message: "Dr. Meera Iyer: Please upload your latest lipid profile", time: "3d ago", read: true },
  { id: "n5", type: "system", title: "System update", message: "New AI scanner features are now available", time: "1w ago", read: true },
];

export const mockPatients: PatientRecord[] = [
  { id: "pat-001", name: "Aarav Patil", age: 34, gender: "Male", phone: "+91 98765 43210", lastVisit: "Aug 14, 2025", condition: "Hypertension follow-up", riskLevel: "low" },
  { id: "pat-002", name: "Sunita Devi", age: 45, gender: "Female", phone: "+91 91234 56789", lastVisit: "Today", condition: "Chest discomfort", riskLevel: "high" },
  { id: "pat-003", name: "Ravi Singh", age: 28, gender: "Male", phone: "+91 99887 76655", lastVisit: "May 20, 2025", condition: "Migraine", riskLevel: "medium" },
  { id: "pat-004", name: "Kavita Sharma", age: 52, gender: "Female", phone: "+91 97654 32109", lastVisit: "May 18, 2025", condition: "Diabetes Type 2", riskLevel: "medium" },
];

export const mockAdminUsers: AdminUser[] = [
  { id: "u1", name: "Aarav Patil", email: "patient@telemed.demo", role: "patient", status: "active", verified: true, joined: "Jan 2025" },
  { id: "u2", name: "Dr. Meera Iyer", email: "doctor@telemed.demo", role: "doctor", status: "active", verified: true, joined: "Dec 2024" },
  { id: "u3", name: "Rajesh Kumar", email: "admin@telemed.demo", role: "admin", status: "active", verified: true, joined: "Nov 2024" },
  { id: "u4", name: "Sunita Devi", email: "sunita@example.com", role: "patient", status: "active", verified: true, joined: "Feb 2025" },
  { id: "u5", name: "Dr. Rohan Verma", email: "rohan@clinic.com", role: "doctor", status: "pending", verified: false, joined: "May 2025" },
];

export const healthTips = [
  "Drink at least 8 glasses of water today.",
  "Take a 10-minute walk after meals for better digestion.",
  "Monitor your blood pressure weekly if you have hypertension.",
];

export const doctorStats = {
  totalPatients: 248,
  todayAppointments: 8,
  pendingConsultations: 3,
  completedToday: 5,
  revenue: "₹42,500",
  aiAlerts: 2,
};

export const adminStats = {
  totalUsers: 12480,
  activeDoctors: 342,
  totalPatients: 11890,
  appointmentsToday: 156,
  aiScansToday: 89,
  revenue: "₹8.4L",
  systemHealth: 99.2,
};
