import { useState, useEffect } from 'react'

function App() {
  const [diary, setDiary] = useState('')
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem('tuling_entries')
    return saved ? JSON.parse(saved) : []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null) // 记录哪条日记展开了长回复

  // 存本地
  useEffect(() => {
    localStorage.setItem('tuling_entries', JSON.stringify(entries))
  }, [entries])

  const handleSave = async () => {
    if (diary.trim() === '') return

    const newEntry = { id: Date.now(), text: diary, reply: '', longReply: '' }
    setEntries([newEntry, ...entries])
    setDiary('')
    setIsLoading(true)

    try {
      // 提取最近7天的日记作为记忆 (不包含刚刚存的这一条)
      const recentHistory = entries.slice(0, 7).map(e => e.text)
      
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          diary: newEntry.text,
          history: recentHistory,
          // 这里可以加入你的个人目标，例如：
          userGoal: "我希望在人格上变得外向，成为优秀的软件开发人员。"
        }),
      })
      const data = await response.json()

      setEntries((prev) =>
        prev.map((item) =>
          item.id === newEntry.id 
            ? { ...item, reply: data.reply, longReply: data.longReply } 
            : item
        )
      )
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-gray-800 font-sans py-10 px-4">
      <div className="max-w-2xl mx-auto">
        
        <header className="text-center mb-10">
          <h1 className="text-3xl font-serif text-gray-700 tracking-widest">途灵日记</h1>
          <p className="text-sm text-gray-400 mt-2">记录思考，指引前路</p>
        </header>

        {/* 输入区 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
          <textarea
            value={diary}
            onChange={(e) => setDiary(e.target.value)}
            placeholder="今天发生了什么？有什么思考..."
            className="w-full h-32 p-0 bg-transparent border-none resize-none focus:outline-none text-lg leading-relaxed placeholder-gray-300"
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`px-6 py-2 rounded-full text-white text-sm transition-colors ${
                isLoading ? 'bg-gray-300' : 'bg-gray-800 hover:bg-black'
              }`}
            >
              {isLoading ? '途灵思考中...' : '记录'}
            </button>
          </div>
        </div>

        {/* 日记列表 */}
        <div className="space-y-6">
          {entries.length === 0 ? (
            <p className="text-center text-gray-400 text-sm mt-10">这里空空如也</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group">
                {/* 日记正文 */}
                <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {entry.text}
                </p>
                <div className="text-xs text-gray-400 mt-4 border-b border-gray-50 pb-4">
                  {new Date(entry.id).toLocaleDateString()}
                </div>

                {/* 途灵的批注 */}
                {entry.reply && (
                  <div className="mt-4">
                    <p className="text-gray-600 italic">
                      <span className="font-bold text-gray-800 not-italic">途灵：</span> 
                      {entry.reply}
                    </p>
                    
                    {/* 如果有长回复，显示查看按钮 */}
                    {entry.longReply && (
                      <button 
                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        className="mt-2 text-sm text-blue-500 hover:text-blue-700 underline"
                      >
                        {expandedId === entry.id ? '收起' : '你想深入了解一下吗？'}
                      </button>
                    )}

                    {/* 展开的长回复 */}
                    {expandedId === entry.id && entry.longReply && (
                      <div className="mt-3 p-4 bg-gray-50 rounded-xl text-gray-700 text-sm leading-relaxed border-l-2 border-gray-300">
                        {entry.longReply}
                      </div>
                    )}
                  </div>
                )}

                {/* 删除按钮 */}
                <button
                  onClick={() => setEntries((prev) => prev.filter((e) => e.id !== entry.id))}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  删除
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default App