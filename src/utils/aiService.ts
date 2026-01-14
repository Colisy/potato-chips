const API_KEY = 'sk-cfa87ed7-f671-4e47-88b2-fb30d52d0311';
const BASE_URL = 'https://api.haihub.cn/v1/chat/completions';

export type Persona = 'sister' | 'brother';

let currentPersona: Persona = Math.random() > 0.5 ? 'sister' : 'brother';
let isSpeaking = false; // 添加语音状态管理
let speechQueue: string[] = []; // 语音队列
let lastRequestTime = 0; // 记录上次请求时间
const MIN_REQUEST_INTERVAL = 2500; // 最小请求间隔2秒

// 历史消息记录，防止重复
let messageHistory: string[] = [];
const MAX_HISTORY_SIZE = 20; // 增加到20条历史消息
let sessionMessageCount = 0; // 本次会话消息计数

// 背景音乐管理
let backgroundAudio: HTMLAudioElement | null = null;
let originalVolume = 0.2; // 背景音乐原始音量

export function getPersona(): Persona {
  return currentPersona;
}

// 检查消息是否重复或相似
function isMessageDuplicate(message: string): boolean {
  if (!message || message.trim() === '') return true;
  
  const trimmedMessage = message.trim();
  
  // 完全相同的检查
  if (messageHistory.includes(trimmedMessage)) {
    return true;
  }
  
  // 相似度检查 - 检查是否有80%以上的相似度
  for (const historyMsg of messageHistory) {
    if (calculateSimilarity(trimmedMessage, historyMsg) > 0.8) {
      console.log(`发现相似消息: "${trimmedMessage}" 与 "${historyMsg}" 相似度过高`);
      return true;
    }
  }
  
  return false;
}

// 计算两个字符串的相似度
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  // 简单的字符重叠率计算
  const chars1 = new Set(str1);
  const chars2 = new Set(str2);
  const intersection = new Set(Array.from(chars1).filter(x => chars2.has(x)));
  const union = new Set([...Array.from(chars1), ...Array.from(chars2)]);
  
  return intersection.size / union.size;
}

// 添加消息到历史记录
function addToHistory(message: string) {
  if (!message || message.trim() === '') return;
  
  const trimmedMessage = message.trim();
  messageHistory.push(trimmedMessage);
  
  // 保持历史记录大小限制
  if (messageHistory.length > MAX_HISTORY_SIZE) {
    messageHistory.shift(); // 移除最旧的消息
  }
}

