import type { FormEvent } from 'react'
import type { Template, TemplateFormState, TransactionType } from '../types'
import { CATEGORY_EMOJIS } from '../App'

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
    <section className="revo-card mt-8 shadow-revo-md">
      <h2 className="mb-6 text-xl font-bold tracking-tight text-revo-text">Автоматизація (Шаблони)</h2>
      
      <form className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => void onSubmit(event)}>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Назва</label>
          <input
            className="revo-input font-bold"
            placeholder="Оренда квартири"
            value={templateForm.name}
            onChange={(e) => onTemplateFormChange((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Сума</label>
          <input
            className="revo-input font-black tracking-tighter"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={templateForm.amount}
            onChange={(e) => onTemplateFormChange((prev) => ({ ...prev, amount: e.target.value }))}
            required
          />
        </div>
        <div>
           <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-revo-gray">День</label>
           <input
            className="revo-input font-bold"
            type="number"
            min={1}
            max={31}
            placeholder="День"
            value={templateForm.dayOfMonth}
            onChange={(e) => onTemplateFormChange((prev) => ({ ...prev, dayOfMonth: e.target.value }))}
            required
          />
        </div>
        
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Категорія</label>
          <select
            className="revo-input font-bold"
            value={templateForm.category}
            onChange={(e) => onTemplateFormChange((prev) => ({ ...prev, category: e.target.value }))}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_EMOJIS[category] || '📦'} {category}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-revo-gray">Тип</label>
          <select
            className="revo-input font-bold"
            value={templateForm.type}
            onChange={(e) => onTemplateFormChange((prev) => ({ ...prev, type: e.target.value as TransactionType }))}
          >
            <option value="expense">Витрата</option>
            <option value="income">Дохід</option>
          </select>
        </div>
        
        <div className="flex items-end">
          <label className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 text-sm font-bold text-revo-text transition-colors hover:bg-slate-100 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-revo-blue focus:ring-revo-blue"
              checked={templateForm.isActive}
              onChange={(e) => onTemplateFormChange((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Активний
          </label>
        </div>

        <button className="revo-btn-primary sm:col-span-2 lg:col-span-4 shadow-lg shadow-revo-blue/10" type="submit">
          {templateForm.id ? 'Оновити шаблон' : 'Створити новий шаблон'}
        </button>
      </form>

      <ul className="space-y-4">
        {templates.map((template) => {
          const emoji = CATEGORY_EMOJIS[template.category] || '📦'
          return (
            <li key={template.id} className="flex flex-col gap-4 rounded-3xl bg-slate-50 p-5 transition-all hover:bg-slate-100 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-4 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl">
                  {emoji}
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-black text-revo-text truncate">
                    {template.name}
                  </p>
                  <p className="text-xs font-bold text-revo-gray uppercase tracking-wider">
                    {template.category} • {formatMoney(template.amount)} • день {template.dayOfMonth}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  className="rounded-full bg-revo-blue px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-transform hover:scale-105 active:scale-95" 
                  onClick={() => onCreateFromTemplate(template.id)}
                >
                  Виконати
                </button>
                <button 
                  className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-revo-text transition-colors hover:bg-slate-200" 
                  onClick={() => onEditTemplate(template)}
                >
                  Edit
                </button>
                <button 
                  className="rounded-full bg-revo-danger/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-revo-danger transition-colors hover:bg-revo-danger/20" 
                  onClick={() => onDeleteTemplate(template.id)}
                >
                  Del
                </button>
              </div>
            </li>
          )
        })}
        {templates.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm font-bold text-revo-gray">Шаблони ще не створено</p>
          </div>
        )}
      </ul>
    </section>
  )
}
