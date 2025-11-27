import React from "react";

const ProgressCircle = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "20px",
      }}
    >
      <svg width="120" height="120" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="#4F46E5"
          strokeWidth="8"
          fill="none"
          strokeDasharray="282.6"
          strokeDashoffset="70"
        />
      </svg>
    </div>
  );
};

export default ProgressCircle;
