import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./codebox.css";
import TexttoCode from "../../function/TexttoCode";

export default function CodeBox({ code = "", display = true }) {
  const cleanCode = TexttoCode(code);

  const copy = async () => {
    await navigator.clipboard.writeText(cleanCode);
  };

  return (
    <div className="codebox" style={{ display: display ? "block" : "none" }}>
      <button
        onClick={copy}
        style={{
          position: "fixed",
          right: "8%",
          top: "17%",
          background: "#3a3a3a",
          color: "white",
          border: "none",
          padding: "5px 10px",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Copy
      </button>

      <SyntaxHighlighter
        language="cpp"
        style={vscDarkPlus}
        customStyle={{ overflow: "auto", height: "94%" }}
        showLineNumbers
      >
        {cleanCode}
      </SyntaxHighlighter>
    </div>
  );
}
