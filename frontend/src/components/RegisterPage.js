import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { axiosInstance } from "../App";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Activity, User, Mail, Lock, Phone, Calendar, Droplet } from "lucide-react";

const RegisterPage = ({ setAuth }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    date_of_birth: "",
    blood_group: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post("/auth/register", formData);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("patient", JSON.stringify(response.data.patient));
      setAuth(true);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 text-white max-w-md">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-8">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-5xl font-bold mb-6">Join CarePass</h2>
          <p className="text-xl text-cyan-100 leading-relaxed">
            Take control of your healthcare journey. Store, manage, and share your medical records securely.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="w-full max-w-2xl">
          <div className="glass-card rounded-3xl p-8 md:p-12">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="register-title">Create Your Account</h1>
              <p className="text-gray-600">Enter your details to get started</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6" data-testid="register-form">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="full_name"
                      name="full_name"
                      placeholder="John Doe"
                      className="pl-10 h-12"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                      data-testid="full-name-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-12"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      data-testid="email-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-12"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      data-testid="password-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      className="pl-10 h-12"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      data-testid="phone-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      className="pl-10 h-12"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      required
                      data-testid="dob-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, blood_group: value })} required>
                    <SelectTrigger className="h-12" data-testid="blood-group-select">
                      <div className="flex items-center gap-2">
                        <Droplet className="h-5 w-5 text-gray-400" />
                        <SelectValue placeholder="Select blood group" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-lg"
                disabled={loading}
                data-testid="register-submit-button"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-teal-600 hover:text-teal-700 font-semibold" data-testid="login-link">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;