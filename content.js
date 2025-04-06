class NotionTodoExtension {
  constructor() {
    this.init();
  }

  init() {
    this.injectStyles();
    this.waitForHeader().then(() => {
      this.createButton();
    });
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
        margin: 0 2px;
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
    button.textContent = "할 일 목록";
    button.className = "notion-todo-ext-button";

    const header = document.querySelector(".notion-topbar-share-menu");
    if (header) {
      header.parentElement.insertBefore(button, header);
      button.addEventListener("click", () => this.showModal());
    }
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
    modal.innerHTML = `
      <div class="notion-todo-ext-modal-header">
        할 일 목록
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
            <input type="checkbox" ${todo.checked ? "checked" : ""} disabled>
            <span>${todo.text}</span>
          </div>
        `
                )
                .join("")
            : '<div class="notion-todo-ext-empty">할 일이 없습니다</div>'
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
      item.style.cursor = "pointer";
      item.addEventListener("click", () => {
        const index = parseInt(item.dataset.index);
        const todo = todos[index];
        if (todo && todo.element) {
          todo.element.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
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
