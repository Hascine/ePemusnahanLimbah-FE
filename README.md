# Waste Management Frontend

Frontend aplikasi web untuk sistem manajemen pemusnahan limbah menggunakan React + Vite + Tailwind CSS.

## Prerequisites

- Node.js (v18 atau lebih tinggi)
- npm atau yarn

## Installation

1. Install dependencies:

```bash
npm install
```

2. Copy dan configure environment variables:

```bash
cp .env.example .env
```

3. Edit file `.env` dengan konfigurasi API endpoint yang sesuai.

## Running the Application

### Development Mode

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173` dengan hot reload.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── api/           # API service functions
├── assets/        # Static assets
├── components/    # Reusable React components
├── constants/     # Application constants
├── contexts/      # React contexts
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── services/      # Business logic services
└── utils/         # Utility functions
```

## Environment Variables

Pastikan file `.env` berisi konfigurasi berikut:

- `VITE_API_BASE_URL`: Base URL untuk backend API (default: http://localhost:3000)
- `VITE_APP_ENV`: Environment (development/production)

## Technologies Used

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - CSS framework
- **Axios** - HTTP client
- **SweetAlert2** - Alert dialogs
- **html2pdf.js** - PDF generation

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
