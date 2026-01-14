import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getRoastMessage, speak, getPersona } from '../utils/aiService';

interface RoastOverlayProps {
  event: string | null;
  gameContext?: string; // 新增游戏上下文参数
}

export default function RoastOverlay({ event }: RoastOverlayProps) {
  const [message, setMessage] = useState<string>('');
  const [visible, setVisible] = useState(false);
  const persona = getPersona();
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerRoast = useCallback(async (evt: string) => {
    try {
      const roast = await getRoastMessage(evt);
      if (!roast) return;
      // 检查组件是否仍然挂载
      if (!isMountedRef.current) return;
      
      setMessage(roast);
      setVisible(true);
      speak(roast);

      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 3秒后消失
      timeoutRef.current = setTimeout(() => {
        // 再次检查组件是否仍然挂载
        if (isMountedRef.current) {
          setVisible(false);
        }
      }, 3000);
    } catch (error) {
      console.error('触发语音时出错:', error);
    }
  }, []);

  useEffect(() => {
    if (event) {
      triggerRoast(event);
    }
  }, [event, triggerRoast]);

  // 组件卸载时的清理
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!visible || !message || message.trim() === '') return null;

  const isSister = persona === 'sister';
  const bgColor = isSister ? 'rgba(255, 105, 180, 0.9)' : 'rgba(30, 144, 255, 0.9)';

  return (
    <div className="roast-bubble">
      <div className="roast-content">
        {message}
      </div>
      <style jsx>{`
        .roast-bubble {
          position: absolute;
          top: 80px;
          right: 20px;
          background: ${bgColor};
          color: #fff;
          padding: 10px 15px;
          border-radius: 15px;
          border-bottom-right-radius: 2px;
          max-width: 200px;
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
          font-size: 14px;
          line-height: 1.4;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .roast-bubble::after {
          content: '';
          position: absolute;
          bottom: -10px;
          right: 10px;
          border-width: 10px 10px 0 0;
          border-style: solid;
          border-color: ${bgColor} transparent transparent transparent;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
