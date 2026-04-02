import type { FormEvent } from 'react'
import type { Template, TemplateFormState, TransactionType } from '../types'

type Props = {
  templateForm: TemplateFormState
  templates: Template[]
  categories: string[]
  onTemplateFormChange: (updater: (prev: TemplateFormState) => TemplateFormState) => void
  onSubmit: (event: FormEvent) => Promise<void>
  onCreateFromTemplate: (templateId: number) => void
  onEditTemplate: (template: Template) => void
  onDeleteTemplate: (templateId: number) => void
  formatMoney: (value: number) => string
}

export function TemplatesSection({
  templateForm,
  templates,
  categories,
  onTemplateFormChange,
  onSubmit,
  onCreateFromTemplate,
  onEditTemplate,
  onDeleteTemplate,
  formatMoney,
}: Props) {
  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <h2 className="mb-4 text-lg font-semibold">Шаблони повторюваних платежів</h2>
      <form className="mb-4 grid gap-2 md:grid-cols-4" onSubmit={(event) => void onSubmit(event)}>
        <input
          className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          placeholder="Назва"
          value={templateForm.name}
          onChange={(e) => onTemplateFormChange((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
        <input
          className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          type="number"
          step="0.01"
          placeholder="Сума"
          value={templateForm.amount}
          onChange={(e) => onTemplateFormChange((prev) => ({ ...prev, amount: e.target.value }))}
          required
        />
        <select
          className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          value={templateForm.category}
          onChange={(e) => onTemplateFormChange((prev) => ({ ...prev, category: e.target.value }))}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <input
          className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          type="number"
          min={1}
          max={31}
          placeholder="День місяця"
          value={templateForm.dayOfMonth}
          onChange={(e) => onTemplateFormChange((prev) => ({ ...prev, dayOfMonth: e.target.value }))}
          required
        />
        <input
          className="rounded border border-slate-300 px-3 py-2 md:col-span-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          placeholder="Опис"
          value={templateForm.description}
          onChange={(e) => onTemplateFormChange((prev) => ({ ...prev, description: e.target.value }))}
        />
        <select
          className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          value={templateForm.type}
          onChange={(e) => onTemplateFormChange((prev) => ({ ...prev, type: e.target.value as TransactionType }))}
        >
          <option value="expense">Витрата</option>
          <option value="income">Дохід</option>
        </select>
        <label className="flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600">
          <input
            type="checkbox"
            checked={templateForm.isActive}
            onChange={(e) => onTemplateFormChange((prev) => ({ ...prev, isActive: e.target.checked }))}
          />
          Active
        </label>
        <button className="rounded bg-slate-900 px-3 py-2 text-white md:col-span-4" type="submit">
          {templateForm.id ? 'Оновити шаблон' : 'Створити шаблон'}
        </button>
      </form>
      <ul className="space-y-2">
        {templates.map((template) => (
          <li key={template.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 p-3 dark:border-slate-700 dark:bg-slate-700/30">
            <div>
              <p className="font-medium">
                {template.name} - {formatMoney(template.amount)} ({template.type})
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {template.category}, день {template.dayOfMonth}, {template.isActive ? 'active' : 'inactive'}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="rounded bg-emerald-600 px-2 py-1 text-xs text-white" onClick={() => onCreateFromTemplate(template.id)}>
                Створити транзакцію
              </button>
              <button className="rounded bg-slate-200 px-2 py-1 text-xs dark:bg-slate-700" onClick={() => onEditTemplate(template)}>
                Edit
              </button>
              <button className="rounded bg-rose-600 px-2 py-1 text-xs text-white" onClick={() => onDeleteTemplate(template.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
        {templates.length === 0 && <li className="text-sm text-slate-500 dark:text-slate-400">Шаблони ще не створено</li>}
      </ul>
    </section>
  )
}
