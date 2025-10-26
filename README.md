# !! PRODUCT OF AI
It is result of ChatGPT. I dont really care, as long as it does it job good enough

# What is this
Telegram does not support getting updates from the start of a chatgroup for any bot. So if you want to get previous chats, I dont think they provide that

This little script would help you get those previous messages

**returns** : JSON

## Minus
- I focus on text messages. it strips anchor from the hashtag, remove time and clearfix element
- no formatting for monospace or codeblock
- links uncleaned

Extend it as you need. We heve AI now

# How to use

- open telegram on the browser -> web.telegram.org
- open console `F12` -> console Tab
- copy the content of `get.js`
- paste to console, do not close
- it will print: ✅ chats initialized and sorted. Count: xx
- Manually scroll up until the start of group chat or any length you desire. The console tab will update with updated counts
- on console tab, type `exportChats()`, this will download the result as json

That's it folks! Happy hacking
