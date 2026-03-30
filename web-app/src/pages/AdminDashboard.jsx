import { useState, useEffect } from "react";
import appLogo from "../assets/Mobileapplogo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUsersAPI, deleteUserAPI, updateUserAPI } from "../api/user";
import { getBooksAPI, addBookAPI, updateBookAPI, deleteBookAPI } from "../api/book";
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
    X
} from "lucide-react";

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // State for Users
    const [users, setUsers] = useState([]);

    // State for Books
    const [books, setBooks] = useState([]);
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

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, booksRes] = await Promise.all([
                getUsersAPI({ search: userSearch }),
                getBooksAPI({ search: bookSearch }),
            ]);
            setUsers(usersRes.data.data);
            setBooks(booksRes.data.data);
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
    }, [userSearch, bookSearch]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleThemeChange = (newTheme) => {
        // Remove all possible theme classes
        document.body.classList.remove("light-theme", "dark-theme", "forest-theme", "smartshelf-theme");
        // Add the new theme class (except for default dark if you prefer)
        if (newTheme !== "dark") {
            document.body.classList.add(`${newTheme}-theme`);
        }
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

    // User Actions
    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await deleteUserAPI(userId);
            setUsers(users.filter((u) => u._id !== userId));
        } catch (err) {
            alert("Failed to delete user.");
        }
    };

    // Book Actions
    const handleBookFormChange = (e) => {
        setBookForm({ ...bookForm, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setBookFiles({ ...bookFiles, [e.target.name]: e.target.files[0] });
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
        } catch (err) {
            alert("Failed to delete book.");
        }
    };

    // --- Sub-Components ---

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
                <img src={appLogo} alt="SmartShelf" className="sidebar-logo-img" />
                <span>SmartShelf</span>
            </div>
            <nav className="sidebar-nav">
                <div className="sidebar-label">Admin Panel</div>
                <div
                    className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    <LayoutDashboard size={18} /> Overview
                </div>
                <div
                    className={`nav-item ${activeTab === "users" ? "active" : ""}`}
                    onClick={() => setActiveTab("users")}
                >
                    <Users size={18} /> Users
                </div>
                <div
                    className={`nav-item ${activeTab === "books" ? "active" : ""}`}
                    onClick={() => setActiveTab("books")}
                >
                    <BookOpen size={18} /> Books
                </div>

                <div className="sidebar-label">System</div>
                <div className="nav-item">
                    <TrendingUp size={18} /> Analytics
                </div>
                <div className="nav-item">
                    <Settings size={18} /> Settings
                </div>
            </nav>
            <div className="sidebar-footer">
                <button className="btn-logout" onClick={handleLogout}>
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </aside>
    );

    const TopBar = ({ title }) => (
        <header className="topbar">
            <div className="topbar-left">
                <h2>{title}</h2>
            </div>
            <div className="topbar-right">
                <div className="theme-controls">
                    <button
                        className={`theme-btn ${theme === "smartshelf" ? "active" : ""}`}
                        onClick={() => handleThemeChange("smartshelf")}
                    ><Library size={14} /> Brand</button>
                    <button
                        className={`theme-btn ${theme === "light" ? "active" : ""}`}
                        onClick={() => handleThemeChange("light")}
                    ><Sun size={14} /> Light</button>
                    <button
                        className={`theme-btn ${theme === "dark" ? "active" : ""}`}
                        onClick={() => handleThemeChange("dark")}
                    ><Moon size={14} /> Dark</button>
                    <button
                        className={`theme-btn ${theme === "forest" ? "active" : ""}`}
                        onClick={() => handleThemeChange("forest")}
                    ><Trees size={14} /> Forest</button>
                </div>
                <div className="user-profile">
                    <div className="user-info-text">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">Administrator</span>
                    </div>
                    <div className="user-avatar">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );

    const OverviewView = () => (
        <div className="dash-content">
            <div className="welcome-section">
                <h1>Welcome back, {user?.name}!</h1>
                <p className="muted">Here's what's happening in your library today.</p>
            </div>

            <div className="cards-grid">
                <div className="card">
                    <div className="card-header">
                        <span className="stat-label">Total Users</span>
                        <span className="stat-trend positive">+12.5%</span>
                    </div>
                    <span className="stat-value">{users.length}</span>
                </div>
                <div className="card">
                    <div className="card-header">
                        <span className="stat-label">Uploaded Books</span>
                        <span className="stat-trend">+8.2%</span>
                    </div>
                    <span className="stat-value">{books.length}</span>
                </div>
                <div className="card">
                    <div className="card-header">
                        <span className="stat-label">System Health</span>
                    </div>
                    <span className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>Operational</span>
                </div>
            </div>

            <div className="management-section" style={{ marginTop: '40px' }}>
                <div className="section-header">
                    <h2>Recent Activity</h2>
                </div>
                <div className="table-wrapper">
                    <div className="loader" style={{ padding: '20px' }}>Activity tracking coming soon...</div>
                </div>
            </div>
        </div>
    );

    const UsersView = () => (
        <div className="dash-content">
            <div className="management-section">
                <div className="section-header">
                    <h2>User Management</h2>
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="search-input"
                        />
                        <Search size={18} className="search-icon" />
                    </div>
                </div>
                {loading ? (
                    <div className="loader">Loading users...</div>
                ) : error ? (
                    <div className="error-msg">{error}</div>
                ) : (
                    <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Joined Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id}>
                                        <td className="user-cell">
                                            <div className="user-icon-wrapper">
                                                {u.picture ? (
                                                    <img 
                                                        src={u.picture.startsWith('http') ? u.picture : `http://localhost:5000/${u.picture.replace(/^\//, '').replace(/\\/g, '/')}`} 
                                                        alt={u.name} 
                                                        className="user-profile-img"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = "" }}
                                                    />
                                                ) : (
                                                    <User size={16} />
                                                )}
                                            </div>
                                            {u.name}
                                        </td>
                                        <td>{u.email}</td>
                                        <td>
                                            <select
                                                className={`role-select ${u.role}`}
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span
                                                className={`status-badge ${u.status || 'active'}`}
                                                onClick={() => handleStatusToggle(u._id, u.status || 'active')}
                                            >
                                                {(u.status || 'active').toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            {u.role !== "admin" && (
                                                <button className="btn-delete-icon" onClick={() => handleDeleteUser(u._id)} title="Delete User">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                            {u.role === "admin" && <Lock size={16} className="locked-icon" />}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    const BooksView = () => (
        <div className="dash-content">
            <div className="management-section">
                <div className="section-header">
                    <h2>Book Management</h2>
                    <div className="search-controls">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Search by title, author or genre..."
                                value={bookSearch}
                                onChange={(e) => setBookSearch(e.target.value)}
                                className="search-input"
                            />
                            <Search size={18} className="search-icon" />
                        </div>
                        <button className="btn btn-primary btn-add" onClick={() => setIsBookModalOpen(true)}>
                            <Plus size={18} /> Add New Book
                        </button>
                    </div>
                </div>
                {loading ? (
                    <div className="loader">Loading books...</div>
                ) : (
                    <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Cover</th>
                                    <th>Title</th>
                                    <th>Author</th>
                                    <th>Source</th>
                                    <th>ISBN</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {books.map((b) => {
                                    const isGutenberg = b.isbn?.startsWith('GUT-');
                                    const isOpenLibrary = b.isbn?.startsWith('OL-');
                                    const sourceLabel = isGutenberg ? 'Gutenberg' : isOpenLibrary ? 'OpenLibrary' : 'Local';
                                    const sourceClass = isGutenberg ? 'gut' : isOpenLibrary ? 'ol' : 'local';

                                    const getImageUrl = (url) => {
                                        if (!url) return "https://via.placeholder.com/150?text=No+Cover";
                                        if (url.startsWith("http")) return url;
                                        return `http://localhost:5000/${url.replace(/\\/g, '/')}`;
                                    };

                                    return (
                                        <tr key={b._id}>
                                            <td>
                                                <img src={getImageUrl(b.coverImageUrl)} alt="cover" className="table-thumb" />
                                            </td>
                                            <td className="bold">{b.title}</td>
                                            <td>{b.author}</td>
                                            <td>
                                                <span className={`source-badge ${sourceClass}`}>{sourceLabel}</span>
                                            </td>
                                            <td><code>{b.isbn}</code></td>
                                            <td>
                                                <div className="actions-cell">
                                                    <button className="btn-edit" onClick={() => handleEditBook(b)}>Edit</button>
                                                    <button className="btn-delete" onClick={() => handleDeleteBook(b._id)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {books.length === 0 && (
                                    <tr><td colSpan="6" className="empty-row">No books found in the library.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    const renderActiveView = () => {
        switch (activeTab) {
            case "overview": return OverviewView();
            case "users": return UsersView();
            case "books": return BooksView();
            default: return OverviewView();
        }
    };

    return (
        <div className="dash-container">
            {Sidebar()}
            <main className="main-content">
                {TopBar({ title: activeTab.charAt(0).toUpperCase() + activeTab.slice(1) })}
                {renderActiveView()}
            </main>

            {/* Modal for Add/Edit Book - Extracted to fix lag */}
            <BookModal
                isOpen={isBookModalOpen}
                onClose={resetBookForm}
                onSubmit={handleBookSubmit}
                editingBook={editingBook}
                initialData={bookForm}
            />
        </div>
    );
};

export default AdminDashboard;
