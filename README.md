# Smart Tourism Mobile App

A professional, feature-rich mobile application designed to enhance the tourism experience through smart recommendations, location tracking, and personalized itineraries. Built with **Expo** and **React Native**, this app leverages modern mobile technologies to provide a seamless user experience.

## 🚀 Features

*   **Interactive Maps**: Real-time navigation and point-of-interest discovery using `react-native-maps`.
*   **Location Services**: Personalized suggestions based on user location via `expo-location`.
*   **User Authentication**: Secure login and signup flows powered by `firebase`.
*   **Rich Media**: Image capture and upload capabilities using `expo-image-picker`.
*   **Data Visualization**: Insightful charts and analytics with `react-native-chart-kit`.
*   **Modern UI/UX**: Polished interface using `react-native-paper` and `react-native-vector-icons`.
*   **Smooth Navigation**: Intuitive routing with `expo-router`.

## 🛠 Tech Stack

*   **Framework**: [React Native](https://reactnative.dev/) (via [Expo](https://expo.dev/))
*   **Language**: TypeScript
*   **Navigation**: Expo Router (File-based routing)
*   **Backend/Auth**: Firebase
*   **State Management**: React Context & Hooks
*   **Networking**: Axios

## 📂 Project Structure

The project code is located in the `Smart-Tourism-mobile` directory.

```
Smart-Tourism-mobile/
├── app/                 # Main application screens (Expo Router)
├── components/          # Reusable UI components
├── assets/              # Static assets (images, fonts, styles)
├── services/            # API services and Firebase configuration
├── context/             # Global state management context
├── utils/               # Helper functions and utilities
├── constants/           # App constants (Colors, API endpoints)
├── types/               # TypeScript type definitions
└── App.tsx              # Application entry point
```

## 🏁 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

*   **Node.js** (LTS version recommended)
*   **npm** or **yarn**
*   **Expo Go** app on your physical device (Android/iOS) OR an Android Emulator/iOS Simulator.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/KaveenAshara01/Smart-tourism---mobile-app.git
    cd Smart-tourism---mobile-app
    ```

2.  **Navigate to the project directory**:
    ```bash
    cd Smart-Tourism-mobile
    ```

3.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

## 🏃‍♂️ Running the App

Start the development server:

```bash
npx expo start
```

This will display a QR code in the terminal.

*   **Physical Device**: Scan the QR code using the **Expo Go** app (Android) or the Camera app (iOS).
*   **Emulator**: Press `a` for Android Emulator or `i` for iOS Simulator.
*   **Web**: Press `w` to run in the browser.

## 📝 Scripts

*   `npm run start`: Start the Expo development server.
*   `npm run android`: Open directly in Android Emulator.
*   `npm run ios`: Open directly in iOS Simulator.
*   `npm run web`: Open in web browser.

## 🤝 Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.