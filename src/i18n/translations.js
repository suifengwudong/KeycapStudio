/**
 * KeycapStudio – UI translations (zh / en)
 *
 * Usage:
 *   import { useT } from '../store/langStore';
 *   const t = useT();
 *   <label>{t('color')}</label>
 */

export const translations = {
  zh: {
    // ── DesignHeader ─────────────────────────────────────────────────────────
    appTitle          : '⌨ 键帽工作室',
    btnNew            : '新建',
    btnPresets        : '预设',
    btnOpenProject    : '打开项目',
    btnSaveProject    : '保存项目',
    btnSaveProjectDirty: '● 保存项目',
    btnExportSTL      : '导出 STL',
    btnBatchExport    : '批量导出',
    btnExportPackage  : '导出完整包',
    btnLegacy         : '旧版 ▾',
    legacyImport      : '导入 .keycap',
    legacyExport      : '导出 .keycap',
    confirmDiscard    : '放弃未保存的修改？',
    confirmRestore    : '发现未保存的项目，是否恢复？',
    restoreYes        : '恢复',
    restoreNo         : '放弃',

    // ── Inspector panel header (3D) ───────────────────────────────────────────
    inspector         : '检查器',

    // ── KeycapInspector – shape params ────────────────────────────────────────
    profile           : '规格',
    size              : '尺寸',
    color             : '颜色',
    topRadius         : '顶角半径 (mm)',
    wallThickness     : '壁厚 (mm)',
    height            : '高度 (mm)',
    heightAuto        : '自动',
    heightAutoNote    : '自动（来自规格：{h} mm）',
    dishDepth         : '顶面凹深 (mm)',
    stemHole          : 'Cherry MX 轴孔（虚线显示）',
    embossTitle       : '浮雕文字',
    embossEnable      : '启用',
    embossTextLabel   : '文字内容',
    embossTextPlaceholder: '例：A  Esc  ↵',
    embossFontSize    : '字体大小 (mm)',
    embossDepth       : '浮雕深度 (mm)',
    embossColor       : '浮雕颜色',
    embossHintTitle   : '推荐参数',
    embossHintFDM     : '• FDM 打印：深度 0.3–0.6 mm',
    embossHintVisual  : '• 视觉效果：深度 0.5–1.0 mm',
    embossHintFont    : '• 1u 键帽字体：4–6 mm',
    embossHintVisible : '✓ 浮雕在 STL 导出中可见；3D 预览以虚线框示意',

    // ── KeycapInspector – legend section ─────────────────────────────────────
    sectionLegend       : '标签文字',
    legendText          : '文字',
    legendTextPlaceholder: '例：A、Esc、↵',
    legendTextColor     : '文字颜色',
    legendFontSize      : '字体大小',
    legendPosX          : '水平位置 X',
    legendPosY          : '垂直位置 Y',
    legendCenter        : '居中',

    // ── NodeInspector ─────────────────────────────────────────────────────────
    noNodeSelected    : '正在加载键帽参数…',
  },

  en: {
    // ── DesignHeader ─────────────────────────────────────────────────────────
    appTitle          : '⌨ Keycap Studio',
    btnNew            : 'New',
    btnPresets        : 'Presets',
    btnOpenProject    : 'Open Project',
    btnSaveProject    : 'Save Project',
    btnSaveProjectDirty: '● Save Project',
    btnExportSTL      : 'Export STL',
    btnBatchExport    : 'Batch Export',
    btnExportPackage  : 'Export Package',
    btnLegacy         : 'Legacy ▾',
    legacyImport      : 'Import .keycap',
    legacyExport      : 'Export .keycap',
    confirmDiscard    : 'Discard unsaved changes?',
    confirmRestore    : 'An unsaved project was found. Restore it?',
    restoreYes        : 'Restore',
    restoreNo         : 'Discard',

    // ── Inspector panel header (3D) ───────────────────────────────────────────
    inspector         : 'Inspector',

    // ── KeycapInspector – shape params ────────────────────────────────────────
    profile           : 'Profile',
    size              : 'Size',
    color             : 'Color',
    topRadius         : 'Top Radius (mm)',
    wallThickness     : 'Wall Thickness (mm)',
    height            : 'Height (mm)',
    heightAuto        : 'Auto',
    heightAutoNote    : 'Auto ({h} mm from profile)',
    dishDepth         : 'Dish Depth (mm)',
    stemHole          : 'Cherry MX stem hole (dashed overlay)',
    embossTitle       : 'Text Emboss',
    embossEnable      : 'Enable',
    embossTextLabel   : 'Text content',
    embossTextPlaceholder: 'e.g. A  Esc  ↵',
    embossFontSize    : 'Font size (mm)',
    embossDepth       : 'Emboss depth (mm)',
    embossColor       : 'Emboss color',
    embossHintTitle   : 'Recommended params',
    embossHintFDM     : '• FDM print: depth 0.3–0.6 mm',
    embossHintVisual  : '• Visual effect: depth 0.5–1.0 mm',
    embossHintFont    : '• 1u keycap font: 4–6 mm',
    embossHintVisible : '✓ Emboss appears in STL export; 3D preview shows dashed outline',

    // ── KeycapInspector – legend section ─────────────────────────────────────
    sectionLegend       : 'Legend Text',
    legendText          : 'Text',
    legendTextPlaceholder: 'e.g. A, Esc, ↵',
    legendTextColor     : 'Text color',
    legendFontSize      : 'Font size',
    legendPosX          : 'Horizontal X',
    legendPosY          : 'Vertical Y',
    legendCenter        : 'Center',

    // ── NodeInspector ─────────────────────────────────────────────────────────
    noNodeSelected    : 'Loading keycap params…',
  },
};

/** Available language codes. */
export const LANGUAGES = ['zh', 'en'];
