import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { axiosInstance } from "../App";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Activity, Key, FileText, Calendar, Droplet, Phone, Mail, Heart, AlertCircle } from "lucide-react";

const DoctorAccess = () => {
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const navigate = useNavigate();

  const verifyAccess = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post("/doctor/verify-access", {
        access_code: accessCode,
      });

      setPatientData(response.data.patient);
      toast.success("Access granted successfully!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid or expired access code");
    } finally {
      setLoading(false);
    }
  };

  const resetView = () => {
    setPatientData(null);
    setAccessCode("");
  };

  if (patientData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">CarePass - Doctor View</h1>
            </div>
            <Button variant="outline" onClick={resetView} data-testid="back-button">
              Exit Patient View
            </Button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" data-testid="patient-name">
              Patient: {patientData.full_name}
            </h2>
            <p className="text-gray-600">Temporary access granted - View only</p>
          </div>

          {/* Patient Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Blood Group</CardTitle>
                <Droplet className="w-5 h-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900" data-testid="patient-blood-group">{patientData.blood_group}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Age</CardTitle>
                <Calendar className="w-5 h-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900" data-testid="patient-age">
                  {new Date().getFullYear() - new Date(patientData.date_of_birth).getFullYear()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Medical Records</CardTitle>
                <FileText className="w-5 h-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{patientData.medical_records?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Medications</CardTitle>
                <Heart className="w-5 h-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{patientData.medications?.length || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Patient Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label className="text-gray-600 text-sm">Email</Label>
                    <p className="text-gray-900" data-testid="patient-email">{patientData.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label className="text-gray-600 text-sm">Phone</Label>
                    <p className="text-gray-900" data-testid="patient-phone">{patientData.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label className="text-gray-600 text-sm">Date of Birth</Label>
                    <p className="text-gray-900" data-testid="patient-dob">{patientData.date_of_birth}</p>
                  </div>
                </div>
                {patientData.emergency_contact && (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <div>
                      <Label className="text-gray-600 text-sm">Emergency Contact</Label>
                      <p className="text-gray-900" data-testid="patient-emergency-contact">{patientData.emergency_contact}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-600 text-sm">Allergies</Label>
                  {patientData.allergies?.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {patientData.allergies.map((allergy, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm" data-testid={`allergy-${index}`}>
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm mt-1">No known allergies</p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-600 text-sm">Current Medications</Label>
                  {patientData.medications?.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {patientData.medications.map((medication, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm" data-testid={`medication-${index}`}>
                          {medication}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm mt-1">No current medications</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medical Records */}
          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
              <CardDescription>Complete medical records and treatment history</CardDescription>
            </CardHeader>
            <CardContent>
              {patientData.medical_records?.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No medical records available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patientData.medical_records?.map((record, index) => (
                    <div key={index} className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200" data-testid={`doctor-view-record-${index}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">{record.condition}</h4>
                          <p className="text-gray-600 text-sm">{new Date(record.diagnosis_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-600 text-sm">Doctor</Label>
                          <p className="text-gray-900">{record.doctor_name}</p>
                        </div>
                        <div>
                          <Label className="text-gray-600 text-sm">Hospital</Label>
                          <p className="text-gray-900">{record.hospital}</p>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-gray-600 text-sm">Treatment</Label>
                          <p className="text-gray-900">{record.treatment}</p>
                        </div>
                        {record.notes && (
                          <div className="md:col-span-2">
                            <Label className="text-gray-600 text-sm">Notes</Label>
                            <p className="text-gray-700 text-sm">{record.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 text-white max-w-lg">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-8">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-5xl font-bold mb-6">Doctor Access Portal</h2>
          <p className="text-xl text-cyan-100 leading-relaxed mb-8">
            Access patient records securely using the access code or QR code provided by your patient.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🔐</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Temporary Access</h3>
                <p className="text-cyan-100 text-sm">All access codes expire after 24 hours</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Complete Records</h3>
                <p className="text-cyan-100 text-sm">View full medical history and current medications</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-3xl p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                  <Key className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="doctor-access-title">Enter Access Code</h1>
              <p className="text-gray-600">Use the code provided by your patient</p>
            </div>

            <form onSubmit={verifyAccess} className="space-y-6" data-testid="access-form">
              <div className="space-y-2">
                <Label htmlFor="accessCode">Access Code</Label>
                <Input
                  id="accessCode"
                  placeholder="Enter 8-character code"
                  className="h-14 text-center text-2xl font-bold tracking-widest uppercase"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  required
                  data-testid="access-code-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                disabled={loading}
                data-testid="verify-access-button"
              >
                {loading ? "Verifying..." : "Access Patient Records"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-teal-600 hover:text-teal-700 font-semibold" data-testid="patient-login-link">
                ← Back to Patient Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAccess;