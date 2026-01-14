import React, { useState, useEffect } from 'react';
import CucumberLevel from '@/components/levels/CucumberLevel';
import TeaLevel from '@/components/levels/TeaLevel';
import OldLadyLevel from '@/components/levels/OldLadyLevel';
import {
  initializeSpeechSystem,
  getPersona,
  playBackgroundMusic,
  clearMessageHistory,
  toggleBackgroundMusic,
  isBackgroundMusicPlaying,
} from '@/utils/aiService';

type GameState = 'Cucumber' | 'Tea' | 'OldLady' | 'Success' | 'Fail' | 'Start';

export default function ShupianGame() {
  const [currentLevel, setCurrentLevel] = useState<GameState>('OldLady');
  const [musicStarted, setMusicStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // 更新音乐播放状态
  const updateMusicStatus = () => {
    setIsPlaying(isBackgroundMusicPlaying());
  };

  // 页面加载后尝试播放背景音乐
  const tryPlayMusic = () => {
    if (!musicStarted) {
      playBackgroundMusic();
      setMusicStarted(true);
      // 延迟更新状态，确保音乐开始播放
      setTimeout(updateMusicStatus, 100);
    }
  };

  // 处理音乐通知点击
  const handleMusicNoticeClick = () => {
    toggleBackgroundMusic();
    // 延迟更新状态，确保切换完成
    setTimeout(updateMusicStatus, 100);
  };

  useEffect(() => {
    // 初始化语音系统和背景音乐
    initializeSpeechSystem();
    console.log(`游戏开始，AI人格: ${getPersona()}`);

    // 如果立即播放失败，监听用户的第一次交互
    const handleFirstInteraction = () => {
      tryPlayMusic();
      // 移除事件监听器，只需要第一次交互
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    // 定期更新音乐状态
    const statusInterval = setInterval(updateMusicStatus, 1000);

    // 清理函数
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      clearInterval(statusInterval);
    };
  }, [musicStarted]);

  const goToLevel = (level: GameState) => {
    // 如果是重新开始游戏，清理消息历史
    if (level === 'Start' || level === 'Cucumber') {
      clearMessageHistory();
      console.log('游戏重新开始，已清理AI消息历史');
    }
    setCurrentLevel(level);
  };

  return (
    <div className="game-wrapper">
      {/* 背景音乐提示 */}
      {musicStarted && (
        <div 
          className="music-notice"
          onClick={handleMusicNoticeClick}
          style={{ cursor: 'pointer' }}
          title={isPlaying ? '点击暂停音乐' : '点击播放音乐'}
        >
          {isPlaying ? '🎵' : '⏸️'} 孙燕姿《Tonight,I feel close to you》
        </div>
      )}

      {/* 视频背景 */}
      <video className="video-background" autoPlay loop muted playsInline>
        <source src="/3.mp4" type="video/mp4" />
        您的浏览器不支持视频播放。
      </video>

      <div className="game-viewport">
        {currentLevel === 'Start' && (
          <div className="overlay start-overlay">
            <div className="start-button-container">
              {/* <div className="persona-info">
                <p>当前AI人格: {getPersona() === 'sister' ? '🎀 甜美小妹妹' : '🎩 深情小哥哥'}</p>
                <button 
                  className="btn-test-voice" 
                  onClick={() => {
                    const { speak } = require('@/utils/aiService');
                    const testText = getPersona() === 'sister' 
                      ? '哥哥好～人家是你的专属小甜妹哦！' 
                      : '姐姐好，我是你的贴心小哥哥。';
                    speak(testText);
                  }}
                >
                  🔊 试听语音
                </button>
              </div> */}
              <button
                className="btn-start"
                onClick={
                  () => {
                    tryPlayMusic();
                    goToLevel('Cucumber');
                  } // 立即尝试播放
                }
              >
                闯关开始
              </button>
            </div>
          </div>
        )}

        {currentLevel === 'Cucumber' && (
          <CucumberLevel
            onSuccess={() => goToLevel('Tea')}
            onFail={() => goToLevel('Fail')}
          />
        )}

        {currentLevel === 'Tea' && (
          <TeaLevel
            onSuccess={() => goToLevel('OldLady')}
            onFail={() => goToLevel('Fail')}
          />
        )}

        {currentLevel === 'OldLady' && (
          <OldLadyLevel
            onSuccess={() => goToLevel('Success')}
            onFail={() => goToLevel('Fail')}
          />
        )}

        {currentLevel === 'Success' && (
          <div className="overlay result-success-overlay">
            <h1 className="success-dialog-title">任务完成</h1>
            <div className="success-title-section">
              <p className="success-dialog-content">
                你太棒了！燕姿终于找回了所有的薯片！
                <br />
                谢谢你的帮助！
              </p>
            </div>
            <div className="success-button-section">
              <button className="btn-start" onClick={() => goToLevel('Start')}>
                再玩一次
              </button>
            </div>
          </div>
        )}

        {currentLevel === 'Fail' && (
          <div className="overlay result-fail-overlay">
            <div className="fail-title-section">
              <h1 className="fail-dialog-title">任务失败</h1>
              <p className="fail-dialog-content">哎呀，失败了。哼哼～～</p>
            </div>
            <div className="fail-button-section">
              <button className="btn-start" onClick={() => goToLevel('Start')}>
                重新开始
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
