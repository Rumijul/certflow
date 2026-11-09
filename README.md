# CertFlow

> An offline-first, modern web application for batch certificate generation, visual layout positioning, and automated email dispatch with social sharing links.
---

## Key Features

1. **Step 1: Visual Template Positioning**
   - Upload any high-res certificate image (`.png` / `.jpg`).
   - Drag and drop dynamic bounding boxes for `{{Full Name}}` (and custom fields like Date/Event).
   - Real-time controls for Font Style (Serif, Sans, Mono), Color Picker, Base Font Size, and Safe Zone Boundary.
   - Built-in overflow test button for long names.

2. **Step 2: Participant Roster Ingestion**
   - Drag-and-drop support for `.xlsx`, `.xls`, and `.csv`.
   - Heuristic column detector automatically finds participant names and email addresses.
   - 1-click test button for quick demonstrations.

3. **Step 3 & 4: Auto-Shrink Font Engine & Visual Review**
   - High-fidelity vector PDF generation matching the certificate's exact resolution.
   - **Auto-shrink loop:** Dynamically scales down font sizes so 40+ character names never overflow borders.
   - Audit table with approval checkboxes and a real-time vector PDF preview modal.
   - **Offline Mode:** "Download All as ZIP" to export all approved certificates instantly without needing internet or SMTP.

4. **Step 5 & 6: Automated Dispatch & Social Flex**
   - Customizable SMTP settings (compatible with Gmail App Passwords, Outlook, SendGrid, etc.).
   - Dispatches personalized PDF attachments to approved recipients with a live progress bar.
   - Includes one-click "+ Add to LinkedIn Profile" and "Share on X (Twitter)" intent links in the email body.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Rumijul/certflow.git
cd certflow

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## SMTP Setup

1. Click the **Settings** button in the top navigation bar.
2. Enter your SMTP details:
   - **Gmail:** `smtp.gmail.com`, Port `465` (SSL checked), your Gmail address, and a 16-character [Google App Password](https://myaccount.google.com/apppasswords).
3. Click **Test Connection** to verify before dispatching certificates.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS, Lucide Icons
- **PDF Generation:** `pdf-lib`
- **Spreadsheet Parsing:** `xlsx`, `papaparse`
- **Email Delivery:** `nodemailer`
- **Archive Export:** `jszip`, `file-saver`
