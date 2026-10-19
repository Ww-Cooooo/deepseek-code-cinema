# Remotion 工程与本地运行

## 起步

需要可执行本地命令、读写文件和查看图像的 Agent；Node.js 22.19+ 或 24+、npm、Chromium 浏览器。主测 Windows；其他系统尚未实测。字体已经随工程提供，不要求用户电脑有某种中文字体。完整渲染、网络下载和人工播放仍需要宿主实际允许。

把本包 `assets/starter/` **完整复制**到新工程（包括 package-lock.json、scripts、public 和字体许可），在该工程中运行：

```text
node scripts/doctor.mjs
npm ci
npm run typecheck
npm run sound
npm run still -- --frame 45 --out out/frame-45.png
npm run clip -- --range 0:3 --out out/clip-v1.mp4
npm run render -- --out out/film-v1.mp4
npm run studio
```

这些命令验证六秒中性几何工具小样，默认使用真正 3D 的 world 路径。`src/config.ts` 的 `renderMode` 可选 `graphics` 或 `world`；它只选择工具示例，不替影片设计风格。`GraphicsDemo` / `WorldDemo` 是免改配置的诊断 Composition：

```text
npm run still -- --composition GraphicsDemo --frame 90 --out out/graphics.png
npm run still -- --composition WorldDemo --frame 90 --out out/world.png
```

实际任务完整更换小样的主体、构图、镜头、光、材料、字幕和声音。不要拉长几何示例凑一分钟；工具标签和演示标题不进入正片。修改后先生成相符声音，再渲染。

依赖使用已固定版本及锁文件；所有 `remotion` 与 `@remotion/*` 保持同版。不要擅自升级后继续引用旧版验证结论。`npm ci` 使用使用者的正常 registry；实际出现连接故障时再解释代理、缓存或可选 registry，不把附件里的镜像设成所有用户默认值。不要关闭 TLS 校验。

## 浏览器与媒体工具

`doctor.mjs` 检查 Node 和可用的 Chromium 路径、媒体命令；渲染脚本先尊重 `REMOTION_BROWSER_EXECUTABLE`，再探测标准 Chrome/Edge 安装，找不到时由 Remotion 正常获取 Chrome Headless Shell（首次可能下载）。不连接用户日常浏览器。Windows PowerShell 任务只用 `pwsh` 7，不能回退 5.1。

Remotion 自带本地编码组件；额外的 FFmpeg/FFprobe 用于解码、音量、取帧与成片检测，优先复用现有工具。不因为 PATH 没有就判定本机一定未安装；检查宿主已明确提供的路径。不要全盘搜索或在公开工程硬编码私人位置。未有 FFprobe 时可用宿主提供的媒体检测，明确证据差异。

Windows 官方 Harness 0.2.1-rc.2 的默认 `workspace-write` 沙箱，在本项目实测中阻止 esbuild 的管道子进程（`spawn EPERM`），也阻止 Chrome 的进程通信；headless 无法回答提权。遇到这组明确证据，先核对宿主执行权限，停止重复安装依赖、改浏览器沙箱参数或重写打包器。完整渲染需要能运行本地打包器、浏览器和编码进程的权限。是否改变权限按使用者已有授权处理；没有授权时报告此环境阻塞并继续可做的设计，不冒称已渲染或把权限修改藏进作品代码。命令、代码类型检查通过都不能证明渲染条件可用。

## 单一时间与尺寸归属

- `src/config.ts`：`film` 保存尺寸、fps、镜头秒数、音轨文件；`schedule()` 将秒数四舍五入为帧并累加起点，`durationInFrames` 取总和。
- `src/Root.tsx`：Composition 使用推导配置；`Film` 选择配置的画面路径，另有两种技术示范 Composition。小样只有一段连续动作；做多镜头时，在 `Film.tsx` 由 timeline 建立 Sequence 或明确的全局区间。Sequence 的局部帧从 0 开始，镜头拿到自身时长。
- `src/motion.ts`：把 `frame / (durationInFrames - 1)` 限制到 0..1；区间插值依局部进度表达，不把“第 140 帧完成”当所有片长都适用。
- `src/font.ts`：显式加载随包字体并用 delayRender 等待；失败应报告，不能让方框字进入最终片。
- `scripts/render.mjs`：同一配置选择 Composition；`--frame` 是全片帧号；`--range 开始秒:结束秒` 是左闭右开区间，如 0:3 输出前 90 帧。

若关键动作需要绝对时间（例如一句旁白或动作音），保留该时间关系，调时长时实际检查，不承诺所有动画会自动缩放正确。加入叠化时要统一选择“交叠扣时长”或“尾部延留”的时序规则，再推导起点；不要同时手填 from、duration 和总长。

布局可使用构图基准画布加统一缩放或基于实际 width/height 求位置；换竖屏时要重新安排镜头，不能只横向压扁。数字来源只存一份，图表和旁注调用同一格式化逻辑。

## 确定性、素材与扩展

所有可见变化由帧决定；随机使用 Remotion `random(seed)` 或稳定种子。不要使用 `Date.now()`、`Math.random()`、定时器或依赖浏览器实时播放的 CSS 动画。图片用 Remotion `Img`，音频用 `Audio`，资源置于 public 并通过 `staticFile()` 获取。需要异步加载时 use delayRender/continueRender，加载失败用 cancelRender。

图形与 3D 都已准备在起始工程里。图形示例用 DOM/SVG 的层级、尺度与虚实；实体示例用 `@remotion/three` 的 `ThreeCanvas`，相机、物体与材质仍由当前帧求值。固定版本为 @remotion/three 4.0.536、Three.js 0.186.1、React Three Fiber 9.8.2、@types/three 0.186.0，配合 React 19.3.1。升级前重新核对官方 API/peerDependencies。

- Canvas 内可用 `useCurrentFrame()`；不要用实时 `useFrame()` 积分、墙钟或每次渲染累加位置。
- Canvas 内的 Sequence 用 `layout="none"`，不能把 DOM div 放进 Three 场景；中文叠层通常放在 Canvas 外。
- 程序化 `selectComposition` / `renderStill` / `renderMedia` 都显式带 `chromiumOptions: {gl: 'angle'}`。单独写 remotion.config 不会影响这些服务端 API；起始渲染脚本已经传入。
- 先确认机位、轮廓、遮挡、尺度、受光面/暗面和材质，再加复杂反射、雾、颗粒或后期。水面/群体可用程序材质与实例化，不必先搭流体模拟或大引擎。
- 检查起止与接触帧，避免穿透、离地、无来由的发光和镜头剪切。稳定种子不保证不同 GPU/有损编码逐像素相同，视觉与帧时序仍须检查。

新增库须解决真实画面需求，检查许可证、版本和渲染代价，不默认装整套后期/模型库。

公开工程不附 node_modules 或个人缓存；提供锁文件、本地素材、资产来源、brief/storyboard 与运行命令。离线可重复渲染的前提是依赖和 Chromium 已准备好，不宣传首次使用完全离线。

官方参考：[渲染](https://www.remotion.dev/docs/renderer/render-media)、[静帧](https://www.remotion.dev/docs/renderer/render-still)、[字体](https://www.remotion.dev/docs/fonts)、[Three 集成](https://www.remotion.dev/docs/three/)、[许可](https://www.remotion.dev/license)。本 Skill 原创部分的 MIT 不替代 Remotion 的自身许可条件。
