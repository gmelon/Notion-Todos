document.addEventListener("DOMContentLoaded", function () {
  const CONTENTS = document.getElementsByClassName("contents")[0];
  CONTENTS.innerHTML = "";

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { message: "getHtml" },
      function (response) {
        if (response && response.inputs) {
          let inputs = response.inputs;

          let count = 0;
          for (input of inputs) {
            CONTENTS.innerHTML += `
                        <div class="content">
                            <input id="checkbox${count}" type="checkbox"> <label for="checkbox${count}">${input}</label>
                        </div>
                    `;
            count++;
          }
        } else {
          CONTENTS.innerHTML = "Notion 페이지에서만 사용 가능합니다.";
        }
      }
    );
  });
});
