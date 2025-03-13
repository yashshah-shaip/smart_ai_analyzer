import axios from 'axios';
import { spawn } from 'child_process';
import { log } from './vite';
import type { Request, Response } from 'express';

const PYTHON_API_URL = 'http://localhost:5000';
let pythonProcess: ReturnType<typeof spawn> | null = null;

/**
 * Start the Python FastAPI server
 */
export function startPythonServer() {
  // Kill any existing process
  if (pythonProcess) {
    pythonProcess.kill();
  }

  // Start the Python server with environment variables
  log("Starting Python FastAPI server...", "python-bridge");
  
  // Create environment with API keys
  const env = {
    ...process.env,
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    TAVILY_API_KEY: process.env.TAVILY_API_KEY || '',
  };
  
  // Use the simple_financial_api.py instead of api.main:app
  pythonProcess = spawn('python', ['simple_financial_api.py'], { env });

  pythonProcess?.stdout?.on('data', (data) => {
    log(`Python stdout: ${data}`, "python-bridge");
  });

  pythonProcess?.stderr?.on('data', (data) => {
    log(`Python stderr: ${data}`, "python-bridge");
  });

  pythonProcess?.on('close', (code) => {
    log(`Python process exited with code ${code}`, "python-bridge");
  });

  // Return a promise that resolves when the server is ready
  return new Promise<void>((resolve) => {
    const checkServer = async () => {
      try {
        await axios.get(`${PYTHON_API_URL}/health`);
        log("Python FastAPI server is ready", "python-bridge");
        resolve();
      } catch (error) {
        // Retry after a delay
        setTimeout(checkServer, 1000);
      }
    };

    // Start checking
    setTimeout(checkServer, 2000);
  });
}

/**
 * Middleware to proxy API requests to Python server
 */
export function pythonApiProxy(req: Request, res: Response) {
  const path = req.path.replace('/api/python', '');
  const url = `${PYTHON_API_URL}${path}`;
  
  // Forward the request to the Python server
  axios({
    method: req.method,
    url,
    data: req.body,
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Authorization': req.headers.authorization || '',
    },
    params: req.query,
  })
    .then((response) => {
      // Forward the response from the Python server
      res.status(response.status).json(response.data);
    })
    .catch((error) => {
      if (error.response) {
        // Forward the error response from the Python server
        res.status(error.response.status).json(error.response.data);
      } else {
        // Handle network errors
        res.status(500).json({ 
          message: 'Error connecting to Python server', 
          error: error.message 
        });
      }
    });
}

/**
 * Stop the Python server
 */
export function stopPythonServer() {
  if (pythonProcess) {
    log("Stopping Python FastAPI server...", "python-bridge");
    pythonProcess.kill();
    pythonProcess = null;
  }
}

// Ensure the Python server is stopped when the Node process exits
process.on('exit', stopPythonServer);
process.on('SIGINT', () => {
  stopPythonServer();
  process.exit();
});