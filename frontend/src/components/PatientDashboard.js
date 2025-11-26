import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../App";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Activity, FileText, Share2, LogOut, Plus, QrCode, Key, User, Phone, Heart, Calendar, Droplet, TrendingUp, Clock, Shield } from "lucide-react";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, subDays, isAfter } from 'date-fns';
import { motion } from 'framer-motion';

const PatientDashboard = ({ setAuth }) => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessCode, setAccessCode] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [recordDialog, setRecordDialog] = useState(false);
  const navigate = useNavigate();

  const [newRecord, setNewRecord] = useState({
    condition: "",
    diagnosis_date: "",
    treatment: "",
    doctor_name: "",
    hospital: "",
    notes: "",
  });

  const [profileUpdate, setProfileUpdate] = useState({
    allergies: [],
    medications: [],
    emergency_contact: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axiosInstance.get("/patient/profile");
      setPatient(response.data);
      setProfileUpdate({
        allergies: response.data.allergies || [],
        medications: response.data.medications || [],
        emergency_contact: response.data.emergency_contact || "",
      });
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("patient");
    setAuth(false);
    navigate("/login");
  };

  const generateAccessCode = async (method) => {
    try {
      const response = await axiosInstance.post("/patient/generate-access", { method });
      if (method === "qr") {
        setQrCode(response.data.qr_code);
        setAccessCode(response.data.code);
      } else {
        setAccessCode(response.data.code);
      }
      setShowAccessDialog(true);
      toast.success(`${method === "qr" ? "QR Code" : "OTP"} generated successfully!`);
    } catch (error) {
      toast.error("Failed to generate access code");
    }
  };

  const addMedicalRecord = async () => {
    try {
      await axiosInstance.post("/patient/medical-record", newRecord);
      toast.success("Medical record added successfully!");
      setRecordDialog(false);
      setNewRecord({
        condition: "",
        diagnosis_date: "",
        treatment: "",
        doctor_name: "",
        hospital: "",
        notes: "",
      });
      fetchProfile();
    } catch (error) {
      toast.error("Failed to add medical record");
    }
  };

  const updateProfile = async () => {
    try {
      await axiosInstance.put("/patient/profile", profileUpdate);
      toast.success("Profile updated successfully!");
      fetchProfile();
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  // Calculate health metrics
  const calculateHealthScore = () => {
    let score = 75;
    if (patient?.allergies?.length > 0) score -= 5;
    if (patient?.medications?.length > 2) score -= 10;
    if (patient?.medical_records?.length > 5) score -= 5;
    return Math.max(score, 50);
  };

  // Get recent activity data
  const getRecentActivityData = () => {
    if (!patient?.medical_records) return [];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'MM/dd'),
        records: 0
      };
    });

    patient.medical_records.forEach(record => {
      const recordDate = new Date(record.diagnosis_date);
      last7Days.forEach(day => {
        if (format(recordDate, 'MM/dd') === day.date) {
          day.records += 1;
        }
      });
    });

    return last7Days;
  };

  // Get condition distribution
  const getConditionDistribution = () => {
    if (!patient?.medical_records) return [];
    const conditionMap = {};
    patient.medical_records.forEach(record => {
      conditionMap[record.condition] = (conditionMap[record.condition] || 0) + 1;
    });
    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    return Object.keys(conditionMap).map((condition, index) => ({
      name: condition,
      value: conditionMap[condition],
      color: COLORS[index % COLORS.length]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const healthScore = calculateHealthScore();
  const activityData = getRecentActivityData();
  const conditionData = getConditionDistribution();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Activity className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CarePass</h1>
              <p className="text-xs text-gray-500">Health Dashboard</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section with Health Score */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" data-testid="welcome-message">
                Welcome back, {patient?.full_name}
              </h2>
              <p className="text-gray-600">Here's your health overview for today</p>
            </div>
            <motion.div 
              className="w-32 h-32"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <CircularProgressbar
                value={healthScore}
                text={`${healthScore}%`}
                styles={buildStyles({
                  textSize: '20px',
                  pathColor: healthScore > 70 ? '#10b981' : healthScore > 50 ? '#f59e0b' : '#ef4444',
                  textColor: '#1f2937',
                  trailColor: '#e5e7eb',
                  pathTransitionDuration: 1.5,
                })}
              />
              <p className="text-center text-sm text-gray-600 mt-2 font-medium">Health Score</p>
            </motion.div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 gap-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-sm">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white" data-testid="overview-tab">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="records" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white" data-testid="records-tab">
              <FileText className="w-4 h-4" />
              Records
            </TabsTrigger>
            <TabsTrigger value="share" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white" data-testid="share-tab">
              <Share2 className="w-4 h-4" />
              Share
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="record-card border-l-4 border-l-red-500 hover:shadow-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Blood Group</CardTitle>
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Droplet className="w-5 h-5 text-red-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-gray-900">{patient?.blood_group}</div>
                    <p className="text-xs text-gray-500 mt-1">Blood Type</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="record-card border-l-4 border-l-blue-500 hover:shadow-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Age</CardTitle>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-gray-900">
                      {new Date().getFullYear() - new Date(patient?.date_of_birth).getFullYear()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Years Old</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="record-card border-l-4 border-l-green-500 hover:shadow-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Medical Records</CardTitle>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-gray-900">{patient?.medical_records?.length || 0}</div>
                    <p className="text-xs text-gray-500 mt-1">Total Records</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="record-card border-l-4 border-l-purple-500 hover:shadow-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Medications</CardTitle>
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-gray-900">{patient?.medications?.length || 0}</div>
                    <p className="text-xs text-gray-500 mt-1">Active Meds</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Activity Timeline */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Activity Timeline
                    </CardTitle>
                    <CardDescription>Medical records added in the last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={activityData}>
                        <defs>
                          <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }} 
                        />
                        <Area type="monotone" dataKey="records" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRecords)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Condition Distribution */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-600" />
                      Condition Overview
                    </CardTitle>
                    <CardDescription>Distribution of medical conditions</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    {conditionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={conditionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {conditionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }} 
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-gray-500 py-12">
                        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>No conditions recorded yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Patient Info */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>Manage your health profile and emergency contacts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-600 text-sm font-medium">Email Address</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{patient?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600 text-sm font-medium">Phone Number</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{patient?.phone}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600 text-sm font-medium">Date of Birth</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{patient?.date_of_birth}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency" className="text-gray-600 text-sm font-medium">Emergency Contact</Label>
                    <Input
                      id="emergency"
                      placeholder="+1 234 567 8900"
                      value={profileUpdate.emergency_contact}
                      onChange={(e) => setProfileUpdate({ ...profileUpdate, emergency_contact: e.target.value })}
                      className="h-12"
                      data-testid="emergency-contact-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies" className="text-gray-600 text-sm font-medium">Allergies</Label>
                  <Input
                    id="allergies"
                    placeholder="Peanuts, Penicillin, Latex (comma-separated)"
                    value={profileUpdate.allergies.join(", ")}
                    onChange={(e) => setProfileUpdate({ ...profileUpdate, allergies: e.target.value.split(",").map(a => a.trim()).filter(a => a) })}
                    className="h-12"
                    data-testid="allergies-input"
                  />
                  {profileUpdate.allergies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profileUpdate.allergies.map((allergy, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medications" className="text-gray-600 text-sm font-medium">Current Medications</Label>
                  <Input
                    id="medications"
                    placeholder="Aspirin, Metformin, Lisinopril (comma-separated)"
                    value={profileUpdate.medications.join(", ")}
                    onChange={(e) => setProfileUpdate({ ...profileUpdate, medications: e.target.value.split(",").map(m => m.trim()).filter(m => m) })}
                    className="h-12"
                    data-testid="medications-input"
                  />
                  {profileUpdate.medications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profileUpdate.medications.map((medication, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {medication}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={updateProfile} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12" data-testid="update-profile-button">
                  <Shield className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Records Tab */}
          <TabsContent value="records" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Medical Records</h3>
                <p className="text-gray-600">Your complete medical history timeline</p>
              </div>
              <Dialog open={recordDialog} onOpenChange={setRecordDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all" data-testid="add-record-button">
                    <Plus className="w-4 h-4" />
                    Add Record
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Add Medical Record</DialogTitle>
                    <DialogDescription>Enter the details of your medical visit or diagnosis</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="condition">Condition / Diagnosis</Label>
                        <Input
                          id="condition"
                          placeholder="e.g., Hypertension"
                          value={newRecord.condition}
                          onChange={(e) => setNewRecord({ ...newRecord, condition: e.target.value })}
                          className="h-12"
                          data-testid="condition-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="diagnosisDate">Diagnosis Date</Label>
                        <Input
                          id="diagnosisDate"
                          type="date"
                          value={newRecord.diagnosis_date}
                          onChange={(e) => setNewRecord({ ...newRecord, diagnosis_date: e.target.value })}
                          className="h-12"
                          data-testid="diagnosis-date-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="doctorName">Doctor Name</Label>
                        <Input
                          id="doctorName"
                          placeholder="Dr. John Smith"
                          value={newRecord.doctor_name}
                          onChange={(e) => setNewRecord({ ...newRecord, doctor_name: e.target.value })}
                          className="h-12"
                          data-testid="doctor-name-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hospital">Hospital / Clinic</Label>
                        <Input
                          id="hospital"
                          placeholder="City General Hospital"
                          value={newRecord.hospital}
                          onChange={(e) => setNewRecord({ ...newRecord, hospital: e.target.value })}
                          className="h-12"
                          data-testid="hospital-input"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="treatment">Treatment</Label>
                      <Input
                        id="treatment"
                        placeholder="e.g., Medication prescribed, Surgery performed"
                        value={newRecord.treatment}
                        onChange={(e) => setNewRecord({ ...newRecord, treatment: e.target.value })}
                        className="h-12"
                        data-testid="treatment-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional information about the diagnosis or treatment..."
                        value={newRecord.notes}
                        onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                        rows={4}
                        data-testid="notes-input"
                      />
                    </div>
                    <Button onClick={addMedicalRecord} className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" data-testid="save-record-button">
                      <FileText className="w-4 h-4 mr-2" />
                      Save Medical Record
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {patient?.medical_records?.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="py-16 text-center">
                  <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Medical Records Yet</h3>
                  <p className="text-gray-600 mb-4">Start building your health timeline by adding your first medical record</p>
                  <Button onClick={() => setRecordDialog(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Record
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {patient?.medical_records?.sort((a, b) => new Date(b.diagnosis_date) - new Date(a.diagnosis_date)).map((record, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="record-card border-l-4 border-l-indigo-500 hover:shadow-2xl" data-testid={`medical-record-${index}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-2xl text-gray-900">{record.condition}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(record.diagnosis_date), 'MMMM dd, yyyy')}
                            </CardDescription>
                          </div>
                          <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                            {format(new Date(record.diagnosis_date), 'MMM yyyy')}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <Label className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Doctor</Label>
                            <p className="text-gray-900 font-medium mt-1">{record.doctor_name}</p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                            <Label className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Hospital</Label>
                            <p className="text-gray-900 font-medium mt-1">{record.hospital}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                          <Label className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2 block">Treatment</Label>
                          <p className="text-gray-900">{record.treatment}</p>
                        </div>
                        {record.notes && (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <Label className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2 block">Notes</Label>
                            <p className="text-gray-700 text-sm leading-relaxed">{record.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Share Access Tab */}
          <TabsContent value="share" className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Share Your Records</h3>
              <p className="text-gray-600">Grant temporary access to healthcare providers securely</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="record-card cursor-pointer hover:shadow-2xl h-full bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200" onClick={() => generateAccessCode("qr")}>
                  <CardHeader>
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                      <QrCode className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">QR Code Access</CardTitle>
                    <CardDescription className="text-base">Generate a QR code for instant scanning by healthcare providers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg" data-testid="generate-qr-button">
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate QR Code
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="record-card cursor-pointer hover:shadow-2xl h-full bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200" onClick={() => generateAccessCode("otp")}>
                  <CardHeader>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                      <Key className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">OTP Access</CardTitle>
                    <CardDescription className="text-base">Generate a secure one-time password for remote access</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg" data-testid="generate-otp-button">
                      <Key className="w-4 h-4 mr-2" />
                      Generate OTP Code
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Security Notice */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Security Notice</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      All access codes expire after 24 hours and are single-use only. Once a healthcare provider accesses your records using a code, 
                      it becomes invalid. You can generate new codes anytime to share with different providers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Access Code Generated</DialogTitle>
                  <DialogDescription className="text-base">
                    Share this code with your healthcare provider. Valid for 24 hours.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {qrCode && (
                    <motion.div 
                      className="flex justify-center p-6 bg-white rounded-xl border-2 border-gray-200"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    >
                      <img src={qrCode} alt="QR Code" className="w-64 h-64" data-testid="qr-code-image" />
                    </motion.div>
                  )}
                  {accessCode && (
                    <div className="text-center space-y-4">
                      <div>
                        <Label className="text-gray-600 text-sm font-medium">Access Code</Label>
                        <p className="text-5xl font-bold text-gray-900 tracking-wider my-4 font-mono" data-testid="access-code-display">{accessCode}</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(accessCode);
                          toast.success("Code copied to clipboard!");
                        }}
                        className="w-full h-12 border-2"
                        data-testid="copy-code-button"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Copy Code to Clipboard
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PatientDashboard;