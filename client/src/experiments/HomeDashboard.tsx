import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type IconName =
  | 'bookOpen'
  | 'cube'
  | 'language'
  | 'atom'
  | 'flask'
  | 'leaf'
  | 'temple'
  | 'globe'
  | 'runner'
  | 'palette'
  | 'users'
  | 'user'
  | 'checkCircle'
  | 'box3d'
  | 'clipboard'
  | 'pencil'
  | 'send'
  | 'resource'
  | 'chart'

type SubjectEntry = {
  name: string
  path: string
  icon: IconName
  color: string
  soft: string
}

type StatCard = {
  label: string
  value: string
  icon: IconName
  color: string
  soft: string
  note?: string
}

type TodoItem = {
  icon: IconName
  title: string
  meta: string
  tag: string
  color: string
  soft: string
}

const subjects: SubjectEntry[] = [
  { name: '语文之美', path: '/chinese', icon: 'bookOpen', color: '#2f7df4', soft: '#edf4ff' },
  { name: '数学之美', path: '/math', icon: 'cube', color: '#4d8df7', soft: '#edf4ff' },
  { name: '英语之美', path: '/english', icon: 'language', color: '#4c86f7', soft: '#edf4ff' },
  { name: '物理之美', path: '/physics', icon: 'atom', color: '#165DFF', soft: '#edf4ff' },
  { name: '化学之美', path: '/chemistry', icon: 'flask', color: '#3277f6', soft: '#edf4ff' },
  { name: '生物之美', path: '/biology', icon: 'leaf', color: '#25b978', soft: '#ebf8f1' },
  { name: '历史之美', path: '/history', icon: 'temple', color: '#f08a1c', soft: '#fff4e5' },
  { name: '地理之美', path: '/geography', icon: 'globe', color: '#25a6a4', soft: '#e9f8f7' },
  { name: '体育之美', path: '/sports', icon: 'runner', color: '#f08a1c', soft: '#fff3e6' },
  { name: '艺术之美', path: '/art', icon: 'palette', color: '#7a66e8', soft: '#f2f0ff' },
]

const stats: StatCard[] = [
  { label: '学科总数', value: '10', icon: 'bookOpen', color: '#165DFF', soft: '#edf4ff' },
  { label: '实验/课程总数', value: '1,245', icon: 'flask', color: '#165DFF', soft: '#edf4ff' },
  { label: '本周学习人数', value: '8,429', icon: 'users', color: '#20b77a', soft: '#eaf8f1', note: '较上周 ↑ 12.6%' },
  { label: '今日活跃人数', value: '1,256', icon: 'user', color: '#f08a1c', soft: '#fff3e6', note: '较昨日 ↑ 8.3%' },
  { label: '完成课程数', value: '3,687', icon: 'checkCircle', color: '#7567dc', soft: '#f2f0ff' },
  { label: '3D资源数', value: '2,341', icon: 'box3d', color: '#2f7df4', soft: '#edf4ff' },
]

const recentLearning = [
  { subject: '数学', title: '函数的图像与性质', progress: '学习进度 68%', time: '今天 09:24', color: '#165DFF' },
  { subject: '生物', title: '细胞的结构与功能', progress: '学习进度 45%', time: '昨天 16:30', color: '#20b77a' },
  { subject: '物理', title: '牛顿运动定律', progress: '学习进度 30%', time: '昨天 14:12', color: '#3277f6' },
  { subject: '历史', title: '秦汉统一多民族国家的建立', progress: '学习进度 80%', time: '05-11 10:05', color: '#f08a1c' },
]

const todoItems: TodoItem[] = [
  { icon: 'clipboard', title: '布置作业：二次函数的应用', meta: '数学 · 高一（2）班', tag: '今天截止', color: '#2f7df4', soft: '#edf4ff' },
  { icon: 'flask', title: '课堂任务：化学键的类型', meta: '化学 · 高二（1）班', tag: '明天截止', color: '#20b77a', soft: '#eaf8f1' },
  { icon: 'pencil', title: '批改作业：牛顿运动定律练习', meta: '物理 · 高一（3）班', tag: '3项待批', color: '#3277f6', soft: '#edf4ff' },
  { icon: 'send', title: '发布课程：世界地形的形成', meta: '地理 · 高一（1）班', tag: '待发布', color: '#3277f6', soft: '#edf4ff' },
]

