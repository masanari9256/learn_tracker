# .cursorrules

## Project Overview

*   **Type:** cursorrules_file
*   **Description:** 学生、教育者、自己学習者が日々の学習活動を記録し、その進捗や強み・弱みを視覚的に把握できるウェブベースのプラットフォーム。安全なユーザー認証、マークダウンエディタによるエントリー、リアルタイムダッシュボード、CSVエクスポート、Stripeを用いたサブスクリプション管理など、多角的な機能を提供します。
*   **Primary Goal:** ユーザーが毎日の学習を効率的に記録し、進捗を把握しながら自己改善を促すとともに、分かりやすい分析やAIによる推奨機能で学習体験を最適化する。

## Project Structure

### Framework-Specific Routing

*   **Directory Rules:**

    *   Next.js 14 (App Router): Enforce the use of the `app/` directory with nested route folders for advanced routing. For instance, dynamic routes follow the `app/[route]/page.tsx` conventions.
    *   Example 1: "Next.js 14 (App Router)" → `app/[route]/page.tsx` conventions
    *   Example 2: "Next.js (Pages Router)" → `pages/[route].tsx` pattern (not applicable here)
    *   Example 3: "React Router 6" → `src/routes/` with `createBrowserRouter`

### Core Directories

*   **Versioned Structure:**

    *   app/api: Next.js 14 API routes with built-in Route Handlers for server-side logic.
    *   app/auth: Dedicated folder for authentication pages, including login and registration using Supabase integrations.
    *   app/dashboard: Contains layouts and pages for real-time analytics and the user dashboard.

### Key Files

*   **Stack-Versioned Patterns:**

    *   app/dashboard/layout.tsx: Establishes the root layout for dashboard components in Next.js 14.
    *   app/entry/page.tsx: Implements the markdown-enabled daily learning entry page.
    *   app/auth/login/page.tsx: Manages secure login flows with server actions.

## Tech Stack Rules

*   **Version Enforcement:**

    *   next@14: App Router is required; usage of `pages/` directory and legacy routing methods (like `getInitialProps`) are not permitted.
    *   <typescript@4.x>: Enforce strict typing for project consistency.
    *   <tailwindcss@3.x>: Utilize Tailwind CSS for responsive design and rapid UI development.

## PRD Compliance

*   **Non-Negotiable:**

    *   "StudyTracker Pro is a web-based platform designed for students, educators, and self-learners to record and track their daily learning activities." This mandates secure user authentication, markdown-enabled entries, and real-time dashboards for progress visualization.

## App Flow Integration

*   **Stack-Aligned Flow:**

    *   Example: "Next.js 14 Auth Flow → `app/auth/login/page.tsx` uses server actions to securely manage user authentication and session handling."
