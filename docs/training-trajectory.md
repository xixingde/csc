# 训练轨迹数据收集

CSC 可以将每轮对话的 LLM 输入和输出持久化保存在项目根目录下，用于监督微调（SFT）或离线分析。

## 默认行为

训练轨迹数据收集功能默认**关闭**。会话记录始终写入项目根目录下的 `.session_trajectory/` 文件夹（详见下文）。

## 启用训练数据收集

在启动 CSC 之前设置环境变量：

```bash
export CSC_COLLECT_TRAINING_TRAJECTORY=1
bun run dev
```

Windows PowerShell 中：
```
$env:CSC_COLLECT_TRAINING_TRAJECTORY = "1"
bun run dev
```

## 输出结构


| Path | Contents |
|------|----------|
| `.session_trajectory/<sessionId>.jsonl` | 主 Agent 对话记录 |
| `.session_trajectory/<sessionId>/<agentType-N>.jsonl` | 子 Agent 记录 (e.g. `explore-1.jsonl`) |
| `.train_collect_trajectory/training_<sessionId>.jsonl` |主 Agent 训练轮次数据（启用收集时） |
| `.train_collect_trajectory/training_<sessionId>/training_<agentType-N>.jsonl` | 子 Agent 训练轮次数据 |

每个训练 JSONL 文件以 `{"type":"model","model":"..."}` 开头，随后每轮 API 调用对应一个 JSON 对象（包含 `system`、`messages`、`tools`、`output`、`cumulative_tokens`）。

分叉子 Agent（`agentType === "fork"`）不包含在训练文件中。

## 会话记录

会话记录从 `~/.claude/projects/...` 迁移到了项目本地的 `.session_trajectory/` 目录。工具结果和边车元数据存放在同一个会话文件夹下。

`.session_trajectory/` 和 `.train_collect_trajectory/` 均已列入 `.gitignore`；如果要将数据复制到其他地方，请自行添加到忽略规则中。