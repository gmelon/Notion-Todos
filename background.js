let todoItems = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "updateTodoItems":
      todoItems = request.todoItems;
      chrome.storage.local.set({ todoItems: todoItems });
      broadcastMessage({
        action: "todoItemsUpdated",
        todoItems: todoItems,
      });
      break;
    case "getTodoItems":
      sendResponse({ todoItems: todoItems });
      break;
    case "updateTodoItem":
      const updatedItem = todoItems.find((item) => item.id === request.id);
      if (updatedItem) {
        updatedItem.isChecked = request.isChecked;
        chrome.storage.local.set({ todoItems: todoItems });
        broadcastMessage({
          action: "updateNotionCheckbox",
          id: request.id,
          isChecked: request.isChecked,
        });
        broadcastMessage({
          action: "todoItemsUpdated",
          todoItems: todoItems,
        });
      }
      break;
  }
  return true;
});

function broadcastMessage(message) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, message).catch((error) => {
        console.log(`Error sending message to tab ${tab.id}:`, error);
      });
    });
  });

  chrome.runtime.sendMessage(message).catch((error) => {
    console.log("Error sending message to popup:", error);
  });
}

chrome.storage.local.get(["todoItems"], (result) => {
  if (result.todoItems) {
    todoItems = result.todoItems;
  }
});
