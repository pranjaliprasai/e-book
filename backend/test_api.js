import axios from "axios";

async function testPagination() {
  try {
    const loginRes = await axios.post("http://localhost:5000/api/auth/login", {
      email: "admin@smartshelf.com",
      password: "adminpassword123",
    });
    const token = loginRes.data.data.token;
    console.log("Login Successful");

    const response = await axios.get(
      "http://localhost:5000/api/book?limit=15&page=1",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    console.log("Response Status:", response.status);
    console.log("Pagination Metadata:", response.data.pagination);
    console.log("Books Count:", response.data.data.length);
    if (response.data.data.length > 0) {
      console.log("First Book:", response.data.data[0].title);
    }
  } catch (err) {
    console.error("Error:", err.message);
    if (err.response)
      console.error("Data:", JSON.stringify(err.response.data, null, 2));
  }
}

testPagination();
