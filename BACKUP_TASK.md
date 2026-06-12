# 🛠️ Task: Auto Database Backup to Vercel Blob

- [x] **Phase 1: Environment & SDK Setup**
    - [x] Install Vercel Blob: `npm install @vercel/blob`
    - [x] Enable "Blob" in the Vercel Dashboard (Storage tab)
    - [x] Generate a `CRON_SECRET` in Vercel Environment Variables
    - [x] Add `BLOB_READ_WRITE_TOKEN` to local `.env.local` for testing

- [x] **Phase 2: Implement Backup Service**
    - [x] Create `lib/services/backupService.ts`
    - [x] Import `roomService`, `bookingService`, and `settingsService`
    - [x] Create `runBackup()` function:
        - [x] Fetch all data into a JSON object
        - [x] Format filename: `backups/sumotel_db_${new Date().toISOString()}.json`
        - [x] Use `put()` from `@vercel/blob` to upload

- [x] **Phase 3: Create Cron API Route**
    - [x] Create `app/api/cron/backup/route.ts`
    - [x] Implement `GET` handler
    - [x] Add Security Check: Verify `Authorization: Bearer ${process.env.CRON_SECRET}`
    - [x] Call `backupService.runBackup()`
    - [x] Return 200 OK on success

- [x] **Phase 4: Configure Scheduling**
    - [x] Update `vercel.json` with cron schedule:
        ```json
        {
          "crons": [
            {
              "path": "/api/cron/backup",
              "schedule": "0 3 * * *"
            }
          ]
        }
        ```

- [x] **Phase 5: Verification**
    - [x] Push changes to Vercel
    - [x] Manually trigger the cron job from the Vercel Dashboard
    - [x] Confirm the JSON file appears in Vercel Blob storage
