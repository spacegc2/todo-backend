    // backend/server.js

    // Import necessary modules
    const express = require('express');
    const bodyParser = require('body-parser');
    const cors = require('cors');
    const fs = require('fs');
    const path = require('path');

    // Initialize the Express application
    const app = express();
    // Use process.env.PORT for Cloud Run compatibility, default to 5000 for local testing
    const PORT = process.env.PORT || 5000;

    // Middleware:
    app.use(cors()); // Allow cross-origin requests
    app.use(bodyParser.json()); // Parse JSON request bodies

    // Define the path to the db.json file within the container
    const dbPath = path.join(__dirname, 'db.json');

    // --- Helper Functions for File Operations ---

    /**
     * Reads the todos from the db.json file.
     * @returns {Array} An array of todo objects.
     */
    const readTodos = () => {
        try {
            // Read the content of db.json synchronously
            // If the file doesn't exist, it will throw an error, which we catch.
            const data = fs.readFileSync(dbPath, 'utf8');
            // Parse the JSON data into a JavaScript array.
            // If the file is empty or invalid JSON, return an empty array.
            return JSON.parse(data || '[]');
        } catch (error) {
            // If file doesn't exist (first run) or parsing error, return empty array
            if (error.code === 'ENOENT') {
                console.log('db.json not found, creating an empty one.');
                writeTodos([]); // Create an empty db.json if it doesn't exist
                return [];
            }
            console.error('Error reading db.json:', error);
            return [];
        }
    };

    /**
     * Writes the given todos array to the db.json file.
     * @param {Array} todos - The array of todo objects to write.
     */
    const writeTodos = (todos) => {
        try {
            // Write the todos array to db.json after converting it to a JSON string
            // The 2 argument makes the JSON output human-readable (indented)
            fs.writeFileSync(dbPath, JSON.stringify(todos, null, 2), 'utf8');
        } catch (error) {
            console.error('Error writing to db.json:', error);
        }
    };

    // --- API Endpoints ---

    /**
     * GET /api/todos
     * Retrieves all todos from the db.json file.
     */
    app.get('/api/todos', (req, res) => {
        const todos = readTodos(); // Read current todos
        res.json(todos); // Send them as a JSON response
    });

    /**
     * POST /api/todos
     * Adds a new todo to the db.json file.
     * Expects a JSON body with a 'text' property: { "text": "New Todo Item" }
     */
    app.post('/api/todos', (req, res) => {
        const todos = readTodos(); // Read current todos
        const { text } = req.body; // Extract 'text' from the request body

        if (!text || text.trim() === '') {
            // Return 400 Bad Request if text is missing or empty
            return res.status(400).json({ message: 'Sorry there, Todo text cannot be empty.' });
        }

        // Create a new todo object with a unique ID, text, and completed status
        const newTodo = {
            id: Date.now().toString(), // Simple unique ID using timestamp
            text: text.trim(), // Trim whitespace from the text
            completed: false,
        };

        todos.push(newTodo); // Add the new todo to the array
        writeTodos(todos); // Write the updated array back to db.json
        res.status(201).json(newTodo); // Respond with the newly created todo and 201 Created status
    });

    /**
     * PUT /api/todos/:id
     * Updates an existing todo's text or completed status.
     * Expects a JSON body with 'text' and/or 'completed' properties.
     */
    app.put('/api/todos/:id', (req, res) => {
        const todos = readTodos(); // Read current todos
        const { id } = req.params; // Get the todo ID from URL parameters
        const { text, completed } = req.body; // Get the updated text and completed status from body

        // Find the index of the todo to update
        const todoIndex = todos.findIndex(todo => todo.id === id);

        if (todoIndex === -1) {
            // If todo not found, return 404 Not Found
            return res.status(404).json({ message: 'Todo not found.' });
        }

        // Update the todo properties
        if (text !== undefined) {
            todos[todoIndex].text = text.trim();
        }
        if (completed !== undefined) {
            todos[todoIndex].completed = completed;
        }

        writeTodos(todos); // Write the updated array back to db.json
        res.json(todos[todoIndex]); // Respond with the updated todo
    });

    /**
     * DELETE /api/todos/:id
     * Deletes a todo from the db.json file.
     */
    app.delete('/api/todos/:id', (req, res) => {
        const todos = readTodos(); // Read current todos
        const { id } = req.params; // Get the todo ID from URL parameters

        // Filter out the todo to be deleted
        const filteredTodos = todos.filter(todo => todo.id !== id);

        if (filteredTodos.length === todos.length) {
            // If no todo was filtered out, it means the ID was not found
            return res.status(404).json({ message: 'Todo not found.' });
        }

        writeTodos(filteredTodos); // Write the updated array back to db.json
        res.status(204).send(); // Respond with 204 No Content for successful deletion
    });

    // Start the server and listen for incoming requests
    app.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
        console.log(`Open your frontend service URL in your browser to access the app.`);
        console.log("WARNING: Data stored in db.json will NOT persist across Cloud Run container restarts or scale-downs.");
    });
    