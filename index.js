const express = require('express');
const app = express();
const PORT = 4000;
const fs = require('fs');
const path = require('path');


app.get('/home', (req, res) => {
  res.status(200).json('Welcome, your app is working well');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serves static files from the current directory

// Paths to JSON files
const jsonFiles = {
    current: path.join(__dirname, 'exhibitions-current.json'),
    past: path.join(__dirname, 'exhibitions-past.json'),
    upcoming: path.join(__dirname, 'exhibitions-upcoming.json'),
    links: path.join(__dirname, 'links.json'),
    linkssources: path.join(__dirname, 'links-sources.json'),
};

// Helper functions to read and write JSON files
const readJson = (filePath) => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
        console.error(`Error reading JSON file at ${filePath}:`, error);
        return [];
    }
};

const writeJson = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing to JSON file at ${filePath}:`, error);
    }
};

// API to edit exhibitions
app.post('/edit', (req, res) => {
    const { type, exhibitionname, updatedData } = req.body;

    if (!type || !['current', 'past', 'upcoming'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid type for exhibitions.' });
    }

    const filePath = jsonFiles[type];
    if (filePath) {
        const data = readJson(filePath);
        const index = data.findIndex((item) => item.exhibitionname === exhibitionname);

        if (index !== -1) {
            data[index] = { ...data[index], ...updatedData };
            writeJson(filePath, data);
            return res.json({ success: true, message: 'Exhibition updated successfully.' });
        } else {
            return res.status(404).json({ success: false, message: 'Exhibition not found.' });
        }
    } else {
        return res.status(400).json({ success: false, message: 'Invalid file path for exhibitions.' });
    }
});

// API to delete exhibitions
app.post('/delete', (req, res) => {
    const { type, exhibitionname } = req.body;

    if (!type || !['current', 'past', 'upcoming'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid type for exhibitions.' });
    }

    const filePath = jsonFiles[type];
    if (filePath) {
        const data = readJson(filePath);
        const updatedData = data.filter((item) => item.exhibitionname !== exhibitionname);

        if (updatedData.length < data.length) {
            writeJson(filePath, updatedData);
            return res.json({ success: true, message: 'Exhibition deleted successfully.' });
        } else {
            return res.status(404).json({ success: false, message: 'Exhibition not found.' });
        }
    } else {
        return res.status(400).json({ success: false, message: 'Invalid file path for exhibitions.' });
    }
});

// API to edit links
// Ensure '/edit-link' handles 'linkssources' correctly
app.post('/edit-link', (req, res) => {
    const { websitename, updatedData, type } = req.body;

    if (!type || !['links', 'linkssources'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid type for links.' });
    }

    const filePath = jsonFiles[type]; // Get the correct file path based on type
    const data = readJson(filePath);
    const index = data.findIndex((item) => item.websitename === websitename);

    if (index !== -1) {
        data[index] = { ...data[index], ...updatedData };
        writeJson(filePath, data);
        return res.json({ success: true, message: `${type} updated successfully.` });
    } else {
        return res.status(404).json({ success: false, message: `${type} not found.` });
    }
});




app.post('/delete-link', (req, res) => {
    const { websitename, type } = req.body;

    if (!websitename || !type || !['links', 'linkssources'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid input. Website name and type are required.' });
    }

    const filePath = jsonFiles[type]; // Dynamically choose the correct file
    if (!filePath) {
        return res.status(400).json({ success: false, message: `Invalid file path for ${type}.` });
    }

    const data = readJson(filePath);
    const updatedData = data.filter((item) => item.websitename !== websitename);

    if (updatedData.length < data.length) {
        writeJson(filePath, updatedData);
        return res.json({ success: true, message: `${type} deleted successfully.` });
    } else {
        return res.status(404).json({ success: false, message: `${type} not found.` });
    }
});





// API to fetch exhibitions or links (optional for frontend)
app.get('/fetch/:type', (req, res) => {
    const { type } = req.params;
    const filePath = jsonFiles[type];

    if (filePath) {
        const data = readJson(filePath);
        res.json(data);
    } else {
        res.status(400).json({ success: false, message: 'Invalid type.' });
    }
});

app.post('/add', (req, res) => {
    const { type, newExhibition } = req.body;

    if (!type || !['current', 'past', 'upcoming'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid type for exhibitions.' });
    }

    const filePath = jsonFiles[type];
    if (filePath) {
        const data = readJson(filePath);
        data.push(newExhibition);
        writeJson(filePath, data);
        res.json({ success: true, message: 'Exhibition added successfully.' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid file path for exhibitions.' });
    }
});

app.post('/add-link-source', (req, res) => {
    const newSource = req.body;

    if (!newSource.websitename || !newSource.link || !newSource.Description) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const filePath = jsonFiles.linkssources;
    const data = readJson(filePath);
    data.push(newSource);
    writeJson(filePath, data);

    res.json({ success: true, message: 'Link source added successfully.' });
});

app.post('/add-link', (req, res) => {
    const newLink = req.body;

    // Validate the required fields
    if (!newLink.websitename || !newLink.link || !newLink.Description) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const filePath = jsonFiles.links;
    if (filePath) {
        const data = readJson(filePath); // Read existing links
        data.push(newLink); // Add the new link
        writeJson(filePath, data); // Write back to the file
        res.json({ success: true, message: 'Link added successfully.' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid file path for links.' });
    }
});