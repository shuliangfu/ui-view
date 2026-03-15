# Icon 组件与内置图标分析

## 当前 Icon.tsx 的定位

- **纯容器组件**：只负责尺寸（xs/sm/md/lg）、对齐和
  `text-current`，不包含任何内置图形。
- **用法**：由业务或示例自行提供 SVG/图标字体作为 `children`，例如
  `<Icon size="md"><DotSvg /></Icon>`。
- **优点**：零图标体积、无额外依赖；缺点：常用图标需各处手写或依赖第三方包。

## 能否把常用图标集成到这里？

**可以**，且推荐做法是：**在包内提供一组「单文件单导出」的内置图标**，与现有
`Icon` 容器配合使用。

### 推荐方案：内置 SVG + 按需单独导出

| 项目             | 说明                                                                                                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **实现方式**     | 每个图标一个文件（如 `icons/Close.tsx`、`icons/Search.tsx`），内联 SVG，使用 `currentColor` 继承文字色。                                                                                              |
| **与 Icon 关系** | 每个图标组件内部使用 `<Icon size={} class={}>` 包裹自己的 SVG，对外暴露与 `Icon` 一致的 `size`/`class`，可单独使用 `<IconClose size="md" />`，也可再包一层 `<Icon><IconClose /></Icon>`（一般不必）。 |
| **导出方式**     | 在 `basic/mod.ts`（或 `icons/mod.ts`）中**按图标名单独导出**，例如 `export { IconClose } from "./icons/Close.tsx";`，不提供「整包 icons」的聚合导出，避免整包依赖过大。                               |
| **依赖与体积**   | 不依赖 lucide / heroicons 等外部图标库；只增加少量内联 SVG 与对现有 `Icon` 的引用。打包时只打进实际被 import 的图标，实现按需、树摇。                                                                 |
| **命名**         | 统一前缀如 `IconClose`、`IconSearch`，与容器 `Icon` 区分，且一眼可知是图标组件。                                                                                                                      |

### 为何不直接依赖 lucide / heroicons？

- 用户要求「全部分别独自导出避免包依赖过大」：若主包依赖整库再重导出，仍会拉取该库的解析与结构；若只依赖并重导出其中若干图标，需要对方包按「单图标单文件」且支持
  tree-shake，否则难以保证每个图标真正独立。
- 在包内用内联 SVG
  实现一批常用图标，**零额外依赖**，且每个文件只含一个图标，天然满足「分别独自导出」和按需引入。

### 当前内置图标（均单文件、单独导出）

- **操作**：`IconClose`、`IconEdit`、`IconTrash`、`IconCopy`、`IconDownload`、`IconSave`、`IconRefresh`、`IconSettings`、`IconFilter`、`IconMoreVertical`、`IconMoreHorizontal`、`IconPrinter`
- **方向/导航**：`IconChevronDown`、`IconChevronUp`、`IconChevronLeft`、`IconChevronRight`、`IconArrowLeft`、`IconArrowRight`、`IconHome`、`IconExternalLink`
- **内容**：`IconSearch`、`IconFile`、`IconFolder`、`IconImage`、`IconLink`、`IconMail`、`IconSend`、`IconPaperClip`、`IconInbox`
- **状态/反馈**：`IconCheck`、`IconCheckCircle`、`IconXCircle`、`IconInfo`、`IconAlertCircle`、`IconHelpCircle`、`IconBell`
- **媒体**：`IconPlay`、`IconPause`、`IconVolume`、`IconVolumeOff`、`IconCamera`
- **用户/社交**：`IconUser`、`IconUsers`、`IconHeart`、`IconStar`、`IconBookmark`、`IconShare`、`IconLock`、`IconUnlock`
- **时间/地点**：`IconCalendar`、`IconClock`、`IconMapPin`、`IconTag`
- **布局/视图**：`IconGrid`、`IconList`、`IconZoomIn`、`IconZoomOut`
- **其它**：`IconPlus`、`IconMinus`、`IconEye`、`IconEyeOff`、`IconUpload`、`IconMenu`、`IconLogIn`、`IconLogOut`、`IconSun`、`IconMoon`

以上均可按需引入，后续仍可继续增加，保持「一个图标一个文件、一个导出」。

## 结论

- **可以**在 `Icon.tsx` 所在包内集成常用图标。
- **推荐**：保持 `Icon` 为通用容器；在 `src/shared/basic/icons/`
  下为每个常用图标建单文件，内联 SVG，用 `Icon` 包裹并统一
  `size`/`class`；在入口处**按图标名分别导出**（如
  `IconClose`、`IconSearch`），不聚合整包，这样既满足「常用图标集成在这里」，又满足「分别独自导出、避免包依赖过大」和按需加载。

---

## 缺口分析：金融 / Web3 / 门户与通用场景

以下按**金融、Web3、大型门户、其它通用**四类分析：已有图标、缺口、建议新增，目标越全面越好。

