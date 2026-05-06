// 导入 React 严格模式，确保组件行为更符合预期
import {StrictMode} from 'react';
// 导入 React DOM 的根节点创建函数
import {createRoot} from 'react-dom/client';
// 导入主应用组件
import App from './App.tsx';
// 导入全局样式文件
import './index.css';

// 获取根 DOM 节点并创建 React 根节点
// 使用严格模式包裹应用组件以启用额外的开发和运行时检查
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
