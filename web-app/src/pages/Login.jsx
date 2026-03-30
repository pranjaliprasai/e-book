import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAPI } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import loginLogo from "../assets/loginlogo.png";
import appLogo from "../assets/Mobileapplogo.png";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await loginAPI(form.email, form.password);
            const { token, user } = res.data.data;

            if (user.role !== "admin") {
                setError("Access denied. This portal is for admins only.");
                setLoading(false);
                return;
            }

            login(token, user);
            navigate("/admin");
        } catch (err) {
            setError(err.response?.data?.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-left">
                <div className="auth-brand">
                    <div className="logo-container">
                        <img src={loginLogo} alt="SmartShelf Logo" className="login-logo" />
                    </div>
                    <h1>SmartShelf Admin</h1>
                    <p>Digital dashboard for platform management and administration.</p>
                </div>
            </div>
            <div className="auth-right">
                <div className="auth-card">
                    <h2>Admin Sign In 🛡️</h2>
                    {error && <div className="error-msg"><span>⚠️</span> {error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="field">
                            <label>Email</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} required />
                        </div>
                        <div className="field">
                            <label>Password</label>
                            <input type="password" name="password" value={form.password} onChange={handleChange} required />
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In →"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
