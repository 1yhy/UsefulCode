;(function () {
  const vscode = acquireVsCodeApi()
  const chatMessagesElement = document.getElementById('chatMessages')
  const messageInput = document.getElementById('messageInput')
  const sendButton = document.getElementById('sendButton')
  const positionBox = document.getElementById('position')

  // 添加prompt提示
  const ul = document.createElement('ul')
  prompts.forEach((item) => {
    const li = document.createElement('li')
    li.textContent = item.act
    li.addEventListener('click',() => {
      textarea.value = item.prompt
      positionBox.style.display = 'none'
    })
    ul.appendChild(li)
  })
  positionBox.appendChild(ul)


  function appendMessage(message, isUser) {
    const messageElement = document.createElement('div')
    messageElement.classList.add('message')
    messageElement.classList.add(isUser ? 'user-message' : 'bot-message')

    // 时间
    const timeSpan = document.createElement('span')
    timeSpan.classList.add('time')
    const date = new Date()
    timeSpan.innerText = date.getFullYear() + '-' + Number(date.getMonth()) + 1 + '-' + date.getDate() + '  ' + date.toLocaleTimeString()
    messageElement.appendChild(timeSpan)

    // 内容
    const content = document.createElement('div')
    content.classList.add('content')
    content.innerText = message
    // 复制按钮
    const copy = document.createElement('span')
    copy.classList.add('copy')
    copy.innerText = '复制'
    copy.addEventListener('click',() => {
      navigator.clipboard.writeText(message)
      vscode.window.showInformationMessage('复制成功')
    })
    content.addEventListener('mouseenter',() => {
      copy.style.display = 'block'
    })
    content.addEventListener('mouseleave',() => {
      copy.style.display = 'none'
    })
    messageElement.appendChild(content)


    
    content.appendChild(copy)

    chatMessagesElement.appendChild(messageElement)
  }

  function sendMessage() {
    const message = messageInput.value
    console.log(message)
    if (message.trim() === '') {
      return
    }

    appendMessage(message, true)
    messageInput.value = ''

    // 发送消息给插件
    vscode.postMessage({ type: 'message', value: message })
  }
  sendButton.addEventListener('click', sendMessage)
  messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      sendMessage()
    }
  })

  const textarea = document.querySelector('.messageInput')
  // 监听textarea的输入
  textarea.addEventListener('input',(event) => {
    if(textarea.value === '/') {
      positionBox.style.display = 'block'
    }else {
      positionBox.style.display = 'none'
    }
  })

  // 接收插件发送的消息
  window.addEventListener('message', (event) => {
    const message = event.data
    if (message.type === 'response') {
      appendMessage(message.value, false)
    }

    if (message.type === 'askQuestion') {
      appendMessage(message.value, true)
      // 发送消息给插件
      vscode.postMessage(message)
    }
  })
})()