### 一、金融方面 (Finance)

| 场景      | 已有                                         | 缺口 / 建议新增                                                                                                                    |
| --------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 支付/卡   | CreditCard, Wallet                           | **Banknote** 纸币、**Coins** 硬币、**Receipt** 收据/发票、**BadgeDollarSign** 或 **DollarSign** 金额/美元、**Percent** 百分比/利率 |
| 转账/交易 | —                                            | **ArrowLeftRight** 或 **SwapHorizontal** 转账/互换、**SendHorizontal** 已发、**Receiving** 收款（或复用 Arrow 组合）               |
| 理财/投资 | BarChart, PieChart, TrendingUp, TrendingDown | **PiggyBank** 储蓄、**Landmark** 银行建筑、**Scale** 天平/合规、**HandCoins** 理财/捐助                                            |
| 保险/合规 | Shield                                       | **FileCheck** 保单/审核通过、**ClipboardCheck** 合规清单、**Scale** 天平/公正                                                      |
| 通用金融  | Building, Briefcase                          | **Calculator** 计算器、**History** 交易历史、**CalendarClock** 定期/到期                                                           |

**金融类建议新增（优先）**：Banknote, Coins, Receipt, DollarSign（或 Percent）,
PiggyBank, Landmark, Scale, ArrowLeftRight/SwapHorizontal, Calculator,
FileCheck, ClipboardCheck, History。

---

### 二、Web3 方面 (Web3 / 区块链)

| 场景          | 已有                        | 缺口 / 建议新增                                                                                                             |
| ------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 钱包/链       | Wallet, Key                 | **WalletConnect** 风格「连接」、**Link2** 链/链接、**Blocks** 或 **Layers** 区块（Layers 已有）、**Braces** 智能合约/代码块 |
| 代币/NFT      | —                           | **CircleDollarSign** 代币、**ImagePlus** NFT/铸造、**Sparkles** 稀有/特效、**Gem** 宝石/NFT                                 |
| 链上操作      | Zap, Hash, Database, Server | **Fuel** 或 **Flame** Gas/燃料、**Network** 节点/网络、**Scan** 或 **ScanLine** 扫码/合约查验、**Fingerprint** 身份/签名    |
| 安全/签名     | Lock, Unlock, Key           | **ShieldCheck** 验证通过、**Fingerprint** 生物/签名、**KeyRound** 密钥、**Wallet2** 多钱包区分（可选）                      |
| 去中心化/社区 | Users, Share                | **GlobeLock** 或 **Globe**（已有） 去中心化、**Vote** 治理/投票、**MessageCircle**（已有） 社区                             |

**Web3 类建议新增（优先）**：Braces（智能合约）, Flame/Fuel（Gas）,
Scan/ScanLine（扫码/查验）, Sparkles（NFT/稀有）, Gem, ShieldCheck, Fingerprint,
Link2（链）, CircleDollarSign（代币）, Vote（治理）。

**已实现：Web3 常见代币 Logo**（`icons/tokens/`，品牌色
24×24，单独导出）：`IconTokenBtc`、`IconTokenEth`、`IconTokenUsdt`、`IconTokenUsdc`、`IconTokenDai`、`IconTokenBnb`、`IconTokenSol`、`IconTokenXrp`、`IconTokenMatic`、`IconTokenAvax`、`IconTokenLink`、`IconTokenDot`、`IconTokenAda`、`IconTokenDoge`、`IconTokenLtc`、`IconTokenTrx`、`IconTokenUni`、`IconTokenAtom`、`IconTokenArb`、`IconTokenOp`、`IconTokenWbtc`、`IconTokenShib`、`IconTokenNear`、`IconTokenSteth`。

---

### 三、大型门户网站常见 Logo/功能图标

门户站多为「品牌 logo + 通用功能图标」；品牌 logo
不适合做通用组件，这里只列**门户常用功能/频道**对应的通用图标。

