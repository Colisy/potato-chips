import React, { useState, useEffect, useRef } from 'react';
import { YanziHandIcon, KitchenKnifeIcon } from '../icons/GameIcons';
import RoastOverlay from '../RoastOverlay';
import { useInactivityTimer } from '../../hooks/useInactivityTimer';

interface Props {
  onSuccess: () => void;
  onFail: () => void;
}

export default function CucumberLevel({ onSuccess, onFail }: Props) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'success' | 'fail'>('intro');
  const [timeLeft, setTimeLeft] = useState(30);
  const [slices, setSlices] = useState(0);
  const [handPos, setHandPos] = useState(380); // 黄瓜最右侧(500) - 手的长度(180) - 20px = 300px
  const [knifeX, setKnifeX] = useState(450);
  const [isKnifeDown, setIsKnifeDown] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; vx: number; vy: number; rotation: number; inPlate: boolean }[]>([]);
  const [roastEvent, setRoastEvent] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const targetSlices = 20;

  // 添加3秒超时提醒
  const { resetTimer } = useInactivityTimer({
    isActive: phase === 'playing',
    timeout: 2000, // 3秒
    onTimeout: () => {
      setRoastEvent(`速度太慢，一动不动。 时间：${Date.now()}`);
    }
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (phase !== 'playing' || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    // 限制刀的移动范围
    if (x > 80 && x < 550) {
      setKnifeX(x);
    }
  };

  const startLevel = () => {
    setPhase('playing');
    setTimeLeft(30);
    setSlices(0);
  };

  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 0) {
            clearInterval(timerRef.current!);
            setRoastEvent(`时间到了！没完成切黄瓜游戏。 时间：${Date.now()}`);
            setTimeout(onFail, 2000);
            return 0;
          }
          return t - 1;
        });
      }, 1000);

      // 移除随机移动逻辑，手只在切完黄瓜后移动
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (particles.some(p => !p.inPlate)) {
      const interval = setInterval(() => {
        setParticles(prev => prev.map(p => {
          if (p.inPlate) return p;
          
          const nextX = p.x + p.vx;
          const nextY = p.y + p.vy;
          const nextVY = p.vy + 0.3; // 进一步减小重力，让黄瓜片飞得更远
          
          // 如果进入盘子区域 (右侧 580px 以后, 高度 180px 附近)
          if (nextX > 580 && nextY > 180) {
            return { ...p, x: 600 + Math.random() * 80, y: 160 + Math.random() * 20, inPlate: true, vx: 0, vy: 0 };
          }
          
          return {
            ...p,
            x: nextX,
            y: nextY,
            vy: nextVY,
            rotation: p.rotation + 10
          };
        }));
      }, 30);
      return () => clearInterval(interval);
    }
  }, [particles]);

  const handleSlice = () => {
    if (phase !== 'playing') return;

    // 重置超时计时器，因为用户开始操作了
    resetTimer();

    // 计算当前黄瓜的实际右侧边缘
    const cucumberWidth = 500;
    const currentWidth = cucumberWidth - (slices * (cucumberWidth / targetSlices));
    const currentCucumberEdge = 50 + currentWidth;

    // 如果刀的位置在黄瓜右侧边缘之外（允许15px的宽容度）
    // 则判定为“切空了”，不增加计数，也不触发失败逻辑
    if (knifeX > currentCucumberEdge + 15) {
      setIsKnifeDown(true);
      setRoastEvent(`切空了,玩家在空气中挥刀，没切到黄瓜。 时间：${Date.now()}`);
      setTimeout(() => setIsKnifeDown(false), 150);
      return;
    }

    setIsKnifeDown(true);
    
    // Check collision with hand 是否切到手
    //  切在手上 或 切左侧
    if ((knifeX > handPos && knifeX < handPos + 150) || knifeX<handPos) {
      setRoastEvent(`切到了手！手流血了。 时间：${Date.now()}`);
      // // 失败时立即语音提醒，不等AI返回，增强反馈感
      // speak("哎呀，好害羞，你碰到人家的手了！"); 
      setPhase('fail');
      setTimeout(onFail, 2000);
    } else {
      const id = Date.now();
      
      // 每次切黄瓜都夸奖
      setRoastEvent(`玩家在切黄瓜 时间：${Date.now()}`);
      
      // 根据切割位置调整抛物线参数
      const plateX = 640; // 盘子中心位置
      const distance = plateX - knifeX; // 到盘子的距离
      
      // 优化速度计算：近距离时速度小，远距离时速度大
      let baseVx: number;
      if (distance < 100) {
        // 距离很近时，使用较小的速度
        baseVx = 2 + distance / 50;
      } else {
        // 距离较远时，使用较大的速度
        baseVx = 4 + distance / 80;
      }
      
      setParticles(prev => [...prev, { 
        id, 
        x: knifeX, 
        y: 150, 
        vx: baseVx + Math.random() * 1, // 减少随机性
        vy: -3 - Math.random() * 1, // 适中的初始向上速度
        rotation: 0,
        inPlate: false
      }]);
      
      setSlices(s => {
        const next = s + 1;
        
        // 切完一片后，手往后移动一片黄瓜的长度
        const cucumberWidth = 500; // 黄瓜总宽度
        const sliceWidth = cucumberWidth / targetSlices; // 每片黄瓜的宽度 ≈ 27.8px
        const initialHandPos = 380; // 手的初始位置
        
        setHandPos(() => {
          // 手的新位置 = 初始位置 - (已切片数 * 每片宽度)
          const newPos = initialHandPos - (next * sliceWidth);
          // 确保不超出边界
          return newPos;
        });
        
        if (next >= targetSlices) {
          setRoastEvent(`把黄瓜切完了！ 时间：${Date.now()}`);
          setPhase('success');
          setTimeout(onSuccess, 2000);
        }
        return next;
      });
    }

    setTimeout(() => setIsKnifeDown(false), 150);
  };

  return (
    <div className="cucumber-stage" ref={stageRef} onMouseMove={handleMouseMove}>
    
      {phase === 'intro' && (
        <div className="overlay cucumber-intro-overlay">
          <div className="dialog-box">
            <div className="dialog-header">
              <div className="char-head">
                <img src="/images/xiaozhan.jpeg" alt="着急的厨师" />
              </div>
              <div className="char-head">
                <img src="/images/yanzi.jpeg" alt="燕姿" />
              </div>
            </div>
            <div className="dialog-title">着急的厨师 v.s 切菜小帮手燕姿</div>
            <div className="dialog-content">
              任务时间：30秒<br/>
              任务方式：利用鼠标点选菜刀，将砧板上的小黄瓜切完即可。<br/>
              （注意喔~不要切到燕姿的娇嫩的小手喔！）
            </div>
            <button className="btn-start" onClick={startLevel}>开始切小黄瓜</button>
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <>
          <div className="timer-container">
            <div className="timer-icon"></div>
            <div className="timer-bar">
              <div className="timer-fill" style={{ width: `${(timeLeft / 30) * 100}%` }}></div>
            </div>
          </div>

          <div className="chopping-board">
            <div className="cucumber-plate"></div>
            <div className="cucumber-body" style={{ 
              width: `${500 - (slices * (500 / targetSlices))}px`,
              transition: 'width 0.1s ease'
            }}></div>
            <div className="hand-yanzi" style={{ left: `${handPos}px` }}>
              <YanziHandIcon style={{ width: '100%', height: '100%', transform: 'rotate(90deg)' }} />
            </div>
            <div 
              className={`knife-tool ${isKnifeDown ? 'down' : ''}`} 
              style={{ left: `${knifeX - 75}px` }}
              onClick={handleSlice}
            >
              <KitchenKnifeIcon style={{ width: '100%', height: '100%', transform: 'rotate(-45deg)' }} />
            </div>
            {particles.map(p => (
              <div 
                key={p.id} 
                className="slice-particle" 
                style={{ 
                  left: p.x, 
                  top: p.y,
                  transform: `rotate(${p.rotation}deg)`
                }}
              ></div>
            ))}
          </div>

          <div className="completion-container">
            <span>完成度：</span>
            <div className="completion-bar">
              <div className="completion-fill" style={{ width: `${(slices / targetSlices) * 100}%` }}></div>
            </div>
          </div>
        </>
      )}

      <RoastOverlay 
        event={roastEvent} 
        gameContext={
          phase === 'fail' ? '切到手受伤流血' : 
          phase === 'success' ? '成功完成切黄瓜' : 
          '正在切黄瓜'
        } 
      />

      {phase === 'success' && (
        <div className="overlay cucumber-intro-overlay">
          <div className="dialog-box">
            <div className="dialog-header success-header">
              <div className="char-head">
                <img src="/images/xiaozhan.jpeg" alt="肖战" />
              </div>
            </div>
            <h2 className="dialog-title">成功！</h2>
            <p className="dialog-content" style={{textAlign: 'center'}}>
              谢谢你即时帮我把小黄瓜切好！<br/>
              我有看到小偷往 巷子内 跑过去了...
            </p>
          </div>
        </div>
      )}

      {phase === 'fail' && (
        <div className="overlay cucumber-intro-overlay">
          <div className="dialog-box">
            <div className="dialog-header fail-header">
              <div className="char-head">
                <img src="/images/blood.jpeg" alt="受伤" />
              </div>
            </div>
            <h2 className="dialog-title" style={{color: 'red'}}>失败！</h2>
            <p className="dialog-content" style={{textAlign: 'center'}}>
              啊！好痛！不要切我的手！
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
