import React, { useRef, useState, useEffect } from 'react';
import './ConfigScreen.css';

export default function ConfigScreen() {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [differences, setDifferences] = useState([]);
  const [previewDiff, setPreviewDiff] = useState(null);
  const [manualDiff, setManualDiff] = useState({ x: '', y: '', width: '', height: '' });
  const canvasRef = useRef([]);

  const handleImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      index === 0 ? setImage1(url) : setImage2(url);
    }
  };

  useEffect(() => {
    if (image1) drawInitialImage(image1, 0);
    if (image2) drawInitialImage(image2, 1);
  }, [image1, image2, differences, previewDiff]);

  const handleCanvasClick = (e, index) => {
    const canvas = canvasRef.current[index];
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const size = 40;
    const newDiff = { x, y, width: size, height: size };
    setDifferences(prev => [...prev, newDiff]);
  };

  const handleManualPreview = () => {
    const { x, y, width, height } = manualDiff;
    if (x && y && width && height) {
      const newPreview = {
        x: parseInt(x),
        y: parseInt(y),
        width: parseInt(width),
        height: parseInt(height)
      };
      setPreviewDiff(newPreview);
    }
  };

  const handleManualConfirm = () => {
    if (previewDiff) {
      setDifferences(prev => [...prev, previewDiff]);
      setPreviewDiff(null);
      setManualDiff({ x: '', y: '', width: '', height: '' });
    }
  };

  const drawInitialImage = (src, index) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = canvasRef.current[index];
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      differences.forEach(diff => drawBox(index, diff.x, diff.y, diff.width, diff.height, 'red'));

      if (previewDiff) {
        drawBox(index, previewDiff.x, previewDiff.y, previewDiff.width, previewDiff.height, 'yellow');
      }
    };
  };

  const drawBox = (index, x, y, width, height, color = 'red') => {
    const canvas = canvasRef.current[index];
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
  };

  const handleExport = () => {
    const jsonConfig = {
      gameTitle: 'Spot the Difference - Custom Game',
      images: {
        image1,
        image2,
      },
      differences,
    };
    const blob = new Blob([JSON.stringify(jsonConfig, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'game-config.json';
    a.click();
  };

  return (
    <div className="config-container">
      <h2 className="config-title"> Game Configuration</h2>

      <div className="image-upload-section">
  <div className="upload-box">
    <label>Image 1:</label>
    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 0)} />
  </div>
  <div className="upload-box">
    <label>Image 2:</label>
    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 1)} />
  </div>
</div>


      <div className="image-preview-grid">
        {[image1, image2].map((src, index) => (
          src ? (
            <div className="preview-wrapper" key={index}>
              <canvas
                ref={el => canvasRef.current[index] = el}
                width={400}
                height={300}
                onClick={(e) => handleCanvasClick(e, index)}
              />
            </div>
          ) : null
        ))}
      </div>

      <div className="coord-list">
        <h4> Confirmed Differences: {differences.length}</h4>
        <pre>{JSON.stringify(differences, null, 2)}</pre>
      </div>

      <div className="manual-entry">
        <h4> Add Manual Difference</h4>
        <div className="manual-fields">
          <input type="number" placeholder="x" value={manualDiff.x} onChange={e => setManualDiff({ ...manualDiff, x: e.target.value })} />
          <input type="number" placeholder="y" value={manualDiff.y} onChange={e => setManualDiff({ ...manualDiff, y: e.target.value })} />
          <input type="number" placeholder="width" value={manualDiff.width} onChange={e => setManualDiff({ ...manualDiff, width: e.target.value })} />
          <input type="number" placeholder="height" value={manualDiff.height} onChange={e => setManualDiff({ ...manualDiff, height: e.target.value })} />
          <button onClick={handleManualPreview}>👁️Preview</button>
          <button onClick={handleManualConfirm} disabled={!previewDiff}>Confirm</button>
        </div>
      </div>

      <div className="buttons">
        <button onClick={handleExport}>📥 Export JSON</button>
      </div>
    </div>
  );
}