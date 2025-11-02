import subprocess
import sys
import os
import atexit

# Store the processes to terminate them later
processes = []

def cleanup():
    """Ensure all child processes are terminated on exit."""
    print("Shutting down servers...")
    for p in processes:
        p.terminate()
    print("Servers shut down.")

atexit.register(cleanup)

def run_servers():
    """
    Runs the backend (FastAPI) and frontend (simple HTTP) servers in parallel.
    """
    print("Starting servers...")

    # --- Start Backend Server ---
    try:
        backend_command = [
            sys.executable,  # Use the same python interpreter
            "-m", "uvicorn",
            "api.main:app",
            "--host", "127.0.0.1",
            "--port", "8000",
            "--reload" # Use reload for development
        ]
        print(f"Starting backend with command: {' '.join(backend_command)}")
        backend_process = subprocess.Popen(backend_command)
        processes.append(backend_process)
        print("Backend server started on http://127.0.0.1:8000")
    except Exception as e:
        print(f"Failed to start backend server: {e}")
        sys.exit(1)

    # --- Start Frontend Server ---
    try:
        frontend_command = [
            sys.executable,
            "-m", "http.server",
            "8080"
        ]
        # The CWD needs to be the frontend directory
        frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
        
        print(f"Starting frontend with command: {' '.join(frontend_command)} in '{frontend_dir}'")
        frontend_process = subprocess.Popen(frontend_command, cwd=frontend_dir)
        processes.append(frontend_process)
        print(f"Frontend server started on http://localhost:8080")
    except Exception as e:
        print(f"Failed to start frontend server: {e}")
        sys.exit(1)

    print("\nServers are running in parallel. Press Ctrl+C to stop.")
    
    # Wait for the processes to complete (which they won't, until terminated)
    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    run_servers()
