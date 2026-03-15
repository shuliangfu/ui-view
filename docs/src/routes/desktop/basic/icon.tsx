/**
 * Icon 组件示例：展示全部内置图标，按分类分组。
 * 路由: /basic/icon
 */

import {
  Icon,
  IconActivity,
  IconAlertCircle,
  IconAlertTriangle,
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconArchive,
  IconArrowDown,
  IconArrowDownLeft,
  IconArrowDownRight,
  IconArrowLeft,
  IconArrowLeftRight,
  IconArrowRight,
  IconArrowUp,
  IconArrowUpLeft,
  IconArrowUpRight,
  IconAtSign,
  IconAward,
  IconBadgeCheck,
  IconBan,
  IconBanknote,
  IconBarChart,
  IconBattery,
  IconBatteryCharging,
  IconBell,
  IconBookmark,
  IconBookOpen,
  IconBox,
  IconBraces,
  IconBrandAcrobat,
  IconBrandAdobexd,
  IconBrandAfterEffects,
  IconBrandAlipay,
  IconBrandAndroid,
  IconBrandApple,
  IconBrandBehance,
  IconBrandBinance,
  IconBrandChrome,
  IconBrandDingtalk,
  IconBrandDiscord,
  IconBrandDocker,
  IconBrandDropbox,
  IconBrandFacebook,
  IconBrandFigma,
  IconBrandFirefox,
  IconBrandGithub,
  IconBrandGitlab,
  IconBrandGoogle,
  IconBrandIllustrator,
  IconBrandIndesign,
  IconBrandInstagram,
  IconBrandLightroom,
  IconBrandLine,
  IconBrandLinkedin,
  IconBrandMedium,
  IconBrandMicrosoft,
  IconBrandNetflix,
  IconBrandNotion,
  IconBrandNpm,
  IconBrandPaypal,
  IconBrandPhotoshop,
  IconBrandPinterest,
  IconBrandPremiere,
  IconBrandQq,
  IconBrandReddit,
  IconBrandSignal,
  IconBrandSkype,
  IconBrandSlack,
  IconBrandSnapchat,
  IconBrandSpotify,
  IconBrandStripe,
  IconBrandTelegram,
  IconBrandTiktok,
  IconBrandTrello,
  IconBrandTwitch,
  IconBrandTwitter,
  IconBrandVercel,
  IconBrandWechat,
  IconBrandWeibo,
  IconBrandWhatsapp,
  IconBrandYoutube,
  IconBrandZoom,
  IconBriefcase,
  IconBug,
  IconBuilding,
  IconCalculator,
  IconCalendar,
  IconCamera,
  IconCheck,
  IconCheckCircle,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCircle,
  IconCircleDollarSign,
  IconCircleDot,
  IconClipboard,
  IconClipboardCheck,
  IconClock,
  IconClose,
  IconCloud,
  IconCloudRain,
  IconCode,
  IconCoffee,
  IconCoins,
  IconColumns,
  IconCompass,
  IconCopy,
  IconCpu,
  IconCreditCard,
  IconCrown,
  IconDatabase,
  IconDisc,
  IconDollarSign,
  IconDownload,
  IconDroplet,
  IconEdit,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconFile,
  IconFileCheck,
  IconFilePlus,
  IconFileText,
  IconFileX,
  IconFilm,
  IconFilter,
  IconFingerprint,
  IconFlag,
  IconFlame,
  IconFolder,
  IconFolderOpen,
  IconForward,
  IconGem,
  IconGift,
  IconGitBranch,
  IconGlobe,
  IconGraduationCap,
  IconGrid,
  IconGripVertical,
  IconHandshake,
  IconHash,
  IconHeadphones,
  IconHeart,
  IconHeartPulse,
  IconHelpCircle,
  IconHistory,
  IconHome,
  IconImage,
  IconImagePlus,
  IconInbox,
  IconInfo,
  IconKanban,
  IconKey,
  IconLamp,
  IconLandmark,
  IconLayers,
  IconLibrary,
  IconLink,
  IconLink2,
  IconList,
  IconLoader2,
  IconLock,
  IconLogIn,
  IconLogOut,
  IconMail,
  IconMailOpen,
  IconMapPin,
  IconMaximize2,
  IconMegaphone,
  IconMenu,
  IconMessageCircle,
  IconMessageSquare,
  IconMic,
  IconMicOff,
  IconMinimize2,
  IconMinus,
  IconMinusCircle,
  IconMoon,
  IconMoreHorizontal,
  IconMoreVertical,
  IconMusic,
  IconNavigation,
  IconNewspaper,
  IconNotebookPen,
  IconPackage,
  IconPaperClip,
  IconParkingCircle,
  IconPause,
  IconPercent,
  IconPhone,
  IconPieChart,
  IconPiggyBank,
  IconPill,
  IconPin,
  IconPlane,
  IconPlay,
  IconPlus,
  IconPlusCircle,
  IconPodcast,
  IconPower,
  IconPrinter,
  IconRadio,
  IconReceipt,
  IconRedo,
  IconRefresh,
  IconRepeat,
  IconReply,
  IconRotateCcw,
  IconRotateCw,
  IconRss,
  IconSave,
  IconScale,
  IconScan,
  IconScanBarcode,
  IconScissors,
  IconScrollText,
  IconSearch,
  IconSend,
  IconServer,
  IconSettings,
  IconShare,
  IconShield,
  IconShieldAlert,
  IconShieldCheck,
  IconShip,
  IconShoppingBag,
  IconShoppingCart,
  IconShuffle,
  IconSignature,
  IconSkipBack,
  IconSkipForward,
  IconSlidersHorizontal,
  IconSnowflake,
  IconSparkles,
  IconSquare,
  IconStamp,
  IconStar,
  IconStethoscope,
  IconStickyNote,
  IconStop,
  IconStore,
  IconSun,
  IconSyringe,
  IconTag,
  IconTarget,
  IconTerminal,
  IconTestTube,
  IconThermometer,
  IconThumbsDown,
  IconThumbsUp,
  IconTicket,
  IconTimer,
  IconTokenAda,
  IconTokenAlgo,
  IconTokenArb,
  IconTokenAtom,
  IconTokenAvax,
  IconTokenBnb,
  IconTokenBtc,
  IconTokenCro,
  IconTokenDai,
  IconTokenDoge,
  IconTokenDot,
  IconTokenEth,
  IconTokenFil,
  IconTokenFtm,
  IconTokenLink,
  IconTokenLtc,
  IconTokenMatic,
  IconTokenNear,
  IconTokenOp,
  IconTokenPepe,
  IconTokenShib,
  IconTokenSol,
  IconTokenSui,
  IconTokenTrx,
  IconTokenUni,
  IconTokenUsdc,
  IconTokenUsdt,
  IconTokenWbtc,
  IconTokenXrp,
  IconTrain,
  IconTrash,
  IconTrendingDown,
  IconTrendingUp,
  IconTruck,
  IconTv,
  IconType,
  IconUmbrella,
  IconUndo,
  IconUnlock,
  IconUpload,
  IconUser,
  IconUserCog,
  IconUserMinus,
  IconUserPlus,
  IconUsers,
  IconUtensils,
  IconVideo,
  IconVolume,
  IconVolumeOff,
  IconVote,
  IconWallet,
  IconWifi,
  IconWifiOff,
  IconWind,
  IconWine,
  IconWrench,
  IconXCircle,
  IconZoomIn,
  IconZoomOut,
  Paragraph,
  Title,
} from "@dreamer/ui-view";
import type { IconComponentProps } from "@dreamer/ui-view";

