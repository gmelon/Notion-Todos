class NotionTodoExtension {
  constructor() {
    this.currentLanguage = "en";
    this.init();
  }

  async init() {
    try {
      // Detect browser language
      this.currentLanguage = this.detectBrowserLanguage();

      // Load saved settings
      const result = await chrome.storage.sync.get(["showCount"]);
      this.showCount = result.showCount !== undefined ? result.showCount : true;

      this.injectStyles();
      this.waitForHeader().then(() => {
        this.createButton();
      });

      // storage 변경 감지
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === "sync" && changes.showCount !== undefined) {
          this.showCount = changes.showCount.newValue;
          this.updateUI();
        }
      });

      // 메시지 리스너 (즉시 업데이트용)
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "UPDATE_SETTINGS") {
          if (message.showCount !== undefined) {
            this.showCount = message.showCount;
            this.updateUI();
          }
        }
      });
    } catch (error) {
      console.error("Failed to initialize NotionTodoExtension:", error);
    }
  }

  detectBrowserLanguage() {
    // Get browser language from Chrome API
    const browserLang = chrome.i18n.getUILanguage();

    // Map browser language to supported languages
    let detectedLang = browserLang.split('-')[0]; // Get base language (e.g., 'en' from 'en-US')

    // Special handling for Chinese variants
    if (browserLang === 'zh-TW' || browserLang === 'zh-HK') {
      detectedLang = 'zh_TW';
    } else if (browserLang.startsWith('zh')) {
      detectedLang = 'zh';
    }

    // List of supported languages
    const supportedLanguages = ['en', 'ko', 'ja', 'zh', 'zh_TW', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'vi', 'th', 'id', 'nl', 'pl', 'tr'];

    // Fallback to English if not supported
    if (!supportedLanguages.includes(detectedLang)) {
      detectedLang = 'en';
    }

    return detectedLang;
  }

  getTranslation(key) {
    try {
      return translations[this.currentLanguage][key] || translations["en"][key];
    } catch (error) {
      console.error("Translation error:", error);
      return translations["en"][key];
    }
  }

  updateUI() {
    try {
      this.updateButtonText();

      const modal = document.querySelector(".notion-todo-ext-modal");
      if (modal) {
        const todos = this.getTodos();
        const completedCount = todos.filter(todo => todo.checked).length;
        const totalCount = todos.length;

        const header = modal.querySelector(".notion-todo-ext-modal-header");
        if (header) {
          if (this.showCount && totalCount > 0) {
            header.textContent = `${this.getTranslation("todoList")} (${completedCount} / ${totalCount})`;
          } else {
            header.textContent = this.getTranslation("todoList");
          }
        }

        const emptyState = modal.querySelector(".notion-todo-ext-empty");
        if (emptyState) {
          emptyState.textContent = this.getTranslation("noTodos");
        }
      }
    } catch (error) {
      console.error("UI update error:", error);
    }
  }

  updateButtonText() {
    const button = document.querySelector(".notion-todo-ext-button");
    if (button) {
      const todos = this.getTodos();
      const completedCount = todos.filter(todo => todo.checked).length;
      const totalCount = todos.length;

      if (this.showCount && totalCount > 0) {
        button.textContent = `${this.getTranslation("todoList")} (${completedCount} / ${totalCount})`;
      } else {
        button.textContent = this.getTranslation("todoList");
      }
    }
  }

  injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .notion-todo-ext-button {
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol";
        -webkit-font-smoothing: auto;
        outline: 0;
        box-sizing: border-box;
        user-select: none;
        transition: background 20ms ease-in;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 28px;
        padding: 0 8px;
        border-radius: 4px;
        white-space: nowrap;
        font-size: 14px;
        flex-shrink: 0;
        line-height: 1.2;
        min-width: 0px;
        color: rgb(55, 53, 47);
        margin: 0 2px 0 4px;
        border: none;
        background: transparent;
      }

      .notion-todo-ext-button:hover {
        background: rgba(55, 53, 47, 0.08);
      }

      .notion-todo-ext-modal {
        position: absolute;
        z-index: 999;
        background: white;
        border-radius: 8px;
        box-shadow: rgb(15 15 15 / 3%) 0px 0px 0px 1px, rgb(15 15 15 / 8%) 0px 3px 6px, rgb(15 15 15 / 15%) 0px 9px 24px;
        width: 450px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        max-height: 300px;
        opacity: 0;
        transform: scale(0.95);
        transition: opacity 120ms ease-in, transform 120ms ease-in;
        color: rgb(55, 53, 47);
        fill: currentcolor;
        line-height: 1.5;
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol";
        -webkit-font-smoothing: auto;
        -webkit-text-size-adjust: 100%;
        pointer-events: auto;
        outline: 0;
        box-sizing: border-box;
        isolation: isolate;
        height: 100%;
        padding-top: 0px !important;
        --safe-area-inset-top: env(safe-area-inset-top,0px);
        --safe-area-inset-right: env(safe-area-inset-right,0px);
        --safe-area-inset-left: env(safe-area-inset-left,0px);
        --safe-area-inset-bottom: env(safe-area-inset-bottom,0px);
      }

      .notion-todo-ext-modal * {
        box-sizing: border-box;
        font-family: inherit;
        line-height: inherit;
        color: inherit;
      }

      .notion-todo-ext-modal-header {
        padding: 12px 16px;
        font-weight: 600;
        font-size: 14px;
        color: rgb(55, 53, 47);
        border-bottom: 1px solid rgba(55, 53, 47, 0.09);
        width: 100%;
        box-sizing: border-box;
        margin-bottom: 0;
      }

      .notion-todo-ext-modal-body {
        padding: 8px 0;
        overflow-y: auto;
        max-height: 260px;
        width: 100%;
      }

      .notion-todo-ext-item {
        display: flex;
        align-items: center;
        padding: 5px 20px;
        gap: 8px;
        cursor: default;
        width: 100%;
        box-sizing: border-box;
        min-width: 0;
      }

      .notion-todo-ext-item:hover {
        background: rgba(55, 53, 47, 0.04);
      }

      .notion-todo-ext-item input[type="checkbox"] {
        width: 16px;
        height: 16px;
        border: 1px solid rgba(55, 53, 47, 0.35);
        border-radius: 2px;
        cursor: default;
        margin: 0;
        appearance: none;
        background: white;
        position: relative;
        flex-shrink: 0;
      }

      .notion-todo-ext-item input[type="checkbox"]:checked {
        background: rgb(46, 120, 210);
        border-color: rgb(46, 120, 210);
      }

      .notion-todo-ext-item input[type="checkbox"]:checked::after {
        content: "";
        position: absolute;
        left: 3.5px;
        top: 0.5px;
        width: 5px;
        height: 8px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }

      .notion-todo-ext-item input[type="checkbox"]:checked + span {
        text-decoration: line-through;
        color: rgba(55, 53, 47, 0.65);
      }

      .notion-todo-ext-item span {
        font-size: 14px;
        color: rgb(55, 53, 47);
        line-height: 20px;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
      }

      .notion-todo-ext-empty {
        padding: 12px;
        text-align: center;
        color: rgba(55, 53, 47, 0.5);
        font-size: 14px;
      }

      .notion-todo-ext-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 14px;
        border-top: 1px solid rgba(55, 53, 47, 0.09);
        margin-top: auto;
      }

      .notion-todo-ext-footer-left {
        color: rgba(55, 53, 47, 0.65);
        font-size: 12px;
      }

      .notion-todo-ext-footer-right {
        color: rgb(46, 170, 220);
        font-size: 14px;
        cursor: pointer;
      }

      .notion-todo-ext-footer-right:hover {
        opacity: 0.8;
      }

      @keyframes highlight {
        0% {
          background-color: rgba(46, 170, 220, 0.2);
        }
        100% {
          background-color: transparent;
        }
      }

      .notion-todo-highlight {
        animation: highlight 1.5s ease-out;
      }

      .notion-todo-highlight > div:first-child {
        background-color: rgba(46, 170, 220, 0.2) !important;
        transition: background-color 1.5s ease-out;
      }
    `;
    document.head.appendChild(style);
  }

  waitForHeader() {
    return new Promise((resolve) => {
      const checkHeader = () => {
        const header = document.querySelector(".notion-topbar-action-buttons");
        if (header) {
          resolve();
        } else {
          setTimeout(checkHeader, 500);
        }
      };
      checkHeader();
    });
  }

  createButton() {
    const button = document.createElement("button");
    button.className = "notion-todo-ext-button";

    const header = document.querySelector(".notion-topbar-share-menu");
    if (header) {
      header.parentElement.insertBefore(button, header);
      button.addEventListener("click", () => this.showModal());
      this.updateButtonText();
      this.observeTodoChanges();
    }
  }

  observeTodoChanges() {
    let debounceTimer;

    // 페이지의 체크박스 변경 감지
    const observer = new MutationObserver(() => {
      // 디바운싱: 100ms 내 여러 변경사항을 한 번에 처리
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.updateButtonText();
      }, 100);
    });

    // 노션 페이지 전체를 관찰
    const targetNode = document.querySelector('.notion-frame') || document.body;
    observer.observe(targetNode, {
      attributes: true,
      attributeFilter: ['class', 'checked'],
      childList: true,      // DOM 노드 추가/제거 감지
      subtree: true,        // 모든 하위 요소 감지
      characterData: true   // 텍스트 변경 감지
    });
  }

  getTodos() {
    const todos = [];

    const processTodoBlock = (element, depth = 0) => {
      const checkbox = element.querySelector('input[type="checkbox"]');
      const textElement = element.querySelector(
        '[data-content-editable-leaf="true"]'
      );

      if (checkbox && textElement) {
        todos.push({
          text: textElement.textContent.trim(),
          checked: checkbox.checked,
          depth,
          element: element,
        });
      }

      // 하위 todo 블록 찾기
      const childTodos = element.querySelectorAll(".notion-to_do-block");
      childTodos.forEach((child) => {
        // 직계 자식인 경우에만 처리
        if (child.parentElement.closest(".notion-to_do-block") === element) {
          processTodoBlock(child, depth + 1);
        }
      });
    };

    // 최상위 todo 블록 찾기
    const topLevelTodos = Array.from(
      document.querySelectorAll(".notion-to_do-block")
    ).filter((block) => {
      // 다른 todo 블록 내부에 없는 것만 선택
      return !block.parentElement.closest(".notion-to_do-block");
    });

    topLevelTodos.forEach((todoBlock) => {
      processTodoBlock(todoBlock);
    });

    return todos;
  }

  showModal() {
    const existingModal = document.querySelector(".notion-todo-ext-modal");
    if (existingModal) {
      existingModal.style.opacity = "0";
      existingModal.style.transform = "scale(0.95)";
      this.updateButtonText();
      setTimeout(() => existingModal.remove(), 120);
      return;
    }

    const todos = this.getTodos();
    const button = document.querySelector(".notion-todo-ext-button");
    const buttonRect = button.getBoundingClientRect();

    const modal = document.createElement("div");
    modal.className = "notion-todo-ext-modal";

    const updatePosition = () => {
      const currentButtonRect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const modalWidth = 450;
      let leftPosition = Math.max(
        10,
        Math.min(currentButtonRect.left, viewportWidth - modalWidth - 10)
      );

      modal.style.top = `${currentButtonRect.bottom + 6}px`;
      modal.style.left = `${leftPosition}px`;
    };

    updatePosition();

    const completedCount = todos.filter(todo => todo.checked).length;
    const totalCount = todos.length;

    const headerText = this.showCount && totalCount > 0
      ? `${this.getTranslation("todoList")} (${completedCount} / ${totalCount})`
      : this.getTranslation("todoList");

    modal.innerHTML = `
      <div class="notion-todo-ext-modal-header">
        ${headerText}
      </div>
      <div class="notion-todo-ext-modal-body">
        ${
          todos.length
            ? todos
                .map(
                  (todo, index) => `
          <div class="notion-todo-ext-item" style="padding-left: ${
            todo.depth * 24 + 14
          }px" data-index="${index}">
            <input type="checkbox" ${todo.checked ? "checked" : ""}>
            <span>${todo.text}</span>
          </div>
        `
                )
                .join("")
            : `<div class="notion-todo-ext-empty">${this.getTranslation(
                "noTodos"
              )}</div>`
        }
      </div>
    `;

    document.body.appendChild(modal);

    // Trigger animation
    requestAnimationFrame(() => {
      modal.style.opacity = "1";
      modal.style.transform = "scale(1)";
    });

    // 각 항목에 클릭 이벤트 추가
    modal.querySelectorAll(".notion-todo-ext-item").forEach((item) => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      const index = parseInt(item.dataset.index);
      const todo = todos[index];

      // 체크박스 클릭 이벤트
      checkbox.addEventListener("change", (e) => {
        e.stopPropagation();
        if (todo && todo.element) {
          const notionCheckbox = todo.element.querySelector(
            'input[type="checkbox"]'
          );
          if (notionCheckbox) {
            notionCheckbox.checked = checkbox.checked;
            // 노션의 체크박스 상태 변경을 트리거
            const clickEvent = new MouseEvent("click", {
              bubbles: true,
              cancelable: true,
              view: window,
            });
            notionCheckbox.dispatchEvent(clickEvent);

            // 노션의 체크박스 컨테이너에 active 클래스 토글
            const checkboxContainer = notionCheckbox.closest(".pseudoHover");
            if (checkboxContainer) {
              if (checkbox.checked) {
                checkboxContainer.classList.add("pseudoActive");
              } else {
                checkboxContainer.classList.remove("pseudoActive");
              }
            }

            // 모달 헤더 카운트 업데이트
            const allCheckboxes = modal.querySelectorAll('.notion-todo-ext-item input[type="checkbox"]');
            const completedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
            const totalCount = allCheckboxes.length;
            const header = modal.querySelector('.notion-todo-ext-modal-header');
            if (header) {
              header.textContent = `${this.getTranslation("todoList")} ${totalCount > 0 ? `(${completedCount} / ${totalCount})` : ''}`;
            }

            // 버튼 텍스트 업데이트
            setTimeout(() => this.updateButtonText(), 100);
          }
        }
      });

      // 항목 클릭 이벤트 (체크박스 클릭은 제외)
      item.style.cursor = "pointer";
      item.addEventListener("click", (e) => {
        // 체크박스 클릭이 아닌 경우에만 스크롤
        if (!e.target.matches('input[type="checkbox"]')) {
          if (todo && todo.element) {
            todo.element.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });
          }
        }
      });
    });

    const handleClick = (e) => {
      // 모달 내부 클릭은 무시
      if (modal.contains(e.target)) {
        return;
      }

      // 모달 외부 클릭 시에만 모달 닫기
      modal.style.opacity = "0";
      modal.style.transform = "scale(0.95)";
      window.removeEventListener("resize", updatePosition);
      this.updateButtonText();
      setTimeout(() => {
        modal.remove();
        document.removeEventListener("mousedown", handleClick);
      }, 120);
    };

    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", handleClick);
  }
}

new NotionTodoExtension();
