# DocAI Frontend

This is the frontend for the DocAI application, which allows users to upload documents, process them using AI, and manage their data securely. The frontend is built using React and Material-UI.

## Features

- User Authentication (Sign Up, Sign In) using Firebase.
- Upload documents in PDF, DOCX, and XLSX formats.
- Extract and display document content.
- Send documents and prompts to integrated AI services (OpenAI, Claude AI).
- Manage uploaded documents (view, delete).
- Secure data access with Firebase Authentication.

## Getting Started

### Prerequisites

- Node.js and npm installed on your local machine.
- A Firebase project with Authentication enabled.
- OpenAI and Claude AI API keys if you plan to use these services.

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/Jitesh17/DocAI-frontend.git
    cd DocAI-frontend
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory with your environment variables:
    ```bash
    REACT_APP_API_BASE_URL=http://localhost:5000 # or your hosted backend URL
    REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
    REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
    REACT_APP_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
    REACT_APP_FIREBASE_APP_ID=your-firebase-app-id
    ```

4. Start the development server:
    ```bash
    npm start
    ```

## Usage

- Sign up or sign in using your email and password.
- Upload documents and manage them securely.
- Send prompts and document contents to the AI services for processing.
- View AI-generated responses.

## Deployment

This project is set up to deploy automatically on Netlify. To deploy manually:

1. Push your changes to GitHub.
2. Connect the GitHub repository to Netlify and trigger a deploy.

## License

This project is licensed under the [Creative Commons Non-Commercial License](https://creativecommons.org/licenses/by-nc/4.0/). You are free to use, modify, and distribute the code for non-commercial purposes, provided that you give appropriate credit.

## Acknowledgements

- React
- Material-UI
- Firebase Authentication
- OpenAI and Claude AI APIs