/** 图标组件类型：与内置图标签名一致 */
type IconComponentType = (props?: IconComponentProps) => unknown;

/** 单个图标展示：图标 + 名称 */
function IconItem(
  { Component, name }: { Component: IconComponentType; name: string },
) {
  return (
    <div class="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 min-w-[88px]">
      <Component size="md" />
      <span class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-full">
        {name}
      </span>
    </div>
  );
}

/** 分类区块（level 为标题层级：2 大标题、3 分类、4 小标题） */
function IconGroup(
  { title, items, level = 2 }: {
    title: string;
    items: Array<{ Component: IconComponentType; name: string }>;
    level?: 1 | 2 | 3 | 4;
  },
) {
  return (
    <section class="space-y-3">
      <Title level={level}>{title}</Title>
      <div class="flex flex-wrap gap-2">
        {items.map((item) => (
          <div key={item.name}>
            <IconItem Component={item.Component} name={item.name} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** 简单 SVG 占位（圆点），用于演示纯容器用法 */
function DotSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" class="w-full h-full">
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}

export default function BasicIcon() {
  const 操作 = [
    { Component: IconClose, name: "Close" },
    { Component: IconEdit, name: "Edit" },
    { Component: IconTrash, name: "Trash" },
    { Component: IconCopy, name: "Copy" },
    { Component: IconClipboard, name: "Clipboard" },
    { Component: IconDownload, name: "Download" },
    { Component: IconSave, name: "Save" },
    { Component: IconUndo, name: "Undo" },
    { Component: IconRedo, name: "Redo" },
    { Component: IconRefresh, name: "Refresh" },
    { Component: IconRotateCw, name: "RotateCw" },
    { Component: IconRotateCcw, name: "RotateCcw" },
    { Component: IconMaximize2, name: "Maximize2" },
    { Component: IconMinimize2, name: "Minimize2" },
    { Component: IconSettings, name: "Settings" },
    { Component: IconFilter, name: "Filter" },
    { Component: IconArchive, name: "Archive" },
    { Component: IconPin, name: "Pin" },
    { Component: IconScissors, name: "Scissors" },
    { Component: IconArrowLeftRight, name: "ArrowLeftRight" },
    { Component: IconCalculator, name: "Calculator" },
    { Component: IconMoreVertical, name: "MoreVertical" },
    { Component: IconMoreHorizontal, name: "MoreHorizontal" },
    { Component: IconPrinter, name: "Printer" },
  ];

  const 方向导航 = [
    { Component: IconChevronDown, name: "ChevronDown" },
    { Component: IconChevronUp, name: "ChevronUp" },
    { Component: IconChevronLeft, name: "ChevronLeft" },
    { Component: IconChevronRight, name: "ChevronRight" },
    { Component: IconArrowLeft, name: "ArrowLeft" },
    { Component: IconArrowRight, name: "ArrowRight" },
    { Component: IconArrowUp, name: "ArrowUp" },
    { Component: IconArrowDown, name: "ArrowDown" },
    { Component: IconArrowUpRight, name: "ArrowUpRight" },
    { Component: IconArrowDownRight, name: "ArrowDownRight" },
    { Component: IconArrowUpLeft, name: "ArrowUpLeft" },
    { Component: IconArrowDownLeft, name: "ArrowDownLeft" },
    { Component: IconHome, name: "Home" },
    { Component: IconExternalLink, name: "ExternalLink" },
  ];

  const 内容 = [
    { Component: IconSearch, name: "Search" },
    { Component: IconFile, name: "File" },
    { Component: IconFileText, name: "FileText" },
    { Component: IconFilePlus, name: "FilePlus" },
    { Component: IconFileCheck, name: "FileCheck" },
    { Component: IconFileX, name: "FileX" },
    { Component: IconFolder, name: "Folder" },
    { Component: IconFolderOpen, name: "FolderOpen" },
    { Component: IconImage, name: "Image" },
    { Component: IconImagePlus, name: "ImagePlus" },
    { Component: IconLink, name: "Link" },
    { Component: IconLink2, name: "Link2" },
    { Component: IconMail, name: "Mail" },
    { Component: IconMailOpen, name: "MailOpen" },
    { Component: IconReply, name: "Reply" },
    { Component: IconForward, name: "Forward" },
    { Component: IconBookOpen, name: "BookOpen" },
    { Component: IconMessageSquare, name: "MessageSquare" },
    { Component: IconSend, name: "Send" },
    { Component: IconPaperClip, name: "PaperClip" },
    { Component: IconInbox, name: "Inbox" },
    { Component: IconMessageCircle, name: "MessageCircle" },
    { Component: IconPhone, name: "Phone" },
    { Component: IconRss, name: "Rss" },
    { Component: IconHash, name: "Hash" },
    { Component: IconClipboardCheck, name: "ClipboardCheck" },
    { Component: IconStickyNote, name: "StickyNote" },
    { Component: IconScrollText, name: "ScrollText" },
    { Component: IconSignature, name: "Signature" },
  ];

  const 状态反馈 = [
    { Component: IconCheck, name: "Check" },
    { Component: IconCheckCircle, name: "CheckCircle" },
    { Component: IconXCircle, name: "XCircle" },
    { Component: IconInfo, name: "Info" },
    { Component: IconAlertCircle, name: "AlertCircle" },
    { Component: IconAlertTriangle, name: "AlertTriangle" },
    { Component: IconHelpCircle, name: "HelpCircle" },
    { Component: IconBell, name: "Bell" },
    { Component: IconShield, name: "Shield" },
    { Component: IconShieldAlert, name: "ShieldAlert" },
    { Component: IconShieldCheck, name: "ShieldCheck" },
    { Component: IconBan, name: "Ban" },
    { Component: IconLoader2, name: "Loader2" },
    { Component: IconTimer, name: "Timer" },
  ];

  const 媒体 = [
    { Component: IconPlay, name: "Play" },
    { Component: IconPause, name: "Pause" },
    { Component: IconStop, name: "Stop" },
    { Component: IconSkipBack, name: "SkipBack" },
    { Component: IconSkipForward, name: "SkipForward" },
    { Component: IconRepeat, name: "Repeat" },
    { Component: IconShuffle, name: "Shuffle" },
    { Component: IconVolume, name: "Volume" },
    { Component: IconVolumeOff, name: "VolumeOff" },
    { Component: IconHeadphones, name: "Headphones" },
    { Component: IconMusic, name: "Music" },
    { Component: IconMic, name: "Mic" },
    { Component: IconMicOff, name: "MicOff" },
    { Component: IconCamera, name: "Camera" },
    { Component: IconVideo, name: "Video" },
    { Component: IconNewspaper, name: "Newspaper" },
    { Component: IconRadio, name: "Radio" },
    { Component: IconPodcast, name: "Podcast" },
    { Component: IconMegaphone, name: "Megaphone" },
    { Component: IconTv, name: "Tv" },
    { Component: IconFilm, name: "Film" },
    { Component: IconCircleDot, name: "CircleDot" },
    { Component: IconDisc, name: "Disc" },
  ];

  const 用户社交 = [
    { Component: IconUser, name: "User" },
    { Component: IconUserPlus, name: "UserPlus" },
    { Component: IconUserMinus, name: "UserMinus" },
    { Component: IconUsers, name: "Users" },
    { Component: IconUserCog, name: "UserCog" },
    { Component: IconHeart, name: "Heart" },
    { Component: IconStar, name: "Star" },
    { Component: IconBookmark, name: "Bookmark" },
    { Component: IconShare, name: "Share" },
    { Component: IconThumbsUp, name: "ThumbsUp" },
    { Component: IconThumbsDown, name: "ThumbsDown" },
    { Component: IconLock, name: "Lock" },
    { Component: IconUnlock, name: "Unlock" },
    { Component: IconAtSign, name: "AtSign" },
    { Component: IconCrown, name: "Crown" },
    { Component: IconTicket, name: "Ticket" },
    { Component: IconBadgeCheck, name: "BadgeCheck" },
    { Component: IconStore, name: "Store" },
    { Component: IconScanBarcode, name: "ScanBarcode" },
    { Component: IconSlidersHorizontal, name: "SlidersHorizontal" },
  ];

  const 时间地点 = [
    { Component: IconCalendar, name: "Calendar" },
    { Component: IconClock, name: "Clock" },
    { Component: IconMapPin, name: "MapPin" },
    { Component: IconTag, name: "Tag" },
    { Component: IconCompass, name: "Compass" },
    { Component: IconGlobe, name: "Globe" },
    { Component: IconNavigation, name: "Navigation" },
    { Component: IconPlane, name: "Plane" },
    { Component: IconShip, name: "Ship" },
    { Component: IconTrain, name: "Train" },
    { Component: IconParkingCircle, name: "ParkingCircle" },
  ];

  const 布局视图 = [
    { Component: IconGrid, name: "Grid" },
    { Component: IconList, name: "List" },
    { Component: IconLayers, name: "Layers" },
    { Component: IconColumns, name: "Columns" },
    { Component: IconAlignLeft, name: "AlignLeft" },
    { Component: IconAlignCenter, name: "AlignCenter" },
    { Component: IconAlignRight, name: "AlignRight" },
    { Component: IconType, name: "Type" },
    { Component: IconCircle, name: "Circle" },
    { Component: IconSquare, name: "Square" },
    { Component: IconGripVertical, name: "GripVertical" },
    { Component: IconZoomIn, name: "ZoomIn" },
    { Component: IconZoomOut, name: "ZoomOut" },
  ];

  const 数据图表 = [
    { Component: IconBarChart, name: "BarChart" },
    { Component: IconPieChart, name: "PieChart" },
    { Component: IconTrendingUp, name: "TrendingUp" },
    { Component: IconTrendingDown, name: "TrendingDown" },
  ];

  /** 三、大型门户网站常见图标（按 ICON_ANALYSIS 小标题分类） */
  const 新闻资讯 = [
    { Component: IconFileText, name: "FileText" },
    { Component: IconRss, name: "Rss" },
    { Component: IconBookOpen, name: "BookOpen" },
    { Component: IconNewspaper, name: "Newspaper" },
    { Component: IconRadio, name: "Radio" },
    { Component: IconPodcast, name: "Podcast" },
    { Component: IconMegaphone, name: "Megaphone" },
  ];
  const 视频影视 = [
    { Component: IconVideo, name: "Video" },
    { Component: IconPlay, name: "Play" },
    { Component: IconPause, name: "Pause" },
    { Component: IconCamera, name: "Camera" },
    { Component: IconTv, name: "Tv" },
    { Component: IconFilm, name: "Film" },
    { Component: IconCircleDot, name: "CircleDot" },
    { Component: IconBookmark, name: "Bookmark" },
  ];
  const 音乐音频 = [
    { Component: IconMusic, name: "Music" },
    { Component: IconHeadphones, name: "Headphones" },
    { Component: IconMic, name: "Mic" },
    { Component: IconVolume, name: "Volume" },
    { Component: IconDisc, name: "Disc" },
    { Component: IconRadio, name: "Radio" },
    { Component: IconPodcast, name: "Podcast" },
  ];
  const 社交互动 = [
    { Component: IconHeart, name: "Heart" },
    { Component: IconStar, name: "Star" },
    { Component: IconShare, name: "Share" },
    { Component: IconMessageCircle, name: "MessageCircle" },
    { Component: IconAtSign, name: "AtSign" },
    { Component: IconThumbsUp, name: "ThumbsUp" },
    { Component: IconThumbsDown, name: "ThumbsDown" },
    { Component: IconSend, name: "Send" },
  ];
  const 电商购物 = [
    { Component: IconShoppingCart, name: "ShoppingCart" },
    { Component: IconPackage, name: "Package" },
    { Component: IconCreditCard, name: "CreditCard" },
    { Component: IconTruck, name: "Truck" },
    { Component: IconStore, name: "Store" },
    { Component: IconTag, name: "Tag" },
    { Component: IconGift, name: "Gift" },
    { Component: IconReceipt, name: "Receipt" },
    { Component: IconScanBarcode, name: "ScanBarcode" },
  ];
  const 搜索发现 = [
    { Component: IconSearch, name: "Search" },
    { Component: IconFilter, name: "Filter" },
    { Component: IconGrid, name: "Grid" },
    { Component: IconList, name: "List" },
    { Component: IconSlidersHorizontal, name: "SlidersHorizontal" },
    { Component: IconSparkles, name: "Sparkles" },
    { Component: IconTrendingUp, name: "TrendingUp" },
    { Component: IconClock, name: "Clock" },
  ];
  const 用户会员 = [
    { Component: IconUser, name: "User" },
    { Component: IconUsers, name: "Users" },
    { Component: IconUserPlus, name: "UserPlus" },
    { Component: IconBookmark, name: "Bookmark" },
    { Component: IconCrown, name: "Crown" },
    { Component: IconTicket, name: "Ticket" },
    { Component: IconAward, name: "Award" },
    { Component: IconBadgeCheck, name: "BadgeCheck" },
  ];
  const 通知消息 = [
    { Component: IconBell, name: "Bell" },
    { Component: IconMail, name: "Mail" },
    { Component: IconMessageCircle, name: "MessageCircle" },
    { Component: IconInbox, name: "Inbox" },
    { Component: IconMailOpen, name: "MailOpen" },
    { Component: IconMessageSquare, name: "MessageSquare" },
  ];
  const 设置账户 = [
    { Component: IconSettings, name: "Settings" },
    { Component: IconKey, name: "Key" },
    { Component: IconLock, name: "Lock" },
    { Component: IconLogIn, name: "LogIn" },
    { Component: IconLogOut, name: "LogOut" },
    { Component: IconUserCog, name: "UserCog" },
    { Component: IconSun, name: "Sun" },
    { Component: IconMoon, name: "Moon" },
  ];

  /** Web3：钱包/链、代币、链上、安全 */
  const Web3 = [
    { Component: IconLink2, name: "Link2" },
    { Component: IconBraces, name: "Braces" },
    { Component: IconCircleDollarSign, name: "CircleDollarSign" },
    { Component: IconFlame, name: "Flame" },
    { Component: IconScan, name: "Scan" },
    { Component: IconFingerprint, name: "Fingerprint" },
    { Component: IconShieldCheck, name: "ShieldCheck" },
    { Component: IconVote, name: "Vote" },
    { Component: IconWallet, name: "Wallet" },
    { Component: IconKey, name: "Key" },
    { Component: IconGem, name: "Gem" },
    { Component: IconImagePlus, name: "ImagePlus" },
    { Component: IconSparkles, name: "Sparkles" },
    { Component: IconLayers, name: "Layers" },
    { Component: IconPercent, name: "Percent" },
  ];

  /** 五、其它通用场景（按 ICON_ANALYSIS 小标题拆分展示） */
  const 安全合规 = [
    { Component: IconShield, name: "Shield" },
    { Component: IconShieldCheck, name: "ShieldCheck" },
    { Component: IconShieldAlert, name: "ShieldAlert" },
    { Component: IconFingerprint, name: "Fingerprint" },
    { Component: IconFileCheck, name: "FileCheck" },
    { Component: IconClipboardCheck, name: "ClipboardCheck" },
    { Component: IconLock, name: "Lock" },
    { Component: IconKey, name: "Key" },
  ];
  const 文档合同 = [
    { Component: IconFile, name: "File" },
    { Component: IconFileText, name: "FileText" },
    { Component: IconFilePlus, name: "FilePlus" },
    { Component: IconFileX, name: "FileX" },
    { Component: IconStickyNote, name: "StickyNote" },
    { Component: IconScrollText, name: "ScrollText" },
    { Component: IconSignature, name: "Signature" },
    { Component: IconClipboard, name: "Clipboard" },
  ];
  const 教育学习 = [
    { Component: IconBookOpen, name: "BookOpen" },
    { Component: IconBookmark, name: "Bookmark" },
    { Component: IconGraduationCap, name: "GraduationCap" },
    { Component: IconLibrary, name: "Library" },
    { Component: IconNotebookPen, name: "NotebookPen" },
    { Component: IconLamp, name: "Lamp" },
  ];
  const 医疗健康 = [
    { Component: IconHeartPulse, name: "HeartPulse" },
    { Component: IconStethoscope, name: "Stethoscope" },
    { Component: IconPill, name: "Pill" },
    { Component: IconSyringe, name: "Syringe" },
    { Component: IconActivity, name: "Activity" },
  ];
  const 政府公共 = [
    { Component: IconBuilding, name: "Building" },
    { Component: IconFlag, name: "Flag" },
    { Component: IconLandmark, name: "Landmark" },
    { Component: IconScale, name: "Scale" },
    { Component: IconVote, name: "Vote" },
    { Component: IconStamp, name: "Stamp" },
  ];
  const 出行地图 = [
    { Component: IconMapPin, name: "MapPin" },
    { Component: IconCompass, name: "Compass" },
    { Component: IconTruck, name: "Truck" },
    { Component: IconPlane, name: "Plane" },
    { Component: IconShip, name: "Ship" },
    { Component: IconTrain, name: "Train" },
    { Component: IconNavigation, name: "Navigation" },
    { Component: IconParkingCircle, name: "ParkingCircle" },
  ];
  const 餐饮生活 = [
    { Component: IconGift, name: "Gift" },
    { Component: IconHome, name: "Home" },
    { Component: IconUtensils, name: "Utensils" },
    { Component: IconCoffee, name: "Coffee" },
    { Component: IconWine, name: "Wine" },
    { Component: IconShoppingBag, name: "ShoppingBag" },
  ];
  const 天气自然 = [
    { Component: IconSun, name: "Sun" },
    { Component: IconMoon, name: "Moon" },
    { Component: IconCloud, name: "Cloud" },
    { Component: IconDroplet, name: "Droplet" },
    { Component: IconCloudRain, name: "CloudRain" },
    { Component: IconSnowflake, name: "Snowflake" },
    { Component: IconWind, name: "Wind" },
    { Component: IconThermometer, name: "Thermometer" },
    { Component: IconUmbrella, name: "Umbrella" },
  ];
  const 工具开发 = [
    { Component: IconWrench, name: "Wrench" },
    { Component: IconCode, name: "Code" },
    { Component: IconTerminal, name: "Terminal" },
    { Component: IconCpu, name: "Cpu" },
    { Component: IconDatabase, name: "Database" },
    { Component: IconBug, name: "Bug" },
    { Component: IconTestTube, name: "TestTube" },
    { Component: IconGitBranch, name: "GitBranch" },
    { Component: IconBraces, name: "Braces" },
  ];
  const 办公协作 = [
    { Component: IconCalendar, name: "Calendar" },
    { Component: IconClock, name: "Clock" },
    { Component: IconUsers, name: "Users" },
    { Component: IconMail, name: "Mail" },
    { Component: IconKanban, name: "Kanban" },
    { Component: IconTimer, name: "Timer" },
    { Component: IconHandshake, name: "Handshake" },
  ];
  const 状态反馈其它 = [
    { Component: IconCheck, name: "Check" },
    { Component: IconXCircle, name: "XCircle" },
    { Component: IconInfo, name: "Info" },
    { Component: IconHelpCircle, name: "HelpCircle" },
    { Component: IconLoader2, name: "Loader2" },
    { Component: IconBan, name: "Ban" },
  ];
  const 其它零散 = [
    { Component: IconPlus, name: "Plus" },
    { Component: IconMinus, name: "Minus" },
    { Component: IconPlusCircle, name: "PlusCircle" },
    { Component: IconMinusCircle, name: "MinusCircle" },
    { Component: IconEye, name: "Eye" },
    { Component: IconEyeOff, name: "EyeOff" },
    { Component: IconUpload, name: "Upload" },
    { Component: IconMenu, name: "Menu" },
    { Component: IconLogIn, name: "LogIn" },
    { Component: IconLogOut, name: "LogOut" },
    { Component: IconBox, name: "Box" },
    { Component: IconBriefcase, name: "Briefcase" },
    { Component: IconPackage, name: "Package" },
    { Component: IconShoppingCart, name: "ShoppingCart" },
    { Component: IconCreditCard, name: "CreditCard" },
    { Component: IconBattery, name: "Battery" },
    { Component: IconBatteryCharging, name: "BatteryCharging" },
    { Component: IconWifi, name: "Wifi" },
    { Component: IconWifiOff, name: "WifiOff" },
    { Component: IconPower, name: "Power" },
    { Component: IconServer, name: "Server" },
    { Component: IconBanknote, name: "Banknote" },
    { Component: IconCoins, name: "Coins" },
    { Component: IconReceipt, name: "Receipt" },
    { Component: IconDollarSign, name: "DollarSign" },
    { Component: IconPiggyBank, name: "PiggyBank" },
    { Component: IconHistory, name: "History" },
    { Component: IconTarget, name: "Target" },
    { Component: IconAward, name: "Award" },
  ];

  /** Web3 常见代币 Logo（品牌色，24×24） */
  const 代币Logo = [
    { Component: IconTokenBtc, name: "BTC" },
    { Component: IconTokenEth, name: "ETH" },
    { Component: IconTokenUsdt, name: "USDT" },
    { Component: IconTokenUsdc, name: "USDC" },
    { Component: IconTokenDai, name: "DAI" },
    { Component: IconTokenBnb, name: "BNB" },
    { Component: IconTokenSol, name: "SOL" },
    { Component: IconTokenXrp, name: "XRP" },
    { Component: IconTokenMatic, name: "MATIC" },
    { Component: IconTokenAvax, name: "AVAX" },
    { Component: IconTokenLink, name: "LINK" },
    { Component: IconTokenDot, name: "DOT" },
    { Component: IconTokenAda, name: "ADA" },
    { Component: IconTokenDoge, name: "DOGE" },
    { Component: IconTokenLtc, name: "LTC" },
    { Component: IconTokenTrx, name: "TRX" },
    { Component: IconTokenUni, name: "UNI" },
    { Component: IconTokenAtom, name: "ATOM" },
    { Component: IconTokenArb, name: "ARB" },
    { Component: IconTokenOp, name: "OP" },
    { Component: IconTokenWbtc, name: "WBTC" },
    { Component: IconTokenShib, name: "SHIB" },
    { Component: IconTokenNear, name: "NEAR" },
    { Component: IconTokenFtm, name: "FTM" },
    { Component: IconTokenCro, name: "CRO" },
    { Component: IconTokenAlgo, name: "ALGO" },
    { Component: IconTokenFil, name: "FIL" },
    { Component: IconTokenSui, name: "SUI" },
    { Component: IconTokenPepe, name: "PEPE" },
  ];

  return (
    <div class="space-y-10">
      <div>
        <Title level={1}>Icon 图标</Title>
        <Paragraph>
          图标容器 Icon 统一
          size/class；内置图标按分类展示，每个图标单独导出，按需引入以控制包体积。
        </Paragraph>
      </div>

      <section class="space-y-4">
        <Title level={2}>容器 + 自定义 SVG</Title>
        <div class="flex flex-wrap items-center gap-6">
          <Icon size="xs">
            <DotSvg />
          </Icon>
          <Icon size="sm">
            <DotSvg />
          </Icon>
          <Icon size="md">
            <DotSvg />
          </Icon>
          <Icon size="lg">
            <DotSvg />
          </Icon>
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>自定义 class</Title>
        <div class="flex flex-wrap items-center gap-4">
          <IconClose size="md" class="text-red-500" />
          <IconCheckCircle size="md" class="text-green-500" />
          <IconInfo size="md" class="text-blue-500" />
          <IconHeart size="md" class="text-pink-500" />
          <IconStar size="md" class="text-amber-500" />
        </div>
      </section>

      <section class="space-y-10">
        <Title level={2}>内置图标</Title>

        <div class="space-y-6">
          <Title level={3}>一、操作与导航</Title>
          <IconGroup title="操作" items={操作} level={4} />
          <IconGroup title="方向 / 导航" items={方向导航} level={4} />
        </div>

        <div class="space-y-6">
          <Title level={3}>二、内容与媒体</Title>
          <IconGroup title="内容" items={内容} level={4} />
          <IconGroup title="媒体" items={媒体} level={4} />
        </div>

        <div class="space-y-6">
          <Title level={3}>三、大型门户网站常见图标</Title>
          <IconGroup title="新闻 / 资讯" items={新闻资讯} level={4} />
          <IconGroup title="视频 / 影视" items={视频影视} level={4} />
          <IconGroup title="音乐 / 音频" items={音乐音频} level={4} />
          <IconGroup title="社交 / 互动" items={社交互动} level={4} />
          <IconGroup title="电商 / 购物" items={电商购物} level={4} />
          <IconGroup title="搜索 / 发现" items={搜索发现} level={4} />
          <IconGroup title="用户 / 会员" items={用户会员} level={4} />
          <IconGroup title="通知 / 消息" items={通知消息} level={4} />
          <IconGroup title="设置 / 账户" items={设置账户} level={4} />
        </div>

        <div class="space-y-6">
          <Title level={3}>四、用户、社交与视图</Title>
          <IconGroup title="状态 / 反馈" items={状态反馈} level={4} />
          <IconGroup title="用户 / 社交" items={用户社交} level={4} />
          <IconGroup title="时间 / 地点" items={时间地点} level={4} />
          <IconGroup title="布局 / 视图" items={布局视图} level={4} />
          <IconGroup title="数据 / 图表" items={数据图表} level={4} />
        </div>

        <div class="space-y-6">
          <Title level={3}>五、Web3</Title>
          <IconGroup title="钱包 / 链 / 代币 / 安全" items={Web3} level={4} />
        </div>

        <div class="space-y-6">
          <Title level={3}>六、其它通用场景</Title>
          <IconGroup title="安全 / 合规" items={安全合规} level={4} />
          <IconGroup title="文档 / 合同" items={文档合同} level={4} />
          <IconGroup title="教育 / 学习" items={教育学习} level={4} />
          <IconGroup title="医疗 / 健康" items={医疗健康} level={4} />
          <IconGroup title="政府 / 公共" items={政府公共} level={4} />
          <IconGroup title="出行 / 地图" items={出行地图} level={4} />
          <IconGroup title="餐饮 / 生活" items={餐饮生活} level={4} />
          <IconGroup title="天气 / 自然" items={天气自然} level={4} />
          <IconGroup title="工具 / 开发" items={工具开发} level={4} />
          <IconGroup title="办公 / 协作" items={办公协作} level={4} />
          <IconGroup title="状态 / 反馈" items={状态反馈其它} level={4} />
          <IconGroup title="其它" items={其它零散} level={4} />
        </div>

        <div class="space-y-6">
          <Title level={3}>七、品牌与 App Logo</Title>
          <IconGroup
            title="大公司 / 平台"
            items={[
              { Component: IconBrandApple, name: "Apple" },
              { Component: IconBrandGoogle, name: "Google" },
              { Component: IconBrandMicrosoft, name: "Microsoft" },
              { Component: IconBrandAndroid, name: "Android" },
              { Component: IconBrandGithub, name: "GitHub" },
            ]}
            level={4}
          />
          <IconGroup
            title="支付"
            items={[
              { Component: IconBrandAlipay, name: "支付宝" },
              { Component: IconBrandPaypal, name: "PayPal" },
            ]}
            level={4}
          />
          <IconGroup
            title="社交 / 通讯"
            items={[
              { Component: IconBrandWechat, name: "微信" },
              { Component: IconBrandWhatsapp, name: "WhatsApp" },
              { Component: IconBrandTelegram, name: "Telegram" },
              { Component: IconBrandLine, name: "Line" },
              { Component: IconBrandSkype, name: "Skype" },
              { Component: IconBrandSignal, name: "Signal" },
              { Component: IconBrandTwitter, name: "X (Twitter)" },
              { Component: IconBrandFacebook, name: "Facebook" },
              { Component: IconBrandSnapchat, name: "Snapchat" },
              { Component: IconBrandQq, name: "QQ" },
              { Component: IconBrandWeibo, name: "微博" },
            ]}
            level={4}
          />
          <IconGroup
            title="图片 / 社交 / 社区"
            items={[
              { Component: IconBrandInstagram, name: "Instagram" },
              { Component: IconBrandReddit, name: "Reddit" },
              { Component: IconBrandPinterest, name: "Pinterest" },
            ]}
            level={4}
          />
          <IconGroup
            title="职场 / 会议 / 办公"
            items={[
              { Component: IconBrandLinkedin, name: "LinkedIn" },
              { Component: IconBrandZoom, name: "Zoom" },
              { Component: IconBrandDingtalk, name: "钉钉" },
              { Component: IconBrandNotion, name: "Notion" },
            ]}
            level={4}
          />
          <IconGroup
            title="设计 / 创意（Adobe、Figma、Behance）"
            items={[
              { Component: IconBrandFigma, name: "Figma" },
              { Component: IconBrandBehance, name: "Behance" },
              { Component: IconBrandPhotoshop, name: "Photoshop" },
              { Component: IconBrandIllustrator, name: "Illustrator" },
              { Component: IconBrandAfterEffects, name: "After Effects" },
              { Component: IconBrandPremiere, name: "Premiere Pro" },
              { Component: IconBrandAdobexd, name: "Adobe XD" },
              { Component: IconBrandAcrobat, name: "Acrobat" },
              { Component: IconBrandIndesign, name: "InDesign" },
              { Component: IconBrandLightroom, name: "Lightroom" },
            ]}
            level={4}
          />
          <IconGroup
            title="支付 / 开发（Stripe）"
            items={[
              { Component: IconBrandStripe, name: "Stripe" },
            ]}
            level={4}
          />
          <IconGroup
            title="云存储"
            items={[
              { Component: IconBrandDropbox, name: "Dropbox" },
            ]}
            level={4}
          />
          <IconGroup
            title="直播"
            items={[
              { Component: IconBrandTwitch, name: "Twitch" },
            ]}
            level={4}
          />
          <IconGroup
            title="前端 / 部署"
            items={[
              { Component: IconBrandVercel, name: "Vercel" },
            ]}
            level={4}
          />
          <IconGroup
            title="开发 / 协作 / 工具"
            items={[
              { Component: IconBrandGithub, name: "GitHub" },
              { Component: IconBrandGitlab, name: "GitLab" },
              { Component: IconBrandDocker, name: "Docker" },
              { Component: IconBrandNpm, name: "npm" },
              { Component: IconBrandSlack, name: "Slack" },
              { Component: IconBrandDiscord, name: "Discord" },
              { Component: IconBrandTrello, name: "Trello" },
            ]}
            level={4}
          />
          <IconGroup
            title="视频 / 流媒体"
            items={[
              { Component: IconBrandYoutube, name: "YouTube" },
              { Component: IconBrandTiktok, name: "TikTok" },
              { Component: IconBrandNetflix, name: "Netflix" },
            ]}
            level={4}
          />
          <IconGroup
            title="博客 / 阅读"
            items={[
              { Component: IconBrandMedium, name: "Medium" },
            ]}
            level={4}
          />
          <IconGroup
            title="浏览器"
            items={[
              { Component: IconBrandChrome, name: "Chrome" },
              { Component: IconBrandFirefox, name: "Firefox" },
            ]}
            level={4}
          />
          <IconGroup
            title="音乐"
            items={[
              { Component: IconBrandSpotify, name: "Spotify" },
            ]}
            level={4}
          />
          <IconGroup
            title="加密货币 / 交易"
            items={[
              { Component: IconBrandBinance, name: "Binance" },
            ]}
            level={4}
          />
        </div>

        <div class="space-y-6">
          <Title level={3}>八、Web3 代币 Logo</Title>
          <IconGroup title="常见代币（品牌色）" items={代币Logo} level={4} />
        </div>
      </section>
    </div>
  );
}
