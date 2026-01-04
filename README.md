# 📚 KlassFlow

> **Open-source classroom management platform for training centers**  
> Built with Next.js 14, TypeScript, Prisma, and PostgreSQL

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.0+-2D3748)](https://www.prisma.io/)

## ✨ Features

### 🎓 Core Functionality
- **Multi-tenant Organizations**: Isolated data per training center
- **Classroom Management**: Create and manage training classes
- **Session Scheduling**: Plan online and on-site sessions
- **Student Enrollment**: Track student-classroom relationships
- **Role-based Access**: Admin, Teacher, and Student roles
- **Multilingual Support**: English, French, Spanish, German, Russian, Ukrainian

### 📝 Attendance & Signatures
- **Digital Signatures**: Touch/mouse-enabled signature canvas
- **Secure Tokens**: Time-limited, single-use signature links
- **Attendance Tracking**: Present/Absent/Unsigned status
- **Real-time Updates**: Live presence tracking for teachers
- **Student Dashboard Notification**: Alerts for pending signatures


### 📧 Email Notifications
- **Reminder Emails**: Configurable reminders (24h before by default)
- **Signature Emails**: Automated signature requests for on-site sessions
- **HTML Templates**: Professional, branded email templates
- **SMTP Configuration**: Bring your own email server

### 📁 Document Storage
- **File Upload**: PDF, images, documents (max 10MB)
- **External Links**: Share online resources
- **Local Storage**: Files stored on server
- **Organization Scoped**: Secure, isolated access

### 🔐 Authentication

- **Dev Login**: Development mode bypass
- **Session Management**: Secure, HTTP-only cookies
- **Auth.js (NextAuth v5)**: Industry-standard authentication

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/JobsAround/klassflow.git
cd open-classroom

# Install dependencies
npm install

# Start PostgreSQL
docker-compose up -d db

# Setup database
npx prisma migrate dev

# Start development server
npm run dev
```

Visit http://localhost:3000 and click **"🔧 Dev Login"** to get started!

## 📧 Email Testing with MailPit

MailPit is included for testing email functionality in development. It catches all outgoing emails and provides a web interface to view them.

### Start MailPit

```bash
# Start MailPit service
docker-compose up -d mailpit

# MailPit will be available at:
# - Web UI: http://localhost:8025
# - SMTP: localhost:1025
```

### How It Works

- **In Development**: Emails automatically use MailPit (localhost:1025) when no SMTP is configured
- **In Production**: Configure SMTP in Settings page for real email delivery
- **No Configuration Needed**: Works out of the box in dev mode

### Testing Email Features

1. **User Invitations**: Invite a user → Check MailPit UI for welcome email
2. **Session Reminders**: Create a session → Reminder emails appear in MailPit
3. **Signature Requests**: Session starts → Signature emails visible in MailPit

### MailPit Features

- 📬 View all sent emails in a modern UI
- 🔍 Search and filter messages
- 📎 Preview HTML and attachments
- 🔄 API access for automation
- 💾 Stores up to 500 messages

## 🐳 Docker Deployment

### Quick Deploy

```bash
# Configure environment
cp .env.example .env
nano .env  # Edit your secrets

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@db:5432/openclassroom

# Auth
AUTH_SECRET=$(openssl rand -base64 32)
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Usage Limits (Optional)

For SaaS/commercial deployments, you can configure usage limits via environment variables. **If not configured, the app runs with no limits (self-hosted mode).**

```bash
# Resource limits (0 or unset = unlimited)
MAX_ADMINS=3
MAX_TEACHERS=10
MAX_STUDENTS=100
MAX_CLASSROOMS=50
MAX_SESSIONS_PER_MONTH=200

# Upgrade URL (optional - shows "Upgrade" link when limits reached)
# Upgrade URL (optional - shows "Upgrade" link when limits reached)
```

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_ADMINS` | Max administrators per organization | Unlimited |
| `MAX_TEACHERS` | Max teachers per organization | Unlimited |
| `MAX_STUDENTS` | Max students per organization | Unlimited |
| `MAX_CLASSROOMS` | Max classrooms per organization | Unlimited |
| `MAX_SESSIONS_PER_MONTH` | Max sessions created per month | Unlimited |

See [Deployment Guide](docs/deployment-guide.md) for detailed instructions.

## 📖 Documentation

### User Guides
- [Getting Started](docs/getting-started.md)



### Technical Documentation
- [Architecture Overview](docs/architecture.md)

- [Deployment Guide](docs/deployment-guide.md)

## 🏗️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first CSS
- **Shadcn/ui**: Beautiful UI components
- **Radix UI**: Accessible primitives

### Backend
- **Next.js API Routes**: Serverless functions
- **Prisma ORM**: Type-safe database client
- **PostgreSQL**: Relational database
- **Auth.js**: Authentication framework

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Node-cron**: Scheduled tasks
- **Nodemailer**: Email sending

### External Services

- **SMTP Server**: Email delivery

## 📁 Project Structure

```
open-classroom/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration history
│   └── config.ts              # Prisma configuration
├── src/
│   ├── app/
│   │   ├── (auth)/            # Auth pages
│   │   ├── dashboard/         # Protected pages
│   │   ├── signature/         # Public signature page
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── auth/              # Auth components
│   │   ├── signature/         # Signature canvas
│   │   └── ui/                # Shadcn components
│   ├── lib/
│   │   ├── prisma.ts          # Database client
│   │   ├── email.ts           # Email service
│   │   ├── cron.ts            # Scheduled jobs

│   └── auth.ts                # Auth configuration
├── public/
│   └── uploads/               # User-uploaded files
├── Dockerfile                 # Production build
├── docker-compose.yml         # Local development
└── package.json
```

## 🔧 Development

### Database Management

```bash
# Create migration
npx prisma migrate dev --name description

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## 🧪 Testing

### Manual Testing
1. Use Dev Login for quick access
2. Create test classroom
3. Schedule test session
4. Upload test document
5. Generate signature token



## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the GNU Affero General Public License v3.0 - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Authentication by [Auth.js](https://authjs.dev/)

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/JobsAround/klassflow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/JobsAround/klassflow/discussions)
- **Email**: dev@jobsaround.fr

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [x] Multi-language support
- [ ] Supabase Storage integration
- [ ] AWS S3 storage adapter
- [ ] Automated testing suite
- [ ] API documentation (Swagger)
- [ ] QR code for signature on tablet in the classroom
- [ ] IP Address tracking for security

---

**Made with ❤️ for training centers worldwide**
