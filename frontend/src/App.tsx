import React, { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import MermaidCanvas from "./components/MermaidCanvas"; // Import component mới

function App() {
  const [inputText, setInputText] = useState("");
  const [chartCode, setChartCode] = useState("");
  const [loading, setLoading] = useState(false);

  const generateDiagram = async () => {
    if (!inputText) return;
    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/generate-flow?text=${encodeURIComponent(inputText)}`,
      );
      const data = await response.json();
      if (data.result === "ERROR") throw new Error(data.message);

      const cleanCode = data.result
        .replace(/```mermaid/g, "")
        .replace(/```/g, "")
        .trim();

      setChartCode(cleanCode);
    } catch (error) {
      alert("Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="App"
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header - Hưng giữ nguyên phần này hoặc tách tiếp nếu muốn */}
      <div
        style={{
          padding: "20px",
          background: "#f0f2f5",
          borderBottom: "1px solid #ddd",
          zIndex: 10,
        }}
      >
        <h3 style={{ color: "#0054a6", margin: "0 0 15px 0" }}>
          VNPT SmartFlow AI
        </h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ flexGrow: 1, height: "60px", padding: "10px" }}
          />
          <button
            onClick={generateDiagram}
            disabled={loading}
            style={{ background: "#0054a6", color: "white", padding: "0 25px" }}
          >
            {loading ? "Đang vẽ..." : "Tạo sơ đồ"}
          </button>
        </div>
      </div>

      {/* Vùng hiển thị sơ đồ - Đã được thay thế bằng Component mới */}
      <div style={{ flexGrow: 1, overflow: "hidden", position: "relative" }}>
        {chartCode ? (
          <MermaidCanvas chartCode={chartCode} />
        ) : (
          <div
            style={{ textAlign: "center", color: "#999", marginTop: "100px" }}
          >
            Nhập quy trình nghiệp vụ VNPT để bắt đầu.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
