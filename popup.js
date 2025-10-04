document.addEventListener("DOMContentLoaded", () => {
  const showCountToggle = document.getElementById("showCount");
  const saveButton = document.getElementById("save");
  const currentLanguageDisplay = document.getElementById("currentLanguage");

  // Get browser language
  const browserLang = chrome.i18n.getUILanguage();

  // Map browser language to supported languages
  const languageNames = {
    'en': 'English',
    'ko': '한국어',
    'ja': '日本語',
    'zh': '简体中文',
    'zh_CN': '简体中文',
    'zh_TW': '繁體中文',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'ru': 'Русский',
    'vi': 'Tiếng Việt',
    'th': 'ไทย',
    'id': 'Bahasa Indonesia',
    'nl': 'Nederlands',
    'pl': 'Polski',
    'tr': 'Türkçe'
  };

  // Detect language from browser
  let detectedLang = browserLang.split('-')[0]; // Get base language (e.g., 'en' from 'en-US')
  if (browserLang === 'zh-TW' || browserLang === 'zh-HK') {
    detectedLang = 'zh_TW';
  } else if (browserLang.startsWith('zh')) {
    detectedLang = 'zh';
  }

  // Fallback to English if not supported
  if (!languageNames[detectedLang]) {
    detectedLang = 'en';
  }

  // Apply translations
  function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (translations[detectedLang] && translations[detectedLang][key]) {
        element.textContent = translations[detectedLang][key];
      }
    });
  }

  applyTranslations();
  currentLanguageDisplay.textContent = languageNames[detectedLang] || 'English';

  // Load saved settings
  chrome.storage.sync.get(["showCount"], (result) => {
    const showCount = result.showCount !== undefined ? result.showCount : true;

    if (showCount) {
      showCountToggle.classList.add("active");
    }
  });

  // Toggle show count
  showCountToggle.addEventListener("click", () => {
    showCountToggle.classList.toggle("active");
  });

  // Save settings
  saveButton.addEventListener("click", () => {
    const savedText = translations[detectedLang]?.saved || "Saved!";
    const showCountValue = showCountToggle.classList.contains("active");

    chrome.storage.sync.set(
      {
        showCount: showCountValue,
      },
      () => {
        // 저장 완료 표시
        saveButton.textContent = "✓ " + savedText;
        saveButton.classList.add("saved");

        // Content script에 즉시 업데이트 메시지 전송
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: "UPDATE_SETTINGS",
              showCount: showCountValue,
            });
          }
        });

        setTimeout(() => {
          window.close();
        }, 800);
      }
    );
  });
});
