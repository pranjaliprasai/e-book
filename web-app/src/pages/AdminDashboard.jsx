import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUsersAPI, deleteUserAPI } from "../api/user";
import { getBooksAPI, addBookAPI, updateBookAPI, deleteBookAPI } from "../api/book";

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
    const [bookFiles, setBookFiles] = useState({ pdf: null, coverImage: null });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("users"); // 'users' or 'books'

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, booksRes] = await Promise.all([
                getUsersAPI(),
                getBooksAPI(),
            ]);
            setUsers(usersRes.data.data);
            setBooks(booksRes.data.data);
        } catch (err) {
            setError("Failed to load dashboard data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
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
        setBookFiles({ pdf: null, coverImage: null });
        setEditingBook(null);
        setIsBookModalOpen(false);
    };

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(bookForm).forEach((key) => formData.append(key, bookForm[key]));
        if (bookFiles.pdf) formData.append("pdf", bookFiles.pdf);
        if (bookFiles.coverImage) formData.append("coverImage", bookFiles.coverImage);

        try {
            if (editingBook) {
                await updateBookAPI(editingBook._id, formData);
                alert("🎉 Book updated successfully!");
            } else {
                await addBookAPI(formData);
                alert("🎉 Book added successfully!");
            }
            fetchData();
            resetBookForm();
        } catch (err) {
            alert(err.response?.data?.message || "Operation failed.");
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
        if (!window.confirm("🗑️ Are you sure you want to delete this book? This action cannot be undone.")) return;
        try {
            await deleteBookAPI(bookId);
            setBooks(books.filter((b) => b._id !== bookId));
        } catch (err) {
            alert("Failed to delete book.");
        }
    };

    return (
        <div className="dash-wrapper">
            <nav className="navbar">
                <span className="navbar-brand">📚 SmartShelf Admin</span>
                <div className="navbar-user">
                    <span className="badge badge-admin">Admin</span>
                    <button className="btn-sm" onClick={handleLogout}>Logout</button>
                </div>
            </nav>
            <div className="dash-content">
                <header className="dash-header">
                    <div className="welcome-text">
                        <h1>Welcome back, {user?.name} 👋</h1>
                        <p className="welcome-sub">Manage your e-book library and users from here.</p>
                    </div>
                    <div className="tab-switcher">
                        <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>Users</button>
                        <button className={activeTab === "books" ? "active" : ""} onClick={() => setActiveTab("books")}>Books</button>
                    </div>
                </header>

                <div className="cards-grid">
                    <div className="card admin-stat">
                        <h3>Total Users</h3>
                        <span className="stat-value">{users.length}</span>
                    </div>
                    <div className="card admin-stat">
                        <h3>Total Books</h3>
                        <span className="stat-value">{books.length}</span>
                    </div>
                    <div className="card admin-stat">
                        <h3>System Status</h3>
                        <span className="stat-value" style={{ fontSize: '1.2rem', color: '#00d4aa' }}>🟢 Operational</span>
                    </div>
                </div>

                {activeTab === "users" ? (
                    <div className="management-section">
                        <div className="section-header">
                            <h2>User Management 👥</h2>
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
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u) => (
                                            <tr key={u._id}>
                                                <td>{u.name}</td>
                                                <td>{u.email}</td>
                                                <td>
                                                    <span className={`role-badge ${u.role}`}>{u.role}</span>
                                                </td>
                                                <td>
                                                    {u.role !== "admin" && (
                                                        <button className="btn-delete" onClick={() => handleDeleteUser(u._id)}>Delete</button>
                                                    )}
                                                    {u.role === "admin" && <span className="locked-action">🔒 Locked</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="management-section">
                        <div className="section-header">
                            <h2>Book Management 📖</h2>
                            <button className="btn btn-primary btn-add" onClick={() => setIsBookModalOpen(true)}>+ Add New Book</button>
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

                                            return (
                                                <tr key={b._id}>
                                                    <td>
                                                        <img src={`http://localhost:5000/${b.coverImageUrl.replace(/\\/g, '/')}`} alt="cover" className="table-thumb" />
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
                                            <tr><td colSpan="5" className="empty-row">No books found in the library.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal for Add/Edit Book */}
            {isBookModalOpen && (
                <div className="modal-overlay" onClick={resetBookForm}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingBook ? "Edit Book" : "Add New Book"}</h2>
                            <button className="btn-close" onClick={resetBookForm}>&times;</button>
                        </div>
                        <form onSubmit={handleBookSubmit}>
                            <div className="form-grid">
                                <div className="field">
                                    <label>Title</label>
                                    <input type="text" name="title" value={bookForm.title} onChange={handleBookFormChange} required placeholder="Enter book title" />
                                </div>
                                <div className="field">
                                    <label>Author</label>
                                    <input type="text" name="author" value={bookForm.author} onChange={handleBookFormChange} required placeholder="Enter author name" />
                                </div>
                                <div className="field">
                                    <label>ISBN</label>
                                    <input type="text" name="isbn" value={bookForm.isbn} onChange={handleBookFormChange} required placeholder="Unique ISBN number" />
                                </div>
                                <div className="field">
                                    <label>Genre</label>
                                    <input type="text" name="genre" value={bookForm.genre} onChange={handleBookFormChange} placeholder="e.g. Science Fiction" />
                                </div>
                            </div>
                            <div className="field">
                                <label>Description</label>
                                <textarea name="description" value={bookForm.description} onChange={handleBookFormChange} rows="3" placeholder="Brief summary of the book..." />
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
                                <button type="button" className="btn-cancel" onClick={resetBookForm}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingBook ? "Update Book" : "Upload & Save Book"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
