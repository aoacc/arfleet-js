const express = require('express');
const app = express();
const port = 3000; // You can change this port number if needed

// Parse mode and submode, use argv
const mode = process.argv[2];
const submode = process.argv[3];

if (mode === 'client' && submode === 'store') {
    return;
}

// Start the server if mode is 'server'
if (mode === 'server') {
    // Middleware to parse JSON requests
    app.use(express.json());

    // Define a simple route
    app.get('/', (req, res) => {
        res.send('Hello from the server!');
    });

    // Start the server
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
} else {
    console.log("Start frontend here!!!");
}

// TODO:
// React
// Bootstrap