| 场景      | 已有                                      | 缺口 / 建议新增                                                                                                                   |
| --------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 新闻/资讯 | FileText, Rss, BookOpen                   | **Newspaper** 新闻、**Radio** 广播、**Podcast** 播客、**Megaphone** 公告/营销                                                     |
| 视频/影视 | Video, Play, Pause, Camera                | **Tv** 电视/剧集、**Clapperboard** 影视、**Film** 胶片、**Live** 或 **CircleDot** 直播、**Subscription** 订阅（或 Bookmark 复用） |
| 音乐/音频 | Music, Headphones, Mic, Volume*           | **Disc** 专辑、**Radio** 电台、**Podcast** 播客                                                                                   |
| 社交/互动 | Heart, Star, Share, MessageCircle, AtSign | **ThumbsUp** 赞、**ThumbsDown** 踩、**SendHorizontal** 发送、**Quote** 引用、**Mention** @（AtSign 已有）                         |
| 电商/购物 | ShoppingCart, Package, CreditCard, Truck  | **Store** 店铺、**Tag**（已有） 标签/促销、**Gift**（已有）、**Receipt** 订单、**ScanBarcode** 扫码购                             |
| 搜索/发现 | Search, Filter, Grid, List                | **SlidersHorizontal** 筛选、**Sparkles** 推荐/精选、**TrendingUp**（已有） 热门、**Clock**（已有） 历史                           |
| 用户/会员 | User, Users, UserPlus, Bookmark           | **Crown** 会员/VIP、**Ticket** 票务/权益、**Award**（已有）、**BadgeCheck** 认证                                                  |
| 通知/消息 | Bell, Mail, MessageCircle, Inbox          | **MailOpen**（已有）、**MessageSquare**（已有）                                                                                   |
| 设置/账户 | Settings, Key, Lock, LogIn/Out            | **UserCog** 账户设置、**Sliders** 偏好、**Palette** 主题（可复用 Sun/Moon）                                                       |

**门户类建议新增（优先）**：Newspaper, Tv, Film, Radio, Podcast, Megaphone,
ThumbsUp, ThumbsDown, Store, Crown, Ticket, BadgeCheck, SlidersHorizontal,
UserCog, ScanBarcode（或 Scan）, Live/CircleDot（直播）。

---

### 四、其它通用场景（尽量全面）

| 场景      | 已有                                     | 缺口 / 建议新增                                                                       |
| --------- | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| 安全/合规 | Shield, Lock, Key                        | **ShieldCheck**、**ShieldAlert**、**Fingerprint**、**FileCheck**、**ClipboardCheck**  |
| 文档/合同 | File, FileText, Clipboard                | **FilePlus**、**FileCheck**、**FileX**、**StickyNote**、**ScrollText**、**Signature** |
| 教育/学习 | BookOpen, Bookmark                       | **GraduationCap**、**Library**、**NotebookPen**、**Lamp** 提示/帮助                   |
| 医疗/健康 | —                                        | **HeartPulse**、**Stethoscope**、**Pill**、**Syringe**、**Activity**（已有）          |
| 政府/公共 | Building, Flag                           | **Landmark**、**Scale**、**Vote**、**Stamp** 盖章                                     |
| 出行/地图 | MapPin, Compass, Car（可 Truck 代）      | **Plane**、**Ship**、**Train**、**Navigation**、**ParkingCircle**                     |
| 餐饮/生活 | Gift, Home                               | **Utensils** 餐饮、**Coffee**、**Wine**、**ShoppingBag**                              |
| 天气/自然 | Sun, Moon, Cloud, Droplet                | **CloudRain**、**Snowflake**、**Wind**、**Thermometer**、**Umbrella**                 |
| 工具/开发 | Wrench, Code, Terminal, Cpu, Database    | **Bug**、**TestTube**、**GitBranch**、**Code2**、**Braces**、**Binary**               |
| 办公/协作 | Calendar, Clock, Users, Mail             | **Kanban**、**Timer**、**Milestone**、**Workflow**、**Handshake**                     |
| 状态/反馈 | Check, XCircle, Alert*, Info, HelpCircle | **Loader2** 加载、**Timer** 倒计时、**RefreshCw**（已有 Refresh）、**Ban**（已有）    |

**其它建议新增（按需）**：ShieldCheck, ShieldAlert, FileCheck, FilePlus, FileX,
StickyNote, GraduationCap, HeartPulse, Landmark, Scale, Vote, Plane, Utensils,
CloudRain, Snowflake, Bug, GitBranch, Kanban, Timer, Loader2, Handshake。

---

### 五、汇总：建议新增图标清单（按优先级）

- **高（金融+Web3+门户核心）**\
  Banknote, Coins, Receipt, DollarSign, PiggyBank, Landmark, Scale,
  ArrowLeftRight, Calculator, FileCheck, ClipboardCheck, History, Braces, Flame,
  Scan, Sparkles, Gem, ShieldCheck, Fingerprint, Link2, CircleDollarSign, Vote,
  Newspaper, Tv, Film, Radio, Podcast, Megaphone, ThumbsUp, ThumbsDown, Store,
  Crown, Ticket, BadgeCheck, SlidersHorizontal, UserCog。

- **中（文档/教育/医疗/出行/天气）**\
  FilePlus, FileX, StickyNote, GraduationCap, HeartPulse, Plane, Utensils,
  CloudRain, Snowflake, Wind, Thermometer, Umbrella。

- **低（增强表达）**\
  Bug, GitBranch, Kanban, Timer, Loader2, Handshake, ScrollText, Signature,
  Lamp, Navigation, ParkingCircle。

实现时保持：24×24、stroke、`currentColor`、单文件单导出，与现有 `Icon*`
一致；新增后在 `icons/mod.ts` 导出，并在示例页 `icon.tsx` 中按分类展示。
