# Jopa Sales Server

A robust Express.js + Prisma + PostgreSQL backend for managing sales, products, and reports.

## Features

- Authentication & Authorization
-  Sales Management
-  Product Management
-  Report Generation
-  User Management (Admin & Record Keepers)
-  Admin Dashboard

## Tech Stack

- Node.js & Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Jest & Supertest for testing

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository:
```sh
git clone <repository-url>
cd jopa-sales-server
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```sh
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
JWT_SECRET="your-secret-key"
```

4. Run database migrations:
```sh
npm run migrate
```

5. Seed the database (optional):
```sh
npm run seed
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## API Endpoints

### Authentication
- `POST /v1/api/auth/admin-login` - Admin login
- `POST /v1/api/auth/record-keepers/login` - Record keeper login

### Products
- `GET /v1/api/products/get-products` - Get all products
- `POST /v1/api/products/create-product` - Create new product
- `PUT /v1/api/products/update-product/:id` - Update product
- `DELETE /v1/api/products/delete-product/:id` - Delete product

### Sales
- `GET /v1/api/sales/get-sales` - Get all sales
- `POST /v1/api/sales/create-sale` - Create new sale
- `GET /v1/api/sales/get-sales-by-user` - Get user-specific sales

### Reports
- `POST /v1/api/reports/generate` - Generate new report
- `GET /v1/api/reports` - Get all reports
- `GET /v1/api/reports/:id` - Get specific report
- `DELETE /v1/api/reports/:id` - Delete report

### Dashboard
- `GET /v1/api/admin-dashboard` - Get admin dashboard data

## Testing

The project uses Jest and Supertest for testing. Run tests with:

```sh
npm test
```

View test coverage with:
```sh
npm run test:coverage
```

## Database Schema

The database includes the following models:
- User (Admin/Record Keeper)
- Product
- Sale
- Report

For detailed schema information, check `prisma/schema.prisma`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

<!-- ## License

This project is licensed under the ISC License. -->