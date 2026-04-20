# 🎓 ClassHub

**ClassHub** is a comprehensive classroom management platform designed to eliminate the chaos of WhatsApp groups. It seamlessly centralizes interaction between students and faculty by combining announcements, assignments, live timetables, and real-time attendance analytics securely into one modern portal.

---

## ✨ Features

### For Students:
- **Instant Announcements:** View priority announcements exactly when faculty push them (via dashboard & email).
- **Assignment Submission:** Track deadlines and effortlessly upload files securely for grading.
- **Attendance Analytics:** Keep an eye on your subject-wise attendance thresholds visually right on the dashboard.
- **Live Timetable:** Always know exactly which class is next, including room numbers and last-minute suspension notifications.

### For Faculty:
- **Class Broadcasting:** Push real-time announcements with custom priority labels that hit student inboxes and dashboards simultaneously.
- **Assignment Management:** Distribute material and conveniently retrieve student PDF/link submissions.
- **Daily Attendance Marking:** Quickly record student attendance and natively dispatch low-attendance warning emails.
- **Secure Registration:** A built-in "Protective Key" restricts unauthenticated faculty from creating illicit profiles.

---

## 🛠️ Technology Stack

This application emphasizes performance and simplicity by avoiding heavy UI frameworks and adopting a streamlined JS architecture:

**Frontend**
*   Vanilla **HTML5 / CSS3** (No Tailwind/Bootstrap — 100% custom styling variables)
*   Vanilla **JavaScript** (ES6+) for DOM manipulation, Auth UI handling, and REST fetching
*   **HTML Canvas API** for custom built-in signup CAPTCHA

**Backend**
*   **Node.js & Express.js**
*   **MongoDB & Mongoose** (ODM models and pre-save `bcrypt` hash hooks)
*   **JSON Web Tokens (JWT)** for robust state authorization
*   **Nodemailer** for fully integrated SMTP operations (OTP verifications, broadcasts, attendance alerts)
*   **Multer** for localized file processing

---

## 🚀 Running Locally

Follow these instructions to safely deploy ClassHub to your local development environment.

### 1. Prerequisites
- [Node.js](https://nodejs.org) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas URI)

### 2. Installation Setup
Clone the GitHub repository and install the backend modules:
```bash
git clone https://github.com/vaibhavcoc99-sketch/class-hub.git
cd class-hub/backend
npm install
```

### 3. Environment Config (`.env`)
Inside the `backend/` folder, create a `.env` file with the following variables:
```env
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/classhub
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your_verified_gmail@gmail.com
EMAIL_PASS=your_google_app_password
```

### 4. Boot up Server
Start the Express server:
```bash
npm start
# or node server.js
```

### 5. Access the Frontend
Since the Express application binds the `frontend` folder statically, you can safely navigate to:
```
http://localhost:5001/
```

**Security Note:** When registering an account through the frontend as *Faculty*, you will be prompted for an internal protective key. The default demo key is configured natively as: `Classhub@faculty`

---

## 📄 License
This project is officially licensed under the **MIT License**. Check the [LICENSE](LICENSE) file for more information.