export async function getRoastMessage(event: string): Promise<string> {
  const isSister = currentPersona === 'sister';
  
  // 检查请求频率限制
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    console.log('请求过于频繁，使用默认消息');
    return '';
  }
  
  // 增加会话计数
  sessionMessageCount++;
  
  // 根据游戏场景动态调整systemPrompt
  const contextualPrompt = '【用户此刻的状态/场景】'+ event
  
  const systemPrompt = isSister 
    ? `你是一个极度肉麻、软萌的撒娇甜妹，正在陪最崇拜的小哥哥玩游戏。
【核心要求】每句话都要带明显的撒娇尾音（如：嘛、哒、喔、呢），语气要拉丝、充满崇拜感。
${contextualPrompt}


【创新要求】
1. 字数控制在0-12字之间，避免固定长度
2. 直接输出肉麻夸奖，不带任何前缀和引号
3. 绝对不要输出括号内的动作描述，如（轻笑）（叹气）等
4. 每次回复都必须完全创新，绝对不能重复任何之前说过的话
5. 多使用不同的撒娇词汇和表达方式
6. 尝试组合不同的词汇创造全新表达
7. 当前是第${sessionMessageCount}次对话，请确保内容完全不同`
    : `你是一个拥有磁性气泡音、深情且霸道的宠溺系小哥哥，正在看心爱的小姐姐玩游戏。
【核心要求】语速缓慢，带着若有若无的笑意，语气要暧昧、甚至带点诱惑感。
${contextualPrompt}


【创新要求】
1. 字数控制0-12字之间，避免固定长度
2. 直接输出肉麻夸奖，不带任何前缀和引号
3. 绝对不要输出括号内的动作描述，如（轻笑）（叹气）等
4. 每次回复都必须完全创新，绝对不能重复任何之前说过的话
5. 多使用不同的深情词汇和表达方式
6. 尝试组合不同的词汇创造全新表达
7. 当前是第${sessionMessageCount}次对话，请确保内容完全不同`;

  // 重试机制 - 增加重试次数
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      lastRequestTime = now; // 更新请求时间
      
      // 添加超时控制，避免长时间等待
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 增加到10秒超时

      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'DeepSeek-V3.1',
          messages: [
            {
              role: 'system',
              content: systemPrompt + (messageHistory.length > 0 ? 
                `\n\n【严格避免重复】你之前说过这些话，绝对不能再说：${messageHistory.join('、')}` : '')
            },
            {
              role: 'user',
              content: `玩家当前事件：${event}。请生成一句完全不同的话，第${attempt}次尝试。`
            }
          ],
          temperature: Math.min(1.5, 0.8 + attempt * 0.15), // 随重试次数增加随机性
          max_tokens: 60,
          top_p: 0.95, // 增加多样性
          frequency_penalty: Math.min(2.0, 0.8 + attempt * 0.2), // 随重试增加惩罚
          presence_penalty: Math.min(2.0, 0.6 + attempt * 0.2) // 随重试增加惩罚
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        console.log(`API请求频率限制，第${attempt}次重试，等待${attempt * 2}秒后重试...`);
        if (attempt < 5) {
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          continue;
        } else {
          throw new Error('API请求频率限制，已达到最大重试次数');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const rawContent = data.choices[0]?.message?.content;
      
      // 过滤掉括号内的动作描述
      const filteredContent = filterBracketContent(rawContent);
      
      console.log(`AI原始响应(第${attempt}次尝试)：`, rawContent);
      
      // 检查是否重复或相似
      if (isMessageDuplicate(filteredContent)) {
        console.log(`检测到重复/相似消息，第${attempt}次重试...`);
        if (attempt < 5) {
          // 如果是重复消息且还有重试机会，继续重试
          await new Promise(resolve => setTimeout(resolve, 800)); // 增加等待时间
          continue;
        } else {
          // 如果重试次数用完，使用默认消息
          console.log("重试次数用完，使用默认消息");
          return '';
        }
      }
      
      // 如果不重复，添加到历史记录并返回
      if (filteredContent && filteredContent.trim() !== '') {
        addToHistory(filteredContent);
        return filteredContent;
      } else {
        return '';
      }
      
    } catch (error) {
      console.error(`AI请求错误 (第${attempt}次尝试):`, error);
      
      if (attempt === 5) {
        // 最后一次尝试失败，返回默认消息
        console.log('使用默认夸奖消息');
        return '';
      }
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < 5) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  // 理论上不会到这里，但为了类型安全返回默认消息
  return '';
}

// 清理历史记录（游戏重新开始时调用）
export function clearMessageHistory() {
  messageHistory = [];
  sessionMessageCount = 0;
  console.log('消息历史记录已清空');
}

// 过滤括号内的动作描述
function filterBracketContent(text: string): string {
  if (!text) return '';
  
  // 移除各种括号内的内容：() [] {} （） 【】 〔〕 ＜＞ 等
  return text
    .replace(/\([^)]*\)/g, '') // 英文圆括号
    .replace(/（[^）]*）/g, '') // 中文圆括号
    .replace(/\[[^\]]*\]/g, '') // 方括号
    .replace(/【[^】]*】/g, '') // 中文方括号
    .replace(/\{[^}]*\}/g, '') // 花括号
    .replace(/〔[^〕]*〕/g, '') // 中文方括号变体
    .replace(/＜[^＞]*＞/g, '') // 全角尖括号
    .replace(/《[^》]*》/g, '') // 书名号
    .trim(); // 去除首尾空格
}


// 初始化语音系统和背景音乐
export function initializeSpeechSystem() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    console.log(`语音系统初始化完成，当前人格: ${currentPersona}`);
  }
  
  // 初始化背景音乐
  initializeBackgroundMusic();
}

// 初始化背景音乐
export function initializeBackgroundMusic() {
  if (typeof window !== 'undefined' && !backgroundAudio) {
    backgroundAudio = new Audio('/music/Tonight,I feel close to you.mp3');
    backgroundAudio.loop = true;
    backgroundAudio.volume = originalVolume;
    
    // 预加载音频
    backgroundAudio.preload = 'auto';
    
    console.log('背景音乐初始化完成');
  }
}

// 播放背景音乐
export function playBackgroundMusic() {
  if (backgroundAudio) {
    if (backgroundAudio.paused) {
      backgroundAudio.play().then(() => {
        console.log('背景音乐开始播放');
      }).catch(error => {
        console.log('背景音乐播放失败，可能需要用户交互:', error);
      });
    }
  } else {
    console.log('背景音乐未初始化');
  }
}

