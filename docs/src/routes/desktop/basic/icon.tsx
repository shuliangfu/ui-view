import * as Flags from "@dreamer/ui-view/icons/flags/mod.ts";
/**
 * Icon 组件示例：展示全部内置图标，按分类分组。
 * 路由: /basic/icon
 */

import {
  Icon,
  IconAccessibility,
  IconActivity,
  IconAirplay,
  IconAlarmClock,
  IconAlertCircle,
  IconAlertTriangle,
  IconAlignCenter,
  IconAlignJustify,
  IconAlignLeft,
  IconAlignRight,
  IconAnchor,
  IconAngry,
  IconAperture,
  IconArchive,
  IconArrowDown,
  IconArrowDownLeft,
  IconArrowDownRight,
  IconArrowLeft,
  IconArrowLeftRight,
  IconArrowRight,
  IconArrowUp,
  IconArrowUpDown,
  IconArrowUpLeft,
  IconArrowUpRight,
  IconAtom,
  IconAtSign,
  IconAward,
  IconBaby,
  IconBadgeCheck,
  IconBan,
  IconBanknote,
  IconBarChart,
  IconBaseline,
  IconBath,
  IconBattery,
  IconBatteryCharging,
  IconBeaker,
  IconBed,
  IconBeer,
  IconBell,
  IconBellOff,
  IconBellRing,
  IconBike,
  IconBird,
  IconBlocks,
  IconBluetooth,
  IconBold,
  IconBookmark,
  IconBookOpen,
  IconBot,
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
  IconBrush,
  IconBug,
  IconBuilding,
  IconBuilding2,
  IconBus,
  IconCable,
  IconCake,
  IconCalculator,
  IconCalendar,
  IconCalendarCheck,
  IconCalendarDays,
  IconCalendarPlus,
  IconCalendarX,
  IconCamera,
  IconCaptions,
  IconCar,
  IconCast,
  IconCat,
  IconCheck,
  IconCheckCircle,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsDown,
  IconChevronsLeft,
  IconChevronsRight,
  IconChevronsUp,
  IconChevronUp,
  IconCircle,
  IconCircleDollarSign,
  IconCircleDot,
  IconCircleSplit,
  IconCircleUser,
  IconCircuitBoard,
  IconClapperboard,
  IconClipboard,
  IconClipboardCheck,
  IconClipboardCopy,
  IconClipboardList,
  IconClipboardPaste,
  IconClock,
  IconClose,
  IconCloud,
  IconCloudDownload,
  IconCloudLightning,
  IconCloudOff,
  IconCloudRain,
  IconCloudSnow,
  IconCloudUpload,
  IconCloudy,
  IconCode,
  IconCoffee,
  IconCoins,
  IconColumns,
  IconCompass,
  IconComponent,
  IconConstruction,
  IconContact,
  IconCookie,
  IconCopy,
  IconCornerDownLeft,
  IconCornerDownRight,
  IconCpu,
  IconCreditCard,
  IconCrop,
  IconCrosshair,
  IconCrown,
  IconDatabase,
  IconDiamond,
  IconDisc,
  IconDog,
  IconDollarSign,
  IconDoorClosed,
  IconDoorOpen,
  IconDownload,
  IconDroplet,
  IconDumbbell,
  IconEclipse,
  IconEdit,
  IconEqual,
  IconEqualNot,
  IconEraser,
  IconExitFullscreen,
  IconExpand,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconFactory,
  IconFile,
  IconFileArchive,
  IconFileAudio,
  IconFileCheck,
  IconFileCode,
  IconFileImage,
  IconFileJson,
  IconFilePlus,
  IconFileSearch,
  IconFileSpreadsheet,
  IconFileText,
  IconFileVideo,
  IconFileX,
  IconFilm,
  IconFilter,
  IconFingerprint,
  IconFish,
  IconFlag,
  IconFlame,
  IconFlower2,
  IconFocus,
  IconFolder,
  IconFolderMinus,
  IconFolderOpen,
  IconFolderPlus,
  IconFolderSearch,
  IconFolderX,
  IconFootprints,
  IconForward,
  IconFrown,
  IconFullscreen,
  IconGem,
  IconGhost,
  IconGift,
  IconGitBranch,
  IconGitCommit,
  IconGitCompare,
  IconGitMerge,
  IconGitPullRequest,
  IconGlobe,
  IconGraduationCap,
  IconGrid,
  IconGripVertical,
  IconHammer,
  IconHand,
  IconHandshake,
  IconHardDrive,
  IconHash,
  IconHeading,
  IconHeadphones,
  IconHeart,
  IconHeartPulse,
  IconHelpCircle,
  IconHexagon,
  IconHighlighter,
  IconHistory,
  IconHome,
  IconImage,
  IconImagePlus,
  IconImages,
  IconInbox,
  IconInfinity,
  IconInfo,
  IconItalic,
  IconKanban,
  IconKey,
  IconKeyboard,
  IconLamp,
  IconLandmark,
  IconLanguages,
  IconLaptop,
  IconLaugh,
  IconLayers,
  IconLayoutDashboard,
  IconLeaf,
  IconLibrary,
  IconLightbulb,
  IconLink,
  IconLink2,
  IconList,
  IconListChecks,
  IconListOrdered,
  IconLoader,
  IconLock,
  IconLogIn,
  IconLogOut,
  IconMail,
  IconMailOpen,
  IconMap,
  IconMapPin,
  IconMaximize2,
  IconMegaphone,
  IconMeh,
  IconMenu,
  IconMessageCircle,
  IconMessageSquare,
  IconMessageSquarePlus,
  IconMic,
  IconMicOff,
  IconMicroscope,
  IconMinimize2,
  IconMinus,
  IconMinusCircle,
  IconMonitor,
  IconMonitorSplit,
  IconMoon,
  IconMoreHorizontal,
  IconMoreVertical,
  IconMountain,
  IconMouse,
  IconMousePointer,
  IconMusic,
  IconNavigation,
  IconNewspaper,
  IconNotebookPen,
  IconOrbit,
  IconPackage,
  IconPaintbrush,
  IconPalette,
  IconPanelBottom,
  IconPanelLeft,
  IconPanelRight,
  IconPanelTop,
  IconPaperClip,
  IconParkingCircle,
  IconPartyPopper,
  IconPause,
  IconPencil,
  IconPenTool,
  IconPercent,
  IconPhone,
  IconPhoneCall,
  IconPhoneOff,
  IconPieChart,
  IconPiggyBank,
  IconPill,
  IconPin,
  IconPizza,
  IconPlane,
  IconPlay,
  IconPlug,
  IconPlus,
  IconPlusCircle,
  IconPodcast,
  IconPower,
  IconPrinter,
  IconQrCode,
  IconQuote,
  IconRadar,
  IconRadio,
  IconRatio,
  IconReceipt,
  IconRecycle,
  IconRedo,
  IconRefresh,
  IconRepeat,
  IconReplace,
  IconReply,
  IconRocket,
  IconRotateCcw,
  IconRotateCw,
  IconRoute,
  IconRss,
  IconSatellite,
  IconSave,
  IconScale,
  IconScaling,
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
  IconSkull,
  IconSlidersHorizontal,
  IconSmartphone,
  IconSmile,
  IconSmilePlus,
  IconSnowflake,
  IconSparkles,
  IconSpeaker,
  IconSpellCheck,
  IconSquare,
  IconStamp,
  IconStar,
  IconStethoscope,
  IconSticker,
  IconStickyNote,
  IconStop,
  IconStore,
  IconStrikethrough,
  IconSun,
  IconSunrise,
  IconSunset,
  IconSyringe,
  IconTable,
  IconTablet,
  IconTag,
  IconTarget,
  IconTelescope,
  IconTerminal,
  IconTestTube,
  IconThermometer,
  IconThumbsDown,
  IconThumbsUp,
  IconTicket,
  IconTimer,
  IconToggleLeft,
  IconToggleRight,
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
  IconTrash2,
  IconTreePine,
  IconTrendingDown,
  IconTrendingUp,
  IconTriangle,
  IconTruck,
  IconTv,
  IconType,
  IconUmbrella,
  IconUnderline,
  IconUndo,
  IconUnlock,
  IconUnplug,
  IconUpload,
  IconUsb,
  IconUser,
  IconUserCheck,
  IconUserCog,
  IconUserMinus,
  IconUserPlus,
  IconUsers,
  IconUserSearch,
  IconUserX,
  IconUtensils,
  IconVideo,
  IconVolume,
  IconVolume1,
  IconVolume2,
  IconVolumeOff,
  IconVote,
  IconWallet,
  IconWandSparkles,
  IconWarehouse,
  IconWaves,
  IconWifi,
  IconWifiOff,
  IconWind,
  IconWine,
  IconWorkflow,
  IconWrapText,
  IconWrench,
  IconXCircle,
  IconZap,
  IconZoomIn,
  IconZoomOut,
  Paragraph,
  Title,
} from "@dreamer/ui-view/basic";

