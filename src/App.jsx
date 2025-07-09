import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import './ConfigScreen.css';


const CONFIG_URL = '/game-config.json';
const SOUND_URL = '/success.mp3';

export default function App() {
  const [view, setView] = useState('game'); // 'game' or 'config'

  // Game state
  const [config, setConfig] = useState(null);
  const [foundDiffs, setFoundDiffs] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const imageRef = useRef([]);
  const successSound = useRef(null);

  // Config state
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [differences, setDifferences] = useState([]);
  const [previewDiff, setPreviewDiff] = useState(null);
  const [manualDiff, setManualDiff] = useState({ x: '', y: '', width: '', height: '' });
  const canvasRef = useRef([]);

  // ---------- Game View Effects ----------
  useEffect(() => {
    if (view === 'game') {
      fetch(CONFIG_URL)
        .then(res => res.json())
        .then(data => {
          setConfig(data);
          setStartTime(Date.now());
          successSound.current = new Audio(SOUND_URL);
          successSound.current.load();
        });
    }
  }, [view]);

  useEffect(() => {
    if (startTime && !endTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, endTime]);

  const handleImageClick = (e, imgIndex) => {
    if (!config || endTime) return;
    const img = imageRef.current[imgIndex];
    const rect = img.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    const realX = clickX * scaleX;
    const realY = clickY * scaleY;

    config.differences.forEach((diff, index) => {
      if (!foundDiffs.includes(index)) {
        const inX = realX >= diff.x && realX <= diff.x + diff.width;
        const inY = realY >= diff.y && realY <= diff.y + diff.height;
        if (inX && inY) {
          successSound.current?.play();
          setFoundDiffs(prev => {
            const updated = [...prev, index];
            if (updated.length === config.differences.length) {
              setEndTime(Date.now());
              setShowModal(true);
            }
            return updated;
          });
        }
      }
    });
  };

  // ---------- Config View ----------
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

  const drawInitialImage = (src, index) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = canvasRef.current[index];
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      differences.forEach(d => drawBox(index, d.x, d.y, d.width, d.height, 'red'));
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

  const handleCanvasClick = (e, index) => {
    const canvas = canvasRef.current[index];
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const size = 40;
    setDifferences(prev => [...prev, { x, y, width: size, height: size }]);
  };

  const handleManualPreview = () => {
    const { x, y, width, height } = manualDiff;
    if (x && y && width && height) {
      setPreviewDiff({
        x: parseInt(x),
        y: parseInt(y),
        width: parseInt(width),
        height: parseInt(height)
      });
    }
  };

  const handleManualConfirm = () => {
    if (previewDiff) {
      setDifferences(prev => [...prev, previewDiff]);
      setPreviewDiff(null);
      setManualDiff({ x: '', y: '', width: '', height: '' });
    }
  };

  const handleExport = () => {
    const jsonConfig = {
      gameTitle: 'Spot the Difference - Custom Game',
      images: { image1, image2 },
      differences,
    };
    const blob = new Blob([JSON.stringify(jsonConfig, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'game-config.json';
    a.click();
  };

  return (
    <div className="game-container">
      <button onClick={() => setView(view === 'game' ? 'config' : 'game')} className="mode-toggle">
        {view === 'game' ? '🛠 Config Mode' : '🎮 Play Game'}
      </button>

      {view === 'game' ? (
        config ? (
          <>
            <h1>{config.gameTitle}</h1>
            <div className="images">
              {[0, 1].map(i => (
                <div key={i} className="image-wrapper">
                  <img
                    ref={el => imageRef.current[i] = el}
                    src={i === 0 ? config.images.image1 : config.images.image2}
                    onClick={e => handleImageClick(e, i)}
                    alt={`Image ${i + 1}`}
                    className="game-image"
                  />
                  {foundDiffs.map(index => {
                    const diff = config.differences[index];
                    const img = imageRef.current[i];
                    if (!img) return null;

                    const scaleX = img.width / img.naturalWidth;
                    const scaleY = img.height / img.naturalHeight;

                    return (
                      <div
                        key={`highlight-${i}-${index}`}
                        className="highlight"
                        style={{
                          left: `${diff.x * scaleX}px`,
                          top: `${diff.y * scaleY}px`,
                          width: `${diff.width * scaleX}px`,
                          height: `${diff.height * scaleY}px`,
                          borderColor: 'lime',
                          boxShadow: '0 0 10px lime',
                        }}
                      ></div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="info">
              <p>⏳ Time: {elapsedTime} seconds</p>
              <p>Found {foundDiffs.length} / {config.differences.length} differences</p>
              <button onClick={() => window.location.reload()} className="restart-button">🔁 Restart</button>
            </div>

            {showModal && (
              <div className="modal">
                <div className="modal-content">
                  <h2>🎉 Game Completed!</h2>
                  <p>You found all differences in {elapsedTime} seconds!</p>
                  <button onClick={() => window.location.reload()} className="restart-button">
                    🔁 Play Again
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p>Loading game...</p>
        )
      ) : (
        <div className="config-container">
          <h2>🛠 Configure Game</h2>
          <div className="image-upload-section">
            <div className="upload-box">
              <label>Image 1:</label>
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 0)} />
            </div>
            <div className="upload-box">
              <label>Image 2:</label>
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 1)} />
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
                    onClick={e => handleCanvasClick(e, index)}
                  />
                </div>
              ) : null
            ))}
          </div>

          <div className="coord-list">
            <h4>Confirmed Differences: {differences.length}</h4>
            <pre>{JSON.stringify(differences, null, 2)}</pre>
          </div>

          <div className="manual-entry">
            <h4>Add Manual Difference</h4>
            <div className="manual-fields">
              {['x', 'y', 'width', 'height'].map(field => (
                <input
                  key={field}
                  type="number"
                  placeholder={field}
                  value={manualDiff[field]}
                  onChange={e => setManualDiff({ ...manualDiff, [field]: e.target.value })}
                />
              ))}
              <button onClick={handleManualPreview}>👁️ Preview</button>
              <button onClick={handleManualConfirm} disabled={!previewDiff}>Confirm</button>
            </div>
          </div>

          <div className="buttons">
            <button onClick={handleExport}>📥 Export JSON</button>
          </div>
        </div>
      )}
    </div>
  );
}