const rankings = [
  { name: '数学之美', value: '9,842', ratio: 1 },
  { name: '物理之美', value: '8,731', ratio: 0.86 },
  { name: '生物之美', value: '7,125', ratio: 0.68 },
  { name: '化学之美', value: '6,384', ratio: 0.6 },
  { name: '地理之美', value: '5,291', ratio: 0.5 },
]

const resourceTypes = [
  { name: '3D模型', value: '42%', color: '#165DFF' },
  { name: '实验课程', value: '28%', color: '#5b8ef9' },
  { name: '微课视频', value: '16%', color: '#f7bd37' },
  { name: '互动课件', value: '10%', color: '#40c8bc' },
  { name: '其他资源', value: '4%', color: '#a8b5c9' },
]

const quickActions = [
  { title: '新建课程', subtitle: '创建新的3D课程内容', icon: 'bookOpen' as IconName, color: '#165DFF', soft: '#edf4ff' },
  { title: '查看资源库', subtitle: '浏览全部教学资源', icon: 'resource' as IconName, color: '#20b77a', soft: '#eaf8f1' },
  { title: '发布任务', subtitle: '布置课堂任务与作业', icon: 'send' as IconName, color: '#f08a1c', soft: '#fff3e6' },
  { title: '查看统计', subtitle: '查看学情数据统计', icon: 'chart' as IconName, color: '#7567dc', soft: '#f2f0ff' },
]

function IconSvg({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  )
}

