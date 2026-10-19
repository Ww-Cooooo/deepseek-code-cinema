# 光来的方向

50秒中文知识短片：用光的出发、穿行、抵达，解释为什么仰望星空是在看过去。无旁白，使用代码生成的画面、音乐和音效。**用户已完整观看、听音并接受本版。**

画面与声音源码由官方DeepSeek Harness中的DeepSeek Flash在独立业务会话中制作。创建者给过普通审片和事实复核；32k输出上限的后续调用被预算门阻止后，创建者运行已有脚本完成导出，没有代写画面、时序或声音实现。目标随后读取了实际MP4的接触表。交付文档和一条过时的阶段注释由创建者更新。

完整影片为1920×1080、30fps、1500帧、50.005秒，H.264/AAC立体声。MP4作为发行资产交付，工程中保留本地音轨和字体。技术检查、人工验收与已知问题见[审片记录](review.md)。

## 重新制作

在本目录用PowerShell 7运行，需要Node.js 22.19+或24+、npm和Chromium：

```text
npm ci
npm run typecheck
npm run sound
npm run render -- --out out/film-v1.mp4
npm run studio
```

默认`Film`为50秒全片。先生成声音再预览或渲染；首次依赖和浏览器准备可能联网。已有同名输出时选择新版本文件名，保留旧片。

局部检查和最初8秒方向段：

```text
npm run still -- --frame 960 --out out/frame-960.png
npm run clip -- --range 26:29 --out out/clip-26-29.mp4
npm run sound:review
npm run render -- --composition Review --out out/review-v3.mp4
```

`--frame`为所选Composition的帧号；`--range`使用秒，左闭右开。`Review`保留早期8秒试拍，并非本版完整影片。

## 修改入口

- `src/config.ts`统一规格、六个镜头时长和音轨。
- `src/Film.tsx`组织全片；`src/shots/`实现星海、光的走廊、大气层、时间壳、光尺与回望。
- `src/scene/`提供光路、星场、海面等；`font.ts`等待随包字体加载。
- `score-film.json`与`scripts/sound.mjs`生成50秒声音；`score.json`保留8秒版本。
- [简报](brief.md)保留预制作阶段的范围说明；[镜头表](storyboard.md)与[知识来源](research.md)记录创作依据。

模型采样审阅曾指出整体偏暗、部分注记偏小、星面质感偏糊，以及35–36秒和43–44秒的阅读/衔接；这些观察保留供后续修改。用户随后明确回复“完整看过并听过，可以接受”，本版画面、节奏与声音已获认可。

原创部分采用[MIT](LICENSE)；字体遵循[OFL](public/fonts/OFL.txt)，Remotion等依赖保持自身许可。资源说明见[ASSETS.md](ASSETS.md)。
