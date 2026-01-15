/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import RoastOverlay from '../RoastOverlay';
import { useInactivityTimer } from '../../hooks/useInactivityTimer';

interface Props {
  onSuccess: () => void;
  onFail: () => void;
}

interface Car {
  id: number;
  lane: number;
  left: number;
  speed: number;
  emoji: string;
}

const carEmojis = ['🚗', '🚙', '🚕', '🚌', '🏎️', '🛻', '🚘'];

export default function OldLadyLevel({ onSuccess, onFail }: Props) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'success' | 'fail'>(
    'intro'
  );
  const [timeLeft, setTimeLeft] = useState(45);
  const [grandmaPos, setGrandmaPos] = useState(5); // bottom %
  const [cars, setCars] = useState<Car[]>([]);
  const [isHit, setIsHit] = useState(false);
  const [roastEvent, setRoastEvent] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const carSpawnerRef = useRef<NodeJS.Timeout | null>(null);
  const gameLoopRef = useRef<number | null>(null);

  const targetPos = 85;
  const stepSize = 8;
  const timeLimit = 45;

  const handleHit = useCallback(() => {
    if (isHit) return;
    setIsHit(true);
    setRoastEvent(`老奶奶被车撞了。 时间：${Date.now()}`);
    setGrandmaPos((prev) => Math.max(5, prev - stepSize * 1.5));
    setTimeout(() => setIsHit(false), 500);
  }, [isHit, stepSize]);

  // 添加3秒超时提醒
  const { resetTimer } = useInactivityTimer({
    isActive: phase === 'playing',
    timeout: 3000, // 3秒
    onTimeout: () => {
      setRoastEvent(`速度太慢，用户一动不动 时间：${Date.now()}`);
    },
  });

  const startLevel = () => {
    setPhase('playing');
    setTimeLeft(timeLimit);
    setGrandmaPos(5);
    setCars([]);
    setIsHit(false);
  };

  useEffect(() => {
    if (phase === 'playing') {
      // Timer
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 0) {
            clearInterval(timerRef.current!);

            setRoastEvent(`时间到了，老奶奶没到终点 时间：${Date.now()}`);
            setPhase('fail');
            setTimeout(onFail, 2000);
            return 0;
          }
          return t - 1;
        });
      }, 1000);

      // Car spawner
      carSpawnerRef.current = setInterval(() => {
        const lane = Math.floor(Math.random() * 3);
        setCars((prev) => [
          ...prev,
          {
            id: Date.now(),
            lane,
            left: -100,
            speed: 4 + Math.random() * 6,
            emoji: carEmojis[Math.floor(Math.random() * carEmojis.length)],
          },
        ]);
      }, 1200);

      // Game Loop
      const update = () => {
        setCars((prev) => {
          const next = prev
            .map((c) => ({ ...c, left: c.left + c.speed }))
            .filter((c) => c.left < 900);

          // Collision check
          const grandmaEl = document.getElementById('grandma-player');
          if (grandmaEl) {
            const grandmaRect = grandmaEl.getBoundingClientRect();
            for (const car of next) {
              const carEl = document.getElementById(`car-${car.id}`);
              if (carEl) {
                const carRect = carEl.getBoundingClientRect();
                if (
                  !(
                    grandmaRect.right < carRect.left ||
                    grandmaRect.left > carRect.right ||
                    grandmaRect.bottom < carRect.top ||
                    grandmaRect.top > carRect.bottom
                  )
                ) {
                  handleHit();
                }
              }
            }
          }
          return next;
        });
        gameLoopRef.current = requestAnimationFrame(update);
      };
      gameLoopRef.current = requestAnimationFrame(update);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (carSpawnerRef.current) clearInterval(carSpawnerRef.current);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [phase, handleHit, onFail]);

  const moveGrandma = () => {
    if (phase !== 'playing' || isHit) return;

    // 重置超时计时器，因为用户开始操作了
    resetTimer();

    setRoastEvent(`在帮老奶奶过马路 时间：${Date.now()}`);

    setGrandmaPos((prev) => {
      const next = prev + stepSize;
      if (next >= targetPos) {
        setPhase('success');
        setTimeout(onSuccess, 2000);
        return targetPos;
      }
      return next;
    });
  };

  return (
    <div className="road-stage">
      {phase === 'intro' && (
        <div className="overlay oldlady-intro-overlay">
          <div className="dialog-box">
            <div className="dialog-header">
              <div className="char-head">
                <img src="/images/grandma.jpeg" alt="老奶奶" />
              </div>
              <div className="char-head">
                <img src="/images/yanzi.jpeg" alt="燕姿" />
              </div>
            </div>
            <div className="dialog-title">帮助老奶奶过马路</div>
            <div className="dialog-content">
              方式：用鼠标点击路面让老太太前进。
              <br />
              注意：一定要避开左右行驶的车辆喔！
              <br />
              老奶奶：谢谢你，年轻人，能帮我过马路吗？
            </div>
            <button className="btn-start" onClick={startLevel}>
              帮助老奶奶过马路
            </button>
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <div className="game-content oldlady-game-content">
          {/* 顶部信息栏：时间和目的地在一行 */}
          <div className="oldlady-top-info">
            <div className="timer-container oldlady-timer-container">
              <div className="timer-icon">⏰</div>
              <div className="timer-bar oldlady-timer-bar">
                <div
                  className={`timer-fill ${
                    timeLeft < 10 ? 'oldlady-timer-fill-danger' : ''
                  }`}
                  style={{
                    width: `${(timeLeft / timeLimit) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="cutting-hint">目的地</div>
          </div>

          <div className="road-scene oldlady-road-scene" onClick={moveGrandma}>
            <div className="road">
              <div className="lane oldlady-lane-0"></div>
              <div className="lane oldlady-lane-1"></div>
              <div className="lane oldlady-lane-2"></div>

              {cars.map((c) => (
                <div
                  key={c.id}
                  id={`car-${c.id}`}
                  className="car"
                  style={{
                    left: `${c.left}px`,
                    top: `${c.lane * 33.33 + 5}%`,
                  }}
                >
                  {c.emoji}
                </div>
              ))}
            </div>
            <div
              id="grandma-player"
              className={`grandma ${isHit ? 'hit' : ''}`}
              style={{ bottom: `${grandmaPos + 15}%` }}
            >
              👵
            </div>
            <button
              className="btn-start oldlady-move-btn"
              onMouseDown={(e) => {
                e.stopPropagation();
                moveGrandma();
              }}
            >
              前进
            </button>
          </div>

          {/* 老太太的话 */}
          <div className="oldlady-instructions">
            <div className="oldlady-text-instructions">
              方式：用鼠标点击路面让老太太前进。
              <br />
              注意：一定要避开左右行驶的车辆喔！
            </div>
          </div>

          <div className="completion-container">
            <span>路程进度：</span>
            <div className="completion-bar">
              <div
                className="completion-fill"
                style={{
                  width: `${((grandmaPos - 5) / (targetPos - 5)) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}
      <RoastOverlay
        event={roastEvent}
        gameContext={
          phase === 'fail'
            ? '帮助老奶奶过马路失败'
            : phase === 'success'
            ? '成功帮老奶奶过马路'
            : '正在帮老奶奶过马路'
        }
      />

      {phase === 'success' && (
        <div className="overlay oldlady-intro-overlay">
          <div className="dialog-box">
            <div className="dialog-header success-header">
              <div className="char-head">
                <img src="/images/grandma.jpeg" alt="老奶奶" />
              </div>
            </div>
            <h2 className="dialog-title">成功！</h2>
            <p className="dialog-content oldlady-success-content">
              太棒了！你成功帮助老太太过马路了！
              <br />
              老太太：谢谢你，年轻人！你真是个好心人！
            </p>
          </div>
        </div>
      )}

      {phase === 'fail' && (
        <div className="overlay oldlady-intro-overlay">
          <div className="dialog-box">
            <div className="dialog-header success-header">
              <div className="char-head">
                <img src="/images/gmfail.jpeg" alt="老奶奶" />
              </div>
            </div>
            <h2 className="dialog-title" style={{ color: 'red' }}>
              任务失败
            </h2>
            <p className="dialog-content" style={{ textAlign: 'center' }}>
              时间到了！老婆婆还没过完马路呢...
              <br />
              再试一次吧，注意要快速点击路面喔！
            </p>
            <button className="btn-start" onClick={startLevel}>
              重新挑战
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
