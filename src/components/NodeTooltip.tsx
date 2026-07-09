import { useTranslation } from "react-i18next";
import type { StageMeta } from "../workflow/types";
import { STAGE_HINTS } from "../workflow/metadata";

/**
 * 节点悬停说明气泡。
 *
 * 内容合并两个来源：
 *   1. 后端 /stage/metadata 的结构化字段（输入/输出/类型/耗时）
 *   2. 前端 metadata.ts 的大白话解释（what/when/pitfalls）
 *
 * 布局：人话在上（口语化，帮用户快速理解），结构化字段在下（精确参考）。
 * 后端 meta 的 name/summary/note/desc 和前端 hint 的 what/when/pitfalls 都跟随当前语言。
 */
export function NodeTooltip({ meta }: { meta: StageMeta | undefined }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "zh" | "en";

  if (!meta) {
    return (
      <div className="max-w-xs rounded-lg border border-mpt-border bg-mpt-panel p-3 text-sm text-mpt-muted">
        {t("tooltip.loading")}
      </div>
    );
  }

  const hint = STAGE_HINTS[meta.id];

  return (
    <div className="w-80 rounded-lg border border-mpt-border bg-mpt-panel p-4 shadow-xl">
      {/* 标题 */}
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-xs font-bold text-mpt-teal">{meta.id}</span>
        <span className="text-sm font-semibold text-white">{meta.name[lang]}</span>
        <span className="ml-auto font-mono text-xs text-mpt-muted">{meta.typical_duration}</span>
      </div>

      {/* 大白话解释 */}
      {hint && (
        <div className="mb-3 space-y-1.5">
          <p className="text-sm text-mpt-muted leading-relaxed">{hint.what[lang]}</p>
          {hint.when && (
            <p className="text-xs text-mpt-muted/80">
              <span className="text-mpt-gold">{t("tooltip.whenToUse")}</span>
              {hint.when[lang]}
            </p>
          )}
          {hint.pitfalls && (
            <p className="text-xs text-mpt-muted/80">
              <span className="text-mpt-red">{t("tooltip.pitfalls")}</span>
              {hint.pitfalls[lang]}
            </p>
          )}
        </div>
      )}

      {/* 后端 note（如有） */}
      {meta.note && (
        <p className="mb-3 rounded bg-mpt-dark px-2 py-1 text-xs text-mpt-muted/80 italic">
          {meta.note[lang]}
        </p>
      )}

      {/* 结构化输入 */}
      <div className="mb-2">
        <div className="mb-1 font-mono text-xs text-mpt-teal">{t("tooltip.inputs")}</div>
        <ul className="space-y-0.5">
          {meta.inputs.map((inp) => (
            <li key={inp.name} className="flex items-baseline gap-1.5 text-xs">
              <code className="text-mpt-gold">{inp.name}</code>
              <span className="text-mpt-muted">{inp.type}</span>
              {inp.required && <span className="text-mpt-red">*</span>}
              <span className="text-mpt-muted/70">— {inp.desc[lang]}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 结构化输出 */}
      <div>
        <div className="mb-1 font-mono text-xs text-mpt-teal">{t("tooltip.outputs")}</div>
        <ul className="space-y-0.5">
          {meta.outputs.map((out) => (
            <li key={out.name} className="flex items-baseline gap-1.5 text-xs">
              <code className="text-mpt-gold">{out.name}</code>
              <span className="text-mpt-muted">{out.type}</span>
              <span className="text-mpt-muted/70">— {out.desc[lang]}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
