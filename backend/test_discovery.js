import axios from 'axios';

async function testDiscovery() {
    try {
        const loginRes = await axios.post("http://localhost:5000/api/auth/login", {
          email: "admin@smartshelf.com",
          password: "adminpassword123",
        });
        const token = loginRes.data.data.token;
        console.log("Login Successful");

        const params = {
            isDiscovery: true,
            limit: 15,
            source: 'Gutenberg'
        };

        const response = await axios.get("http://localhost:5000/api/book", {
            params,
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("URL:", response.config.url + "?" + new URLSearchParams(params).toString());
        console.log("Status:", response.status);
        console.log("Books returned:", response.data.data?.length);
        if (response.data.data?.length > 0) {
            console.log("First Book Title:", response.data.data[0].title);
            console.log("First Book ISBN:", response.data.data[0].isbn);
        } else {
            console.log("No books found. Full response:", JSON.stringify(response.data, null, 2));
        }
    } catch (err) {
        console.error("Error:", err.message);
        if (err.response) console.error("Data:", err.response.data);
    }
}

testDiscovery();