import { CodeBlock } from "@dreamer/ui-view/data-display";

import { toast } from "@dreamer/ui-view/feedback";
import type { IconComponentProps } from "@dreamer/ui-view/basic";
import type { JSXRenderable } from "@dreamer/view";

/** 图标组件类型：与内置图标签名一致（与 ui-view 图标返回类型一致） */
type IconComponentType = (props?: IconComponentProps) => JSXRenderable;

/**
 * 解析可安全用于 TSX 的导出名（优先函数 `name`，与 `Icon…` 一致；压缩构建无 `name` 时退回拼接）。
 *
 * @param Component 内置图标或国旗组件
 * @param displayName 格内展示文案
 */
function resolveIconExportName(
  Component: IconComponentType,
  displayName: string,
): string {
  const fn = Component as unknown as { name?: string };
  if (
    typeof fn.name === "string" &&
    fn.name.length > 0 &&
    fn.name.startsWith("Icon")
  ) {
    return fn.name;
  }
  if (displayName.startsWith("Icon")) {
    return displayName;
  }
  const alnum = displayName.replace(/[^a-zA-Z0-9]+/g, "");
  if (alnum.length > 0) {
    return `Icon${
      alnum.length === 1
        ? alnum.toUpperCase()
        : alnum[0]!.toUpperCase() + alnum.slice(1)
    }`;
  }
  return displayName;
}

/**
 * 将 `<IconX size="md" />` 写入剪贴板；成功/失败以 Toast 提示
 *
 * @param exportName 如 `IconInfo`
 */
function copyIconComponentSnippet(exportName: string): void {
  const text = `<${exportName} size="md" />`;
  const w = globalThis;
  const clip = w.navigator?.clipboard;
  if (clip == null || typeof clip.writeText !== "function") {
    toast.error("复制失败", 3000, "top");
    return;
  }
  void clip
    .writeText(text)
    .then(() => {
      toast.success("复制成功", 2500, "top");
    })
    .catch(() => {
      toast.error("复制失败", 3000, "top");
    });
}

