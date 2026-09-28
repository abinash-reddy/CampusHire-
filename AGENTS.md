# CampusHire – Project Rules & Development Guidelines

This document defines the strict engineering guidelines and constraints for the **CampusHire** project (BTWA - Backend Technologies for Web Applications). All future code additions, modifications, and refactors must strictly follow these rules.

---

## 1. Technology Stack Constraints

- **Language:** JavaScript (`.js`, `.jsx`) ONLY. **Do NOT use TypeScript.**
- **Frontend Framework:** React with Vite.
- **Frontend Styling:** Tailwind CSS.
- **Backend Runtime & Framework:** Node.js with Express.js.
- **Database & ODM:** MongoDB with Mongoose.
- **API Paradigm:** Standard REST APIs returning consistent JSON payloads.
- **Authentication:** JSON Web Tokens (JWT) stored in HTTP headers (`Authorization: Bearer <token>`).
- **Password Security:** `bcrypt` (or `bcryptjs`) with appropriate salt rounds (e.g., 10).
- **Authorization:** Role-Based Access Control (RBAC) supporting `'student'`, `'tpo'`, and `'admin'`.

---

## 2. Backend Architecture & Code Organization

- **MVC-Service Pattern:** Follow a clean layered separation of concerns:
  - `config/`: Database connection, constants, environment setups.
  - `controllers/`: HTTP request handling, input extraction, and response formatting.
  - `routes/`: Express routers mapping URLs to middlewares and controllers.
  - `models/`: Mongoose schemas with validation and indexes.
  - `middlewares/`: JWT authentication, RBAC authorization, file upload (`multer`), and error handlers.
  - `services/`: Reusable business logic (e.g., `eligibilityService`, `resumeParserService`, `atsScorerService`).
  - `utils/`: Helper utilities and standardized response formatters.
- **Asynchronous Logic:** Always use modern `async/await` syntax. Avoid raw callback pyramids or unhandled promise chains.
- **Input Validation:** Validate all incoming request data (body, query, params) before executing database operations.
- **HTTP Status Codes:** Always return accurate semantic status codes:
  - `200 OK` / `201 Created`
  - `400 Bad Request` (validation failures, invalid input)
  - `401 Unauthorized` (missing or invalid token)
  - `403 Forbidden` (role permission denied)
  - `404 Not Found` (resource not found)
  - `409 Conflict` (duplicate entries like email, roll number, or application)
  - `500 Internal Server Error` (unhandled server errors)
- **Centralized Error Handling:**
  - Route handlers should pass unexpected errors to `next(err)`.
  - Use a centralized error-handling middleware to sanitize and format error responses.

---

## 3. Security & Environment Configuration

- **Secrets Management:** Use environment variables (`.env` file) for all sensitive values:
  - `PORT`
  - `MONGO_URI`
  - `JWT_SECRET` & `JWT_EXPIRES_IN`
  - File upload paths
- **No Hardcoding:** **NEVER** hardcode database URIs, passwords, or JWT secrets in repository files. Provide a `.env.example` template with dummy keys.
- **Data Protection:** Exclude user password hashes by default in Mongoose queries (`select: false`).

---

## 4. Scope & Academic Alignment (BTWA)

- **College-Appropriate Scope:** Keep the architecture suitable for a college-level BTWA project.
- **Avoid Over-Engineering:** Do not introduce unnecessary dependencies or enterprise microservices (e.g., Kafka, Redis, Docker clusters, external AI SaaS) unless explicitly requested.
- **No Unrequested Features:** Implement strictly what is planned and required for CampusHire.

---

## 5. Code Quality & Modularity

- **Readability:** Write clean, self-documenting, and easily understandable code suited for academic review and viva presentations.
- **Comments:** Add comments only where logic is non-obvious (e.g., ATS scoring formula, eligibility condition rules). Avoid trivial boilerplate comments.
- **Preservation of Existing Code:** Do not modify unrelated files or overwrite established functionality without clear cause.
- **Verification Requirement:** After every major feature or module implementation, run build checks, syntax checks, or route verification to ensure zero errors before proceeding.
