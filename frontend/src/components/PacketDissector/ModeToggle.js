import { React, createContext, useContext, useState } from "react";

function SunIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path d="M12.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
      <path
        strokeLinecap="round"
        d="M10 5.5v-1M13.182 6.818l.707-.707M14.5 10h1M13.182 13.182l.707.707M10 15.5v-1M6.11 13.889l.708-.707M4.5 10h1M6.11 6.111l.708.707"
      />
    </svg>
  )
}

function MoonIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path d="M15.224 11.724a5.5 5.5 0 0 1-6.949-6.949 5.5 5.5 0 1 0 6.949 6.949Z" />
    </svg>
  )
}

export function useDarkMode(initialValue = false) {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem("isDarkMode");
      return item ? item === 'true' : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setDarkMode = (value) => {
    try {
      setDark(value);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("isDarkMode", value);
      }
    } catch (error) {

    }
  };

  return [dark, setDarkMode];
}

export const DarkModeContext = createContext({
  darkMode: false,
  setDarkMode: (dark) => {}
})

export function DarkModeProvider({ children }) {
  const [ darkMode, setDarkMode ] = useDarkMode(false)
  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export function ModeToggle() {
  const { setDarkMode } = useContext(DarkModeContext)

  function disableTransitionsTemporarily() {
    document.documentElement.classList.add('[&_*]:!transition-none')
    window.setTimeout(() => {
      document.documentElement.classList.remove('[&_*]:!transition-none')
    }, 0)
  }

  function toggleMode() {
    disableTransitionsTemporarily()

    let darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    let isSystemDarkMode = darkModeMediaQuery.matches
    let isDarkMode = document.documentElement.classList.toggle('dark')

    if (isDarkMode === isSystemDarkMode) {
      // delete window.localStorage.isDarkMode
      setDarkMode(false)
    } else {
      setDarkMode(isDarkMode)
      // window.localStorage.isDarkMode = isDarkMode
    }
  }

  return (
    <button
      type="button"
      className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/5 dark:hover:bg-white/5"
      aria-label="Toggle dark mode"
      onClick={toggleMode}
    >
      <SunIcon className="h-5 w-5 stroke-zinc-900 dark:hidden" />
      <MoonIcon className="hidden h-5 w-5 stroke-white dark:block" />
    </button>
  )
}
