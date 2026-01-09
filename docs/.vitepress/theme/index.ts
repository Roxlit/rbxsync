import DefaultTheme from 'vitepress/theme'
import CustomNav from './CustomNav.vue'
import './style.css'
import { h } from 'vue'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(CustomNav)
    })
  },
  enhanceApp({ app, router }) {
    if (typeof window !== 'undefined') {
      const setupLogoLink = () => {
        const logo = document.querySelector('.VPNavBarTitle')
        if (logo) {
          logo.style.cursor = 'pointer'
          logo.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            window.location.href = 'https://rbxsync.dev'
          })
        }
      }

      // Custom copy behavior for code blocks
      const setupSmartCopy = () => {
        document.querySelectorAll('.vp-code-group, div[class*="language-"]').forEach(block => {
          const copyBtn = block.querySelector('button.copy')
          if (copyBtn && !copyBtn.dataset.smartCopy) {
            copyBtn.dataset.smartCopy = 'true'

            copyBtn.addEventListener('click', (e) => {
              e.preventDefault()
              e.stopPropagation()

              const code = block.querySelector('code')
              if (!code) return

              const rawText = code.textContent || ''

              // Process: remove comments and join with &&
              const lines = rawText.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'))

              // Join commands with && if multiple lines
              const processed = lines.length > 1
                ? lines.join(' && ')
                : lines.join('')

              navigator.clipboard.writeText(processed).then(() => {
                copyBtn.classList.add('copied')
                setTimeout(() => copyBtn.classList.remove('copied'), 2000)
              })
            }, true)
          }
        })
      }

      // Run on initial load and observe for new code blocks
      setTimeout(setupLogoLink, 100)
      setTimeout(setupSmartCopy, 500)

      // Re-run on route change
      const observer = new MutationObserver(() => {
        setTimeout(setupSmartCopy, 100)
      })
      observer.observe(document.body, { childList: true, subtree: true })

      // Fetch GitHub stars
      fetch('https://api.github.com/repos/devmarissa/rbxsync')
        .then(res => res.json())
        .then(data => {
          const updateStars = () => {
            const starCount = document.querySelector('.star-count')
            if (starCount && data.stargazers_count !== undefined) {
              starCount.textContent = data.stargazers_count
            }
          }
          updateStars()
          setTimeout(updateStars, 500)
        })
        .catch(() => {})
    }
  }
}
