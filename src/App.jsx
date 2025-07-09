import React, { useEffect, useState, useRef } from 'react';
import './App.css';

const CONFIG_URL = '/game-config.json';
const SOUND_URL = '/success.mp3';

export default function App() {
  const [config, setConfig] = useState(null);
  const [foundDiffs, setFoundDiffs] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const imageRef = useRef([]);
  const successSound = useRef(null);

  useEffect(() => {
    fetch(CONFIG_URL)
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setStartTime(Date.now());
        successSound.current = new Audio(SOUND_URL);
        successSound.current.load(); // preload
      });
  }, []);

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

  if (!config) return <div>Loading game...</div>;

  return (
    
    <div className="game-container">
      <nav>
  <a href="/config">🛠️ Configure Game</a>
</nav>

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
            {(showAll ? config.differences.map((_, idx) => idx) : foundDiffs).map(index => {
              const diff = config.differences[index];
              const img = imageRef.current[i];
              if (!img) return null;

              const scaleX = img.width / img.naturalWidth;
              const scaleY = img.height / img.naturalHeight;

              const style = {
                left: `${diff.x * scaleX}px`,
                top: `${diff.y * scaleY}px`,
                width: `${diff.width * scaleX}px`,
                height: `${diff.height * scaleY}px`,
                borderColor: 'lime',
                boxShadow: '0 0 10px lime',
              };

              return (
                <div key={`highlight-${i}-${index}`} className="highlight" style={style}></div>
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
    </div>
  );
}