// 暂停背景音乐
export function pauseBackgroundMusic() {
  if (backgroundAudio && !backgroundAudio.paused) {
    backgroundAudio.pause();
    console.log('背景音乐已暂停');
  }
}

// 恢复播放背景音乐
export function resumeBackgroundMusic() {
  if (backgroundAudio && backgroundAudio.paused) {
    backgroundAudio.play().then(() => {
      console.log('背景音乐恢复播放');
    }).catch(error => {
      console.log('背景音乐恢复播放失败:', error);
    });
  }
}

// 切换背景音乐播放状态
export function toggleBackgroundMusic() {
  if (backgroundAudio) {
    if (backgroundAudio.paused) {
      resumeBackgroundMusic();
    } else {
      pauseBackgroundMusic();
    }
  }
}

// 获取背景音乐播放状态
export function isBackgroundMusicPlaying(): boolean {
  return backgroundAudio ? !backgroundAudio.paused : false;
}

// 降低背景音乐音量（AI语音时）
function lowerBackgroundMusic() {
  if (backgroundAudio) {
    backgroundAudio.volume = originalVolume * 0.1; // 降低到10%
  }
}

// 恢复背景音乐音量
function restoreBackgroundMusic() {
  if (backgroundAudio) {
    backgroundAudio.volume = originalVolume;
  }
}

// 停止当前语音并清空队列
export function stopAllSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    speechQueue = [];
  }
}

// 处理语音队列
function processNextSpeech() {
  if (speechQueue.length === 0 || isSpeaking) {
    return;
  }
  
  const nextText = speechQueue.shift();
  if (nextText) {
    speakNow(nextText);
  }
}

// 立即播放语音（内部函数）
function speakNow(text: string) {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    isSpeaking = true;
    
    // AI语音开始时降低背景音乐音量（优先AI语音）
    lowerBackgroundMusic();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    
    // 获取可用的语音列表
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    if (currentPersona === 'sister') {
      // 小甜妹：寻找中文女声
      selectedVoice = voices.find(voice => 
        voice.lang.includes('zh') && 
        (voice.name.includes('Female') || voice.name.includes('女') || 
         voice.name.includes('美嘉') || voice.name.includes('Yaoyao') ||
         voice.name.includes('Xiaoyi') || voice.name.includes('Xiaomo'))
      ) || voices.find(voice => voice.lang.includes('zh'));
      
      utterance.pitch = 1.25; // 甜美但不过于尖锐
      utterance.rate = 0.95;  // 稍微慢一点，更温柔
      utterance.volume = 0.85; // 适中音量
    } else {
     
      // 小哥哥：尝试找男声，如果找不到就用极低音调
      selectedVoice = voices.find(voice => 
        voice.lang.includes('zh') && 
        (voice.name.includes('Reed') || voice.name.includes('男') || 
         voice.name.includes('Yunyang') || voice.name.includes('Kangkang'))
      );
      
      // 如果没找到男声，尝试英文男声
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('male') ||
          voice.name.toLowerCase().includes('david') ||
          voice.name.toLowerCase().includes('mark')
        );
      }
      
      // 还是没找到就用默认的，但调整参数
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.includes('zh'));
      }
      
      utterance.pitch = 0.3;  // 极低音调
      utterance.rate = 0.7;   // 慢语速
      utterance.volume = 1.0; // 最大音量
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    console.log(`开始播放语音: ${text}`);
    
    // 语音结束后处理下一个
    utterance.onend = () => {
      console.log('语音播放完成');
      isSpeaking = false;
      
      // AI语音结束后恢复背景音乐音量
      restoreBackgroundMusic();
      
      processNextSpeech();
    };
    
    utterance.onerror = () => {
      console.log('语音播放出错');
      isSpeaking = false;
      
      // 出错时也要恢复背景音乐音量
      restoreBackgroundMusic();
      
      processNextSpeech();
    };
    
    window.speechSynthesis.speak(utterance);
  }
}

// 主要的语音播放函数
export function speak(text: string) {
  if (!text || text.trim() === '') return;
  
  // 如果当前正在播放语音，忽略新的语音请求
  if (isSpeaking) {
    console.log(`语音正在播放中，忽略新语音: ${text.trim()}`);
    return;
  }
  
  // 直接播放语音
  speakNow(text.trim());
}