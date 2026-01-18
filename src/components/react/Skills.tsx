import { getIcon } from './SkillsIconLoader'

type FocusSkill = {
  text: string
  logo: string
  badgeClassName: string
  iconClassName: string
}

const focusSkills: FocusSkill[] = [
  {
    text: 'Linux',
    logo: 'simple-icons:linux',
    badgeClassName:
      '-rotate-2 translate-y-1 border-emerald-500/25 text-emerald-800 dark:text-emerald-200',
    iconClassName: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
  },
  {
    text: 'Kubernetes',
    logo: 'simple-icons:kubernetes',
    badgeClassName:
      'rotate-1 -translate-y-1 border-sky-500/25 text-sky-800 dark:text-sky-200',
    iconClassName: 'bg-sky-500/10 text-sky-700 dark:text-sky-200',
  },
  {
    text: 'Terraform',
    logo: 'simple-icons:terraform',
    badgeClassName:
      '-rotate-1 translate-y-2 border-indigo-500/25 text-indigo-800 dark:text-indigo-200',
    iconClassName: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-200',
  },
  {
    text: 'Cloudflare',
    logo: 'simple-icons:cloudflare',
    badgeClassName:
      'rotate-2 translate-y-0 border-orange-500/25 text-orange-800 dark:text-orange-200',
    iconClassName: 'bg-orange-500/10 text-orange-700 dark:text-orange-200',
  },
  {
    text: 'Automation',
    logo: 'lucide:sparkles',
    badgeClassName:
      '-rotate-3 -translate-y-2 border-rose-500/25 text-rose-800 dark:text-rose-200',
    iconClassName: 'bg-rose-500/10 text-rose-700 dark:text-rose-200',
  },
]

const Skills: React.FC = () => {
  return (
    <div className="z-30 mt-10 flex w-full flex-col">
      <div className="relative mx-auto w-full max-w-xl">
        <div className="bg-primary/10 absolute -top-4 -left-6 h-16 w-16 rounded-full blur-2xl" />
        <div className="bg-decorative/20 absolute -right-8 bottom-0 h-20 w-20 rounded-full blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-3 md:gap-4">
          {focusSkills.map((skill) => {
            const IconComponent = getIcon(skill.logo)
            return (
              <div
                key={skill.text}
                className={`flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm font-medium shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:rotate-1 ${skill.badgeClassName}`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-sm ${skill.iconClassName}`}
                >
                  <IconComponent className="size-4" />
                </span>
                <span>{skill.text}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Skills
