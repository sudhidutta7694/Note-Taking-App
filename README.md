Here's your Note Taking App README in a clean, copiable markdown format for GitHub:

```markdown
# 📝 Note Taking App

A modern, secure note-taking web application built with **Next.js**, **Node.js**, and **PostgreSQL**. Features passwordless authentication via email OTP, real-time note management, and a beautiful responsive interface.

## 📖 Introduction

This full-stack application provides a secure and intuitive platform for managing personal notes. Built with modern technologies, it offers passwordless authentication using email OTP verification, ensuring both security and user convenience. The app features a clean, responsive design that works seamlessly across all devices.

## ✨ Features

- **🔐 Passwordless Authentication** - Secure login using email OTP verification
- **📧 Email Integration** - SendGrid-powered email delivery system
- **🔑 JWT Security** - JSON Web Token-based session management
- **📝 Note Management** - Create, read, update, and delete notes
- **📱 Responsive Design** - Mobile-first design with Tailwind CSS
- **⚡ Real-time Updates** - Instant synchronization across devices
- **🎨 Modern UI** - Clean, intuitive user interface
- **🔄 OTP System** - Secure 6-digit verification codes
- **🐳 Docker Support** - Containerized deployment ready
- **☁️ Cloud Ready** - Optimized for Render and Vercel deployment

## 🛠️ Requirements

Before building this project, ensure you have:

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0 or **yarn** >= 1.22.0
- **PostgreSQL** >= 14.0
- **Git** for version control
- **SendGrid Account** for email functionality (free tier available)

Optional:
- **Docker** and **Docker Compose** for containerized development

## 🚀 Installation

### 1. Clone the Repository

```
git clone https://github.com/sudhidutta7694/Note-Taking-App.git
cd Note-Taking-App
```

### 2. Backend Setup

```
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env
```

Configure your `.env` file with the following variables:

```
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/notesdb"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
JWT_EXPIRES_IN="7d"

# SendGrid Email Configuration
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDER="your-verified-email@domain.com"

# Application Configuration
FRONTEND_URL="http://localhost:3000"
PORT=5000
NODE_ENV="development"
```

```
# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### 3. Frontend Setup

```
# Navigate to frontend directory (open new terminal)
cd frontend

# Install dependencies
npm install

# Copy environment variables template
cp .env.local.example .env.local
```

Configure your `.env.local` file:

```
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

## 🏃‍♂️ Development

### Start Development Servers

Backend:
```
cd backend
npm run dev
# Backend will start at: http://localhost:5000
```

Frontend:
```
cd frontend
npm run dev
# Frontend will start at: http://localhost:3000
```

## 🏗️ Production Build

### Backend Build

```
cd backend
npm install
npx prisma generate
npm run build
npm start
```

### Frontend Build

```
cd frontend
npm install
npm run build
npm start
```

## 🐳 Docker Support

### Using Docker Compose

```
# Build using Docker Compose
docker-compose -f backend/docker-compose.dev.yml build

# Or build individual services
cd backend
docker build -t note-app-backend .
```

## 📝 Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Enter your email address to receive an OTP
3. Check your email for the 6-digit verification code
4. Enter the OTP to access your notes
5. Start creating, editing, and managing your notes!

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database powered by [PostgreSQL](https://postgresql.org/)
- Email service by [SendGrid](https://sendgrid.com/)
- ORM by [Prisma](https://prisma.io/)
```
