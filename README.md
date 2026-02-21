# 🌌 StellarCube 3D

<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <p><i>A premium, interactive WebGL Rubik's Cube experience built with modern web technologies.</i></p>
</div>

---

## 🚀 Project Overview

**StellarCube** is a high-fidelity 3D Rubik's Cube simulator. It combines precise puzzle mechanics with a cinematic, "Marvel-inspired" aesthetic. The project features smooth physics-based animations, dynamic lighting, and an immersive star-lit environment.

### ✨ Key Features

*   **Dual Interaction Modes**: 
    *   `Layer Move`: Rotate individual slices of the cube for solving.
    *   `Rotate Cube`: Freely rotate the entire cube to view different faces.
*   **Intuitive Controls**: 
    *   Smooth **Orbital Camera** for viewing from any angle.
    *   **View Locking**: Lock the camera position for focused solving.
    *   **Advanced Zooming**: Detailed perspective zoom for precise moves.
*   **Smart Shuffling**: An automated shuffle mechanism with GSAP-powered animations.
*   **Cinematic Design**: Modern UI with glassmorphism effects, floating control bars, and deep-space backgrounds.

---

## 🛠️ Tech Stack

*   **Framework**: [React](https://reactjs.org/)
*   **3D Engine**: [Three.js](https://threejs.org/) via [@react-three/fiber](https://github.com/pmndrs/react-three-fiber)
*   **Utilities**: [@react-three/drei](https://github.com/pmndrs/drei)
*   **Animations**: [GSAP](https://greensock.com/gsap/) (GreenSock Animation Platform)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Build Tool**: [Vite](https://vitejs.dev/)

---

## 🤖 AI Disclosure

This entire project was prototyped, designed, and developed using **Google AI Studio**. Every line of code, styling decision, and 3D logic was generated through AI prompting, showcasing the power of advanced agentic coding.

---

## 💻 Getting Started

Follow these steps to run the experience locally:

### Prerequisites
*   [Node.js](https://nodejs.org/) (LTS recommended)

### Installation

1.  **Clone the Repository** (or download the source):
    ```bash
    git clone https://github.com/YOUR_USERNAME/stellar-cube-3d.git
    cd stellar-cube-3d
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

4.  **Open in Browser**:
    Navigate to `http://localhost:5173` to start solving!

---

## 🎮 Controls

| Key/Action | Function |
| :--- | :--- |
| **`L`** | Toggle View Lock |
| **`+` / `-`** | Zoom In / Out |
| **Drag** | Orbit Camera (when unlocked) |
| **Click** | Interact with Cube (based on Mode) |

---

<p align="center">Made with ✨ and Google AI Studio</p>
