import { io } from "socket.io-client";

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    const url = import.meta.env.VITE_API_URL || window.location.origin;
    socketInstance = io(url, {
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socketInstance;
};
