import React from "react";

// Định nghĩa kiểu dữ liệu cho các thuộc tính (props) truyền vào Header
interface HeaderProps {
  inputText: string;
  setInputText: (text: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

const Header: React.FC<HeaderProps> = ({
  inputText,
  setInputText,
  onGenerate,
  loading,
}) => {
  return (
    <div
      style={{
        padding: "20px",
        background: "#ffffff",
        borderBottom: "2px solid #0054a6", // Màu xanh thương hiệu VNPT
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        zIndex: 10,
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h3
          style={{
            color: "#0054a6",
            margin: "0 0 15px 0",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{
              background: "#0054a6",
              color: "white",
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            AI
          </span>
          VNPT SmartFlow AI - Mermaid Edition
        </h3>

        <div style={{ display: "flex", gap: "15px", alignItems: "flex-end" }}>
          <div style={{ flexGrow: 1 }}>
            <label
              style={{
                fontSize: "12px",
                color: "#666",
                marginBottom: "5px",
                display: "block",
              }}
            >
              Nhập quy trình nghiệp vụ (Ví dụ: Bước A đến Bước B...)
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Mô tả quy trình của bạn tại đây..."
              style={{
                width: "100%",
                height: "80px",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #d9d9d9",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "none",
                outline: "none",
                transition: "border-color 0.3s",
              }}
            />
          </div>

          <button
            onClick={onGenerate}
            disabled={loading || !inputText}
            style={{
              height: "80px",
              padding: "0 30px",
              background: loading ? "#bfbfbf" : "#0054a6",
              color: "white",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "16px",
              transition: "all 0.3s",
              boxShadow: "0 2px 0 rgba(0,0,0,0.045)",
            }}
          >
            {loading ? "Đang xử lý..." : "Tạo sơ đồ"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
