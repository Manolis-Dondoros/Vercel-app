const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');


// Middleware to serve static files
app.use(express.static(path.join(__dirname)));

// Serve the HTML file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
    res.sendFile(path.join(__dirname, 'style.css'));
    res.sendFile(path.join(__dirname, 'script.js'));
    res.sendFile(path.join(__dirname, 'images'));
});

const port = process.env.PORT || 8080;

const kill = require("kill-port");

kill(port, "tcp")
    .then(() => {
        console.log(`Port ${port} was cleared.`);
    })
    .catch((err) => {
        if (err.message.includes("No process running on port")) {
            console.log(`No process was running on port ${port}.`);
        } else {
            console.error(`Error clearing port ${port}:`, err);
        }
    })
    .finally(() => {
        // Start the server regardless of the kill-port result
        app.listen(port, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log(`[INFO] Server running on port: ${port}`);
            }
        });
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

    const filePath = jsonFiles[type]; // Correctly mapped file path
    if (!filePath) {
        return res.status(404).json({ success: false, message: `${type} file not found.` });
    }

    const data = readJson(filePath);

    // Normalize both strings by trimming and converting to lowercase
    const normalizedWebsitename = websitename.trim().toLowerCase();
    const index = data.findIndex(
        (item) => item.websitename.trim().toLowerCase() === normalizedWebsitename
    );

    if (index !== -1) {
        // Merge updated data into the existing entry
        data[index] = { ...data[index], ...updatedData };
        writeJson(filePath, data);
        res.json({ success: true, message: `${type} updated successfully.` });
    } else {
        res.status(404).json({ success: false, message: `Websitename "${websitename}" not found in ${type}.` });
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