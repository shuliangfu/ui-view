/**
 * DataView 数据明细（桌面 · 数据展示）。
 *
 * 与 DataPanel 同一套卡片外壳与主题类，内容区默认是 DataPanel `view` 的 Descriptions
 * 字段展示；也可用 `view.render` 自定义字段区（推荐扩展点）。
 * `children` 在 DataView 中是明细主体（优先于 `view.render`），与 DataPanel 的「根上额外 Modal」不同。
 * 无分页、搜索、新建、列设置、行高与批量条。
 *
 * 工具栏默认顺序：更新 / 删除 / 刷新 / 打印 / 导入 / 导出 / 全屏 / 复制。
 * 删除为可选内置（默认在数据源提供 `remove` 时显示），需确认后调用 `ds.remove`（官方 API 源默认单条接口 `remove`）。
 * `toolbar={false}` 隐藏整栏；`ViewToolbarConfig` 覆写规则与 DataPanel 相同，
 * `show`／`disable`／`action` 接收 `{ record }`（零参函数仍可用）。
 * `update` 为编辑入口（可用 `edit` 别名声明）；打开与 DataPanel 编辑相同的 form Modal。
 *
 * 数据：`data` 单行，或 `dataSource` / `baseRoute`（优先序同 DataPanel：
 * 显式 dataSource ＞ data 本地源 ＞ baseRoute API）。
 * 首次进入与刷新都走数据源 `view(id)` / `get(id)`（若有）；失败或返回空则回落当前 `data`。
 */
import {
  createSignal,
  type JSXRenderable,
  onCleanup,
  onMount,
} from "@dreamer/view";
import { Button, ButtonGroup } from "../basic/Button.tsx";
import { IconCopy } from "../../shared/basic/icons/Copy.tsx";
import { IconDownload } from "../../shared/basic/icons/Download.tsx";
import { IconEdit } from "../../shared/basic/icons/Edit.tsx";
import { IconTrash } from "../../shared/basic/icons/Trash.tsx";
import { IconExitFullscreen } from "../../shared/basic/icons/ExitFullscreen.tsx";
import { IconList } from "../../shared/basic/icons/List.tsx";
import { IconMaximize2 } from "../../shared/basic/icons/Maximize2.tsx";
import { IconPrinter } from "../../shared/basic/icons/Printer.tsx";
import { IconRefresh } from "../../shared/basic/icons/Refresh.tsx";
import { IconUpload } from "../../shared/basic/icons/Upload.tsx";
import { Card } from "./Card.tsx";
import {
  type DataChromeTab,
  DataChromeTabBody,
  DataChromeTabList,
  type DataChromeTabType,
  DEFAULT_TAB_PARAM,
  rememberTabKey,
  resolveDataChromeTabKey,
  resolveInitialTabKey,
  writeTabToLocation,
} from "./data-panel-tabs.tsx";
import {
  createDataAlertState,
  type DataAlertProp,
  DataChromeAlert,
} from "./data-panel-alert.tsx";
import {
  createTabRecordCache,
  loadTabRecord,
  resolveTabQuery,
  wrapFetchWithTabParam,
} from "./data-panel-tab-source.ts";
import { Descriptions } from "./Descriptions.tsx";
import { Empty } from "./Empty.tsx";
import { Dropdown } from "../navigation/Dropdown.tsx";
import { FormItem } from "../form/FormItem.tsx";
import { Input } from "../form/Input.tsx";
import { Select } from "../form/Select.tsx";
import { MultiSelect } from "../form/MultiSelect.tsx";
import { InputNumber } from "../form/InputNumber.tsx";
import { DatePicker } from "../form/DatePicker.tsx";
import { DateTimePicker } from "../form/DateTimePicker.tsx";
import { Switch } from "../form/Switch.tsx";
import { Textarea } from "../form/Textarea.tsx";
import { Modal } from "../feedback/Modal.tsx";
import { Popconfirm } from "../feedback/Popconfirm.tsx";
import { Tooltip } from "../feedback/Tooltip.tsx";
import { message } from "../feedback/message-store.ts";
import {
  formatMessage,
  resolveDataPanelMessages,
} from "./data-panel-messages.ts";
import { parseXlsx } from "./data-panel-xlsx.ts";
import {
  buildExportFile,
  colProp,
  createLocalDataSource,
  displayValue,
  enrichFormFields,
  fieldLayoutStyle,
  fieldProp,
  fieldsOf,
  formatDateTime,
  itemRowId,
  parseCsv,
  parseJsonRows,
  parseXmlRows,
  resolveFooterActions,
  pickViewDescriptionsProps,
  resolveModalWidth,
  resolveViewActionsCfg,
  resolveViewFields,
  resolveViewFooterActions,
  toggleOptionValue,
  useFieldGrid,
  validateForm,
} from "./data-panel-utils.ts";
import { type ApiMode, createApiDataSource } from "./data-panel-api-source.ts";
import {
  actionDisplayText,
  actionTipText,
  type ActionTone,
  assertFooterActionsConfig,
  type Column,
  type DataSource,
  evalFlag,
  type ExportFormat,
  type FormActionContext,
  type FormConfig,
  type FormField,
  type FormFieldConditionCtx,
  type FormFieldRenderCtx,
  type FormRenderCtx,
  type ImportFormat,
  isFormFieldVisible,
  type ListResult,
  type Locale,
  type Messages,
  resolveActionCtrl,
  resolveOptions,
  type Row,
  type ViewActionContext,
  type ViewConfig,
  type ViewItem,
  type ViewToolbarConfig,
  type WriteResult,
} from "./data-panel-types.ts";
import {
  Btn,
  CARD_STYLE,
  FS_CLS,
  g,
  HEADER_BAR_CLS,
  onServer,
  POP_OVERLAY_CLS,
  printHtml,
  readDataPanelPrefs,
  refreshers,
  TABLE_WRAP_BELOW_ALERT_CLS,
  TABLE_WRAP_CLS,
  TB_FIRST_STYLE,
  TB_LAST_STYLE,
  TB_NF_STYLE,
  TB_NL_STYLE,
  TB_STYLE,
  TOOLBAR_BAR_CLS,
  viewHandles,
  writeDataPanelPrefs,
} from "./data-panel-chrome.tsx";
import { buildViewDescriptionItems } from "./data-view-cell.tsx";

const REFRESH_MIN_BUSY_MS = 320;

/** DataView 工具栏内置键（不含 DataPanel 的 create／search／columns／density）。 */
export type DataViewToolbarBuiltin =
  | "update"
  | "remove"
  | "refresh"
  | "print"
  | "import"
  | "export"
  | "fullscreen"
  | "copy";

/** 缺省工具栏显示序；未声明的内置键按此序追加。 */
export const DATA_VIEW_TOOLBAR_BUILTINS: readonly DataViewToolbarBuiltin[] = [
  "update",
  "remove",
  "refresh",
  "print",
  "import",
  "export",
  "fullscreen",
  "copy",
] as const;

const DATA_VIEW_TOOLBAR_BUILTIN_SET = new Set<string>(
  DATA_VIEW_TOOLBAR_BUILTINS,
);

export function isDataViewToolbarBuiltin(
  key: string,
): key is DataViewToolbarBuiltin {
  return DATA_VIEW_TOOLBAR_BUILTIN_SET.has(key);
}

/** 能力开关（缺省按数据源方法推断；refresh 始终可用，不在此列）。 */
export interface DataViewCaps {
  update: boolean;
  /** 工具栏删除；默认在数据源提供 `remove` 时为 true。 */
  remove: boolean;
  import: boolean;
  export: boolean;
  print: boolean;
  fullscreen: boolean;
  copy: boolean;
}

