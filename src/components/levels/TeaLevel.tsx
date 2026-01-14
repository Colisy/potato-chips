import React, { useState, useEffect, useRef } from 'react';
import RoastOverlay from '../RoastOverlay';
import { useInactivityTimer } from '../../hooks/useInactivityTimer';

interface Props {
  onSuccess: () => void;
  onFail: () => void;
}

interface Leaf {
  id: number;
  x: number;
  y: number;
  rotation: number;
  isDragging?: boolean;
  originalX?: number;
  originalY?: number;
  isCollected?: boolean; // 新增：标记是否已收集
}

export default function TeaLevel({ onSuccess, onFail }: Props) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'success' | 'fail'>('intro');
  const [timeLeft, setTimeLeft] = useState(40);
  const [score, setScore] = useState(0);
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  const [collectedLeaves, setCollectedLeaves] = useState<Leaf[]>([]); // 茶碗内的茶叶
  const [draggedLeaf, setDraggedLeaf] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [roastEvent, setRoastEvent] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const teaAreaRef = useRef<HTMLDivElement>(null);
  const teaBowlRef = useRef<HTMLDivElement>(null);
  
  const maxScore = 15;
  const timeLimit = 40;

  // 添加3秒超时提醒
  const { resetTimer } = useInactivityTimer({
    isActive: phase === 'playing',
    timeout: 3000, // 3秒
    onTimeout: () => {
      setRoastEvent(`速度太慢，用户一动不动 时间：${Date.now()}`);
    }
  });

  const startLevel = () => {
    setPhase('playing');
    setTimeLeft(timeLimit);
    setScore(0);
    setCollectedLeaves([]); // 重置茶碗内的茶叶
    generateLeaves();
  };

  const generateLeaves = () => {
    const newLeaves: Leaf[] = [];
    const trayRadius = 120; // 盘子半径（300px/2 - 边框和边距）
    const centerX = 150; // 盘子中心X坐标
    const centerY = 150; // 盘子中心Y坐标
    
    for (let i = 0; i < 20; i++) {
      // 使用极坐标在圆形区域内生成茶叶
      const angle = Math.random() * 2 * Math.PI; // 随机角度
      const distance = Math.sqrt(Math.random()) * trayRadius; // 随机距离，使用平方根确保均匀分布
      
      const x = centerX + distance * Math.cos(angle) - 25; // 减去茶叶尺寸的一半
      const y = centerY + distance * Math.sin(angle) - 25;
      
      newLeaves.push({
        id: i,
        x: Math.max(0, Math.min(x, 250)), // 确保在边界内
        y: Math.max(0, Math.min(y, 250)),
        rotation: Math.random() * 360
      });
    }
    setLeaves(newLeaves);
  };

  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 0) {
            clearInterval(timerRef.current!);
            setRoastEvent(`时间到了！没完成任务。 时间：${Date.now()}`);
            setPhase('fail');
            setTimeout(onFail, 2000);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);
  const handleMouseDown = (e: React.MouseEvent, leafId: number) => {
    e.preventDefault();
    const leaf = leaves.find(l => l.id === leafId);
    if (!leaf || !teaAreaRef.current || leaf.isCollected) return; // 已收集的茶叶不能拖拽

    // 重置超时计时器，因为用户开始操作了
    resetTimer();

    const rect = teaAreaRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - leaf.x;
    const offsetY = e.clientY - rect.top - leaf.y;

    setDraggedLeaf(leafId);
    setDragOffset({ x: offsetX, y: offsetY });
    
    // 保存原始位置
    setLeaves(ls => ls.map(l => 
      l.id === leafId 
        ? { ...l, isDragging: true, originalX: l.x, originalY: l.y }
        : l
    ));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedLeaf === null || !teaAreaRef.current) return;

    const rect = teaAreaRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    setLeaves(ls => ls.map(l => 
      l.id === draggedLeaf 
        ? { ...l, x: newX, y: newY }
        : l
    ));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (draggedLeaf === null || !teaAreaRef.current || !teaBowlRef.current) return;

    const teaAreaRect = teaAreaRef.current.getBoundingClientRect();
    const bowlRect = teaBowlRef.current.getBoundingClientRect();
    
    const mouseX = e.clientX - teaAreaRect.left;
    const mouseY = e.clientY - teaAreaRect.top;

    // 计算茶碗相对于茶叶区域的位置
    const bowlCenterX = bowlRect.left - teaAreaRect.left + bowlRect.width / 2;
    const bowlCenterY = bowlRect.top - teaAreaRect.top + bowlRect.height / 2;
    const bowlRadius = bowlRect.width / 2; // 茶碗半径

    const distance = Math.sqrt(
      Math.pow(mouseX - bowlCenterX, 2) + Math.pow(mouseY - bowlCenterY, 2)
    );

    if (distance <= bowlRadius) {
      // 成功拖拽到茶碗，移除这个茶叶并添加到茶碗内
      console.log('SUCCESS! Collecting leaf');
      
      // if ((score + 1) % 5 === 0) {
       
        setRoastEvent(`摘茶叶中 时间：${Date.now()}`);
      // }
      
      const draggedLeafData = leaves.find(l => l.id === draggedLeaf);
      if (draggedLeafData) {
        // 在茶碗内生成随机位置（相对于茶碗中心）
        const bowlLeafX = 75 + (Math.random() - 0.5) * 50; // 茶碗内随机X位置 (100px中心 ± 25px)
        const bowlLeafY = 75 + (Math.random() - 0.5) * 50; // 茶碗内随机Y位置
        
        const collectedLeaf: Leaf = {
          ...draggedLeafData,
          x: bowlLeafX,
          y: bowlLeafY,
          rotation: Math.random() * 360,
          isDragging: false,
          isCollected: true
        };
        
        setCollectedLeaves(prev => [...prev, collectedLeaf]);
      }
      
      setLeaves(ls => ls.filter(l => l.id !== draggedLeaf));
      
      // 增加分数
      // setRoastEvent(`摘茶叶`);
      setScore(s => {
        const next = s + 1;
        if (next >= maxScore) {
          setPhase('success');
          setTimeout(onSuccess, 2000);
        }
        return next;
      });
    } else {
      // 没有拖拽到茶碗，恢复原位置
      console.log('FAILED! Returning to original position');
      setRoastEvent(`茶叶掉了 时间：${Date.now()}`);
      setLeaves(ls => ls.map(l => 
        l.id === draggedLeaf 
          ? { ...l, x: l.originalX || l.x, y: l.originalY || l.y, isDragging: false }
          : l
      ));
    }

    setDraggedLeaf(null);
    setDragOffset({ x: 0, y: 0 });
  };

  return (
    <div className="tea-stage">
     
      
      {phase === 'intro' && (
        <div className="overlay tea-intro-overlay">
          <div className="dialog-box">
            <div className="dialog-header">
              <div className="char-head">
                <img src="/images/xiaozhan.jpeg" alt="茶店老板" />
              </div>
              <div className="char-head">
                <img src="/images/yanzi.jpeg" alt="燕姿" />
              </div>
            </div>
            <div className="dialog-title">巷口青草茶店</div>
            <div className="dialog-content">
              任务：帮老板捡选晒在门口的绿茶叶。<br/>
              方式：用鼠标拖拽篮子里的茶叶到右边的杯中。<br/>
              老板就会愿意告诉燕姿小偷往哪去了喔！
            </div>
            <button className="btn-start" onClick={startLevel}>开始摘茶叶</button>
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <div className="game-content">
          <div className="timer-container">
            <div className="timer-icon">⏰</div>
            <div className="timer-bar">
              <div 
                className="timer-fill" 
                style={{ 
                  width: `${(timeLeft / timeLimit) * 100}%`,
                  background: timeLeft < 10 ? 'linear-gradient(90deg, #f44336, #ff5722)' : undefined
                }} 
              />
            </div>
          </div>

          <div className="tea-area" ref={teaAreaRef} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <div className="bamboo-tray">
              <div className="tea-leaves-container">
                {leaves.map(l => (
                  <div 
                    key={l.id} 
                    className={`tea-leaf ${l.isDragging ? 'dragging' : ''} ${l.isCollected ? 'collected' : ''}`}
                    style={{ 
                      left: l.x, 
                      top: l.y,
                      zIndex: l.isDragging ? 1000 : (l.isCollected ? 10 : 1),
                      cursor: l.isCollected ? 'default' : 'pointer'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, l.id)}
                  >
                    <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                      <ellipse cx="25" cy="25" rx="8" ry="20" fill="#4a7c2c" transform={`rotate(${l.rotation} 25 25)`}/>
                      <ellipse cx="25" cy="25" rx="6" ry="18" fill="#5a9c3c" transform={`rotate(${l.rotation} 25 25)`}/>
                      <line x1="25" y1="10" x2="25" y2="40" stroke="#2d5016" strokeWidth="1"/>
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            <div className="tea-bowl" ref={teaBowlRef}>
              {/* 显示茶碗内收集到的茶叶 */}
              {collectedLeaves.map(leaf => (
                <div 
                  key={`collected-${leaf.id}`}
                  className="tea-leaf collected"
                  style={{ 
                    left: leaf.x, 
                    top: leaf.y,
                    position: 'absolute',
                    zIndex: 10
                  }}
                >
                  <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="25" cy="25" rx="8" ry="20" fill="#4a7c2c" transform={`rotate(${leaf.rotation} 25 25)`}/>
                    <ellipse cx="25" cy="25" rx="6" ry="18" fill="#5a9c3c" transform={`rotate(${leaf.rotation} 25 25)`}/>
                    <line x1="25" y1="10" x2="25" y2="40" stroke="#2d5016" strokeWidth="1"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>

          <div className="completion-container completion-container-tea">
            <span>收集进度：{score}/{maxScore}</span>
            <div className="completion-bar">
              <div className="completion-fill" style={{ width: `${(score / maxScore) * 100}%` }}></div>
            </div>
          </div>
        </div>
      )}
      <RoastOverlay 
        event={roastEvent} 
        gameContext={
          phase === 'fail' ? '泡茶失败烫到手' : 
          phase === 'success' ? '成功泡好茶' : 
          '正在泡茶'
        } 
      />

      {phase === 'fail' && (
        <div className="overlay tea-intro-overlay">
          <div className="dialog-box">
            <div className="dialog-header success-header">
              <div className="char-head">
                <img src="/images/fail.jpg" alt="失败" />
              </div>
            </div>
            <h2 className="dialog-title">时间到了！</h2>
            <p className="dialog-content" style={{textAlign: 'center'}}>
              你收集了 { score } 片茶叶<br/>
            差一点就成功了，再试一次吧！
            </p>
          </div>
        </div>
      )}
      {phase === 'success' && (
        <div className="overlay tea-intro-overlay">
          <div className="dialog-box">
            <div className="dialog-header success-header">
              <div className="char-head">
                <img src="/images/xiaozhan.jpeg" alt="肖战" />
              </div>
            </div>
            <h2 className="dialog-title">成功！</h2>
            <p className="dialog-content" style={{textAlign: 'center'}}>
              太棒了！你成功收集了所有茶叶！<br/>
              茶店老板很满意！
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
