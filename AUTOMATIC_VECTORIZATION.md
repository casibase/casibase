# Automatic File Vectorization Feature

## Overview

This feature implements automatic vectorization for files uploaded to stores in Casibase. When a user uploads a file, it is automatically vectorized in the background without requiring manual intervention.

## User Experience

### File Upload Flow

1. **Upload File**: User uploads a file via the FileTree component in the Store Edit Page
2. **Immediate Feedback**: User sees the message "File is being embedded"
3. **Status Tracking**: The file shows a status tag indicating the vectorization progress:
   - 🔄 "File is being embedded" (Blue tag - Pending/In Progress)
   - ✅ "Embedding completed" (Green tag - Completed)
   - ❌ "Embedding failed" (Red tag - Failed)
4. **Automatic Update**: Status updates automatically every 5 seconds via polling

## Technical Architecture

### Components

#### 1. FileTask Model (`object/file_task.go`)
- Tracks vectorization status for each file
- Fields:
  - `Owner`: Owner of the store
  - `Name`: Unique identifier for the task
  - `Store`: Store name
  - `FileKey`: Path to the file in storage
  - `FileName`: Name of the file
  - `Status`: Current status (Pending, In Progress, Completed, Failed)
  - `Error`: Error message if failed
  - `CreatedTime`: When the task was created
  - `UpdatedTime`: Last update timestamp

#### 2. Background Worker (`object/file_task_worker.go`)
- Runs every 1 minute via cron scheduler
- Processes up to 10 pending tasks per batch
- Handles vectorization for each file
- Updates status accordingly

#### 3. Vectorization Logic (`object/file_vectorization.go`)
- `VectorizeFile()`: Main function that vectorizes a single file
  - Fetches file from storage
  - Parses text content
  - Splits text into chunks
  - Generates embeddings for each chunk
  - Stores vectors in the database
- `ProcessFileTask()`: Wrapper that updates task status during processing

#### 4. API Endpoints (`controllers/file_task.go`)
- `GET /api/get-file-tasks`: Get all file tasks for a store
- `GET /api/get-file-task`: Get a specific file task
- `GET /api/get-file-task-by-file-key`: Get file task by file key
- `POST /api/update-file-task`: Update a file task
- `POST /api/add-file-task`: Create a new file task
- `POST /api/delete-file-task`: Delete a file task

#### 5. Frontend Integration (`web/src/FileTree.js`)
- Displays status tags next to files
- Polls for status updates every 5 seconds
- Shows "File is being embedded" message on upload
- Uses `FileTaskBackend.js` for API communication

## Configuration

No additional configuration is required. The feature works with existing store settings:
- Uses the store's configured embedding provider
- Uses the store's configured split provider
- Respects the store's storage provider settings

## Error Handling

### Retry Logic
- Retryable errors (timeouts, rate limits) are automatically retried with exponential backoff
- Permanent errors (invalid file format, missing provider) fail immediately

### Status Updates
- All status changes are persisted to the database
- Failed tasks include error messages for debugging
- Tasks can be manually retried by creating a new FileTask

## Monitoring

### Database Queries
```sql
-- Get all pending tasks
SELECT * FROM file_task WHERE status = 'Pending';

-- Get failed tasks
SELECT * FROM file_task WHERE status = 'Failed';

-- Get tasks for a specific store
SELECT * FROM file_task WHERE store = 'store-name';
```

### Logs
The background worker logs:
- Number of tasks being processed
- Success/failure for each task
- Error details for failed tasks

Example log output:
```
Processing 3 pending file tasks
Processing file task: task_abc123 for file: documents/report.pdf in store: my-store
Successfully processed file task: task_abc123
```

## Performance Considerations

### Batch Processing
- Maximum 10 tasks per minute to avoid overloading the system
- 1-second delay between tasks to prevent rate limiting

### Polling Interval
- Frontend polls every 5 seconds
- Minimal impact on server load
- Only active while FileTree is open

### Optimization Tips
1. **Increase batch size**: Modify `GetPendingFileTasks(10)` to process more tasks
2. **Adjust polling frequency**: Change interval in `FileTree.js` componentDidMount
3. **Add task prioritization**: Modify worker to process high-priority tasks first

## Future Enhancements

Potential improvements:
1. WebSocket-based real-time updates instead of polling
2. Task queue with priority levels
3. Parallel processing of multiple files
4. Progress percentage for large files
5. Automatic retry of failed tasks
6. Admin dashboard for monitoring vectorization status
7. Webhook notifications on completion/failure

## Testing

### Unit Tests
Run the FileTask tests:
```bash
go test -v ./object -run TestFileTask
```

### Integration Testing
1. Start the Casibase server
2. Navigate to a store edit page
3. Upload a text file (.txt, .pdf, .docx, etc.)
4. Observe the status tag appears
5. Wait for vectorization to complete
6. Check vectors are created in the database

## Troubleshooting

### File not being vectorized
- Check if embedding provider is configured for the store
- Verify the file format is supported (see `txt.GetSupportedFileTypes()`)
- Check worker logs for errors

### Status not updating
- Verify FileTree component is polling (check browser console)
- Check if background worker is running
- Ensure database connection is stable

### High error rate
- Check embedding provider API limits
- Verify file content is valid
- Review error messages in FileTask table
