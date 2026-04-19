# Virtual Drawing 

A real-time virtual drawing application that allows users to draw in the air using hand gestures.

---

## 👥 Team Project

This project was initially developed as a team of three members.
The original implementation used Python and OpenCV for hand tracking.

During development, we identified challenges in deployment and performance.
To address this, the project was later re-engineered using JavaScript and MediaPipe, enabling it to run entirely in the browser without backend dependencies.

---

## Features

* Draw in air using finger tracking
* Real-time hand detection
* Smooth canvas rendering
* Fully browser-based (no Python required)

---

## Tech Stack

* React
* JavaScript
* MediaPipe (Hand Tracking)
* HTML5 Canvas

---

## How It Works

The application uses MediaPipe to detect hand landmarks from the webcam feed.
The position of the index finger is tracked and mapped onto a canvas, allowing users to draw virtually in real time.

---

## Installation

```bash
cd frontend
npm install
npm run dev
```

---

## Current Status

The application currently runs on localhost.
Deployment is planned for future iterations.

---

## Project Evolution

* Initial Version: Python + OpenCV
* Current Version: JavaScript + MediaPipe
* Improvement: Faster performance, easier deployment, no backend required

---

## Future Improvements

* Gesture-based color selection
* Eraser mode
* Save drawings as image
* Multi-hand support
* Cloud deployment

---

##  Author

## 👥 Authors

* Nishad – Frontend development using React, integrated MediaPipe for real-time hand tracking and implemented canvas-based drawing system
* Jaseel – Initial OpenCV-based hand tracking implementation (Python)
* Maqbool Razi – Project support, testing, and UI contributions
