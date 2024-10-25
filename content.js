// TodoManager 모듈
const TodoManager = (() => {
  const todoItemMap = new WeakMap();
  let idCounter = 0;

  const extractTodoItems = () => {
    const todoItems = [];
    const topLevelTodos = document.querySelectorAll(
      ".notion-page-content > .notion-selectable.notion-to_do-block"
    );

    const extractTodoItem = (element, level = 0) => {
      const checkbox = element.querySelector('input[type="checkbox"]');
      const contentElement = element.querySelector(
        '[data-content-editable-leaf="true"]'
      );

      if (contentElement) {
        const content = contentElement.textContent.trim();
        const isChecked = checkbox ? checkbox.checked : false;
        const id = `todo-${idCounter++}`;

        todoItemMap.set(element, id);

        todoItems.push({ id, content, level, isChecked });
      }

      const childTodos = element.querySelectorAll(
        ":scope > div > div > .notion-selectable.notion-to_do-block"
      );
      childTodos.forEach((childTodo) => extractTodoItem(childTodo, level + 1));
    };

    topLevelTodos.forEach((todo) => extractTodoItem(todo));
    return todoItems;
  };

  const updateNotionCheckbox = (id, isChecked) => {
    return new Promise((resolve, reject) => {
      const todoBlocks = document.querySelectorAll(
        ".notion-selectable.notion-to_do-block"
      );
      for (const block of todoBlocks) {
        if (todoItemMap.get(block) === id) {
          const checkbox = block.querySelector('input[type="checkbox"]');
          if (checkbox && checkbox.checked !== isChecked) {
            checkbox.click();
            // 클릭 이벤트가 처리될 시간을 주기 위해 setTimeout 사용
            setTimeout(() => {
              resolve(true);
            }, 100);
            return;
          }
        }
      }
      resolve(false);
    });
  };

  return { extractTodoItems, updateNotionCheckbox };
})();

// sendTodoItems 함수를 비동기로 수정
async function sendTodoItems() {
  const todoItems = TodoManager.extractTodoItems();
  await chrome.runtime.sendMessage({
    action: "updateTodoItems",
    todoItems: todoItems,
  });
}

// 상단 바에 '할 일 목록' 버튼 추가
function addTodoListButton() {
  const topbarActionButtons = document.querySelector(
    ".notion-topbar-action-buttons"
  );
  if (
    topbarActionButtons &&
    !document.querySelector(".notion-topbar-todo-list-button")
  ) {
    const todoListButton = document.createElement("div");
    todoListButton.className = "notion-topbar-todo-list-button";
    todoListButton.textContent = "할 일 목록";
    todoListButton.style.cssText = `
      user-select: none;
      transition: background 20ms ease-in;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
      white-space: nowrap;
      height: 28px;
      border-radius: 6px;
      font-size: 14px;
      line-height: 1.2;
      min-width: 0px;
      padding-left: 8px;
      padding-right: 8px;
      color: rgb(55, 53, 47);
      margin-right: 8px;
    `;
    todoListButton.addEventListener("click", toggleTodoListPopup);
    topbarActionButtons.insertBefore(
      todoListButton,
      topbarActionButtons.firstChild
    );
    console.log("할 일 목록 버튼이 추가되었습니다.");
  }
}

// 팝업 토글 함수
function toggleTodoListPopup() {
  let popup = document.getElementById("todo-list-popup");
  if (popup) {
    popup.style.display = popup.style.display === "none" ? "block" : "none";
  } else {
    createTodoListPopup();
  }
}

// 팝업 생성 함수
function createTodoListPopup() {
  const popup = document.createElement("div");
  popup.id = "todo-list-popup";
  popup.style.cssText = `
    position: absolute;
    top: 45px;
    left: 0;
    background-color: white;
    border: 1px solid rgba(55, 53, 47, 0.16);
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    padding: 12px;
    z-index: 9999;
    max-height: 80vh;
    overflow-y: auto;
    min-width: 250px;
  `;

  const todoList = document.createElement("ul");
  todoList.id = "todoList";
  todoList.style.cssText = `
    list-style-type: none;
    padding: 0;
    margin: 0;
  `;
  popup.appendChild(todoList);

  const button = document.querySelector(".notion-topbar-todo-list-button");
  button.parentNode.insertBefore(popup, button.nextSibling);
  renderTodoItems(TodoManager.extractTodoItems(), todoList);
}

// renderTodoItems 함수 수정
function renderTodoItems(items, parentElement) {
  parentElement.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.style.cssText = `
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      padding-left: ${item.level * 20}px;
    `;
    li.setAttribute("data-todo-id", item.id);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.isChecked;
    checkbox.style.marginRight = "8px";
    checkbox.addEventListener("change", () => {
      TodoManager.updateNotionCheckbox(item.id, checkbox.checked);
      chrome.runtime.sendMessage({
        action: "updateTodoItem",
        id: item.id,
        isChecked: checkbox.checked,
      });
    });

    const span = document.createElement("span");
    span.textContent = item.content;
    span.style.wordBreak = "break-word";

    li.appendChild(checkbox);
    li.appendChild(span);
    parentElement.appendChild(li);
  });
}

// 초기화 및 이벤트 설정
async function initialize() {
  await sendTodoItems();
  addTodoListButton();

  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node.classList.contains("notion-topbar") ||
              node.querySelector(".notion-topbar-action-buttons"))
          ) {
            addTodoListButton();
            break;
          }
        }
      }
    }
    await sendTodoItems();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
  });
}

// 기존 메시지 리스너를 제거하고 새로운 리스너로 교체합니다.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateNotionCheckbox") {
    TodoManager.updateNotionCheckbox(request.id, request.isChecked)
      .then((success) => {
        sendResponse({ success: success });
      })
      .catch((error) => {
        console.error("Error updating checkbox:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 비동기 응답을 위해 true를 반환
  } else if (request.action === "todoItemsUpdated") {
    const todoList = document.getElementById("todoList");
    if (todoList) {
      renderTodoItems(request.todoItems, todoList);
    }
    sendResponse({ success: true });
    return true; // 비동기 응답을 위해 true를 반환
  }
});

// 페이지 로드 완료 시 실행
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  initialize();
} else {
  document.addEventListener("DOMContentLoaded", initialize);
}

// 페이지 완전 로드 후 한 번 더 버튼 추가 시도
window.addEventListener("load", () => {
  addTodoListButton();
});

// 콘텐츠 스크립트가 로드되었음을 알리는 메시지 전송
chrome.runtime.sendMessage({ action: "contentScriptLoaded" });

// 주기적으로 버튼 추가 시도
setInterval(addTodoListButton, 2000);
