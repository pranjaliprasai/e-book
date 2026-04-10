import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch'; // the backend is ES module project, hopefully node-fetch is available. Alternatively we can use native fetch since we're in node >= 18+

async function testUpload() {
    try {
        const formData = new FormData();
        formData.append('title', 'Test Book');
        formData.append('author', 'Test Author');
        formData.append('genre', 'Test');
        formData.append('description', 'Test Description');
        formData.append('isbn', '1234567890');

        // Create dummy files
        fs.writeFileSync('test.pdf', 'dummy pdf content');
        fs.writeFileSync('test.jpg', 'dummy image content');

        formData.append('pdf', fs.createReadStream('test.pdf'), 'test.pdf');
        formData.append('coverImage', fs.createReadStream('test.jpg'), 'test.jpg');

        // You'll need an admin token, or wait, we can just look at the error if token is missing, 
        // to see if we get a 401 or something else, like multer crashing.
        // Wait, multer runs before isAdmin middleware? No:
        // router.post("/", verifyToken, isAdmin, upload.fields([...]), addBookController);
        // So we need authentication to reach multer.
        console.log("Test script done writing, need a valid token to proceed.");

    } catch (e) {
        console.error(e);
    }
}
testUpload();
