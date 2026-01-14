# 🎮 AI互动游戏 - 回忆片段

一个基于Next.js开发的AI互动游戏，玩家需要完成三个有趣的关卡，同时享受AI角色的实时语音互动和鼓励。

## ✨ 游戏特色

### 🎭 AI角色系统
- **双重人格**：随机分配甜美小妹妹或深情小哥哥角色
- **实时语音**：AI根据游戏事件生成个性化语音反馈
- **智能防重复**：先进的相似度检测，确保每次回复都独特新颖
- **情感丰富**：撒娇、鼓励、安慰等多种情感表达

### 🎯 游戏关卡

#### 1. 🥒 切黄瓜关卡
- 使用鼠标控制刀具切黄瓜
- 避免切到手指
- 目标：切出20片黄瓜片

#### 2. 🍃 摘茶叶关卡  
- 拖拽茶叶到茶碗中
- 精准操作，避免茶叶掉落
- 目标：收集15片茶叶

#### 3. 👵 扶老奶奶过马路
- 帮助老奶奶安全穿越马路
- 避开来往车辆
- 目标：护送到马路对面

### 🎵 沉浸式体验
- **背景音乐**：孙燕姿《Tonight, I feel close to you》
- **可控播放**：点击音乐通知可暂停/播放
- **视频背景**：动态视频背景增强氛围
- **语音优先**：AI语音时自动降低背景音乐音量

## 🚀 技术栈

- **前端框架**：Next.js 13+ (React)
- **开发语言**：TypeScript
- **样式**：CSS3 + 自定义动画
- **AI服务**：DeepSeek API
- **语音合成**：Web Speech API
- **音频处理**：HTML5 Audio API

## 📦 安装与运行

### 环境要求
- Node.js 16.0+
- npm 或 yarn

### 安装步骤

```bash
# 克隆项目
git clone [项目地址]
cd AI-Game/recollection

# 安装依赖
npm install
# 或
yarn install

# 启动开发服务器
npm run dev
# 或
yarn dev
```

### 访问游戏
打开浏览器访问 `http://localhost:3000`

## 🎮 游戏操作

### 基础操作
- **鼠标**：主要交互方式
- **点击**：开始游戏、切黄瓜、选择茶叶
- **拖拽**：移动茶叶、控制老奶奶

### 音乐控制
- **点击音乐通知**：暂停/播放背景音乐
- **🎵 图标**：音乐播放中
- **⏸️ 图标**：音乐已暂停

## 🔧 核心功能

### AI语音系统
```typescript
// AI消息生成
getRoastMessage(event: string): Promise<string>

// 语音播放
speak(text: string): void

// 语音状态管理
getIsSpeaking(): boolean
```

### 音乐控制
```typescript
// 播放背景音乐
playBackgroundMusic(): void

// 暂停/恢复
toggleBackgroundMusic(): void

// 获取播放状态
isBackgroundMusicPlaying(): boolean
```

### 防重复机制
- **历史记录**：保存最近20条AI回复
- **相似度检测**：80%相似度阈值
- **智能重试**：最多5次重试生成
- **动态参数**：随重试次数调整AI创造性

## 📁 项目结构

```
recollection/
├── src/
│   ├── components/
│   │   ├── levels/           # 游戏关卡组件
│   │   │   ├── CucumberLevel.tsx
│   │   │   ├── TeaLevel.tsx
│   │   │   └── OldLadyLevel.tsx
│   │   ├── icons/            # 游戏图标
│   │   └── RoastOverlay.tsx  # AI语音显示组件
│   ├── pages/
│   │   └── index.tsx         # 主游戏页面
│   ├── styles/
│   │   └── globals.css       # 全局样式
│   ├── utils/
│   │   └── aiService.ts      # AI服务核心
│   └── hooks/
│       └── useInactivityTimer.ts
├── public/
│   ├── music/               # 背景音乐文件
│   └── 3.mp4               # 背景视频
└── README.md
```

## 🎨 自定义配置

### AI角色调整
在 `aiService.ts` 中修改：
```typescript
// 修改AI人格提示词
const systemPrompt = isSister ? "你的甜妹提示词" : "你的哥哥提示词";

// 调整语音参数
utterance.pitch = 1.25;  // 音调
utterance.rate = 0.95;   // 语速
```

### 游戏难度调整
```typescript
// 茶叶关卡
const maxScore = 15;      // 目标茶叶数
const timeLimit = 40;     // 时间限制(秒)

// 黄瓜关卡  
const targetSlices = 20;  // 目标切片数
```

## 🐛 故障排除

### 常见问题

1. **语音不播放**
   - 确保浏览器支持Web Speech API
   - 检查浏览器音频权限设置

2. **背景音乐无法播放**
   - 现代浏览器需要用户交互才能播放音频
   - 点击页面任意位置激活音频

3. **AI回复重复**
   - 系统已内置防重复机制
   - 重新开始游戏会清空历史记录

### 性能优化
- 使用Chrome浏览器获得最佳体验
- 确保网络连接稳定（AI API调用）
- 关闭不必要的浏览器标签页

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发规范
- 使用TypeScript进行类型安全开发
- 遵循React Hooks最佳实践
- 保持代码注释清晰

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 样式调整

## 📄 许可证

本项目采用 MIT 许可证。

## 🎯 未来计划

- [ ] 添加更多游戏关卡
- [ ] 支持多语言AI对话
- [ ] 增加成就系统
- [ ] 添加排行榜功能
- [ ] 支持自定义AI角色

---

**享受游戏，感受AI陪伴的温暖！** 💕