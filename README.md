# 🌌 StellarCube 3D

<div align="center">
  <img src="video/rubiks_cube_demo_1777497014935.webp" alt="StellarCube 3D Demo" />
  <p><i>A personal project bringing the physical puzzle experience to the digital space.</i></p>
</div>

---

## 🚀 The Story Behind StellarCube

The other day, I was just randomly solving my physical Rubik's cube, and a fun idea hit me: why not build a digital version that lets people solve it interactively right in their browser? 🤔💡

My main goal was to make it feel just like the real thing. I wanted people to be able to play with it, spin it around, and solve it at their own pace, mirroring the exact feeling of having a real cube in your hands! 🧊✨ I've put a ton of thought and energy into bringing this concept to life, diving deep into 3D rendering and interaction logic along the way.

**StellarCube** is the result—a high-fidelity 3D Rubik's Cube simulator. It combines precise puzzle mechanics with a smooth, interactive aesthetic.

### ✨ What makes it cool:

- **See It All**: Rotate the entire cube to look at every single side—just like holding it in real life! 👀
- **Natural Feel**: Click and drag to turn the slices. It's super smooth and responsive for solving. 🔄
- **Auto Shuffle**: Want a challenge? Hit the shuffle button and watch it mix itself up! 🌪️
- **Smart Hints**: Not sure what to do next? A built-in system highlights valid moves to help you out. 🎯
- **Cinematic Vibe**: Features a modern UI with glassmorphism effects and a deep-space background to make solving even more fun. 🌌

---

## 🛠️ Tech Stack

- **Framework**: [React](https://reactjs.org/)
- **3D Engine**: [Three.js](https://threejs.org/) via [@react-three/fiber](https://github.com/pmndrs/react-three-fiber)
- **Utilities**: [@react-three/drei](https://github.com/pmndrs/drei)
- **Animations**: [GSAP](https://greensock.com/gsap/) (GreenSock Animation Platform)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)

---

## 💻 Getting Started

Want to try it out yourself? Follow these steps to run the experience locally:

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)

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
    Navigate to `http://localhost:5173` (or the port Vite provides) to start solving!

---

## 🎮 Controls

| Key/Action       | Function                                      |
| :--------------- | :-------------------------------------------- |
| **`L`**          | Toggle View Lock                              |
| **`+` / `-`**    | Zoom In / Out                                 |
| **Drag**         | Orbit Camera (when unlocked) to see all sides |
| **Click & Drag** | Turn the cube slices                          |

---

<p align="center">Built with passion and a lot of coffee ☕✨</p>
