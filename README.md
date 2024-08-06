# Eventhand-Chat

This repository serves as the WebSocket server for our CAPSTONE project, Eventhand, an event vendor booking application. This repository houses the WebSocket server for Eventhand's chat feature.

## Overview

Eventhand is designed to facilitate seamless event vendor booking. The chat feature allows users and vendors to communicate in real-time, enhancing the booking and coordination experience. This repository implements the WebSocket server responsible for managing these real-time communications.

## Tools

- **Node.js**: JavaScript runtime built on Chrome's V8 JavaScript engine.
- **MongoDB Driver**: Official MongoDB driver for Node.js, enabling connection to and interaction with MongoDB databases.
- **ws Library**: A simple WebSocket library for Node.js.
- **MongoDB**: A NoSQL database used for storing chat messages and user data.

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/eventhand-chat.git
   cd eventhand-chat

2. **Install dependencies**:
    ```bash
    pnpm install

3. **Set up environment variables**:
   ```bash
    PORT=YOUR_PORT
    MONGODB_CONNECTION_URI=YOUR_MONGODB_CONNECTION_URI
    CLERK_JWT_KEY=YOUR_CLERK_JWT_KEY
    CLERK_SECRET_KEY=YOUR_CLERK_SECRET_KEY
    CHAT_SOCKET_URL=YOUR_CHAT_SOCKET_UR

4. **Start Server**:
   ```bash
    pnpm dev

## Usage

Once the server is running, it will listen for WebSocket connections on the specified port. Clients can connect to the WebSocket server to send and receive chat messages in real-time.    

