// TodoListRenderer 모듈
const TodoListRenderer = (() => {
  const render = (items, parentElement) => {
    parentElement.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.style.marginLeft = `${item.level * 20}px`;
      li.setAttribute("data-todo-id", item.id);

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.isChecked;
      checkbox.addEventListener("change", () => {
        chrome.runtime.sendMessage({
          action: "updateTodoItem",
          id: item.id,
          isChecked: checkbox.checked,
        });
      });

      const span = document.createElement("span");
      span.textContent = item.content;

      li.appendChild(checkbox);
      li.appendChild(span);
      parentElement.appendChild(li);
    });
  };

  return { render };
})();

// 초기화
document.addEventListener("DOMContentLoaded", () => {
  const todoList = document.getElementById("todoList");

  // 먼저 저장된 할 일 목록을 가져옵니다.
  chrome.storage.local.get(["todoItems"], (result) => {
    if (result.todoItems && result.todoItems.length > 0) {
      TodoListRenderer.render(result.todoItems, todoList);
    } else {
      todoList.textContent = "할 일 항목을 불러오는 중...";

      // 저장된 항목이 없으면 content script에 요청합니다.
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "getTodoItems" },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                todoList.textContent = "할 일 항목을 불러올 수 없습니다.";
              } else if (
                response &&
                response.todoItems &&
                response.todoItems.length > 0
              ) {
                TodoListRenderer.render(response.todoItems, todoList);
              } else {
                todoList.textContent = "할 일 항목이 없습니다.";
              }
            }
          );
        } else {
          todoList.textContent = "Notion 페이지를 열어주세요.";
        }
      });
    }
  });
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "todoItemsUpdated") {
    const todoList = document.getElementById("todoList");
    TodoListRenderer.render(request.todoItems, todoList);
  }
});