function DashboardIcon({ name, size = 24 }: { name: IconName; size?: number }) {
  switch (name) {
    case 'bookOpen':
      return (
        <IconSvg size={size}>
          <path d="M4 5.5c2.3 0 4.6.5 6.5 1.9v11.1C8.6 17.2 6.3 16.7 4 16.7V5.5Z" />
          <path d="M20 5.5c-2.3 0-4.6.5-6.5 1.9v11.1c1.9-1.3 4.2-1.8 6.5-1.8V5.5Z" />
          <path d="M10.5 7.4h3" />
        </IconSvg>
      )
    case 'cube':
      return (
        <IconSvg size={size}>
          <path d="m12 3 7.2 4.1L12 11.2 4.8 7.1 12 3Z" />
          <path d="M4.8 7.1v8.2l7.2 4.1 7.2-4.1V7.1" />
          <path d="M12 11.2v8.2" />
        </IconSvg>
      )
    case 'language':
      return (
        <IconSvg size={size}>
          <path d="M5 6.2h8.4a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2H9l-3.6 2.5v-2.5H5a2 2 0 0 1-2-2V8.2a2 2 0 0 1 2-2Z" />
          <path d="m7.2 13.2 2.2-5.1 2.2 5.1" />
          <path d="M8 11.5h2.8" />
          <path d="M17.5 9.6h1.7a1.8 1.8 0 0 1 1.8 1.8v3.4a1.8 1.8 0 0 1-1.8 1.8H18l-2.2 1.5" />
        </IconSvg>
      )
    case 'atom':
      return (
        <IconSvg size={size}>
          <circle cx="12" cy="12" r="1.8" />
          <path d="M19.1 4.9c1.5 1.5-.7 6.1-4.9 10.3s-8.8 6.4-10.3 4.9.7-6.1 4.9-10.3 8.8-6.4 10.3-4.9Z" />
          <path d="M4.9 4.9c-1.5 1.5.7 6.1 4.9 10.3s8.8 6.4 10.3 4.9-.7-6.1-4.9-10.3S6.4 3.4 4.9 4.9Z" />
        </IconSvg>
      )
    case 'flask':
      return (
        <IconSvg size={size}>
          <path d="M9 3h6" />
          <path d="M10 3v5.1L5.2 17a3.1 3.1 0 0 0 2.7 4.6h8.2a3.1 3.1 0 0 0 2.7-4.6L14 8.1V3" />
          <path d="M7.4 16.4h9.2" />
        </IconSvg>
      )
    case 'leaf':
      return (
        <IconSvg size={size}>
          <path d="M20.2 4.2C12.8 4.6 6.6 8.7 5 15.5c4.4 1.1 11.2-.7 15.2-11.3Z" />
          <path d="M5 19c2.1-4.7 6-7.8 11.2-9.5" />
        </IconSvg>
      )
    case 'temple':
      return (
        <IconSvg size={size}>
          <path d="M4 9h16" />
          <path d="m5 8 7-4 7 4" />
          <path d="M6 9v8" />
          <path d="M10 9v8" />
          <path d="M14 9v8" />
          <path d="M18 9v8" />
          <path d="M4.5 17h15" />
          <path d="M3.5 20h17" />
        </IconSvg>
      )
    case 'globe':
      return (
        <IconSvg size={size}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.8 12h16.4" />
          <path d="M12 3.5c2.2 2.3 3.2 5.2 3.2 8.5s-1 6.2-3.2 8.5" />
          <path d="M12 3.5C9.8 5.8 8.8 8.7 8.8 12s1 6.2 3.2 8.5" />
        </IconSvg>
      )
    case 'runner':
      return (
        <IconSvg size={size}>
          <circle cx="15.5" cy="4.5" r="1.8" />
          <path d="m12.2 8 3.2 2.2 3.2-.4" />
          <path d="m10.5 12.2 2.6-4.2" />
          <path d="m13.1 10.2-1.6 4.1 3.7 5" />
          <path d="m8.2 20 3.3-5.7" />
          <path d="M8 8.5h3.1" />
        </IconSvg>
      )
    case 'palette':
      return (
        <IconSvg size={size}>
          <path d="M12 4a8 8 0 0 0-2 15.8c.9.1 1.5-.6 1.5-1.4 0-.5-.2-.9-.2-1.3 0-.8.7-1.5 1.5-1.5h1.5A5.7 5.7 0 0 0 20 9.9C20 6.6 16.4 4 12 4Z" />
          <circle cx="8.5" cy="10" r=".7" fill="currentColor" stroke="none" />
          <circle cx="11.2" cy="8" r=".7" fill="currentColor" stroke="none" />
          <circle cx="14.2" cy="8.4" r=".7" fill="currentColor" stroke="none" />
          <circle cx="16.1" cy="11" r=".7" fill="currentColor" stroke="none" />
        </IconSvg>
      )
    case 'users':
      return (
        <IconSvg size={size}>
          <circle cx="9" cy="8.2" r="2.7" />
          <path d="M4 19c.5-3.2 2.2-5 5-5s4.5 1.8 5 5" />
          <circle cx="16.5" cy="9.2" r="2.1" />
          <path d="M15 14.5c2.8.2 4.4 1.7 5 4.5" />
        </IconSvg>
      )
    case 'user':
      return (
        <IconSvg size={size}>
          <circle cx="12" cy="8.2" r="3" />
          <path d="M6 20c.6-3.8 2.6-5.8 6-5.8s5.4 2 6 5.8" />
        </IconSvg>
      )
    case 'checkCircle':
      return (
        <IconSvg size={size}>
          <circle cx="12" cy="12" r="8" />
          <path d="m8.5 12.1 2.4 2.4 4.8-5" />
        </IconSvg>
      )
    case 'box3d':
      return (
        <IconSvg size={size}>
          <path d="m12 3.6 7 4-7 4-7-4 7-4Z" />
          <path d="M5 7.6v8.8l7 4 7-4V7.6" />
          <path d="M12 11.6v8.8" />
          <path d="m5 16.4 7-4 7 4" />
        </IconSvg>
      )
    case 'clipboard':
      return (
        <IconSvg size={size}>
          <path d="M9 4h6l.7 2H18a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.3L9 4Z" />
          <path d="M8.3 6h7.4" />
          <path d="M8 11h8" />
          <path d="M8 15h5" />
        </IconSvg>
      )
    case 'pencil':
      return (
        <IconSvg size={size}>
          <path d="m5 16.7-.7 3 3-.7L18.5 7.8 16.2 5.5 5 16.7Z" />
          <path d="m14.9 6.8 2.3 2.3" />
          <path d="M12 20h7" />
        </IconSvg>
      )
    case 'send':
      return (
        <IconSvg size={size}>
          <path d="M20.5 3.8 3.8 10.6l7.1 2.6 2.6 7.1 7-16.5Z" />
          <path d="m10.9 13.2 4.2-4.2" />
        </IconSvg>
      )
    case 'resource':
      return (
        <IconSvg size={size}>
          <path d="M5 5.5h14v13H5z" />
          <path d="M8 9h8" />
          <path d="M8 12h8" />
          <path d="M8 15h5" />
        </IconSvg>
      )
    case 'chart':
      return (
        <IconSvg size={size}>
          <path d="M5 19V9" />
          <path d="M12 19V5" />
          <path d="M19 19v-7" />
          <path d="M3.5 19.5h17" />
        </IconSvg>
      )
    default:
      return null
  }
}

