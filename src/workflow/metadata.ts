import type { StageHint, StageId, StageMeta } from "./types";

/**
 * 大白话节点说明（前端本地维护，双语文本）。
 *
 * 后端 /stage/metadata 返回的是结构化字段（输入/输出/类型），适合精确展示。
 * 这里补充"人话解释"：这个节点干什么、什么时候用、有什么坑。
 * NodeTooltip 渲染时会把两者合并：上面是人话，下面是结构化字段。
 */
export const STAGE_HINTS: Record<StageId, StageHint> = {
  script: {
    what: {
      zh: "输入一个主题（比如「人工智能的未来」），AI 帮你写出完整的视频旁白文案。",
      en: "Enter a topic (e.g. \"The Future of AI\") and the LLM writes a full narration script for you.",
    },
    when: {
      zh: "任何视频的起点。没有文案后面啥也干不了。",
      en: "The starting point of every video. Nothing else works without a script.",
    },
    pitfalls: {
      zh: "主题描述越具体，文案质量越高。「AI」不如「AI 在医疗领域的突破」。",
      en: "More specific topics yield better scripts. \"AI\" is worse than \"AI breakthroughs in healthcare\".",
    },
  },
  terms: {
    what: {
      zh: "根据文案内容，生成一组搜索关键词，用来去素材网站找匹配的视频片段。",
      en: "Generates search keywords from the script to find matching stock footage.",
    },
    when: {
      zh: "用在线素材源（Pexels/Pixabay）时必须跑。用本地素材可以跳过。",
      en: "Required for online sources (Pexels/Pixabay). Skippable with local materials.",
    },
    pitfalls: {
      zh: "关键词太宽泛（比如「科技」）会找到一堆无关素材；太窄（比如「2024年Q3财报」）会啥也找不到。",
      en: "Keywords too broad (e.g. \"tech\") return irrelevant clips; too narrow (e.g. \"Q3 2024 earnings\") finds nothing.",
    },
  },
  audio: {
    what: {
      zh: "把文案变成语音配音。选个音色，调个语速，AI 念给你听。",
      en: "Turns the script into voiceover. Pick a voice, set the speed, and the AI narrates it.",
    },
    when: {
      zh: "需要旁白配音时。也可以上传自己录好的音频文件跳过这步。",
      en: "When you need narration. You can also upload a pre-recorded audio file to skip TTS.",
    },
    pitfalls: {
      zh: "音色语言要和文案语言一致，中文文案别选英文音色，否则会报错。",
      en: "Voice language must match the script language. A Chinese script with an English voice will error out.",
    },
  },
  subtitle: {
    what: {
      zh: "根据配音的时间轴生成字幕文件（SRT），每个字出现在正确的时刻。",
      en: "Generates an SRT subtitle file from the voiceover timeline, placing each word at the right timestamp.",
    },
    when: {
      zh: "需要字幕时。默认用 edge（精确时间轴），也可以用 whisper（从音频转写）。",
      en: "When you need subtitles. Defaults to edge (precise timeline); whisper (audio transcription) is also available.",
    },
    pitfalls: {
      zh: "单阶段触发时需要先跑过 audio 节点，否则没有时间轴数据。",
      en: "Single-stage trigger requires the audio node to have run first, otherwise there's no timeline data.",
    },
  },
  materials: {
    what: {
      zh: "根据关键词去素材网站下载视频片段，或者预处理本地素材文件夹。",
      en: "Downloads stock clips by keywords, or preprocesses local material files.",
    },
    when: {
      zh: "在线源需要先配 API Key。本地源用 storage/local_videos 下的文件。",
      en: "Online sources need an API key configured. Local source uses files under storage/local_videos.",
    },
    pitfalls: {
      zh: "网络不好或 API Key 没配会下载失败。国内访问 Pexels 可能需要代理。",
      en: "Downloads fail with poor network or missing API key. Pexels may need a proxy in some regions.",
    },
  },
  render: {
    what: {
      zh: "把素材 + 配音 + 字幕拼成最终视频。这是最耗时的步骤。",
      en: "Combines materials + voiceover + subtitle into the final video. This is the most time-consuming stage.",
    },
    when: {
      zh: "前面所有阶段都跑完后。也可以不要字幕，只拼素材+配音。",
      en: "After all upstream stages are done. Subtitles are optional — you can render materials + audio only.",
    },
    pitfalls: {
      zh: "高清视频合成可能要几分钟。video_count 决定生成几个版本。",
      en: "HD rendering may take several minutes. video_count controls how many versions are generated.",
    },
  },
};

/** 所有阶段 ID 按依赖顺序排列（用于预设模板） */
export const STAGE_ORDER: StageId[] = ["script", "terms", "audio", "subtitle", "materials", "render"];

/** 从远端元数据列表里按 id 查找 */
export function findMeta(metas: StageMeta[], id: StageId): StageMeta | undefined {
  return metas.find((m) => m.id === id);
}
