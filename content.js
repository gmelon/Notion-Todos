chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.message === 'getHtml') {
        let inputs = [];

        for(checkbox of document.getElementsByTagName("div")) {
            if (checkbox.classList.contains("notion-to_do-block") && checkbox.innerText.trim().length > 0) {
                inputs.push(checkbox.innerText);
            }
        }

        sendResponse({inputs: inputs});
    }
});