function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title: string
  action?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)] ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-[#242424]">{title}</h2>
        {action && (
          <button className="text-xs font-medium text-[#8d96a8] transition hover:text-[#165DFF]" type="button">
            {action} &gt;
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

function MiniPreview({ index, color }: { index: number; color: string }) {
  return (
    <div className="relative h-12 w-[78px] shrink-0 overflow-hidden rounded-[6px] bg-[#f1f6ff]">
      {index === 0 && (
        <>
          <div className="absolute left-4 top-3 h-8 w-px bg-[#b8c7df]" />
          <div className="absolute left-2 top-7 h-px w-16 bg-[#b8c7df]" />
          <div className="absolute left-3 top-6 h-5 w-16 rounded-[50%] border-t-2 border-[#7fb0ff]" />
        </>
      )}
      {index === 1 && (
        <>
          <div className="absolute inset-2 rounded-full bg-[#bcead4]" />
          <div className="absolute left-6 top-3 h-6 w-7 rounded-full bg-[#5fd3a2]" />
          <div className="absolute bottom-3 right-4 h-3 w-3 rounded-full bg-[#2aae7b]" />
        </>
      )}
      {index === 2 && (
        <>
          <div className="absolute bottom-2 left-4 h-8 w-2 rounded-full bg-[#6c7e96]" />
          <div className="absolute bottom-2 right-4 h-8 w-2 rounded-full bg-[#6c7e96]" />
          <div className="absolute left-6 top-2 h-4 w-8 rounded-full border border-[#8796a9]" />
        </>
      )}
      {index === 3 && (
        <>
          <div className="absolute bottom-2 left-3 h-8 w-4 rounded-t-full bg-[#d9c2a3]" />
          <div className="absolute bottom-2 left-8 h-9 w-5 rounded-t-full bg-[#caa678]" />
          <div className="absolute bottom-2 right-3 h-7 w-4 rounded-t-full bg-[#b98e59]" />
        </>
      )}
      <div className="absolute bottom-0 left-0 h-1 w-full" style={{ backgroundColor: color }} />
    </div>
  )
}

function LineChart() {
  const points = '0,92 82,60 164,58 246,78 328,64 410,70 492,42'

  return (
    <div className="relative h-48 min-w-[460px]">
      <div className="absolute inset-x-0 top-4 space-y-8 text-[11px] text-[#8d96a8]">
        {['2,000', '1,500', '1,000', '500', '0'].map((label) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-9">{label}</span>
            <span className="h-px flex-1 border-t border-dashed border-[#e3e7ee]" />
          </div>
        ))}
      </div>
      <svg className="absolute bottom-7 left-12 right-0 h-32 w-[calc(100%-3rem)]" viewBox="0 0 492 128" aria-hidden="true">
        <polyline points={points} fill="none" stroke="#165DFF" strokeLinecap="round" strokeWidth="3" />
        <polygon points={`0,128 ${points} 492,128`} fill="rgba(22,93,255,0.08)" />
        {points.split(' ').map((point) => {
          const [x, y] = point.split(',')
          return <circle key={point} cx={x} cy={y} fill="#165DFF" r="4" stroke="#fff" strokeWidth="2" />
        })}
      </svg>
      <div className="absolute bottom-0 left-12 right-0 grid grid-cols-7 text-center text-[11px] text-[#8d96a8]">
        {['05-06', '05-07', '05-08', '05-09', '05-10', '05-11', '05-12'].map((date) => (
          <span key={date}>{date}</span>
        ))}
      </div>
    </div>
  )
}

function ResourceDonut() {
  return (
    <div className="flex min-h-48 items-center justify-center gap-8">
      <div
        className="relative h-36 w-36 shrink-0 rounded-full"
        style={{
          background: 'conic-gradient(#165DFF 0 42%, #5b8ef9 42% 70%, #f7bd37 70% 86%, #40c8bc 86% 96%, #a8b5c9 96% 100%)',
        }}
      >
        <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-white">
          <strong className="text-2xl font-semibold text-[#242424]">2,341</strong>
          <span className="text-xs text-[#8d96a8]">总资源数</span>
        </div>
      </div>
      <div className="space-y-3">
        {resourceTypes.map((item) => (
          <div key={item.name} className="flex min-w-36 items-center justify-between gap-5 text-sm">
            <span className="flex items-center gap-2 text-[#596273]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-medium text-[#596273]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomeDashboard() {
  return (
    <div className="space-y-4">
      <section className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.55fr] lg:items-start">
          <div className="border-[#e5e9f0] lg:border-r lg:pr-6">
            <h1 className="text-[26px] font-bold leading-tight text-[#242424]">首页工作台</h1>
            <p className="mt-3 text-sm leading-6 text-[#7c8492]">
              统一管理跨学科的 3D 可视化学习资源与教学数据，助力教与学更高效。
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold text-[#242424]">学科快速入口</h2>
            <div className="grid grid-cols-5 gap-2 xl:grid-cols-10">
              {subjects.map((subject) => (
                <Link
                  key={subject.name}
                  to={subject.path}
                  className="flex h-[76px] min-w-0 flex-col items-center justify-center rounded-[6px] border border-[#e6ebf2] bg-white text-center transition hover:border-[#165DFF] hover:shadow-[0_8px_18px_rgba(22,93,255,0.12)]"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-[8px]"
                    style={{ backgroundColor: subject.soft, color: subject.color }}
                  >
                    <DashboardIcon name={subject.icon} size={23} />
                  </span>
                  <span className="mt-1.5 text-[12px] font-semibold leading-none text-[#333b4a]">{subject.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => (
            <div key={stat.label} className="flex min-h-[78px] items-center gap-3 rounded-[8px] border border-[#e6ebf2] bg-white px-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px]"
                style={{ backgroundColor: stat.soft, color: stat.color }}
                aria-hidden="true"
              >
                <DashboardIcon name={stat.icon} size={25} />
              </span>
              <div className="min-w-0">
                <div className="text-2xl font-semibold leading-tight text-[#242424]">{stat.value}</div>
                <div className="text-xs text-[#7c8492]">{stat.label}</div>
                {stat.note && <div className="mt-1 text-xs font-medium text-[#1aa36f]">{stat.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <Panel title="最近学习内容" action="查看更多">
          <div className="divide-y divide-[#eef1f5]">
            {recentLearning.map((item, index) => (
              <div key={item.title} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                <MiniPreview color={item.color} index={index} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-[6px] px-2 py-0.5 text-[11px] font-semibold text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.subject}
                    </span>
                    <h3 className="truncate text-sm font-semibold text-[#242424]">{item.title}</h3>
                  </div>
                  <p className="mt-1 text-xs text-[#8d96a8]">{item.progress}</p>
                </div>
                <time className="shrink-0 text-xs text-[#8d96a8]">{item.time}</time>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="待办事项" action="查看全部">
          <div className="divide-y divide-[#eef1f5]">
            {todoItems.map((item) => (
              <div key={item.title} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
                  style={{ backgroundColor: item.soft, color: item.color }}
                  aria-hidden="true"
                >
                  <DashboardIcon name={item.icon} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-[#242424]">{item.title}</h3>
                  <p className="mt-1 truncate text-xs text-[#8d96a8]">{item.meta}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#f4f7fb] px-2.5 py-1 text-xs font-semibold text-[#3277f6]">
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="热门学科排行" action="本周学习热度">
          <div className="space-y-4">
            {rankings.map((item, index) => (
              <div key={item.name} className="grid grid-cols-[1.6rem_5rem_1fr_3rem] items-center gap-3">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                    index < 3 ? 'bg-[#f5bd32] text-white' : 'text-[#596273]'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-[#333b4a]">{item.name}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-[#e5e8ee]">
                  <span className="block h-full rounded-full bg-[#165DFF]" style={{ width: `${item.ratio * 100}%` }} />
                </span>
                <span className="text-right text-sm text-[#596273]">{item.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_0.9fr]">
        <Panel title="平台数据概览">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <div className="overflow-x-auto">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#333b4a]">学习人数趋势（近7天）</h3>
                <span className="flex items-center gap-2 text-xs text-[#596273]">
                  <span className="h-2 w-2 rounded-full bg-[#165DFF]" />
                  学习人数
                </span>
              </div>
              <LineChart />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-[#333b4a]">资源类型分布</h3>
              <ResourceDonut />
            </div>
          </div>
        </Panel>

        <Panel title="快捷操作">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {quickActions.map((action) => (
              <button
                key={action.title}
                className="flex min-h-20 items-center gap-3 rounded-[8px] border border-[#e6ebf2] bg-white p-4 text-left transition hover:border-[#165DFF] hover:shadow-[0_10px_24px_rgba(22,93,255,0.12)]"
                type="button"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px]"
                  style={{ backgroundColor: action.soft, color: action.color }}
                  aria-hidden="true"
                >
                  <DashboardIcon name={action.icon} size={23} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#242424]">{action.title}</span>
                  <span className="mt-1 block text-xs text-[#8d96a8]">{action.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
