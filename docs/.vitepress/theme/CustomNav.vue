<script setup>
import { useData } from 'vitepress'
import { onMounted, onUnmounted, ref } from 'vue'

const { isDark } = useData()
const isMac = ref(true)

function toggleTheme() {
  isDark.value = !isDark.value
}

function openSearch() {
  // Try to click VitePress's hidden search button first
  const vpSearchBtn = document.querySelector('.VPNavBarSearch button') ||
                      document.querySelector('#local-search button') ||
                      document.querySelector('[aria-label*="Search"]')

  if (vpSearchBtn) {
    vpSearchBtn.click()
    return
  }

  // Fallback: trigger VitePress's local search by simulating Cmd/Ctrl+K
  const event = new KeyboardEvent('keydown', {
    key: 'k',
    code: 'KeyK',
    metaKey: isMac.value,
    ctrlKey: !isMac.value,
    bubbles: true
  })
  document.dispatchEvent(event)
}

function handleKeydown(e) {
  // Also handle keyboard shortcut from our component
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    openSearch()
  }
}

onMounted(() => {
  isMac.value = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="custom-nav-buttons">
    <!-- Custom Search Bar (matches website) -->
    <button class="custom-search" @click="openSearch" aria-label="Search docs">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
      <span class="search-placeholder">Search docs...</span>
      <span class="search-kbd">{{ isMac ? '⌘' : 'Ctrl' }}K</span>
    </button>

    <!-- Theme Toggle -->
    <button class="theme-toggle" @click="toggleTheme" aria-label="Toggle theme">
      <svg v-if="isDark" class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
      <svg v-else class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    </button>

    <!-- Discord Button - Icon only -->
    <a href="https://discord.gg/dURVrFVAEs" class="discord-btn" target="_blank" title="Join Discord">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    </a>

    <!-- GitHub Button -->
    <a href="https://github.com/devmarissa/rbxsync" class="github-btn" target="_blank">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
      <span class="github-stars">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
        </svg>
        <span class="star-count">-</span>
      </span>
    </a>
  </div>
</template>

<style scoped>
.custom-nav-buttons {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: 1rem;
}

/* Custom Search Bar - matches website exactly */
.custom-search {
  position: relative;
  display: flex;
  align-items: center;
  background: #0f0f12;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0 0.75rem;
  padding-left: 2.25rem;
  padding-right: 3rem;
  height: 34px;
  min-width: 180px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  box-sizing: border-box;
}

.custom-search:hover {
  border-color: rgba(255, 255, 255, 0.15);
  background: #18181b;
}

.custom-search:focus {
  outline: none;
  border-color: #c23c40;
  background: #09090b;
}

.custom-search .search-icon {
  position: absolute;
  left: 0.75rem;
  color: #71717a;
  pointer-events: none;
  flex-shrink: 0;
}

.custom-search .search-placeholder {
  color: #71717a;
  font-size: 0.8rem;
  text-align: left;
}

.custom-search .search-kbd {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: #18181b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 11px;
  font-weight: 400;
  line-height: 1;
  font-family: 'SF Mono', SFMono-Regular, ui-monospace, monospace;
  color: #71717a;
}

/* Light mode search */
:root:not(.dark) .custom-search {
  background: #f8f9fa;
  border-color: #e2e8f0;
}

:root:not(.dark) .custom-search:hover {
  background: #e9ecef;
  border-color: #cbd5e0;
}

:root:not(.dark) .custom-search:focus {
  border-color: #c23c40;
  background: #ffffff;
}

:root:not(.dark) .custom-search .search-icon {
  color: #718096;
}

:root:not(.dark) .custom-search .search-placeholder {
  color: #718096;
}

:root:not(.dark) .custom-search .search-kbd {
  background: #e2e8f0;
  border-color: #cbd5e0;
  color: #718096;
}

.theme-toggle {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 0.5rem;
  height: 34px;
  width: 34px;
  cursor: pointer;
  color: var(--vp-c-text-2);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

/* Light mode specific styling */
:root:not(.dark) .theme-toggle {
  background: #f8f9fa;
  border-color: #e2e8f0;
  color: #4a5568;
}

:root:not(.dark) .theme-toggle:hover {
  background: #e9ecef;
  color: #1a1a2e;
  border-color: #cbd5e0;
}

/* Dark mode specific styling */
.dark .theme-toggle {
  background: #0f0f12;
  border-color: rgba(255, 255, 255, 0.08);
  color: #a1a1aa;
}

.dark .theme-toggle:hover {
  background: #18181b;
  color: #fafafa;
  border-color: rgba(255, 255, 255, 0.15);
}

.theme-toggle svg {
  width: 18px;
  height: 18px;
}

.discord-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  text-decoration: none;
  color: white;
  background: #5865F2;
  transition: all 0.2s;
}

.discord-btn:hover {
  transform: translateY(-1px);
  background: #4752c4;
  box-shadow: 0 4px 12px rgba(88, 101, 242, 0.4);
}

.discord-btn svg {
  width: 18px;
  height: 18px;
}

.github-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  height: 34px;
  text-decoration: none;
  color: var(--vp-c-text-1);
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
  box-sizing: border-box;
}

/* Light mode GitHub button */
:root:not(.dark) .github-btn {
  background: #f8f9fa;
  border-color: #e2e8f0;
  color: #1a1a2e;
}

:root:not(.dark) .github-btn:hover {
  background: #e9ecef;
  border-color: #cbd5e0;
  transform: translateY(-1px);
}

/* Dark mode GitHub button */
.dark .github-btn {
  background: #0f0f12;
  border-color: rgba(255, 255, 255, 0.08);
  color: #fafafa;
}

.dark .github-btn:hover {
  background: #18181b;
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.github-btn > svg {
  width: 18px;
  height: 18px;
}

.github-stars {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding-left: 0.5rem;
  border-left: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

.github-stars svg {
  width: 14px;
  height: 14px;
  color: #f0c14b;
}

/* Responsive - hide search bar width, keep icon on mobile */
@media (max-width: 768px) {
  .custom-search {
    min-width: auto;
    width: 34px;
    padding: 0;
    justify-content: center;
  }

  .custom-search .search-icon {
    position: static;
  }

  .custom-search .search-placeholder,
  .custom-search .search-kbd {
    display: none;
  }
}
</style>
