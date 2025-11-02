# Remote OS Patch Scanning

## Overview

Casibase now supports remote OS patch scanning, allowing distributed Casibase instances to execute scans on their local machines and share results through a shared database.

## Architecture

- Each Casibase instance monitors for pending scans targeting its hostname
- When a scan's asset.displayName matches the instance's hostname and state is "Pending", the scan is executed
- Results are saved to the database as they're generated, allowing other instances to view progress
- The web UI can refresh to see the latest results

## How It Works

### 1. Background Worker

The scan worker (`object/scan_worker.go`) runs as a background task that:
- Checks every minute for scans with state "Pending"
- Matches scans to the local hostname via asset.displayName
- Executes matching scans in separate goroutines
- Updates scan state and results in the database

### 2. Scan States

- **Pending**: Scan is waiting to be executed by the appropriate Casibase instance
- **Running**: Scan is currently being executed
- **Completed**: Scan finished successfully
- **Failed**: Scan encountered an error

### 3. Scan Execution Flow

1. User creates a scan object with:
   - Provider: An "OS Patch" scan provider
   - Asset: An asset with displayName matching a machine's hostname
   - State: Set to "Pending"

2. The Casibase instance running on the machine with matching hostname:
   - Detects the pending scan
   - Updates state to "Running"
   - Executes the scan (e.g., listing OS patches)
   - Saves progress/results to scan.resultText
   - Updates state to "Completed" or "Failed"

3. Other Casibase instances (including the one running the web UI):
   - Can query the scan object from the database
   - See the current state and latest results
   - Refresh the UI to see progress updates

## Usage Example

### Setup

1. Deploy Casibase to multiple machines
2. Configure all instances to use the same shared database
3. Create assets for each machine with displayName set to the machine's hostname

### Creating a Remote Scan

1. Create an OS Patch scan provider (if not already exists)
2. Create a scan object with:
   ```json
   {
     "owner": "admin",
     "name": "scan-machine-1",
     "provider": "os-patch-provider",
     "asset": "admin/machine-1",
     "targetMode": "Asset",
     "state": "Pending",
     "command": "available"
   }
   ```
3. The Casibase instance on machine-1 will automatically:
   - Detect the pending scan
   - Execute it locally
   - Save results to the database

### Monitoring Progress

- Refresh the scan edit page to see the latest resultText
- Check the state field to see if the scan is Pending, Running, Completed, or Failed
- View detailed results in the Result text area

## Technical Details

### Concurrency Control

- Active scan tasks are tracked to prevent duplicate execution
- Mutex locks protect shared state
- Database updates use atomic operations

### Error Handling

- Errors during scan execution are captured and saved to the database
- Scan state is updated to "Failed" with error details in resultText
- Scan worker continues processing other scans

### Performance

- Background worker runs every minute
- Only scans with state "Pending" are checked
- Scans are executed in separate goroutines for non-blocking operation
- OS patch scanning can be slow, so results are saved progressively

## Testing

Unit tests are provided in `object/scan_worker_test.go` covering:
- Task activation/deactivation
- Concurrent access to shared state
- Hostname retrieval

Run tests with:
```bash
go test -v ./object -run "TestMarkTaskActive|TestGetCurrentHostname|TestIsTaskActiveConcurrency"
```
