const formulas = [
  {
    name: '心形参数方程',
    expression: 'x = 16sin³t, y = 13cos t - 5cos2t - 2cos3t - cos4t',
  },
  {
    name: '笛卡尔心形线',
    expression: '(x² + y² - 1)³ = x²y³',
  },
  {
    name: '极坐标玫瑰',
    expression: 'r = 1 - sinθ',
  },
]

export default function ValentineMobile() {
  return (
    <main className="min-h-screen bg-[#0a050f] text-white px-5 py-8 flex items-center justify-center">
      <section className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">♡</div>
          <h1 className="text-3xl font-bold mb-3">数学里的浪漫曲线</h1>
          <p className="text-sm leading-6 text-pink-100/75">
            用函数、参数和坐标系，把一句喜欢你画成可以探索的形状。
          </p>
        </div>

        <div className="space-y-3">
          {formulas.map((formula) => (
            <article
              key={formula.name}
              className="border border-pink-300/20 bg-white/8 px-4 py-4 backdrop-blur"
            >
              <h2 className="text-base font-semibold text-pink-100 mb-2">{formula.name}</h2>
              <p className="font-mono text-xs leading-5 text-pink-50/80 break-words">
                {formula.expression}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
