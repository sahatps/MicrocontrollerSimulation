import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import TexttoCode from '../../function/TexttoCode';
import './controlbar.css';

export default function ControlBar({ code = '', visible, onTransfer, autoSync, onAutoSyncChange }) {
  const [activeTab, setActiveTab] = useState('code');
  const [serialOutput, setSerialOutput] = useState('');

  const cleanCode = TexttoCode(code);

  const copyCode = async () => {
    await navigator.clipboard.writeText(cleanCode);
  };

  return (
    <div className={`bfarm-controlbar${visible ? '' : ' hidden'}`}>
      {/* Tab bar */}
      <div className="bfarm-tab-bar">
        <button
          className={`bfarm-tab-btn${activeTab === 'code' ? ' active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          Code
        </button>
        <button
          className={`bfarm-tab-btn${activeTab === 'io' ? ' active' : ''}`}
          onClick={() => setActiveTab('io')}
        >
          I/O
        </button>
      </div>

      {/* Code Tab */}
      <div className={`bfarm-tab-panel${activeTab === 'code' ? ' active' : ''}`}>
        <div className="bfarm-code-actions">
          <button className="bfarm-btn-small" onClick={copyCode} title="Copy code">
            <span className="material-symbols-outlined">content_copy</span>
            Copy
          </button>
          <button className="bfarm-btn-small" onClick={onTransfer} title="Transfer code to Circuit">
            <span className="material-symbols-outlined">send</span>
            Transfer to Circuit
          </button>
          <label className="bfarm-autosync-label" title="Auto-sync code to Circuit on every change">
            <input
              type="checkbox"
              checked={!!autoSync}
              onChange={e => onAutoSyncChange && onAutoSyncChange(e.target.checked)}
            />
            Auto-sync
          </label>
        </div>
        <div className="bfarm-code-content">
          <SyntaxHighlighter
            language="cpp"
            style={vscDarkPlus}
            customStyle={{ margin: 0, borderRadius: '5px', fontSize: '12px', height: '100%', overflow: 'auto' }}
            showLineNumbers
          >
            {cleanCode || '// Generate code from blocks...'}
          </SyntaxHighlighter>
        </div>
      </div>

      {/* I/O Tab */}
      <div className={`bfarm-tab-panel${activeTab === 'io' ? ' active' : ''}`}>
        <div className="bfarm-io-section">
          <h4 className="bfarm-io-section-title">Outputs</h4>
          <div className="bfarm-io-empty">
            <span className="material-symbols-outlined">device_hub</span>
            <p>Run via HackCable to see live I/O status</p>
          </div>
        </div>
        <div className="bfarm-io-section">
          <h4 className="bfarm-io-section-title">Inputs</h4>
          <div className="bfarm-io-empty">
            <span className="material-symbols-outlined">sensors</span>
            <p>No active inputs</p>
          </div>
        </div>
        <div className="bfarm-io-section bfarm-serial-section">
          <div className="bfarm-serial-header">
            <span className="bfarm-serial-title">Serial Monitor</span>
            <button className="bfarm-btn-small" onClick={() => setSerialOutput('')}>Clear</button>
          </div>
          <div className="bfarm-serial-output">{serialOutput}</div>
        </div>
      </div>
    </div>
  );
}
