# Note Taking App

A modern, secure note-taking web application built with Next.js, Node.js, and PostgreSQL. Features passwordless authentication via email OTP and real-time note management.

## Features

- **Passwordless Authentication** - Secure login using email OTP verification
- **Note Management** - Create, read, update, and delete notes
- **Responsive Design** - Mobile-first design with Tailwind CSS
- **Real-time Updates** - Instant synchronization across devices
- **JWT Security** - Token-based session management
- **Docker Support** - Containerized deployment ready

## Requirements

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- SendGrid account for email functionality

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/sudhidutta7694/Note-Taking-App.git
cd Note-Taking-App
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Configure `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/notesdb"
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDER="your-verified-email@domain.com"
FRONTEND_URL="http://localhost:3000"
PORT=5000
```

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Configure `.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

## Development

Start both servers:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

Visit `http://localhost:3000` to use the app.

## Production Deployment

### Backend
```bash
cd backend
npm install
npx prisma generate
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run build
npm start
```

## Usage

1. Navigate to `http://localhost:3000`
2. Enter your email to receive an OTP
3. Enter the 6-digit code from your email
4. Start managing your notes!

## Tech Stack

- **Frontend**: Next.js, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL, Prisma ORM
- **Authentication**: JWT, Email OTP
- **Email**: SendGrid

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request
