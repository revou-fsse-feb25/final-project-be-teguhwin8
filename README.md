# DOTS Customer Backend API

A comprehensive fleet management system backend built with NestJS, designed for vehicle tracking, driver management, and real-time device monitoring.

## 🚀 Features

### Core Functionality
- **Vehicle Fleet Management** - Complete CRUD operations for vehicle fleet
- **Device Tracking** - Real-time GPS device monitoring and logging
- **Driver Management** - Driver profiles, assignments, and tracking
- **User Authentication** - JWT-based authentication with role-based access control
- **Real-time Notifications** - OneSignal integration for push notifications
- **Email Services** - Automated email notifications and communication
- **Google Calendar Integration** - Synchronization with Google Calendar for scheduling

### Advanced Features
- **Overspeed Detection** - Automatic monitoring and alerts for speed violations
- **Route Management** - Predefined routes and trip planning
- **Seat Management** - Dynamic vehicle seat configuration
- **Invoice System** - Billing and payment management with Xendit integration
- **Customer Management** - Customer profiles and service management
- **Schedule Management** - Trip scheduling and management
- **Content Management** - Articles, FAQs, banners, and testimonials
- **Multi-language Support** - Translation management system

### Monitoring & Analytics
- **Device Status Monitoring** - Online/Offline/Inactive status tracking
- **Trip Analytics** - Distance tracking and reporting
- **Anomaly Detection** - Device anomaly detection and alerts
- **Performance Metrics** - Vehicle performance and maintenance tracking

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport.js
- **API Documentation**: Swagger/OpenAPI
- **File Upload**: Multer
- **Email**: Nodemailer
- **Push Notifications**: OneSignal
- **Payment Gateway**: Xendit
- **External APIs**: Google Calendar, Google OAuth
- **Communication**: MQTT for device communication
- **Testing**: Jest
- **Containerization**: Docker

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database
- Docker (optional)

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd final-project-be-teguhwin8
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the example environment file and configure your variables:
```bash
cp .env.example .env
```

Configure the following environment variables in `.env`:
```env
PORT=3000
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
SECRET_KEY=your_secret_key
JWT_SECRET=your_jwt_secret
EXPIRED_TOKEN=7d
URL=http://localhost:3000
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_email_password
MAIL_FROM=noreply@example.com
KEYXENDIT=your_xendit_key
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed the database (optional)
npm run prisma:seed
```

### 5. Start the application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## 🐳 Docker Deployment

### Using Docker Compose
```bash
docker-compose up -d
```

This will start the application on port 9000.

## 📚 API Documentation

Once the application is running, you can access the Swagger API documentation at:
```
http://localhost:3000/swagger
```

## 🏗️ Project Structure

```
src/
├── auth/              # Authentication & authorization
├── user/              # User management
├── vehicle/           # Vehicle fleet management
├── device/            # GPS device management
├── device-logs/       # Device tracking logs
├── driver/            # Driver management
├── customer/          # Customer management
├── route/             # Route planning
├── trip/              # Trip management
├── schedule/          # Schedule management
├── overspeed/         # Speed monitoring
├── notifications/     # Push notifications
├── email/             # Email services
├── invoice/           # Billing system
├── order/             # Order management
├── prisma/            # Database service
├── helper/            # Utility functions
├── global/            # Global services
└── validators/        # Input validation
```

## 🔧 Available Scripts

```bash
# Development
npm run dev                    # Start with hot reload
npm run start:debug           # Start with debugger

# Production
npm run build                 # Build for production
npm run start:prod           # Start production server
npm run start:migrate:prod   # Run migrations and start

# Database
npm run prisma:seed          # Seed database with initial data

# Testing
npm run test                 # Run unit tests
npm run test:watch          # Run tests in watch mode
npm run test:cov            # Run tests with coverage
npm run test:e2e           # Run end-to-end tests

# Code Quality
npm run lint               # Lint code
npm run format            # Format code with Prettier
```

## 🔐 Authentication

The API uses JWT-based authentication. To access protected endpoints:

1. Register/Login to get JWT token
2. Include token in Authorization header: `Bearer <token>`

### User Roles
- **Admin**: Full system access
- **Staff**: Limited access to operational features
- **Driver**: Access to driver-specific features
- **Customer**: Access to customer features

## 🚛 Key API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh JWT token

### Vehicle Management
- `GET /vehicle` - List all vehicles
- `POST /vehicle` - Create new vehicle
- `GET /vehicle/:id` - Get vehicle details
- `PUT /vehicle/:id` - Update vehicle
- `DELETE /vehicle/:id` - Delete vehicle

### Device Tracking
- `GET /device` - List all devices
- `POST /device-logs` - Log device data
- `GET /device-logs` - Get device logs
- `GET /device-logs/vehicle` - Get vehicle tracking data

### Driver Management
- `GET /driver` - List all drivers
- `POST /driver` - Create new driver
- `GET /driver/:id` - Get driver details

### Trip Management
- `GET /trip` - List trips
- `POST /trip` - Create trip
- `GET /trip/report` - Trip reports and analytics

## 📊 Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities include:

- **User**: System users with role-based access
- **Vehicle**: Fleet vehicles with device associations
- **Device**: GPS tracking devices
- **DeviceLogs**: Real-time tracking data
- **Driver**: Driver profiles and assignments
- **Customer**: Customer information
- **Trip**: Trip records and analytics
- **Route**: Predefined routes
- **Schedule**: Trip scheduling
- **Overspeed**: Speed violation records

## 🔧 Configuration

### Device Integration
The system supports MQTT communication for real-time device data collection. Configure MQTT settings in your environment.

### External Services
- **OneSignal**: Push notifications
- **Xendit**: Payment processing
- **Google APIs**: Calendar and OAuth integration
- **Email SMTP**: Email notifications

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## 📈 Performance Features

- **Real-time Status Updates**: Automatic online/offline device status detection
- **Efficient Data Processing**: Optimized database queries with pagination
- **Background Jobs**: Asynchronous processing for heavy operations
- **Caching**: Response caching for improved performance

## 🔒 Security Features

- JWT authentication with configurable expiration
- Role-based access control (RBAC)
- Input validation and sanitization
- CORS configuration
- Password hashing with bcrypt
- API rate limiting (configurable)

## 🌍 Deployment

### Production Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Build the application: `npm run build`
4. Run migrations: `npx prisma migrate deploy`
5. Start the server: `npm run start:prod`

### Docker Deployment
Use the provided Dockerfile and docker-compose.yml for containerized deployment.

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Note**: This is a fleet management system designed for transportation companies to track vehicles, manage drivers, and monitor real-time device data. Ensure proper configuration of all external services before deployment.
