# Kruakoonpim Manager

Kruakoonpim Manager is a restaurant order management application designed to streamline the process of handling orders, including bulk order creation via image uploads. The app leverages Google Gemini/Vertex AI for intelligent image processing and order extraction.

## Features

- **Order Management:** Create, update, and track restaurant orders efficiently.
- **Bulk Order Upload:** Upload images (e.g., handwritten order slips or printed receipts) to add multiple orders at once.
- **AI Integration:** Utilizes Google Gemini/Vertex AI to extract order data from uploaded images.
- **Secure Authentication:** Passcode and internal API key protection.
- **Database Support:** Uses PostgreSQL for data storage.

## Getting Started

### Prerequisites

- Node.js (version as required by your project)
- PostgreSQL database
- Google Cloud account (for Gemini/Vertex AI access)
- API keys for Gemini/Vertex AI

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/yourusername/kruakoonpim-manager.git
   cd kruakoonpim-manager
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in the required values.
   - Set your database URL, Gemini/Vertex AI API key, and other configuration options.

4. **Run database migrations (if applicable):**

   ```sh
   npm run migrate
   ```

5. **Start the application:**
   ```sh
   npm start
   ```

## Usage

- Access the web interface to manage orders.
- Use the bulk upload feature to add orders by uploading images.
- The app will process the images using Gemini/Vertex AI and extract order details automatically.

## Environment Variables

Key variables in `.env`:

- `DATABASE_URL` – PostgreSQL connection string
- `GEMINI_API_KEY` – API key for Google Gemini
- `GOOGLE_GENAI_MODEL` – Model name (e.g., `gemini-3.1-pro-preview`)
- `LOGIN_PASSCODE` – Passcode for login
- `INTERNAL_API_KEY` – Internal API key for secure endpoints

## License

This project is licensed under the MIT License.

---

**Note:** Ensure you comply with Google Cloud and Gemini/Vertex AI usage policies and secure your API keys.
