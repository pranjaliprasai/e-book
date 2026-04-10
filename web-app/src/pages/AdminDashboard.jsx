import { useState, useEffect, useRef } from "react";
import appLogo from "../assets/Mobileapplogo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUsersAPI, deleteUserAPI, updateUserAPI, createUserAPI, updateMyProfileAPI } from "../api/user";
import { getBooksAPI, addBookAPI, updateBookAPI, deleteBookAPI } from "../api/book";
import { getSystemSettingsAPI, updateSystemSettingsAPI } from "../api/system";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    TrendingUp,
    Settings,
    LogOut,
    Sun,
    Moon,
    Trees,
    User,
    Trash2,
    Lock,
    Search,
    Plus,
    Library,
    ChevronRight,
    X,
    UserPlus,
    Pencil,
    Download,
    Filter,
    UserCircle,
    Globe,
    Key,
    FileText,
    Database,
    Save,
    Shield,
    Activity,
    RefreshCw,
    Eye,
    EyeOff
} from "lucide-react";

const AdminDashboard = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();

    // State for Users
    const [users, setUsers] = useState([]);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "user"
    });
    const [userRoleFilter, setUserRoleFilter] = useState("all");
    const [activeUsersCount, setActiveUsersCount] = useState(0);

    // State for Books
    const [books, setBooks] = useState([]);
    const [totalBooks, setTotalBooks] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 15;

    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [bookForm, setBookForm] = useState({
        title: "",
        author: "",
        genre: "",
        description: "",
        isbn: "",
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

    // Search States
    const [userSearch, setUserSearch] = useState("");
    const [bookSearch, setBookSearch] = useState("");

    // Settings State
    const [settings, setSettings] = useState({
        systemAlerts: true,
        curatorDigest: false,
        userActivity: true,
        metadataEngine: "Standard Semantic",
        languageProcessing: "English (Global)",
        backupFrequency: "Every 6 Hours",
        publicPortalAccess: true
    });

    const [profileForm, setProfileForm] = useState({
        name: user?.name || "",
        email: user?.email || "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);

    const [profileFile, setProfileFile] = useState(null);
    const [profilePreview, setProfilePreview] = useState(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const profileInputRef = useRef(null);
    const [isDiagnosing, setIsDiagnosing] = useState(false);
    const [lastScanned, setLastScanned] = useState(null);

    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || "",
                email: user.email || "",
                password: ""
            });
        }
    }, [user]);

    const fetchSettings = async () => {
        try {
            const res = await getSystemSettingsAPI();
            if (res.data.success) {
                setSettings(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, booksRes] = await Promise.all([
                getUsersAPI({ search: userSearch }),
                getBooksAPI({ 
                    search: bookSearch, 
                    page: currentPage, 
                    limit: itemsPerPage 
                }),
                fetchSettings()
            ]);
            setUsers(usersRes.data.data);
            setTotalUsers(usersRes.data.data.length);
            setActiveUsersCount(usersRes.data.data.filter(u => u.status === 'active' || u.role === 'admin').length); // Semi-dynamic calculation
            setBooks(booksRes.data.data);
            setTotalBooks(booksRes.data.pagination?.total || booksRes.data.data.length);
            setTotalPages(booksRes.data.pagination?.totalPages || 1);
        } catch (err) {
            setError("Failed to load dashboard data. Please check your connection.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500); // Debounce for 500ms
        return () => clearTimeout(timer);
    }, [userSearch, bookSearch, currentPage]);

    // Reset to page 1 when searching
    useEffect(() => {
        setCurrentPage(1);
    }, [bookSearch]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleThemeChange = (newTheme) => {
        // Remove all possible theme classes
        document.body.classList.remove("light-theme", "dark-theme", "forest-theme", "smartshelf-theme");
        // Add the new theme class
        document.body.classList.add(`${newTheme}-theme`);
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "smartshelf";
        handleThemeChange(savedTheme);
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await updateUserAPI(userId, { role: newRole });
            setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            alert("Failed to update user role.");
        }
    };

    const handleStatusToggle = async (userId, currentStatus) => {
        const newStatus = currentStatus === "active" ? "inactive" : "active";
        try {
            await updateUserAPI(userId, { status: newStatus });
            setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
        } catch (err) {
            alert("Failed to update user status.");
        }
    };

    const handleSaveSettings = async () => {
        try {
            setLoading(true);

            const profileFormData = new FormData();
            profileFormData.append("name", profileForm.name);
            profileFormData.append("email", profileForm.email);
            if (profileForm.password) {
                profileFormData.append("password", profileForm.password);
            }
            if (profileFile) {
                profileFormData.append("profilePicture", profileFile);
            }

            const [profileRes] = await Promise.all([
                updateMyProfileAPI(profileFormData),
                updateSystemSettingsAPI(settings)
            ]);

            // Update AuthContext + localStorage in-place — no page reload needed
            const updated = profileRes?.data?.data || profileRes?.data?.user;
            if (updated) {
                updateUser({
                    name: updated.name,
                    email: updated.email,
                    picture: updated.picture || updated.profilePicture
                });
            }

            // Reset file picker state
            setProfileFile(null);
            setProfilePreview(null);

            alert("Profile updated successfully!");
        } catch (err) {
            console.error("Save Error:", err);
            alert("Failed to save settings. Please ensure you have administrative permissions.");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert("New passwords do not match!");
            return;
        }
        try {
            setLoading(true);
            await updateMyProfileAPI({ password: passwordForm.newPassword });
            alert("Password changed successfully!");
            setIsPasswordModalOpen(false);
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            alert(err.response?.data?.message || "Failed to change password.");
        } finally {
            setLoading(false);
        }
    };

    const handleProfileFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerProfileInput = () => {
        profileInputRef.current?.click();
    };

    const handleRunDiagnostics = async () => {
        try {
            setIsDiagnosing(true);
            // Re-fetch all data to ensure stats are 100% accurate
            await fetchData();
            // Simulate a deeper "system scan"
            await new Promise(resolve => setTimeout(resolve, 2000));
            setLastScanned(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch (err) {
            console.error("Diagnostics Error:", err);
            alert("Diagnostics failed. System unreachable.");
        } finally {
            setIsDiagnosing(false);
        }
    };
    const handleUserFormChange = (e) => {
        setUserForm({ ...userForm, [e.target.name]: e.target.value });
    };

    const handleEditUser = (u) => {
        setEditingUser(u);
        setUserForm({
            name: u.name,
            email: u.email,
            password: "", // Leave blank for no change
            role: u.role
        });
        setIsUserModalOpen(true);
    };

    const handleUserSubmitAction = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (editingUser) {
                const res = await updateUserAPI(editingUser._id, userForm);
                if (res.data.success) {
                    alert("User updated successfully!");
                }
            } else {
                await createUserAPI(userForm);
                alert("User invited successfully!");
            }
            setIsUserModalOpen(false);
            setEditingUser(null);
            setUserForm({ name: "", email: "", password: "", role: "user" });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || err.message || "Operation failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await deleteUserAPI(userId);
            setUsers(users.filter((u) => u._id !== userId));
        } catch (err) {
            alert("Failed to delete user.");
        }
    };

    const exportUsersToCSV = () => {
        const headers = ["Name", "Email", "Role", "Status", "JoinedDate"];
        const rows = users.map(u => [
            u.name,
            u.email,
            u.role.toUpperCase(),
            u.status || 'active',
            new Date(u.createdAt).toLocaleDateString()
        ]);
        
        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "smartshelf_users_directory.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handleBookFormChange = (e) => {
        setBookForm({ ...bookForm, [e.target.name]: e.target.value });
    };

    const resetBookForm = () => {
        setBookForm({ title: "", author: "", genre: "", description: "", isbn: "" });
        setEditingBook(null);
        setIsBookModalOpen(false);
    };

    const handleBookSubmit = async (data, files) => {
        const formData = new FormData();
        Object.keys(data).forEach((key) => formData.append(key, data[key]));
        if (files.pdf) formData.append("pdf", files.pdf);
        if (files.coverImage) formData.append("coverImage", files.coverImage);

        try {
            setLoading(true);
            if (editingBook) {
                await updateBookAPI(editingBook._id, formData);
                alert(" Book updated successfully!");
            } else {
                await addBookAPI(formData);
                alert(" Book added successfully!");
            }
            fetchData();
            resetBookForm();
        } catch (err) {
            console.error("Book Submit Error:", err);
            const msg = err.response?.data?.message || "Operation failed. Please check file sizes and ISBN uniqueness.";
            alert(`Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEditBook = (book) => {
        setEditingBook(book);
        setBookForm({
            title: book.title,
            author: book.author,
            genre: book.genre,
            description: book.description,
            isbn: book.isbn,
        });
        setIsBookModalOpen(true);
    };

    const handleDeleteBook = async (bookId) => {
        if (!window.confirm(" Are you sure you want to delete this book? This action cannot be undone.")) return;
        try {
            await deleteBookAPI(bookId);
            setBooks(books.filter((b) => b._id !== bookId));
            setTotalBooks(prev => prev - 1);
        } catch (err) {
            console.error("Error deleting book:", err);
            const errorMsg = err.response?.data?.message || err.message || "Unknown error";
            alert(`Failed to delete book: ${errorMsg}`);
        }
    };

    // --- Sub-Components ---

    const Pagination = () => {
        const pages = [];
        const maxVisible = 5;
        
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="pagination-wrapper" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalBooks)} of {totalBooks.toLocaleString()} items
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        style={{ padding: '8px', background: 'white', border: '1px solid var(--border)', borderRadius: '6px', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                        <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    
                    {startPage > 1 && (
                        <>
                            <button className="pagination-btn-num" onClick={() => setCurrentPage(1)}>1</button>
                            {startPage > 2 && <span style={{ color: 'var(--muted)' }}>...</span>}
                        </>
                    )}

                    {pages.map(p => (
                        <button 
                            key={p} 
                            className={`pagination-btn-num ${currentPage === p ? 'active' : ''}`}
                            onClick={() => setCurrentPage(p)}
                            style={{ 
                                padding: '8px 12px', 
                                background: currentPage === p ? '#3D604E' : 'white', 
                                color: currentPage === p ? 'white' : 'inherit',
                                border: '1px solid var(--border)', 
                                borderRadius: '6px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            {p}
                        </button>
                    ))}

                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && <span style={{ color: 'var(--muted)' }}>...</span>}
                            <button className="pagination-btn-num" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                        </>
                    )}

                    <button 
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        style={{ padding: '8px', background: 'white', border: '1px solid var(--border)', borderRadius: '6px', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        );
    };

    const ChangePasswordModal = ({ isOpen, onClose, onSubmit, formData, setFormData }) => {
        if (!isOpen) return null;
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                    <div className="modal-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Lock size={24} color="#6c63ff" />
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Security Credentials</h2>
                        </div>
                        <button type="button" className="btn-close" onClick={onClose}><X size={24} /></button>
                    </div>
                    <form onSubmit={onSubmit} style={{ padding: '20px 0' }}>
                        <div className="field">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#9CA3AF' }}>CURRENT PASSWORD</label>
                            <input 
                                type="password" 
                                required 
                                value={formData.currentPassword} 
                                onChange={(e) => setFormData({...formData, currentPassword: e.target.value})} 
                                placeholder="••••••••"
                                className="settings-input"
                            />
                        </div>
                        <div className="field">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#9CA3AF' }}>NEW PASSWORD</label>
                            <input 
                                type="password" 
                                required 
                                value={formData.newPassword} 
                                onChange={(e) => setFormData({...formData, newPassword: e.target.value})} 
                                placeholder="••••••••"
                                className="settings-input"
                            />
                        </div>
                        <div className="field">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#9CA3AF' }}>CONFIRM NEW PASSWORD</label>
                            <input 
                                type="password" 
                                required 
                                value={formData.confirmPassword} 
                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                                placeholder="••••••••"
                                className="settings-input"
                            />
                        </div>
                        <div className="modal-actions" style={{ marginTop: '30px' }}>
                            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ background: '#6c63ff', borderRadius: '8px' }}>Update Password</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const UserModal = ({ isOpen, onClose, onSubmit, formData, onChange }) => {
        if (!isOpen) return null;
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                    <div className="modal-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <UserPlus size={24} color="#6c63ff" />
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{editingUser ? `Edit User: ${editingUser.name}` : "Invite New User"}</h2>
                        </div>
                        <button type="button" className="btn-close" onClick={() => { onClose(); setEditingUser(null); }}><X size={24} /></button>
                    </div>
                    <form onSubmit={onSubmit}>
                        <div className="field">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#9CA3AF' }}>FULL NAME</label>
                            <input type="text" name="name" value={formData.name} onChange={onChange} required placeholder="e.g. Elena Vance" className="settings-input" />
                        </div>
                        <div className="field">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#9CA3AF' }}>EMAIL ADDRESS</label>
                            <input type="email" name="email" value={formData.email} onChange={onChange} required placeholder="elena.vance@smartshelf.com" className="settings-input" />
                        </div>
                        <div className="field">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#9CA3AF' }}>{editingUser ? "NEW PASSWORD (LEAVE BLANK TO KEEP CURRENT)" : "TEMPORARY PASSWORD"}</label>
                            <input type="password" name="password" value={formData.password} onChange={onChange} required={!editingUser} placeholder="••••••••" className="settings-input" />
                        </div>
                        <div className="field">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#9CA3AF' }}>SYSTEM ROLE</label>
                            <select name="role" value={formData.role} onChange={onChange} className="settings-input">
                                <option value="user">Platform User (USER)</option>
                                <option value="admin">System Curator (ADMIN)</option>
                            </select>
                        </div>
                        <div className="modal-actions" style={{ marginTop: '20px' }}>
                            <button type="button" className="btn-cancel" onClick={() => { onClose(); setEditingUser(null); }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ background: '#6c63ff', borderRadius: '8px' }}>{editingUser ? "Save Changes" : "Send Invitation"}</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const BookModal = ({ isOpen, onClose, onSubmit, editingBook, initialData }) => {
        const [formData, setFormData] = useState(initialData);
        const [files, setFiles] = useState({ pdf: null, coverImage: null });

        useEffect(() => {
            setFormData(initialData);
        }, [initialData]);

        if (!isOpen) return null;

        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };

        const handleFileChange = (e) => {
            setFiles({ ...files, [e.target.name]: e.target.files[0] });
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSubmit(formData, files);
        };

        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>{editingBook ? "Edit Book" : "Add New Book"}</h2>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close modal">
                            <X size={24} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="field">
                                <label>Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter book title"
                                />
                            </div>
                            <div className="field">
                                <label>Author</label>
                                <input type="text" name="author" value={formData.author} onChange={handleChange} required placeholder="Enter author name" />
                            </div>
                            <div className="field">
                                <label>ISBN</label>
                                <input type="text" name="isbn" value={formData.isbn} onChange={handleChange} required placeholder="Unique ISBN number" />
                            </div>
                            <div className="field">
                                <label>Genre</label>
                                <input type="text" name="genre" value={formData.genre} onChange={handleChange} placeholder="e.g. Science Fiction" />
                            </div>
                        </div>
                        <div className="field">
                            <label>Description</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" placeholder="Brief summary of the book..." />
                        </div>
                        <div className="form-grid">
                            <div className="field">
                                <label>Book PDF {editingBook && "(Optional if keep current)"}</label>
                                <div className="file-input-wrapper">
                                    <input type="file" name="pdf" accept=".pdf" onChange={handleFileChange} required={!editingBook} />
                                </div>
                            </div>
                            <div className="field">
                                <label>Cover Image {editingBook && "(Optional if keep current)"}</label>
                                <div className="file-input-wrapper">
                                    <input type="file" name="coverImage" accept="image/*" onChange={handleFileChange} required={!editingBook} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary">{editingBook ? "Update Book" : "Upload & Save Book"}</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // --- Sub-Components ---

    const Sidebar = () => (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-brand">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3D604E' }}>Shelf Pro</h3>
                    <p style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 700, letterSpacing: '0.05em' }}>ENTERPRISE ADMIN</p>
                </div>
            </div>
            <nav className="sidebar-nav" style={{ marginTop: '20px' }}>
                <div
                    className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    <LayoutDashboard size={20} /> Overview
                </div>
                <div
                    className={`nav-item ${activeTab === "users" ? "active" : ""}`}
                    onClick={() => setActiveTab("users")}
                >
                    <Users size={20} /> Users
                </div>
                <div
                    className={`nav-item ${activeTab === "books" ? "active" : ""}`}
                    onClick={() => setActiveTab("books")}
                >
                    <BookOpen size={20} /> Books
                </div>
                <div className="nav-item">
                    <TrendingUp size={20} /> Analytics
                </div>
                <div
                    className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
                    onClick={() => setActiveTab("settings")}
                >
                    <Settings size={20} /> Settings
                </div>
            </nav>
            <div className="sidebar-footer">
                <button className="btn-logout" onClick={handleLogout}>
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </aside>
    );

    const TopBar = () => (
        <header className="topbar">
            <div className="topbar-left">
                <h4 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>SmartShelf</h4>
            </div>

            <div className="search-container-top">
                <div className="search-bar-rounded" style={{ background: 'var(--input-bg, var(--sidebar-bg))' }}>
                    <Search size={16} className="search-icon-muted" />
                    <input
                        type="text"
                        placeholder="Search system records..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        style={{ background: 'transparent', color: 'var(--text)' }}
                    />
                </div>
            </div>

            <div className="topbar-right">
                <div className="user-profile" style={{ borderLeft: '1px solid var(--border)' }}>
                    <div className="user-avatar-circle" style={{ width: '36px', height: '36px' }}>
                        {user?.picture ? (
                            <img src={user.picture.startsWith('http') ? user.picture : `http://localhost:5000/${user.picture.replace(/^\//, '').replace(/\\/g, '/')}`} alt="Admin" />
                        ) : (
                            <User size={20} />
                        )}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>{user?.name || 'Admin'}</span>
                </div>
            </div>
        </header>
    );

    const Footer = () => (
        <footer className="footer" style={{ padding: '40px 50px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.05em' }}>
                SMARTSHELF © 2024
            </div>
            <div style={{ display: 'flex', gap: '30px', fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.05em' }}>
                <span style={{ cursor: 'pointer' }}>PRIVACY POLICY</span>
                <span style={{ cursor: 'pointer' }}>AUDIT LOGS</span>
                <span style={{ cursor: 'pointer' }}>API KEYS</span>
            </div>
        </footer>
    );

    const OverviewView = () => (
        <div className="dash-content">
            <div className="page-header">
                <div className="header-text">
                    <h1>Dashboard Overview</h1>
                    <p>Welcome back, Admin. Here's a brief summary of the system activity and health across your enterprise collection.</p>
                </div>
            </div>

            <div className="cards-grid">
                <div className="stat-card">
                    <span className="label">Total Managed Users</span>
                    <span className="value">{users.length.toLocaleString()}</span>
                </div>
                <div className="stat-card">
                    <span className="label">Cataloged Volumes</span>
                    <span className="value">{totalBooks.toLocaleString()}</span>
                </div>
                <div className="stat-card">
                    <span className="label">Last Activity</span>
                    <span className="value">Just now</span>
                </div>
                <div className="stat-card health">
                    <span className="label">Platform Health</span>
                    <span className="value">Optimal</span>
                </div>
            </div>

            <div className="book-list-container">
                <div className="list-header" style={{ gridTemplateColumns: '1fr 200px 200px 100px' }}>
                    <span>System Activity</span>
                    <span>Event Type</span>
                    <span>Timestamp</span>
                    <span style={{ textAlign: 'right' }}>Status</span>
                </div>
                <div className="book-row" style={{ gridTemplateColumns: '1fr 200px 200px 100px' }}>
                    <div className="book-info">
                        <h4>Admin Login Detected</h4>
                        <p>Successful enterprise authentication from system IP</p>
                    </div>
                    <div><span className="badge internal">Security</span></div>
                    <div className="isbn-text">Today, 11:20 AM</div>
                    <div style={{ textAlign: 'right' }}><span className="badge gutenberg">Success</span></div>
                </div>
                <div className="book-row" style={{ gridTemplateColumns: '1fr 200px 200px 100px' }}>
                    <div className="book-info">
                        <h4>Automated Sync Completed</h4>
                        <p>Successfully updated {totalBooks} title metadata</p>
                    </div>
                    <div><span className="badge openlibrary">Maintenance</span></div>
                    <div className="isbn-text">Today, 10:55 AM</div>
                    <div style={{ textAlign: 'right' }}><span className="badge gutenberg">Success</span></div>
                </div>
            </div>
        </div>
    );

    const UsersView = () => (
        <div className="dash-content">
            <div className="page-header" style={{ alignItems: 'center' }}>
                <div className="header-text">
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#111827' }}>User Directory</h1>
                    <p style={{ fontSize: '1.1rem', color: '#6B7280', marginTop: '8px' }}>Manage permissions and oversee curation team members. Maintain high-fidelity collaboration standards for your library.</p>
                </div>
                <button 
                    className="btn-add-book" 
                    onClick={() => setIsUserModalOpen(true)} 
                    style={{ background: '#3D604E', padding: '12px 24px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600 }}
                >
                    <UserPlus size={20} /> Invite User
                </button>
            </div>

            <div className="cards-grid" style={{ marginTop: '40px', gap: '24px' }}>
                <div className="stat-card" style={{ padding: '32px' }}>
                    <span className="label" style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, letterSpacing: '0.05em' }}>TOTAL USERS</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                        <span className="value" style={{ fontSize: '2.5rem', fontWeight: 700 }}>{users.length.toLocaleString()}</span>
                        <span style={{ color: '#10B981', background: '#F0FDF4', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>+12%</span>
                    </div>
                </div>
                <div className="stat-card" style={{ padding: '32px' }}>
                    <span className="label" style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 700, letterSpacing: '0.05em' }}>ACTIVE NOW</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                        <span className="value" style={{ fontSize: '2.5rem', fontWeight: 700 }}>{activeUsersCount}</span>
                        <div className="avatar-stack" style={{ display: 'flex', alignItems: 'center' }}>
                             <div className="user-avatar-circle" style={{ width: '28px', height: '28px', border: '2px solid white' }}><User size={14} /></div>
                             <div className="user-avatar-circle" style={{ width: '28px', height: '28px', border: '2px solid white', marginLeft: '-10px' }}><User size={14} /></div>
                             <span style={{ fontSize: '0.7rem', fontWeight: 700, marginLeft: '6px', color: '#6B7280' }}>+39</span>
                        </div>
                    </div>
                </div>
                <div className="stat-card" style={{ gridColumn: 'span 2', padding: '32px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <span className="label" style={{ fontSize: '0.75rem', color: '#3D604E', fontWeight: 700, letterSpacing: '0.05em' }}>USER ACTIVITY</span>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginTop: '16px', color: '#111827' }}>{totalBooks} Titles Total</h2>
                        <p style={{ color: '#6B7280', fontSize: '0.9rem', marginTop: '4px', fontWeight: 500 }}>Global catalog health is at 98.4%.</p>
                    </div>
                    <Library size={120} color="#F3F4F6" style={{ position: 'absolute', right: '-20px', bottom: '-20px', transform: 'rotate(-15deg)' }} />
                </div>
            </div>

            <div className="table-container-modern" style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', marginTop: '40px' }}>
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
                    <div className="tab-pills" style={{ display: 'flex', background: '#F3F4F6', padding: '4px', borderRadius: '8px' }}>
                        <button className="active" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'white', fontWeight: 600, fontSize: '0.85rem' }}>All Users</button>
                        <button style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#6B7280', fontWeight: 600, fontSize: '0.85rem' }}>Archived</button>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <Filter 
                            size={20} 
                            color={userRoleFilter !== 'all' ? '#3D604E' : '#6B7280'} 
                            style={{ cursor: 'pointer' }} 
                            onClick={() => setUserRoleFilter(prev => prev === 'all' ? 'admin' : (prev === 'admin' ? 'user' : 'all'))} 
                        />
                        <Download 
                            size={20} 
                            color="#6B7280" 
                            style={{ cursor: 'pointer' }} 
                            onClick={exportUsersToCSV}
                        />
                    </div>
                </div>

                <div className="list-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.5fr', background: '#F9FAFB', padding: '16px 32px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF' }}>USER PROFILE</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF' }}>ROLE</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF' }}>JOINED DATE</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF' }}>STATUS</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', textAlign: 'right' }}>ACTIONS</span>
                </div>

                {loading ? (
                    <div className="loader">Loading users...</div>
                ) : (
                    users
                        .filter(u => userRoleFilter === 'all' || u.role === userRoleFilter)
                        .map((u) => (
                        <div className="book-row" key={u._id} style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.5fr', padding: '20px 32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ position: 'relative' }}>
                                    <div className="user-avatar-circle" style={{ width: '48px', height: '48px' }}>
                                        {u.picture ? (
                                            <img src={u.picture.startsWith('http') ? u.picture : `http://localhost:5000/${u.picture.replace(/^\//, '').replace(/\\/g, '/')}`} alt={u.name} />
                                        ) : (
                                            <User size={24} color="#9CA3AF" />
                                        )}
                                    </div>
                                    <div style={{ 
                                        position: 'absolute', 
                                        bottom: '2px', 
                                        right: '2px', 
                                        width: '12px', 
                                        height: '12px', 
                                        borderRadius: '50%', 
                                        background: u.status === 'active' ? '#10B981' : '#9CA3AF',
                                        border: '2px solid white'
                                    }}></div>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>{u.name}</h4>
                                    <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>{u.email}</p>
                                </div>
                            </div>
                            <div>
                                <span style={{ 
                                    padding: '4px 12px', 
                                    background: '#F3F4F6', 
                                    color: '#6B7280', 
                                    fontSize: '0.7rem', 
                                    fontWeight: 700, 
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                {u.role === 'admin' ? 'ADMIN' : 'USER'}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#4B5563', fontWeight: 500 }}>
                                {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                            </div>
                            <div>
                                <span style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '6px', 
                                    padding: '4px 12px', 
                                    background: u.status === 'active' ? '#F0FDF4' : '#F3F4F6', 
                                    color: u.status === 'active' ? '#10B981' : '#6B7280',
                                    borderRadius: '100px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600
                                }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                                    {u.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="action-btns" style={{ gap: '24px' }}>
                                <Pencil size={20} color="#6B7280" style={{ cursor: 'pointer' }} onClick={() => handleEditUser(u)} />
                                <Trash2 size={20} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => handleDeleteUser(u._id)} />
                            </div>
                        </div>
                    ))
                )}

                <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB' }}>
                    <span style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 500 }}>
                        Showing <span style={{ fontWeight: 700, color: '#111827' }}>{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalBooks)}</span> of <span style={{ fontWeight: 700, color: '#111827' }}>{totalBooks.toLocaleString()}</span> users
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                         <ChevronRight size={18} color="#6B7280" style={{ transform: 'rotate(180deg)', cursor: 'pointer' }} />
                         <div style={{ display: 'flex', gap: '4px' }}>
                            <button style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: '#3D604E', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>1</button>
                            <button style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#6B7280', fontWeight: 600, fontSize: '0.85rem' }}>2</button>
                            <button style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#6B7280', fontWeight: 600, fontSize: '0.85rem' }}>3</button>
                            <span style={{ padding: '0 4px', color: '#9CA3AF' }}>...</span>
                            <button style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#6B7280', fontWeight: 600, fontSize: '0.85rem' }}>321</button>
                         </div>
                         <ChevronRight size={18} color="#6B7280" style={{ cursor: 'pointer' }} />
                    </div>
                </div>
            </div>
        </div>
    );

    const BooksView = () => (
        <div className="dash-content">
            <div className="page-header">
                <div className="header-text">
                    <h1>The Collection</h1>
                    <p>Manage and curate your digital library. Review metadata, update sources, and maintain high-fidelity standards for your enterprise readers.</p>
                </div>
                <button className="btn-add-book" onClick={() => setIsBookModalOpen(true)}>
                    <Plus size={18} /> Add New Book
                </button>
            </div>

            <div className="cards-grid">
                <div className="stat-card">
                    <span className="label">Total Titles</span>
                    <span className="value">{totalBooks.toLocaleString()}</span>
                </div>
                <div className="stat-card">
                    <span className="label">Active Users</span>
                    <span className="value">18</span>
                </div>
                <div className="stat-card">
                    <span className="label">Last Sync</span>
                    <span className="value">2m ago</span>
                </div>
                <div className="stat-card health">
                    <span className="label">System Health</span>
                    <span className="value">Optimal</span>
                </div>
            </div>

            <div className="book-list-container">
                <div className="list-header">
                    <span>Cover</span>
                    <span>Title & Meta</span>
                    <span>Author</span>
                    <span>Source</span>
                    <span>ISBN-13</span>
                    <span style={{ textAlign: 'right' }}>Actions</span>
                </div>
                
                {loading ? (
                    <div className="loader">Loading the collection...</div>
                ) : (
                    books.map((b) => {
                        const isGutenberg = b.isbn?.startsWith('GUT-');
                        const isOpenLibrary = b.isbn?.startsWith('OL-');
                        const sourceLabel = isGutenberg ? 'Gutenberg' : isOpenLibrary ? 'OpenLibrary' : 'Internal';
                        const sourceClass = isGutenberg ? 'gutenberg' : isOpenLibrary ? 'openlibrary' : 'internal';

                        const getImageUrl = (url) => {
                            if (!url) return "https://via.placeholder.com/150?text=No+Cover";
                            if (url.startsWith("http")) return url;
                            return `http://localhost:5000/${url.replace(/\\/g, '/')}`;
                        };

                        return (
                            <div className="book-row" key={b._id}>
                                <img src={getImageUrl(b.coverImageUrl)} alt="cover" className="book-cover-thumb" />
                                <div className="book-info">
                                    <h4>{b.title}</h4>
                                    <p>Published {b.originalData?.publishYear || '1925'} • {b.genre || 'Fiction'}</p>
                                </div>
                                <div className="author-text">{b.author}</div>
                                <div>
                                    <span className={`badge ${sourceClass}`}>{sourceLabel}</span>
                                </div>
                                <div className="isbn-text">{b.isbn}</div>
                                <div className="action-btns">
                                    <button className="action-icon edit" onClick={() => handleEditBook(b)} style={{ background: 'none', border: 'none' }}>
                                        <ChevronRight size={20} />
                                    </button>
                                    <button className="action-icon" onClick={() => handleDeleteBook(b._id)} style={{ background: 'none', border: 'none' }}>
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
                {books.length === 0 && !loading && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                        No records found in the collection.
                    </div>
                )}
            </div>

            {Pagination()}
        </div>
    );

    const SettingsView = () => (
        <div className="dash-content" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="settings-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
                
                {/* Profile Settings Card */}
                <div className="stat-card" style={{ padding: '32px', background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <UserCircle size={24} color="#3D604E" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>Profile Settings</h2>
                    </div>

                    <div style={{ display: 'flex', gap: '40px' }}>
                        <div style={{ textAlign: 'center', width: '150px' }}>
                            <div className="user-avatar-circle" style={{ width: '150px', height: '150px', borderRadius: '16px', border: 'none', background: '#F3F4F6', overflow: 'hidden' }}>
                                {profilePreview ? (
                                    <img src={profilePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : user?.picture ? (
                                    <img src={user.picture.startsWith('http') ? user.picture : `http://localhost:5000/${user.picture.replace(/^\//, '').replace(/\\/g, '/')}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={80} color="#9CA3AF" />
                                )}
                            </div>
                            <button 
                                onClick={triggerProfileInput} 
                                style={{ marginTop: '16px', color: '#3D604E', background: 'transparent', border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', margin: '16px auto 0' }}
                            >
                                Change Photo
                            </button>
                            <input type="file" ref={profileInputRef} onChange={handleProfileFileChange} style={{ display: 'none' }} accept="image/*" />
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div className="field">
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.05em' }}>FULL NAME</label>
                                    <input 
                                        type="text" 
                                        value={profileForm.name} 
                                        onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} 
                                        style={{ background: '#F3F4F6', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600 }}
                                    />
                                </div>
                                <div className="field">
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.05em' }}>EMAIL ADDRESS</label>
                                    <input 
                                        type="email" 
                                        value={profileForm.email} 
                                        onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} 
                                        style={{ background: '#F3F4F6', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600 }}
                                    />
                                </div>
                            </div>
                            
                            <div className="field" style={{ position: 'relative' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.05em' }}>CHANGE PASSWORD</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        value={profileForm.password} 
                                        onChange={(e) => setProfileForm({...profileForm, password: e.target.value})} 
                                        placeholder="Leave blank to keep current"
                                        style={{ background: '#F3F4F6', border: 'none', padding: '14px', paddingRight: '45px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, width: '100%' }}
                                    />
                                    <div 
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9CA3AF' }}
                                    >
                                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Summary Sidebar */}
                <div className="stat-card" style={{ padding: '32px', background: '#3D604E', color: 'white', display: 'flex', flexDirection: 'column', height: 'fit-content', position: 'relative' }}>
                    <style>{`
                        @keyframes pulse-green {
                            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                            70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
                            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                        }
                        .pulse-dot {
                            animation: pulse-green 2s infinite;
                        }
                    `}</style>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <Activity size={24} color="white" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Status Summary</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>System Health</span>
                            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                                <div className={isDiagnosing ? "pulse-dot" : ""} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></div>
                                {isDiagnosing ? "SCANNING..." : "OPTIMAL"}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Total Titles</span>
                            <span style={{ fontWeight: 800, fontSize: '1rem' }}>{totalBooks.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Total Users</span>
                            <span style={{ fontWeight: 800, fontSize: '1rem' }}>{totalUsers.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Security Level</span>
                            <span style={{ background: 'white', color: '#3D604E', padding: '4px 12px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900 }}>ENTERPRISE</span>
                        </div>
                        
                        <div style={{ marginTop: '20px' }}>
                            <button 
                                onClick={handleRunDiagnostics}
                                disabled={isDiagnosing}
                                style={{ 
                                    width: '100%', 
                                    padding: '12px', 
                                    background: isDiagnosing ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', 
                                    border: '1px solid rgba(255,255,255,0.2)', 
                                    color: 'white', 
                                    borderRadius: '10px', 
                                    fontWeight: 800, 
                                    fontSize: '0.9rem', 
                                    cursor: isDiagnosing ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isDiagnosing ? <RefreshCw size={16} className="spin-icon" /> : null}
                                {isDiagnosing ? "Running Diagnostics..." : "Run Diagnostics"}
                            </button>
                            {lastScanned && !isDiagnosing && (
                                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '12px', fontWeight: 700 }}>
                                    LAST CHECKED: {lastScanned}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <button 
                onClick={handleSaveSettings}
                className="btn btn-primary"
                style={{ 
                    width: '100%', 
                    background: '#3D604E', 
                    padding: '18px', 
                    borderRadius: '16px', 
                    border: 'none', 
                    color: 'white', 
                    fontWeight: 800, 
                    fontSize: '1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '12px',
                    cursor: 'pointer'
                }}
            >
                <Save size={20} /> Update Profile
            </button>
        </div>
    );

    const renderActiveView = () => {
        switch (activeTab) {
            case "overview": return OverviewView();
            case "users": return UsersView();
            case "books": return BooksView();
            case "settings": return SettingsView();
            default: return OverviewView();
        }
    };

    return (
        <div className="dash-container">
            {Sidebar()}
            <main className="main-content" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                {TopBar({ title: activeTab.charAt(0).toUpperCase() + activeTab.slice(1) })}
                <div style={{ flex: 1 }}>
                    {renderActiveView()}
                </div>
                {Footer()}
            </main>

            {/* Modal for Invite User */}
            <UserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSubmit={handleUserSubmitAction}
                formData={userForm}
                onChange={handleUserFormChange}
            />

            {/* Modal for Add/Edit Book - Extracted to fix lag */}
            <BookModal
                isOpen={isBookModalOpen}
                onClose={resetBookForm}
                onSubmit={handleBookSubmit}
                editingBook={editingBook}
                initialData={bookForm}
            />
            {/* Modal for Change Password */}
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSubmit={handlePasswordSubmit}
                formData={passwordForm}
                setFormData={setPasswordForm}
            />
        </div>
    );
};

export default AdminDashboard;
