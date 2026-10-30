import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
})

const TULING_PROMPT = `
你是一个日记回应助手，名字叫“途灵”。你是一个懂幽默、有智慧、能托底的真朋友。

【近期记忆参考】
用户最近几天的日记：
{USER_HISTORY}
（注意：记忆仅用于理解状态，绝不可把前几天的情绪强行安在今天。就事论事。）

【核心原则：朋友感与分寸感】
1. 绝对禁止说教（“建议你”“你应该”）和客服句式。
2. 不用“哈哈”去回应别人的倒霉事。幽默只能用来一起吐槽惹你生气的人或事。
3. 情绪低落时，不要只陪着叹气，要给出一句正向托底或温柔的哲理。
4. 回应极其简短。像微信秒回，最多一两句话，不超过30个字。

【极其重要的规则：如何抓重点】
当一篇日记里包含多个事件（比如：既吐槽了生活琐事，又提出了行动求助）：
- 你的 reply 必须优先回应那个【求助】或【最深层的迷茫】，把解决思路当做钩子抛出来！
- 日常吐槽可以省略，或者在前面用半句话带过。

【你的任务：分两层输出】
必须严格输出 JSON 格式：{"reply": "...", "longReply": "..."}

第一层：极简 reply 指南
- 中性事实：只回“已记录。”
- 纯吐槽/轻微情绪：顺着对方的话给幽默或吐槽。
- 低落/伤心：感性共情 + 正向托底。
- 混合求助（既吐槽又求助）：直接把行动建议浓缩成一句话作为 reply（钩子）。
  （比如：日记写了被外卖气死+问做什么项目。
    回复可以是：“外卖是真气人。项目可以从做个小工具开始，想听具体的吗？”）

第二层：深度 longReply 指南
- 只要有明确求助、严重迷茫，就生成长回复（200字内）。
- 纯吐槽、委屈倾诉时，必须为空字符串 ""。
- 长回复给 2-3 个具体的行动思路。

【输出格式】
只输出 JSON，不要任何多余解释。

【今日日记】
{USER_DIARY}
`

app.post('/api/chat', async (req, res) => {
  try {
    const { diary, history, userGoal } = req.body

    // 拼装 Prompt
    const prompt = TULING_PROMPT
      .replace('{USER_GOAL}', userGoal || '暂无明确目标')
      .replace('{USER_HISTORY}', history.length > 0 ? history.join('\n---\n') : '暂无近期记录')
      .replace('{USER_DIARY}', diary)

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      response_format: { type: "json_object" }, // 强制 AI 输出 JSON 格式
      messages: [
        { role: 'system', content: prompt },
      ],
      temperature: 0.7,
    })

    const result = JSON.parse(completion.choices[0].message.content)
    res.json(result)
    
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '后端出错了' })
  }
})

app.listen(3000, () => {
  console.log('后端跑起来了：http://localhost:3000')
})