export interface DataViewProps {
  /**
   * 面板标识：全屏偏好（`dp-prefs-${panelKey}`）与 `refreshDataPanel(key)`。
   * 同页多实例须唯一。默认 `"data-view"`。
   */
  panelKey?: string;
  /** 卡片标题 */
  title: string;
  /**
   * 明细配置：`props` 用 Descriptions 展示（同 DataPanel view）；
   * Descriptions 的参数（除 `items`、`title`）可直接写在本对象上，与 title／props／actions 混在一起。
   * `title` 仍是标题，不会传给 Descriptions。有 `render` 或 `children` 时这些参数不再生效。
   * `render` 是推荐扩展点，替换字段区。字段级 `ViewItem.render` 仅在无 `view.render` 且无 `children` 时生效。
   */
  view?: ViewConfig;
  /**
   * 编辑弹层（工具栏「更新」打开），写法同 DataPanel `form`。
   * 扩展优先级：`form.render` ＞ `FormField.render` ＞ 内置控件。
   */
  form?: FormConfig;
  /** 当前记录。传入则首屏直接渲染；优先序低于显式 `dataSource`，高于 `baseRoute` */
  data?: Row;
  /** 记录主键值；刷新／拉取单条时使用。缺省取 `data[rowKey]` 或当前行。 */
  id?: string;
  /** 自定义数据源（优先于 `data`／`baseRoute`） */
  dataSource?: DataSource;
  /**
   * 路由前缀或完整资源根。仅当未传 `data` 且未传 `dataSource` 时
   * {@link createApiDataSource}。首次进入与刷新都走源上的 `view(id)`／`get(id)`；失败或返回空则回落 `data`。
   */
  baseRoute?: string;
  /** 仅当 `baseRoute` 只有 1 段时生效，同 DataPanel */
  resource?: string;
  apiMode?: ApiMode;
  apiHeaders?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  apiCredentials?: RequestCredentials;
  /** `data` 模式下写操作后回调（当前行；清空时为 null） */
  onDataChange?: (row: Row | null) => void;
  /** 主键字段，默认 id */
  rowKey?: string;
  /** 能力开关；缺省按数据源方法推断。未在 toolbar 声明的钮回落于此。 */
  caps?: Partial<DataViewCaps>;
  /**
   * 工具栏，或 `false` 隐藏整栏。
   * 省略键 → 内置回落 caps；声明键请写明确 true｜false｜object。
   * `update` 可用 `edit` 别名声明。自定义键必须提供 `action`。
   * `show`／`disable`／`action` 接收 `{ record }`；零参函数仍可用。
   */
  toolbar?: false | ViewToolbarConfig;

  /**
   * 页面提示条，渲染在工具栏（含工具栏左侧标签）下方、详情正文上方。
   * 字符串简写为 info 提示；对象为完整 {@link DataAlertConfig}（透传 Alert 全部参数，另加 show／key）。
   * `false`／`null`／省略／`show: false` 不显示。函数在渲染时求值。
   * 本插槽默认可关闭（`closable` 默认 true）、通栏样式（`banner` 默认 true）。
   * 点击关闭会先隐藏提示，再调用 `onClose`；换一条提示（或先关掉再传入）会重新显示。
   */
  alert?: DataAlertProp;
  locale?: Locale;
  messages?: Partial<Messages>;
  /** 导出文件名（不含扩展名），默认取 title */
  exportName?: string;
  /** 任一写操作成功后回调 */
  onChanged?: () => void;
  /** 接管导入：收到解析后的行（缺省走 dataSource.importRows） */
  onImportRows?: (rows: Record<string, string>[]) => void;
  /** 接管导出；缺省时导出当前记录 */
  onExport?: (
    format: ExportFormat,
    ctx: {
      columns: Column[];
      fetchAll: () => Promise<ListResult>;
    },
  ) => void | Promise<void>;
  class?: string;
  /**
   * 自定义内容区（替换 Descriptions 字段区，优先于 `view.render`）。
   * 与 DataPanel 的「根上额外 Modal」不同：此处即明细主体。
   */
  children?: unknown;
  /**
   * Optional tabs on the left of the toolbar, using the layout Tabs component.
   * A tab without `children` shows the default descriptions / children body.
   * When `tabs` is set, the active tab key is attached as a query param on
   * every API request (view / refresh / import / update / delete / detail).
   * A view without tabs never sends that param.
   * Switching tabs refetches the record (cached tab+id hits skip the network).
   */
  tabs?: DataChromeTab[];
  activeTab?: string;
  defaultActiveTab?: string;
  onTabChange?: (key: string) => void;
  tabType?: DataChromeTabType;
  /**
   * Query key used to activate the current tab from the URL, write it back
   * on change, and attach it to API requests. Default `tab`.
   * Pass `false` to disable URL sync and to skip the tab query on requests
   * (purely visual tabs).
   */
  tabParam?: string | false;
}

export type { DataAlertConfig, DataAlertProp } from "./data-panel-alert.tsx";
import { bindContainerWidth } from "../../shared/container-width.ts";

/** 本地源没有 view/get 时补一个按 id 查找，刷新／写回后能读到源里的当前行。 */
function withLocalRecordGet(ds: DataSource, rowKey: string): DataSource {
  const src = ds as DataSource & {
    view?: (id: string) => Row | null | Promise<Row | null>;
    get?: (id: string) => Row | null | Promise<Row | null>;
  };
  if (typeof src.view === "function" || typeof src.get === "function") {
    return ds;
  }
  src.get = async (id: string) => {
    const res = await ds.list({
      page: 1,
      pageSize: 10_000,
      sort: "",
      order: "asc",
      filters: {},
    });
    return res.rows.find((r) => String(r[rowKey] ?? "") === String(id)) ??
      null;
  };
  return ds;
}

/** 从数据源上读取单条钩子（API 源为 `view`；自定义源也可提供 `get`）。 */
function recordLoader(
  ds: DataSource,
): ((id: string) => Row | null | Promise<Row | null>) | undefined {
  const src = ds as DataSource & {
    view?: (id: string) => Row | null | Promise<Row | null>;
    get?: (id: string) => Row | null | Promise<Row | null>;
  };
  if (typeof src.view === "function") return (id) => src.view!(id);
  if (typeof src.get === "function") return (id) => src.get!(id);
  return undefined;
}

/** 将 toolbar 里的 `edit` 别名归一成 `update`（已声明 `update` 时丢弃 `edit`）。 */
export function normalizeDataViewToolbar(
  cfg: ViewToolbarConfig,
): ViewToolbarConfig {
  const hasUpdate = Object.prototype.hasOwnProperty.call(cfg, "update");
  const out: ViewToolbarConfig = {};
  for (const [key, val] of Object.entries(cfg)) {
    if (key === "edit") {
      if (!hasUpdate) out.update = val;
      continue;
    }
    out[key] = val;
  }
  return out;
}

/** 自定义工具栏键必须提供 `action`；`update`／`edit` 视为内置。 */
export function assertDataViewToolbarConfig(
  cfg: ViewToolbarConfig | false | undefined,
): void {
  if (!cfg) return;
  for (const [key, val] of Object.entries(cfg)) {
    if (isDataViewToolbarBuiltin(key) || key === "edit") continue;
    if (
      typeof val === "object" && val !== null &&
      typeof val.action === "function"
    ) {
      continue;
    }
    throw new Error(
      `DataView toolbar custom key "${key}" requires action(); ` +
        `got ${
          val === null
            ? "null"
            : typeof val === "object"
            ? typeof (val as { action?: unknown }).action
            : typeof val
        }`,
    );
  }
}

