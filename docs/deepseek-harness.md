# 用官方 DeepSeek Harness 开始

本页面向已有基本 Node / AI 编程工具经验的使用者。当前基线 `@deepseek-ai/dsh@0.2.1-rc.2`，命令为 `dsh`。使用固定版本，避免 npm 的标签变化导致换版。

## 准备宿主与凭据

在希望存放影片的工作目录，用 PowerShell 7 运行：

```text
npx --yes --package=@deepseek-ai/dsh@0.2.1-rc.2 dsh --version
npx --yes --package=@deepseek-ai/dsh@0.2.1-rc.2 dsh web
```

第一次会下载工具。打开官方本机页面，在 Settings → Models 的 DeepSeek API key 字段保存你自己的凭据；不要放进制作请求、源工程或公开截图。选择 DeepSeek Flash，确认所需的思考档位与当前官方型号映射。API key 由 Harness 的凭据服务管理，前端回读为脱敏状态。

完整安装 Skill 到 `~/.dsh/skills/deepseek-code-cinema/`（或本项目 `.dsh/skills/deepseek-code-cinema/`），开启新会话，用 `/deepseek-code-cinema` 加正常制作请求。确认会话实际加载入口，随后在新工程输出影片。复制目录与加载正文是不同状态；已打开的旧聊天不能据此假定重载。

**Windows 首次制作请继续按下一节执行。** 上面默认启动 Web 可用于保存凭据与选择模型；本机实测默认 `workspace-write` 权限会阻止 esbuild/Chrome 子进程，不能直接据此认定已经具备渲染条件。本指南没有核实 Web 界面的权限切换位置；下面给出完整制作实际采用的 headless 路线，并明确允许本地执行和绑定 PowerShell 7。

## 非交互模式

该固定版本的 headless 默认从启动环境取得 `DEEPSEEK_API_KEY`，与 Web 保存凭据的默认模式不同。下面的配置启用官方凭据服务，复用上一步保存在同一 Harness home 的密钥，并明确选择 Flash；不把密钥写进配置。

在新作品工作目录，用 **PowerShell 7** 执行。下面会创建 `headless.patch.yml`；已有同名配置时先另取文件名，并同步修改启动参数。本地完全执行模式允许 Agent 运行文件、打包器、浏览器和编码命令，不提供操作系统文件隔离，须在你授权执行的工作环境使用。

```powershell
$cinemaPwshPath = (Get-Command pwsh -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
$cinemaPwshYaml = ConvertTo-Json -InputObject $cinemaPwshPath -Compress
@"
- id: credentials
  disabled: false
  config:
    watch: false
- id: agent-default-model
  config:
    provider: deepseek-official
    model: deepseek-flash
    reasoningEffort: high
- id: pwsh-sandbox
  config:
    pwshPath: $cinemaPwshYaml
"@ | Set-Content -LiteralPath './headless.patch.yml' -Encoding utf8

$env:DSH_PERMISSION_MODE = 'danger-full-access'
npx --yes --package=@deepseek-ai/dsh@0.2.1-rc.2 dsh --profile headless --patch ./headless.patch.yml --json "/deepseek-code-cinema 做一支约一分钟的中文知识短片，解释为什么仰望星空是在看过去。完成有声音的MP4、可修改工程和审片，返回它们的完整路径及尚需人工确认的范围。"
```

使用同一操作系统用户和默认 Harness home，才能复用 Web 保存的凭据；若你设置了 `DSH_HOME`，两个入口应保持相同。上述环境变量只作用于当前终端及新子进程，任务结束后可关闭该终端或恢复自己原来的设置。此公开配置没有本次开发的私有预算门；自行控制服务费用，不把输出上限当成总费用上限。

长任务可以通过 UTF-8 标准输入传入原始任务文字。`--session-id` 仅接续已经存在且工作目录相符的会话；不用于凭空指定新会话。这个版本没有 `--model`、`--max-cost` 或 `--max-steps` CLI 参数，模型应由官方配置/设置选择，总费用需使用者另行控制。新 Skill 不会替使用者设置 API 限额或充值。

## 工具条件与证据

Windows 的 shell 执行器应明确使用 PowerShell 7，避免宿主自身的旧版本回退。具备图像能力声明只是前提；确认 Agent 实际用 `read_image` 读过渲染帧，不能把静帧读取说成听过声音或完整看过视频。

本项目实测的 Windows 默认 `workspace-write` 隔离阻止了 esbuild 与 Chrome 的进程通信。完整制作需要允许本地打包器、浏览器及编码子进程运行；见 [运行说明的环境诊断](../skill/deepseek-code-cinema/references/runtime.md)。在已经明确授权本机命令权限的环境中，headless 可通过启动环境 `DSH_PERMISSION_MODE=danger-full-access` 使用本地完全执行模式；这不提供操作系统文件隔离，不应与测试资料/提示范围的隔离混为一谈。不要把忽略安装脚本或禁用 Chrome 参数当成这一权限问题的通用修法。

检查实际会话 `request/header` 中 provider、model、reasoningEffort 等配置字段，再结合核对当天官方映射说明型号；不要用模型口头自称证明身份。完整独立样片与费用记录见 [验证记录](../validation/README.md)，本文的操作说明不等同于所有路径都已实测。

官方依据：[发行版](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-rc.2)、[用户指南](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.2/docs/user/guide/providers.md)、[Headless](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.2/packages/bundle/headless/README.md)、[CLI 帮助](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.2/docs/cli-help.md)。
