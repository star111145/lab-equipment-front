// 主题样式配置
const themeStyles = {
  light: {
    '--header-bg': '#fff',
    '--header-text': '#303133',
    '--header-shadow': 'rgba(0, 0, 0, 0.1)',
    '--body-bg': '#f0f2f5',
    '--sidebar-bg': '#f5f7fa',
    '--sidebar-text': '#606266',
    '--sidebar-active': '#409eff',
    '--sidebar-border': '#e4e7ed',
    '--main-bg': '#ffffff',
    '--main-border': '#d9d9d9'
  },
  'apple-red': {
    '--header-bg': '#fff5f5',
    '--header-text': '#722ed1',
    '--header-shadow': 'rgba(114, 46, 209, 0.15)',
    '--body-bg': '#fff0f0',
    '--sidebar-bg': '#fffaf5',
    '--sidebar-text': '#722ed1',
    '--sidebar-active': '#eb2f96',
    '--sidebar-border': '#ffe4e1',
    '--main-bg': '#fff0f0',
    '--main-border': '#ffadd6'
  },
  'crystal-lan': {
    '--header-bg': '#f0f5ff',
    '--header-text': '#165dff',
    '--header-shadow': 'rgba(22, 93, 255, 0.15)',
    '--body-bg': '#e6f7ff',
    '--sidebar-bg': '#f0f5ff',
    '--sidebar-text': '#165dff',
    '--sidebar-active': '#531dab',
    '--sidebar-border': '#bae7ff',
    '--main-bg': '#e6f7ff',
    '--main-border': '#91d5ff'
  },
  dark: {
    '--header-bg': '#1a1a2e',
    '--header-text': '#fff',
    '--header-shadow': 'rgba(0, 0, 0, 0.3)',
    '--body-bg': '#0f0f1a',
    '--sidebar-bg': '#161625',
    '--sidebar-text': '#909399',
    '--sidebar-active': '#409eff',
    '--sidebar-border': '#2c2c3a',
    '--main-bg': '#1f1f2e',
    '--main-border': '#434343'
  },
  'forest-green': {
    '--header-bg': '#f0fff4',
    '--header-text': '#008453',
    '--header-shadow': 'rgba(0, 132, 83, 0.15)',
    '--body-bg': '#e6fffa',
    '--sidebar-bg': '#f0fff4',
    '--sidebar-text': '#008453',
    '--sidebar-active': '#38a169',
    '--sidebar-border': '#c6f6d5',
    '--main-bg': '#e6fffa',
    '--main-border': '#9ae6b4'
  },
  'golden-sunset': {
    '--header-bg': '#fff7ed',
    '--header-text': '#c2410c',
    '--header-shadow': 'rgba(194, 65, 12, 0.15)',
    '--body-bg': '#fff1e5',
    '--sidebar-bg': '#fff7ed',
    '--sidebar-text': '#c2410c',
    '--sidebar-active': '#ea580c',
    '--sidebar-border': '#ffedd5',
    '--main-bg': '#fff1e5',
    '--main-border': '#fdba74'
  }
}

export const themeNames = {
  light: '浅色',
  'apple-red': '苹果红',
  'crystal-lan': '水晶兰',
  dark: '深色',
  'forest-green': '森林绿',
  'golden-sunset': '金色夕阳'
}

export const applyThemeToRoot = (theme) => {
  const root = document.documentElement
  const styles = themeStyles[theme] || themeStyles.light
  Object.keys(styles).forEach(key => {
    root.style.setProperty(key, styles[key])
  })
}

export const getThemeName = (theme) => {
  return themeNames[theme] || themeNames.light
}

export const saveTheme = (theme) => {
  localStorage.setItem('theme', theme)
}

export const loadTheme = () => {
  return localStorage.getItem('theme') || 'light'
}
