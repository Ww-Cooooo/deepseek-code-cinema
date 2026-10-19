# 一粒种子的远行

50秒无旁白视觉故事：一粒种子离开枯林，穿过风、水和阻碍，落地发芽。当前完整版本为 **v2，用户已完整观看、听音并明确接受**；原话：“已完整看听最新v2，可以接受”。此前8秒《渡》的方向认可单独记录。

画面、镜头、音乐与音效事件由官方DeepSeek Harness中的DeepSeek Flash在自己的业务工程中制作。创建者提供普通反馈和运行检查；声音工具输出被截断后，创建者恢复原音乐代码，补齐标准WAV写出与去直流处理，并完成最终导出。具体范围见[审片记录](review.md)，不作为完全无人辅助一遍成功的案例。

完整v2：1920×1080、30fps/1500帧、50.000秒，H.264/AAC 48kHz立体声。MP4另作为发行资产提供；工程内包含本地字体、完整音轨与生成源码。

## 重新制作

需要Node.js22.19+或24+、npm和Chromium；Windows使用PowerShell7。首次依赖/浏览器准备可能联网。解压后在本目录运行：

```text
npm ci
npm run typecheck
node scripts/sound-film.mjs
npm run render -- --composition Film --out out/film-v3.mp4
npm run studio
```

**完整片必须明确选择`--composition Film`。** 当前渲染脚本默认的`CrossingPreview`是保留的8秒方向段；`npm run sound`也保留8秒音轨入口。不要把默认八秒导出当作本片全长。

局部检查：

```text
npm run still -- --composition Film --frame 1200 --out out/frame-1200.png
npm run clip -- --composition Film --range 37:40 --out out/clip-37-40.mp4
```

`--frame`使用帧号，`--range`使用秒。已有同名输出时另起版本，保留原片。最初的8秒MP4和制作检查帧保留在本机验证资料中，不混入源码包；可用`CrossingPreview`再次试渲当前工程中的方向镜头。

## 修改入口

- `src/config.ts`维护规格、七镜头时长及派生时间轴；`src/film/Film.tsx`总装全片。
- `src/film/shots/`实现枯林、起风、逆风、入土、裂与年轮；`src/crossing/`提供渡水镜头、种子和环境。
- `scripts/sound-film.mjs`包含50秒原创音符、声场和事件，末尾注明创建者补的技术输出部分；旧`score-crossing.json`与`sound.mjs`保留8秒声音。
- 改全片时长时，同步修改`src/config.ts`镜头时间与`sound-film.mjs`的`DUR`及事件，再生成声音和影片，检查关键动作及末尾。
- [镜头表](storyboard.md)、[简报](brief.md)、[资源与许可](ASSETS.md)说明创作和资源来源。

目前已知：部分雾景低反差、30秒后种荚暗部较黑、发芽镜头高光偏亮、尾景主体变小。它们需要结合完整运动和声音判断；静帧和解码成功不能代替人工验收。

原创部分采用[MIT](LICENSE)，字体保留[SIL OFL](public/fonts/OFL.txt)，Remotion及其他依赖遵循自身许可。
