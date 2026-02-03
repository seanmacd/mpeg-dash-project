## Course Project for CSCI 3421 Data Communication and Networking

Tasked with conceptualizing and executing a semester-long project relating to the field of Data Communication and Networking, including a proposal, research, project, and final report. 

### MPEG-DASH Implementation in Web Applications

This project implements an end-to-end **MPEG-DASH** (Dynamic Adaptive Streaming over HTTP) workflow. It provides a complete pipeline for uploading raw video files, encoding them into multiple bitrates/resolutions, and delivering them via an Adaptive Bitrate (ABR) streaming player.



### 🚀 Key Features
* **Adaptive Bitrate Streaming**: Automatically scales video quality (180p to 1080p) based on real-time network throughput, latency, and buffer.
* **Automated Encoding Pipeline**: Uses **FFMPEG** to process user-uploaded videos into nine distinct resolutions and bitrates.
* **Dynamic Manifest Generation**: Generates `.mpd` (Media Presentation Description) files and `.m4s` segments.
* **Performance Dashboard**: Integrated monitoring for playback quality, dropped frames, and buffer lengths using custom React hooks.
* **Secure Deployment**: Hosted via Docker Compose on an Ubuntu server, utilizing a **Cloudflare Zero Trust** tunnel for secure remote access.

### 🛠️ Tech Stack
* **Frontend**: TypeScript, React, Mantine UI, Dash.js
* **Backend**: TypeScript, Express, FFMPEG
* **Infrastructure**: Docker, Ubuntu, Cloudflare Tunnel
* **CI/CD**: GitHub Actions

### ⚙️ How it Works
1. **Upload**: Users upload a video file via the React frontend.
2. **Transcoding**: The Express backend spawns a child process to run FFMPEG, which handles audio extraction and video chunking into 4-second segments.
3. **DASH Formatting**: The system generates a manifest file that points to the various encoded qualities.
4. **Playback**: The **Dash.js** library in the frontend parses the manifest and selects the optimal segment for the user's current bandwidth.

---
