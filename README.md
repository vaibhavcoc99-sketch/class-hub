# 🎓 ClassHub:Smart Classroom Management System

ClassHub is a centralized, modernized web application designed to eliminate the unstructured chaos of traditional classroom communication (like WhatsApp groups). It provides a secure, interactive platform that bridges the gap between students and faculty through robust, dedicated dashboards.

🌐 **Live Demo:** [Hosted on AWS EC2](http://16.171.176.40:5001/)

---

## 📝 How to Sign Up (Testing the Live Demo)

The platform utilizes strict role-based routing and email OTP validation. To test the application, follow these steps to create your account:

### 👨‍🎓 For Students
1. Navigate to the **Sign Up** page on the live demo.
2. Select **Student** as your role.
3. **Email Requirement:** Enter a valid college/university email address (the system validates specific domains ending with `@`).
4. Solve the dynamic Canvas CAPTCHA challenge.
5. Click Sign Up. The system will dispatch a secure OTP to your provided email address.
6. Check your inbox, enter the OTP to verify your identity, and access the Student Dashboard.

### 👨‍🏫 For Faculty
1. Navigate to the **Sign Up** page.
2. Select **Faculty** as your role.
3. Enter your details, select your **Subject Taught**, and input the mandatory **Faculty Authorization Key**: `Classhub@faculty` *(Without this protective key, faculty registration will be blocked).*
4. **Validation:** The system checks your credentials and the authorization key to prevent unauthorized access to instructor privileges.
5. Solve the dynamic Canvas CAPTCHA challenge.
6. Once validated, check your email for the OTP, verify your account, and access the Faculty Dashboard to start managing classes.

---

## ✨ Key Features

### 👨‍🎓 For Students (The Learner's Hub)
* **Track Attendance Analytics:** Visually monitor daily, subject-wise attendance thresholds (e.g., the 75% criteria) with dynamic charts to avoid exam restrictions.
* **Access Live Timetables:** See real-time schedules, room allocations, and instantly check if a class has been suspended.
* **Manage Assignments:** Track deadlines and seamlessly upload assignment submissions (PDFs or links) to an organized digital locker.
* **Stay Informed:** Receive high-priority notifications and broadcast announcements directly on the dashboard and via native email alerts.

### 👨‍🏫 For Faculty (The Instructor's Hub)
* **Mark Digital Attendance:** Effortlessly submit daily logs that instantly sync to student metrics. Includes a "Low Attendance Alert" tool that automatically emails struggling students.
* **Grade Internal Marks:** A dedicated interface to evaluate, record, and manage comprehensive internal assessments, allowing seamless entry of Class Tests (CTs), attendance marks, and assignment scores.
* **Broadcast Announcements:** Publish notices with urgency tags (🚨) and trigger widespread email alerts to the entire class roster with one click.
* **Broadcast Announcements:** Publish notices with urgency tags (🚨) and trigger widespread email alerts to the entire class roster with one click.
* **Control the Schedule:** Suspend classes directly from the live timetable, automatically cascading notification emails to students.
* **Manage Submissions:** Remotely deploy assignments, collect digital submissions cleanly to a local server folder, and easily log internal marks.

---

## 🛠️ Technology Stack

ClassHub is built on an optimized, lightweight MERN-like ecosystem to ensure low overhead and fast routing:

**🎨 Frontend (Client-Side)**
* **Vanilla HTML5 & CSS3:** Custom variables, flexbox, and animations without heavy frameworks.
* **Vanilla JavaScript (ES6+):** Client-side routing, API fetching, and dynamic DOM manipulation.
* **HTML Canvas API:** Dynamically drawn CAPTCHA challenges during sign-up for bot prevention.

**⚙️ Backend (Server-Side)**
* **Node.js & Express.js:** Powerful RESTful API routing architecture (`/api/auth`, `/api/attendance`, etc.).

**🗄️ Database**
* **MongoDB:** Independent NoSQL document database.
* **Mongoose (ODM):** Strict schema structuring and document mapping.

**🛡️ Security & Integrations**
* **JSON Web Tokens (JWT):** Secure, stateless local storage authentication.
* **BcryptJS:** Hashing algorithms for secure password storage.
* **Google OAuth 2.0 API & Nodemailer**: Secure, API-driven email delivery for OTPs, bypassing standard SMTP blocks.
* **Multer:** Middleware for handling `multipart/form-data` and localized server file storage.
* **AWS EC2:** Cloud hosting for scalable and reliable deployment.

---

## 🚀 Installation & Local Setup

If you wish to run this project locally:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/classhub.git](https://github.com/your-username/classhub.git)
   cd classhub
2. **Install dependencies:**
   npm install
3. **Set up environment variables:
   Create a .env file in the root directory and add the following:**
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   # Google OAuth2 Credentials for OTP Delivery
EMAIL=your_authorized_gmail_address
CLIENT_ID=your_google_cloud_client_id
CLIENT_SECRET=your_google_cloud_client_secret
REFRESH_TOKEN=your_oauth_refresh_token
4. **Run the application:**
   npm start
   The server will start on http://localhost:5001.
---
## 🔮 Future Enhancements

* **🤖 AI Grading Agent:** Integration of an AI agent utilizing computer vision to automatically extract and map marks from uploaded     physical grading sheets (like CT papers) directly into the database.

* **💬 Dedicated Messaging Hub:** A built-in, one-on-one communication section using real-time WebSockets (Socket.io) for seamless student-teacher interaction.  

* **📱 Progressive Web App (PWA):** Transitioning the portal into a PWA or dedicated React Native mobile app for cross-platform accessibility.

* **📊 Predictive Analytics:** Advanced tracking to automatically flag at-risk students based on historical attendance drops and missed submissions.
---
## 👥 Team Members
This project was built and developed by:

**VAIBHAV AGARWAL** (2400520100071) 

priyanshu (2400502100058)

Malay Varshney (2400520100049)

Prateek Goyal (2400520100056)

Developed as a Mini Project by students of the Department of Computer Science and Engineering, **Institute of Engineering and Technology, Lucknow**.

---
## 📄 License
This project is officially licensed under the **MIT License**. Check the [LICENSE](LICENSE) file for more information.
