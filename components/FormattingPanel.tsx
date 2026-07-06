"use client";

import type {
  PageSize,
  ResumeFormatting,
  ResumeTextStyle,
  TextStyleKey,
} from "@/types/resume";

type FormattingPanelProps = {
  formatting: ResumeFormatting;
  pageSize: PageSize;
  onPageSizeChange: (pageSize: PageSize) => void;
  onChange: (formatting: ResumeFormatting) => void;
  onReset: () => void;
};

const fontOptions = [
  "Arial",
  "Times New Roman",
  "Georgia",
  "Calibri",
  "Inter",
  "serif",
  "sans-serif",
  "monospace",
];

const textStyleLabels: Record<TextStyleKey, string> = {
  name: "Name",
  contact: "Contact Line",
  sectionTitle: "Section Heading",
  blockTitle: "Block Title",
  subtitle: "Subtitle / Role",
  meta: "Date / Location",
  stack: "Stack / Skills Line",
  bullet: "Bullet Text",
};

const textStyleOrder: TextStyleKey[] = [
  "name",
  "contact",
  "sectionTitle",
  "blockTitle",
  "subtitle",
  "meta",
  "stack",
  "bullet",
];

export default function FormattingPanel({
  formatting,
  pageSize,
  onPageSizeChange,
  onChange,
  onReset,
}: FormattingPanelProps) {
  function updateFormatting<K extends keyof ResumeFormatting>(
    key: K,
    value: ResumeFormatting[K],
  ) {
    onChange({
      ...formatting,
      [key]: value,
    });
  }

  function updateTextStyle(
    key: TextStyleKey,
    updates: Partial<ResumeTextStyle>,
  ) {
    onChange({
      ...formatting,
      textStyles: {
        ...formatting.textStyles,
        [key]: {
          ...formatting.textStyles[key],
          ...updates,
        },
      },
    });
  }

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Formatting</h2>

        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50"
        >
          Reset
        </button>
      </div>

      <div className="divide-y divide-slate-200 border-y border-slate-200">
        <div className="space-y-4 py-4">
          <h3 className="text-sm font-semibold text-slate-950">
            Page
          </h3>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Page size
            </span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(event.target.value as PageSize)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-sky-500"
            >
              <option value="letter">Letter</option>
              <option value="a4">A4</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Base font family
            </span>
            <select
              value={formatting.fontFamily}
              onChange={(event) =>
                updateFormatting("fontFamily", event.target.value)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-sky-500"
            >
              {fontOptions.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </label>

          <SliderControl
            label="Line height"
            value={formatting.lineHeight}
            min={1}
            max={1.6}
            step={0.01}
            suffix="×"
            onChange={(value) => updateFormatting("lineHeight", value)}
          />

          <SliderControl
            label="Page margin"
            value={formatting.margin}
            min={18}
            max={72}
            step={1}
            suffix="px"
            onChange={(value) => updateFormatting("margin", value)}
          />

          <SliderControl
            label="Section spacing"
            value={formatting.sectionSpacing}
            min={0}
            max={24}
            step={1}
            suffix="px"
            onChange={(value) => updateFormatting("sectionSpacing", value)}
          />

          <SliderControl
            label="Bullet spacing"
            value={formatting.bulletSpacing}
            min={0}
            max={10}
            step={1}
            suffix="px"
            onChange={(value) => updateFormatting("bulletSpacing", value)}
          />
        </div>

        <div className="space-y-3 py-4">
          <h3 className="text-sm font-semibold text-slate-950">
            Text Styles
          </h3>

          {textStyleOrder.map((key) => {
            const style = formatting.textStyles[key];

            return (
              <div
                key={key}
                className="border-l-2 border-slate-100 bg-white py-2 pl-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold">
                    {textStyleLabels[key]}
                  </h4>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateTextStyle(key, {
                          bold: !style.bold,
                        })
                      }
                      className={`rounded-lg px-2 py-1 text-xs font-bold ${
                        style.bold
                          ? "bg-sky-600 text-white"
                          : "bg-sky-50 text-sky-700"
                      }`}
                    >
                      B
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateTextStyle(key, {
                          italic: !style.italic,
                        })
                      }
                      className={`rounded-lg px-2 py-1 text-xs italic ${
                        style.italic
                          ? "bg-sky-600 text-white"
                          : "bg-sky-50 text-sky-700"
                      }`}
                    >
                      I
                    </button>
                  </div>
                </div>

                <label className="mb-2 block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Font family
                  </span>
                  <select
                    value={style.fontFamily}
                    onChange={(event) =>
                      updateTextStyle(key, {
                        fontFamily: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-sky-500"
                  >
                    <option value="">Use base</option>
                    {fontOptions.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </label>

                <SliderControl
                  label="Font size"
                  value={style.fontSize}
                  min={7}
                  max={key === "name" ? 42 : 26}
                  step={0.1}
                  suffix="px"
                  onChange={(value) =>
                    updateTextStyle(key, {
                      fontSize: value,
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type SliderControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
};

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: SliderControlProps) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>

        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
          {value}
          {suffix}
        </span>
      </span>

      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
      />
    </label>
  );
}
