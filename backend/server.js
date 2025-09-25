const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Change to your MySQL username
    password: 'Gondal7788', // Change to your MySQL password
    database: 'resume_builder'
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

// Create resumes table if not exists
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS resumes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        city VARCHAR(100),
        country VARCHAR(100),
        resume_content LONGTEXT,
        template VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
`;

db.execute(createTableQuery, (err) => {
    if (err) {
        console.error('Error creating table: ' + err.message);
    } else {
        console.log('Resumes table ready');
    }
});

// API Routes

// Submit resume
app.post('/api/resumes', (req, res) => {
    const { name, email, phone, city, country, resume_content, template } = req.body;

    // Basic validation
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    const query = `
        INSERT INTO resumes (name, email, phone, city, country, resume_content, template) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.execute(query, [name, email, phone, city, country, resume_content, template], 
        (err, results) => {
            if (err) {
                console.error('Database error: ' + err.message);
                return res.status(500).json({ error: 'Failed to save resume' });
            }
            
            res.json({ 
                message: 'Resume saved successfully', 
                id: results.insertId 
            });
        });
});

// Get all resumes
app.get('/api/resumes', (req, res) => {
    const query = 'SELECT id, name, email, phone, city, country, created_at FROM resumes ORDER BY created_at DESC';
    
    db.execute(query, (err, results) => {
        if (err) {
            console.error('Database error: ' + err.message);
            return res.status(500).json({ error: 'Failed to fetch resumes' });
        }
        
        res.json(results);
    });
});

// Get single resume by ID
app.get('/api/resumes/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM resumes WHERE id = ?';
    
    db.execute(query, [id], (err, results) => {
        if (err) {
            console.error('Database error: ' + err.message);
            return res.status(500).json({ error: 'Failed to fetch resume' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        
        res.json(results[0]);
    });
});

// Update resume
app.put('/api/resumes/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, phone, city, country, resume_content, template } = req.body;

    const query = `
        UPDATE resumes 
        SET name = ?, email = ?, phone = ?, city = ?, country = ?, resume_content = ?, template = ?
        WHERE id = ?
    `;

    db.execute(query, [name, email, phone, city, country, resume_content, template, id], 
        (err, results) => {
            if (err) {
                console.error('Database error: ' + err.message);
                return res.status(500).json({ error: 'Failed to update resume' });
            }
            
            res.json({ message: 'Resume updated successfully' });
        });
});

// Delete resume
app.delete('/api/resumes/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM resumes WHERE id = ?';
    
    db.execute(query, [id], (err, results) => {
        if (err) {
            console.error('Database error: ' + err.message);
            return res.status(500).json({ error: 'Failed to delete resume' });
        }
        
        res.json({ message: 'Resume deleted successfully' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});