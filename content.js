// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   if (request.message === "getHtml") {
//     let inputs = [];

//     for (checkbox of document.getElementsByTagName("div")) {
//       if (
//         checkbox.classList.contains("notion-to_do-block") &&
//         checkbox.innerText.trim().length > 0
//       ) {
//         inputs.push(checkbox.innerText);
//       }
//     }

//     sendResponse({ inputs: inputs });
//   }
// });

function modifyHeader() {
  const headerContainer = document.getElementsByClassName(
    "notion-topbar-action-buttons"
  )[0];

  if (headerContainer) {
    const headerDivs = headerContainer.querySelectorAll("div");

    if (headerDivs.length > 1) {
      const header = headerDivs[1];
      // 중복 추가를 방지하기 위해 ID로 확인
      if (!document.getElementById("notion-todo")) {
        const todoDiv = document.createElement("div");
        todoDiv.textContent = "할 일";
        todoDiv.style =
          "user-select: none; transition: background 20ms ease-in 0s; cursor: pointer; display: inline-flex; align-items: center; flex-shrink: 0; white-space: nowrap; height: 28px; border-radius: 4px; font-size: 14px; line-height: 1.2; min-width: 0px; padding-left: 8px; padding-right: 8px; color: rgb(55, 53, 47); margin-right: 2px; margin-left: 6px;";
        todoDiv.id = "notion-todo"; // ID 부여
        todoDiv.addEventListener("click", showModal); // 버튼 클릭 시 모달 표시
        header.parentNode.insertBefore(todoDiv, header);
        return true;
      } else {
        return true;
      }
    }
  }
  return false;
}

function showModal(event) {
  if (!document.getElementById("custom-modal")) {
    const button = event.target;
    const buttonRect = button.getBoundingClientRect();

    const modalOverlay = document.createElement("div");
    modalOverlay.id = "custom-modal-overlay";
    modalOverlay.style.position = "fixed";
    modalOverlay.style.top = 0;
    modalOverlay.style.left = 0;
    modalOverlay.style.width = "100%";
    modalOverlay.style.height = "100%";
    modalOverlay.style.display = "flex";
    modalOverlay.style.justifyContent = "center";
    modalOverlay.style.alignItems = "center";
    modalOverlay.style.zIndex = 9999; // 맨 앞으로 표시되도록 설정
    modalOverlay.style.opacity = 0;
    modalOverlay.style.transition = "opacity 0.3s";

    const modal = document.createElement("div");
    modal.id = "custom-modal";
    modal.style.width = "500px";
    modal.style.height = "300px";
    modal.style.overflowY = "auto"; // 세로 스크롤 추가
    modal.style.backgroundColor = "#fff";
    modal.style.borderRadius = "6px";
    modal.style.padding = "0px";
    modal.style.boxShadow =
      "rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px";
    modal.style.transition = "opacity 0.3s";
    modal.style.opacity = 0;
    modal.style.position = "absolute";
    modal.style.top = `${buttonRect.bottom + window.scrollY}px`; // 버튼의 바로 아래로 위치
    modal.style.left = `${buttonRect.left + window.scrollX}px`; // 버튼의 왼쪽 위치에 맞춤

    // 모달이 페이지의 오른쪽 끝을 벗어나는지 확인하고 조정
    const pageWidth = document.documentElement.clientWidth;
    const modalRightEdge = buttonRect.left + window.scrollX + 500; // 모달의 오른쪽 경계

    if (modalRightEdge > pageWidth) {
      modal.style.left = `${pageWidth - 500 - 20}px`; // 오른쪽 끝에서 20px 떨어지도록 조정
    }

    // 모달 내용
    modal.innerHTML = `
    <div
  style="
    overflow: auto visible;
    display: flex;
    width: 100%;
    position: relative;
    box-shadow: rgba(55, 53, 47, 0.09) 0px -1px 0px inset;
    font-size: 14px;
    padding-left: 8px;
    padding-right: 8px;
    z-index: 1;
    margin-bottom: 14px;
  "
>
  <div
    style="
      padding-top: 8px;
      padding-bottom: 8px;
      white-space: nowrap;
      min-width: 0px;
      flex-shrink: 0;
      color: rgb(55, 53, 47);
      position: relative;
      font-weight: 500;
    "
  >
    <div
      style="
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
        white-space: nowrap;
        height: 28px;
        border-radius: 4px;
        font-size: 14px;
        line-height: 1.2;
        min-width: 0px;
        padding-left: 8px;
        padding-right: 8px;
        color: inherit;
      "
    >
      이 페이지의 할 일들
    </div>
  </div>
</div>      
    `;

    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);

    setTimeout(() => {
      modalOverlay.style.opacity = 1;
      modal.style.opacity = 1;
    }, 10);

    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }
}

function closeModal() {
  const modalOverlay = document.getElementById("custom-modal-overlay");
  if (modalOverlay) {
    modalOverlay.style.opacity = 0;
    setTimeout(() => {
      if (modalOverlay) {
        document.body.removeChild(modalOverlay);
      }
    }, 300); // fade-out 시간과 동일하게 설정
  }
}

window.onload = function () {
  if (!modifyHeader()) {
    // MutationObserver를 사용하여 DOM 변경 사항을 감지합니다.
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (modifyHeader()) {
          observer.disconnect();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
};
