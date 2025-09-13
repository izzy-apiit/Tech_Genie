// frontend/components/ChatBox.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../App.css";

export default function ChatBox({
  meId,
  otherId,
  bookingId,
  serviceName,
  socket,
}) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!bookingId || !token) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/messages/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch messages", err);
      }
    };

    fetchMessages();
  }, [bookingId, token]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (msg.bookingId === bookingId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on("message:new", handleNewMessage);
    return () => socket.off("message:new", handleNewMessage);
  }, [socket, bookingId]);

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        setImageFile(blob);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() && !imageFile) return;
    if (!token) return alert("You must be logged in to send messages");

    try {
      let data;
      if (imageFile) {
        const formData = new FormData();
        formData.append("bookingId", bookingId);
        formData.append("senderId", meId);
        formData.append("receiverId", otherId);
        formData.append("serviceName", serviceName);
        if (newMsg.trim()) formData.append("message", newMsg);
        formData.append("image", imageFile);

        const res = await axios.post("/api/messages", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
        data = res.data;
      } else {
        const res = await axios.post(
          "/api/messages",
          { bookingId, senderId: meId, receiverId: otherId, message: newMsg },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        data = res.data;
      }

      setNewMsg("");
      setImageFile(null);
    } catch (err) {
      console.error("❌ Failed to send message", err);
      alert("Failed to send message");
    }
  };

  return (
    <div className="chatbox" onPaste={handlePaste}>
      <h3 className="chatbox__title">Chat with {serviceName || "Customer"}</h3>

      <div className="chatbox__messages">
        {messages.length === 0 ? (
          <p className="chatbox__empty">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => {
            const mine = msg.senderId === meId;
            return (
              <div
                key={msg._id}
                className={`chatbox__bubble ${
                  mine ? "chatbox__bubble--me" : "chatbox__bubble--other"
                }`}
              >
                <b>{mine ? "You" : serviceName || "Customer"}:</b> {msg.message}
                {msg.imageUrl && (
                  <div>
                    <img
                      src={`${import.meta.env.VITE_API_URL || "http://localhost:5050"}${msg.imageUrl}`}
                      alt="attachment"
                      className="chatbox__image"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preview for attached image */}
      {imageFile && (
        <div className="chatbox__attachmentPreview">
          <div className="chatbox__attachmentItem">
            <span>📎 {imageFile.name}</span>
            <button
              type="button"
              onClick={() => setImageFile(null)}
              className="chatbox__removeAttachment"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="chatbox__inputRow">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
          className="chatbox__input"
        />

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          id="fileInput"
          style={{ display: "none" }}
          onChange={(e) => setImageFile(e.target.files[0])}
        />

        {/* Custom styled button */}
        <label htmlFor="fileInput" className="chatbox__attachBtn">
          📎 Attach
        </label>

        <button onClick={sendMessage} className="chatbox__sendBtn">
          Send
        </button>
      </div>
    </div>
  );
}
