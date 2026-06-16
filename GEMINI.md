# HAMS (Hospital Attendance Management System) - Divyam Hospital

## Project Overview
HAMS is a comprehensive Hospital Attendance Management System designed for Divyam Hospital. The project utilizes a dual-frontend architecture with a unified backend, tailored for different user roles (administrators vs. hospital staff).

### Architecture & Tech Stack
*   **Database & Backend:** Supabase (PostgreSQL) paired with Firebase Authentication.
    *   `schema.sql`: Core PostgreSQL database schema definition.
    *   `schema_firebase_rls.sql`: Row Level Security (RLS) rules integrating Firebase JWTs with Supabase.
*   **Admin Panel (`/divyam_admin`):**
    *   **Framework:** Next.js (App Router), React 19.
    *   **Styling & UI:** Tailwind CSS v4, shadcn/ui.
    *   **Data Access:** Prisma ORM, `@supabase/supabase-js`.
    *   **Key Features:** Face recognition (`@vladmandic/face-api`), Maps & Geofencing (`react-leaflet`).
*   **Staff Mobile App (`/divyam_payroll`):**
    *   **Framework:** Flutter (Dart).
    *   **State Management:** Riverpod (`flutter_riverpod`).
    *   **Routing:** GoRouter (`go_router`).
    *   **Networking & Data:** Dio, Hive (local storage), `supabase_flutter`.
    *   **Features:** PDF generation (`pdf`, `printing`), Firebase Auth.

## Directory Structure
*   `divyam_admin/`: Next.js administrative web application.
*   `divyam_payroll/`: Flutter mobile application for staff attendance and payroll.
*   `*.html` & `prdAPI.txt`: Product Requirements Documents (PRDs), API specifications, and prototype mockups.
*   `*.sql`: Supabase database schema and RLS configurations.

## Building and Running

### Admin Panel (Next.js)
1.  Navigate to the admin directory:
    ```bash
    cd divyam_admin
    ```
2.  Install dependencies (if not already installed):
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Access the app at `http://localhost:3000`.

### Staff App (Flutter)
1.  Navigate to the mobile app directory:
    ```bash
    cd divyam_payroll
    ```
2.  Fetch dependencies:
    ```bash
    flutter pub get
    ```
3.  Run the application (requires a connected device or emulator):
    ```bash
    flutter run
    ```

## Development Conventions
*   **Authentication:** The system relies on Firebase Authentication. Custom JWTs from Firebase are verified in Supabase using Row Level Security (RLS) policies (as defined in `schema_firebase_rls.sql`).
*   **API & Specs:** Refer to `prdAPI.txt` and the various `*prd.html` files for detailed business logic, endpoint definitions, and expected application behavior.
*   **Face Recognition:** The Next.js app handles face recognition/registration using `face-api`.
*   **Location Tracking:** Attendance relies heavily on Geofencing, implemented via `react-leaflet` on the web and likely native location services in Flutter.