import React, { useMemo } from "react";

// Lightweight animated robot + tip bubble
export default function RobotMascot({ tips = [] }) {
  const tip = useMemo(() => {
    const defaults = [
      "Try: ‘Gaming laptop under LKR 350,000’",
      "Ask for CPU, RAM, size — I’ll filter",
      "Ex: ‘Thin 14-inch i7 with 16GB RAM’",
      "Need Mac, Windows or Linux? Say it!",
    ];
    const arr = tips.length ? tips : defaults;
    return arr[Math.floor(Math.random() * arr.length)];
  }, [tips]);

  return (
    <div className="robot-hint">
      <div className="robot">
        <div className="antenna" />
        <div className="head">
          <div className="eye left" />
          <div className="eye right" />
          <div className="mouth" />
        </div>
        <div className="body">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
      </div>
      <div className="speech-bubble">
        <strong>Idea:</strong> {tip}
      </div>
    </div>
  );
}

