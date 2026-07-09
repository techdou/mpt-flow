import { useTranslation } from "react-i18next";
import type { StageMeta } from "../workflow/types";
import { STAGE_HINTS } from "../workflow/metadata";
import { stageColor } from "../workflow/stageVisuals";
import { StageIcon } from "./StageIcon";

/**
 * 节点悬停说明气泡。
 *
 * 顶部颜色条标识阶段身份，内容分三层：
 *   1. 大白话解释（pill 标签区分"何时用"/"注意"）
 *   2. 后端 note
 *   3. 结构化输入输出
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
  const color = stageColor(meta.id);

  return (
    <div className="max-h-[70vh] w-80 overflow-y-auto rounded-lg border border-mpt-border bg-mpt-panel shadow-2xl">
      {/* 顶部颜色条 */}
      <div className="h-1" style={{ backgroundColor: color }} />

      <div className="p-4">
        {/* 标题 */}
        <div className="mb-2.5 flex items-center gap-2">
          <StageIcon stageId={meta.id} className="h-5 w-5 shrink-0" />
          <span className="text-sm font-heading font-bold text-white">{meta.name[lang]}</span>
          <span className="ml-auto shrink-0 rounded-full bg-mpt-elevated px-2 py-0.5 font-mono text-[10px] text-mpt-muted">
            {meta.typical_duration}
          </span>
        </div>

        {/* 大白话解释 */}
        {hint && (
          <div className="mb-3 space-y-1.5">
            <p className="text-sm leading-relaxed text-mpt-muted">{hint.what[lang]}</p>
            {hint.when && (
              <div className="flex gap-1.5">
                <span className="shrink-0 rounded bg-mpt-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-mpt-gold">
                  {t("tooltip.whenToUse")}
                </span>
                <span className="text-xs leading-relaxed text-mpt-muted/80">{hint.when[lang]}</span>
              </div>
            )}
            {hint.pitfalls && (
              <div className="flex gap-1.5">
                <span className="shrink-0 rounded bg-mpt-red/15 px-1.5 py-0.5 text-[10px] font-medium text-mpt-red">
                  {t("tooltip.pitfalls")}
                </span>
                <span className="text-xs leading-relaxed text-mpt-muted/80">{hint.pitfalls[lang]}</span>
              </div>
            )}
          </div>
        )}

        {/* 后端 note */}
        {meta.note && (
          <p className="mb-3 rounded-md bg-mpt-dark px-2.5 py-1.5 text-xs italic text-mpt-muted/70">
            {meta.note[lang]}
          </p>
        )}

        {/* 结构化输入 */}
        <div className="mb-2.5">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-mpt-teal">
            {t("tooltip.inputs")}
          </div>
          <ul className="space-y-0.5">
            {meta.inputs.map((inp) => (
              <li key={inp.name} className="flex items-baseline gap-1.5 text-xs">
                <code className="text-mpt-gold">{inp.name}</code>
                <span className="rounded bg-mpt-elevated px-1 text-[10px] text-mpt-muted">{inp.type}</span>
                {inp.required && <span className="text-mpt-red">*</span>}
                <span className="text-mpt-muted/60">— {inp.desc[lang]}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 结构化输出 */}
        <div>
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-mpt-teal">
            {t("tooltip.outputs")}
          </div>
          <ul className="space-y-0.5">
            {meta.outputs.map((out) => (
              <li key={out.name} className="flex items-baseline gap-1.5 text-xs">
                <code className="text-mpt-gold">{out.name}</code>
                <span className="rounded bg-mpt-elevated px-1 text-[10px] text-mpt-muted">{out.type}</span>
                <span className="text-mpt-muted/60">— {out.desc[lang]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
