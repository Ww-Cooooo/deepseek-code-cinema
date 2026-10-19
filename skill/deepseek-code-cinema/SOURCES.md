# 来源与许可

## 方法参考

所念の风在 Bilibili 发布的[《本视频由deepseek-v4.1-flash制作》](https://www.bilibili.com/video/BV1M9ah6JE7f/)（2026-09-27）及作者提供的《人类简史 · 史诗版》源码是本次方法研究的参考。实际研究包含覆盖主叙事的关键帧和四段切镜有序帧，以及本地源码关系；未取得原始 Prompt、创作对话和完整听音证据。

本包从中归纳时间压缩、源头与路径、共同尺度比较、符号累积、空间点位、加速后停顿、数据驱动画面与首尾回环的方法。这是研究者的归纳，不是作者公布的创作流程，也不构成任何题材都成功的证明。原参考早于 1017 发布，不能称为 1017 已完成作品。

原附件没有明确的再分发许可。本包的代码、文字、几何小样及音效独立编写；不包含原代码、截图、音乐或影片。归属说明不代表取得了原附件再分发授权。原例中的单位与数据不一致未作为正确事实继承。

笨蛋忍者的[《deepseekv4.1flash1017 一句话生成短片〈潜光〉》](https://www.bilibili.com/video/BV1L6Je6kEaC/)（2026-10-17）为用户追加的电影化风格参考。研究包含0.5–257秒、覆盖259秒时长的18个关键帧，以及三处局部有序帧；没有据此冒充完整连续观看或听音。归纳空间尺度、光作为视觉主语、实体/抽象空间衔接与再次显影的办法，不再分发其画面、音乐或工程。

用户提供的作者评论称使用标准 Harness、愿望式电影请求与代码生成3D/音乐/音效；这是创作者说法线索，不是全过程证明。公开页作者另说明剧本由旧v4.1写、后续1017会话复用；不能宣传为全程1017一次生成，也不将评论的3–5分钟固化成Skill时长。

## 原创与第三方资源

- 本包原创说明、代码与起始小样：MIT，见 [LICENSE](LICENSE)。使用者后续输入的素材不因此自动变成 MIT。
- Noto Sans SC 可变字体：Google Fonts / Noto；版权及 SIL Open Font License 1.1 原文随附 `assets/starter/public/fonts/OFL.txt`。来自 [google/fonts](https://github.com/google/fonts/tree/a85815a42757630ce188fdad368c2dfc444d4773/ofl/notosanssc)，固定快照 `a85815a42757630ce188fdad368c2dfc444d4773`，原文件 `NotoSansSC[wght].ttf` 仅改文件名为 NotoSansSC.ttf；SHA-256 `a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da`。字体保持 OFL，不能由本包 MIT 改授。
- 起始工程的 `score.json` 与 `sound.mjs`：原创合成音源，MIT；WAV 由它们生成，没有采样第三方录音。
- Remotion / @remotion/* 4.0.536：[官方文档](https://www.remotion.dev/docs/)、[Remotion 自身许可](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)。该依赖不是 MIT；依其条款，个人、一定规模内公司、非营利及评估用途的适用条件不同，较大营利组织需 Company License。使用者应按自己的情况核对，Skill 许可不代替它。
- Three.js 0.186.1、React Three Fiber 9.8.2、@types/three 0.186.0：MIT；通过 [Remotion Three 集成](https://www.remotion.dev/docs/three/)接入，版本及其依赖由锁文件固定。
- React / React DOM 19.3.1、@types/react / @types/react-dom 19.3.0：MIT；TypeScript 7.0.2：Apache-2.0。完整依赖版本与来源由起始工程 package-lock.json 固定，安装时保留 node_modules 中各许可证。没有把这些依赖源码打入 Skill。

## 运行与验证依据

运行脚本依据 Remotion 官方的 [bundle](https://www.remotion.dev/docs/bundler/bundle)、[selectComposition](https://www.remotion.dev/docs/renderer/select-composition)、[renderStill](https://www.remotion.dev/docs/renderer/render-still)、[renderMedia](https://www.remotion.dev/docs/renderer/render-media) 接口独立实现。

目标宿主为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)，候选基线 `@deepseek-ai/dsh@0.2.1-rc.2`；目标型号映射以 DeepSeek [1017 发布说明](https://api-docs.deepseek.com/zh-cn/news/news261017/)、[更新日志](https://api-docs.deepseek.com/zh-cn/updates/)与[价格页](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/)为准。服务别名会变化；文档支持与本包实际验证分别记录，不能将官方适配声明当作本包独立制作成功证据。

参考链接核对日：2026-10-19。实际本包验证状态见仓库 validation，不由来源名单推导效果。