export function DataView(props: DataViewProps): JSXRenderable {
  const key = props.panelKey ?? "data-view";
  const tabParam = props.tabParam === false
    ? ""
    : (props.tabParam ?? DEFAULT_TAB_PARAM);
  const tabKey = createSignal(resolveInitialTabKey({
    tabs: props.tabs,
    activeTab: props.activeTab,
    defaultActiveTab: props.defaultActiveTab,
    panelKey: key,
    tabParam,
  }));
  /** 只在父级 `activeTab` 真正变化时回写，避免点击后用过期的受控值把 tabKey 打回去 */
  const lastControlledTab: { value: string | undefined } = {
    value: props.activeTab,
  };
  const tabReload = { run() {} };
  const handleTabChange = (next: string) => {
    if (next === tabKey.value) {
      props.onTabChange?.(next);
      return;
    }
    tabKey.value = next;
    rememberTabKey(key, next);
    if (tabParam) writeTabToLocation(tabParam, next);
    props.onTabChange?.(next);
    tabReload.run();
  };
  if (typeof globalThis.addEventListener === "function") {
    const onPop = () => {
      if (!tabParam || !props.tabs?.length) return;
      const next = resolveInitialTabKey({
        tabs: props.tabs,
        activeTab: props.activeTab,
        defaultActiveTab: props.defaultActiveTab,
        panelKey: key,
        tabParam,
      });
      if (next && next !== tabKey.value) handleTabChange(next);
    };
    globalThis.addEventListener("popstate", onPop);
    onCleanup(() => globalThis.removeEventListener("popstate", onPop));
  }
  const rowKey = props.rowKey ?? "id";
  const idOf = (r: Row): string => itemRowId(r, rowKey);
  const locale = props.locale ?? "zh-CN";
  const copyEmptyDefault = locale === "en-US"
    ? "No record to copy"
    : "暂无数据可复制";
  const updateTipDefault = locale === "en-US" ? "Update" : "更新";
  const baseMessages = resolveDataPanelMessages(locale, props.messages);
  const m: Messages = {
    ...baseMessages,
    copyEmpty: props.messages?.copyEmpty ?? copyEmptyDefault,
  };
  const tr = (tpl: string, vars: Record<string, string | number>) =>
    formatMessage(tpl, vars);

  const viewItems = fieldsOf(props.view);
  const formFields = fieldsOf(props.form);
  const formDefs = enrichFormFields(formFields, viewItems);
  const canWriteLocal = formDefs.length > 0 || !!props.form?.render ||
    !!props.onDataChange ||
    viewItems.some((it) => it.click === "toggle");

  function withTabOnList(source: DataSource): DataSource {
    const list = source.list.bind(source);
    return {
      ...source,
      list(query) {
        if (source.sync) return list(query);
        const tab = resolveTabQuery(props.tabs, tabParam, tabKey.value);
        if (!tab) return list(query);
        if (query.filters?.[tab.param] === tab.value) return list(query);
        return list({
          ...query,
          filters: { ...query.filters, [tab.param]: tab.value },
        });
      },
    };
  }
  const ds: DataSource = props.dataSource
    ? withTabOnList(props.dataSource)
    : props.data !== undefined
    ? withLocalRecordGet(
      createLocalDataSource({
        rows: [props.data],
        columns: viewItems,
        form: formDefs,
        rowKey,
        onChange: (rows) => {
          props.onDataChange?.(rows[0] ?? null);
        },
        writable: canWriteLocal,
      }),
      rowKey,
    )
    : props.baseRoute
    ? (() => {
      try {
        return createApiDataSource({
          baseRoute: props.baseRoute,
          resource: props.resource,
          apiMode: props.apiMode,
          rowKey,
          headers: props.apiHeaders,
          credentials: props.apiCredentials,
          fetch: wrapFetchWithTabParam(
            globalThis.fetch.bind(globalThis),
            () => resolveTabQuery(props.tabs, tabParam, tabKey.value),
          ),
        });
      } catch (e) {
        if (onServer()) {
          return withLocalRecordGet(
            createLocalDataSource({
              rows: [],
              columns: viewItems,
              form: formDefs,
              rowKey,
              onChange: (rows) => {
                props.onDataChange?.(rows[0] ?? null);
              },
              writable: canWriteLocal,
            }),
            rowKey,
          );
        }
        throw e;
      }
    })()
    : withLocalRecordGet(
      createLocalDataSource({
        rows: [],
        columns: viewItems,
        form: formDefs,
        rowKey,
        onChange: (rows) => {
          props.onDataChange?.(rows[0] ?? null);
        },
        writable: canWriteLocal,
      }),
      rowKey,
    );

  const caps: DataViewCaps = {
    update: !!ds.update &&
      (formDefs.length > 0 || !!props.form?.render),
    remove: !!ds.remove,
    import: !!ds.importRows || !!props.onImportRows,
    export: true,
    print: true,
    fullscreen: true,
    copy: true,
    ...(props.caps ?? {}),
  };

  const toolbarHidden = props.toolbar === false;
  const tbCfg: ViewToolbarConfig = normalizeDataViewToolbar(
    props.toolbar && typeof props.toolbar === "object" ? props.toolbar : {},
  );
  assertDataViewToolbarConfig(tbCfg);
  assertFooterActionsConfig(
    props.form?.actions,
    ["submit", "cancel"],
    "DataView form.actions",
  );

  const record = createSignal<Row | null>(props.data ?? null);
  const loading = createSignal(false);
  const panelFs = createSignal(false);
  const alertState = createDataAlertState();
  const formOpen = createSignal(false);
  const formBusy = createSignal(false);
  const formErrors = createSignal<Record<string, string>>({});
  const formTop = createSignal("");
  const formRow = createSignal<Row | null>(null);
  const fields: Record<string, ReturnType<typeof createSignal<string>>> = {};
  for (const f of formDefs) fields[fieldProp(f)] = createSignal("");
  const mfields: Record<string, ReturnType<typeof createSignal<string[]>>> = {};
  for (const f of formDefs) mfields[fieldProp(f)] = createSignal<string[]>([]);
  const popRemove = createSignal(false);
  const viewActionCtx = (): ViewActionContext => ({ record: record.value });
  const tbResolved = (name: DataViewToolbarBuiltin, fallback: boolean) =>
    resolveActionCtrl(tbCfg[name], fallback, viewActionCtx());

  const resolveId = (): string => {
    if (props.id != null && String(props.id) !== "") return String(props.id);
    const cur = record.value;
    if (cur) {
      const id = idOf(cur);
      if (id) return id;
    }
    if (props.data) {
      const id = idOf(props.data);
      if (id) return id;
    }
    return "";
  };

  async function holdBusy(started: number, minMs?: number): Promise<void> {
    if (!minMs) return;
    const wait = minMs - (Date.now() - started);
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
  }

  type LoadOpts = {
    notify?: boolean;
    minBusyMs?: number;
    bypassCache?: boolean;
  };
  const tabRecordCache = createTabRecordCache();
  function usesTabRecordCache(): boolean {
    return !!tabParam && !!props.tabs?.length && !ds.sync;
  }
  function invalidateCurrentTabCache(): void {
    if (usesTabRecordCache()) tabRecordCache.invalidateTab(tabKey.value);
  }
  async function load(
    opts?: LoadOpts,
  ): Promise<void> {
    const started = Date.now();
    const id = resolveId();
    const loader = recordLoader(ds);
    if (loader && id) {
      if (usesTabRecordCache() && !opts?.bypassCache) {
        const hit = tabRecordCache.get(tabKey.value, id);
        if (hit !== undefined) {
          record.value = hit ?? props.data ?? null;
          loading.value = false;
          return;
        }
      }
      loading.value = true;
      try {
        const loaded = usesTabRecordCache()
          ? await loadTabRecord({
            cache: tabRecordCache,
            tabKey: tabKey.value,
            id,
            bypassCache: opts?.bypassCache,
            load: () => Promise.resolve(loader(id)),
          })
          : { result: await loader(id), fromCache: false };
        const row = loaded.result;
        if (row) record.value = row;
        else if (props.data) record.value = props.data;
        else record.value = null;
      } catch (e) {
        message.error((e as Error)?.message || m.networkError);
      }
      await holdBusy(started, opts?.minBusyMs);
      loading.value = false;
      if (opts?.notify) message.success(m.refreshed);
      return;
    }
    if (props.data) record.value = { ...props.data };
    await holdBusy(started, opts?.minBusyMs);
    if (opts?.notify) message.success(m.refreshed);
  }

  function refreshFromToolbar(): Promise<void> {
    invalidateCurrentTabCache();
    return load({
      minBusyMs: REFRESH_MIN_BUSY_MS,
      notify: true,
      bypassCache: true,
    });
  }
  refreshers.set(key, () => {
    invalidateCurrentTabCache();
    return load({ bypassCache: true });
  });
  viewHandles.set(key, {
    reload: () => {
      invalidateCurrentTabCache();
      return load({ bypassCache: true });
    },
    getRecord: () => record.value,
    openForm: (row) => {
      const target = row ?? record.value;
      if (target) openForm(target);
    },
  });
  tabReload.run = () => {
    if (!usesTabRecordCache()) return;
    void load();
  };

  async function guarded<T>(fn: () => T | Promise<T>): Promise<T | undefined> {
    try {
      return await fn();
    } catch (e) {
      message.error((e as Error)?.message || m.networkError);
      return undefined;
    }
  }

  async function setField(
    row: Row,
    prop: string,
    value: unknown,
  ): Promise<void> {
    const id = idOf(row);
    let ok = false;
    let failed: string | undefined;
    if (ds.setField) {
      const r = await guarded(() => ds.setField!([id], prop, value));
      if (r) {
        ok = true;
        failed = r.failed?.[0]?.error;
      }
    } else if (ds.update) {
      const r = await guarded(() => ds.update!(id, { [prop]: value }));
      ok = true;
      if (r && r.ok === false) failed = r.message ?? m.invalid;
    }
    if (failed) message.error(failed);
    else if (ok) {
      message.success(m.saved);
      props.onChanged?.();
    }
    invalidateCurrentTabCache();
    await load();
  }

  function openForm(row: Row): void {
    formRow.value = row;
    for (const f of formDefs) {
      const raw = row[fieldProp(f)];
      let v: string;
      if (raw === undefined || raw === null) v = "";
      else if (f.type === "datetime" || f.type === "date") {
        const s = formatDateTime(raw);
        v = f.type === "date" ? s.slice(0, 10) : s.slice(0, 16);
      } else if (f.type === "switch") {
        v = f.onOff ? String(raw) : (raw ? "true" : "false");
      } else if (Array.isArray(raw)) v = raw.join(",");
      else v = String(raw);
      if (f.type === "password") v = "";
      fields[fieldProp(f)].value = v;
      mfields[fieldProp(f)].value = v.split(",").filter(Boolean);
    }
    formErrors.value = {};
    formTop.value = "";
    formOpen.value = true;
  }

  function readFormFieldValue(
    f: FormField,
  ): { skip: boolean; value: unknown } {
    const v = fields[fieldProp(f)].value;
    if (f.type === "password" && v === "") return { skip: true, value: v };
    if (f.type === "multiselect") {
      return { skip: false, value: v.split(",").filter(Boolean) };
    }
    if (f.type === "number") {
      return { skip: false, value: v === "" ? "" : Number(v) };
    }
    if (f.type === "datetime") {
      return { skip: false, value: v.replace(" ", "T") };
    }
    if (f.type === "switch" && !f.onOff) {
      return { skip: false, value: v === "true" };
    }
    return { skip: false, value: v };
  }

  function rawFormValues(): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    for (const f of formDefs) {
      const got = readFormFieldValue(f);
      if (got.skip) continue;
      body[fieldProp(f)] = got.value;
    }
    return body;
  }

  function formConditionCtx(): FormFieldConditionCtx {
    return {
      values: rawFormValues(),
      mode: "edit",
      row: formRow.value,
    };
  }

  function collectValues(): Record<string, unknown> {
    const ctx = formConditionCtx();
    const body: Record<string, unknown> = {};
    for (const f of formDefs) {
      if (!isFormFieldVisible(f, ctx)) continue;
      const got = readFormFieldValue(f);
      if (got.skip) continue;
      body[fieldProp(f)] = got.value;
    }
    return body;
  }

  async function submitForm(): Promise<void> {
    if (formBusy.value) return;
    const row = formRow.value;
    const id = row ? idOf(row) : resolveId();
    if (!id) return;
    const values = collectValues();
    const visible = formDefs.filter((f) =>
      isFormFieldVisible(f, formConditionCtx())
    );
    const errs = validateForm(visible, values, true, m);
    if (Object.keys(errs).length) {
      formErrors.value = errs;
      formTop.value = "";
      return;
    }
    formBusy.value = true;
    formErrors.value = {};
    formTop.value = "";
    let r: WriteResult;
    try {
      r = await ds.update?.(id, values);
    } catch (e) {
      formBusy.value = false;
      formTop.value = (e as Error)?.message || m.networkError;
      return;
    }
    formBusy.value = false;
    if (!r || r.ok) {
      formOpen.value = false;
      message.success(m.saved);
      invalidateCurrentTabCache();
      await load();
      props.onChanged?.();
      return;
    }
    const msgs = { ...(r.messages ?? {}) };
    for (const f of r.fields ?? []) if (!msgs[f]) msgs[f] = m.invalid;
    formErrors.value = msgs;
    formTop.value = r.message ?? m.invalid;
  }

  const viewColumns = (): Column[] => {
    const fields = resolveViewFields(props.view, []) ?? [];
    return fields.filter((f) => colProp(f));
  };

  function downloadFile(
    file: { filename: string; mime: string; data: Uint8Array | string },
  ): void {
    const doc = g.document;
    if (!doc || !g.URL?.createObjectURL) return;
    // deno-lint-ignore no-explicit-any
    const blob = new Blob([file.data as any], { type: file.mime });
    const url = g.URL.createObjectURL(blob);
    const a = doc.createElement("a");
    a.href = url;
    a.download = file.filename;
    doc.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => g.URL?.revokeObjectURL(url), 1000);
  }

  function fetchAll(): Promise<ListResult> {
    const row = record.value;
    return Promise.resolve({ rows: row ? [row] : [], total: row ? 1 : 0 });
  }

  async function exportAs(fmt: ExportFormat): Promise<void> {
    const cols = viewColumns();
    try {
      if (props.onExport) {
        await props.onExport(fmt, { columns: cols, fetchAll });
        return;
      }
      const all = await fetchAll();
      downloadFile(buildExportFile({
        format: fmt,
        title: props.title,
        basename: props.exportName ?? props.title,
        columns: cols.length
          ? cols
          : Object.keys(all.rows[0] ?? {}).map((prop) => ({
            prop,
            label: prop,
          })),
        rows: all.rows,
        messages: m,
      }));
    } catch (e) {
      message.error((e as Error)?.message || m.exportFailed);
    }
  }

  function printRecord(): void {
    const row = record.value;
    if (!row) return;
    const cols = viewColumns();
    const fields = cols.length
      ? cols
      : Object.keys(row).map((prop) => ({ prop, label: prop } as Column));
    const esc = (s: string) =>
      s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
        ">",
        "&gt;",
      );
    const body = fields.map((c) =>
      `<tr><th>${esc(c.label ?? c.prop ?? "")}</th><td>${
        esc(displayValue(c, row, m))
      }</td></tr>`
    ).join("");
    printHtml(
      `<!doctype html><title>${
        esc(props.title)
      }</title><style>body{font:13px sans-serif}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px 8px}th{text-align:right;width:30%;background:#f8fafc}</style><h3>${
        esc(props.title)
      }</h3><table>${body}</table>`,
    );
  }

  async function applyImportedRows(
    parsed: Record<string, string>[],
  ): Promise<void> {
    if (props.onImportRows) return props.onImportRows(parsed);
    const cols = viewColumns();
    const byLabel = new Map(cols.map((c) => [c.label, c.prop ?? ""]));
    const mapped = parsed.map((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [byLabel.get(k) ?? k, v]),
      )
    );
    const r = await ds.importRows?.(mapped);
    if (r) {
      message.success(
        tr(m.importDone, { created: r.created, failed: r.failed }),
      );
    }
    invalidateCurrentTabCache();
    await load();
    props.onChanged?.();
  }

  function pickImport(fmt: ImportFormat): void {
    const doc = g.document;
    if (!doc) return;
    const accept: Record<ImportFormat, string> = {
      xlsx:
        ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv: ".csv,text/csv",
      json: ".json,application/json",
      xml: ".xml,application/xml,text/xml",
    };
    const input = doc.createElement("input");
    input.type = "file";
    input.accept = accept[fmt];
    input.setAttribute("data-testid", "dv-import-input");
    input.setAttribute("data-import-format", fmt);
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        let parsed: Record<string, string>[];
        if (fmt === "xlsx") {
          parsed = await parseXlsx(new Uint8Array(await file.arrayBuffer()));
        } else if (fmt === "json") {
          parsed = parseJsonRows(await file.text());
        } else if (fmt === "xml") {
          parsed = parseXmlRows(await file.text());
        } else {
          parsed = parseCsv(await file.text());
        }
        await applyImportedRows(parsed);
      } catch {
        message.error(m.importBad);
      }
    };
    input.click();
  }

  function applyFullscreenChrome(on: boolean): void {
    panelFs.value = on;
    try {
      if (g.document?.body) {
        g.document.body.style.overflow = on ? "hidden" : "";
      }
    } catch { /* ignore */ }
  }
  function setPanelFullscreen(on: boolean): void {
    applyFullscreenChrome(on);
    void writeDataPanelPrefs(key, { fullscreen: on });
  }
  function toggleFullscreen(): void {
    setPanelFullscreen(!panelFs.value);
  }

  async function writeClipboard(text: string): Promise<void> {
    const nav = (globalThis as unknown as {
      navigator?: { clipboard?: { writeText?(s: string): Promise<void> } };
    }).navigator;
    if (typeof nav?.clipboard?.writeText === "function") {
      await nav.clipboard.writeText(text);
      return;
    }
    const doc = g.document;
    if (!doc) throw new Error("no document");
    const ta = doc.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    doc.body.appendChild(ta);
    ta.select();
    const ok = typeof doc.execCommand === "function"
      ? doc.execCommand("copy")
      : false;
    ta.remove();
    if (!ok) throw new Error("execCommand copy failed");
  }

  async function copyRecord(): Promise<void> {
    const row = record.value;
    if (!row) {
      message.warning(m.copyEmpty);
      return;
    }
    const cols = viewColumns();
    const fields = cols.length
      ? cols
      : Object.keys(row).map((prop) => ({ prop, label: prop } as Column));
    const escCell = (s: string) => s.replace(/\t|\r?\n/g, " ");
    const header = fields.map((c) => escCell(c.label ?? c.prop ?? "")).join(
      "\t",
    );
    const line = fields.map((c) => escCell(displayValue(c, row, m))).join("\t");
    try {
      await writeClipboard([header, line].join("\n"));
      message.success(tr(m.copyDone, { n: 1 }));
    } catch {
      message.error(m.copyFailed);
    }
  }

  const TB_FALLBACK: Record<DataViewToolbarBuiltin, boolean> = {
    update: caps.update,
    remove: caps.remove,
    refresh: true,
    print: caps.print,
    import: caps.import,
    export: caps.export,
    fullscreen: caps.fullscreen,
    copy: caps.copy,
  };

  type TbSlot =
    | {
      kind: "builtin";
      name: DataViewToolbarBuiltin;
      disable: boolean;
      title?: string;
      label?: string;
      tone?: ActionTone;
      action?: () => void;
    }
    | {
      kind: "custom";
      key: string;
      disable: boolean;
      label: unknown;
      icon?: unknown;
      title?: string;
      tone?: ActionTone;
      action: () => void;
    };

  const toolbarSlots = (): TbSlot[] => {
    const ctx = viewActionCtx();
    const wrap = (fn?: (c: ViewActionContext) => void) =>
      fn ? () => fn(viewActionCtx()) : undefined;
    const slots: TbSlot[] = [];
    const declared = new Set<string>();
    for (const key of Object.keys(tbCfg)) {
      declared.add(key);
      if (isDataViewToolbarBuiltin(key)) {
        const r = resolveActionCtrl(tbCfg[key], TB_FALLBACK[key], ctx);
        if (!r.show) continue;
        slots.push({
          kind: "builtin",
          name: key,
          disable: r.disable,
          title: r.title,
          label: r.label,
          tone: r.tone,
          action: wrap(r.action),
        });
        continue;
      }
      const raw = tbCfg[key];
      if (typeof raw !== "object" || raw === null) continue;
      const r = resolveActionCtrl(raw, true, ctx);
      if (!r.show) continue;
      slots.push({
        kind: "custom",
        key,
        disable: r.disable,
        label: actionDisplayText(key, raw.label, r.title),
        icon: raw.icon,
        title: r.title,
        tone: r.tone,
        action: wrap(r.action)!,
      });
    }
    for (const name of DATA_VIEW_TOOLBAR_BUILTINS) {
      if (declared.has(name)) continue;
      const r = tbResolved(name, TB_FALLBACK[name]);
      if (!r.show) continue;
      slots.push({
        kind: "builtin",
        name,
        disable: r.disable,
        title: r.title,
        label: r.label,
        tone: r.tone,
      });
    }
    return slots;
  };

  const TB_IDS: Record<DataViewToolbarBuiltin, string> = {
    update: "dv-update",
    remove: "dv-remove",
    refresh: "dv-refresh",
    print: "dv-print",
    import: "dv-import",
    export: "dv-export",
    fullscreen: "dv-fullscreen",
    copy: "dv-copy",
  };

  const toolIds = (): string[][] =>
    toolbarSlots().map((s) => {
      if (s.kind === "custom") {
        const label = typeof s.label === "string" ? s.label : s.key;
        return [`dv-tb-extra-${s.key}`, label];
      }
      const labels: Record<DataViewToolbarBuiltin, string> = {
        update: updateTipDefault,
        remove: m.delete,
        refresh: m.refresh,
        print: m.print,
        import: m.import,
        export: m.export,
        fullscreen: panelFs.value ? m.exitFullscreen : m.enterFullscreen,
        copy: m.copy,
      };
      return [TB_IDS[s.name], labels[s.name]];
    });

  const tagToolbar = (): boolean => {
    const root = g.document?.querySelector?.(`[data-dv-tools="${key}"]`);
    if (!root) return false;
    const btns = root.querySelectorAll("button");
    const ids = toolIds();
    if (btns.length < ids.length) return false;
    ids.forEach(([id, label], i) => {
      const b = btns[i];
      b.setAttribute("data-testid", id);
      b.setAttribute("aria-label", label);
      b.removeAttribute("title");
    });
    return true;
  };

  onMount(() => {
    if (onServer()) return;
    const id = resolveId();
    const loader = recordLoader(ds);
    if (loader && id) void load();
    void readDataPanelPrefs(key).then((prefs) => {
      if (prefs.fullscreen) applyFullscreenChrome(true);
    });
    const onKey = (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === "Escape" && panelFs.value) {
        setPanelFullscreen(false);
      }
    };
    g.document?.addEventListener?.("keydown", onKey);
    onCleanup(() => {
      g.document?.removeEventListener?.("keydown", onKey);
    });
    for (const ms of [0, 30, 120, 400, 1000]) setTimeout(tagToolbar, ms);
  });
  onCleanup(() => {
    refreshers.delete(key);
    viewHandles.delete(key);
    try {
      if (g.document?.body) g.document.body.style.overflow = "";
    } catch { /* ignore */ }
  });

  const tipWrap = (
    content: string | undefined,
    node: unknown,
  ) =>
    content
      ? (
        <Tooltip content={content} placement="auto">
          {node}
        </Tooltip>
      )
      : node;

  const posCls = (id: string): string => {
    const ids = toolIds().map((x) => x[0]);
    const i = ids.indexOf(id);
    const n = ids.length;
    return `px-2.5 dp-tb${i === 0 ? " dp-tb-first" : " dp-tb-nf"}${
      i === n - 1 ? " dp-tb-last" : " dp-tb-nl"
    } ${TB_STYLE} ${i === 0 ? TB_FIRST_STYLE : TB_NF_STYLE} ${
      i === n - 1 ? TB_LAST_STYLE : TB_NL_STYLE
    }`;
  };

  const toolBtn = (
    id: string,
    messageLabel: string,
    onClick: () => void,
    icon: unknown,
    disable = false,
    title?: string,
    ctrlLabel?: string,
  ) => (
    <Tooltip
      content={actionTipText(id, title, ctrlLabel, messageLabel)}
      placement="auto"
    >
      <Button
        type="button"
        size="sm"
        class={posCls(id)}
        disabled={disable}
        data-testid={id}
        aria-label={actionTipText(id, title, ctrlLabel, messageLabel)}
        onClick={onClick}
      >
        {icon}
      </Button>
    </Tooltip>
  );

  const importMenu = (
    <div
      class="flex min-w-32 flex-col gap-0.5 p-1"
      data-testid="dv-import-menu"
    >
      {(["xlsx", "csv", "json", "xml"] as const).map((f) => (
        <button
          type="button"
          class="rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          data-testid={`dv-import-${f}`}
          onClick={() => pickImport(f)}
        >
          {{
            xlsx: m.formatXlsx,
            csv: m.formatCsv,
            json: m.formatJson,
            xml: m.formatXml,
          }[f]}
        </button>
      ))}
    </div>
  );

  const exportMenu = (
    <div
      class="flex min-w-32 flex-col gap-0.5 p-1"
      data-testid="dv-export-menu"
    >
      {(["xlsx", "csv", "json", "xml", "html"] as const).map((f) => (
        <button
          type="button"
          class="rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          data-testid={`dv-export-${f}`}
          onClick={() => void exportAs(f)}
        >
          {{
            xlsx: m.formatXlsx,
            csv: m.formatCsv,
            json: m.formatJson,
            xml: m.formatXml,
            html: m.formatHtml,
          }[f]}
        </button>
      ))}
    </div>
  );

  const doUpdate = () => {
    const row = record.value;
    if (row) openForm(row);
  };

  function rowTitle(r: Row): string {
    return String(r.name ?? r.title ?? r.username ?? idOf(r));
  }

  async function doRemove(): Promise<void> {
    const row = record.value;
    if (!row || !ds.remove) return;
    const id = idOf(row);
    const r = await guarded(() => ds.remove!([id]));
    if (!r) return;
    const failed = r.failed ?? [];
    if (failed.length) {
      message.error(failed[0]?.error || m.networkError);
    } else {
      message.success(m.deleted);
    }
    formOpen.value = false;
    invalidateCurrentTabCache();
    if (props.data && idOf(props.data) === id) {
      record.value = null;
      props.onDataChange?.(null);
    } else {
      await load();
    }
    props.onChanged?.();
  }

  const renderTbBuiltin = (
    name: DataViewToolbarBuiltin,
    disable: boolean,
    action?: () => void,
    title?: string,
    label?: string,
  ) => {
    switch (name) {
      case "update":
        return toolBtn(
          "dv-update",
          updateTipDefault,
          action ?? doUpdate,
          <IconEdit size="sm" />,
          disable || !record.value,
          title,
          label,
        );
      case "remove": {
        const row = record.value;
        const tip = actionTipText("remove", title, label, m.delete);
        const locked = disable || !row;
        const btn = (
          <Button
            type="button"
            size="sm"
            class={posCls("dv-remove")}
            disabled={locked}
            data-testid="dv-remove"
            aria-label={tip}
            onClick={() => {
              if (locked) return;
              if (action) action();
              else popRemove.value = true;
            }}
          >
            <IconTrash size="sm" />
          </Button>
        );
        if (action) {
          return tipWrap(tip, btn);
        }
        return (
          <Popconfirm
            open={() => popRemove.value}
            placement="auto"
            danger
            title={row
              ? formatMessage(m.deleteAsk, { name: rowTitle(row) })
              : m.delete}
            okText={m.delete}
            cancelText={m.cancel}
            overlayClass={POP_OVERLAY_CLS}
            onOpenChange={(o: boolean) => {
              if (!o) popRemove.value = false;
            }}
            onConfirm={() => void doRemove()}
          >
            {tipWrap(tip, btn)}
          </Popconfirm>
        );
      }
      case "refresh":
        return (
          <Tooltip
            content={actionTipText("refresh", title, label, m.refresh)}
            placement="auto"
          >
            <Button
              type="button"
              size="sm"
              class={posCls("dv-refresh")}
              disabled={loading.value || disable}
              data-testid="dv-refresh"
              aria-label={actionTipText("refresh", title, label, m.refresh)}
              aria-busy={loading.value ? true : undefined}
              onClick={action ?? (() => void refreshFromToolbar())}
            >
              <span
                class={loading.value
                  ? "inline-flex animate-spin"
                  : "inline-flex"}
              >
                <IconRefresh size="sm" />
              </span>
            </Button>
          </Tooltip>
        );
      case "print":
        return toolBtn(
          "dv-print",
          m.print,
          action ?? printRecord,
          <IconPrinter size="sm" />,
          disable || !record.value,
          title,
          label,
        );
      case "import":
        if (action) {
          return toolBtn(
            "dv-import",
            m.import,
            action,
            <IconUpload size="sm" />,
            disable,
            title,
            label,
          );
        }
        return tipWrap(
          actionTipText("import", title, label, m.import),
          <Dropdown
            overlay={importMenu}
            placement="bottomRight"
            trigger="click"
          >
            <Button
              type="button"
              size="sm"
              class={posCls("dv-import")}
              disabled={disable}
              data-testid="dv-import"
              aria-label={actionTipText("import", title, label, m.import)}
            >
              <IconUpload size="sm" />
            </Button>
          </Dropdown>,
        );
      case "export":
        return tipWrap(
          actionTipText("export", title, label, m.export),
          <Dropdown
            overlay={exportMenu}
            placement="bottomRight"
            trigger="click"
          >
            <Button
              type="button"
              size="sm"
              class={posCls("dv-export")}
              disabled={disable || !record.value}
              data-testid="dv-export"
              aria-label={actionTipText("export", title, label, m.export)}
            >
              <IconDownload size="sm" />
            </Button>
          </Dropdown>,
        );
      case "fullscreen":
        return (
          <Tooltip
            content={actionTipText(
              "fullscreen",
              title,
              label,
              panelFs.value ? m.exitFullscreen : m.enterFullscreen,
            )}
            placement="auto"
          >
            <Button
              type="button"
              size="sm"
              class={posCls("dv-fullscreen")}
              disabled={disable}
              data-testid="dv-fullscreen"
              aria-label={actionTipText(
                "fullscreen",
                title,
                label,
                panelFs.value ? m.exitFullscreen : m.enterFullscreen,
              )}
              onClick={action ?? toggleFullscreen}
            >
              {panelFs.value
                ? <IconExitFullscreen size="sm" />
                : <IconMaximize2 size="sm" />}
            </Button>
          </Tooltip>
        );
      case "copy":
        return toolBtn(
          "dv-copy",
          m.copy,
          action ?? (() => void copyRecord()),
          <IconCopy size="sm" />,
          disable || !record.value,
          title,
          label,
        );
    }
  };

  const toolbar = (leading?: unknown) =>
    toolbarHidden && !leading ? null : (
      <div
        class={`${TOOLBAR_BAR_CLS}${
          leading ? " !flex-nowrap !justify-start !items-end !pb-0" : ""
        }`}
        data-testid="data-view-toolbar"
      >
        {leading}
        {!toolbarHidden && (
          <div
            class={`ml-auto shrink-0 self-center${leading ? " pb-2" : ""}`}
            data-dv-tools={key}
          >
            <ButtonGroup attached class="dp-tool-group">
              {toolbarSlots().map((s) => {
                if (s.kind === "custom") {
                  const tip = actionTipText(
                    s.key,
                    s.title,
                    typeof s.label === "string" ? s.label : undefined,
                  );
                  return tipWrap(
                    tip,
                    <Button
                      type="button"
                      size="sm"
                      class={posCls(`dv-tb-extra-${s.key}`)}
                      disabled={s.disable}
                      data-testid={`dv-tb-extra-${s.key}`}
                      aria-label={tip}
                      variant={s.tone && s.tone !== "default"
                        ? s.tone
                        : "default"}
                      onClick={s.action}
                    >
                      {s.icon ?? s.label ?? s.key}
                    </Button>,
                  );
                }
                return renderTbBuiltin(
                  s.name,
                  s.disable,
                  s.action,
                  s.title,
                  s.label,
                );
              })}
            </ButtonGroup>
          </div>
        )}
      </div>
    );

  const fieldRequired = (
    f: { required?: boolean; rules?: { required?: boolean }[] },
  ) => !!f.required || !!(f.rules && f.rules.some((r) => r.required));

  const formGridWidth = createSignal<number | undefined>(undefined);
  const setFormGridRef = bindContainerWidth(formGridWidth);

  const formBody = () => {
    const errs = formErrors.value;
    const bodyRender = props.form?.render;
    if (bodyRender) {
      const ctx: FormRenderCtx = {
        mode: "edit",
        row: formRow.value,
        id: formRow.value ? idOf(formRow.value) : resolveId(),
        busy: formBusy.value,
        errors: errs,
        topError: formTop.value,
        close: () => {
          formOpen.value = false;
        },
        submit: () => submitForm(),
        setBusy: (v) => {
          formBusy.value = v;
        },
        setErrors: (e) => {
          formErrors.value = e;
        },
        setTopError: (msg) => {
          formTop.value = msg;
        },
        reload: () => load(),
      };
      return (
        <div data-testid="dv-form" data-dv-form-custom="1">
          {bodyRender(ctx)}
        </div>
      );
    }
    const cond = formConditionCtx();
    const visibleForm = formDefs.filter((f) => isFormFieldVisible(f, cond));
    const formGrid = useFieldGrid(visibleForm);
    return (
      <form
        ref={setFormGridRef}
        class={formGrid ? "grid grid-cols-12 gap-3" : "grid gap-3"}
        data-testid="dv-form"
        method="dialog"
        action="#"
        onSubmit={(e: Event) => {
          e.preventDefault();
          void submitForm();
        }}
      >
        {visibleForm.map((f) => {
          const prop = fieldProp(f);
          const sig = fields[prop];
          const type = f.type ?? "text";
          const lay = fieldLayoutStyle(f, {
            grid: formGrid,
            containerWidth: formGridWidth.value,
          });
          const disabled = evalFlag(f.disabled, false, cond);
          const opts = resolveOptions(f.options, cond);
          let control: unknown;
          if (typeof f.render === "function") {
            const fieldCtx: FormFieldRenderCtx = {
              field: f,
              prop,
              value: sig,
              multiValue: mfields[prop],
              mode: "edit",
              row: formRow.value,
              disabled,
              error: errs[prop],
            };
            control = (
              <div class="w-full" data-testid={`dv-fld-${prop}`}>
                {f.render(fieldCtx)}
              </div>
            );
          } else if (type === "textarea") {
            control = (
              <div class="w-full" data-testid={`dv-fld-${prop}`}>
                <Textarea
                  rows={f.rows ?? 4}
                  value={sig}
                  disabled={disabled}
                  maxLength={f.maxlength}
                  placeholder={f.placeholder}
                  onInput={(
                    e: Event,
                  ) => (sig.value =
                    (e.target as unknown as { value: string }).value)}
                />
              </div>
            );
          } else if (type === "select") {
            control = (
              <div class="w-full" data-testid={`dv-fld-${prop}`}>
                <Select
                  size="sm"
                  value={sig}
                  disabled={disabled}
                  placeholder={!f.required &&
                      !opts.some((o) => o.value === "")
                    ? "—"
                    : undefined}
                  options={opts.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                />
              </div>
            );
          } else if (type === "multiselect") {
            control = (
              <div class="w-full" data-testid={`dv-fld-${prop}`}>
                <MultiSelect
                  size="sm"
                  value={mfields[prop]}
                  disabled={disabled}
                  options={opts.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  onChange={(e: Event) => {
                    const v = (e.target as unknown as { value: unknown }).value;
                    if (Array.isArray(v)) sig.value = v.join(",");
                  }}
                />
              </div>
            );
          } else if (type === "switch") {
            const on = f.onOff ? f.onOff[0] : "true";
            const off = f.onOff ? f.onOff[1] : "false";
            control = (
              <span data-testid={`dv-fld-${prop}`}>
                <Switch
                  checked={() => sig.value === on}
                  disabled={disabled}
                  onChange={(e: Event) => {
                    sig.value =
                      (e.target as unknown as { checked: boolean }).checked
                        ? on
                        : off;
                  }}
                />
              </span>
            );
          } else if (type === "number") {
            control = (
              <div class="w-full" data-testid={`dv-fld-${prop}`}>
                <InputNumber
                  size="sm"
                  value={sig}
                  disabled={disabled}
                  placeholder={f.placeholder}
                />
              </div>
            );
          } else if (type === "date") {
            control = (
              <div class="w-full" data-testid={`dv-fld-${prop}`}>
                <DatePicker
                  size="sm"
                  value={sig}
                  disabled={disabled}
                  placeholder={f.placeholder}
                />
              </div>
            );
          } else if (type === "datetime") {
            control = (
              <div class="w-full" data-testid={`dv-fld-${prop}`}>
                <DateTimePicker
                  size="sm"
                  value={sig}
                  format="YYYY-MM-DD HH:mm"
                  disabled={disabled}
                  placeholder={f.placeholder}
                />
              </div>
            );
          } else {
            control = (
              <div class="w-full" data-testid={`dv-fld-${prop}`}>
                <Input
                  type={type === "password" ? "password" : "text"}
                  value={sig}
                  disabled={disabled}
                  autoComplete={type === "password" ? "new-password" : "off"}
                  placeholder={f.placeholder}
                  onInput={(e: Event) => {
                    let v = (e.target as unknown as { value: string }).value;
                    if (f.maxlength != null && v.length > f.maxlength) {
                      v = v.slice(0, f.maxlength);
                    }
                    sig.value = v;
                  }}
                />
              </div>
            );
          }
          const err = errs[prop];
          return (
            <div style={lay} class={lay?.width ? undefined : "min-w-0"}>
              <FormItem
                label={f.label ?? prop}
                required={fieldRequired(f) && f.type !== "password"}
                error={err}
              >
                {control}
              </FormItem>
              {f.hint && !err && (
                <p
                  class="m-0 -mt-1 text-xs text-slate-500 dark:text-slate-400"
                  data-testid={`dv-fld-hint-${prop}`}
                >
                  {f.hint}
                </p>
              )}
            </div>
          );
        })}
        {formTop.value && (
          <p class="m-0 text-sm text-red-600" data-testid="dv-form-error">
            {formTop.value}
          </p>
        )}
      </form>
    );
  };

  const formFooter = () => {
    if (props.form?.footer === false) return null;
    if (props.form?.render && !props.form?.actions) return null;
    const ctx: FormActionContext = {
      values: collectValues(),
      mode: "edit",
      row: formRow.value,
      busy: formBusy.value,
      submit: submitForm,
      close: () => {
        formOpen.value = false;
      },
    };
    const slots = resolveFooterActions(
      props.form?.actions,
      ctx,
      [
        {
          key: "submit",
          label: formRow.value ? m.update : m.save,
          fallbackShow: true,
        },
        { key: "cancel", label: m.cancel, fallbackShow: true },
      ],
      "cancel",
    );
    return (
      <>
        {slots.map((s) => {
          const isSubmit = s.key === "submit";
          const isCancel = s.key === "cancel";
          const testid = isSubmit
            ? "dv-form-submit"
            : isCancel
            ? "dv-form-cancel"
            : `dv-form-action-${s.key}`;
          return (
            <Btn
              type="button"
              variant={s.tone ?? (isSubmit ? "primary" : "default")}
              loading={isSubmit && !s.action ? formBusy.value : undefined}
              disabled={s.disable || (isSubmit && formBusy.value)}
              data-testid={testid}
              onClick={() => {
                if (s.disable) return;
                if (isSubmit && !s.action) {
                  void submitForm();
                  return;
                }
                if (isCancel && !s.action) {
                  formOpen.value = false;
                  return;
                }
                s.action?.(ctx);
              }}
            >
              {s.label}
            </Btn>
          );
        })}
      </>
    );
  };

  const viewBody = () => {
    const r = record.value;
    const viewFields = resolveViewFields(props.view, []);
    const viewBodyRender = props.view?.render;
    const customSlot = props.children;
    const viewCtx = {
      row: r ?? {},
      close: () => {},
      reload: () => load(),
    };
    const footerSlots = r
      ? resolveViewFooterActions(
        resolveViewActionsCfg(props.view),
        r,
        m.close,
      ).filter((s) => !s.builtinClose)
      : [];

    let fieldArea: unknown;
    if (customSlot != null) {
      fieldArea = (
        <div data-testid="dv-view-custom" data-dv-view-custom="1">
          {customSlot}
        </div>
      );
    } else if (viewBodyRender) {
      fieldArea = (
        <div data-testid="dv-view-custom" data-dv-view-custom="1">
          {viewBodyRender(viewCtx)}
        </div>
      );
    } else if (!r) {
      fieldArea = <Empty description={m.empty} simple />;
    } else {
      const items = buildViewDescriptionItems(
        viewFields,
        r,
        m,
        (f: ViewItem, prop: string, row: Row) => {
          const click = f.click;
          if (!click) return;
          if (click === "toggle") {
            const next = toggleOptionValue(row[prop], f.options);
            if (next !== undefined) void setField(row, prop, next);
          } else {
            click(row);
          }
        },
      );
      fieldArea = (
        <Descriptions
          items={items}
          {...{ bordered: true, column: 1, size: "sm" as const }}
          {...pickViewDescriptionsProps(props.view)}
        />
      );
    }

    return (
      <div data-testid="dv-view">
        {fieldArea}
        {footerSlots.length
          ? (
            <div
              class="mt-4 flex justify-end gap-2"
              data-testid="dv-view-footer"
            >
              {footerSlots.map((s) => {
                const onAct = () => {
                  if (s.disable || !r) return;
                  if (s.href) {
                    g.open?.(s.href, "_self");
                    return;
                  }
                  s.action?.(r);
                };
                return (
                  <Btn
                    type="button"
                    variant={s.tone ?? "default"}
                    disabled={s.disable}
                    data-testid={`dv-view-action-${s.key}`}
                    onClick={onAct}
                  >
                    {s.label}
                  </Btn>
                );
              })}
            </div>
          )
          : null}
      </div>
    );
  };

  const cardTitle = () => {
    const vt = props.view?.title;
    const row = record.value;
    let text: unknown = props.title;
    if (typeof vt === "function") text = row ? vt(row) : props.title;
    else if (typeof vt === "string") text = vt;
    return (
      <span
        class="inline-flex min-w-0 items-center gap-2"
        data-testid="data-view"
      >
        <IconList size="sm" />
        <span class="truncate">{text}</span>
      </span>
    );
  };

  return (
    <div class="contents" data-testid={`panel-${key}`}>
      {() => (
        <div
          class={panelFs.value ? FS_CLS : undefined}
          data-dv-shell={key}
          data-testid="dv-shell"
          data-fullscreen={panelFs.value ? "true" : undefined}
        >
          <Card
            bordered
            size="sm"
            class={`dp-card${
              props.class ? ` ${props.class}` : ""
            } ${CARD_STYLE}`}
            headerClass={HEADER_BAR_CLS}
            title={cardTitle()}
            bodyClass="p-0"
          >
            {() => {
              const defaultBody = (
                <div
                  class={() =>
                    alertState.visible(props.alert)
                      ? TABLE_WRAP_BELOW_ALERT_CLS
                      : TABLE_WRAP_CLS}
                  data-testid="dv-body"
                >
                  {viewBody}
                </div>
              );
              const pageAlert = (
                <DataChromeAlert
                  alert={props.alert}
                  testId="dv-alert"
                  state={alertState}
                />
              );
              if (!props.tabs?.length) {
                return (
                  <>
                    {toolbar}
                    {pageAlert}
                    {defaultBody}
                  </>
                );
              }
              const controlled = props.activeTab;
              if (
                controlled &&
                controlled !== lastControlledTab.value
              ) {
                lastControlledTab.value = controlled;
                const synced = resolveDataChromeTabKey(
                  props.tabs,
                  controlled,
                  props.defaultActiveTab,
                );
                if (synced && synced !== tabKey.value) {
                  tabKey.value = synced;
                  rememberTabKey(key, synced);
                  if (tabParam) writeTabToLocation(tabParam, synced);
                  tabReload.run();
                }
              }
              return (
                <>
                  {toolbar(
                    <DataChromeTabList
                      tabs={props.tabs}
                      activeTab={tabKey.value}
                      defaultActiveTab={props.defaultActiveTab}
                      onTabChange={handleTabChange}
                      type={props.tabType}
                    />,
                  )}
                  {pageAlert}
                  <DataChromeTabBody
                    tabs={props.tabs}
                    activeTab={tabKey.value}
                    defaultActiveTab={props.defaultActiveTab}
                    defaultBody={defaultBody}
                  />
                </>
              );
            }}
          </Card>
        </div>
      )}

      <Modal
        open={formOpen}
        title={() => {
          const ft = props.form?.title;
          const row = formRow.value ?? ({} as Row);
          if (typeof ft === "function") return ft(row);
          if (typeof ft === "string") return ft;
          return `${m.edit} · ${props.title}`;
        }}
        width={() => resolveModalWidth(props.form?.width)}
        fullscreenable={props.form?.fullscreenable}
        keyboard
        destroyOnClose
        onClose={() => (formOpen.value = false)}
        // deno-lint-ignore jsx-no-children-prop
        children={formBody}
        footer={formFooter}
      />
    </div>
  );
}

export default DataView;