/** 单个图标展示：可点击复制 `<导出名 size="md" />`；下方为展示用短名/标签 */
function IconItem(
  { Component, name }: { Component: IconComponentType; name: string },
) {
  const exportName = resolveIconExportName(Component, name);
  const copyLabel = `复制：<${exportName} size="md" />`;
  return (
    <button
      type="button"
      class="flex w-full min-w-[88px] max-w-full flex-col items-center gap-1.5 p-3 rounded-lg border border-slate-200 dark:border-slate-500 bg-white dark:bg-slate-800 text-center text-slate-700 dark:text-slate-200 cursor-pointer transition-shadow hover:border-slate-300 hover:bg-slate-50 dark:hover:border-slate-400 dark:hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
      aria-label={copyLabel}
      onClick={() => {
        copyIconComponentSnippet(exportName);
      }}
    >
      <span
        class="pointer-events-none flex w-full flex-col items-center"
        aria-hidden
      >
        <Component size="md" />
      </span>
      <span
        class="pointer-events-none block w-full text-center text-xs text-slate-500 dark:text-slate-300 truncate"
        title={name}
      >
        {name}
      </span>
    </button>
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

const exampleThemeIcons = `{/* 浅色 / 自动 / 深色 主题图标 */}
<IconLightTheme size="md" />
<IconAutoTheme size="md" />
<IconDarkTheme size="md" />`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Icon 图标 · ui-view",
};

export default function BasicIcon() {
  const 操作 = [
    { Component: IconClose, name: "Close" },
    { Component: IconEdit, name: "Edit" },
    { Component: IconTrash, name: "Trash" },
    { Component: IconTrash2, name: "Trash2" },
    { Component: IconCopy, name: "Copy" },
    { Component: IconClipboard, name: "Clipboard" },
    { Component: IconClipboardCopy, name: "ClipboardCopy" },
    { Component: IconClipboardPaste, name: "ClipboardPaste" },
    { Component: IconClipboardList, name: "ClipboardList" },
    { Component: IconClipboardCheck, name: "ClipboardCheck" },
    { Component: IconDownload, name: "Download" },
    { Component: IconUpload, name: "Upload" },
    { Component: IconCloudDownload, name: "CloudDownload" },
    { Component: IconCloudUpload, name: "CloudUpload" },
    { Component: IconSave, name: "Save" },
    { Component: IconUndo, name: "Undo" },
    { Component: IconRedo, name: "Redo" },
    { Component: IconRefresh, name: "Refresh" },
    { Component: IconRotateCw, name: "RotateCw" },
    { Component: IconRotateCcw, name: "RotateCcw" },
    { Component: IconMaximize2, name: "Maximize2" },
    { Component: IconMinimize2, name: "Minimize2" },
    { Component: IconExpand, name: "Expand" },
    { Component: IconFullscreen, name: "Fullscreen" },
    { Component: IconExitFullscreen, name: "ExitFullscreen" },
    { Component: IconSettings, name: "Settings" },
    { Component: IconFilter, name: "Filter" },
    { Component: IconArchive, name: "Archive" },
    { Component: IconPin, name: "Pin" },
    { Component: IconScissors, name: "Scissors" },
    { Component: IconArrowLeftRight, name: "ArrowLeftRight" },
    { Component: IconArrowUpDown, name: "ArrowUpDown" },
    { Component: IconCalculator, name: "Calculator" },
    { Component: IconMoreVertical, name: "MoreVertical" },
    { Component: IconMoreHorizontal, name: "MoreHorizontal" },
    { Component: IconPrinter, name: "Printer" },
    { Component: IconReplace, name: "Replace" },
    { Component: IconSpellCheck, name: "SpellCheck" },
    { Component: IconCrop, name: "Crop" },
    { Component: IconScaling, name: "Scaling" },
    { Component: IconRatio, name: "Ratio" },
    { Component: IconRecycle, name: "Recycle" },
    { Component: IconHammer, name: "Hammer" },
    { Component: IconConstruction, name: "Construction" },
    { Component: IconScan, name: "Scan" },
    { Component: IconScanBarcode, name: "ScanBarcode" },
    { Component: IconQrCode, name: "QrCode" },
    { Component: IconMousePointer, name: "MousePointer" },
    { Component: IconHand, name: "Hand" },
  ];

  const 方向导航 = [
    { Component: IconChevronDown, name: "ChevronDown" },
    { Component: IconChevronUp, name: "ChevronUp" },
    { Component: IconChevronLeft, name: "ChevronLeft" },
    { Component: IconChevronRight, name: "ChevronRight" },
    { Component: IconChevronsDown, name: "ChevronsDown" },
    { Component: IconChevronsUp, name: "ChevronsUp" },
    { Component: IconChevronsLeft, name: "ChevronsLeft" },
    { Component: IconChevronsRight, name: "ChevronsRight" },
    { Component: IconArrowLeft, name: "ArrowLeft" },
    { Component: IconArrowRight, name: "ArrowRight" },
    { Component: IconArrowUp, name: "ArrowUp" },
    { Component: IconArrowDown, name: "ArrowDown" },
    { Component: IconArrowUpRight, name: "ArrowUpRight" },
    { Component: IconArrowDownRight, name: "ArrowDownRight" },
    { Component: IconArrowUpLeft, name: "ArrowUpLeft" },
    { Component: IconArrowDownLeft, name: "ArrowDownLeft" },
    { Component: IconCornerDownLeft, name: "CornerDownLeft" },
    { Component: IconCornerDownRight, name: "CornerDownRight" },
    { Component: IconHome, name: "Home" },
    { Component: IconExternalLink, name: "ExternalLink" },
    { Component: IconNavigation, name: "Navigation" },
    { Component: IconCompass, name: "Compass" },
    { Component: IconMapPin, name: "MapPin" },
    { Component: IconMap, name: "Map" },
    { Component: IconRoute, name: "Route" },
    { Component: IconFootprints, name: "Footprints" },
  ];

  const 内容 = [
    { Component: IconSearch, name: "Search" },
    { Component: IconFile, name: "File" },
    { Component: IconFileText, name: "FileText" },
    { Component: IconFilePlus, name: "FilePlus" },
    { Component: IconFileCheck, name: "FileCheck" },
    { Component: IconFileX, name: "FileX" },
    { Component: IconFileCode, name: "FileCode" },
    { Component: IconFileJson, name: "FileJson" },
    { Component: IconFileSpreadsheet, name: "FileSpreadsheet" },
    { Component: IconFileArchive, name: "FileArchive" },
    { Component: IconFileSearch, name: "FileSearch" },
    { Component: IconFileImage, name: "FileImage" },
    { Component: IconFileAudio, name: "FileAudio" },
    { Component: IconFileVideo, name: "FileVideo" },
    { Component: IconFolder, name: "Folder" },
    { Component: IconFolderOpen, name: "FolderOpen" },
    { Component: IconFolderPlus, name: "FolderPlus" },
    { Component: IconFolderSearch, name: "FolderSearch" },
    { Component: IconFolderMinus, name: "FolderMinus" },
    { Component: IconFolderX, name: "FolderX" },
    { Component: IconImage, name: "Image" },
    { Component: IconImagePlus, name: "ImagePlus" },
    { Component: IconImages, name: "Images" },
    { Component: IconPalette, name: "Palette" },
    { Component: IconLink, name: "Link" },
    { Component: IconLink2, name: "Link2" },
    { Component: IconMail, name: "Mail" },
    { Component: IconMailOpen, name: "MailOpen" },
    { Component: IconReply, name: "Reply" },
    { Component: IconForward, name: "Forward" },
    { Component: IconBookOpen, name: "BookOpen" },
    { Component: IconLibrary, name: "Library" },
    { Component: IconMessageSquare, name: "MessageSquare" },
    { Component: IconMessageSquarePlus, name: "MessageSquarePlus" },
    { Component: IconMessageCircle, name: "MessageCircle" },
    { Component: IconSend, name: "Send" },
    { Component: IconPaperClip, name: "PaperClip" },
    { Component: IconInbox, name: "Inbox" },
    { Component: IconPhone, name: "Phone" },
    { Component: IconPhoneCall, name: "PhoneCall" },
    { Component: IconPhoneOff, name: "PhoneOff" },
    { Component: IconRss, name: "Rss" },
    { Component: IconHash, name: "Hash" },
    { Component: IconStickyNote, name: "StickyNote" },
    { Component: IconScrollText, name: "ScrollText" },
    { Component: IconSignature, name: "Signature" },
    { Component: IconQuote, name: "Quote" },
    { Component: IconNewspaper, name: "Newspaper" },
    { Component: IconNotebookPen, name: "NotebookPen" },
    { Component: IconContact, name: "Contact" },
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
    { Component: IconBellOff, name: "BellOff" },
    { Component: IconBellRing, name: "BellRing" },
    { Component: IconShield, name: "Shield" },
    { Component: IconShieldAlert, name: "ShieldAlert" },
    { Component: IconShieldCheck, name: "ShieldCheck" },
    { Component: IconBan, name: "Ban" },
    { Component: IconLoader, name: "Loader" },
    { Component: IconTimer, name: "Timer" },
    { Component: IconZap, name: "Zap" },
    { Component: IconActivity, name: "Activity" },
    { Component: IconCrosshair, name: "Crosshair" },
    { Component: IconFocus, name: "Focus" },
    { Component: IconTarget, name: "Target" },
    { Component: IconThumbsUp, name: "ThumbsUp" },
    { Component: IconThumbsDown, name: "ThumbsDown" },
    { Component: IconBadgeCheck, name: "BadgeCheck" },
    { Component: IconAward, name: "Award" },
    { Component: IconSparkles, name: "Sparkles" },
    { Component: IconFlame, name: "Flame" },
    { Component: IconGhost, name: "Ghost" },
    { Component: IconSkull, name: "Skull" },
    { Component: IconInfinity, name: "Infinity" },
    { Component: IconEqual, name: "Equal" },
    { Component: IconEqualNot, name: "EqualNot" },
  ];

  const 表情情绪 = [
    { Component: IconSmile, name: "Smile" },
    { Component: IconSmilePlus, name: "SmilePlus" },
    { Component: IconLaugh, name: "Laugh" },
    { Component: IconFrown, name: "Frown" },
    { Component: IconMeh, name: "Meh" },
    { Component: IconAngry, name: "Angry" },
    { Component: IconHeart, name: "Heart" },
    { Component: IconHeartPulse, name: "HeartPulse" },
    { Component: IconStar, name: "Star" },
    { Component: IconSticker, name: "Sticker" },
    { Component: IconPartyPopper, name: "PartyPopper" },
    { Component: IconWandSparkles, name: "WandSparkles" },
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
    { Component: IconVolume1, name: "Volume1" },
    { Component: IconVolume2, name: "Volume2" },
    { Component: IconVolumeOff, name: "VolumeOff" },
    { Component: IconSpeaker, name: "Speaker" },
    { Component: IconHeadphones, name: "Headphones" },
    { Component: IconMusic, name: "Music" },
    { Component: IconMic, name: "Mic" },
    { Component: IconMicOff, name: "MicOff" },
    { Component: IconCamera, name: "Camera" },
    { Component: IconVideo, name: "Video" },
    { Component: IconRadio, name: "Radio" },
    { Component: IconPodcast, name: "Podcast" },
    { Component: IconMegaphone, name: "Megaphone" },
    { Component: IconTv, name: "Tv" },
    { Component: IconFilm, name: "Film" },
    { Component: IconDisc, name: "Disc" },
    { Component: IconCircleDot, name: "CircleDot" },
    { Component: IconClapperboard, name: "Clapperboard" },
    { Component: IconCaptions, name: "Captions" },
    { Component: IconCast, name: "Cast" },
    { Component: IconAirplay, name: "Airplay" },
    { Component: IconAperture, name: "Aperture" },
  ];

  const 用户社交 = [
    { Component: IconUser, name: "User" },
    { Component: IconUserPlus, name: "UserPlus" },
    { Component: IconUserMinus, name: "UserMinus" },
    { Component: IconUsers, name: "Users" },
    { Component: IconUserCog, name: "UserCog" },
    { Component: IconUserCheck, name: "UserCheck" },
    { Component: IconUserX, name: "UserX" },
    { Component: IconUserSearch, name: "UserSearch" },
    { Component: IconCircleUser, name: "CircleUser" },
    { Component: IconBookmark, name: "Bookmark" },
    { Component: IconShare, name: "Share" },
    { Component: IconLock, name: "Lock" },
    { Component: IconUnlock, name: "Unlock" },
    { Component: IconAtSign, name: "AtSign" },
    { Component: IconCrown, name: "Crown" },
    { Component: IconTicket, name: "Ticket" },
    { Component: IconStore, name: "Store" },
    { Component: IconHandshake, name: "Handshake" },
    { Component: IconAccessibility, name: "Accessibility" },
    { Component: IconBaby, name: "Baby" },
    { Component: IconBot, name: "Bot" },
  ];

  const 时间地点 = [
    { Component: IconCalendar, name: "Calendar" },
    { Component: IconCalendarDays, name: "CalendarDays" },
    { Component: IconCalendarCheck, name: "CalendarCheck" },
    { Component: IconCalendarPlus, name: "CalendarPlus" },
    { Component: IconCalendarX, name: "CalendarX" },
    { Component: IconClock, name: "Clock" },
    { Component: IconAlarmClock, name: "AlarmClock" },
    { Component: IconHistory, name: "History" },
    { Component: IconGlobe, name: "Globe" },
    { Component: IconPlane, name: "Plane" },
    { Component: IconShip, name: "Ship" },
    { Component: IconTrain, name: "Train" },
    { Component: IconCar, name: "Car" },
    { Component: IconTruck, name: "Truck" },
    { Component: IconBike, name: "Bike" },
    { Component: IconBus, name: "Bus" },
    { Component: IconParkingCircle, name: "ParkingCircle" },
    { Component: IconAnchor, name: "Anchor" },
    { Component: IconBed, name: "Bed" },
    { Component: IconBath, name: "Bath" },
    { Component: IconDoorOpen, name: "DoorOpen" },
    { Component: IconDoorClosed, name: "DoorClosed" },
    { Component: IconBuilding, name: "Building" },
    { Component: IconBuilding2, name: "Building2" },
    { Component: IconFactory, name: "Factory" },
    { Component: IconWarehouse, name: "Warehouse" },
    { Component: IconLandmark, name: "Landmark" },
  ];

  const 布局视图 = [
    { Component: IconGrid, name: "Grid" },
    { Component: IconList, name: "List" },
    { Component: IconListOrdered, name: "ListOrdered" },
    { Component: IconListChecks, name: "ListChecks" },
    { Component: IconLayers, name: "Layers" },
    { Component: IconColumns, name: "Columns" },
    { Component: IconTable, name: "Table" },
    { Component: IconLayoutDashboard, name: "LayoutDashboard" },
    { Component: IconPanelLeft, name: "PanelLeft" },
    { Component: IconPanelRight, name: "PanelRight" },
    { Component: IconPanelTop, name: "PanelTop" },
    { Component: IconPanelBottom, name: "PanelBottom" },
    { Component: IconAlignLeft, name: "AlignLeft" },
    { Component: IconAlignCenter, name: "AlignCenter" },
    { Component: IconAlignRight, name: "AlignRight" },
    { Component: IconAlignJustify, name: "AlignJustify" },
    { Component: IconType, name: "Type" },
    { Component: IconBold, name: "Bold" },
    { Component: IconItalic, name: "Italic" },
    { Component: IconUnderline, name: "Underline" },
    { Component: IconStrikethrough, name: "Strikethrough" },
    { Component: IconHeading, name: "Heading" },
    { Component: IconBaseline, name: "Baseline" },
    { Component: IconWrapText, name: "WrapText" },
    { Component: IconPencil, name: "Pencil" },
    { Component: IconEraser, name: "Eraser" },
    { Component: IconBrush, name: "Brush" },
    { Component: IconPaintbrush, name: "Paintbrush" },
    { Component: IconHighlighter, name: "Highlighter" },
    { Component: IconPenTool, name: "PenTool" },
    { Component: IconCircle, name: "Circle" },
    { Component: IconSquare, name: "Square" },
    { Component: IconTriangle, name: "Triangle" },
    { Component: IconHexagon, name: "Hexagon" },
    { Component: IconDiamond, name: "Diamond" },
    { Component: IconGripVertical, name: "GripVertical" },
    { Component: IconZoomIn, name: "ZoomIn" },
    { Component: IconZoomOut, name: "ZoomOut" },
    { Component: IconKanban, name: "Kanban" },
    { Component: IconComponent, name: "Component" },
    { Component: IconBlocks, name: "Blocks" },
    { Component: IconWorkflow, name: "Workflow" },
    { Component: IconMenu, name: "Menu" },
    { Component: IconSlidersHorizontal, name: "SlidersHorizontal" },
  ];

  const 数据图表 = [
    { Component: IconBarChart, name: "BarChart" },
    { Component: IconPieChart, name: "PieChart" },
    { Component: IconTrendingUp, name: "TrendingUp" },
    { Component: IconTrendingDown, name: "TrendingDown" },
    { Component: IconWallet, name: "Wallet" },
    { Component: IconCircleDollarSign, name: "CircleDollarSign" },
    { Component: IconPercent, name: "Percent" },
    { Component: IconCreditCard, name: "CreditCard" },
    { Component: IconBanknote, name: "Banknote" },
    { Component: IconCoins, name: "Coins" },
    { Component: IconReceipt, name: "Receipt" },
    { Component: IconDollarSign, name: "DollarSign" },
    { Component: IconPiggyBank, name: "PiggyBank" },
    { Component: IconShoppingCart, name: "ShoppingCart" },
    { Component: IconShoppingBag, name: "ShoppingBag" },
    { Component: IconPackage, name: "Package" },
    { Component: IconGift, name: "Gift" },
    { Component: IconTag, name: "Tag" },
    { Component: IconBriefcase, name: "Briefcase" },
    { Component: IconScale, name: "Scale" },
    { Component: IconVote, name: "Vote" },
    { Component: IconStamp, name: "Stamp" },
    { Component: IconFlag, name: "Flag" },
  ];

  const 设备网络 = [
    { Component: IconLaptop, name: "Laptop" },
    { Component: IconSmartphone, name: "Smartphone" },
    { Component: IconTablet, name: "Tablet" },
    { Component: IconMonitor, name: "Monitor" },
    { Component: IconMonitorSplit, name: "MonitorSplit" },
    { Component: IconKeyboard, name: "Keyboard" },
    { Component: IconMouse, name: "Mouse" },
    { Component: IconBattery, name: "Battery" },
    { Component: IconBatteryCharging, name: "BatteryCharging" },
    { Component: IconWifi, name: "Wifi" },
    { Component: IconWifiOff, name: "WifiOff" },
    { Component: IconPower, name: "Power" },
    { Component: IconServer, name: "Server" },
    { Component: IconHardDrive, name: "HardDrive" },
    { Component: IconCpu, name: "Cpu" },
    { Component: IconDatabase, name: "Database" },
    { Component: IconBluetooth, name: "Bluetooth" },
    { Component: IconPlug, name: "Plug" },
    { Component: IconUnplug, name: "Unplug" },
    { Component: IconCable, name: "Cable" },
    { Component: IconUsb, name: "Usb" },
    { Component: IconCircuitBoard, name: "CircuitBoard" },
    { Component: IconRadar, name: "Radar" },
    { Component: IconSatellite, name: "Satellite" },
    { Component: IconOrbit, name: "Orbit" },
  ];

  const 天气自然 = [
    { Component: IconSun, name: "Sun" },
    { Component: IconMoon, name: "Moon" },
    { Component: IconCloud, name: "Cloud" },
    { Component: IconCloudRain, name: "CloudRain" },
    { Component: IconCloudOff, name: "CloudOff" },
    { Component: IconCloudLightning, name: "CloudLightning" },
    { Component: IconCloudSnow, name: "CloudSnow" },
    { Component: IconCloudy, name: "Cloudy" },
    { Component: IconSnowflake, name: "Snowflake" },
    { Component: IconWind, name: "Wind" },
    { Component: IconThermometer, name: "Thermometer" },
    { Component: IconUmbrella, name: "Umbrella" },
    { Component: IconDroplet, name: "Droplet" },
    { Component: IconLeaf, name: "Leaf" },
    { Component: IconMountain, name: "Mountain" },
    { Component: IconWaves, name: "Waves" },
    { Component: IconSunrise, name: "Sunrise" },
    { Component: IconSunset, name: "Sunset" },
    { Component: IconFlower2, name: "Flower2" },
    { Component: IconTreePine, name: "TreePine" },
    { Component: IconEclipse, name: "Eclipse" },
    { Component: IconCircleSplit, name: "CircleSplit" },
  ];

  const 餐饮生活 = [
    { Component: IconUtensils, name: "Utensils" },
    { Component: IconCoffee, name: "Coffee" },
    { Component: IconWine, name: "Wine" },
    { Component: IconCake, name: "Cake" },
    { Component: IconPizza, name: "Pizza" },
    { Component: IconBeer, name: "Beer" },
    { Component: IconCookie, name: "Cookie" },
    { Component: IconPill, name: "Pill" },
    { Component: IconSyringe, name: "Syringe" },
    { Component: IconStethoscope, name: "Stethoscope" },
    { Component: IconDumbbell, name: "Dumbbell" },
    { Component: IconLamp, name: "Lamp" },
    { Component: IconLightbulb, name: "Lightbulb" },
    { Component: IconRocket, name: "Rocket" },
  ];

  const 动物 = [
    { Component: IconCat, name: "Cat" },
    { Component: IconDog, name: "Dog" },
    { Component: IconBird, name: "Bird" },
    { Component: IconFish, name: "Fish" },
  ];

  const 工具开发 = [
    { Component: IconWrench, name: "Wrench" },
    { Component: IconCode, name: "Code" },
    { Component: IconTerminal, name: "Terminal" },
    { Component: IconBug, name: "Bug" },
    { Component: IconTestTube, name: "TestTube" },
    { Component: IconGitBranch, name: "GitBranch" },
    { Component: IconGitCommit, name: "GitCommit" },
    { Component: IconGitMerge, name: "GitMerge" },
    { Component: IconGitPullRequest, name: "GitPullRequest" },
    { Component: IconGitCompare, name: "GitCompare" },
    { Component: IconBraces, name: "Braces" },
    { Component: IconAtom, name: "Atom" },
    { Component: IconBeaker, name: "Beaker" },
    { Component: IconMicroscope, name: "Microscope" },
    { Component: IconTelescope, name: "Telescope" },
    { Component: IconToggleLeft, name: "ToggleLeft" },
    { Component: IconToggleRight, name: "ToggleRight" },
    { Component: IconBox, name: "Box" },
    { Component: IconLanguages, name: "Languages" },
  ];

  const 其它零散 = [
    { Component: IconPlus, name: "Plus" },
    { Component: IconMinus, name: "Minus" },
    { Component: IconPlusCircle, name: "PlusCircle" },
    { Component: IconMinusCircle, name: "MinusCircle" },
    { Component: IconEye, name: "Eye" },
    { Component: IconEyeOff, name: "EyeOff" },
    { Component: IconLogIn, name: "LogIn" },
    { Component: IconLogOut, name: "LogOut" },
    { Component: IconKey, name: "Key" },
    { Component: IconFingerprint, name: "Fingerprint" },
    { Component: IconGem, name: "Gem" },
    { Component: IconGraduationCap, name: "GraduationCap" },
  ];

  /** 三、大型门户网站常见图标（场景速览，可与上文重复） */
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
    { Component: IconClapperboard, name: "Clapperboard" },
    { Component: IconCaptions, name: "Captions" },
    { Component: IconBookmark, name: "Bookmark" },
  ];
  const 音乐音频 = [
    { Component: IconMusic, name: "Music" },
    { Component: IconHeadphones, name: "Headphones" },
    { Component: IconMic, name: "Mic" },
    { Component: IconVolume, name: "Volume" },
    { Component: IconSpeaker, name: "Speaker" },
    { Component: IconDisc, name: "Disc" },
    { Component: IconRadio, name: "Radio" },
    { Component: IconPodcast, name: "Podcast" },
  ];
  const 社交互动 = [
    { Component: IconHeart, name: "Heart" },
    { Component: IconStar, name: "Star" },
    { Component: IconShare, name: "Share" },
    { Component: IconSmile, name: "Smile" },
    { Component: IconMessageCircle, name: "MessageCircle" },
    { Component: IconAtSign, name: "AtSign" },
    { Component: IconThumbsUp, name: "ThumbsUp" },
    { Component: IconThumbsDown, name: "ThumbsDown" },
    { Component: IconSend, name: "Send" },
    { Component: IconSticker, name: "Sticker" },
    { Component: IconPartyPopper, name: "PartyPopper" },
  ];
  const 电商购物 = [
    { Component: IconShoppingCart, name: "ShoppingCart" },
    { Component: IconPackage, name: "Package" },
    { Component: IconCreditCard, name: "CreditCard" },
    { Component: IconWallet, name: "Wallet" },
    { Component: IconCircleDollarSign, name: "CircleDollarSign" },
    { Component: IconPercent, name: "Percent" },
    { Component: IconTruck, name: "Truck" },
    { Component: IconStore, name: "Store" },
    { Component: IconTag, name: "Tag" },
    { Component: IconGift, name: "Gift" },
    { Component: IconReceipt, name: "Receipt" },
    { Component: IconScan, name: "Scan" },
    { Component: IconScanBarcode, name: "ScanBarcode" },
    { Component: IconQrCode, name: "QrCode" },
  ];
  const 搜索发现 = [
    { Component: IconSearch, name: "Search" },
    { Component: IconFilter, name: "Filter" },
    { Component: IconGrid, name: "Grid" },
    { Component: IconList, name: "List" },
    { Component: IconSlidersHorizontal, name: "SlidersHorizontal" },
    { Component: IconSparkles, name: "Sparkles" },
    { Component: IconFlame, name: "Flame" },
    { Component: IconTrendingUp, name: "TrendingUp" },
    { Component: IconRocket, name: "Rocket" },
    { Component: IconLightbulb, name: "Lightbulb" },
    { Component: IconClock, name: "Clock" },
  ];
  const 用户会员 = [
    { Component: IconUser, name: "User" },
    { Component: IconUsers, name: "Users" },
    { Component: IconUserPlus, name: "UserPlus" },
    { Component: IconCircleUser, name: "CircleUser" },
    { Component: IconBookmark, name: "Bookmark" },
    { Component: IconCrown, name: "Crown" },
    { Component: IconGem, name: "Gem" },
    { Component: IconTicket, name: "Ticket" },
    { Component: IconAward, name: "Award" },
    { Component: IconBadgeCheck, name: "BadgeCheck" },
  ];
  const 通知消息 = [
    { Component: IconBell, name: "Bell" },
    { Component: IconBellRing, name: "BellRing" },
    { Component: IconBellOff, name: "BellOff" },
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
    { Component: IconCircleSplit, name: "CircleSplit" },
    { Component: IconMonitorSplit, name: "MonitorSplit" },
    { Component: IconMoon, name: "Moon" },
    { Component: IconPalette, name: "Palette" },
    { Component: IconLanguages, name: "Languages" },
    { Component: IconAccessibility, name: "Accessibility" },
  ];

  /** 常见链上代币 Logo（品牌色，24×24） */
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

  /**
   * 自 `@dreamer/ui-view/icons/flags/mod.ts`（仅国旗子 barrel）收集全部 `IconFlag*`。
   * 勿对主入口 `import *` + Object.keys——会把全库钉进 docs shared chunk。
   * 短名与 ISO 两字母大写一致（如 `IconFlagCN`），由 `build-country-flags` 自 `flag-icons` 生成。
   */
  const 国家地区国旗: Array<
    { Component: IconComponentType; name: string }
  > = (() => {
    const out: Array<{ Component: IconComponentType; name: string }> = [];
    for (const key of Object.keys(Flags) as (keyof typeof Flags)[]) {
      if (!String(key).startsWith("IconFlag")) {
        continue;
      }
      const c = Flags[key];
      if (typeof c !== "function") continue;
      out.push({ Component: c as IconComponentType, name: String(key) });
    }
    out.sort((a, b) => a.name.localeCompare(b.name, "en"));
    return out;
  })();

  const importCode =
    `// 推荐：子 path / 单图标深路径（勿 import * 主入口扫全量）
import { Icon } from "@dreamer/ui-view/basic";
import { IconClose } from "@dreamer/ui-view/icons/Close.tsx";
import { IconCheck } from "@dreamer/ui-view/icons/Check.tsx";
import { IconSearch } from "@dreamer/ui-view/icons/Search.tsx";
import { IconPalette } from "@dreamer/ui-view/icons/Palette.tsx";
import { IconFlagCN } from "@dreamer/ui-view/icons/flags/standalone/IconFlagCN.tsx";

<Icon size="md"><YourSvg /></Icon>
<IconClose size="md" />
<IconSearch class="text-teal-500" />
<IconPalette size="md" />
<IconFlagCN size="md" />`;

  const exampleContainer = `<Icon size="xs"><DotSvg /></Icon>
<Icon size="sm"><DotSvg /></Icon>
<Icon size="md"><DotSvg /></Icon>
<Icon size="lg"><DotSvg /></Icon>`;

  const exampleBuiltinClass = `<IconClose size="md" class="text-red-500" />
<IconCheckCircle size="md" class="text-green-500" />
<IconInfo size="md" class="text-blue-500" />`;

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Icon 图标</Title>
        <Paragraph class="mt-2">
          Icon 容器支持 size（xs/sm/md/lg）、class、children（自定义
          SVG）；内置图标组件（如 IconClose、IconSearch）按需引入，支持
          size、class。另含国家/地区国旗（IconFlag+两字母 ISO，如
          IconFlagCN，每码一文件，见下文）。 Tailwind v4 + light/dark。
        </Paragraph>
      </section>

      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock
          title="代码示例"
          code={importCode}
          language="tsx"
          showLineNumbers
          wrapLongLines
        />
      </section>

      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <div class="space-y-4">
          <Title level={3}>Icon 容器 + 自定义 SVG</Title>
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
          <CodeBlock
            title="代码示例"
            code={exampleContainer}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>内置图标 size / class</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            内置图标支持 size、class，可用 class 改颜色等。
          </Paragraph>
          <div class="flex flex-wrap items-center gap-4">
            <IconClose size="md" class="text-red-500" />
            <IconCheckCircle size="md" class="text-green-500" />
            <IconInfo size="md" class="text-blue-500" />
            <IconHeart size="md" class="text-pink-500" />
            <IconStar size="md" class="text-amber-500" />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleBuiltinClass}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>主题图标（浅色 / 自动 / 深色）</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            太阳（浅色）、竖直黑白圆或显示器半分（自动）、月亮（深色）。
            CircleSplit 为左右对分、不倾斜，最贴近「亮/暗各半」。
          </Paragraph>
          <div class="flex flex-wrap items-center gap-6 rounded-lg border border-dashed border-slate-300 bg-slate-50/80 px-4 py-4 sm:gap-8 sm:px-6 dark:border-slate-600 dark:bg-slate-900/40">
            <div class="flex flex-col items-center gap-2">
              <IconSun size="lg" class="text-amber-500" />
              <span class="text-xs text-slate-600 dark:text-slate-400">
                Sun
              </span>
            </div>
            <div class="flex flex-col items-center gap-2">
              <IconCircleSplit
                size="lg"
                class="text-slate-900 dark:text-slate-100"
              />
              <span class="text-xs text-slate-600 dark:text-slate-400">
                CircleSplit
              </span>
            </div>
            <div class="flex flex-col items-center gap-2">
              <IconMonitorSplit
                size="lg"
                class="text-slate-700 dark:text-slate-200"
              />
              <span class="text-xs text-slate-600 dark:text-slate-400">
                MonitorSplit
              </span>
            </div>
            <div class="flex flex-col items-center gap-2">
              <IconMoon
                size="lg"
                class="text-indigo-500 dark:text-indigo-300"
              />
              <span class="text-xs text-slate-600 dark:text-slate-400">
                Moon
              </span>
            </div>
          </div>

          <CodeBlock
            title="代码示例"
            code={exampleThemeIcons}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>
      </section>

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          Icon 容器与内置图标（IconComponentProps）属性如下。
        </Paragraph>
        <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
          <table class="w-full min-w-lg text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80">
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  组件
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  属性
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  类型
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  默认值
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  说明
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-slate-100 dark:border-slate-700">
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  Icon
                </td>
                <td class="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                  size
                </td>
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  SizeVariant
                </td>
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  md
                </td>
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  xs、sm、md、lg
                </td>
              </tr>
              <tr class="border-b border-slate-100 dark:border-slate-700">
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  Icon
                </td>
                <td class="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                  class
                </td>
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  string
                </td>
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  -
                </td>
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  额外 class
                </td>
              </tr>
              <tr class="border-b border-slate-100 dark:border-slate-700">
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  Icon
                </td>
                <td class="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                  children
                </td>
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  unknown
                </td>
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  -
                </td>
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  自定义 SVG 等
                </td>
              </tr>
              <tr class="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  内置图标
                </td>
                <td class="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                  size / class
                </td>
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  IconComponentProps
                </td>
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  -
                </td>
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  同 Icon 的 size、class
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="space-y-10">
        <Title level={2}>图标一览</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          点击任意格可复制用法代码（如{" "}
          <code class="text-xs">{'<IconInfo size="md" />'}</code>
          ）；以组件导名为准。剪贴板需由 <code class="text-xs">https</code> 或
          {" "}
          <code class="text-xs">localhost</code>{" "}
          等安全环境提供；成功或失败时顶部 Toast 轻提示（复制成功 / 复制失败）。
        </Paragraph>

        <div class="space-y-6">
          <Title level={3}>一、操作与导航</Title>
          <IconGroup title="操作" items={操作} level={4} />
          <IconGroup title="方向 / 导航" items={方向导航} level={4} />
        </div>

        <div class="space-y-6">
          <Title level={3}>二、内容、媒体与表情</Title>
          <IconGroup title="内容 / 文件" items={内容} level={4} />
          <IconGroup title="媒体" items={媒体} level={4} />
          <IconGroup title="表情 / 情绪" items={表情情绪} level={4} />
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
          <Title level={3}>四、用户、状态与视图</Title>
          <IconGroup title="状态 / 反馈" items={状态反馈} level={4} />
          <IconGroup title="用户 / 社交" items={用户社交} level={4} />
          <IconGroup title="时间 / 地点 / 出行" items={时间地点} level={4} />
          <IconGroup title="布局 / 视图 / 编辑" items={布局视图} level={4} />
          <IconGroup title="数据 / 图表 / 商务" items={数据图表} level={4} />
        </div>

        <div class="space-y-6">
          <Title level={3}>五、设备、自然与其它场景</Title>
          <IconGroup title="设备 / 网络" items={设备网络} level={4} />
          <IconGroup title="天气 / 自然" items={天气自然} level={4} />
          <IconGroup title="餐饮 / 生活 / 健康" items={餐饮生活} level={4} />
          <IconGroup title="动物" items={动物} level={4} />
          <IconGroup title="工具 / 开发" items={工具开发} level={4} />
          <IconGroup title="其它" items={其它零散} level={4} />
        </div>

        <div class="space-y-6">
          <Title level={3}>六、国家 / 地区国旗</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            由 <code class="text-xs">scripts/build-country-flags.mts</code>{" "}
            自 npm <code class="text-xs">flag-icons</code> 生成，组件名为
            <code class="text-xs">IconFlag</code> 与两字母 ISO 大写拼接（如{" "}
            <code class="text-xs">IconFlagCN</code>、
            <code class="text-xs">IconFlagUS</code>），内联 1:1 SVG，仅 import
            某一码时不会打入他码资源。下表为包内导出的全部此类组件（已排除通用手绘
            <code class="text-xs">
              IconFlag
            </code>）；悬停名称区域可见完整导出名。
          </Paragraph>
          <IconGroup
            title={`全部国家/地区（${国家地区国旗.length}）`}
            items={国家地区国旗}
            level={4}
          />
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
          <Title level={3}>八、常见代币 Logo</Title>
          <IconGroup title="常见代币（品牌色）" items={代币Logo} level={4} />
        </div>
      </section>
    </div>
  );
}
